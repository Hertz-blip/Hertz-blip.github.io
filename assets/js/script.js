// NOVA — nav + hover-play behavior

// This script always lives at assets/js/script.js relative to the site
// root, regardless of which page loads it (root-level index.html, or a
// page nested inside /pages/). Capturing its own URL here, while the
// script is still executing synchronously, lets us build asset paths
// that work no matter how deep the current page is.
var ASSETS_BASE = (function () {
  var scriptEl = document.currentScript;
  if (scriptEl && scriptEl.src) {
    return scriptEl.src.replace(/\/js\/script\.js.*$/, '');
  }
  return 'assets';
})();

// Boot loader + page transitions run immediately, not gated behind
// DOMContentLoaded, so the veil covers the page as early as possible.
(function () {
  var SEEN_KEY = 'nova-seen-boot';
  var SKETCH_KEY_EARLY = 'nova-sketch-mode';
  var GLITCH_TRANSITION_KEY = 'nova-glitch-transition';

  // Apply sketch mode as early as possible (before the veil is even
  // built) so the very first veil on a fresh load already knows to
  // show the drawing version instead of the render bar.
  try {
    if (localStorage.getItem(SKETCH_KEY_EARLY) === '1') {
      document.documentElement.classList.add('sketch-mode');
    }
  } catch (e) {}

  // Glitch mode itself doesn't persist across a page load (it's a
  // deliberately session-only secret), but if the click that started
  // this navigation happened while glitch mode was active, this flag
  // carries over just long enough for the landing half of the
  // transition to match the hacky style instead of snapping back to
  // the normal veil.
  var wantsGlitchVeil = false;
  try {
    wantsGlitchVeil = document.documentElement.classList.contains('glitch-mode')
      || sessionStorage.getItem(GLITCH_TRANSITION_KEY) === '1';
    sessionStorage.removeItem(GLITCH_TRANSITION_KEY);
  } catch (e) {}

  var hackLines = [
    'BREACHING MAINFRAME\u2026', 'BYPASSING FIREWALL\u2026', 'DECRYPTING PAGE.HTML\u2026',
    'SPOOFING IP\u2026', 'INJECTING PAYLOAD\u2026', 'ROOTING SERVER\u2026',
    'COVERING TRACKS\u2026', 'ACCESS GRANTED.'
  ];

  function buildVeil(forceGlitch) {
    var veil = document.createElement('div');
    veil.className = 'page-veil';
    var useGlitch = forceGlitch || wantsGlitchVeil;
    if (useGlitch) {
      veil.classList.add('glitch-veil');
      veil.innerHTML =
        '<div class="veil-label hack-label">INITIATING BREACH\u2026</div>' +
        '<div class="veil-bar hack-bar"><div class="veil-bar-fill hack-fill"></div></div>';
      var labelEl = veil.querySelector('.hack-label');
      var li = 0;
      var hackInterval = setInterval(function () {
        li = (li + 1) % hackLines.length;
        labelEl.textContent = hackLines[li];
      }, 110);
      setTimeout(function () { clearInterval(hackInterval); }, 1400);
    } else if (document.documentElement.classList.contains('sketch-mode')) {
      veil.innerHTML =
        '<div class="veil-label">Sketching this up\u2026</div>' +
        '<svg class="veil-squiggle" viewBox="0 0 220 40" fill="none">' +
        '<path d="M4 30 Q 30 5, 55 25 T 110 20 T 165 28 T 216 15" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="veil-squiggle-path"/>' +
        '</svg>';
    } else {
      veil.innerHTML =
        '<div class="veil-label">Rendering scene\u2026</div>' +
        '<div class="veil-bar"><div class="veil-bar-fill"></div></div>';
    }
    document.body.appendChild(veil);
    return veil;
  }

  var veil = buildVeil();
  var fill = veil.querySelector('.veil-bar-fill');
  var seenBoot = false;
  try { seenBoot = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}

  function revealPage() {
    veil.classList.add('hidden');
    setTimeout(function () { veil.remove(); }, 450);
  }

  if (seenBoot) {
    // already saw the full intro this session — just a quick fade,
    // acts as the "landing" half of a page transition
    if (fill) fill.style.width = '100%';
    setTimeout(revealPage, wantsGlitchVeil ? 500 : 120);
  } else {
    // first page this session: play the full render-bar intro
    if (fill) {
      fill.style.width = '0%';
      requestAnimationFrame(function () {
        setTimeout(function () { fill.style.width = '100%'; }, 30);
      });
    }
    setTimeout(revealPage, 750);
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
  }

  // Page transitions: intercept clicks on internal .html links (not
  // anchors on the same page, not new-tab links, not modifier-clicks)
  // and cover the page with the same veil before navigating, so moving
  // between pages feels like one continuous transition rather than a
  // hard reload.
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (link.target === '_blank') return;
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (href.indexOf('http') === 0 && href.indexOf(window.location.host) === -1) return;
      if (href.indexOf('.html') === -1) return;

      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var goingGlitchy = document.documentElement.classList.contains('glitch-mode');
        if (goingGlitchy) {
          try { sessionStorage.setItem(GLITCH_TRANSITION_KEY, '1'); } catch (e2) {}
        }
        var outVeil = buildVeil(goingGlitchy);
        outVeil.classList.add('entering');
        requestAnimationFrame(function () { outVeil.classList.remove('entering'); });
        setTimeout(function () { window.location.href = href; }, goingGlitchy ? 480 : 260);
      });
    });
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  // Easter egg: sketch mode. Loads the handwritten fonts on demand (only
  // once someone actually finds and clicks the toggle, not on every page
  // load) and remembers the choice across pages via localStorage.
  var SKETCH_KEY = 'nova-sketch-mode';

  function loadSketchFonts() {
    if (document.getElementById('sketch-fonts')) return;
    var link = document.createElement('link');
    link.id = 'sketch-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Patrick+Hand&display=swap';
    document.head.appendChild(link);
  }

  // Small "you found it" toast, bottom center, fades out on its own
  function showEggToast(message, isError) {
    var toast = document.querySelector('.egg-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'egg-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle('error-style', !!isError);
    // restart the transition so back-to-back toggles both animate
    requestAnimationFrame(function () { toast.classList.add('show'); });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, isError ? 1100 : 2200);
  }

  // Confetti burst — used when the contact form is submitted. Small
  // colored pieces fall and rotate away from the button, then remove
  // themselves.
  function confettiBurst(button) {
    var rect = button.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top;
    var colors = ['#D6472B', '#7cd4ff', '#F2C14E', '#8FD694', '#ECEAE4'];
    for (var i = 0; i < 26; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.background = colors[i % colors.length];
      piece.style.left = (cx + (Math.random() * 60 - 30)) + 'px';
      piece.style.top = cy + 'px';
      piece.style.setProperty('--cx', (Math.random() * 160 - 80) + 'px');
      piece.style.setProperty('--cy', (120 + Math.random() * 100) + 'px');
      piece.style.setProperty('--cr', (Math.random() * 540 - 270) + 'deg');
      piece.style.animationDelay = (Math.random() * 0.12) + 's';
      document.body.appendChild(piece);
      (function (el) { setTimeout(function () { el.remove(); }, 1400); })(piece);
    }
  }

  // Little pencil-scratch burst from the toggle button when switching on
  function burstFromToggle(button) {
    var rect = button.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var marks = ['\u270F', '\u2733', '\u270E', '\u2735'];
    for (var i = 0; i < 8; i++) {
      var mark = document.createElement('span');
      mark.className = 'egg-burst';
      mark.textContent = marks[i % marks.length];
      var angle = (Math.PI * 2 * i) / 8;
      var dist = 70 + Math.random() * 40;
      mark.style.left = cx + 'px';
      mark.style.top = cy + 'px';
      mark.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
      mark.style.setProperty('--by', Math.sin(angle) * dist + 'px');
      mark.style.setProperty('--br', (Math.random() * 90 - 45) + 'deg');
      document.body.appendChild(mark);
      (function (el) { setTimeout(function () { el.remove(); }, 1150); })(mark);
    }
  }

  // Marquee reads something playful while sketch mode is on, and
  // switches back to the real skills list when it's off
  var marqueeTrack = document.querySelector('.marquee-track');
  var marqueeNormalHTML = marqueeTrack ? marqueeTrack.innerHTML : null;
  function setMarqueeText(items) {
    if (!marqueeTrack) return;
    var html = '';
    for (var i = 0; i < 2; i++) {
      items.forEach(function (item) {
        html += '<span>' + item + '</span><span class="slash">/</span>';
      });
    }
    marqueeTrack.innerHTML = html;
  }

  function setSketchMode(on) {
    document.documentElement.classList.toggle('sketch-mode', on);
    if (on) {
      if (document.documentElement.classList.contains('glitch-mode')) {
        applyGlitchLevel(0);
      }
      loadSketchFonts();
      showEggToast("You found it! Click and drag to draw \u270F\uFE0F");
      setMarqueeText(['Hand Drawn', 'Not Really', 'Just CSS', 'Shh', 'Click The Pencil Again']);
      if (eggToggle) burstFromToggle(eggToggle);
    } else {
      showEggToast('Back to normal.');
      if (marqueeTrack && marqueeNormalHTML) marqueeTrack.innerHTML = marqueeNormalHTML;
      if (sketchCtx) sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    }
    try { localStorage.setItem(SKETCH_KEY, on ? '1' : '0'); } catch (e) {}
  }

  var sketchWasOn = false;
  try { sketchWasOn = localStorage.getItem(SKETCH_KEY) === '1'; } catch (e) {}

  var eggToggle = document.querySelector('.egg-toggle');

  // Hidden easter egg #2: glitch mode, only reachable via the Konami
  // code. No button, no hint in the UI — genuinely a secret.
  document.querySelectorAll('h1, h2, h3, .work-card-title, .tile-name, .nav-logo').forEach(function (el) {
    el.setAttribute('data-glitch-text', el.textContent);
  });

  var glitchActive = false;
  var glitchLevel = 0;
  var glitchBurstTimer = null;
  var glitchTitleTimer = null;
  var originalTitle = document.title;

  var glitchErrors = [
    'ERR_FRAME_BUFFER_CORRUPT',
    '0x00A3F — RENDER THREAD CRASHED',
    'RECOVERING SCENE\u2026',
    'PACKET LOSS — RESYNCING',
    'MEMORY LEAK IN COMPOSITOR',
    'SIGNAL LOST',
    'REBUILDING SHADER CACHE',
    'INSTALLING UPDATE 2.0: MORE CHAOS',
    'NICE HAIRCUT, BY THE WAY',
    'THIS SITE IS HAUNTED. PROBABLY.',
    'ERR_TOO_MUCH_TALENT_DETECTED',
    'PLEASE STOP CLICKING THINGS',
    'FETCHING MORE RAM\u2026',
    'LOADING EXCUSES\u2026 0%'
  ];

  var glitchChars = '!<>-_\\/[]{}—=+*^?#%$@01';
  function scrambleText(el) {
    if (!el || !el.dataset.glitchText) return;
    if (!el.dataset.originalHtml) el.dataset.originalHtml = el.innerHTML;
    var savedHtml = el.dataset.originalHtml;
    var real = el.dataset.glitchText;
    var chars = real.split('');
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] !== ' ' && Math.random() < 0.35) {
        chars[i] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
    }
    el.textContent = chars.join('');
    setTimeout(function () { el.innerHTML = savedHtml; }, 140);
  }

  // Big rotated "stamp" that flashes across the middle of the screen —
  // classic hacker-movie access-granted/denied moment
  var glitchStamps = ['ACCESS GRANTED', 'SYSTEM COMPROMISED', 'IDENTITY CONFIRMED', 'BREACH DETECTED'];
  function showGlitchStamp() {
    var stamp = document.createElement('div');
    stamp.className = 'glitch-stamp';
    stamp.textContent = glitchStamps[Math.floor(Math.random() * glitchStamps.length)];
    document.body.appendChild(stamp);
    setTimeout(function () { stamp.remove(); }, 650);
  }

  function scheduleGlitchBurst() {
    var base = glitchLevel >= 3 ? 700 : glitchLevel === 2 ? 1100 : 1800;
    var delay = base + Math.random() * base * 1.6;
    glitchBurstTimer = setTimeout(function () {
      if (!glitchActive) return;
      document.documentElement.classList.add('glitch-burst');
      setTimeout(function () {
        document.documentElement.classList.remove('glitch-burst');
      }, 220);

      // occasionally scramble a visible heading's actual text, not
      // just its RGB-split ::before/::after clones
      var headings = Array.prototype.slice.call(document.querySelectorAll('h1, h2'));
      var visible = headings.filter(function (h) {
        var r = h.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      if (visible.length) scrambleText(visible[Math.floor(Math.random() * visible.length)]);

      // rare fake system-error toast, or occasionally a big stamp instead
      var roll = Math.random();
      if (roll < 0.22) {
        var msg = glitchErrors[Math.floor(Math.random() * glitchErrors.length)];
        showEggToast(msg, true);
      } else if (roll < 0.32) {
        showGlitchStamp();
      }

      // higher levels redact text more often, and sometimes hit twice
      var redactChance = glitchLevel >= 3 ? 0.6 : glitchLevel === 2 ? 0.35 : 0.18;
      if (Math.random() < redactChance) {
        redactRandomText();
        if (glitchLevel >= 3 && Math.random() < 0.5) redactRandomText();
      }

      // on the about page, sync a quick photo flicker with the burst
      if (bioPhoto && Math.random() < 0.4) {
        bioGlitchFlicker(3 + Math.floor(Math.random() * 3));
      }

      scheduleGlitchBurst();
    }, delay);
  }

  function scheduleTitleGlitch() {
    glitchTitleTimer = setInterval(function () {
      if (!glitchActive) return;
      var corrupted = originalTitle.split('').map(function (c) {
        return Math.random() < 0.4 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : c;
      }).join('');
      document.title = corrupted;
      setTimeout(function () { if (glitchActive) document.title = originalTitle; }, 180);
    }, 2600 + Math.random() * 2000);
  }

  // Glitch mode: Watch Dogs style "profiler" overlay on the about page
  // photo — scan brackets, a sweeping scan line, and floating data
  // tags with fake profiling text that reshuffle periodically.
  var bioPhoto = document.querySelector('.bio-photo');
  var profilerTagTimer = null;
  var profilerTagPool = [
    'SUBJECT: A. SCHULTZ', 'THREAT LEVEL: HIGH', 'I WILL DESTROY THE PLANET',
    'DO NOT ENGAGE', 'ARMED (WITH BLENDER)', 'CAUTION: OVERPOWERED',
    'PLANS: WORLD DOMINATION', 'RUN.', 'MAIN CHARACTER ENERGY DETECTED',
    'CONTAINMENT RECOMMENDED', 'RESISTANCE IS FUTILE',
    'CLEARANCE: DENIED (TOO POWERFUL)', 'SCANNING FOR WEAKNESSES\u2026 NONE FOUND',
    'ROLE: VFX ARTIST (COVER STORY)', 'LOCATION: PROBABLY PLOTTING SOMETHING',
    'CTOS SCAN COMPLETE', 'ID: ALT-0X44F2'
  ];
  var profilerWrap = null;
  if (bioPhoto) {
    profilerWrap = document.createElement('div');
    profilerWrap.className = 'bio-photo-wrap';
    bioPhoto.parentNode.insertBefore(profilerWrap, bioPhoto);
    profilerWrap.appendChild(bioPhoto);

    var brackets = document.createElement('div');
    brackets.className = 'profiler-brackets';
    brackets.innerHTML =
      '<span class="pb tl"></span><span class="pb tr"></span>' +
      '<span class="pb bl"></span><span class="pb br"></span>' +
      '<span class="profiler-scanline"></span>';
    profilerWrap.appendChild(brackets);

    var tagsHolder = document.createElement('div');
    tagsHolder.className = 'profiler-tags';
    for (var t = 0; t < 3; t++) {
      var tag = document.createElement('span');
      tag.className = 'profiler-tag tag-' + t;
      tagsHolder.appendChild(tag);
    }
    profilerWrap.appendChild(tagsHolder);
  }

  // Glitch mode: the about photo itself flickers between corrupted
  // "hacked profile" variants instead of just sitting static under
  // the scan overlay. Preloaded once, lazily, the first time glitch
  // mode actually runs — not on every page load.
  var bioGlitchSrcs = [];
  for (var gi = 1; gi <= 10; gi++) {
    bioGlitchSrcs.push(ASSETS_BASE + '/media/about-me/glitch/image_' + (gi < 10 ? '0' + gi : gi) + '.jpg');
  }
  var bioGlitchLoaded = false;
  var bioOriginalSrc = bioPhoto ? bioPhoto.src : null;
  var bioCycleTimer = null;

  function preloadBioGlitchImages() {
    if (bioGlitchLoaded) return;
    bioGlitchLoaded = true;
    bioGlitchSrcs.forEach(function (src) {
      var img = new Image();
      img.src = src;
    });
  }

  function bioGlitchFlicker(times) {
    if (!bioPhoto) return;
    var i = 0;
    var flick = setInterval(function () {
      if (!glitchActive || i >= times) {
        clearInterval(flick);
        if (glitchActive) {
          bioPhoto.src = bioGlitchSrcs[Math.floor(Math.random() * bioGlitchSrcs.length)];
        }
        return;
      }
      bioPhoto.src = bioGlitchSrcs[Math.floor(Math.random() * bioGlitchSrcs.length)];
      i++;
    }, 90);
  }

  function scheduleBioCycle() {
    if (!bioPhoto) return;
    preloadBioGlitchImages();
    bioCycleTimer = setInterval(function () {
      if (!glitchActive) return;
      // most ticks: calm switch to a new variant. occasionally: a
      // quick multi-frame flicker for a proper "signal corrupted" beat
      if (Math.random() < 0.25) {
        bioGlitchFlicker(4 + Math.floor(Math.random() * 3));
      } else {
        bioPhoto.src = bioGlitchSrcs[Math.floor(Math.random() * bioGlitchSrcs.length)];
      }
    }, 2600);
  }

  function resetBioPhoto() {
    clearInterval(bioCycleTimer);
    if (bioPhoto && bioOriginalSrc) bioPhoto.src = bioOriginalSrc;
  }

  // Small "signal strength" HUD indicator, bottom-left, visible only
  // in glitch mode — flickers erratically like a bad connection
  var signalHud = document.createElement('div');
  signalHud.className = 'glitch-signal';
  signalHud.innerHTML =
    '<span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span>' +
    '<span class="signal-label">SIGNAL</span>';
  document.body.appendChild(signalHud);
  setInterval(function () {
    if (!glitchActive) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    signalHud.querySelectorAll('.bar').forEach(function (bar) {
      bar.style.opacity = Math.random() < 0.7 ? '1' : '0.25';
    });
  }, 260);

  function refreshProfilerTags() {
    if (!profilerWrap) return;
    var tags = profilerWrap.querySelectorAll('.profiler-tag');
    tags.forEach(function (tag) {
      tag.textContent = profilerTagPool[Math.floor(Math.random() * profilerTagPool.length)];
      tag.style.top = (8 + Math.random() * 80) + '%';
      var onLeftSide = Math.random() < 0.5;
      tag.style.left = onLeftSide ? (-6 - Math.random() * 30) + '%' : '';
      tag.style.right = onLeftSide ? '' : (-6 - Math.random() * 30) + '%';
      tag.classList.add('visible');
      clearTimeout(tag._hideTimer);
      tag._hideTimer = setTimeout(function (el) {
        return function () { el.classList.remove('visible'); };
      }(tag), 900 + Math.random() * 600);
    });
  }

  function scheduleProfilerTags() {
    profilerTagTimer = setInterval(function () {
      if (!glitchActive) return;
      refreshProfilerTags();
    }, 2200);
  }

  // Fake terminal window, bottom-right, "types" out fake hacker
  // commands periodically while glitch mode is active
  var terminalCommands = [
    'sudo rm -rf /', 'accessing mainframe\u2026', 'password: ********',
    'bypassing firewall\u2026', 'nc -lvp 4444', 'whoami', 'root',
    'decrypting files\u2026', 'ping planet.destroy -t', 'access granted.',
    './world_domination.sh', 'sudo chmod +777 the_universe'
  ];
  var glitchTerminal = document.createElement('div');
  glitchTerminal.className = 'glitch-terminal';
  glitchTerminal.innerHTML = '<span class="term-prompt">$</span> <span class="term-text"></span><span class="term-cursor">\u2588</span>';
  document.body.appendChild(glitchTerminal);
  var termTextEl = glitchTerminal.querySelector('.term-text');
  var terminalTimer = null;

  function typeTerminalLine() {
    var line = terminalCommands[Math.floor(Math.random() * terminalCommands.length)];
    var i = 0;
    glitchTerminal.classList.add('active');
    termTextEl.textContent = '';
    var typeInterval = setInterval(function () {
      if (!glitchActive) { clearInterval(typeInterval); return; }
      termTextEl.textContent = line.slice(0, i);
      i++;
      if (i > line.length) {
        clearInterval(typeInterval);
        setTimeout(function () { glitchTerminal.classList.remove('active'); }, 900);
      }
    }, 35);
  }

  function scheduleTerminal(level) {
    var delay = level >= 3 ? 1400 : level === 2 ? 2400 : 4000;
    terminalTimer = setTimeout(function () {
      if (!glitchActive) return;
      typeTerminalLine();
      scheduleTerminal(glitchLevel);
    }, delay + Math.random() * delay);
  }

  // A big "BOO!" that pops up somewhere on screen, holds for a beat,
  // then vanishes — a rare, silly jump-scare, not a real one
  var booMessages = ['BOO! \uD83D\uDC7B', 'GOTCHA! \uD83D\uDE08', 'RAWR \uD83E\uDD96', 'DID I SCARE YOU?', 'SURPRISE! \uD83C\uDF89', '\uD83D\uDC7B BOO \uD83D\uDC7B'];
  var booTimer = null;
  function popBoo() {
    var el = document.createElement('div');
    el.className = 'glitch-boo';
    el.textContent = booMessages[Math.floor(Math.random() * booMessages.length)];
    el.style.top = (20 + Math.random() * 50) + '%';
    el.style.left = (15 + Math.random() * 55) + '%';
    el.style.setProperty('--boo-rot', (Math.random() * 16 - 8) + 'deg');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 750);
  }
  function scheduleBoo() {
    var delay = 7000 + Math.random() * 9000;
    booTimer = setTimeout(function () {
      if (!glitchActive) return;
      popBoo();
      scheduleBoo();
    }, delay);
  }

  // A little parade of emoji marches across the bottom of the screen
  // every so often, because why not
  var paradeTimer = null;
  function runParade() {
    var emojis = ['\uD83D\uDC7B', '\uD83D\uDC0D', '\uD83E\uDD96', '\uD83D\uDC7E', '\uD83D\uDD25'];
    var row = document.createElement('div');
    row.className = 'glitch-parade';
    row.textContent = emojis.join(' ');
    document.body.appendChild(row);
    setTimeout(function () { row.remove(); }, 6200);
  }
  function scheduleParade() {
    paradeTimer = setTimeout(function () {
      if (!glitchActive) return;
      runParade();
      scheduleParade();
    }, 14000 + Math.random() * 10000);
  }

  // Fake "hacking" percentage counter — ticks up, never quite finishes
  var hackingHud = document.createElement('div');
  hackingHud.className = 'glitch-hacking';
  hackingHud.innerHTML = 'HACKING: <span class="hacking-pct">0%</span>';
  document.body.appendChild(hackingHud);
  var hackingPct = 0;
  var hackingTimer = null;
  function scheduleHacking() {
    hackingTimer = setInterval(function () {
      if (!glitchActive) return;
      hackingPct += Math.random() * 6;
      if (hackingPct > 96) hackingPct = 20 + Math.random() * 30; // never finishes, loops back
      hackingHud.querySelector('.hacking-pct').textContent = Math.floor(hackingPct) + '%';
    }, 220);
  }

  // Redaction bars — black censor bars briefly cover a couple of
  // paragraphs, like a declassified document
  function redactRandomText() {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll('.bio-text p, .why-item p, .step-desc, .project-desc')
    ).filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0 && r.width > 0;
    });
    if (!candidates.length) return;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    var rect = pick.getBoundingClientRect();
    var bar = document.createElement('div');
    bar.className = 'glitch-redact';
    bar.style.left = rect.left + 'px';
    bar.style.top = rect.top + 'px';
    bar.style.width = rect.width + 'px';
    bar.style.height = rect.height + 'px';
    document.body.appendChild(bar);
    setTimeout(function () { bar.remove(); }, 420);
  }

  // Self-destruct gag — plays once, the first time glitch mode is
  // switched on in this session
  var selfDestructShown = false;
  function playSelfDestructGag() {
    if (selfDestructShown) return;
    selfDestructShown = true;
    var el = document.createElement('div');
    el.className = 'glitch-selfdestruct';
    document.body.appendChild(el);
    var count = 5;
    el.textContent = 'SELF DESTRUCT IN ' + count;
    var tick = setInterval(function () {
      count--;
      if (count > 0) {
        el.textContent = 'SELF DESTRUCT IN ' + count;
      } else {
        clearInterval(tick);
        el.textContent = '\u2026just kidding. (probably)';
        el.classList.add('joke');
        setTimeout(function () {
          el.classList.add('fade-out');
          setTimeout(function () { el.remove(); }, 500);
        }, 1600);
      }
    }, 650);
  }

  function toastForLevel(level) {
    if (level === 1) return '\u25B2\u25B2\u25BC\u25BC\u25C4\u25BA\u25C4\u25BA — glitch mode.';
    if (level === 2) return 'LEVEL 2 \u2014 getting worse.';
    return 'LEVEL 3 \u2014 MAXIMUM CHAOS.';
  }

  function applyGlitchLevel(level) {
    glitchLevel = level;
    glitchActive = level > 0;
    document.documentElement.classList.toggle('glitch-mode', glitchActive);
    document.documentElement.classList.toggle('glitch-lvl-2', level === 2);
    document.documentElement.classList.toggle('glitch-lvl-3', level === 3);

    clearTimeout(glitchBurstTimer);
    clearInterval(glitchTitleTimer);
    clearInterval(profilerTagTimer);
    clearTimeout(terminalTimer);
    clearInterval(hackingTimer);
    clearTimeout(booTimer);
    clearTimeout(paradeTimer);
    clearInterval(bioCycleTimer);

    if (glitchActive) {
      if (document.documentElement.classList.contains('sketch-mode')) {
        setSketchMode(false);
      }
      showEggToast(toastForLevel(level));
      var wantsBursts = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (wantsBursts) {
        scheduleGlitchBurst();
        scheduleTitleGlitch();
        scheduleTerminal(level);
        scheduleHacking();
        scheduleBoo();
        scheduleParade();
        if (bioPhoto) {
          refreshProfilerTags();
          scheduleProfilerTags();
          scheduleBioCycle();
        }
        if (level === 1) playSelfDestructGag();
      }
    } else {
      showEggToast('Back to normal.');
      document.documentElement.classList.remove('glitch-burst');
      document.title = originalTitle;
      glitchTerminal.classList.remove('active');
      resetBioPhoto();
      if (profilerWrap) {
        profilerWrap.querySelectorAll('.profiler-tag').forEach(function (tag) {
          tag.classList.remove('visible');
        });
      }
    }
  }

  // Entering the Konami code again while already active escalates
  // instead of turning it off — level 1 -> 2 -> 3 -> back to off
  function cycleGlitchLevel() {
    applyGlitchLevel((glitchLevel + 1) % 4);
  }

  var konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiProgress = 0;
  document.addEventListener('keydown', function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konamiSequence[konamiProgress]) {
      konamiProgress++;
      if (konamiProgress === konamiSequence.length) {
        konamiProgress = 0;
        cycleGlitchLevel();
      }
    } else {
      konamiProgress = (key === konamiSequence[0]) ? 1 : 0;
    }
  });

  // Draw on the page while sketch mode is active: a full page canvas
  // that never blocks clicks (pointer-events: none), driven by
  // document-level mouse events instead of canvas events so links and
  // buttons underneath still work normally while drawing.
  var sketchCanvas = document.createElement('canvas');
  sketchCanvas.className = 'sketch-canvas';
  document.body.appendChild(sketchCanvas);
  var sketchCtx = sketchCanvas.getContext('2d');

  function resizeSketchCanvas() {
    var ratio = window.devicePixelRatio || 1;
    sketchCanvas.width = window.innerWidth * ratio;
    sketchCanvas.height = window.innerHeight * ratio;
    sketchCtx.scale(ratio, ratio);
    sketchCtx.lineCap = 'round';
    sketchCtx.lineJoin = 'round';
  }
  resizeSketchCanvas();
  window.addEventListener('resize', resizeSketchCanvas);

  var isDrawing = false;
  var lastX = 0, lastY = 0;

  document.addEventListener('mousedown', function (e) {
    if (!document.documentElement.classList.contains('sketch-mode')) return;
    isDrawing = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  document.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    sketchCtx.strokeStyle = 'rgba(28, 28, 25, 0.6)';
    sketchCtx.lineWidth = 2 + Math.random() * 0.6;
    sketchCtx.beginPath();
    sketchCtx.moveTo(lastX, lastY);
    sketchCtx.lineTo(e.clientX, e.clientY);
    sketchCtx.stroke();
    lastX = e.clientX;
    lastY = e.clientY;
  });
  document.addEventListener('mouseup', function () { isDrawing = false; });
  document.addEventListener('mouseleave', function () { isDrawing = false; });

  // Double click anywhere clears the drawing
  document.addEventListener('dblclick', function () {
    if (!document.documentElement.classList.contains('sketch-mode')) return;
    sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
  });

  if (sketchWasOn) {
    // returning with sketch mode already on: apply it quietly, no toast/burst
    document.documentElement.classList.add('sketch-mode');
    loadSketchFonts();
    setMarqueeText(['Hand Drawn', 'Not Really', 'Just CSS', 'Shh', 'Click The Pencil Again']);
  }

  if (eggToggle) {
    eggToggle.addEventListener('click', function () {
      setSketchMode(!document.documentElement.classList.contains('sketch-mode'));
    });
  }

  // Custom cursor: a small reticle that follows the mouse and expands
  // over clickable elements. Only on devices with a real mouse — skipped
  // on touch devices and when the person prefers reduced motion.
  var wantsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (wantsCustomCursor) {
    document.body.classList.add('custom-cursor-active');

    var cursor = document.createElement('div');
    cursor.className = 'cursor-reticle';
    cursor.innerHTML =
      '<span class="dot"></span>' +
      '<span class="corner tl"></span>' +
      '<span class="corner tr"></span>' +
      '<span class="corner bl"></span>' +
      '<span class="corner br"></span>' +
      '<span class="pencil-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>' +
      '<span class="glitch-glyph"></span>' +
      '<span class="cursor-context-icon icon-play">' +
        '<span class="icon-normal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<span class="icon-sketch">&#9654;</span>' +
        '<span class="icon-glitch"></span>' +
      '</span>' +
      '<span class="cursor-context-icon icon-text">' +
        '<span class="icon-normal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 4h6M12 4v16M9 20h6"/></svg></span>' +
        '<span class="icon-sketch">Aa</span>' +
        '<span class="icon-glitch"></span>' +
      '</span>';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', function (e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      cursor.classList.add('visible');
    });
    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('visible');
    });

    // Three flavors of hover target: a video's native play controls, a
    // text field, or anything generically clickable. Checked in this
    // order since a video/input can itself sit inside a generically
    // "clickable" wrapper like .media-frame.
    var videoHoverTarget = 'video';
    var textHoverTarget = 'input, textarea';
    var genericHoverTargets = 'a, button, .work-card, .media-frame, .nav-burger';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(videoHoverTarget)) {
        cursor.classList.add('hovering', 'hovering-video');
      } else if (e.target.closest(textHoverTarget)) {
        cursor.classList.add('hovering', 'hovering-text');
      } else if (e.target.closest(genericHoverTargets)) {
        cursor.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(videoHoverTarget)) {
        cursor.classList.remove('hovering', 'hovering-video');
      } else if (e.target.closest(textHoverTarget)) {
        cursor.classList.remove('hovering', 'hovering-text');
      } else if (e.target.closest(genericHoverTargets)) {
        cursor.classList.remove('hovering');
      }
    });

    // Glitch mode: the cursor itself corrupts into cycling glyphs
    // instead of the usual dot/reticle — and so do the video/text
    // context icons, mostly showing their real glyph with occasional
    // corruption rather than cycling completely at random.
    var glyphChars = '!<>-_\\/[]{}=+*^?#%$@01';
    var glyphEl = cursor.querySelector('.glitch-glyph');
    var playGlitchEl = cursor.querySelector('.icon-play .icon-glitch');
    var textGlitchEl = cursor.querySelector('.icon-text .icon-glitch');
    function corruptedChar(real) {
      return Math.random() < 0.5 ? glyphChars[Math.floor(Math.random() * glyphChars.length)] : real;
    }
    setInterval(function () {
      if (!document.documentElement.classList.contains('glitch-mode')) return;
      glyphEl.textContent = glyphChars[Math.floor(Math.random() * glyphChars.length)];
      playGlitchEl.textContent = corruptedChar('\u25B6');
      textGlitchEl.textContent = corruptedChar('A');
    }, 90);
  }

  // Nav toggle: burger animates into an X, opens the full screen menu
  var burger = document.querySelector('.nav-burger');
  var panel = document.querySelector('.nav-mobile-panel');
  if (burger && panel) {
    burger.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        panel.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    // close on escape, for keyboard users
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        panel.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Lazy-load grid videos: work-card videos on the home page use
  // data-src instead of src, so the browser doesn't fire off 11
  // requests on page load. The real src is only assigned once a tile
  // is about to scroll into view (generous rootMargin so nothing
  // flashes blank), and once assigned it plays on hover as normal.
  var lazyVideos = document.querySelectorAll('.work-card video[data-src]');
  if (lazyVideos.length) {
    var lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var v = entry.target;
          v.src = v.dataset.src;
          v.removeAttribute('data-src');
          lazyObserver.unobserve(v);
        }
      });
    }, { rootMargin: '400px 0px' });
    lazyVideos.forEach(function (v) { lazyObserver.observe(v); });
  }

  // Grid tile interactions: play the preview video on hover, looping
  // from the start, like before. The 3D tilt-toward-cursor effect only
  // kicks in while sketch mode is active. Cards with a still image
  // (.thumb-still) get a "hovering" class toggled so CSS can swap from
  // the still to the video.
  document.querySelectorAll('.work-card').forEach(function (card) {
    var video = card.querySelector('video.thumb-media');
    if (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
    }

    var onEnter = function () {
      card.classList.add('hovering');
      if (document.documentElement.classList.contains('sketch-mode')) {
        card.style.transition = 'transform .1s ease-out';
      }
      if (video) {
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute('data-src');
        }
        video.play().catch(function () {});
      }
    };

    var onMove = function (e) {
      // 3D tilt toward the cursor — sketch mode only
      if (!document.documentElement.classList.contains('sketch-mode')) return;
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var rotateY = (px - 0.5) * 14;
      var rotateX = (0.5 - py) * 14;
      card.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
    };

    var onLeave = function () {
      card.classList.remove('hovering');
      card.style.transition = 'transform .3s ease';
      card.style.transform = '';
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('focus', onEnter);
    card.addEventListener('blur', onLeave);
  });

  // Scroll reveal: fade any .reveal element in as it scrolls into view,
  // and back out again if scrolled past in either direction, so it
  // replays every time rather than once. Used across every page.
  var revealTargets = document.querySelectorAll('.reveal');
  if (revealTargets.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () { entry.target.classList.add('is-visible'); }, i * 60);
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  // About page: count each stat number up from 0 once it scrolls into
  // view. Reads the target value from data-count, e.g.
  // <span class="stat-number" data-count="5" data-suffix="+">0</span>
  var statNumbers = document.querySelectorAll('.stat-number[data-count]');
  if (statNumbers.length) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || '';
        var duration = 900;
        var start = performance.now();

        var step = function (now) {
          var progress = Math.min((now - start) / duration, 1);
          var value = target * progress;
          el.textContent = (target % 1 === 0 ? Math.round(value) : value.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(function (el) { countObserver.observe(el); });
  }

  // Lightbox: click a project photo (inside .media-frame) to enlarge
  // it in an overlay. Click the overlay, the close button, or press
  // Escape to close. Videos are left alone — only images enlarge.
  var lightboxImages = document.querySelectorAll('.media-frame img');
  if (lightboxImages.length) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(overlay);

    var overlayImg = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.lightbox-close');

    var openLightbox = function (src, alt) {
      overlayImg.src = src;
      overlayImg.alt = alt || '';
      overlay.classList.add('open');
    };
    var closeLightbox = function () {
      overlay.classList.remove('open');
    };

    lightboxImages.forEach(function (img) {
      img.addEventListener('click', function () {
        openLightbox(img.src, img.alt);
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
    });
  }

  // Contact form: builds a pre-filled Gmail compose window from the
  // form fields, so it opens straight into Gmail in the browser rather
  // than the visitor's default mail app. A little confetti burst first,
  // as a small celebratory moment for actually reaching out.
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = contactForm.name.value.trim();
      var fromEmail = contactForm.email.value.trim();
      var subject = contactForm.subject.value.trim();
      var message = contactForm.message.value.trim();

      var body = message + '\n\n---\nFrom: ' + name + ' (' + fromEmail + ')';
      var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1'
        + '&to=' + encodeURIComponent('altuswork8@gmail.com')
        + '&su=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) confettiBurst(submitBtn);

      setTimeout(function () {
        window.open(gmailUrl, '_blank');
      }, 350);
    });
  }
});
