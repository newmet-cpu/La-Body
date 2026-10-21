/* Заявка и покупка сертификата прямо на сайте */
(function () {
  const SERVICES = ['Массаж МИКС (акция 1990 ₽)', 'Массаж тела', 'Массаж лица', 'СПА-ритуалы и обёртывания', 'Эстетическая косметология', 'Тотал-ресет (персональная программа)', 'Ногти, брови, депиляция', 'Нужна консультация'];
  const SLOTS = []; for (let m = 600; m < 1320; m += 30) { const f = x => String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); SLOTS.push({label: f(m), start: m}); }
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const NOMINALS = [3000, 5000, 10000, 15000, 20000];
  const PHONE = '+7 (916) 301-61-46';
  let back = null, lastFocus = null;
  const el = (t, a, h) => { const e = document.createElement(t); if (a) Object.assign(e, a); if (h != null) e.innerHTML = h; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const digits = s => s.replace(/\D/g, '');
  function maskPhone(i) { i.addEventListener('input', () => { let d = digits(i.value); if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11); let o = '+7'; if (d.length > 1) o += ' (' + d.slice(1, 4); if (d.length >= 4) o += ') ' + d.slice(4, 7); if (d.length >= 7) o += '-' + d.slice(7, 9); if (d.length >= 9) o += '-' + d.slice(9, 11); i.value = o; }); }
  function close() { if (!back) return; back.remove(); back = null; document.body.classList.remove('bk-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function open(inner) {
    const pop = document.querySelector('.popup-backdrop.open .popup-close'); if (pop) pop.click();
    close(); lastFocus = document.activeElement;
    back = el('div', {className: 'bk-back'}); const box = el('section', {className: 'bk'}, '<button class="x" type="button" aria-label="Закрыть">×</button>' + inner);
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); back.append(box); document.body.append(back); document.body.classList.add('bk-open');
    back.addEventListener('mousedown', e => { if (e.target === back) close(); }); box.querySelector('.x').addEventListener('click', close);
    const first = box.querySelector('input:not(.hp),select'); if (first) setTimeout(() => first.focus(), 50); return box;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  async function send(url, data) {
    const r = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    const j = await r.json().catch(() => ({})); if (!r.ok || j.error) throw new Error(j.error || 'Не удалось отправить. Позвоните нам: ' + PHONE); return j;
  }
  function consent(extra) { return '<label class="chk"><input type="checkbox" name="agree" required/><span>Я согласен(на) на обработку персональных данных согласно <a href="privacy.html" target="_blank">политике конфиденциальности</a>' + (extra || '') + '</span></label>'; }
  function wire(box, onSubmit) {
    const f = box.querySelector('form'), err = box.querySelector('.err'), btn = box.querySelector('.go'); maskPhone(f.phone);
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      if (digits(f.phone.value).length < 11) { err.textContent = 'Укажите телефон полностью'; f.phone.focus(); return; }
      if (!f.agree.checked) { err.textContent = 'Нужно согласие на обработку данных'; return; }
      btn.disabled = true; const t = btn.textContent; btn.textContent = 'Отправляем…';
      try { await onSubmit(f); } catch (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = t; }
    });
  }
  function booking(service) {
    const box = open('<h2>Запись <em>онлайн</em></h2><p class="sub">Оставьте заявку — администратор свяжется с вами и подтвердит время.</p><form novalidate><input class="hp" name="site" tabindex="-1" autocomplete="off"/><label>Ваше имя</label><input name="name" required autocomplete="name"/><label>Телефон</label><input name="phone" type="tel" inputmode="tel" value="+7" autocomplete="tel"/><label>Услуга</label><select name="service">' + SERVICES.map(s => '<option' + (s === service ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select><label>Желаемая дата</label><input name="date" type="date" min="' + ymd(new Date()) + '"/><label>Время визита (10:00–22:00)</label><input type="hidden" name="slot"/><div class="slots" role="group" aria-label="Время"></div><label>Комментарий</label><textarea name="comment" maxlength="400"></textarea>' + consent() + '<div class="err" role="alert"></div><button class="go" type="submit">Отправить заявку</button></form>');
    const grid = box.querySelector('.slots'), dateI = box.querySelector('[name=date]'), slotI = box.querySelector('[name=slot]');
    function drawSlots() {
      const now = new Date(), mins = now.getHours() * 60 + now.getMinutes(); slotI.value = ''; grid.innerHTML = '';
      SLOTS.forEach(s => { const x = document.createElement('button'); x.type = 'button'; x.className = 'slot'; x.textContent = s.label; if (dateI.value === ymd(now) && s.start <= mins) x.disabled = true;
        x.addEventListener('click', () => { slotI.value = s.label; grid.querySelectorAll('.slot').forEach(y => y.classList.toggle('on', y === x)); }); grid.append(x); });
    }
    dateI.value = ymd(new Date()); dateI.addEventListener('change', drawSlots); drawSlots();
    wire(box, async f => {
      if (!f.name.value.trim()) { f.name.focus(); throw new Error('Укажите имя'); }
      if (f.service.value !== SERVICES[SERVICES.length - 1] && (!f.date.value || !f.slot.value)) throw new Error('Выберите дату и время');
      await send('api/lead.php', {name: f.name.value, phone: f.phone.value, service: f.service.value, date: f.date.value, slot: f.slot.value, comment: f.comment.value, site: f.site.value, page: location.pathname});
      box.querySelector('form').outerHTML = '<div class="ok"><b>Заявка отправлена</b>Спасибо! Администратор свяжется с вами в ближайшее время. Если нужно срочно — позвоните: ' + PHONE + '</div>';
    });
  }
  function certificate(nominal) {
    let sum = nominal || 5000;
    const box = open('<h2>Подарочный <em>сертификат</em></h2><p class="sub">Оплата банковской картой или СБП через ЮKassa. Сертификат придёт на почту.</p><form novalidate><input class="hp" name="site" tabindex="-1" autocomplete="off"/><label>Номинал</label><div class="chips">' + NOMINALS.map(n => '<button type="button" class="chip" data-n="' + n + '">' + n.toLocaleString('ru-RU') + ' ₽</button>').join('') + '</div><label>Или своя сумма (от 1 000 ₽)</label><input name="custom" type="number" min="1000" max="100000" step="100" inputmode="numeric"/><label>Ваше имя</label><input name="name" autocomplete="name"/><div class="row2"><div><label>Телефон</label><input name="phone" type="tel" inputmode="tel" value="+7"/></div><div><label>Email для чека</label><input name="email" type="email" autocomplete="email"/></div></div><label>Кому подарок (необязательно)</label><input name="to" maxlength="80"/><label>Пожелание (необязательно)</label><textarea name="wish" maxlength="300"></textarea>' + consent(' и условиями покупки сертификата') + '<div class="err" role="alert"></div><button class="go" type="submit">Перейти к оплате</button></form>');
    const chips = [...box.querySelectorAll('.chip')], custom = box.querySelector('[name=custom]');
    const mark = () => chips.forEach(c => c.classList.toggle('on', +c.dataset.n === sum && !custom.value)); mark();
    chips.forEach(c => c.addEventListener('click', () => { sum = +c.dataset.n; custom.value = ''; mark(); }));
    custom.addEventListener('input', () => { if (custom.value) sum = +custom.value; mark(); });
    if (nominal && !NOMINALS.includes(nominal)) custom.value = nominal;
    wire(box, async f => {
      const amount = custom.value ? +custom.value : sum;
      if (!(amount >= 1000 && amount <= 100000)) throw new Error('Сумма от 1 000 до 100 000 ₽');
      if (!f.name.value.trim()) throw new Error('Укажите имя');
      if (!/^\S+@\S+\.\S+$/.test(f.email.value)) throw new Error('Укажите email — на него придёт чек и сертификат');
      const r = await send('api/certificate.php', {amount, name: f.name.value, phone: f.phone.value, email: f.email.value, to: f.to.value, wish: f.wish.value, site: f.site.value});
      if (!r.url) throw new Error('Оплата временно недоступна. Позвоните: ' + PHONE); location.href = r.url;
    });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return; const h = a.getAttribute('href') || '';
    if (!/yclients\.com|^#booking$|^#certificate$/.test(h)) return;
    e.preventDefault(); const t = a.textContent;
    if (h === '#certificate' || a.closest('.certificate-option') || /сертификат/i.test(t)) {
      const m = a.closest('.certificate-option') && a.closest('.certificate-option').textContent.match(/(\d[\d\s]*)\s*₽/);
      certificate(m ? parseInt(m[1].replace(/\s/g, ''), 10) : 0);
    } else booking(/МИКС/.test(t) ? SERVICES[0] : '');
  });
  window.openBooking = booking; window.openCertificate = certificate;
  if (/[?&]paid=1/.test(location.search)) open('<div class="ok"><b>Спасибо за покупку!</b>Оплата обрабатывается. Как только она подтвердится, сертификат придёт на указанную почту. Вопросы — по телефону ' + PHONE + '</div>');
})();
