// Pure, read-only diagnostic for static contact markup. Never return field values or page/account text.
export function contactMetadata() {
  if (location.origin !== 'https://clients.r3amc.com' || location.pathname !== '/Orders/Create' || location.search) {
    throw new Error('Contact metadata requires the exact authenticated order page.');
  }
  const clean = value => (value ?? '').replace(/\s+/g, ' ').trim();
  const captions = ['First Name', 'Last Name', 'Work Phone', 'Home Phone', 'Mobile Phone', 'Email'];
  const headings = ['Who is the borrower / mortgagee?', 'Is there a co-borrower / co-mortgagee?',
    'Is there a listing agent?', "Is there a buyer's agent?", 'Is there a loan officer?',
    'Who should be contacted for access?', 'Who should receive status updates?'];
  const safeToken = value => /^[A-Za-z][A-Za-z0-9_.:\[\]-]{0,180}$/.test(value ?? '') ? value : '';
  const recognized = value => captions.find(caption => clean(value).toLowerCase() === caption.toLowerCase()) ?? '';
  const headerInfo = element => {
    const text = clean(element.textContent);
    const known = headings.find(heading => text.toLowerCase().startsWith(heading.toLowerCase()));
    // These direct form-section headings are static portal captions, not field/account values.
    const staticCaption = element.matches('.cvc-group-title') ? text.slice(0, 160) : '';
    return { tag: element.tagName, className: element.className, caption: known ?? staticCaption, additionalText: Boolean(known && text !== known) };
  };
  const controls = [...document.querySelectorAll('input,select,textarea,[role="combobox"],[role="checkbox"],[role="radio"]')]
    .filter(element => !['hidden', 'password', 'submit', 'button', 'reset', 'file', 'image'].includes(element.getAttribute('type') ?? ''));
  const fields = controls.map((element, index) => {
    const labels = [...(element.labels ?? [])].map(label => recognized(label.textContent)).filter(Boolean);
    const parent = element.parentElement;
    const siblingLabels = [...(parent?.children ?? [])]
      .filter(child => child !== element && !child.matches('input,select,textarea'))
      .map(child => ({ tag: child.tagName, className: child.className, caption: recognized(child.textContent) }))
      .filter(child => child.caption);
    if (!labels.length && !siblingLabels.length && !/(borrower|access|customer|agent|officer|contact)/i.test(element.id)) return null;
    if (element.id.includes('__Addresses_')) return null;
    const ancestors = [];
    for (let ancestor = parent; ancestor && ancestor.tagName !== 'FORM' && ancestor.tagName !== 'BODY' && ancestors.length < 10; ancestor = ancestor.parentElement) {
      ancestors.push({ tag: ancestor.tagName, className: ancestor.className,
        headers: [...ancestor.querySelectorAll(':scope > legend,:scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6,:scope > .panel-heading,:scope > .card-header,:scope > .cvc-group-title')].map(headerInfo) });
    }
    const bounds = element.getBoundingClientRect();
    return { index, id: safeToken(element.id), name: safeToken(element.getAttribute('name')), tag: element.tagName,
      type: element.getAttribute('type'), labels, siblingLabels, ancestors,
      visible: bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility !== 'hidden',
      disabled: Boolean(element.disabled), readOnly: Boolean(element.readOnly) };
  }).filter(Boolean);
  return { eligibleControlCount: controls.length, fields };
}
