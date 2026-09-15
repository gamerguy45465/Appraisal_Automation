const fs=require('node:fs');const path=require('node:path');const base=path.join(process.cwd(),'tmp/line-comments');
const overrides={
'tests/app.test.ts':{81:'Attach all form fields and the synthetic URLA PDF to the multipart request, then require HTTP 202 Accepted.'},
'tests/browser.spec.ts':{
8:'Define the complete synthetic R3 order page as a literal HTML string; its form controls and browser event handlers below exercise the guarded preparation workflow.',
18:'Define the branch dropdown; selecting a branch fetches OrderingInfo, enables Product, and supplies the conventional SFR option.',
20:'Define Property Type with Single Family and Condominium choices; changing it clears Product to simulate a dependent dropdown reset.',
24:'Define the disabled county dropdown containing only Unknown.',25:'Define the disabled Rush checkbox used to test guarded handling of unavailable controls.',
27:'Define Loan Amount with a blur handler that removes commas, converts the value to a number, and formats two decimal places.',
28:'Define Sale Price initially as zero, with a blur handler that normalizes nonempty numeric values to two decimal places.',
29:'Include synthetic hidden antiforgery and password inputs to ensure tools do not disclose or operate sensitive controls.',
32:'Define the synthetic login form with username/password controls and a login POST; these credentials are fixture strings.',
33:'Define the authenticated landing-page fixture containing the Log Out link used to confirm authentication.',
317:'For each work, home, and mobile phone kind, build that contact section\'s synthetic phone input using its name and index.',
607:'Finish the page callback and pass the selected change scenario into it.',
718:'Attempt a fetch to an unapproved order-submission path so the request guard can reject it.',
719:'Attempt an external collection request so the origin guard can reject data leaving the portal.',
720:'Request the inspected state/county lookup endpoint to confirm that this permitted dynamic read still works.',
827:'Choose either explicit FHA SFR product evidence or the combined FHA/one-unit/site-built evidence used for a tentative recommendation.',
855:'Finish the page callback and pass the current product-label variants into it.',884:'Finish the page callback and pass the current product-label variants into it.',
1036:'Finish session options and begin the synthetic route handler, which asynchronously returns a GuardedResponse.',
1208:'For the authenticated-page case, serve HTML that adds Log Out after 40 ms; otherwise serve the login fixture.',
1308:'Continue the simulated login redirect chain: PostLogin redirects to the root, the root redirects to Orders/Search, and other paths have no redirect.',
1318:'Invoke the asynchronous fixture handler immediately and suppress its rejected promise in this local server callback.',
1330:'Require the recorded redirect sequence to start with a GET of the client-portal login page.',1331:'Require the next recorded request to be the manual login POST.',
1332:'Require the next recorded request to be the permitted GET of Account/PostLogin.',1333:'Require the redirect chain to include a GET of the portal root.',1334:'Require the redirect chain to end with a GET of Orders/Search.'},
'tests/domain.test.ts':{84:'Finish the synthetic extracted order, then pass the trusted input and a true contract-present flag to the field planner.',425:'Include the supported property-classification evidence among the recommendation evidence cases.'},
'tests/environment.test.ts':{69:'Finish the test body and allow 25,000 milliseconds for its PowerShell subprocess checks.'},
'tests/extraction-schema.test.ts':{11:'When a schema child is an array, recursively collect each element\'s schema nodes and append its index to the diagnostic path.',12:'Otherwise recursively collect the single child schema with its property path, then finish the flattened node list.',53:'Require only the loanAmount, salePrice, and lastValuationAmount paths to retain nullable-number unions.'},
'tests/extraction.test.ts':{95:'Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions.',113:'Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions.',181:'Add a synthetic human message asking the model to inspect the order page.'},
'tests/frontend.spec.ts':{29:'If the asynchronous local fixture request handler fails, finish the HTTP response with status 500.'},
'tests/google.test.ts':{249:'Flatten all message parts and keep only native functionCall parts for tool-history assertions.'},
'tests/jobs.test.ts':{186:'Expand each disallowed environment-variable name into its original and lowercase spellings to test case-insensitive isolation.'},
'tests/model-messages.test.ts':{58:'Add a screenshot tool message whose screenshot metadata is serialized as JSON.'},
'tests/pdf-pages.test.ts':{71:'Require the first image\'s source label to identify URLA page 1 of 2.',72:'Require the second image\'s source label to identify URLA page 2 of 2.',73:'Require the third image\'s source label to identify sales-contract page 1 of 1.'},
'tests/providers.test.ts':{155:'For the OpenAI branch, flatten array-valued message content from the native input list and ignore other content shapes.',210:'Provide a synthetic insufficient-credit rejection to ensure billing failures never trigger output-format fallback.',211:'Provide a synthetic schema-complexity rejection to ensure schema failures never trigger output-format fallback.',231:'For the alternate provider branch, return the synthetic OpenAI response.'},
'tests/r3-fields.test.ts':{43:'Build all work/home/mobile phone field keys for each approved contact section.'},
'tests/xai.test.ts':{58:'Recursively normalize each remaining schema property while keeping its key, then rebuild the normalized object.',90:'Finish the model input messages and pass the cancellation signal into the request.',127:'For the tool-format branch, return a synthetic completion with an appraisal_document_data extraction tool call.',144:'Also require every captured request to keep the selected model and native json_schema output format, with no tools sent in these rejection cases.'}
};
for(const fallback of JSON.parse(fs.readFileSync(path.join(base,'test-fallbacks.json'),'utf8'))) {
  let note=overrides[fallback.file]?.[fallback.line],line=fallback.source;
  if(!note&&/^\]\s+as const;$/.test(line))note='Finish the fixture array and preserve its values as literal readonly tuple types for TypeScript.';
  if(!note&&/^\](?:\s+as const)?\)\s*\{$/.test(line))note='Finish the scenario array and begin the loop body that checks each listed case.';
  if(!note&&/^\](?:\s+as const)?\)\('/.test(line))note='Apply the preceding test cases to the parameterized test '+line.slice(line.indexOf("('")+1,line.lastIndexOf("',"))+' and begin its callback.';
  if(!note&&['tests/jobs.test.ts','tests/environment.test.ts'].includes(fallback.file)&&line.startsWith("'"))note='Include '+line.replace(/,$/,'')+' in the names that the isolated process must not inherit.';
  if(!note)throw new Error('Unexplained fallback '+JSON.stringify(fallback));
  (overrides[fallback.file]??={})[fallback.line]=note;
}
for(const [file,notes]of Object.entries(overrides)){const destination=path.join(base,'notes',file+'.json');const current=JSON.parse(fs.readFileSync(destination,'utf8'));Object.assign(current,notes);fs.writeFileSync(destination,JSON.stringify(current,null,2)+'\n');}
console.log('Applied precise explanations for all 82 continuation lines and selected fixture behavior.');
