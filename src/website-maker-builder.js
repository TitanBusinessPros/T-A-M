const form = document.querySelector('#websiteMakerForm');
const logoInput = document.querySelector('#websiteMakerLogo');
const status = document.querySelector('#websiteMakerStatus');
const preview = document.querySelector('#websiteMakerPreview');
const button = document.querySelector('#websiteMakerCreateButton');
const shareCard = document.querySelector('#websiteMakerShareCard');
const qrTarget = document.querySelector('#websiteMakerQrTarget');
const link = document.querySelector('#websiteMakerLink');
const openLink = document.querySelector('#websiteMakerOpenTool');
const download = document.querySelector('#websiteMakerDownloadQr');
let previewUrl;
let requestId;

function validateLogo(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP logo.');
  if (file.size === 0) throw new Error('This logo file is empty.');
  if (file.size > 500 * 1024) throw new Error('Logo must be 500 KB or smaller.');
}

function updatePreview() {
  const doc = preview.contentDocument;
  if (!doc?.querySelector('#makerBrandLogoSlot')) return;
  const slot = doc.querySelector('#makerBrandLogoSlot');
  if (!previewUrl) {
    slot.textContent = 'Put your logo here';
    return;
  }
  const image = doc.createElement('img');
  image.alt = 'Your logo';
  image.src = previewUrl;
  slot.replaceChildren(image);
}

function resetResult() {
  shareCard.hidden = true;
  requestId = undefined;
  status.textContent = '';
  status.classList.remove('error');
}

preview.addEventListener('load', updatePreview);
logoInput.addEventListener('change', () => {
  resetResult();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  const file = logoInput.files[0];
  if (!file) {
    status.textContent = 'Choose your logo to see it in the tool.';
    updatePreview();
    return;
  }
  try {
    validateLogo(file);
    previewUrl = URL.createObjectURL(file);
    status.textContent = 'Your logo appears in the tool preview. It will not appear in websites people export.';
  } catch (error) {
    logoInput.value = '';
    status.textContent = error.message;
    status.classList.add('error');
  }
  updatePreview();
});
window.addEventListener('pagehide', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
updatePreview();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = logoInput.files[0];
  if (!file || button.disabled) return;
  try {
    validateLogo(file);
    shareCard.hidden = true;
    button.disabled = true;
    const { createGame, currentUser, signIn, uploadLogo } = await import('./firebase.js?v=10');
    if (!currentUser()) await signIn();
    button.firstChild.textContent = 'UPLOADING LOGO ';
    const logoPath = await uploadLogo(file);
    button.firstChild.textContent = 'USING 3 CREDITS ';
    requestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame('', logoPath, requestId, 'websiteMaker');
    const url = new URL(gameUrl);
    button.firstChild.textContent = 'MAKING SHARE CODE ';
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
    status.textContent = error.message || 'Could not make the Website Maker. Please try again.';
    status.classList.add('error');
    console.error(error);
  } finally {
    button.firstChild.textContent = 'MAKE MY WEBSITE MAKER ';
    button.disabled = false;
  }
});

document.querySelector('#websiteMakerCopyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    link.select();
    document.execCommand('copy');
  }
  status.textContent = 'Tool link copied.';
});
