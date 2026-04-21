![AnimLow Cortisol Banner](./assets/readme/animlow-cortisol-banner.png)

# AnimLow Cortisol

AnimLow Cortisol is a Chrome Manifest V3 extension that reads the login challenge image on Archers Hub, runs OCR locally with packaged Tesseract assets, and fills the captcha field automatically.

## What It Does

- Runs OCR locally in the browser. No captcha image data is sent to external services.
- Works on `https://archershub.dlsu.edu.ph/*`.
- Tries to autofill the captcha field after the challenge image loads.
- Lets you rerun OCR from the extension toolbar button.
- Includes an on-page checkbox to hide the captcha block after autofill.

## Install From The GitHub Release ZIP

End users do not need to run `npm install`, build the project, or install dependencies manually.

1. Go to the GitHub Releases page for this repository.
2. Download `animlow-cortisol-release.zip` from the latest release.
3. Extract the ZIP somewhere permanent on your machine.
4. Open Chrome and go to `chrome://extensions`.
5. Turn on `Developer mode` using the toggle in the top-right corner.
6. Click `Load unpacked`.
7. Select the extracted release folder.
8. Make sure the `AnimLow Cortisol` extension appears in your extensions list and is enabled.

## Use In Chrome

1. Open the Archers Hub login page in Chrome.
2. Wait for the login challenge image to finish loading.
3. The extension will try to read the image automatically and fill the captcha field.
4. If you want to rerun OCR, click the extension toolbar icon.
5. If you want the captcha block hidden after autofill, use the on-page checkbox.

## Release Artifact

- Production release ZIP: `dist/animlow-cortisol-release.zip`
- Release-ready unpacked folder: `dist/release/`
- Developer unpacked folder with localhost support: `dist/dev/`

## Developer Workflow

These steps are only for developers working from source.

```bash
npm install
npm run build
npm run check
npm run package:release
```

## Project Notes

- OCR uses packaged local assets under `vendor/` during the build process.
- The committed repository does not require end users to fetch npm dependencies.
- The release build is scoped to the production Archers Hub host only.

## Docs

- [Privacy policy](./PRIVACY.md)
- [Release checklist](./RELEASE.md)
