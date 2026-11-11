/* Rätsellabor – Generator «Rotfolienrätsel»
   Ein Satz versteckt sich in einem Buchstabenfeld: Die ganze Fläche ist ein Raster aus Buchstaben in kühlen Farben (Blau,
   Hellblau, Blau), darüber dichte rote, pinke und orange Kritzel und Buchstaben. Nur die Buchstaben des Satzes haben keinen
   Rotanteil – die falschen sehen fast gleich aus (sehr ähnliche Blautöne), haben aber einen mittleren Rotanteil.
   Physik dahinter: Die rote Folie lässt nur rotes Licht durch – wie hell eine Farbe durch die Folie wirkt, hängt nur von
   ihrem Rotanteil ab. Durch die Folie werden die Buchstaben des Satzes schwarz, die falschen hellgrau, alles Rote weiss.
   Von Auge sind echte und falsche Buchstaben kaum zu unterscheiden, und die rote Schicht darüber zerstückelt alle.
   Die Fläche wird in ein Canvas gezeichnet; die rote Schicht liegt «multipliziert» darüber wie Druckfarbe, so bleiben die
   Buchstaben des Satzes auch dort schwarz, wo Kritzel sie kreuzen. Die Ansicht durch die Folie (am Bildschirm und im
   Lösungsblatt) wird Pixel für Pixel aus dem Rotanteil berechnet. Arbeitsblatt, Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // so hell erscheint eine Farbe durch die rote Folie (0 = schwarz, 1 = weiss)
  function rotAnteil(hex){ return parseInt(String(hex).slice(1, 3), 16) / 255; }
  function lin(v){ v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function helligkeit(h){ var r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  /* Farben. ECHT: Buchstaben des Satzes – sechs Blautöne ohne Rotanteil (durch die Folie schwarz). FALSCH: die übrigen
     Buchstaben im Raster – zu jedem echten Blau das, das ihm mit Rotanteil 105 am ähnlichsten sieht (kleinster Farbabstand
     ΔE im Lab-Farbraum, 10–14; durch die Folie 41 % grau, deutlich heller als der schwarze Satz). Mehr Rotanteil machte die
     Folie klarer, aber ohne Folie fielen die echten Buchstaben als dunklere Blaus auf – 105 ist der geprüfte Ausgleich. Blau gewählt, weil das Auge
     dort einen höheren Rotanteil am wenigsten bemerkt (bei Grün ist der Abstand fast doppelt so gross). Die echten Blautöne
     unterscheiden sich untereinander etwa gleich stark (ΔE im Mittel 14) wie echt von falsch – im Gewimmel fällt der
     Unterschied nicht auf, und zwischen den Buchstaben des Satzes stehen immer falsche (siehe raster).
     ROT, WARM: Kritzel, Punkte und Buchstaben der roten Schicht (Rotanteil ≥ 228: durch die Folie weiss). HELL,
     HELL_KUEHL: Flecken im Hintergrund (Rotanteil ≥ 224). */
  var ECHT = ['#00BEF0', '#00AEEF', '#009EE2', '#008FD8', '#0080CD', '#0070C0'];
  var FALSCH = ['#69C9F7', '#69BAF7', '#69ABEB', '#699DE3', '#698FD9', '#6981CF'];
  var KRITZEL_KUEHL = ['#A6D8FF', '#A6CCF5', '#A6E2F2'];   // dünne hellblaue Kritzel (Rotanteil 166: durch die Folie hellgrau)
  var ROT = ['#ED1C24', '#EC008C', '#F15A29', '#E4007C', '#F7941D', '#EF4136'];
  var WARM = ['#F9B5D0', '#FFD27F', '#FFE36E', '#F7A8A0', '#FBB4E0', '#FFC08A', '#F49AC1', '#FBB040'];
  var HELL = ['#FFD3E2', '#FFE1BE', '#FFF0A0', '#FFC6D3', '#FFD8F2', '#FFDCC8'];
  var HELL_KUEHL = ['#E1F2FF', '#E0F7EE', '#E6EEFF'];
  var ABC_GROSS = 'ABCDEFGHIJKLMNOPRSTUVWZ', ABC_KLEIN = 'abcdefghiklmnoprstuvwz';
  function text(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  /* Zeilen umbrechen: Wörter mit Breiten → Zeilen [[wort, …], …]; null, wenn ein Wort allein breiter ist als max */
  function umbrechen(woerter, breite, leer, max){
    var zeilen = [], z = [], b = 0;
    for (var i = 0; i < woerter.length; i++){
      var w = breite(woerter[i]);
      if (w > max) return null;
      if (z.length && b + leer + w > max){ zeilen.push(z); z = []; b = 0; }
      b += (z.length ? leer : 0) + w; z.push(woerter[i]);
    }
    if (z.length) zeilen.push(z);
    return zeilen;
  }
  /* Das Raster: spalten × zeilen Felder, je ein Buchstabe. Der Satz steht in aufeinanderfolgenden Zeilen, mit mindestens
     einer Zeile darüber und darunter und an zufälliger Stelle in der Zeile. Zwischen zwei Buchstaben des Satzes stehen
     zufällig ein oder zwei falsche, zwischen zwei Wörtern vier – so lassen sich ohne Folie keine Wörter herauslesen (wie in
     einem Suchsel), auch nicht, indem man jeden zweiten Buchstaben liest; durch die Folie treten die schwarzen Buchstaben
     hervor, die grauen dazwischen nicht.
     Alle übrigen Felder: falsche Buchstaben (meist kühl, einige warm).
     → { spalten, zeilen, satzZeilen:[text], felder:[{ r, c, ch, echt, farbe, dx, dy, dreh, gr }], ueber:[…] } oder null */
  function raster(o){
    var rnd = zufall(o.seed), spalten = o.spalten, w = text(o.satz).split(' ').filter(Boolean);
    // Felder je Wort: Buchstabe, eine oder zwei Lücken, Buchstabe … (null = Feld für einen falschen Buchstaben)
    var wf = w.map(function(wort){ var f = []; Array.from(wort).forEach(function(ch, k){ if (k){ f.push(null); if (rnd() < 0.35) f.push(null); } f.push(ch); }); return f; });
    var z = umbrechen(wf, function(f){ return f.length; }, 4, spalten);
    if (!z || !z.length) return null;
    var satzZeilen = z.map(function(zeile){ return zeile.map(function(f){ return f.filter(Boolean).join(''); }).join(' '); });
    function felderVon(zeile){ var f = []; zeile.forEach(function(wort, i){ if (i) f.push(null, null, null, null); f = f.concat(wort); }); return f; }
    var zeilen = Math.max(o.mindestZeilen || 4, satzZeilen.length + 2), oben = 1 + Math.floor(rnd() * (zeilen - satzZeilen.length - 1));
    var klein = !o.gross && /[a-zäöü]/.test(o.satz);
    function aus(l){ return l[Math.floor(rnd() * l.length)]; }
    function falscherBuchstabe(){ return klein && rnd() > 0.12 ? aus(ABC_KLEIN) : aus(ABC_GROSS); }
    function wackeln(f){ f.dx = (rnd() - 0.5) * 0.12; f.dy = (rnd() - 0.5) * 0.12; f.dreh = (rnd() - 0.5) * 0.24; f.gr = 0.94 + rnd() * 0.12; return f; }
    var satz = {}, felder = [], ueber = [];
    z.forEach(function(woerter, i){
      var zs = felderVon(woerter), start = Math.floor(rnd() * (spalten - zs.length + 1));
      zs.forEach(function(ch, k){ if (ch) satz[(oben + i) + ',' + (start + k)] = ch; });
    });
    for (var r = 0; r < zeilen; r++) for (var c = 0; c < spalten; c++){
      var ch = satz[r + ',' + c], f;
      if (ch) f = { r:r, c:c, ch:ch, echt:true, farbe:aus(ECHT) };
      else f = { r:r, c:c, ch:falscherBuchstabe(), echt:false, farbe:rnd() < 0.2 ? aus(ROT.concat(WARM)) : aus(FALSCH) };
      felder.push(wackeln(f));
      // rote Schicht: über fast jedem Feld ein heller warmer Buchstabe, leicht versetzt und gedreht
      if (rnd() < 0.85) ueber.push({ r:r, c:c, ch:falscherBuchstabe(), farbe:aus(WARM), dx:(rnd() - 0.5) * 0.6, dy:(rnd() - 0.5) * 0.4, dreh:(rnd() - 0.5) * 0.9, gr:0.8 + rnd() * 0.35 });
    }
    return { spalten:spalten, zeilen:zeilen, satzZeilen:satzZeilen, oben:oben, felder:felder, ueber:ueber };
  }
  /* Kritzel, Punkte und Flecken über die ganze Fläche b × h (Pixel) */
  function tarnung(o){
    var rnd = zufall(o.seed + 7), b = o.b, h = o.h, A = b * h, t = { flecken:[], kritzel:[], kuehl:[], punkte:[] }, i, n;
    function aus(l){ return l[Math.floor(rnd() * l.length)]; }
    function bogen(lMin, lVar){
      var x = rnd() * b, y = rnd() * h, l = lMin + rnd() * lVar, w = rnd() * Math.PI * 2, k = (rnd() - 0.5) * l * 0.9;
      var x1 = x + Math.cos(w) * l, y1 = y + Math.sin(w) * l;
      return [x, y, (x + x1) / 2 - Math.sin(w) * k, (y + y1) / 2 + Math.cos(w) * k, x1, y1];
    }
    for (i = 0, n = Math.round(A / 2200); i < n; i++) t.flecken.push({ x:rnd() * b, y:rnd() * h, r:16 + rnd() * 44, farbe:aus(rnd() < 0.3 ? HELL_KUEHL : HELL) });
    for (i = 0, n = Math.round(A / 230); i < n; i++) t.kritzel.push({ p:bogen(14, 30), breite:1.6 + rnd() * 2.6, farbe:aus(ROT) });
    for (i = 0, n = Math.round(A / 1100); i < n; i++) t.kuehl.push({ p:bogen(18, 34), breite:1 + rnd() * 1.2, farbe:aus(KRITZEL_KUEHL) });
    for (i = 0, n = Math.round(A / 700); i < n; i++) t.punkte.push({ x:rnd() * b, y:rnd() * h, r:1.2 + rnd() * 2.8, farbe:aus(ROT) });
    return t;
  }
  return { zufall:zufall, mischen:mischen, rotAnteil:rotAnteil, helligkeit:helligkeit, ECHT:ECHT, FALSCH:FALSCH, ROT:ROT, WARM:WARM,
    HELL:HELL, HELL_KUEHL:HELL_KUEHL, text:text, umbrechen:umbrechen, raster:raster, tarnung:tarnung };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639;   // Zeichenfläche: 703 Pixel Blatt minus Rand
var MASSSTAB = 3;                  // Canvas-Pixel je Bildschirm-Pixel (≈ 290 dpi im PDF)
function esc(t){ return Labor.esc(t); }

var SAETZE = ['Du bist ein super Detektiv', 'Der Schatz liegt unter dem Baum', 'Heute gibt es keine Hausaufgaben', 'Schau unter dein Pult',
  'Das Passwort heisst Regenbogen', 'Wir treffen uns beim Brunnen', 'Klatsche dreimal in die Hände', 'Morgen backen wir einen Kuchen',
  'Rote Folien verraten Geheimnisse', 'Der nächste Hinweis ist im Bücherregal', 'Die Pause dauert heute länger', 'Spione arbeiten im Geheimen',
  'Der Code für das Schloss ist 427', 'Im Wald wohnt ein freundlicher Fuchs', 'Lies das Buch auf Seite 12'];

/* ---------- Zeichnen ins Canvas ---------- */
var messer = document.createElement('canvas').getContext('2d');
function schrift(gr){ return '700 ' + gr + 'px ' + Labor.blattSchrift('buchstaben'); }
var RAND = 8;   // Abstand des Rasters zum Bildrand
/* Raster planen: Schrift so gross wie möglich (Felder 0.68 × 1.3 Schriftgrössen), der Satz in höchstens 4 Zeilen, sonst bis 6.
   → { b, h, gr, fb, fh, x0, y0, R } oder null (ein Wort zu lang) */
function plan(satz, seed, gross){
  for (var grenze = 4; grenze <= 6; grenze += 2)
    for (var gr = 58; gr >= 22; gr -= 2){
      var fb = gr * 0.68, spalten = Math.floor((B - 2 * RAND) / fb);
      var R = Kern.raster({ satz:satz, spalten:spalten, seed:seed, gross:gross, mindestZeilen:gr > 40 ? 4 : 5 });
      if (!R || R.satzZeilen.length > grenze) continue;
      var fh = gr * 1.3, h = Math.round(R.zeilen * fh + 2 * RAND);
      return { b:B, h:h, gr:gr, fb:fb, fh:fh, x0:(B - spalten * fb) / 2, y0:RAND, R:R };
    }
  return null;
}
function mitte(P, f){ return [P.x0 + (f.c + 0.5 + (f.dx || 0)) * P.fb, P.y0 + (f.r + 0.55 + (f.dy || 0)) * P.fh]; }
function buchstabe(ctx, P, f, farbe){
  var m = mitte(P, f), gr = P.gr * (f.gr || 1);
  ctx.save(); ctx.translate(m[0], m[1]); if (f.dreh) ctx.rotate(f.dreh);
  ctx.font = schrift(gr); ctx.fillStyle = farbe; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  var w = ctx.measureText(f.ch).width, max = P.fb * 0.94;
  if (w > max) ctx.scale(max / w, 1);   // breite Buchstaben (M, W) schmaler, damit sie das Nachbarfeld nicht berühren
  ctx.fillText(f.ch, 0, 0); ctx.restore();
}
function bogen(ctx, k){ ctx.strokeStyle = k.farbe; ctx.lineWidth = k.breite; ctx.beginPath(); ctx.moveTo(k.p[0], k.p[1]); ctx.quadraticCurveTo(k.p[2], k.p[3], k.p[4], k.p[5]); ctx.stroke(); }
// Die Fläche zeichnen: Flecken, das Buchstabenraster; darüber (multipliziert wie Druckfarbe) die rote Schicht
function malen(P, T){
  var cv = document.createElement('canvas'), S = MASSSTAB;
  cv.width = Math.round(P.b * S); cv.height = Math.round(P.h * S);
  var ctx = cv.getContext('2d');
  ctx.scale(S, S);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, P.b, P.h);
  T.flecken.forEach(function(f){ ctx.fillStyle = f.farbe; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
  P.R.felder.forEach(function(f){ buchstabe(ctx, P, f, f.farbe); });
  ctx.globalCompositeOperation = 'multiply';
  P.R.ueber.forEach(function(f){ buchstabe(ctx, P, f, f.farbe); });
  ctx.lineCap = 'round';
  T.kritzel.forEach(function(k){ bogen(ctx, k); });
  T.punkte.forEach(function(p){ ctx.fillStyle = p.farbe; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });
  T.kuehl.forEach(function(k){ bogen(ctx, k); });
  ctx.globalCompositeOperation = 'source-over';
  return cv;
}
/* Durch die rote Folie: Nur der Rotanteil zählt. art 'rot' – so sieht es am Bildschirm durch die Folie aus (rot/schwarz);
   art 'grau' – fürs Lösungsblatt in Graustufen (druckt ohne Farbe). */
function durchFolie(cv, art){
  var k = document.createElement('canvas'); k.width = cv.width; k.height = cv.height;
  var ctx = k.getContext('2d'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (var i = 0; i < p.length; i += 4){
    var r = p[i];
    if (art === 'rot'){ p[i] = 40 + r * 0.8; p[i + 1] = r * 0.1; p[i + 2] = r * 0.14; }
    else { p[i] = p[i + 1] = p[i + 2] = r; }
  }
  ctx.putImageData(d, 0, 0);
  return k;
}

var VORLAGE = '<div class="rf">' +
  '<header class="rf-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Rotfolienrätsel</h1>' +
    '<p>Ein Satz versteckt sich in einem Feld voller bunter Buchstaben und roter Kritzel – von Auge nicht zu lesen. Mit einer roten Folie darüber erscheint er schwarz.</p></header>' +
  '<div class="rf-layout"><section class="rf-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimer Satz</h2><p>Er erscheint unter der roten Folie.</p></div></div>' +
      '<label class="feld-label" for="rfSatz">Satz</label>' +
      '<div class="rf-zeile"><textarea id="rfSatz" rows="2" maxlength="90" autocomplete="off" spellcheck="false"></textarea>' +
        '<button type="button" class="btn klein" id="rfZufall" title="Einen anderen Satz vorschlagen">Andere</button></div>' +
      '<p class="hinweis">Bis 90 Zeichen. Je kürzer der Satz, desto grösser die Buchstaben.</p>' +
      '<label class="opt"><input type="checkbox" id="rfGross"><span>Nur Grossbuchstaben</span></label>' +
      '<div class="rf-zaehler" id="rfZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="rfLinien"><span>Linien für die Antwort</span></label>' +
      '<p class="hinweis">Das Bild ist ein Feld voller blauer Buchstaben, darüber rote Kritzel. Nur die Buchstaben des Satzes werden durch die Folie schwarz – die anderen sehen gleich aus, werden aber nur hellgrau.</p>' +
      '<p class="hinweis">Zum Lösen braucht es eine rote Folie (z. B. rote Klarsichthülle oder Bastelfolie). In Farbe drucken – Drucker mischen Farben unterschiedlich, darum zuerst ein Blatt mit der Folie testen.</p>' +
    '</div>' +
  '</section>' +
  '<section class="rf-ausgabe" aria-label="Ergebnis">' +
    '<div id="rfMeldung" aria-live="polite"></div>' +
    '<div class="rf-werkzeug">' +
      '<button type="button" class="btn klein" id="rfFolieKnopf" aria-pressed="false" title="Eine rote Folie über das Bild legen und verschieben">Rote Folie</button>' +
      '<button type="button" class="btn klein" id="rfZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="rfNeu" title="Die Tarnung neu verteilen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="rfMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="rfPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="rfHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<p class="rf-folie-info" id="rfFolieInfo" hidden>Schiebe die rote Folie mit der Maus, dem Finger oder den Pfeiltasten über das Bild.</p>' +
    '<div class="rf-rahmen"><article class="rf-blatt" id="rfBlatt"></article></div>' +
    '<div class="rf-rahmen"><article class="rf-blatt rf-loesungsblatt" id="rfLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="5" width="13" height="14" rx="2"/><rect x="9" y="3" width="12" height="16" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 10h5M6 14h3"/></svg>';

Labor.registriere({
  id:'rotfolie',
  titel:'Rotfolienrätsel',
  kurz:'Ein versteckter Satz – erst die rote Folie macht ihn lesbar',
  beschreibung:'Ein eigener Satz versteckt sich in einem Feld voller bunter Buchstaben und roter Kritzel. Von Auge ist er nicht zu lesen; mit einer roten Folie darauf erscheint er schwarz. Mit Folie zum Ausprobieren am Bildschirm und Lösungsblatt.',
  merkmale:['Eigener Satz', 'Nur mit Folie lesbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/rotfolie/rotfolie.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'rotfolie-eingaben', OPT = 'rotfolie-einstellungen';
  var STANDARD = { gross:false, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  delete st.opt.staerke; delete st.opt.farbe;   // frühere Einstellungen (Stärke, Farbe) gibt es nicht mehr
  if (!Kern.text(st.satz)) st.satz = SAETZE[Math.floor(Math.random() * SAETZE.length)];
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#rfMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 300); }

  /* ---------- Eingaben ---------- */
  $('#rfSatz').value = st.satz;
  $('#rfSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); baldZeichnen(); });
  $('#rfZufall').addEventListener('click', function(){
    var jetzt = Kern.text(st.satz), l = SAETZE.filter(function(t){ return t !== jetzt; });
    st.satz = l[Math.floor(Math.random() * l.length)]; $('#rfSatz').value = st.satz; speichern(); zeichnen();
  });
  [['#rfGross', 'gross'], ['#rfLinien', 'linien'], ['#rfMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#rfNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#rfZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  /* ---------- Rote Folie am Bildschirm: liegt über dem Bild und lässt sich waagrecht verschieben ---------- */
  var folieX = 0, folieAn = false;
  $('#rfFolieKnopf').addEventListener('click', function(){
    folieAn = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', folieAn ? 'true' : 'false');
    $('#rfFolieInfo').hidden = !folieAn; folieZeigen();
    var f = $('#rfBlatt .rf-folie'); if (folieAn && f) f.focus({ preventScroll:true });
  });
  function folieBreite(){ return Math.round(B * 0.42); }
  function folieSetzen(x){
    var f = $('#rfBlatt .rf-folie'); if (!f) return;
    folieX = Math.max(-folieBreite() * 0.5, Math.min(B - folieBreite() * 0.5, x));
    f.style.left = folieX + 'px'; f.firstChild.style.left = -folieX + 'px';
  }
  function folieZeigen(){ var f = $('#rfBlatt .rf-folie'); if (!f) return; f.hidden = !folieAn; folieSetzen(folieX); }
  bereich.addEventListener('pointerdown', function(ev){
    var f = ev.target.closest('.rf-folie'); if (!f) return;
    ev.preventDefault(); f.setPointerCapture(ev.pointerId); f.classList.add('zieht');
    var start = ev.clientX, x0 = folieX;
    function zug(e){ folieSetzen(x0 + e.clientX - start); }
    function los(){ f.classList.remove('zieht'); f.removeEventListener('pointermove', zug); f.removeEventListener('pointerup', los); f.removeEventListener('pointercancel', los); }
    f.addEventListener('pointermove', zug); f.addEventListener('pointerup', los); f.addEventListener('pointercancel', los);
  });
  bereich.addEventListener('keydown', function(ev){
    if (!ev.target.classList || !ev.target.classList.contains('rf-folie')) return;
    var d = { ArrowLeft:-20, ArrowRight:20, Home:-B, End:B }[ev.key];
    if (d === undefined) return;
    ev.preventDefault(); folieSetzen(folieX + d);
  });

  /* ---------- Rätsel ---------- */
  var P = null, bilder = null, schluessel = '';
  function satzJetzt(){ var t = Kern.text(st.satz); return st.opt.gross ? t.toUpperCase().replace(/ß/g, 'SS') : t; }
  function anleitung(){
    return 'In diesem Buchstabenfeld versteckt sich ein geheimer Satz. Lege eine rote Folie auf das Bild – die Buchstaben des Satzes werden schwarz.' + (st.opt.linien ? ' Schreibe den Satz auf die Linien.' : ' Wie heisst er?');
  }
  // Antwortlinien: so viele, wie der Satz in Kinderhandschrift braucht (etwa 24 Zeichen pro Linie, mindestens 2)
  function linienHtml(satz, loesung){
    messer.font = '500 22px ' + Labor.blattSchrift('text');
    var z = Kern.umbrechen(satz.split(' '), function(w){ return messer.measureText(w).width; }, messer.measureText(' ').width, B - 40) || [satz.split(' ')];
    var n = Math.max(2, Math.ceil(satz.length / 24), z.length), h = '';
    for (var i = 0; i < n; i++) h += '<div class="rf-linie">' + (loesung && z[i] ? esc(z[i].join(' ')) : '') + '</div>';
    return '<div class="rf-linien">' + h + '</div>';
  }
  function bildHtml(src, mitFolie, alt){
    return '<div class="rf-bild" style="width:' + B + 'px;height:' + P.h + 'px"><img src="' + src + '" width="' + B + '" height="' + P.h + '" alt="' + esc(alt) + '">' +
      (mitFolie ? '<div class="rf-folie nur-bildschirm" tabindex="0" role="slider" aria-label="Rote Folie verschieben" aria-valuemin="0" aria-valuemax="100" hidden style="width:' + folieBreite() + 'px">' +
        '<img src="' + bilder.rot + '" width="' + B + '" height="' + P.h + '" alt=""></div>' : '') + '</div>';
  }
  function blattHtml(satz, loesung){
    var o = st.opt;
    return (o.titelAn ? '<h2>Rotfolienrätsel</h2>' : '') + (o.anleitungAn ? '<p class="rf-anleitung">' + esc(anleitung()) + '</p>' : '') +
      bildHtml(bilder.normal, true, 'Bild mit verstecktem Satz') + (o.linien ? linienHtml(satz, loesung) : '');
  }
  function loesungHtml(satz){
    var o = st.opt;
    return (o.titelAn ? '<h2>Rotfolienrätsel – Lösung</h2>' : '<p class="rf-anleitung"><b>Lösung</b></p>') +
      '<p class="rf-anleitung">So sieht das Bild durch die rote Folie aus:</p>' + bildHtml(bilder.grau, false, 'Das Bild durch die rote Folie: ' + satz) +
      '<p class="rf-satz-loesung">Der Satz: <b>' + esc(satz) + '</b></p>';
  }
  function zeichnen(){
    if (aus) return;
    var satz = satzJetzt(), h = '';
    var leer = !satz;
    ['#rfZeigeLoesung', '#rfNeu', '#rfPdf', '#rfHerunterladen', '#rfFolieKnopf'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#rfZaehler').innerHTML = ''; $('#rfBlatt').parentNode.hidden = true; $('#rfLoesung').parentNode.hidden = true; meldung('info', '<p>Gib links den Satz ein, der unter der Tarnung stehen soll.</p>'); return; }
    // Schrift laden, bevor gemessen und gezeichnet wird
    var f = schrift(40);
    if (document.fonts && document.fonts.check && !document.fonts.check(f)){ document.fonts.load(f).then(function(){ if (!aus && document.fonts.check(f)) zeichnen(); }, function(){}); }
    P = plan(satz, st.seed, st.opt.gross || satz === satz.toUpperCase());
    if (!P){ $('#rfZaehler').innerHTML = ''; $('#rfBlatt').parentNode.hidden = true; $('#rfLoesung').parentNode.hidden = true; ['#rfZeigeLoesung', '#rfNeu', '#rfPdf', '#rfHerunterladen', '#rfFolieKnopf'].forEach(function(s){ $(s).disabled = true; }); meldung('warnung', '<p>Ein Wort ist zu lang für eine Zeile – kürze es oder trenne es mit einem Leerzeichen.</p>'); return; }
    meldung('', ''); $('#rfBlatt').parentNode.hidden = false; $('#rfLoesung').parentNode.hidden = false;
    $('#rfZaehler').innerHTML = '<p class="rf-zaehler-haupt ok"><b>' + satz.length + '</b> Zeichen · ' + P.R.satzZeilen.length + (P.R.satzZeilen.length === 1 ? ' Zeile' : ' Zeilen') + ' im Feld mit ' + P.R.spalten + ' × ' + P.R.zeilen + ' Buchstaben</p>' + h;
    var k = [satz, P.gr, st.seed, Labor.blattSchrift('buchstaben')].join('|');
    if (k !== schluessel || !bilder){
      var cv = malen(P, Kern.tarnung({ seed:st.seed, b:P.b, h:P.h }));
      bilder = { normal:cv.toDataURL('image/png'), rot:durchFolie(cv, 'rot').toDataURL('image/png'), grau:durchFolie(cv, 'grau').toDataURL('image/png') };
      schluessel = k;
    }
    var zeige = $('#rfZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#rfBlatt').innerHTML = blattHtml(satz, zeige);
    $('#rfLoesung').innerHTML = loesungHtml(satz);
    folieZeigen();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus){ schluessel = ''; zeichnen(); } });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function ohneLoesung(){ var k = $('#rfZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#rfPdf'), function(){ ohneLoesung(); return P && { blaetter:[$('#rfBlatt'), st.opt.mitLoesung && $('#rfLoesung')], name:Labor.pdfName('Rotfolienraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rfPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rfHerunterladen').hidden = false; });
  }
  $('#rfHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    ohneLoesung();
    var name = Labor.pdfName('Rotfolienraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#rfBlatt'), st.opt.mitLoesung && $('#rfLoesung')].filter(Boolean).map(function(b, i){
      var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite');
      [].forEach.call(k.querySelectorAll('.nur-bildschirm'), function(x){ x.remove(); });
      return k.outerHTML;
    }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Rotfolienrätsel', inhalt, '.rf-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
