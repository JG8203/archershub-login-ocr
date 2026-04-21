import Tesseract from "./vendor/tesseract.esm.min.js";

const { createWorker } = Tesseract;

const MESSAGE_TYPES = {
  offscreenPing: "offscreen:ping",
  process: "ocr:process"
};

const OCR_PROVIDER = "local-tesseract";
let workerPromise = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return false;
  }

  if (message.type === MESSAGE_TYPES.offscreenPing) {
    sendResponse({ ok: true });
    return false;
  }

  if (message.type !== MESSAGE_TYPES.process) {
    return false;
  }

  void recognizeImage(message)
    .then((result) => {
      sendResponse({
        ok: true,
        text: result.text,
        confidence: result.confidence
      });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        code: "OCR_FAILED",
        message: formatError(error)
      });
    });

  return true;
});

async function recognizeImage(message) {
  if (message.provider !== OCR_PROVIDER) {
    throw new Error(`Unsupported OCR provider: ${message.provider}`);
  }

  if (typeof message.imageDataUrl !== "string" || !message.imageDataUrl.startsWith("data:image/")) {
    throw new Error("OCR input must be a valid image data URL.");
  }

  const worker = await getWorker();
  const result = await worker.recognize(message.imageDataUrl);

  return {
    text: String(result.data.text || "").trim(),
    confidence: Number(result.data.confidence || 0)
  };
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createOcrWorker().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }

  return workerPromise;
}

function createOcrWorker() {
  return createWorker("eng", 1, {
    workerPath: chrome.runtime.getURL("vendor/worker.min.js"),
    workerBlobURL: false,
    corePath: chrome.runtime.getURL("vendor"),
    langPath: chrome.runtime.getURL("vendor/lang-data")
  });
}

function formatError(error) {
  if (!error) {
    return "OCR failed.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || "OCR failed.";
  }

  if (typeof error.message === "string" && error.message) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
