const form = document.querySelector('#qrMakerForm');
const nameInput = document.querySelector('#qrMakerCompany');
const websiteInput = document.querySelector('#qrMakerWebsite');
const count = document.querySelector('#qrMakerCharacterCount');
const status = document.querySelector('#qrMakerStatus');
const preview = document.querySelector('#qrMakerPreview');
const button = document.querySelector('#qrMakerCreateButton');
const shareCard = document.querySelector('#qrMakerShareCard');
const qrTarget = document.querySelector('#qrMakerQrTarget');
const link = document.querySelector('#qrMakerLink');
const openLink = document.querySelector('#qrMakerOpenTool');
const download = document.querySelector('#qrMakerDownloadQr');
let requestId;

function normalizeWebsite(value) {
  const input = value.trim();
  if (!input || input.length > 512) throw new Error('Enter a company website of 512 characters or fewer.');
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Enter a valid company website, such as example.com.');
  }
}

function updateNamePreview() {
  count.textContent = `${nameInput.value.length} / 48`;
  const title = preview.contentDocument?.querySelector('#brandTitle');
  if (title) title.textContent = nameInput.value.trim() || 'Your company name goes here';
}

function updateWebsitePreview() {
  const doc = preview.contentDocument;
  const contact = doc?.querySelector('#brandContact');
  const urlInput = doc?.querySelector('#url-input');
  if (!contact || !urlInput) return;
  let website;
  try { website = normalizeWebsite(websiteInput.value); } catch { website = ''; }
  contact.href = website || '#';
  if (website) contact.removeAttribute('aria-disabled');
  else contact.setAttribute('aria-disabled', 'true');
  urlInput.value = website || 'https://example.com';
  urlInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function resetResult() {
  shareCard.hidden = true;
  requestId = undefined;
  status.textContent = '';
  status.classList.remove('error');
}

preview.addEventListener('load', () => {
  updateNamePreview();
  updateWebsitePreview();
});
nameInput.addEventListener('input', () => { resetResult(); updateNamePreview(); });
websiteInput.addEventListener('input', () => { resetResult(); updateWebsitePreview(); });
updateNamePreview();
updateWebsitePreview();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name || name.length > 48) return;
  if (button.disabled) return;
  try {
    const website = normalizeWebsite(websiteInput.value);
    shareCard.hidden = true;
    button.disabled = true;
    const { createGame, currentUser, signIn } = await import('./firebase.js?v=10');
    if (!currentUser()) await signIn();
    button.firstChild.textContent = 'USING 2 CREDITS ';
    requestId ||= crypto.randomUUID();
    const { gameUrl } = await createGame(name, '', requestId, 'qrMaker', website);
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
    status.textContent = error.message || 'Could not make the QR tool. Please try again.';
    status.classList.add('error');
    console.error(error);
  } finally {
    button.firstChild.textContent = 'MAKE MY QR TOOL ';
    button.disabled = false;
  }
});

document.querySelector('#qrMakerCopyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    link.select();
    document.execCommand('copy');
  }
  status.textContent = 'Tool link copied.';
});
