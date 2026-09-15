# Annotation verification

Completed September 10, 2026.

The annotation covers 13,335 original lines across 60 first-party text files. Explanations were inserted as comments in 47 files and supplied in companions for 13 JSON, Markdown, and SVG files. The four example PDFs were recorded in the inventory and preserved unchanged; binary files do not have source-code lines. Installed dependencies, compiled output, captured third-party scripts, caches, logs, browser snapshots, and generated binary assets were excluded from direct annotation.

## Original content preservation

- Removing only the recorded comment insertions reproduced all 47 annotated originals byte for byte, including their original line endings.
- All 17 originals with companion/reference-only treatment, including the PDFs, retained their original SHA-256 hashes.
- All 42 JavaScript and TypeScript source/configuration/test/helper files retained identical parsed code structure after comments were removed.
- CSS selectors, declarations, values, rule order, and nested structure matched the original parsed stylesheet.
- The HTML document's elements, attributes, exact text whitespace, doctype, document mode, and title matched after added comments were removed. HTML comments use existing lines to avoid introducing text whitespace; notes for attributes and raw text are placed outside those regions.
- The Python helper retained an identical abstract syntax tree.
- The PowerShell helper parsed without errors and retained the same significant token text/kinds and syntax-tree node sequence.
- All 21 compiled JavaScript files retained identical parsed code structure compared with a snapshot captured before the check's build step. The existing build regenerated comments and source maps normally.
- Every companion has exactly one numbered explanation for every original line, including blanks and closing delimiters. Sixty-one explanations were moved to safe comment locations outside multiline literals, tags, or other protected syntax.

No executable statement, original string, prompt, selector, setting, validation rule, test expectation, or business rule was corrected or replaced. These checks establish preservation for the files inspected; line numbers and comments themselves intentionally differ.

## Existing local checks

`npm run check` completed with exit code 0:

- TypeScript checking passed.
- 314 unit/integration tests passed across 14 files.
- 66 Playwright browser tests passed.
- The production build passed.

Total: **380 passing tests**. Final wording improvements to test comments were followed by the complete byte/structure/coverage checks above. No provider calls or live R3 order acceptance/submission runs were performed for this annotation task.

## Records

- [File and line coverage](coverage.json)
- [Original snapshots](../../tmp/line-comments/originals/)
- [Comment insertion records](../../tmp/line-comments/applied/)
- [Preservation check results](../../tmp/line-comments/preservation.json)
- [Local check log](../../tmp/line-comments/check.log)

Annotation notes and temporary verification tools are retained under `tmp/line-comments/`. Their isolated parser tooling did not modify the project's package manifest, lockfile, or installed dependencies.
