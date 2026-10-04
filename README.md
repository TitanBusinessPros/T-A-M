# Titan App Maker

The site at https://titanbusinesspros.github.io/T-A-M/ lets a business owner sign in with Google, buy five credits for $5, and use one credit to publish a personalized space game with a QR code. A logo is optional and limited to 100 KB.

GitHub Pages hosts the app and game. Firebase Authentication identifies business owners, Cloud Storage holds logos, Firestore holds games and credit balances, and Cloud Functions verify Stripe payments and charge one credit per published game. The only required Stripe webhook event is `checkout.session.completed`, sent to `https://us-central1-titan-app-maker.cloudfunctions.net/stripeWebhook`.

Google sign-in authorized domains: `titanbusinesspros.github.io` and `localhost`, plus Firebase's default domains. Serve the directory with a local web server to test locally. Do not store the Stripe webhook signing secret in this repository.
