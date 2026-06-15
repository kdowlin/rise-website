// RISE — shared site behavior
(function(){
  // Keep --nav-h in sync with the actual nav height so sticky bars align at all breakpoints.
  const navEl = document.querySelector('.nav');
  const setNavH = () => {
    if (navEl) document.documentElement.style.setProperty('--nav-h', Math.round(navEl.getBoundingClientRect().height) + 'px');
  };
  setNavH();
  window.addEventListener('resize', setNavH, { passive: true });
  window.addEventListener('load', setNavH);

  // Nav transparency over full-bleed hero: when the cover scrolls off-screen,
  // swap to solid nav.
  const cover = document.querySelector('.cover');
  const nav = document.getElementById('site-nav');
  if (cover && nav && nav.classList.contains('nav--on-image')) {
    const obs = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('nav--on-image', entry.isIntersecting);
    }, { rootMargin: '-65px 0px 0px 0px', threshold: 0 });
    obs.observe(cover);
  }

  // Mobile nav toggle
  document.querySelectorAll('[data-nav-toggle]').forEach(btn => {
    const nav = btn.closest('.nav');
    if (!nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close on link click
    nav.querySelectorAll('.nav__sheet a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  });

  // Stat count-up. Has a setTimeout fallback in case IntersectionObserver never fires.
  document.querySelectorAll('[data-countup]').forEach(el => {
    const target = parseFloat(el.dataset.countup);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const dur = 1400;
    let fired = false;

    const run = () => {
      if (fired) return;
      fired = true;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = target * eased;
        el.textContent = prefix + (target % 1 === 0 ? Math.round(v).toLocaleString() : v.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { run(); obs.disconnect(); }
      }, { threshold: 0.4 });
      obs.observe(el);
    }
    // Fallback — if IO never fires (some iframe contexts), just run after 1.2s.
    setTimeout(run, 1200);
  });
})();
