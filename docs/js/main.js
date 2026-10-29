(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header: glass on scroll, hide on scroll down ---- */
  const nav = $('#nav');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 30);
    nav.classList.toggle('hide', y > lastY && y > 300);
    lastY = y;
  }, { passive: true });

  /* ---- active link ---- */
  const links = $$('.nav-links a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const t = $(l.getAttribute('href')); if (t) spy.observe(t); });

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---- count-up numbers ---- */
  const fmt = (n, f) => f === 'comma' ? n.toLocaleString('en-US') : String(n);
  function countUp(el, dur = 1600, delay = 0) {
    const to = +el.dataset.count, f = el.dataset.fmt;
    if (reduce) return;
    const t0 = performance.now() + delay;
    const tick = now => {
      const p = Math.min(1, Math.max(0, (now - t0) / dur));
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4))), f);
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt(0, f);
    requestAnimationFrame(tick);
  }
  $$('.stats [data-count]').forEach(el => countUp(el, 1800, 900));
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { countUp(e.target, 1300); cio.unobserve(e.target); }
  }), { threshold: .6 });
  $$('.plan [data-count]').forEach(el => cio.observe(el));

  /* ---- parallax (hero + commissions) ---- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const hero = $('#hero'), scene = $('#scene');
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      scene.style.transform = `translate(${x * -24}px,${y * -16}px)`;
      $$('.orb', scene).forEach(o => {
        const d = +o.dataset.depth || 10;
        o.style.transform = `translate(${x * d * 2}px,${y * d * 2}px)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      scene.style.transform = '';
      $$('.orb', scene).forEach(o => o.style.transform = '');
    });
    const com = $('#commissions'), cs = $('#comScene');
    com.addEventListener('mousemove', e => {
      const r = com.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      cs.style.transform = `translate(${x * -26}px,${y * -18}px)`;
    });
  }
  const cue=$('.scroll-cue');
  addEventListener('scroll',()=>{cue.classList.toggle('gone',scrollY>80)},{passive:true});
  // scroll parallax on hero art
  const art = $('#heroArt');
  if (!reduce) addEventListener('scroll', () => {
    const y = Math.min(scrollY, innerHeight);
    art.style.transform = `translateY(${y * .12}px)`;
  }, { passive: true });

  /* ---- commissions form ---- */
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
    c.classList.add('on'); c.setAttribute('aria-checked', 'true');
  }));
  const form = $('#comForm'), lbl = $('#sendLbl');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) return;
    lbl.textContent = 'Request sent — thank you';
    form.querySelector('button[type=submit]').disabled = true;
  });
  $$('input', form).forEach(i => i.addEventListener('input', () => i.classList.remove('err')));

  /* ---- booking buttons ---- */
  $$('.dates .btn-navy').forEach(b => b.addEventListener('click', () => {
    b.textContent = 'Booked ✓'; b.style.opacity = .7;
  }));
})();
