import { currentUser, getCreditStatus } from './firebase.js?v=8';

export function setupCreditBalance({ onStatus, onError }) {
  const summary = document.querySelector('#accountSummary');
  const accountEmail = document.querySelector('#accountEmail');
  const balance = document.querySelector('#accountCreditBalance');
  const refreshButton = document.querySelector('#refreshCreditButton');
  let latestRequest = 0;
  let displayedUid;
  let activeRequest;

  async function refresh() {
    const user = currentUser();
    summary.hidden = !user;
    if (!user) {
      latestRequest += 1;
      displayedUid = undefined;
      activeRequest = undefined;
      onStatus?.(null);
      return null;
    }

    accountEmail.textContent = user.email || 'Google account';
    if (displayedUid !== user.uid) {
      displayedUid = user.uid;
      balance.textContent = 'Loading credits...';
    }
    if (activeRequest?.uid === user.uid) return activeRequest.promise;
    const request = ++latestRequest;
    const promise = (async () => {
      try {
        const status = await getCreditStatus();
        if (request !== latestRequest || currentUser()?.uid !== user.uid) return null;
        if (!Number.isSafeInteger(status.credits) || status.credits < 0) {
          throw new Error('Invalid credit balance.');
        }
        const credits = status.credits;
        balance.textContent = `${credits} credit${credits === 1 ? '' : 's'}`;
        onStatus?.({ ...status, credits }, user);
        return status;
      } catch (error) {
        if (request !== latestRequest || currentUser()?.uid !== user.uid) return null;
        balance.textContent = 'Balance unavailable';
        onError?.(error, user);
        console.error(error);
        return null;
      }
    })();
    activeRequest = { uid: user.uid, promise };
    try {
      return await promise;
    } finally {
      if (activeRequest?.promise === promise) activeRequest = undefined;
    }
  }

  refreshButton.addEventListener('click', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('credits-changed', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible' && currentUser()) refresh();
  }, 15000);

  return { refresh };
}
