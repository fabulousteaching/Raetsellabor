/* Rätsellabor – Generator «Drehscheiben»
   Konzentrische Scheiben zum Ausschneiden: Zahlen, Buchstaben oder ein Wort stehen im Kreis, mit dem Kopf nach aussen,
   und reichen über alle Ringe. Jede Scheibe trägt nur ihr Stück (ihren Ring) der Zeichen. Legt man die Scheiben der Grösse
   nach aufeinander (die grösste zuunterst, darüber der Deckel mit dem Drehpfeil) und dreht sie richtig, passen die
   Stücke zusammen und die Zeichen erscheinen. Auf Wunsch kommen Punkte als Ablenkung dazu.
   Die grösste Scheibe misst genau 12 cm. Die Kopiervorlage (A4, 703 × 1031 Pixel wie im PDF, 1 mm = 703/186 Pixel) zeigt
   die Scheiben in Originalgrösse, mit Abstand zum Rand und untereinander; am Bildschirm lassen sich die Ringe auch drehen.
   Lösungsblatt mit den zusammengesetzten Scheiben. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var PXMM = 703 / 186, DURCHMESSER = 120;   // Pixel pro Millimeter auf dem Blatt; grösste Scheibe 12 cm
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
  var WOERTER = 'HUND KATZE MAUS SONNE BLUME APFEL BAUM HAUS STERN WOLKE REGEN VOGEL PIRAT DRACHE SCHULE FREUND ZAUBER BIRNE TIGER INSEL'.split(' ');
  // Auf dem Kopf (unten auf der Scheibe) sieht 6 wie 9 aus und M wie W – zufällig gewählt kommt nur eines davon
  var GEGENSTUECK = { 6:'9', 9:'6', M:'W', W:'M' };

  // Eingabe → Zeichen: Ziffern und Grossbuchstaben (auch Ä, Ö, Ü); Leerzeichen, Kommas usw. fallen weg, ß wird zu SS
  function zeichen(text){ return String(text || '').replace(/ß/g, 'SS').toUpperCase().replace(/[^0-9A-ZÄÖÜ]/g, '').split(''); }
  // Eingabe → Wort: Buchstaben und Ziffern der Reihe nach; Leerzeichen bleiben als Lücke (' ') zwischen zwei Wörtern
  function wort(text){ return String(text || '').replace(/ß/g, 'SS').toUpperCase().replace(/[^0-9A-ZÄÖÜ ]/g, '').replace(/\s+/g, ' ').trim().split(''); }
  var SAETZE = ['Ich kann das Rätsel lösen.', 'Heute ist ein schöner Tag.', 'Lesen macht Spass.', 'Wir gehen in den Wald.',
    'Der Hund spielt im Garten.', 'Morgen scheint die Sonne.', 'Du bist ein Rätselprofi!', 'Die Katze schläft auf dem Sofa.'];
  function zufallsSatz(rnd, ausser){ var l = SAETZE.filter(function(w){ return w !== ausser; }); return l[Math.floor(rnd() * l.length)]; }
  function zufallsWort(rnd, ausser){ var l = WOERTER.filter(function(w){ return w !== ausser; }); return l[Math.floor(rnd() * l.length)]; }
  // n verschiedene zufällige Ziffern oder Buchstaben; «schon» bleibt vorne erhalten
  function zufallsZeichen(art, n, rnd, schon){
    var aus = (schon || []).slice(0, n);
    mischen((art === 'buchstaben' ? BUCHSTABEN : ZIFFERN).slice(), rnd).forEach(function(c){
      if (aus.length < n && aus.indexOf(c) < 0 && aus.indexOf(GEGENSTUECK[c]) < 0) aus.push(c);
    });
    return aus;
  }
  function gegenstuecke(liste){ return liste.filter(function(c, i){ return GEGENSTUECK[c] && liste.indexOf(GEGENSTUECK[c]) > i; }).map(function(c){ return c + '/' + GEGENSTUECK[c]; }); }

  /* Plan der Scheiben. o: { zeichen:[…] (beim Wort mit ' ' für Lücken), wort (true: Buchstaben nebeneinander als Wort),
     breite(c) → Breite/Höhe des Zeichens (mit Strich), ringe (Anzahl Scheiben mit Zeichen), punkte (true/false), seed }.
     Alle Längen in Pixeln.
     → { R, ga, gb (Zeichen reichen radial von ga bis gb), h, rm, r:[Deckel, Scheibe 1 (innen) … Scheibe n (aussen)],
         winkel (Mitte jedes Zeichens, Grad im Uhrzeigersinn ab oben), papier / schirm (Drehung jeder Scheibe),
         punkte[k]:[{ w, r }], ueber (Überlappung unter der nächstkleineren Scheibe) } */
  /* Satz: waagrechte Zeilen von oben nach unten, um den Deckel in der Mitte herum. breiten: Breite jedes Worts bei
     Schriftgrösse 100 (mit Strich), leer: Breite eines Leerzeichens bei 100. Gesucht wird die grösste Schrift, bei der
     alle Wörter Platz haben (Zeilenhöhe 1.25 × Schrift, Zeilen in der Mitte der Scheibe): Jede Zeile reicht so weit, wie
     der Kreis «aussen» an ihrer engsten Stelle breit ist; wo sie am Deckel («kappe») vorbeiführt, hat sie einen linken
     und einen rechten Teil. → { f, zeilen:[{ y, teile:[{ woerter:[{ i, x }] }] }] } (x: Anfang des Worts; Mitte = 0, 0) */
  function satzSetzen(breiten, leer, aussen, kappe){
    function versuch(f, L, m){
      var zeilen = [], wi = 0, s = leer * f / 100;
      for (var j = 0; j < m; j++){
        var y = (j - (m - 1) / 2) * L, oben = y - L / 2, unten = y + L / 2, weit = Math.max(Math.abs(oben), Math.abs(unten));
        if (weit >= aussen) return null;
        var xr = Math.sqrt(aussen * aussen - weit * weit), nah = oben <= 0 && unten >= 0 ? 0 : Math.min(Math.abs(oben), Math.abs(unten));
        var xk = nah < kappe ? Math.sqrt(kappe * kappe - nah * nah) : 0, zeile = { y:y, teile:[] };
        (xk ? [[-xr, -xk], [xk, xr]] : [[-xr, xr]]).forEach(function(t){
          var platz = t[1] - t[0], w = 0, liste = [];
          while (platz > 0 && wi < breiten.length){
            var x = w + (liste.length ? s : 0), neu = x + breiten[wi] * f / 100;
            if (neu > platz) break;
            liste.push({ i:wi, x:x }); w = neu; wi++;
          }
          if (liste.length){ var x0 = (t[0] + t[1]) / 2 - w / 2; liste.forEach(function(e){ e.x += x0; }); zeile.teile.push({ woerter:liste }); }
        });
        zeilen.push(zeile);
      }
      return wi >= breiten.length ? zeilen : null;
    }
    for (var f = Math.floor(aussen * 0.6); f >= 5; f--){
      var L = f * 1.25, maxZ = Math.floor(2 * aussen / L);
      for (var m = 1; m <= maxZ; m++){ var z = versuch(f, L, m); if (z) return { f:f, zeilen:z }; }
    }
    return null;
  }

  function planen(o){
    var rnd = zufall(o.seed), mm = PXMM, n = o.ringe, z = o.zeichen || [];
    var R = DURCHMESSER / 2 * mm, gb = R - 4 * mm, luecke = 2.5 * mm, ueber = 1.5 * mm, deckelMin = 14.5 * mm;
    // Wie breit (in Grad, halb) ein Zeichen samt halber Lücke am inneren Ende «innen» ist, wenn die Zeichen h hoch sind
    function halbWinkel(c, innen, h){ return Math.atan((o.breite(c) * h / 2 + luecke / 2) / innen) * 180 / Math.PI; }
    var ga, winkel, k, satz = null, r;
    if (o.satz){
      /* Satz: kleiner Deckel (12 mm Radius); die Zeilen bleiben 4 mm vom Rand. Die Ringe teilen den Bereich, den der Text
         wirklich belegt (bis zur äussersten Wortecke), gleichmässig – so trägt auch die grösste Scheibe genug davon. */
      var kap = 12 * mm, aussenText = kap + 6 * mm;
      satz = satzSetzen(o.satz.breiten, o.satz.leer, gb, kap + 2 * mm);
      if (satz) satz.zeilen.forEach(function(z){ z.teile.forEach(function(t){ t.woerter.forEach(function(w){
        var x1 = w.x + o.satz.breiten[w.i] * satz.f / 100, y1 = Math.abs(z.y) + 0.42 * satz.f;
        aussenText = Math.max(aussenText, Math.hypot(Math.max(Math.abs(w.x), Math.abs(x1)), y1));
      }); }); });
      aussenText = Math.min(aussenText, gb);
      r = [kap];
      for (k = 1; k < n; k++) r.push(kap + (aussenText - kap) * k / n);
      r.push(R);
      ga = kap; winkel = [];
    } else if (o.wort){
      /* Wort: Die Buchstaben stehen nebeneinander (innen 2.5 mm Abstand) und lesen sich im Uhrzeigersinn. Zusammen
         nehmen sie höchstens 300° ein – die Lücke zeigt, wo das Wort beginnt. Die Buchstaben sind so gross wie möglich:
         das kleinste ga (Bisektion), bei dem das Wort noch in 300° passt. In der Lösung steht das Wort oben in der Mitte. */
      var umfang = function(g){ var h = gb - g; return z.reduce(function(s, c){ return s + 2 * halbWinkel(c, g, h); }, 0); };
      var lo = deckelMin, hi = gb - 6 * mm;
      if (umfang(lo) <= 300) ga = lo;
      else { for (var i = 0; i < 40; i++){ var mitte = (lo + hi) / 2; if (umfang(mitte) <= 300) hi = mitte; else lo = mitte; } ga = hi; }
      var hw = gb - ga, w = 0;
      winkel = z.map(function(c, j){ var b = halbWinkel(c, ga, hw); if (j) w += b; var x = w; w += b; return x; });
      var mitteW = (winkel[0] + winkel[winkel.length - 1]) / 2;
      winkel = winkel.map(function(x){ return norm(x - mitteW); });
    } else {
      /* Einzelne Zeichen, rundum verteilt (gleichmässig mit ±10 % Spiel). Sie sollen so gross wie möglich sein, dürfen
         sich aber innen (wo es eng wird) nicht berühren: Der kleinste Winkel zwischen zwei Mitten ist 0.8 · 360°/m; am
         inneren Ende ga muss gelten (Breite/2 + Lücke) ≤ ga · tan(halber Winkel), Breite = alpha · (gb − ga). */
      var m = z.length, alpha = Math.max.apply(null, z.map(o.breite));
      var halb = Math.min(80, 180 / m * 0.8) * Math.PI / 180;
      ga = Math.max(deckelMin, (alpha * gb / 2 + luecke) / (Math.tan(halb) + alpha / 2));
      var schritt = 360 / m, start = rnd() * 360;
      winkel = z.map(function(_, j){ return norm(start + j * schritt + (rnd() * 2 - 1) * 0.1 * schritt); });
    }
    var h = gb - ga;
    if (!r){
      r = [ga - ueber];   // der Deckel deckt die Mitte bis kurz vor die Zeichen
      for (k = 1; k < n; k++) r.push(ga + h * k / n);
      r.push(R);
    }
    function versatz(){ return r.slice(1).map(function(){ return Math.round(30 + rnd() * 300); }); }
    var papier = versatz(), schirm = versatz();
    schirm[n - 1] = 0;   // am Bildschirm: die äusserste Scheibe steht still, die anderen sind verdreht
    // Punkte als Ablenkung: zufällig im sichtbaren Ring jeder Scheibe, etwa einer pro 9 × 9 mm
    var punkte = [];
    for (k = 1; k <= n; k++){
      var a0 = r[k - 1] + 1.4 * mm, a1 = r[k] - (k === n ? 2 : 1.4) * mm, liste = [];
      var anzahl = o.punkte && a1 > a0 ? Math.round(Math.PI * (a1 * a1 - a0 * a0) / Math.pow(9 * mm, 2)) : 0;
      for (var j = 0; j < anzahl; j++) liste.push({ w:rnd() * 360, r:Math.sqrt(a0 * a0 + rnd() * (a1 * a1 - a0 * a0)) });
      punkte.push(liste);
    }
    return { mm:mm, R:R, ga:ga, gb:gb, h:h, rm:(ga + gb) / 2, r:r, ringe:n, ueber:ueber, winkel:winkel, zeichen:z.slice(),
      wort:!!o.wort, satz:satz, papier:papier, schirm:schirm, punkte:punkte, ringBreite:o.satz ? ((n > 1 ? r[n - 1] : R) - r[0]) / Math.max(1, n - 1) : h / n };
  }

  /* Kreise auf Seiten verteilen. teile: [{ id, d }] (Durchmesser). Der grösste zuerst; jeder Kreis kommt an die oberste,
     dann linkeste Stelle (Raster von 4 Pixeln), wo er mit «luft» Abstand zu allen anderen Platz hat – so rutschen kleine
     Scheiben in die Ecken neben den grossen. Erst wenn auf keiner Seite Platz ist, beginnt eine neue. Am Schluss stehen
     die Kreise jeder Seite waagrecht und senkrecht in der Mitte.
     → { lage:[{ id, seite, x, y }] (Mittelpunkte), seiten }. hoehen: [Höhe Seite 1, Höhe weitere Seiten]. */
  function packen(teile, breite, hoehen, luft){
    var seiten = [], lage = [], S = 4;
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
    seiten.forEach(function(s, si){   // in die Mitte der Seite
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      s.kreise.forEach(function(c){ x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r); y0 = Math.min(y0, c.y - c.r); y1 = Math.max(y1, c.y + c.r); });
      var dx = (breite - (x1 - x0)) / 2 - x0, dy = Math.max(0, (s.hoehe - (y1 - y0)) / 2) - y0;
      lage.forEach(function(l){ if (l.seite === si){ l.x += dx; l.y += dy; } });
    });
    return { lage:lage, seiten:seiten.length };
  }
  /* Gut zum Ausschneiden: zuerst mit dem kleinsten Abstand «klein» bestimmen, wie viele Seiten es braucht; dann den
     Abstand so weit vergrössern (höchstens «gross»), wie es mit gleich vielen Seiten noch geht. → wie packen, dazu luft */
  function verteilen(teile, breite, hoehen, klein, gross){
    var beste = packen(teile, breite, hoehen, klein), lo = klein, hi = gross;
    beste.luft = klein;
    for (var i = 0; i < 7; i++){
      var m = (lo + hi) / 2, v = packen(teile, breite, hoehen, m);
      if (v.seiten <= beste.seiten){ lo = m; v.luft = m; beste = v; } else hi = m;
    }
    return beste;
  }
  return { PXMM:PXMM, DURCHMESSER:DURCHMESSER, zufall:zufall, mischen:mischen, norm:norm, abstand:abstand, zeichen:zeichen, wort:wort,
    zufallsWort:zufallsWort, zufallsZeichen:zufallsZeichen, gegenstuecke:gegenstuecke, planen:planen, packen:packen, verteilen:verteilen,
    satzSetzen:satzSetzen, zufallsSatz:zufallsSatz, ZIFFERN:ZIFFERN, BUCHSTABEN:BUCHSTABEN, WOERTER:WOERTER };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', GRAU = '#8A8079', PFEIL = '#E46F12';
// «Bunt»: kräftige Farben, die auf weissem Papier gut sichtbar sind
var BUNT = ['#D7263D', '#1B6CA8', '#2E8B57', '#E4801C', '#7B3FA0', '#C2185B', '#00838F', '#9A7400'];
var SEITE_B = 703, SEITE_H = 1031, RAND = 30;   // Seite (Pixel) und Rand ringsum (8 mm; dazu kommen beim Drucken 12 mm)
var LUFT_KLEIN = 6 * Kern.PXMM, LUFT_GROSS = 25 * Kern.PXMM;   // Abstand zwischen den Kreisen: mindestens 6 mm, so viel wie möglich bis 25 mm
var STRICH = 0.05, STRICH_SATZ = 0.03;   // zusätzlicher Strich um die Zeichen (Anteil der Schriftgrösse) – macht sie kräftig wie Filzstift
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
function zeichenSvg(G, c, w, farbe){
  var m = G.metrik[c], s = G.f / 100;
  return '<text transform="rotate(' + f1(w) + ') translate(0 ' + f1(-G.P.rm) + ')" x="' + f1(-(m.r - m.l) / 2 * s) + '" y="' + f1((m.a - m.d) / 2 * s) + '"' +
    (farbe ? ' fill="' + farbe + '" stroke="' + farbe + '"' : '') + '>' + esc(c) + '</text>';
}
// Inhalt der Scheibe k (1 = innerste … n = äusserste), ohne Drehung; id: eindeutiger Name für den Zuschnitt
function ringInhalt(G, k, id){
  var P = G.P, innen = P.r[k - 1] - P.ueber;
  var t = '<defs><clipPath id="' + id + '"><path clip-rule="evenodd" d="' + ringPfad(P.r[k] - 0.4, innen) + '"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')"><g font-size="' + f1(G.f) + '" font-weight="700" fill="' + TINTE + '" stroke="' + TINTE + '" stroke-width="' + f1(G.f * (P.satz ? STRICH_SATZ : STRICH)) + '" stroke-linejoin="round" style="font-family:var(--blatt-buchstaben)">';
  if (P.satz) P.satz.zeilen.forEach(function(z){ z.teile.forEach(function(teil){ teil.woerter.forEach(function(w){
    var farbe = G.farben[w.i];
    t += '<text x="' + f1(w.x) + '" y="' + f1(z.y) + '" dominant-baseline="central"' + (farbe ? ' fill="' + farbe + '" stroke="' + farbe + '"' : '') + '>' + esc(G.woerter[w.i]) + '</text>';
  }); }); });
  else P.zeichen.forEach(function(c, j){ if (c !== ' ') t += zeichenSvg(G, c, P.winkel[j], G.farben[j]); });
  t += '</g></g>';
  var pr = 0.75 * P.mm;
  P.punkte[k - 1].forEach(function(p){ var a = p.w * Math.PI / 180; t += '<circle cx="' + f1(p.r * Math.sin(a)) + '" cy="' + f1(-p.r * Math.cos(a)) + '" r="' + f1(pr) + '" fill="' + TINTE + '"/>'; });
  return t;
}
function loch(P){
  var r = 2 * P.mm, k = 3.5 * P.mm;
  return '<circle r="' + f1(r) + '" fill="none" stroke="' + GRAU + '" stroke-width="0.8"/><path d="M' + f1(-k) + ' 0H' + f1(k) + 'M0 ' + f1(-k) + 'V' + f1(k) + '" stroke="' + GRAU + '" stroke-width="0.6"/>';
}
// Deckel: der kleinste Kreis zuoberst, auf Wunsch mit einem Drehpfeil
function deckel(P, rand, pfeil){
  var r0 = P.r[0], ra = r0 * 0.62, a0 = -100, a1 = 135, L = Math.max(5, ra * 0.34);
  function pt(r, w){ var a = w * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; }
  var s = pt(ra, a0), e = pt(ra, a1), b = a1 * Math.PI / 180, tx = Math.cos(b), ty = Math.sin(b), nx = Math.sin(b), ny = -Math.cos(b);
  var spitze = [e[0] + tx * L, e[1] + ty * L], l = [e[0] + nx * L * 0.62, e[1] + ny * L * 0.62], q = [e[0] - nx * L * 0.62, e[1] - ny * L * 0.62];
  return '<circle r="' + f1(r0) + '" fill="#fff" stroke="' + (rand || TINTE) + '" stroke-width="' + (rand ? 0.8 : 1) + '"/>' + (pfeil === false ? '' :
    '<path d="M' + f1(s[0]) + ' ' + f1(s[1]) + 'A' + f1(ra) + ' ' + f1(ra) + ' 0 1 1 ' + f1(e[0]) + ' ' + f1(e[1]) + '" fill="none" stroke="' + PFEIL + '" stroke-width="' + f1(Math.max(1.6, r0 * 0.05)) + '" stroke-linecap="round"/>' +
    '<path d="M' + f1(spitze[0]) + ' ' + f1(spitze[1]) + 'L' + f1(l[0]) + ' ' + f1(l[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + 'Z" fill="' + PFEIL + '"/>') + loch(P);
}
// Eine Scheibe zum Ausschneiden (Blatt): Schnittlinie, Stück, gestrichelt der Platz der nächstkleineren Scheibe, Mitte
function scheibeBlatt(G, k, id){
  var P = G.P, innen = P.r[k - 1];
  return '<circle r="' + f1(P.r[k]) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1"/>' + ringInhalt(G, k, id) +
    '<circle r="' + f1(innen) + '" fill="none" stroke="' + GRAU + '" stroke-width="0.7" stroke-dasharray="3 3"/>' + loch(P);
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
  t += '<g class="dr-deckel">' + deckel(P, '#9C9089', G.pfeil) + '</g>';
  return '<svg class="dr-stapel" viewBox="' + f1(-R - 3) + ' ' + f1(-R - 3) + ' ' + f1(2 * R + 6) + ' ' + f1(2 * R + 6) + '" role="img" aria-label="Drehscheiben">' + t + '</svg>';
}

var VORLAGE = '<div class="dr">' +
  '<header class="dr-kopf-seite"><p class="augenbraue">Rätselgenerator</p><h1>Drehscheiben</h1>' +
    '<p>Konzentrische Scheiben zum Ausschneiden: Jede Scheibe trägt nur ein Stück der Zahlen, Buchstaben oder des Worts. Wer die Scheiben richtig dreht, sieht die Zeichen.</p></header>' +
  '<div class="dr-layout"><section class="dr-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zeichen</h2><p>Was soll auf den Scheiben erscheinen?</p></div></div>' +
      '<div class="dr-chips" role="radiogroup" aria-label="Art">' + chips('drArt', [['ziffern', 'Zahlen'], ['buchstaben', 'Buchstaben'], ['wort', 'Wort'], ['satz', 'Satz']]) + '</div>' +
      '<label class="feld-label" for="drZeichen" id="drFeldName">Zeichen</label>' +
      '<div class="dr-zeichen-zeile"><input type="text" id="drZeichen" maxlength="40" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="drZufall" title="Andere zufällig wählen">Andere</button></div>' +
      '<div id="drAnzahlTeil"><p class="feld-label">Anzahl</p><div class="dr-chips dr-anzahl" role="radiogroup" aria-label="Anzahl Zeichen">' + chips('drAnzahl', [1, 2, 3, 4, 5, 6, 7, 8].map(function(n){ return [n, n]; })) + '</div>' +
        '<p class="hinweis">Du kannst die Zeichen auch selbst eintippen, z. B. «3 5 8» (höchstens 8). Sie stehen rundum verteilt. Mit «Anzahl» kommen zufällige dazu oder fallen weg.</p></div>' +
      '<p class="hinweis" id="drWortHinweis" hidden>Ein Wort mit bis zu 12 Buchstaben. Die Buchstaben stehen nebeneinander und lesen sich im Uhrzeigersinn.</p>' +
      '<p class="hinweis" id="drSatzHinweis" hidden>Ein Satz mit bis zu 80 Zeichen. Er steht in Zeilen von oben nach unten auf der Scheibe, so gross wie möglich.</p>' +
      '<div class="dr-zaehler" id="drZaehler" aria-live="polite"></div>' +
      '<p class="feld-label">Farben</p><div class="dr-farben" id="drFarben"></div>' +
      '<div class="dr-farb-knoepfe"><button type="button" class="btn klein" id="drSchwarz">Alle schwarz</button><button type="button" class="btn klein" id="drBunt">Bunt</button></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Kreise</h2></div></div>' +
      '<p class="feld-label">Anzahl Kreise (mit Deckel)</p><div class="dr-chips" role="radiogroup" aria-label="Anzahl Kreise mit Deckel">' + chips('drRinge', [[2, '3 · leicht'], [3, '4'], [4, '5'], [5, '6 · schwer']]) + '</div>' +
      '<label class="opt"><input type="checkbox" id="drPfeil"><span>Drehpfeil auf dem Deckel</span></label>' +
      '<label class="opt"><input type="checkbox" id="drPunkte"><span>Punkte als Ablenkung</span></label>' +
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
  kurz:'Scheiben drehen, bis Zahlen, Buchstaben oder ein Wort erscheinen',
  beschreibung:'Konzentrische Scheiben zum Ausschneiden: Jede Scheibe trägt nur ein Stück der Zeichen. Wer sie richtig dreht, sieht die Zahlen, Buchstaben oder das Wort. Auch am Bildschirm drehbar, mit Lösungsblatt.',
  merkmale:['Zahlen, Buchstaben oder ein Wort', 'Grösster Kreis 12 cm', 'Am Bildschirm drehbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/drehscheiben/drehscheiben.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'drehscheiben-eingaben', OPT = 'drehscheiben-einstellungen';
  // ringe: Scheiben mit Zeichen (dazu kommt der Deckel → 3 bis 6 Kreise)
  var STANDARD = { art:'ziffern', anzahl:4, ringe:4, pfeil:true, punkte:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  // farben: je Stelle (Zeichen bzw. Buchstabe im Wort) eine Farbe; leer = schwarz
  // farbenSatz: je Wort des Satzes eine Farbe
  var st = { zeichen:'', wortText:'', satzText:'', farben:[], farbenSatz:[], seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  function farbenLesen(l){ return Array.isArray(l) ? l.map(function(f){ return /^#[0-9a-f]{6}$/i.test(f) ? f : ''; }) : []; }
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.zeichen = String(e.zeichen || ''); st.wortText = String(e.wortText || ''); st.satzText = String(e.satzText || ''); st.seed = +e.seed || st.seed;
    st.farben = farbenLesen(e.farben); st.farbenSatz = farbenLesen(e.farbenSatz); } } catch(x){}
  if ([2, 3, 4, 5].indexOf(+st.opt.ringe) < 0) st.opt.ringe = 4;
  if (['ziffern', 'buchstaben', 'wort', 'satz'].indexOf(st.opt.art) < 0) st.opt.art = 'ziffern';
  if (!Kern.zeichen(st.zeichen).length) st.zeichen = Kern.zufallsZeichen(st.opt.art === 'buchstaben' ? 'buchstaben' : 'ziffern', st.opt.anzahl, Kern.zufall(st.seed + 7)).join(' ');
  if (!Kern.wort(st.wortText).length) st.wortText = Kern.zufallsWort(Kern.zufall(st.seed + 11));
  if (!st.satzText.trim()) st.satzText = Kern.zufallsSatz(Kern.zufall(st.seed + 13));
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ zeichen:st.zeichen, wortText:st.wortText, satzText:st.satzText, farben:st.farben, farbenSatz:st.farbenSatz, seed:st.seed })); } catch(x){}
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
  function istWort(){ return st.opt.art === 'wort'; }
  function istSatz(){ return st.opt.art === 'satz'; }
  function satzWoerter(){ return st.satzText.replace(/\s+/g, ' ').trim().slice(0, 80).split(' ').filter(Boolean); }
  function farbListe(){ return istSatz() ? st.farbenSatz : st.farben; }
  function liste(){ return Kern.zeichen(st.zeichen).slice(0, 8); }
  function feldSetzen(z){ st.zeichen = z.join(' '); $('#drZeichen').value = st.zeichen; speichern(); }
  function wortSetzen(w){ st.wortText = w; $('#drZeichen').value = w; speichern(); }
  function anzahlZeigen(){
    var n = Kern.zeichen(st.zeichen).length;
    [].forEach.call(bereich.querySelectorAll('input[name="drAnzahl"]'), function(r){ r.checked = +r.value === n; });
    if (n >= 1 && n <= 8) st.opt.anzahl = n;
  }
  // Zahlen/Buchstaben: Anzahl zeigen; Wort: eigenes Feld (beide Eingaben bleiben erhalten, wenn man wechselt)
  function artZeigen(){
    var w = istWort(), sa = istSatz(), f = $('#drZeichen');
    $('#drAnzahlTeil').hidden = w || sa; $('#drWortHinweis').hidden = !w; $('#drSatzHinweis').hidden = !sa;
    $('#drFeldName').textContent = w ? 'Wort' : sa ? 'Satz' : 'Zeichen';
    f.maxLength = sa ? 80 : 40; f.classList.toggle('dr-satz-feld', sa);
    f.value = w ? st.wortText : sa ? st.satzText : st.zeichen;
    if (!w && !sa) anzahlZeigen();
  }
  // Wechsel zu Zahlen oder Buchstaben: passende Zeichen von vorher bleiben, sonst kommen zufällige
  radios('drArt', 'art', function(){
    if (!istWort() && !istSatz()){
      var z = Kern.zeichen(st.zeichen), ziffern = st.opt.art === 'ziffern';
      if (!z.length || !z.every(function(c){ return /\d/.test(c) === ziffern; })) feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now())));
    }
    artZeigen();
  });
  radios('drAnzahl', 'anzahl', function(){ feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now()), liste())); });
  radios('drRinge', 'ringe');
  artZeigen();
  $('#drZeichen').addEventListener('input', function(){ if (istWort()) st.wortText = this.value; else if (istSatz()) st.satzText = this.value; else { st.zeichen = this.value; anzahlZeigen(); } speichern(); baldZeichnen(); });
  $('#drZufall').addEventListener('click', function(){
    if (istWort()) wortSetzen(Kern.zufallsWort(Kern.zufall(Date.now()), Kern.wort(st.wortText).join('')));
    else if (istSatz()){ st.satzText = Kern.zufallsSatz(Kern.zufall(Date.now()), st.satzText.trim()); $('#drZeichen').value = st.satzText; speichern(); }
    else { feldSetzen(Kern.zufallsZeichen(st.opt.art, st.opt.anzahl, Kern.zufall(Date.now()))); anzahlZeigen(); }
    zeichnen();
  });
  /* Farben: für jedes Zeichen ein Farbfeld. Neu aufgebaut wird die Reihe nur, wenn sich die Zeichen ändern – sonst
     würde ein offener Farbwähler beim Ziehen zugehen. */
  var farbSchluessel = null;
  // z: die Einheiten mit je einer Farbe – Zeichen (Zahlen, Buchstaben, Wort) oder beim Satz die Wörter
  function farbenZeigen(z){
    var schluessel = st.opt.art + '\u0002' + z.join('\u0001'), fl = farbListe();
    if (schluessel === farbSchluessel) return;
    farbSchluessel = schluessel;
    $('#drFarben').innerHTML = z.map(function(c, i){
      return c === ' ' ? '' : '<label class="dr-farbe" title="Farbe für «' + esc(c) + '»"><input type="color" data-i="' + i + '" value="' + (fl[i] || TINTE) + '" aria-label="Farbe für ' + esc(c) + ' (' + (istSatz() ? 'Wort ' : 'Stelle ') + (i + 1) + ')"><span style="color:' + (fl[i] || TINTE) + '">' + esc(c) + '</span></label>';
    }).join('');
  }
  $('#drFarben').addEventListener('input', function(ev){
    var f = ev.target.closest('input[type=color]'); if (!f) return;
    var i = +f.dataset.i; farbListe()[i] = f.value.toLowerCase() === TINTE.toLowerCase() ? '' : f.value;
    f.nextSibling.style.color = f.value; speichern(); baldZeichnen();
  });
  function farbenSetzen(fn){
    farbSchluessel = null; var n = Math.max(20, farbListe().length), neu = [];
    for (var i = 0; i < n; i++) neu.push(fn(i));
    if (istSatz()) st.farbenSatz = neu; else st.farben = neu;
    speichern(); zeichnen();
  }
  $('#drSchwarz').addEventListener('click', function(){ farbenSetzen(function(){ return ''; }); });
  $('#drBunt').addEventListener('click', function(){
    var z = istSatz() ? satzWoerter() : istWort() ? Kern.wort(st.wortText) : Kern.zeichen(st.zeichen), stelle = [], k = 0;
    z.forEach(function(c, i){ if (c !== ' ') stelle[i] = BUNT[k++ % BUNT.length]; });   // Lücken im Wort überspringen
    farbenSetzen(function(i){ return stelle[i] || ''; });
  });
  [['#drPfeil', 'pfeil'], ['#drPunkte', 'punkte'], ['#drMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#drNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Rätsel ---------- */
  var G = null, spielVersatz = [], zaehlerId = 0;
  // Bezeichnung der versteckten Zeichen: [Einzahl, Mehrzahl]
  function namen(z){
    if (istSatz()) return ['Satz', 'Sätze'];
    if (istWort()) return ['Wort', 'Wörter'];
    var ziffern = z.every(function(c){ return /\d/.test(c); }), buchst = z.every(function(c){ return !/\d/.test(c); });
    return ziffern ? ['Zahl', 'Zahlen'] : buchst ? ['Buchstabe', 'Buchstaben'] : ['Zeichen', 'Zeichen'];
  }
  function anzahlVersteckt(z){ return istSatz() ? 1 : istWort() ? z.join('').split(' ').length : z.length; }
  function frage(z){
    var w = namen(z), eins = anzahlVersteckt(z) === 1;
    if (istSatz()) return 'Wie heisst der Satz?';
    return eins ? (w[0] === 'Buchstabe' ? 'Welcher Buchstabe' : w[0] === 'Zahl' ? 'Welche Zahl' : w[0] === 'Wort' ? 'Welches Wort' : 'Welches Zeichen') + ' erscheint?' : 'Welche ' + w[1] + ' erscheinen?';
  }
  function anleitung(z){
    var w = namen(z), n = anzahlVersteckt(z), anfang = 'Schneide die Kreise aus und stich in der Mitte ein kleines Loch. Lege sie der Grösse nach aufeinander – den grössten zuunterst, den ' +
      (st.opt.pfeil ? 'Deckel mit dem Pfeil' : 'kleinsten Kreis') + ' zuoberst – und stecke eine Musterklammer durch die Mitte. Drehe die Scheiben, bis die Stücke zusammenpassen. ';
    if (istSatz()) return anfang + 'Es ist ein Satz versteckt. Er steht in Zeilen von oben nach unten. ' + frage(z);
    return anfang +
      (n === 1 ? 'Es ist ' + (w[0] === 'Zahl' ? 'eine Zahl' : w[0] === 'Buchstabe' ? 'ein Buchstabe' : w[0] === 'Wort' ? 'ein Wort' : 'ein Zeichen') + ' versteckt' : 'Es sind ' + n + ' ' + w[1] + ' versteckt') +
      ', mit dem Kopf nach aussen' + (istWort() ? '; ' + (n === 1 ? 'es läuft' : 'sie laufen') + ' im Uhrzeigersinn. ' : '. ') + frage(z);
  }
  function titel(){ return 'Drehscheiben'; }
  function zeichnen(){
    if (aus) return;
    if (istSatz()){ satzZeichnen(); return; }
    var o = st.opt, wortArt = istWort(), alle = wortArt ? Kern.wort(st.wortText) : Kern.zeichen(st.zeichen), max = wortArt ? 12 : 8, z = alle.slice(0, max);
    while (z.length && z[z.length - 1] === ' ') z.pop();
    var h = '';
    if (alle.length > max) h += '<p class="warnung">' + (wortArt ? 'Höchstens 12 Buchstaben – es werden die ersten 12 verwendet.' : 'Höchstens 8 Zeichen – es werden die ersten 8 verwendet.') + '</p>';
    var gs = wortArt ? [] : Kern.gegenstuecke(z);
    if (gs.length) h += '<p class="warnung">' + gs.join(', ') + ': Auf dem Kopf sehen sie gleich aus – unten auf der Scheibe kann das verwirren.</p>';
    var nb = z.filter(function(c){ return c !== ' '; }).length;
    $('#drZaehler').innerHTML = z.length ? '<p class="dr-zaehler-haupt ok">' + (wortArt ? 'Wort: <b>' + esc(z.join('')) + '</b> (' + nb + (nb === 1 ? ' Buchstabe' : ' Buchstaben') + ')' : '<b>' + z.length + '</b> Zeichen: ' + z.map(esc).join(' · ')) + '</p>' + h : '';
    if (!z.length){
      G = null; farbenZeigen([]); $('#drInhalt').hidden = true; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = true; });
      meldung('info', wortArt ? '<p>Gib links das Wort ein, das auf den Scheiben erscheinen soll.</p>' : '<p>Gib links die Zahlen oder Buchstaben ein, die auf den Scheiben erscheinen sollen.</p>');
      return;
    }
    $('#drInhalt').hidden = false; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = false; });
    farbenZeigen(z);
    // Masse der Zeichen in der gewählten Schrift; die Schrift ist so gross, dass das höchste Zeichen (mit Strich) genau ins Band ga … gb passt
    var M = {}, hoch = 0;
    z.forEach(function(c){ if (c !== ' ' && !M[c]){ M[c] = metrik(c); hoch = Math.max(hoch, M[c].a + M[c].d); } });
    function breite(c){ return c === ' ' ? 0.35 : ((M[c].l + M[c].r) / 100 + STRICH) / (hoch / 100 + STRICH); }
    var P = Kern.planen({ zeichen:z, wort:wortArt, breite:breite, ringe:o.ringe, punkte:o.punkte, seed:st.seed });
    G = { P:P, metrik:M, f:P.h / (hoch / 100 + STRICH), farben:z.map(function(_, i){ return st.farben[i] || ''; }), pfeil:o.pfeil };
    var mm = P.mm, schmal = P.ringBreite < 4.5 * mm;
    meldung(schmal ? 'warnung' : '', schmal ? '<p>Die Ringe sind nur ' + f1(Math.round(P.ringBreite / mm * 10) / 10) + ' mm breit – das ist schwierig zum Ausschneiden. ' + (wortArt ? 'Ein kürzeres Wort' : 'Weniger Zeichen') + ' oder weniger Kreise helfen.</p>' : '');
    seitenZeichnen(z);
    spielVersatz = P.schirm.slice();
    spielZeichnen();
    loesungZeichnen(z);
  }

  // Satz: Wörter messen, Zeilen setzen (Kern.satzSetzen), dann wie bei den Zeichen weiter
  function satzZeichnen(){
    var o = st.opt, roh = st.satzText.replace(/\s+/g, ' ').trim(), woerter = satzWoerter();
    $('#drZaehler').innerHTML = woerter.length ? '<p class="dr-zaehler-haupt ok">Satz mit <b>' + woerter.length + '</b> ' + (woerter.length === 1 ? 'Wort' : 'Wörtern') + '</p>' +
      (roh.length > 80 ? '<p class="warnung">Höchstens 80 Zeichen – der Rest fällt weg.</p>' : '') : '';
    if (!woerter.length){
      G = null; farbenZeigen([]); $('#drInhalt').hidden = true; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = true; });
      meldung('info', '<p>Gib links den Satz ein, der auf den Scheiben erscheinen soll.</p>');
      return;
    }
    $('#drInhalt').hidden = false; ['#drZeigeLoesung', '#drNeu', '#drPdf', '#drHerunterladen'].forEach(function(s){ $(s).disabled = false; });
    farbenZeigen(woerter);
    messer.font = '700 100px ' + Labor.blattSchrift('buchstaben');
    var leer = messer.measureText(' ').width, breiten = woerter.map(function(w){ return messer.measureText(w).width + STRICH_SATZ * 100; });
    var P = Kern.planen({ satz:{ breiten:breiten, leer:leer }, ringe:o.ringe, punkte:o.punkte, seed:st.seed });
    if (!P.satz){
      G = null; $('#drInhalt').hidden = true;
      meldung('warnung', '<p>Dieser Satz passt nicht auf die Scheibe – ein Wort ist zu lang. Ein kürzerer Satz hilft.</p>');
      return;
    }
    G = { P:P, f:P.satz.f, woerter:woerter, farben:woerter.map(function(_, i){ return st.farbenSatz[i] || ''; }), pfeil:o.pfeil };
    var mm = P.mm, klein = P.satz.f < 4.5 * mm;   // Schriftgrösse 4.5 mm: Grossbuchstaben gut 3 mm hoch
    meldung(klein ? 'warnung' : '', klein ? '<p>Der Satz ist lang – die Schrift wird klein. Ein kürzerer Satz hilft.</p>' : '');
    seitenZeichnen(woerter);
    spielVersatz = P.schirm.slice();
    spielZeichnen();
    loesungZeichnen(woerter);
  }

  /* ---------- Blatt: Scheiben in Originalgrösse auf A4-Seiten ---------- */
  function kopfHtml(z){
    var o = st.opt;
    return (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') + (o.anleitungAn ? '<p class="dr-anleitung">' + esc(anleitung(z)) + '</p>' : '');
  }
  var NOTIZ = '<p class="dr-notiz">In Originalgrösse (100 %) drucken – dann misst der grösste Kreis genau 12 cm.</p>';
  function loesungText(z){
    var w = namen(z), eins = anzahlVersteckt(z) === 1;
    if (istSatz()) return '<p class="dr-antwort dr-antwort-satz">Der Satz: <span class="dr-linie">' + esc(z.join(' ')) + '</span></p>';
    return '<p class="dr-antwort">' + (eins ? (w[0] === 'Wort' ? 'Das Wort' : w[0] === 'Zahl' ? 'Die Zahl' : w[0] === 'Buchstabe' ? 'Der Buchstabe' : 'Das Zeichen') : 'Die ' + w[1]) + ': ' +
      '<span class="dr-linie">' + esc(istWort() ? z.join('') : z.join(' ')) + '</span></p>';
  }
  /* Kopiervorlage: die Kreise in Originalgrösse, 8 mm vom Rand (beim Drucken kommen 12 mm dazu) und mindestens 6 mm
     auseinander – so viel weiter, wie es auf gleich vielen Seiten Platz hat (Kern.verteilen). */
  function seitenZeichnen(z){
    var P = G.P, n = P.ringe, ziel = $('#drSeiten'), nr = ++zaehlerId;
    // Kopf und Druckhinweis messen (Seite 1), dann die Kreise auf die Seiten verteilen
    ziel.innerHTML = '<div class="dr-seite-platz"><article class="dr-blatt dr-seite"><div class="dr-kopf">' + kopfHtml(z) + '</div>' + NOTIZ + '</article></div>';
    var k1 = ziel.querySelector('.dr-kopf'), n1 = ziel.querySelector('.dr-notiz');
    var kopfH = k1.offsetHeight + (k1.offsetHeight ? 14 : 0), notizH = n1.offsetHeight + 10;
    var B = SEITE_B - 2 * RAND, H = SEITE_H - 2 * RAND, H1 = H - kopfH - notizH;
    var teile = [{ id:0, d:2 * P.r[0] }];
    for (var k = 1; k <= n; k++) teile.push({ id:k, d:2 * P.r[k] });
    var pk = Kern.verteilen(teile, B, [H1, H], LUFT_KLEIN, LUFT_GROSS), html = '';
    for (var s = 0; s < pk.seiten; s++){
      var hoehe = s ? H : H1, inhalt = '';
      pk.lage.filter(function(l){ return l.seite === s; }).forEach(function(l){
        var dreh = l.id ? P.papier[l.id - 1] : Math.round(Kern.zufall(st.seed + 3)() * 360);
        inhalt += '<g transform="translate(' + f1(l.x) + ' ' + f1(l.y) + ') rotate(' + dreh + ')">' + (l.id ? scheibeBlatt(G, l.id, 'drb' + nr + '-' + l.id) : deckel(P, null, G.pfeil)) + '</g>';
      });
      html += '<div class="dr-seite-platz"><article class="dr-blatt dr-seite' + (s ? ' neue-seite' : '') + '" aria-label="Seite ' + (s + 1) + '">' +
        (s ? '' : '<div class="dr-kopf">' + kopfHtml(z) + '</div>') +
        '<svg class="dr-flaeche" width="' + B + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + B + ' ' + f1(hoehe) + '" role="img" aria-label="Kreise zum Ausschneiden">' + inhalt + '</svg>' +
        (s ? '' : NOTIZ) + '</article></div>';
    }
    ziel.innerHTML = html;
    $('#drSeitenInfo').textContent = 'Kopiervorlage: ' + (pk.seiten === 1 ? 'eine Seite' : pk.seiten + ' Seiten') + ' mit ' + (n + 1) + ' Kreisen zum Ausschneiden (Originalgrösse).';
    massstab();
  }
  function loesungZeichnen(z){
    var P = G.P, o = st.opt, gr = Math.min(2 * P.R + 6, 600);
    $('#drLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="dr-anleitung"><b>Lösung</b></p>') +
      '<p class="dr-anleitung">So sehen die Scheiben richtig gedreht aus.</p>' +
      '<div class="dr-loesung-bild" style="width:' + f1(gr) + 'px;height:' + f1(gr) + 'px">' + stapelSvg(G, P.r.slice(1).map(function(){ return 0; }), 'drl' + zaehlerId + '-', false) + '</div>' +
      loesungText(z);
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
  Labor.pdfKnopf($('#drPdf'), function(){ return G && { blaetter:blaetter(), name:Labor.pdfName('Drehscheiben', istWort() ? Kern.wort(st.wortText).join('') : '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#drPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#drHerunterladen').hidden = false; });
  }
  $('#drHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !G) return;
    var name = Labor.pdfName('Drehscheiben', '').replace(/\.pdf$/, '.html');
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
