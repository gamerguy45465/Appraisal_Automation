const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const ts=require('./package/lib/typescript.js');
const base=path.join(process.cwd(),'tmp/line-comments');const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function canonical(file,text){const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,/\.[cm]?js$/.test(file)?ts.ScriptKind.JS:ts.ScriptKind.TS);if(tree.parseDiagnostics.length)throw new Error('Parse failed: '+file);return ts.createPrinter({removeComments:true,newLine:ts.NewLineKind.LineFeed}).printFile(tree);}
let restored=0,unchanged=0,structures=0,explained=0;
for(const entry of manifest){
  const original=fs.readFileSync(path.join(base,'originals',entry.file));if(hash(original)!==entry.sha256)throw new Error('Snapshot changed: '+entry.file);
  const current=fs.readFileSync(entry.file);const recordPath=path.join(base,'applied',entry.file+'.json');
  if(fs.existsSync(recordPath)){
    const record=JSON.parse(fs.readFileSync(recordPath,'utf8'));if(hash(current)!==record.annotatedSha256)throw new Error('Annotated file changed: '+entry.file);
    let stripped=current.toString('utf8');for(const addition of record.additions.slice().reverse()){
      if(stripped.slice(addition.offset,addition.offset+addition.text.length)!==addition.text)throw new Error('Comment mismatch: '+entry.file);
      stripped=stripped.slice(0,addition.offset)+stripped.slice(addition.offset+addition.text.length);
    }
    if(hash(stripped)!==entry.sha256)throw new Error('Original code changed: '+entry.file);restored++;
    if(/\.[cm]?[jt]s$/.test(entry.file)){if(canonical(entry.file,original.toString('utf8'))!==canonical(entry.file,current.toString('utf8')))throw new Error('Structure changed: '+entry.file);structures++;}
  }else{if(!current.equals(original))throw new Error('Unannotated original changed: '+entry.file);unchanged++;}
  if(!entry.binary){
    const companion=fs.readFileSync(path.join(process.cwd(),'docs/line-comments',entry.file+'.md'),'utf8');
    const rows=[...companion.matchAll(/^\| (\d+) \| /gm)].map(m=>Number(m[1]));
    if(rows.length!==entry.lines||rows.some((n,i)=>n!==i+1))throw new Error('Companion coverage incomplete: '+entry.file);explained+=rows.length;
  }
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let compiled=0;
const oldDist=path.join(base,'generated-before-check/dist');
for(const original of walk(oldDist).filter(f=>f.endsWith('.js'))){
  const relative=path.relative(oldDist,original),current=path.join(process.cwd(),'dist',relative);
  if(canonical(relative,fs.readFileSync(original,'utf8'))!==canonical(relative,fs.readFileSync(current,'utf8')))throw new Error('Compiled JavaScript behavior changed: '+relative);
  compiled++;
}
const report={originalFiles:manifest.length,commentOnlyFilesRestoredByteForByte:restored,unchangedOriginalFiles:unchanged,jsTsStructuresIdentical:structures,compiledJsStructuresIdentical:compiled,originalLinesExplained:explained};
fs.writeFileSync(path.join(base,'preservation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
