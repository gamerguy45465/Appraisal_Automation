# Line explanations: outputs/nevada-bond-market-2026-09-09/build-graphics.cjs

Source: [outputs/nevada-bond-market-2026-09-09/build-graphics.cjs](../../../../outputs/nevada-bond-market-2026-09-09/build-graphics.cjs). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Loads Node's filesystem module for reading the logo and writing generated SVG files. |
| 2 | Loads Node's path module for constructing output and asset paths. |
| 3 | Loads Sharp from the specified local runtime dependency path to rasterize SVGs and inspect PNG metadata. |
| 4 | Uses the script's directory as the output directory. |
| 5 | Reads the local Guild logo PNG and encodes it as base64 for embedding directly in SVG markup. |
| 6 | Defines named hexadecimal colors used throughout both graphic layouts. |
| 7 | Defines escaping of ampersands and angle brackets before inserting text into SVG markup. |
| 8 | Defines an SVG text-element helper with coordinates, size, weight, color, alignment, and escaped text content. |
| 9 | Defines an SVG rectangle helper using the supplied position, dimensions, and fill color. |
| 10 | Defines an SVG line helper with configurable endpoints, color, and stroke width. |
| 11 | Defines an embedded-logo helper whose height preserves the logo's 1081-by-557 aspect ratio. |
| 12 | Defines the portrait graphic's SVG content layout. |
| 13 | Begins the ordered array of SVG fragments for the portrait graphic. |
| 14 | Places the embedded Guild logo at the upper left of the portrait graphic. |
| 15 | Adds positioned SVG text in the portrait layout: 'Nevada market update'. These strings are hardcoded graphic content. |
| 16 | Adds positioned SVG text in the portrait layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content. |
| 17 | Adds positioned SVG text in the portrait layout: 'Bonds, rates and'. These strings are hardcoded graphic content. |
| 18 | Adds positioned SVG text in the portrait layout: 'your Nevada home'. These strings are hardcoded graphic content. |
| 19 | Adds positioned SVG text in the portrait layout: 'Higher bond yields can keep'. These strings are hardcoded graphic content. |
| 20 | Adds positioned SVG text in the portrait layout: 'mortgage rates elevated.'. These strings are hardcoded graphic content. |
| 21 | Adds positioned SVG text in the portrait layout: '4.83%'. These strings are hardcoded graphic content. |
| 22 | Adds positioned SVG text in the portrait layout: '10-year Treasury yield'. These strings are hardcoded graphic content. |
| 23 | Adds positioned SVG text in the portrait layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content. |
| 24 | Draws the vertical separator between the Treasury-yield and mortgage-rate figures. |
| 25 | Adds positioned SVG text in the portrait layout: '6.71%'. These strings are hardcoded graphic content. |
| 26 | Adds positioned SVG text in the portrait layout: 'U.S. 30-year fixed average'. These strings are hardcoded graphic content. |
| 27 | Adds positioned SVG text in the portrait layout: 'Sept. 3, 2026'. These strings are hardcoded graphic content. |
| 28 | Draws the yellow divider beneath the portrait graphic's rate figures. |
| 29 | Adds positioned SVG text in the portrait layout: 'August 2026 housing snapshot'. These strings are hardcoded graphic content. |
| 30 | Adds positioned SVG text in the portrait layout: 'Single-family median sale prices'. These strings are hardcoded graphic content. |
| 31 | Draws neutral background panels for the Reno and Las Vegas housing statistics. |
| 32 | Adds positioned SVG text in the portrait layout: 'Reno area'. These strings are hardcoded graphic content. |
| 33 | Adds positioned SVG text in the portrait layout: 'Washoe County*'. These strings are hardcoded graphic content. |
| 34 | Adds positioned SVG text in the portrait layout: '$620,000'. These strings are hardcoded graphic content. |
| 35 | Adds positioned SVG text in the portrait layout: '+5.1% from a year ago'. These strings are hardcoded graphic content. |
| 36 | Adds positioned SVG text in the portrait layout: 'Las Vegas area'. These strings are hardcoded graphic content. |
| 37 | Adds positioned SVG text in the portrait layout: 'Southern Nevada'. These strings are hardcoded graphic content. |
| 38 | Adds positioned SVG text in the portrait layout: '$475,000'. These strings are hardcoded graphic content. |
| 39 | Adds positioned SVG text in the portrait layout: '−1.0% from a year ago'. These strings are hardcoded graphic content. |
| 40 | Adds positioned SVG text in the portrait layout: 'Shop the home price and the monthly payment.'. These strings are hardcoded graphic content. |
| 41 | Adds positioned SVG text in the portrait layout: 'Talk with Guild Mortgage about your budget.'. These strings are hardcoded graphic content. |
| 42 | Draws the horizontal separator above the portrait graphic's disclosures and sources. |
| 43 | Adds positioned SVG text in the portrait layout: 'National mortgage survey average, not a loan offer. Your rate may differ.'. These strings are hardcoded graphic content. |
| 44 | Adds positioned SVG text in the portrait layout: 'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'. These strings are hardcoded graphic content. |
| 45 | Adds positioned SVG text in the portrait layout: 'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'. These strings are hardcoded graphic content. |
| 46 | Adds positioned SVG text in the portrait layout: 'NMLS #3274 \| NV Mortgage Company #1141 \| Equal Housing Opportunity'. These strings are hardcoded graphic content. |
| 47 | Concatenates the portrait SVG fragments without separators and returns the resulting markup. |
| 48 | Ends the portrait layout function. |
| 49 | Defines the square graphic's SVG content layout. |
| 50 | Begins the ordered array of SVG fragments for the square graphic. |
| 51 | Places the embedded Guild logo at the upper left of the square graphic. |
| 52 | Adds positioned SVG text in the square layout: 'Reno • Las Vegas'. These strings are hardcoded graphic content. |
| 53 | Adds positioned SVG text in the square layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content. |
| 54 | Adds positioned SVG text in the square layout: 'Bonds and your home loan'. These strings are hardcoded graphic content. |
| 55 | Adds positioned SVG text in the square layout: 'Higher bond yields can keep mortgage rates elevated.'. These strings are hardcoded graphic content. |
| 56 | Adds positioned SVG text in the square layout: '4.83%'. These strings are hardcoded graphic content. |
| 57 | Adds positioned SVG text in the square layout: '10-year Treasury yield'. These strings are hardcoded graphic content. |
| 58 | Adds positioned SVG text in the square layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content. |
| 59 | Draws the vertical separator between the two rate figures in the square layout. |
| 60 | Adds positioned SVG text in the square layout: '6.71%'. These strings are hardcoded graphic content. |
| 61 | Adds positioned SVG text in the square layout: 'U.S. 30-year fixed average'. These strings are hardcoded graphic content. |
| 62 | Adds positioned SVG text in the square layout: 'Sept. 3, 2026'. These strings are hardcoded graphic content. |
| 63 | Draws the yellow divider above the square layout's housing snapshot. |
| 64 | Adds positioned SVG text in the square layout: 'August 2026 • Single-family median sale prices'. These strings are hardcoded graphic content. |
| 65 | Draws the square layout's neutral background panels for Reno and Las Vegas figures. |
| 66 | Adds positioned SVG text in the square layout: 'Reno area'; 'Washoe County*'. These strings are hardcoded graphic content. |
| 67 | Adds positioned SVG text in the square layout: '$620,000'; '+5.1% from a year ago'. These strings are hardcoded graphic content. |
| 68 | Adds positioned SVG text in the square layout: 'Las Vegas area'; 'Southern Nevada'. These strings are hardcoded graphic content. |
| 69 | Adds positioned SVG text in the square layout: '$475,000'; '−1.0% from a year ago'. These strings are hardcoded graphic content. |
| 70 | Adds positioned SVG text in the square layout: 'Shop the home price and the monthly payment.'. These strings are hardcoded graphic content. |
| 71 | Adds positioned SVG text in the square layout: 'Talk with Guild Mortgage about your budget.'. These strings are hardcoded graphic content. |
| 72 | Draws the horizontal separator above the square layout's disclosures and sources. |
| 73 | Adds positioned SVG text in the square layout: 'National mortgage survey average, not a loan offer. Your rate may differ.'. These strings are hardcoded graphic content. |
| 74 | Adds positioned SVG text in the square layout: 'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'. These strings are hardcoded graphic content. |
| 75 | Adds positioned SVG text in the square layout: 'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'. These strings are hardcoded graphic content. |
| 76 | Adds positioned SVG text in the square layout: 'NMLS #3274 \| NV Mortgage Company #1141 \| Equal Housing Opportunity'. These strings are hardcoded graphic content. |
| 77 | Concatenates the square SVG fragments without separators and returns the resulting markup. |
| 78 | Ends the square layout function. |
| 79 | Defines the complete SVG document wrapper for a supplied height and content fragment. |
| 80 | Returns a 1080-pixel-wide SVG with a white background, Arial text, the supplied layout, and accessible title/description containing the hardcoded market figures. |
| 81 | Ends the SVG document-wrapper helper. |
| 82 | Converts a hexadecimal RGB color to linearized sRGB components and computes weighted relative luminance. |
| 83 | Computes the luminance contrast ratio of two colors using the brighter-over-darker formula with 0.05 offsets. |
| 84 | Starts an immediately invoked asynchronous routine that exports both graphic sizes. |
| 85 | Iterates the portrait (1080 by 1350) and square (1080 by 1080) names, heights, and generated SVG content. |
| 86 | Wraps the current layout content in a complete SVG document of the requested height. |
| 87 | Writes the current SVG document to its named file in the script's output directory. |
| 88 | Rasterizes the in-memory SVG with Sharp and writes the corresponding PNG file. |
| 89 | Reads the generated PNG's metadata with Sharp. |
| 90 | Logs the generated PNG filename, width, and height as JSON. |
| 91 | Ends the loop exporting the portrait and square graphics. |
| 92 | Logs contrast ratios for blue and black on white and neutral backgrounds. |
| 93 | Invokes the export routine, logs any rejected error, and exits the process with status 1 on failure. |
