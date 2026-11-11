/* Rätsellabor – Generator «Rotfolienrätsel»
   Der Satz steht in grossen hellblauen Buchstaben; darüber liegt deckend ein dichtes rotes Muster: Reihen aus Wörtern
   (GEHEIM, PSST, DETEKTIV …), abwechselnd normal, auf dem Kopf und gespiegelt, dazu Herzen, Sterne, Spiralen und
   Kringel. Darunter verteilt sich buntes Pastell-Konfetti. Physik dahinter: Die rote Folie lässt nur rotes Licht durch –
   wie hell eine Farbe durch die Folie wirkt, hängt nur von ihrem Rotanteil ab. Das Rot (Rotanteil 255) und das Konfetti
   (≥ 230) sind durch die Folie so hell wie das Papier; das Hellblau (Rotanteil um 110) wird grau – der Satz erscheint.
   Das Rot deckt (es mischt sich nicht mit dem Blau wie Druckfarbe): So verrät keine dunklere Stelle die Buchstaben, und
   von Auge geht das blasse Blau im dichten Rot und im Konfetti unter. Die Fläche wird in ein Canvas gezeichnet; die
   Ansicht durch die Folie (am Bildschirm und im Lösungsblatt) wird Pixel für Pixel aus dem Rotanteil berechnet.
   Arbeitsblatt, Lösungsblatt, PDF. */
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
  /* Farben. BLAU: der Satz, hell (Rotanteil 127–142 → durch die Folie grau; kräftigeres Blau
     wäre durch die Folie dunkler, liess aber ohne Folie die Buchstabenformen erahnen). ROT: das deckende Muster (Rotanteil 255 → durch die
     Folie weiss). KONFETTI: helle Pastelltöne unter dem Muster (Rotanteil ≥ 230 → durch die Folie fast weiss), darunter
     auch blasse Blau- und Lilatöne, damit Blau ohne Folie nicht nur beim Satz vorkommt. */
  var BLAU = ['#7FC2EF', '#86C5F0', '#8ECAF2'];
  var ROT = ['#FF1F1F', '#FF0A3C', '#FF3B30', '#FF2D55', '#FF4A1C', '#FF1A6B'];
  var KONFETTI = ['#FFD6E0', '#FFE2C6', '#FFF1A8', '#FFE0F0', '#F0E2FF', '#FFDDD2', '#E6F7EE'];
  var KONFETTI_BLAU = ['#E4F2FD', '#E8EBFF', '#E2F4F8', '#ECE6FB'];   // blasse Blau- und Lilatöne (Rotanteil ≥ 226)
  var WOERTER = ['GEHEIM', 'PSST', 'DETEKTIV', 'RÄTSEL', 'SPION', 'CODE', 'SCHATZ', 'LUPE', 'TOPSECRET', 'HINWEIS'];
  var FIGUREN = ['herz', 'stern', 'spirale', 'kringel', 'blitz'];
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
  /* Satz so gross wie möglich setzen: messen(wort) gibt die Breite bei 100 px. Höchstens 4 Zeilen, sonst bis 6.
     → { gr, zeilen } oder null (ein Wort zu lang) */
  function setzen(satz, messen, breite, o){
    o = o || {};
    var woerter = text(satz).split(' ').filter(Boolean), max = o.max || 120, min = o.min || 30, leer = messen(' ');
    if (!woerter.length) return null;
    for (var grenze = 4; grenze <= 6; grenze += 2)
      for (var gr = max; gr >= min; gr -= 2){
        var z = umbrechen(woerter, function(w){ return messen(w) * gr / 100; }, leer * gr / 100, breite);
        if (z && z.length <= grenze) return { gr:gr, zeilen:z };
      }
    return null;
  }
  /* Satz in der gewünschten Grösse setzen (Schieberegler): so gross wie gewünscht, aber kleiner, wenn sonst ein Wort nicht in
     die Zeile passt oder das Bild höher würde als maxHoehe (Höhe: Zeilen × 1.12 × Grösse + 70).
     → { gr, zeilen, kleiner:true|false } oder null (auch bei 24 px passt ein Wort nicht) */
  function setzenGroesse(satz, messen, breite, wunsch, maxHoehe){
    var woerter = text(satz).split(' ').filter(Boolean), leer = messen(' ');
    if (!woerter.length) return null;
    for (var gr = wunsch; gr >= 24; gr -= 2){
      var z = umbrechen(woerter, function(w){ return messen(w) * gr / 100; }, leer * gr / 100, breite);
      if (z && z.length * gr * 1.12 + 70 <= maxHoehe) return { gr:gr, zeilen:z, kleiner:gr < wunsch };
    }
    return null;
  }
  /* Das rote Muster und das Konfetti planen (Fläche b × h Pixel):
     reihen – Wortreihen über die ganze Breite, sehr dicht übereinander (Abstand 0.31–0.36 × Schriftgrösse, sie überlappen),
              jede in einer Lage: normal, auf dem Kopf oder gespiegelt; Wörter zufällig aneinandergereiht;
     figuren – rote Herzen, Sterne, Spiralen, Kringel und Blitze darüber;
     konfetti – Pastellformen unter allem. */
  function muster(o){
    var rnd = zufall(o.seed), b = o.b, h = o.h, t = { reihen:[], figuren:[], konfetti:[] }, i, n;
    function aus(l){ return l[Math.floor(rnd() * l.length)]; }
    for (i = 0, n = Math.round(b * h / 900); i < n; i++)
      t.konfetti.push({ art:aus(['kreis', 'herz', 'stern', 'kreis']), x:rnd() * b, y:rnd() * h, gr:12 + rnd() * 34, dreh:rnd() * 6.3, farbe:aus(rnd() < 0.45 ? KONFETTI_BLAU : KONFETTI) });
    var y = -4;
    while (y < h + 10){
      var gr = 14 + rnd() * 5, w = '';
      while (w.length < b / (gr * 0.5)) w += aus(WOERTER);
      t.reihen.push({ y:y, gr:gr, text:w, x:-rnd() * gr * 4, lage:aus(['normal', 'kopf', 'spiegel', 'normal', 'kopf']), farbe:aus(ROT) });
      y += gr * (0.31 + rnd() * 0.05);
    }
    for (i = 0, n = Math.round(b * h / 3600); i < n; i++)
      t.figuren.push({ art:aus(FIGUREN), x:rnd() * b, y:rnd() * h, gr:12 + rnd() * 22, dreh:rnd() * 6.3, farbe:aus(ROT), breite:1.6 + rnd() * 1.6 });
    return t;
  }
  return { zufall:zufall, mischen:mischen, rotAnteil:rotAnteil, BLAU:BLAU, ROT:ROT, KONFETTI:KONFETTI, KONFETTI_BLAU:KONFETTI_BLAU, WOERTER:WOERTER, FIGUREN:FIGUREN,
    text:text, umbrechen:umbrechen, setzen:setzen, setzenGroesse:setzenGroesse, muster:muster };
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
function schrift(gr, dick){ return (dick || 700) + ' ' + gr + 'px ' + Labor.blattSchrift('buchstaben'); }
function sperrung(gr){ return gr * 0.04; }
function messen(w){ messer.font = schrift(100); return w === ' ' ? messer.measureText(' ').width * 1.3 : messer.measureText(w).width + sperrung(100) * Math.max(0, w.length - 1); }
var MAX_HOEHE = 620;   // höchstens so hoch wird das Bild – dann passen Titel, Anleitung und Linien noch aufs Blatt
/* Satz setzen (Grösse vom Schieberegler): Lage jedes Buchstabens – Zeilen mittig, Block senkrecht mittig.
   → { b, h, gr, kleiner, zeilen, buchst:[{ c, x, y }] } oder null */
function plan(satz, wunsch){
  var rand = 20, S = Kern.setzenGroesse(satz, messen, B - 2 * rand, wunsch, MAX_HOEHE);
  if (!S) return null;
  var gr = S.gr, zh = gr * 1.12, h = Math.round(Math.max(380, S.zeilen.length * zh + 70)), y0 = (h - S.zeilen.length * zh) / 2 + zh / 2, buchst = [];
  var leer = messen(' ') * gr / 100, sp = sperrung(gr);
  S.zeilen.forEach(function(z, j){
    var breite = z.reduce(function(s, w, k){ return s + messen(w) * gr / 100 + (k ? leer : 0); }, 0), x = (B - breite) / 2, y = y0 + j * zh;
    messer.font = schrift(gr);   // nach messen() – das stellt auf 100 px
    z.forEach(function(w, k){
      if (k) x += leer;
      Array.from(w).forEach(function(c){ var cb = messer.measureText(c).width; buchst.push({ c:c, x:x + cb / 2, y:y }); x += cb + sp; });
      x -= sp;
    });
  });
  return { b:B, h:h, gr:gr, kleiner:S.kleiner, zeilen:S.zeilen, buchst:buchst };
}
// eine Figur (Herz, Stern, Spirale, Kringel, Blitz; fürs Konfetti auch Kreis) um (x, y)
function figur(ctx, f, gefuellt){
  var g = f.gr / 2;
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.dreh || 0);
  ctx.fillStyle = f.farbe; ctx.strokeStyle = f.farbe; ctx.lineWidth = f.breite || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (f.art === 'kreis'){ ctx.arc(0, 0, g, 0, Math.PI * 2); ctx.fill(); }
  else if (f.art === 'herz'){
    ctx.moveTo(0, g * 0.9); ctx.bezierCurveTo(-g * 1.2, 0, -g, -g, 0, -g * 0.4); ctx.bezierCurveTo(g, -g, g * 1.2, 0, 0, g * 0.9);
    if (gefuellt) ctx.fill(); else ctx.stroke();
  } else if (f.art === 'stern'){
    for (var i = 0; i < 10; i++){ var r = i % 2 ? g * 0.42 : g, w = i * Math.PI / 5; ctx.lineTo(r * Math.sin(w), -r * Math.cos(w)); }
    ctx.closePath(); if (gefuellt) ctx.fill(); else ctx.stroke();
  } else if (f.art === 'spirale'){
    for (var a = 0; a < Math.PI * 5; a += 0.25){ var rr = g * a / (Math.PI * 5); ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a)); }
    ctx.stroke();
  } else if (f.art === 'kringel'){
    for (var k = 0; k <= 40; k++){ var t = k / 40, xx = (t - 0.5) * g * 2.4; ctx.lineTo(xx + Math.sin(t * Math.PI * 6) * g * 0.35, Math.cos(t * Math.PI * 6) * g * 0.5); }
    ctx.stroke();
  } else if (f.art === 'blitz'){
    ctx.moveTo(-g * 0.2, -g); ctx.lineTo(g * 0.35, -g * 0.15); ctx.lineTo(-g * 0.1, -g * 0.05); ctx.lineTo(g * 0.25, g); ctx.lineTo(-g * 0.4, g * 0.05); ctx.lineTo(0, 0); ctx.closePath();
    if (gefuellt) ctx.fill(); else ctx.stroke();
  }
  ctx.restore();
}
// Die Fläche zeichnen: Konfetti, der Satz in Hellblau, darüber deckend das rote Muster
function malen(P, T, seed){
  var cv = document.createElement('canvas'), S = MASSSTAB, rnd = Kern.zufall(seed + 11);
  cv.width = Math.round(P.b * S); cv.height = Math.round(P.h * S);
  var ctx = cv.getContext('2d');
  ctx.scale(S, S);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, P.b, P.h);
  T.konfetti.forEach(function(f){ figur(ctx, f, true); });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  P.buchst.forEach(function(q){
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate((rnd() - 0.5) * 0.12);
    ctx.font = schrift(P.gr, 800); ctx.fillStyle = Kern.BLAU[Math.floor(rnd() * Kern.BLAU.length)]; ctx.fillText(q.c, 0, 0); ctx.restore();
  });
  // rote Wortreihen: dicht, deckend, in drei Lagen
  ctx.textAlign = 'left';
  T.reihen.forEach(function(r){
    ctx.save(); ctx.font = schrift(r.gr, 800); ctx.fillStyle = r.farbe;
    if (r.lage === 'kopf'){ ctx.translate(P.b, r.y * 2); ctx.rotate(Math.PI); }
    else if (r.lage === 'spiegel'){ ctx.translate(P.b, 0); ctx.scale(-1, 1); }
    ctx.fillText(r.text, r.x, r.y);
    ctx.restore();
  });
  T.figuren.forEach(function(f, i){ figur(ctx, f, i % 3 === 0); });
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
    '<p>Ein Satz versteckt sich unter einem dichten roten Muster – von Auge nicht zu lesen. Mit einer roten Folie darüber verschwindet das Rot, und der Satz erscheint.</p></header>' +
  '<div class="rf-layout"><section class="rf-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimer Satz</h2><p>Er erscheint unter der roten Folie.</p></div></div>' +
      '<label class="feld-label" for="rfSatz">Satz</label>' +
      '<div class="rf-zeile"><textarea id="rfSatz" rows="2" maxlength="90" autocomplete="off" spellcheck="false"></textarea>' +
        '<button type="button" class="btn klein" id="rfZufall" title="Einen anderen Satz vorschlagen">Andere</button></div>' +
      '<p class="hinweis">Bis 90 Zeichen. Je kürzer der Satz, desto grösser die Buchstaben.</p>' +
      '<label class="feld-label" for="rfGroesse">Schriftgrösse des Satzes: <b id="rfGroesseWert"></b></label>' +
      '<input type="range" id="rfGroesse" class="rf-balken" min="36" max="140" step="2">' +
      '<p class="hinweis">Grösser ist durch die Folie leichter zu lesen – ohne Folie aber auch eher zu erahnen.</p>' +
      '<label class="opt"><input type="checkbox" id="rfGross"><span>Nur Grossbuchstaben</span></label>' +
      '<div class="rf-zaehler" id="rfZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="rfLinien"><span>Linien für die Antwort</span></label>' +
      '<p class="hinweis">Der Satz steht in grossen hellblauen Buchstaben unter einem dichten roten Muster aus Wörtern, Herzen, Sternen und Spiralen. Durch die rote Folie wird alles Rote weiss – der Satz bleibt grau stehen.</p>' +
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
  beschreibung:'Ein eigener Satz versteckt sich unter einem dichten roten Muster aus Wörtern, Herzen und Sternen. Von Auge ist er nicht zu lesen; mit einer roten Folie darauf erscheint er. Mit Folie zum Ausprobieren am Bildschirm und Lösungsblatt.',
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
  var STANDARD = { groesse:80, gross:false, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
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
  st.opt.groesse = Math.max(36, Math.min(140, +st.opt.groesse || 80));
  function groesseZeigen(){ $('#rfGroesseWert').textContent = st.opt.groesse + ' px'; }
  $('#rfGroesse').value = st.opt.groesse; groesseZeigen();
  $('#rfGroesse').addEventListener('input', function(){ st.opt.groesse = +this.value; groesseZeigen(); speichern(); baldZeichnen(); });
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
    return 'Unter dem roten Muster versteckt sich ein geheimer Satz. Lege eine rote Folie auf das Bild – das Rot verschwindet, und der Satz erscheint.' + (st.opt.linien ? ' Schreibe ihn auf die Linien.' : ' Wie heisst er?');
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
    P = plan(satz, st.opt.groesse);
    if (!P){ $('#rfZaehler').innerHTML = ''; $('#rfBlatt').parentNode.hidden = true; $('#rfLoesung').parentNode.hidden = true; ['#rfZeigeLoesung', '#rfNeu', '#rfPdf', '#rfHerunterladen', '#rfFolieKnopf'].forEach(function(s){ $(s).disabled = true; }); meldung('warnung', '<p>Ein Wort ist zu lang für eine Zeile – kürze es oder trenne es mit einem Leerzeichen.</p>'); return; }
    meldung('', ''); $('#rfBlatt').parentNode.hidden = false; $('#rfLoesung').parentNode.hidden = false;
    $('#rfZaehler').innerHTML = '<p class="rf-zaehler-haupt ok"><b>' + satz.length + '</b> Zeichen · ' + P.zeilen.length + (P.zeilen.length === 1 ? ' Zeile' : ' Zeilen') + ', Schrift ' + P.gr + ' px</p>' +
      (P.kleiner ? '<p class="warnung">Kleiner gesetzt als gewählt (' + st.opt.groesse + ' px): Sonst wäre ein Wort zu lang für die Zeile oder das Bild höher als die Seite.</p>' : '') + h;
    var k = [satz, P.gr, st.seed, Labor.blattSchrift('buchstaben')].join('|');
    if (k !== schluessel || !bilder){
      var cv = malen(P, Kern.muster({ seed:st.seed, b:P.b, h:P.h }), st.seed);
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
