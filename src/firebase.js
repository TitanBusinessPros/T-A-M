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

// Keep Analytics off during local testing; enable it only when wanted.
const ENABLE_ANALYTICS = false;
let analytics = null;
if (ENABLE_ANALYTICS && await isSupported()) analytics = getAnalytics(firebaseApp);

export function trackQrCreated() {
  if (analytics) logEvent(analytics, 'space_game_qr_created');
}
