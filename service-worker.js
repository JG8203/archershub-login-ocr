const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const OFFSCREEN_PING_TIMEOUT_MS = 1000;
const OFFSCREEN_PING_ATTEMPTS = 10;

const MESSAGE_TYPES = {
  offscreenPing: "offscreen:ping",
  process: "ocr:process",
  recognize: "ocr:recognize",
  retry: "ocr:retry"
};

let offscreenDocumentPromise = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (typeof tab.id !== "number") {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.retry });
  } catch (error) {
    console.error("[ArchersHub OCR] Unable to trigger a manual OCR rerun.", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return false;
  }

  if (message.type !== MESSAGE_TYPES.recognize) {
    return false;
  }

  void recognizeCaptcha(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        ok: false,
        code: "SERVICE_WORKER_ERROR",
        message: error?.message || "The OCR service worker failed unexpectedly."
      });
    });

  return true;
});

async function recognizeCaptcha(message, sender) {
  validateRecognizeMessage(message, sender);

  await ensureOffscreenDocument();
  await waitForOffscreenReady();

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.process,
    provider: message.provider,
    imageDataUrl: message.imageDataUrl
  });

  if (!response) {
    return {
      ok: false,
      code: "OCR_NO_RESPONSE",
      message: "The OCR document did not return a response."
    };
  }

  return response;
}

function validateRecognizeMessage(message, sender) {
  if (!sender.tab || typeof sender.tab.id !== "number") {
    throw new Error("OCR requests must come from a browser tab.");
  }

  if (typeof message.imageDataUrl !== "string" || !message.imageDataUrl.startsWith("data:image/")) {
    throw new Error("OCR requests must include a valid image data URL.");
  }
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (!offscreenDocumentPromise) {
    offscreenDocumentPromise = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "Run local OCR in an offscreen extension document."
    });
  }

  try {
    await offscreenDocumentPromise;
  } finally {
    offscreenDocumentPromise = null;
  }
}

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });

  return contexts.length > 0;
}

async function waitForOffscreenReady() {
  let lastError = null;

  for (let attempt = 0; attempt < OFFSCREEN_PING_ATTEMPTS; attempt += 1) {
    try {
      const response = await withTimeout(
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.offscreenPing }),
        OFFSCREEN_PING_TIMEOUT_MS
      );

      if (response?.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw lastError || new Error("The OCR document did not become ready in time.");
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timed out waiting for the OCR document.")), timeoutMs);
    })
  ]);
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
