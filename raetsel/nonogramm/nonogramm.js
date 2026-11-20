/* Rätsellabor – Generator «Nonogramm» (Malen nach Zahlen)
   Ein Raster; links von jeder Zeile und über jeder Spalte stehen Zahlen: so viele Felder nebeneinander werden angemalt,
   in dieser Reihenfolge, zwischen zwei Gruppen bleibt mindestens ein Feld leer (0: alles leer). Ist alles richtig
   angemalt, erscheinen Ziffern oder Buchstaben (Blockschrift 3 × 5 aus window.Pixelschrift, je eine leere Spalte
   dazwischen, Leerzeichen = Lücke, bei mehr als 6 Zeichen zwei Zeilen). Das Programm löst jedes Rätsel selbst, Zeile um
   Zeile und Spalte um Spalte (ohne Raten). Bleibt es stecken, kommen so wenige Hilfsfelder wie möglich dazu (schon
   angemalt oder mit × als leer markiert) – so ist das Rätsel immer eindeutig und ohne Raten lösbar. Blatt, Lösung, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('nonogramm');

/* KERN-START */
var Kern = (function(){
  /* Text → Raster (Zeilen aus 0/1). zeilen: Liste von Zeichenlisten (' ' = Lücke von 3 Spalten); zwischen zwei Zeichen
     eine leere Spalte, zwischen zwei Textzeilen eine leere Zeile; kürzere Zeilen in der Mitte. */
  function raster(zeilen, Z, b, h){
    var teile = zeilen.map(function(zs){
      var spalten = [];
      zs.forEach(function(c, i){
        if (i) spalten.push(null);
        if (c === ' ') { spalten.push(null, null, null); return; }
        for (var x = 0; x < b; x++) spalten.push(Z[c].map(function(r){ return r.charAt(x) === '#' ? 1 : 0; }));
      });
      return spalten;
    });
    var W = Math.max.apply(null, teile.map(function(t){ return t.length; })), g = [];
    teile.forEach(function(t, k){
      if (k) g.push(new Array(W + 1).join('0').split('').map(Number));
      var links = Math.floor((W - t.length) / 2);
      for (var y = 0; y < h; y++){
        var zeile = [];
        for (var x = 0; x < W; x++){ var s = t[x - links]; zeile.push(s ? s[y] : 0); }
        g.push(zeile);
      }
    });
    return g;
  }
  // Zahlen einer Linie (Gruppen angemalter Felder), leere Linie → [0]
  function zahlen(linie){ var l = [], n = 0; linie.forEach(function(v){ if (v) n++; else if (n){ l.push(n); n = 0; } }); if (n) l.push(n); return l.length ? l : [0]; }
  function hinweise(g){
    var H = g.length, W = g[0].length, spalten = [];
    for (var x = 0; x < W; x++) spalten.push(zahlen(g.map(function(z){ return z[x]; })));
    return { zeilen:g.map(zahlen), spalten:spalten };
  }
  /* Eine Linie lösen: zellen 0 unbekannt, 1 angemalt, 2 leer. → neue Zellen (alles, was in jeder passenden Anordnung
     gleich ist) oder null (widerspricht sich). Vorwärts G[j][p]: Gruppen 0..j−1 passen in [0, p); rückwärts R[j][p]:
     Gruppen j..k−1 passen in [p, n). */
  function linie(zahl, z){
    var n = z.length, b = zahl[0] === 0 ? [] : zahl, k = b.length, i, j, p;
    var voll = [0], leer = [0];
    for (i = 0; i < n; i++){ voll.push(voll[i] + (z[i] === 1 ? 1 : 0)); leer.push(leer[i] + (z[i] === 2 ? 1 : 0)); }
    function ohneVoll(a, e){ return a >= e || voll[e] - voll[a] === 0; }   // [a, e) darf leer sein
    function ohneLeer(a, e){ return leer[e] - leer[a] === 0; }            // [a, e) darf angemalt sein
    var G = [], R = [];
    for (j = 0; j <= k; j++){ G.push(new Array(n + 1).fill(false)); R.push(new Array(n + 2).fill(false)); }
    for (p = 0; p <= n; p++) G[0][p] = ohneVoll(0, p);
    for (j = 1; j <= k; j++) for (p = 1; p <= n; p++){
      var L = b[j - 1], s = p - L, ok = G[j][p - 1] && z[p - 1] !== 1;
      if (!ok && s >= 0 && ohneLeer(s, p)) ok = j === 1 ? ohneVoll(0, s) : s >= 1 && z[s - 1] !== 1 && G[j - 1][s - 1];
      G[j][p] = ok;
    }
    for (p = 0; p <= n; p++) R[k][p] = ohneVoll(p, n);
    R[k][n + 1] = true;
    for (j = k - 1; j >= 0; j--){ R[j][n + 1] = false; for (p = n; p >= 0; p--){
      var L2 = b[j], e = p + L2, ok2 = p < n && R[j][p + 1] && z[p] !== 1;
      if (!ok2 && e <= n && ohneLeer(p, e)) ok2 = j === k - 1 ? ohneVoll(e, n) : e < n && z[e] !== 1 && R[j + 1][e + 1];
      R[j][p] = ok2;
    } }
    if (!R[0][0]) return null;
    var kannVoll = new Array(n).fill(false), kannLeer = new Array(n).fill(false);
    for (i = 0; i < n; i++) if (z[i] !== 1) for (j = 0; j <= k; j++) if (G[j][i] && R[j][i + 1]){ kannLeer[i] = true; break; }
    for (j = 0; j < k; j++){
      var L3 = b[j];
      for (var s3 = 0; s3 + L3 <= n; s3++){
        if (!ohneLeer(s3, s3 + L3)) continue;
        var li = s3 === 0 ? j === 0 : z[s3 - 1] !== 1 && G[j][s3 - 1];
        if (!li) continue;
        var e3 = s3 + L3, re = e3 === n ? j === k - 1 : z[e3] !== 1 && R[j + 1][e3 + 1];
        if (!re) continue;
        for (i = s3; i < e3; i++) kannVoll[i] = true;
      }
    }
    var neu = z.slice();
    for (i = 0; i < n; i++){
      if (!kannVoll[i] && !kannLeer[i]) return null;
      if (!kannLeer[i]) neu[i] = 1; else if (!kannVoll[i]) neu[i] = 2;
    }
    return neu;
  }
  /* Ganzes Rätsel lösen, so weit es Linie um Linie geht (start: bekannte Felder). → { feld, fertig, widerspruch } */
  function loesen(hw, H, W, start){
    var f = start ? start.map(function(r){ return r.slice(); }) : [], x, y;
    if (!start) for (y = 0; y < H; y++) f.push(new Array(W).fill(0));
    var zeileOffen = new Array(H).fill(true), spalteOffen = new Array(W).fill(true), weiter = true;
    while (weiter){
      weiter = false;
      for (y = 0; y < H; y++) if (zeileOffen[y]){
        zeileOffen[y] = false;
        var nz = linie(hw.zeilen[y], f[y]); if (!nz) return { feld:f, fertig:false, widerspruch:true };
        for (x = 0; x < W; x++) if (nz[x] !== f[y][x]){ f[y][x] = nz[x]; spalteOffen[x] = true; weiter = true; }
      }
      for (x = 0; x < W; x++) if (spalteOffen[x]){
        spalteOffen[x] = false;
        var sp = f.map(function(r){ return r[x]; }), ns = linie(hw.spalten[x], sp); if (!ns) return { feld:f, fertig:false, widerspruch:true };
        for (y = 0; y < H; y++) if (ns[y] !== f[y][x]){ f[y][x] = ns[y]; zeileOffen[y] = true; weiter = true; }
      }
    }
    var fertig = f.every(function(r){ return r.every(function(v){ return v; }); });
    return { feld:f, fertig:fertig, widerspruch:false };
  }
  /* Hilfsfelder: so lange das Lösen stecken bleibt, das offene Feld vorgeben, das am meisten weiterhilft (bei Gleichstand
     lieber ein angemaltes). → [{ x, y, wert (1 angemalt, 2 leer) }] */
  function hilfen(g, hw){
    var H = g.length, W = g[0].length, liste = [], start = null;
    for (var runde = 0; runde < H * W; runde++){
      var r = loesen(hw, H, W, start);
      if (r.fertig) return liste;
      var best = null;
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++){
        if (r.feld[y][x]) continue;
        var versuch = r.feld.map(function(z){ return z.slice(); }), wert = g[y][x] ? 1 : 2;
        versuch[y][x] = wert;
        var r2 = loesen(hw, H, W, versuch), n = 0;
        r2.feld.forEach(function(z){ z.forEach(function(v){ if (v) n++; }); });
        var punkte = n + (wert === 1 ? 0.5 : 0) + (r2.fertig ? 1000 : 0);
        if (!best || punkte > best.punkte) best = { x:x, y:y, wert:wert, punkte:punkte };
      }
      liste.push({ x:best.x, y:best.y, wert:best.wert });
      start = r.feld.map(function(z){ return z.slice(); });
      liste.forEach(function(h){ start[h.y][h.x] = h.wert; });
    }
    return liste;
  }
  /* Text in Zeilen teilen: bis MAX_ZEILE Zeichen eine Zeile, sonst zwei (am liebsten an einem Leerzeichen nahe der Mitte) */
  var MAX_ZEILE = 6;
  function zeilenAus(zeichen){
    var ohne = zeichen.filter(function(c){ return c !== ' '; }).length;
    if (ohne <= MAX_ZEILE) return [zeichen];
    var best = null;
    for (var i = 1; i < zeichen.length; i++){
      var a = zeichen.slice(0, i), b = zeichen.slice(i);
      while (a.length && a[a.length - 1] === ' ') a = a.slice(0, -1);
      while (b.length && b[0] === ' ') b = b.slice(1);
      if (!a.length || !b.length) continue;
      var la = a.length, lb = b.length, guete = Math.max(la, lb) - (zeichen[i] === ' ' || zeichen[i - 1] === ' ' ? 1.5 : 0);
      if (!best || guete < best.guete) best = { guete:guete, z:[a, b] };
    }
    return best.z;
  }
  return { raster:raster, zahlen:zahlen, hinweise:hinweise, linie:linie, loesen:loesen, hilfen:hilfen, zeilenAus:zeilenAus, MAX_ZEILE:MAX_ZEILE };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639, MM = 703 / 186, MAX = 12;
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }

var VORLAGE = '<div class="ng">' +
  tx('<header class="ng-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Nonogramm</h1>') +
    tx('<p>Malen nach Zahlen: Die Zahlen an Zeilen und Spalten sagen, welche Felder angemalt werden – am Schluss erscheinen Ziffern oder Buchstaben.</p></header>') +
  tx('<div class="ng-layout"><section class="ng-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Lösung</h2><p>Ziffern und Buchstaben, die beim Ausmalen erscheinen – bis 12 Zeichen (ab 7 Zeichen zwei Zeilen).</p></div></div>') +
      tx('<label class="feld-label" for="ngText">Ziffern oder Buchstaben</label>') +
      tx('<div class="ng-zeile"><input type="text" id="ngText" maxlength="24" autocomplete="off" spellcheck="false"><button type="button" class="btn klein" id="ngLeeren">Leeren</button></div>') +
      '<div class="ng-zaehler" id="ngZaehler" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Raster</h2></div></div>') +
      tx('<label class="opt"><input type="checkbox" id="ngFuenfer"><span>Dicke Linie alle 5 Felder (hilft beim Zählen)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ngLinie"><span>Linie für die Lösung</span></label>') +
      '<p class="hinweis" id="ngHilfenInfo"></p>' +
    '</div>' +
  '</section>' +
  tx('<section class="ng-ausgabe" aria-label="Ergebnis">') +
    '<div id="ngMeldung" aria-live="polite"></div>' +
    '<div class="ng-werkzeug">' +
      tx('<button type="button" class="btn klein" id="ngZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="ngMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="ngPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="ngHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="ng-blaetter"><div class="ng-rahmen"><article class="ng-blatt" id="ngBlatt"></article></div>' +
    '<div class="ng-rahmen ng-loesung-rahmen"><article class="ng-blatt ng-loesungsblatt" id="ngLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="8" y="8" width="13" height="13"/><path d="M8 12.3h13M8 16.7h13M12.3 8v13M16.7 8v13"/><path d="M10 9.5h2v2h-2zM14.5 14h2v2h-2zM10 18.5h2v2h-2z" fill="currentColor" stroke="none"/>' +
  '<path d="M3 10h3M3 14.5h3M3 19h3M10 3v3M14.5 3v3M19 3v3" stroke-width="1.4"/></svg>';

Labor.registriere({
  id:'nonogramm',
  titel:'Nonogramm',
  kurz:'Malen nach Zahlen – Ziffern oder Buchstaben erscheinen',
  beschreibung:'Ein Raster mit Zahlen an jeder Zeile und Spalte: Wer richtig anmalt, sieht am Schluss Ziffern oder Buchstaben. Immer eindeutig und ohne Raten lösbar, nötigenfalls mit Hilfsfeldern. Mit Lösungsblatt.',
  merkmale:['Eigene Ziffern und Buchstaben', 'Immer ohne Raten lösbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/nonogramm/nonogramm.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false, PS = window.Pixelschrift;
  var TAB = 'nonogramm-eingaben', OPT = 'nonogramm-einstellungen';
  var STANDARD = { fuenfer:true, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e) st.text = String(e.text || ''); } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#ngMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  $('#ngText').value = st.text;
  var warte = 0;
  $('#ngText').addEventListener('input', function(){ st.text = this.value; speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 250); });
  $('#ngLeeren').addEventListener('click', function(){ st.text = ''; $('#ngText').value = ''; speichern(); zeichnen(); $('#ngText').focus(); });
  [['#ngFuenfer', 'fuenfer'], ['#ngLinie', 'linie'], ['#ngMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#ngZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#ngLoesung').classList.toggle('zeigen', an); $('#ngLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });

  // Text lesen: Grossbuchstaben (Ä → AE …), Ziffern, Leerzeichen als Lücke (mehrere zusammen = eine)
  function lesen(text){
    var t = String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS');
    var z = [], weg = [];
    Array.from(t).forEach(function(c){
      if (PS.ZEICHEN[c]) z.push(c);
      else if (/\s/.test(c)){ if (z.length && z[z.length - 1] !== ' ') z.push(' '); }
      else if (weg.indexOf(c) < 0) weg.push(c);
    });
    while (z.length && z[z.length - 1] === ' ') z.pop();
    var n = 0, aus = [];
    z.forEach(function(c){ if (c === ' ' || n < MAX){ aus.push(c); if (c !== ' ') n++; } });
    while (aus.length && aus[aus.length - 1] === ' ') aus.pop();
    return { zeichen:aus, weg:weg, zuViele:z.filter(function(c){ return c !== ' '; }).length > MAX };
  }

  /* ---------- Zeichnen ---------- */
  var R = null;
  function rasterSvg(loesung){
    var g = R.g, hw = R.hw, H = g.length, W = g[0].length;
    var zMax = Math.max.apply(null, hw.zeilen.map(function(l){ return l.length; })), sMax = Math.max.apply(null, hw.spalten.map(function(l){ return l.length; }));
    var s = Math.min(11 * MM, (B - 8) / (W + zMax * 0.62)), zb = zMax * 0.62 * s, sh = sMax * 0.72 * s + s * 0.2;
    var x0 = (B - (zb + W * s)) / 2 + zb, y0 = sh, breite = x0 + W * s + 2, hoehe = y0 + H * s + 2, t = '', gr = s * 0.56;
    // Zahlen: Zeilen rechtsbündig links vom Raster, Spalten unten bündig über dem Raster; jede zweite Zeile/Spalte leicht hinterlegt
    hw.zeilen.forEach(function(l, y){
      if (y % 2) t += '<rect x="' + f1(x0 - zb) + '" y="' + f1(y0 + y * s) + '" width="' + f1(zb) + '" height="' + f1(s) + '" fill="#F3EFEB"/>';
      l.forEach(function(n, i){ t += '<text x="' + f1(x0 - (l.length - i - 0.5) * 0.62 * s) + '" y="' + f1(y0 + (y + 0.5) * s + gr * 0.36) + '" font-size="' + f1(gr) + '" text-anchor="middle" fill="' + TINTE + '">' + n + '</text>'; });
    });
    hw.spalten.forEach(function(l, x){
      if (x % 2) t += '<rect x="' + f1(x0 + x * s) + '" y="0" width="' + f1(s) + '" height="' + f1(sh) + '" fill="#F3EFEB"/>';
      l.forEach(function(n, i){ t += '<text x="' + f1(x0 + (x + 0.5) * s) + '" y="' + f1(y0 - s * 0.2 - (l.length - i - 1) * 0.72 * s - gr * 0.22) + '" font-size="' + f1(gr) + '" text-anchor="middle" fill="' + TINTE + '">' + n + '</text>'; });
    });
    // Felder: Lösung angemalt; auf dem Blatt die Hilfsfelder (grau angemalt oder ×)
    var dick = Math.max(1, s * 0.06);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++){
      var fx = x0 + x * s, fy = y0 + y * s;
      if (loesung && g[y][x]) t += '<rect x="' + f1(fx) + '" y="' + f1(fy) + '" width="' + f1(s) + '" height="' + f1(s) + '" fill="' + TINTE + '"/>';
    }
    if (!loesung) R.hilfen.forEach(function(h){
      var fx = x0 + h.x * s, fy = y0 + h.y * s;
      if (h.wert === 1) t += '<rect x="' + f1(fx) + '" y="' + f1(fy) + '" width="' + f1(s) + '" height="' + f1(s) + '" fill="#8A8079"/>';
      else t += '<path d="M' + f1(fx + s * 0.28) + ' ' + f1(fy + s * 0.28) + 'L' + f1(fx + s * 0.72) + ' ' + f1(fy + s * 0.72) + 'M' + f1(fx + s * 0.72) + ' ' + f1(fy + s * 0.28) + 'L' + f1(fx + s * 0.28) + ' ' + f1(fy + s * 0.72) + '" stroke="' + TINTE + '" stroke-width="' + f1(dick * 1.6) + '" stroke-linecap="round"/>';
    });
    // Linien: dünn, alle 5 dick (auf Wunsch), Rand dick
    var dl = '', dd = '';
    for (var i = 0; i <= W; i++){ var seg = 'M' + f1(x0 + i * s) + ' ' + f1(y0) + 'V' + f1(y0 + H * s); if (st.opt.fuenfer && i % 5 === 0 && i && i < W) dd += seg; else if (i && i < W) dl += seg; }
    for (var j = 0; j <= H; j++){ var seg2 = 'M' + f1(x0) + ' ' + f1(y0 + j * s) + 'H' + f1(x0 + W * s); if (st.opt.fuenfer && j % 5 === 0 && j && j < H) dd += seg2; else if (j && j < H) dl += seg2; }
    t += '<path d="' + dl + '" stroke="#8A8079" stroke-width="' + f1(Math.max(0.6, s * 0.025)) + '"/>';
    if (dd) t += '<path d="' + dd + '" stroke="' + TINTE + '" stroke-width="' + f1(dick * 1.3) + '"/>';
    t += '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(W * s) + '" height="' + f1(H * s) + '" fill="none" stroke="' + TINTE + '" stroke-width="' + f1(dick * 1.6) + '"/>';
    return '<svg class="ng-raster" width="' + f1(breite) + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + f1(breite) + ' ' + f1(hoehe) + '">' + t + '</svg>';
  }
  function zeichnen(){
    if (aus) return;
    var L = lesen(st.text), h = '';
    if (L.weg.length) h += '<p class="warnung">' + esc(L.weg.join(' ')) + tx(' gibt es in der Blockschrift nicht – nur Buchstaben A–Z und Ziffern.</p>');
    if (L.zuViele) h += tx('<p class="warnung">Höchstens ') + MAX + tx(' Zeichen – der Rest fällt weg.</p>');
    var ohne = L.zeichen.filter(function(c){ return c !== ' '; });
    if (ohne.length) h += '<p class="ng-info">' + ohne.length + tx(' Zeichen') + (ohne.length > Kern.MAX_ZEILE ? tx(', zwei Zeilen') : '') + '.</p>';
    var gleich = PS.AEHNLICH.filter(function(p){ return ohne.indexOf(p[0]) >= 0 && ohne.indexOf(p[1]) >= 0; });
    if (gleich.length) h += '<p class="ng-info">' + gleich.map(function(p){ return p[0] + tx(' und ') + p[1]; }).join(', ') + tx(' sehen sich in der Blockschrift ähnlich.</p>');
    $('#ngZaehler').innerHTML = h;
    var leer = !ohne.length;
    ['#ngPdf', '#ngHerunterladen', '#ngZeigeLoesung'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ R = null; $('#ngBlatt').parentNode.hidden = true; $('#ngLoesung').parentNode.hidden = true; $('#ngHilfenInfo').textContent = ''; meldung('info', tx('<p>Gib links Ziffern oder Buchstaben ein.</p>')); return; }
    meldung('', ''); $('#ngBlatt').parentNode.hidden = false; $('#ngLoesung').parentNode.hidden = false;
    var zeilen = Kern.zeilenAus(L.zeichen), g = Kern.raster(zeilen, PS.ZEICHEN, PS.BREITE, PS.HOEHE), hw = Kern.hinweise(g);
    R = { g:g, hw:hw, zeilen:zeilen, hilfen:Kern.hilfen(g, hw) };
    var nh = R.hilfen.length, nv = R.hilfen.filter(function(x){ return x.wert === 1; }).length;
    $('#ngHilfenInfo').textContent = !nh ? tx('Lösbar ohne Hilfsfelder – Zeile um Zeile und Spalte um Spalte, ohne Raten.') :
      nh + (nh === 1 ? tx(' Hilfsfeld') : tx(' Hilfsfelder')) + tx(' nötig, damit es ohne Raten aufgeht') + (nv && nv < nh ? tx(' (grau angemalt oder mit × als leer markiert).') : nv ? tx(' (grau angemalt).') : tx(' (mit × als leer markiert).'));
    var o = st.opt, wort = zeilen.map(function(z){ return z.join(''); }).join(' ');
    var anleitung = tx('Male in jeder Zeile und jeder Spalte Felder an: Die Zahlen sagen, wie viele Felder nebeneinander angemalt sind – in dieser Reihenfolge. Zwischen zwei Gruppen bleibt mindestens ein Feld leer. 0 heisst: alles leer.') +
      (nh ? tx(' Graue Felder sind schon angemalt') + (nv < nh ? tx(', Felder mit × bleiben leer') : '') + '.' : '') + tx(' Wenn alles stimmt, erscheint die Lösung.');
    $('#ngBlatt').innerHTML = (o.titelAn ? tx('<h2>Nonogramm</h2>') : '') + (o.anleitungAn ? '<p class="ng-anleitung">' + esc(anleitung) + '</p>' : '') +
      '<div class="ng-mitte">' + rasterSvg(false) + '</div>' + (o.linie ? tx('<p class="ng-antwort">Lösung: <span class="ng-linie"></span></p>') : '');
    $('#ngLoesung').innerHTML = (o.titelAn ? tx('<h2>Nonogramm – Lösung</h2>') : tx('<p class="ng-anleitung"><b>Lösung</b></p>')) + '<div class="ng-mitte">' + rasterSvg(true) + '</div>' +
      tx('<p class="ng-loesung-text">Lösung: <b>') + esc(wort) + '</b></p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#ngBlatt')].concat(st.opt.mitLoesung ? [$('#ngLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#ngPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Nonogramm', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#ngPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#ngHerunterladen').hidden = false; });
  }
  $('#ngHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Nonogramm', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Nonogramm'), inhalt, '.ng-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
