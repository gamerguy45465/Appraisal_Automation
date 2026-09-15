# Line explanations: src/worker.ts

Source: [src/worker.ts](../../../src/worker.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

September 14 sequential-order update: the worker accepts serial job-correlated prepare/cancel commands, with a new controller for each order. It retains a handed-off browser only after cleanup, reports next-order readiness, and correlates lifetime callbacks to the current job. The original single-message listener descriptions below are historical.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports compile-time types JobPayload, WorkerUpdate from ./domain.js for shared validated application data, business rules, defaults, and domain types. |
| 2 | Imports runPreparation from ./preparation.js for the full extraction, form preparation, review, and cleanup lifecycle. |
| 3 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 4 | Creates the worker's cancellation controller for parent-requested automation stops. |
| 5 | Accepts the first parent IPC message as this worker's job payload and starts its single-job lifecycle. |
| 6 | Defines handling of later control messages received from the parent process. |
| 7 | Aborts preparation only for an object carrying the explicit stop_preparation message type. |
| 8 | Closes the scope or expression introduced here: Defines handling of later control messages received from the parent process. |
| 9 | Registers the stop-control listener after the initial job payload arrives. |
| 10 | Defines status forwarding over IPC only while the parent connection remains open. |
| 11 | Starts preparation with status reporting and the worker abort signal, attaching a fallback for unexpected rejected failures. |
| 12 | Sends a fixed failed status if preparation rejects outside its normal lifecycle handling. |
| 13 | Sets the worker's eventual exit code to indicate failure. |
| 14 | Starts IPC cleanup that runs after preparation settles successfully or unsuccessfully. |
| 15 | Removes the control-message listener so the completed worker no longer accepts stop requests. |
| 16 | Disconnects the parent IPC channel if it remains connected, allowing the worker to exit naturally. |
| 17 | Closes the scope or expression introduced here: Starts IPC cleanup that runs after preparation settles successfully or unsuccessfully. |
| 18 | Closes the scope or expression introduced here: Accepts the first parent IPC message as this worker's job payload and starts its single-job lifecycle. |
