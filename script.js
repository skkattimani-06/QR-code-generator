/* ==========================================================================
   QuickQR — script.js
   Vanilla JS QR Code Generator built on top of QRCode.js.
   Organized into small, single-purpose modules:
     1. DOM references
     2. State
     3. Local storage / history helpers
     4. Theme (dark/light) handling
     5. QR generation core
     6. Download handling
     7. UI feedback helpers (errors/success/loading)
     8. Event wiring
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. DOM references
   * ------------------------------------------------------------------ */
  const els = {
    input: document.getElementById('qrInput'),
    copyBtn: document.getElementById('copyBtn'),

    sizeSelect: document.getElementById('sizeSelect'),
    qrColor: document.getElementById('qrColor'),
    bgColor: document.getElementById('bgColor'),

    generateBtn: document.getElementById('generateBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    clearBtn: document.getElementById('clearBtn'),
    generateAnotherBtn: document.getElementById('generateAnotherBtn'),

    errorMsg: document.getElementById('errorMsg'),
    successMsg: document.getElementById('successMsg'),

    qrStage: document.getElementById('qrStage'),
    qrViewport: document.getElementById('qrViewport'),
    qrPlaceholder: document.getElementById('qrPlaceholder'),
    qrLoader: document.getElementById('qrLoader'),
    qrCodeCanvas: document.getElementById('qrCodeCanvas'),

    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    themeToggle: document.getElementById('themeToggle'),
  };

  /* ------------------------------------------------------------------ *
   * 2. State
   * ------------------------------------------------------------------ */
  const HISTORY_KEY = 'quickqr_history';
  const THEME_KEY = 'quickqr_theme';
  const MAX_HISTORY = 5;
  const GENERATION_DELAY_MS = 550; // artificial delay so the loading animation is perceptible

  let qrInstance = null;      // current QRCode.js instance
  let lastDataUrl = null;     // PNG data URL of the most recently generated code
  let generationToken = 0;    // guards against overlapping async generations

  /* ------------------------------------------------------------------ *
   * 3. Local storage / history helpers
   * ------------------------------------------------------------------ */

  /** Safely read the history array from localStorage. */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      // Corrupt data shouldn't crash the app — start fresh instead.
      console.warn('QuickQR: could not read history, resetting.', err);
      return [];
    }
  }

  /** Persist a history array to localStorage. */
  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('QuickQR: could not save history (storage may be full).', err);
    }
  }

  /** Add a new entry to history, keeping only the most recent MAX_HISTORY items. */
  function addToHistory(entry) {
    let history = loadHistory();
    // Avoid duplicate consecutive entries for the exact same config.
    history = history.filter((item) => !isSameEntry(item, entry));
    history.unshift(entry);
    history = history.slice(0, MAX_HISTORY);
    saveHistory(history);
    renderHistory();
  }

  function isSameEntry(a, b) {
    return a.text === b.text && a.size === b.size && a.qrColor === b.qrColor && a.bgColor === b.bgColor;
  }

  /** Render the history list into the DOM. */
  function renderHistory() {
    const history = loadHistory();
    els.historyList.innerHTML = '';

    if (history.length === 0) {
      els.historyEmpty.hidden = false;
      els.clearHistoryBtn.hidden = true;
      return;
    }

    els.historyEmpty.hidden = true;
    els.clearHistoryBtn.hidden = false;

    history.forEach((entry, index) => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Regenerate QR code for ${entry.text}`);
      btn.style.all = 'unset';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.gap = '4px';
      btn.style.width = '100%';

      const img = document.createElement('img');
      img.src = entry.dataUrl;
      img.alt = `QR code preview for ${entry.text}`;
      img.loading = 'lazy';

      const label = document.createElement('span');
      label.textContent = entry.text;

      btn.appendChild(img);
      btn.appendChild(label);
      li.appendChild(btn);
      els.historyList.appendChild(li);

      // Clicking (or keyboard-activating) a history item regenerates that exact code.
      btn.addEventListener('click', () => regenerateFromHistory(entry));
      li.dataset.index = String(index);
    });
  }

  function regenerateFromHistory(entry) {
    els.input.value = entry.text;
    els.sizeSelect.value = String(entry.size);
    els.qrColor.value = entry.qrColor;
    els.bgColor.value = entry.bgColor;
    generateQrCode();
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }

  /* ------------------------------------------------------------------ *
   * 4. Theme (dark / light) handling
   * ------------------------------------------------------------------ */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    els.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
      return;
    }
    // Fall back to the user's OS-level preference on first visit.
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ------------------------------------------------------------------ *
   * 5. QR generation core
   * ------------------------------------------------------------------ */

  /** Validate and normalize the raw input text before encoding. */
  function getSanitizedInput() {
    return els.input.value.trim();
  }

  /**
   * Generates a QR code from the current input + customization controls.
   * Wrapped in a small artificial delay so the loading animation (which
   * communicates progress to the user) is visible even for instant, tiny inputs.
   */
  function generateQrCode() {
    const text = getSanitizedInput();

    hideMessages();

    if (!text) {
      showError('Please enter some text, a URL, phone number, or email first.');
      els.input.focus();
        return;
    }

    const size = parseInt(els.sizeSelect.value, 10);
    const qrColor = els.qrColor.value;
    const bgColor = els.bgColor.value;

    showLoading(true);
    els.generateBtn.disabled = true;
    els.downloadBtn.disabled = true;

    const thisGeneration = ++generationToken;

    // Simulate/allow-for processing time so the loader is perceivable,
    // then perform the actual (synchronous) QRCode.js render.
    window.setTimeout(() => {
      // If another generation started after this one, abandon this result.
      if (thisGeneration !== generationToken) return;

      try {
        renderQrCode(text, size, qrColor, bgColor);

        // QRCode.js renders asynchronously into an <img>/<canvas>; wait a tick
        // for it to finish painting before we read it back out as a PNG.
        window.setTimeout(() => {
          if (thisGeneration !== generationToken) return;
          finalizeGeneration(text, size, qrColor, bgColor);
        }, 120);
      } catch (err) {
        console.error('QuickQR: generation failed.', err);
        showLoading(false);
        showError('Something went wrong generating that code. Please try again.');
        els.generateBtn.disabled = false;
      }
    }, GENERATION_DELAY_MS);
  }

  /** Actually invoke QRCode.js to paint the code into the viewport. */
  function renderQrCode(text, size, qrColor, bgColor) {
    els.qrCodeCanvas.innerHTML = ''; // clear any previous render
    qrInstance = new QRCode(els.qrCodeCanvas, {
      text,
      width: size,
      height: size,
      colorDark: qrColor,
      colorLight: bgColor,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  /** Once QRCode.js has painted, extract a PNG data URL, update UI + history. */
  function finalizeGeneration(text, size, qrColor, bgColor) {
    const dataUrl = extractDataUrl();

    showLoading(false);
    els.qrPlaceholder.hidden = true;
    els.qrViewport.classList.add('is-active');
    els.generateAnotherBtn.hidden = false;

    els.generateBtn.disabled = false;
    els.downloadBtn.disabled = !dataUrl;

    if (dataUrl) {
      lastDataUrl = dataUrl;
      showSuccess('QR code generated — ready to download.');
      addToHistory({ text, size, qrColor, bgColor, dataUrl });
    } else {
      showError('Could not read the generated image. Please try again.');
    }
  }

  /** QRCode.js renders either a <canvas> or an <img> depending on browser support. */
  function extractDataUrl() {
    const canvas = els.qrCodeCanvas.querySelector('canvas');
    if (canvas) return canvas.toDataURL('image/png');

    const img = els.qrCodeCanvas.querySelector('img');
    if (img && img.src) return img.src;

    return null;
  }

  /* ------------------------------------------------------------------ *
   * 6. Download handling
   * ------------------------------------------------------------------ */
  function downloadQrCode() {
    if (!lastDataUrl) {
      showError('Generate a QR code before downloading.');
      return;
    }
    const link = document.createElement('a');
    link.href = lastDataUrl;
    link.download = `quickqr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ------------------------------------------------------------------ *
   * 7. UI feedback helpers
   * ------------------------------------------------------------------ */
  function showError(message) {
    els.errorMsg.textContent = message;
    els.errorMsg.hidden = false;
    els.successMsg.hidden = true;
  }

  function showSuccess(message) {
    els.successMsg.textContent = message;
    els.successMsg.hidden = false;
    els.errorMsg.hidden = true;
  }

  function hideMessages() {
    els.errorMsg.hidden = true;
    els.successMsg.hidden = true;
  }

  function showLoading(isLoading) {
    els.qrLoader.hidden = !isLoading;
    if (isLoading) {
      els.qrPlaceholder.hidden = true;
      els.qrCodeCanvas.innerHTML = '';
    }
  }

  /** Full reset: clears input, generated code, history highlight, and messages. */
  function clearAll() {
    els.input.value = '';
    els.qrCodeCanvas.innerHTML = '';
    els.qrPlaceholder.hidden = false;
    els.qrViewport.classList.remove('is-active');
    els.generateAnotherBtn.hidden = true;
    els.downloadBtn.disabled = true;
    lastDataUrl = null;
    qrInstance = null;
    hideMessages();
    els.input.focus();
  }

  /** Copies the current input text to the clipboard, with a brief visual confirmation. */
  async function copyInputToClipboard() {
    const text = getSanitizedInput();
    if (!text) {
      showError('Nothing to copy yet — enter some text first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.classList.add('copied');
      els.copyBtn.setAttribute('aria-label', 'Copied!');
      window.setTimeout(() => {
        els.copyBtn.classList.remove('copied');
        els.copyBtn.setAttribute('aria-label', 'Copy input text to clipboard');
      }, 1500);
    } catch (err) {
      console.warn('QuickQR: clipboard copy failed.', err);
      showError('Could not copy to clipboard. Please copy manually.');
    }
  }

  /* ------------------------------------------------------------------ *
   * 8. Event wiring
   * ------------------------------------------------------------------ */
  function bindEvents() {
    els.generateBtn.addEventListener('click', generateQrCode);
    els.generateAnotherBtn.addEventListener('click', generateQrCode);

    // Pressing Enter inside the text field also triggers generation.
    els.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        generateQrCode();
      }
    });

    els.downloadBtn.addEventListener('click', downloadQrCode);
    els.clearBtn.addEventListener('click', clearAll);
    els.copyBtn.addEventListener('click', copyInputToClipboard);

    els.clearHistoryBtn.addEventListener('click', clearHistory);
    els.themeToggle.addEventListener('click', toggleTheme);
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  function init() {
    initTheme();
    renderHistory();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
