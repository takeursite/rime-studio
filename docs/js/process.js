(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const section = $('#process');
  if (!section) return;

  /* ---------- content ---------- */
  const STEPS = [
    { n: '01', title: 'Clay', next: '02 Form',
      desc: 'Cold, wet porcelain clay, wedged by hand until it is quiet and even.',
      specs: [['Wedging', '20 min'], ['Weight', '2.4 kg'], ['Body', 'Limoges porcelain'], ['Clay temperature', '12 °C']],
      quote: '“Porcelain remembers every touch — so we start by making it forget.”',
      ann: [[1127, 564, 1357, 'Hand-wedged · no air pockets'], [1447, 706, 1580, 'Steel wheel head · 240 rpm']] },
    { n: '02', title: 'Form', next: '03 Fire',
      desc: 'Thrown on the wheel in one pull, trimmed, then dried slowly under linen.',
      specs: [['Height', '34 cm'], ['Wall', '3 mm'], ['Wheel', '240 rpm'], ['Drying', '7 days']],
      quote: '“The wheel sets the speed. The hands set the silence.”',
      ann: [[1098, 202, 1338, 'Flared lip · 2 mm'], [1165, 487, 1298, 'Throwing rings · kept, never sanded']] },
    { n: '03', title: 'Fire', next: '04 Glaze',
      desc: 'The first firing. The clay turns pale, hard and porous — ready to take the glaze.',
      specs: [['Bisque firing', '980 °C'], ['Kiln', '8 hours'], ['Shrinkage', '12 %'], ['Cooling', '24 hours']],
      quote: '“The kiln has the last word. We only open the door.”',
      ann: [[1158, 435, 1290, 'Bisque · pale, hard, porous'], [1091, 680, 1331, 'Shrinks 12 % in the kiln']] },
    { n: '04', title: 'Glaze', next: null,
      desc: 'Dipped by hand in ice pearl glaze and fired again at 1,280 °C. The glaze turns to glass.',
      specs: [['Coats', '3 dips'], ['Glaze', 'Ice pearl no. 4'], ['Glaze firing', '1,280 °C'], ['Edition', '1 of 12']],
      quote: '“Glaze is the only colour we allow — and it is mostly light.”',
      ann: [[1098, 213, 1338, 'Silver rim · hand-polished'], [1155, 444, 1287, 'Ice pearl glaze · fired to glass']] }
  ];
  const DAYS = [1, 3, 12, 21];
  const SEG = [
    { prefix: 'c', n: 123 },   // clay  -> form
    { prefix: 'a', n: 61 },    // form  -> fire
    { prefix: 'b', n: 61 }     // fire  -> glaze
  ];
  const pad = n => String(n).padStart(3, '0');

  /* ---------- elements ---------- */
  const canvas = $('#wheelCanvas'), ctx = canvas.getContext('2d');
  const anns = $('#anns'), pLeft = $('#pLeft');
  const el = {
    num: $('#pNum'), title: $('#pTitle'), desc: $('#pDesc'), specs: $('#pSpecs'), quote: $('#pQuote'),
    fill: $('#barFill'), nxA: $('#nxA'), barR: $('#barR')
  };
  const reel = id => $('#' + id + ' .reel-in');
  const tensR = reel('reelTens'), onesR = reel('reelOnes'), stepR = reel('reelStep');

  /* ---------- frame preload ---------- */
  const frames = SEG.map(() => []);
  function load(seg, i) {
    const im = new Image();
    im.decoding = 'async';
    im.src = `frames/${SEG[seg].prefix}_${pad(i)}.jpg`;
    im.onload = () => { frames[seg][i] = im; if (seg === 0 && i === 0) dirty = true; };
  }
  // first & last of every segment first, then the rest in scroll order
  SEG.forEach((s, k) => { load(k, 0); load(k, s.n - 1); });
  SEG.forEach((s, k) => { for (let i = 1; i < s.n - 1; i++) load(k, i); });

  function frameFor(seg, idx) {
    for (let i = idx; i >= 0; i--) if (frames[seg][i]) return frames[seg][i];
    for (let i = idx; i < SEG[seg].n; i++) if (frames[seg][i]) return frames[seg][i];
    return null;
  }

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- annotations ---------- */
  let annEls = [];
  function buildAnns(step) {
    anns.innerHTML = '';
    annEls = STEPS[step].ann.map(([x, y, tx, label]) => {
      const d = document.createElement('div');
      d.className = 'ann';
      d.style.left = x / 20 + '%';
      d.style.top = y / 11.25 + '%';
      d.innerHTML = `<i class="pt"></i><i class="ln" style="width:calc(var(--u)*${tx - x})"></i><span class="lb">${label}</span>`;
      // keep dot centred on its coordinate: shift so the dot (not the whole row) is the anchor
      d.style.transform = 'translate(calc(var(--u)*-8),-50%)';
      anns.appendChild(d);
      return d;
    });
  }

  /* ---------- left column ---------- */
  let curStep = -1;
  function animateValue(node, text, delay) {
    const m = text.match(/^(\d[\d,]*)(.*)$/);
    if (!m || reduceMotion) { node.textContent = text; return; }
    const to = parseInt(m[1].replace(/,/g, ''), 10), comma = m[1].includes(','), rest = m[2];
    const t0 = performance.now() + delay;
    const tick = now => {
      const p = clamp((now - t0) / 800);
      const v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      node.textContent = (comma ? v.toLocaleString('en-US') : v) + rest;
      if (p < 1) requestAnimationFrame(tick);
    };
    node.textContent = (comma ? '0' : '0') + rest;
    requestAnimationFrame(tick);
  }
  function renderStep(i) {
    const s = STEPS[i];
    el.num.textContent = s.n;
    el.title.textContent = s.title;
    el.desc.textContent = s.desc;
    el.quote.textContent = s.quote;
    el.specs.innerHTML = s.specs.map(([k, v], j) => `<div class="spec" style="--i:${j}"><span>${k}</span><b>${v}</b></div>`).join('');
    [...el.specs.children].forEach((row, j) => animateValue(row.lastChild, s.specs[j][1], 250 + j * 90));
    // stagger the simple text blocks
    [el.num, el.title, el.desc, el.quote, $('.p-by')].forEach((n, j) => n.style.setProperty('--i', j));
    pLeft.classList.remove('swap'); void pLeft.offsetWidth; pLeft.classList.add('swap');
    renderNext(i);
    buildAnns(i);
  }
  function renderNext(i) {
    const html = STEPS[i].next
      ? `<span class="g">Next</span><span>${STEPS[i].next}</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 1v13M3 9l5 5 5-5"/></svg>`
      : `<span class="g">Glacier, no. 07</span><a href="#workshops">Own this piece · € 490</a><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1 8h13M9 3l5 5-5 5"/></svg>`;
    const make = () => {
      el.barR.querySelectorAll('.nx').forEach(n => n.remove());
      const w = document.createElement('span');
      w.className = 'nx nx-in' + (STEPS[i].next ? '' : ' go');
      w.innerHTML = html;
      el.barR.appendChild(w);
    };
    clearTimeout(nextTimer);
    const cur = el.barR.querySelectorAll('.nx');
    if (cur.length) {
      cur.forEach(n => { n.classList.remove('nx-in'); n.classList.add('nx-out'); });
      nextTimer = setTimeout(make, 280);
    } else make();
  }
  let nextTimer = 0;
  // first paint of the "next" label (remove placeholder)
  el.nxA.remove();

  /* ---------- scroll model ---------- */
  let target = 0, smooth = 0, dirty = true, visible = false;
  function readScroll() {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    const p = clamp(-r.top / total);
    target = p * 3;
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '200px' }).observe(section);

  // pos = continuous 0..3 mapped so that steps "hold" and transition between
  function model(s) {
    const seg = Math.min(Math.floor(s), 2);
    const f = s >= 3 ? 1 : s - seg;
    const t = ease(clamp((f - .14) / .72));
    return { seg, t, pos: seg + t };
  }

  function draw(seg, t) {
    ctx.imageSmoothingQuality = 'high';
    const idx = Math.round(t * (SEG[seg].n - 1));
    const im = frameFor(seg, idx);
    if (im) ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
  }

  function setReels(day, pos) {
    const tens = Math.floor(day / 10) + clamp((day % 10) - 9, 0, 1);
    const ones = day % 10;
    tensR.style.transform = `translateY(${-tens}em)`;
    onesR.style.transform = `translateY(${-ones}em)`;
    stepR.style.transform = `translateY(${-pos}em)`;
  }

  let lastDrawKey = '', ticking = false;
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(loop); } }
  function loop() {
    ticking = false;
    smooth += (target - smooth) * (reduceMotion ? 1 : .14);
    if (Math.abs(target - smooth) < .0004) smooth = target;
    const { seg, t, pos } = model(smooth);

    const step = Math.round(smooth <= 0 ? 0 : model(smooth).pos);
    if (step !== curStep) { curStep = step; renderStep(step); }

    // annotations only while the object is at rest
    const rest = Math.abs(pos - step) < .07;
    annEls.forEach(a => a.classList.toggle('show', rest));

    // frames
    const key = seg + ':' + Math.round(t * 200) + ':' + frames.flat().length;
    if (key !== lastDrawKey || dirty) { draw(seg, t); lastDrawKey = key; dirty = false; }

    // days: eased between keyframes
    const day = DAYS[seg] + (DAYS[Math.min(seg + 1, 3)] - DAYS[seg]) * t;
    setReels(day, pos);

    // bottom bar
    el.fill.style.width = (25 + 75 * (pos / 3)) + '%';

    if (visible && (smooth !== target || dirty)) kick();
  }
  addEventListener('scroll', () => { if (visible) kick(); }, { passive: true });

  readScroll(); smooth = target;
  kick();
  // redraw once more when late frames arrive
  const poll = setInterval(() => { dirty = true; kick(); if (frames.flat().length >= 245) clearInterval(poll); }, 600);
})();
