const form = document.querySelector('#chessForm');
const logoInput = document.querySelector('#chessLogo');
const websiteInput = document.querySelector('#chessWebsite');
const status = document.querySelector('#chessStatus');
const preview = document.querySelector('#chessPreview');
const button = document.querySelector('#chessCreateButton');
const shareCard = document.querySelector('#chessShareCard');
const qrTarget = document.querySelector('#chessQrTarget');
const link = document.querySelector('#chessGameLink');
const openLink = document.querySelector('#chessOpenGame');
const download = document.querySelector('#chessDownloadQr');
let previewUrl;
let requestId;

function validateLogo(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP logo.');
  if (file.size === 0) throw new Error('This logo file is empty.');
  if (file.size > 100 * 1024) throw new Error('Logo must be 100 KB or smaller.');
}

function normalizeWebsite(value) {
  const input = value.trim();
  if (!input || input.length > 512) throw new Error('Enter a website or social page address of 512 characters or fewer.');
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Enter a valid website or social page address, such as example.com or facebook.com/yourpage.');
  }
}

function updatePreview() {
  let website = '';
  try { website = normalizeWebsite(websiteInput.value); } catch { /* Wait for a valid address. */ }
  preview.contentWindow?.setChessBrand?.(previewUrl || '', website);
}

function resetResult() {
  shareCard.hidden = true;
  requestId = undefined;
  status.classList.remove('error');
}

preview.addEventListener('load', updatePreview);
updatePreview();
logoInput.addEventListener('change', () => {
  resetResult();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  const file = logoInput.files[0];
  if (!file) {
    status.textContent = 'Choose a logo to see it in the game.';
    updatePreview();
    return;
  }
  try {
    validateLogo(file);
    previewUrl = URL.createObjectURL(file);
    status.textContent = 'Logo ready. The preview updates as you enter your address.';
  } catch (error) {
    logoInput.value = '';
    status.textContent = error.message;
    status.classList.add('error');
  }
  updatePreview();
});
websiteInput.addEventListener('input', () => { resetResult(); updatePreview(); });
window.addEventListener('pagehide', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = logoInput.files[0];
  if (!file || button.disabled) return;
  try {
    validateLogo(file);
    const website = normalizeWebsite(websiteInput.value);
    shareCard.hidden = true;
    button.disabled = true;
    const { createGame, currentUser, signIn, uploadLogo } = await import('./firebase.js?v=10');
    if (!currentUser()) await signIn();
    button.firstChild.textContent = 'UPLOADING LOGO ';
    const logoPath = await uploadLogo(file);
    button.firstChild.textContent = 'USING 1 CREDIT ';
    requestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame('', logoPath, requestId, 'chess', website);
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
    status.textContent = error.message || 'Could not make the Chess game. Please try again.';
    status.classList.add('error');
    console.error(error);
  } finally {
    button.firstChild.textContent = 'MAKE MY CHESS GAME ';
    button.disabled = false;
  }
});

document.querySelector('#chessCopyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    link.select();
    document.execCommand('copy');
  }
  status.textContent = 'Game link copied.';
});
