// [L1] Imports createApp from ./app.js for the local Express application factory.
import { createApp } from './app.js';
// [L2] Blank line separating the surrounding declarations, statements, or document blocks.
// [L3] Converts the PORT environment setting to a number, defaulting to 3000 when unset.
const port = Number(process.env.PORT ?? 3000);
// [L4] Rejects noninteger ports and values outside 1024 through 65535 before starting the server.
if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('PORT must be an integer from 1024 to 65535.');
// [L5] Creates the application and its worker runner configured for this port.
const { app, runner } = createApp({ port });
// [L6] Listens only on IPv4 loopback and prints the local application URL after successful startup.
const server = app.listen(port, '127.0.0.1', () => { console.info(`Appraisal Desk is ready at http://127.0.0.1:${port}`); });
// [L7] Limits the time allowed to receive a complete request to 60 seconds.
server.requestTimeout = 60000;
// [L8] Limits receipt of request headers to 15 seconds.
server.headersTimeout = 15000;
// [L9] Reports a fixed server-start error without raw exception details and sets a failing process exit code.
server.on('error', () => { console.error('Appraisal Desk could not start. Check whether its port is already in use.'); process.exitCode = 1; });
// [L10] Handles interrupt and termination signals by shutting down workers, closing the HTTP server, and exiting once closure completes.
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => { runner.shutdown(); server.close(() => process.exit(0)); });
//# sourceMappingURL=server.js.map