/* ==========================================================================
   audio-player.js
   Docsify plugin: transforms .audio-player[data-src] divs into working
   inline mini-players with play/pause, progress bar, seek, and time display.
   Only one player plays at a time.
   ========================================================================== */

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
  'use strict';

  /** All active Audio instances, used to enforce single-player-at-a-time. */
  var activePlayers = [];

  /**
   * Format seconds as M:SS.
   */
  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /**
   * Stop every player except the one passed in.
   */
  function stopOtherPlayers(currentAudio) {
    for (var i = 0; i < activePlayers.length; i++) {
      var entry = activePlayers[i];
      if (entry.audio !== currentAudio && !entry.audio.paused) {
        entry.audio.pause();
        entry.btn.textContent = '\u25B6';
      }
    }
  }

  /**
   * Build the player UI inside one .audio-player element.
   */
  function initPlayer(el) {
    var src = el.getAttribute('data-src');
    if (!src) return;

    // Clear original label content
    el.innerHTML = '';

    // --- Play / Pause button ---
    var playBtn = document.createElement('button');
    playBtn.className = 'play-btn';
    playBtn.textContent = '\u25B6';

    // --- Progress bar ---
    var progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    var progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressBar.appendChild(progressFill);

    // --- Time display ---
    var timeDisplay = document.createElement('span');
    timeDisplay.className = 'time';
    timeDisplay.textContent = '0:00';

    // --- Assemble DOM ---
    el.appendChild(playBtn);
    el.appendChild(progressBar);
    el.appendChild(timeDisplay);

    // --- Audio element ---
    var audio = new Audio(src);

    // Register for single-player enforcement
    activePlayers.push({ audio: audio, btn: playBtn });

    // --- Play / Pause toggle ---
    playBtn.addEventListener('click', function () {
      if (audio.paused) {
        stopOtherPlayers(audio);
        audio.play();
        playBtn.textContent = '\u23F8';
      } else {
        audio.pause();
        playBtn.textContent = '\u25B6';
      }
    });

    // --- Progress update ---
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        var pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = pct + '%';
      }
      timeDisplay.textContent = formatTime(audio.currentTime);
    });

    // --- Seek on click ---
    progressBar.addEventListener('click', function (e) {
      if (audio.duration) {
        audio.currentTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
      }
    });

    // --- Reset on end ---
    audio.addEventListener('ended', function () {
      audio.currentTime = 0;
      progressFill.style.width = '0%';
      timeDisplay.textContent = '0:00';
      playBtn.textContent = '\u25B6';
    });

    // Mark as initialised so we never process it twice
    el.setAttribute('data-initialized', 'true');
  }

  // --- Docsify hook: run after each page render ---
  hook.doneEach(function () {
    var players = document.querySelectorAll('.audio-player[data-src]:not([data-initialized])');
    for (var i = 0; i < players.length; i++) {
      initPlayer(players[i]);
    }
  });
});
