/* Crypto Pro — App glue
   Mobile nav, scroll-reveal, animated counters, 3D scene auto-init.
   Defensive: never lets a single 3D failure block the rest of the page. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ---- Mobile nav toggle ----
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // ---- Scroll reveal ----
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
    els.forEach((e) => io.observe(e));
  }

  // ---- Animated counters ----
  function initCounters() {
    const els = document.querySelectorAll('.counter');
    if (!els.length) return;
    function animateCounter(el) {
      const raw = el.getAttribute('data-target') || el.textContent || '0';
      const target = parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) || 0;
      const isFloat = String(raw).includes('.');
      const duration = 1200;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = target * eased;
        el.textContent = isFloat ? v.toFixed(2) : Math.round(v).toString();
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = isFloat ? target.toFixed(2) : Math.round(target).toString();
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach(animateCounter);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach((e) => io.observe(e));
  }

  // ---- 3D fallback when three.js or WebGL isn't available ----
  function showFallback(container, label) {
    if (!container) return;
    container.classList.add('has-canvas'); // hide spinner
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;width:100%;height:100%;color:#9fb0d0;' +
      'font-family:JetBrains Mono,monospace;font-size:0.8rem;text-align:center;' +
      'padding:1rem;gap:8px;">' +
      '<div style="font-size:2rem;opacity:0.6;">◇</div>' +
      '<div>' + (label || '3D view unavailable') + '</div>' +
      '</div>';
  }

  function safeInit(container, fn, label) {
    if (!container) return;
    if (!window.CP3D || !window.THREE) {
      showFallback(container, label);
      return;
    }
    try {
      fn();
    } catch (err) {
      console.error('[CryptoPro 3D]', label, err);
      try { container.innerHTML = ''; } catch (_) {}
      showFallback(container, label);
    }
  }

  // ---- 3D scene auto-init ----
  function init3DScenes() {
    if (!window.CP3D || !window.THREE) {
      // Show fallback in every container so users see something, not just black
      document.querySelectorAll('.viz-3d').forEach((c) => {
        showFallback(c, '3D view unavailable');
      });
      return;
    }

    const hero = document.getElementById('hero-canvas');
    safeInit(hero, () => window.CP3D.initHero(hero), 'Hero scene');

    const fortress = document.getElementById('strength-fortress');
    safeInit(fortress, () => {
      window.CP3D.initStrengthFortress(fortress, window.__analyzerResult || {});
    }, 'Strength Fortress');

    const spectrum = document.getElementById('entropy-spectrum');
    safeInit(spectrum, () => {
      const freqs = (window.__analyzerResult && window.__analyzerResult.char_frequencies) || [];
      window.CP3D.initEntropySpectrum(spectrum, freqs);
    }, 'Entropy Spectrum');

    const detailFortress = document.getElementById('detail-fortress');
    safeInit(detailFortress, () => {
      window.CP3D.initStrengthFortress(detailFortress, window.__detailResult || {});
    }, 'Strength Fortress');

    const detailSpectrum = document.getElementById('detail-spectrum');
    safeInit(detailSpectrum, () => {
      const freqs = (window.__detailResult && window.__detailResult.char_frequencies) || [];
      window.CP3D.initEntropySpectrum(detailSpectrum, freqs);
    }, 'Entropy Spectrum');

    const sim = document.getElementById('algo-simulation');
    safeInit(sim, () => {
      const algo = (window.__detailResult && window.__detailResult.algorithm) || '';
      window.CP3D.initAlgorithmSimulation(sim, algo);
    }, 'Algorithm Simulation');

    const cmp = document.getElementById('compare-3d');
    safeInit(cmp, () => {
      window.CP3D.initComparator3D(cmp, window.__compareData || { names: [], datasets: [] });
    }, '3D Comparison');
  }

  ready(() => {
    initNav();
    initReveal();
    initCounters();
    // Defer 3D init by one frame so .reveal transitions don't trap us at 0-size.
    // window.load is even safer (CDN script done), so we hook both.
    if (document.readyState === 'complete') {
      requestAnimationFrame(init3DScenes);
    } else {
      window.addEventListener('load', () => requestAnimationFrame(init3DScenes), { once: true });
    }
  });
})();
