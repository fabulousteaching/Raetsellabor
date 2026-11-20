/* Rätsellabor – Generator «Textformen»
   Ein Text wird in einer Form dargestellt: als Spirale, die die Form von aussen nach innen füllt (Kreis, Herz, Stern,
   Blume, Quadrat, Dreieck, Tropfen), oder in Zeilen auf Wellen oder Regenbogen-Bögen. Die Schriftgrösse wird so gewählt,
   dass der Text die Form füllt. Zum Lesen dreht man das Blatt. Farbe schwarz, einfarbig oder bunt; auf Wunsch eine
   kleine Form in der Mitte und Linien zum Abschreiben. Blatt, Lösungsblatt (der Text), PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('textformen');

/* KERN-START */
var Kern = (function(){
  var N = 720;   // Abtastung des Umrisses: alle 0.5°
  // Richtung zum Winkel φ (im Uhrzeigersinn ab oben, Bildschirm-Koordinaten)
  function dir(w){ return [Math.sin(w), -Math.cos(w)]; }
  function polar(f){ var r = []; for (var i = 0; i < N; i++) r.push(f(i * 2 * Math.PI / N)); return r; }
  // Radius glätten (gleitender Mittelwert über ±breite Abtastpunkte, zyklisch) – rundet Ecken
  function glaetten(r, breite){ var aus = []; for (var i = 0; i < N; i++){ var s = 0; for (var k = -breite; k <= breite; k++) s += r[(i + k + N) % N]; aus.push(s / (2 * breite + 1)); } return aus; }
  /* Umriss aus Punkten (geschlossen, im Uhrzeigersinn): Mittelpunkt suchen, von dem aus jeder Strahl den Rand einmal
     trifft und der kleinste Radius möglichst gross ist (gleichmässige Abstände der Spirale) → Radien */
  function ausPunkten(pts){
    var best = null, xs = pts.map(function(p){ return p[0]; }), ys = pts.map(function(p){ return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    for (var gx = 0.3; gx <= 0.7; gx += 0.05) for (var gy = 0.25; gy <= 0.75; gy += 0.025){
      var c = [x0 + (x1 - x0) * gx, y0 + (y1 - y0) * gy], r = radien(pts, c);
      if (!r) continue;
      var q = Math.min.apply(null, r) / (r.reduce(function(a, b){ return a + b; }, 0) / N);
      if (!best || q > best.q) best = { q:q, r:r, c:c };
    }
    return best.r;
  }
  function radien(pts, c){
    var w = pts.map(function(p){ return Math.atan2(p[0] - c[0], -(p[1] - c[1])); }), d = pts.map(function(p){ return Math.hypot(p[0] - c[0], p[1] - c[1]); });
    // Winkel fortlaufend machen und prüfen, ob sie stetig wachsen (sonst trifft ein Strahl den Rand mehrmals)
    var u = [w[0]];
    for (var i = 1; i < w.length; i++){ var dw = w[i] - w[i - 1]; while (dw > Math.PI) dw -= 2 * Math.PI; while (dw < -Math.PI) dw += 2 * Math.PI; if (dw <= 0) return null; u.push(u[i - 1] + dw); }
    if (Math.abs(u[u.length - 1] - u[0] - 2 * Math.PI) > 0.2) return null;
    // geschlossen: den ersten Punkt eine Runde weiter hinten anhängen, dann je Zielwinkel suchen und dazwischen interpolieren
    u.push(u[0] + 2 * Math.PI); d.push(d[0]);
    var r = [];
    for (var k = 0; k < N; k++){
      var ziel = u[0] + (((k * 2 * Math.PI / N) - u[0]) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), lo = 0, hi = u.length - 1;
      while (hi - lo > 1){ var m = (lo + hi) >> 1; if (u[m] <= ziel) lo = m; else hi = m; }
      var t = u[hi] > u[lo] ? (ziel - u[lo]) / (u[hi] - u[lo]) : 0;
      r.push(d[lo] + (d[hi] - d[lo]) * t);
    }
    return r;
  }
  // Formen als Radien (Mittelpunkt 0, 0; grösster Radius 1). Spitzen und Ecken gerundet – sonst stossen die Buchstaben zusammen
  function form(name){ var r = roh(name); if (!r) return null; var m = Math.max.apply(null, r); return r.map(function(v){ return v / m; }); }
  function roh(name){
    if (name === 'kreis') return polar(function(){ return 1; });
    // Stern und Blume sanft: In engen Einbuchtungen stiessen die Köpfe der Buchstaben zusammen (Krümmungsradius dort
    // mindestens etwa 3.5 Schriftgrössen); die kleine Form in der Mitte zeigt den spitzen Stern und die Blüte
    if (name === 'stern') return polar(function(w){ return 0.86 + 0.14 * Math.cos(5 * w); });
    if (name === 'blume') return polar(function(w){ return 0.9 + 0.1 * Math.cos(6 * w); });
    if (name === 'quadrat') return polar(function(w){ var p = 5; return Math.pow(Math.pow(Math.abs(Math.sin(w)), p) + Math.pow(Math.abs(Math.cos(w)), p), -1 / p); });
    if (name === 'dreieck') return glaetten(polar(function(w){ var s = ((w % (2 * Math.PI / 3)) + 2 * Math.PI / 3) % (2 * Math.PI / 3); return 0.5 / Math.cos(s - Math.PI / 3); }), 24);
    var pts = [], i, t;
    if (name === 'herz') for (i = 0; i < 720; i++){ t = i * 2 * Math.PI / 720;
      pts.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
    if (name === 'tropfen') for (i = 0; i < 720; i++){ t = i * 2 * Math.PI / 720; pts.push([Math.sin(t) * Math.sin(t / 2) * 0.85, -Math.cos(t)]); }
    return pts.length ? glaetten(ausPunkten(pts), name === 'herz' ? 30 : 12) : null;
  }
  // Punkt des Umrisses (Radius r, Winkel w), Massstab s
  function punkt(r, w, s){ var i = ((w / (2 * Math.PI) * N) % N + N) % N, a = Math.floor(i), b = (a + 1) % N, t = i - a, rr = r[a] + (r[b] - r[a]) * t, d = dir(w); return [d[0] * rr * s, d[1] * rr * s]; }
  // Ausdehnung des Umrisses (für die Grösse auf dem Blatt)
  function rahmen(r){ var x0 = 0, x1 = 0, y0 = 0, y1 = 0; for (var i = 0; i < N; i++){ var p = punkt(r, i * 2 * Math.PI / N, 1); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return { x0:x0, x1:x1, y0:y0, y1:y1 }; }
  /* Spirale: beginnt oben links (START) und läuft im Uhrzeigersinn nach innen; pro Umlauf wird die Form um delta kleiner.
     delta so, dass der Abstand der Umläufe auch an der engsten Stelle mindestens ABSTAND · Schriftgrösse ist. Die äusseren
     Umläufe haben genau die Form, nach innen wird sie runder (Zacken und Einbuchtungen flacher) – kleine, enge Kurven
     würden die Buchstaben zusammenstossen lassen. → { punkte, laengen (aufsummiert), delta } */
  var START = -50 * Math.PI / 180, ABSTAND = 1.05;
  function rund(r, s, sEnde){
    var mittel = r.reduce(function(a, b){ return a + b; }, 0) / N, t = Math.max(0, Math.min(1, (s - sEnde) / (1 - sEnde))), g = 0.25 + 0.75 * Math.pow(t, 0.8);
    return function(i){ return mittel + (r[i] - mittel) * g; };
  }
  /* Engster Abstand der Umläufe (je Einheit delta): quer zur Linie gemessen, also r · cos(Winkel zwischen Linie und
     Strahl) = r² / √(r² + r′²) – wo die Linie fast zur Mitte läuft (Einbuchtungen, Herz oben), liegen die Umläufe enger */
  function enge(r){
    var m = Infinity, dw = 2 * Math.PI / N;
    for (var i = 0; i < N; i++){ var a = r[(i - 1 + N) % N], c = r[(i + 1) % N], ab = (c - a) / (2 * dw); m = Math.min(m, r[i] * r[i] / Math.sqrt(r[i] * r[i] + ab * ab)); }
    return m;
  }
  function spirale(r, R, f, sEnde){
    var rmax = Math.max.apply(null, r), schritt = 1 / 240;
    function bau(delta){
      var T = (1 - sEnde) / delta, pts = [], laengen = [0], rad = [], quer = [];
      for (var u = 0; u <= T + 1e-9; u += schritt){
        var s = 1 - delta * u, w = START + 2 * Math.PI * u, rr = rund(r, s, sEnde), i = ((w / (2 * Math.PI) * N) % N + N) % N, a = Math.floor(i), b = (a + 1) % N;
        var ra = rr(a) + (rr(b) - rr(a)) * (i - a), ab = (rr(b) - rr((a - 1 + N) % N)) / (2 * 2 * Math.PI / N), d = dir(w), p = [d[0] * ra * s * R, d[1] * ra * s * R];
        if (pts.length) laengen.push(laengen[laengen.length - 1] + Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]));
        pts.push(p); rad.push(ra * s * R); quer.push(ra / Math.sqrt(ra * ra + ab * ab));
      }
      // engster Abstand zum nächsten Umlauf, quer zur Linie gemessen
      var proRunde = Math.round(1 / schritt), eng = Infinity;
      for (var k = 0; k + proRunde < pts.length; k++) eng = Math.min(eng, (rad[k] - rad[k + proRunde]) * quer[k]);
      return { punkte:pts, laengen:laengen, delta:delta, schritt:schritt, eng:eng };
    }
    // erst schätzen (quer zur Linie an der engsten Stelle), dann an der fertigen Spirale messen und nachstellen
    var sp = bau(ABSTAND * f / (R * enge(r))), soll = ABSTAND * f;
    for (var n = 0; n < 3 && isFinite(sp.eng) && Math.abs(sp.eng - soll) > soll * 0.03; n++) sp = bau(sp.delta * soll / sp.eng);
    return sp;
  }
  // Grösste Schrift, bei der der Text in die Spirale passt (breite100: Textbreite bei 100 px)
  function spiraleEinpassen(r, R, breite100, sEnde, fMax){
    var lo = 4, hi = fMax;
    var passt = function(f){ var sp = spirale(r, R - f * 1.1, f, sEnde); return breite100 * f / 100 <= sp.laengen[sp.laengen.length - 1] * 0.985; };
    if (passt(hi)) return hi;
    if (!passt(lo)) return lo;
    for (var i = 0; i < 30; i++){ var m = (lo + hi) / 2; if (passt(m)) lo = m; else hi = m; }
    return lo;
  }
  /* Wörter auf Zeilen verteilen: platz(i) = Länge der Zeile i; breite(t) = Breite eines Texts → Zeilen oder null */
  function umbrechen(woerter, platz, breite, maxZeilen){
    var zeilen = [], akt = '';
    for (var i = 0; i < woerter.length; i++){
      var neu = akt ? akt + ' ' + woerter[i] : woerter[i];
      if (breite(neu) <= platz(zeilen.length)) akt = neu;
      else {
        if (!akt) return null;   // ein Wort ist länger als die Zeile
        zeilen.push(akt); akt = woerter[i];
        if (zeilen.length >= maxZeilen || breite(akt) > platz(zeilen.length)) return null;
      }
    }
    if (akt){ if (zeilen.length >= maxZeilen) return null; zeilen.push(akt); }
    return zeilen;
  }
  // Wie weit nach innen läuft die Spirale (Massstab am Ende)? Bei Formen mit Zacken früher aufhören – innen werden die
  // Kurven zu eng
  var ENDE = { kreis:0.14, herz:0.2, quadrat:0.16, dreieck:0.24, tropfen:0.22, stern:0.36, blume:0.3 };
  return { N:N, ENDE:ENDE, dir:dir, form:form, punkt:punkt, rahmen:rahmen, spirale:spirale, spiraleEinpassen:spiraleEinpassen, rund:rund, enge:enge, umbrechen:umbrechen, START:START, ABSTAND:ABSTAND };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639, MAXZ = 700;
var FORMEN = [['kreis', tx('Kreis (Schnecke)')], ['herz', tx('Herz')], ['stern', tx('Stern')], ['blume', tx('Blume')], ['quadrat', tx('Quadrat')], ['dreieck', tx('Dreieck')], ['tropfen', tx('Tropfen')], ['welle', tx('Welle')], ['regenbogen', tx('Regenbogen')]];
var SPIRALE = { kreis:1, herz:1, stern:1, blume:1, quadrat:1, dreieck:1, tropfen:1 };
var MITTE = { kreis:'#F9A825', herz:'#E53935', stern:'#F2B705', blume:'#EC407A', quadrat:'#1E88E5', dreieck:'#43A047', tropfen:'#29B6F6' };
var FARBEN = [['#1C1714', tx('Schwarz')], ['#1A3E8C', tx('Dunkelblau')], ['#9B1C1C', tx('Dunkelrot')], ['#1E6B34', tx('Dunkelgrün')], ['#6A1B9A', tx('Violett')], ['bunt', tx('Bunt')]];
var BUNT = ['#D32F2F', '#EF6C00', '#C79100', '#2E7D32', '#1565C0', '#4527A0', '#AD1457'];
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function chips(name, l){ return l.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

var VORLAGE = '<div class="tf">' +
  tx('<header class="tf-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Textformen</h1>') +
    tx('<p>Ein Text als Herz, Stern, Schnecke, Welle oder Regenbogen – zum Lesen dreht man das Blatt.</p></header>') +
  tx('<div class="tf-layout"><section class="tf-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Text</h2><p>Ein Satz, ein Gedicht, eine Geschichte – bis 800 Zeichen.</p></div></div>') +
      tx('<label class="feld-label" for="tfText">Text</label>') +
      '<textarea id="tfText" class="tf-text" rows="6" maxlength="800" spellcheck="true"></textarea>' +
      '<div class="tf-zaehler" id="tfZaehler" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Form</h2><p>Spirale von aussen nach innen oder Zeilen auf Wellen und Bögen.</p></div></div>') +
      tx('<div class="tf-chips" role="radiogroup" aria-label="Form">') + chips('tfForm', FORMEN) + '</div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Farbe und Blatt</h2></div></div>') +
      tx('<div class="tf-chips" role="radiogroup" aria-label="Schriftfarbe">') + chips('tfFarbe', FARBEN) + '</div>' +
      '<p class="hinweis" id="tfFarbInfo"></p>' +
      tx('<label class="opt" id="tfMitteOpt"><input type="checkbox" id="tfMitte"><span>Kleine Form in der Mitte</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="tfLinien"><span>Linien zum Abschreiben</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="tf-ausgabe" aria-label="Ergebnis">') +
    '<div id="tfMeldung" aria-live="polite"></div>' +
    '<div class="tf-werkzeug">' +
      tx('<button type="button" class="btn klein" id="tfZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="tfMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="tfPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="tfHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="tf-blaetter"><div class="tf-rahmen"><article class="tf-blatt" id="tfBlatt"></article></div>' +
    '<div class="tf-rahmen tf-loesung-rahmen"><article class="tf-blatt tf-loesungsblatt" id="tfLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M12 20.5C6 16.5 3 13.2 3 9.4 3 6.6 5.1 4.5 7.7 4.5c1.8 0 3.3.9 4.3 2.4 1-1.5 2.5-2.4 4.3-2.4 2.6 0 4.7 2.1 4.7 4.9 0 3.8-3 7.1-9 11.1z"/>' +
  '<path d="M12 16.6c-3.6-2.5-5.4-4.5-5.4-6.7 0-1.4 1-2.5 2.4-2.5 1.2 0 2.3.8 3 2 .7-1.2 1.8-2 3-2 1.4 0 2.4 1.1 2.4 2.5 0 2.2-1.8 4.2-5.4 6.7z" stroke-dasharray="1.5 1.8"/></svg>';

Labor.registriere({
  id:'textformen',
  titel:'Textformen',
  kurz:'Text als Herz, Stern, Schnecke, Welle oder Regenbogen',
  beschreibung:'Ein eigener Text füllt eine Form – als Spirale (Kreis, Herz, Stern, Blume, Quadrat, Dreieck, Tropfen) oder in Zeilen auf Wellen und Regenbogen-Bögen. Zum Lesen dreht man das Blatt. Mit Lösungsblatt.',
  merkmale:['Eigener Text', '9 Formen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/textformen/textformen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'textformen-eingaben', OPT = 'textformen-einstellungen';
  // Keine Vorauswahl: Form wählt man selbst; Farbe ohne Wahl schwarz
  var STANDARD = { form:'', farbe:'', mitte:true, linien:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e) st.text = String(e.text || ''); } catch(x){}
  if (!FORMEN.some(function(x){ return x[0] === st.opt.form; })) st.opt.form = '';
  if (!FARBEN.some(function(x){ return x[0] === st.opt.farbe; })) st.opt.farbe = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#tfMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  $('#tfText').value = st.text;
  var warte = 0;
  $('#tfText').addEventListener('input', function(){ st.text = this.value; speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 350); });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[k];
      r.addEventListener('change', function(){ if (r.checked){ st.opt[k] = r.value; speichern(); zeichnen(); } });
    });
  }
  radios('tfForm', 'form'); radios('tfFarbe', 'farbe');
  [['#tfMitte', 'mitte'], ['#tfLinien', 'linien'], ['#tfMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#tfZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#tfLoesung').classList.toggle('zeigen', an); $('#tfLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });

  /* ---------- Messen und Zeichnen ---------- */
  var messer = document.createElement('canvas').getContext('2d');
  function breite(t, f){ messer.font = '500 ' + f + 'px ' + Labor.blattSchrift('text'); return messer.measureText(t).width; }
  function farbe(i){ var c = st.opt.farbe || TINTE; return c === 'bunt' ? BUNT[i % BUNT.length] : c; }
  // Text in Wörter-Spans (für bunt je Wort)
  function spans(text, start){
    if (st.opt.farbe !== 'bunt') return esc(text);
    return text.split(' ').map(function(w, i){ return '<tspan fill="' + farbe(start + i) + '">' + esc(w) + '</tspan>'; }).join(' ');
  }
  function pfad(pts, x0, y0){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + f1(x0 + p[0]) + ' ' + f1(y0 + p[1]); }).join(''); }
  var R = null;
  // Spirale in der Form → SVG
  function spiraleSvg(text, hoehe){
    var r = Kern.form(st.opt.form), rb = Kern.rahmen(r), mitte = st.opt.mitte, sEnde = (Kern.ENDE[st.opt.form] || 0.14) + (mitte ? 0.07 : 0);
    var bw = rb.x1 - rb.x0, bh = rb.y1 - rb.y0, Rmax = Math.min(B / bw, hoehe / bh) - 2;   // Pixel je Einheit
    var b100 = breite(text, 100), f = Kern.spiraleEinpassen(r, Rmax, b100, sEnde, 34);
    var Rp = Rmax - f * 1.1, sp = Kern.spirale(r, Rp, f, sEnde), noetig = b100 * f / 100 * 1.01;
    // Pfad dort abschneiden, wo der Text endet
    var ende = sp.laengen.findIndex(function(l){ return l > noetig + f * 2; }); if (ende < 0) ende = sp.punkte.length - 1;
    var sText = 1 - sp.delta * ende * sp.schritt, W = bw * Rmax, H = bh * Rmax, cx = -rb.x0 * Rmax + (B - W) / 2, cy = -rb.y0 * Rmax;
    var t = '<defs><path id="tfPfad" d="' + pfad(sp.punkte.slice(0, ende + 1), cx, cy) + '"/></defs>';
    t += '<text font-size="' + f1(f) + '" font-weight="500" fill="' + farbe(0) + '"><textPath href="#tfPfad">' + spans(text, 0) + '</textPath></text>';
    if (mitte){
      // frei ist es innerhalb der letzten Textzeile (Grundlinie bei sText, Unterlängen etwa 0.3 Schriftgrössen)
      var s = Math.max(0, sText * Rp - 0.6 * f) * 0.8, m = [], i;
      if (st.opt.form === 'stern') for (i = 0; i < 10; i++){ var d = Kern.dir(i * Math.PI / 5), rr = i % 2 ? 0.45 : 1; m.push([d[0] * rr * s, d[1] * rr * s]); }
      else if (st.opt.form === 'blume') for (i = 0; i < Kern.N; i += 4){ var w = i * 2 * Math.PI / Kern.N, d2 = Kern.dir(w), r2 = 0.55 + 0.45 * Math.abs(Math.cos(3 * w)); m.push([d2[0] * r2 * s, d2[1] * r2 * s]); }
      else for (i = 0; i < Kern.N; i += 4) m.push(Kern.punkt(r, i * 2 * Math.PI / Kern.N, s));
      if (s > f * 0.8) t += '<path d="' + pfad(m, cx, cy) + 'Z" fill="' + MITTE[st.opt.form] + '" stroke="' + TINTE + '" stroke-width="1"/>';
    }
    return { svg:'<svg class="tf-form" width="' + B + '" height="' + f1(H) + '" viewBox="0 0 ' + B + ' ' + f1(H) + '">' + t + '</svg>', f:f };
  }
  // Wellen: Zeilen auf parallelen Wellen über die ganze Breite
  function welleSvg(text, hoehe){
    var woerter = text.split(' '), best = null;
    for (var f = 30; f >= 7; f -= 0.5){
      var A = f * 1.1, lambda = B / 1.6, zeile = f * 1.25, laenge = 0, pts = [];
      for (var x = 0; x <= B; x += 4){ var p = [x, A * Math.sin(2 * Math.PI * x / lambda)]; if (pts.length) laenge += Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]); pts.push(p); }
      var maxZ = Math.floor((hoehe - 2 * A - f) / zeile);
      var z = Kern.umbrechen(woerter, function(){ return (laenge - f) * 0.97; }, function(t){ return breite(t, f); }, maxZ);
      if (z){ best = { f:f, A:A, zeile:zeile, pts:pts, z:z }; break; }
    }
    if (!best) return null;
    var H = best.z.length * best.zeile + 2 * best.A + best.f * 0.6, t = '<defs>', w = 0;
    best.z.forEach(function(_, i){ t += '<path id="tfW' + i + '" d="' + pfad(best.pts, 0, best.A + best.f + i * best.zeile) + '"/>'; });
    t += '</defs>';
    best.z.forEach(function(zt, i){ t += '<text font-size="' + f1(best.f) + '" font-weight="500" fill="' + farbe(0) + '" text-anchor="middle"><textPath href="#tfW' + i + '" startOffset="50%">' + spans(zt, w) + '</textPath></text>'; w += zt.split(' ').length; });
    return { svg:'<svg class="tf-form" width="' + B + '" height="' + f1(H) + '" viewBox="0 0 ' + B + ' ' + f1(H) + '">' + t + '</svg>', f:best.f };
  }
  // Regenbogen: Zeilen auf Bögen von aussen nach innen (bunt: jeder Bogen eine Farbe)
  function regenbogenSvg(text, hoehe){
    var woerter = text.split(' '), best = null, WINKEL = 100 * Math.PI / 180;
    for (var f = 34; f >= 7; f -= 0.5){
      var Ra = Math.min(B / 2 / Math.sin(WINKEL), (hoehe - f) / (1 - Math.cos(WINKEL))) - f * 1.1, abst = f * 1.22, maxZ = Math.floor(Ra * 0.75 / abst) + 1;
      var z = Kern.umbrechen(woerter, function(i){ return (Ra - i * abst) * 2 * WINKEL * 0.96 - f; }, function(t){ return breite(t, f); }, maxZ);
      if (z){ best = { f:f, Ra:Ra, abst:abst, z:z }; break; }
    }
    if (!best) return null;
    var cx = B / 2, cy = best.Ra + best.f * 1.1, H = cy - Math.cos(WINKEL) * best.Ra + best.f * 0.6, t = '<defs>', w = 0;
    best.z.forEach(function(_, i){
      var rr = best.Ra - i * best.abst, a = [cx - Math.sin(WINKEL) * rr, cy - Math.cos(WINKEL) * rr], b = [cx + Math.sin(WINKEL) * rr, cy - Math.cos(WINKEL) * rr];
      t += '<path id="tfR' + i + '" d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'A' + f1(rr) + ' ' + f1(rr) + ' 0 1 1 ' + f1(b[0]) + ' ' + f1(b[1]) + '"/>';
    });
    t += '</defs>';
    best.z.forEach(function(zt, i){
      var fa = st.opt.farbe === 'bunt' ? BUNT[i % BUNT.length] : farbe(0);
      t += '<text font-size="' + f1(best.f) + '" font-weight="500" fill="' + fa + '" text-anchor="middle"><textPath href="#tfR' + i + '" startOffset="50%">' + esc(zt) + '</textPath></text>'; w += zt.split(' ').length;
    });
    return { svg:'<svg class="tf-form" width="' + B + '" height="' + f1(H) + '" viewBox="0 0 ' + B + ' ' + f1(H) + '">' + t + '</svg>', f:best.f };
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, text = st.text.replace(/\s+/g, ' ').trim(), h = '';
    $('#tfMitteOpt').hidden = !!o.form && !SPIRALE[o.form];
    $('#tfFarbInfo').textContent = o.farbe ? (o.farbe === 'bunt' ? (o.form === 'regenbogen' ? tx('Jeder Bogen eine Farbe.') : tx('Jedes Wort eine Farbe.')) : '') : tx('Noch nichts gewählt: schwarz.');
    if (text) h += '<p class="tf-info">' + text.length + tx(' Zeichen.</p>');
    var fehlt = !text ? 'text' : !o.form ? 'form' : '';
    ['#tfPdf', '#tfHerunterladen', '#tfZeigeLoesung'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ R = null; $('#tfZaehler').innerHTML = h; $('#tfBlatt').parentNode.hidden = true; $('#tfLoesung').parentNode.hidden = true; meldung('info', '<p>' + (fehlt === 'text' ? tx('Schreibe links einen Text.') : tx('Wähle links eine Form.')) + '</p>'); return; }
    // Platz für Linien zum Abschreiben
    var nLinien = o.linien ? Math.min(10, Math.ceil(breite(text, 15) / 600) + 1) : 0, hoehe = MAXZ - nLinien * 34 - (o.anleitungAn ? 30 : 0);
    var erg = SPIRALE[o.form] ? spiraleSvg(text, Math.min(hoehe, 680)) : o.form === 'welle' ? welleSvg(text, Math.min(hoehe, 560)) : regenbogenSvg(text, Math.min(hoehe, 520));
    if (!erg){ R = null; $('#tfZaehler').innerHTML = h; $('#tfBlatt').parentNode.hidden = true; $('#tfLoesung').parentNode.hidden = true; meldung('warnung', tx('<p>Der Text ist für diese Form zu lang (oder ein Wort ist zu lang). Kürze ihn oder wähle eine Spirale.</p>')); return; }
    if (erg.f < 9) h += tx('<p class="warnung">Die Schrift wird sehr klein (') + (erg.f * 186 / 703).toFixed(1) + tx(' mm). Ein kürzerer Text ist besser lesbar.</p>');
    $('#tfZaehler').innerHTML = h;
    meldung('', ''); $('#tfBlatt').parentNode.hidden = false; $('#tfLoesung').parentNode.hidden = false;
    R = { text:text };
    var anleitung = tx('Lies den Text. Drehe dazu das Blatt.') + (o.linien ? tx(' Schreibe ihn auf die Linien.') : '');
    $('#tfBlatt').innerHTML = (o.titelAn ? tx('<h2>Textformen</h2>') : '') + (o.anleitungAn ? '<p class="tf-anleitung">' + esc(anleitung) + '</p>' : '') +
      '<div class="tf-mitte">' + erg.svg + '</div>' + (nLinien ? '<div class="tf-linien">' + new Array(nLinien + 1).join('<span></span>') + '</div>' : '');
    $('#tfLoesung').innerHTML = (o.titelAn ? tx('<h2>Textformen – Lösung</h2>') : tx('<p class="tf-anleitung"><b>Lösung</b></p>')) + '<p class="tf-loesung-text">' + esc(text) + '</p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#tfBlatt')].concat(st.opt.mitLoesung ? [$('#tfLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#tfPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Textformen', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#tfPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#tfHerunterladen').hidden = false; });
  }
  $('#tfHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Textformen', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Textformen'), inhalt, '.tf-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
