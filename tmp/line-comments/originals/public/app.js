"use strict";

const MAX_PDF_BYTES = 15728640; // 15.7 MB
const POLL_INTERVAL_MS = 2500;
const MAX_RECONNECT_DELAY_MS = 15000;
const REQUEST_TIMEOUT_MS = 45000;
const ACTIVE_JOB_STORAGE_KEY = "appraisal-desk-active-job";
const TERMINAL_STATUSES = new Set(["browser_closed", "failed"]);
const STATUS_COPY = {
  queued: { badge: "Starting", title: "Your order is in progress.", step: 0 },
  extracting: { badge: "Reading", title: "Reading your documents.", step: 0 },
  awaiting_login: { badge: "Sign in", title: "Sign in to R3 AMC.", step: 1 },
  preparing: { badge: "Preparing", title: "Preparing your R3 order.", step: 1 },
  awaiting_review: { badge: "Your review", title: "Review and finish your order.", step: 2 },
  user_submitted: { badge: "Submitted", title: "Submission detected.", step: 3 },
  browser_closed: { badge: "Closed", title: "Your browser session is closed.", step: null },
  failed: { badge: "Needs attention", title: "Preparation needs attention.", step: null },
};

const form = document.querySelector("#order-form");
const orderFields = document.querySelector("#order-fields");
const submitButton = document.querySelector("#submit-button");
const submitLabel = document.querySelector("#submit-label");
const errorPanel = document.querySelector("#form-error");
const statusCard = document.querySelector("#status-card");
const reconnectButton = document.querySelector("#reconnect-button");
const connectionMessage = document.querySelector("#connection-message");
const documentInputs = ["urla", "salesContract"].map((id) => document.getElementById(id));
const stepElements = ["step-extract", "step-prepare", "step-review"].map((id) => document.getElementById(id));
const providerInput = document.querySelector("#provider");
const modelInput = document.querySelector("#model");
const apiKeyInput = document.querySelector("#apiKey");
const providerNames = { openai: "OpenAI", anthropic: "Anthropic", google: "Google Gemini", xai: "Grok" };
const modelDefaults = { openai: "gpt-5.6-sol", anthropic: "claude-opus-5", google: "gemini-3.8-flash", xai: "grok-4.6" };
// Custom model choices stay only in this page's memory, separately for each provider.
const customModels = { openai: "", anthropic: "", google: "", xai: "" };
let selectedProvider = providerInput.value;
let providerInitialized = false;

let csrfToken = "";
let activeJobId = null;
let pollTimer = null;
let reconnectAttempts = 0;
let sessionReady = false;
let pollInProgress = false;
let requestInProgress = false;
let lastStatus = null;

class WorkspaceError extends Error {
  constructor(message, status = 0, details = []) {
    super(message);
    this.name = "WorkspaceError";
    this.status = status;
    this.details = details;
  }
}

function updateProviderFields() {
  const name = providerNames[selectedProvider];
  const recipient = selectedProvider === "xai" ? "xAI" : name;
  const defaultModel = modelDefaults[selectedProvider];
  updateText("#api-key-label", `${name} API key`);
  apiKeyInput.placeholder = `Enter your ${name} API key`;
  updateText("#api-key-help", selectedProvider === "google"
    ? "Your PDFs and order details are sent to Google Gemini. API usage and data handling depend on your Google account settings and Google's terms."
    : selectedProvider === "xai"
    ? "Your document pages and order details are sent to xAI. API usage is billed to your xAI account."
    : `Your PDFs and order details are sent to ${recipient}. API usage is billed to your ${recipient} account.`);
  modelInput.placeholder = defaultModel;
  updateText("#model-help", selectedProvider === "xai"
    ? `Leave blank to use ${defaultModel}. Choose a model with image, tool, and structured-output support. Grok accepts up to 50 pages across both documents.`
    : `Leave blank to use ${defaultModel}. Choose a model available to your account with PDF, image, and tool support.`);
}

function configureProviders(session) {
  for (const provider of Object.keys(providerNames)) {
    const configured = session.modelDefaults?.[provider];
    if (typeof configured === "string" && configured.trim()) modelDefaults[provider] = configured;
  }
  if (!session.modelDefaults && typeof session.model === "string" && session.model.trim()) {
    modelDefaults.openai = session.model;
  }
  if (!providerInitialized) {
    if (Object.hasOwn(providerNames, session.defaultProvider)) providerInput.value = session.defaultProvider;
    selectedProvider = providerInput.value;
    providerInitialized = true;
  }
  // Session renewal updates defaults, never the provider or model the user chose.
  updateProviderFields();
}

function readSavedJobId() {
  try {
    return sessionStorage.getItem(ACTIVE_JOB_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveJobId(jobId) {
  // The opaque ID lets a refresh recover progress; no API key or files are stored.
  try {
    if (jobId) sessionStorage.setItem(ACTIVE_JOB_STORAGE_KEY, jobId);
    else sessionStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
  } catch {
    // A browser that blocks session storage can still complete this order.
  }
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new WorkspaceError("The workspace returned an unreadable response. Check that the local application is still running.", response.status);
    }
    if (!response.ok) {
      const message = typeof body?.error?.message === "string" ? body.error.message : "The workspace could not complete this request.";
      const details = Array.isArray(body?.error?.details) ? body.error.details : [];
      throw new WorkspaceError(message, response.status, details);
    }
    return body;
  } catch (error) {
    if (error instanceof WorkspaceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WorkspaceError("The connection timed out. Check that the local application is still running.");
    }
    throw new WorkspaceError("Could not connect to the local application. Make sure it is running, then reconnect.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function setFormAvailable(available, label = "Prepare appraisal order") {
  orderFields.disabled = !available;
  submitButton.disabled = !available;
  submitLabel.textContent = label;
  form.setAttribute("aria-busy", String(requestInProgress));
}

function clearErrors() {
  errorPanel.hidden = true;
  document.querySelector("#error-details").replaceChildren();
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
}

function showError(error, title = "Please check your order") {
  document.querySelector("#error-title").textContent = title;
  document.querySelector("#error-message").textContent = error.message;
  const detailsList = document.querySelector("#error-details");
  const details = Array.isArray(error.details) ? error.details : [];
  detailsList.replaceChildren();
  details.forEach((detail) => {
    if (!detail || typeof detail.message !== "string") return;
    const item = document.createElement("li");
    item.textContent = detail.message;
    detailsList.append(item);
    const field = typeof detail.field === "string" ? form.elements.namedItem(detail.field) : null;
    if (field instanceof HTMLElement) field.setAttribute("aria-invalid", "true");
  });
  detailsList.hidden = detailsList.childElementCount === 0;
  errorPanel.hidden = false;
  errorPanel.focus();
}

function updateFileSelection(input) {
  const file = input.files?.[0];
  const description = document.getElementById(`${input.id}-selection`);
  input.setCustomValidity("");
  input.removeAttribute("aria-invalid");
  description.dataset.selected = String(Boolean(file));
  description.textContent = file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MiB` : "No document selected";
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    input.setCustomValidity("Choose a PDF document.");
  } else if (file.size === 0) {
    input.setCustomValidity("This file is empty. Choose a PDF with content.");
  } else if (file.size > MAX_PDF_BYTES) {
    input.setCustomValidity("Choose a PDF that is no larger than 15 MiB.");
  }
  if (!input.validity.valid) input.setAttribute("aria-invalid", "true");
}

function renderWarnings(warnings) {
  const list = document.querySelector("#warnings-list");
  list.replaceChildren();
  if (Array.isArray(warnings)) {
    warnings.filter((warning) => typeof warning === "string").forEach((warning) => {
      const item = document.createElement("li");
      item.textContent = warning;
      list.append(item);
    });
  }
  document.querySelector("#job-warnings").hidden = list.childElementCount === 0;
}

function renderJob(job) {
  if (!isValidJob(job)) {
    throw new WorkspaceError("The workspace returned an unexpected order status. Reconnect to check progress.");
  }
  const copy = STATUS_COPY[job.status];
  statusCard.dataset.status = job.status;
  updateText("#status-badge", copy.badge);
  updateText("#status-heading", copy.title);
  updateText("#status-message", job.message);
  document.querySelector("#login-notice").hidden = job.status !== "awaiting_login";
  document.querySelector("#review-notice").hidden = job.status !== "awaiting_review";
  renderWarnings(job.warnings);
  if (copy.step !== null) {
    stepElements.forEach((element, index) => {
      const state = index < copy.step ? "complete" : index === copy.step ? "active" : "waiting";
      element.dataset.state = state;
      element.querySelector(".workflow-marker").textContent = state === "complete" ? "✓" : String(index + 1);
      if (state === "active") element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
  }
  if (TERMINAL_STATUSES.has(job.status)) {
    stepElements.forEach((element) => {
      element.removeAttribute("aria-current");
      if (element.dataset.state === "active") element.dataset.state = "waiting";
    });
    activeJobId = null;
    saveJobId(null);
    setFormAvailable(sessionReady, "Prepare another order");
  }
  if ((job.status === "awaiting_login" || job.status === "awaiting_review") && lastStatus !== job.status) {
    scrollToProgress();
  }
  lastStatus = job.status;
}

function isValidJob(job) {
  return Boolean(job && typeof job.id === "string" && job.id && typeof job.message === "string" && Object.hasOwn(STATUS_COPY, job.status));
}

function updateText(selector, value) {
  const element = document.querySelector(selector);
  // Avoid announcing an unchanged status on every polling response.
  if (element.textContent !== value) element.textContent = value;
}

function scrollToProgress() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  statusCard.scrollIntoView({ behavior, block: "nearest" });
}

function showConnectionIssue(message) {
  connectionMessage.textContent = message;
  connectionMessage.hidden = false;
  reconnectButton.hidden = false;
}

function clearConnectionIssue() {
  connectionMessage.hidden = true;
  reconnectButton.hidden = true;
  reconnectAttempts = 0;
}

function schedulePoll(delay = POLL_INTERVAL_MS) {
  window.clearTimeout(pollTimer);
  if (activeJobId) pollTimer = window.setTimeout(pollJob, delay);
}

async function pollJob() {
  if (!activeJobId || pollInProgress) return;
  pollInProgress = true;
  reconnectButton.disabled = true;
  try {
    const body = await requestJson(`/api/jobs/${encodeURIComponent(activeJobId)}`);
    if (!body?.job) throw new WorkspaceError("The workspace did not return order progress. Reconnect to check again.");
    renderJob(body.job);
    clearConnectionIssue();
    schedulePoll();
  } catch (error) {
    if (error.status === 404 || error.status === 410) {
      activeJobId = null;
      saveJobId(null);
      showConnectionIssue("This order session is no longer available. Check any open R3 AMC browser before preparing another order.");
      reconnectButton.hidden = true;
      statusCard.dataset.status = "failed";
      updateText("#status-badge", "Unavailable");
      updateText("#status-heading", "Order session unavailable.");
      updateText("#status-message", "The local application no longer has progress for this order.");
      document.querySelector("#login-notice").hidden = true;
      document.querySelector("#review-notice").hidden = true;
      stepElements.forEach((element) => {
        element.removeAttribute("aria-current");
        if (element.dataset.state === "active") element.dataset.state = "waiting";
      });
      setFormAvailable(sessionReady, "Prepare another order");
    } else {
      reconnectAttempts += 1;
      showConnectionIssue(`${error.message} Your order may still be running. Reconnecting automatically…`);
      schedulePoll(Math.min(POLL_INTERVAL_MS * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS));
    }
  } finally {
    pollInProgress = false;
    reconnectButton.disabled = false;
  }
}

function clearSensitiveFields() {
  apiKeyInput.value = "";
  documentInputs.forEach((input) => {
    input.value = "";
    updateFileSelection(input);
  });
}

function acceptJob(job, scroll = true) {
  if (!isValidJob(job)) {
    throw new WorkspaceError("Could not confirm that your order was accepted. Reconnect to check your order before trying again.");
  }
  activeJobId = job.id;
  saveJobId(activeJobId);
  clearSensitiveFields();
  clearConnectionIssue();
  setFormAvailable(false, "Order preparation in progress");
  renderJob(job);
  if (scroll) scrollToProgress();
  schedulePoll();
}

async function recoverAcceptedJob() {
  // A lost POST response must be recovered by reading status, never by resubmitting.
  try {
    const session = await requestJson("/api/session");
    if (typeof session?.csrfToken === "string" && session.csrfToken) csrfToken = session.csrfToken;
    if (!isValidJob(session?.activeJob)) return false;
    acceptJob(session.activeJob);
    return true;
  } catch {
    return false;
  }
}

async function submitOrder(event) {
  event.preventDefault();
  if (requestInProgress || activeJobId || !sessionReady) return;
  clearErrors();
  documentInputs.forEach(updateFileSelection);
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  requestInProgress = true;
  setFormAvailable(false, "Sending your documents…");
  try {
    const body = await requestJson(form.action, { method: "POST", body: data, headers: { "X-CSRF-Token": csrfToken } });
    acceptJob(body?.job);
  } catch (error) {
    const acceptanceUncertain = !error.status || error.status >= 500 || error.status === 409 || (error.status >= 200 && error.status < 300);
    const recovered = acceptanceUncertain && await recoverAcceptedJob();
    if (!recovered) {
      if (error.status === 401 || error.status === 403) {
        sessionReady = false;
        showConnectionIssue("Reconnect to renew your workspace session, then try again.");
      }
      showError(error, acceptanceUncertain ? "Could not confirm order preparation" : "Your order could not be started");
      if (!activeJobId) setFormAvailable(sessionReady, sessionReady ? "Prepare appraisal order" : "Workspace connection needed");
    }
  } finally {
    requestInProgress = false;
    form.setAttribute("aria-busy", "false");
  }
}

async function initializeSession() {
  reconnectButton.disabled = true;
  try {
    const session = await requestJson("/api/session");
    if (typeof session?.csrfToken !== "string" || !session.csrfToken) {
      throw new WorkspaceError("Could not establish a secure workspace session. Reconnect to try again.");
    }
    csrfToken = session.csrfToken;
    sessionReady = true;
    configureProviders(session);
    clearConnectionIssue();
    if (isValidJob(session.activeJob)) {
      acceptJob(session.activeJob, false);
      return;
    }
    activeJobId = readSavedJobId();
    if (activeJobId) {
      setFormAvailable(false, "Restoring order progress…");
      await pollJob();
      if (activeJobId) submitLabel.textContent = "Order preparation in progress";
    } else {
      setFormAvailable(true);
    }
  } catch (error) {
    sessionReady = false;
    setFormAvailable(false, "Workspace connection needed");
    showConnectionIssue(error.message);
  } finally {
    reconnectButton.disabled = false;
  }
}

form.addEventListener("submit", submitOrder);
providerInput.addEventListener("change", () => {
  if (providerInput.value === selectedProvider) return;
  customModels[selectedProvider] = modelInput.value;
  selectedProvider = providerInput.value;
  modelInput.value = customModels[selectedProvider];
  apiKeyInput.value = "";
  apiKeyInput.removeAttribute("aria-invalid");
  modelInput.removeAttribute("aria-invalid");
  updateProviderFields();
});
documentInputs.forEach((input) => input.addEventListener("change", () => updateFileSelection(input)));
form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLElement) event.target.removeAttribute("aria-invalid");
});
reconnectButton.addEventListener("click", async () => {
  window.clearTimeout(pollTimer);
  if (sessionReady && activeJobId) await pollJob();
  else await initializeSession();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) clearSensitiveFields();
});

void initializeSession();
