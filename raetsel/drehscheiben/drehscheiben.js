/* Rätsellabor – Generator «Drehscheiben»
   Konzentrische Scheiben zum Ausschneiden: Die Zahlen oder Buchstaben stehen im Kreis, mit dem Kopf nach aussen, und
   reichen über alle Ringe. Jede Scheibe trägt nur ihr Stück (ihren Ring) der Zeichen. Legt man die Scheiben der Grösse
   nach aufeinander (die grösste zuunterst, darüber der Deckel mit dem Drehpfeil) und dreht sie richtig, passen die
   Stücke zusammen und die Zeichen erscheinen. Auf Wunsch kommen Stücke anderer Zeichen und Punkte als Ablenkung dazu.
   Das Blatt (A4, 703 × 1031 Pixel wie im PDF, 1 mm = 703/186 Pixel) zeigt die Scheiben in Originalgrösse; am Bildschirm
   lassen sich die Ringe auch drehen. Lösungsblatt mit den zusammengesetzten Scheiben. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var PXMM = 703 / 186;   // Pixel pro Millimeter auf dem Blatt
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(w){ w %= 360; return w < 0 ? w + 360 : w; }
  function abstand(a, b){ var d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); }   // Winkelabstand in Grad (0 … 180)
  var ZIFFERN = '0123456789'.split(''), BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  // Auf dem Kopf (unten auf der Scheibe) sieht 6 wie 9 aus und M wie W – zufällig gewählt kommt nur eines davon
  var GEGENSTUECK = { 6:'9', 9:'6', M:'W', W:'M' };

  // Eingabe → Zeichen: Ziffern und Grossbuchstaben (auch Ä, Ö, Ü); Leerzeichen, Kommas usw. fallen weg, ß wird zu SS
  function zeichen(text){ return String(text || '').replace(/ß/g, 'SS').toUpperCase().replace(/[^0-9A-ZÄÖÜ]/g, '').split(''); }
  // n verschiedene zufällige Ziffern oder Buchstaben; «schon» bleibt vorne erhalten
  function zufallsZeichen(art, n, rnd, schon){
    var aus = (schon || []).slice(0, n);
    mischen((art === 'buchstaben' ? BUCHSTABEN : ZIFFERN).slice(), rnd).forEach(function(c){
      if (aus.length < n && aus.indexOf(c) < 0 && aus.indexOf(GEGENSTUECK[c]) < 0) aus.push(c);
    });
    return aus;
  }
  function gegenstuecke(liste){ return liste.filter(function(c, i){ return GEGENSTUECK[c] && liste.indexOf(GEGENSTUECK[c]) > i; }).map(function(c){ return c + '/' + GEGENSTUECK[c]; }); }

  /* Plan der Scheiben. o: { zeichen:[…], breite(c) → Breite/Höhe des Zeichens (mit Strich), art ('ziffern'|'buchstaben'),
     durchmesser (mm, grösste Scheibe), ringe (Anzahl Scheiben mit Zeichen), ablenker ('keine'|'einige'|'viele'),
     punkte (true/false), seed }. Alle Längen in Pixeln.
     → { R, ga, gb (Zeichen reichen radial von ga bis gb), h, rm, r:[Deckel, Scheibe 1 (innen) … Scheibe n (aussen)],
         winkel (Mitte jedes Zeichens, Grad im Uhrzeigersinn ab oben), papier / schirm (Drehung jeder Scheibe),
         ablenker[k]:[{ c, w }], punkte[k]:[{ w, r }], ueber (Überlappung unter der nächstkleineren Scheibe) } */
  function planen(o){
    var rnd = zufall(o.seed), mm = PXMM, m = o.zeichen.length, n = o.ringe;
    var R = o.durchmesser / 2 * mm, gb = R - 4 * mm, luecke = 2.5 * mm, ueber = 1.5 * mm;
    var alpha = Math.max.apply(null, o.zeichen.map(o.breite));
    /* Die Zeichen sollen so gross wie möglich sein, dürfen sich aber innen (wo es eng wird) nicht berühren: Bei m Zeichen
       mit ±10 % Spiel ist der kleinste Winkel zwischen zwei Mitten 0.8 · 360°/m. Am inneren Ende ga muss gelten
       (Breite/2 + Lücke) ≤ ga · tan(halber Winkel), Breite = alpha · (gb − ga). Der Deckel braucht innen mindestens 13 mm. */
    var halb = Math.min(80, 180 / m * 0.8) * Math.PI / 180;
    var ga = Math.max(14.5 * mm, (alpha * gb / 2 + luecke) / (Math.tan(halb) + alpha / 2));
    var h = gb - ga, r = [ga - ueber];
    for (var k = 1; k < n; k++) r.push(ga + h * k / n);
    r.push(R);
    var schritt = 360 / m, start = rnd() * 360;
    var winkel = o.zeichen.map(function(_, j){ return norm(start + j * schritt + (rnd() * 2 - 1) * 0.1 * schritt); });
    function versatz(){ return r.slice(1).map(function(){ return Math.round(30 + rnd() * 300); }); }
    var papier = versatz(), schirm = versatz();
    schirm[n - 1] = 0;   // am Bildschirm: die äusserste Scheibe steht still, die anderen sind verdreht
    // Wie breit (in Grad) ein Zeichen samt halber Lücke auf einem Ring ist, der bei Radius «innen» beginnt
    function halbWinkel(c, innen){ return Math.atan((o.breite(c) * h / 2 + luecke / 2) / innen) * 180 / Math.PI; }
    // Ablenker: Stücke anderer Zeichen in den Lücken jedes Rings. Nie eines der gesuchten Zeichen (sonst könnte ein
    // falsch gedrehter Ring ein gesuchtes Zeichen ergänzen) und auf jedem Ring andere – so ergibt sich nie ein ganzes Zeichen.
    var pool = mischen((o.art === 'buchstaben' ? BUCHSTABEN : ZIFFERN).filter(function(c){ return o.zeichen.indexOf(c) < 0; }), rnd);
    var wieviel = { keine:0, einige:Math.max(1, Math.ceil(m / 2)), viele:Math.max(2, m) }[o.ablenker] || 0;
    var ablenker = [], naechstes = 0;
    for (k = 1; k <= n; k++){
      var innen = Math.max(r[k - 1], ga), besetzt = o.zeichen.map(function(c, j){ return { w:winkel[j], b:halbWinkel(c, innen) }; }), liste = [];
      for (var t = 0; t < 400 && liste.length < wieviel && pool.length; t++){
        var c = pool[(naechstes + liste.length) % pool.length], phi = rnd() * 360, b = halbWinkel(c, innen);
        if (besetzt.every(function(x){ return abstand(x.w, phi) >= x.b + b; })){ besetzt.push({ w:phi, b:b }); liste.push({ c:c, w:phi }); }
      }
      naechstes += liste.length;
      ablenker.push(liste);
    }
    // Punkte als Ablenkung: zufällig im sichtbaren Ring jeder Scheibe, etwa einer pro 9 × 9 mm
    var punkte = [];
    for (k = 1; k <= n; k++){
      var a0 = r[k - 1] + 1.4 * mm, a1 = r[k] - (k === n ? 2 : 1.4) * mm, liste2 = [];
      var anzahl = o.punkte && a1 > a0 ? Math.round(Math.PI * (a1 * a1 - a0 * a0) / Math.pow(9 * mm, 2)) : 0;
      for (var i = 0; i < anzahl; i++) liste2.push({ w:rnd() * 360, r:Math.sqrt(a0 * a0 + rnd() * (a1 * a1 - a0 * a0)) });
      punkte.push(liste2);
    }
    return { mm:mm, R:R, ga:ga, gb:gb, h:h, rm:(ga + gb) / 2, r:r, ringe:n, ueber:ueber, winkel:winkel, zeichen:o.zeichen.slice(),
      papier:papier, schirm:schirm, ablenker:ablenker, punkte:punkte, ringBreite:h / n };
  }

  /* Kreise auf Seiten verteilen. teile: [{ id, d }] (Durchmesser), der grösste zuerst. Jeder Kreis kommt an die oberste,
     dann linkeste Stelle (Raster von 3 Pixeln), wo er mit «luft» Abstand neben allen anderen Platz hat – so rutschen kleine
     Scheiben in die Ecken neben den grossen. Erst wenn auf keiner Seite Platz ist, beginnt eine neue. Am Schluss stehen
     die Kreise jeder Seite waagrecht in der Mitte.
     → { lage:[{ id, seite, x, y }] (Mittelpunkte), seiten }. hoehen: [Höhe Seite 1, Höhe weitere Seiten]. */
  function packen(teile, breite, hoehen, luft){
    var seiten = [], lage = [], S = 3;
    function stelle(s, r){
      for (var y = r; y <= s.hoehe - r + 1e-6; y += S){
        for (var x = r; x <= breite - r + 1e-6; x += S){
          var frei = true;
          for (var i = 0; i < s.kreise.length && frei; i++){ var c = s.kreise[i], dx = c.x - x, dy = c.y - y, m = c.r + r + luft; if (dx * dx + dy * dy < m * m) frei = false; }
          if (frei) return { x:x, y:y };
        }
      }
      return null;
    }
    teile.slice().sort(function(a, b){ return b.d - a.d; }).forEach(function(t){
      var r = t.d / 2, p = null, s = null;
      for (var i = 0; i < seiten.length && !p; i++){ p = stelle(seiten[i], r); if (p) s = seiten[i]; }
      if (!p){ s = { hoehe:seiten.length ? hoehen[1] : hoehen[0], kreise:[] }; seiten.push(s); p = stelle(s, r) || { x:breite / 2, y:r }; }
      s.kreise.push({ x:p.x, y:p.y, r:r });
      lage.push({ id:t.id, seite:seiten.indexOf(s), x:p.x, y:p.y });
    });
    seiten.forEach(function(s, si){   // waagrecht mittig
      var a = Infinity, b = -Infinity;
      s.kreise.forEach(function(c){ a = Math.min(a, c.x - c.r); b = Math.max(b, c.x + c.r); });
      var dx = (breite - (b - a)) / 2 - a;
      lage.forEach(function(l){ if (l.seite === si) l.x += dx; });
    });
    return { lage:lage, seiten:seiten.length };
  }
  return { PXMM:PXMM, zufall:zufall, mischen:mischen, norm:norm, abstand:abstand, zeichen:zeichen, zufallsZeichen:zufallsZeichen,
    gegenstuecke:gegenstuecke, planen:planen, packen:packen, ZIFFERN:ZIFFERN, BUCHSTABEN:BUCHSTABEN };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', GRAU = '#8A8079', PFEIL = '#E46F12';
var SEITE_B = 703, SEITE_H = 1031, RAND = 8, LUFT = 6;   // Seite (Pixel), Innenrand, Abstand zwischen den Scheiben (1.6 mm)
var STRICH = 0.05;   // zusätzlicher Strich um die Zeichen (Anteil der Schriftgrösse) – macht sie kräftig wie Filzstift
function esc(t){ return Labor.esc(t); }
function chips(name, liste){ return liste.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }
function f1(x){ return (Math.round(x * 100) / 100).toString(); }

// Masse der Zeichen in der gewählten Schrift (fett, 100 Pixel): Abstand links/rechts vom Ursprung, über/unter der Grundlinie
var messer = document.createElement('canvas').getContext('2d');
function metrik(c){
  messer.font = '700 100px ' + Labor.blattSchrift('buchstaben');
  var m = messer.measureText(c);
  return { l:m.actualBoundingBoxLeft || 0, r:m.actualBoundingBoxRight || m.width, a:m.actualBoundingBoxAscent || 70, d:m.actualBoundingBoxDescent || 0 };
}

/* ---------- Zeichnen ----------
   Jede Scheibe wird um ihren Mittelpunkt (0, 0) gezeichnet. Die Zeichen stehen in einer Gruppe, die auf den Ring der
   Scheibe zugeschnitten ist (clipPath); so trägt jede Scheibe nur ihr Stück. Nach innen reicht das Stück 1.5 mm unter die
   nächstkleinere Scheibe, damit beim Ausschneiden keine weissen Lücken entstehen. */
function ringPfad(aussen, innen){
  function kreis(r){ return 'M' + f1(r) + ' 0A' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-r) + ' 0A' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(r) + ' 0Z'; }
  return kreis(aussen) + (innen > 0 ? kreis(innen) : '');
}
function zeichenSvg(G, c, w){
  var m = G.metrik[c], s = G.f / 100;
  return '<text transform="rotate(' + f1(w) + ') translate(0 ' + f1(-G.P.rm) + ')" x="' + f1(-(m.r - m.l) / 2 * s) + '" y="' + f1((m.a - m.d) / 2 * s) + '">' + esc(c) + '</text>';
}
// Inhalt der Scheibe k (1 = innerste … n = äusserste), ohne Drehung; id: eindeutiger Name für den Zuschnitt
function ringInhalt(G, k, id){
  var P = G.P, innen = P.r[k - 1] - P.ueber;
  var t = '<defs><clipPath id="' + id + '"><path clip-rule="evenodd" d="' + ringPfad(P.r[k] - 0.4, innen) + '"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')"><g font-size="' + f1(G.f) + '" font-weight="700" fill="' + TINTE + '" stroke="' + TINTE + '" stroke-width="' + f1(G.f * STRICH) + '" stroke-linejoin="round" style="font-family:var(--blatt-buchstaben)">';
  P.zeichen.forEach(function(c, j){ t += zeichenSvg(G, c, P.winkel[j]); });
  P.ablenker[k - 1].forEach(function(a){ t += zeichenSvg(G, a.c, a.w); });
  t += '</g></g>';
  var pr = 0.75 * P.mm;
  P.punkte[k - 1].forEach(function(p){ var a = p.w * Math.PI / 180; t += '<circle cx="' + f1(p.r * Math.sin(a)) + '" cy="' + f1(-p.r * Math.cos(a)) + '" r="' + f1(pr) + '" fill="' + TINTE + '"/>'; });
  return t;
}
function loch(P){
  var r = 2 * P.mm, k = 3.5 * P.mm;
  return '<circle r="' + f1(r) + '" fill="none" stroke="' + GRAU + '" stroke-width="0.8"/><path d="M' + f1(-k) + ' 0H' + f1(k) + 'M0 ' + f1(-k) + 'V' + f1(k) + '" stroke="' + GRAU + '" stroke-width="0.6"/>';
}
// Deckel: der kleinste Kreis zuoberst, mit einem Drehpfeil
function deckel(P, rand){
  var r0 = P.r[0], ra = r0 * 0.62, a0 = -100, a1 = 135, L = Math.max(5, ra * 0.34);
  function pt(r, w){ var a = w * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; }
  var s = pt(ra, a0), e = pt(ra, a1), b = a1 * Math.PI / 180, tx = Math.cos(b), ty = Math.sin(b), nx = Math.sin(b), ny = -Math.cos(b);
  var spitze = [e[0] + tx * L, e[1] + ty * L], l = [e[0] + nx * L * 0.62, e[1] + ny * L * 0.62], q = [e[0] - nx * L * 0.62, e[1] - ny * L * 0.62];
  return '<circle r="' + f1(r0) + '" fill="#fff" stroke="' + (rand || TINTE) + '" stroke-width="' + (rand ? 0.8 : 1) + '"/>' +
    '<path d="M' + f1(s[0]) + ' ' + f1(s[1]) + 'A' + f1(ra) + ' ' + f1(ra) + ' 0 1 1 ' + f1(e[0]) + ' ' + f1(e[1]) + '" fill="none" stroke="' + PFEIL + '" stroke-width="' + f1(Math.max(1.6, r0 * 0.05)) + '" stroke-linecap="round"/>' +
    '<path d="M' + f1(spitze[0]) + ' ' + f1(spitze[1]) + 'L' + f1(l[0]) + ' ' + f1(l[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + 'Z" fill="' + PFEIL + '"/>' + loch(P);
}
// Eine Scheibe zum Ausschneiden (Blatt): Schnittlinie, Stück, gestrichelt der Platz der nächstkleineren Scheibe, Nummer
function scheibeBlatt(G, k, id){
  var P = G.P, n = P.ringe, unten = n - k + 1, innen = P.r[k - 1], fs = Math.max(9, Math.min(13, innen * 0.16));
  return '<circle r="' + f1(P.r[k]) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1"/>' + ringInhalt(G, k, id) +
    '<circle r="' + f1(innen) + '" fill="none" stroke="' + GRAU + '" stroke-width="0.7" stroke-dasharray="3 3"/>' +
    '<text y="' + f1(-innen * 0.5) + '" text-anchor="middle" dominant-baseline="central" font-size="' + f1(fs) + '" fill="' + GRAU + '" style="font-family:var(--blatt-schrift)">' + (unten === 1 ? '1 · zuunterst' : unten) + '</text>' + loch(P);
}
/* Zusammengesetzte Scheiben (Bildschirm und Lösungsblatt): von unten (äusserste) nach oben, jede um ihren Versatz gedreht.
   spiel: am Bildschirm drehbar (anwählbar mit der Tastatur). */
function stapelSvg(G, versatz, praefix, spiel){
  var P = G.P, n = P.ringe, R = P.R, t = '';
  for (var k = n; k >= 1; k--){
    var d = versatz[k - 1] || 0;
    t += '<g class="dr-ring" data-k="' + k + '"' + ' transform="rotate(' + f1(d) + ')"' + (spiel ? ' tabindex="0" role="slider" aria-label="Scheibe ' + (n - k + 1) + ' von unten drehen" aria-valuemin="0" aria-valuemax="359" aria-valuenow="' + Math.round(Kern.norm(d)) + '"' : '') + '>' +
      '<circle class="dr-rand" r="' + f1(P.r[k]) + '" fill="#fff" stroke="#9C9089" stroke-width="0.8"/>' + ringInhalt(G, k, praefix + k) + '</g>';
  }
  t += '<g class="dr-deckel">' + deckel(P, '#9C9089') + '</g>';
  return '<svg class="dr-stapel" viewBox="' + f1(-R - 3) + ' ' + f1(-R - 3) + ' ' + f1(2 * R + 6) + ' ' + f1(2 * R + 6) + '" role="img" aria-label="Drehscheiben">' + t + '</svg>';
}

var VORLAGE = '<div class="dr">' +
  '<header class="dr-kopf-seite"><p class="augenbraue">Rätselgenerator</p><h1>Drehscheiben</h1>' +
    '<p>Konzentrische Scheiben zum Ausschneiden: Jede Scheibe trägt nur ein Stück der Zahlen oder Buchstaben. Wer die Scheiben richtig dreht, sieht die Zeichen.</p></header>' +
  '<div class="dr-layout"><section class="dr-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zeichen</h2><p>Welche Zahlen oder Buchstaben sollen erscheinen?</p></div></div>' +
      '<div class="dr-chips" role="radiogroup" aria-label="Art">' + chips('drArt', [['ziffern', 'Zahlen'], ['buchstaben', 'Buchstaben']]) + '</div>' +
      '<label class="feld-label" for="drZeichen">Zeichen</label>' +
      '<div class="dr-zeichen-zeile"><input type="text" id="drZeichen" maxlength="40" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="drZufall" title="Andere zufällige Zeichen">Andere</button></div>' +
      '<p class="feld-label">Anzahl</p><div class="dr-chips dr-anzahl" role="radiogroup" aria-label="Anzahl Zeichen">' + chips('drAnzahl', [1, 2, 3, 4, 5, 6, 7, 8].map(function(n){ return [n, n]; })) + '</div>' +
      '<p class="hinweis">Du kannst die Zeichen auch selbst eintippen, z. B. «3 5 8» oder «HUND» (höchstens 8). Mit «Anzahl» kommen zufällige dazu oder fallen weg.</p>' +
      '<div class="dr-zaehler" id="drZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Scheiben</h2></div></div>' +
      '<p class="feld-label">Scheiben mit Zeichen</p><div class="dr-chips" role="radiogroup" aria-label="Anzahl Scheiben">' + chips('drRinge', [[2, '2 · leicht'], [3, '3'], [4, '4'], [5, '5 · schwer']]) + '</div>' +
      '<p class="feld-label">Grösste Scheibe</p><div class="dr-chips" role="radiogroup" aria-label="Durchmesser der grössten Scheibe">' + chips('drGroesse', [[100, '10 cm'], [120, '12 cm'], [150, '15 cm'], [180, '18 cm']]) + '</div>' +
      '<p class="feld-label">Stücke anderer Zeichen</p><div class="dr-chips" role="radiogroup" aria-label="Stücke anderer Zeichen als Ablenkung">' + chips('drAblenker', [['keine', 'keine'], ['einige', 'einige'], ['viele', 'viele']]) + '</div>' +
      '<label class="opt"><input type="checkbox" id="drPunkte"><span>Punkte als Ablenkung</span></label>' +
      '<p class="hinweis" id="drMass"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="drAntwort"><span>Linie für die Antwort</span></label>' +
      '<div class="opt-raster"><label for="drTitel">Titel auf dem Blatt</label><input type="text" id="drTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="dr-ausgabe" aria-label="Ergebnis">' +
    '<div id="drMeldung" aria-live="polite"></div>' +
    '<div class="dr-werkzeug">' +
      '<button type="button" class="btn klein" id="drZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="drNeu" title="Zeichen anders verteilen, Scheiben neu verdrehen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="drMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="drPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="drHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="dr-inhalt" id="drInhalt">' +
      '<div class="dr-spiel karte" id="drSpiel"><div class="dr-spiel-kopf"><h2>Ausprobieren</h2><p id="drSpielText">Drehe die Scheiben mit der Maus oder dem Finger, bis die Zeichen erscheinen.</p></div>' +
        '<div class="dr-spielfeld" id="drSpielfeld"></div></div>' +
      '<p class="dr-seiten-info" id="drSeitenInfo"></p>' +
      '<div class="dr-seiten" id="drSeiten"></div>' +
      '<div class="dr-loesungs-rahmen"><article class="dr-blatt dr-loesungsblatt" id="drLoesung" aria-hidden="true"></article></div>' +
    '</div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2.5v4M17.5 12h4"/></svg>';

Labor.registriere({
  id:'drehscheiben',
  titel:'Drehscheiben',
  kurz:'Scheiben drehen, bis Zahlen oder Buchstaben erscheinen',
  beschreibung:'Konzentrische Scheiben zum Ausschneiden: Jede Scheibe trägt nur ein Stück der Zeichen. Wer sie richtig dreht, sieht die Zahlen oder Buchstaben. Auch am Bildschirm drehbar, mit Lösungsblatt.',
  merkmale:['Eigene Zahlen oder Buchstaben', '2 bis 5 Scheiben', 'Am Bildschirm drehbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/drehscheiben/drehscheiben.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'drehscheiben-eingaben', OPT = 'drehscheiben-einstellungen';
  var STANDARD = { art:'ziffern', anzahl:4, ringe:4, groesse:120, ablenker:'einige', punkte:true, antwort:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { titel:'', zeichen:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.titel = String(e.titel || ''); st.zeichen = String(e.zeichen || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if ([2, 3, 4, 5].indexOf(+st.opt.ringe) < 0) st.opt.ringe = 4;
  if ([100, 120, 150, 180].indexOf(+st.opt.groesse) < 0) st.opt.groesse = 120;
  if (!Kern.zeichen(st.zeichen).length) st.zeichen = Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(st.seed + 7)).join(' ');
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, zeichen:st.zeichen, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#drMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  function radios(name, k, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = typeof STANDARD[k] === 'number' ? +r.value : r.value; speichern(); if (nachher) nachher(); zeichnen(); });
    });
  }
  function liste(){ return Kern.zeichen(st.zeichen).slice(0, 8); }
  function feldSetzen(z){ st.zeichen = z.join(' '); $('#drZeichen').value = st.zeichen; speichern(); }
  function anzahlZeigen(){
    var n = Kern.zeichen(st.zeichen).length;
    [].forEach.call(bereich.querySelectorAll('input[name="drAnzahl"]'), function(r){ r.checked = +r.value === n; });
    if (n >= 1 && n <= 8) st.opt.anzahl = n;
  }
  radios('drArt', 'art', function(){ feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now()))); });
  radios('drAnzahl', 'anzahl', function(){ feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now()), liste())); });
  radios('drRinge', 'ringe'); radios('drGroesse', 'groesse'); radios('drAblenker', 'ablenker');
  $('#drZeichen').value = st.zeichen; anzahlZeigen();
  $('#drZeichen').addEventListener('input', function(){ st.zeichen = this.value; speichern(); anzahlZeigen(); baldZeichnen(); });
  $('#drZufall').addEventListener('click', function(){ feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now()))); anzahlZeigen(); zeichnen(); });
  [['#drPunkte', 'punkte'], ['#drAntwort', 'antwort'], ['#drMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  $('#drTitel').value = st.titel;
  $('#drTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); baldZeichnen(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#drNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Rätsel ---------- */
  var G = null, spielVersatz = [], zaehlerId = 0;
  function wort(z){
    var ziffern = z.every(function(c){ return /\d/.test(c); }), buchst = z.every(function(c){ return !/\d/.test(c); });
    return ziffern ? ['Zahl', 'Zahlen'] : buchst ? ['Buchstabe', 'Buchstaben'] : ['Zeichen', 'Zeichen'];
  }
  function frage(z){
    var w = wort(z);
    return z.length === 1 ? (w[0] === 'Zahl' ? 'Welche Zahl' : w[0] === 'Buchstabe' ? 'Welcher Buchstabe' : 'Welches Zeichen') + ' erscheint?' : 'Welche ' + w[1] + ' erscheinen?';
  }
  function anleitung(z){
    var w = wort(z), n = z.length;
    return 'Schneide die Scheiben aus und stich in der Mitte ein kleines Loch. Lege sie der Grösse nach aufeinander – die grösste zuunterst, den Deckel mit dem Pfeil zuoberst – und stecke eine Musterklammer durch die Mitte. ' +
      'Drehe die Scheiben, bis die Stücke zusammenpassen. ' + (n === 1 ? 'Es ist ' + (w[0] === 'Zahl' ? 'eine Zahl' : w[0] === 'Buchstabe' ? 'ein Buchstabe' : 'ein Zeichen') + ' versteckt' : 'Es sind ' + n + ' ' + w[1] + ' versteckt') +
      ', mit dem Kopf nach aussen. ' + frage(z);
  }
  function titel(){ return st.titel.trim() || 'Drehscheiben'; }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, alle = Kern.zeichen(st.zeichen), z = alle.slice(0, 8);
    var h = '';
    if (alle.length > 8) h += '<p class="warnung">Höchstens 8 Zeichen – es werden die ersten 8 verwendet.</p>';
    var gs = Kern.gegenstuecke(z);
    if (gs.length) h += '<p class="warnung">' + gs.join(', ') + ': Auf dem Kopf sehen sie gleich aus – unten auf der Scheibe kann das verwirren.</p>';
    $('#drZaehler').innerHTML = z.length ? '<p class="dr-zaehler-haupt ok"><b>' + z.length + '</b> ' + (z.length === 1 ? 'Zeichen' : 'Zeichen') + ': ' + z.map(esc).join(' · ') + '</p>' + h : '';
    if (!z.length){
      G = null; $('#drInhalt').hidden = true; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = true; });
      meldung('info', '<p>Gib links die Zahlen oder Buchstaben ein, die auf den Scheiben erscheinen sollen.</p>');
      return;
    }
    $('#drInhalt').hidden = false; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = false; });
    // Masse der Zeichen (auch der möglichen Ablenker) in der gewählten Schrift
    var M = {}, hoch = 0;
    Kern.ZIFFERN.concat(Kern.BUCHSTABEN, z).forEach(function(c){ if (!M[c]) M[c] = metrik(c); });
    z.forEach(function(c){ hoch = Math.max(hoch, M[c].a + M[c].d); });
    function breite(c){ return ((M[c].l + M[c].r) / 100 + STRICH) / (hoch / 100 + STRICH); }
    var P = Kern.planen({ zeichen:z, breite:breite, art:o.art, durchmesser:o.groesse, ringe:o.ringe, ablenker:o.ablenker, punkte:o.punkte, seed:st.seed });
    G = { P:P, metrik:M, f:P.h / (hoch / 100 + STRICH) };
    // Zeichen mittig im Band ga … gb: die Schrift ist so gross, dass das höchste Zeichen (mit Strich) genau hineinpasst
    var mm = P.mm, mass = 'Scheiben: ' + P.r.slice(1).reverse().map(function(r){ return f1(Math.round(r * 2 / mm) / 10) + ' cm'; }).join(', ') + ' · Deckel ' + f1(Math.round(P.r[0] * 2 / mm) / 10) + ' cm · ' +
      'Zeichen ' + f1(Math.round(P.h / mm) / 10) + ' cm hoch · Ringe je ' + Math.round(P.ringBreite / mm) + ' mm breit. Zum Zusammenstecken: eine Musterklammer.';
    $('#drMass').textContent = mass;
    meldung(P.ringBreite < 4.5 * mm ? 'warnung' : '', P.ringBreite < 4.5 * mm ? '<p>Die Ringe sind nur ' + f1(Math.round(P.ringBreite / mm * 10) / 10) + ' mm breit – das ist schwierig zum Ausschneiden. Weniger Zeichen, weniger Scheiben oder eine grössere Scheibe helfen.</p>' : '');
    seitenZeichnen(z);
    spielVersatz = P.schirm.slice();
    spielZeichnen();
    loesungZeichnen(z);
  }

  /* ---------- Blatt: Scheiben in Originalgrösse auf A4-Seiten ---------- */
  function kopfHtml(z){
    var o = st.opt;
    return (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') + (o.anleitungAn ? '<p class="dr-anleitung">' + esc(anleitung(z)) + '</p>' : '');
  }
  function antwortHtml(z, loesung){
    var w = wort(z);
    return '<p class="dr-antwort">' + (z.length === 1 ? 'Diese' + (w[0] === 'Buchstabe' ? 'r ' + w[0] : w[0] === 'Zahl' ? ' Zahl' : 's Zeichen') + ' habe ich gefunden:' : 'Diese ' + w[1] + ' habe ich gefunden:') +
      ' <span class="dr-linie">' + (loesung ? z.map(esc).join(' ') : '') + '</span></p>';
  }
  function seitenZeichnen(z){
    var P = G.P, n = P.ringe, ziel = $('#drSeiten'), o = st.opt, nr = ++zaehlerId;
    // Kopf und Antwort messen (Seite 1), dann die Scheiben auf die Seiten verteilen
    ziel.innerHTML = '<div class="dr-seite-platz"><article class="dr-blatt dr-seite"><div class="dr-kopf">' + kopfHtml(z) + '</div>' + (o.antwort ? antwortHtml(z, false) : '') + '</article></div>';
    var k1 = ziel.querySelector('.dr-kopf'), a1 = ziel.querySelector('.dr-antwort');
    var kopfH = k1.offsetHeight + (k1.offsetHeight ? 8 : 0), antwortH = a1 ? a1.offsetHeight + 14 : 0;
    var B = SEITE_B - 2 * RAND, H = SEITE_H - 2 * RAND, H1 = H - kopfH - antwortH;
    var teile = [{ id:0, d:2 * P.r[0] }];
    for (var k = 1; k <= n; k++) teile.push({ id:k, d:2 * P.r[k] });
    var pk = Kern.packen(teile, B, [H1, H], LUFT), html = '';
    for (var s = 0; s < pk.seiten; s++){
      var hoehe = s ? H : H1, inhalt = '';
      pk.lage.filter(function(l){ return l.seite === s; }).forEach(function(l){
        var dreh = l.id ? P.papier[l.id - 1] : Math.round(Kern.zufall(st.seed + 3)() * 360);
        inhalt += '<g transform="translate(' + f1(l.x) + ' ' + f1(l.y) + ') rotate(' + dreh + ')">' + (l.id ? scheibeBlatt(G, l.id, 'drb' + nr + '-' + l.id) : deckel(P)) + '</g>';
      });
      html += '<div class="dr-seite-platz"><article class="dr-blatt dr-seite' + (s ? ' neue-seite' : '') + '" aria-label="Seite ' + (s + 1) + '">' +
        (s ? '' : '<div class="dr-kopf">' + kopfHtml(z) + '</div>') +
        '<svg class="dr-flaeche" width="' + B + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + B + ' ' + f1(hoehe) + '" role="img" aria-label="Scheiben zum Ausschneiden">' + inhalt + '</svg>' +
        (s || !o.antwort ? '' : antwortHtml(z, false)) + '</article></div>';
    }
    ziel.innerHTML = html;
    $('#drSeitenInfo').textContent = pk.seiten === 1 ? 'Arbeitsblatt: eine Seite mit ' + (n + 1) + ' Teilen zum Ausschneiden (Originalgrösse).' : 'Arbeitsblatt: ' + pk.seiten + ' Seiten mit ' + (n + 1) + ' Teilen zum Ausschneiden (Originalgrösse).';
    massstab();
  }
  function loesungZeichnen(z){
    var P = G.P, o = st.opt, gr = Math.min(2 * P.R + 6, 600);
    $('#drLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="dr-anleitung"><b>Lösung</b></p>') +
      '<p class="dr-anleitung">So sehen die Scheiben richtig gedreht aus.</p>' +
      '<div class="dr-loesung-bild" style="width:' + f1(gr) + 'px;height:' + f1(gr) + 'px">' + stapelSvg(G, P.ringe ? P.r.slice(1).map(function(){ return 0; }) : [], 'drl' + zaehlerId + '-', false) + '</div>' +
      antwortHtml(z, true);
    var svg = $('#drLoesung svg'); svg.setAttribute('width', f1(gr)); svg.setAttribute('height', f1(gr));
  }

  /* ---------- Am Bildschirm drehen ---------- */
  var spielfeld = $('#drSpielfeld'), gezogen = null;
  function zeigeLoesung(){ return $('#drZeigeLoesung').getAttribute('aria-pressed') === 'true'; }
  function spielZeichnen(){
    var v = zeigeLoesung() ? spielVersatz.map(function(){ return 0; }) : spielVersatz;
    Object.keys(animation).forEach(function(k){ cancelAnimationFrame(animation[k]); });
    angezeigt = {}; v.forEach(function(w, i){ angezeigt[i + 1] = w; });
    spielfeld.innerHTML = stapelSvg(G, v, 'drs' + zaehlerId + '-', true);
    geloestPruefen();
  }
  function rel(k){ var P = G.P; return ((spielVersatz[k - 1] - spielVersatz[P.ringe - 1]) % 360 + 540) % 360 - 180; }
  // Drehung einer Scheibe zeigen; sanft: in 0.35 s hinüberdrehen (Einrasten, «Lösung zeigen»)
  var angezeigt = {}, animation = {};
  function drehungZeigen(k, w, sanft){
    var g = spielfeld.querySelector('.dr-ring[data-k="' + k + '"]');
    if (!g) return;
    cancelAnimationFrame(animation[k]);
    var von = angezeigt[k] == null ? w : angezeigt[k], t0 = 0;
    function setze(x){ angezeigt[k] = x; g.setAttribute('transform', 'rotate(' + f1(x) + ')'); }
    if (!sanft || Math.abs(w - von) < 0.5 || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)){ setze(w); return; }
    animation[k] = requestAnimationFrame(function schritt(t){
      if (!t0) t0 = t;
      var a = Math.min(1, (t - t0) / 350), e = 1 - Math.pow(1 - a, 3);
      setze(von + (w - von) * e);
      if (a < 1) animation[k] = requestAnimationFrame(schritt);
    });
  }
  function ringSetzen(k, w, sanft){
    spielVersatz[k - 1] = w;
    drehungZeigen(k, w, sanft);
    var g = spielfeld.querySelector('.dr-ring[data-k="' + k + '"]');
    if (g) g.setAttribute('aria-valuenow', Math.round(Kern.norm(w)));
  }
  function einrasten(grenze){
    var P = G.P;
    for (var k = 1; k < P.ringe; k++) if (Math.abs(rel(k)) < grenze) ringSetzen(k, spielVersatz[k - 1] - rel(k), true);
  }
  function geloestPruefen(){
    if (!G) return;
    var P = G.P, ok = !zeigeLoesung() && P.ringe > 0;
    for (var k = 1; k < P.ringe; k++) if (Math.abs(rel(k)) > 0.5) ok = false;
    spielfeld.classList.toggle('geloest', ok);
    $('#drSpielText').innerHTML = ok ? '<b>Geschafft!</b> Alle Scheiben passen. ' + frage(P.zeichen).replace('erscheinen?', 'siehst du?').replace('erscheint?', 'siehst du?')
      : zeigeLoesung() ? 'So passen die Scheiben zusammen.' : 'Drehe die Scheiben mit der Maus oder dem Finger, bis die Zeichen erscheinen. Mit der Tabulatortaste wählst du eine Scheibe, mit den Pfeiltasten drehst du sie.';
  }
  function winkelVon(svg, ev){
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    var q = p.matrixTransform(svg.getScreenCTM().inverse());
    return Math.atan2(q.x, -q.y) * 180 / Math.PI;
  }
  spielfeld.addEventListener('pointerdown', function(ev){
    var g = ev.target.closest && ev.target.closest('.dr-ring');
    if (!g || !G || zeigeLoesung() || ev.button > 0) return;
    ev.preventDefault();
    var svg = spielfeld.querySelector('svg'), k = +g.getAttribute('data-k');
    gezogen = { k:k, w0:winkelVon(svg, ev), v0:spielVersatz[k - 1], svg:svg, id:ev.pointerId };
    try { g.focus({ preventScroll:true }); } catch(x){}
    try { spielfeld.setPointerCapture(ev.pointerId); } catch(x){}
  });
  spielfeld.addEventListener('pointermove', function(ev){
    if (!gezogen || ev.pointerId !== gezogen.id) return;
    var d = winkelVon(gezogen.svg, ev) - gezogen.w0;
    ringSetzen(gezogen.k, gezogen.v0 + ((d + 540) % 360 - 180), false);
  });
  function loslassen(ev){
    if (!gezogen || (ev && ev.pointerId !== gezogen.id)) return;
    gezogen = null; einrasten(7); geloestPruefen();
  }
  spielfeld.addEventListener('pointerup', loslassen); spielfeld.addEventListener('pointercancel', loslassen);
  spielfeld.addEventListener('keydown', function(ev){
    var g = ev.target.closest && ev.target.closest('.dr-ring');
    if (!g || zeigeLoesung()) return;
    var k = +g.getAttribute('data-k'), d = ev.shiftKey ? 15 : 3;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') d = -d;
    else if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowUp') return;
    ev.preventDefault();
    ringSetzen(k, spielVersatz[k - 1] + d, false); einrasten(2); geloestPruefen();
  });
  $('#drZeigeLoesung').addEventListener('click', function(){
    var an = !zeigeLoesung(); this.setAttribute('aria-pressed', an ? 'true' : 'false');
    if (!G) return;
    for (var k = 1; k <= G.P.ringe; k++) drehungZeigen(k, an ? 0 : spielVersatz[k - 1], true);
    geloestPruefen();
  });

  /* ---------- Seiten am Bildschirm einpassen (sie bleiben 703 Pixel breit, wie im PDF) ---------- */
  function massstab(){
    var b = $('#drSeiten').clientWidth || SEITE_B, s = Math.min(1, b / (SEITE_B + 2));
    [].forEach.call(bereich.querySelectorAll('.dr-seite-platz'), function(p){
      p.style.height = (SEITE_H * s + 2).toFixed(0) + 'px';
      var a = p.firstChild; a.style.transform = 'scale(' + s.toFixed(4) + ')'; a.style.marginLeft = Math.max(0, (b - SEITE_B * s) / 2 - 1).toFixed(1) + 'px';
    });
  }
  var beobachter = window.ResizeObserver ? new ResizeObserver(function(){ massstab(); }) : null;
  if (beobachter) beobachter.observe($('.dr-ausgabe')); else window.addEventListener('resize', massstab);

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#drSeiten .dr-blatt')).concat(st.opt.mitLoesung ? [$('#drLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#drPdf'), function(){ return G && { blaetter:blaetter(), name:Labor.pdfName('Drehscheiben', st.titel) }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#drPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#drHerunterladen').hidden = false; });
  }
  $('#drHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !G) return;
    var name = Labor.pdfName('Drehscheiben', st.titel).replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.style.transform = ''; k.style.marginLeft = ''; if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.dr-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  // mit geladener Schrift neu messen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus) zeichnen(); });
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); if (beobachter) beobachter.disconnect(); else window.removeEventListener('resize', massstab);
    window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
