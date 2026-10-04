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
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 8000);
  }

  if (installButton) {
    installButton.hidden = isInstalled();
    installButton.addEventListener('click', async () => {
      if (!installPrompt) {
        const agent = navigator.userAgent;
        showStatus(/iPhone|iPad|iPod/.test(agent)
          ? 'Tap Share, then Add to Home Screen.'
          : /Android/.test(agent)
            ? 'In Chrome, tap the menu, then Install app or Add to Home Screen.'
            : 'This browser did not offer an install prompt. Check its install icon or your installed apps.');
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
      navigator.serviceWorker.register('./sw.js?v=3').catch(console.error);
    });
  }
})();
