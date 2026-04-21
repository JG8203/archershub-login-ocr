# Archers Hub Login OCR

Manifest V3 Chrome extension that runs local OCR against the login challenge image at `#captchaImageLogin`, fills `#txtCaptchaTextLogin`, and keeps all OCR processing inside the browser with packaged Tesseract assets.

## Release posture

- Local-only OCR. No image data is sent to external services.
- Release package targets `https://archershub.dlsu.edu.ph/*` only.
- Dev package is generated separately for `localhost` and `127.0.0.1`.

## Developer commands

```bash
npm install
npm run build
npm run check
npm run package:release
```

## Build outputs

- `dist/release/`: Chrome Web Store-ready extension bundle
- `dist/dev/`: unpacked extension bundle with localhost support
- `dist/archershub-login-ocr-release.zip`: uploadable release archive

## Use in Chrome

End users do not need to run `npm install` or build anything. Only the packaged extension output is needed.

### Load the unpacked extension

1. Get a built extension folder:
   - use `dist/release/` from a packaged build
   - or unzip `archershub-login-ocr-release.zip`
2. Open Chrome and go to `chrome://extensions`.
3. Turn on `Developer mode` using the toggle in the top-right corner.
4. Click `Load unpacked`.
5. Select one of these folders:
   - the extracted release folder for the production-host build
   - `dist/dev/` only if you are doing developer localhost testing

### Use the extension on the login page

1. Open the supported login page in Chrome.
2. Wait for the captcha image to finish loading.
3. The extension will try to read the captcha automatically and fill the captcha input.
4. Use the extension toolbar button if you want to rerun OCR manually.
5. Use the on-page checkbox if you want the captcha block hidden after autofill.

## Runtime behavior

- Runs OCR automatically on matching login pages.
- Lets the user rerun OCR from the extension toolbar button.
- Shows a helper notification with a close button and auto-dismiss.
- Keeps an on-page checkbox for hiding the captcha after autofill.

## Included files

- `content.js` and `content.css`
- `service-worker.js`
- `offscreen.html` and `offscreen.js`
- `assets/icons/` committed static PNG assets

## Release docs

- [Privacy policy](./PRIVACY.md)
- [Release checklist](./RELEASE.md)
