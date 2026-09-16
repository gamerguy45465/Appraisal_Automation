import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../errors.js';
const keySchema = z.enum(['Enter', 'Tab', 'Shift+Tab', 'Escape', 'Backspace', 'Delete',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown',
    'Space', 'Control+A', 'Meta+A', 'Shift+ArrowLeft', 'Shift+ArrowRight', 'Shift+ArrowUp',
    'Shift+ArrowDown', 'Shift+Home', 'Shift+End', 'Control+ArrowLeft', 'Control+ArrowRight',
    'Control+Home', 'Control+End']);
const boundedCoordinate = z.number().finite().min(0).max(4095);
const actionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('click'), x: boundedCoordinate, y: boundedCoordinate, button: z.enum(['left', 'right']).optional() }).strict(),
    z.object({ type: z.literal('text'), text: z.string().min(1).max(4096).refine(value => !value.includes('\0')) }).strict(),
    z.object({ type: z.literal('key'), key: keySchema }).strict(),
    z.object({ type: z.literal('scroll'), deltaX: z.number().finite().min(-2000).max(2000), deltaY: z.number().finite().min(-2000).max(2000) }).strict(),
    z.object({ type: z.literal('dialog'), accept: z.boolean(), promptText: z.string().max(4096).optional() }).strict(),
    z.object({ type: z.literal('select-page'), pageId: z.string().uuid() }).strict(),
]);
const unavailable = () => new AppError('HUMAN_BROWSER_UNAVAILABLE', 'The cloud browser is no longer available.', 409);
const paused = () => new AppError('HUMAN_BROWSER_PAUSED', 'Browser input is paused while automatic preparation is running.', 409);
const invalid = () => new AppError('HUMAN_BROWSER_INVALID', 'The browser action is invalid.', 400);
const actionFailed = () => new AppError('HUMAN_BROWSER_ACTION_FAILED', 'The browser action could not finish. Refresh the browser view and try again.', 409);
export function validateHumanBrowserAction(value) {
    const result = actionSchema.safeParse(value);
    if (!result.success)
        throw invalid();
    return result.data;
}
/** A private human input queue is independent from the model queue and is drained at phase changes. */
export function createHumanBrowserView(context, primaryPage, state) {
    let disposed = false;
    let suspended = false;
    let generation = 0;
    let queue = Promise.resolve();
    let pendingActions = 0;
    const nativeInputs = new Set();
    let selected = primaryPage;
    let framePromise;
    const pages = new Map();
    const images = new Map();
    const ensureOpen = () => {
        const current = state();
        if (disposed || current.closed || current.phase === 'closed')
            throw unavailable();
        return current;
    };
    const ensureControl = (expectedGeneration) => {
        const current = ensureOpen();
        if (suspended || generation !== expectedGeneration || !current.canControl
            || !['authenticating', 'review'].includes(current.phase))
            throw paused();
    };
    const selectedPage = () => {
        if (selected.isClosed() || !pages.has(selected)) {
            const replacement = [...pages.keys()].find(candidate => !candidate.isClosed());
            if (!replacement)
                throw unavailable();
            selected = replacement;
        }
        return selected;
    };
    const watchPage = (watched) => {
        if (disposed || watched.isClosed() || pages.has(watched))
            return;
        const registration = {
            id: randomUUID(),
            title: 'R3 browser',
            dialog: undefined,
            onDialog(dialog) {
                const current = state();
                // A dialog arriving during draining must not hold the last input open indefinitely.
                // Preparation is never allowed to accept a page-generated confirmation.
                if (disposed || suspended || current.closed || current.phase === 'preparing' || current.phase === 'closed') {
                    void dialog.dismiss().catch(() => undefined);
                }
                else
                    registration.dialog = dialog;
            },
            onReady() {
                // Titles are optional labels. Never block a frame on a page evaluation behind a modal.
                if (!registration.dialog)
                    void watched.title().then(title => { registration.title = title.slice(0, 200) || 'R3 browser'; }).catch(() => undefined);
            },
            onClose() {
                watched.off('dialog', registration.onDialog);
                watched.off('domcontentloaded', registration.onReady);
                pages.delete(watched);
                images.delete(watched);
            },
        };
        pages.set(watched, registration);
        watched.on('dialog', registration.onDialog);
        watched.on('domcontentloaded', registration.onReady);
        watched.once('close', registration.onClose);
        registration.onReady();
    };
    for (const existing of context.pages())
        watchPage(existing);
    context.on('page', watchPage);
    const capture = async () => {
        ensureOpen();
        const page = selectedPage();
        const registration = pages.get(page);
        const size = page.viewportSize() ?? { width: 1440, height: 1000 };
        let captured = images.get(page) ?? { image: '', ...size };
        // Native dialogs can prevent screenshots. The last image still permits dialog interaction.
        if (!registration.dialog) {
            try {
                const image = await page.screenshot({ type: 'jpeg', quality: 65, fullPage: false, timeout: 5000 });
                captured = { image: image.toString('base64'), ...size };
                images.set(page, captured);
            }
            catch {
                if (!registration.dialog)
                    throw new AppError('HUMAN_BROWSER_FRAME_FAILED', 'The cloud browser image is unavailable. Try again shortly.', 409);
            }
        }
        const tabs = [...pages.entries()].slice(0, 20).map(([candidate, entry]) => ({ id: entry.id, title: entry.title, selected: candidate === page }));
        const current = ensureOpen();
        const dialog = registration.dialog;
        return {
            ...captured,
            phase: current.phase,
            canControl: !suspended && current.canControl && ['authenticating', 'review'].includes(current.phase),
            pages: tabs,
            ...(dialog ? { dialog: { type: dialog.type(), message: dialog.message().slice(0, 2000), defaultValue: dialog.defaultValue().slice(0, 2000) } } : {}),
        };
    };
    const nativeInput = async (page, action) => {
        let notifyDialog;
        const dialog = new Promise(resolve => { notifyDialog = resolve; });
        page.once('dialog', notifyDialog);
        const work = Promise.resolve().then(action);
        nativeInputs.add(work);
        // A modal may hold the Chromium input command open. Allow the human to answer it,
        // while keeping the actual command tracked for phase-transition draining.
        void work.finally(() => { nativeInputs.delete(work); }).catch(() => undefined);
        try {
            await Promise.race([work, dialog]);
        }
        finally {
            page.off('dialog', notifyDialog);
        }
    };
    const view = {
        frame() {
            framePromise ??= capture().finally(() => { framePromise = undefined; });
            return framePromise;
        },
        act(input) {
            let action;
            const actionGeneration = generation;
            try {
                action = validateHumanBrowserAction(input);
                ensureControl(actionGeneration);
                if (pendingActions >= 32)
                    throw new AppError('HUMAN_BROWSER_BUSY', 'Wait for the current browser input to finish.', 429);
            }
            catch (error) {
                return Promise.reject(error instanceof AppError ? error : invalid());
            }
            pendingActions++;
            const operation = queue.then(async () => {
                ensureControl(actionGeneration);
                if (action.type === 'select-page') {
                    const match = [...pages.entries()].find(([, entry]) => entry.id === action.pageId)?.[0];
                    if (!match || match.isClosed())
                        throw invalid();
                    selected = match;
                    await match.bringToFront();
                    return;
                }
                const page = selectedPage();
                const registration = pages.get(page);
                if (action.type === 'dialog') {
                    const dialog = registration.dialog;
                    if (!dialog)
                        throw invalid();
                    if (action.accept)
                        await dialog.accept(dialog.type() === 'prompt' ? action.promptText : undefined);
                    else
                        await dialog.dismiss();
                    if (registration.dialog === dialog)
                        registration.dialog = undefined;
                    return;
                }
                if (registration.dialog)
                    throw new AppError('HUMAN_BROWSER_DIALOG', 'Respond to the browser dialog before continuing.', 409);
                switch (action.type) {
                    case 'click': {
                        const size = page.viewportSize() ?? { width: 1440, height: 1000 };
                        if (action.x >= size.width || action.y >= size.height)
                            throw invalid();
                        await nativeInput(page, () => page.mouse.click(action.x, action.y, { button: action.button ?? 'left' }));
                        break;
                    }
                    case 'text':
                        await nativeInput(page, () => page.keyboard.insertText(action.text));
                        break;
                    case 'key':
                        await nativeInput(page, () => page.keyboard.press(action.key));
                        break;
                    case 'scroll':
                        await nativeInput(page, () => page.mouse.wheel(action.deltaX, action.deltaY));
                        break;
                }
            }).catch((error) => { throw error instanceof AppError ? error : actionFailed(); });
            queue = operation.then(() => undefined, () => undefined).finally(() => { pendingActions--; });
            return operation;
        },
    };
    return {
        view,
        async suspendAndDrain() {
            suspended = true;
            generation++;
            await queue;
            // Queue completion includes any dialog opened by the last in-flight input. Dismiss
            // that modal before draining its native command; never implicitly accept a write.
            await Promise.allSettled([...pages.values()].map(async (registration) => {
                const dialog = registration.dialog;
                if (!dialog)
                    return;
                await dialog.dismiss().catch(() => undefined);
                if (registration.dialog === dialog)
                    registration.dialog = undefined;
            }));
            await Promise.allSettled([...nativeInputs]);
        },
        resume() { if (!disposed) {
            generation++;
            suspended = false;
        } },
        dispose() {
            if (disposed)
                return;
            disposed = true;
            suspended = true;
            generation++;
            context.off('page', watchPage);
            for (const [page, registration] of pages) {
                page.off('dialog', registration.onDialog);
                page.off('domcontentloaded', registration.onReady);
                page.off('close', registration.onClose);
            }
            pages.clear();
            images.clear();
        },
    };
}
//# sourceMappingURL=human-view.js.map