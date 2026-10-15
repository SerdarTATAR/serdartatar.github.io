/* =========================================================
   BALAT MİMARLIK — ortak etkileşimler
   ========================================================= */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  window.BM = { $, $$, reduced, finePointer };

  /* ---------- Çizim modu ---------- */
  const modeBtn = $('#modeToggle');
  function setMode(m){
    root.dataset.mode = m;
    if(modeBtn) modeBtn.setAttribute('aria-pressed', m === 'blueprint');
    try{ localStorage.setItem('bm-mode', m); }catch(e){}
  }
  try{ if(localStorage.getItem('bm-mode') === 'blueprint') setMode('blueprint'); }catch(e){}
  if(modeBtn) modeBtn.addEventListener('click', () => {
    const next = root.dataset.mode === 'blueprint' ? 'light' : 'blueprint';
    if(document.startViewTransition && !reduced) document.startViewTransition(() => setMode(next));
    else setMode(next);
  });

  /* ---------- Mobil menü ---------- */
  const burger = $('#burger'), mm = $('#mobileMenu');
  function menu(open){
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('locked', open);
    if(burger){ burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç'); }
    if(mm) mm.setAttribute('aria-hidden', !open);
  }
  if(burger) burger.addEventListener('click', () => menu(!document.body.classList.contains('menu-open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => menu(false)));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('menu-open')) menu(false); });

  /* ---------- Header: kaydırınca gizle / göster ---------- */
  const header = $('#header');
  let lastY = 0;
  const scrollFns = [];
  window.BM.onScroll = fn => scrollFns.push(fn);
  function onScroll(){
    const y = scrollY;
    if(header){
      header.classList.toggle('scrolled', y > 40);
      header.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    }
    lastY = y;
    scrollFns.forEach(fn => fn(y));
  }
  let ticking = false;
  addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive:true });
  window.BM.refresh = onScroll;

  /* ---------- Reveal + sayaçlar ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(!e.isIntersecting) return;
    e.target.classList.add('in');
    const b = e.target.querySelector('[data-count]');
    if(b){
      const to = +b.dataset.count, dec = +(b.dataset.dec || 0), suffix = b.dataset.suffix || '', t0 = performance.now();
      const run = t => {
        const p = Math.min((t - t0) / 1600, 1), v = to * (1 - Math.pow(1 - p, 4));
        b.textContent = v.toFixed(dec).replace('.', ',') + (p === 1 ? suffix : '');
        if(p < 1) requestAnimationFrame(run);
      };
      reduced ? (b.textContent = String(to).replace('.', ',') + suffix) : requestAnimationFrame(run);
    }
    io.unobserve(e.target);
  }), { threshold:.15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Makale: okuma çubuğu + içindekiler ---------- */
  const body = $('.article-body'), bar = $('#progress');
  if(body && bar){
    const toc = $$('.article-aside a[href^="#"]');
    const targets = toc.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    window.BM.onScroll(() => {
      const r = body.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6)));
      bar.style.width = (p * 100) + '%';
      let cur = -1;
      targets.forEach((t, i) => { if(t.getBoundingClientRect().top < innerHeight * .35) cur = i; });
      toc.forEach((a, i) => a.classList.toggle('on', i === cur));
    });
  }

  /* ---------- İmleç + manyetik butonlar ---------- */
  if(finePointer){
    const cursor = $('#cursor'), ctext = cursor && cursor.querySelector('span');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, moved = false;
    window.BM.mouse = { x:mx, y:my };
    addEventListener('mousemove', e => { if(cursor && !moved){ moved = true; cursor.classList.remove('hide'); cx = e.clientX; cy = e.clientY; } mx = e.clientX; my = e.clientY; window.BM.mouse.x = mx; window.BM.mouse.y = my; });
    if(cursor){
      (function loop(){
        cx += (mx - cx) * .22; cy += (my - cy) * .22;
        cursor.style.transform = `translate(${cx}px,${cy}px)`;
        requestAnimationFrame(loop);
      })();
      document.addEventListener('mouseover', e => {
        const t = e.target.closest('[data-cursor]');
        cursor.classList.toggle('big', !!t);
        if(t && ctext) ctext.textContent = t.dataset.cursor;
        if(moved) cursor.classList.toggle('hide', !t && !!e.target.closest('.svc,iframe,.compare,input,textarea'));
      });
      document.addEventListener('mouseleave', () => cursor.classList.add('hide'));
      document.addEventListener('mouseenter', () => { if(moved) cursor.classList.remove('hide'); });
    }
    $$('.btn').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
  }

  /* ---------- Hazır ---------- */
  // Ana sayfadaki yükleme ekranı kendi "ready" sınıfını ekler; diğer sayfalarda hemen eklenir.
  if(!$('#loader')) requestAnimationFrame(() => document.body.classList.add('ready'));
  addEventListener('load', onScroll);
  onScroll();
})();
