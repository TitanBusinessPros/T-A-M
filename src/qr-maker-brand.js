import { firebaseApp } from './firebase.js?v=10';

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  const title = document.querySelector('#brandTitle');
  const contact = document.querySelector('#brandContact');
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid tool link.');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const tool = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!tool.exists() || tool.data().gameType !== 'qrMaker') throw new Error('This QR maker could not be found.');
    const { title: companyName, website } = tool.data();
    const url = new URL(website);
    if (!companyName || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid QR maker details.');
    title.textContent = companyName;
    document.title = `${companyName} | QR Code & Business Card Maker`;
    contact.href = url.toString();
    contact.removeAttribute('aria-disabled');
    const urlInput = document.querySelector('#url-input');
    urlInput.value = url.toString();
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    title.textContent = 'QR maker unavailable';
    contact.setAttribute('aria-disabled', 'true');
    console.error(error);
  }
}
