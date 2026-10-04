import { createGame, currentUser, getCreditStatus, signIn, signOutUser, trackQrCreated, uploadLogo, validateLogo, watchUser } from './firebase.js';

const form = document.querySelector('#brandForm');
const nameInput = document.querySelector('#businessName');
const count = document.querySelector('#characterCount');
const gamePreview = document.querySelector('#gamePreview');
const shareCard = document.querySelector('#shareCard');
const gameLink = document.querySelector('#gameLink');
const openGameLink = document.querySelector('#openGame');
const qrTarget = document.querySelector('#qrTarget');
const downloadQr = document.querySelector('#downloadQr');
const copyButton = document.querySelector('#copyLink');
const toast = document.querySelector('#toast');
const localNote = document.querySelector('#localNote');
const logoInput = document.querySelector('#businessLogo');
const logoHelp = document.querySelector('#logoHelp');
const createButton = document.querySelector('#createButton');
const noLogoWarning = document.querySelector('#noLogoWarning');
const cancelNoLogo = document.querySelector('#cancelNoLogo');
const continueNoLogo = document.querySelector('#continueNoLogo');
const authButton = document.querySelector('#authButton');
const buyCredits = document.querySelector('#buyCredits');
const creditBalance = document.querySelector('#creditBalance');

let toastTimer;
let previewLogoUrl;
let gameHasLogo = false;
let confirmedDownload = false;
let pendingRequestId;
async function refreshCredits() {
  if (!currentUser()) {
    creditBalance.textContent = 'Sign in to see your credits.';
    return;
  }
  try {
    const { credits } = await getCreditStatus();
    creditBalance.textContent = `${credits} credit${credits === 1 ? '' : 's'} available`;
  } catch (error) {
    creditBalance.textContent = 'Could not load credits. Try again.';
    console.error(error);
  }
}

watchUser((user) => {
  authButton.textContent = user ? `SIGN OUT (${user.displayName || 'GOOGLE'})` : 'SIGN IN WITH GOOGLE';
  refreshCredits();
});

authButton.addEventListener('click', async () => {
  try {
    if (currentUser()) await signOutUser();
    else await signIn();
  } catch (error) {
    showToast(error.message || 'Could not sign in.');
  }
});

buyCredits.addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    if (!currentUser()) await signIn();
    const { buyUrl } = await getCreditStatus();
    if (!buyUrl) throw new Error('Payment link is not ready.');
    window.location.assign(buyUrl);
  } catch (error) {
    showToast(error.message || 'Could not open checkout.');
  }
});

window.addEventListener('focus', refreshCredits);

function updateLogoPreview() {
  const slot = gamePreview.contentDocument?.querySelector('#sponsorLogoSlot');
  if (!slot) return;
  if (!previewLogoUrl) {
    slot.textContent = 'Your logo goes here';
    return;
  }
  const image = gamePreview.contentDocument.createElement('img');
  image.alt = 'Your logo';
  image.src = previewLogoUrl;
  slot.replaceChildren(image);
}

nameInput.addEventListener('input', () => {
  shareCard.hidden = true;
  pendingRequestId = undefined;
  const value = nameInput.value.trim();
  const title = gamePreview.contentDocument?.querySelector('#gameTitle');
  if (title) {
    title.textContent = value || 'Your business name goes here';
    title.classList.toggle('placeholder', !value);
  }
  count.textContent = `${nameInput.value.length} / 48`;
});
gamePreview.addEventListener('load', () => {
  nameInput.dispatchEvent(new Event('input'));
  updateLogoPreview();
});

logoInput.addEventListener('change', () => {
  shareCard.hidden = true;
  pendingRequestId = undefined;
  logoHelp.classList.remove('error');
  logoHelp.textContent = 'PNG, JPG, or WebP. Maximum 100 KB.';
  if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl);
  previewLogoUrl = null;
  const file = logoInput.files[0];
  updateLogoPreview();
  if (!file) return;
  try {
    validateLogo(file);
    previewLogoUrl = URL.createObjectURL(file);
    updateLogoPreview();
    logoHelp.textContent = 'Logo ready. Maximum 100 KB.';
  } catch (error) {
    logoInput.value = '';
    logoHelp.textContent = error.message;
    logoHelp.classList.add('error');
  }
});

window.addEventListener('pagehide', () => {
  if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  try {
    shareCard.hidden = true;
    createButton.disabled = true;
    if (!currentUser()) await signIn();
    const file = logoInput.files[0];
    let logoPath = '';
    if (file) {
      validateLogo(file);
      createButton.firstChild.textContent = 'UPLOADING LOGO ';
      logoPath = await uploadLogo(file);
    }
    createButton.firstChild.textContent = 'USING 1 CREDIT ';
    pendingRequestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame(name, logoPath, pendingRequestId);
    const url = new URL(gameUrl);
    createButton.firstChild.textContent = 'MAKING QR CODE ';
    qrTarget.replaceChildren();
    new QRCode(qrTarget, {
      text: url.toString(),
      width: 190,
      height: 190,
      colorDark: '#172119',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    const qrCanvas = qrTarget.querySelector('canvas');
    const qrImage = qrTarget.querySelector('img');
    const qrPng = qrCanvas?.toDataURL('image/png') || qrImage?.src;
    if (!qrPng?.startsWith('data:image/')) throw new Error('QR image is not ready to download.');
    gameLink.value = url.toString();
    openGameLink.href = url.toString();
    downloadQr.href = qrPng;
    const fileName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'space-game';
    downloadQr.download = `${fileName}-qr.png`;
    gameHasLogo = Boolean(file);
    pendingRequestId = undefined;
    shareCard.hidden = false;
    localNote.textContent = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'Local test only: your phone must be on the same Wi-Fi as this computer.'
      : 'Scan this code to open your game with your business name.';
    trackQrCreated();
    refreshCredits();
    shareCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    logoHelp.textContent = error.message || 'Could not make the game. Please try again.';
    logoHelp.classList.add('error');
    showToast(logoHelp.textContent);
    console.error(error);
  } finally {
    createButton.firstChild.textContent = 'MAKE MY GAME ';
    createButton.disabled = false;
  }
});

downloadQr.addEventListener('click', (event) => {
  if (gameHasLogo || confirmedDownload) return;
  event.preventDefault();
  noLogoWarning.showModal();
});
cancelNoLogo.addEventListener('click', () => noLogoWarning.close());
continueNoLogo.addEventListener('click', () => {
  noLogoWarning.close();
  confirmedDownload = true;
  try {
    downloadQr.click();
  } finally {
    confirmedDownload = false;
  }
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(gameLink.value);
    showToast('Game link copied.');
  } catch {
    gameLink.select();
    document.execCommand('copy');
    showToast('Game link copied.');
  }
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}
