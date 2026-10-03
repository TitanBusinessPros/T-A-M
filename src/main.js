import { trackQrCreated } from './firebase.js';

const form = document.querySelector('#brandForm');
const nameInput = document.querySelector('#businessName');
const count = document.querySelector('#characterCount');
const previewTitle = document.querySelector('#livePreviewTitle');
const shareCard = document.querySelector('#shareCard');
const gameLink = document.querySelector('#gameLink');
const openGameLink = document.querySelector('#openGame');
const qrTarget = document.querySelector('#qrTarget');
const downloadQr = document.querySelector('#downloadQr');
const copyButton = document.querySelector('#copyLink');
const toast = document.querySelector('#toast');
const localNote = document.querySelector('#localNote');

let toastTimer;

nameInput.addEventListener('input', () => {
  const value = nameInput.value.trim();
  previewTitle.textContent = value || 'YOUR BUSINESS NAME';
  count.textContent = `${nameInput.value.length} / 48`;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  const url = new URL('space-game.html', window.location.href);
  url.searchParams.set('title', name);

  try {
    qrTarget.replaceChildren();
    new QRCode(qrTarget, {
      text: url.toString(),
      width: 190,
      height: 190,
      colorDark: '#172119',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    gameLink.value = url.toString();
    openGameLink.href = url.toString();
    const qrImage = qrTarget.querySelector('img');
    downloadQr.href = qrImage.src;
    shareCard.hidden = false;
    localNote.textContent = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'For phone testing, open this page using your computer’s Wi-Fi address first, then make a fresh QR.'
      : 'This test link works on devices that can reach this computer while the local server is running.';
    trackQrCreated();
    shareCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    showToast('Could not make the QR code. Please try again.');
    console.error(error);
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
