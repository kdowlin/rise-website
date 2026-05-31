// RISE — interaction primitives
// Scroll-progress ribbon, magnetic links, kinetic word reveal.
// Each primitive is feature-detected and reduced-motion-safe.

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;

  // -----------------------------------------------------------------------
  // Scroll progress ribbon — 2px Ledger Blue at top, with chapter ticks
  // -----------------------------------------------------------------------
  const ribbon = document.createElement('div');
  ribbon.className = 'rise-ribbon';
  ribbon.innerHTML = '<span class="rise-ribbon__fill"></span><span class="rise-ribbon__ticks"></span>';
  document.body.appendChild(ribbon);

  const ticksEl = ribbon.querySelector('.rise-ribbon__ticks');
  const fillEl = ribbon.querySelector('.rise-ribbon__fill');

  const updateTicks = () => {
    const sections = [...document.querySelectorAll('[data-chapter]')];
    if (!sections.length) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    ticksEl.innerHTML = '';
    sections.forEach((s) => {
      const pct = Math.max(0, Math.min(1, s.offsetTop / docHeight));
      const t = document.createElement('span');
      t.className = 'rise-ribbon__tick';
      t.style.left = (pct * 100) + '%';
      ticksEl.appendChild(t);
    });
  };

  let ribbonRaf = 0;
  const onScroll = () => {
    if (ribbonRaf) return;
    ribbonRaf = requestAnimationFrame(() => {
      ribbonRaf = 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
      fillEl.style.transform = `scaleX(${pct})`;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateTicks, { passive: true });
  window.addEventListener('load', () => { updateTicks(); onScroll(); });
  // Initial pass after DOM ready
  setTimeout(updateTicks, 100);

  // -----------------------------------------------------------------------
  // Magnetic link — subtle pull toward the cursor on hover
  // -----------------------------------------------------------------------
  if (!reduce && !isTouch) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.28;
      const rect = () => el.getBoundingClientRect();
      el.addEventListener('pointermove', (e) => {
        const r = rect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  // -----------------------------------------------------------------------
  // Word-by-word kinetic reveal
  //   <h1 data-kinetic>Some text</h1>
  // splits into spans, animates them in sequence on enter.
  // -----------------------------------------------------------------------
  const splitKinetic = (el) => {
    if (el.dataset.kineticReady) return;
    el.dataset.kineticReady = '1';
    const walk = (node) => {
      const children = [...node.childNodes];
      children.forEach((c) => {
        if (c.nodeType === Node.TEXT_NODE) {
          const text = c.textContent;
          const frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach((part) => {
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else if (part.length) {
              const span = document.createElement('span');
              span.className = 'k-word';
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === Node.ELEMENT_NODE) {
          walk(c);
        }
      });
    };
    walk(el);
  };

  document.querySelectorAll('[data-kinetic]').forEach(splitKinetic);

  // Animate kinetic elements when they enter
  const kIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const words = el.querySelectorAll('.k-word');
        const baseDelay = parseFloat(el.dataset.kineticDelay) || 0;
        const step = parseFloat(el.dataset.kineticStep) || 60;
        words.forEach((w, i) => {
          w.style.transitionDelay = (baseDelay + i * step) + 'ms';
          w.classList.add('is-in');
        });
        kIO.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('[data-kinetic]').forEach((el) => kIO.observe(el));

  // Reduced motion: instantly reveal
  if (reduce) {
    document.querySelectorAll('.k-word').forEach((w) => w.classList.add('is-in'));
  }
})();
