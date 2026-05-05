/* eslint-env browser */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------
  var TT = window.Chyrp;
  if (!TT) {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<div style="background:#fee2e2;color:#991b1b;padding:16px;font:14px system-ui;border-bottom:1px solid #fecaca">' +
        '<strong>Build missing:</strong> run <code>npm run build</code> in the project root, then reload this page.' +
        '</div>',
    );
    return;
  }
  var chyrp = TT.chyrp;
  var configure = TT.configure;
  var dismissAll = TT.dismissAll;
  var dismissChannel = TT.dismissChannel;
  var interceptAlert = TT.interceptAlert;

  function on(selector, fn) {
    var el = document.querySelector(selector);
    if (el) el.addEventListener('click', fn);
  }
  function bind(name, fn) {
    var btn = document.querySelector('[data-demo="' + name + '"]');
    if (btn) btn.addEventListener('click', fn);
  }
  function pickRadio(group) {
    var checked = document.querySelector('input[name="' + group + '"]:checked');
    return checked ? checked.value : null;
  }

  // ---------------------------------------------------------------------------
  // Syntax highlighting (Prism auto-detect)
  // ---------------------------------------------------------------------------
  (function () {
    if (typeof Prism === 'undefined') return;
    var blocks = document.querySelectorAll('pre.code > code');
    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];
      var text = el.textContent;
      var lang;
      if (/^(npm |yarn |pnpm )/.test(text)) {
        lang = 'bash';
      } else if (/^\s*<|^\s*&lt;/.test(text) || /^\s*<!--/.test(text)) {
        lang = 'markup';
      } else if (/^\s*:root\b|^\s*--tt-|^\s*\.[a-z].*\{/m.test(text)) {
        lang = 'css';
      } else {
        lang = 'javascript';
      }
      el.className = 'language-' + lang;
      el.parentElement.className += ' language-' + lang;
    }
    Prism.highlightAll();
  })();

  // ---------------------------------------------------------------------------
  // Rotating tagline
  // ---------------------------------------------------------------------------
  (function () {
    var wrapper = document.querySelector('.rotating-wrapper');
    if (!wrapper) return;
    var phrases = JSON.parse(wrapper.getAttribute('data-phrases') || '[]');
    if (!phrases.length) return;

    var current = wrapper.querySelector('.rotating-current');
    var underline = wrapper.querySelector('.rotating-underline');
    var index = 0;
    var DISPLAY_MS = 2000;
    var TRANSITION_MS = 300;
    var WIDTH_TRANSITION_MS = 400;

    // off-screen element used to measure phrase widths without affecting layout
    var ruler = document.createElement('span');
    ruler.className = 'rotating-current';
    ruler.style.position = 'absolute';
    ruler.style.visibility = 'hidden';
    ruler.style.whiteSpace = 'nowrap';
    wrapper.appendChild(ruler);

    function measureWidth(text) {
      ruler.textContent = text;
      return ruler.offsetWidth;
    }

    function show(i) {
      var text = phrases[i];
      var nextW = measureWidth(text);

      // slide current text out (up)
      current.classList.add('out');

      // expand/shrink wrapper to fit next phrase while old text fades out
      wrapper.style.width = nextW + 'px';
      underline.style.width = nextW + 'px';

      // after the old text is fully hidden, swap and slide new text in
      setTimeout(
        function () {
          current.textContent = text;

          // prep incoming position (below)
          current.classList.remove('out');
          current.classList.add('in');

          // force reflow so the 'in' state is painted before we remove it
          void current.offsetHeight;

          // animate into view
          current.classList.remove('in');
        },
        Math.max(TRANSITION_MS, WIDTH_TRANSITION_MS),
      );
    }

    function tick() {
      index = (index + 1) % phrases.length;
      show(index);
    }

    // initial render (no animation)
    current.textContent = phrases[0];
    var initialW = measureWidth(phrases[0]);
    wrapper.style.width = initialW + 'px';
    underline.style.width = initialW + 'px';

    setInterval(tick, DISPLAY_MS + Math.max(TRANSITION_MS, WIDTH_TRANSITION_MS) + TRANSITION_MS);
  })();

  // ---------------------------------------------------------------------------
  // Theme toggle
  // ---------------------------------------------------------------------------
  (function () {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    var stored = localStorage.getItem('chyrp-theme') || 'system';
    applyTheme(stored);

    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-theme]');
      if (!btn) return;
      var theme = btn.getAttribute('data-theme');
      applyTheme(theme);
      localStorage.setItem('chyrp-theme', theme);
    });

    function applyTheme(theme) {
      var html = document.documentElement;
      html.classList.remove('light', 'dark');
      if (theme === 'light') html.classList.add('light');
      else if (theme === 'dark') html.classList.add('dark');
      toggle.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-theme') === theme);
      });
    }
  })();

  // ---------------------------------------------------------------------------
  // Hero
  // ---------------------------------------------------------------------------
  bind('hero-info', function () {
    chyrp.info('Saved', { title: 'Success' });
  });
  bind('hero-warning', function () {
    chyrp.warning('Almost out of space');
  });
  bind('hero-error', function () {
    chyrp.error('Upload failed', { title: 'Network error' });
  });
  bind('hero-loading', function () {
    var h = chyrp.loading('Working…');
    setTimeout(function () {
      h.update({ style: 'info', body: 'All done', timeout: 2000 });
    }, 1800);
  });

  // ---------------------------------------------------------------------------
  // Quick start
  // ---------------------------------------------------------------------------
  bind('basic', function () {
    chyrp({ body: 'Hello world' });
  });

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  bind('style-info', function () {
    chyrp.info('Saved');
  });
  bind('style-warning', function () {
    chyrp.warning('Almost out of space');
  });
  bind('style-error', function () {
    chyrp.error('Upload failed');
  });
  bind('style-loading', function () {
    var h = chyrp.loading('Working…');
    setTimeout(function () {
      h.dismiss();
    }, 2200);
  });

  // ---------------------------------------------------------------------------
  // Title + body
  // ---------------------------------------------------------------------------
  bind('title-body', function () {
    chyrp({
      title: 'Saved',
      body: 'Your changes are live.',
      style: 'info',
    });
  });

  // ---------------------------------------------------------------------------
  // Position
  // ---------------------------------------------------------------------------
  bind('position', function () {
    var pos = pickRadio('position') || 'top-right';
    chyrp.info('Position: ' + pos, { position: pos });
  });

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------
  bind('timing-short', function () {
    chyrp.info('Quick — gone in 1.5s', { timeout: 1500 });
  });
  bind('timing-default', function () {
    chyrp.info('Default — gone in 4s');
  });
  bind('timing-long', function () {
    chyrp.info('Patient — gone in 8s', { timeout: 8000 });
  });
  bind('timing-persistent', function () {
    chyrp.info('Persistent — click or swipe to dismiss', { persistent: true });
  });

  // ---------------------------------------------------------------------------
  // Debounce
  // ---------------------------------------------------------------------------
  bind('debounce', function () {
    chyrp.info('Same message', { debounce: 2000 });
  });

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------
  bind('channel-network', function () {
    chyrp.info('Network event', {
      channel: 'network',
      persistent: true,
      title: 'Connection',
    });
  });
  bind('channel-user', function () {
    chyrp.info('User event', {
      channel: 'user',
      persistent: true,
      title: 'Profile',
    });
  });
  bind('channel-dismiss-network', function () {
    dismissChannel('network');
  });
  bind('channel-dismiss-user', function () {
    dismissChannel('user');
  });

  // ---------------------------------------------------------------------------
  // Custom icons
  // ---------------------------------------------------------------------------
  bind('icon-emoji', function () {
    chyrp.info('Party time', { icon: '🎉' });
  });
  bind('icon-svg', function () {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M12 2 L15 9 L22 9 L17 14 L19 22 L12 18 L5 22 L7 14 L2 9 L9 9 Z');
    svg.appendChild(path);
    chyrp.info('Starred', { icon: svg, title: 'Custom DOM icon' });
  });
  bind('icon-none', function () {
    chyrp.info('No icon at all', { icon: false });
  });

  // ---------------------------------------------------------------------------
  // Action buttons
  // ---------------------------------------------------------------------------
  bind('actions-undo', function () {
    chyrp({
      title: 'File deleted',
      body: 'document.pdf was moved to trash',
      persistent: true,
      actions: [
        {
          label: 'Undo',
          style: 'primary',
          onClick: function () {
            chyrp.info('Restored document.pdf', { sound: 'success' });
          },
        },
        { label: 'Dismiss' },
      ],
    });
  });
  bind('actions-multi', function () {
    chyrp({
      title: 'Update available',
      body: 'Version 2.0.1 is ready to install.',
      style: 'info',
      persistent: true,
      actions: [
        {
          label: 'Install',
          style: 'primary',
          onClick: function (h) {
            h.update({
              style: 'loading',
              body: 'Installing…',
              actions: [],
              timeout: 0,
            });
            setTimeout(function () {
              h.update({
                style: 'info',
                body: 'Update installed',
                timeout: 2500,
              });
            }, 1600);
            return false; // keep open while we transition
          },
        },
        {
          label: 'Remind me later',
          onClick: function () {
            chyrp.info("We'll ask again tomorrow");
          },
        },
        { label: 'Skip' },
      ],
    });
  });

  // ---------------------------------------------------------------------------
  // Promise
  // ---------------------------------------------------------------------------
  function fakeRequest(ms, value, shouldReject) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (shouldReject) reject(new Error(value));
        else resolve(value);
      }, ms);
    });
  }
  bind('promise-resolve', function () {
    chyrp.promise(fakeRequest(1500, { name: 'Ada Lovelace' }, false), {
      loading: 'Saving user…',
      success: function (user) {
        return 'Saved ' + user.name;
      },
      error: function (err) {
        return { title: 'Save failed', body: err.message };
      },
    });
  });
  bind('promise-reject', function () {
    chyrp.promise(fakeRequest(1500, 'Network unreachable', true), {
      loading: 'Saving user…',
      success: 'Saved',
      error: function (err) {
        return { title: 'Save failed', body: err.message };
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Determinate progress
  // ---------------------------------------------------------------------------
  bind('progress', function () {
    var h = chyrp.loading('Uploading', { max: 100, value: 0, persistent: true });
    var v = 0;
    var tick = function () {
      v = Math.min(100, v + (8 + Math.random() * 14));
      h.update({ value: v, body: 'Uploading… ' + Math.round(v) + '%' });
      if (v < 100) {
        setTimeout(tick, 220);
      } else {
        h.update({
          style: 'info',
          body: 'Upload complete',
          icon: undefined,
          max: undefined,
          value: 0,
          timeout: 2200,
          sound: 'success',
        });
      }
    };
    setTimeout(tick, 250);
  });

  // ---------------------------------------------------------------------------
  // Update in place
  // ---------------------------------------------------------------------------
  bind('update', function () {
    var h = chyrp.loading('Step 1/3: connecting', { persistent: true });
    setTimeout(function () {
      h.update({ body: 'Step 2/3: uploading' });
    }, 800);
    setTimeout(function () {
      h.update({ body: 'Step 3/3: verifying' });
    }, 1700);
    setTimeout(function () {
      h.update({ style: 'info', body: 'Done!', timeout: 2200, sound: 'success' });
    }, 2600);
  });

  // ---------------------------------------------------------------------------
  // Sound
  // ---------------------------------------------------------------------------
  bind('sound-gentle', function () {
    chyrp.info('Gentle chime', { sound: 'gentle' });
  });
  bind('sound-alert', function () {
    chyrp.warning('Alert chime', { sound: 'alert' });
  });
  bind('sound-success', function () {
    chyrp.info('Success chime', { sound: 'success' });
  });
  bind('sound-error', function () {
    chyrp.error('Error chime', { sound: 'error' });
  });
  bind('sound-default', function () {
    chyrp.warning('Style-aware default', { sound: true });
  });
  bind('sound-custom', function () {
    chyrp.info('Custom chime!', {
      sound: [
        { frequency: 880, startOffset: 0, duration: 0.1, amplitude: 0.2 },
        { frequency: 1108, startOffset: 0.08, duration: 0.15, amplitude: 0.18 },
        { frequency: 1318, startOffset: 0.16, duration: 0.2, amplitude: 0.15 },
      ],
    });
  });

  // ---------------------------------------------------------------------------
  // Pause-on-hover
  // ---------------------------------------------------------------------------
  bind('pause-on', function () {
    chyrp.info('Hover me — the timer pauses', {
      pauseOnHover: true,
      timeout: 5000,
    });
  });
  bind('pause-off', function () {
    chyrp.info('No pause — slipping away', {
      pauseOnHover: false,
      timeout: 5000,
    });
  });

  // ---------------------------------------------------------------------------
  // Swipe
  // ---------------------------------------------------------------------------
  bind('swipe-on', function () {
    chyrp.info('Drag me out (or click)', { persistent: true });
  });
  bind('swipe-off', function () {
    chyrp.info('Pinned in place — only click dismisses', {
      swipe: false,
      persistent: true,
    });
  });

  // ---------------------------------------------------------------------------
  // Dismiss helpers
  // ---------------------------------------------------------------------------
  bind('dismiss-spawn', function () {
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        setTimeout(function () {
          chyrp.info('Toast #' + n, { timeout: 0 });
        }, n * 100);
      })(i);
    }
  });
  bind('dismiss-all', function () {
    dismissAll();
  });

  // ---------------------------------------------------------------------------
  // Configure
  // ---------------------------------------------------------------------------
  function readConfig() {
    var get = function (k) {
      var sel = document.querySelector('[data-config="' + k + '"]');
      return sel ? sel.value : null;
    };
    return {
      position: get('position'),
      pauseOnHover: get('pauseOnHover') === 'true',
      sound: get('sound') === 'true' ? true : get('sound') === 'false' ? false : get('sound'),
    };
  }
  bind('configure-apply', function () {
    var cfg = readConfig();
    configure(cfg);
    chyrp.info('Defaults applied');
  });
  bind('configure-test', function () {
    chyrp.info('Test toast — uses current defaults');
  });
  bind('configure-reset', function () {
    document.querySelector('[data-config="position"]').value = 'top-right';
    document.querySelector('[data-config="pauseOnHover"]').value = 'true';
    document.querySelector('[data-config="sound"]').value = 'true';
    configure({
      position: 'top-right',
      pauseOnHover: true,
      sound: true,
    });
    chyrp.info('Reset to defaults');
  });

  // ---------------------------------------------------------------------------
  // alert() override
  // ---------------------------------------------------------------------------
  var restoreAlert = null;
  var alertStatus = document.querySelector('[data-alert-status]');
  bind('alert-toggle', function () {
    if (restoreAlert) {
      restoreAlert();
      restoreAlert = null;
      if (alertStatus) alertStatus.textContent = 'off';
      chyrp.info('Native alert restored');
    } else {
      restoreAlert = interceptAlert();
      if (alertStatus) alertStatus.textContent = 'on';
      chyrp.info('alert() now shows as a toast');
    }
  });
  bind('alert-trigger', function () {
    window.alert('Hello from alert()!');
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  bind('a11y', function () {
    chyrp({
      title: 'Try Tab + Enter',
      body: 'Focus this toast with Tab, then Enter or Space to dismiss.',
      persistent: true,
    });
  });

  // ---------------------------------------------------------------------------
  // TOC scroll-spy
  // ---------------------------------------------------------------------------
  var sections = Array.prototype.slice.call(document.querySelectorAll('main .docsec[id]'));
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc nav a'));
  var linkById = {};
  tocLinks.forEach(function (a) {
    var href = a.getAttribute('href');
    if (href && href.charAt(0) === '#') linkById[href.slice(1)] = a;
  });

  if ('IntersectionObserver' in window && sections.length) {
    var visible = new Set();
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        var topMost = null;
        for (var i = 0; i < sections.length; i++) {
          if (visible.has(sections[i].id)) {
            topMost = sections[i].id;
            break;
          }
        }
        if (topMost) {
          tocLinks.forEach(function (a) {
            a.classList.remove('active');
          });
          if (linkById[topMost]) linkById[topMost].classList.add('active');
        }
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: 0 },
    );
    sections.forEach(function (s) {
      observer.observe(s);
    });
  }

  // ---------------------------------------------------------------------------
  // Copy buttons
  // ---------------------------------------------------------------------------
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('pre.code');
      if (!pre) return;
      var code = pre.querySelector('code');
      var text = code ? code.textContent : '';
      var done = function () {
        var original = btn.textContent;
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = original;
        }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        // Fallback for file:// or older browsers
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch (e) {
          /* ignore */
        }
        document.body.removeChild(ta);
        done();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Back-to-top visibility
  // ---------------------------------------------------------------------------
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    var onScroll = function () {
      if (window.scrollY > 400) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

for (var i = 0; i < 3; i++) {
  console.log("Warnings in console for scripts not being found are okay, please ignore them!");
}
