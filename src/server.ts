// [L1] Imports createApp from ./app.js for the local Express application factory.
import { createApp } from './app.js';
import { resolveHosting } from './hosting.js';
// [L2] Blank line separating the surrounding declarations, statements, or document blocks.

// Hosting configuration preserves iisnode's named pipe rather than converting it to a number.
const hosting = resolveHosting();
const { app, runner } = createApp({ hosting, accessKey: process.env.APPRAISAL_ACCESS_KEY });
const ready = (): void => { console.info(`Appraisal Desk is ready at ${hosting.publicOrigin}`); };
const server = 'path' in hosting.listen
  ? app.listen(hosting.listen.path, ready)
  : app.listen(hosting.listen.port, hosting.listen.host, ready);
// [L7] Limits the time allowed to receive a complete request to 60 seconds.
server.requestTimeout = 60000;
// [L8] Limits receipt of request headers to 15 seconds.
server.headersTimeout = 15000;
// [L9] Reports a fixed server-start error without raw exception details and sets a failing process exit code.
server.on('error', () => { console.error('Appraisal Desk could not start. Check whether its port is already in use.'); process.exitCode = 1; });
// [L10] Handles interrupt and termination signals by shutting down workers, closing the HTTP server, and exiting once closure completes.
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { runner.shutdown(); server.close(() => process.exit(0)); });
