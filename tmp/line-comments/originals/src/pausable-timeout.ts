/** Count active processing time without charging the user's manual sign-in wait. */
export function createPausableTimeout(onTimeout: () => void, durationMs: number) {
  let remainingMs = durationMs;
  let startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const resume = (): void => {
    if (stopped || timer) return;
    startedAt = Date.now();
    timer = setTimeout(() => { timer = undefined; stopped = true; onTimeout(); }, remainingMs);
    timer.unref();
  };
  resume();
  return {
    pause(): void {
      if (!timer || stopped) return;
      clearTimeout(timer);
      timer = undefined;
      remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
    },
    resume,
    clear(): void { stopped = true; clearTimeout(timer); timer = undefined; },
  };
}
