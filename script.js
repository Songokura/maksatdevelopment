(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var VER = (function () { var m = /[?&]v=([\w-]+)/.exec((doc.currentScript || {}).src || ''); return m ? m[1] : '1'; })();
  var WA = 'https://wa.me/77777118080';
  var NB = ' ';

  /* ---------- язык ---------- */
  var RU = {
    'apt.n82': '2-комнатная квартира 82' + NB + 'м²',
    'apt.n101': '2-комнатная квартира 101' + NB + 'м²',
    'apt.n3': '3-комнатная квартира 145-149' + NB + 'м²',
    'apt.n4': '4-комнатная квартира 175-179' + NB + 'м²',
    'apt.m2': 'м²', 'apt.cur': 'тг', 'apt.range': 'от {a} до {b}' + NB + '{cur}',
    'apt.pay1': '100% оплата или стандартная ипотека', 'apt.pay2': 'рассрочка от застройщика',
    'wa.general': 'Здравствуйте! Интересует квартира в Bereke Park. Подскажите, пожалуйста, какие квартиры сейчас в продаже.',
    'wa.card': 'Здравствуйте! Интересует квартира в Bereke Park:\n{name}\nОплата: {pay}\nПодскажите, пожалуйста, наличие и этаж.',
    'wa.incl': 'Здравствуйте! Уточните, пожалуйста, условия по кладовой и парковочному месту в Bereke Park.',
    'wa.visit': 'Здравствуйте! Хочу приехать в офис продаж Bereke Park. Когда удобно?',
    'wa.form': 'Здравствуйте! Заявка с сайта Bereke Park. Имя: {name}. Телефон: {phone}. Комнат: {rooms}. Оплата: {pay}.'
  };
  var lang = 'ru', dict = null, orig = new Map();
  var nodes = $$('[data-i18n]');
  nodes.forEach(function (n) { orig.set(n, n.innerHTML); RU[n.getAttribute('data-i18n')] = n.innerHTML; });
  function t(k) { return (lang !== 'ru' && dict && dict[k] != null) ? dict[k] : (RU[k] != null ? RU[k] : k); }
  function plain(s) { var d = doc.createElement('div'); d.innerHTML = s; return d.textContent; }
  function applyLang() {
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      var v = (lang !== 'ru' && dict && dict[k] != null) ? dict[k] : orig.get(n);
      if (n.tagName === 'TITLE') doc.title = plain(v); else n.innerHTML = v;
    });
    root.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    renderPicker(false);
    requestAnimationFrame(function () { movePills(); fitScene(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  }
  function setLang(l, save) {
    if (save) { try { localStorage.setItem('bp-lang', l); } catch (e) {} }
    if (l === 'ru') { lang = 'ru'; dict = null; applyLang(); return; }
    var name = l === 'kk' ? 'SITE_KK' : 'SITE_EN';
    if (window[name]) { lang = l; dict = window[name]; applyLang(); return; }
    var s = doc.createElement('script');
    s.src = 'assets/lang/' + l + '.js?v=' + VER;
    s.onload = function () { lang = l; dict = window[name] || {}; applyLang(); };
    s.onerror = function () { lang = 'ru'; dict = null; applyLang(); };
    doc.head.appendChild(s);
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang, true); }); });

  /* ---------- WhatsApp: текст собирается в момент клика ---------- */
  function waUrl(text) { return WA + '?text=' + encodeURIComponent(text); }
  function payName() { return plain(t(state.pay === 1 ? 'apt.pay1' : 'apt.pay2')); }
  function waText(kind) {
    if (kind === 'card') return plain(t('wa.card')).replace('{name}', plain(t(cur().name))).replace('{pay}', payName());
    return plain(t('wa.' + kind));
  }
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-wa]');
    if (a) a.href = waUrl(waText(a.dataset.wa));
  }, true);

  /* ---------- подбор квартиры ---------- */
  var APTS = [
    { id: '82', rooms: 2, name: 'apt.n82', area: '82', a: [82], plans: [] },
    { id: '101', rooms: 2, name: 'apt.n101', area: '101', a: [101], plans: [] },
    { id: '3', rooms: 3, name: 'apt.n3', area: '145-149', a: [145, 149], plans: ['plan-1', 'plan-11'] },
    { id: '4', rooms: 4, name: 'apt.n4', area: '175-179', a: [175, 179], plans: ['plan-2', 'plan-22'] }
  ];
  var RATE = { 1: 405000, 2: 415000 };
  var state = { rooms: 3, id: '3', pay: 1, plan: 0 };
  var shown = [58725000, 60345000];
  function cur() { return APTS.filter(function (x) { return x.id === state.id; })[0]; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function sumText(v) {
    var c = plain(t('apt.cur'));
    if (v.length === 1 || v[0] === v[1]) return fmt(v[0]) + NB + c;
    return plain(t('apt.range')).replace('{a}', fmt(v[0])).replace('{b}', fmt(v[1])).replace('{cur}', c);
  }
  var elName = $('#pk-name'), elArea = $('#pk-area'), elRate = $('#pk-rate'), elSum = $('#pk-sum'),
      elPlan = $('#pk-plan'), elView = $('.sheet-view'), elStub = $('.sheet-stub'), elVars = $('.sheet-vars'), elAreas = $('.pk-areas');
  function renderPicker(anim) {
    var a = cur(), rate = RATE[state.pay];
    var target = a.a.map(function (x) { return x * rate; });
    if (target.length === 1) target = [target[0], target[0]];
    elName.textContent = plain(t(a.name)).replace(/(\d)-(\d)/, '$1\u2011$2');
    elArea.textContent = a.area + NB + plain(t('apt.m2'));
    elRate.textContent = fmt(rate) + NB + plain(t('apt.cur'));
    var single = a.a.length === 1;
    if (anim && window.gsap && !reduce) {
      var o = { x: shown[0], y: shown[1] };
      gsap.to(o, { x: target[0], y: target[1], duration: .8, ease: 'power3.out', overwrite: true, onUpdate: function () {
        elSum.textContent = sumText(single ? [o.x] : [o.x, o.y]);
      }, onComplete: function () { elSum.textContent = sumText(single ? [target[0]] : target); } });
      gsap.fromTo([elName, '.pk-rows'], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .06, ease: 'power3.out', overwrite: true });
    } else elSum.textContent = sumText(single ? [target[0]] : target);
    shown = target;
    // площади
    var same = APTS.filter(function (x) { return x.rooms === state.rooms; });
    elAreas.innerHTML = '';
    if (same.length > 1) same.forEach(function (x) {
      var b = doc.createElement('button'); b.type = 'button'; b.textContent = x.area + NB + plain(t('apt.m2'));
      b.setAttribute('aria-pressed', String(x.id === state.id));
      b.addEventListener('click', function () { state.id = x.id; state.plan = 0; renderPicker(true); });
      elAreas.appendChild(b);
    });
    // планировка
    var has = a.plans.length > 0;
    elView.hidden = !has; elStub.hidden = has; $('.pk-open').hidden = !has;
    elVars.innerHTML = '';
    if (has) {
      var src = 'assets/plans/' + a.plans[state.plan] + '.webp';
      if (elPlan.getAttribute('src') !== src) {
        elPlan.setAttribute('src', src);
        if (anim && window.gsap && !reduce) gsap.fromTo(elPlan, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' });
      }
      elPlan.alt = plain(t(a.name));
      a.plans.forEach(function (p, i) {
        var b = doc.createElement('button'); b.type = 'button'; b.textContent = String(i + 1);
        b.setAttribute('aria-pressed', String(i === state.plan));
        b.addEventListener('click', function () { state.plan = i; renderPicker(true); });
        elVars.appendChild(b);
      });
    } else if (anim && window.gsap && !reduce) gsap.fromTo(elStub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5 });
  }
  function movePills() {
    $$('.seg').forEach(function (seg) {
      var on = $('button[aria-pressed="true"]', seg), pill = $('.seg-pill', seg);
      if (!on || !pill) return;
      pill.style.width = on.offsetWidth + 'px'; pill.style.height = on.offsetHeight + 'px';
      pill.style.top = on.offsetTop + 'px'; pill.style.bottom = 'auto';
      pill.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    });
  }
  function press(group, btn) { $$('button', group).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); }); movePills(); }
  $$('.seg-rooms button').forEach(function (b) { b.addEventListener('click', function () {
    state.rooms = +b.dataset.rooms; state.id = APTS.filter(function (x) { return x.rooms === state.rooms; })[0].id; state.plan = 0;
    press(b.parentNode, b); renderPicker(true);
    var r = $('#lead-form input[name="rooms"][value="' + state.rooms + '"]'); if (r) r.checked = true;
  }); });
  $$('.seg-pay button').forEach(function (b) { b.addEventListener('click', function () { state.pay = +b.dataset.pay; press(b.parentNode, b); renderPicker(true); }); });
  window.addEventListener('resize', movePills);

  var lbx = $('#lbx');
  function openPlan() { if (!lbx.showModal) return; $('img', lbx).src = elPlan.getAttribute('src'); $('img', lbx).alt = elPlan.alt; lbx.showModal(); }
  elView.addEventListener('click', openPlan); $('.pk-open').addEventListener('click', openPlan);
  lbx.addEventListener('click', function (e) { if (e.target === lbx || e.target.closest('.lbx-x')) lbx.close(); });

  /* ---------- форма ---------- */
  var form = $('#lead-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, name = f.name.value.trim(), phone = f.phone.value.trim();
    var okP = phone.replace(/\D/g, '').length >= 10;
    f.phone.closest('.fld').classList.toggle('err', !okP);
    f.name.closest('.fld').classList.toggle('err', !name);
    f.phone.setAttribute('aria-invalid', String(!okP)); f.name.setAttribute('aria-invalid', String(!name));
    if (!okP) { f.phone.focus(); return; }
    if (!name) { f.name.focus(); return; }
    var txt = plain(t('wa.form')).replace('{name}', name).replace('{phone}', phone).replace('{rooms}', f.rooms.value).replace('{pay}', plain(t(form.querySelector('input[name=pay]:checked').dataset.k)));
    $('.form-ok', form).hidden = false;
    window.open(waUrl(txt), '_blank', 'noopener');
  });

  /* ---------- меню ---------- */
  var mnav = $('#mnav'), burger = $('.burger');
  function menu(open) { mnav.hidden = !open; doc.body.classList.toggle('menu-open', open); burger.setAttribute('aria-expanded', String(open)); if (lenis) { open ? lenis.stop() : lenis.start(); } }
  burger.addEventListener('click', function () { menu(mnav.hidden); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { menu(false); burger.focus(); } });
  window.matchMedia('(min-width: 1361px)').addEventListener('change', function (m) { if (m.matches && !mnav.hidden) menu(false); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  var hdr = $('#hdr');
  function onScrollHdr() { var st = $('.stage'); hdr.classList.toggle('solid', window.scrollY > st.offsetTop + st.offsetHeight - 80 || window.innerWidth <= 820); }

  /* ---------- мобильная сцена: высота по низу текста ---------- */
  var mqMob = window.matchMedia('(max-width: 820px)'), sceneEl = $('.scene');
  function fitScene() {
    var st = $('.stage');
    if (!sceneEl || !st) return;
    if (!mqMob.matches) { st.style.removeProperty('--sch-h'); st.style.removeProperty('--sch-p'); return; }
    var H = window.innerHeight, mb = $('.mbar') ? $('.mbar').offsetHeight : 0, hc = $('.hero-copy'), pc = $('.place-copy');
    var extra = 0;
    $$('.state-body p', pc).forEach(function (p) { extra = Math.max(extra, p.scrollHeight + 8); });
    var fit = function (top) { return Math.max(110, Math.min(H - mb - top, Math.round(H * .5))) + 'px'; };
    st.style.setProperty('--sch-h', fit(hc.offsetTop + hc.offsetHeight + 14));
    st.style.setProperty('--sch-p', fit(pc.offsetTop + pc.offsetHeight + extra + 52));
  }
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; fitScene(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitScene);
  fitScene();

  /* ---------- сравнение день / вечер ---------- */
  $$('.cmp').forEach(function (c) { var inp = $('input', c); inp.addEventListener('input', function () { c.style.setProperty('--x', inp.value + '%'); }); });

  /* ---------- лента ---------- */
  $$('.reel-wrap').forEach(function (w) {
    var reel = $('.reel', w), prev = $('.prev', w), next = $('.next', w);
    function step(d) { var it = $('.reel-i', reel); reel.scrollBy({ left: d * (it.offsetWidth + 20), behavior: 'smooth' }); }
    function upd() { prev.disabled = reel.scrollLeft < 4; next.disabled = reel.scrollLeft + reel.clientWidth > reel.scrollWidth - 4; }
    prev.addEventListener('click', function () { step(-1); }); next.addEventListener('click', function () { step(1); });
    reel.addEventListener('scroll', upd, { passive: true }); window.addEventListener('load', upd); upd();
  });

  /* ---------- «в стоимость»: подсветка чертежа ---------- */
  var draw = $('.incl-draw'), items = $$('.incl-list li');
  function part(p) { draw.dataset.part = p; items.forEach(function (li) { li.classList.toggle('on', li.dataset.part === p); }); }
  items.forEach(function (li) { li.addEventListener('mouseenter', function () { part(li.dataset.part); stopCycle(); }); li.addEventListener('click', function () { part(li.dataset.part); stopCycle(); }); });
  var cyc = null, ci = 0;
  function startCycle() { if (cyc || reduce) return; cyc = setInterval(function () { ci = (ci + 1) % items.length; part(items[ci].dataset.part); }, 2600); }
  function stopCycle() { clearInterval(cyc); cyc = null; }

  /* ---------- плавность и сцены ---------- */
  var lenis = null;
  function boot() {
    var hasG = !!window.gsap;
    if (hasG) gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !reduce && hasG) {
      lenis = new Lenis({ duration: 1.1, anchors: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (tm) { lenis.raf(tm * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    // якоря
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var el = doc.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
      e.preventDefault();
      var y = el.getBoundingClientRect().top + window.scrollY - (el.classList.contains('anchor') || el.id === 'top' ? 0 : 70);
      if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
    window.addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();
    movePills();
    if (!hasG) { root.classList.remove('js'); return; }
    stage(); reveals();
  }

  function stage() {
    var st = $('.stage'), disp = $('#rip-d'), turb = $('#rip-t'), refl = $('.sc-reflect');
    var hero = $('.hero-copy'), place = $('.place-copy'), ctl = $$('.scene-ctl button'), bar = $('.ctl-line b');
    var rip = { s: 26 }, lastS = -1;
    function setRip() { var v = Math.round(rip.s); if (v === lastS) return; lastS = v; disp.setAttribute('scale', v); refl.style.filter = v < 1 ? 'none' : 'url(#rip)'; }
    var line = $('.rl-line');
    gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set('.rl-flood', { scaleY: 0 });
    gsap.set(['.rl-houses', '.rl-dim', '.rl-t'], { opacity: 0 });
    var E = 'power2.inOut';
    var tl = gsap.timeline({ defaults: { ease: E }, scrollTrigger: { trigger: st, start: 'top top', end: 'bottom bottom', scrub: .7, onUpdate: function (self) {
      var p = self.progress, s = p < .17 ? 'hero' : p < .47 ? 'lake' : p < .77 ? 'wind' : 'flood';
      if (st.dataset.state !== s) { st.dataset.state = s; ctl.forEach(function (b) { b.classList.toggle('on', b.dataset.go === s); b.setAttribute('aria-pressed', String(b.dataset.go === s)); }); }
      bar.style.setProperty('--p', p.toFixed(3));
    } } });
    // 0 - .12 герой живёт; .12 - .28 рябь стихает до зеркала
    tl.to(hero, { autoAlpha: 0, y: -40, duration: .1 }, .1)
      .to(rip, { s: 0, duration: .18, onUpdate: setRip }, .1)
      .to('.sc-glint', { opacity: 0, duration: .12 }, .12)
      .to(refl, { opacity: 1, duration: .12 }, .12)
      .fromTo(place, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .1 }, .19)
      .to('.sc-rings', { opacity: .8, duration: .08 }, .22)
      // ветер
      .to('.sc-rings', { opacity: 0, duration: .06 }, .44)
      .to(rip, { s: 54, duration: .14, onUpdate: setRip }, .46)
      .to('.sc-glint.g1', { opacity: .7, duration: .1 }, .46)
      .to('.sc-glint.g2', { opacity: .45, duration: .1 }, .46)
      .to('.sc-wind', { opacity: .9, duration: .1 }, .46)
      .fromTo('.sc-rose', { opacity: 0, rotate: -60, scale: .8 }, { opacity: 1, rotate: 0, scale: 1, duration: .1 }, .48)
      // вода: разрез рельефа
      .to('.sc-wind', { opacity: 0, duration: .07 }, .72)
      .to('.sc-rose', { opacity: 0, duration: .06 }, .72)
      .to(rip, { s: 0, duration: .09, onUpdate: setRip }, .72)
      .to('.sc-glint', { opacity: 0, duration: .07 }, .72)
      .to('.sc-relief', { opacity: 1, duration: .07 }, .76)
      .to(line, { strokeDashoffset: 0, duration: .08, ease: 'none' }, .78)
      .to('.rl-houses', { opacity: 1, duration: .05 }, .8)
      .to('.rl-flood', { scaleY: 1, duration: .08, ease: 'power1.out' }, .82)
      .to(['.rl-dim', '.rl-t'], { opacity: 1, duration: .04, stagger: .01 }, .86)
      .to({}, { duration: .08 }, .92);
    setRip();
    // живая рябь: медленно «дышит» частота шума (только там, где есть запас мощности)
    if (fine && !reduce) {
      var ph = 0, on = true, n = 0;
      ScrollTrigger.create({ trigger: st, start: 'top bottom', end: 'bottom top', onToggle: function (s) { on = s.isActive; } });
      gsap.ticker.add(function () {
        if (!on || lastS < 1 || (++n % 3)) return;
        ph += .02;
        turb.setAttribute('baseFrequency', (0.004 + Math.sin(ph * .7) * .0012).toFixed(5) + ' ' + (0.085 + Math.sin(ph) * .012).toFixed(5));
      });
    }
    // кнопки сцены
    var pos = { lake: .33, wind: .615, flood: .92 };
    ctl.forEach(function (b) { b.addEventListener('click', function () {
      var y = st.offsetTop + (st.offsetHeight - window.innerHeight) * pos[b.dataset.go];
      if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }); });
    // вход героя
    if (!reduce) {
      var h1 = $('.h1', hero);
      var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro.from('.sc-above .sc-drift', { scale: 1.06, duration: 2.2, ease: 'power2.out' }, 0)
        .from('.sc-water', { opacity: 0, duration: 1.4 }, .2)
        .from('.hero-copy .kicker', { opacity: 0, y: 16, duration: .8 }, .3);
      if (window.SplitText && doc.fonts) {
        gsap.set(h1, { opacity: 0 });
        doc.fonts.ready.then(function () {
          gsap.set(h1, { opacity: 1 });
          var sp = new SplitText(h1, { type: 'lines', mask: 'lines' });
          gsap.from(sp.lines, { yPercent: 105, duration: 1.1, stagger: .09, ease: 'power4.out', delay: .15, onComplete: function () { sp.revert(); if (lang !== 'ru') applyLang(); } });
        });
      } else intro.from(h1, { opacity: 0, y: 24, duration: 1 }, .4);
      intro.from(['.hero-copy .lead', '.hero-btns', '.hero-ig'], { opacity: 0, y: 18, duration: .9, stagger: .09 }, .75);
    }
  }

  function reveals() {
    if (reduce) { $('.incl-draw').classList.add('drawn'); return; }
    var ease = 'power3.out';
    $$('.sec-head').forEach(function (h) {
      gsap.to(h.children, { opacity: 1, y: 0, duration: 1, stagger: .09, ease: ease, scrollTrigger: { trigger: h, start: 'top 84%' } });
    });
    $$('.incl-text .kicker,.incl-text .h2,.incl-text .lead,.office-text .kicker,.office-text .h2,.office-text .lead,.lead-text>*').forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 22, duration: 1, ease: ease, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    ScrollTrigger.batch('.rv', { start: 'top 88%', onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .09, ease: ease }); } });
    ScrollTrigger.batch('.pt:not(.rv), .acc details, .cont-c, .pk-left, .pk-right', { start: 'top 90%', onEnter: function (els) { gsap.from(els, { opacity: 0, y: 24, duration: .9, stagger: .09, ease: ease }); } });
    // кадр проявляется из собственного отражения
    $$('.mirror-in').forEach(function (f) {
      var img = $('img', f), rf = doc.createElement('div'), hz = doc.createElement('i');
      rf.className = 'rf'; hz.className = 'hzl';
      f.appendChild(rf); f.appendChild(hz);
      gsap.set(img, { clipPath: 'inset(0 0 100% 0)' });
      ScrollTrigger.create({ trigger: f, start: 'top 80%', once: true, onEnter: function () {
        rf.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
        var tl = gsap.timeline({ onComplete: function () { rf.remove(); hz.remove(); gsap.set(img, { clearProps: 'clipPath' }); } });
        tl.fromTo(rf, { opacity: 0 }, { opacity: .9, duration: .5, ease: 'power1.out' })
          .to(img, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power3.inOut' }, .35)
          .fromTo(hz, { top: '0%', opacity: 1 }, { top: '100%', duration: 1.3, ease: 'power3.inOut' }, .35)
          .to(hz, { opacity: 0, duration: .2 }, 1.5)
          .fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, .35);
      } });
    });
    // чертёж
    ScrollTrigger.create({ trigger: '.incl-draw', start: 'top 75%', onEnter: function () { $('.incl-draw').classList.add('drawn'); startCycle(); }, onLeave: stopCycle, onEnterBack: startCycle, onLeaveBack: stopCycle });
    // счётчики
    $$('[data-count]').forEach(function (b) {
      var to = +b.dataset.count, pre = b.dataset.prefix || '', o = { v: to * .86 };
      ScrollTrigger.create({ trigger: b, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: function () { b.textContent = pre + (b.hasAttribute('data-plain') ? Math.round(o.v) : fmt(o.v)); } });
      } });
    });
    gsap.from('.pay-bar i', { scaleX: 0, duration: 1.2, ease: 'power3.inOut', stagger: .15, scrollTrigger: { trigger: '.pay-cols', start: 'top 75%' } });
    // потолок: размерная линия и цифра
    gsap.from('.ceil-dim', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: '.ceil', start: 'top 80%' } });
    gsap.from('.ceil-num', { opacity: 0, x: 40, duration: 1.1, ease: ease, scrollTrigger: { trigger: '.ceil', start: 'top 78%' } });
    // параллакс ленты и фонов
    $$('.reel-i img').forEach(function (im, i) {
      gsap.fromTo(im, { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.faq-bg', { yPercent: 5 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.faq', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.lead-bg img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.lead-sec', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.map-card', { y: 60, opacity: 0, duration: 1.1, ease: ease, scrollTrigger: { trigger: '.office-media', start: 'top 70%' } });
    gsap.from('.form', { y: 40, opacity: 0, duration: 1.1, ease: ease, scrollTrigger: { trigger: '.form', start: 'top 85%' } });
    // сравнение: лёгкий заезд ручки
    $$('.cmp').forEach(function (c) {
      var o = { x: 78 }, inp = $('input', c);
      ScrollTrigger.create({ trigger: c, start: 'top 70%', once: true, onEnter: function () {
        gsap.to(o, { x: 50, duration: 1.6, ease: 'power3.inOut', onUpdate: function () { c.style.setProperty('--x', o.x + '%'); inp.value = o.x; } });
      } });
      c.style.setProperty('--x', '78%');
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  renderPicker(false);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();

  // язык: ?lang= главнее сохранённого выбора; по языку браузера не угадываем
  (function () {
    var q = /[?&]lang=(ru|kk|en)\b/.exec(location.search), saved = null;
    try { saved = localStorage.getItem('bp-lang'); } catch (e) {}
    var l = q ? q[1] : saved;
    if (l && l !== 'ru' && /^(kk|en)$/.test(l)) setLang(l, false);
  })();
})();
