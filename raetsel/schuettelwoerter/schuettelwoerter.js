/* Rätsellabor – Generator «Schüttelwörter»
   Eigene Wörter (oder Vorschläge zum Thema, gemeinsam/wortwahl.js) werden geschüttelt: die Buchstaben in neuer
   Reihenfolge. Nie bleibt ein Wort gleich, und höchstens ein Drittel der Buchstaben steht noch an seiner alten Stelle.
   Auf Wunsch Kästchen zum Hineinschreiben (je Buchstabe eines), der erste Buchstabe bleibt vorne (leichter), Buchstaben
   einzeln in Kärtchen. Schüttelwörter klein oder GROSS. Blatt (bei vielen Wörtern mehrere), Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('schuettelwoerter');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Ein Wort schütteln (Buchstaben als Liste). ersterFest: der erste bleibt vorne. Versucht es mehrmals und nimmt die
     Reihenfolge mit den wenigsten Buchstaben an alter Stelle – nie das Wort selbst, wenn es irgendwie anders geht.
     → { b:[…], gleich:Anzahl an alter Stelle, ok:(anders als das Wort) } */
  function schuetteln(b, rnd, ersterFest){
    var start = ersterFest ? 1 : 0, n = b.length, ziel = Math.floor((n - start) / 3), best = null;
    var wort = b.join('').toLowerCase();
    for (var versuch = 0; versuch < 80; versuch++){
      var c = b.slice();
      for (var i = n - 1; i > start; i--){ var j = start + Math.floor(rnd() * (i - start + 1)), x = c[i]; c[i] = c[j]; c[j] = x; }
      var gleich = 0; for (var k = start; k < n; k++) if (c[k].toLowerCase() === b[k].toLowerCase()) gleich++;
      var ok = c.join('').toLowerCase() !== wort, punkte = gleich + (ok ? 0 : 1000);
      if (!best || punkte < best.punkte) best = { b:c, gleich:gleich, ok:ok, punkte:punkte };
      if (ok && gleich <= ziel) break;
    }
    return best;
  }
  /* Eintrag (ein Wort oder mehrere, durch Leerzeichen oder Bindestrich getrennt) → Teile; jeder Teil wird für sich geschüttelt */
  function teile(text){ return String(text).split(/([\s-]+)/).filter(function(t){ return t; }).map(function(t){ return { wort:!/^[\s-]+$/.test(t), t:t.replace(/\s+/g, ' ') }; }); }
  return { zufall:zufall, schuetteln:schuetteln, teile:teile };
})();
/* KERN-ENDE */

var TINTE = '#1C1714';
var SCHREIB = [['klein', 'kleinbuchstaben'], ['gross', 'GROSSBUCHSTABEN']];
function esc(t){ return Labor.esc(t); }

var VORLAGE = '<div class="sw">' +
  tx('<header class="sw-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Schüttelwörter</h1>') +
    tx('<p>Die Buchstaben der Wörter sind durcheinandergeschüttelt – welches Wort steckt dahinter?</p></header>') +
  tx('<div class="sw-layout"><section class="sw-eingabe" aria-label="Eingaben">') +
    Wortwahl.html(1) +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Schütteln</h2></div></div>') +
      tx('<p class="feld-label">Schüttelwörter in</p>') +
      tx('<div class="sw-chips" role="radiogroup" aria-label="Schreibweise">') + SCHREIB.map(function(a){ return '<label><input type="radio" name="swSchreib" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="hinweis" id="swSchreibInfo"></p>' +
      tx('<label class="opt"><input type="checkbox" id="swKaestchen"><span>Kästchen zum Hineinschreiben (je Buchstabe eines)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="swErster"><span>Erster Buchstabe bleibt vorne (leichter)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="swKarten"><span>Buchstaben einzeln in Kärtchen</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="sw-ausgabe" aria-label="Ergebnis">') +
    '<div id="swMeldung" aria-live="polite"></div>' +
    '<div class="sw-werkzeug">' +
      tx('<button type="button" class="btn klein" id="swZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="swNeu" title="Die Buchstaben neu schütteln">Neu schütteln</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="swMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="swPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="swHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="sw-blaetter"><div class="sw-seiten" id="swSeiten"></div>' +
    '<div class="sw-rahmen sw-loesung-rahmen"><article class="sw-blatt sw-loesungsblatt" id="swLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="2.5" y="4" width="6" height="6" rx="1.2" transform="rotate(-10 5.5 7)"/><rect x="9.5" y="3.5" width="6" height="6" rx="1.2" transform="rotate(8 12.5 6.5)"/><rect x="16" y="5" width="6" height="6" rx="1.2" transform="rotate(-6 19 8)"/>' +
  '<path d="M3 16h18M3 20h18" stroke-dasharray="3 2"/></svg>';

Labor.registriere({
  id:'schuettelwoerter',
  titel:'Schüttelwörter',
  kurz:'Buchstaben durcheinander – welches Wort ist es?',
  beschreibung:'Eigene Wörter oder Vorschläge zum Thema werden geschüttelt: die Buchstaben in neuer Reihenfolge. Auf Wunsch Kästchen zum Hineinschreiben, erster Buchstabe vorne, Buchstaben in Kärtchen. Mit Lösungsblatt.',
  merkmale:['Eigene Wörter', 'Kästchen wählbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/schuettelwoerter/schuettelwoerter.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'schuettelwoerter-eingaben', OPT = 'schuettelwoerter-einstellungen';
  // Keine Vorauswahl bei der Schreibweise; Kästchen und Kärtchen sind angekreuzt
  var STANDARD = { schreib:'', kaestchen:true, erster:false, karten:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { titel:'', woerter:[], seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e && Array.isArray(e.woerter)){ st.woerter = e.woerter.map(String).filter(Boolean); st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!SCHREIB.some(function(a){ return a[0] === st.opt.schreib; })) st.opt.schreib = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, woerter:st.woerter, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#swMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  // Vergleichsform (doppelte Wörter erkennen): Grossbuchstaben, nur Buchstaben, Leerzeichen und Bindestriche
  function norm(t){ return String(t || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/[^\p{L}\s-]/gu, '').replace(/\s+/g, ' ').trim(); }

  var warte = 0;
  var ww = Wortwahl.verbinde(bereich, {
    zustand:st, norm:norm,
    geaendert:function(notiz){ speichern(); clearTimeout(warte); warte = setTimeout(function(){ zeichnen(notiz); }, 150); },
    titelGeaendert:function(){ speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 300); }
  });
  [].forEach.call(bereich.querySelectorAll('input[name="swSchreib"]'), function(r){
    r.checked = r.value === st.opt.schreib;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.schreib = r.value; speichern(); zeichnen(); } });
  });
  [['#swKaestchen', 'kaestchen'], ['#swErster', 'erster'], ['#swKarten', 'karten'], ['#swMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#swZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#swLoesung').classList.toggle('zeigen', an); $('#swLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#swNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Schütteln und Zeichnen ---------- */
  var R = null;
  // Wörter: doppelte und zu kurze weg; Schreibweise anwenden
  function woerter(){
    var gesehen = {}, gut = [], weg = [];
    st.woerter.forEach(function(t){
      var roh = String(t).normalize('NFC').replace(/[^\p{L}\s-]/gu, '').replace(/\s+/g, ' ').trim(), n = norm(t);
      if (!roh || gesehen[n] || roh.replace(/[\s-]/g, '').length < 2){ if (String(t).trim()) weg.push(String(t).trim()); return; }
      gesehen[n] = true; gut.push(roh);
    });
    return { gut:gut, weg:weg };
  }
  function schreib(t){ return st.opt.schreib === 'gross' ? t.toLocaleUpperCase('de-CH') : t.toLocaleLowerCase('de-CH'); }
  function zeichnen(notiz){
    if (aus) return;
    var o = st.opt, W = woerter(), z = [];
    $('#swSchreibInfo').textContent = o.schreib ? (o.schreib === 'gross' ? tx('Die Lösung schreibt man dann auch gross (ß wird SS).') : tx('Die Lösung schreibt man richtig – Nomen gross.')) : '';
    if (notiz) z.push(notiz);
    if (W.weg.length) z.push(tx('Zu kurz oder doppelt, wird weggelassen: ') + W.weg.map(esc).join(', '));
    $('#wortInfo').innerHTML = z.join(' · ');
    $('#wortZaehler').textContent = W.gut.length ? String(W.gut.length) : '';
    var fehlt = !W.gut.length ? tx('Gib links einige Wörter ein oder lass sie zum Thema vorschlagen.') : !o.schreib ? tx('Wähle links, ob die Schüttelwörter klein oder GROSS geschrieben sind.') : '';
    ['#swPdf', '#swHerunterladen', '#swZeigeLoesung', '#swNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ R = null; $('#swSeiten').innerHTML = ''; $('#swLoesung').parentNode.hidden = true; meldung('info', '<p>' + fehlt + '</p>'); return; }
    meldung(''); $('#swLoesung').parentNode.hidden = false;
    var rnd = Kern.zufall(st.seed), nicht = [];
    R = W.gut.map(function(w){
      var loes = o.schreib === 'gross' ? w.toLocaleUpperCase('de-CH') : w;
      var teile = Kern.teile(loes).map(function(p){
        if (!p.wort) return p;
        var b = Array.from(schreib(p.t)), s = Kern.schuetteln(b, rnd, o.erster);
        if (!s.ok) nicht.push(w);
        return { wort:true, t:p.t, b:s.b };
      });
      return { loesung:loes, teile:teile };
    });
    if (nicht.length) z.push(tx('Lässt sich nicht schütteln (alle Buchstaben gleich oder zu kurz): ') + nicht.map(esc).join(', '));
    $('#wortInfo').innerHTML = z.join(' · ');
    // Breiten grob schätzen (px): Kärtchen 25, Buchstaben 17, Kästchen 33, Lücke 14; Platz auf dem Blatt 636 px
    var proB = o.karten ? 25 : 17;
    function breite(e, je){ return e.teile.reduce(function(a, p){ return a + (p.wort ? p.b.length * je : 14); }, 0); }
    var maxC = Math.max.apply(null, R.map(function(e){ return breite(e, proB); })), maxK = Math.max.apply(null, R.map(function(e){ return breite(e, 33); }));
    // raster: Nummer | Schüttelwort | Pfeil | Kästchen in einer Zeile, alle Kästchen beginnen an derselben Stelle
    // stapel: Kästchen unter dem Schüttelwort (für lange Wörter) · zwei / eins: ohne Kästchen, mit Schreiblinie
    var art = o.kaestchen ? (34 + maxC + 8 + 26 + maxK <= 636 ? 'raster' : 'stapel') : (34 + maxC + 80 <= 300 ? 'zwei' : 'eins');
    function hoehe(e, i){
      if (art === 'raster') return 52;
      if (art === 'stapel') return 86 + 42 * Math.floor(breite(e, 33) / 600);
      if (art === 'zwei') return i % 2 ? 0 : 46;
      return 46;
    }
    var seiten = [[]], h = o.anleitungAn ? 150 : 100, MAXH = 980;
    R.forEach(function(e, i){
      var hh = hoehe(e, i);
      if (h + hh > MAXH){ seiten.push([]); h = 40; }
      seiten[seiten.length - 1].push(i); h += hh;
    });
    var anleitung = tx('Die Buchstaben sind durcheinandergeschüttelt. Welches Wort steckt dahinter?') + (o.kaestchen ? tx(' Schreibe es in die Kästchen.') : tx(' Schreibe es auf.')) + (o.erster ? tx(' Der erste Buchstabe stimmt schon.') : '');
    var titel = st.titel.trim(), html = '';
    seiten.forEach(function(nr, si){
      var kopf = si === 0 ? (o.titelAn ? '<h2>' + esc(titel ? tx('Schüttelwörter: ') + titel : tx('Schüttelwörter')) + '</h2>' : '') + (o.anleitungAn ? '<p class="sw-anleitung">' + esc(anleitung) + '</p>' : '')
        : tx('<p class="sw-seitenkopf">Schüttelwörter – Seite ') + (si + 1) + tx(' von ') + seiten.length + '</p>';
      html += '<div class="sw-rahmen"><article class="sw-blatt sw-seite"><div>' + kopf + '</div><ol class="sw-liste sw-' + art + '" style="--sw-sp:' + (maxC + 8) + 'px">' +
        nr.map(function(i){ return zeile(R[i], false, i + 1); }).join('') + '</ol></article></div>';
    });
    $('#swSeiten').innerHTML = html;
    // Lösung: zwei Spalten, wenn die Zeilen schmal genug sind (Lösungskärtchen 21 px, Lösungswort etwa 12 px je Buchstabe)
    var maxL = Math.max.apply(null, R.map(function(e){ return 34 + breite(e, o.karten ? 21 : 15) + 26 + e.loesung.length * 12; }));
    $('#swLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel ? tx('Schüttelwörter: ') + titel + tx(' – Lösung') : tx('Schüttelwörter – Lösung')) + '</h2>' : tx('<p class="sw-anleitung"><b>Lösung</b></p>')) +
      '<ol class="sw-liste sw-loesungen' + (maxL <= 300 ? tx(' sw-zwei') : '') + '">' + R.map(function(e, i){ return zeile(e, true, i + 1); }).join('') + '</ol>';
  }
  // Eine Zeile: Schüttelwort (Kärtchen oder Buchstaben mit Abstand), dann Kästchen, Schreiblinie oder Lösung
  function zeile(e, loesung, nr){
    var o = st.opt, schuettel = e.teile.map(function(p){
      if (!p.wort) return '<span class="sw-luecke">' + (/-/.test(p.t) ? '-' : '') + '</span>';
      return '<span class="sw-teil">' + p.b.map(function(c){ return o.karten ? '<span class="sw-karte">' + esc(c) + '</span>' : '<span class="sw-bst">' + esc(c) + '</span>'; }).join('') + '</span>';
    }).join('');
    var rechts = '';
    if (loesung) rechts = '<span class="sw-pfeil" aria-hidden="true">→</span><b class="sw-loesung">' + esc(e.loesung) + '</b>';
    else if (o.kaestchen) rechts = '<span class="sw-pfeil" aria-hidden="true">→</span><span class="sw-felder">' + e.teile.map(function(p){
      return p.wort ? '<span class="sw-teil">' + Array.from(p.t).map(function(){ return '<span class="sw-kaestchen"></span>'; }).join('') + '</span>' : '<span class="sw-luecke">' + (/-/.test(p.t) ? '-' : '') + '</span>';
    }).join('') + '</span>';
    else rechts = '<span class="sw-linie"></span>';
    return '<li class="sw-zeile"><span class="sw-nr">' + nr + '.</span><span class="sw-schuettel">' + schuettel + '</span>' + rechts + '</li>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#swSeiten .sw-blatt')).concat(st.opt.mitLoesung ? [$('#swLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#swPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Schuettelwoerter', st.titel) }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#swPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#swHerunterladen').hidden = false; });
  }
  $('#swHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Schuettelwoerter', st.titel).replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Schüttelwörter'), inhalt, '.sw-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  ww.zeichne();
  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
