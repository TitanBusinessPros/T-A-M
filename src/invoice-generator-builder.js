const form = document.querySelector('#invoiceGeneratorForm');
const logoInput = document.querySelector('#invoiceGeneratorLogo');
const websiteInput = document.querySelector('#invoiceGeneratorWebsite');
const status = document.querySelector('#invoiceGeneratorStatus');
const preview = document.querySelector('#invoiceGeneratorPreview');
const button = document.querySelector('#invoiceGeneratorCreateButton');
const shareCard = document.querySelector('#invoiceGeneratorShareCard');
const qrTarget = document.querySelector('#invoiceGeneratorQrTarget');
const link = document.querySelector('#invoiceGeneratorLink');
const openLink = document.querySelector('#invoiceGeneratorOpenTool');
const download = document.querySelector('#invoiceGeneratorDownloadQr');
let previewUrl;
let requestId;

function validateLogo(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP logo.');
  if (file.size === 0) throw new Error('This logo file is empty.');
  if (file.size > 1024 * 1024) throw new Error('Logo must be 1 MB or smaller.');
}

function normalizeWebsite(value) {
  const input = value.trim();
  if (!input || input.length > 512) throw new Error('Enter a website address of 512 characters or fewer.');
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Enter a valid website address, such as example.com.');
  }
}

function updatePreview() {
  let website = '';
  try { website = normalizeWebsite(websiteInput.value); } catch { /* Wait for a valid address. */ }
  preview.contentWindow?.setInvoiceBrand?.(previewUrl || '', website);
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
    status.textContent = 'Choose a logo to see it above the Invoice Generator title.';
    updatePreview();
    return;
  }
  try {
    validateLogo(file);
    previewUrl = URL.createObjectURL(file);
    status.textContent = 'Your logo and website update in the preview.';
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
    button.firstChild.textContent = 'USING 2 CREDITS ';
    requestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame('', logoPath, requestId, 'invoiceGenerator', website);
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
    status.textContent = error.message || 'Could not make the Invoice Generator. Please try again.';
    status.classList.add('error');
    console.error(error);
  } finally {
    button.firstChild.textContent = 'MAKE MY INVOICE GENERATOR ';
    button.disabled = false;
  }
});

document.querySelector('#invoiceGeneratorCopyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    link.select();
    document.execCommand('copy');
  }
  status.textContent = 'Tool link copied.';
});
