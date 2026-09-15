// [L2] Imports buildFieldPlan from ./domain.js for shared validated application data, business rules, defaults, and domain types.
// TODO: Not sure if it's necessary to separate the import of buildFieldPlan from the type imports.
import { buildFieldPlan } from './domain.js';
// [L3] Imports createEnvironmentTools from ./environment.js for isolated per-job environment storage and tools.
import { createEnvironmentTools } from './environment.js';
// [L4] Imports createModel, extractOrder from ./extraction.js for provider model construction and document extraction abstractions.
import { createModel, extractOrder } from './extraction.js';
// [L5] Imports prepareOrderWithAgent from ./agent.js for the bounded approved-plan verification and repair agent.
import { prepareOrderWithAgent } from './agent.js';
// [L6] Imports createBrowserSession from ./browser/session.js for the restricted R3 browser session and approved browser actions.
import { createBrowserSession } from './browser/session.js';
// [L7] Imports AppError, publicError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError, publicError } from './errors.js';
// [L8] Imports createPausableTimeout from ./pausable-timeout.js for active-time budgets that pause during manual login.
import { createPausableTimeout } from './pausable-timeout.js';
// [L9] Blank line separating the surrounding declarations, statements, or document blocks.
// [L10] Existing explanatory comment: Stop waiting for a model transport that does not promptly honor cancellation.
// [L11] Existing explanatory comment: The session revokes and drains browser actions before allowing human writes.
// [L12] Ends the existing documentation comment describing the cancellation-aware wait helper.
/** Stop waiting for a model transport that does not promptly honor cancellation.
 * The session revokes and drains browser actions before allowing human writes.
 */
// [L13] Defines a generic helper that stops waiting for asynchronous work when the supplied signal aborts.
async function untilAborted(work, signal) {
    // [L14] Declares the abort callback reference for later removal from the signal.
    let onAbort;
    // [L15] Creates a promise that can only reject when cancellation occurs.
    const aborted = new Promise((_resolve, reject) => {
        // [L16] Defines cancellation rejection as a standard AbortError DOMException.
        onAbort = () => reject(new DOMException('Preparation stopped.', 'AbortError'));
        // [L17] Registers the rejection callback once on signal abort.
        signal.addEventListener('abort', onAbort, { once: true });
        // [L18] Immediately rejects if the signal was already aborted before listener registration completed.
        if (signal.aborted)
            onAbort();
        // [L19] Closes the scope or expression introduced here: Creates a promise that can only reject when cancellation occurs.
    });
    // [L20] Returns whichever settles first: the original work promise or the cancellation rejection.
    try {
        return await Promise.race([work, aborted]);
    }
    // [L21] Always removes the abort listener once the race settles.
    finally {
        signal.removeEventListener('abort', onAbort);
    }
    // [L22] Closes the scope or expression introduced here: Defines a generic helper that stops waiting for asynchronous work when the supplied signal aborts.
}
// [L23] Blank line separating the surrounding declarations, statements, or document blocks.
// [L24] Existing explanatory comment: Retain this job's browser and active slot through incomplete human review.
/** Prepare one order; the worker may retain its browser after all job cleanup completes. */
// [L25] Exports the complete preparation lifecycle and begins declaring its required options object.
export async function runPreparation(payload, options) {
    // [L29] Defines a compact typed status sender including optional warning strings.
    const onStatus = options.onStatus;
    const sendStatus = (status, message, warnings) => onStatus({ type: 'status', status, message, warnings });
    // [L30] Captures the job's private inputs in its isolated environment tool helper.
    const environment = createEnvironmentTools(payload.input);
    // [L31] Reserves an optional browser session reference for successful setup and failure handoff.
    let session;
    // [L32] Tracks whether automation has handed browser control to the user.
    let handedOff = false;
    // [L33] Tracks whether the user has closed the browser.
    let closedByUser = false;
    // [L34] Initializes warnings collected from extraction, field planning, and verification.
    let warnings = [];
    // [L35] Creates an internal controller for local timeout and browser-closure cancellation.
    const controller = new AbortController();
    // [L36] Combines internal cancellation with the caller's external signal.
    const signal = AbortSignal.any([controller.signal, options.signal]);
    // [L37] Starts a ten-minute active-processing timeout that aborts the internal controller.
    const timeout = createPausableTimeout(() => controller.abort(), 10 * 60 * 1000);
    // [L38] Begins preparation under failure handoff and guaranteed secret/document cleanup.
    try {
        // [L39] Reports that document extraction and loan-rule checks are starting.
        sendStatus('extracting', 'Reading the URLA and checking the loan requirements.');
        // [L40] Stores all submitted private settings through the environment helper.
        await environment.initialize();
        // [L41] Rejects work if cancellation occurred during environment initialization.
        signal.throwIfAborted();
        // [L42] Privately retrieves the API key and creates exactly the requested provider/model instance.
        const model = createModel(await environment.retrieve('api_key'), payload.input.model, payload.input.provider);
        // [L43] Extracts structured document facts while allowing the wait to end promptly on cancellation.
        const extracted = await untilAborted(extractOrder(payload, model, signal), signal);
        // [L44] Applies deterministic loan/business rules to the extracted facts, user choices, and contract-presence flag.
        const result = buildFieldPlan(extracted, payload.input, Boolean(payload.salesContract));
        // [L45] Retrieves the approved field plan from the deterministic planning result.
        const plan = result.plan;
        // [L46] Preserves planning warnings for later status and review messages.
        warnings = result.warnings;
        // [L47] Overwrites the uploaded URLA and optional contract buffers with zeros after extraction/planning.
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
        payload.input.apiKey = '';
        // [L48] Checks cancellation before opening the appraisal browser.
        signal.throwIfAborted();
        // [L49] Reports that R3 order preparation is starting.
        sendStatus('preparing', 'Opening R3 and preparing the new order for your review.');
        // [L50] Creates the browser session with a callback that integrates browser status into timeout and lifecycle handling.
        const browserOptions = { onStatus: (status, message) => {
                // [L51] Pauses the local preparation timeout while the user handles R3 sign-in.
                if (status === 'awaiting_login')
                    timeout.pause();
                // [L52] Starts handling explicit browser-closed status from the session.
                if (status === 'browser_closed') {
                    // [L53] Records that the browser was closed by the user.
                    closedByUser = true;
                    // [L54] Cancels automation on closure when manual handoff has not yet completed.
                    if (!handedOff)
                        controller.abort();
                    // [L55] Closes the scope or expression introduced here: Starts handling explicit browser-closed status from the session.
                }
                // [L56] Forwards browser statuses except awaiting_review, which the preparation lifecycle reports after its own handoff decisions.
                if (status !== 'awaiting_review')
                    sendStatus(status, message, warnings);
                // [L57] Closes the scope or expression introduced here: Creates the browser session with a callback that integrates browser status into timeout and lifecycle handling.
            } };
        if (options.previousSession && !options.previousSession.isClosed()) {
            try {
                session = await options.previousSession.startNextOrder(browserOptions);
            }
            catch (error) {
                signal.throwIfAborted();
                if (error instanceof AppError && error.code === 'BROWSER_REUSE_UNAVAILABLE') {
                    await options.previousSession.close();
                    signal.throwIfAborted();
                }
                // The previous review window may close while the next documents are being read.
                if (!options.previousSession.isClosed())
                    throw error;
                session = await createBrowserSession(browserOptions);
            }
        }
        else {
            session = await createBrowserSession(browserOptions);
        }
        // [L58] Waits for the user's completed R3 login, honoring automation cancellation.
        await session.waitForUserLogin({ signal });
        // [L59] Resumes the remaining local preparation time after sign-in.
        timeout.resume();
        // [L60] Rechecks cancellation before preparing the authenticated order page.
        signal.throwIfAborted();
        // [L61] Reports successful sign-in and the start of automated form preparation.
        sendStatus('preparing', 'You are signed in. Preparing the new R3 order for your review.');
        // [L62] Navigates the authenticated browser to the new-order page.
        await session.navigateToOrder();
        // [L63] Rechecks cancellation after navigation.
        signal.throwIfAborted();
        // [L64] Installs the immutable approved field plan into the session's restricted browser tools.
        session.setFieldPlan(plan);
        // [L65] Applies the approved plan deterministically, using a cancellation-aware wait.
        const initial = await untilAborted(session.fillApprovedPlan(), signal);
        // [L66] Rechecks cancellation after the initial deterministic filling pass.
        signal.throwIfAborted();
        // [L67] Tests whether any approved field lacks a verified entry in the initial fill report.
        if (plan.some(field => !initial.report.some(item => item.fieldKey === field.key && item.verified))) {
            // [L68] Invokes the bounded verification/repair agent only when initial approved-field verification remains incomplete.
            await untilAborted(prepareOrderWithAgent({ model, provider: payload.input.provider, environment, session, plan, signal }), signal);
            // [L69] Closes the scope or expression introduced here: Tests whether any approved field lacks a verified entry in the initial fill report.
        }
        // [L70] Rechecks cancellation before final verification.
        signal.throwIfAborted();
        // [L71] Retrieves the browser session's final per-field verification report.
        const report = await session.getFieldReport();
        // [L72] Selects every planned field that still lacks a matching verified report entry.
        const incomplete = plan.filter(field => !report.some(item => item.fieldKey === field.key && item.verified));
        // [L73] Appends a human-review warning for each incomplete field key.
        warnings = [...warnings, ...incomplete.map(field => `Review incomplete field: ${field.key}.`)];
        // [L74] Treats either unverified planned fields or missing required source fields as incomplete preparation.
        if (incomplete.length || result.missingRequiredFields.length) {
            // [L75] Throws a fixed incomplete-fields error so the preserved form enters the incomplete handoff path.
            throw new AppError('INCOMPLETE_FIELDS', 'Some information is missing or could not be populated and verified. Complete it during review.');
            // [L76] Closes the scope or expression introduced here: Treats either unverified planned fields or missing required source fields as incomplete preparation.
        }
        // [L77] Revokes automation and releases the successfully prepared form for human review/submission.
        await session.handoff();
        // [L78] Stops the success path if the user closed the browser during handoff.
        if (closedByUser)
            return;
        // [L79] Records that manual handoff completed.
        handedOff = true;
        // [L80] Clears the active-processing timeout before the user reviews the form.
        timeout.clear();
        // [L81] Removes job environment values before waiting for human review.
        environment.clear();
        // [L82] Reports completed preparation with warnings and directs the user to review and submit in the retained browser.
        sendStatus('awaiting_review', 'Preparation is complete. Review and submit the order yourself in the R3 browser. When finished, you can prepare another order from Appraisal Desk.', warnings);
        // [L83] Keeps the worker and active job occupied until the user closes the browser.
        if (!options.retainBrowser)
            await session.waitUntilClosed();
        // [L84] Begins failure handling while preserving any opened browser for review.
    }
    catch (error) {
        // [L85] Clears the timer, cancels remaining automation, and clears private environment settings before error handoff.
        timeout.clear();
        controller.abort();
        environment.clear();
        // [L86] Converts the failure to a fixed public message for the selected provider.
        const safe = publicError(error, payload.input.provider);
        // [L87] Uses a browser-closed outcome when the user has already closed the session.
        if (closedByUser) {
            // [L88] Reports manual browser closure and confirms automation did not submit the order.
            sendStatus('browser_closed', 'You closed the R3 browser. No automatic order submission was performed.');
            // [L89] Uses incomplete manual handoff when a browser session exists and remains available.
        }
        else if (session) {
            // [L90] Existing explanatory comment: A missing field, model failure, or time limit must not discard the user's form.
            // A missing field, model failure, or time limit must not discard the user's form.
            // [L91] Tracks whether the session successfully releases the incomplete form for human submission.
            let released = false;
            // [L92] Attempts incomplete handoff and suppresses its failure so the browser remains available even if the portal cannot be released normally.
            try {
                released = await session.handoffIncomplete();
            }
            catch { /* Keep the browser visible even if R3 is unavailable. */ }
            // [L93] Continues review handoff only if the user has not closed the browser during cleanup.
            if (!closedByUser) {
                // [L94] Records whether automation controls were successfully released to the user.
                handedOff = released;
                // [L95] Chooses the review message based on whether incomplete form handoff succeeded.
                const message = released
                    // [L96] Uses guidance to finish, review, and manually submit the retained form after successful incomplete release.
                    ? 'Automatic preparation stopped before completion. Finish and review the form in the R3 browser, then submit it yourself. When finished, you can prepare another order from Appraisal Desk.'
                    // [L97] Uses guidance explaining that the retained browser's form could not be released or verified when incomplete handoff failed.
                    : 'Automatic preparation stopped before the R3 form could be released for submission. The browser stays open, but the order has not been prepared or verified. Check the portal and close the browser when finished.';
                // [L98] Reports awaiting_review with accumulated warnings, the safe failure message, and an explicit reminder to verify missing/unverified fields.
                sendStatus('awaiting_review', message, [...warnings, safe.message, 'Some fields may be missing or unverified. Check Loan Program, Property Type, product, and all other fields. No automatic submission was performed.']);
                // [L99] Retains the worker/browser slot until the user closes the session.
                if (!options.retainBrowser)
                    await session.waitUntilClosed();
                // [L100] Closes the scope or expression introduced here: Continues review handoff only if the user has not closed the browser during cleanup.
            }
            // [L101] Uses a terminal failure outcome when no browser session was created.
        }
        else {
            // [L102] Reports the public failure message and confirms no automatic order submission occurred.
            sendStatus('failed', `${safe.message} No automatic order submission was performed.`);
            // [L103] Closes the scope or expression introduced here: Uses a terminal failure outcome when no browser session was created.
        }
        // [L104] Starts unconditional final lifecycle cleanup after success, failure, or browser closure.
    }
    finally {
        // [L105] Clears the timer, aborts outstanding work, and clears private environment values again for idempotent cleanup.
        timeout.clear();
        controller.abort();
        environment.clear();
        // [L106] Overwrites uploaded PDF buffers with zeros on every exit path.
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
        payload.input.apiKey = '';
        // An old PowerShell operation must settle before another job initializes its environment.
        await environment.drain();
        // [L107] Closes the scope or expression introduced here: Starts unconditional final lifecycle cleanup after success, failure, or browser closure.
    }
    // [L108] Ends the full preparation lifecycle function after its guaranteed cleanup.
    return options.retainBrowser && !closedByUser ? session ?? options.previousSession : undefined;
}
//# sourceMappingURL=preparation.js.map