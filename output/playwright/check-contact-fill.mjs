// Isolated live acceptance helper. Use only synthetic contacts; never load PDFs, call a model, or submit.
// Run after rebuilding: node output/playwright/check-contact-fill.mjs
// The production preparation guard remains active until this diagnostic browser closes.

// Disable inherited LangChain tracing before importing or invoking the browser tools.
for (const name of Object.keys(process.env)) {
  if (/^(?:LANGCHAIN|LANGSMITH)_/i.test(name)) delete process.env[name];
}
process.env.LANGCHAIN_TRACING = 'false';
process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';

const report = (event, details = {}) => console.info(JSON.stringify({ event, ...details }));
const textEntry = (key, value) => ({ key, value, kind: 'text', required: true });
const syntheticContact = (role, firstName, lastName, phoneGroup) => [
  textEntry(`${role}.firstName`, firstName),
  textEntry(`${role}.lastName`, lastName),
  textEntry(`${role}.workPhone`, `202-555-01${phoneGroup}0`),
  textEntry(`${role}.homePhone`, `202-555-01${phoneGroup}1`),
  textEntry(`${role}.mobilePhone`, `202-555-01${phoneGroup}2`),
  textEntry(`${role}.email`, `${role.toLowerCase()}@example.invalid`),
];
const plan = [
  { key: 'branch', value: 'GUILD 685 SUMMERLIN ONE', kind: 'select', required: true },
  { key: 'loanType', value: 'Conventional', kind: 'select', required: true },
  { key: 'propertyType', value: 'Single Family', kind: 'select', required: true },
  { key: 'product', value: '1004 SFR CONV', kind: 'select', required: true },
  { key: 'loanPurpose', value: 'Purchase', kind: 'select', required: true },
  { key: 'borrowerIsAccessContact', value: false, kind: 'checkbox', required: true },
  ...syntheticContact('borrower', 'Avery', 'SampleBorrower', '1'),
  ...syntheticContact('coBorrower', 'Blair', 'SampleCoborrower', '2'),
  ...syntheticContact('contact', 'Casey', 'SampleAccess', '3'),
  ...syntheticContact('listingAgent', 'Drew', 'SampleListing', '4'),
  ...syntheticContact('buyerAgent', 'Emery', 'SampleBuyer', '5'),
  textEntry('loanOfficer.firstName', 'Amber'),
  textEntry('loanOfficer.lastName', 'Coleman'),
  textEntry('loanOfficer.workPhone', '702-604-7027'),
  textEntry('loanOfficer.email', 'acoleman@guildmortgage.net'),
  textEntry('statusContact.firstName', 'Amber Coleman Team'),
  textEntry('statusContact.lastName', ''),
  textEntry('statusContact.workPhone', ''),
  textEntry('statusContact.email', 'ambercolemanteam@guildmortgage.net'),
];
const allowedErrors = new Set([
  'The inspected R3 field is missing or ambiguous.',
  'The selected field is disabled or read-only and does not contain the approved value.',
  'The field could not be filled and verified.',
  'The field was reset or could not be verified against the approved plan.',
  'No unique approved dropdown label matches. This field needs human review.',
  'R3 dropdown or address lookup did not finish.',
  'Value mismatch.',
]);

let session;
let stopping = false;
let deadline;
const controller = new AbortController();
const closeSession = async () => {
  if (session) await session.close().catch(() => undefined);
};
const stop = event => {
  if (stopping) return;
  stopping = true;
  report(event);
  controller.abort();
  void closeSession();
};
const interrupted = () => stop('diagnostic_cancelled');
process.on('SIGINT', interrupted);
process.on('SIGTERM', interrupted);

try {
  deadline = setTimeout(() => stop('diagnostic_timeout'), 15 * 60 * 1000);
  const { createBrowserSession } = await import('../../dist/browser/session.js');
  // This production factory supplies the visible isolated browser, filtered environment,
  // manual authentication, and unchanged no-write preparation guards.
  session = await createBrowserSession({ onStatus: status => report('status', { status }) });
  if (stopping) {
    await closeSession();
  } else {
    try {
      await session.waitForUserLogin({ signal: controller.signal });
      report('signed_in');
      await session.navigateToOrder();
      session.setFieldPlan(plan);
      const result = await session.fillApprovedPlan();
      const verified = Object.fromEntries(plan.map(entry => [
        entry.key, result.report.some(field => field.fieldKey === entry.key && field.verified === true),
      ]));
      const errors = plan.filter(entry => !verified[entry.key]).map(entry => {
        const message = result.errors.find(error => error.fieldKey === entry.key)?.message;
        return { fieldKey: entry.key, message: allowedErrors.has(message) ? message : 'The planned field was not verified.' };
      });
      report('contact_fill_result', { verified, errors });
      if (errors.length) {
        process.exitCode = 1;
        // Project only static first-name control metadata for diagnosing an unrecognized/hidden role.
        const tool = session.tools.find(candidate => candidate.name === 'list_form_elements');
        const raw = await tool.invoke({});
        const fields = typeof raw === 'string' ? JSON.parse(raw) : raw;
        report('contact_field_structure', { fields: fields
          .filter(field => /^OrderItemEdit_Contacts_[0-9a-f-]{36}__FirstName$/i.test(field.id))
          .map(({ id, name, label, section, visible, disabled, readOnly }) => ({ id, name, label, section, visible, disabled, readOnly })) });
      }
    } catch {
      if (!stopping) {
        process.exitCode = 1;
        report('diagnostic_error', { message: 'Contact acceptance could not complete. The isolated browser remains open with writes blocked.' });
      }
    }
    // No handoff is requested: submission remains blocked for this synthetic diagnostic.
    if (!stopping) report('diagnostic_waiting_for_browser_close');
    await session.waitUntilClosed();
  }
} catch {
  process.exitCode = 1;
  report('diagnostic_error', { message: 'The isolated contact acceptance browser could not start.' });
} finally {
  clearTimeout(deadline);
  process.off('SIGINT', interrupted);
  process.off('SIGTERM', interrupted);
  await closeSession();
}
