document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.innerHTML = open ? '×' : '☰';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.innerHTML='☰';
    }));
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
    }), {threshold: 0.12});
    revealEls.forEach(el => obs.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  document.querySelectorAll('.faq-q').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    item.classList.toggle('open');
    button.setAttribute('aria-expanded', String(item.classList.contains('open')));
  }));

  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
    onScroll(); window.addEventListener('scroll', onScroll, {passive: true});
  }

  // Всплывающее предложение: первый раз через 9 сек, затем каждые 90 сек
  const backdrop = document.querySelector('.popup-backdrop');
  const closeButtons = document.querySelectorAll('[data-popup-close]');
  const openButtons = document.querySelectorAll('[data-popup-open]');
  const seenKey = 'labody-first-visit-popup-last-open';
  const P = window.PROMO || {};
  const today = new Date().toISOString().slice(0, 10);
  const promoOn = P.enabled !== false && (!P.startDate || today >= P.startDate) && (!P.endDate || today <= P.endDate);
  const repeatEvery = (P.repeatEverySec || 90) * 1000;
  const initialDelay = (P.firstDelaySec || 9) * 1000;
  let isOpen = false;
  let popupTimer = null;
  let lastFocus = null;

  if (backdrop && window.PROMO) {
    const q = (sel) => backdrop.querySelector(sel), set = (el, fn) => { if (el) fn(el); };
    set(q('.popup-banner'), e => { if (P.image) e.src = P.image; if (P.imageAlt) e.alt = P.imageAlt; });
    set(q('#popup-title'), e => { if (P.title != null) e.innerHTML = ''; if (P.title != null) { e.append(P.title + ' '); const sp = document.createElement('span'); sp.className = 'italic'; sp.textContent = P.titleAccent || ''; e.append(sp); } });
    set(q('.popup-copy > p:not(.fineprint)'), e => { if (P.text != null) e.textContent = P.text; });
    set(q('.popup-copy .btn'), e => { if (P.link) e.href = P.link; if (P.buttonText) { e.innerHTML = ''; e.append(P.buttonText + ' '); const a = document.createElement('span'); a.className = 'arrow'; a.textContent = '↗'; e.append(a); } });
    set(q('.fineprint'), e => { if (P.note != null) e.textContent = P.note; });
    document.querySelectorAll('.cookie-mini').forEach(e => { if (P.pillText) { e.textContent = P.pillText + ' '; const sp = document.createElement('span'); sp.textContent = P.pillPrice || ''; e.append(sp); } });
    if (!promoOn) document.querySelectorAll('.cookie-mini').forEach(e => e.remove());
  }
  function readLastOpen() { try { return Number(sessionStorage.getItem(seenKey) || 0); } catch(e) { return 0; } }
  function recordOpen() { try { sessionStorage.setItem(seenKey, String(Date.now())); } catch(e) {} }
  function schedulePopup(delay) {
    if (!backdrop || !promoOn) return;
    if (popupTimer) window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(() => {
      if (document.hidden || isOpen || document.body.classList.contains('bk-open')) { schedulePopup(5000); return; }
      const sinceLast = Date.now() - readLastOpen();
      if (!readLastOpen() || sinceLast >= repeatEvery) openPopup();
      else schedulePopup(Math.max(1000, repeatEvery - sinceLast));
    }, Math.max(500, delay));
  }
  function openPopup() {
    if (!backdrop || isOpen || !promoOn) return;
    isOpen = true; recordOpen();
    lastFocus = document.activeElement;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const close = backdrop.querySelector('.popup-close');
    if (close) close.focus();
  }
  function closePopup() {
    if (!backdrop || !isOpen) return;
    isOpen = false;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    schedulePopup(Math.max(1000, repeatEvery - (Date.now() - readLastOpen())));
  }
  openButtons.forEach(btn => btn.addEventListener('click', openPopup));
  closeButtons.forEach(btn => btn.addEventListener('click', closePopup));
  if (backdrop) {
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closePopup(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePopup();
      if (e.key === 'Tab' && isOpen) {
        const f = backdrop.querySelectorAll('a[href],button:not([disabled])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !isOpen) {
        const sinceLast = Date.now() - readLastOpen();
        schedulePopup(!readLastOpen() ? initialDelay : Math.max(1000, repeatEvery - sinceLast));
      }
    });
    const sinceLast = Date.now() - readLastOpen();
    schedulePopup(!readLastOpen() ? initialDelay : Math.max(1000, repeatEvery - sinceLast));
  }

  document.querySelectorAll('[data-copy-code]').forEach(button => button.addEventListener('click', async () => {
    const code = button.getAttribute('data-copy-code');
    try { await navigator.clipboard.writeText(code); button.textContent = 'Скопировано'; }
    catch(e) { button.textContent = code; }
    window.setTimeout(() => { button.textContent = 'Скопировать'; }, 1800);
  }));
  document.querySelectorAll('[data-demo-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault(); const note = form.querySelector('.form-note'); if(note) note.textContent = 'Спасибо! Для отправки сообщения свяжитесь с администратором по телефону +7 (916) 301-61-46.';
  }));

  // Подсветка выбранной услуги неоном (переход с главной: ?hl=id1,id2#id1 или обычный #якорь)
  let neonTimer = null;
  function neon(ids) {
    document.querySelectorAll('.neon-target').forEach(el => el.classList.remove('neon-target', 'neon-fade'));
    window.clearTimeout(neonTimer);
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    els.forEach(el => { el.classList.remove('visible'); el.classList.add('visible', 'neon-target'); });
    els[0].scrollIntoView({behavior: 'smooth', block: 'start'});
    neonTimer = window.setTimeout(() => {
      els.forEach(el => el.classList.add('neon-fade'));
      window.setTimeout(() => els.forEach(el => el.classList.remove('neon-target', 'neon-fade')), 1400);
    }, 7500);
  }
  if (document.getElementById('catalog-nav')) {
    const hl = new URLSearchParams(location.search).get('hl');
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hl) window.setTimeout(() => neon(hl.split(',').map(x => x.trim()).filter(Boolean)), 350);
    else if (hash && document.getElementById(hash) && document.getElementById(hash).classList.contains('catalog-section')) window.setTimeout(() => neon([hash]), 350);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
      const id = a.getAttribute('href').slice(1);
      const t = document.getElementById(id);
      if (t && t.classList.contains('catalog-section')) window.setTimeout(() => neon([id]), 250);
    }));
  }

  // До/После: ползунок сравнения
  document.querySelectorAll('[data-ba]').forEach(st => {
    const r = st.querySelector('.ba-range');
    r.addEventListener('input', () => st.style.setProperty('--pos', r.value + '%'));
  });

  // Картинки: сначала локальный файл, при ошибке — исходный адрес (работает с VPN), затем мягкая заливка
  document.querySelectorAll('img').forEach(img => {
    const fail = () => {
      const remote = img.getAttribute('data-remote');
      if (remote && !img.dataset.triedRemote) { img.dataset.triedRemote = '1'; img.src = remote; }
      else img.classList.add('img-missing');
    };
    img.addEventListener('error', fail);
    img.addEventListener('load', () => img.classList.remove('img-missing'));
    if (img.complete && img.naturalWidth === 0) fail();
  });

  // Шрифты: если локальные ещё не скачаны — подключаем Google Fonts (не блокирует страницу, без VPN просто не загрузятся)
  try {
    if (getComputedStyle(document.documentElement).getPropertyValue('--fonts-local').trim() !== '1') {
      const l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(l);
    }
  } catch(e) {}

  document.querySelectorAll('[data-year]').forEach(node => node.textContent = new Date().getFullYear());
});

// «До/после»: блок виден только если загружены оба фото (для просмотра макета — добавьте ?preview=1 к адресу)
(function () {
  const sec = document.getElementById('results'); if (!sec) return;
  const preview = /[?&]preview=1/.test(location.search);
  const figs = [...sec.querySelectorAll('.ba')];
  let ok = 0, left = figs.length;
  const done = () => { if (--left === 0) { if (ok || preview) sec.classList.add('ready'); } };
  figs.forEach(f => {
    const srcs = [...f.querySelectorAll('img')].map(i => i.getAttribute('src'));
    let loaded = 0, bad = false;
    srcs.forEach(src => { const im = new Image(); im.onload = () => { if (++loaded === srcs.length && !bad) { ok++; f.classList.add('has-photos'); done(); } }; im.onerror = () => { if (!bad) { bad = true; if (!preview) f.hidden = true; done(); } }; im.src = src; });
  });
  if (!figs.length) return;
})();

document.querySelectorAll('.ba-range').forEach(r => { const st = r.closest('.ba-stage'); const upd = () => { st.querySelector('.ba-layer.after').style.clipPath = 'inset(0 0 0 ' + r.value + '%)'; st.querySelector('.ba-handle').style.left = r.value + '%'; }; r.addEventListener('input', upd); upd(); });

document.querySelectorAll('.quote-avatar[data-photo]').forEach(a => { const im = new Image(); im.onload = () => { a.textContent = ''; im.alt = ''; a.append(im); }; im.src = 'assets/reviews/' + a.dataset.photo + '.jpg'; });
