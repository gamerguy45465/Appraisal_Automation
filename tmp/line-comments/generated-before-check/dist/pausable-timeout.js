/** Count active processing time without charging the user's manual sign-in wait. */
export function createPausableTimeout(onTimeout, durationMs) {
    let remainingMs = durationMs;
    let startedAt = Date.now();
    let timer;
    let stopped = false;
    const resume = () => {
        if (stopped || timer)
            return;
        startedAt = Date.now();
        timer = setTimeout(() => { timer = undefined; stopped = true; onTimeout(); }, remainingMs);
        timer.unref();
    };
    resume();
    return {
        pause() {
            if (!timer || stopped)
                return;
            clearTimeout(timer);
            timer = undefined;
            remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
        },
        resume,
        clear() { stopped = true; clearTimeout(timer); timer = undefined; },
    };
}
//# sourceMappingURL=pausable-timeout.js.map