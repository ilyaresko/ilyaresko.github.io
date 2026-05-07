/* ==========================================================================
   search-link-rewriter.js
   Docsify plugin: rewrites search result links from auto-generated heading
   slugs (like "18-08-2025-елена-таганрог") to explicit episode IDs (like
   "ep-18-08-2025") so clicking a search result scrolls to the matching
   <h3 id="ep-..."> card header instead of falling on a non-existent anchor.

   Index of (heading-text-slug -> ep-id) is built per page render by scanning
   all <h3 id^="ep-"> elements; a MutationObserver on .results-panel rewrites
   anchor URLs as soon as docsify-search inserts them.
   ========================================================================== */

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
  'use strict';

  /** Map of slug -> ep-id, rebuilt on every page render. */
  var slugToEpId = Object.create(null);

  /** docsify-style heading slug generation (must match search.min.js). */
  function slugify(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, '')           // strip any HTML tags
      .replace(/[ \s]+/g, '-')      // whitespace -> hyphen
      .replace(/[«»“”"'`(),;:!?.]/g, '') // common punctuation
      .replace(/[^a-zа-яё0-9_\-]+/g, '-') // anything else -> hyphen
      .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
      .replace(/-+/g, '-');              // collapse multiple hyphens
  }

  /** Scan rendered DOM for h3 with explicit ep-* id. */
  function buildMap() {
    slugToEpId = Object.create(null);
    var headings = document.querySelectorAll('h3[id^="ep-"], h2[id^="ep-"]');
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var text = h.textContent || '';
      var slug = slugify(text);
      if (slug) slugToEpId[slug] = h.id;
    }
  }

  /** Rewrite a single anchor href if its slug matches a known card. */
  function rewriteHref(a) {
    var href = a.getAttribute('href') || '';
    var m = href.match(/(\?id=)([^&]+)/);
    if (!m) return;
    var slug;
    try {
      slug = decodeURIComponent(m[2]);
    } catch (e) {
      slug = m[2];
    }
    var epId = slugToEpId[slug];
    if (epId && epId !== slug) {
      a.setAttribute('href', href.replace(m[0], m[1] + encodeURIComponent(epId)));
    }
  }

  /** Walk results panel and rewrite all matching links. */
  function rewriteResults(root) {
    var links = root.querySelectorAll('a[href*="?id="]');
    for (var i = 0; i < links.length; i++) rewriteHref(links[i]);
  }

  // --- Observer setup -------------------------------------------------------

  var observer = null;

  function attachObserver() {
    if (observer) observer.disconnect();
    var panel = document.querySelector('.results-panel');
    if (!panel) return;

    observer = new MutationObserver(function (mutations) {
      // Check if any added node contains result links
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) {
            rewriteResults(added[j]);
          }
        }
      }
      // Also rewrite anything currently in the panel (covers replaced markup)
      rewriteResults(panel);
    });
    observer.observe(panel, { childList: true, subtree: true });
  }

  hook.doneEach(function () {
    buildMap();
    // Search panel is added to DOM by docsify-search after init; attach a
    // moment later so it exists.
    setTimeout(attachObserver, 50);
  });
});
