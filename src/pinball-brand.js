function setPinballBrand(logoSrc = '', website = '') {
  const logo = document.querySelector('#sponsorLogo');
  const placeholder = document.querySelector('#sponsorLogoPlaceholder');
  const link = document.querySelector('#sponsorWebsite');
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

window.setPinballBrand = setPinballBrand;

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid Pinball link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const game = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!game.exists() || game.data().gameType !== 'pinball' || !game.data().logoPath || !game.data().website) {
      throw new Error('This Pinball game could not be found.');
    }
    const url = new URL(game.data().website);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Pinball game website.');
    const logoUrl = await getLogoURL(game.data().logoPath);
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = logoUrl;
    });
    setPinballBrand(logoUrl, url.toString());
  } catch (error) {
    document.querySelector('#sponsorLogoPlaceholder').textContent = 'Sponsor unavailable';
    document.querySelector('#sponsorWebsite').textContent = 'Website unavailable';
    console.error(error);
  } finally {
    document.documentElement.classList.remove('brand-loading');
  }
}
