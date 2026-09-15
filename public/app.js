// [L1] Enables strict JavaScript semantics for the entire browser script.
"use strict";
// [L2] Blank line separating the surrounding declarations, statements, or document blocks.

// [L3] Sets the maximum accepted PDF size to 15,728,640 bytes, which is 15 MiB.
const MAX_PDF_BYTES = 15728640; // 15.7 MB
// [L4] Sets the normal job-status polling interval to 2.5 seconds.
const POLL_INTERVAL_MS = 2500;
// [L5] Caps automatic reconnection delays at 15 seconds.
const MAX_RECONNECT_DELAY_MS = 15000;
// [L6] Limits each HTTP request to 45 seconds before aborting it.
const REQUEST_TIMEOUT_MS = 45000;
// [L7] Names the sessionStorage entry used to recover the active order after a refresh.
const ACTIVE_JOB_STORAGE_KEY = "appraisal-desk-active-job";
// [L9] Starts the lookup that translates job statuses into interface labels and workflow positions.
const STATUS_COPY = {
  // [L10] Shows queued jobs as starting, with the first workflow step active.
  queued: { badge: "Starting", title: "Your order is in progress.", step: 0 },
  // [L11] Shows extracting jobs as reading documents, with the first workflow step active.
  extracting: { badge: "Reading", title: "Reading your documents.", step: 0 },
  // [L12] Shows waiting-for-login jobs as requiring R3 sign-in, with the second workflow step active.
  awaiting_login: { badge: "Sign in", title: "Sign in to R3 AMC.", step: 1 },
  // [L13] Shows preparing jobs as filling the R3 order, with the second workflow step active.
  preparing: { badge: "Preparing", title: "Preparing your R3 order.", step: 1 },
  // [L14] Shows waiting-for-review jobs as ready for user review, with the third workflow step active.
  awaiting_review: { badge: "Your review", title: "Review and finish your order.", step: 2 },
  // [L15] Shows detected submissions as submitted and positions progress after all three displayed steps.
  user_submitted: { badge: "Submitted", title: "Submission detected.", step: 3 },
  // [L16] Shows browser closure with no active workflow step.
  browser_closed: { badge: "Closed", title: "Your browser session is closed.", step: null },
  // [L17] Shows failures as needing attention with no active workflow step.
  failed: { badge: "Needs attention", title: "Preparation needs attention.", step: null },
// [L18] Ends the status-to-interface lookup object.
};
// [L19] Blank line separating the surrounding declarations, statements, or document blocks.

// [L20] Stores the order form element for validation, submission, and event handling.
const form = document.querySelector("#order-form");
// [L21] Stores the fieldset so all order fields can be disabled together.
const orderFields = document.querySelector("#order-fields");
// [L22] Stores the submit button to control whether another preparation can start.
const submitButton = document.querySelector("#submit-button");
// [L23] Stores the text span inside the submit button for progress labels.
const submitLabel = document.querySelector("#submit-label");
// [L24] Stores the form error panel for displaying and focusing validation failures.
const errorPanel = document.querySelector("#form-error");
// [L25] Stores the progress card for status styling and scrolling into view.
const statusCard = document.querySelector("#status-card");
// [L26] Stores the reconnect button for manual session and progress recovery.
const reconnectButton = document.querySelector("#reconnect-button");
const newOrderButton = document.querySelector("#new-order-button");
const newOrderNotice = document.querySelector("#new-order-notice");
// [L27] Stores the connection-message element for network and session feedback.
const connectionMessage = document.querySelector("#connection-message");
// [L28] Collects the URLA and sales-contract file inputs by their element IDs.
const documentInputs = ["urla", "salesContract"].map((id) => document.getElementById(id));
// [L29] Collects the three workflow step elements in extraction, preparation, and review order.
const stepElements = ["step-extract", "step-prepare", "step-review"].map((id) => document.getElementById(id));
// [L30] Stores the provider selector for provider-specific form behavior.
const providerInput = document.querySelector("#provider");
// [L31] Stores the optional model-ID input.
const modelInput = document.querySelector("#model");
// [L32] Stores the API-key input so labels, validation, and clearing can be managed.
const apiKeyInput = document.querySelector("#apiKey");
// [L33] Maps internal provider IDs to the provider names displayed by the browser script.
const providerNames = { openai: "OpenAI", anthropic: "Anthropic", google: "Google Gemini", xai: "Grok" };
// [L34] Defines initial default model IDs for each provider; session configuration can replace them.
const modelDefaults = { openai: "gpt-5.6-sol", anthropic: "claude-opus-5", google: "gemini-3.8-flash", xai: "grok-4.6" };
// [L35] Documents the design constraint: Custom model choices stay only in this page's memory, separately for each provider.
// Custom model choices stay only in this page's memory, separately for each provider.
// [L36] Initializes a separate in-memory custom model choice for each provider.
const customModels = { openai: "", anthropic: "", google: "", xai: "" };
// [L37] Initializes the selected provider from the dropdown's current value.
let selectedProvider = providerInput.value;
// [L38] Records that the server's initial provider preference has not yet been applied.
let providerInitialized = false;
// [L39] Blank line separating the surrounding declarations, statements, or document blocks.

// [L40] Initializes the CSRF token as empty until the workspace session supplies one.
let csrfToken = "";
// [L41] Starts with no active order ID in memory.
let activeJobId = null;
// [L42] Starts with no scheduled polling timer.
let pollTimer = null;
// [L43] Starts the automatic reconnection attempt count at zero.
let reconnectAttempts = 0;
// [L44] Marks the workspace session as unavailable until initialization succeeds.
let sessionReady = false;
// [L45] Tracks whether a status request is running to prevent overlapping polls.
let pollInProgress = null;
let jobGeneration = 0;
let lastJobId = null;
let predecessorJobId = null;
let canStartAnother = false;
// [L46] Tracks whether a preparation request is running to prevent duplicate submissions.
let requestInProgress = false;
// [L47] Starts without a previous rendered status for transition detection.
let lastStatus = null;
let hostingMode = "local";
let companionState = { paired: false, connected: false };
let companionTimer = null;
let companionPollInProgress = false;
let pairingExpiryTimer = null;
let pairingInProgress = false;
let formAvailable = false;
let formLabel = "Prepare appraisal order";
let workspaceGeneration = 0;
const workspaceLoginForm = document.querySelector("#workspace-login-form");
const workspaceAccessCode = document.querySelector("#workspace-access-code");
const pairingButton = document.querySelector("#pairing-button");
// [L48] Blank line separating the surrounding declarations, statements, or document blocks.

// [L49] Defines an Error subclass carrying HTTP status and per-field details for interface failures.
class WorkspaceError extends Error {
  // [L50] Constructs a workspace error with an optional HTTP status and details array.
  constructor(message, status = 0, details = [], code = "") {
    // [L51] Initializes the inherited error message and Error behavior.
    super(message);
    // [L52] Gives this error the WorkspaceError name.
    this.name = "WorkspaceError";
    // [L53] Stores the HTTP status used to distinguish authentication, missing-job, and connection failures.
    this.status = status;
    // [L54] Stores the detailed messages and field references used by the form error panel.
    this.details = details;
    this.code = code;
  // [L55] Closes the enclosing block within WorkspaceError class.
  }
// [L56] Closes the enclosing block within WorkspaceError class.
}
// [L57] Blank line separating the surrounding declarations, statements, or document blocks.

// [L58] Defines the function that refreshes labels and help text for the selected AI provider.
function updateProviderFields() {
  // [L59] Looks up the selected provider's displayed name.
  const name = providerNames[selectedProvider];
  // [L60] Uses xAI as Grok's recipient/account name and the display name for other providers.
  const recipient = selectedProvider === "xai" ? "xAI" : name;
  // [L61] Looks up the currently configured default model for the selected provider.
  const defaultModel = modelDefaults[selectedProvider];
  // [L62] Updates the visible API-key label to name the selected provider.
  updateText("#api-key-label", `${name} API key`);
  // [L63] Updates the key input's placeholder to name the selected provider.
  apiKeyInput.placeholder = `Enter your ${name} API key`;
  // [L64] Begins choosing API-key help text, first checking for Google.
  updateText("#api-key-help", selectedProvider === "google"
    // [L65] Supplies Google's PDF-sharing and account-settings explanation for the help text.
    ? "Your PDFs and order details are sent to Google Gemini. API usage and data handling depend on your Google account settings and Google's terms."
    // [L66] Checks whether the non-Google provider is xAI.
    : selectedProvider === "xai"
    // [L67] Supplies the explanation that document pages go to xAI and usage is billed to the xAI account.
    ? "Your document pages and order details are sent to xAI. API usage is billed to your xAI account."
    // [L68] Supplies the PDF-sharing and billing explanation for the other selected provider and completes the text update.
    : `Your PDFs and order details are sent to ${recipient}. API usage is billed to your ${recipient} account.`);
  // [L69] Shows the provider's default model as the optional model field's placeholder.
  modelInput.placeholder = defaultModel;
  // [L70] Begins choosing model-selection guidance, with a separate branch for xAI.
  updateText("#model-help", selectedProvider === "xai"
    // [L71] Supplies Grok's default-model guidance, capability requirements, and combined 50-page limit.
    ? `Leave blank to use ${defaultModel}. Choose a model with image, tool, and structured-output support. Grok accepts up to 50 pages across both documents.`
    // [L72] Supplies other providers' default-model and PDF/image/tool capability guidance and completes the update.
    : `Leave blank to use ${defaultModel}. Choose a model available to your account with PDF, image, and tool support.`);
// [L73] Closes the enclosing block within updateProviderFields.
}
// [L74] Blank line separating the surrounding declarations, statements, or document blocks.

// [L75] Defines how session metadata updates provider defaults and initializes the provider selection.
function configureProviders(session) {
  // [L76] Visits every provider known by the interface.
  for (const provider of Object.keys(providerNames)) {
    // [L77] Reads the server-supplied model default for the current provider when that map exists.
    const configured = session.modelDefaults?.[provider];
    // [L78] Replaces a provider's default only when the supplied value is a nonempty string after trimming.
    if (typeof configured === "string" && configured.trim()) modelDefaults[provider] = configured;
  // [L79] Closes the enclosing block within configureProviders.
  }
  // [L80] Handles the older session shape that supplies a single nonempty model string without modelDefaults.
  if (!session.modelDefaults && typeof session.model === "string" && session.model.trim()) {
    // [L81] Uses that legacy model value as the OpenAI default.
    modelDefaults.openai = session.model;
  // [L82] Closes the enclosing block within configureProviders.
  }
  // [L83] Applies the server's initial provider choice only before provider initialization has completed.
  if (!providerInitialized) {
    // [L84] Selects the server default only if it is one of the known provider IDs.
    if (Object.hasOwn(providerNames, session.defaultProvider)) providerInput.value = session.defaultProvider;
    // [L85] Synchronizes the in-memory selected provider with the dropdown.
    selectedProvider = providerInput.value;
    // [L86] Marks provider initialization complete so later session renewals preserve the user's selection.
    providerInitialized = true;
  // [L87] Closes the enclosing block within configureProviders.
  }
  // [L88] Documents the design constraint: Session renewal updates defaults, never the provider or model the user chose.
  // Session renewal updates defaults, never the provider or model the user chose.
  // [L89] Refreshes provider labels and model guidance using the updated defaults.
  updateProviderFields();
// [L90] Closes the enclosing block within configureProviders.
}
// [L91] Blank line separating the surrounding declarations, statements, or document blocks.

// [L92] Defines a storage-tolerant lookup of the saved active order ID.
function readSavedJobId() {
  // [L93] Attempts the sessionStorage read while allowing blocked storage to be handled.
  try {
    // [L94] Returns the saved active order ID from this tab's session storage.
    return sessionStorage.getItem(ACTIVE_JOB_STORAGE_KEY);
  // [L95] Handles an exception raised while accessing session storage.
  } catch {
    // [L96] Returns no saved job when storage cannot be read.
    return null;
  // [L97] Closes the enclosing block within readSavedJobId.
  }
// [L98] Closes the enclosing block within readSavedJobId.
}
// [L99] Blank line separating the surrounding declarations, statements, or document blocks.

// [L100] Defines storage of an active order ID, or removal when no ID is supplied.
function saveJobId(jobId) {
  // [L101] Documents the design constraint: The opaque ID lets a refresh recover progress; no API key or files are stored.
  // The opaque ID lets a refresh recover progress; no API key or files are stored.
  // [L102] Attempts to update session storage without letting storage errors interrupt the order.
  try {
    // [L103] Saves a truthy order ID under the active-job storage key.
    if (jobId) sessionStorage.setItem(ACTIVE_JOB_STORAGE_KEY, jobId);
    // [L104] Removes the saved order ID when the supplied ID is falsy.
    else sessionStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
  // [L105] Handles sessionStorage write/removal failures without propagating them.
  } catch {
    // [L106] Documents the design constraint: A browser that blocks session storage can still complete this order.
    // A browser that blocks session storage can still complete this order.
  // [L107] Closes the enclosing block within saveJobId.
  }
// [L108] Closes the enclosing block within saveJobId.
}
// [L109] Blank line separating the surrounding declarations, statements, or document blocks.

// [L110] Defines the common JSON request helper with optional fetch settings, timeout, and normalized errors.
async function requestJson(url, options = {}) {
  // [L111] Creates an abort controller dedicated to this request.
  const controller = new AbortController();
  // [L112] Schedules request cancellation after the configured timeout.
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // [L113] Starts the request operation whose errors will be normalized and timer cleared.
  try {
    // [L114] Sends the HTTP request and begins constructing its fetch options.
    const response = await fetch(url, {
      // [L115] Copies the caller's options, including method, body, and headers.
      ...options,
      // [L116] Includes credentials only for same-origin requests.
      credentials: "same-origin",
      // [L117] Requests a network response without using or updating the browser HTTP cache.
      cache: "no-store",
      // [L118] Connects fetch cancellation to this request's abort controller.
      signal: controller.signal,
    // [L119] Finishes the fetch options and awaits the HTTP response.
    });
    // [L120] Declares storage for the parsed JSON response body.
    let body;
    // [L121] Attempts JSON decoding so malformed responses receive a specific workspace error.
    try {
      // [L122] Parses the response body as JSON.
      body = await response.json();
    // [L123] Handles a failure to decode the response as JSON.
    } catch {
      // [L124] Throws an unreadable-response error while preserving the response's HTTP status.
      throw new WorkspaceError("The workspace returned an unreadable response. Reconnect to try again.", response.status);
    // [L125] Closes the enclosing block within requestJson.
    }
    // [L126] Checks whether the response status falls outside fetch's successful 200-299 range.
    if (!response.ok) {
      // [L127] Uses the server's string error message when available, otherwise a generic request-failure message.
      const message = typeof body?.error?.message === "string" ? body.error.message : "The workspace could not complete this request.";
      // [L128] Uses the server's error-details array when valid, otherwise an empty array.
      const details = Array.isArray(body?.error?.details) ? body.error.details : [];
      // [L129] Throws a structured workspace error containing the message, status, and field details.
      throw new WorkspaceError(message, response.status, details, typeof body?.error?.code === "string" ? body.error.code : "");
    // [L130] Closes the enclosing block within requestJson.
    }
    // [L131] Returns the parsed body of a successful response.
    return body;
  // [L132] Handles request, decoding, and HTTP-status errors from the request block.
  } catch (error) {
    // [L133] Rethrows existing WorkspaceError objects without replacing their useful details.
    if (error instanceof WorkspaceError) throw error;
    // [L134] Checks whether the failure is the abort error produced by request cancellation.
    if (error instanceof Error && error.name === "AbortError") {
      // [L135] Converts an aborted request into a user-readable timeout error.
      throw new WorkspaceError("The connection timed out. Check your connection and reconnect.");
    // [L136] Closes the enclosing block within requestJson.
    }
    // [L137] Converts remaining failures into a local-application connection error.
    throw new WorkspaceError("Could not connect to the workspace. Check your connection, then reconnect.");
  // [L138] Begins cleanup that runs whether the request succeeds or fails.
  } finally {
    // [L139] Cancels the timeout timer so it cannot abort after the request has finished.
    window.clearTimeout(timeoutId);
  // [L140] Closes the enclosing block within requestJson.
  }
// [L141] Closes the enclosing block within requestJson.
}
// [L142] Blank line separating the surrounding declarations, statements, or document blocks.

// [L143] Defines how the form's enabled state and submit label are updated together.
function setFormAvailable(available, label = "Prepare appraisal order") {
  formAvailable = available;
  formLabel = label;
  refreshFormAvailability();
  form.setAttribute("aria-busy", String(requestInProgress));
}

function refreshFormAvailability() {
  const companionReady = hostingMode !== "hosted" || companionState.connected;
  orderFields.disabled = !formAvailable || !sessionReady;
  submitButton.disabled = !formAvailable || !sessionReady || !companionReady;
  submitLabel.textContent = formAvailable && sessionReady && !companionReady ? "Connect Windows companion" : formLabel;
  newOrderButton.disabled = !sessionReady || requestInProgress || !companionReady;
}

function clearPairingCode() {
  window.clearTimeout(pairingExpiryTimer);
  document.querySelector("#pairing-token").value = "";
  document.querySelector("#pairing-code-panel").hidden = true;
  updateText("#pairing-expiry", "");
  updateText("#pairing-copy-status", "");
}

function configureHostedWorkspace(session) {
  if (session.hostingMode !== "hosted") return;
  hostingMode = "hosted";
  document.querySelector("#hosted-workspace").hidden = false;
  workspaceLoginForm.hidden = sessionReady;
  document.querySelector("#companion-panel").hidden = !sessionReady;
  updateText("#workspace-mode-label", "Hosted workspace");
  updateText("#r3-browser-help", "R3 AMC opens on your Windows PC. Sign in and complete any CAPTCHA there; preparation resumes automatically after you sign in.");
  updateText("#step-prepare p", "Sign in through the R3 browser on your Windows PC.");
  updateText("#login-notice strong", "Use the R3 AMC browser on your Windows PC.");
  updateText("#review-notice strong", "Review in the R3 AMC browser on your Windows PC.");
  if (session.companion) updateCompanion(session.companion);
}

function updateCompanion(state) {
  if (hostingMode !== "hosted") return;
  companionState = { paired: state?.paired === true, connected: state?.paired === true && state?.connected === true };
  updateText("#companion-status", companionState.connected
    ? "Windows companion connected. Keep it running while you prepare and review your order."
    : document.querySelector("#pairing-token").value
    ? "Waiting for your Windows companion. Enter the website address and one-time code on your PC."
    : companionState.paired
    ? "Your Windows companion is offline. Restart it on your PC; if it asks for a code, pair it again after finishing and closing any open R3 order. Your form entries are still here."
    : "Connect your Windows PC to open R3 for sign-in and your final review.");
  pairingButton.hidden = companionState.connected;
  if (companionState.connected) {
    clearPairingCode();
    updateText("#pairing-error", "");
  }
  refreshFormAvailability();
}

function requireWorkspaceLogin() {
  workspaceGeneration += 1;
  sessionReady = false;
  csrfToken = "";
  companionState = { paired: false, connected: false };
  window.clearTimeout(companionTimer);
  window.clearTimeout(pollTimer);
  clearPairingCode();
  configureHostedWorkspace({ hostingMode: "hosted" });
  setFormAvailable(false, "Workspace sign-in needed");
  clearConnectionIssue();
}

function scheduleCompanionPoll() {
  window.clearTimeout(companionTimer);
  if (hostingMode === "hosted" && sessionReady) companionTimer = window.setTimeout(pollCompanion, 5000);
}

async function pollCompanion() {
  if (hostingMode !== "hosted" || !sessionReady || companionPollInProgress) return;
  if (activeJobId) { scheduleCompanionPoll(); return; }
  companionPollInProgress = true;
  const generation = workspaceGeneration;
  try {
    const state = await requestJson("/api/companion-status");
    if (generation === workspaceGeneration) updateCompanion(state);
  } catch (error) {
    if (generation !== workspaceGeneration) return;
    if (error.code === "WORKSPACE_LOGIN_REQUIRED") requireWorkspaceLogin();
    else {
      updateCompanion({ paired: companionState.paired, connected: false });
      updateText("#companion-status", "Could not check your Windows companion. Reconnecting automatically; your form entries are still here.");
    }
  } finally {
    companionPollInProgress = false;
    scheduleCompanionPoll();
  }
}

async function loginWorkspace(event) {
  event.preventDefault();
  const loginButton = document.querySelector("#workspace-login-button");
  if (loginButton.disabled || !workspaceLoginForm.reportValidity()) return;
  const accessKey = workspaceAccessCode.value;
  workspaceAccessCode.value = "";
  loginButton.disabled = true;
  document.querySelector("#workspace-login-error").hidden = true;
  try {
    await requestJson("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessKey }) });
    workspaceGeneration += 1;
    await initializeSession();
  } catch (error) {
    updateText("#workspace-login-error", error.message);
    document.querySelector("#workspace-login-error").hidden = false;
    workspaceAccessCode.focus();
  } finally {
    workspaceAccessCode.value = "";
    loginButton.disabled = false;
  }
}

async function createPairingCode() {
  if (!sessionReady || pairingInProgress || companionState.connected) return;
  pairingInProgress = true;
  pairingButton.disabled = true;
  const generation = workspaceGeneration;
  updateText("#pairing-error", "");
  clearPairingCode();
  try {
    const pairing = await requestJson("/api/pairing", { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
    if (generation !== workspaceGeneration || companionState.connected) return;
    const expiresAt = typeof pairing.expiresAt === "number" ? pairing.expiresAt : Date.parse(pairing.expiresAt);
    if (typeof pairing.token !== "string" || !pairing.token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new WorkspaceError("Could not create a current pairing code. Try again.");
    }
    document.querySelector("#pairing-token").value = pairing.token;
    document.querySelector("#pairing-code-panel").hidden = false;
    updateCompanion(companionState);
    updateText("#pairing-expiry", `One-time code. Expires at ${new Date(expiresAt).toLocaleTimeString()}. Keep it private.`);
    pairingExpiryTimer = window.setTimeout(() => {
      clearPairingCode();
      updateText("#pairing-error", "This pairing code expired. Create a new code to connect.");
    }, Math.min(expiresAt - Date.now(), 2147483647));
  } catch (error) {
    if (generation !== workspaceGeneration) return;
    if (error.code === "WORKSPACE_LOGIN_REQUIRED") requireWorkspaceLogin();
    else updateText("#pairing-error", error.message);
  } finally {
    pairingInProgress = false;
    pairingButton.disabled = false;
  }
}
// [L149] Blank line separating the surrounding declarations, statements, or document blocks.

// [L150] Defines clearing of previously displayed form errors and invalid-field indicators.
function clearErrors() {
  // [L151] Hides the form error panel.
  errorPanel.hidden = true;
  // [L152] Removes the previous detailed error list items.
  document.querySelector("#error-details").replaceChildren();
  // [L153] Removes aria-invalid from every field currently marked invalid within the form.
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
// [L154] Closes the enclosing block within clearErrors.
}
// [L155] Blank line separating the surrounding declarations, statements, or document blocks.

// [L156] Defines rendering of a workspace error with an optional custom panel title.
function showError(error, title = "Please check your order") {
  // [L157] Writes the requested error heading as text.
  document.querySelector("#error-title").textContent = title;
  // [L158] Writes the error's message as text rather than interpreting it as HTML.
  document.querySelector("#error-message").textContent = error.message;
  // [L159] Gets the list that will contain individual error details.
  const detailsList = document.querySelector("#error-details");
  // [L160] Accepts error details only when they are an array, otherwise uses an empty list.
  const details = Array.isArray(error.details) ? error.details : [];
  // [L161] Clears any previous detail items before showing this error.
  detailsList.replaceChildren();
  // [L162] Visits each supplied detailed error to render it and mark the corresponding field.
  details.forEach((detail) => {
    // [L163] Skips missing details and details without a string message.
    if (!detail || typeof detail.message !== "string") return;
    // [L164] Creates a list item for the current detailed error.
    const item = document.createElement("li");
    // [L165] Writes the detail's message into the new list item as plain text.
    item.textContent = detail.message;
    // [L166] Appends the detailed error to the panel's list.
    detailsList.append(item);
    // [L167] Finds the named form field when the detail provides a string field name.
    const field = typeof detail.field === "string" ? form.elements.namedItem(detail.field) : null;
    // [L168] Marks a resolved HTML field as invalid for assistive technology and styling.
    if (field instanceof HTMLElement) field.setAttribute("aria-invalid", "true");
  // [L169] Ends rendering of the individual detailed errors.
  });
  // [L170] Hides the detail list when it contains no valid messages.
  detailsList.hidden = detailsList.childElementCount === 0;
  // [L171] Makes the error panel visible.
  errorPanel.hidden = false;
  // [L172] Moves keyboard focus to the error panel so the error is discoverable.
  errorPanel.focus();
// [L173] Closes the enclosing block within showError.
}
// [L174] Blank line separating the surrounding declarations, statements, or document blocks.

// [L175] Defines file-selection display and client-side PDF validation for one upload input.
function updateFileSelection(input) {
  // [L176] Reads the first selected file, if any.
  const file = input.files?.[0];
  // [L177] Finds the file-selection description associated with this input's ID.
  const description = document.getElementById(`${input.id}-selection`);
  // [L178] Clears the previous custom browser validation message.
  input.setCustomValidity("");
  // [L179] Clears the previous aria-invalid marker on this file input.
  input.removeAttribute("aria-invalid");
  // [L180] Sets a data attribute indicating whether a file is selected for CSS styling.
  description.dataset.selected = String(Boolean(file));
  // [L181] Displays the filename and binary-megabyte size to two decimal places, or the no-selection message.
  description.textContent = file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MiB` : "No document selected";
  // [L182] Stops file-specific validation when no file has been selected.
  if (!file) return;
  // [L183] Checks whether the selected filename lacks a case-insensitive .pdf extension.
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    // [L184] Sets a browser validation error requiring a PDF filename.
    input.setCustomValidity("Choose a PDF document.");
  // [L185] Checks whether a PDF-named file has zero bytes.
  } else if (file.size === 0) {
    // [L186] Sets a validation message rejecting the empty file.
    input.setCustomValidity("This file is empty. Choose a PDF with content.");
  // [L187] Checks whether the selected file exceeds the configured byte limit.
  } else if (file.size > MAX_PDF_BYTES) {
    // [L188] Sets the validation message for PDFs larger than 15 MiB.
    input.setCustomValidity("Choose a PDF that is no larger than 15 MiB.");
  // [L189] Closes the enclosing block within updateFileSelection.
  }
  // [L190] Marks the file input invalid when any browser validity constraint fails.
  if (!input.validity.valid) input.setAttribute("aria-invalid", "true");
// [L191] Closes the enclosing block within updateFileSelection.
}
// [L192] Blank line separating the surrounding declarations, statements, or document blocks.

// [L193] Defines rebuilding the review-warning list from a job's warnings.
function renderWarnings(warnings) {
  // [L194] Gets the warning list element.
  const list = document.querySelector("#warnings-list");
  // [L195] Removes warnings from the previously rendered job state.
  list.replaceChildren();
  // [L196] Only iterates warnings when the supplied value is an array.
  if (Array.isArray(warnings)) {
    // [L197] Filters out non-string warnings and visits the remaining warning messages.
    warnings.filter((warning) => typeof warning === "string").forEach((warning) => {
      // [L198] Creates one list item for a warning.
      const item = document.createElement("li");
      // [L199] Writes the warning into the list item as plain text.
      item.textContent = warning;
      // [L200] Adds the warning item to the review-warning list.
      list.append(item);
    // [L201] Ends iteration over valid warning strings.
    });
  // [L202] Closes the enclosing block within renderWarnings.
  }
  // [L203] Hides the entire warnings section when no valid warnings were rendered.
  document.querySelector("#job-warnings").hidden = list.childElementCount === 0;
// [L204] Closes the enclosing block within renderWarnings.
}
// [L205] Blank line separating the surrounding declarations, statements, or document blocks.

// [L206] Defines validation and rendering of job status, workflow markers, warnings, and terminal-state behavior.
function renderJob(job) {
  // [L207] Checks that the job has the required ID, message, and recognized status.
  if (!isValidJob(job)) {
    // [L208] Rejects an unexpected job response with a reconnect-oriented workspace error.
    throw new WorkspaceError("The workspace returned an unexpected order status. Reconnect to check progress.");
  // [L209] Closes the enclosing block within renderJob.
  }
  // [L210] Gets the badge, heading, and workflow-step configuration for this job status.
  const copy = STATUS_COPY[job.status];
  const terminal = job.status === "browser_closed"
    || (job.status === "failed" && job.canStartAnother !== false);
  // [L211] Stores the status in the card's data attribute for status-specific styling.
  statusCard.dataset.status = job.status;
  // [L212] Updates the status badge without rewriting unchanged text.
  updateText("#status-badge", copy.badge);
  // [L213] Updates the status heading without rewriting unchanged text.
  updateText("#status-heading", copy.title);
  // [L214] Updates the detailed progress message from the job.
  updateText("#status-message", job.message);
  // [L215] Shows the login notice only while the job is awaiting login.
  document.querySelector("#login-notice").hidden = job.status !== "awaiting_login";
  // [L216] Shows the review notice only while the job is awaiting user review.
  document.querySelector("#review-notice").hidden = job.status !== "awaiting_review";
  // [L217] Rebuilds the warning list from the current job's warnings.
  renderWarnings(job.warnings);
  canStartAnother = terminal
    || (job.canStartAnother === true && ["awaiting_review", "user_submitted"].includes(job.status));
  newOrderButton.hidden = !canStartAnother;
  newOrderNotice.hidden = !canStartAnother;
  newOrderNotice.textContent = terminal
    ? "Use new loan details and documents for your next order."
    : "Finish your current R3 order first. The next preparation will replace the current R3 form.";
  // [L218] Updates workflow-step positions only for statuses that define a numeric step.
  if (copy.step !== null) {
    // [L219] Visits each of the three workflow elements with its zero-based index.
    stepElements.forEach((element, index) => {
      // [L220] Classifies each step as complete, active, or waiting relative to the configured current step.
      const state = index < copy.step ? "complete" : index === copy.step ? "active" : "waiting";
      // [L221] Stores the computed step state for CSS styling.
      element.dataset.state = state;
      // [L222] Shows a check mark for complete steps and the one-based step number otherwise.
      element.querySelector(".workflow-marker").textContent = state === "complete" ? "✓" : String(index + 1);
      // [L223] Marks the active workflow step as the current step for assistive technology.
      if (state === "active") element.setAttribute("aria-current", "step");
      // [L224] Removes the current-step marker from steps that are not active.
      else element.removeAttribute("aria-current");
    // [L225] Ends the workflow-marker update loop.
    });
  // [L226] Closes the enclosing block within renderJob.
  }
  // [L227] Handles failed or browser-closed jobs as terminal for this form session.
  if (terminal) {
    // [L228] Visits all steps to clear any active progress state after termination.
    stepElements.forEach((element) => {
      // [L229] Removes each step's accessibility current-step marker.
      element.removeAttribute("aria-current");
      // [L230] Returns a formerly active step to the waiting appearance.
      if (element.dataset.state === "active") element.dataset.state = "waiting";
    // [L231] Ends the terminal-state workflow cleanup loop.
    });
    // [L232] Clears the in-memory job ID so further polling is no longer scheduled.
    activeJobId = null;
    // [L233] Removes the persisted active job ID from session storage.
    saveJobId(null);
    // Keep the previous loan visible until the user explicitly starts another order.
    setFormAvailable(false, "Order preparation ended");
  // [L235] Closes the enclosing block within renderJob.
  }
  // [L236] Detects a newly entered login or review status so the interface can call attention to it once.
  if ((job.status === "awaiting_login" || job.status === "awaiting_review") && lastStatus !== job.status) {
    // [L237] Scrolls the status card into view for the user's required action.
    scrollToProgress();
  // [L238] Closes the enclosing block within renderJob.
  }
  // [L239] Remembers the rendered status for transition detection on the next update.
  lastStatus = job.status;
// [L240] Closes the enclosing block within renderJob.
}
// [L241] Blank line separating the surrounding declarations, statements, or document blocks.

// [L242] Defines the minimum structural validation expected of a job response.
function isValidJob(job) {
  // [L243] Returns true only for a job with a nonempty string ID, string message, and recognized own-property status.
  return Boolean(job && typeof job.id === "string" && job.id && typeof job.message === "string" && Object.hasOwn(STATUS_COPY, job.status));
// [L244] Closes the enclosing block within isValidJob.
}
// [L245] Blank line separating the surrounding declarations, statements, or document blocks.

// [L246] Defines a text update helper that avoids rewriting unchanged content.
function updateText(selector, value) {
  // [L247] Finds the element targeted by the supplied CSS selector.
  const element = document.querySelector(selector);
  // [L248] Documents the design constraint: Avoid announcing an unchanged status on every polling response.
  // Avoid announcing an unchanged status on every polling response.
  // [L249] Writes the new text only when it differs from the element's current text.
  if (element.textContent !== value) element.textContent = value;
// [L250] Closes the enclosing block within updateText.
}
// [L251] Blank line separating the surrounding declarations, statements, or document blocks.

// [L252] Defines scrolling that brings the progress card into view while respecting reduced-motion preferences.
function scrollToProgress() {
  // [L253] Uses instant scrolling for reduced-motion preference and smooth scrolling otherwise.
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  // [L254] Scrolls the status card into the nearest visible block position using the chosen behavior.
  statusCard.scrollIntoView({ behavior, block: "nearest" });
// [L255] Closes the enclosing block within scrollToProgress.
}
// [L256] Blank line separating the surrounding declarations, statements, or document blocks.

// [L257] Defines displaying a connection problem and offering a manual reconnect action.
function showConnectionIssue(message) {
  // [L258] Writes the connection-problem message as plain text.
  connectionMessage.textContent = message;
  // [L259] Shows the connection-message element.
  connectionMessage.hidden = false;
  // [L260] Shows the reconnect button.
  reconnectButton.hidden = false;
// [L261] Closes the enclosing block within showConnectionIssue.
}
// [L262] Blank line separating the surrounding declarations, statements, or document blocks.

// [L263] Defines clearing the displayed connection problem and retry backoff.
function clearConnectionIssue() {
  // [L264] Hides the connection-message element.
  connectionMessage.hidden = true;
  // [L265] Hides the reconnect button.
  reconnectButton.hidden = true;
  // [L266] Resets retry counting after connectivity succeeds.
  reconnectAttempts = 0;
// [L267] Closes the enclosing block within clearConnectionIssue.
}
// [L268] Blank line separating the surrounding declarations, statements, or document blocks.

// [L269] Defines scheduling of the next status request with an optional delay.
function schedulePoll(delay = POLL_INTERVAL_MS) {
  // [L270] Cancels any previously scheduled status poll before replacing it.
  window.clearTimeout(pollTimer);
  // [L271] Schedules pollJob after the requested delay only while an active job ID exists.
  if (activeJobId) pollTimer = window.setTimeout(pollJob, delay);
// [L272] Closes the enclosing block within schedulePoll.
}
// [L273] Blank line separating the surrounding declarations, statements, or document blocks.

// [L274] Defines fetching and rendering current job progress with missing-session handling and retry backoff.
async function pollJob() {
  if (!activeJobId || pollInProgress) return;
  const jobId = activeJobId;
  const generation = jobGeneration;
  const poll = {};
  pollInProgress = poll;
  reconnectButton.disabled = true;
  const isCurrent = () => generation === jobGeneration && activeJobId === jobId;
  try {
    const body = await requestJson(`/api/jobs/${encodeURIComponent(jobId)}`);
    if (!isCurrent()) return;
    if (!isValidJob(body?.job) || body.job.id !== jobId) {
      throw new WorkspaceError("The workspace did not return order progress. Reconnect to check again.");
    }
    if (body.companion) updateCompanion(body.companion);
    renderJob(body.job);
    clearConnectionIssue();
    schedulePoll();
  } catch (error) {
    if (!isCurrent()) return;
    if (error.code === "WORKSPACE_LOGIN_REQUIRED") { requireWorkspaceLogin(); return; }
    if (hostingMode === "hosted") updateCompanion({ paired: companionState.paired, connected: false });
    if (error.status === 404 || error.status === 410) {
      activeJobId = null;
      saveJobId(null);
      showConnectionIssue("This order session is no longer available. Check any open R3 AMC browser before preparing another order.");
      reconnectButton.hidden = true;
      statusCard.dataset.status = "failed";
      updateText("#status-badge", "Unavailable");
      updateText("#status-heading", "Order session unavailable.");
      updateText("#status-message", "The workspace no longer has progress for this order.");
      document.querySelector("#login-notice").hidden = true;
      document.querySelector("#review-notice").hidden = true;
      stepElements.forEach((element) => {
        element.removeAttribute("aria-current");
        if (element.dataset.state === "active") element.dataset.state = "waiting";
      });
      canStartAnother = true;
      newOrderButton.hidden = false;
      newOrderNotice.hidden = false;
      newOrderNotice.textContent = "Check any open R3 order before starting another preparation.";
      setFormAvailable(false, "Order session unavailable");
    } else {
      reconnectAttempts += 1;
      showConnectionIssue(`${error.message} Your order may still be running. Reconnecting automatically…`);
      schedulePoll(Math.min(POLL_INTERVAL_MS * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS));
    }
  } finally {
    if (pollInProgress === poll) {
      pollInProgress = null;
      reconnectButton.disabled = false;
    }
  }
}
// [L311] Blank line separating the surrounding declarations, statements, or document blocks.

// [L312] Defines clearing of the API key and both selected document files from the form.
function clearSensitiveFields() {
  // [L313] Erases the API-key input's current value.
  apiKeyInput.value = "";
  // [L314] Visits both upload controls to clear selected documents.
  documentInputs.forEach((input) => {
    // [L315] Clears the upload input's selected file.
    input.value = "";
    // [L316] Refreshes the empty-selection message and clears obsolete file-validation state.
    updateFileSelection(input);
  // [L317] Ends the document-clearing loop.
  });
// [L318] Closes the enclosing block within clearSensitiveFields.
}
// [L319] Blank line separating the surrounding declarations, statements, or document blocks.

// [L320] Defines adopting a newly accepted or recovered job and starting progress tracking.
function acceptJob(job, scroll = true) {
  if (!isValidJob(job) || job.id === predecessorJobId) {
    throw new WorkspaceError("Could not confirm that your order was accepted. Reconnect to check your order before trying again.");
  }
  jobGeneration += 1;
  pollInProgress = null;
  reconnectButton.disabled = false;
  activeJobId = job.id;
  lastJobId = job.id;
  predecessorJobId = null;
  saveJobId(activeJobId);
  clearSensitiveFields();
  clearConnectionIssue();
  setFormAvailable(false, "Order preparation in progress");
  renderJob(job);
  if (scroll) scrollToProgress();
  schedulePoll();
}

function prepareAnotherOrder() {
  if (!canStartAnother || requestInProgress || !sessionReady || (hostingMode === "hosted" && !companionState.connected)) return;
  const reusingBrowser = ["awaiting_review", "user_submitted"].includes(lastStatus);
  predecessorJobId = lastJobId;
  jobGeneration += 1;
  activeJobId = null;
  lastJobId = null;
  pollInProgress = null;
  reconnectButton.disabled = false;
  window.clearTimeout(pollTimer);
  saveJobId(null);
  canStartAnother = false;
  newOrderButton.hidden = true;
  newOrderNotice.hidden = true;
  clearSensitiveFields();
  document.querySelector("#loanNumber").value = "";
  document.querySelector("#fhaCaseNumber").value = "";
  document.querySelector("#rushOrder").checked = false;
  clearErrors();
  renderWarnings([]);
  clearConnectionIssue();
  document.querySelector("#login-notice").hidden = true;
  document.querySelector("#review-notice").hidden = true;
  stepElements.forEach((element, index) => {
    element.dataset.state = "waiting";
    element.removeAttribute("aria-current");
    element.querySelector(".workflow-marker").textContent = String(index + 1);
  });
  statusCard.dataset.status = "ready";
  updateText("#status-badge", "Ready");
  updateText("#status-heading", "Ready for another order.");
  updateText("#status-message", reusingBrowser
    ? "Enter the next loan's details and documents. Finish your current R3 order first; the next preparation will replace its form."
    : "Enter the next loan's details and documents to begin.");
  lastStatus = null;
  setFormAvailable(true);
  document.querySelector("#loanNumber").focus();
}
// [L333] Blank line separating the surrounding declarations, statements, or document blocks.

// [L334] Defines recovery of a possibly accepted order through session lookup rather than another POST.
async function recoverAcceptedJob(previousJobId, generation) {
  // A lost POST response must be recovered by reading status, never by resubmitting.
  try {
    const session = await requestJson("/api/session");
    if (generation !== jobGeneration) return false;
    if (typeof session?.csrfToken === "string" && session.csrfToken) csrfToken = session.csrfToken;
    if (session.companion) updateCompanion(session.companion);
    if (!isValidJob(session?.activeJob) || session.activeJob.id === previousJobId) return false;
    acceptJob(session.activeJob);
    return true;
  } catch {
    return false;
  }
}
// [L346] Blank line separating the surrounding declarations, statements, or document blocks.

// [L347] Defines the form-submit handler for validating and uploading an order-preparation request.
async function submitOrder(event) {
  // [L348] Stops the browser's normal form navigation so JavaScript can manage the request.
  event.preventDefault();
  // [L349] Ignores submission during another request, while a job is active, or before session readiness.
  if (requestInProgress || activeJobId || !sessionReady || (hostingMode === "hosted" && !companionState.connected)) return;
  // [L350] Clears previous form errors before validating the new request.
  clearErrors();
  // [L351] Revalidates both selected document inputs and refreshes their selection displays.
  documentInputs.forEach(updateFileSelection);
  // [L352] Shows native form-validation errors and stops if any required field or constraint fails.
  if (!form.reportValidity()) return;
  // [L353] Captures the form's current successful controls and files into multipart FormData before disabling them.
  const data = new FormData(form);
  const generation = jobGeneration;
  const previousJobId = predecessorJobId;
  // [L354] Marks the order request in progress to block duplicate submissions.
  requestInProgress = true;
  // [L355] Disables the form and displays the document-upload progress label.
  setFormAvailable(false, "Sending your documents…");
  // [L356] Attempts the order-preparation POST and acceptance handling.
  try {
    // [L357] Posts the multipart form data to the form's action URL with the current CSRF token header.
    const body = await requestJson(form.action, { method: "POST", body: data, headers: { "X-CSRF-Token": csrfToken } });
    // [L358] Validates and adopts the response's accepted job.
    if (generation !== jobGeneration) return;
    acceptJob(body?.job);
  // [L359] Handles POST failures and responses whose acceptance cannot be confirmed.
  } catch (error) {
    // [L360] Classifies missing status, server errors, conflicts, and malformed successful responses as uncertain acceptance.
    const acceptanceUncertain = !error.status || error.status >= 500 || error.status === 409 || (error.status >= 200 && error.status < 300);
    // [L361] Attempts session-based recovery only when the POST may already have been accepted.
    if (generation !== jobGeneration) return;
    const recovered = acceptanceUncertain && await recoverAcceptedJob(previousJobId, generation);
    // [L362] Shows a submit error only when an existing accepted order was not recovered.
    if (!recovered) {
      // [L363] Checks whether authentication or CSRF rejection requires workspace-session renewal.
      if (error.code === "WORKSPACE_LOGIN_REQUIRED") {
        requireWorkspaceLogin();
      } else if (error.status === 401 || error.status === 403) {
        // [L364] Marks the session unready after a 401 or 403 response.
        sessionReady = false;
        // [L365] Shows guidance to reconnect and renew the workspace session before retrying.
        showConnectionIssue("Reconnect to renew your workspace session, then try again.");
      // [L366] Closes the enclosing block within submitOrder.
      }
      // [L367] Displays an error title distinguishing uncertain acceptance from a definite start failure.
      showError(error, acceptanceUncertain ? "Could not confirm order preparation" : "Your order could not be started");
      // [L368] Restores form availability only when no active job exists, using a label appropriate to session readiness.
      if (!activeJobId) setFormAvailable(sessionReady, sessionReady ? "Prepare appraisal order" : "Workspace connection needed");
    // [L369] Closes the enclosing block within submitOrder.
    }
  // [L370] Begins submission cleanup that runs after success or failure.
  } finally {
    // [L371] Clears the request-in-progress flag.
    requestInProgress = false;
    refreshFormAvailability();
    // [L372] Marks the form as no longer busy for assistive technology.
    form.setAttribute("aria-busy", "false");
  // [L373] Closes the enclosing block within submitOrder.
  }
// [L374] Closes the enclosing block within submitOrder.
}
// [L375] Blank line separating the surrounding declarations, statements, or document blocks.

// [L376] Defines session initialization, provider configuration, and recovery of server- or storage-known jobs.
async function initializeSession() {
  const generation = jobGeneration;
  reconnectButton.disabled = true;
  try {
    const session = await requestJson("/api/session");
    if (generation !== jobGeneration) return;
    if (typeof session?.csrfToken !== "string" || !session.csrfToken) {
      throw new WorkspaceError("Could not establish a secure workspace session. Reconnect to try again.");
    }
    csrfToken = session.csrfToken;
    sessionReady = true;
    configureHostedWorkspace(session);
    scheduleCompanionPoll();
    configureProviders(session);
    clearConnectionIssue();
    if (isValidJob(session.activeJob) && session.activeJob.id !== predecessorJobId) {
      acceptJob(session.activeJob, false);
      return;
    }
    activeJobId = predecessorJobId ? null : readSavedJobId();
    if (activeJobId) {
      lastJobId = activeJobId;
      setFormAvailable(false, "Restoring order progress…");
      await pollJob();
      if (generation === jobGeneration && activeJobId) submitLabel.textContent = "Order preparation in progress";
    } else {
      setFormAvailable(true);
    }
  } catch (error) {
    if (generation !== jobGeneration) return;
    if (error.code === "WORKSPACE_LOGIN_REQUIRED") { requireWorkspaceLogin(); return; }
    sessionReady = false;
    setFormAvailable(false, "Workspace connection needed");
    showConnectionIssue(error.message);
  } finally {
    if (generation === jobGeneration) reconnectButton.disabled = false;
  }
}
// [L407] Blank line separating the surrounding declarations, statements, or document blocks.

// [L408] Registers submitOrder as the handler for browser form-submit events.
form.addEventListener("submit", submitOrder);
workspaceLoginForm.addEventListener("submit", loginWorkspace);
pairingButton.addEventListener("click", createPairingCode);
document.querySelector("#copy-pairing-button").addEventListener("click", async () => {
  const field = document.querySelector("#pairing-token");
  if (!field.value) return;
  try {
    await navigator.clipboard.writeText(field.value);
    updateText("#pairing-copy-status", "Pairing code copied.");
  } catch {
    field.focus(); field.select();
    updateText("#pairing-copy-status", "Select and copy this code to your Windows companion.");
  }
});
newOrderButton.addEventListener("click", prepareAnotherOrder);
// [L409] Registers the handler that swaps provider-specific model values and key guidance.
providerInput.addEventListener("change", () => {
  // [L410] Ignores change events that do not actually change the selected provider.
  if (providerInput.value === selectedProvider) return;
  // [L411] Remembers the outgoing provider's custom model value in page memory.
  customModels[selectedProvider] = modelInput.value;
  // [L412] Sets the newly selected provider from the dropdown.
  selectedProvider = providerInput.value;
  // [L413] Restores that provider's previously entered custom model value.
  modelInput.value = customModels[selectedProvider];
  // [L414] Clears the API key when switching providers so the old provider's key is not reused in the form.
  apiKeyInput.value = "";
  // [L415] Clears the previous invalid-state marker on the API-key input.
  apiKeyInput.removeAttribute("aria-invalid");
  // [L416] Clears the previous invalid-state marker on the model input.
  modelInput.removeAttribute("aria-invalid");
  // [L417] Updates provider names, default-model placeholders, and capability/billing guidance.
  updateProviderFields();
// [L418] Ends and registers the provider-change callback.
});
// [L419] Registers file-selection display and validation whenever either document input changes.
documentInputs.forEach((input) => input.addEventListener("change", () => updateFileSelection(input)));
// [L420] Registers a form-wide input handler to clear stale invalid-field markers as users edit.
form.addEventListener("input", (event) => {
  // [L421] Removes aria-invalid from an edited event target when it is an HTML element.
  if (event.target instanceof HTMLElement) event.target.removeAttribute("aria-invalid");
// [L422] Ends and registers the form-input callback.
});
// [L423] Registers the asynchronous reconnect-button handler.
reconnectButton.addEventListener("click", async () => {
  // [L424] Cancels the scheduled poll before starting manual reconnection.
  window.clearTimeout(pollTimer);
  // [L425] Immediately polls progress when an initialized session and active order already exist.
  if (sessionReady && activeJobId) await pollJob();
  // [L426] Otherwise initializes or renews the workspace session.
  else await initializeSession();
// [L427] Ends and registers the reconnect-button callback.
});
// [L428] Registers a handler for page display, including restoration from the back-forward cache.
window.addEventListener("pageshow", (event) => {
  // [L429] Clears API-key and file fields when the page is restored from a persisted browser page cache.
  if (event.persisted) {
    clearSensitiveFields();
    workspaceAccessCode.value = "";
    clearPairingCode();
    if (hostingMode === "hosted") void initializeSession();
  }
// [L430] Ends and registers the page-show callback.
});
// [L431] Blank line separating the surrounding declarations, statements, or document blocks.

// [L432] Starts asynchronous workspace-session initialization and explicitly discards its promise value.
void initializeSession();
