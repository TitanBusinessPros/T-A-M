import { trackQrCreated, uploadLogo, validateLogo } from './firebase.js';

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

let toastTimer;
let previewLogoUrl;

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
  logoHelp.classList.remove('error');
  logoHelp.textContent = 'PNG, JPG, or WebP. Maximum 100 KB.';
  if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl);
  previewLogoUrl = null;
  const file = logoInput.files[0];
  if (file) {
    try {
      validateLogo(file);
      previewLogoUrl = URL.createObjectURL(file);
    } catch (error) {
      logoInput.value = '';
      logoHelp.textContent = error.message;
      logoHelp.classList.add('error');
    }
  }
  updateLogoPreview();
});

window.addEventListener('pagehide', () => {
  if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  const url = new URL('space-game.html', window.location.href);
  url.searchParams.set('title', name);

  try {
    shareCard.hidden = true;
    createButton.disabled = true;
    const file = logoInput.files[0];
    if (file) {
      validateLogo(file);
      createButton.firstChild.textContent = 'UPLOADING LOGO ';
      url.searchParams.set('logo', await uploadLogo(file));
    }
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
    shareCard.hidden = false;
    localNote.textContent = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'Local test only: your phone must be on the same Wi-Fi as this computer.'
      : 'Scan this code to open your game with your business name.';
    trackQrCreated();
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
