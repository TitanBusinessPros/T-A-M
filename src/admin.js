import { currentUser, grantCredits, signIn, signOutUser, watchUser } from './firebase.js?v=6';
import { setupCreditBalance } from './credit-balance.js?v=6';

const authButton = document.querySelector('#authButton');
const accessStatus = document.querySelector('#accessStatus');
const grantPanel = document.querySelector('#grantPanel');
const grantForm = document.querySelector('#grantForm');
const grantEmail = document.querySelector('#grantEmail');
const grantAmount = document.querySelector('#grantAmount');
const grantButton = document.querySelector('#grantButton');
const grantStatus = document.querySelector('#grantStatus');

let grantRequestId;
const creditDisplay = setupCreditBalance({
  onStatus(status) {
    if (!status) {
      grantPanel.hidden = true;
      accessStatus.textContent = 'Sign in with the admin Google account to continue.';
      return;
    }
    grantPanel.hidden = !status.isAdmin;
    accessStatus.textContent = status.isAdmin
      ? 'Admin account confirmed.'
      : 'This page is available only to the admin account.';
  },
  onError() {
    grantPanel.hidden = true;
    accessStatus.textContent = 'Could not check admin access. Press REFRESH or reload the page.';
  },
});

watchUser((user) => {
  authButton.textContent = user ? `SIGN OUT (${user.displayName || 'GOOGLE'})` : 'SIGN IN WITH GOOGLE';
  grantPanel.hidden = true;
  grantStatus.textContent = '';
  accessStatus.textContent = user ? 'Checking admin access...' : 'Sign in with the admin Google account to continue.';
  creditDisplay.refresh();
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
    creditDisplay.refresh();
  } catch (error) {
    grantStatus.textContent = error.message || 'Could not add credits. Please try again.';
    console.error(error);
  } finally {
    grantButton.disabled = false;
  }
});
