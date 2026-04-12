/* ==========================================================================
   episode-cards.js
   Docsify plugin: IntersectionObserver-based fade-in animation for
   .episode-card elements. Adds class "visible" with staggered delays.
   Falls back to immediate display when IntersectionObserver is unavailable.
   ========================================================================== */

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
  'use strict';

  /** Maximum number of cards that receive a staggered delay. */
  var STAGGER_LIMIT = 10;

  /** Delay increment per card in milliseconds. */
  var STAGGER_STEP = 50;

  /**
   * Apply the no-animation fallback: make all cards visible immediately.
   */
  function applyFallback(cards) {
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.add('no-animate');
    }
  }

  /**
   * Observe cards and reveal them with a staggered delay as they
   * enter the viewport.
   */
  function observeCards(cards) {
    // Counter tracks position within the current reveal batch
    var revealIndex = 0;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (!entry.isIntersecting) continue;

          var card = entry.target;

          // Stagger the first STAGGER_LIMIT cards, then no delay
          if (revealIndex < STAGGER_LIMIT) {
            card.style.transitionDelay = (revealIndex * STAGGER_STEP) + 'ms';
          }
          revealIndex++;

          card.classList.add('visible');
          observer.unobserve(card);

          // Clear stagger delay after fade-in so it doesn't affect hover
          if (card.style.transitionDelay) {
            setTimeout(function () {
              card.style.transitionDelay = '';
            }, 600); // slightly longer than the 0.5s fade-in transition
          }
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    for (var j = 0; j < cards.length; j++) {
      observer.observe(cards[j]);
    }
  }

  // --- Docsify hook: run after each page render ---
  hook.doneEach(function () {
    var cards = document.querySelectorAll('.episode-card');
    if (!cards.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      // No observer — cards stay visible (default CSS state)
      return;
    }

    // Mark cards for animation (hides them), then observe for reveal
    for (var k = 0; k < cards.length; k++) {
      cards[k].classList.add('animate-ready');
    }
    observeCards(cards);
  });
});
