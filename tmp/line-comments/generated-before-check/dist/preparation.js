import { buildFieldPlan } from './domain.js';
import { createEnvironmentTools } from './environment.js';
import { createModel, extractOrder } from './extraction.js';
import { prepareOrderWithAgent } from './agent.js';
import { createBrowserSession } from './browser/session.js';
import { AppError, publicError } from './errors.js';
import { createPausableTimeout } from './pausable-timeout.js';
/** Stop waiting for a model transport that does not promptly honor cancellation.
 * The session revokes and drains browser actions before allowing human writes.
 */
async function untilAborted(work, signal) {
    let onAbort;
    const aborted = new Promise((_resolve, reject) => {
        onAbort = () => reject(new DOMException('Preparation stopped.', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted)
            onAbort();
    });
    try {
        return await Promise.race([work, aborted]);
    }
    finally {
        signal.removeEventListener('abort', onAbort);
    }
}
/** Retain this job's browser and active slot through incomplete human review. */
export async function runPreparation(payload, options) {
    const sendStatus = (status, message, warnings) => options.onStatus({ type: 'status', status, message, warnings });
    const environment = createEnvironmentTools(payload.input);
    let session;
    let handedOff = false;
    let closedByUser = false;
    let warnings = [];
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, options.signal]);
    const timeout = createPausableTimeout(() => controller.abort(), 10 * 60 * 1000);
    try {
        sendStatus('extracting', 'Reading the URLA and checking the loan requirements.');
        await environment.initialize();
        signal.throwIfAborted();
        const model = createModel(await environment.retrieve('api_key'), payload.input.model, payload.input.provider);
        const extracted = await untilAborted(extractOrder(payload, model, signal), signal);
        const result = buildFieldPlan(extracted, payload.input, Boolean(payload.salesContract));
        const plan = result.plan;
        warnings = result.warnings;
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
        signal.throwIfAborted();
        sendStatus('preparing', 'Opening R3 and preparing the new order for your review.');
        session = await createBrowserSession({ onStatus: (status, message) => {
                if (status === 'awaiting_login')
                    timeout.pause();
                if (status === 'browser_closed') {
                    closedByUser = true;
                    if (!handedOff)
                        controller.abort();
                }
                if (status !== 'awaiting_review')
                    sendStatus(status, message, warnings);
            } });
        await session.waitForUserLogin({ signal });
        timeout.resume();
        signal.throwIfAborted();
        sendStatus('preparing', 'You are signed in. Preparing the new R3 order for your review.');
        await session.navigateToOrder();
        signal.throwIfAborted();
        session.setFieldPlan(plan);
        const initial = await untilAborted(session.fillApprovedPlan(), signal);
        signal.throwIfAborted();
        if (plan.some(field => !initial.report.some(item => item.fieldKey === field.key && item.verified))) {
            await untilAborted(prepareOrderWithAgent({ model, provider: payload.input.provider, environment, session, plan, signal }), signal);
        }
        signal.throwIfAborted();
        const report = await session.getFieldReport();
        const incomplete = plan.filter(field => !report.some(item => item.fieldKey === field.key && item.verified));
        warnings = [...warnings, ...incomplete.map(field => `Review incomplete field: ${field.key}.`)];
        if (incomplete.length || result.missingRequiredFields.length) {
            throw new AppError('INCOMPLETE_FIELDS', 'Some information is missing or could not be populated and verified. Complete it during review.');
        }
        await session.handoff();
        if (closedByUser)
            return;
        handedOff = true;
        timeout.clear();
        environment.clear();
        sendStatus('awaiting_review', 'Preparation is complete. Review and submit the order yourself in the R3 browser. The browser stays open until you close it.', warnings);
        await session.waitUntilClosed();
    }
    catch (error) {
        timeout.clear();
        controller.abort();
        environment.clear();
        const safe = publicError(error, payload.input.provider);
        if (closedByUser) {
            sendStatus('browser_closed', 'You closed the R3 browser. No automatic order submission was performed.');
        }
        else if (session) {
            // A missing field, model failure, or time limit must not discard the user's form.
            let released = false;
            try {
                released = await session.handoffIncomplete();
            }
            catch { /* Keep the browser visible even if R3 is unavailable. */ }
            if (!closedByUser) {
                handedOff = released;
                const message = released
                    ? 'Automatic preparation stopped before completion. Finish and review the form in the R3 browser, then submit it yourself. The browser stays open until you close it.'
                    : 'Automatic preparation stopped before the R3 form could be released for submission. The browser stays open, but the order has not been prepared or verified. Check the portal and close the browser when finished.';
                sendStatus('awaiting_review', message, [...warnings, safe.message, 'Some fields may be missing or unverified. Check Loan Program, Property Type, product, and all other fields. No automatic submission was performed.']);
                await session.waitUntilClosed();
            }
        }
        else {
            sendStatus('failed', `${safe.message} No automatic order submission was performed.`);
        }
    }
    finally {
        timeout.clear();
        controller.abort();
        environment.clear();
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
    }
}
//# sourceMappingURL=preparation.js.map