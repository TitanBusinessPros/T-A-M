function setChessBrand(logoSrc = '', website = '') {
  const logo = document.querySelector('#headerLogo');
  const adLogo = document.querySelector('#adLogo');
  const placeholder = document.querySelector('#headerLogoPlaceholder');
  for (const image of [logo, adLogo]) {
    if (logoSrc) {
      image.src = logoSrc;
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
    }
  }
  placeholder.hidden = Boolean(logoSrc);
  const label = website ? website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'Your website appears here';
  for (const id of ['headerLogoLink', 'headerWebsiteLink', 'adWebsiteLink']) {
    const link = document.getElementById(id);
    link.href = website || '#';
    if (website) link.removeAttribute('aria-disabled');
    else link.setAttribute('aria-disabled', 'true');
    if (id !== 'headerLogoLink') link.textContent = label;
  }
}

window.setChessBrand = setChessBrand;

const gameId = new URLSearchParams(location.search).get('game');
if (gameId) {
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid chess link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const game = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!game.exists() || game.data().gameType !== 'chess' || !game.data().logoPath || !game.data().website) {
      throw new Error('This Chess game could not be found.');
    }
    const url = new URL(game.data().website);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Chess game website.');
    const logoUrl = await getLogoURL(game.data().logoPath);
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = logoUrl;
    });
    setChessBrand(logoUrl, url.toString());
  } catch (error) {
    document.querySelector('#headerLogoPlaceholder').textContent = 'Game unavailable';
    console.error(error);
  } finally {
    document.documentElement.classList.remove('brand-loading');
  }
}
