const logoPath = new URLSearchParams(window.location.search).get('logo');
if (logoPath) {
  const slot = document.querySelector('#sponsorLogoSlot');
  try {
    const { getLogoURL } = await import('./firebase.js');
    const url = await getLogoURL(logoPath);
    const image = new Image();
    image.alt = 'Sponsor logo';
    image.onload = () => slot.replaceChildren(image);
    image.src = url;
  } catch (error) {
    console.error('Logo could not load:', error);
  }
}
