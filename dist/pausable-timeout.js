// [L1] Existing explanatory comment: Count active processing time without charging the user's manual sign-in wait.
/** Count active processing time without charging the user's manual sign-in wait. */
// [L2] Exports a timer that tracks remaining active time and can be paused, resumed, or permanently cleared.
export function createPausableTimeout(onTimeout, durationMs) {
    // [L3] Initializes the remaining active-time budget from the requested duration.
    let remainingMs = durationMs;
    // [L4] Records the starting timestamp used to subtract elapsed active time on pause.
    let startedAt = Date.now();
    // [L5] Holds the current timeout handle, or undefined while paused or finished.
    let timer;
    // [L6] Tracks permanent cancellation or expiry so the timer cannot restart afterward.
    let stopped = false;
    // [L7] Defines idempotent resumption of the remaining active-time budget.
    const resume = () => {
        // [L8] Does nothing when permanently stopped or when a timer is already running.
        if (stopped || timer)
            return;
        // [L9] Records when this active timing interval begins.
        startedAt = Date.now();
        // [L10] Schedules expiration for the remaining duration, clears its handle, permanently stops the timer, and invokes the timeout callback.
        timer = setTimeout(() => { timer = undefined; stopped = true; onTimeout(); }, remainingMs);
        // [L11] Allows the process to exit naturally even if this timeout is still pending.
        timer.unref();
        // [L12] Closes the scope or expression introduced here: Defines idempotent resumption of the remaining active-time budget.
    };
    // [L13] Starts timing immediately after the helper is constructed.
    resume();
    // [L14] Returns the pause, resume, and clear controls.
    return {
        // [L15] Defines pausing of a currently active timer.
        pause() {
            // [L16] Leaves paused or permanently stopped timers unchanged.
            if (!timer || stopped)
                return;
            // [L17] Cancels the scheduled callback for the current active interval.
            clearTimeout(timer);
            // [L18] Removes the handle so the timer is considered paused.
            timer = undefined;
            // [L19] Subtracts elapsed active time from the remaining budget without allowing a negative duration.
            remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
            // [L20] Closes the scope or expression introduced here: Defines pausing of a currently active timer.
        },
        // [L21] Exposes the shared resume function.
        resume,
        // [L22] Permanently stops the timer, cancels any scheduled callback, and clears the handle.
        clear() { stopped = true; clearTimeout(timer); timer = undefined; },
        // [L23] Closes the scope or expression introduced here: Returns the pause, resume, and clear controls.
    };
    // [L24] Closes the scope or expression introduced here: Exports a timer that tracks remaining active time and can be paused, resumed, or permanently cleared.
}
//# sourceMappingURL=pausable-timeout.js.map