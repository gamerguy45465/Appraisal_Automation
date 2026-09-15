const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const base = path.join(root, 'tmp/line-comments');
fs.mkdirSync(path.join(base, 'originals'), { recursive: true });
fs.mkdirSync(path.join(base, 'notes'), { recursive: true });
const excluded = new Set(['node_modules', '.git', 'dist', 'test-results', 'playwright-report', '.playwright-mcp', 'output', 'outputs', 'tmp']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (excluded.has(e.name) ? [] : walk(path.join(dir,e.name))) : [path.join(dir,e.name)]);
}
const files = walk(root).map(p => path.relative(root,p).replaceAll('\\','/'));
for (const extra of ['output/playwright/diagnose-login.mjs','outputs/nevada-bond-market-2026-09-09/build-graphics.cjs','tmp/pdfs/add_sample_agents.py']) if(fs.existsSync(extra)) files.push(extra);
const manifest = files.sort().map(file => {
  const bytes = fs.readFileSync(file);
  const destination = path.join(base,'originals',file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,bytes);
  const value = bytes.toString('utf8');
  const binary = /\.(pdf|png|jpe?g|webp|ico)$/i.test(file) || bytes.includes(0);
  return { file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), binary, lines: binary ? null : value.split(/\r\n|\n|\r/).length - (/\r?\n$/.test(value) ? 1 : 0) };
});
fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({files:manifest.length,lines:manifest.reduce((n,f)=>n+(f.lines||0),0),manifest:manifest.map(({file,lines})=>({file,lines}))},null,2));
