import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createJobRunner } from './jobs.js';
import { CompanionConnectionError, createCompanionClient, validateCompanionOrigin } from './companion-client.js';

/** Do not echo or persist the one-time token, including when pasted into the prompt. */
async function readPairingToken(): Promise<string> {
  stdout.write('One-time pairing code (hidden): ');
  const previousRawMode = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  try {
    return await new Promise<string>((resolve, reject) => {
      let value = '';
      const finish = (aborted: boolean): void => {
        stdin.off('data', receive);
        stdin.off('end', ended);
        if (aborted) reject(new Error('Pairing cancelled.'));
        else resolve(value);
        value = '';
      };
      const ended = (): void => finish(true);
      const receive = (chunk: Buffer): void => {
        for (const character of chunk.toString('utf8')) {
          if (character === '\u0003' || character === '\u0004') { finish(true); return; }
          if (character === '\r' || character === '\n') { finish(false); return; }
          if (character === '\u007f' || character === '\b') { value = value.slice(0, -1); continue; }
          if (/^[A-Za-z0-9_-]$/.test(character) && value.length < 128) value += character;
        }
      };
      stdin.on('data', receive);
      stdin.once('end', ended);
    });
  } finally {
    stdin.setRawMode(previousRawMode);
    stdin.pause();
    stdout.write('\n');
  }
}

async function main(): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Run the companion on your Windows PC.');
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Run npm run companion in an interactive Windows terminal.');
  if (process.argv.length > 2) throw new Error('Run npm run companion without additional arguments. Enter the website and pairing code at its prompts.');
  const prompt = createInterface({ input: stdin, output: stdout });
  let origin: string;
  try { origin = validateCompanionOrigin(await prompt.question('Appraisal Desk HTTPS website (for example https://your-app.azurewebsites.net): ')); }
  finally { prompt.close(); }
  let pairingToken = await readPairingToken();
  // A separate Windows process group keeps Ctrl+C from reaching the worker/browser.
  const runner = createJobRunner({ detached: true });
  const client = createCompanionClient({ origin, pairingToken, runner, onMessage: message => stdout.write(`${message}\n`) });
  pairingToken = '';
  const stop = (): void => client.requestStop();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  try { await client.run(); }
  finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    // shutdown kills worker processes, so it is safe only after the user closes R3.
    if (!client.hasActiveBrowser()) runner.shutdown();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof CompanionConnectionError ? error.message
    : error instanceof Error && ['Run the companion on your Windows PC.', 'Run npm run companion in an interactive Windows terminal.',
      'Run npm run companion without additional arguments. Enter the website and pairing code at its prompts.', 'Pairing cancelled.'].includes(error.message)
      ? error.message : 'The companion could not start. Check the website address and generate a new pairing code, then try again.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
