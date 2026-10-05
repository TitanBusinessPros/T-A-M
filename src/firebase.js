import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD4rgfJIkOtCJbMtlSzGRchkKpEmJt3OOY',
  authDomain: 'titan-app-maker.firebaseapp.com',
  projectId: 'titan-app-maker',
  storageBucket: 'titan-app-maker.firebasestorage.app',
  messagingSenderId: '162186766781',
  appId: '1:162186766781:web:95521b2b946ead49928ad4',
  measurementId: 'G-G5B7R5G52S',
};

export const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp, 'us-central1');
export const watchUser = (callback) => onAuthStateChanged(auth, callback);
export const currentUser = () => auth.currentUser;
export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signOutUser = () => signOut(auth);
export async function getCreditStatus() {
  return (await httpsCallable(functions, 'getCreditStatus')()).data;
}
export async function grantCredits(email, credits, requestId) {
  return (await httpsCallable(functions, 'grantCredits')({ email, credits, requestId })).data;
}
export async function createGame(title, logoPath, requestId, gameType = 'space') {
  return (await httpsCallable(functions, 'createGame')({ title, logoPath, requestId, gameType })).data;
}
export const MAX_LOGO_BYTES = 100 * 1024;
const allowedLogoTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateLogo(file) {
  if (!allowedLogoTypes.has(file.type)) throw new Error('Choose a PNG, JPG, or WebP logo.');
  if (file.size === 0) throw new Error('This logo file is empty.');
  if (file.size > MAX_LOGO_BYTES) throw new Error('Logo must be 100 KB or smaller.');
}

export async function uploadLogo(file) {
  validateLogo(file);
  const { getStorage, ref, uploadBytes } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js');
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google before uploading a logo.');
  const path = `logos/${user.uid}/${crypto.randomUUID()}`;
  await uploadBytes(ref(getStorage(firebaseApp), path), file, { contentType: file.type, cacheControl: 'public,max-age=3600' });
  return path;
}

export async function getLogoURL(path) {
  if (!/^logos\/[A-Za-z0-9_-]{1,128}\/[0-9a-f-]{36}$/.test(path)) {
    throw new Error('Invalid logo link.');
  }
  const { getStorage, ref, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js');
  return getDownloadURL(ref(getStorage(firebaseApp), path));
}

// Keep Analytics off during local testing; enable it only when wanted.
const ENABLE_ANALYTICS = false;
let analytics = null;
if (ENABLE_ANALYTICS && await isSupported()) analytics = getAnalytics(firebaseApp);

export function trackQrCreated() {
  if (analytics) logEvent(analytics, 'space_game_qr_created');
}
