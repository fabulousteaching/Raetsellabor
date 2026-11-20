/* Rätsellabor – Generator «Richtungs-Suchsel»
   Ein Satz steht immer wieder im Buchstabenfeld – Satz an Satz wie eine Schlange. Jeder Satz läuft gerade in eine
   Richtung (→ ← ↑ ↓); der nächste beginnt direkt neben dem letzten Buchstaben. Die Richtungen der Sätze der Reihe nach
   ergeben den Code für ein Richtungsschloss. Weil jede Richtung ein ganzer Satz ist, gehen auch gleiche Richtungen
   hintereinander (→ →) und Umkehrungen (→ ←). Übrige Felder: Füllbuchstaben, ohne dass der Satz zufällig noch einmal
   entsteht. Feld mit gemeinsam/gitter.js (Zeichnen, Markieren am Bildschirm). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var RICHTUNG = { R:[0, 1], D:[1, 0], L:[0, -1], U:[-1, 0] };
  var PFEIL = { R:'→', D:'↓', L:'←', U:'↑' };
  var NAME = { R:'rechts', D:'unten', L:'links', U:'oben' };
  var HAEUFIG = { E:17, N:10, I:8, S:7, R:7, A:6.5, T:6, D:5, H:4.8, U:4.2, L:3.4, C:3, G:3, M:2.5, O:2.5, B:1.9, W:1.9, F:1.7, K:1.2, Z:1.1, P:0.8, V:0.7, J:0.3, Y:0.1, X:0.1, Q:0.05 };
  // Satz → Grossbuchstaben (Umlaute bleiben, ß wird SS) und Ziffern, ohne Abstände und Satzzeichen
  function buchstaben(text){ return Array.from(String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/[^A-ZÄÖÜ0-9]/g, '')); }
  /* Schlange legen: Code-Schritt i = ein ganzer Satz (n Felder) gerade in Richtung code[i]. Der erste beginnt bei (0,0),
     jeder weitere direkt neben dem letzten Buchstaben des vorigen: in seiner Richtung weiter (bevorzugt) oder seitlich
     daneben. Gesucht wird die Lage mit dem kleinsten umgebenden Rechteck (höchstens maxB × maxH).
     → { laeufe:[{ start:[r,c], d, code }], minR, minC, breite, hoehe } oder null */
  function schlange(n, code, rnd, maxB, maxH){
    var besetzt = {}, laeufe = [], best = null, schritte = 0;
    function k(r, c){ return r + ',' + c; }
    function frei(r, c, d){ for (var i = 0; i < n; i++) if (besetzt[k(r + d[0] * i, c + d[1] * i)]) return false; return true; }
    function setzen(r, c, d, an){ for (var i = 0; i < n; i++){ var x = k(r + d[0] * i, c + d[1] * i); if (an) besetzt[x] = 1; else delete besetzt[x]; } }
    function suche(i, minR, maxR, minC, maxC, umweg){
      if (++schritte > 300000) return;
      var b = maxC - minC + 1, h = maxR - minR + 1;
      if (i && (b > maxB || h > maxH)) return;
      var wert = (i ? b * h : 0) * 100 + umweg;
      if (best && wert >= best.wert) return;   // das Rechteck wird nur grösser
      if (i === code.length){ best = { wert:wert, laeufe:laeufe.map(function(l){ return { start:l.start.slice(), d:l.d, code:l.code }; }), minR:minR, minC:minC, breite:b, hoehe:h }; return; }
      var d = RICHTUNG[code[i]], wahl;
      if (!i) wahl = [[0, 0, 0]];
      else {
        var l = laeufe[i - 1], e = [l.start[0] + l.d[0] * (n - 1), l.start[1] + l.d[1] * (n - 1)];
        var quer = d[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
        if (rnd() < 0.5) quer.reverse();
        wahl = [[e[0] + d[0], e[1] + d[1], 0]].concat(quer.map(function(q){ return [e[0] + q[0], e[1] + q[1], 1]; }));
      }
      wahl.forEach(function(w){
        if (!frei(w[0], w[1], d)) return;
        var ende = [w[0] + d[0] * (n - 1), w[1] + d[1] * (n - 1)];
        setzen(w[0], w[1], d, true); laeufe.push({ start:[w[0], w[1]], d:d, code:code[i] });
        suche(i + 1, Math.min(minR, w[0], ende[0]), Math.max(maxR, w[0], ende[0]), Math.min(minC, w[1], ende[1]), Math.max(maxC, w[1], ende[1]), umweg + w[2]);
        laeufe.pop(); setzen(w[0], w[1], d, false);
      });
    }
    suche(0, Infinity, -Infinity, Infinity, -Infinity, 0);
    return best;
  }
  // Wo steht der Satz im Feld (waagrecht und senkrecht, vorwärts und rückwärts)? → Liste von Zell-Listen
  function vorkommen(g, satz){
    var aus = [], H = g.length, B = g[0].length, n = satz.length;
    for (var r = 0; r < H; r++) for (var c = 0; c < B; c++) for (var key in RICHTUNG){
      var d = RICHTUNG[key], er = r + d[0] * (n - 1), ec = c + d[1] * (n - 1);
      if (er < 0 || er >= H || ec < 0 || ec >= B) continue;
      var ok = true, z = [];
      for (var i = 0; i < n && ok; i++){ if (g[r + d[0] * i][c + d[1] * i] !== satz[i]) ok = false; else z.push([r + d[0] * i, c + d[1] * i]); }
      if (ok) aus.push(z);
    }
    return aus;
  }
  /* Ganzes Feld: Schlange mit Rand (1–3 Felder, mindestens 10 × 10), Füllbuchstaben (zufällig wie im Deutschen oder aus
     dem Satz); zufällige zweite Vorkommen des Satzes werden aufgelöst.
     → { zeilen, spalten, gitter, woerter:[{ text, b, zellen, code }], start } oder { fehler } */
  function erstelle(text, code, o){
    var satz = buchstaben(text), n = satz.length, rnd = o.rnd || Math.random;
    if (n < 3) return { fehler:'kurz' };
    if (satz.join('') === satz.slice().reverse().join('')) return { fehler:'palindrom' };
    if (!code.length) return { fehler:'code' };
    var maxB = (o.maxB || 30) - 2, maxH = (o.maxH || 38) - 2;
    var S = schlange(n, code, rnd, maxB, maxH);
    if (!S) return { fehler:'gross', n:n };
    // Rand: je Seite 1–3 Felder, aber nie über die Höchstgrösse; mindestens 10 × 10
    function rand(innen, max){
      var a = 1 + Math.floor(rnd() * 3), b = 1 + Math.floor(rnd() * 3);
      while (innen + a + b > max && (a > 1 || b > 1)){ if (a >= b) a--; else b--; }
      while (innen + a + b < 10) b++;
      return [a, innen + a + b];
    }
    var rs = rand(S.breite, o.maxB || 30), rz = rand(S.hoehe, o.maxH || 38), links = rs[0], spalten = rs[1], oben = rz[0], zeilen = rz[1];
    var g = [], pfad = {}, r, c;
    for (r = 0; r < zeilen; r++) g.push(new Array(spalten).fill(''));
    var woerter = S.laeufe.map(function(l){
      var zellen = [];
      for (var i = 0; i < n; i++){ var rr = l.start[0] - S.minR + oben + l.d[0] * i, cc = l.start[1] - S.minC + links + l.d[1] * i; g[rr][cc] = satz[i]; pfad[rr + ',' + cc] = 1; zellen.push([rr, cc]); }
      return { text:satz.join(''), b:satz, zellen:zellen, code:l.code };
    });
    // Füllbuchstaben
    var pool = [], gew = [];
    if (o.ausSatz){ satz.forEach(function(ch){ pool.push(ch); gew.push(1); }); }
    else Object.keys(HAEUFIG).forEach(function(ch){ pool.push(ch); gew.push(HAEUFIG[ch]); });
    var summe = gew.reduce(function(a, b){ return a + b; }, 0);
    function fueller(){ var x = rnd() * summe; for (var i = 0; i < pool.length; i++){ x -= gew[i]; if (x <= 0) return pool[i]; } return pool[0]; }
    for (r = 0; r < zeilen; r++) for (c = 0; c < spalten; c++) if (!g[r][c]) g[r][c] = fueller();
    // Zweite Vorkommen des Satzes auflösen (nur Füllfelder ändern)
    var eigen = {}; woerter.forEach(function(w){ eigen[w.zellen.map(String).join(';')] = 1; eigen[w.zellen.slice().reverse().map(String).join(';')] = 1; });
    for (var runde = 0; runde < 400; runde++){
      var fremd = vorkommen(g, satz).filter(function(z){ return !eigen[z.map(String).join(';')]; });
      if (!fremd.length) break;
      fremd.forEach(function(z){
        var frei = z.filter(function(rc){ return !pfad[rc[0] + ',' + rc[1]]; });
        if (!frei.length) return;
        var rc = frei[Math.floor(rnd() * frei.length)], alt = g[rc[0]][rc[1]];
        for (var t = 0; t < 12 && g[rc[0]][rc[1]] === alt; t++) g[rc[0]][rc[1]] = o.ausSatz && t > 6 ? Object.keys(HAEUFIG)[Math.floor(rnd() * 26)] : fueller();
      });
    }
    var rest = vorkommen(g, satz).filter(function(z){ return !eigen[z.map(String).join(';')]; }).length;
    return { zeilen:zeilen, spalten:spalten, gitter:g, woerter:woerter, start:woerter[0].zellen[0], doppelt:rest, code:code.slice() };
  }
  return { zufall:zufall, RICHTUNG:RICHTUNG, PFEIL:PFEIL, NAME:NAME, buchstaben:buchstaben, schlange:schlange, vorkommen:vorkommen, erstelle:erstelle };
})();
/* KERN-ENDE */

var MAXCODE = 12;
function esc(t){ return Labor.esc(t); }

var VORLAGE = '<div class="rs">' +
  '<header class="rs-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Richtungs-Suchsel</h1>' +
    '<p>Ein Satz steht immer wieder im Buchstabenfeld – Satz an Satz wie eine Schlange. In welche Richtung läuft jeder Satz? Das ist der Code für das Richtungsschloss.</p></header>' +
  '<div class="rs-layout"><section class="rs-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Satz</h2><p>Er wiederholt sich in der Schlange – kurze Sätze geben ein handliches Feld.</p></div></div>' +
      '<label class="feld-label" for="rsSatz">Satz</label>' +
      '<textarea id="rsSatz" class="rs-text" rows="2" maxlength="40" spellcheck="true"></textarea>' +
      '<p class="hinweis" id="rsSatzInfo"></p>' +
    '</div>' +
    '<div class="karte" id="rsCodeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Richtungscode</h2><p>So, wie man das Richtungsschloss öffnet – bis ' + MAXCODE + ' Richtungen.</p></div></div>' +
      '<div class="rs-steuer"><div class="rs-kreuz" role="group" aria-label="Richtung anhängen">' +
        [['U', 'oben'], ['L', 'links'], ['R', 'rechts'], ['D', 'unten']].map(function(x){ return '<button type="button" class="rs-pfeil rs-' + x[0] + '" data-r="' + x[0] + '" aria-label="' + x[1] + '">' + { U:'↑', L:'←', R:'→', D:'↓' }[x[0]] + '</button>'; }).join('') +
      '</div><div class="rs-codefeld"><div class="rs-codeliste" id="rsCode" aria-live="polite"></div>' +
        '<div class="rs-codeknoepfe"><button type="button" class="btn klein" id="rsZurueck">⌫ Letzte löschen</button><button type="button" class="btn klein" id="rsLeeren">Alle löschen</button></div></div></div>' +
      '<p class="hinweis">Tipp: Mit den Pfeiltasten der Tastatur geht es auch, wenn ein Pfeilknopf ausgewählt ist.</p>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<label class="opt"><input type="checkbox" id="rsSatzZeigen"><span>Satz auf dem Blatt nennen</span></label>' +
      '<label class="opt"><input type="checkbox" id="rsStart"><span>Anfang der Schlange mit einem Kreis zeigen</span></label>' +
      '<label class="opt"><input type="checkbox" id="rsAusSatz"><span>Füllbuchstaben nur aus dem Satz (schwieriger)</span></label>' +
      '<label class="opt"><input type="checkbox" id="rsLinien"><span>Gitterlinien zeichnen</span></label>' +
    '</details></div>' +
  '</section>' +
  '<section class="rs-ausgabe" aria-label="Ergebnis">' +
    '<div id="rsMeldung" aria-live="polite"></div>' +
    '<div class="rs-werkzeug" id="rsWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="rsZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="rsNeu" title="Andere Lage und andere Füllbuchstaben">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="rsMarkWeg">Markierungen löschen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="rsMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="rsPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="rsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="rs-blatt" id="rsBlatt" hidden></article>' +
    '<article class="rs-blatt rs-loesungsblatt" id="rsLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 7h8v5H9v5h8" stroke-width="2.6" opacity=".55"/><path d="M15 15l2 2-2 2"/></svg>';

Labor.registriere({
  id:'richtungssuchsel',
  titel:'Richtungs-Suchsel',
  kurz:'Ein Satz als Schlange im Buchstabenfeld – ihre Richtungen öffnen das Schloss',
  beschreibung:'Ein Satz steht immer wieder im Feld, Satz an Satz wie eine Schlange. Die Richtung jedes Satzes (rechts, unten, links, oben) ergibt den Code für ein Richtungsschloss. Code mit Pfeilknöpfen eingeben. Mit Lösungsblatt.',
  merkmale:['Code mit Pfeilknöpfen', 'Für Richtungsschlösser', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/richtungssuchsel/richtungssuchsel.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'richtungssuchsel-eingaben', OPT = 'richtungssuchsel-einstellungen';
  var STANDARD = { satzZeigen:true, start:true, ausSatz:false, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', code:[], seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.code = (e.code || []).filter(function(c){ return Kern.RICHTUNG[c]; }).slice(0, MAXCODE); st.seed = +e.seed || st.seed; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#rsMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  var warte = 0;
  $('#rsSatz').value = st.satz;
  $('#rsSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); clearTimeout(warte); warte = setTimeout(erstellen, 250); });
  // Richtungscode: Pfeilknöpfe hängen an, Pfeiltasten auch
  function anhaengen(r){ if (st.code.length >= MAXCODE) return; st.code.push(r); speichern(); erstellen(); }
  [].forEach.call(bereich.querySelectorAll('.rs-pfeil'), function(k){
    k.addEventListener('click', function(){ anhaengen(k.dataset.r); });
    k.addEventListener('keydown', function(ev){
      var r = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R' }[ev.key];
      if (r){ ev.preventDefault(); anhaengen(r); var z = bereich.querySelector('.rs-pfeil.rs-' + r); if (z) z.focus(); }
    });
  });
  $('#rsZurueck').addEventListener('click', function(){ st.code.pop(); speichern(); erstellen(); });
  $('#rsLeeren').addEventListener('click', function(){ st.code = []; speichern(); erstellen(); });
  [['#rsSatzZeigen', 'satzZeigen', 'zeigen'], ['#rsStart', 'start', 'zeigen'], ['#rsAusSatz', 'ausSatz', 'neu'], ['#rsLinien', 'linien', 'zeigen'], ['#rsMitLoesung', 'mitLoesung', '']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[2] === 'neu') erstellen(); else if (x[2] === 'zeigen' && F) anzeigen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); if (F) anzeigen(); });
  $('#rsZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#rsBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#rsNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#rsMarkWeg').addEventListener('click', function(){ if (F){ gefunden = {}; anzeigen(); } });

  /* ---------- Erstellen ---------- */
  var F = null, gefunden = {};
  function codeZeigen(){
    $('#rsCode').innerHTML = st.code.length ? st.code.map(function(r, i){ return '<span class="rs-chip"><small>' + (i + 1) + '</small>' + Kern.PFEIL[r] + '</span>'; }).join('')
      : '<span class="rs-leer">Noch keine Richtung – tippe auf die Pfeile.</span>';
    $('#rsZurueck').disabled = $('#rsLeeren').disabled = !st.code.length;
    [].forEach.call(bereich.querySelectorAll('.rs-pfeil'), function(k){ k.disabled = st.code.length >= MAXCODE; });
  }
  function erstellen(){
    if (aus) return;
    var satz = Kern.buchstaben(st.satz);
    $('#rsSatzInfo').textContent = satz.length ? satz.length + ' Buchstaben' + (satz.length > 20 ? ' – ein kürzerer Satz gibt ein kleineres Feld' : '') : '';
    $('#rsCodeKarte').hidden = satz.length < 3;
    codeZeigen();
    F = null; gefunden = {};
    function nichts(art, html){ $('#rsBlatt').hidden = true; $('#rsWerkzeug').hidden = true; $('#rsLoesung').innerHTML = ''; meldung(art, html); }
    if (satz.length < 3) return nichts('info', '<p>Schreib links zuerst den Satz, der sich in der Schlange wiederholt (mindestens 3 Buchstaben). Dann gibst du den Richtungscode ein.</p>');
    if (!st.code.length) return nichts('info', '<p>Gib jetzt mit den Pfeilknöpfen den Richtungscode ein – zum Beispiel → ↓ ← ↓.</p>');
    var r = Kern.erstelle(st.satz, st.code, { rnd:Kern.zufall(st.seed), ausSatz:st.opt.ausSatz, maxB:30, maxH:38 });
    if (r.fehler === 'palindrom') return nichts('fehler', '<h3>Der Satz ist vorwärts und rückwärts gleich</h3><p>Dann sieht man nicht, in welche Richtung er läuft. Nimm einen anderen Satz.</p>');
    if (r.fehler === 'gross'){
      // Wie lang dürfte der Satz sein?
      var max = 0; for (var n = satz.length - 1; n >= 3; n--){ if (Kern.schlange(n, st.code, Math.random, 28, 36)){ max = n; break; } }
      return nichts('fehler', '<h3>Das Feld würde zu gross</h3><p>' + st.code.length + ' Sätze mit je ' + satz.length + ' Buchstaben passen nicht in ein Feld von höchstens 30 × 38 Buchstaben.' +
        (max ? ' Mit diesem Code geht ein Satz mit höchstens ' + max + ' Buchstaben.' : '') + ' Nimm einen kürzeren Satz oder weniger Richtungen.</p>');
    }
    F = r;
    anzeigen();
    meldung(r.doppelt ? 'warnung' : 'erfolg', '<p><b>Fertig!</b> Feld mit ' + r.spalten + ' × ' + r.zeilen + ' Buchstaben, die Schlange besteht aus ' + r.woerter.length + (r.woerter.length === 1 ? ' Satz' : ' Sätzen') +
      '. Code: <b class="rs-codetext">' + st.code.map(function(c){ return Kern.PFEIL[c]; }).join(' ') + '</b>. Du kannst die Sätze direkt im Feld markieren.</p>' +
      (r.doppelt ? '<p>Achtung: Der Satz steht noch ' + r.doppelt + '-mal zufällig im Feld. «Neu mischen» hilft.</p>' : ''));
  }

  /* ---------- Anzeige ---------- */
  function kreis(svg, rc){
    var NS = 'http://www.w3.org/2000/svg', c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', rc[1] * 10 + 5); c.setAttribute('cy', rc[0] * 10 + 5); c.setAttribute('r', 4.6); c.setAttribute('class', 'rs-start');
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#C2410C'); c.setAttribute('stroke-width', '0.9');
    svg.appendChild(c);
  }
  // Lösung: Nummer am Anfang jedes Satzes und ein Pfeil am Ende
  function nummern(svg){
    var NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rs-nummern');
    F.woerter.forEach(function(w, i){
      var a = w.zellen[0], z = w.zellen[w.zellen.length - 1], d = Kern.RICHTUNG[w.code];
      // Nummer klein in der Ecke des ersten Feldes (der Buchstabe bleibt lesbar)
      var x = a[1] * 10 + 1.9, y = a[0] * 10 + 1.9, k = document.createElementNS(NS, 'circle');
      k.setAttribute('cx', x); k.setAttribute('cy', y); k.setAttribute('r', 1.75); k.setAttribute('fill', '#1C1714'); g.appendChild(k);
      var t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y + 0.1); t.setAttribute('class', 'rs-nr'); t.textContent = i + 1; g.appendChild(t);
      var ex = z[1] * 10 + 5 + d[1] * 5.6, ey = z[0] * 10 + 5 + d[0] * 5.6, p = document.createElementNS(NS, 'path');
      // Pfeilspitze in Laufrichtung, knapp hinter dem letzten Buchstaben
      var qx = -d[0], qy = d[1];
      p.setAttribute('d', 'M' + (ex + d[1] * 1.8) + ' ' + (ey + d[0] * 1.8) + 'L' + (ex + qx * 1.5) + ' ' + (ey + qy * 1.5) + 'L' + (ex - qx * 1.5) + ' ' + (ey - qy * 1.5) + 'Z');
      p.setAttribute('fill', '#1C1714'); g.appendChild(p);
    });
    svg.appendChild(g);
  }
  function blattHtml(art){
    var o = st.opt, satz = Kern.buchstaben(st.satz).join(''), n = F.woerter.length;
    var html = o.titelAn || art === 'loesung' ? '<h2>' + (art === 'loesung' ? 'Richtungs-Suchsel – Lösung' : 'Richtungs-Suchsel') + '</h2>' : '';
    if (art === 'spiel' && o.anleitungAn){
      html += '<p class="rs-anleitung">' + (o.satzZeigen ? 'Der Satz <b>«' + esc(satz) + '»</b> steht' : 'Ein Satz steht') + ' immer wieder im Feld – Satz an Satz, wie eine Schlange. ' +
        (o.start ? 'Beginne beim Kreis. ' : '') + 'Wo ein Satz aufhört, beginnt der nächste direkt daneben. Markiere die ' + n + ' Sätze der Reihe nach und schreibe für jeden auf, in welche Richtung er läuft: → ← ↑ ↓. ' +
        'Das ist der Code für das Richtungsschloss.</p>';
    }
    html += '<div class="rs-gitter"></div>';
    html += '<div class="rs-codebox"><p>Code für das Richtungsschloss</p><div class="rs-kaestchen">' + F.code.map(function(c, i){
      return '<span class="rs-k"><small>' + (i + 1) + '</small><b>' + (art === 'loesung' ? Kern.PFEIL[c] : '') + '</b></span>'; }).join('') + '</div></div>';
    if (art === 'loesung') html += '<p class="rs-anleitung">Satz: <b>' + esc(satz) + '</b> · Code: ' + F.code.map(function(c){ return Kern.NAME[c]; }).join(', ') + '</p>';
    if (art === 'spiel') html += '<p class="rs-fortschritt nur-bildschirm" id="rsFortschritt" aria-live="polite"></p>';
    return html;
  }
  function anzeigen(){
    var blatt = $('#rsBlatt'), loes = $('#rsLoesung');
    blatt.innerHTML = blattHtml('spiel'); loes.innerHTML = blattHtml('loesung');
    var svg = Gitter.svg(F, { spiel:true, linien:st.opt.linien });
    if (st.opt.start) kreis(svg, F.start);
    blatt.querySelector('.rs-gitter').appendChild(svg);
    var svgL = Gitter.svg(F, { linien:st.opt.linien });
    nummern(svgL);
    loes.querySelector('.rs-gitter').appendChild(svgL);
    Gitter.spiel(svg, F, { gefunden:gefunden, treffer:function(){ fortschritt(); if (Object.keys(gefunden).length === F.woerter.length){ blatt.classList.remove('geschafft'); void blatt.offsetWidth; blatt.classList.add('geschafft'); } } });
    blatt.hidden = false; $('#rsWerkzeug').hidden = false;
    blatt.classList.toggle('zeige-loesung', $('#rsZeigeLoesung').getAttribute('aria-pressed') === 'true');
    fortschritt();
  }
  function fortschritt(){
    var p = $('#rsFortschritt'); if (!p || !F) return;
    var n = Object.keys(gefunden).length;
    p.className = 'rs-fortschritt nur-bildschirm' + (n === F.woerter.length ? ' fertig' : '');
    p.textContent = n === F.woerter.length ? '🎉 Alle ' + n + ' Sätze gefunden! Jetzt die Richtungen der Reihe nach aufschreiben.' : n + ' von ' + F.woerter.length + ' Sätzen gefunden.';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#rsBlatt')].concat(st.opt.mitLoesung ? [$('#rsLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function dateiname(){ return Labor.pdfName('Richtungs-Suchsel', Kern.buchstaben(st.satz).slice(0, 20).join('')); }
  Labor.pdfKnopf($('#rsPdf'), function(){ return F && { blaetter:blaetter(), name:dateiname() }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rsPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rsHerunterladen').hidden = false; });
  }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung', 'geschafft');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .ebene-markiert, .ebene-auswahl'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#rsHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !F) return;
    var inhalt = sauber($('#rsBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#rsLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:dateiname().replace(/\.pdf$/, '.html'), data:Labor.blattDatei('Richtungs-Suchsel', inhalt, '.rs-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  erstellen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
