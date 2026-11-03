/* Rätsellabor – Generator «QR-Code»
   Zwei Teile:
   – Zum Ausmalen: Aus einem Text oder Link entsteht ein Raster. Die Kinder malen die richtigen Felder aus; ist alles
     richtig, lässt sich der Code mit Tablet oder Handy scannen und verrät die Botschaft (Selbstkontrolle).
     Woran die Felder erkennbar sind: Kreise, Zahlen (gerade oder aus einer Einmaleins-Reihe) oder Rechnungen
     (Ergebnis gerade). Die Erkennungsquadrate in den Ecken können vorgedruckt sein.
   – Fertige QR-Codes: ein oder mehrere Codes mit Titel, als Blatt zum Ausdrucken oder als Bild.
   Die QR-Codes berechnet gemeinsam/extern/qrcode.js (Kazuhiko Arase, MIT-Lizenz). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var STUFEN = { L:7, M:15, Q:25, H:30 };   // so viel Prozent der Datenblöcke darf beschädigt sein (QR-Norm)
  // Fehlerkorrektur-Wörter je Version (1–6) und Stufe, und wie viele davon kleine Codes zum Schutz vor Fehllesungen brauchen.
  // Daraus: wie viele einzeln verstreute Ausmalfehler ein Code sicher verträgt (mit dem QR-Leser jsQR nachgemessen).
  var KORREKTUR = { L:[7, 10, 15, 20, 26, 36], M:[10, 16, 26, 36, 48, 64], Q:[13, 22, 36, 52, 72, 96], H:[17, 28, 44, 64, 88, 112] };
  var SCHUTZ = { L:[3, 2, 1], M:[2], Q:[1], H:[1] };
  var BLOECKE = { L:[1, 1, 1, 1, 1, 2], M:[1, 1, 1, 2, 2, 4], Q:[1, 1, 2, 2, 4, 4], H:[1, 1, 2, 4, 4, 4] };   // Fehler verteilen sich ungleich auf Blöcke
  // Mittelpunkte der kleinen Ausrichtungsquadrate je Version (QR-Norm)
  var AUSRICHTUNG = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var GRENZE = { punkte:41, zahlen:33, rechnungen:25 };   // grösstes Raster je Ausmal-Art (Felder pro Seite)

  /* QR-Code berechnen → { n, version, dunkel[r][c] }; zu langer Text → null */
  function code(text, stufe){
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];   // Umlaute richtig
    // Nur Ziffern, Grossbuchstaben und wenige Zeichen (z. B. «HTTPS://SEITE.CH/B/K3X9») passen in den sparsamen
    // Alphanumerik-Modus – das ergibt ein deutlich kleineres Raster
    var q, t = String(text), modus = /^[0-9A-Z $%*+\-.\/:]+$/.test(t) ? 'Alphanumeric' : 'Byte';
    try { q = qrcode(0, stufe || 'M'); q.addData(t, modus); q.make(); } catch(e){ return null; }
    var n = q.getModuleCount(), d = [];
    for (var r = 0; r < n; r++){ var z = []; for (var c = 0; c < n; c++) z.push(q.isDark(r, c)); d.push(z); }
    return { n:n, version:(n - 17) / 4, dunkel:d };
  }
  /* Erkennungsmuster: die drei grossen Quadrate (mit hellem Rand) und die kleinen Ausrichtungsquadrate */
  function muster(n){
    var v = (n - 17) / 4, m = [];
    for (var r = 0; r < n; r++){ var z = []; for (var c = 0; c < n; c++) z.push(false); m.push(z); }
    function feld(r0, c0, g){ for (var r = r0; r < r0 + g; r++) for (var c = c0; c < c0 + g; c++) if (r >= 0 && c >= 0 && r < n && c < n) m[r][c] = true; }
    feld(0, 0, 8); feld(0, n - 8, 8); feld(n - 8, 0, 8);
    var p = AUSRICHTUNG[v] || [];
    p.forEach(function(a){ p.forEach(function(b){
      if ((a < 9 && b < 9) || (a < 9 && b > n - 10) || (a > n - 10 && b < 9)) return;
      feld(a - 2, b - 2, 5);
    }); });
    return m;
  }
  function zufall(seed){   // kleiner Zufallsgenerator, damit «Neu mischen» und das Lösungsblatt zusammenpassen
    var s = seed >>> 0 || 1;
    return function(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  }
  function zahl(min, max, r){ return min + Math.floor(r() * (max - min + 1)); }
  /* Eine Rechnung, deren Ergebnis gerade (bzw. ungerade) ist */
  function rechnung(gerade, art, r){
    for (var i = 0; i < 500; i++){
      var a, b, e, t;
      if (art === 'plus20'){ a = zahl(1, 19, r); b = zahl(1, 20 - a, r); e = a + b; t = a + '+' + b; }
      else if (art === 'minus20'){ a = zahl(2, 20, r); b = zahl(1, a - 1, r); e = a - b; t = a + '−' + b; }
      else if (art === 'pm100'){
        if (r() < 0.5){ a = zahl(2, 98, r); b = zahl(1, 100 - a, r); e = a + b; t = a + '+' + b; }
        else { a = zahl(3, 100, r); b = zahl(1, a - 1, r); e = a - b; t = a + '−' + b; }
      }
      else if (art === 'mal'){ a = zahl(2, 10, r); b = zahl(2, 10, r); e = a * b; t = a + '·' + b; }
      else { b = zahl(2, 10, r); e = zahl(1, 10, r); a = e * b; t = a + ':' + b; }
      if ((e % 2 === 0) === gerade) return { text:t, ergebnis:e };
    }
    return null;
  }
  /* Inhalt eines Felds. dunkel = muss ausgemalt werden. */
  function feldinhalt(dunkel, o, r){
    if (o.art === 'punkte') return dunkel ? '○' : '';   // Kreis mit weisser Mitte: vor dem Ausmalen nicht scannbar
    if (o.art === 'zahlen'){
      var k = o.regel === 'reihe' ? o.reihe : 2, max = o.regel === 'reihe' ? o.reihe * 10 : o.zahlenraum, x;   // Reihen wie im Einmaleins bis 10·k
      for (var i = 0; i < 500; i++){ x = zahl(1, max, r); if ((x % k === 0) === dunkel) return String(x); }
      return '';
    }
    var rc = rechnung(dunkel, o.rechenart, r);
    return rc ? rc.text : '';
  }
  /* Ganzes Ausmal-Raster: { n, dunkel, vorgedruckt, inhalt, anzahl (auszumalende Felder) } oder { fehler, … } */
  function raster(text, o){
    var q = code(text, o.stufe);
    if (!q) return { fehler:'zuLang' };
    var grenze = GRENZE[o.art] || 41;
    if (q.n > grenze) return { fehler:'zuGross', n:q.n, grenze:grenze };
    var m = o.ecken ? muster(q.n) : null, r = zufall(o.seed || 1), inhalt = [], anzahl = 0;
    for (var y = 0; y < q.n; y++){
      var z = [];
      for (var x = 0; x < q.n; x++){
        var vor = !!(m && m[y][x]);
        if (!vor && q.dunkel[y][x]) anzahl++;
        z.push(vor ? '' : feldinhalt(q.dunkel[y][x], o, r));
      }
      inhalt.push(z);
    }
    return { n:q.n, version:q.version, dunkel:q.dunkel, vorgedruckt:m, inhalt:inhalt, anzahl:anzahl };
  }
  /* Kleinste Fehlertoleranz-Stufe, mit der der Text noch ins Raster passt */
  function passendeStufe(text, grenze){
    var s = ['H', 'Q', 'M', 'L'];
    for (var i = 0; i < s.length; i++){ var q = code(text, s[i]); if (q && q.n <= grenze) return s[i]; }
    return null;
  }
  /* Etwa so viele falsch ausgemalte oder vergessene Felder verträgt der Code (vorsichtig geschätzt) */
  function verzeiht(n, stufe){
    var v = (n - 17) / 4, k = KORREKTUR[stufe] && KORREKTUR[stufe][v - 1];
    if (!k) return null;
    var p = (SCHUTZ[stufe] || [])[v - 1] || 0, b = BLOECKE[stufe][v - 1];
    return Math.max(1, Math.floor((k - p) / 2 * (b === 1 ? 0.8 : b === 2 ? 0.7 : 0.6)));
  }
  /* ---------- Gestaltete Codes (Teil «Fertige QR-Codes») ----------
     d: { form, rahmen, mitte, farbe, farbe2, verlauf ('' | 'linear' | 'radial'), hintergrund ('' = durchsichtig),
          augen ('' = wie die Punkte), logo (Bildadresse oder ''), logoGroesse (Anteil der Breite), logoFrei } → SVG-Text */
  var RAND = 4;   // heller Rand rundherum, den Scanner brauchen (Felder)
  function z(x){ return String(Math.round(x * 1000) / 1000); }
  // Rechteck mit eigenem Radius je Ecke (oben links, oben rechts, unten rechts, unten links), im Uhrzeigersinn
  function rr(x, y, w, h, a, b, c, e){
    return 'M' + z(x + a) + ' ' + z(y) + 'H' + z(x + w - b) + (b ? 'A' + z(b) + ' ' + z(b) + ' 0 0 1 ' + z(x + w) + ' ' + z(y + b) : '') +
      'V' + z(y + h - c) + (c ? 'A' + z(c) + ' ' + z(c) + ' 0 0 1 ' + z(x + w - c) + ' ' + z(y + h) : '') +
      'H' + z(x + e) + (e ? 'A' + z(e) + ' ' + z(e) + ' 0 0 1 ' + z(x) + ' ' + z(y + h - e) : '') +
      'V' + z(y + a) + (a ? 'A' + z(a) + ' ' + z(a) + ' 0 0 1 ' + z(x + a) + ' ' + z(y) : '') + 'Z';
  }
  function kreis(cx, cy, r){ return 'M' + z(cx - r) + ' ' + z(cy) + 'A' + z(r) + ' ' + z(r) + ' 0 1 1 ' + z(cx + r) + ' ' + z(cy) + 'A' + z(r) + ' ' + z(r) + ' 0 1 1 ' + z(cx - r) + ' ' + z(cy) + 'Z'; }
  function raute(x, y, w){ var m = w / 2; return 'M' + z(x + m) + ' ' + z(y) + 'L' + z(x + w) + ' ' + z(y + m) + 'L' + z(x + m) + ' ' + z(y + w) + 'L' + z(x) + ' ' + z(y + m) + 'Z'; }
  /* Ein Feld des Codes; nb: Nachbarn oben/unten/links/rechts dunkel? (für «fliessend») */
  function modulPfad(form, x, y, nb){
    if (form === 'punkte') return kreis(x + 0.5, y + 0.5, 0.46);
    if (form === 'abgerundet') return rr(x + 0.04, y + 0.04, 0.92, 0.92, 0.3, 0.3, 0.3, 0.3);
    if (form === 'raute') return raute(x - 0.06, y - 0.06, 1.12);
    if (form === 'fliessend'){ var r = 0.5; nb = nb || {}; return rr(x, y, 1, 1, !nb.o && !nb.l ? r : 0, !nb.o && !nb.r ? r : 0, !nb.u && !nb.r ? r : 0, !nb.u && !nb.l ? r : 0); }
    return 'M' + z(x) + ' ' + z(y) + 'h1v1h-1Z';
  }
  /* Äussere Ecke (Ring aus 7×7 Feldern) und innere Ecke (3×3) */
  function rahmenPfad(form, x, y){
    if (form === 'kreis') return kreis(x + 3.5, y + 3.5, 3.5) + kreis(x + 3.5, y + 3.5, 2.5);
    if (form === 'abgerundet') return rr(x, y, 7, 7, 2.2, 2.2, 2.2, 2.2) + rr(x + 1, y + 1, 5, 5, 1.4, 1.4, 1.4, 1.4);
    if (form === 'blatt') return rr(x, y, 7, 7, 3, 0, 3, 0) + rr(x + 1, y + 1, 5, 5, 2, 0, 2, 0);
    return rr(x, y, 7, 7, 0, 0, 0, 0) + rr(x + 1, y + 1, 5, 5, 0, 0, 0, 0);
  }
  function mittePfad(form, x, y){
    if (form === 'kreis') return kreis(x + 1.5, y + 1.5, 1.5);
    if (form === 'abgerundet') return rr(x, y, 3, 3, 0.9, 0.9, 0.9, 0.9);
    if (form === 'raute') return raute(x - 0.25, y - 0.25, 3.5);
    if (form === 'blatt') return rr(x, y, 3, 3, 1.4, 0, 1.4, 0);
    return rr(x, y, 3, 3, 0, 0, 0, 0);
  }
  /* Kleines Ausrichtungsquadrat (5×5) im Stil der Ecken: Scanner suchen dort Ring und Mittelpunkt */
  function ausrichtungPfad(form, x, y){
    if (form === 'kreis') return kreis(x + 2.5, y + 2.5, 2.5) + kreis(x + 2.5, y + 2.5, 1.5) + kreis(x + 2.5, y + 2.5, 0.5);
    var r = form === 'abgerundet' || form === 'blatt' ? 1 : 0, ri = r ? 0.5 : 0;
    return rr(x, y, 5, 5, r, form === 'blatt' ? 0 : r, r, form === 'blatt' ? 0 : r) + rr(x + 1, y + 1, 3, 3, ri, form === 'blatt' ? 0 : ri, ri, form === 'blatt' ? 0 : ri) + rr(x + 2, y + 2, 1, 1, 0, 0, 0, 0);
  }
  var AUSRICHTUNG_K = AUSRICHTUNG;
  function ausrichtungen(n){   // linke obere Ecken der 5×5-Ausrichtungsquadrate
    var v = (n - 17) / 4, p = AUSRICHTUNG_K[v] || [], a = [];
    p.forEach(function(r){ p.forEach(function(c){ if ((r < 9 && c < 9) || (r < 9 && c > n - 10) || (r > n - 10 && c < 9)) return; a.push([r - 2, c - 2]); }); });
    return a;
  }
  function istAuge(n, r, c){ return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7); }
  /* Welche innere Ecke zu welcher äusseren passt: Scanner prüfen die Proportionen auch diagonal, darum keine
     runde Mitte im eckigen Rahmen und umgekehrt (mit dem QR-Leser jsQR für alle Kombinationen nachgeprüft) */
  var MITTE_ZU = { quadrat:['quadrat', 'abgerundet'], abgerundet:['quadrat', 'abgerundet', 'kreis', 'blatt'], kreis:['abgerundet', 'kreis', 'blatt'], blatt:['abgerundet', 'kreis', 'blatt'] };
  function passendeMitte(rahmen, mitte){ var e = MITTE_ZU[rahmen] || MITTE_ZU.quadrat; return e.indexOf(mitte) >= 0 ? mitte : e[e.length > 2 ? 1 : 0]; }
  function farbe(f, sonst){ return /^#[0-9a-f]{6}$/i.test(f || '') ? f : sonst; }
  function gestaltet(q, d, id){
    var n = q.n, w = n + 2 * RAND, logo = null;
    if (d.logo){
      var s = Math.round(n * Math.min(0.3, Math.max(0.1, d.logoGroesse || 0.22)));
      if ((n - s) % 2) s++;
      logo = { o:(n - s) / 2, s:s };
    }
    function dunkel(r, c){ return r >= 0 && c >= 0 && r < n && c < n && q.dunkel[r][c]; }
    function frei(r, c){ return logo && d.logoFrei && c >= logo.o - 0.5 && c < logo.o + logo.s + 0.5 && r >= logo.o - 0.5 && r < logo.o + logo.s + 0.5; }
    var koerper = [], aus = ausrichtungen(n), inAusrichtung = {};
    aus.forEach(function(a){ for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) inAusrichtung[(a[0] + i) * n + a[1] + j] = true; });
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++){
      if (!q.dunkel[r][c] || istAuge(n, r, c) || inAusrichtung[r * n + c] || frei(r, c)) continue;
      koerper.push(modulPfad(d.form, c + RAND, r + RAND, { o:dunkel(r - 1, c), u:dunkel(r + 1, c), l:dunkel(r, c - 1), r:dunkel(r, c + 1) }));
    }
    var ringe = '', mitten = '', mitte = passendeMitte(d.rahmen, d.mitte);
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function(p){ ringe += rahmenPfad(d.rahmen, p[0] + RAND, p[1] + RAND); mitten += mittePfad(mitte, p[0] + 2 + RAND, p[1] + 2 + RAND); });
    var kleine = aus.map(function(a){ return ausrichtungPfad(d.rahmen, a[1] + RAND, a[0] + RAND); }).join('');
    var f1 = farbe(d.farbe, '#000000'), f2 = farbe(d.farbe2, f1), fuell = f1, defs = '';
    if (d.verlauf === 'linear' || d.verlauf === 'radial'){
      var gid = 'qrv' + String(id).replace(/\W/g, '');
      defs = d.verlauf === 'radial'
        ? '<radialGradient id="' + gid + '" gradientUnits="userSpaceOnUse" cx="' + z(w / 2) + '" cy="' + z(w / 2) + '" r="' + z(n * 0.72) + '"><stop offset="0" stop-color="' + f1 + '"/><stop offset="1" stop-color="' + f2 + '"/></radialGradient>'
        : '<linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="' + RAND + '" y1="' + RAND + '" x2="' + (RAND + n) + '" y2="' + (RAND + n) + '"><stop offset="0" stop-color="' + f1 + '"/><stop offset="1" stop-color="' + f2 + '"/></linearGradient>';
      fuell = 'url(#' + gid + ')';
    }
    var augen = d.augen ? farbe(d.augen, f1) : fuell, grund = d.hintergrund ? farbe(d.hintergrund, '#ffffff') : '';
    var h = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '"' + (d.form === 'quadrat' ? ' shape-rendering="crispEdges"' : '') + '>' +
      (defs ? '<defs>' + defs + '</defs>' : '') + (grund ? '<rect width="' + w + '" height="' + w + '" fill="' + grund + '"/>' : '') +
      '<path fill="' + fuell + '" d="' + koerper.join('') + '"/>' +
      '<path fill="' + augen + '" fill-rule="evenodd" d="' + ringe + '"/><path fill="' + augen + '" d="' + mitten + '"/>' +
      (kleine ? '<path fill="' + fuell + '" fill-rule="evenodd" d="' + kleine + '"/>' : '');
    if (logo){
      var lx = logo.o + RAND, ls = logo.s;
      if (d.logoFrei) h += '<rect x="' + z(lx - 0.25) + '" y="' + z(lx - 0.25) + '" width="' + z(ls + 0.5) + '" height="' + z(ls + 0.5) + '" rx="' + z(ls * 0.12) + '" fill="' + (grund || '#ffffff') + '"/>';
      h += '<image href="' + String(d.logo).replace(/"/g, '%22') + '" x="' + z(lx + ls * 0.06) + '" y="' + z(lx + ls * 0.06) + '" width="' + z(ls * 0.88) + '" height="' + z(ls * 0.88) + '" preserveAspectRatio="xMidYMid meet"/>';
    }
    return h + '</svg>';
  }
  return { STUFEN:STUFEN, GRENZE:GRENZE, code:code, muster:muster, raster:raster, rechnung:rechnung, zufall:zufall, passendeStufe:passendeStufe, verzeiht:verzeiht,
    gestaltet:gestaltet, modulPfad:modulPfad, rahmenPfad:rahmenPfad, mittePfad:mittePfad, MITTE_ZU:MITTE_ZU, passendeMitte:passendeMitte };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var SYMBOLE = ['🎉', '⭐', '🏆', '💡', '🔑', '🗺️', '🎁', '❤️'];   // wie in api/botschaft.php
var VORLAGE = '<div class="qr">' +
  '<header class="qr-kopf"><p class="augenbraue">Rätselgenerator</p><h1>QR-Code</h1>' +
    '<p>Aus einem Text oder Link wird ein QR-Code: zum Ausmalen mit eingebauter Selbstkontrolle oder fertig zum Ausdrucken.</p></header>' +
  '<div class="qr-modus" role="tablist" aria-label="Was möchtest du erstellen?">' +
    '<button type="button" role="tab" id="qrTabMalen" data-modus="malen">Zum Ausmalen</button>' +
    '<button type="button" role="tab" id="qrTabFertig" data-modus="fertig">Fertige QR-Codes</button></div>' +
  '<div class="qr-layout"><section class="qr-eingabe" aria-label="Eingaben">' +
    /* ---- Zum Ausmalen ---- */
    '<div class="qr-teil" data-teil="malen">' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Was erscheint beim Scannen?</h2><p>Ist alles richtig ausgemalt, zeigt das Handy einen Text oder öffnet einen Link.</p></div></div>' +
        '<div class="qr-ziel" role="radiogroup" aria-label="Was erscheint beim Scannen?">' +
          '<label><input type="radio" name="qrZiel" value="text"><span>Text</span></label>' +
          '<label><input type="radio" name="qrZiel" value="link"><span>Link</span></label>' +
          '<label id="qrZielBotschaft" hidden><input type="radio" name="qrZiel" value="botschaft"><span>Botschaft</span></label></div>' +
        '<div data-ziel="text"><label class="vh" for="qrText">Text</label>' +
          '<textarea id="qrText" rows="3" maxlength="300" spellcheck="true"></textarea></div>' +
        '<div data-ziel="link"><label class="vh" for="qrLink">Ziellink</label>' +
          '<input type="url" id="qrLink" maxlength="300" autocomplete="url" spellcheck="false" inputmode="url"></div>' +
        '<div data-ziel="botschaft" class="qr-botschaft-eingabe"><label class="feld-label" for="qrBTitel">Titel der Botschaft</label>' +
          '<input type="text" id="qrBTitel" maxlength="80" autocomplete="off">' +
          '<label class="feld-label" for="qrBText">Botschaft</label>' +
          '<textarea id="qrBText" rows="5" maxlength="1500"></textarea>' +
          '<div class="qr-symbole" role="radiogroup" aria-label="Symbol auf der Botschaftsseite">' +
            SYMBOLE.map(function(x){ return '<label><input type="radio" name="qrSymbol" value="' + x + '"><span>' + x + '</span></label>'; }).join('') + '</div></div>' +
        '<p class="hinweis" id="qrTextInfo" aria-live="polite"></p></div>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Welche Felder ausmalen?</h2><p>Woran die Kinder erkennen, welche Felder sie ausmalen.</p></div></div>' +
        '<div class="qr-arten" role="radiogroup" aria-label="Ausmal-Art">' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="punkte"><span><b>Kreise</b><small>Felder mit einem Kreis ausmalen – schon ab der 1. Klasse</small></span></label>' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="zahlen"><span><b>Zahlen</b><small>gerade Zahlen oder Zahlen einer Einmaleins-Reihe ausmalen</small></span></label>' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="rechnungen"><span><b>Rechnungen</b><small>rechnen – ist das Ergebnis gerade, wird ausgemalt</small></span></label>' +
        '</div>' +
        '<div class="opt-raster" data-fuer="zahlen"><label for="qrRegel">Ausmalen, wenn die Zahl …</label><select id="qrRegel"><option value="gerade">gerade ist</option>' +
          [3, 4, 5, 6, 7, 8, 9, 10].map(function(k){ return '<option value="' + k + '">in der ' + k + 'er-Reihe ist</option>'; }).join('') + '</select>' +
          '<label for="qrZahlenraum" data-gerade>Zahlenraum</label><select id="qrZahlenraum" data-gerade><option value="20">bis 20</option><option value="50">bis 50</option><option value="100">bis 100</option></select></div>' +
        '<div class="opt-raster" data-fuer="rechnungen"><label for="qrRechenart">Rechnungen</label><select id="qrRechenart">' +
          '<option value="plus20">Plus bis 20</option><option value="minus20">Minus bis 20</option><option value="pm100">Plus und Minus bis 100</option>' +
          '<option value="mal">Einmaleins (mal)</option><option value="geteilt">Einmaleins (geteilt)</option></select></div>' +
      '</div>' +
      '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
        '<div class="opt-raster"><label for="qrStufe">Fehlertoleranz</label><select id="qrStufe">' +
          '<option value="L">gering – kleinstes Raster</option><option value="M">mittel</option><option value="Q">hoch (empfohlen)</option><option value="H">sehr hoch – grösstes Raster</option></select>' +
          '<label for="qrTitel">Titel auf dem Blatt</label><input type="text" id="qrTitel" maxlength="60"></div>' +
        '<label class="opt"><input type="checkbox" id="qrEcken"><span>Erkennungsquadrate in den Ecken schon ausgemalt</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrNummern"><span>Zeilen und Spalten nummerieren</span></label>' +
        '<p class="hinweis">Die Fehlertoleranz bestimmt, wie viele falsch ausgemalte Felder der Code verzeiht. Mehr Toleranz gibt ein grösseres Raster.</p>' +
      '</details></div>' +
      '<button type="button" class="btn primary gross" id="qrLos">QR-Code erstellen</button>' +
    '</div>' +
    /* ---- Fertige QR-Codes ---- */
    '<div class="qr-teil" data-teil="fertig" hidden>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>QR-Codes</h2><p>Pro Code ein Inhalt (Text oder Link), der Titel ist freiwillig.</p></div></div>' +
        '<ol class="qr-liste" id="qrListe"></ol>' +
        '<button type="button" class="btn" id="qrPlus">+ Weiterer QR-Code</button></div>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Blatt</h2><p>Wie die Codes auf dem Blatt stehen.</p></div></div>' +
        '<div class="opt-raster"><label for="qrProBlatt">Codes pro Blatt</label><select id="qrProBlatt">' +
          [1, 2, 4, 6, 12].map(function(k){ return '<option value="' + k + '">' + k + '</option>'; }).join('') + '</select>' +
          '<label for="qrStufeFertig">Fehlertoleranz</label><select id="qrStufeFertig"><option value="L">7 %</option><option value="M">15 %</option><option value="Q">25 %</option><option value="H">30 %</option></select></div>' +
        '<label class="opt"><input type="checkbox" id="qrTitelZeigen"><span>Titel unter dem Code zeigen</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrInhaltZeigen"><span>Inhalt klein als Text darunter</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrSchnitt"><span>Schnittlinien zum Ausschneiden</span></label>' +
      '</div>' +
      '<div class="karte qr-gestaltung"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Gestaltung</h2><p>Vorlage wählen oder selbst gestalten. Jeder Code wird geprüft, ob er sich noch scannen lässt.</p></div></div>' +
        '<div class="qr-vorlagen" id="qrVorlagen" role="group" aria-label="Vorlagen"></div>' +
        '<h3 class="qr-gest-titel">Punkte</h3><div class="qr-formen" data-wahl="form" role="radiogroup" aria-label="Form der Punkte"></div>' +
        '<h3 class="qr-gest-titel">Ecken aussen</h3><div class="qr-formen" data-wahl="rahmen" role="radiogroup" aria-label="Form der Ecken aussen"></div>' +
        '<h3 class="qr-gest-titel">Ecken innen</h3><div class="qr-formen" data-wahl="mitte" role="radiogroup" aria-label="Form der Ecken innen"></div>' +
        '<h3 class="qr-gest-titel">Farben</h3><div class="qr-farben">' +
          '<label class="qr-farbe"><input type="color" id="qrFarbe"><span>Punkte</span></label>' +
          '<label class="qr-farbe" data-verlauf><input type="color" id="qrFarbe2"><span>Verlauf bis</span></label>' +
          '<label class="qr-farbe" data-augen><input type="color" id="qrAugen"><span>Ecken</span></label>' +
          '<label class="qr-farbe" data-grund><input type="color" id="qrHintergrund"><span>Hintergrund</span></label></div>' +
        '<div class="opt-raster"><label for="qrVerlauf">Farbverlauf</label><select id="qrVerlauf"><option value="">keiner</option><option value="linear">schräg</option><option value="radial">von innen nach aussen</option></select></div>' +
        '<label class="opt"><input type="checkbox" id="qrAugenEigen"><span>Ecken in eigener Farbe</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrDurchsichtig"><span>Hintergrund durchsichtig (z. B. für farbiges Papier)</span></label>' +
        '<h3 class="qr-gest-titel">Logo in der Mitte</h3>' +
        '<div class="qr-ziel" role="radiogroup" aria-label="Logo in der Mitte">' +
          '<label><input type="radio" name="qrLogo" value="kein"><span>Keines</span></label>' +
          '<label><input type="radio" name="qrLogo" value="labor"><span>Rätsellabor</span></label>' +
          '<label><input type="radio" name="qrLogo" value="eigen"><span>Eigenes Bild</span></label></div>' +
        '<div data-logo-eigen><label class="vh" for="qrLogoDatei">Bild für das Logo</label><input type="file" id="qrLogoDatei" accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"></div>' +
        '<div data-logo><div class="opt-raster"><label for="qrLogoGroesse">Grösse</label><input type="range" id="qrLogoGroesse" min="12" max="30" step="1"></div>' +
          '<label class="opt"><input type="checkbox" id="qrLogoFrei"><span>Punkte hinter dem Logo weglassen</span></label></div>' +
        '<p class="hinweis" id="qrDesignInfo" aria-live="polite"></p>' +
      '</div>' +
    '</div>' +
  '</section>' +
  '<section class="qr-ausgabe" aria-label="Ergebnis">' +
    '<div id="qrMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="qrLeer"><h2>Noch kein QR-Code</h2><p>So entsteht ein QR-Code zum Ausmalen:</p><ol>' +
      '<li>Botschaft eingeben, z. B. ein Lob, ein Lösungswort oder einen Link</li><li>Wählen, woran die Kinder die Felder erkennen</li><li>«QR-Code erstellen» klicken</li></ol></div>' +
    '<div class="qr-werkzeug" id="qrWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="qrMischen" title="Gleicher Code, neue Zahlen oder Rechnungen">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="qrZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="qrMalWeg">Ausmalen löschen</button>' +
      '<span class="abstand"></span>' +
      '<span class="qr-blatt-schalter" id="qrBlattSchalter">' + Labor.blattSchalterHtml() + '</span>' +
      '<label id="qrMitLoesungWahl"><input type="checkbox" id="qrMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="qrDrucken">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="qrHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div id="qrBlaetter"></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' +
  '<path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20v1M20 14v1" stroke-linecap="round"/></svg>';

Labor.registriere({
  id:'qr-code',
  titel:'QR-Code',
  kurz:'QR-Codes zum Ausmalen und fertige Codes',
  beschreibung:'Aus einem Text oder Link wird ein QR-Code. Die Kinder malen ihn nach Kreisen, Zahlen oder Rechnungen aus – ist alles richtig, verrät das Handy die Botschaft. Oder fertige Codes zum Ausdrucken.',
  merkmale:['Selbstkontrolle durch Scannen', 'Kreise, Zahlen oder Rechnungen', 'Fertige Codes zum Ausdrucken'],
  symbol:SYMBOL,
  css:'raetsel/qr-code/qr-code.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'qr-code-eingaben', OPT = 'qr-code-einstellungen', NS = 'http://www.w3.org/2000/svg';
  var STANDARD = { modus:'malen', ziel:'text', symbol:'🎉', art:'punkte', regel:'gerade', zahlenraum:20, rechenart:'plus20', stufe:'Q', ecken:true, nummern:true, mitLoesung:true, titelAn:true, anleitungAn:true,
    proBlatt:4, stufeFertig:'M', titelZeigen:true, inhaltZeigen:false, schnitt:true };

  /* ---------- Zustand: Inhalte nur für diesen Tab, Einstellungen bleiben ---------- */
  var st = { text:'', link:'', bTitel:'', bText:'', titel:'', liste:[{ titel:'', inhalt:'' }], seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try {
    var e = JSON.parse(sessionStorage.getItem(TAB));
    if (e){ st.text = String(e.text || ''); st.link = String(e.link || ''); st.bTitel = String(e.bTitel || ''); st.bText = String(e.bText || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || 1;
      if (Array.isArray(e.liste) && e.liste.length) st.liste = e.liste.map(function(x){ return { titel:String(x.titel || ''), inhalt:String(x.inhalt || '') }; }); }
  } catch(x){}
  var timer = 0;
  function speichernJetzt(){
    clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, link:st.link, bTitel:st.bTitel, bText:st.bText, titel:st.titel, liste:st.liste, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){}
  }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }

  function meldung(art, html){ $('#qrMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#qrLeer').hidden = !!$('#qrBlaetter').innerHTML || !!$('#qrMeldung').innerHTML || st.opt.modus !== 'malen'; }
  // www.… ohne https:// öffnet nicht jedes Handy als Link
  function inhalt(t){ t = String(t || '').trim(); return /^www\./i.test(t) ? 'https://' + t : t; }
  // Ziellink: ohne «https://» wird es ergänzt; gültig ist ein Web-Link mit Punkt in der Adresse
  function linkNorm(t){ t = String(t || '').trim().replace(/\s+/g, ''); if (!t) return ''; return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : 'https://' + t.replace(/^\/+/, ''); }
  function linkGueltig(u){ try { var x = new URL(u); return /^https?:$/.test(x.protocol) && /\.[a-z]{2,}$/i.test(x.hostname); } catch(e){ return false; } }
  function malInhalt(){
    if (st.opt.ziel === 'link') return linkNorm(st.link);
    if (st.opt.ziel === 'botschaft') return st.bText.trim() ? botschaftUrl('XXXX') : '';   // Platzhalter: so gross wird der Code
    return inhalt(st.text);
  }

  /* ---------- Botschaft: auf dem eigenen Server gespeichert (api/botschaft.php), der Code enthält nur den kurzen Link ---------- */
  var BSERVER = 'api/botschaft.php', bStatus = null, bIds = {}, bLauf = 0;
  function botschaftBereit(){
    if (bStatus) return bStatus;
    if (Labor.imArtefakt() || !/^https?:$/.test(location.protocol)) return (bStatus = Promise.resolve(false));
    bStatus = fetch(BSERVER + '?status=1', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ return !!(j && j.bereit); }, function(){ return false; });
    return bStatus;
  }
  // Adresse in Grossbuchstaben: passt in den sparsamen Alphanumerik-Modus (kleineres Raster); Schema und Host sind gross/klein egal
  function botschaftUrl(id){ return location.origin.toUpperCase() + location.pathname.replace(/[^\/]*$/, '') + 'B/' + id; }
  function botschaftSpeichern(){
    var daten = { titel:st.bTitel.trim(), text:st.bText.trim(), symbol:st.opt.symbol }, key = JSON.stringify(daten);
    if (bIds[key]) return Promise.resolve(bIds[key]);
    return fetch(BSERVER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:key }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if (r.ok && j && j.id){ bIds[key] = j.id; return j.id; }
        var e = new Error('botschaft'); e.code = (j && j.fehler) || (r.status === 429 ? 'zuViele' : 'speichern'); throw e;
      });
    }, function(){ var e = new Error('netz'); e.code = 'netz'; throw e; });
  }

  /* ---------- Modus: Zum Ausmalen / Fertige QR-Codes ---------- */
  function modusZeigen(){
    [].forEach.call(bereich.querySelectorAll('.qr-modus [role=tab]'), function(t){ t.setAttribute('aria-selected', t.dataset.modus === st.opt.modus ? 'true' : 'false'); });
    [].forEach.call(bereich.querySelectorAll('.qr-teil'), function(t){ t.hidden = t.dataset.teil !== st.opt.modus; });
    var malen = st.opt.modus === 'malen';
    $('#qrMischen').hidden = !malen || st.opt.art === 'punkte';   // bei Kreisen gibt es nichts zu mischen
    $('#qrZeigeLoesung').hidden = !malen; $('#qrMalWeg').hidden = !malen;
    $('#qrMitLoesungWahl').hidden = !malen; $('#qrBlattSchalter').hidden = !malen;
  }
  [].forEach.call(bereich.querySelectorAll('.qr-modus [role=tab]'), function(t){
    t.addEventListener('click', function(){
      if (st.opt.modus === t.dataset.modus) return;
      st.opt.modus = t.dataset.modus; speichern(); modusZeigen();
      $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true; meldung('', '');
      if (st.opt.modus === 'fertig') fertigZeigen(); else if (erstellt) erstellen();
    });
  });

  /* ================= Zum Ausmalen ================= */
  var textFeld = $('#qrText'), linkFeld = $('#qrLink'), aktuell = null, gemalt = {}, erstellt = false;
  textFeld.value = st.text; linkFeld.value = st.link; $('#qrTitel').value = st.titel;
  function textInfo(){
    var link = st.opt.ziel === 'link', t = malInhalt(), box = $('#qrTextInfo');
    if (st.opt.ziel === 'botschaft'){
      if (!t){ box.textContent = 'Die Botschaft wird auf deinem Server gespeichert, der QR-Code enthält nur einen kurzen Link darauf. Darum bleibt das Raster klein – egal wie lang die Botschaft ist.'; return; }
      var qb = Kern.code(t, st.opt.stufe), vb = qb && Kern.verzeiht(qb.n, st.opt.stufe);
      box.innerHTML = 'Raster: <b>' + qb.n + ' × ' + qb.n + ' Felder</b>' + (qb.n > Kern.GRENZE[st.opt.art] ? ' – für «' + artName() + '» zu gross, wähle «Kreise» oder eine kleinere Fehlertoleranz.' : vb ? ' · verzeiht etwa ' + vb + ' falsch ausgemalte Felder' : '') +
        '<br>Beim Scannen öffnet sich eine eigene Seite mit ' + (st.bTitel.trim() ? 'Titel und ' : '') + 'Botschaft.';
      return;
    }
    if (!t){ box.textContent = link ? 'Der Link öffnet sich, wenn der fertig ausgemalte Code gescannt wird. Tipp: Kurze Links ergeben kleinere Raster.'
      : 'Tipp: Ein kurzer Text ergibt ein kleines Raster, das schneller ausgemalt ist.'; return; }
    if (link && !linkGueltig(t)){ box.textContent = 'Das sieht noch nicht wie ein Link aus – z. B. www.beispiel.ch oder https://www.beispiel.ch/seite'; return; }
    var q = Kern.code(t, st.opt.stufe);
    if (!q){ box.textContent = 'Der Text ist zu lang für einen QR-Code.'; return; }
    var grenze = Kern.GRENZE[st.opt.art];
    var v = Kern.verzeiht(q.n, st.opt.stufe);
    box.innerHTML = 'Raster: <b>' + q.n + ' × ' + q.n + ' Felder</b>' + (q.n > grenze ? ' – für «' + artName() + '» sind höchstens ' + grenze + ' × ' + grenze + ' möglich.' :
      v ? ' · verzeiht etwa ' + v + ' falsch ausgemalte Felder' : '') +
      (link ? '<br>Öffnet: <b>' + esc(t) + '</b>' + (t !== st.link.trim() ? ' («https://» ergänzt, damit das Handy den Link direkt öffnet)' : '') :
        /^www\./i.test(st.text.trim()) ? '<br>Der Link bekommt automatisch «https://» davor, damit das Handy ihn direkt öffnet.' : '');
  }
  function zielZeigen(){
    if (st.opt.ziel === 'botschaft' && $('#qrZielBotschaft').hidden) st.opt.ziel = 'text';   // ohne Server keine Botschaften
    [].forEach.call(bereich.querySelectorAll('input[name="qrZiel"]'), function(r){ r.checked = r.value === st.opt.ziel; });
    [].forEach.call(bereich.querySelectorAll('[data-ziel]'), function(d){ d.hidden = d.dataset.ziel !== st.opt.ziel; });
  }
  [].forEach.call(bereich.querySelectorAll('input[name="qrZiel"]'), function(r){
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.ziel = r.value; speichern(); zielZeigen(); textInfo(); veraltet(); (st.opt.ziel === 'link' ? linkFeld : textFeld).focus(); });
  });
  linkFeld.addEventListener('input', function(){ st.link = linkFeld.value; speichern(); textInfo(); veraltet(); });
  var gewuenscht = st.opt.ziel;
  botschaftBereit().then(function(ok){
    if (aus || !ok) return;
    $('#qrZielBotschaft').hidden = false;
    if (gewuenscht === 'botschaft'){ st.opt.ziel = 'botschaft'; zielZeigen(); textInfo(); if (erstellt || malInhalt()) erstellen(); }
  });
  $('#qrBTitel').value = st.bTitel; $('#qrBText').value = st.bText;
  $('#qrBTitel').addEventListener('input', function(){ st.bTitel = this.value; speichern(); textInfo(); veraltet(); });
  $('#qrBText').addEventListener('input', function(){ st.bText = this.value; speichern(); textInfo(); veraltet(); });
  [].forEach.call(bereich.querySelectorAll('input[name="qrSymbol"]'), function(r){
    r.checked = r.value === st.opt.symbol;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.symbol = r.value; speichern(); veraltet(); } });
  });
  linkFeld.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); erstellen(); } });
  function artName(){ return { punkte:'Kreise', zahlen:'Zahlen', rechnungen:'Rechnungen' }[st.opt.art]; }
  textFeld.addEventListener('input', function(){ st.text = textFeld.value; speichern(); textInfo(); veraltet(); });
  $('#qrTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  function veraltet(){ var b = bereich.querySelector('.qr-blatt'); if (b && st.opt.modus === 'malen' && aktuell) b.classList.add('veraltet'); }

  [].forEach.call(bereich.querySelectorAll('input[name="qrArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = r.value; speichern(); unteroptionen(); textInfo(); modusZeigen(); if (erstellt) erstellen(); });
  });
  function unteroptionen(){
    [].forEach.call(bereich.querySelectorAll('[data-fuer]'), function(d){ d.hidden = d.dataset.fuer !== st.opt.art; });
    [].forEach.call(bereich.querySelectorAll('[data-gerade]'), function(d){ d.hidden = st.opt.regel !== 'gerade'; });   // Reihen gehen immer bis 10·k
  }
  var regel = $('#qrRegel'); regel.value = st.opt.regel === 'gerade' ? 'gerade' : String(st.opt.reihe || 3);
  regel.addEventListener('change', function(){ if (regel.value === 'gerade'){ st.opt.regel = 'gerade'; } else { st.opt.regel = 'reihe'; st.opt.reihe = +regel.value; } speichern(); unteroptionen(); if (erstellt) erstellen(); });
  [['qrZahlenraum', 'zahlenraum', true], ['qrRechenart', 'rechenart', false], ['qrStufe', 'stufe', false]].forEach(function(p){
    var el = $('#' + p[0]); el.value = String(st.opt[p[1]]);
    el.addEventListener('change', function(){ st.opt[p[1]] = p[2] ? +el.value : el.value; speichern(); textInfo(); if (erstellt) erstellen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); if (aktuell && st.opt.modus === 'malen') zeichnen(); });
  [['qrEcken', 'ecken'], ['qrNummern', 'nummern'], ['qrMitLoesung', 'mitLoesung']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){ st.opt[p[1]] = el.checked; speichern(); if (p[1] !== 'mitLoesung' && erstellt) erstellen(); });
  });

  function nichts(h){ aktuell = null; $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true; meldung('fehler', h); }
  function erstellen(){
    erstellt = true;
    var token = ++bLauf;
    if (st.opt.ziel === 'botschaft'){
      if (!st.bText.trim()){ nichts('<h3>Noch keine Botschaft</h3><p>Schreib zuerst die Botschaft, die sich beim Scannen öffnen soll.</p>'); return; }
      meldung('info', '<p><span class="lade" aria-hidden="true"></span>Die Botschaft wird gespeichert …</p>');
      botschaftSpeichern().then(function(id){ if (token === bLauf && !aus) bauen(botschaftUrl(id), 'botschaft', id); }, function(e){
        if (token !== bLauf || aus) return;
        var c = e && e.code;
        nichts('<h3>Die Botschaft konnte nicht gespeichert werden</h3><p>' + (c === 'zuViele' ? 'Gerade wurden sehr viele Botschaften erstellt. Versuch es in einer Stunde nochmals.'
          : c === 'netz' ? 'Der Server war nicht erreichbar. Prüfe die Internetverbindung und versuch es nochmals.' : 'Auf dem Server ist etwas schiefgegangen. Versuch es nochmals.') + '</p>');
      });
      return;
    }
    bauen(malInhalt(), st.opt.ziel);
  }
  function bauen(t, ziel, id){
    var link = ziel === 'link';
    if (!t){ nichts(link ? '<h3>Noch kein Link</h3><p>Gib zuerst den Ziellink ein, z. B. www.fabulousteaching.ch.</p>' : '<h3>Noch keine Botschaft</h3><p>Gib zuerst einen Text ein.</p>'); return; }
    if (link && !linkGueltig(t)){ nichts('<h3>Kein gültiger Link</h3><p>«' + esc(st.link.trim()) + '» sieht nicht wie ein Link aus. Gib eine Adresse wie www.beispiel.ch oder https://www.beispiel.ch/seite ein.</p>'); return; }
    var o = { art:st.opt.art, regel:st.opt.regel, reihe:st.opt.reihe || 3, zahlenraum:st.opt.zahlenraum, rechenart:st.opt.rechenart, stufe:st.opt.stufe, ecken:st.opt.ecken, seed:st.seed };
    var r = Kern.raster(t, o);
    if (r.fehler){
      aktuell = null; $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true;
      if (r.fehler === 'zuLang') meldung('fehler', '<h3>' + (link ? 'Der Link ist zu lang' : 'Der Text ist zu lang') + '</h3><p>So viel passt in keinen QR-Code. Kürze ihn bitte.</p>');
      else {
        var besser = Kern.passendeStufe(t, r.grenze), stufenText = { L:'«gering»', M:'«mittel»', Q:'«hoch»', H:'«sehr hoch»' };
        meldung('fehler', '<h3>Das Raster wird zu gross</h3><p>Mit diesem Text hätte das Raster ' + r.n + ' × ' + r.n + ' Felder. Für «' + artName() + '» sind höchstens ' +
          r.grenze + ' × ' + r.grenze + ' möglich, damit alles gut lesbar bleibt.</p><ul><li>' + (link ? 'Nimm einen kürzeren Link' : 'Kürze den Text') +
          (besser ? ',</li><li>oder stelle in den Einstellungen die Fehlertoleranz auf ' + stufenText[besser] + ' – dann passt er' : '') +
          (st.opt.art !== 'punkte' ? ',</li><li>oder wähle «Kreise» – damit sind bis 41 × 41 Felder möglich' : '') + '.</li></ul>');
      }
      return;
    }
    aktuell = { r:r, text:t, o:o, ziel:ziel, oeffnet:ziel !== 'text', id:id, botschaft:ziel === 'botschaft' ? { titel:st.bTitel.trim(), text:st.bText.trim() } : null }; gemalt = {};
    $('#qrZeigeLoesung').setAttribute('aria-pressed', 'false');
    zeichnen();
    erfolgsMeldung();
  }
  function erfolgsMeldung(){
    var r = aktuell.r;
    meldung('erfolg', '<p><b>Fertig!</b> Raster mit ' + r.n + ' × ' + r.n + ' Feldern, davon <b>' + r.anzahl + ' zum Ausmalen</b>. ' +
      (Kern.verzeiht(r.n, aktuell.o.stufe) ? 'Der Code verzeiht etwa ' + Kern.verzeiht(r.n, aktuell.o.stufe) + ' falsch ausgemalte oder vergessene Felder. ' : '') +
      'Du kannst ihn auch hier am Bildschirm ausmalen.</p>');
  }

  /* ---------- Blatt zeichnen ---------- */
  function anleitung(){
    var o = aktuell.o, a;
    if (o.art === 'punkte') a = 'Male alle Felder mit einem Kreis aus.';
    else if (o.art === 'zahlen') a = o.regel === 'reihe'
      ? 'Male alle Felder aus, deren Zahl in der ' + o.reihe + 'er-Reihe vorkommt (' + o.reihe + ', ' + 2 * o.reihe + ', ' + 3 * o.reihe + ' … ' + 10 * o.reihe + ').'
      : 'Male alle Felder mit einer geraden Zahl aus (2, 4, 6, 8, …).';
    else a = 'Rechne in jedem Feld. Ist das Ergebnis gerade, malst du das Feld aus.';
    return a + (o.ecken ? ' Die Quadrate in den Ecken sind schon ausgemalt.' : '') + ' Nimm einen dunklen Stift und male die Felder ganz aus.';
  }
  // Raster als SVG. art: 'spiel' (mit Inhalt, ausmalbar) oder 'loesung' (fertiger Code)
  function rasterSvg(art){
    var r = aktuell.r, n = r.n, S = 10, rand = st.opt.nummern && art === 'spiel' ? 9 : 0, w = n * S + rand;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (-rand) + ' ' + (-rand) + ' ' + w + ' ' + w);
    s.setAttribute('class', 'qr-raster ' + (art === 'spiel' ? 'spiel' : 'fertig'));
    s.style.setProperty('--felder', n);
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', art === 'spiel' ? 'Raster mit ' + n + ' mal ' + n + ' Feldern zum Ausmalen' : 'Fertiger QR-Code');
    var h = [];
    if (rand) for (var i = 0; i < n; i++){
      h.push('<text class="nr" x="' + (i * S + S / 2) + '" y="' + (-rand / 2) + '">' + (i + 1) + '</text>');
      h.push('<text class="nr" x="' + (-rand / 2) + '" y="' + (i * S + S / 2) + '">' + (i + 1) + '</text>');
    }
    h.push('<rect x="0" y="0" width="' + n * S + '" height="' + n * S + '" fill="#fff"/>');
    var schrift = aktuell.o.art === 'rechnungen' ? 2.9 : aktuell.o.art === 'zahlen' ? 4 : 6;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++){
      var dunkel = r.dunkel[y][x], vor = r.vorgedruckt && r.vorgedruckt[y][x];
      if (art === 'loesung'){ if (dunkel) h.push('<rect x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '" fill="#000"/>'); continue; }
      if (vor){ if (dunkel) h.push('<rect x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '" fill="#000"/>'); continue; }
      h.push('<rect class="feld" data-f="' + (y * n + x) + '" x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '"/>');
      var t = r.inhalt[y][x];
      if (t === '○') h.push('<circle class="kreis" cx="' + (x * S + S / 2) + '" cy="' + (y * S + S / 2) + '" r="2.3"/>');
      else if (t) h.push('<text class="inhalt" x="' + (x * S + S / 2) + '" y="' + (y * S + S / 2 + 0.35) + '" style="font-size:' + schrift + 'px">' + esc(t) + '</text>');
    }
    if (art === 'spiel'){
      // Lösung (eingeblendet mit «Lösung zeigen») und Ausgemaltes (nur am Bildschirm)
      var l = [];
      for (var y2 = 0; y2 < n; y2++) for (var x2 = 0; x2 < n; x2++) if (r.dunkel[y2][x2] && !(r.vorgedruckt && r.vorgedruckt[y2][x2])) l.push('M' + x2 * S + ' ' + y2 * S + 'h' + S + 'v' + S + 'h-' + S + 'z');
      h.push('<path class="ebene-loesung" d="' + l.join('') + '"/>');
      h.push('<g class="ebene-gemalt"></g>');
      h.push('<rect class="rahmen" x="0" y="0" width="' + n * S + '" height="' + n * S + '" fill="none"/>');
    }
    s.innerHTML = h.join('');
    return s;
  }
  function zeichnen(){
    var titel = st.titel.trim() || 'Male den QR-Code aus!', box = $('#qrBlaetter'), o = st.opt;
    box.innerHTML = '';
    var blatt = document.createElement('article');
    blatt.className = 'qr-blatt';
    blatt.innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') + (o.anleitungAn ? '<p class="qr-anleitung">' + esc(anleitung()) + '</p>' : '') + '<div class="qr-gitter"></div>' +
      (o.anleitungAn ? '<p class="qr-fuss">Fertig? Scanne den Code mit einem Tablet oder Handy – ' + (aktuell.ziel === 'link' ? 'er führt dich zu einer Überraschung.' : aktuell.ziel === 'botschaft' ? 'er öffnet eine Botschaft für dich.' : 'er verrät dir eine Botschaft.') + '</p>' : '') +
      '<p class="qr-fortschritt nur-bildschirm" id="qrFortschritt" aria-live="polite"></p>';
    var svg = rasterSvg('spiel');
    blatt.querySelector('.qr-gitter').appendChild(svg);
    box.appendChild(blatt);
    var loes = document.createElement('article');
    loes.className = 'qr-blatt qr-loesungsblatt';
    loes.setAttribute('aria-hidden', 'true');
    var b = aktuell.botschaft;
    loes.innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><p class="qr-anleitung">So sieht der fertig ausgemalte Code aus. ' +
      (aktuell.ziel === 'link' ? 'Er öffnet diesen Link:' : aktuell.ziel === 'botschaft' ? 'Er öffnet diese Botschaftsseite:' : 'Er enthält:') + '</p>' +
      '<p class="qr-botschaft">' + (aktuell.oeffnet ? '<a href="' + esc(aktuell.text) + '" target="_blank" rel="noopener">' + esc(aktuell.text) + '</a>' : esc(aktuell.text)) + '</p>' +
      (b ? '<div class="qr-botschaft qr-botschaft-voll">' + (b.titel ? '<b>' + esc(b.titel) + '</b>' : '') + '<span>' + esc(b.text) + '</span></div>' : '') +
      '<div class="qr-gitter"></div>';
    loes.querySelector('.qr-gitter').appendChild(rasterSvg('loesung'));
    box.appendChild(loes);
    $('#qrWerkzeug').hidden = false; leer();
    malenVerbinden(svg, blatt);
    gemaltZeichnen(); fortschritt();
  }

  /* ---------- Am Bildschirm ausmalen: tippen oder mit gedrückter Maus über die Felder fahren ---------- */
  function malenVerbinden(svg, blatt){
    var modus = null;
    function feldAn(ev){ var el = document.elementFromPoint(ev.clientX, ev.clientY); return el && el.getAttribute && el.getAttribute('data-f') !== null && svg.contains(el) ? +el.getAttribute('data-f') : null; }
    function setze(f){ if (f === null) return; if (modus) gemalt[f] = true; else delete gemalt[f]; gemaltZeichnen(); }
    svg.addEventListener('pointerdown', function(ev){
      var f = feldAn(ev); if (f === null) return;
      ev.preventDefault(); modus = !gemalt[f]; setze(f);
      try { svg.setPointerCapture(ev.pointerId); } catch(x){}
    });
    svg.addEventListener('pointermove', function(ev){ if (modus === null) return; setze(feldAn(ev)); });
    function ende(){ if (modus === null) return; modus = null; fortschritt(); }
    svg.addEventListener('pointerup', ende); svg.addEventListener('pointercancel', ende); svg.addEventListener('lostpointercapture', ende);
  }
  function gemaltZeichnen(){
    var g = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt) .ebene-gemalt'); if (!g) return;
    var n = aktuell.r.n, S = 10, d = Object.keys(gemalt).map(function(f){ f = +f; return 'M' + (f % n) * S + ' ' + Math.floor(f / n) * S + 'h' + S + 'v' + S + 'h-' + S + 'z'; }).join('');
    g.innerHTML = d ? '<path d="' + d + '"/>' : '';
  }
  function fortschritt(){
    var p = $('#qrFortschritt'); if (!p || !aktuell) return;
    var r = aktuell.r, n = r.n, richtig = 0, falsch = 0;
    Object.keys(gemalt).forEach(function(f){ f = +f; if (r.dunkel[Math.floor(f / n)][f % n]) richtig++; else falsch++; });
    var fertig = richtig === r.anzahl && !falsch;
    p.className = 'qr-fortschritt nur-bildschirm' + (fertig ? ' fertig' : '');
    if (fertig){
      // Wer am Tablet ausmalt, kann den eigenen Bildschirm nicht scannen – darum gibt es das Ziel auch als Knopf
      p.innerHTML = '🎉 Geschafft! Der Code ist komplett – scanne ihn jetzt mit dem Handy oder Tablet. ' +
        (aktuell.oeffnet ? '<a class="btn klein primary" href="' + esc(aktuell.text) + '" target="_blank" rel="noopener">' + (aktuell.ziel === 'botschaft' ? 'Botschaft öffnen' : 'Link öffnen') + '</a>'
          : '<button type="button" class="btn klein" id="qrBotschaftZeigen">Botschaft zeigen</button>');
      var bz = $('#qrBotschaftZeigen');
      if (bz) bz.addEventListener('click', function(){ var x = document.createElement('span'); x.className = 'qr-botschaft-gezeigt'; x.textContent = aktuell.text; bz.replaceWith(x); });
    } else p.textContent = Object.keys(gemalt).length ? Object.keys(gemalt).length + ' Felder ausgemalt.' : 'Tippe auf ein Feld oder fahre mit gedrückter Maus über mehrere Felder, um sie auszumalen.';
    var blatt = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt)');
    if (blatt) blatt.classList.toggle('geschafft', fertig);
  }

  /* ---------- Werkzeuge ---------- */
  $('#qrLos').addEventListener('click', erstellen);
  $('#qrMischen').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#qrZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    var b = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt)'); if (b) b.classList.toggle('zeige-loesung', an);
  });
  $('#qrMalWeg').addEventListener('click', function(){ gemalt = {}; gemaltZeichnen(); fortschritt(); });

  /* ================= Fertige QR-Codes ================= */
  var liste = $('#qrListe');
  function listeZeichnen(fokus){
    liste.innerHTML = '';
    st.liste.forEach(function(x, i){
      var li = document.createElement('li');
      li.innerHTML = '<label class="qr-feld"><span>Titel (freiwillig)</span><input type="text" class="qr-titel" maxlength="60" aria-label="Titel von Code ' + (i + 1) + '"></label>' +
        '<label class="qr-feld"><span>Text oder Link</span><input type="text" class="qr-inhalt" maxlength="500" aria-label="Inhalt von Code ' + (i + 1) + '"></label>' +
        '<button type="button" class="qr-weg" aria-label="Code ' + (i + 1) + ' entfernen" title="Entfernen">×</button>';
      var ti = li.querySelector('.qr-titel'), inh = li.querySelector('.qr-inhalt');
      ti.value = x.titel; inh.value = x.inhalt;
      ti.addEventListener('input', function(){ x.titel = ti.value; speichern(); fertigSpaeter(); });
      inh.addEventListener('input', function(){ x.inhalt = inh.value; speichern(); fertigSpaeter(); });
      li.querySelector('.qr-weg').addEventListener('click', function(){
        st.liste.splice(i, 1); if (!st.liste.length) st.liste.push({ titel:'', inhalt:'' });
        speichern(); listeZeichnen(); fertigZeigen();
      });
      liste.appendChild(li);
      if (fokus && i === st.liste.length - 1) inh.focus();
    });
  }
  $('#qrPlus').addEventListener('click', function(){ st.liste.push({ titel:'', inhalt:'' }); speichern(); listeZeichnen(true); });
  [['qrProBlatt', 'proBlatt', true], ['qrStufeFertig', 'stufeFertig', false]].forEach(function(p){
    var el = $('#' + p[0]); el.value = String(st.opt[p[1]]);
    el.addEventListener('change', function(){ st.opt[p[1]] = p[2] ? +el.value : el.value; speichern(); fertigZeigen(); });
  });
  [['qrTitelZeigen', 'titelZeigen'], ['qrInhaltZeigen', 'inhaltZeigen'], ['qrSchnitt', 'schnitt']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){ st.opt[p[1]] = el.checked; speichern(); fertigZeigen(); });
  });
  var fertigTimer = 0;
  function fertigSpaeter(){ clearTimeout(fertigTimer); fertigTimer = setTimeout(fertigZeigen, 250); }
  function fertigZeigen(){
    if (st.opt.modus !== 'fertig') return;
    var box = $('#qrBlaetter'), codes = [], zuLang = [];
    st.liste.forEach(function(x, i){
      var t = inhalt(x.inhalt); if (!t) return;
      var q = Kern.code(t, logoUrl() ? 'H' : st.opt.stufeFertig);   // mit Logo immer höchste Fehlertoleranz
      if (!q){ zuLang.push(i + 1); return; }
      var c = { titel:x.titel.trim(), text:t, q:q };
      c.svg = Kern.gestaltet(q, designKern(), 'c' + i).replace('<svg ', '<svg role="img" aria-label="QR-Code' + (c.titel ? ': ' + esc(c.titel) : '') + '" ');
      codes.push(c);
    });
    if (!codes.length){
      box.innerHTML = ''; $('#qrWerkzeug').hidden = true;
      meldung(zuLang.length ? 'fehler' : 'info', zuLang.length ? '<p>Code ' + zuLang.join(', ') + ': Der Text ist zu lang für einen QR-Code.</p>' : '<p>Gib links einen Text oder Link ein – die QR-Codes erscheinen sofort hier.</p>');
      return;
    }
    meldung(zuLang.length ? 'warnung' : '', zuLang.length ? '<p>Code ' + zuLang.join(', ') + ' ist zu lang und wird weggelassen.</p>' : '');
    var pro = st.opt.proBlatt, html = '';
    for (var s = 0; s < codes.length; s += pro){
      html += '<article class="qr-blatt qr-karten pro-' + pro + (st.opt.schnitt ? ' schnitt' : '') + (s ? ' neue-seite' : '') + '">';
      codes.slice(s, s + pro).forEach(function(c, k){
        html += '<figure class="qr-karte">' + c.svg +
          (st.opt.titelZeigen && c.titel ? '<figcaption class="qr-karte-titel">' + esc(c.titel) + '</figcaption>' : '') +
          (st.opt.inhaltZeigen ? '<p class="qr-karte-text">' + esc(c.text) + '</p>' : '') +
          '<p class="qr-lesbar nur-bildschirm" data-i="' + (s + k) + '"><span class="lade" aria-hidden="true"></span>wird geprüft …</p>' +
          '<span class="qr-downloads nur-bildschirm"><button type="button" class="btn ghost klein qr-png" data-i="' + (s + k) + '">PNG</button>' +
          '<button type="button" class="btn ghost klein qr-svg" data-i="' + (s + k) + '">SVG</button></span></figure>';
      });
      html += '</article>';
    }
    box.innerHTML = html;
    $('#qrWerkzeug').hidden = false; leer();
    [].forEach.call(box.querySelectorAll('.qr-png'), function(b){
      if (Labor.imArtefakt()){ b.hidden = true; return; }   // im Artefakt nur als SVG
      b.addEventListener('click', function(){ pngSpeichern(codes[+b.dataset.i]); });
    });
    [].forEach.call(box.querySelectorAll('.qr-svg'), function(b){ b.addEventListener('click', function(){ svgSpeichern(codes[+b.dataset.i]); }); });
    pruefen(codes, ++fertigLauf);
  }
  /* ---------- Gestaltung ---------- */
  var VORLAGEN = [
    { k:'klassisch', name:'Klassisch', d:{ form:'quadrat', rahmen:'quadrat', mitte:'quadrat', farbe:'#000000', farbe2:'#555555', verlauf:'', augenEigen:false, augen:'#000000', hintergrund:'#ffffff' } },
    { k:'fabulous', name:'Fabulous', d:{ form:'fliessend', rahmen:'abgerundet', mitte:'abgerundet', farbe:'#B4530F', farbe2:'#1A1411', verlauf:'linear', augenEigen:true, augen:'#1A1411', hintergrund:'#ffffff' } },
    { k:'punkte', name:'Punkte', d:{ form:'punkte', rahmen:'kreis', mitte:'kreis', farbe:'#1A1411', farbe2:'#555555', verlauf:'', augenEigen:false, augen:'#1A1411', hintergrund:'#ffffff' } },
    { k:'weich', name:'Weich', d:{ form:'abgerundet', rahmen:'abgerundet', mitte:'kreis', farbe:'#3D3530', farbe2:'#555555', verlauf:'', augenEigen:true, augen:'#A9490B', hintergrund:'#ffffff' } },
    { k:'blatt', name:'Blatt', d:{ form:'fliessend', rahmen:'blatt', mitte:'blatt', farbe:'#2E6B3A', farbe2:'#173D20', verlauf:'radial', augenEigen:true, augen:'#173D20', hintergrund:'#ffffff' } },
    { k:'nacht', name:'Nacht', d:{ form:'raute', rahmen:'abgerundet', mitte:'abgerundet', farbe:'#3B2A7A', farbe2:'#7A1F4D', verlauf:'linear', augenEigen:true, augen:'#1A1411', hintergrund:'#ffffff' } }
  ];
  var FORMEN = {
    form:[['quadrat', 'Quadrate'], ['abgerundet', 'Abgerundet'], ['punkte', 'Punkte'], ['fliessend', 'Fliessend'], ['raute', 'Rauten']],
    rahmen:[['quadrat', 'Eckig'], ['abgerundet', 'Abgerundet'], ['kreis', 'Rund'], ['blatt', 'Blatt']],
    mitte:[['quadrat', 'Eckig'], ['abgerundet', 'Abgerundet'], ['kreis', 'Rund'], ['blatt', 'Blatt']]
  };
  var D = st.opt.design = Object.assign({ logoArt:'kein', logoGroesse:22, logoFrei:true, durchsichtig:false, vorlage:'klassisch' }, VORLAGEN[0].d, st.opt.design || {});
  // Logo «Rätsellabor»: der Kolben aus dem Kopf der Seite, auf weissem Grund
  var LABOR_LOGO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 4 160 160">' +
    '<circle cx="34" cy="21" r="6" fill="#F28C38"/><circle cx="44" cy="12" r="6.5" fill="#F28C38"/><circle cx="57" cy="13" r="6.5" fill="#F28C38"/><circle cx="66" cy="25" r="6" fill="#F28C38"/>' +
    '<circle cx="60" cy="39" r="5.5" fill="#F28C38"/><circle cx="51" cy="51" r="5" fill="#F28C38"/><circle cx="50" cy="70" r="5" fill="#F28C38"/>' +
    '<path d="M27.4 132 H42 C44 129 40 124 44.5 121 C47 119.3 53 119.3 55.5 121 C60 124 56 129 58 132 H72.6 L84 152 Q88 160 79 160 H21 Q12 160 16 152 Z" fill="#F28C38"/>' +
    '<path d="M40 82 V110 L16 152 Q12 160 21 160 H79 Q88 160 84 152 L60 110 V82" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M33 82 H67" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/></svg>');
  function logoUrl(){ return D.logoArt === 'labor' ? LABOR_LOGO : D.logoArt === 'eigen' ? (st.logoDaten || '') : ''; }
  function designKern(){
    return { form:D.form, rahmen:D.rahmen, mitte:Kern.passendeMitte(D.rahmen, D.mitte), farbe:D.farbe, farbe2:D.farbe2, verlauf:D.verlauf,
      hintergrund:D.durchsichtig ? '' : D.hintergrund, augen:D.augenEigen ? D.augen : '', logo:logoUrl(), logoGroesse:D.logoGroesse / 100, logoFrei:D.logoFrei };
  }
  // kleine Vorschaubilder für die Formen
  function formBild(art, wert){
    var p = '', p2 = '', vb = '-0.5 -0.5 8 8';
    if (art === 'form'){
      var m = [[1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 0, 1]], h = function(r, c){ return !!(m[r] && m[r][c]); };
      vb = '-0.4 -0.4 4.8 4.8';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (m[r][c]) p += Kern.modulPfad(wert, c, r, { o:h(r - 1, c), u:h(r + 1, c), l:h(r, c - 1), r:h(r, c + 1) });
    } else if (art === 'rahmen'){ p = Kern.rahmenPfad(wert, 0, 0); p2 = Kern.mittePfad(Kern.passendeMitte(wert, D.mitte), 2, 2); }
    else { p2 = Kern.rahmenPfad(D.rahmen, 0, 0); p = Kern.mittePfad(wert, 2, 2); }
    return '<svg viewBox="' + vb + '" aria-hidden="true"><path class="haupt" fill-rule="evenodd" d="' + p + '"/>' + (p2 ? '<path class="neben" fill-rule="evenodd" d="' + p2 + '"/>' : '') + '</svg>';
  }
  function formenZeichnen(){
    Object.keys(FORMEN).forEach(function(art){
      var box = bereich.querySelector('.qr-formen[data-wahl="' + art + '"]'), erlaubt = art === 'mitte' ? Kern.MITTE_ZU[D.rahmen] : null;
      box.innerHTML = FORMEN[art].map(function(f){
        var aus = erlaubt && erlaubt.indexOf(f[0]) < 0, an = (art === 'mitte' ? Kern.passendeMitte(D.rahmen, D.mitte) : D[art]) === f[0];
        return '<button type="button" role="radio" class="qr-form" data-wert="' + f[0] + '" aria-checked="' + an + '"' + (aus ? ' disabled title="Passt nicht zu dieser äusseren Ecke – so liessen sich die Codes schlecht scannen"' : '') + '>' +
          formBild(art, f[0]) + '<span>' + f[1] + '</span></button>';
      }).join('');
      [].forEach.call(box.querySelectorAll('.qr-form'), function(b){
        b.addEventListener('click', function(){ D[art] = b.dataset.wert; if (art === 'rahmen') D.mitte = Kern.passendeMitte(D.rahmen, D.mitte); geaendertDesign(); });
      });
    });
  }
  function vorlagenZeichnen(){
    var q = Kern.code('Rätsellabor', 'M');
    $('#qrVorlagen').innerHTML = VORLAGEN.map(function(v){
      return '<button type="button" class="qr-vorlage" data-k="' + v.k + '" aria-pressed="' + (D.vorlage === v.k) + '">' +
        Kern.gestaltet(q, Object.assign({}, v.d, { mitte:Kern.passendeMitte(v.d.rahmen, v.d.mitte), augen:v.d.augenEigen ? v.d.augen : '' }), 'v' + v.k) + '<span>' + v.name + '</span></button>';
    }).join('');
    [].forEach.call(bereich.querySelectorAll('.qr-vorlage'), function(b){
      b.addEventListener('click', function(){ var v = VORLAGEN.filter(function(x){ return x.k === b.dataset.k; })[0]; Object.assign(D, v.d, { vorlage:v.k, durchsichtig:false }); designFelder(); geaendertDesign(true); });
    });
  }
  function designFelder(){
    $('#qrFarbe').value = D.farbe; $('#qrFarbe2').value = D.farbe2; $('#qrAugen').value = D.augen; $('#qrHintergrund').value = D.hintergrund;
    $('#qrVerlauf').value = D.verlauf; $('#qrAugenEigen').checked = D.augenEigen; $('#qrDurchsichtig').checked = D.durchsichtig;
    $('#qrLogoGroesse').value = D.logoGroesse; $('#qrLogoFrei').checked = D.logoFrei;
    [].forEach.call(bereich.querySelectorAll('input[name="qrLogo"]'), function(r){ r.checked = r.value === D.logoArt; });
    bereich.querySelector('[data-verlauf]').hidden = !D.verlauf; bereich.querySelector('[data-augen]').hidden = !D.augenEigen; bereich.querySelector('[data-grund]').hidden = D.durchsichtig;
    bereich.querySelector('[data-logo]').hidden = D.logoArt === 'kein'; bereich.querySelector('[data-logo-eigen]').hidden = D.logoArt !== 'eigen';
    var sf = $('#qrStufeFertig'); sf.disabled = !!logoUrl(); sf.title = logoUrl() ? 'Mit Logo wird automatisch die höchste Fehlertoleranz (30 %) verwendet.' : '';
    formenZeichnen(); designInfo();
  }
  function geaendertDesign(vorlage){
    if (!vorlage) D.vorlage = '';
    [].forEach.call(bereich.querySelectorAll('.qr-vorlage'), function(b){ b.setAttribute('aria-pressed', String(D.vorlage === b.dataset.k)); });
    speichern(); designFelder(); fertigSpaeter();
  }
  [['qrFarbe', 'farbe'], ['qrFarbe2', 'farbe2'], ['qrAugen', 'augen'], ['qrHintergrund', 'hintergrund']].forEach(function(p){
    $('#' + p[0]).addEventListener('input', function(){ D[p[1]] = this.value; geaendertDesign(); });
  });
  $('#qrVerlauf').addEventListener('change', function(){ D.verlauf = this.value; geaendertDesign(); });
  [['qrAugenEigen', 'augenEigen'], ['qrDurchsichtig', 'durchsichtig'], ['qrLogoFrei', 'logoFrei']].forEach(function(p){
    $('#' + p[0]).addEventListener('change', function(){ D[p[1]] = this.checked; geaendertDesign(); });
  });
  $('#qrLogoGroesse').addEventListener('input', function(){ D.logoGroesse = +this.value; geaendertDesign(); });
  [].forEach.call(bereich.querySelectorAll('input[name="qrLogo"]'), function(r){
    r.addEventListener('change', function(){ if (!r.checked) return; D.logoArt = r.value; geaendertDesign(); if (r.value === 'eigen' && !st.logoDaten) $('#qrLogoDatei').click(); });
  });
  // eigenes Logo: verkleinert als PNG speichern (nur in diesem Tab)
  $('#qrLogoDatei').addEventListener('change', function(){
    var f = this.files && this.files[0]; if (!f) return;
    var leser = new FileReader();
    leser.onload = function(){
      var img = new Image();
      img.onload = function(){
        var m = Math.min(1, 320 / Math.max(img.naturalWidth || 320, img.naturalHeight || 320)), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round((img.naturalWidth || 320) * m)); cv.height = Math.max(1, Math.round((img.naturalHeight || 320) * m));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        try { st.logoDaten = cv.toDataURL('image/png'); } catch(e){ st.logoDaten = String(leser.result); }
        try { sessionStorage.setItem(TAB + '-logo', st.logoDaten); } catch(e){}
        D.logoArt = 'eigen'; geaendertDesign();
      };
      img.onerror = function(){ $('#qrDesignInfo').textContent = 'Dieses Bild lässt sich nicht verwenden. Nimm ein PNG-, JPG- oder SVG-Bild.'; };
      img.src = String(leser.result);
    };
    leser.readAsDataURL(f);
  });
  try { st.logoDaten = sessionStorage.getItem(TAB + '-logo') || ''; } catch(e){}
  // Kontrast prüfen (WCAG-Formel); helle Punkte auf dunklem Grund lesen viele Handys nicht
  function hell(h){ var c = [1, 3, 5].map(function(i){ var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function designInfo(){
    var grund = D.durchsichtig ? '#ffffff' : D.hintergrund, vorne = [D.farbe].concat(D.verlauf ? [D.farbe2] : [], D.augenEigen ? [D.augen] : []), h = [];
    var kontrast = Math.min.apply(null, vorne.map(function(f){ var a = hell(f), b = hell(grund); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }));
    if (vorne.some(function(f){ return hell(f) > hell(grund); })) h.push('⚠ Helle Punkte auf dunklem Hintergrund können viele Handys nicht lesen.');
    else if (kontrast < 4) h.push('⚠ Wenig Kontrast zwischen Punkten und Hintergrund – nimm dunklere Punkte oder einen helleren Hintergrund.');
    if (logoUrl()) h.push('Mit Logo wird automatisch die höchste Fehlertoleranz (30 %) verwendet.');
    if (D.logoArt === 'eigen' && !st.logoDaten) h.push('Wähle ein Bild für das Logo.');
    if (D.durchsichtig) h.push('Durchsichtig: Auf farbigem Papier muss der Hintergrund hell genug bleiben.');
    $('#qrDesignInfo').innerHTML = h.join('<br>');
  }

  /* ---------- Lesbarkeit prüfen: jeden Code als Bild zeichnen und mit einem QR-Leser (jsQR) lesen ---------- */
  var jsqrPromise = null, fertigLauf = 0;
  function leser(){
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!jsqrPromise) jsqrPromise = new Promise(function(ok, nein){
      var sk = document.createElement('script'); sk.src = 'gemeinsam/extern/jsQR.js';
      sk.onload = function(){ ok(window.jsQR); }; sk.onerror = function(){ jsqrPromise = null; nein(new Error('jsQR')); };
      document.head.appendChild(sk);
    });
    return jsqrPromise;
  }
  function svgBild(svgText, px, weiss){
    return new Promise(function(ok, nein){
      var w = +svgText.match(/viewBox="0 0 (\d+)/)[1], img = new Image();
      img.onload = function(){
        var cv = document.createElement('canvas'); cv.width = cv.height = w * px;
        var g = cv.getContext('2d');
        if (weiss){ g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(img, 0, 0, cv.width, cv.height); ok(cv);
      };
      img.onerror = nein;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    });
  }
  function pruefen(codes, lauf){
    leser().then(function(jsQR){
      codes.forEach(function(c, i){
        var feld = bereich.querySelector('.qr-lesbar[data-i="' + i + '"]');
        [8, 6, 10].reduce(function(p, px){
          return p.then(function(ok){ return ok || svgBild(c.svg, px, true).then(function(cv){
            var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height), e = jsQR(d.data, cv.width, cv.height, { inversionAttempts:'dontInvert' });
            return !!e && e.data === c.text;
          }, function(){ return false; }); });
        }, Promise.resolve(false)).then(function(ok){
          if (lauf !== fertigLauf || aus || !feld) return;
          feld.className = 'qr-lesbar nur-bildschirm ' + (ok ? 'gut' : 'schlecht');
          feld.textContent = ok ? '✓ Lässt sich scannen' : '⚠ Schwer lesbar – mehr Kontrast, einfachere Formen oder ein kleineres Logo wählen.';
        });
      });
    }, function(){
      [].forEach.call(bereich.querySelectorAll('.qr-lesbar'), function(f){ f.textContent = ''; });
    });
  }
  /* ---------- Herunterladen: PNG (Webseite) und SVG (auch im Artefakt) ---------- */
  function dateiName(c, endung){ return 'QR-Code' + (c.titel ? '-' + Labor.dateiname(c.titel) : '') + '.' + endung; }
  function herunterladen(blob, name){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  }
  function pngSpeichern(c){
    var w = +c.svg.match(/viewBox="0 0 (\d+)/)[1];
    svgBild(c.svg, Math.max(8, Math.round(1200 / w)), false).then(function(cv){
      try { cv.toBlob(function(b){ if (b) herunterladen(b, dateiName(c, 'png')); }, 'image/png'); }
      catch(e){ meldung('warnung', '<p>Als PNG klappt es mit diesem Logo nicht – speichere den Code als SVG.</p>'); }
    }, function(){ meldung('warnung', '<p>Das Bild konnte nicht erstellt werden – speichere den Code als SVG.</p>'); });
  }
  function svgSpeichern(c){
    var text = '<?xml version="1.0" encoding="UTF-8"?>\n' + c.svg.replace(/ role="img" aria-label="[^"]*"/, '');
    if (Labor.imArtefakt()){
      Labor.claude('downloads').then(function(d){ if (d) d.save({ filename:dateiName(c, 'svg'), data:text }).catch(function(){}); });
      return;
    }
    herunterladen(new Blob([text], { type:'image/svg+xml' }), dateiName(c, 'svg'));
  }

  /* ---------- PDF und Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', st.opt.modus === 'malen' && !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#qrDrucken'), function(){
    var malen = st.opt.modus === 'malen';
    var b = [].filter.call(bereich.querySelectorAll('#qrBlaetter .qr-blatt'), function(x){ return !x.classList.contains('qr-loesungsblatt') || (malen && st.opt.mitLoesung); });
    return { blaetter:b, name:Labor.pdfName(malen ? 'QR-Code-Ausmalen' : 'QR-Codes', malen ? st.titel : '') };
  }, function(t){ meldung('fehler', '<p>' + Labor.esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#qrDrucken').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#qrHerunterladen').hidden = false; });
  }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .ebene-gemalt, .ebene-loesung'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#qrHerunterladen').addEventListener('click', function(){
    if (!speicherOrt) return;
    var blaetter = [].slice.call(bereich.querySelectorAll('#qrBlaetter .qr-blatt'));
    if (st.opt.modus === 'malen' && !st.opt.mitLoesung) blaetter = blaetter.filter(function(b){ return !b.classList.contains('qr-loesungsblatt'); });
    if (!blaetter.length) return;
    var inhaltHtml = blaetter.map(function(b, i){ var k = sauber(b); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    var name = st.opt.modus === 'malen' ? 'QR-Code-zum-Ausmalen' : 'QR-Codes';
    speicherOrt.save({ filename:name + '.html', data:Labor.blattDatei(name.replace(/-/g, ' '), inhaltHtml, '.qr-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  /* ---------- Start ---------- */
  unteroptionen(); zielZeigen(); modusZeigen(); listeZeichnen(); textInfo(); vorlagenZeichnen(); designFelder();
  if (st.opt.modus === 'fertig') fertigZeigen();
  else { leer(); try { if (malInhalt() && sessionStorage.getItem(TAB)) erstellen(); } catch(x){} }

  return function stopp(){
    aus = true; clearTimeout(fertigTimer);
    if (timer) speichernJetzt();
    window.removeEventListener('beforeprint', druckVorbereiten);
    document.body.classList.remove('mit-loesung');
  };
}
})();
