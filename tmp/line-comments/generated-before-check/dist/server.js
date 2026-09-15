import { createApp } from './app.js';
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('PORT must be an integer from 1024 to 65535.');
const { app, runner } = createApp({ port });
const server = app.listen(port, '127.0.0.1', () => { console.info(`Appraisal Desk is ready at http://127.0.0.1:${port}`); });
server.requestTimeout = 60000;
server.headersTimeout = 15000;
server.on('error', () => { console.error('Appraisal Desk could not start. Check whether its port is already in use.'); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => { runner.shutdown(); server.close(() => process.exit(0)); });
//# sourceMappingURL=server.js.map