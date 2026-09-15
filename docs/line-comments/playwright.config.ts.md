# Line explanations: playwright.config.ts

Source: [playwright.config.ts](../../playwright.config.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import Playwright's typed configuration helper. |
| 2 | Export the browser-test configuration through defineConfig. |
| 3 | Find spec.ts tests under tests, disable full parallel execution, and run with one worker. |
| 4 | Allow 30 seconds per test; use headless browsers with traces and screenshots disabled. |
| 5 | Finish the browser-test configuration and its export. |
