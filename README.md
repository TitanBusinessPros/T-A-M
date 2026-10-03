# App Maker 3000: Space Game test

This static demo lets a business owner enter a name, preview it on the space game, and create a QR code. The name is carried in the game URL, so this version does not save customer information or upload logos.

## Live test

The GitHub Pages site is deployed from the `main` branch by the workflow in `.github/workflows/pages.yml`. After deployment, open `https://titanbusinesspros.github.io/T-A-M/`, enter a name, and make a QR code; the QR link can be scanned from another device.

## Firebase

The Firebase web configuration is included in `src/firebase.js`, with Analytics turned off. Firebase Hosting, Firestore, Cloud Storage, Authentication, and Cloud Functions are not used by this static test.

## Local test

Serve this folder with a local web server (for example, VS Code Live Server). Firebase and QR helper scripts load from their CDNs, so a network connection is needed.
