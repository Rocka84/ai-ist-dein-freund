(() => {
  const generatorView = document.getElementById('generator-view');
  const recipientChoiceView = document.getElementById('recipient-choice-view');
  const recipientView = document.getElementById('recipient-view');

  const promptForm = document.getElementById('prompt-form');
  const promptInput = document.getElementById('prompt-input');
  const engineSelect = document.getElementById('engine-select');
  const snarkToggle = document.getElementById('snark-toggle');
  const resultBox = document.getElementById('result-box');
  const resultUrl = document.getElementById('result-url');
  const copyLinkBtn = document.getElementById('copy-link-btn');
  const previewLinkBtn = document.getElementById('preview-link-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  const simulatedMouse = document.getElementById('simulated-mouse');
  const mockupEngineTitle = document.getElementById('mockup-engine-title');
  const mockupInputBox = document.getElementById('mockup-input-box');
  const mockupText = document.getElementById('mockup-text');
  const mockupSendBtn = document.getElementById('mockup-send-btn');

  const punchlineCard = document.getElementById('punchline-card');
  const punchlineQuote = document.getElementById('punchline-quote');
  const pasteCard = document.getElementById('paste-card');
  const instructionTitle = document.getElementById('instruction-title');
  const instructionStepLogin = document.getElementById('instruction-step-login');
  const instructionStepPaste = document.getElementById('instruction-step-paste');
  const countdownWrapper = document.getElementById('countdown-wrapper');
  const countdownTimer = document.getElementById('countdown-timer');
  const skipRedirectBtn = document.getElementById('skip-redirect-btn');

  const guideChips = document.querySelectorAll('.guide-chip');
  const smartTileBtns = document.querySelectorAll('.smart-tile-btn');

  let toastTimeout = null;
  let countdownInterval = null;

  const DEFAULT_ENGINE = 'duckduckgo';

  const ENGINES = {
    duckduckgo: {
      id: 'duckduckgo',
      name: 'DuckDuckGo AI',
      icon: '🦆',
      accountBadge: '100% Anonym',
      needsPaste: false,
      headerTitle: 'DuckDuckGo AI Suche',
      getUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}&ia=chat`,
      loginHint: 'Kostenlose KI ohne Anmeldung oder Datenspeicherung.',
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '✨',
      accountBadge: 'Kein Login nötig / Google',
      needsPaste: true,
      headerTitle: 'Google Gemini Chat',
      getUrl: () => 'https://gemini.google.com/app',
      loginHint: 'Funktioniert sofort auch ohne Login (oder melde dich mit deinem Google-Konto an).',
    },
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '🤖',
      accountBadge: 'Optional Login',
      needsPaste: true,
      headerTitle: 'ChatGPT Prompt',
      getUrl: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
      loginHint: 'Funktioniert oft direkt ohne Account (oder mit Google-, Microsoft- & Apple-Konto).',
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity AI',
      icon: '⚡',
      accountBadge: 'Kein Login nötig',
      needsPaste: false,
      headerTitle: 'Perplexity AI Antwort',
      getUrl: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
      loginHint: 'Keine Registrierung erforderlich. Die Antwort wird direkt angezeigt.',
    },
    claude: {
      id: 'claude',
      name: 'Claude (Anthropic)',
      icon: '🧠',
      accountBadge: 'Claude-Nutzer',
      needsPaste: true,
      headerTitle: 'Claude (Anthropic)',
      getUrl: () => 'https://claude.ai/new',
      loginHint: 'Melde dich mit deinem bestehenden Google- oder Anthropic-Konto an.',
    },
  };

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

  function trackEvent(path, title) {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({
        path: path,
        title: title || path,
        event: true,
      });
    }
  }

  function encodePayload(query, isSnark, engine) {
    const payload = JSON.stringify({
      q: query,
      s: isSnark ? 1 : 0,
      e: engine || DEFAULT_ENGINE,
    });
    const utf8 = new TextEncoder().encode(payload);
    let bin = '';
    for (let i = 0; i < utf8.length; i++) {
      bin += String.fromCharCode(utf8[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodePayload(str) {
    try {
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) {
        b64 += '=';
      }
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const json = new TextDecoder().decode(bytes);
      const data = JSON.parse(json);
      if (data && typeof data.q === 'string') {
        const query = data.q.slice(0, 500);
        const engine = (typeof data.e === 'string' && (data.e === 'any' || Object.prototype.hasOwnProperty.call(ENGINES, data.e)))
          ? data.e
          : DEFAULT_ENGINE;
        return {
          query: query,
          isSnark: data.s === 1,
          engine: engine,
        };
      }
    } catch (_) {
      // Ignored
    }
    return null;
  }

  function buildShareLink(query, isSnark, engine) {
    const encoded = encodePayload(query, isSnark, engine);
    return `${window.location.origin}${window.location.pathname}?p=${encoded}`;
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

  function setupAccountFilterChips() {
    guideChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        guideChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        const filter = chip.getAttribute('data-filter');
        smartTileBtns.forEach((tile) => {
          const tags = tile.getAttribute('data-tags') || '';
          if (filter === 'all' || tags.includes(filter)) {
            tile.style.display = 'flex';
          } else {
            tile.style.display = 'none';
          }
        });
      });
    });
  }

  function showRecipientChoice(query, isSnark) {
    generatorView.classList.add('hidden');
    recipientView.classList.add('hidden');
    recipientChoiceView.classList.remove('hidden');

    trackEvent('recipient-choice-view', 'Chatbot Auswahl Ansicht');

    setupAccountFilterChips();

    smartTileBtns.forEach((tileBtn) => {
      tileBtn.onclick = () => {
        const chosenEngineKey = tileBtn.getAttribute('data-engine') || DEFAULT_ENGINE;
        trackEvent(`engine-selected-${chosenEngineKey}`, `Auswahl ${chosenEngineKey}`);

        copyText(query);

        recipientChoiceView.classList.add('hidden');
        recipientView.classList.remove('hidden');

        runRecipientAnimation(query, isSnark, chosenEngineKey);
      };
    });
  }

  async function runRecipientAnimation(query, isSnark = false, engineKey = DEFAULT_ENGINE) {
    generatorView.classList.add('hidden');
    if (recipientChoiceView) recipientChoiceView.classList.add('hidden');
    recipientView.classList.remove('hidden');

    trackEvent('recipient-view', 'Empfaenger Ansicht');

    const currentEngine = (engineKey && Object.prototype.hasOwnProperty.call(ENGINES, engineKey))
      ? ENGINES[engineKey]
      : ENGINES[DEFAULT_ENGINE];
    mockupEngineTitle.textContent = currentEngine.headerTitle;

    const punchlineHtml = isSnark
      ? 'War das so schwer? 🙃<br><span class="text-gradient">AI ist dein Freund.</span>'
      : 'Gern geschehen! ✨<br><span class="text-gradient">AI ist dein Freund.</span>';

    punchlineQuote.innerHTML = punchlineHtml;

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

    if (currentEngine.needsPaste) {
      pasteCard.classList.remove('hidden');
      if (instructionTitle) instructionTitle.textContent = `Was du jetzt bei ${currentEngine.name} tun musst:`;
      if (instructionStepLogin) instructionStepLogin.innerHTML = `${currentEngine.loginHint}`;
      if (instructionStepPaste) instructionStepPaste.innerHTML = `Deine Frage liegt bereit in der Zwischenablage: Im Eingabefeld einfach <kbd>Strg</kbd> + <kbd>V</kbd> (bzw. <em>Einfügen</em> am Smartphone) drücken und absenden.`;
      countdownWrapper.classList.add('hidden');
      skipRedirectBtn.textContent = `Jetzt zu ${currentEngine.name} wechseln ➔`;
    } else {
      pasteCard.classList.add('hidden');
      countdownWrapper.classList.remove('hidden');
      skipRedirectBtn.textContent = 'Jetzt Antwort ansehen';

      let remainingSeconds = 3;
      countdownTimer.textContent = remainingSeconds;

      const executeRedirect = () => {
        if (countdownInterval) clearInterval(countdownInterval);
        trackEvent('redirect-total', 'Weiterleitung Gesamt');
        trackEvent(`redirect-${currentEngine.id}`, `Weiterleitung zu ${currentEngine.name}`);
        window.location.href = currentEngine.getUrl(query);
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
    }

    skipRedirectBtn.addEventListener('click', () => {
      if (countdownInterval) clearInterval(countdownInterval);
      copyText(query);
      trackEvent('redirect-total', 'Weiterleitung Gesamt');
      trackEvent(`redirect-${currentEngine.id}`, `Weiterleitung zu ${currentEngine.name}`);
      window.location.href = currentEngine.getUrl(query);
    }, { once: true });
  }

  function initGenerator() {
    generatorView.classList.remove('hidden');
    if (recipientChoiceView) recipientChoiceView.classList.add('hidden');
    recipientView.classList.add('hidden');

    const updateLinkOutput = () => {
      const query = promptInput.value.trim();
      if (!query) return;
      const isSnark = snarkToggle ? snarkToggle.checked : false;
      const selectedEngine = engineSelect ? engineSelect.value : DEFAULT_ENGINE;
      const generatedUrl = buildShareLink(query, isSnark, selectedEngine);
      resultUrl.value = generatedUrl;
      return generatedUrl;
    };

    if (snarkToggle) {
      snarkToggle.addEventListener('change', () => {
        if (!resultBox.classList.contains('hidden')) {
          updateLinkOutput();
        }
      });
    }

    if (engineSelect) {
      engineSelect.addEventListener('change', () => {
        if (!resultBox.classList.contains('hidden')) {
          updateLinkOutput();
        }
      });
    }

    promptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const generatedUrl = updateLinkOutput();
      if (!generatedUrl) return;

      const selectedEngine = engineSelect ? engineSelect.value : DEFAULT_ENGINE;
      trackEvent('link-created', 'Link Generiert');
      trackEvent(`engine-${selectedEngine}`, `KI Modus ${selectedEngine}`);

      if (snarkToggle && snarkToggle.checked) {
        trackEvent('snark-enabled', 'Passiv-Aggressiv');
      }

      resultBox.classList.remove('hidden');

      copyText(generatedUrl).then(() => {
        showToast('In die Zwischenablage kopiert! Jetzt Link teilen.');
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
    const payloadParam = params.get('p');

    if (payloadParam) {
      const decoded = decodePayload(payloadParam);
      if (decoded && decoded.query.trim()) {
        if (decoded.engine === 'any') {
          showRecipientChoice(decoded.query.trim(), decoded.isSnark);
        } else {
          runRecipientAnimation(decoded.query.trim(), decoded.isSnark, decoded.engine);
        }
        return;
      }
    }

    const legacyQuery = params.get('q');
    if (legacyQuery && legacyQuery.trim()) {
      const isSnark = params.get('s') === '1';
      const rawEngine = params.get('e');
      const engine = (rawEngine && (rawEngine === 'any' || Object.prototype.hasOwnProperty.call(ENGINES, rawEngine)))
        ? rawEngine
        : DEFAULT_ENGINE;
      const cleanQuery = legacyQuery.slice(0, 500).trim();
      if (engine === 'any') {
        showRecipientChoice(cleanQuery, isSnark);
      } else {
        runRecipientAnimation(cleanQuery, isSnark, engine);
      }
      return;
    }

    initGenerator();
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
