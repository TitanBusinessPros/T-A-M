import { firebaseApp, getLogoURL } from './firebase.js?v=10';

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  const slot = document.querySelector('#sponsorLogoSlot');
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid game link.');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const game = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!game.exists() || game.data().gameType !== 'checkers' || !game.data().logoPath) {
      throw new Error('This Checkers game could not be found.');
    }
    const url = await getLogoURL(game.data().logoPath);
    const image = new Image();
    image.alt = 'Sponsor logo';
    image.onload = () => slot.replaceChildren(image);
    image.onerror = () => { slot.textContent = 'Logo unavailable'; };
    image.src = url;
  } catch (error) {
    slot.textContent = 'Game unavailable';
    console.error(error);
  }
}
