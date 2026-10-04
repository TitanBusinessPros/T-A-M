const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { creditsForSession } = require('./credits');

initializeApp();
const db = getFirestore();
const stripe = new Stripe('sk_test_signature_verification_only');
const webhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const region = 'us-central1';
const gameBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/space-game.html';
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function googleUser(request) {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com') {
    throw new HttpsError('unauthenticated', 'Sign in with Google to use credits.');
  }
  return request.auth.uid;
}

exports.stripeWebhook = onRequest(
  { region, cors: false, maxInstances: 3, secrets: [webhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('POST required');
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, req.get('stripe-signature'), webhookSecret.value(),
      );
    } catch (error) {
      logger.warn('Rejected Stripe webhook signature', error.message);
      return res.status(400).send('Invalid signature');
    }
    if (event.type !== 'checkout.session.completed') return res.json({ received: true });

    const session = event.data.object;
    try {
      const config = (await db.doc('billing/config').get()).data();
      if (!config?.paymentLinkId) return res.status(503).send('Credit link not configured');
      const credits = creditsForSession(session, config.paymentLinkId);
      if (!credits) return res.json({ received: true, credited: false });

      const uid = session.client_reference_id;
      if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
        await db.doc(`unassignedPayments/${session.id}`).set({ reason: 'missing_account', credits, createdAt: FieldValue.serverTimestamp() });
        logger.error('Paid session has no usable account reference', session.id);
        return res.json({ received: true, credited: false });
      }
      try {
        const user = await getAuth().getUser(uid);
        if (!user.providerData.some((provider) => provider.providerId === 'google.com')) throw new Error('Google login missing');
      } catch (error) {
        await db.doc(`unassignedPayments/${session.id}`).set({ reason: 'account_not_found', uid, credits, createdAt: FieldValue.serverTimestamp() });
        logger.error('Paid session account could not be verified', session.id, error.message);
        return res.json({ received: true, credited: false });
      }

      const purchaseRef = db.doc(`creditPurchases/${session.id}`);
      const accountRef = db.doc(`creditAccounts/${uid}`);
      let credited = false;
      await db.runTransaction(async (transaction) => {
        if ((await transaction.get(purchaseRef)).exists) return;
        transaction.create(purchaseRef, {
          uid, credits, stripeEventId: event.id, amountCents: session.amount_total,
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.set(accountRef, {
          credits: FieldValue.increment(credits), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        credited = true;
      });
      return res.json({ received: true, credited });
    } catch (error) {
      logger.error('Stripe credit processing failed', event.id, error);
      return res.status(500).send('Processing failed');
    }
  },
);

exports.getCreditStatus = onCall({ region, maxInstances: 3 }, async (request) => {
  const uid = googleUser(request);
  const [account, config] = await Promise.all([
    db.doc(`creditAccounts/${uid}`).get(), db.doc('billing/config').get(),
  ]);
  const paymentLinkUrl = config.data()?.paymentLinkUrl;
  let buyUrl = null;
  if (paymentLinkUrl) {
    const url = new URL(paymentLinkUrl);
    if (url.protocol === 'https:' && url.hostname === 'buy.stripe.com') {
      url.searchParams.set('client_reference_id', uid);
      buyUrl = url.toString();
    }
  }
  return { credits: account.data()?.credits || 0, buyUrl };
});

exports.createGame = onCall({ region, maxInstances: 3 }, async (request) => {
  const uid = googleUser(request);
  const title = String(request.data?.title || '').trim();
  const logoPath = String(request.data?.logoPath || '');
  const gameId = String(request.data?.requestId || '');
  if (!title || title.length > 48 || !idPattern.test(gameId)) {
    throw new HttpsError('invalid-argument', 'A valid business name and request are required.');
  }
  if (logoPath && !new RegExp(`^logos/${uid}/[0-9a-f-]{36}$`).test(logoPath)) {
    throw new HttpsError('invalid-argument', 'This logo does not belong to your account.');
  }

  const accountRef = db.doc(`creditAccounts/${uid}`);
  const redemptionRef = db.doc(`creditRedemptions/${gameId}`);
  const gameRef = db.doc(`games/${gameId}`);
  await db.runTransaction(async (transaction) => {
    const [redemption, account] = await Promise.all([
      transaction.get(redemptionRef), transaction.get(accountRef),
    ]);
    if (redemption.exists) {
      if (redemption.data().uid !== uid) throw new HttpsError('already-exists', 'This request was already used.');
      return;
    }
    if ((account.data()?.credits || 0) < 1) throw new HttpsError('failed-precondition', 'You need one credit to make this game.');
    transaction.set(accountRef, {
      credits: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.create(redemptionRef, { uid, gameId, cost: 1, createdAt: FieldValue.serverTimestamp() });
    transaction.create(gameRef, { title, logoPath, createdAt: FieldValue.serverTimestamp() });
  });
  return { gameId, gameUrl: `${gameBaseUrl}?game=${gameId}` };
});
