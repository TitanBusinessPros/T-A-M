function setMatch3Brand(logoSrc = '', website = '') {
  const slot = document.querySelector('#sponsorLogoBox');
  const link = document.querySelector('#sponsorWebsite');
  if (logoSrc) {
    const image = new Image();
    image.alt = 'Sponsor logo';
    image.src = logoSrc;
    slot.replaceChildren(image);
  } else {
    slot.textContent = 'Your logo goes here';
  }
  link.href = website || '#';
  link.textContent = website ? website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'Your website appears here';
  if (website) link.removeAttribute('aria-disabled');
  else link.setAttribute('aria-disabled', 'true');
}

window.setMatch3Brand = setMatch3Brand;

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  const slot = document.querySelector('#sponsorLogoBox');
  const link = document.querySelector('#sponsorWebsite');
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(gameId)) throw new Error('Invalid Match 3 link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const game = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!game.exists() || game.data().gameType !== 'match3' || !game.data().logoPath || !game.data().website) {
      throw new Error('This Match 3 game could not be found.');
    }
    const website = new URL(game.data().website);
    if (!['http:', 'https:'].includes(website.protocol)) throw new Error('Invalid Match 3 website.');
    setMatch3Brand('', website.toString());
    slot.textContent = 'Logo loading...';
    document.documentElement.classList.remove('brand-loading');
    const logoUrl = await getLogoURL(game.data().logoPath);
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.alt = 'Sponsor logo';
      image.onload = () => { slot.replaceChildren(image); resolve(); };
      image.onerror = reject;
      image.src = logoUrl;
    });
  } catch (error) {
    slot.textContent = link.getAttribute('aria-disabled') === 'true' ? 'Game unavailable' : 'Logo unavailable';
    if (link.getAttribute('aria-disabled') === 'true') link.textContent = 'Website unavailable';
    console.error(error);
  } finally {
    document.documentElement.classList.remove('brand-loading');
  }
}
