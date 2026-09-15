const fs = require('node:fs');
const path = require('node:path');
const ts = require('./package/lib/typescript.js');
const base = path.join(process.cwd(),'tmp/line-comments');
const manifest = JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const compact = value => value.replace(/\s+/g,' ').trim();
const clip = (value,max=180) => value.length>max ? value.slice(0,max-3)+'...' : value;
let source;
const raw = node => node ? clip(compact(node.getText(source))) : 'an omitted value';
const singleLine = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line === source.getLineAndCharacterOfPosition(node.end).line;
function value(node,depth=0) {
  if(!node) return 'an omitted value';
  if(depth>3) return '`'+raw(node)+'`';
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)) return JSON.stringify(clip(node.text,150));
  if(ts.isNumericLiteral(node)) return node.text;
  if(node.kind===ts.SyntaxKind.NullKeyword) return 'null (unknown or absent)';
  if(node.kind===ts.SyntaxKind.TrueKeyword) return 'true';
  if(node.kind===ts.SyntaxKind.FalseKeyword) return 'false';
  if(ts.isIdentifier(node)) return '`'+node.text+'`';
  if(ts.isAsExpression(node)||ts.isTypeAssertionExpression(node)||ts.isNonNullExpression(node)||ts.isParenthesizedExpression(node)) return value(node.expression,depth+1);
  if(ts.isAwaitExpression(node)) return 'the resolved value from '+value(node.expression,depth+1).replace(/^the result of /,'');
  if(ts.isArrowFunction(node)||ts.isFunctionExpression(node)) return 'a '+(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.AsyncKeyword)?'promise-returning ':'')+'callback'+(ts.isBlock(node.body)?(singleLine(node.body)?' that performs: '+node.body.statements.map(describe).filter(Boolean).join(' '):' whose body follows'):' that returns '+value(node.body,depth+1));
  if(ts.isArrayLiteralExpression(node)) return node.elements.length ? 'an array containing '+node.elements.map(n=>value(n,depth+1)).join(', ') : 'an empty array';
  if(ts.isObjectLiteralExpression(node)) return node.properties.length ? (singleLine(node)?'an object containing '+node.properties.map(p=>ts.isSpreadAssignment(p)?'values copied from '+value(p.expression,depth+1):ts.isPropertyAssignment(p)?raw(p.name)+': '+value(p.initializer,depth+1):p.name?raw(p.name):raw(p)).join(', '):'an object whose fields are defined below') : 'an empty object';
  if(ts.isTemplateExpression(node)) return 'text interpolating '+node.templateSpans.map(s=>value(s.expression,depth+1)).join(', ');
  if(ts.isNewExpression(node)) return 'a new `'+raw(node.expression)+'` instance'+(node.arguments?.length?' initialized with '+node.arguments.map(n=>value(n,depth+1)).join(', '):'');
  if(ts.isCallExpression(node)) return 'the result of `'+raw(node.expression)+'`'+(node.arguments.length?' using '+node.arguments.map(n=>value(n,depth+1)).join(', '):' with no arguments');
  if(ts.isBinaryExpression(node)) {
    const op=node.operatorToken.getText(source);
    const words={'===':'strictly equals','!==':'does not strictly equal','==':'loosely equals','!=':'does not loosely equal','&&':'and','||':'or','??':'or, if null/undefined,','+':'plus','-':'minus','*':'times','/':'divided by','>':'is greater than','<':'is less than','>=':'is at least','<=':'is at most','in':'is a property in','instanceof':'is an instance of'};
    return value(node.left,depth+1)+' '+(words[op]||op)+' '+value(node.right,depth+1);
  }
  if(ts.isConditionalExpression(node)) return value(node.whenTrue,depth+1)+' when '+value(node.condition,depth+1)+', otherwise '+value(node.whenFalse,depth+1);
  if(ts.isPrefixUnaryExpression(node)&&node.operator===ts.SyntaxKind.ExclamationToken) return 'the negation of '+value(node.operand,depth+1);
  return '`'+raw(node)+'`';
}
function call(node) {
  const name=raw(node.expression),args=node.arguments;
  let root=node;
  while(ts.isCallExpression(root)||ts.isPropertyAccessExpression(root)||ts.isElementAccessExpression(root)) root=root.expression;
  const rootName=raw(root);
  if(['it','test','describe'].includes(rootName)) {
    const title=args.find(a=>ts.isStringLiteral(a)||ts.isNoSubstitutionTemplateLiteral(a));
    if(title) return (rootName==='describe'?'Group regression tests for ':`Register ${name.includes('.each')?'a parameterized ':'a '}test that `)+JSON.stringify(title.text)+'.';
  }
  if(['beforeEach','afterEach','beforeAll','afterAll'].includes(name)) return {beforeEach:'Run this setup before every test in the group.',afterEach:'Run this cleanup after every test in the group.',beforeAll:'Run this setup once before the test group.',afterAll:'Run this cleanup once after the test group.'}[name]+(singleLine(node)&&args[0]?' Use '+value(args[0])+'.':'');
  if(name==='vi.mock') return 'Replace imports from '+value(args[0])+' with the synthetic exports supplied by this mock factory.';
  if(name==='vi.stubEnv') return 'Temporarily set environment variable '+value(args[0])+' to '+value(args[1])+' for this test.';
  if(name==='vi.stubGlobal') return 'Temporarily replace global '+value(args[0])+' with '+value(args[1])+'.';
  const method=ts.isPropertyAccessExpression(node.expression)?node.expression.name.text:'';
  if(rootName==='expect') {
    let assertion=node.expression,expectCall;
    function find(n){if(ts.isCallExpression(n)&&raw(n.expression).match(/^expect(?:\.poll|\.soft)?$/))expectCall=n; else if(n.expression)find(n.expression);}
    find(assertion);
    const subject=expectCall?value(expectCall.arguments[0]):'the observed value';
    const negate=/\.not(?:\.|$)/.test(name), expected=args.map(a=>value(a)).join(', ');
    const verbs={toBe:'strictly equals',toEqual:'deeply equals',toStrictEqual:'strictly matches the structure of',toMatchObject:'contains the expected object fields',toContain:'contains',toContainEqual:'contains a deeply equal entry',toHaveLength:'has length',toBeTruthy:'is truthy',toBeFalsy:'is falsy',toBeNull:'is null',toBeUndefined:'is undefined',toBeDefined:'is defined',toBeInstanceOf:'is an instance of',toHaveBeenCalled:'was called',toHaveBeenCalledOnce:'was called exactly once',toHaveBeenCalledTimes:'was called this many times:',toHaveBeenCalledWith:'was called with',toHaveBeenCalledExactlyOnceWith:'was called exactly once with',toHaveBeenLastCalledWith:'was last called with',toHaveBeenNthCalledWith:'has the specified numbered invocation and arguments',toBeGreaterThan:'is greater than',toBeGreaterThanOrEqual:'is at least',toBeLessThan:'is less than',toBeLessThanOrEqual:'is at most',toMatch:'matches',toThrow:'throws an error matching',toThrowError:'throws an error matching',toHaveValue:'has form value',toBeChecked:'is checked',toBeVisible:'is visible',toBeHidden:'is hidden',toBeDisabled:'is disabled',toBeEnabled:'is enabled',toHaveText:'has text',toContainText:'contains text',toHaveAttribute:'has the specified attribute/value',toHaveCount:'has this many matching elements:',toHaveURL:'has URL',toHaveTitle:'has page title'};
    if(verbs[method]) return 'Assert that '+subject+(name.includes('.rejects.')?' rejects and the rejection':name.includes('.resolves.')?' resolves and the result':'')+' '+(negate?'does not satisfy: ':'')+verbs[method]+(expected?' '+expected:'')+'.';
  }
  if(method.startsWith('mock')) {
    const target=raw(node.expression.expression);
    const actions={mockReturnValue:'return',mockReturnValueOnce:'return on its next call',mockResolvedValue:'resolve to',mockResolvedValueOnce:'resolve on its next call to',mockRejectedValue:'reject with',mockRejectedValueOnce:'reject on its next call with',mockImplementation:'run',mockImplementationOnce:'run on its next call',mockRestore:'restore its original implementation',mockClear:'clear its recorded calls',mockReset:'clear its implementation and call history'};
    if(actions[method])return 'Configure mock `'+target+'` to '+actions[method]+(args.length?' '+args.map(a=>value(a)).join(', '):'')+'.';
  }
  const special={
    'vi.useFakeTimers':'Replace real timers with controllable test timers.', 'vi.useRealTimers':'Restore real timer behavior.',
    'vi.resetAllMocks':'Reset all mock implementations and recorded calls.', 'vi.clearAllMocks':'Clear recorded calls from all mocks.',
    'vi.clearAllTimers':'Discard pending fake timers.', 'vi.unstubAllEnvs':'Restore all temporarily replaced environment variables.',
    'vi.unstubAllGlobals':'Restore all temporarily replaced global values.'};
  if(special[name])return special[name];
  if(name==='vi.advanceTimersByTimeAsync')return 'Advance fake time by '+value(args[0])+' milliseconds and settle timer-triggered asynchronous work.';
  if(method==='goto')return 'Navigate `'+raw(node.expression.expression)+'` to '+value(args[0])+(args[1]?' with '+value(args[1]):'')+'.';
  if(method==='fill')return 'Replace the matched form control text with '+value(args[0])+'.';
  if(method==='click')return 'Click `'+raw(node.expression.expression)+'`'+(args.length?' with '+args.map(a=>value(a)).join(', '):'')+' in the synthetic browser test.';
  if(method==='evaluate')return 'Run the supplied fixture callback in the browser page'+(args[1]?', passing '+value(args[1]):'')+'.';
  if(method==='setContent')return 'Load '+value(args[0])+' as the browser page HTML fixture.';
  if(method==='route')return 'Intercept requests matching '+value(args[0])+' and handle them with the synthetic route callback.';
  if(method==='fulfill')return 'Answer the intercepted browser request with '+value(args[0])+'.';
  if(method==='abort')return 'Abort `'+raw(node.expression.expression)+'`'+(args.length?' with '+args.map(a=>value(a)).join(', '):'')+'.';
  if(method==='push')return 'Append '+args.map(a=>value(a)).join(', ')+' to `'+raw(node.expression.expression)+'` for later inspection.';
  if(method==='close')return 'Close `'+raw(node.expression.expression)+'` and release its test resources.';
  return 'Call `'+name+'`'+(args.length?' with '+args.map(a=>value(a)).join(', '):' without arguments')+'.';
}
function expression(node) {
  if(ts.isAwaitExpression(node)) {
    const description=expression(node.expression);
    if(description.startsWith('Assert '))return description+' Wait for the asynchronous assertion to settle.';
    if(description.startsWith('Evaluate '))return 'Wait for '+value(node.expression)+' to settle before continuing.';
    return description+' Wait for completion before continuing.';
  }
  if(ts.isCallExpression(node))return call(node);
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment)return 'Assign '+value(node.right)+' to `'+raw(node.left)+'`'+(node.operatorToken.kind===ts.SyntaxKind.EqualsToken?'':', using '+node.operatorToken.getText(source))+'.';
  if(ts.isPostfixUnaryExpression(node))return (node.operator===ts.SyntaxKind.PlusPlusToken?'Increment ':'Decrement ')+value(node.operand)+' by one.';
  if(ts.isDeleteExpression(node))return 'Delete property '+value(node.expression)+' from the fixture object.';
  return 'Evaluate '+value(node)+'.';
}
function describe(node) {
  if(ts.isImportDeclaration(node))return 'Import '+raw(node.importClause)+' from '+value(node.moduleSpecifier)+' for these regression tests.';
  if(ts.isVariableStatement(node))return node.declarationList.declarations.map(d=>'Declare `'+raw(d.name)+'`'+(d.initializer?' as '+value(d.initializer):' for assignment later')+'.').join(' ');
  if(ts.isExpressionStatement(node))return expression(node.expression);
  if(ts.isReturnStatement(node))return node.expression?'Return '+value(node.expression)+' to the caller.':'Return immediately without a value.';
  if(ts.isThrowStatement(node))return 'Throw '+value(node.expression)+' to simulate or report the failure.';
  if(ts.isIfStatement(node))return 'Run the following branch when '+value(node.expression)+'.'+(ts.isBlock(node.thenStatement)?'':' '+describe(node.thenStatement));
  if(ts.isForOfStatement(node))return 'Iterate '+raw(node.initializer)+' over '+value(node.expression)+'.';
  if(ts.isForStatement(node))return 'Repeat the following fixture operation with initialization `'+raw(node.initializer)+'`, condition '+value(node.condition)+', and update `'+raw(node.incrementor)+'`.';
  if(ts.isWhileStatement(node))return 'Repeat the following operation while '+value(node.expression)+'.';
  if(ts.isFunctionDeclaration(node))return 'Define helper `'+raw(node.name)+'` with '+(node.parameters.length?'parameters '+node.parameters.map(p=>raw(p.name)).join(', '):'no parameters')+' for the fixture operations below.';
  if(ts.isClassDeclaration(node))return 'Define synthetic class `'+raw(node.name)+'`'+(node.heritageClauses?' with '+node.heritageClauses.map(raw).join(', '):'')+' for the test fixture.';
  if(ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node))return 'Define the TypeScript shape `'+raw(node.name)+'` used by the test fixtures; this adds no runtime value.';
  if(ts.isPropertyAssignment(node))return 'Set fixture property `'+raw(node.name)+'` to '+value(node.initializer)+'.';
  if(ts.isShorthandPropertyAssignment(node))return 'Include the current `'+raw(node.name)+'` value under the same property name.';
  if(ts.isSpreadAssignment(node)||ts.isSpreadElement(node))return 'Copy the entries of '+value(node.expression)+' into this fixture.';
  if(ts.isPropertySignature(node))return 'Declare '+(node.questionToken?'optional ':'')+'fixture property `'+raw(node.name)+'` with type `'+raw(node.type)+'`.';
  if(ts.isPropertyDeclaration(node))return 'Declare class field `'+raw(node.name)+'`'+(node.initializer?' initialized to '+value(node.initializer):' for assignment later')+'.';
  if(ts.isMethodDeclaration(node)||ts.isConstructorDeclaration(node))return 'Define '+(node.name?'fixture method `'+raw(node.name)+'`':'the fixture constructor')+' with '+(node.parameters.length?'parameters '+node.parameters.map(p=>raw(p.name)).join(', '):'no parameters')+'.';
  if(ts.isTryStatement(node))return 'Run the following fixture operation inside a try block so its cleanup/error branch can execute.';
  if(ts.isCatchClause(node))return 'Handle a caught test exception'+(node.variableDeclaration?' as `'+raw(node.variableDeclaration.name)+'`':'')+'.';
  if(ts.isBreakStatement(node))return 'Exit the enclosing loop or switch branch.';
  if(ts.isContinueStatement(node))return 'Skip to the next loop iteration.';
  return null;
}
const selectedKinds=new Set(['ImportDeclaration','VariableStatement','ExpressionStatement','ReturnStatement','ThrowStatement','IfStatement','ForOfStatement','ForStatement','WhileStatement','FunctionDeclaration','ClassDeclaration','InterfaceDeclaration','TypeAliasDeclaration','PropertyAssignment','ShorthandPropertyAssignment','SpreadAssignment','SpreadElement','PropertySignature','PropertyDeclaration','MethodDeclaration','Constructor','TryStatement','CatchClause','BreakStatement','ContinueStatement'].map(k=>ts.SyntaxKind[k]));
const fallbacks=[];
for(const entry of manifest.filter(e=>e.file.startsWith('tests/'))) {
  const text=fs.readFileSync(path.join(base,'originals',entry.file),'utf8');
  source=ts.createSourceFile(entry.file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const lines=text.split(/\r\n|\n|\r/).slice(0,entry.lines),perLine=new Map(),all=[];
  function visit(node) {
    all.push(node);
    if(selectedKinds.has(node.kind)) {const line=source.getLineAndCharacterOfPosition(node.getStart(source)).line; const arr=perLine.get(line)||[];arr.push(node);perLine.set(line,arr);}
    ts.forEachChild(node,visit);
  }visit(source);
  const notes={};
  for(let i=0;i<lines.length;i++) {
    const line=lines[i].trim();if(!line)continue;
    let nodes=perLine.get(i)||[];
    nodes=nodes.filter(n=>!nodes.some(parent=>parent!==n&&parent.getStart(source)<=n.getStart(source)&&parent.end>=n.end));
    let descriptions=nodes.map(describe).filter(Boolean);
    let note=descriptions.join(' ');
    if(!note&&/^(\/\/|\/\*|\*|\*\/)/.test(line))note='Existing comment: '+line.replace(/^\/?\*+\/?\s*|^\/\/\s*|\s*\*\/$/g,'');
    if(!note&&/^[}\])\s;,]+$/.test(line)) {
      const position=source.getPositionOfLineAndCharacter(i,lines[i].search(/\S/));
      const scope=all.filter(n=>n.getStart(source)<position&&n.end>=position&&[ts.SyntaxKind.Block,ts.SyntaxKind.ObjectLiteralExpression,ts.SyntaxKind.ArrayLiteralExpression,ts.SyntaxKind.TypeLiteral].includes(n.kind)).sort((a,b)=>(a.end-a.pos)-(b.end-b.pos))[0];
      const parent=scope?.parent;
      note=scope?'Close the '+(ts.isBlock(scope)?'callback or control-flow body':ts.isArrayLiteralExpression(scope)?'array of fixture values':ts.isTypeLiteralNode(scope)?'fixture type definition':'fixture object')+(parent?.name?' for `'+raw(parent.name)+'`':'')+' and finish the surrounding syntax.':'Finish the surrounding expression and delimiters.';
    }
    if(!note&&/^}\s*finally/.test(line))note='Run the following cleanup whether the test operation succeeds or throws.';
    if(!note&&/^}\s*else/.test(line))note='Use this alternative branch when the preceding condition was false.';
    if(!note&&/^}\s*catch/.test(line))note='Catch the preceding operation\'s exception for inspection or cleanup.';
    if(!note) {
      const position=source.getPositionOfLineAndCharacter(i,0);
      const containing=all.filter(n=>n.getStart(source)<=position&&n.end>position&&[ts.SyntaxKind.TemplateExpression,ts.SyntaxKind.NoSubstitutionTemplateLiteral,ts.SyntaxKind.StringLiteral].includes(n.kind)).sort((a,b)=>(a.end-a.pos)-(b.end-b.pos))[0];
      if(containing)note=literalLine(line);
    }
    if(!note&&/^\[/.test(line))note='Provide a parameterized test row with '+clip(line,240)+'; the test receives these values as its inputs and expectations.';
    if(!note) {note='Continue the test expression with `'+clip(line,250)+'`.';fallbacks.push({file:entry.file,line:i+1,source:line});}
    notes[i+1]=clip(note,1600);
  }
  const dest=path.join(base,'notes',entry.file+'.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(notes,null,2)+'\n');
}
function literalLine(line) {
  if(/<label\b/.test(line)){const labels=[...line.matchAll(/<label[^>]*>([^<]*)<\/label>/g)].map(m=>m[1]);return 'Supply fixture HTML labeling '+(labels.length?labels.map(JSON.stringify).join(', '):'a form control')+' and any controls declared on this line.';}
  if(/<option\b/.test(line))return 'Supply selectable fixture options and their exact values/text for dropdown behavior checks.';
  if(/<input\b/.test(line)){const attrs=[...line.matchAll(/(?:id|name|type)="([^"]+)"/g)].map(m=>m[1]);return 'Supply fixture input control markup'+(attrs.length?' with identifiers/types '+attrs.map(JSON.stringify).join(', '):'')+'.';}
  if(/<script\b/.test(line))return 'Start the inline fixture script that simulates the portal\'s client-side behavior.';
  if(/<\/script>/.test(line))return 'Finish the inline fixture script and any surrounding HTML/string delimiters.';
  if(/<button\b/.test(line))return 'Supply the fixture button and its displayed action, so the test can exercise or block that control.';
  if(/<form\b/.test(line))return 'Supply the fixture form, including its action/method, for guarded submission tests.';
  if(/<div\b|<span\b/.test(line))return 'Supply fixture section/group markup and labels used to identify each contact field.';
  if(/^<\//.test(line))return 'Close the fixture HTML elements opened earlier, preserving the original literal markup.';
  const parsed=ts.createSourceFile('fixture.js',line,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const saved=source;source=parsed;let note;
  if(!parsed.parseDiagnostics.length&&parsed.statements.length)note=parsed.statements.map(describe).filter(Boolean).join(' ');
  source=saved;
  return note?'Inside the unchanged fixture script: '+note:'Supply this exact line of literal fixture content: '+clip(line,230)+'.';
}
fs.writeFileSync(path.join(base,'test-fallbacks.json'),JSON.stringify(fallbacks,null,2)+'\n');
console.log(JSON.stringify({tests:manifest.filter(e=>e.file.startsWith('tests/')).length,fallbackCount:fallbacks.length,fallbacks:fallbacks.slice(0,25)},null,2));
