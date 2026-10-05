function setPhotoBuilderBrand(logoSrc = '', website = '') {
  const slot = document.querySelector('#photoBuilderLogoBox');
  const link = document.querySelector('#photoBuilderWebsite');
  if (logoSrc) {
    const image = new Image();
    image.alt = 'Business logo';
    image.src = logoSrc;
    slot.replaceChildren(image);
  } else {
    slot.textContent = 'Put your logo here';
  }
  link.href = website || '#';
  link.textContent = website ? website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'Your website appears here';
  if (website) link.removeAttribute('aria-disabled');
  else link.setAttribute('aria-disabled', 'true');
}

window.setPhotoBuilderBrand = setPhotoBuilderBrand;

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  const slot = document.querySelector('#photoBuilderLogoBox');
  const link = document.querySelector('#photoBuilderWebsite');
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(gameId)) throw new Error('Invalid Website Photo Builder link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const tool = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!tool.exists() || tool.data().gameType !== 'websitePhotoBuilder' || !tool.data().logoPath || !tool.data().website) {
      throw new Error('This Website Photo Builder could not be found.');
    }
    const website = new URL(tool.data().website);
    if (!['http:', 'https:'].includes(website.protocol)) throw new Error('Invalid Website Photo Builder website.');
    setPhotoBuilderBrand('', website.toString());
    slot.textContent = 'Logo loading...';
    document.documentElement.classList.remove('brand-loading');
    const logoUrl = await getLogoURL(tool.data().logoPath);
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.alt = 'Business logo';
      image.onload = () => { slot.replaceChildren(image); resolve(); };
      image.onerror = reject;
      image.src = logoUrl;
    });
  } catch (error) {
    slot.textContent = link.getAttribute('aria-disabled') === 'true' ? 'Tool unavailable' : 'Logo unavailable';
    if (link.getAttribute('aria-disabled') === 'true') link.textContent = 'Website unavailable';
    console.error(error);
  } finally {
    document.documentElement.classList.remove('brand-loading');
  }
}
