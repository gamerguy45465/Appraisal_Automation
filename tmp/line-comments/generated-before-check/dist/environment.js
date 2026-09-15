import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AppError } from './errors.js';
export const environmentNames = {
    api_key: 'APPRAISAL_AI_API_KEY',
    loan_number: 'APPRAISAL_LOAN_NUMBER', fha_case_number: 'APPRAISAL_FHA_CASE_NUMBER',
    payment_method: 'APPRAISAL_PAYMENT_METHOD', rush_order: 'APPRAISAL_RUSH_ORDER',
};
const secrets = new Set(['api_key']);
/** Powershell treats JSON stdin as data; no form value becomes executable shell text. */
export function runEnvironmentOperation(operation, key, value) {
    if (process.platform !== 'win32')
        throw new AppError('WINDOWS_REQUIRED', 'Run this application on Windows.');
    return new Promise((resolve, reject) => {
        const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', fileURLToPath(new URL('../scripts/environment.ps1', import.meta.url)), '-Operation', operation], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 });
        let output = '';
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => { output += chunk; });
        child.stderr.resume();
        child.on('error', () => reject(new AppError('ENVIRONMENT_FAILED', 'Windows could not start the environment helper.')));
        child.stdin.on('error', () => reject(new AppError('ENVIRONMENT_FAILED', 'Windows could not receive the environment settings.')));
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new AppError('ENVIRONMENT_FAILED', 'Windows could not store the environment settings.'));
                return;
            }
            try {
                const result = JSON.parse(output.replace(/^\uFEFF/, ''));
                const stored = result.value ?? '';
                // A child PowerShell cannot mutate its Node parent; synchronize only this isolated worker.
                if (operation === 'set')
                    process.env[environmentNames[key]] = stored;
                resolve(stored);
            }
            catch {
                reject(new AppError('ENVIRONMENT_FAILED', 'Windows returned invalid environment settings.'));
            }
        });
        child.stdin.end(JSON.stringify({ name: environmentNames[key], value }));
    });
}
export function createEnvironmentTools(input) {
    const values = { api_key: input.apiKey, loan_number: input.loanNumber, fha_case_number: input.fhaCaseNumber, payment_method: input.paymentMethod, rush_order: String(input.rushOrder) };
    let active = true;
    const ensureActive = () => { if (!active)
        throw new AppError('ENVIRONMENT_CLOSED', 'The preparation environment has been cleared.'); };
    const store = async (key) => {
        ensureActive();
        try {
            await runEnvironmentOperation('set', key, values[key]);
        }
        finally {
            // A helper already in flight can finish after clear() and synchronize its old value.
            if (!active)
                delete process.env[environmentNames[key]];
        }
        ensureActive();
    };
    const retrieve = async (key) => {
        ensureActive();
        const value = await runEnvironmentOperation('get', key);
        ensureActive();
        return value;
    };
    const tools = Object.keys(environmentNames).flatMap(key => [
        tool(async () => { await store(key); return { stored: true }; }, { name: `store_${key}`, description: `Store the user-provided ${key} in the isolated job environment. Values are supplied privately by the server.`, schema: z.object({}) }),
        tool(async () => { const value = await retrieve(key); return secrets.has(key) ? { configured: Boolean(value), usage: 'Consumed privately by the backend; never exposed to the model.' } : { value }; }, { name: `get_${key}`, description: secrets.has(key) ? `Check that ${key} is configured without exposing it.` : `Retrieve the user-provided ${key}.`, schema: z.object({}) }),
    ]);
    return {
        tools,
        initialize: async () => { for (const key of Object.keys(environmentNames))
            await store(key); },
        retrieve,
        clear: () => { active = false; for (const key of Object.keys(environmentNames)) {
            delete process.env[environmentNames[key]];
            values[key] = '';
        } },
    };
}
//# sourceMappingURL=environment.js.map