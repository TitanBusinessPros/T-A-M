const params = new URLSearchParams(location.search);
const gameId = params.get('game');
const exportButton = document.querySelector('#exportButton');

if (params.has('preview')) {
  document.querySelector('#exportStatus').textContent = 'Export is available in your finished, shared tool.';
} else if (!gameId) {
  document.querySelector('#exportStatus').textContent = 'Open a branded Website Maker link to export a website.';
}

if (gameId) {
  const topBrand = document.querySelector('#makerTopBrand');
  const brandName = document.querySelector('#makerBrandName');
  const logoSlot = document.querySelector('#makerBrandLogoSlot');
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid tool link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const tool = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!tool.exists() || tool.data().gameType !== 'websiteMaker') throw new Error('This Website Maker could not be found.');
    const { title, logoPath } = tool.data();
    if (!title || !logoPath) throw new Error('Invalid Website Maker details.');
    const logoUrl = await getLogoURL(logoPath);
    const image = new Image();
    image.alt = `${title} logo`;
    image.onload = () => logoSlot.replaceChildren(image);
    image.onerror = () => { logoSlot.textContent = 'Logo unavailable'; };
    image.src = logoUrl;
    topBrand.textContent = title;
    brandName.textContent = title;
    document.title = `${title} | Website Maker`;
    if (!params.has('preview')) exportButton.disabled = false;
  } catch (error) {
    topBrand.textContent = 'Website Maker unavailable';
    brandName.textContent = 'Website Maker unavailable';
    logoSlot.textContent = 'Logo unavailable';
    console.error(error);
  }
}
