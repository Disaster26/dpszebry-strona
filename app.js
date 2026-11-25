(function () {
  'use strict';
  var d = document;

  /* menu na telefonie */
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function zamknij() {
    menu.classList.remove('otwarte');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Otwórz menu');
    d.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('otwarte');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
    d.body.style.overflow = o ? 'hidden' : '';
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });

  var strzalka = function (k) {
    return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + (k < 0 ? 'M12.5 4 6.5 10l6 6' : 'M7.5 4l6 6-6 6') + '" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
  };

  /* pas zdjęć: palec, mysz, strzałki */
  d.querySelectorAll('[data-pas]').forEach(function (w) {
    var tor = w.querySelector('.pas');
    var przyc = [-1, 1].map(function (k) {
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'pas-btn ' + (k < 0 ? 'lewo' : 'prawo');
      b.setAttribute('aria-label', k < 0 ? 'Poprzednie zdjęcia' : 'Następne zdjęcia');
      b.innerHTML = strzalka(k);
      b.addEventListener('click', function () {
        var el = tor.firstElementChild, krok = el.getBoundingClientRect().width + 16;
        tor.scrollBy({ left: k * krok, behavior: 'smooth' });
      });
      w.appendChild(b);
      return b;
    });
    function stan() {
      przyc[0].disabled = tor.scrollLeft < 8;
      przyc[1].disabled = tor.scrollLeft + tor.clientWidth > tor.scrollWidth - 8;
    }
    tor.addEventListener('scroll', stan, { passive: true });
    window.addEventListener('resize', stan);
    stan();

    var x0 = 0, s0 = 0, ruch = false, wcisn = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      wcisn = true; ruch = false; x0 = e.clientX; s0 = tor.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!wcisn) return;
      var dx = e.clientX - x0;
      if (!ruch && Math.abs(dx) > 5) { ruch = true; tor.classList.add('ciagnie'); }
      if (ruch) { tor.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!wcisn) return;
      wcisn = false;
      if (ruch) {
        setTimeout(function () { tor.classList.remove('ciagnie'); }, 0);
        var el = tor.firstElementChild, krok = el.getBoundingClientRect().width + 16;
        tor.scrollTo({ left: Math.round(tor.scrollLeft / krok) * krok, behavior: 'smooth' });
      }
    });
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
  });

  /* powiększanie zdjęć */
  var linki = [].slice.call(d.querySelectorAll('a.lb'));
  if (linki.length) {
    var lbx = d.createElement('div');
    lbx.className = 'lbx';
    lbx.hidden = true;
    lbx.setAttribute('role', 'dialog');
    lbx.setAttribute('aria-modal', 'true');
    lbx.setAttribute('aria-label', 'Powiększone zdjęcie');
    lbx.innerHTML = '<img alt=""><p class="lbx-podpis"></p>' +
      '<button type="button" class="lbx-zamknij" aria-label="Zamknij">✕</button>' +
      '<button type="button" class="lbx-lewo" aria-label="Poprzednie zdjęcie">' + strzalka(-1) + '</button>' +
      '<button type="button" class="lbx-prawo" aria-label="Następne zdjęcie">' + strzalka(1) + '</button>';
    d.body.appendChild(lbx);
    var im = lbx.querySelector('img'), podp = lbx.querySelector('.lbx-podpis'), ix = 0, ostatni = null;
    function pokaz(i) {
      ix = (i + linki.length) % linki.length;
      var a = linki[ix], mini = a.querySelector('img');
      im.src = mini.currentSrc || mini.src;
      im.alt = mini.alt;
      var duzy = new Image();
      duzy.onload = function () { if (linki[ix] === a) im.src = duzy.src; };
      setTimeout(function () { duzy.src = a.href; }, 120);
      podp.textContent = a.getAttribute('data-podpis') + '  (' + (ix + 1) + '/' + linki.length + ')';
    }
    function otworz(i) { ostatni = d.activeElement; lbx.hidden = false; d.body.style.overflow = 'hidden'; pokaz(i); lbx.querySelector('.lbx-zamknij').focus(); }
    function zamknijLb() { lbx.hidden = true; d.body.style.overflow = ''; im.removeAttribute('src'); if (ostatni) ostatni.focus(); }
    linki.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); otworz(i); });
    });
    lbx.querySelector('.lbx-zamknij').addEventListener('click', zamknijLb);
    lbx.querySelector('.lbx-lewo').addEventListener('click', function () { pokaz(ix - 1); });
    lbx.querySelector('.lbx-prawo').addEventListener('click', function () { pokaz(ix + 1); });
    lbx.addEventListener('click', function (e) { if (e.target === lbx) zamknijLb(); });
    d.addEventListener('keydown', function (e) {
      if (lbx.hidden) return;
      if (e.key === 'Escape') zamknijLb();
      if (e.key === 'ArrowLeft') pokaz(ix - 1);
      if (e.key === 'ArrowRight') pokaz(ix + 1);
    });
    var tx = null;
    lbx.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lbx.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) pokaz(ix + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* formularz (w wersji WordPress wysyłka na adres e-mail Domu) */
  var f = d.getElementById('formularz');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var info = f.querySelector('.formularz-info');
      info.hidden = false;
      if (!f.checkValidity()) {
        info.textContent = 'Prosimy uzupełnić imię i nazwisko, e-mail, wiadomość i zaznaczyć zgodę.';
        return;
      }
      info.textContent = 'To wersja do akceptacji: formularz zacznie wysyłać wiadomości na adres mka_1@wp.pl po uruchomieniu strony.';
    });
  }
})();
