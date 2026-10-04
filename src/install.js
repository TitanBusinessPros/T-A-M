(() => {
  const installButton = document.querySelector('#installButton');
  const toast = document.querySelector('#toast');
  let installPrompt;
  let toastTimer;

  const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function showStatus(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 5000);
  }

  if (installButton) {
    installButton.hidden = isInstalled();
    installButton.addEventListener('click', async () => {
      if (!installPrompt) {
        showStatus('Installation is not available on this page yet.');
        return;
      }
      const prompt = installPrompt;
      installPrompt = undefined;
      try {
        await prompt.prompt();
      } catch (error) {
        console.error('Could not show the install prompt:', error);
        showStatus('Could not start installation. Please try again.');
      }
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton && !isInstalled()) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = undefined;
    if (installButton) installButton.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }
})();
