const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const ts=require('./package/lib/typescript.js');const postcss=require('postcss');
const root=process.cwd(),base=path.join(root,'tmp/line-comments'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const output=path.join(root,'docs/line-comments');fs.mkdirSync(output,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const linesOf=text=>text.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g).filter((line,index,all)=>line!==''||index!==all.length-1);
function tsFile(file,text){return ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,/\.[cm]?js$/.test(file)?ts.ScriptKind.JS:ts.ScriptKind.TS);}
function jsRanges(file,text){
  const source=tsFile(file,text);if(source.parseDiagnostics.length)throw new Error('Original parse error in '+file);
  const spans=[];
  function visit(node){
    const children=node.getChildren(source);
    if(children.length===0&&/[\r\n]/.test(text.slice(node.getStart(source),node.end)))spans.push([node.getStart(source),node.end]);
    for(const p of [node.pos,node.end])for(const comment of [...(ts.getLeadingCommentRanges(text,p)||[]),...(ts.getTrailingCommentRanges(text,p)||[])])if(comment.kind===ts.SyntaxKind.MultiLineCommentTrivia)spans.push([comment.pos,comment.end]);
    for(const child of children)visit(child);
  }visit(source);
  if(text.startsWith('#!'))spans.push([-1,text.indexOf('\n')+1]);
  return spans;
}
function htmlRanges(text){
  const ranges=[];let i=0;
  while(i<text.length){
    if(text.startsWith('<!--',i)){const end=text.indexOf('-->',i+4);ranges.push([i,end<0?text.length:end+3]);i=end<0?text.length:end+3;continue;}
    if(text[i]==='<'){let end=i+1,quote=null;for(;end<text.length;end++){const c=text[end];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;}ranges.push([i,end+1]);
      const start=text.slice(i,end+1),match=start.match(/^<(script|style|textarea|title|noscript|xmp|iframe|noembed|noframes)\b/i);if(match&&!/\/>$/.test(start)){const close=text.toLowerCase().indexOf('</'+match[1].toLowerCase(),end+1);if(close>=0){ranges.push([end+1,close+1]);i=close;continue;}}
      i=end+1;continue;
    }i++;
  }return ranges;
}
function cssRanges(text){
  const spans=[];let quote=null,start=0;
  for(let i=0;i<text.length;i++){
    if(quote){if(text[i]==='\\'){i++;continue;}if(text[i]===quote){spans.push([start,i+1]);quote=null;}continue;}
    if(text.startsWith('/*',i)){const end=text.indexOf('*/',i+2);spans.push([i,end<0?text.length:end+2]);i=end<0?text.length:end+1;}
    else if(text[i]==='"'||text[i]==="'"){quote=text[i];start=i;}
  }return spans;
}
function normalizeJs(file,text){const source=tsFile(file,text);if(source.parseDiagnostics.length)throw new Error('Annotated parse error in '+file);return ts.createPrinter({removeComments:true,newLine:ts.NewLineKind.LineFeed}).printFile(source);}
function normalizeCss(text){const parsed=postcss.parse(text);function canonical(node){const value={type:node.type};for(const key of ['selector','name','params','prop','value','important'])if(node[key]!==undefined)value[key]=node[key];if(node.nodes)value.nodes=node.nodes.filter(n=>n.type!=='comment').map(canonical);return value;}return JSON.stringify(canonical(parsed));}
const results=[];let count=0;
for(const entry of manifest){
  const original=fs.readFileSync(path.join(base,'originals',entry.file));const current=fs.readFileSync(entry.file);
  const previousPath=path.join(base,'applied',entry.file+'.json');
  if(hash(current)!==entry.sha256){
    if(!fs.existsSync(previousPath))throw new Error('File changed outside annotation work: '+entry.file);
    const previous=JSON.parse(fs.readFileSync(previousPath,'utf8'));if(hash(current)!==previous.annotatedSha256)throw new Error('File changed since annotations: '+entry.file);
  }
  if(entry.binary){results.push({...entry,mode:'binary reference; original unchanged',notes:0});continue;}
  const source=original.toString('utf8'),lines=linesOf(source),notesPath=path.join(base,'notes',entry.file+'.json');
  if(!fs.existsSync(notesPath))throw new Error('Missing notes: '+entry.file);
  const notes=JSON.parse(fs.readFileSync(notesPath,'utf8'));
  if(lines.length!==entry.lines)throw new Error('Line count mismatch: '+entry.file+' '+lines.length+'/'+entry.lines);
  for(let i=0;i<lines.length;i++){if(!lines[i].trim()&&!notes[i+1])notes[i+1]='Blank line separating the surrounding declarations, statements, or document blocks.';if(typeof notes[i+1]!=='string'||!notes[i+1].trim())throw new Error('Missing explanation '+entry.file+':'+(i+1));}
  const isJs=/\.[cm]?[jt]s$/.test(entry.file),isCss=entry.file.endsWith('.css'),isHtml=entry.file.endsWith('.html'),isPs=entry.file.endsWith('.ps1'),isPy=entry.file.endsWith('.py'),isIgnore=entry.file==='.gitignore';
  const inline=isJs||isCss||isHtml||isPs||isPy||isIgnore;
  const companion=path.join(output,entry.file+'.md');fs.mkdirSync(path.dirname(companion),{recursive:true});
  const relativeOriginal=path.relative(path.dirname(companion),path.join(root,entry.file)).replaceAll('\\','/');
  let document='# Line explanations: '+entry.file+'\n\nSource: ['+entry.file+']('+relativeOriginal+'). Numbers refer to the original file before comments were added.\n\n'+(inline?'The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.':'The original file is unchanged. These companion notes preserve its strict syntax and rendering.')+'\n\n| Original line | Explanation |\n| ---: | --- |\n';
  for(let i=0;i<lines.length;i++)document+='| '+(i+1)+' | '+notes[i+1].replaceAll('|','\\|').replace(/\r?\n/g,' ').replace(/</g,'&lt;').replace(/>/g,'&gt;')+' |\n';
  fs.writeFileSync(companion,document);
  if(!inline){results.push({...entry,mode:'companion; original unchanged',notes:lines.length});count+=lines.length;continue;}
  let ranges=isJs?jsRanges(entry.file,source):isCss?cssRanges(source):isHtml?htmlRanges(source):[];
  if(isPy){const tokenFile=path.join(base,'python-ranges.json');ranges=JSON.parse(fs.readFileSync(tokenFile,'utf8'));}
  const positions=[];let position=0;for(const line of lines){positions.push(position);position+=line.length;}
  const insertions=new Map();let moved=0;
  for(let i=0;i<lines.length;i++){
    let target=i;
    while(target>=0&&ranges.some(([start,end])=>positions[target]>start&&positions[target]<end))target--;
    if(target<0)throw new Error('No safe insertion location '+entry.file+':'+(i+1));
    if(target!==i)moved++;
    const list=insertions.get(target)||[];list.push({line:i+1,text:notes[i+1]});insertions.set(target,list);
  }
  const newline=source.includes('\r\n')?'\r\n':'\n';const additions=[];let annotated='';
  for(let i=0;i<lines.length;i++){
    const notesHere=insertions.get(i)||[];const indent=lines[i].match(/^[\t ]*/)[0];let extra='';
    for(const note of notesHere){
      const clean=note.text.replace(/[\r\n\u2028\u2029]/g,' ');const label='[L'+note.line+'] '+clean;
      if(isHtml)extra+='<!-- '+label.replaceAll('--','- -')+' -->';
      else if(isCss)extra+=indent+'/* '+label.replaceAll('*/','* /')+' */'+newline;
      else extra+=indent+(isPs||isPy||isIgnore?'# ':'// ')+label+newline;
    }
    additions.push({offset:annotated.length,text:extra});annotated+=extra+lines[i];
  }
  let reconstructed=annotated;for(const addition of [...additions].reverse()){if(reconstructed.slice(addition.offset,addition.offset+addition.text.length)!==addition.text)throw new Error('Insertion mismatch');reconstructed=reconstructed.slice(0,addition.offset)+reconstructed.slice(addition.offset+addition.text.length);}
  if(!Buffer.from(reconstructed).equals(original))throw new Error('Original bytes changed: '+entry.file);
  if(isJs&&normalizeJs(entry.file,source)!==normalizeJs(entry.file,annotated))throw new Error('JavaScript/TypeScript structure changed: '+entry.file);
  if(isCss&&normalizeCss(source)!==normalizeCss(annotated))throw new Error('CSS rules changed: '+entry.file);
  fs.writeFileSync(entry.file,annotated);
  fs.mkdirSync(path.dirname(previousPath),{recursive:true});fs.writeFileSync(previousPath,JSON.stringify({originalSha256:entry.sha256,annotatedSha256:hash(annotated),additions},null,2)+'\n');
  results.push({...entry,mode:'source comments and companion',notes:lines.length,movedLiteralNotes:moved,annotatedSha256:hash(annotated)});count+=lines.length;
}
fs.writeFileSync(path.join(base,'results.json'),JSON.stringify(results,null,2)+'\n');
fs.writeFileSync(path.join(output,'coverage.json'),JSON.stringify({files:results.length,explainedOriginalLines:count,filesWithSourceComments:results.filter(r=>r.mode==='source comments and companion').length,filesWithCompanionOnly:results.filter(r=>r.mode==='companion; original unchanged').length,binaryFiles:results.filter(r=>r.binary).length,entries:results.map(({file,sha256,lines,mode,notes,movedLiteralNotes})=>({file,originalSha256:sha256,originalLines:lines,mode,notes,movedLiteralNotes}))},null,2)+'\n');
let index='# Project line-by-line explanations\n\nThese notes explain the project as it existed before annotation. Original source text, values, prompts, selectors, and executable statements were preserved. Added comments use `[L<number>]` to identify the original line they explain. Blank lines and closing delimiters are included. Comments for multiline literal contents are grouped outside the literal. HTML comments share the existing line so they add no text whitespace.\n\nScope: first-party application source, tests, configuration, documentation, and the existing authored diagnostic/PDF/graphics helpers. Installed dependencies, compiled output, captured third-party portal scripts, caches, logs, browser snapshots, and generated binary assets are not source annotation targets. JSON, Markdown, and SVG are explained in companions to preserve parsing/rendering. The four example PDFs remain unchanged and are listed below because binary files do not have source-code lines.\n\n## Files\n\n| File | Original lines | Annotation |\n| --- | ---: | --- |\n';
for(const result of results)index+='| '+(result.binary?'['+result.file+'](../../'+result.file+')':'['+result.file+']('+result.file+'.md)')+' | '+(result.lines??'binary')+' | '+result.mode+' |\n';
index+='\n## Preservation checks\n\nEvery original file has a SHA-256 entry in [coverage.json](coverage.json). Removing only the recorded inserted comments reproduces each annotated original byte for byte, including line endings. JavaScript/TypeScript parse/print structure and CSS rules are compared before and after annotation. The complete annotation record and original snapshots are in `tmp/line-comments/`. Additional verification results are recorded in [verification.md](verification.md).\n';
fs.writeFileSync(path.join(output,'README.md'),index);
console.log(JSON.stringify({files:results.length,sourceComments:results.filter(r=>r.mode==='source comments and companion').length,explainedLines:count,movedLiteralNotes:results.reduce((n,r)=>n+(r.movedLiteralNotes||0),0)},null,2));
