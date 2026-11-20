/* Rätsellabor – Generator «Richtungs-Suchsel»
   Ein Satz steht immer wieder im Buchstabenfeld und bildet eine Schlange. Standard: Der Satz läuft durchgehend weiter
   und biegt um Ecken; jedes gerade Stück der Schlange zeigt eine Richtung (→ ← ↑ ↓), der Reihe nach ergeben sie den Code
   für ein Richtungsschloss. Weil die Schlange bei jeder neuen Richtung abbiegt, folgt auf → oder ← immer ↑ oder ↓.
   Für Codes mit gleichen Richtungen hintereinander (→ →) oder Umkehr (→ ←): jedes Stück ein ganzer, gerader Satz, der
   nächste beginnt direkt daneben (grösseres Feld). Füllbuchstaben ohne falsche Fortsetzung neben der Schlange.
   Feld mit gemeinsam/gitter.js (Zeichnen, Markieren am Bildschirm). */
(function(){
'use strict';
var tx = Labor.uebersetzer('richtungssuchsel');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var RICHTUNG = { R:[0, 1], D:[1, 0], L:[0, -1], U:[-1, 0] };
  var PFEIL = { R:'→', D:'↓', L:'←', U:'↑' };
  var NAME = { R:'rechts', D:'unten', L:'links', U:'oben' };
  // Füllbuchstaben wie in der Sprache der Seite (Deutsch, Englisch, Französisch)
  var SPRACHE = (typeof Labor !== 'undefined' && Labor.sprache) || 'de';
  var HAEUFIG = SPRACHE === 'en' ? { E:12.7, T:9.1, A:8.2, O:7.5, I:7, N:6.7, S:6.3, H:6.1, R:6, D:4.3, L:4, C:2.8, U:2.8, M:2.4, W:2.4, F:2.2, G:2, Y:2, P:1.9, B:1.5, V:1, K:0.8, J:0.15, X:0.15, Q:0.1, Z:0.07 }
    : SPRACHE === 'fr' ? { E:14.7, S:7.9, A:7.6, I:7.5, T:7.2, N:7.1, R:6.6, U:6.3, O:5.8, L:5.5, D:3.7, C:3.3, M:3, P:3, V:1.6, Q:1.4, F:1.1, G:1, B:0.9, H:0.7, J:0.6, X:0.4, Y:0.1, Z:0.1, K:0.05, W:0.04 }
    : { E:17, N:10, I:8, S:7, R:7, A:6.5, T:6, D:5, H:4.8, U:4.2, L:3.4, C:3, G:3, M:2.5, O:2.5, B:1.9, W:1.9, F:1.7, K:1.2, Z:1.1, P:0.8, V:0.7, J:0.3, Y:0.1, X:0.1, Q:0.05 };
  // Satz → Grossbuchstaben (Umlaute bleiben, ß wird SS) und Ziffern, ohne Abstände und Satzzeichen
  // andere Akzente fallen weg (É → E, Ç → C, Œ → OE)
  function buchstaben(text){ return Array.from(String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/Œ/g, 'OE').replace(/Æ/g, 'AE')
    .replace(/[^A-ZÄÖÜ0-9]/g, function(c){ var o = c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return /^[A-Z]$/.test(o) ? o : ''; })); }
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
  /* Schlange mit Ecken (Standard): Der Satz läuft durchgehend weiter, auch um die Ecken. Code-Schritt i ist ein gerades
     Stück von m_i Schritten (mindestens 2) in Richtung code[i]; an jeder neuen Richtung biegt die Schlange ab (darum
     nie zweimal dieselbe Richtung und keine Umkehr). Die Schlange endet genau am Ende eines Satzes (R ganze Sätze) und
     berührt sich nirgends selbst (nur aufeinanderfolgende Felder sind Nachbarn) – so ist der Weg immer eindeutig.
     Aus vielen zufälligen Versuchen gewinnt das kleinste umgebende Rechteck (höchstens maxB × maxH).
     → { zellen:[[r,c], …], teile:[{ von, bis, code }], minR, minC, breite, hoehe, R } oder null */
  function abbiegend(code){ for (var i = 1; i < code.length; i++){ var a = RICHTUNG[code[i - 1]], b = RICHTUNG[code[i]]; if (a[0] * b[0] + a[1] * b[1] !== 0) return i; } return 0; }
  function eckSchlange(n, code, rnd, maxB, maxH){
    var k = code.length, MIN = 2, MAX = Math.max(7, Math.min(Math.max(maxB, maxH) - 1, Math.ceil((n - 1) / k) + 3)), best = null;
    if (abbiegend(code)) return null;
    for (var R = 1; R <= 40 && !best; R++){
      var gesamt = R * n - 1;   // Schritte; Felder = R · n
      if (gesamt < k * MIN) continue;
      if (gesamt > k * MAX) break;
      for (var versuch = 0; versuch < 120; versuch++){
        var zellen = [[0, 0]], besetzt = { '0,0':0 }, teile = [], knoten = 0, box = [0, 0, 0, 0];   // minR, maxR, minC, maxC
        var geht = function(q, p){
          if (besetzt[q[0] + ',' + q[1]] !== undefined) return false;
          // keine Berührung: ausser dem Vorgänger kein Nachbar auf der Schlange
          for (var key in RICHTUNG){ var d = RICHTUNG[key], nb = (q[0] + d[0]) + ',' + (q[1] + d[1]); if (besetzt[nb] !== undefined && nb !== p[0] + ',' + p[1]) return false; }
          return true;
        };
        var lege = function(i, rest){
          if (++knoten > 3000) return false;
          if (i === k) return rest === 0;
          var d = RICHTUNG[code[i]], lo = Math.max(MIN, rest - (k - 1 - i) * MAX), hi = Math.min(MAX, rest - (k - 1 - i) * MIN), wahl = [];
          for (var m = lo; m <= hi; m++) wahl.push(m);
          for (var x = wahl.length - 1; x > 0; x--){ var y = Math.floor(rnd() * (x + 1)), h = wahl[x]; wahl[x] = wahl[y]; wahl[y] = h; }
          for (var w = 0; w < wahl.length; w++){
            var m2 = wahl[w], start = zellen.length - 1, ok = true, alt = box.slice(), neu = [];
            for (var s2 = 1; s2 <= m2 && ok; s2++){
              var p = zellen[zellen.length - 1], q = [p[0] + d[0], p[1] + d[1]];
              if (!geht(q, p)){ ok = false; break; }
              box = [Math.min(box[0], q[0]), Math.max(box[1], q[0]), Math.min(box[2], q[1]), Math.max(box[3], q[1])];
              if (box[1] - box[0] + 1 > maxH || box[3] - box[2] + 1 > maxB){ ok = false; break; }
              besetzt[q[0] + ',' + q[1]] = zellen.length; zellen.push(q); neu.push(q);
            }
            if (ok){ teile.push({ von:start, bis:zellen.length - 1, code:code[i] }); if (lege(i + 1, rest - m2)) return true; teile.pop(); }
            neu.forEach(function(q2){ delete besetzt[q2[0] + ',' + q2[1]]; zellen.pop(); });
            box = alt;
          }
          return false;
        };
        if (!lege(0, gesamt)) continue;
        var flaeche = (box[1] - box[0] + 1) * (box[3] - box[2] + 1);
        if (!best || flaeche < best.flaeche) best = { flaeche:flaeche, zellen:zellen.map(function(z){ return z.slice(); }), teile:teile.slice(), minR:box[0], minC:box[2], breite:box[3] - box[2] + 1, hoehe:box[1] - box[0] + 1, R:R };
      }
    }
    return best;
  }
  /* Ganzes Feld: Schlange mit Rand (1–3 Felder, mindestens 10 × 10), Füllbuchstaben (zufällig wie im Deutschen oder aus
     dem Satz). Ein Füllbuchstabe neben der Schlange ist nie der nächste oder vorige Buchstabe des Satzes (sonst gäbe es
     eine falsche Fortsetzung); zufällige gerade Vorkommen des Satzes werden aufgelöst.
     o.gerade: jedes Stück ein ganzer, gerader Satz (für gleiche Richtungen hintereinander und Umkehr), sonst mit Ecken.
     → { zeilen, spalten, gitter, woerter:[{ text, b, zellen, code }] (die geraden Stücke), start, pfad, R } oder { fehler } */
  function erstelle(text, code, o){
    var satz = buchstaben(text), n = satz.length, rnd = o.rnd || Math.random;
    if (n < 3) return { fehler:'kurz' };
    if (!code.length) return { fehler:'code' };
    if (o.gerade && satz.join('') === satz.slice().reverse().join('')) return { fehler:'palindrom' };
    if (!o.gerade && abbiegend(code)) return { fehler:'abbiegen', stelle:abbiegend(code) };
    var maxB = (o.maxB || 30) - 2, maxH = (o.maxH || 38) - 2, S, pfadZellen = [], teile = [];
    if (o.gerade){
      S = schlange(n, code, rnd, maxB, maxH);
      if (!S) return { fehler:'gross', n:n };
      S.laeufe.forEach(function(l){
        var von = pfadZellen.length;
        for (var i = 0; i < n; i++) pfadZellen.push([l.start[0] + l.d[0] * i, l.start[1] + l.d[1] * i]);
        teile.push({ von:von, bis:pfadZellen.length - 1, code:l.code });
      });
      S.R = code.length;
    } else {
      S = eckSchlange(n, code, rnd, maxB, maxH);
      if (!S) return { fehler:'gross', n:n };
      pfadZellen = S.zellen; teile = S.teile;
    }
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
    var zellen = pfadZellen.map(function(z, j){
      var rr = z[0] - S.minR + oben, cc = z[1] - S.minC + links;
      g[rr][cc] = satz[j % n]; pfad[rr + ',' + cc] = j;
      return [rr, cc];
    });
    var woerter = teile.map(function(t){
      var zz = zellen.slice(t.von, t.bis + 1);
      return { text:zz.map(function(z){ return g[z[0]][z[1]]; }).join(''), b:zz.map(function(z){ return g[z[0]][z[1]]; }), zellen:zz, code:t.code };
    });
    // Füllbuchstaben; neben der Schlange nie der nächste oder vorige Buchstabe des Satzes
    var alle = Object.keys(HAEUFIG), pool = [], gew = [];
    if (o.ausSatz){ satz.forEach(function(ch){ pool.push(ch); gew.push(1); }); }
    else alle.forEach(function(ch){ pool.push(ch); gew.push(HAEUFIG[ch]); });
    function verboten(rr, cc){
      var v = {};
      for (var key in RICHTUNG){ var d = RICHTUNG[key], j = pfad[(rr + d[0]) + ',' + (cc + d[1])]; if (j !== undefined){ v[satz[(j + 1) % n]] = 1; v[satz[(j - 1 + n) % n]] = 1; } }
      return v;
    }
    function fueller(rr, cc){
      var v = verboten(rr, cc), ps = [], ws = [], summe = 0;
      pool.forEach(function(ch, i){ if (!v[ch]){ ps.push(ch); ws.push(gew[i]); summe += gew[i]; } });
      if (!ps.length){ alle.forEach(function(ch){ if (!v[ch]){ ps.push(ch); ws.push(1); summe += 1; } }); }
      if (!ps.length) return alle[Math.floor(rnd() * alle.length)];
      var x = rnd() * summe; for (var i = 0; i < ps.length; i++){ x -= ws[i]; if (x <= 0) return ps[i]; } return ps[0];
    }
    // wenn es mit den Füllbuchstaben nicht aufgeht: irgendein erlaubter Buchstabe
    function irgendeiner(rr, cc){ var v = verboten(rr, cc), ps = alle.filter(function(ch){ return !v[ch]; }); return ps.length ? ps[Math.floor(rnd() * ps.length)] : alle[0]; }
    for (r = 0; r < zeilen; r++) for (c = 0; c < spalten; c++) if (!g[r][c]) g[r][c] = fueller(r, c);
    // Gerade Vorkommen des Satzes, die nicht ganz auf der Schlange liegen, auflösen (nur Füllfelder ändern)
    function fremde(){ return vorkommen(g, satz).filter(function(z){ return z.some(function(rc){ return pfad[rc[0] + ',' + rc[1]] === undefined; }); }); }
    for (var runde = 0; runde < 400; runde++){
      var fremd = fremde();
      if (!fremd.length) break;
      fremd.forEach(function(z){
        var frei = z.filter(function(rc){ return pfad[rc[0] + ',' + rc[1]] === undefined; });
        var rc = frei[Math.floor(rnd() * frei.length)], alt = g[rc[0]][rc[1]];
        for (var t = 0; t < 16 && g[rc[0]][rc[1]] === alt; t++) g[rc[0]][rc[1]] = t < 6 ? fueller(rc[0], rc[1]) : irgendeiner(rc[0], rc[1]);
      });
    }
    return { zeilen:zeilen, spalten:spalten, gitter:g, woerter:woerter, start:zellen[0], pfad:zellen, R:S.R, doppelt:fremde().length, code:code.slice(), gerade:!!o.gerade };
  }
  return { zufall:zufall, RICHTUNG:RICHTUNG, PFEIL:PFEIL, NAME:NAME, buchstaben:buchstaben, schlange:schlange, eckSchlange:eckSchlange, abbiegend:abbiegend, vorkommen:vorkommen, erstelle:erstelle };
})();
/* KERN-ENDE */

var MAXCODE = 12;
function esc(t){ return Labor.esc(t); }

var VORLAGE = '<div class="rs">' +
  tx('<header class="rs-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Richtungs-Suchsel</h1>') +
    tx('<p>Ein Satz steht immer wieder im Buchstabenfeld – Satz an Satz wie eine Schlange. In welche Richtung läuft jeder Satz? Das ist der Code für das Richtungsschloss.</p></header>') +
  tx('<div class="rs-layout"><section class="rs-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Satz</h2><p>Er wiederholt sich in der Schlange – kurze Sätze geben ein handliches Feld.</p></div></div>') +
      tx('<label class="feld-label" for="rsSatz">Satz</label>') +
      '<textarea id="rsSatz" class="rs-text" rows="2" maxlength="40" spellcheck="true"></textarea>' +
      '<p class="hinweis" id="rsSatzInfo"></p>' +
    '</div>' +
    '<div class="karte" id="rsCodeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>' + tx('Richtungscode') + '</h2><p>' + tx('So, wie man das Richtungsschloss öffnet – bis {n} Richtungen.', { n:MAXCODE }) + '</p></div></div>' +
      tx('<div class="rs-steuer"><div class="rs-kreuz" role="group" aria-label="Richtung anhängen">') +
        [['U', 'oben'], ['L', 'links'], ['R', 'rechts'], ['D', 'unten']].map(function(x){ return '<button type="button" class="rs-pfeil rs-' + x[0] + '" data-r="' + x[0] + '" aria-label="' + tx(x[1]) + '">' + { U:'↑', L:'←', R:'→', D:'↓' }[x[0]] + '</button>'; }).join('') +
      '</div><div class="rs-codefeld"><div class="rs-codeliste" id="rsCode" aria-live="polite"></div>' +
        tx('<div class="rs-codeknoepfe"><button type="button" class="btn klein" id="rsZurueck">⌫ Letzte löschen</button><button type="button" class="btn klein" id="rsLeeren">Alle löschen</button></div></div></div>') +
      '<p class="hinweis" id="rsCodeHinweis"></p>' +
      tx('<label class="opt"><input type="checkbox" id="rsGerade"><span>Gleiche Richtung zweimal hintereinander oder Umkehr erlauben (z. B. → → oder → ←) – jedes Stück ist dann ein ganzer, gerader Satz, das Feld wird grösser</span></label>') +
      tx('<p class="hinweis">Tipp: Mit den Pfeiltasten der Tastatur geht es auch, wenn ein Pfeilknopf ausgewählt ist.</p>') +
    '</div>' +
    tx('<div class="karte"><details class="optionen"><summary>Einstellungen</summary>') +
      tx('<label class="opt"><input type="checkbox" id="rsSatzZeigen"><span>Satz auf dem Blatt nennen</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="rsStart"><span>Anfang der Schlange mit einem Kreis zeigen</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="rsAusSatz"><span>Füllbuchstaben nur aus dem Satz (schwieriger)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="rsLinien"><span>Gitterlinien zeichnen</span></label>') +
    '</details></div>' +
  '</section>' +
  tx('<section class="rs-ausgabe" aria-label="Ergebnis">') +
    '<div id="rsMeldung" aria-live="polite"></div>' +
    '<div class="rs-werkzeug" id="rsWerkzeug" hidden>' +
      tx('<button type="button" class="btn klein" id="rsZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="rsNeu" title="Andere Lage und andere Füllbuchstaben">Neu mischen</button>') +
      tx('<button type="button" class="btn klein" id="rsMarkWeg">Markierungen löschen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="rsMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="rsPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="rsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
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
  var STANDARD = { gerade:false, satzZeigen:true, start:true, ausSatz:false, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
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
  function erlaubt(r){
    if (st.code.length >= MAXCODE) return false;
    if (st.opt.gerade || !st.code.length) return true;
    var a = Kern.RICHTUNG[st.code[st.code.length - 1]], b = Kern.RICHTUNG[r];
    return a[0] * b[0] + a[1] * b[1] === 0;   // die Schlange biegt ab
  }
  function anhaengen(r){ if (!erlaubt(r)) return; st.code.push(r); speichern(); erstellen(); }
  [].forEach.call(bereich.querySelectorAll('.rs-pfeil'), function(k){
    k.addEventListener('click', function(){ anhaengen(k.dataset.r); });
    k.addEventListener('keydown', function(ev){
      var r = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R' }[ev.key];
      if (r){ ev.preventDefault(); anhaengen(r); var z = bereich.querySelector('.rs-pfeil.rs-' + r); if (z) z.focus(); }
    });
  });
  $('#rsZurueck').addEventListener('click', function(){ st.code.pop(); speichern(); erstellen(); });
  $('#rsLeeren').addEventListener('click', function(){ st.code = []; speichern(); erstellen(); });
  [['#rsGerade', 'gerade', 'neu'], ['#rsSatzZeigen', 'satzZeigen', 'zeigen'], ['#rsStart', 'start', 'zeigen'], ['#rsAusSatz', 'ausSatz', 'neu'], ['#rsLinien', 'linien', 'zeigen'], ['#rsMitLoesung', 'mitLoesung', '']].forEach(function(x){
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
      : tx('<span class="rs-leer">Noch keine Richtung – tippe auf die Pfeile.</span>');
    $('#rsZurueck').disabled = $('#rsLeeren').disabled = !st.code.length;
    [].forEach.call(bereich.querySelectorAll('.rs-pfeil'), function(k){ k.disabled = !erlaubt(k.dataset.r); k.title = k.disabled && st.code.length < MAXCODE ? tx('Die Schlange biegt bei jeder neuen Richtung ab') : ''; });
    var letzte = st.code[st.code.length - 1];
    $('#rsCodeHinweis').textContent = st.opt.gerade ? tx('Jede Richtung ist ein ganzer, gerader Satz – auch gleiche Richtungen hintereinander und Umkehr gehen.')
      : tx('Die Schlange biegt bei jeder neuen Richtung ab: nach → oder ← kommt ↑ oder ↓, nach ↑ oder ↓ kommt → oder ←.') + (letzte ? tx(' Jetzt geht ') + (Kern.RICHTUNG[letzte][0] ? tx('→ oder ←') : tx('↑ oder ↓')) + '.' : '');
  }
  function erstellen(){
    if (aus) return;
    var satz = Kern.buchstaben(st.satz);
    $('#rsSatzInfo').textContent = satz.length ? tx('{n} Buchstaben', { n:satz.length }) + (satz.length > 20 ? ' ' + tx('– ein kürzerer Satz gibt ein kleineres Feld') : '') : '';
    $('#rsCodeKarte').hidden = satz.length < 3;
    codeZeigen();
    F = null; gefunden = {};
    function nichts(art, html){ $('#rsBlatt').hidden = true; $('#rsWerkzeug').hidden = true; $('#rsLoesung').innerHTML = ''; meldung(art, html); }
    if (satz.length < 3) return nichts('info', tx('<p>Schreib links zuerst den Satz, der sich in der Schlange wiederholt (mindestens 3 Buchstaben). Dann gibst du den Richtungscode ein.</p>'));
    if (!st.code.length) return nichts('info', tx('<p>Gib jetzt mit den Pfeilknöpfen den Richtungscode ein – zum Beispiel → ↓ ← ↓.</p>'));
    var r = Kern.erstelle(st.satz, st.code, { rnd:Kern.zufall(st.seed), ausSatz:st.opt.ausSatz, gerade:st.opt.gerade, maxB:30, maxH:38 });
    if (r.fehler === 'abbiegen'){
      var i = r.stelle, gleich = st.code[i] === st.code[i - 1];
      return nichts('fehler', '<h3>' + tx('Hier kann die Schlange nicht abbiegen') + '</h3><p>' +
        tx(gleich ? 'Bei Richtung {a} und {b} kommt {p} – zweimal dieselbe Richtung würde einfach geradeaus weiterlaufen.' : 'Bei Richtung {a} und {b} kommt {p} – eine Umkehr geht in der Schlange nicht.',
          { a:i, b:i + 1, p:Kern.PFEIL[st.code[i - 1]] + ' ' + Kern.PFEIL[st.code[i]] }) + ' ' +
        tx('Ändere den Code oder kreuze «Gleiche Richtung zweimal hintereinander oder Umkehr erlauben» an (dann ist jedes Stück ein ganzer Satz).') + '</p>');
    }
    if (r.fehler === 'palindrom') return nichts('fehler', tx('<h3>Der Satz ist vorwärts und rückwärts gleich</h3><p>Dann sieht man nicht, in welche Richtung er läuft. Nimm einen anderen Satz.</p>'));
    if (r.fehler === 'gross'){
      // Wie lang dürfte der Satz sein?
      var max = 0; for (var n = satz.length - 1; n >= 3; n--){ if (st.opt.gerade ? Kern.schlange(n, st.code, Math.random, 28, 36) : Kern.eckSchlange(n, st.code, Math.random, 28, 36)){ max = n; break; } }
      return nichts('fehler', '<h3>' + tx('Das Feld würde zu gross') + '</h3><p>' +
        (st.opt.gerade ? tx('{n} Sätze mit je {b} Buchstaben passen nicht in ein Feld von höchstens 30 × 38 Buchstaben.', { n:st.code.length, b:satz.length }) : tx('Die Schlange passt nicht in ein Feld von höchstens 30 × 38 Buchstaben.')) +
        (max ? ' ' + tx('Mit diesem Code geht ein Satz mit höchstens {m} Buchstaben.', { m:max }) : '') + ' ' + tx('Nimm einen kürzeren Satz oder weniger Richtungen.') + '</p>');
    }
    F = r;
    anzeigen();
    var code = '<b class="rs-codetext">' + st.code.map(function(c){ return Kern.PFEIL[c]; }).join(' ') + '</b>';
    meldung(r.doppelt ? 'warnung' : 'erfolg', '<p><b>' + tx('Fertig!') + '</b> ' +
      (r.gerade ? tx(r.R === 1 ? 'Feld mit {s} × {z} Buchstaben. Die Schlange besteht aus 1 Satz.' : 'Feld mit {s} × {z} Buchstaben. Die Schlange besteht aus {r} Sätzen.', { s:r.spalten, z:r.zeilen, r:r.R })
        : tx(r.woerter.length === 1 ? 'Feld mit {s} × {z} Buchstaben. Die Schlange enthält den Satz {r}-mal und hat 1 gerades Stück.' : 'Feld mit {s} × {z} Buchstaben. Die Schlange enthält den Satz {r}-mal und hat {g} gerade Stücke.', { s:r.spalten, z:r.zeilen, r:r.R, g:r.woerter.length })) +
      ' ' + tx('Code: {c}. Die geraden Stücke lassen sich direkt im Feld markieren.', { c:code }) + '</p>' +
      (r.doppelt ? '<p>' + tx('Achtung: Der Satz steht noch {n}-mal zufällig im Feld. «Neu mischen» hilft.', { n:r.doppelt }) + '</p>' : ''));
  }

  /* ---------- Anzeige ---------- */
  function kreis(svg, rc){
    var NS = 'http://www.w3.org/2000/svg', c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', rc[1] * 10 + 5); c.setAttribute('cy', rc[0] * 10 + 5); c.setAttribute('r', 4.6); c.setAttribute('class', 'rs-start');
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#C2410C'); c.setAttribute('stroke-width', '0.9');
    svg.appendChild(c);
  }
  // Lösung: Nummer am Anfang jedes geraden Stücks und ein Pfeil in seiner Mitte
  function nummern(svg){
    var NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rs-nummern');
    F.woerter.forEach(function(w, i){
      var a = w.zellen[0], z = w.zellen[w.zellen.length - 1], d = Kern.RICHTUNG[w.code];
      // Nummer klein in der Ecke des ersten Feldes (der Buchstabe bleibt lesbar)
      var x = a[1] * 10 + 1.9, y = a[0] * 10 + 1.9, k = document.createElementNS(NS, 'circle');
      k.setAttribute('cx', x); k.setAttribute('cy', y); k.setAttribute('r', 1.75); k.setAttribute('fill', '#1C1714'); g.appendChild(k);
      var t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y + 0.1); t.setAttribute('class', 'rs-nr'); t.textContent = i + 1; g.appendChild(t);
      // Pfeil in der Mitte des Stücks (zwischen zwei Buchstaben), Spitze in Laufrichtung
      var mi = Math.floor((w.zellen.length - 1) / 2), m1 = w.zellen[mi], m2 = w.zellen[mi + 1] || m1;
      var ex = (m1[1] + m2[1]) * 5 + 5, ey = (m1[0] + m2[0]) * 5 + 5, p = document.createElementNS(NS, 'path');
      // Pfeilspitze in Laufrichtung, knapp hinter dem letzten Buchstaben
      var qx = -d[0], qy = d[1];
      p.setAttribute('d', 'M' + (ex + d[1] * 1.8) + ' ' + (ey + d[0] * 1.8) + 'L' + (ex + qx * 1.5) + ' ' + (ey + qy * 1.5) + 'L' + (ex - qx * 1.5) + ' ' + (ey - qy * 1.5) + 'Z');
      p.setAttribute('fill', '#1C1714'); g.appendChild(p);
    });
    svg.appendChild(g);
  }
  function blattHtml(art){
    var o = st.opt, satz = Kern.buchstaben(st.satz).join(''), n = F.woerter.length;
    var html = o.titelAn || art === 'loesung' ? '<h2>' + (art === 'loesung' ? tx('Richtungs-Suchsel – Lösung') : tx('Richtungs-Suchsel')) + '</h2>' : '';
    if (art === 'spiel' && o.anleitungAn){
      var wer = o.satzZeigen ? tx('Der Satz <b>«{s}»</b> steht immer wieder im Feld', { s:esc(satz) }) : tx('Ein Satz steht immer wieder im Feld');
      html += '<p class="rs-anleitung">' + (F.gerade
          ? tx('{wer} – Satz an Satz, wie eine Schlange.', { wer:wer }) + (o.start ? ' ' + tx('Beginne beim Kreis.') : '') + ' ' +
            tx('Wo ein Satz aufhört, beginnt der nächste direkt daneben. Markiere die {n} Sätze der Reihe nach und schreibe für jeden auf, in welche Richtung er läuft: → ← ↑ ↓.', { n:n })
          : tx('{wer} – als Schlange, die um Ecken biegt.', { wer:wer }) + ' ' +
            tx(o.start ? 'Beginne beim Kreis und folge dem Satz Buchstabe für Buchstabe. Jedes gerade Stück der Schlange zeigt eine Richtung: → ← ↑ ↓. Schreibe die {n} Richtungen der Reihe nach auf.'
              : 'Folge dem Satz Buchstabe für Buchstabe. Jedes gerade Stück der Schlange zeigt eine Richtung: → ← ↑ ↓. Schreibe die {n} Richtungen der Reihe nach auf.', { n:n })) +
        ' ' + tx('Das ist der Code für das Richtungsschloss.') + '</p>';
    }
    html += '<div class="rs-gitter"></div>';
    html += tx('<div class="rs-codebox"><p>Code für das Richtungsschloss</p><div class="rs-kaestchen">') + F.code.map(function(c, i){
      return '<span class="rs-k"><small>' + (i + 1) + '</small><b>' + (art === 'loesung' ? Kern.PFEIL[c] : '') + '</b></span>'; }).join('') + '</div></div>';
    if (art === 'loesung') html += '<p class="rs-anleitung">' + tx('Satz:') + ' <b>' + esc(satz) + '</b> · ' + tx('Code:') + ' ' + F.code.map(function(c){ return tx(Kern.NAME[c]); }).join(', ') + '</p>';
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
    p.textContent = n === F.woerter.length
      ? tx(F.gerade ? '🎉 Alle {n} Sätze gefunden! Jetzt die Richtungen der Reihe nach aufschreiben.' : '🎉 Alle {n} Stücke gefunden! Jetzt die Richtungen der Reihe nach aufschreiben.', { n:n })
      : tx(F.gerade ? '{n} von {m} Sätzen gefunden.' : '{n} von {m} Stücken gefunden.', { n:n, m:F.woerter.length });
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
    speicherOrt.save({ filename:dateiname().replace(/\.pdf$/, '.html'), data:Labor.blattDatei(tx('Richtungs-Suchsel'), inhalt, '.rs-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  erstellen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
