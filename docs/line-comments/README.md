# Project line-by-line explanations

The coverage hashes and preservation report describe the September 10 annotation snapshot. Later functional fixes, including the login-entry and current PostLogon redirect repairs, are recorded in the project README and CHAT_HANDOFF; current code may intentionally differ from that historical snapshot. The affected guard/session explanations have been updated for the login-entry fix, and the new PostLogon guard and regression tests have their own inline comments without historical line numbers.

The subsequent current-asset repair also adds inline-commented stylesheet/script/font rules, rendering regressions, and diagnostic resource checks. The newly authored `output/playwright/check-public-resources.mjs` explains its own bounded public-page checks inline and is outside the historical coverage counts below.

The September 14 login-alert repair adds the exact grid-license GET XHR exception, private styled-account authentication predicate, cancellation revalidation and `tests/browser-grid.spec.ts`. Updated guard/session companions describe those additions without assigning historical line numbers. The login diagnostic now optionally observes sanitized background-request and account-marker metadata. These changes are outside the original annotation snapshot and coverage counts.

The subsequent contact-field repair adds current UUID ID/name binding, exact role/caption matching, one identity per contact role, current input-group labels and guarded hidden-access readback. `tests/browser-contacts.spec.ts`, `output/playwright/contact-metadata.mjs` and `output/playwright/check-contact-fill.mjs` are new authored files outside the historical snapshot. The r3-fields/session companions describe these changes without changing the original coverage counts.

The September 14 sequential-order change replaces the original single-job worker lifecycle with an owner-scoped reusable browser, job-correlated IPC, environment draining and an explicit frontend next-order flow. Updated domain/jobs/worker/environment/preparation/session companions describe the current boundaries. New lifecycle tests and code are outside the historical snapshot; the original coverage hashes and line tables have not been regenerated.

These notes explain the project as it existed before annotation. Original source text, values, prompts, selectors, and executable statements were preserved. Added comments use `[L<number>]` to identify the original line they explain. Blank lines and closing delimiters are included. Comments for multiline literal contents are grouped outside the literal. HTML comments share the existing line so they add no text whitespace.

Scope: first-party application source, tests, configuration, documentation, and the existing authored diagnostic/PDF/graphics helpers. Installed dependencies, compiled output, captured third-party portal scripts, caches, logs, browser snapshots, and generated binary assets are not source annotation targets. JSON, Markdown, and SVG are explained in companions to preserve parsing/rendering. The four example PDFs remain unchanged and are listed below because binary files do not have source-code lines.

## Files

| File | Original lines | Annotation |
| --- | ---: | --- |
| [.gitignore](.gitignore.md) | 14 | source comments and companion |
| [CHAT_HANDOFF.md](CHAT_HANDOFF.md.md) | 314 | companion; original unchanged |
| [docs/security-review.md](docs/security-review.md.md) | 92 | companion; original unchanged |
| [Example_Pdfs/Sample_Form_1003_URLA.pdf](../../Example_Pdfs/Sample_Form_1003_URLA.pdf) | binary | binary reference; original unchanged |
| [Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf](../../Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf) | binary | binary reference; original unchanged |
| [Example_Pdfs/SAMPLE_Nevada_Residential_Purchase_Agreement.pdf](../../Example_Pdfs/SAMPLE_Nevada_Residential_Purchase_Agreement.pdf) | binary | binary reference; original unchanged |
| [Example_Pdfs/SAMPLE_URLA_1003_FHA_Whitmore.pdf](../../Example_Pdfs/SAMPLE_URLA_1003_FHA_Whitmore.pdf) | binary | binary reference; original unchanged |
| [output/playwright/diagnose-login.mjs](output/playwright/diagnose-login.mjs.md) | 57 | source comments and companion |
| [outputs/nevada-bond-market-2026-09-09/build-graphics.cjs](outputs/nevada-bond-market-2026-09-09/build-graphics.cjs.md) | 93 | source comments and companion |
| [outputs/nevada-bond-market-2026-09-09/delivery-notes.md](outputs/nevada-bond-market-2026-09-09/delivery-notes.md.md) | 22 | companion; original unchanged |
| [outputs/nevada-bond-market-2026-09-09/nevada-market-portrait.svg](outputs/nevada-bond-market-2026-09-09/nevada-market-portrait.svg.md) | 1 | companion; original unchanged |
| [outputs/nevada-bond-market-2026-09-09/nevada-market-square.svg](outputs/nevada-bond-market-2026-09-09/nevada-market-square.svg.md) | 1 | companion; original unchanged |
| [outputs/nevada-bond-market-2026-09-09/research-brief.md](outputs/nevada-bond-market-2026-09-09/research-brief.md.md) | 62 | companion; original unchanged |
| [outputs/nevada-bond-market-2026-09-09/social-caption.md](outputs/nevada-bond-market-2026-09-09/social-caption.md.md) | 26 | companion; original unchanged |
| [package-lock.json](package-lock.json.md) | 4620 | companion; original unchanged |
| [package.json](package.json.md) | 49 | companion; original unchanged |
| [playwright.config.ts](playwright.config.ts.md) | 5 | source comments and companion |
| [public/app.js](public/app.js.md) | 432 | source comments and companion |
| [public/index.html](public/index.html.md) | 258 | source comments and companion |
| [public/styles.css](public/styles.css.md) | 222 | source comments and companion |
| [README.md](README.md.md) | 153 | companion; original unchanged |
| [scripts/environment.ps1](scripts/environment.ps1.md) | 19 | source comments and companion |
| [skills/appraisal-automation/SKILL.md](skills/appraisal-automation/SKILL.md.md) | 64 | companion; original unchanged |
| [src/agent.ts](src/agent.ts.md) | 32 | source comments and companion |
| [src/app.ts](src/app.ts.md) | 93 | source comments and companion |
| [src/browser/guard.ts](src/browser/guard.ts.md) | 116 | source comments and companion |
| [src/browser/index.ts](src/browser/index.ts.md) | 2 | source comments and companion |
| [src/browser/r3-fields.ts](src/browser/r3-fields.ts.md) | 110 | source comments and companion |
| [src/browser/session.ts](src/browser/session.ts.md) | 775 | source comments and companion |
| [src/domain.ts](src/domain.ts.md) | 219 | source comments and companion |
| [src/environment.ts](src/environment.ts.md) | 70 | source comments and companion |
| [src/errors.ts](src/errors.ts.md) | 143 | source comments and companion |
| [src/extraction-schema.ts](src/extraction-schema.ts.md) | 49 | source comments and companion |
| [src/extraction.ts](src/extraction.ts.md) | 86 | source comments and companion |
| [src/google.ts](src/google.ts.md) | 38 | source comments and companion |
| [src/jobs.ts](src/jobs.ts.md) | 67 | source comments and companion |
| [src/model-messages.ts](src/model-messages.ts.md) | 83 | source comments and companion |
| [src/pausable-timeout.ts](src/pausable-timeout.ts.md) | 24 | source comments and companion |
| [src/pdf-pages.ts](src/pdf-pages.ts.md) | 149 | source comments and companion |
| [src/preparation.ts](src/preparation.ts.md) | 108 | source comments and companion |
| [src/server.ts](src/server.ts.md) | 10 | source comments and companion |
| [src/system-prompt.ts](src/system-prompt.ts.md) | 19 | source comments and companion |
| [src/worker.ts](src/worker.ts.md) | 18 | source comments and companion |
| [src/xai.ts](src/xai.ts.md) | 34 | source comments and companion |
| [tests/app.test.ts](tests/app.test.ts.md) | 137 | source comments and companion |
| [tests/browser.spec.ts](tests/browser.spec.ts.md) | 1346 | source comments and companion |
| [tests/domain.test.ts](tests/domain.test.ts.md) | 434 | source comments and companion |
| [tests/environment.test.ts](tests/environment.test.ts.md) | 110 | source comments and companion |
| [tests/errors.test.ts](tests/errors.test.ts.md) | 226 | source comments and companion |
| [tests/extraction-schema.test.ts](tests/extraction-schema.test.ts.md) | 87 | source comments and companion |
| [tests/extraction.test.ts](tests/extraction.test.ts.md) | 192 | source comments and companion |
| [tests/frontend.spec.ts](tests/frontend.spec.ts.md) | 310 | source comments and companion |
| [tests/google.test.ts](tests/google.test.ts.md) | 257 | source comments and companion |
| [tests/jobs.test.ts](tests/jobs.test.ts.md) | 195 | source comments and companion |
| [tests/model-messages.test.ts](tests/model-messages.test.ts.md) | 130 | source comments and companion |
| [tests/pdf-pages.test.ts](tests/pdf-pages.test.ts.md) | 215 | source comments and companion |
| [tests/preparation.test.ts](tests/preparation.test.ts.md) | 227 | source comments and companion |
| [tests/providers.test.ts](tests/providers.test.ts.md) | 269 | source comments and companion |
| [tests/r3-fields.test.ts](tests/r3-fields.test.ts.md) | 70 | source comments and companion |
| [tests/xai.test.ts](tests/xai.test.ts.md) | 182 | source comments and companion |
| [tmp/pdfs/add_sample_agents.py](tmp/pdfs/add_sample_agents.py.md) | 181 | source comments and companion |
| [tsconfig.build.json](tsconfig.build.json.md) | 6 | companion; original unchanged |
| [tsconfig.json](tsconfig.json.md) | 10 | companion; original unchanged |
| [vitest.config.ts](vitest.config.ts.md) | 2 | source comments and companion |

## Preservation checks

Every original file has a SHA-256 entry in [coverage.json](coverage.json). Removing only the recorded inserted comments reproduces each annotated original byte for byte, including line endings. JavaScript/TypeScript parse/print structure and CSS rules are compared before and after annotation. The complete annotation record and original snapshots are in `tmp/line-comments/`. Additional verification results are recorded in [verification.md](verification.md).
