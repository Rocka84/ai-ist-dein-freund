(() => {
  const generatorView = document.getElementById('generator-view');
  const recipientView = document.getElementById('recipient-view');
  const promptForm = document.getElementById('prompt-form');
  const promptInput = document.getElementById('prompt-input');
  const resultBox = document.getElementById('result-box');
  const resultUrl = document.getElementById('result-url');
  const copyLinkBtn = document.getElementById('copy-link-btn');
  const previewLinkBtn = document.getElementById('preview-link-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  const simulatedMouse = document.getElementById('simulated-mouse');
  const mockupInputBox = document.getElementById('mockup-input-box');
  const mockupText = document.getElementById('mockup-text');
  const mockupSendBtn = document.getElementById('mockup-send-btn');
  const punchlineCard = document.getElementById('punchline-card');
  const countdownTimer = document.getElementById('countdown-timer');
  const skipRedirectBtn = document.getElementById('skip-redirect-btn');

  let toastTimeout = null;
  let countdownInterval = null;

  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (_) {
      // Ignored
    }
    document.body.removeChild(textArea);
    return Promise.resolve();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getTargetUrl(query) {
    return `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
  }

  function moveMouseTo(targetX, targetY, durationMs = 800) {
    return new Promise((resolve) => {
      simulatedMouse.style.transition = `left ${durationMs}ms cubic-bezier(0.25, 1, 0.5, 1), top ${durationMs}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      simulatedMouse.style.left = `${targetX}px`;
      simulatedMouse.style.top = `${targetY}px`;
      setTimeout(resolve, durationMs);
    });
  }

  async function triggerMouseClick() {
    simulatedMouse.classList.add('clicking');
    await sleep(150);
    simulatedMouse.classList.remove('clicking');
    await sleep(100);
  }

  async function runRecipientAnimation(query) {
    generatorView.classList.add('hidden');
    recipientView.classList.remove('hidden');

    simulatedMouse.classList.remove('hidden');
    const startX = window.innerWidth * 0.85;
    const startY = window.innerHeight * 0.75;
    simulatedMouse.style.transition = 'none';
    simulatedMouse.style.left = `${startX}px`;
    simulatedMouse.style.top = `${startY}px`;

    await sleep(400);

    const inputRect = mockupInputBox.getBoundingClientRect();
    const inputTargetX = inputRect.left + 35;
    const inputTargetY = inputRect.top + inputRect.height / 2;

    await moveMouseTo(inputTargetX, inputTargetY, 900);
    await triggerMouseClick();

    mockupInputBox.classList.add('active-focus');
    await sleep(250);

    for (let i = 0; i < query.length; i++) {
      mockupText.textContent += query[i];
      const char = query[i];
      const randomDelay = Math.floor(Math.random() * 45) + 35;
      const delay = (char === ' ' || char === '?' || char === '.') ? randomDelay + 50 : randomDelay;
      await sleep(delay);
    }

    await sleep(350);

    const btnRect = mockupSendBtn.getBoundingClientRect();
    const btnTargetX = btnRect.left + btnRect.width / 2;
    const btnTargetY = btnRect.top + btnRect.height / 2;

    await moveMouseTo(btnTargetX, btnTargetY, 650);
    mockupSendBtn.classList.add('ready-to-send');

    await triggerMouseClick();
    mockupSendBtn.classList.add('clicked');

    await sleep(200);
    simulatedMouse.style.transition = 'opacity 0.4s ease';
    simulatedMouse.style.opacity = '0';

    punchlineCard.classList.remove('hidden');

    let remainingSeconds = 3;
    countdownTimer.textContent = remainingSeconds;

    const executeRedirect = () => {
      if (countdownInterval) clearInterval(countdownInterval);
      copyText(query).finally(() => {
        window.location.href = getTargetUrl(query);
      });
    };

    countdownInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        countdownTimer.textContent = '0';
        executeRedirect();
      } else {
        countdownTimer.textContent = remainingSeconds;
      }
    }, 1000);

    skipRedirectBtn.addEventListener('click', executeRedirect, { once: true });
  }

  function initGenerator() {
    generatorView.classList.remove('hidden');
    recipientView.classList.add('hidden');

    promptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = promptInput.value.trim();
      if (!query) return;

      const generatedUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}`;
      resultUrl.value = generatedUrl;
      resultBox.classList.remove('hidden');

      copyText(generatedUrl).then(() => {
        showToast('In die Zwischenablage kopiert! Jetzt an den Faulpelz senden.');
      });
    });

    copyLinkBtn.addEventListener('click', () => {
      if (!resultUrl.value) return;
      copyText(resultUrl.value).then(() => {
        showToast('Link erneut in die Zwischenablage kopiert!');
      });
    });

    previewLinkBtn.addEventListener('click', () => {
      if (!resultUrl.value) return;
      window.location.href = resultUrl.value;
    });
  }

  function initApp() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (query && query.trim()) {
      runRecipientAnimation(query.trim());
    } else {
      initGenerator();
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
