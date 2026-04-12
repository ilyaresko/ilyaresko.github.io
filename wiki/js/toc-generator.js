/* ==========================================================================
   toc-generator.js
   Docsify plugin: generates an in-page collapsible Table of Contents
   from h2/h3 headings, styled like MediaWiki's TOC block.
   Starts collapsed. Toggle via [показать]/[убрать].
   Also fixes footnote anchor links for Docsify hash routing.
   ========================================================================== */

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
  'use strict';

  hook.doneEach(function () {
    // Remove any previous TOC
    var old = document.querySelector('.wiki-toc');
    if (old) old.remove();

    var article = document.querySelector('.markdown-section');
    if (!article) return;

    // Current page route for building Docsify anchor links
    var route = location.hash.split('?')[0]; // e.g. "#/BK-reviews"

    // --- Fix footnote links ---
    // Docsify strips id from <sup> and content from <li>, so we do it all in JS.

    // 1. Forward refs: rewrite href="#note-N" to Docsify format, add back-anchor id
    var refLinks = article.querySelectorAll('sup.reference a[href*="note-"]');
    for (var r = 0; r < refLinks.length; r++) {
      var href = refLinks[r].getAttribute('href');
      var noteId = href.replace(/^.*?(note-\d+).*$/, '$1'); // extract "note-N"
      refLinks[r].setAttribute('href', route + '?id=' + encodeURIComponent(noteId));
      // Add back-anchor id on the parent <sup> so the ↑ can link back here
      refLinks[r].parentElement.id = noteId + '-back';
    }

    // 2. Back-links: prepend ↑ link to each <li id="note-N"> in references
    var noteLis = article.querySelectorAll('ol.references li[id^="note-"]');
    for (var n = 0; n < noteLis.length; n++) {
      var li = noteLis[n];
      if (li.querySelector('.ref-backlink')) continue; // already added
      var backId = li.id + '-back'; // e.g. "note-1-back"
      var backLink = document.createElement('a');
      backLink.className = 'ref-backlink';
      backLink.href = route + '?id=' + encodeURIComponent(backId);
      backLink.textContent = '↑';
      li.insertBefore(document.createTextNode(' '), li.firstChild);
      li.insertBefore(backLink, li.firstChild);
    }

    // --- Build TOC ---
    var headings = article.querySelectorAll('h2, h3');
    if (headings.length < 3) return;

    var root = document.createElement('ul');
    var currentH2Item = null;
    var currentSubList = null;

    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var anchor = '';

      // Docsify-generated <a> inside h2 from Markdown
      var docsifyLink = h.querySelector('a[href]');
      if (docsifyLink) {
        anchor = docsifyLink.getAttribute('href');
      } else {
        // h3 inside HTML blocks (episode cards) — use parent card id
        var card = h.closest('.episode-card');
        if (card && card.id) {
          anchor = route + '?id=' + encodeURIComponent(card.id);
        } else if (h.id) {
          anchor = route + '?id=' + encodeURIComponent(h.id);
        }
      }

      var text = h.textContent.trim();
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = anchor;
      a.textContent = text;
      li.appendChild(a);

      if (h.tagName === 'H2') {
        root.appendChild(li);
        currentH2Item = li;
        currentSubList = null;
      } else if (h.tagName === 'H3' && currentH2Item) {
        if (!currentSubList) {
          currentSubList = document.createElement('ul');
          currentH2Item.appendChild(currentSubList);
        }
        currentSubList.appendChild(li);
      }
    }

    // Create TOC container — starts collapsed
    var toc = document.createElement('div');
    toc.className = 'wiki-toc collapsed';

    var title = document.createElement('div');
    title.className = 'wiki-toc-title';
    title.textContent = 'Содержание ';

    var toggle = document.createElement('span');
    toggle.className = 'wiki-toc-toggle';
    toggle.textContent = '[показать]';
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isCollapsed = toc.classList.toggle('collapsed');
      toggle.textContent = isCollapsed ? '[показать]' : '[убрать]';
    });
    title.appendChild(toggle);

    toc.appendChild(title);
    toc.appendChild(root);

    // Insert after infobox or at the top of article
    var infobox = article.querySelector('.p-summary');
    if (infobox && infobox.nextSibling) {
      infobox.parentNode.insertBefore(toc, infobox.nextSibling);
    } else {
      article.insertBefore(toc, article.firstChild);
    }
  });
});
