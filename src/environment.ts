// [L1] Imports spawn from node:child_process for child-process creation and related process option types.
import { spawn } from 'node:child_process';
// [L2] Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths.
import { fileURLToPath } from 'node:url';
// [L3] Imports tool from @langchain/core/tools for schema-described tools callable by the agent.
import { tool } from '@langchain/core/tools';
// [L4] Imports z from zod for runtime schemas and validation-error handling.
import { z } from 'zod';
// [L5] Imports compile-time types OrderInput from ./domain.js for shared validated application data, business rules, defaults, and domain types.
import type { OrderInput } from './domain.js';
// [L6] Imports AppError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError } from './errors.js';
// [L7] Blank line separating the surrounding declarations, statements, or document blocks.

// [L8] Exports the mapping from approved logical setting keys to isolated-worker environment variable names.
export const environmentNames = {
  // [L9] Maps the private provider API key to its application-specific environment variable.
  api_key: 'APPRAISAL_AI_API_KEY',
  // [L10] Maps the loan reference and FHA case number to separate application-specific environment variables.
  loan_number: 'APPRAISAL_LOAN_NUMBER', fha_case_number: 'APPRAISAL_FHA_CASE_NUMBER',
  // [L11] Maps payment choice and the rush flag to their application-specific environment variables.
  payment_method: 'APPRAISAL_PAYMENT_METHOD', rush_order: 'APPRAISAL_RUSH_ORDER',
// [L12] Finishes the mapping and preserves its literal keys and values in the TypeScript type.
} as const;
// [L13] Restricts environment operations to keys present in the approved mapping.
type EnvironmentKey = keyof typeof environmentNames;
// [L14] Marks only the API-key setting as secret so model-facing getters cannot return it.
const secrets = new Set<EnvironmentKey>(['api_key']);
// [L15] Blank line separating the surrounding declarations, statements, or document blocks.

// [L16] Existing explanatory comment: Powershell treats JSON stdin as data; no form value becomes executable shell text.
/** Powershell treats JSON stdin as data; no form value becomes executable shell text. */
// [L17] Exports an asynchronous Windows helper operation that sets or retrieves one approved environment setting.
export function runEnvironmentOperation(operation: 'set' | 'get', key: EnvironmentKey, value?: string): Promise<string> {
  // [L18] Refuses environment-helper execution outside Windows with a public application error.
  if (process.platform !== 'win32') throw new AppError('WINDOWS_REQUIRED', 'Run this application on Windows.');
  // [L19] Wraps the child-process lifecycle in a promise returning the resulting setting value.
  return new Promise((resolve, reject) => {
    // [L20] Starts the fixed PowerShell helper hidden, without profiles or interaction, using piped streams and a ten-second process timeout.
    const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', fileURLToPath(new URL('../scripts/environment.ps1', import.meta.url)), '-Operation', operation], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 });
    // [L21] Initializes accumulation of the helper's standard-output JSON.
    let output = '';
    let helperError: AppError | undefined;
    // [L22] Decodes the child process's standard output as UTF-8 text.
    child.stdout.setEncoding('utf8');
    // [L23] Appends each output chunk to the helper-response buffer.
    child.stdout.on('data', (chunk: string) => { output += chunk; });
    // [L24] Drains standard error without exposing its content or blocking the child on a full pipe.
    child.stderr.resume();
    // [L25] Converts child-process startup failures into a fixed environment-helper error.
    child.on('error', () => { helperError ??= new AppError('ENVIRONMENT_FAILED', 'Windows could not start the environment helper.'); });
    // [L26] Converts failures writing the helper's input into a fixed environment-helper error.
    child.stdin.on('error', () => {
      helperError ??= new AppError('ENVIRONMENT_FAILED', 'Windows could not receive the environment settings.');
      child.kill();
    });
    // [L27] Handles process completion and interprets the helper's exit status and output.
    child.on('close', (code) => {
      // Keep the operation pending until the child is closed, and never synchronize a response after an error.
      if (helperError) { reject(helperError); return; }
      // [L28] Rejects nonzero helper exits with a safe message and skips response parsing.
      if (code !== 0) { reject(new AppError('ENVIRONMENT_FAILED', 'Windows could not store the environment settings.')); return; }
      // [L29] Begins parsing the successful helper response with a fixed-error fallback.
      try {
        // [L30] Removes an optional UTF-8 BOM and parses JSON containing the returned value.
        const result = JSON.parse(output.replace(/^\uFEFF/, '')) as { value: string | null };
        // [L31] Converts a null helper value into an empty string.
        const stored = result.value ?? '';
        // [L32] Existing explanatory comment: A child PowerShell cannot mutate its Node parent; synchronize only this isolated worker.
        // A child PowerShell cannot mutate its Node parent; synchronize only this isolated worker.
        // [L33] After a set operation, copies the returned setting into this Node worker's environment because a child cannot update its parent.
        if (operation === 'set') process.env[environmentNames[key]] = stored;
        // [L34] Resolves the operation with the stored or retrieved string.
        resolve(stored);
      // [L35] Converts malformed helper output into a fixed invalid-environment-response error.
      } catch { reject(new AppError('ENVIRONMENT_FAILED', 'Windows returned invalid environment settings.')); }
    // [L36] Closes the scope or expression introduced here: Handles process completion and interprets the helper's exit status and output.
    });
    // [L37] Sends the approved environment name and value as JSON on standard input, then closes input.
    child.stdin.end(JSON.stringify({ name: environmentNames[key], value }));
  // [L38] Closes the scope or expression introduced here: Wraps the child-process lifecycle in a promise returning the resulting setting value.
  });
// [L39] Closes the scope or expression introduced here: Exports an asynchronous Windows helper operation that sets or retrieves one approved environment setting.
}
// [L40] Blank line separating the surrounding declarations, statements, or document blocks.

// [L41] Exports creation of per-job private setting storage and model-visible environment tools.
export function createEnvironmentTools(input: OrderInput) {
  // [L42] Captures submitted settings in a private string-valued map, converting the rush Boolean to text.
  const values: Record<EnvironmentKey, string> = { api_key: input.apiKey, loan_number: input.loanNumber, fha_case_number: input.fhaCaseNumber, payment_method: input.paymentMethod, rush_order: String(input.rushOrder) };
  // [L43] Tracks whether the environment remains usable before cleanup.
  let active = true;
  const pending = new Set<Promise<unknown>>();
  const tracked = async <T>(operation: () => Promise<T>): Promise<T> => {
    const work = operation();
    pending.add(work);
    try { return await work; }
    finally { pending.delete(work); }
  };
  // [L44] Defines a guard that rejects all later operations after environment cleanup.
  const ensureActive = (): void => { if (!active) throw new AppError('ENVIRONMENT_CLOSED', 'The preparation environment has been cleared.'); };
  // [L45] Defines asynchronous storage for one approved private setting.
  const store = (key: EnvironmentKey): Promise<void> => tracked(async () => {
    // [L46] Rejects storage if the environment has already been cleared.
    ensureActive();
    // [L47] Calls the fixed helper to store the original private value for this setting.
    try { await runEnvironmentOperation('set', key, values[key]); }
    // [L48] Ensures a late helper completion cannot restore a setting after cleanup.
    finally {
      // [L49] Existing explanatory comment: A helper already in flight can finish after clear() and synchronize its old value.
      // A helper already in flight can finish after clear() and synchronize its old value.
      // [L50] Deletes any setting synchronized by an in-flight helper after the environment became inactive.
      if (!active) delete process.env[environmentNames[key]];
    // [L51] Closes the scope or expression introduced here: Ensures a late helper completion cannot restore a setting after cleanup.
    }
    // [L52] Rechecks activity after asynchronous storage, rejecting a completion that raced with cleanup.
    ensureActive();
  // [L53] Closes the scope or expression introduced here: Defines asynchronous storage for one approved private setting.
  });
  // [L54] Defines retrieval of one setting while preserving the environment's active-state boundary.
  const retrieve = (key: EnvironmentKey): Promise<string> => tracked(async () => {
    // [L55] Rejects retrieval after the environment has been cleared.
    ensureActive();
    // [L56] Reads the requested approved setting through the PowerShell helper.
    const value = await runEnvironmentOperation('get', key);
    // [L57] Rechecks activity after the helper returns so cleared values are not returned to a caller.
    ensureActive();
    // [L58] Returns the retrieved value to the internal caller.
    return value;
  // [L59] Closes the scope or expression introduced here: Defines retrieval of one setting while preserving the environment's active-state boundary.
  });
  // [L60] Builds two argument-free LangChain tools for every approved logical environment key.
  const tools = (Object.keys(environmentNames) as EnvironmentKey[]).flatMap(key => [
    // [L61] Creates a store tool using the server-captured value and returns only confirmation that storage completed.
    tool(async () => { await store(key); return { stored: true }; }, { name: `store_${key}`, description: `Store the user-provided ${key} in the isolated job environment. Values are supplied privately by the server.`, schema: z.object({}) }),
    // [L62] Creates a getter that returns only configuration availability for secrets and the value for nonsecret settings, with matching tool descriptions.
    tool(async () => { const value = await retrieve(key); return secrets.has(key) ? { configured: Boolean(value), usage: 'Consumed privately by the backend; never exposed to the model.' } : { value }; }, { name: `get_${key}`, description: secrets.has(key) ? `Check that ${key} is configured without exposing it.` : `Retrieve the user-provided ${key}.`, schema: z.object({}) }),
  // [L63] Closes the scope or expression introduced here: Builds two argument-free LangChain tools for every approved logical environment key.
  ]);
  // [L64] Returns the tool collection together with internal initialization, retrieval, and cleanup operations.
  return {
    // [L65] Exposes the generated model-facing tools.
    tools,
    // [L66] Initializes every approved setting in sequence using the guarded store operation.
    initialize: async (): Promise<void> => { for (const key of Object.keys(environmentNames) as EnvironmentKey[]) await store(key); },
    // [L67] Exposes the guarded retrieval function for private backend consumption.
    retrieve,
    // Called after clear(): no previous helper may synchronize environment values into the next job.
    drain: async (): Promise<void> => { while (pending.size) await Promise.allSettled([...pending]); },
    // [L68] Marks the environment inactive, removes all mapped process variables, and replaces retained private values with empty strings.
    clear: (): void => { active = false; for (const key of Object.keys(environmentNames) as EnvironmentKey[]) { delete process.env[environmentNames[key]]; values[key] = ''; } },
  // [L69] Closes the scope or expression introduced here: Returns the tool collection together with internal initialization, retrieval, and cleanup operations.
  };
// [L70] Closes the scope or expression introduced here: Exports creation of per-job private setting storage and model-visible environment tools.
}
