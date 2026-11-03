/* Rätsellabor – gemeinsamer Baustein «Buchstabengitter»
   Ein Feld ist { zeilen, spalten, gitter:[[Buchstabe]], woerter:[{ text, b:[Buchstaben], zellen:[[r,c], …] }] }.
     Gitter.fuellen(feld, woerter, rnd)       → leere Felder mit unauffälligen Buchstaben füllen; liefert Wörter, die doppelt vorkommen
     Gitter.svg(feld, { spiel, linien })      → SVG-Element (Ebenen: Lösung, Markierungen, Auswahl, Linien, Buchstaben)
     Gitter.spiel(svg, feld, { gefunden, treffer(i) }) → Wörter durch Ziehen oder Antippen markieren
   Das Aussehen (Schrift, Farben der Ebenen) steht im Stylesheet des Generators. */
var Gitter = (function(){
  'use strict';
  var S = 10, NS = 'http://www.w3.org/2000/svg';
  var FARBEN = ['#FAD852', '#68D77E', '#63C2EA', '#F7A25D', '#F27A8A', '#C4B5FD', '#5EEAD4', '#D8BC94'];   // aus den Flüssigkeiten im Fabulous-Teaching-Logo
  var RICHTUNGEN = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
  var HAEUFIG = { E:17.4, N:9.8, I:7.6, S:7.3, R:7, A:6.5, T:6.2, D:5.1, H:4.8, U:4.4, L:3.4, C:3.1, G:3, M:2.5, O:2.5, B:1.9, W:1.9,
    F:1.7, K:1.2, Z:1.1, P:0.8, V:0.7, J:0.3, Y:0.1, X:0.1, Q:0.05, 'Ä':0.6, 'Ö':0.3, 'Ü':0.7 };

  function schluessel(z){ return z.map(function(rc){ return rc[0] + ',' + rc[1]; }).sort().join(';'); }
  /* Alle Stellen, an denen ein Wort im Gitter steht (in allen 8 Richtungen) */
  function vorkommen(f, b){
    var res = [], g = f.gitter;
    for (var r = 0; r < f.zeilen; r++) for (var c = 0; c < f.spalten; c++){
      if (g[r][c] !== b[0]) continue;
      for (var d = 0; d < 8; d++){
        var dr = RICHTUNGEN[d][0], dc = RICHTUNGEN[d][1], er = r + dr * (b.length - 1), ec = c + dc * (b.length - 1);
        if (er < 0 || er >= f.zeilen || ec < 0 || ec >= f.spalten) continue;
        var ok = true;
        for (var q = 1; q < b.length && ok; q++) if (g[r + dr * q][c + dc * q] !== b[q]) ok = false;
        if (ok){ var z = []; for (q = 0; q < b.length; q++) z.push([r + dr * q, c + dc * q]); res.push(z); }
      }
    }
    return res;
  }

  /* Leere Felder füllen: Mischung aus deutscher Buchstabenhäufigkeit und den Buchstaben der Wörter.
     Danach zufällig entstandene zweite Vorkommen eines Wortes auflösen. */
  function fuellen(f, woerter, rnd){
    rnd = rnd || Math.random;
    var zaehl = {}, total = 0, gew = {}, buchst = [], summe = 0, umlaute = false, sq = 0;
    woerter.forEach(function(w){ w.b.forEach(function(ch){ zaehl[ch] = (zaehl[ch] || 0) + 1; total++; if ('ÄÖÜ'.indexOf(ch) >= 0) umlaute = true; }); });
    Object.keys(HAEUFIG).forEach(function(ch){ if ('ÄÖÜ'.indexOf(ch) < 0 || umlaute) sq += Math.sqrt(HAEUFIG[ch]); });
    Object.keys(HAEUFIG).forEach(function(ch){ if ('ÄÖÜ'.indexOf(ch) < 0 || umlaute) gew[ch] = 0.65 * Math.sqrt(HAEUFIG[ch]) / sq; });
    Object.keys(zaehl).forEach(function(ch){ gew[ch] = (gew[ch] || 0) + 0.35 * zaehl[ch] / total; });
    Object.keys(gew).forEach(function(ch){ buchst.push(ch); summe += gew[ch]; });
    function zufall(){ var x = rnd() * summe; for (var i = 0; i < buchst.length; i++){ x -= gew[buchst[i]]; if (x <= 0) return buchst[i]; } return buchst[buchst.length - 1]; }
    var belegt = f.gitter.map(function(z){ return z.map(function(ch){ return !!ch; }); });
    f.gitter.forEach(function(z, r){ z.forEach(function(ch, c){ if (!ch) z[c] = zufall(); }); });
    var eigen = {}; f.woerter.forEach(function(w){ eigen[schluessel(w.zellen)] = true; });
    for (var runde = 0; runde < 400; runde++){
      var geaendert = false;
      f.woerter.forEach(function(w){
        vorkommen(f, w.b).forEach(function(z){
          if (eigen[schluessel(z)]) return;
          var frei = z.filter(function(rc){ return !belegt[rc[0]][rc[1]]; });
          if (!frei.length) return;
          var rc = frei[Math.floor(rnd() * frei.length)], alt = f.gitter[rc[0]][rc[1]];
          for (var t = 0; t < 10 && f.gitter[rc[0]][rc[1]] === alt; t++) f.gitter[rc[0]][rc[1]] = zufall();
          geaendert = true;
        });
      });
      if (!geaendert) break;
    }
    return f.woerter.filter(function(w){ return vorkommen(f, w.b).some(function(z){ return !eigen[schluessel(z)]; }); }).map(function(w){ return w.text; });
  }

  function el(tag, a, eltern){ var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (eltern) eltern.appendChild(e); return e; }
  function mitte(rc){ return [rc[1] * S + S / 2, rc[0] * S + S / 2]; }
  function kapsel(g, zellen, farbe, klasse){
    var a = mitte(zellen[0]), b = mitte(zellen[zellen.length - 1]);
    return el('line', { x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:farbe, 'stroke-width':S * 0.78, 'stroke-linecap':'round', 'class':'kapsel' + (klasse ? ' ' + klasse : '') }, g);
  }
  function svg(f, o){
    o = o || {};
    var w = f.spalten * S, h = f.zeilen * S;
    var s = el('svg', { viewBox:'0 0 ' + w + ' ' + h, 'class':'gitter', role:'img', style:'--spalten:' + f.spalten,
      'aria-label':'Buchstabenfeld mit ' + f.spalten + ' Spalten und ' + f.zeilen + ' Zeilen' });
    el('rect', { x:0, y:0, width:w, height:h, fill:'#fff' }, s);
    var gL = el('g', { 'class':'ebene-loesung' }, s);
    f.woerter.forEach(function(wort, i){ kapsel(gL, wort.zellen, FARBEN[i % FARBEN.length]); });
    if (o.spiel){ el('g', { 'class':'ebene-markiert' }, s); el('g', { 'class':'ebene-auswahl' }, s); }
    if (o.linien){
      var d = '';
      for (var c = 1; c < f.spalten; c++) d += 'M' + c * S + ' 0V' + h;
      for (var r = 1; r < f.zeilen; r++) d += 'M0 ' + r * S + 'H' + w;
      el('path', { d:d, 'class':'linien', stroke:'#E9E2DB', 'stroke-width':0.35, fill:'none' }, s);
    }
    el('rect', { x:0.4, y:0.4, width:w - 0.8, height:h - 0.8, 'class':'rahmen', fill:'none', stroke:'#3D3530', 'stroke-width':0.7, rx:1.2 }, s);
    var gT = el('g', { 'class':'ebene-text' }, s);
    f.gitter.forEach(function(zeile, r){ zeile.forEach(function(ch, c){ el('text', { x:c * S + S / 2, y:r * S + S / 2 + 0.3 }, gT).textContent = ch; }); });
    return s;
  }
  /* In welche Richtungen die Wörter laufen (für die Anleitung) */
  function richtungen(f){
    var schraeg = false, rueck = false;
    f.woerter.forEach(function(w){
      var a = w.zellen[0], b = w.zellen[w.zellen.length - 1];
      var dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
      if (dr && dc) schraeg = true;
      if (dc < 0 || (!dc && dr < 0)) rueck = true;   // von rechts nach links oder von unten nach oben
    });
    return { schraeg:schraeg, rueck:rueck };
  }

  /* Markieren: vom ersten bis zum letzten Buchstaben ziehen oder beide antippen */
  function spiel(s, f, o){
    var gA = s.querySelector('.ebene-auswahl'), gM = s.querySelector('.ebene-markiert'), zieh = null, temp = null, punkt = null, start = null, n = 0;
    Object.keys(o.gefunden).forEach(function(i){ if (o.gefunden[i]) kapsel(gM, f.woerter[i].zellen, FARBEN[n++ % FARBEN.length]); });
    function zelle(e){
      var pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(s.getScreenCTM().inverse());
      return [Math.max(0, Math.min(f.zeilen - 1, Math.floor(p.y / S))), Math.max(0, Math.min(f.spalten - 1, Math.floor(p.x / S)))];
    }
    function linie(a, b){
      var dr = b[0] - a[0], dc = b[1] - a[1];
      if (!dr && !dc) return [a];
      var okt = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)), ur = Math.round(Math.sin(okt * Math.PI / 4)), uc = Math.round(Math.cos(okt * Math.PI / 4));
      var len = !ur ? Math.abs(dc) : !uc ? Math.abs(dr) : Math.round((Math.abs(dr) + Math.abs(dc)) / 2), z = [];
      for (var i = 0; i <= len; i++){
        var r = a[0] + ur * i, c = a[1] + uc * i;
        if (r < 0 || c < 0 || r >= f.zeilen || c >= f.spalten) break;
        z.push([r, c]);
      }
      return z;
    }
    function zeigeTemp(z){ if (temp) temp.remove(); temp = kapsel(gA, z, o.auswahlFarbe || '#F28C38', 'auswahl'); }
    function startPunkt(rc){
      if (punkt){ punkt.remove(); punkt = null; }
      if (rc){ var m = mitte(rc); punkt = el('circle', { cx:m[0], cy:m[1], r:S * 0.42, 'class':'startpunkt' }, gA); }
    }
    function sk(rc){ return rc[0] + ',' + rc[1]; }
    function pruefe(z){
      if (z.length < 2) return false;
      var k1 = z.map(sk).join(';'), k2 = z.slice().reverse().map(sk).join(';');
      for (var i = 0; i < f.woerter.length; i++){
        var wk = f.woerter[i].zellen.map(sk).join(';');
        if (wk === k1 || wk === k2){
          if (!o.gefunden[i]){ o.gefunden[i] = true; kapsel(gM, f.woerter[i].zellen, FARBEN[n++ % FARBEN.length]); o.treffer(i); }
          return true;
        }
      }
      return false;
    }
    function abschliessen(z){
      if (!pruefe(z) && z.length > 1 && temp){ var t = temp; temp = null; t.classList.add('falsch'); setTimeout(function(){ t.remove(); }, 500); }
      else if (temp){ temp.remove(); temp = null; }
    }
    s.addEventListener('pointerdown', function(e){
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      try { s.setPointerCapture(e.pointerId); } catch(x){}
      zieh = { a:zelle(e), bewegt:false };
    });
    s.addEventListener('pointermove', function(e){
      if (!zieh) return;
      var b = zelle(e);
      if (b[0] !== zieh.a[0] || b[1] !== zieh.a[1]) zieh.bewegt = true;
      if (zieh.bewegt){ startPunkt(null); zeigeTemp(linie(zieh.a, b)); }
    });
    s.addEventListener('pointerup', function(e){
      if (!zieh) return;
      var a = zieh.a, b = zelle(e), bewegt = zieh.bewegt; zieh = null;
      if (bewegt && (a[0] !== b[0] || a[1] !== b[1])){ start = null; abschliessen(linie(a, b)); return; }
      if (temp){ temp.remove(); temp = null; }
      if (start && (start[0] !== b[0] || start[1] !== b[1])){ var z = linie(start, b); start = null; startPunkt(null); zeigeTemp(z); abschliessen(z); }
      else if (start){ start = null; startPunkt(null); }
      else { start = b; startPunkt(b); }
    });
    s.addEventListener('pointercancel', function(){ zieh = null; if (temp){ temp.remove(); temp = null; } });
  }

  return { FARBEN:FARBEN, RICHTUNGEN:RICHTUNGEN, vorkommen:vorkommen, fuellen:fuellen, svg:svg, spiel:spiel, richtungen:richtungen };
})();
