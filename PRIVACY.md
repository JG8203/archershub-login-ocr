# AnimLow Cortisol Privacy Policy

AnimLow Cortisol performs OCR locally inside the Chrome extension package.

## Data handling

- The extension reads the login challenge image from supported Archers Hub pages.
- The image is processed locally with packaged Tesseract OCR assets.
- The recognized text is written back into the captcha input on the current page.
- The extension does not send captcha images or OCR output to third-party servers.
- The extension does not store browsing history, account credentials, or persistent personal data.

## Permissions

- `offscreen`: used to host the OCR worker in an offscreen extension document.
- Host access to `https://archershub.dlsu.edu.ph/*`: used to run the content script only on the supported login site.

## Contact

Update this section with the owner or support contact before submission.
