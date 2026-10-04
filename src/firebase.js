import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js';

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
export const MAX_LOGO_BYTES = 100 * 1024;
const allowedLogoTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateLogo(file) {
  if (!allowedLogoTypes.has(file.type)) throw new Error('Choose a PNG, JPG, or WebP logo.');
  if (file.size === 0) throw new Error('This logo file is empty.');
  if (file.size > MAX_LOGO_BYTES) throw new Error('Logo must be 100 KB or smaller.');
}

export async function uploadLogo(file) {
  validateLogo(file);
  const [{ getAuth, signInAnonymously }, { getStorage, ref, uploadBytes }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js'),
  ]);
  const auth = getAuth(firebaseApp);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
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
