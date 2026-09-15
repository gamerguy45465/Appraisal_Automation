// [L1] Loads Node's filesystem module for reading the logo and writing generated SVG files.
const fs = require('fs');
// [L2] Loads Node's path module for constructing output and asset paths.
const path = require('path');
// [L3] Loads Sharp from the specified local runtime dependency path to rasterize SVGs and inspect PNG metadata.
const sharp = require('C:/Users/jorda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
// [L4] Uses the script's directory as the output directory.
const out = __dirname;
// [L5] Reads the local Guild logo PNG and encodes it as base64 for embedding directly in SVG markup.
const logo = fs.readFileSync(path.join(out, 'assets/guild-branches-logo.png')).toString('base64');
// [L6] Defines named hexadecimal colors used throughout both graphic layouts.
const C = {blue:'#262A82',yellow:'#F9C606',black:'#191A1D',white:'#FFFFFF',neutral:'#F6EDE4',gray:'#E8EBEB'};
// [L7] Defines escaping of ampersands and angle brackets before inserting text into SVG markup.
const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// [L8] Defines an SVG text-element helper with coordinates, size, weight, color, alignment, and escaped text content.
const t = (x,y,size,text,weight=400,color=C.black,anchor='start') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escape(text)}</text>`;
// [L9] Defines an SVG rectangle helper using the supplied position, dimensions, and fill color.
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
// [L10] Defines an SVG line helper with configurable endpoints, color, and stroke width.
const line = (x1,y1,x2,y2,stroke=C.gray,width=2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
// [L11] Defines an embedded-logo helper whose height preserves the logo's 1081-by-557 aspect ratio.
const brand = (x,y,w) => `<image x="${x}" y="${y}" width="${w}" height="${w*557/1081}" href="data:image/png;base64,${logo}"/>`;
// [L12] Defines the portrait graphic's SVG content layout.
function portrait() {
  // [L13] Begins the ordered array of SVG fragments for the portrait graphic.
  return [
    // [L14] Places the embedded Guild logo at the upper left of the portrait graphic.
    brand(68,60,220),
    // [L15] Adds positioned SVG text in the portrait layout: 'Nevada market update'. These strings are hardcoded graphic content.
    t(1012,86,26,'Nevada market update',600,C.blue,'end'),
    // [L16] Adds positioned SVG text in the portrait layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content.
    t(1012,124,25,'Sept. 9, 2026',400,C.black,'end'),
    // [L17] Adds positioned SVG text in the portrait layout: 'Bonds, rates and'. These strings are hardcoded graphic content.
    t(68,272,66,'Bonds, rates and',700,C.blue),
    // [L18] Adds positioned SVG text in the portrait layout: 'your Nevada home'. These strings are hardcoded graphic content.
    t(68,346,66,'your Nevada home',700,C.blue),
    // [L19] Adds positioned SVG text in the portrait layout: 'Higher bond yields can keep'. These strings are hardcoded graphic content.
    t(68,408,33,'Higher bond yields can keep'),
    // [L20] Adds positioned SVG text in the portrait layout: 'mortgage rates elevated.'. These strings are hardcoded graphic content.
    t(68,450,33,'mortgage rates elevated.'),
    // [L21] Adds positioned SVG text in the portrait layout: '4.83%'. These strings are hardcoded graphic content.
    t(68,590,102,'4.83%',700,C.blue),
    // [L22] Adds positioned SVG text in the portrait layout: '10-year Treasury yield'. These strings are hardcoded graphic content.
    t(68,638,29,'10-year Treasury yield',600),
    // [L23] Adds positioned SVG text in the portrait layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content.
    t(68,678,26,'Sept. 9, 2026'),
    // [L24] Draws the vertical separator between the Treasury-yield and mortgage-rate figures.
    line(540,512,540,696),
    // [L25] Adds positioned SVG text in the portrait layout: '6.71%'. These strings are hardcoded graphic content.
    t(584,590,102,'6.71%',700,C.blue),
    // [L26] Adds positioned SVG text in the portrait layout: 'U.S. 30-year fixed average'. These strings are hardcoded graphic content.
    t(584,638,29,'U.S. 30-year fixed average',600),
    // [L27] Adds positioned SVG text in the portrait layout: 'Sept. 3, 2026'. These strings are hardcoded graphic content.
    t(584,678,26,'Sept. 3, 2026'),
    // [L28] Draws the yellow divider beneath the portrait graphic's rate figures.
    rect(68,724,944,8,C.yellow),
    // [L29] Adds positioned SVG text in the portrait layout: 'August 2026 housing snapshot'. These strings are hardcoded graphic content.
    t(68,791,31,'August 2026 housing snapshot',700,C.blue),
    // [L30] Adds positioned SVG text in the portrait layout: 'Single-family median sale prices'. These strings are hardcoded graphic content.
    t(68,830,26,'Single-family median sale prices'),
    // [L31] Draws neutral background panels for the Reno and Las Vegas housing statistics.
    rect(68,858,458,188,C.neutral),rect(554,858,458,188,C.neutral),
    // [L32] Adds positioned SVG text in the portrait layout: 'Reno area'. These strings are hardcoded graphic content.
    t(91,902,31,'Reno area',700,C.blue),
    // [L33] Adds positioned SVG text in the portrait layout: 'Washoe County*'. These strings are hardcoded graphic content.
    t(91,936,24,'Washoe County*'),
    // [L34] Adds positioned SVG text in the portrait layout: '$620,000'. These strings are hardcoded graphic content.
    t(91,994,55,'$620,000',700,C.blue),
    // [L35] Adds positioned SVG text in the portrait layout: '+5.1% from a year ago'. These strings are hardcoded graphic content.
    t(91,1028,25,'+5.1% from a year ago'),
    // [L36] Adds positioned SVG text in the portrait layout: 'Las Vegas area'. These strings are hardcoded graphic content.
    t(577,902,31,'Las Vegas area',700,C.blue),
    // [L37] Adds positioned SVG text in the portrait layout: 'Southern Nevada'. These strings are hardcoded graphic content.
    t(577,936,24,'Southern Nevada'),
    // [L38] Adds positioned SVG text in the portrait layout: '$475,000'. These strings are hardcoded graphic content.
    t(577,994,55,'$475,000',700,C.blue),
    // [L39] Adds positioned SVG text in the portrait layout: '−1.0% from a year ago'. These strings are hardcoded graphic content.
    t(577,1028,25,'−1.0% from a year ago'),
    // [L40] Adds positioned SVG text in the portrait layout: 'Shop the home price and the monthly payment.'. These strings are hardcoded graphic content.
    t(68,1105,32,'Shop the home price and the monthly payment.',700,C.blue),
    // [L41] Adds positioned SVG text in the portrait layout: 'Talk with Guild Mortgage about your budget.'. These strings are hardcoded graphic content.
    t(68,1148,28,'Talk with Guild Mortgage about your budget.'),
    // [L42] Draws the horizontal separator above the portrait graphic's disclosures and sources.
    line(68,1180,1012,1180),
    // [L43] Adds positioned SVG text in the portrait layout: 'National mortgage survey average, not a loan offer. Your rate may differ.'. These strings are hardcoded graphic content.
    t(68,1214,22,'National mortgage survey average, not a loan offer. Your rate may differ.'),
    // [L44] Adds positioned SVG text in the portrait layout: 'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'. These strings are hardcoded graphic content.
    t(68,1243,22,'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'),
    // [L45] Adds positioned SVG text in the portrait layout: 'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'. These strings are hardcoded graphic content.
    t(68,1272,22,'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'),
    // [L46] Adds positioned SVG text in the portrait layout: 'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity'. These strings are hardcoded graphic content.
    t(68,1310,21,'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity')
  // [L47] Concatenates the portrait SVG fragments without separators and returns the resulting markup.
  ].join('');
// [L48] Ends the portrait layout function.
}
// [L49] Defines the square graphic's SVG content layout.
function square() {
  // [L50] Begins the ordered array of SVG fragments for the square graphic.
  return [
    // [L51] Places the embedded Guild logo at the upper left of the square graphic.
    brand(54,44,190),
    // [L52] Adds positioned SVG text in the square layout: 'Reno • Las Vegas'. These strings are hardcoded graphic content.
    t(1026,73,25,'Reno • Las Vegas',600,C.blue,'end'),
    // [L53] Adds positioned SVG text in the square layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content.
    t(1026,108,24,'Sept. 9, 2026',400,C.black,'end'),
    // [L54] Adds positioned SVG text in the square layout: 'Bonds and your home loan'. These strings are hardcoded graphic content.
    t(54,224,60,'Bonds and your home loan',700,C.blue),
    // [L55] Adds positioned SVG text in the square layout: 'Higher bond yields can keep mortgage rates elevated.'. These strings are hardcoded graphic content.
    t(54,274,31,'Higher bond yields can keep mortgage rates elevated.'),
    // [L56] Adds positioned SVG text in the square layout: '4.83%'. These strings are hardcoded graphic content.
    t(54,391,88,'4.83%',700,C.blue),
    // [L57] Adds positioned SVG text in the square layout: '10-year Treasury yield'. These strings are hardcoded graphic content.
    t(54,433,28,'10-year Treasury yield',600),
    // [L58] Adds positioned SVG text in the square layout: 'Sept. 9, 2026'. These strings are hardcoded graphic content.
    t(54,469,25,'Sept. 9, 2026'),
    // [L59] Draws the vertical separator between the two rate figures in the square layout.
    line(540,323,540,479),
    // [L60] Adds positioned SVG text in the square layout: '6.71%'. These strings are hardcoded graphic content.
    t(576,391,88,'6.71%',700,C.blue),
    // [L61] Adds positioned SVG text in the square layout: 'U.S. 30-year fixed average'. These strings are hardcoded graphic content.
    t(576,433,28,'U.S. 30-year fixed average',600),
    // [L62] Adds positioned SVG text in the square layout: 'Sept. 3, 2026'. These strings are hardcoded graphic content.
    t(576,469,25,'Sept. 3, 2026'),
    // [L63] Draws the yellow divider above the square layout's housing snapshot.
    rect(54,505,972,8,C.yellow),
    // [L64] Adds positioned SVG text in the square layout: 'August 2026 • Single-family median sale prices'. These strings are hardcoded graphic content.
    t(54,554,29,'August 2026 • Single-family median sale prices',600,C.blue),
    // [L65] Draws the square layout's neutral background panels for Reno and Las Vegas figures.
    rect(54,578,474,189,C.neutral),rect(552,578,474,189,C.neutral),
    // [L66] Adds positioned SVG text in the square layout: 'Reno area'; 'Washoe County*'. These strings are hardcoded graphic content.
    t(77,619,29,'Reno area',700,C.blue),t(77,653,24,'Washoe County*'),
    // [L67] Adds positioned SVG text in the square layout: '$620,000'; '+5.1% from a year ago'. These strings are hardcoded graphic content.
    t(77,712,54,'$620,000',700,C.blue),t(77,747,25,'+5.1% from a year ago'),
    // [L68] Adds positioned SVG text in the square layout: 'Las Vegas area'; 'Southern Nevada'. These strings are hardcoded graphic content.
    t(575,619,29,'Las Vegas area',700,C.blue),t(575,653,24,'Southern Nevada'),
    // [L69] Adds positioned SVG text in the square layout: '$475,000'; '−1.0% from a year ago'. These strings are hardcoded graphic content.
    t(575,712,54,'$475,000',700,C.blue),t(575,747,25,'−1.0% from a year ago'),
    // [L70] Adds positioned SVG text in the square layout: 'Shop the home price and the monthly payment.'. These strings are hardcoded graphic content.
    t(54,824,31,'Shop the home price and the monthly payment.',700,C.blue),
    // [L71] Adds positioned SVG text in the square layout: 'Talk with Guild Mortgage about your budget.'. These strings are hardcoded graphic content.
    t(54,865,27,'Talk with Guild Mortgage about your budget.'),
    // [L72] Draws the horizontal separator above the square layout's disclosures and sources.
    line(54,895,1026,895),
    // [L73] Adds positioned SVG text in the square layout: 'National mortgage survey average, not a loan offer. Your rate may differ.'. These strings are hardcoded graphic content.
    t(54,929,22,'National mortgage survey average, not a loan offer. Your rate may differ.'),
    // [L74] Adds positioned SVG text in the square layout: 'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'. These strings are hardcoded graphic content.
    t(54,958,22,'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'),
    // [L75] Adds positioned SVG text in the square layout: 'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'. These strings are hardcoded graphic content.
    t(54,987,22,'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'),
    // [L76] Adds positioned SVG text in the square layout: 'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity'. These strings are hardcoded graphic content.
    t(54,1034,21,'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity')
  // [L77] Concatenates the square SVG fragments without separators and returns the resulting markup.
  ].join('');
// [L78] Ends the square layout function.
}
// [L79] Defines the complete SVG document wrapper for a supplied height and content fragment.
function svg(height,content) {
  // [L80] Returns a 1080-pixel-wide SVG with a white background, Arial text, the supplied layout, and accessible title/description containing the hardcoded market figures.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-label="Guild Mortgage Nevada bonds, mortgage rates and local housing update dated September 9, 2026"><title>Nevada bonds and mortgage market update</title><desc>Ten-year Treasury yield 4.83 percent on September 9, 2026. National average 30-year fixed mortgage 6.71 percent on September 3, 2026. August single-family median prices: Reno area, Washoe County excluding Incline Village, 620,000 dollars, up 5.1 percent year over year; Southern Nevada, 475,000 dollars, down 1.0 percent.</desc><rect width="1080" height="${height}" fill="#FFFFFF"/><g font-family="Arial, sans-serif">${content}</g></svg>`;
// [L81] Ends the SVG document-wrapper helper.
}
// [L82] Converts a hexadecimal RGB color to linearized sRGB components and computes weighted relative luminance.
function lum(hex) { const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
// [L83] Computes the luminance contrast ratio of two colors using the brighter-over-darker formula with 0.05 offsets.
function contrast(a,b) {let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
// [L84] Starts an immediately invoked asynchronous routine that exports both graphic sizes.
(async()=>{
  // [L85] Iterates the portrait (1080 by 1350) and square (1080 by 1080) names, heights, and generated SVG content.
  for(const [name,h,content] of [['nevada-market-portrait',1350,portrait()],['nevada-market-square',1080,square()]]) {
    // [L86] Wraps the current layout content in a complete SVG document of the requested height.
    const source = svg(h,content);
    // [L87] Writes the current SVG document to its named file in the script's output directory.
    fs.writeFileSync(path.join(out,name+'.svg'),source);
    // [L88] Rasterizes the in-memory SVG with Sharp and writes the corresponding PNG file.
    await sharp(Buffer.from(source)).png().toFile(path.join(out,name+'.png'));
    // [L89] Reads the generated PNG's metadata with Sharp.
    const meta=await sharp(path.join(out,name+'.png')).metadata();
    // [L90] Logs the generated PNG filename, width, and height as JSON.
    console.log(JSON.stringify({file:name+'.png',width:meta.width,height:meta.height}));
  // [L91] Ends the loop exporting the portrait and square graphics.
  }
  // [L92] Logs contrast ratios for blue and black on white and neutral backgrounds.
  console.log(JSON.stringify({contrast:{blueOnWhite:contrast(C.blue,C.white),blackOnWhite:contrast(C.black,C.white),blueOnNeutral:contrast(C.blue,C.neutral),blackOnNeutral:contrast(C.black,C.neutral)}}));
// [L93] Invokes the export routine, logs any rejected error, and exits the process with status 1 on failure.
})().catch(err=>{console.error(err);process.exit(1);});
