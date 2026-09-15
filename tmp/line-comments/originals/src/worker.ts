import type { JobPayload, WorkerUpdate } from './domain.js';
import { runPreparation } from './preparation.js';

const controller = new AbortController();
process.once('message', (payload: JobPayload) => {
  const stop = (message: unknown): void => {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'stop_preparation') controller.abort();
  };
  process.on('message', stop);
  const onStatus = (update: WorkerUpdate): void => { if (process.connected) process.send?.(update); };
  void runPreparation(payload, { onStatus, signal: controller.signal }).catch(() => {
    onStatus({ type: 'status', status: 'failed', message: 'The preparation worker stopped unexpectedly.' });
    process.exitCode = 1;
  }).finally(() => {
    process.removeListener('message', stop);
    if (process.connected) process.disconnect?.();
  });
});
