const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const ts=require('./package/lib/typescript.js');
const base=path.join(process.cwd(),'tmp/line-comments');const manifestPath=path.join(base,'manifest.json');const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const extraRoot='outputs/nevada-bond-market-2026-09-09';
for(const name of fs.readdirSync(extraRoot).filter(n=>/\.(md|svg)$/.test(n))) {
  const file=extraRoot+'/'+name;if(manifest.some(e=>e.file===file))continue;
  const bytes=fs.readFileSync(file),text=bytes.toString('utf8'),destination=path.join(base,'originals',file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
  manifest.push({file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),binary:false,lines:text.split(/\r\n|\n|\r/).length-(/\r?\n$/.test(text)?1:0)});
}
manifest.sort((a,b)=>a.file.localeCompare(b.file));fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
function write(file,notes){const out=path.join(base,'notes',file+'.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(notes,null,2)+'\n');}
write('playwright.config.ts',{1:'Import Playwright\'s typed configuration helper.',2:'Export the browser-test configuration through defineConfig.',3:'Find spec.ts tests under tests, disable full parallel execution, and run with one worker.',4:'Allow 30 seconds per test; use headless browsers with traces and screenshots disabled.',5:'Finish the browser-test configuration and its export.'});
write('vitest.config.ts',{1:'Import Vitest\'s typed configuration helper.',2:'Export a configuration that selects tests/**/*.test.ts and permits 15 seconds per test.'});
const meanings={
name:'Names the npm package',version:'Records the exact package version',private:'Prevents npm publication when true',type:'Selects the JavaScript module interpretation',description:'Describes the package purpose',lockfileVersion:'Selects npm\'s lockfile format version',requires:'Records that the lockfile tracks dependency requirements',
dependencies:'Starts the runtime dependency requirements',devDependencies:'Starts the development and test dependency requirements',optionalDependencies:'Starts dependencies that may be omitted if installation fails or the platform differs',peerDependencies:'Starts compatibility requirements for packages supplied by the consumer',peerDependenciesMeta:'Starts metadata about whether peer packages are optional',engines:'Starts supported runtime/tool version constraints',
resolved:'Records the package archive download location',integrity:'Records the archive checksum used to verify downloaded bytes',license:'Records the package\'s declared license',dev:'Marks this installation record as needed only for development when true',optional:'Marks this record or peer dependency as optional when true',devOptional:'Marks a package that participates in development/optional dependency paths',hasInstallScript:'Records that the dependency has an installation lifecycle script',peer:'Records that this installation satisfies a peer dependency',
os:'Lists supported operating systems for this dependency',cpu:'Lists supported processor architectures',libc:'Lists supported C-library implementations',funding:'Records where this dependency accepts financial support',bin:'Maps executable command names to package entry points',exports:'Controls which package entry points may be imported',
compilerOptions:'Starts TypeScript compiler settings',include:'Lists file patterns included by this configuration',exclude:'Lists paths omitted from this configuration',extends:'Loads the base TypeScript configuration before applying these overrides',
target:'Selects the ECMAScript language level of emitted code',module:'Uses Node-aware module emission and interpretation',moduleResolution:'Uses Node-aware import resolution',lib:'Selects built-in runtime/browser declaration libraries',strict:'Enables the group of strict TypeScript checks',noUncheckedIndexedAccess:'Adds possible undefined to unchecked index-access types',esModuleInterop:'Enables compatibility helpers for CommonJS imports',skipLibCheck:'Skips checking declaration-file contents',forceConsistentCasingInFileNames:'Requires consistent filename capitalization in imports',resolveJsonModule:'Allows typed JSON imports',types:'Limits automatically included ambient type packages',rootDir:'Sets the source root used to lay out emitted files',outDir:'Sets the output directory for compiled files',sourceMap:'Emits source maps alongside compiled JavaScript',
scripts:'Starts the npm command aliases',dev:'Runs the TypeScript server directly during development',build:'Compiles the production TypeScript configuration',start:'Starts the compiled Node server',typecheck:'Checks TypeScript without emitting files',test:'Runs the unit/integration suite once','test:browser':'Runs the Playwright browser suite',check:'Runs type checking, unit/integration tests, browser tests, and the production build in sequence','browsers:install':'Installs Playwright\'s Chromium browser runtime'
};
for(const entry of manifest.filter(e=>e.file.endsWith('.json'))) {
  const text=fs.readFileSync(path.join(base,'originals',entry.file),'utf8'),source=ts.parseJsonText(entry.file,text),notes={},lines=text.split(/\r\n|\n|\r/).slice(0,entry.lines);
  const paths=new Map();
  function walk(node,trail=[]){paths.set(node,trail);ts.forEachChild(node,child=>walk(child,ts.isPropertyAssignment(node)?[...trail,node.name.text]:trail));}
  walk(source);
  const objects=[];
  function visit(node){
    if(ts.isObjectLiteralExpression(node)||ts.isArrayLiteralExpression(node))objects.push(node);
    if(ts.isPropertyAssignment(node)){
      const key=node.name.text,trail=paths.get(node)||[],parent=trail.at(-1)||'root',jsonPath=[...trail,key].map(k=>k===''?'(root package)':k).join(' / '),line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
      let note;
      const scalar=!(ts.isObjectLiteralExpression(node.initializer)||ts.isArrayLiteralExpression(node.initializer));
      const raw=node.initializer.getText(source);const rendered=raw.length>180?raw.slice(0,177)+'...':raw;
      if(parent==='packages')note='Start the locked installation record for '+(key||'the root project package')+'.';
      else if(['dependencies','devDependencies','optionalDependencies','peerDependencies'].includes(parent))note='Require package '+JSON.stringify(key)+' with version constraint '+rendered+' under '+jsonPath+'.';
      else if(parent==='scripts')note=(meanings[key]||'Define npm command '+key)+': '+rendered+'.';
      else if(key==='dev')note='Mark '+jsonPath+' as development-only when this value is true: '+rendered+'.';
      else if(key==='type'&&trail.includes('funding'))note='Name the funding service or sponsorship category for '+jsonPath+': '+rendered+'.';
      else if(meanings[key])note=meanings[key]+' at '+jsonPath+(scalar?': '+rendered:': values follow')+'.';
      else if(parent==='engines')note='Require runtime/tool '+key+' to satisfy '+rendered+' for '+trail.slice(0,-1).join(' / ')+'.';
      else if(key==='packages')note='Start the complete locked package-installation map.';
      else note=(scalar?'Set ':'Start ')+jsonPath+(scalar?' to '+rendered:': nested settings follow')+'.';
      notes[line]=(notes[line]?notes[line]+' ':'')+note;
    }ts.forEachChild(node,visit);
  }visit(source);
  for(let i=0;i<lines.length;i++)if(!notes[i+1]){
    const line=lines[i].trim();if(!line){notes[i+1]='Blank line separating configuration entries.';continue;}
    if(i===0&&line==='{'){notes[i+1]='Open the root JSON object containing this file\'s configuration or dependency records.';continue;}
    const pos=source.getPositionOfLineAndCharacter(i,Math.max(0,lines[i].search(/\S/))),obj=objects.filter(n=>n.getStart(source)<pos&&n.end>=pos).sort((a,b)=>(a.end-a.pos)-(b.end-b.pos))[0];
    const label=obj?(paths.get(obj)||[]).join(' / ')||'root JSON object':'containing JSON value';
    notes[i+1]=/^[}\]],?$/.test(line)?'Close '+label+' and preserve the surrounding JSON separators.':'Provide array entry '+line.replace(/,$/,'')+' for '+label+'.';
  }write(entry.file,notes);
}
for(const entry of manifest.filter(e=>e.file.endsWith('.md')||e.file.endsWith('.svg')||e.file==='.gitignore')){
  const text=fs.readFileSync(path.join(base,'originals',entry.file),'utf8'),lines=text.split(/\r\n|\n|\r/).slice(0,entry.lines),notes={};let heading='document introduction',fenced=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();let note;
    if(!line)note='Blank line separating adjacent document blocks.';
    else if(entry.file==='.gitignore')note=line.startsWith('!')?'Keep '+line.slice(1)+' eligible for Git tracking despite an earlier ignore rule.':'Tell Git to ignore matching '+(line.endsWith('/')?'directories':'files')+' using the pattern '+line+'.';
    else if(entry.file.endsWith('.svg')){
      const tags=[...line.matchAll(/<\/?([A-Za-z][\w:-]*)/g)].map(m=>m[1]);
      const labels=[...line.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m=>m[1]);
      note=labels.length?'Draw the visible SVG text '+labels.map(JSON.stringify).join(', ')+'.':tags.length?'Define or close the SVG '+[...new Set(tags)].join(', ')+' elements with the coordinates, styling, and asset references on this line.':'Provide literal SVG data used by the surrounding drawing element.';
    }
    else if(/^#{1,6} /.test(line)){heading=line.replace(/^#+ /,'');note='Introduce the '+JSON.stringify(heading)+' section of this document.';}
    else if(line.startsWith('```')){fenced=!fenced;note=fenced?'Open a literal code/command example'+(line.slice(3)?' labeled '+line.slice(3):'')+'.':'Close the preceding literal code/command example.';}
    else if(fenced)note='Show this literal command, path, or recorded diagnostic step in the documentation: '+line+'.';
    else if(/^\|[\s|:-]+\|$/.test(line))note='Separate the table header from its rows and specify Markdown column alignment.';
    else if(line.startsWith('|'))note='Provide the table columns/row under '+JSON.stringify(heading)+': '+line.slice(1,-1).split('|').map(s=>s.trim()).join('; ')+'.';
    else if(line==='---')note='Delimit the skill\'s YAML metadata block.';
    else if(/^name:/.test(line))note='Declare the reusable skill\'s lookup name.';
    else if(/^description:/.test(line))note='Describe the project maintenance tasks for which this skill is intended.';
    else {const clean=line.replace(/^(?:- |\d+\. )/,'').replace(/`/g,'');const sentence=clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||clean;note=(/^[-\d]/.test(line)?'Record this item':'Document this statement')+' under '+JSON.stringify(heading)+': '+(sentence.length>430?sentence.slice(0,427)+'...':sentence);}
    notes[i+1]=note;
  }write(entry.file,notes);
}
console.log('Prepared configuration, dependency-lock, documentation, ignore-rule, and SVG line notes. Manifest files: '+manifest.length);
