# Line explanations: tsconfig.build.json

Source: [tsconfig.build.json](../../tsconfig.build.json). Numbers refer to the original file before comments were added.

The original file is unchanged. These companion notes preserve its strict syntax and rendering.

| Original line | Explanation |
| ---: | --- |
| 1 | Open the root JSON object containing this file's configuration or dependency records. |
| 2 | Loads the base TypeScript configuration before applying these overrides at extends: "./tsconfig.json". |
| 3 | Starts TypeScript compiler settings at compilerOptions: values follow. Sets the source root used to lay out emitted files at compilerOptions / rootDir: "src". Sets the output directory for compiled files at compilerOptions / outDir: "dist". Emits source maps alongside compiled JavaScript at compilerOptions / sourceMap: true. |
| 4 | Lists file patterns included by this configuration at include: values follow. |
| 5 | Lists paths omitted from this configuration at exclude: values follow. |
| 6 | Close root JSON object and preserve the surrounding JSON separators. |
