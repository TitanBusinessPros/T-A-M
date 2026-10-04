import { firebaseApp, getLogoURL } from './firebase.js';

const params = new URLSearchParams(window.location.search);
let logoPath = params.get('logo');
const gameId = params.get('game');
if (gameId) {
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid game link.');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const game = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!game.exists()) throw new Error('This game could not be found.');
    const title = game.data().title;
    document.querySelector('#gameTitle').textContent = title;
    document.querySelector('#gameTitle').classList.remove('placeholder');
    document.title = title;
    logoPath = game.data().logoPath;
  } catch (error) {
    document.querySelector('#gameTitle').textContent = 'Game unavailable';
    console.error(error);
  }
}
if (logoPath) {
  const slot = document.querySelector('#sponsorLogoSlot');
  try {
    const url = await getLogoURL(logoPath);
    const image = new Image();
    image.alt = 'Sponsor logo';
    image.onload = () => slot.replaceChildren(image);
    image.src = url;
  } catch (error) {
    console.error('Logo could not load:', error);
  }
}
