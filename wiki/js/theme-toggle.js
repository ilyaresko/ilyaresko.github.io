/* ==========================================================================
   theme-toggle.js
   Dark/light theme toggle with localStorage persistence for Docsify v4.
   Reads user preference, falls back to OS preference, defaults to light.
   Persists across Docsify SPA page transitions.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'wiki-theme';

  /**
   * Determine the initial theme.
   * Priority: localStorage > OS preference > light.
   */
  function getInitialTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply theme to the document root.
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }

  /**
   * Return the correct button icon for the current theme.
   * Sun when dark (click to go light), moon when light (click to go dark).
   */
  function getIcon(theme) {
    return theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  /**
   * Create the toggle button and insert it into the DOM.
   */
  function createToggleButton(theme) {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.textContent = getIcon(theme);

    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';

      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      btn.textContent = getIcon(next);
    });

    document.body.appendChild(btn);
  }

  // --- Initialise ---

  var theme = getInitialTheme();
  applyTheme(theme);

  // Button must wait for the body to exist.
  if (document.body) {
    createToggleButton(theme);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      createToggleButton(theme);
    });
  }
})();
