# Line explanations: src/environment.ts

Source: [src/environment.ts](../../../src/environment.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

September 14 sequential-order update: environment helpers track pending operations and provide a drain boundary after clear. A new order cannot initialize its process values until earlier PowerShell operations settle. This prevents a late old-job setter or cleanup from changing the successor's values.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports spawn from node:child_process for child-process creation and related process option types. |
| 2 | Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths. |
| 3 | Imports tool from @langchain/core/tools for schema-described tools callable by the agent. |
| 4 | Imports z from zod for runtime schemas and validation-error handling. |
| 5 | Imports compile-time types OrderInput from ./domain.js for shared validated application data, business rules, defaults, and domain types. |
| 6 | Imports AppError from ./errors.js for fixed public application errors and private provider-error classification. |
| 7 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 8 | Exports the mapping from approved logical setting keys to isolated-worker environment variable names. |
| 9 | Maps the private provider API key to its application-specific environment variable. |
| 10 | Maps the loan reference and FHA case number to separate application-specific environment variables. |
| 11 | Maps payment choice and the rush flag to their application-specific environment variables. |
| 12 | Finishes the mapping and preserves its literal keys and values in the TypeScript type. |
| 13 | Restricts environment operations to keys present in the approved mapping. |
| 14 | Marks only the API-key setting as secret so model-facing getters cannot return it. |
| 15 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 16 | Existing explanatory comment: Powershell treats JSON stdin as data; no form value becomes executable shell text. |
| 17 | Exports an asynchronous Windows helper operation that sets or retrieves one approved environment setting. |
| 18 | Refuses environment-helper execution outside Windows with a public application error. |
| 19 | Wraps the child-process lifecycle in a promise returning the resulting setting value. |
| 20 | Starts the fixed PowerShell helper hidden, without profiles or interaction, using piped streams and a ten-second process timeout. |
| 21 | Initializes accumulation of the helper's standard-output JSON. |
| 22 | Decodes the child process's standard output as UTF-8 text. |
| 23 | Appends each output chunk to the helper-response buffer. |
| 24 | Drains standard error without exposing its content or blocking the child on a full pipe. |
| 25 | Converts child-process startup failures into a fixed environment-helper error. |
| 26 | Converts failures writing the helper's input into a fixed environment-helper error. |
| 27 | Handles process completion and interprets the helper's exit status and output. |
| 28 | Rejects nonzero helper exits with a safe message and skips response parsing. |
| 29 | Begins parsing the successful helper response with a fixed-error fallback. |
| 30 | Removes an optional UTF-8 BOM and parses JSON containing the returned value. |
| 31 | Converts a null helper value into an empty string. |
| 32 | Existing explanatory comment: A child PowerShell cannot mutate its Node parent; synchronize only this isolated worker. |
| 33 | After a set operation, copies the returned setting into this Node worker's environment because a child cannot update its parent. |
| 34 | Resolves the operation with the stored or retrieved string. |
| 35 | Converts malformed helper output into a fixed invalid-environment-response error. |
| 36 | Closes the scope or expression introduced here: Handles process completion and interprets the helper's exit status and output. |
| 37 | Sends the approved environment name and value as JSON on standard input, then closes input. |
| 38 | Closes the scope or expression introduced here: Wraps the child-process lifecycle in a promise returning the resulting setting value. |
| 39 | Closes the scope or expression introduced here: Exports an asynchronous Windows helper operation that sets or retrieves one approved environment setting. |
| 40 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 41 | Exports creation of per-job private setting storage and model-visible environment tools. |
| 42 | Captures submitted settings in a private string-valued map, converting the rush Boolean to text. |
| 43 | Tracks whether the environment remains usable before cleanup. |
| 44 | Defines a guard that rejects all later operations after environment cleanup. |
| 45 | Defines asynchronous storage for one approved private setting. |
| 46 | Rejects storage if the environment has already been cleared. |
| 47 | Calls the fixed helper to store the original private value for this setting. |
| 48 | Ensures a late helper completion cannot restore a setting after cleanup. |
| 49 | Existing explanatory comment: A helper already in flight can finish after clear() and synchronize its old value. |
| 50 | Deletes any setting synchronized by an in-flight helper after the environment became inactive. |
| 51 | Closes the scope or expression introduced here: Ensures a late helper completion cannot restore a setting after cleanup. |
| 52 | Rechecks activity after asynchronous storage, rejecting a completion that raced with cleanup. |
| 53 | Closes the scope or expression introduced here: Defines asynchronous storage for one approved private setting. |
| 54 | Defines retrieval of one setting while preserving the environment's active-state boundary. |
| 55 | Rejects retrieval after the environment has been cleared. |
| 56 | Reads the requested approved setting through the PowerShell helper. |
| 57 | Rechecks activity after the helper returns so cleared values are not returned to a caller. |
| 58 | Returns the retrieved value to the internal caller. |
| 59 | Closes the scope or expression introduced here: Defines retrieval of one setting while preserving the environment's active-state boundary. |
| 60 | Builds two argument-free LangChain tools for every approved logical environment key. |
| 61 | Creates a store tool using the server-captured value and returns only confirmation that storage completed. |
| 62 | Creates a getter that returns only configuration availability for secrets and the value for nonsecret settings, with matching tool descriptions. |
| 63 | Closes the scope or expression introduced here: Builds two argument-free LangChain tools for every approved logical environment key. |
| 64 | Returns the tool collection together with internal initialization, retrieval, and cleanup operations. |
| 65 | Exposes the generated model-facing tools. |
| 66 | Initializes every approved setting in sequence using the guarded store operation. |
| 67 | Exposes the guarded retrieval function for private backend consumption. |
| 68 | Marks the environment inactive, removes all mapped process variables, and replaces retained private values with empty strings. |
| 69 | Closes the scope or expression introduced here: Returns the tool collection together with internal initialization, retrieval, and cleanup operations. |
| 70 | Closes the scope or expression introduced here: Exports creation of per-job private setting storage and model-visible environment tools. |
