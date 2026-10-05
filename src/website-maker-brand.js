const params = new URLSearchParams(location.search);
const gameId = params.get('game');
const exportButton = document.querySelector('#exportButton');

if (params.has('preview')) {
  document.querySelector('#exportStatus').textContent = 'Export is available in your finished, shared tool.';
} else if (!gameId) {
  document.querySelector('#exportStatus').textContent = 'Open a branded Website Maker link to export a website.';
}

if (gameId) {
  const logoSlot = document.querySelector('#makerBrandLogoSlot');
  try {
    if (!/^[0-9a-f-]{36}$/.test(gameId)) throw new Error('Invalid tool link.');
    const { firebaseApp, getLogoURL } = await import('./firebase.js?v=10');
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const tool = await getDoc(doc(getFirestore(firebaseApp), 'games', gameId));
    if (!tool.exists() || tool.data().gameType !== 'websiteMaker') throw new Error('This Website Maker could not be found.');
    const { logoPath } = tool.data();
    if (!logoPath) throw new Error('Invalid Website Maker details.');
    const logoUrl = await getLogoURL(logoPath);
    const image = new Image();
    image.alt = 'Business logo';
    image.onload = () => logoSlot.replaceChildren(image);
    image.onerror = () => { logoSlot.textContent = 'Logo unavailable'; };
    image.src = logoUrl;
    if (!params.has('preview')) exportButton.disabled = false;
  } catch (error) {
    logoSlot.textContent = 'Logo unavailable';
    console.error(error);
  }
}
