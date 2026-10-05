const button = document.querySelector('#learnMoneyButton');
const panel = document.querySelector('#learnMoneyPanel');

button.addEventListener('click', () => {
  const opening = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(opening));
  panel.hidden = !opening;
});
