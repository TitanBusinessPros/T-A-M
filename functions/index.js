const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { creditsForSession } = require('./credits');
const { emailKey, grantAmount, isAdmin, normalizeEmail } = require('./admin-credits');
const { gameCost } = require('./game-pricing');
const { normalizeWebsite } = require('./website');

initializeApp();
const db = getFirestore();
const stripe = new Stripe('sk_test_signature_verification_only');
const webhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const region = 'us-central1';
const gameBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/space-game.html';
const checkersBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/checkers-game.html';
const qrMakerBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/qr-maker.html';
const websiteMakerBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/website-maker.html';
const chessBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/chess-game.html';
const pinballBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/pinball-game.html';
const invoiceGeneratorBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/invoice-generator.html';
const match3BaseUrl = 'https://titanbusinesspros.github.io/T-A-M/match-3-game.html';
const followAlongBaseUrl = 'https://titanbusinesspros.github.io/T-A-M/follow-along-game.html';
const paymentLinkUrl = 'https://buy.stripe.com/7sYfZie3T9EAdqaefJ7AI12';
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function googleUser(request) {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com') {
    throw new HttpsError('unauthenticated', 'Sign in with Google to use credits.');
  }
  return request.auth.uid;
}

async function claimPendingCredits(request) {
  const email = request.auth.token.email_verified === true
    ? normalizeEmail(request.auth.token.email) : null;
  if (!email) return;
  const pendingRef = db.doc(`pendingCreditGrants/${emailKey(email)}`);
  const accountRef = db.doc(`creditAccounts/${request.auth.uid}`);
  await db.runTransaction(async (transaction) => {
    const pending = await transaction.get(pendingRef);
    const credits = pending.data()?.credits;
    if (!Number.isSafeInteger(credits) || credits <= 0) return;
    transaction.set(accountRef, {
      credits: FieldValue.increment(credits), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.delete(pendingRef);
  });
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
      const credits = creditsForSession(session);
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
  await claimPendingCredits(request);
  const account = await db.doc(`creditAccounts/${uid}`).get();
  const url = new URL(paymentLinkUrl);
  url.searchParams.set('client_reference_id', uid);
  const buyUrl = url.toString();
  return { credits: account.data()?.credits || 0, buyUrl, isAdmin: isAdmin(request.auth.token) };
});

exports.grantCredits = onCall({ region, maxInstances: 3 }, async (request) => {
  googleUser(request);
  if (!isAdmin(request.auth.token)) {
    throw new HttpsError('permission-denied', 'Only the admin account can grant credits.');
  }
  const email = normalizeEmail(request.data?.email);
  const credits = grantAmount(request.data?.credits);
  const requestId = request.data?.requestId;
  if (!email || !credits || typeof requestId !== 'string' || !idPattern.test(requestId)) {
    throw new HttpsError('invalid-argument', 'Enter a valid email and 1 to 100 whole credits.');
  }

  const grantRef = db.doc(`adminCreditGrants/${requestId}`);
  const pendingRef = db.doc(`pendingCreditGrants/${emailKey(email)}`);
  let result;
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(grantRef);
    if (existing.exists) {
      if (existing.data().adminUid !== request.auth.uid) {
        throw new HttpsError('already-exists', 'This grant request was already used.');
      }
      result = { email: existing.data().email, credits: existing.data().credits };
      return;
    }
    transaction.create(grantRef, {
      adminUid: request.auth.uid, email, credits, createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(pendingRef, {
      credits: FieldValue.increment(credits), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    result = { email, credits };
  });
  return result;
});

exports.createGame = onCall({ region, maxInstances: 3 }, async (request) => {
  const uid = googleUser(request);
  const gameType = request.data?.gameType || 'space';
  const cost = gameCost(gameType);
  if (!cost) {
    throw new HttpsError('invalid-argument', 'Choose a valid game.');
  }
  const title = String(request.data?.title || '').trim();
  const logoPath = String(request.data?.logoPath || '');
  const gameId = String(request.data?.requestId || '');
  const website = ['qrMaker', 'chess', 'pinball', 'invoiceGenerator', 'match3', 'followAlong'].includes(gameType) ? normalizeWebsite(request.data?.website) : null;
  if (!idPattern.test(gameId) || (!['checkers', 'websiteMaker', 'chess', 'pinball', 'invoiceGenerator', 'match3', 'followAlong'].includes(gameType) && (!title || title.length > 48)) || (['checkers', 'websiteMaker', 'chess', 'pinball', 'invoiceGenerator', 'match3', 'followAlong'].includes(gameType) && title)) {
    throw new HttpsError('invalid-argument', 'A valid game request is required.');
  }
  if (gameType === 'qrMaker' && (!website || logoPath)) {
    throw new HttpsError('invalid-argument', 'A valid company website is required for the QR maker.');
  }
  if (gameType === 'websiteMaker' && !logoPath) {
    throw new HttpsError('invalid-argument', 'A logo is required for the Website Maker.');
  }
  if (gameType === 'chess' && (!logoPath || !website)) {
    throw new HttpsError('invalid-argument', 'A logo and website or social page address are required for Chess.');
  }
  if (gameType === 'pinball' && (!logoPath || !website)) {
    throw new HttpsError('invalid-argument', 'A logo and website address are required for Pinball.');
  }
  if (gameType === 'invoiceGenerator' && (!logoPath || !website)) {
    throw new HttpsError('invalid-argument', 'A logo and website address are required for the Invoice Generator.');
  }
  if (gameType === 'match3' && (!logoPath || !website)) {
    throw new HttpsError('invalid-argument', 'A logo and website address are required for Match 3.');
  }
  if (gameType === 'followAlong' && (!logoPath || !website)) {
    throw new HttpsError('invalid-argument', 'A logo and website address are required for Follow Along.');
  }
  if (gameType === 'checkers' && !logoPath) {
    throw new HttpsError('invalid-argument', 'A logo is required for Checkers.');
  }
  if (logoPath && !new RegExp(`^logos/${uid}/[0-9a-f-]{36}$`).test(logoPath)) {
    throw new HttpsError('invalid-argument', 'This logo does not belong to your account.');
  }

  await claimPendingCredits(request);

  const accountRef = db.doc(`creditAccounts/${uid}`);
  const redemptionRef = db.doc(`creditRedemptions/${gameId}`);
  const gameRef = db.doc(`games/${gameId}`);
  await db.runTransaction(async (transaction) => {
    const [redemption, account, existingGame] = await Promise.all([
      transaction.get(redemptionRef), transaction.get(accountRef), transaction.get(gameRef),
    ]);
    if (redemption.exists) {
      if (redemption.data().uid !== uid) throw new HttpsError('already-exists', 'This request was already used.');
      if ((redemption.data().gameType || 'space') !== gameType || !existingGame.exists) {
        throw new HttpsError('already-exists', 'This request was already used for a different game.');
      }
      return;
    }
    if ((account.data()?.credits || 0) < cost) throw new HttpsError('failed-precondition', `You need ${cost} credits to make this game.`);
    transaction.set(accountRef, {
      credits: FieldValue.increment(-cost), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.create(redemptionRef, { uid, gameId, gameType, cost, createdAt: FieldValue.serverTimestamp() });
    transaction.create(gameRef, {
      gameType, title, logoPath, ...(website ? { website } : {}), createdAt: FieldValue.serverTimestamp(),
    });
  });
  const baseUrl = gameType === 'checkers' ? checkersBaseUrl : gameType === 'qrMaker' ? qrMakerBaseUrl : gameType === 'websiteMaker' ? websiteMakerBaseUrl : gameType === 'chess' ? chessBaseUrl : gameType === 'pinball' ? pinballBaseUrl : gameType === 'invoiceGenerator' ? invoiceGeneratorBaseUrl : gameType === 'match3' ? match3BaseUrl : gameType === 'followAlong' ? followAlongBaseUrl : gameBaseUrl;
  return { gameId, gameUrl: `${baseUrl}?game=${gameId}` };
});
