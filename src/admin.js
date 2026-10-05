import { currentUser, getCreditStatus, grantCredits, signIn, signOutUser, watchUser } from './firebase.js?v=5';

const authButton = document.querySelector('#authButton');
const accessStatus = document.querySelector('#accessStatus');
const grantPanel = document.querySelector('#grantPanel');
const grantForm = document.querySelector('#grantForm');
const grantEmail = document.querySelector('#grantEmail');
const grantAmount = document.querySelector('#grantAmount');
const grantButton = document.querySelector('#grantButton');
const grantStatus = document.querySelector('#grantStatus');

let grantRequestId;

watchUser(async (user) => {
  authButton.textContent = user ? `SIGN OUT (${user.displayName || 'GOOGLE'})` : 'SIGN IN WITH GOOGLE';
  grantPanel.hidden = true;
  grantStatus.textContent = '';
  if (!user) {
    accessStatus.textContent = 'Sign in with the admin Google account to continue.';
    return;
  }

  accessStatus.textContent = 'Checking admin access...';
  try {
    const { isAdmin } = await getCreditStatus();
    if (currentUser()?.uid !== user.uid) return;
    grantPanel.hidden = !isAdmin;
    accessStatus.textContent = isAdmin ? 'Admin account confirmed.' : 'This page is available only to the admin account.';
  } catch (error) {
    if (currentUser()?.uid !== user.uid) return;
    accessStatus.textContent = 'Could not check admin access. Please refresh the page.';
    console.error(error);
  }
});

authButton.addEventListener('click', async () => {
  try {
    if (currentUser()) await signOutUser();
    else await signIn();
  } catch (error) {
    accessStatus.textContent = error.message || 'Could not sign in.';
  }
});

grantForm.addEventListener('input', () => {
  grantRequestId = undefined;
  grantStatus.textContent = '';
});

grantForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = grantEmail.value.trim();
  const credits = Number(grantAmount.value);
  if (!grantForm.reportValidity() || !Number.isInteger(credits) || credits < 1 || credits > 100) {
    grantStatus.textContent = 'Enter a valid email and 1 to 100 whole credits.';
    return;
  }

  try {
    grantButton.disabled = true;
    grantStatus.textContent = 'Adding credits...';
    grantRequestId ||= crypto.randomUUID();
    const result = await grantCredits(email, credits, grantRequestId);
    grantStatus.textContent = `Added ${result.credits} credit${result.credits === 1 ? '' : 's'} for ${result.email}.`;
    grantForm.reset();
    grantRequestId = undefined;
  } catch (error) {
    grantStatus.textContent = error.message || 'Could not add credits. Please try again.';
    console.error(error);
  } finally {
    grantButton.disabled = false;
  }
});
