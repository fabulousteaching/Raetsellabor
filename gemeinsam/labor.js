/* Rätsellabor – Menü, Startseite und Wechsel zwischen den Rätselgeneratoren.

   Jeder Generator liegt in einem eigenen Ordner unter raetsel/ und meldet sich mit Labor.registriere() an:
     Labor.registriere({
       id: 'zahlen-suchsel',            // erscheint in der Adresse: …#zahlen-suchsel
       titel: 'Zahlen-Suchsel',
       kurz: 'ein Satz für das Menü',
       beschreibung: 'zwei, drei Sätze für die Startseite',
       merkmale: ['…', '…'],             // kleine Stichworte auf der Startseite
       symbol: '<svg …>',               // Symbol (zeichnet mit currentColor)
       css: 'raetsel/…/….css',          // eigenes Stylesheet, nur aktiv, solange der Generator offen ist
       html: '…',                       // Oberfläche des Generators
       start: function(bereich){ …; return function stopp(){ … }; }
     });
   Danach erscheint er automatisch im Menü und auf der Startseite. */
var Labor = (function(){
  'use strict';
  var liste = [], aktiv = null, css = {}, $ = function(s){ return document.querySelector(s); };

  function registriere(r){ liste.push(r); }
  function finde(id){ for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; }
  function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }

  /* ---------- Menü ---------- */
  var knopf, menue;
  function baueMenue(){
    var html = '<div class="menue-gruppe"><p class="menue-titel">Übersicht</p><ul class="menue-liste">' +
      '<li><a class="menue-link" href="#start" data-ziel=""><span class="sym" aria-hidden="true">' + HAUS + '</span>' +
      '<span><b>Startseite</b><small>Was das Rätsellabor kann</small></span></a></li></ul></div>' +
      '<div class="menue-gruppe"><p class="menue-titel">Rätselgeneratoren</p><ul class="menue-liste">';
    liste.forEach(function(r){
      html += '<li><a class="menue-link" href="#' + r.id + '" data-ziel="' + r.id + '"><span class="sym" aria-hidden="true">' + r.symbol + '</span>' +
        '<span><b>' + esc(r.titel) + '</b><small>' + esc(r.kurz) + '</small></span></a></li>';
    });
    html += '</ul><p class="menue-bald">Weitere Generatoren folgen.</p></div>';
    menue.innerHTML = html;
  }
  function menueAuf(){
    menue.hidden = false; knopf.setAttribute('aria-expanded', 'true');
    var a = menue.querySelector('[aria-current="page"]') || menue.querySelector('a');
    if (a) a.focus();
  }
  function menueZu(fokus){
    if (menue.hidden) return;
    menue.hidden = true; knopf.setAttribute('aria-expanded', 'false');
    if (fokus) knopf.focus();
  }

  /* ---------- Startseite ---------- */
  function baueStartseite(){
    var karten = '';
    liste.forEach(function(r){
      karten += '<a class="raetsel-karte" href="#' + r.id + '"><span class="sym" aria-hidden="true">' + r.symbol + '</span>' +
        '<h3>' + esc(r.titel) + '</h3><p>' + esc(r.beschreibung) + '</p>' +
        (r.merkmale && r.merkmale.length ? '<ul class="merkmale">' + r.merkmale.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '') +
        '<span class="oeffnen">Öffnen →</span></a>';
    });
    karten += '<div class="raetsel-karte bald"><span class="sym" aria-hidden="true">' + PLUS + '</span><h3>Weitere Generatoren</h3>' +
      '<p>Neue Rätselarten kommen Schritt für Schritt dazu. Sie erscheinen dann hier und im Menü.</p></div>';
    $('#raetselKarten').innerHTML = karten;
    var erster = liste[0], k = $('#heldStart');
    if (erster){ k.href = '#' + erster.id; k.textContent = erster.titel + ' öffnen'; } else k.hidden = true;
    $('#heldListe').addEventListener('click', function(){
      var z = $('#raetselListe');
      z.scrollIntoView({ behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
    });
    zeichneProbe();
  }
  /* Kleines Beispiel: Markiert man RÄTSEL und LABOR, entsteht eine 7 (das L teilen sich beide Wörter). */
  function zeichneProbe(){
    var zeilen = ['KMUENDIS', 'HRÄTSELO', 'ENWIFGAT', 'ZOPDUKBE', 'ASNRIMOH', 'TEIGÜWRN', 'UFKLEDSI'], S = 10, NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + zeilen[0].length * S + ' ' + zeilen.length * S);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Buchstabengitter: Die markierten Wörter RÄTSEL und LABOR bilden zusammen eine 7.');
    function el(tag, a){ var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
    el('rect', { x:0, y:0, width:zeilen[0].length * S, height:zeilen.length * S, fill:'#fff' });
    el('line', { x1:1.5 * S, y1:1.5 * S, x2:6.5 * S, y2:1.5 * S, stroke:'#fcd34d', 'stroke-width':S * 0.78, 'stroke-linecap':'round', opacity:.75 });
    el('line', { x1:6.5 * S, y1:1.5 * S, x2:6.5 * S, y2:5.5 * S, stroke:'#86c5ea', 'stroke-width':S * 0.78, 'stroke-linecap':'round', opacity:.7 });
    var d = '';
    for (var c = 1; c < zeilen[0].length; c++) d += 'M' + c * S + ' 0V' + zeilen.length * S;
    for (var r = 1; r < zeilen.length; r++) d += 'M0 ' + r * S + 'H' + zeilen[0].length * S;
    el('path', { d:d, stroke:'#e3e6eb', 'stroke-width':0.35, fill:'none' });
    el('rect', { x:0.4, y:0.4, width:zeilen[0].length * S - 0.8, height:zeilen.length * S - 0.8, fill:'none', stroke:'#374151', 'stroke-width':0.6, rx:1.2 });
    zeilen.forEach(function(z, r){ Array.from(z).forEach(function(ch, c){ el('text', { x:c * S + S / 2, y:r * S + S / 2 + 0.3 }).textContent = ch; }); });
    var probe = $('#probe'); probe.insertBefore(svg, probe.firstChild);
  }

  /* ---------- Wechsel zwischen Startseite und Generatoren ---------- */
  function ladeCss(r, fertig){
    if (!r.css){ fertig(); return; }
    var l = css[r.id];
    if (l){ l.disabled = false; fertig(); return; }
    l = css[r.id] = document.createElement('link');
    l.rel = 'stylesheet'; l.href = r.css;
    var einmal = false; function los(){ if (!einmal){ einmal = true; fertig(); } }
    l.onload = los; l.onerror = los; setTimeout(los, 3000);
    document.head.appendChild(l);
  }
  function markiere(id){
    [].forEach.call(menue.querySelectorAll('.menue-link'), function(a){
      if (a.getAttribute('data-ziel') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function schliesseAktiv(){
    if (!aktiv) return;
    try { if (typeof aktiv.stopp === 'function') aktiv.stopp(); } catch(e){ console.error(e); }
    if (css[aktiv.r.id]) css[aktiv.r.id].disabled = true;
    $('#raetselBereich').innerHTML = '';
    aktiv = null;
  }
  function route(){
    var id = (location.hash || '').replace(/^#/, ''), r = finde(id), bereich = $('#raetselBereich');
    menueZu(false);
    if (aktiv && aktiv.r === r) return;
    schliesseAktiv();
    if (!r){
      bereich.hidden = true; $('#startseite').hidden = false; $('#kopfPfad').hidden = true;
      document.title = 'Rätsellabor'; markiere(''); window.scrollTo(0, 0);
      return;
    }
    $('#startseite').hidden = true; $('#kopfPfad').hidden = false; $('#kopfPfad span').textContent = r.titel;
    document.title = r.titel + ' – Rätsellabor'; markiere(r.id);
    ladeCss(r, function(){
      if ((location.hash || '').replace(/^#/, '') !== r.id || aktiv) return;   // inzwischen weitergeklickt
      bereich.innerHTML = r.html; bereich.hidden = false; window.scrollTo(0, 0);
      aktiv = { r:r, stopp:null };
      try { aktiv.stopp = r.start(bereich); } catch(e){ console.error(e); }
      var h = bereich.querySelector('h1');
      if (h){ h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll:true }); } catch(e){} }
    });
  }

  function start(){
    knopf = $('#menueKnopf'); menue = $('#menue');
    baueMenue(); baueStartseite();
    knopf.addEventListener('click', function(e){ e.stopPropagation(); if (menue.hidden) menueAuf(); else menueZu(true); });
    document.addEventListener('click', function(e){ if (!menue.hidden && !menue.contains(e.target) && !knopf.contains(e.target)) menueZu(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !menue.hidden) menueZu(true); });
    menue.addEventListener('click', function(e){ var a = e.target.closest('a'); if (a && a.getAttribute('href') === location.hash) menueZu(true); });
    window.addEventListener('hashchange', route);
    route();
  }

  var HAUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>';
  var PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  /* ---------- Helfer für alle Generatoren ---------- */
  // Läuft die Seite als Claude-Artefakt? Dort gibt es kein Drucken, dafür Download und Claude.
  function imArtefakt(){ return !!(window.claude && typeof window.claude.use === 'function'); }
  var faehig = {};
  function claude(name){
    if (!imArtefakt()) return Promise.resolve(null);
    if (!faehig[name]) faehig[name] = Promise.resolve(window.claude.use(name)).catch(function(){ return null; });
    return faehig[name];
  }
  // Alle aktiven Stilregeln der Seite (für eine gespeicherte Datei)
  function sammleCss(){
    return [].map.call(document.styleSheets, function(s){
      if (s.disabled) return '';
      try { return [].map.call(s.cssRules, function(r){ return r.cssText; }).join('\n'); } catch(e){ return ''; }
    }).join('\n');
  }
  // Ein Arbeitsblatt als eigenständige HTML-Datei, die man öffnet und druckt
  function blattDatei(titel, inhalt, extraCss){
    var css = sammleCss() + '\n' + (extraCss || '') +
      '\nbody{display:block;background:#f4f7f9}body::before{display:none}.seite{max-width:960px;margin:0 auto;padding:18px;display:grid;gap:22px}' +
      '.leiste{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:#6b7280;font-size:.9rem}' +
      '@media print{.leiste{display:none}.seite{max-width:none;padding:0;display:block}.neue-seite{break-before:page}}';
    return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(titel) + '</title>\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600;700&display=swap">\n' +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="seite">\n' +
      '<div class="leiste"><button class="btn primary" onclick="window.print()">Drucken</button><span>Tipp: Im Druckdialog «Hintergrundgrafiken» einschalten, damit Farben mitgedruckt werden.</span></div>\n' +
      inhalt + '\n</div>\n</body>\n</html>\n';
  }
  // Dateinamen-tauglicher Text
  function dateiname(t){ return String(t || '').trim().replace(/[^\p{L}\p{N} _-]+/gu, '').replace(/\s+/g, '-').slice(0, 40); }

  return { registriere:registriere, start:start, imArtefakt:imArtefakt, claude:claude, sammleCss:sammleCss, blattDatei:blattDatei, dateiname:dateiname, esc:esc };
})();
