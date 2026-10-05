import { createGame, currentUser, signIn, uploadLogo, validateLogo } from './firebase.js?v=8';

const form = document.querySelector('#checkersForm');
const input = document.querySelector('#checkersLogo');
const help = document.querySelector('#checkersLogoHelp');
const preview = document.querySelector('#checkersPreview');
const button = document.querySelector('#checkersCreateButton');
const shareCard = document.querySelector('#checkersShareCard');
const qrTarget = document.querySelector('#checkersQrTarget');
const link = document.querySelector('#checkersGameLink');
const openLink = document.querySelector('#checkersOpenGame');
const download = document.querySelector('#checkersDownloadQr');
let previewUrl;
let requestId;

function updatePreview() {
  const slot = preview.contentDocument?.querySelector('#sponsorLogoSlot');
  if (!slot) return;
  if (!previewUrl) {
    slot.textContent = 'Your logo goes here';
    return;
  }
  const image = preview.contentDocument.createElement('img');
  image.alt = 'Your sponsor logo';
  image.src = previewUrl;
  slot.replaceChildren(image);
}

preview.addEventListener('load', updatePreview);
input.addEventListener('change', () => {
  shareCard.hidden = true;
  requestId = undefined;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  help.classList.remove('error');
  const file = input.files[0];
  if (!file) {
    help.textContent = 'Choose a logo to see it in the game.';
    updatePreview();
    return;
  }
  try {
    validateLogo(file);
    previewUrl = URL.createObjectURL(file);
    help.textContent = 'Logo ready. You can play with it in the preview.';
  } catch (error) {
    input.value = '';
    help.textContent = error.message;
    help.classList.add('error');
  }
  updatePreview();
});

window.addEventListener('pagehide', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = input.files[0];
  if (!file) return;
  try {
    validateLogo(file);
    shareCard.hidden = true;
    button.disabled = true;
    if (!currentUser()) await signIn();
    button.firstChild.textContent = 'UPLOADING LOGO ';
    const logoPath = await uploadLogo(file);
    button.firstChild.textContent = 'USING 4 CREDITS ';
    requestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame('', logoPath, requestId, 'checkers');
    const url = new URL(gameUrl);
    button.firstChild.textContent = 'MAKING QR CODE ';
    qrTarget.replaceChildren();
    new QRCode(qrTarget, {
      text: url.toString(), width: 190, height: 190,
      colorDark: '#172119', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    const qrPng = qrTarget.querySelector('canvas')?.toDataURL('image/png') || qrTarget.querySelector('img')?.src;
    if (!qrPng?.startsWith('data:image/')) throw new Error('QR image is not ready to download.');
    link.value = url.toString();
    openLink.href = url.toString();
    download.href = qrPng;
    requestId = undefined;
    shareCard.hidden = false;
    window.dispatchEvent(new Event('credits-changed'));
    shareCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    help.textContent = error.message || 'Could not make the Checkers game. Please try again.';
    help.classList.add('error');
    console.error(error);
  } finally {
    button.firstChild.textContent = 'MAKE MY CHECKERS GAME ';
    button.disabled = false;
  }
});

document.querySelector('#checkersCopyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    link.select();
    document.execCommand('copy');
  }
});
