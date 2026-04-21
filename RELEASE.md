# Release Checklist

## Before packaging

- Confirm the production host in `manifest.json` is correct.
- Update the support/contact line in `PRIVACY.md`.
- Verify the extension name, description, and version for the intended release.
- Test `dist/dev/` locally if you need localhost validation before shipping.

## Verification

- Run `npm run check`.
- Load `dist/release/` as an unpacked extension in Chrome.
- Confirm auto-run fills the captcha field on the login page.
- Confirm the toolbar button reruns OCR on demand.
- Confirm the helper popup closes manually and auto-dismisses after 5 seconds.
- Confirm no network requests are made for OCR assets.

## Packaging

- Run `npm run package:release`.
- Upload `dist/archershub-login-ocr-release.zip` to the Chrome Web Store dashboard.
- Prepare store listing text, screenshots, and the final support contact.
