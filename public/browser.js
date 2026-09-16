"use strict";

const FRAME_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_QUEUED_INPUTS = 64;
const MAX_TEXT_LENGTH = 4096;
const frameImage = document.querySelector("#browser-frame");
const surface = document.querySelector("#browser-surface");
const keyboard = document.querySelector("#browser-keyboard");
const closeButton = document.querySelector("#close-browser");
const reconnectButton = document.querySelector("#reconnect-browser");
const pagePicker = document.querySelector("#page-picker");
const dialogPanel = document.querySelector("#remote-dialog");
const dialogPrompt = document.querySelector("#dialog-prompt");
const acceptDialog = document.querySelector("#accept-dialog");
const dismissDialog = document.querySelector("#dismiss-dialog");
const nativeKeys = new Set(["Enter", "Tab", "Escape", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);
const selectionKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
const wordNavigationKeys = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
const jobId = location.hash.slice(1);
const validJobId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
const browserPath = validJobId ? `/api/jobs/${jobId}/browser` : "";
let csrfToken = "";
let active = true;
let canControl = false;
let polling = false;
let sending = false;
let connecting = false;
let closing = false;
let composing = false;
let timer;
let epoch = 0;
let width = 0;
let height = 0;
let queue = [];
let dialogSignature = "";

class ViewerError extends Error {
  constructor(status = 0) { super("The viewer request did not complete."); this.status = status; }
}

async function request(path, body) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: body === undefined ? {} : { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new ViewerError(response.status);
    return await response.json();
  } catch (error) {
    throw error instanceof ViewerError ? error : new ViewerError();
  } finally { window.clearTimeout(timeout); }
}

function message(heading, status) {
  document.querySelector("#browser-heading").textContent = heading;
  document.querySelector("#browser-status").textContent = status;
}

function clearInput() {
  epoch += 1;
  queue = [];
  keyboard.value = "";
  composing = false;
}

function setControl(allowed) {
  if (!allowed) clearInput();
  canControl = allowed;
  keyboard.disabled = !allowed || !dialogPanel.hidden;
  surface.setAttribute("aria-disabled", String(keyboard.disabled));
  pagePicker.disabled = !allowed;
  acceptDialog.disabled = !allowed;
  dismissDialog.disabled = !allowed;
  dialogPrompt.disabled = !allowed;
}

function clearFrame() {
  frameImage.removeAttribute("src");
  frameImage.hidden = true;
  width = 0; height = 0;
  document.querySelector("#empty-frame").hidden = false;
  dialogPanel.hidden = true;
  dialogPrompt.value = "";
  dialogSignature = "";
}

function showInputNotice(text) {
  const notice = document.querySelector("#input-notice");
  notice.textContent = text;
  notice.hidden = !text;
}

function stop(heading, status) {
  active = false;
  window.clearTimeout(timer);
  setControl(false);
  clearFrame();
  csrfToken = "";
  closeButton.disabled = true;
  reconnectButton.hidden = true;
  message(heading, status);
}

function handleFailure(error, inputWasSent = false) {
  setControl(false);
  if (error.status === 401 || error.status === 403) {
    stop("Workspace sign-in needed", "Return to Appraisal Desk and sign in, then reopen this browser from your order. No input will be retried.");
  } else if (error.status === 404 || error.status === 410) {
    stop("Browser session unavailable", "Return to Appraisal Desk to check your order. The browser may have closed or the application may have restarted. Check R3 acceptance before starting another order.");
  } else if (error.status === 409) {
    message("Waiting for your browser", "The browser is starting or automation has control. This viewer reconnects automatically when it is ready.");
    if (inputWasSent) showInputNotice("Control changed. Queued input was cleared; check the current page before typing again.");
  } else {
    clearFrame();
    message("Viewer disconnected", "Checking the connection automatically. Your browser may still be running. Check the current page before continuing; uncertain input is never retried.");
    reconnectButton.hidden = false;
    if (inputWasSent) showInputNotice("The last action may have reached R3. Inspect the page before repeating it, especially a submission.");
  }
}

function renderPages(pages) {
  const validPages = Array.isArray(pages) ? pages.filter(page => typeof page.id === "string" && typeof page.title === "string") : [];
  const selected = validPages.find(page => page.selected)?.id;
  // Keep focus and selection stable while the user opens the native picker.
  const signature = JSON.stringify(validPages.map(page => [page.id, page.title, page.selected]));
  if (pagePicker.dataset.pages !== signature) {
    pagePicker.replaceChildren(...validPages.map((page, index) => {
      const option = document.createElement("option");
      option.value = page.id;
      option.textContent = page.title.slice(0, 160) || `R3 page ${index + 1}`;
      return option;
    }));
    if (selected) pagePicker.value = selected;
    pagePicker.dataset.pages = signature;
  }
  document.querySelector("#page-picker-label").hidden = validPages.length < 2;
}

function renderDialog(dialog) {
  const present = dialog && typeof dialog.message === "string" && ["alert", "confirm", "prompt", "beforeunload"].includes(dialog.type);
  dialogPanel.hidden = !present;
  if (!present) {
    dialogSignature = ""; dialogPrompt.value = ""; return;
  }
  const signature = JSON.stringify([dialog.type, dialog.message, dialog.defaultValue]);
  if (signature !== dialogSignature) {
    dialogPrompt.value = dialog.type === "prompt" && typeof dialog.defaultValue === "string" ? dialog.defaultValue.slice(0, MAX_TEXT_LENGTH) : "";
    dialogSignature = signature;
  }
  document.querySelector("#dialog-message").textContent = dialog.message;
  document.querySelector("#dialog-prompt-label").hidden = dialog.type !== "prompt";
  dismissDialog.hidden = dialog.type === "alert";
}

function renderFrame(frame) {
  if (!frame || typeof frame.image !== "string" || !["authenticating", "preparing", "review"].includes(frame.phase)) throw new ViewerError();
  if (frame.image) {
    if (!Number.isFinite(frame.width) || !Number.isFinite(frame.height) || frame.width <= 0 || frame.height <= 0) throw new ViewerError();
    width = frame.width; height = frame.height;
    frameImage.src = `data:image/jpeg;base64,${frame.image}`;
    frameImage.hidden = false;
    document.querySelector("#empty-frame").hidden = true;
  }
  renderPages(frame.pages);
  renderDialog(frame.dialog);
  // Preparation is never interactive, even if an inconsistent response claims otherwise.
  setControl(frame.canControl === true && frame.phase !== "preparing");
  closeButton.disabled = false;
  reconnectButton.hidden = true;
  if (!canControl && frame.phase !== "preparing") message("Browser control paused", "Waiting for the application to hand control back to you. Mouse and keyboard input are paused.");
  else if (frame.phase === "authenticating") message("Sign in to R3 AMC", "You have control. Sign in and complete any CAPTCHA in the browser below. Preparation resumes automatically.");
  else if (frame.phase === "review") message("Review and finish your order", "Automation has finished. You have control to review, correct, and submit. Confirm acceptance on R3 itself.");
  else message("Preparing your R3 order", "Automation is preparing the order. Mouse and keyboard input are paused until your review is ready.");
}

function schedulePoll(delay = FRAME_INTERVAL_MS) {
  window.clearTimeout(timer);
  if (active) timer = window.setTimeout(pollFrame, delay);
}

async function pollFrame() {
  if (!active || !csrfToken || closing) return;
  if (polling || sending) { schedulePoll(); return; }
  polling = true;
  const currentEpoch = epoch;
  try {
    const body = await request(browserPath);
    if (active && currentEpoch === epoch) renderFrame(body.frame);
  } catch (error) {
    if (active && currentEpoch === epoch) handleFailure(error);
  } finally {
    polling = false;
    if (queue.length) void sendQueue();
    schedulePoll();
  }
}

function enqueue(action, changePage = false) {
  if (!active || !canControl) return;
  if (queue.length >= MAX_QUEUED_INPUTS) {
    setControl(false);
    showInputNotice("Typing was faster than the connection. Pending input was cleared; check the field before continuing.");
    schedulePoll(0);
    return;
  }
  if (action.type === "text" && (!action.text || action.text.length > MAX_TEXT_LENGTH)) {
    showInputNotice("Paste or type up to 4,096 characters at a time.");
    return;
  }
  if (changePage) setControl(false);
  queue.push({ action, epoch });
  void sendQueue();
}

async function sendQueue() {
  if (sending || polling || !active) return;
  sending = true;
  try {
    while (active && queue.length) {
      const item = queue.shift();
      if (item.epoch !== epoch) continue;
      try {
        await request(`${browserPath}/input`, item.action);
      } catch (error) {
        if (active && item.epoch === epoch) handleFailure(error, true);
        break;
      }
    }
  } finally { sending = false; schedulePoll(0); }
}

function clickBrowser(event) {
  if (!canControl || !dialogPanel.hidden || frameImage.hidden || !width || !height) return;
  const bounds = frameImage.getBoundingClientRect();
  const x = Math.floor((event.clientX - bounds.left) * width / bounds.width);
  const y = Math.floor((event.clientY - bounds.top) * height / bounds.height);
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  event.preventDefault();
  keyboard.focus({ preventScroll: true });
  enqueue({ type: "click", x, y, button: event.type === "contextmenu" ? "right" : "left" });
}
frameImage.addEventListener("click", clickBrowser);
frameImage.addEventListener("contextmenu", clickBrowser);
frameImage.addEventListener("dragstart", event => event.preventDefault());
frameImage.addEventListener("wheel", event => {
  if (!canControl || !dialogPanel.hidden || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? height : 1;
  enqueue({ type: "scroll", deltaX: Math.max(-2000, Math.min(2000, event.deltaX * unit)), deltaY: Math.max(-2000, Math.min(2000, event.deltaY * unit)) });
}, { passive: false });

keyboard.addEventListener("keydown", event => {
  if (!canControl || event.isComposing || composing) return;
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "a") {
    event.preventDefault(); enqueue({ type: "key", key: event.metaKey ? "Meta+A" : "Control+A" }); return;
  }
  if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && wordNavigationKeys.has(event.key)) {
    event.preventDefault(); enqueue({ type: "key", key: `Control+${event.key}` }); return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || !nativeKeys.has(event.key)) return;
  event.preventDefault();
  const shift = event.shiftKey && (event.key === "Tab" || selectionKeys.has(event.key));
  enqueue({ type: "key", key: shift ? `Shift+${event.key}` : event.key });
  if (event.key === "Escape") closeButton.focus();
});
keyboard.addEventListener("compositionstart", () => { composing = true; });
keyboard.addEventListener("compositionend", event => {
  composing = false;
  keyboard.value = "";
  if (canControl && event.data) enqueue({ type: "text", text: event.data });
});
keyboard.addEventListener("input", event => {
  if (composing || event.isComposing) return;
  const text = keyboard.value;
  keyboard.value = "";
  if (text) enqueue({ type: "text", text });
});
keyboard.addEventListener("paste", event => {
  event.preventDefault();
  keyboard.value = "";
  const text = event.clipboardData?.getData("text/plain");
  if (text) enqueue({ type: "text", text });
});
keyboard.addEventListener("blur", () => { keyboard.value = ""; composing = false; });
pagePicker.addEventListener("change", () => enqueue({ type: "select-page", pageId: pagePicker.value }, true));
function resolveDialog(accept) {
  const action = { type: "dialog", accept };
  if (accept && !document.querySelector("#dialog-prompt-label").hidden) action.promptText = dialogPrompt.value;
  dialogPrompt.value = "";
  enqueue(action, true);
}
acceptDialog.addEventListener("click", () => resolveDialog(true));
dismissDialog.addEventListener("click", () => resolveDialog(false));

closeButton.addEventListener("click", async () => {
  if (!active || closeButton.disabled) return;
  if (!window.confirm("Close the cloud R3 browser? Unsaved work will be lost. Closing this viewer tab instead keeps the cloud browser running.")) return;
  closing = true;
  setControl(false);
  closeButton.disabled = true;
  try {
    await request(`${browserPath}/close`, {});
    stop("Cloud browser closed", "Return to Appraisal Desk when you are ready to prepare another order.");
  } catch (error) {
    closing = false;
    handleFailure(error, true);
    schedulePoll();
  }
});

async function connect() {
  if (connecting || !validJobId) return;
  connecting = true;
  reconnectButton.disabled = true;
  setControl(false);
  try {
    const session = await request("/api/session");
    if (!active) return;
    if (session.browserMode !== "azure" || typeof session.csrfToken !== "string" || !session.csrfToken) {
      stop("Cloud browser unavailable", "Open this viewer from an Azure browser order in Appraisal Desk."); return;
    }
    csrfToken = session.csrfToken;
    await pollFrame();
  } catch (error) { if (active) handleFailure(error); }
  finally { connecting = false; reconnectButton.disabled = false; }
}
reconnectButton.addEventListener("click", () => { showInputNotice(""); void connect(); });
window.addEventListener("pagehide", () => {
  active = false;
  window.clearTimeout(timer);
  setControl(false); clearFrame(); csrfToken = "";
});
window.addEventListener("pageshow", event => { if (event.persisted) { active = true; void connect(); } });
if (!validJobId) stop("Choose an order first", "Return to Appraisal Desk and use Open R3 browser on your current order.");
else void connect();
