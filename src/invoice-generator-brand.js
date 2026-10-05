function setInvoiceBrand(logoSrc = '', website = '') {
  const logo = document.querySelector('#sponsor-logo');
  const placeholder = document.querySelector('#sponsor-logo-placeholder');
  const link = document.querySelector('#sponsor-website');
  if (logoSrc) {
    logo.src = logoSrc;
    logo.hidden = false;
    placeholder.hidden = true;
  } else {
    logo.hidden = true;
    logo.removeAttribute('src');
    placeholder.hidden = false;
  }
  link.href = website || '#';
  link.textContent = website ? website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'Your website appears here';
  if (website) link.removeAttribute('aria-disabled');
  else link.setAttribute('aria-disabled', 'true');
}

window.setInvoiceBrand = setInvoiceBrand;

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(gameId)) throw new Error('Invalid invoice tool link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const tool = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!tool.exists() || tool.data().gameType !== 'invoiceGenerator' || !tool.data().logoPath || !tool.data().website) {
      throw new Error('This Invoice Generator could not be found.');
    }
    const url = new URL(tool.data().website);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Invoice Generator website.');
    document.querySelector('#sponsor-logo-placeholder').textContent = 'Logo loading...';
    setInvoiceBrand('', url.toString());
    document.documentElement.classList.remove('brand-loading');
    const logoUrl = await getLogoURL(tool.data().logoPath);
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = logoUrl;
    });
    setInvoiceBrand(logoUrl, url.toString());
  } catch (error) {
    document.querySelector('#sponsor-logo-placeholder').textContent = 'Logo unavailable';
    const websiteLink = document.querySelector('#sponsor-website');
    if (websiteLink.getAttribute('aria-disabled') === 'true') websiteLink.textContent = 'Website unavailable';
    console.error(error);
  } finally {
    document.documentElement.classList.remove('brand-loading');
  }
}
