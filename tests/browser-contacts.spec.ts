import { test as base, expect } from '@playwright/test';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { createGuardedSession, type BrowserSession, type FieldPlanEntry, type FormElement } from '../src/browser/session.js';
import { R3_AUTHENTICATED_URL } from '../src/browser/guard.js';
import { matchesR3Field } from '../src/browser/r3-fields.js';

const contactFields = [
  ['firstName', 'FirstName', 'First Name'], ['lastName', 'LastName', 'Last Name'],
  ['workPhone', 'WorkPhone', 'Work Phone'], ['homePhone', 'HomePhone', 'Home Phone'],
  ['mobilePhone', 'MobilePhone', 'Mobile Phone'], ['email', 'Email', 'Email'],
] as const;
const roles = {
  borrower: { token: '11111111-1111-4111-8111-111111111111', heading: 'Who is the borrower / mortgagee?' },
  coBorrower: { token: '22222222-2222-4222-8222-222222222222', heading: 'Is there a co-borrower / co-mortgagee?' },
  listingAgent: { token: '33333333-3333-4333-8333-333333333333', heading: 'Is there a listing agent?' },
  buyerAgent: { token: '44444444-4444-4444-8444-444444444444', heading: "Is there a buyer's agent?" },
  loanOfficer: { token: '55555555-5555-4555-8555-555555555555', heading: 'Is there a loan officer?' },
  contact: { token: '66666666-6666-4666-8666-666666666666', heading: 'Who should be contacted to obtain access to the property?' },
  statusContact: { token: '77777777-7777-4777-8777-777777777777', heading: 'Who should be contacted if there are questions on this order?' },
} as const;
type Role = keyof typeof roles;
type ContactKey = typeof contactFields[number][0];
const fieldId = (role: Role, suffix: string): string => `OrderItemEdit_Contacts_${roles[role].token}__${suffix}`;
const fieldName = (role: Role, suffix: string): string => `OrderItemEdit.Contacts[${roles[role].token}].${suffix}`;
const roleValues = (role: Role): Partial<Record<ContactKey, string>> => role === 'loanOfficer'
  ? { firstName: 'Amber', lastName: 'Coleman', workPhone: '702-604-7027', email: 'acoleman@guildmortgage.net' }
  : role === 'statusContact'
    ? { firstName: 'Amber Coleman Team', lastName: '', workPhone: '', homePhone: '', mobilePhone: '', email: 'ambercolemanteam@guildmortgage.net' }
    : { firstName: `${role} First`, lastName: `${role} Last`, workPhone: `70255501${Object.keys(roles).indexOf(role)}1`,
      homePhone: '', mobilePhone: `70255501${Object.keys(roles).indexOf(role)}2`, email: `${role}@example.test` };
const rolePlan = (role: Role, values = roleValues(role)): FieldPlanEntry[] => Object.entries(values)
  .map(([key, value]) => ({ key: `${role}.${key}`, value, kind: 'text', required: true }));

function contactMarkup(role: Role, token: string, hiddenTokens: string[] = []): string {
  return `<div class="cvc-group col-md-10">
    <span class="cvc-group-title">${roles[role].heading}</span>
    ${[token, ...hiddenTokens].map((contactToken, index) => `<div data-contact-role="${role}" ${index ? 'style="display:none"' : ''}>
    <div class="row"><div class="controls col-md-6">
      ${contactFields.filter(([key]) => role !== 'loanOfficer' || !['homePhone', 'mobilePhone'].includes(key)).map(([, suffix, label]) => `
        <div class="input-group"><span class="input-group-text">${label}</span>
          <input type="text" id="OrderItemEdit_Contacts_${contactToken}__${suffix}" name="OrderItemEdit.Contacts[${contactToken}].${suffix}">
        </div>`).join('')}
    </div></div></div>`).join('')}
  </div>`;
}

function orderHtml(): string {
  const hiddenStatus = [2, 3, 4, 5].map(index => `88888888-8888-4888-8888-88888888888${index}`);
  const contacts = (Object.keys(roles) as Role[]).map(role => contactMarkup(role, roles[role].token, role === 'statusContact' ? hiddenStatus : [])).join('');
  return `<!doctype html><html><body><h1>New Order</h1><form action="/Orders/Create" method="post">
    <label>Loan number<input id="OrderItemEdit_LoanNumber"></label>
    ${contacts}
    <label>Borrower access<input type="checkbox" id="OrderItemEdit_UseBorrowerForAccess"></label>
    <button type="submit">Place this Order</button>
  </form></body></html>`;
}

const test = base.extend<{ session: BrowserSession; writes: string[] }>({
  writes: async ({}, use) => { await use([]); },
  session: async ({ browser, context, page, writes }, use) => {
    const statuses: string[] = [];
    const session = await createGuardedSession(browser, context, page, { onStatus: status => statuses.push(status) }, async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${path}`);
      return { status: 200, headers: { 'content-type': 'text/html' }, body: path === '/Orders/Create' ? orderHtml()
        : path === '/Orders/Search' ? '<a href="#">Log Out</a><h1>Order Search</h1>' : '<h1>Sign in manually</h1>' };
    });
    const login = session.waitForUserLogin();
    try {
      await expect.poll(() => statuses).toContain('awaiting_login');
      await page.goto(R3_AUTHENTICATED_URL);
      await login;
      await session.navigateToOrder();
      await use(session);
    } finally {
      await context.close();
      await login.catch(() => undefined);
    }
  },
});

test('fills all seven UUID-bound contact roles while leaving four hidden status contacts untouched', async ({ session, page, writes }) => {
  const plan = (Object.keys(roles) as Role[]).flatMap(role => rolePlan(role));
  session.setFieldPlan(plan);
  const result = await session.fillApprovedPlan();
  expect(result.errors).toEqual([]);
  expect(result.report).toHaveLength(plan.length);
  expect(result.report.every(entry => entry.verified)).toBe(true);
  for (const role of Object.keys(roles) as Role[]) {
    for (const [key, suffix] of contactFields) {
      const value = roleValues(role)[key];
      if (value !== undefined) await expect(page.locator(`[id="${fieldId(role, suffix)}"]`)).toHaveValue(value);
    }
  }
  const hiddenValues = await page.locator('[data-contact-role="statusContact"][style] input').evaluateAll(inputs => inputs.map(input => (input as HTMLInputElement).value));
  expect(hiddenValues).toHaveLength(24);
  expect(hiddenValues.every(value => value === '')).toBe(true);
  expect(writes).toEqual([]);
  await session.handoff();
});

test('UUID contact matching rejects malformed identity, mismatched names and suffixes, and a swapped role', async ({ session, page, writes }) => {
  session.setFieldPlan(rolePlan('listingAgent', { firstName: 'Listing First' }));
  const input = page.locator('[data-contact-role="listingAgent"] input').first();
  const original = { id: fieldId('listingAgent', 'FirstName'), name: fieldName('listingAgent', 'FirstName'), label: 'First Name', heading: roles.listingAgent.heading };
  const invalid = [
    { id: 'OrderItemEdit_Contacts_not_a_uuid__FirstName', name: 'OrderItemEdit.Contacts[not_a_uuid].FirstName' },
    { name: fieldName('buyerAgent', 'FirstName') },
    { name: fieldName('listingAgent', 'LastName') },
    { id: fieldId('listingAgent', 'LastName'), name: fieldName('listingAgent', 'LastName') },
    { name: '' },
    { label: 'Last Name' },
    { heading: roles.buyerAgent.heading },
  ];
  for (const changes of invalid) {
    await input.evaluate((element, identity) => {
      element.id = identity.id;
      element.setAttribute('name', identity.name);
      element.parentElement!.querySelector('.input-group-text')!.textContent = identity.label;
      element.closest('.cvc-group')!.querySelector('.cvc-group-title')!.textContent = identity.heading;
    }, { ...original, ...changes });
    const result = await session.fillApprovedPlan();
    expect(result.errors).toEqual([{ fieldKey: 'listingAgent.firstName', message: expect.stringContaining('missing or ambiguous') }]);
    await expect(input).toHaveValue('');
  }
  await input.evaluate((element, identity) => {
    element.id = identity.id;
    element.setAttribute('name', identity.name);
    element.parentElement!.querySelector('.input-group-text')!.textContent = identity.label;
    element.closest('.cvc-group')!.querySelector('.cvc-group-title')!.textContent = identity.heading;
  }, original);
  expect((await session.fillApprovedPlan()).errors).toEqual([]);
  await expect(input).toHaveValue('Listing First');
  expect(writes).toEqual([]);
});

test('malformed Contacts bindings cannot use the legacy agent resolver even without other contact fields', () => {
  const observed = { section: roles.listingAgent.heading, label: 'First Name', tag: 'input', type: 'text', visible: true };
  for (const token of ['not_a_uuid', '33333333333343338333333333333333']) {
    expect(matchesR3Field('listingAgent.firstName', {
      ...observed, id: `OrderItemEdit_Contacts_${token}__FirstName`, name: `OrderItemEdit.Contacts[${token}].FirstName`,
    })).toBe(false);
  }
  expect(matchesR3Field('listingAgent.firstName', {
    ...observed, id: 'OrderItemEdit_FixturePersonAFirstName', name: fieldName('listingAgent', 'FirstName'),
  })).toBe(false);
  expect(matchesR3Field('listingAgent.firstName', {
    ...observed, id: 'OrderItemEdit_FixturePersonAFirstName', name: '',
  })).toBe(true);
});

test('two visible UUID status contacts are ambiguous until only one is visible', async ({ session, page, writes }) => {
  session.setFieldPlan(rolePlan('statusContact'));
  const second = page.locator('[data-contact-role="statusContact"]').nth(1);
  await second.evaluate(element => (element as HTMLElement).style.display = '');
  const result = await session.fillApprovedPlan();
  expect(result.errors).toHaveLength(6);
  expect(result.errors.every(error => error.message.includes('missing or ambiguous'))).toBe(true);
  expect(await page.locator('[data-contact-role="statusContact"] input').evaluateAll(inputs => inputs.every(input => (input as HTMLInputElement).value === ''))).toBe(true);
  await second.evaluate(element => (element as HTMLElement).style.display = 'none');
  expect((await session.fillApprovedPlan()).errors).toEqual([]);
  await expect(page.locator(`[id="${fieldId('statusContact', 'FirstName')}"]`)).toHaveValue('Amber Coleman Team');
  expect(writes).toEqual([]);
});

test('a single contact role cannot combine fields from different UUID identities', async ({ session, page, writes }) => {
  const lastName = page.locator(`[id="${fieldId('listingAgent', 'LastName')}"]`);
  await lastName.evaluate(element => {
    element.id = 'OrderItemEdit_Contacts_99999999-9999-4999-8999-999999999999__LastName';
    element.setAttribute('name', 'OrderItemEdit.Contacts[99999999-9999-4999-8999-999999999999].LastName');
  });
  session.setFieldPlan(rolePlan('listingAgent', { firstName: 'Listing First', lastName: 'Listing Last' }));
  const result = await session.fillApprovedPlan();
  expect(result.errors).toHaveLength(2);
  expect(result.report.some(entry => entry.verified)).toBe(false);
  expect(await page.locator('[data-contact-role="listingAgent"] input').evaluateAll(inputs => inputs.every(input => (input as HTMLInputElement).value === ''))).toBe(true);
  expect(writes).toEqual([]);
});

for (const change of ['mismatched UUID name', 'matching UUID pair changed', 'swapped role', 'second visible status contact'] as const) {
  test(`final UUID contact verification rejects ${change}`, async ({ session, page, writes }) => {
    const role = change === 'second visible status contact' ? 'statusContact' : 'listingAgent';
    session.setFieldPlan(rolePlan(role, { firstName: roleValues(role).firstName! }));
    expect((await session.fillApprovedPlan()).errors).toEqual([]);
    if (change === 'second visible status contact') {
      await page.locator('[data-contact-role="statusContact"]').nth(1).evaluate(element => (element as HTMLElement).style.display = '');
    } else {
      await page.locator(`[id="${fieldId(role, 'FirstName')}"]`).evaluate((element, change) => {
        if (change === 'matching UUID pair changed') {
          for (const input of element.closest('.cvc-group')!.querySelectorAll('input')) {
            input.id = input.id.replace('33333333-3333-4333-8333-333333333333', '99999999-9999-4999-8999-999999999999');
            input.name = input.name.replace('33333333-3333-4333-8333-333333333333', '99999999-9999-4999-8999-999999999999');
          }
        } else if (change === 'mismatched UUID name') element.setAttribute('name', 'OrderItemEdit.Contacts[99999999-9999-4999-8999-999999999999].FirstName');
        else element.closest('.cvc-group')!.querySelector('.cvc-group-title')!.textContent = "Is there a buyer's agent?";
      }, change);
    }
    expect(await session.getFieldReport()).toEqual([expect.objectContaining({ fieldKey: `${role}.firstName`, verified: false })]);
    await expect(session.handoff()).rejects.toThrow('incomplete');
    expect(writes).toEqual([]);
  });
}

test('hidden UUID access values cannot satisfy a plan without verified borrower copying', async ({ session, page, writes }) => {
  await page.locator(`[id="${fieldId('contact', 'FirstName')}"]`).evaluate(element => {
    (element as HTMLInputElement).value = 'Unverified copy';
    element.closest<HTMLElement>('.cvc-group')!.style.display = 'none';
  });
  session.setFieldPlan(rolePlan('contact', { firstName: 'Unverified copy' }));
  const result = await session.fillApprovedPlan();
  expect(result.errors).toHaveLength(1);
  expect(result.report.some(entry => entry.verified)).toBe(false);
  await expect(session.handoff()).rejects.toThrow('incomplete');
  expect(writes).toEqual([]);
});

for (const lock of ['disabled', 'readonly', 'hidden'] as const) {
  test(`refinance verifies UUID borrower values before copying ${lock} access contacts`, async ({ session, page, writes }) => {
    const borrower = roleValues('borrower');
    await page.evaluate(({ borrowerToken, accessToken, fields, lock }) => {
      const find = (token: string, suffix: string): HTMLInputElement => document.getElementById(`OrderItemEdit_Contacts_${token}__${suffix}`) as HTMLInputElement;
      const checkbox = document.getElementById('OrderItemEdit_UseBorrowerForAccess') as HTMLInputElement;
      for (const [, suffix] of fields) find(accessToken, suffix).value = 'Stale contact';
      checkbox.addEventListener('change', () => {
        const copied: Record<string, string> = {};
        for (const [key, suffix] of fields) {
          const source = find(borrowerToken, suffix);
          const target = find(accessToken, suffix);
          copied[key] = source.value;
          target.value = source.value;
          target.disabled = lock === 'disabled';
          target.readOnly = lock === 'readonly';
          if (lock === 'hidden') target.closest<HTMLElement>('.cvc-group')!.style.display = 'none';
        }
        document.body.dataset.borrowerAtCopy = JSON.stringify(copied);
      });
      for (const [, suffix] of fields) find(accessToken, suffix).addEventListener('input', () => { document.body.dataset.accessInput = 'true'; });
    }, { borrowerToken: roles.borrower.token, accessToken: roles.contact.token, fields: contactFields, lock });
    // Intentionally give access entries first; session dependency ordering must protect the copy.
    session.setFieldPlan([
      ...rolePlan('contact', borrower),
      { key: 'borrowerIsAccessContact', value: true, kind: 'checkbox', required: true },
      ...rolePlan('borrower'),
    ]);
    const result = await session.fillApprovedPlan();
    expect(result.errors).toEqual([]);
    expect(result.report).toHaveLength(13);
    expect(result.report.every(entry => entry.verified)).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-borrower-at-copy', JSON.stringify(borrower));
    await expect(page.locator('body')).not.toHaveAttribute('data-access-input');
    for (const [key, suffix] of contactFields) await expect(page.locator(`[id="${fieldId('contact', suffix)}"]`)).toHaveValue(borrower[key]!);
    expect(writes).toEqual([]);
    await session.handoff();
  });
}

for (const initiallyCorrect of [true, false]) {
  test(`already checked refinance ${initiallyCorrect ? 'preserves correct hidden access without a change event' : 'refreshes stale hidden access exactly once'}`, async ({ session, page, writes }) => {
    const borrower = roleValues('borrower');
    await page.evaluate(({ borrowerToken, accessToken, fields, borrower, initiallyCorrect }) => {
      const find = (token: string, suffix: string): HTMLInputElement => document.getElementById(`OrderItemEdit_Contacts_${token}__${suffix}`) as HTMLInputElement;
      const checkbox = document.getElementById('OrderItemEdit_UseBorrowerForAccess') as HTMLInputElement;
      checkbox.checked = true;
      document.body.dataset.accessChangeCount = '0';
      for (const [key, suffix] of fields) {
        const target = find(accessToken, suffix);
        target.value = initiallyCorrect ? borrower[key]! : 'Stale contact';
        target.closest<HTMLElement>('.cvc-group')!.style.display = 'none';
        target.addEventListener('input', () => { document.body.dataset.accessInput = 'true'; });
      }
      checkbox.addEventListener('change', () => {
        document.body.dataset.accessChangeCount = String(Number(document.body.dataset.accessChangeCount) + 1);
        const copied: Record<string, string> = {};
        for (const [key, suffix] of fields) {
          copied[key] = find(borrowerToken, suffix).value;
          find(accessToken, suffix).value = copied[key]!;
        }
        document.body.dataset.borrowerAtCopy = JSON.stringify(copied);
      });
    }, { borrowerToken: roles.borrower.token, accessToken: roles.contact.token, fields: contactFields, borrower, initiallyCorrect });
    session.setFieldPlan([
      ...rolePlan('contact', borrower),
      { key: 'borrowerIsAccessContact', value: true, kind: 'checkbox', required: true },
      ...rolePlan('borrower'),
    ]);
    const result = await session.fillApprovedPlan();
    expect(result.errors).toEqual([]);
    expect(result.report).toHaveLength(13);
    expect(result.report.every(entry => entry.verified)).toBe(true);
    await expect(page.locator('#OrderItemEdit_UseBorrowerForAccess')).toBeChecked();
    for (const [key, suffix] of contactFields) await expect(page.locator(`[id="${fieldId('contact', suffix)}"]`)).toHaveValue(borrower[key]!);
    await expect(page.locator('body')).not.toHaveAttribute('data-access-input');
    if (initiallyCorrect) {
      await expect(page.locator('body')).not.toHaveAttribute('data-borrower-at-copy');
      const fields = await invoke(session, 'list_form_elements') as FormElement[];
      const borrowerFirstName = fields.find(field => field.id === fieldId('borrower', 'FirstName'))!;
      expect(await invoke(session, 'fill_form_field', { fieldKey: 'borrower.firstName', ref: borrowerFirstName.ref })).toMatchObject({ verified: true });
      expect((await session.getFieldReport()).every(entry => entry.verified)).toBe(true);
    } else await expect(page.locator('body')).toHaveAttribute('data-borrower-at-copy', JSON.stringify(borrower));
    await session.handoff();
    await expect(page.locator('body')).toHaveAttribute('data-access-change-count', initiallyCorrect ? '0' : '1');
    expect(writes).toEqual([]);
  });
}

async function invoke(session: BrowserSession, name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const selected = session.tools.find(candidate => candidate.name === name);
  if (!selected) throw new Error(`Missing tool: ${name}`);
  const result: unknown = await (selected as StructuredToolInterface).invoke(args);
  return typeof result === 'string' ? JSON.parse(result) as unknown : result;
}

test('observes current Bootstrap contact captions and fills UUID-bound borrower and officer fields', async ({ session, page, writes }) => {
  const fields = await invoke(session, 'list_form_elements') as FormElement[];
  expect(fields.find(field => field.id === fieldId('loanOfficer', 'FirstName'))).toMatchObject({
    label: 'First Name', section: 'Is there a loan officer?',
  });
  const plan: FieldPlanEntry[] = [
    { key: 'borrower.firstName', value: 'Synthetic Borrower', kind: 'text', required: true },
    { key: 'loanOfficer.firstName', value: 'Amber', kind: 'text', required: true },
    { key: 'loanOfficer.lastName', value: 'Coleman', kind: 'text', required: true },
    { key: 'loanOfficer.workPhone', value: '702-604-7027', kind: 'text', required: true },
    { key: 'loanOfficer.email', value: 'acoleman@guildmortgage.net', kind: 'text', required: true },
  ];
  session.setFieldPlan(plan);
  const result = await session.fillApprovedPlan();
  expect(result.errors).toEqual([]);
  expect(result.report).toHaveLength(plan.length);
  expect(result.report.every(entry => entry.verified)).toBe(true);
  await expect(page.locator(`[id="${fieldId('borrower', 'FirstName')}"]`)).toHaveValue('Synthetic Borrower');
  await expect(page.locator(`[id="${fieldId('loanOfficer', 'FirstName')}"]`)).toHaveValue('Amber');
  expect(writes).toEqual([]);
});
