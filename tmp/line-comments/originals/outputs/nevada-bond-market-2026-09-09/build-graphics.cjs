const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/jorda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out = __dirname;
const logo = fs.readFileSync(path.join(out, 'assets/guild-branches-logo.png')).toString('base64');
const C = {blue:'#262A82',yellow:'#F9C606',black:'#191A1D',white:'#FFFFFF',neutral:'#F6EDE4',gray:'#E8EBEB'};
const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const t = (x,y,size,text,weight=400,color=C.black,anchor='start') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escape(text)}</text>`;
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const line = (x1,y1,x2,y2,stroke=C.gray,width=2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
const brand = (x,y,w) => `<image x="${x}" y="${y}" width="${w}" height="${w*557/1081}" href="data:image/png;base64,${logo}"/>`;
function portrait() {
  return [
    brand(68,60,220),
    t(1012,86,26,'Nevada market update',600,C.blue,'end'),
    t(1012,124,25,'Sept. 9, 2026',400,C.black,'end'),
    t(68,272,66,'Bonds, rates and',700,C.blue),
    t(68,346,66,'your Nevada home',700,C.blue),
    t(68,408,33,'Higher bond yields can keep'),
    t(68,450,33,'mortgage rates elevated.'),
    t(68,590,102,'4.83%',700,C.blue),
    t(68,638,29,'10-year Treasury yield',600),
    t(68,678,26,'Sept. 9, 2026'),
    line(540,512,540,696),
    t(584,590,102,'6.71%',700,C.blue),
    t(584,638,29,'U.S. 30-year fixed average',600),
    t(584,678,26,'Sept. 3, 2026'),
    rect(68,724,944,8,C.yellow),
    t(68,791,31,'August 2026 housing snapshot',700,C.blue),
    t(68,830,26,'Single-family median sale prices'),
    rect(68,858,458,188,C.neutral),rect(554,858,458,188,C.neutral),
    t(91,902,31,'Reno area',700,C.blue),
    t(91,936,24,'Washoe County*'),
    t(91,994,55,'$620,000',700,C.blue),
    t(91,1028,25,'+5.1% from a year ago'),
    t(577,902,31,'Las Vegas area',700,C.blue),
    t(577,936,24,'Southern Nevada'),
    t(577,994,55,'$475,000',700,C.blue),
    t(577,1028,25,'−1.0% from a year ago'),
    t(68,1105,32,'Shop the home price and the monthly payment.',700,C.blue),
    t(68,1148,28,'Talk with Guild Mortgage about your budget.'),
    line(68,1180,1012,1180),
    t(68,1214,22,'National mortgage survey average, not a loan offer. Your rate may differ.'),
    t(68,1243,22,'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'),
    t(68,1272,22,'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'),
    t(68,1310,21,'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity')
  ].join('');
}
function square() {
  return [
    brand(54,44,190),
    t(1026,73,25,'Reno • Las Vegas',600,C.blue,'end'),
    t(1026,108,24,'Sept. 9, 2026',400,C.black,'end'),
    t(54,224,60,'Bonds and your home loan',700,C.blue),
    t(54,274,31,'Higher bond yields can keep mortgage rates elevated.'),
    t(54,391,88,'4.83%',700,C.blue),
    t(54,433,28,'10-year Treasury yield',600),
    t(54,469,25,'Sept. 9, 2026'),
    line(540,323,540,479),
    t(576,391,88,'6.71%',700,C.blue),
    t(576,433,28,'U.S. 30-year fixed average',600),
    t(576,469,25,'Sept. 3, 2026'),
    rect(54,505,972,8,C.yellow),
    t(54,554,29,'August 2026 • Single-family median sale prices',600,C.blue),
    rect(54,578,474,189,C.neutral),rect(552,578,474,189,C.neutral),
    t(77,619,29,'Reno area',700,C.blue),t(77,653,24,'Washoe County*'),
    t(77,712,54,'$620,000',700,C.blue),t(77,747,25,'+5.1% from a year ago'),
    t(575,619,29,'Las Vegas area',700,C.blue),t(575,653,24,'Southern Nevada'),
    t(575,712,54,'$475,000',700,C.blue),t(575,747,25,'−1.0% from a year ago'),
    t(54,824,31,'Shop the home price and the monthly payment.',700,C.blue),
    t(54,865,27,'Talk with Guild Mortgage about your budget.'),
    line(54,895,1026,895),
    t(54,929,22,'National mortgage survey average, not a loan offer. Your rate may differ.'),
    t(54,958,22,'Sources: U.S. Treasury; Freddie Mac; Sierra Nevada REALTORS®;'),
    t(54,987,22,'Las Vegas REALTORS®. *SNR coverage excludes Incline Village.'),
    t(54,1034,21,'NMLS #3274 | NV Mortgage Company #1141 | Equal Housing Opportunity')
  ].join('');
}
function svg(height,content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-label="Guild Mortgage Nevada bonds, mortgage rates and local housing update dated September 9, 2026"><title>Nevada bonds and mortgage market update</title><desc>Ten-year Treasury yield 4.83 percent on September 9, 2026. National average 30-year fixed mortgage 6.71 percent on September 3, 2026. August single-family median prices: Reno area, Washoe County excluding Incline Village, 620,000 dollars, up 5.1 percent year over year; Southern Nevada, 475,000 dollars, down 1.0 percent.</desc><rect width="1080" height="${height}" fill="#FFFFFF"/><g font-family="Arial, sans-serif">${content}</g></svg>`;
}
function lum(hex) { const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
function contrast(a,b) {let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async()=>{
  for(const [name,h,content] of [['nevada-market-portrait',1350,portrait()],['nevada-market-square',1080,square()]]) {
    const source = svg(h,content);
    fs.writeFileSync(path.join(out,name+'.svg'),source);
    await sharp(Buffer.from(source)).png().toFile(path.join(out,name+'.png'));
    const meta=await sharp(path.join(out,name+'.png')).metadata();
    console.log(JSON.stringify({file:name+'.png',width:meta.width,height:meta.height}));
  }
  console.log(JSON.stringify({contrast:{blueOnWhite:contrast(C.blue,C.white),blackOnWhite:contrast(C.black,C.white),blueOnNeutral:contrast(C.blue,C.neutral),blackOnNeutral:contrast(C.black,C.neutral)}}));
})().catch(err=>{console.error(err);process.exit(1);});
