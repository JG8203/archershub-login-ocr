(() => {
  const SELECTORS = {
    captchaContainer: "#captchaDiv",
    captchaImage: "#captchaImageLogin",
    captchaInput: "#txtCaptchaTextLogin",
    loadingIndicator: "#loader"
  };

  const MESSAGE_TYPES = {
    recognize: "ocr:recognize",
    retry: "ocr:retry"
  };

  const UI_IDS = {
    overlay: "captchaxd-overlay",
    hideToggleWrapper: "captchaxd-hide-toggle-wrapper",
    hideToggle: "captchaxd-hide-toggle"
  };

  const OCR_PROVIDER = "local-tesseract";
  const DEFAULT_ERROR_CODE = "CONTENT_SCRIPT_ERROR";
  const WAIT_TIMEOUT_MS = 15000;
  const WAIT_INTERVAL_MS = 100;
  const OVERLAY_TIMEOUT_MS = 5000;
  const OVERLAY_FADE_MS = 250;

  const state = {
    activeRunPromise: null,
    autoRunStarted: false,
    overlayTimerId: null,
    overlayFadeTimerId: null
  };

  initialize();

  function initialize() {
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startAutoRun, { once: true });
      return;
    }

    startAutoRun();
  }

  function startAutoRun() {
    if (state.autoRunStarted) {
      return;
    }

    state.autoRunStarted = true;
    void startOcrRun("auto");
  }

  function handleRuntimeMessage(message) {
    if (!message || message.type !== MESSAGE_TYPES.retry) {
      return false;
    }

    void startOcrRun("manual");
    return false;
  }

  function startOcrRun(trigger) {
    if (!state.activeRunPromise) {
      state.activeRunPromise = runOcrFlow(trigger)
        .catch((error) => {
          showOverlay({
            kind: "error",
            message: formatUserError(error),
            imageDataUrl: null
          });
        })
        .finally(() => {
          state.activeRunPromise = null;
        });
    }

    return state.activeRunPromise;
  }

  async function runOcrFlow(trigger) {
    const refs = await waitForCaptchaElements();
    const imageDataUrl = await captureCaptchaImage(refs.image);
    const response = await requestOcr(imageDataUrl);
    const recognizedText = normalizeRecognizedText(response.text);

    if (!recognizedText) {
      throw createError("OCR_EMPTY", "OCR returned no usable text.");
    }

    fillCaptchaInput(refs.input, recognizedText);

    const hideToggle = ensureHideToggle(refs.container);
    syncCaptchaVisibility(refs.container, hideToggle);

    showOverlay({
      kind: "success",
      message: trigger === "manual"
        ? "Captcha OCR ran again and updated the field."
        : "Captcha OCR filled the field successfully.",
      imageDataUrl
    });
  }

  async function waitForCaptchaElements() {
    const startedAt = Date.now();

    while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
      const refs = getCaptchaElements();
      if (refs && !isLoading()) {
        await ensureImageReady(refs.image);
        if (isDrawable(refs.image)) {
          return refs;
        }
      }

      await delay(WAIT_INTERVAL_MS);
    }

    throw createError("CAPTCHA_NOT_READY", "Timed out waiting for the captcha to become ready.");
  }

  function getCaptchaElements() {
    const container = document.querySelector(SELECTORS.captchaContainer);
    const image = document.querySelector(SELECTORS.captchaImage);
    const input = document.querySelector(SELECTORS.captchaInput);

    if (!(container instanceof HTMLElement)) {
      return null;
    }

    if (!(image instanceof HTMLImageElement)) {
      return null;
    }

    if (!(input instanceof HTMLInputElement)) {
      return null;
    }

    return { container, image, input };
  }

  function isLoading() {
    const loader = document.querySelector(SELECTORS.loadingIndicator);
    return loader instanceof HTMLElement && isVisible(loader);
  }

  async function captureCaptchaImage(image) {
    const sourceUrl = image.currentSrc || image.src;
    if (!sourceUrl) {
      throw createError("CAPTCHA_IMAGE_MISSING", "Captcha image does not have a source URL.");
    }

    if (sourceUrl.startsWith("data:")) {
      return sourceUrl;
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw createError("CAPTCHA_IMAGE_EMPTY", "Captcha image does not have drawable dimensions.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw createError("CANVAS_UNAVAILABLE", "Could not prepare an image buffer for OCR.");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  function ensureImageReady(image) {
    if (isDrawable(image)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(createError("CAPTCHA_IMAGE_ERROR", "Captcha image failed to load."));
      };

      const cleanup = () => {
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", handleError);
      };

      image.addEventListener("load", handleLoad, { once: true });
      image.addEventListener("error", handleError, { once: true });
    });
  }

  function isDrawable(image) {
    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
  }

  async function requestOcr(imageDataUrl) {
    let response;

    try {
      response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.recognize,
        imageDataUrl,
        provider: OCR_PROVIDER
      });
    } catch (error) {
      throw createError("OCR_REQUEST_FAILED", error?.message || "Failed to contact the OCR worker.");
    }

    if (!response?.ok) {
      throw createError(response?.code || "OCR_FAILED", response?.message || "OCR did not complete successfully.");
    }

    return response;
  }

  function normalizeRecognizedText(text) {
    return String(text || "")
      .replace(/\s+/g, "")
      .trim()
      .toUpperCase();
  }

  function fillCaptchaInput(input, value) {
    if (input.disabled || input.readOnly) {
      throw createError("CAPTCHA_INPUT_UNAVAILABLE", "Captcha input is not editable.");
    }

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ensureHideToggle(captchaContainer) {
    const nativeCheckbox = captchaContainer.querySelector('input[type="checkbox"]');
    if (nativeCheckbox instanceof HTMLInputElement) {
      nativeCheckbox.hidden = true;
      nativeCheckbox.setAttribute("aria-hidden", "true");
    }

    let wrapper = document.getElementById(UI_IDS.hideToggleWrapper);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = UI_IDS.hideToggleWrapper;
      wrapper.className = "captchaxd-toggle-row";

      const toggle = document.createElement("input");
      toggle.id = UI_IDS.hideToggle;
      toggle.className = "captchaxd-toggle-input";
      toggle.type = "checkbox";
      toggle.checked = true;

      const label = document.createElement("label");
      label.className = "captchaxd-toggle-label";
      label.htmlFor = toggle.id;
      label.textContent = "Hide captcha after autofill";

      wrapper.append(toggle, label);
    }

    captchaContainer.insertAdjacentElement("beforebegin", wrapper);

    const toggle = document.getElementById(UI_IDS.hideToggle);
    if (!(toggle instanceof HTMLInputElement)) {
      throw createError("TOGGLE_MISSING", "Captcha helper toggle could not be created.");
    }

    if (!toggle.dataset.captchaxdBound) {
      toggle.addEventListener("change", () => {
        const currentContainer = document.querySelector(SELECTORS.captchaContainer);
        if (currentContainer instanceof HTMLElement) {
          syncCaptchaVisibility(currentContainer, toggle);
        }
      });
      toggle.dataset.captchaxdBound = "true";
    }

    return toggle;
  }

  function syncCaptchaVisibility(captchaContainer, toggle) {
    captchaContainer.style.display = toggle.checked ? "none" : "";
  }

  function showOverlay({ kind, message, imageDataUrl }) {
    let overlay = document.getElementById(UI_IDS.overlay);
    if (!(overlay instanceof HTMLElement)) {
      overlay = createOverlay();
      document.documentElement.appendChild(overlay);
    }

    overlay.classList.remove("captchaxd-overlay-error", "captchaxd-overlay-success", "captchaxd-overlay-hidden");
    overlay.classList.add(kind === "error" ? "captchaxd-overlay-error" : "captchaxd-overlay-success");

    const preview = overlay.querySelector(".captchaxd-overlay-preview");
    if (preview instanceof HTMLImageElement) {
      if (imageDataUrl) {
        preview.src = imageDataUrl;
        preview.hidden = false;
      } else {
        preview.hidden = true;
        preview.removeAttribute("src");
      }
    }

    const messageNode = overlay.querySelector(".captchaxd-overlay-message");
    if (messageNode instanceof HTMLElement) {
      messageNode.textContent = message;
    }

    resetOverlayLifetime(overlay);
  }

  function createOverlay() {
    const overlay = document.createElement("section");
    overlay.id = UI_IDS.overlay;
    overlay.className = "captchaxd-overlay";

    const content = document.createElement("div");
    content.className = "captchaxd-overlay-content";

    const preview = document.createElement("img");
    preview.className = "captchaxd-overlay-preview";
    preview.alt = "Captcha preview";
    preview.hidden = true;

    const message = document.createElement("div");
    message.className = "captchaxd-overlay-message";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "captchaxd-overlay-close";
    closeButton.setAttribute("aria-label", "Dismiss message");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => removeOverlay(overlay));

    content.append(preview, message);
    overlay.append(content, closeButton);
    return overlay;
  }

  function resetOverlayLifetime(overlay) {
    window.clearTimeout(state.overlayTimerId);
    window.clearTimeout(state.overlayFadeTimerId);

    overlay.classList.remove("captchaxd-overlay-hidden");

    state.overlayTimerId = window.setTimeout(() => {
      overlay.classList.add("captchaxd-overlay-hidden");
      state.overlayFadeTimerId = window.setTimeout(() => {
        removeOverlay(overlay);
      }, OVERLAY_FADE_MS);
    }, OVERLAY_TIMEOUT_MS);
  }

  function removeOverlay(overlay) {
    window.clearTimeout(state.overlayTimerId);
    window.clearTimeout(state.overlayFadeTimerId);
    state.overlayTimerId = null;
    state.overlayFadeTimerId = null;

    if (overlay?.isConnected) {
      overlay.remove();
    }
  }

  function formatUserError(error) {
    console.error("[ArchersHub OCR]", error?.code || DEFAULT_ERROR_CODE, error);

    switch (error?.code) {
      case "CAPTCHA_NOT_READY":
        return "Captcha OCR could not start because the login form did not finish loading.";
      case "OCR_EMPTY":
        return "Captcha OCR ran, but it could not read a usable code.";
      case "CAPTCHA_INPUT_UNAVAILABLE":
        return "Captcha OCR ran, but the captcha field was not editable.";
      default:
        return error?.message || "Captcha OCR failed unexpectedly.";
    }
  }

  function createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
})();
