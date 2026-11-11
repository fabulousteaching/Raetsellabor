/* Rätsellabor – Generator «Regenbogenrätsel»
   Unter einem Regenbogen liegen Gruppen von Formen (Sterne, Kreise, Dreiecke …) in den Farben des Regenbogens. Wer in jeder
   Gruppe die Formen einer Art in der Reihenfolge der Regenbogenfarben verbindet (von aussen nach innen), zeichnet ein
   Zeichen – Ziffern, Gross- und Kleinbuchstaben. Ein Zeichen kann aus mehreren Strichen bestehen (T, H, i …): Jeder Strich
   hat seine eigene Form; über der Gruppe ist abgebildet, welche Formen dazugehören. Dazwischen liegen Ablenkformen (andere
   Formen in Regenbogenfarben), damit man das Zeichen nicht schon ohne Linien erkennt. Der Regenbogen hat mindestens so
   viele Farben, wie der Strich mit den meisten Punkten braucht – mit mehr Farben bekommen die Striche zusätzliche Punkte
   auf ihren Linien. Arbeitsblatt, Lösungsblatt, PDF. */
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
  /* Zeichen als Striche im Feld x 0…2, y nach unten: Oberlänge und Grossbuchstaben ab 0, Kleinbuchstaben ab 1.6, Grundlinie
     4, Unterlängen bis 5.4. Jeder Strich ist ein Linienzug und bekommt seine eigene Form; ein Strich aus einem einzigen
     Punkt ist ein Punkt (i, j). Die Linien dürfen sich kreuzen (8, X), aber kein Punkt liegt auf einer fremden Linie –
     wo Striche zusammenstossen (T, H, E …), endet der eine kurz vor dem anderen. 0, 6 und 9 bleiben oben einen Spalt offen. */
  var ZEICHEN = {
    0:[[[0.7, 0], [0, 1], [0, 3], [1, 4], [2, 3], [2, 1], [1.3, 0]]],
    1:[[[0, 1.1], [1.2, 0], [1.2, 4]]],
    2:[[[0, 1], [1, 0], [2, 1], [1, 2.4], [0, 4], [2, 4]]],
    3:[[[0, 0], [2, 0], [0.8, 1.7], [2, 2.7], [1.3, 4], [0, 4]]],
    4:[[[1.4, 4], [1.4, 0], [0, 2.7], [2, 2.7]]],
    5:[[[2, 0], [0.2, 0], [0, 1.9], [1.7, 1.9], [2, 3.1], [1.2, 4], [0, 3.7]]],
    6:[[[0, 3], [1, 4], [2, 3], [1, 2], [0, 2.4], [0.4, 0]]],
    7:[[[0, 0], [2, 0], [0.8, 4]]],
    8:[[[0.85, 0], [0, 1], [2, 3], [1, 4], [0, 3], [2, 1], [1.45, 0.15]]],
    9:[[[2, 1], [1, 0], [0, 1], [1, 2], [2, 1.6], [1.6, 4]]],
    A:[[[0, 4], [1, 0], [2, 4]], [[0.6, 2.6], [1.4, 2.6]]],
    B:[[[0, 0], [0, 4]], [[0.35, 0], [1.4, 0], [1.9, 0.9], [1.1, 2], [2, 3], [1.4, 4], [0.35, 4]]],
    C:[[[1.9, 0.5], [1, 0], [0.1, 0.7], [0, 2], [0.1, 3.3], [1, 4], [1.9, 3.5]]],
    D:[[[0, 0], [0, 4]], [[0.35, 0], [1.1, 0], [2, 1], [2, 3], [1.1, 4], [0.35, 4]]],
    E:[[[2, 0], [0, 0], [0, 4], [2, 4]], [[0.35, 2], [1.6, 2]]],
    F:[[[2, 0], [0, 0], [0, 4]], [[0.35, 2], [1.5, 2]]],
    G:[[[1.9, 0.5], [0.8, 0], [0, 1.4], [0.4, 3.6], [1.4, 4], [2, 2.4], [1.1, 2.4]]],
    H:[[[0, 0], [0, 4]], [[2, 0], [2, 4]], [[0.35, 2], [1.65, 2]]],
    I:[[[1, 0], [1, 4]]],
    J:[[[2, 0], [2, 3.1], [1.4, 4], [0.6, 4], [0, 3.2]]],
    K:[[[0, 0], [0, 4]], [[1.9, 0], [0.4, 2], [1.9, 4]]],
    L:[[[0, 0], [0, 4], [2, 4]]],
    M:[[[0, 4], [0, 0], [1, 2.2], [2, 0], [2, 4]]],
    N:[[[0, 4], [0, 0], [2, 4], [2, 0]]],
    O:[[[0.7, 0], [0, 1], [0, 3], [1, 4], [2, 3], [2, 1], [1.3, 0]]],
    P:[[[0, 0], [0, 4]], [[0.35, 0], [1.3, 0], [2, 0.7], [2, 1.5], [1.3, 2.2], [0.35, 2.2]]],
    Q:[[[0.7, 0], [0, 1], [0, 3], [1, 4], [2, 3], [2, 1], [1.3, 0]], [[1.25, 3], [2.1, 4.1]]],
    R:[[[0, 0], [0, 4]], [[0.35, 0], [1.3, 0], [2, 0.7], [2, 1.5], [1.3, 2.2], [0.35, 2.2], [2, 4]]],
    S:[[[1.9, 0.4], [1, 0], [0.1, 0.8], [1, 2], [1.9, 3.2], [1, 4], [0.1, 3.6]]],
    T:[[[0, 0], [2, 0]], [[1, 0.35], [1, 4]]],
    U:[[[0, 0], [0, 3], [0.6, 4], [1.4, 4], [2, 3], [2, 0]]],
    V:[[[0, 0], [1, 4], [2, 0]]],
    W:[[[0, 0], [0.5, 4], [1, 1.4], [1.5, 4], [2, 0]]],
    X:[[[0, 0], [2, 4]], [[2, 0], [0, 4]]],
    Y:[[[0, 0], [1, 2], [1, 4]], [[2, 0], [1.2, 1.6]]],
    Z:[[[0, 0], [2, 0], [0, 4], [2, 4]]],
    a:[[[2, 1.6], [2, 4]], [[1.65, 2], [1, 1.6], [0.3, 1.9], [0, 2.8], [0.3, 3.7], [1, 4], [1.65, 3.6]]],
    b:[[[0, 0], [0, 4]], [[0.35, 2], [1, 1.6], [1.7, 1.9], [2, 2.8], [1.7, 3.7], [1, 4], [0.35, 3.6]]],
    c:[[[1.9, 2], [1.1, 1.6], [0.3, 1.9], [0, 2.8], [0.3, 3.7], [1.1, 4], [1.9, 3.6]]],
    d:[[[2, 0], [2, 4]], [[1.65, 2], [1, 1.6], [0.3, 1.9], [0, 2.8], [0.3, 3.7], [1, 4], [1.65, 3.6]]],
    e:[[[0.45, 2.8], [1.9, 2.8], [1.3, 1.6], [0.3, 1.9], [0, 3.1], [0.8, 4], [1.8, 3.7]]],
    f:[[[1.8, 0.3], [1.2, 0], [0.7, 0.5], [0.7, 4]], [[0.1, 1.6], [1.5, 1.6]]],
    g:[[[2, 1.6], [2, 4.7], [1.4, 5.4], [0.5, 5.3]], [[1.65, 2], [1, 1.6], [0.3, 1.9], [0, 2.6], [0.3, 3.4], [1, 3.7], [1.65, 3.4]]],
    h:[[[0, 0], [0, 4]], [[0.35, 2.1], [1, 1.6], [1.7, 1.8], [2, 2.5], [2, 4]]],
    i:[[[1, 1.6], [1, 4]], [[1, 0.6]]],
    j:[[[1.4, 1.6], [1.4, 4.8], [0.9, 5.4], [0.2, 5.2]], [[1.4, 0.6]]],
    k:[[[0, 0], [0, 4]], [[1.7, 1.6], [0.4, 2.8], [1.8, 4]]],
    l:[[[0.8, 0], [0.8, 3.5], [1.3, 4], [1.8, 3.9]]],
    m:[[[0, 1.6], [0, 4]], [[0.3, 2.1], [0.6, 1.6], [1, 2], [1, 4]], [[1.3, 2.1], [1.6, 1.6], [2, 2], [2, 4]]],
    n:[[[0, 1.6], [0, 4]], [[0.35, 2.1], [1, 1.6], [1.7, 1.8], [2, 2.5], [2, 4]]],
    o:[[[0.7, 1.6], [0, 2.3], [0.2, 3.6], [1, 4], [1.8, 3.6], [2, 2.3], [1.3, 1.6]]],
    p:[[[0, 1.6], [0, 5.4]], [[0.35, 2], [1, 1.6], [1.7, 1.9], [2, 2.8], [1.7, 3.7], [1, 4], [0.35, 3.6]]],
    q:[[[2, 1.6], [2, 5.4]], [[1.65, 2], [1, 1.6], [0.3, 1.9], [0, 2.8], [0.3, 3.7], [1, 4], [1.65, 3.6]]],
    r:[[[0, 1.6], [0, 4]], [[0.35, 2.2], [0.9, 1.6], [1.7, 1.7]]],
    s:[[[1.8, 1.9], [1, 1.6], [0.2, 2], [1, 2.8], [1.8, 3.5], [1, 4], [0.1, 3.7]]],
    t:[[[0.8, 0.6], [0.8, 3.5], [1.3, 4], [1.8, 3.9]], [[0.1, 1.6], [1.6, 1.6]]],
    u:[[[0, 1.6], [0, 3.4], [0.6, 4], [1.4, 4], [1.65, 3.6]], [[2, 1.6], [2, 4]]],
    v:[[[0, 1.6], [1, 4], [2, 1.6]]],
    w:[[[0, 1.6], [0.5, 4], [1, 2.4], [1.5, 4], [2, 1.6]]],
    x:[[[0, 1.6], [2, 4]], [[2, 1.6], [0, 4]]],
    y:[[[0, 1.6], [0.95, 3.8]], [[2, 1.6], [0.6, 5.4]]],
    z:[[[0, 1.6], [2, 1.6], [0, 4], [2, 4]]]
  };
  var MAX_FARBEN = 10;
  // Farben je Anzahl (von aussen nach innen); immer gut zu unterscheiden, wie ein Regenbogen
  var FARBE = { rosa:'#F06292', rot:'#E53935', orange:'#F57C00', gelb:'#FDD835', hellgruen:'#8BC34A', gruen:'#2E9E5B', tuerkis:'#1FB5AD',
    hellblau:'#64B5F6', blau:'#3F51B5', dunkelblau:'#283593', violett:'#7B3FA0' };
  var FARBNAME = { rosa:'rosa', rot:'rot', orange:'orange', gelb:'gelb', hellgruen:'hellgrün', gruen:'grün', tuerkis:'türkis', hellblau:'hellblau',
    blau:'blau', dunkelblau:'dunkelblau', violett:'violett' };
  var REIHEN = {
    3:['rot', 'gelb', 'blau'],
    4:['rot', 'gelb', 'gruen', 'blau'],
    5:['rot', 'orange', 'gelb', 'gruen', 'blau'],
    6:['rot', 'orange', 'gelb', 'gruen', 'hellblau', 'violett'],
    7:['rot', 'orange', 'gelb', 'gruen', 'hellblau', 'blau', 'violett'],
    8:['rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'hellblau', 'blau', 'violett'],
    9:['rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'tuerkis', 'hellblau', 'blau', 'violett'],
    10:['rosa', 'rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'tuerkis', 'hellblau', 'blau', 'violett']
  };
  var FORMEN = ['stern', 'kreis', 'dreieck', 'quadrat', 'herz', 'raute', 'sechseck', 'blume'];
  // Formen, die sich klein leicht verwechseln lassen – nie zusammen in einer Gruppe (weder als Striche noch als Ablenker)
  var AEHNLICH = { quadrat:'raute', raute:'quadrat', kreis:'sechseck', sechseck:'kreis' };
  function vertraeglich(f, liste){ return liste.indexOf(f) < 0 && liste.indexOf(AEHNLICH[f]) < 0; }
  // Eingabe → Zeichen, die es gibt (Ziffern, A–Z, a–z), höchstens 6; unbekannt: die übrigen (ohne Leerzeichen)
  function zeichen(text){ return Array.from(String(text || '')).filter(function(c){ return ZEICHEN[c]; }).slice(0, 6); }
  function unbekannt(text){ return Array.from(String(text || '')).filter(function(c){ return !ZEICHEN[c] && /\S/.test(c); }).filter(function(c, i, l){ return l.indexOf(c) === i; }); }
  // so viele Farben braucht es mindestens (der Strich mit den meisten Punkten)
  function mindestens(z){ var m = 3; z.forEach(function(c){ ZEICHEN[c].forEach(function(s){ m = Math.max(m, s.length); }); }); return m; }
  function laenge(s){ var l = 0; for (var i = 0; i + 1 < s.length; i++) l += Math.hypot(s[i + 1][0] - s[i][0], s[i + 1][1] - s[i][1]); return l; }
  function zuStrecke(p, a, b){ var dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  /* Linienzug auf n Punkte bringen: Die zusätzlichen Punkte werden nach der Länge der Strecken verteilt und liegen
     gleichmässig darauf (die Eckpunkte bleiben – die Form bleibt gleich). Kommt ein neuer Punkt einem anderen Punkt oder
     einer fremden Linie zu nahe (auch der anderen Striche: fremd = { punkte, strecken }), rutscht er auf seiner Strecke weiter. */
  function auffuellen(punkte, n, fremd){
    var extra = n - punkte.length, laengen = [], summe = 0, i, j;
    fremd = fremd || { punkte:[], strecken:[] };
    if (extra <= 0 || punkte.length < 2) return punkte.map(function(q){ return q.slice(); });
    for (i = 0; i + 1 < punkte.length; i++){ var l = Math.hypot(punkte[i + 1][0] - punkte[i][0], punkte[i + 1][1] - punkte[i][1]); laengen.push(l); summe += l; }
    var anz = laengen.map(function(l){ return Math.floor(extra * l / summe); }), rest = extra - anz.reduce(function(a, b){ return a + b; }, 0);
    laengen.map(function(l, k){ return [extra * l / summe - anz[k], k]; }).sort(function(a, b){ return b[0] - a[0]; }).slice(0, rest).forEach(function(x){ anz[x[1]]++; });
    var aus = [], neu = [];
    for (i = 0; i < laengen.length; i++){
      aus.push(punkte[i].slice());
      for (j = 1; j <= anz[i]; j++){ neu.push({ k:i, t:j / (anz[i] + 1), platz:aus.length }); aus.push(null); }
    }
    aus.push(punkte[punkte.length - 1].slice());
    function lage(k, t){ var a = punkte[k], b = punkte[k + 1]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    neu.forEach(function(x){ aus[x.platz] = lage(x.k, x.t); });
    function naechster(idx, p, k0){
      var m = Infinity;
      aus.forEach(function(q, k){ if (k !== idx && q) m = Math.min(m, Math.hypot(q[0] - p[0], q[1] - p[1])); });
      fremd.punkte.forEach(function(q){ m = Math.min(m, Math.hypot(q[0] - p[0], q[1] - p[1])); });
      for (var k = 0; k + 1 < punkte.length; k++) if (k !== k0) m = Math.min(m, zuStrecke(p, punkte[k], punkte[k + 1]) * 1.4);
      fremd.strecken.forEach(function(s){ m = Math.min(m, zuStrecke(p, s[0], s[1]) * 1.4); });
      return m;
    }
    neu.forEach(function(x){
      var p = aus[x.platz], best = p, weit = naechster(x.platz, p, x.k), schritt = 0.5 / (anz[x.k] + 1);
      if (weit >= 0.45) return;
      [-0.6, 0.6, -0.35, 0.35, -0.85, 0.85].forEach(function(d){
        var t = x.t + d * schritt;
        if (t <= 0.08 || t >= 0.92) return;
        var q = lage(x.k, t), w = naechster(x.platz, q, x.k);
        if (w > weit){ weit = w; best = q; }
      });
      aus[x.platz] = best;
    });
    return aus;
  }
  /* Punkte je Strich bei n Farben: Der längste Strich des ganzen Texts (Länge lmax) bekommt alle n Farben, die anderen so
     viele, wie ihrer Länge entspricht (mindestens ihre Eckpunkte) – kurze Striche (i, l, t) brauchen dann nur die ersten
     Farben und werden nicht überfüllt. Ein Punkt (i, j) bleibt ein Punkt. */
  function verteilen(striche, n, lmax){
    return striche.map(function(s){ return s.length < 2 ? 1 : Math.max(s.length, Math.min(n, Math.round(n * laenge(s) / lmax))); });
  }
  function laengster(z){ var m = 0; z.forEach(function(c){ ZEICHEN[c].forEach(function(s){ m = Math.max(m, laenge(s)); }); }); return m || 1; }
  // Höhe des Felds für diese Zeichen: von der höchsten Oberkante bis zur tiefsten Unterkante (alle Gruppen gleich)
  function hoehe(z){
    var o = Infinity, u = -Infinity;
    z.forEach(function(c){ ZEICHEN[c].forEach(function(s){ s.forEach(function(q){ o = Math.min(o, q[1]); u = Math.max(u, q[1]); }); }); });
    return { oben:Math.min(o, 1.6), unten:Math.max(u, 4) };
  }
  /* Plan: o: { zeichen:[…], farben (Anzahl), seed } → { farben:[Name …], oben, unten,
       gruppen:[{ zeichen, striche:[{ form, punkte:[[x, y, farbe] …] }], ablenker:[{ x, y, form, farbe }] }] }
     Punkte leicht verwackelt (±0.08); Reihenfolge der Punkte = Farbreihenfolge. Ablenker: Formen in Regenbogenfarben, die
     zu keinem Strich der Gruppe gehören (so verrät die Punktwolke das Zeichen nicht) – nie zu nahe an Punkten oder Linien. */
  function planen(o){
    var rnd = zufall(o.seed), n = Math.max(mindestens(o.zeichen), Math.min(MAX_FARBEN, o.farben || 0)), farben = REIHEN[n], H = hoehe(o.zeichen);
    var formen = mischen(FORMEN.slice(), rnd), naechste = 0, lmax = laengster(o.zeichen);
    function wackeln(){ return (rnd() - 0.5) * 0.16; }
    var gruppen = o.zeichen.map(function(c){
      var roh = ZEICHEN[c], anz = verteilen(roh, n, lmax), striche = [], fertig = [], eigene = [];
      // Formen der Striche: der Reihe nach aus der gemischten Liste, ähnliche überspringen
      roh.forEach(function(){ for (var k = 0; k < formen.length; k++){ var f = formen[(naechste + k) % formen.length]; if (vertraeglich(f, eigene)){ eigene.push(f); naechste = (naechste + k + 1) % formen.length; return; } } });
      roh.forEach(function(s, i){
        // fremd: die anderen Striche – schon aufgefüllte mit allen Punkten, spätere mit ihren Eckpunkten
        var fremd = { punkte:[], strecken:[] };
        roh.forEach(function(t, k){ if (k === i) return; var u = fertig[k] || t; u.forEach(function(q){ fremd.punkte.push(q); }); for (var m = 0; m + 1 < u.length; m++) fremd.strecken.push([u[m], u[m + 1]]); });
        var p = auffuellen(s, anz[i], fremd);
        fertig[i] = p;
        striche.push({ form:eigene[i], punkte:p.map(function(q, k){ return [q[0] + wackeln(), q[1] + wackeln(), farben[k]]; }) });
      });
      var fremdeFormen = FORMEN.filter(function(f){ return vertraeglich(f, eigene); });
      // Ablenker: «bester Kandidat» – jeder neue dort, wo er am weitesten von Punkten, Linien und anderen Ablenkern weg ist
      var alle = [], strecken = [], ablenker = [];
      striche.forEach(function(s){ s.punkte.forEach(function(q, k){ alle.push(q); if (k) strecken.push([s.punkte[k - 1], q]); }); });
      var ziel = Math.min(9, Math.round(alle.length * 0.8));
      for (var a = 0; a < ziel; a++){
        var best = null, bestW = -1;
        for (var v = 0; v < 60; v++){
          var p = [-0.1 + rnd() * 2.2, H.oben - 0.1 + rnd() * (H.unten - H.oben + 0.2)], w = Infinity;
          alle.concat(ablenker).forEach(function(q){ w = Math.min(w, Math.hypot(q[0] - p[0], q[1] - p[1])); });
          var wl = Infinity; strecken.forEach(function(s){ wl = Math.min(wl, zuStrecke(p, s[0], s[1])); });
          if (wl < 0.4) continue;
          if (w > bestW){ bestW = w; best = p; }
        }
        if (!best || bestW < 0.62) break;
        ablenker.push([best[0], best[1], fremdeFormen[Math.floor(rnd() * fremdeFormen.length)], farben[Math.floor(rnd() * n)]]);
      }
      return { zeichen:c, striche:striche, ablenker:ablenker.map(function(q){ return { x:q[0], y:q[1], form:q[2], farbe:q[3] }; }) };
    });
    return { farben:farben, oben:H.oben, unten:H.unten, gruppen:gruppen };
  }
  return { zufall:zufall, mischen:mischen, ZEICHEN:ZEICHEN, MAX_FARBEN:MAX_FARBEN, FARBE:FARBE, FARBNAME:FARBNAME, REIHEN:REIHEN, FORMEN:FORMEN, AEHNLICH:AEHNLICH,
    zeichen:zeichen, unbekannt:unbekannt, mindestens:mindestens, auffuellen:auffuellen, verteilen:verteilen, laengster:laengster, hoehe:hoehe, zuStrecke:zuStrecke, planen:planen };
})();
/* KERN-ENDE */

var TINTE = '#1C1714';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }

/* ---------- Zeichnen ---------- */
// Form um (x, y) mit «Radius» r
function formSvg(form, x, y, r, farbe, rand){
  var a = ' fill="' + farbe + '" stroke="' + (rand || 'rgba(0,0,0,.18)') + '" stroke-width="' + (rand ? 1.4 : 1) + '"', p = [], i;
  function eck(k, rr, dreh){ var l = []; for (var j = 0; j < k; j++){ var w = (dreh + j * 360 / k) * Math.PI / 180; l.push(f1(x + rr * Math.sin(w)) + ',' + f1(y - rr * Math.cos(w))); } return l.join(' '); }
  switch (form){
    case 'kreis': return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.86) + '"' + a + '/>';
    case 'quadrat': return '<rect x="' + f1(x - r * 0.78) + '" y="' + f1(y - r * 0.78) + '" width="' + f1(r * 1.56) + '" height="' + f1(r * 1.56) + '" rx="' + f1(r * 0.12) + '"' + a + '/>';
    case 'dreieck': return '<polygon points="' + eck(3, r * 1.12, 0) + '" stroke-linejoin="round"' + a + '/>';
    case 'raute': return '<polygon points="' + eck(4, r * 1.02, 0) + '"' + a + '/>';
    case 'sechseck': return '<polygon points="' + eck(6, r * 0.95, 30) + '"' + a + '/>';
    case 'stern':
      for (i = 0; i < 10; i++){ var rr = i % 2 ? r * 0.45 : r * 1.05, w = i * 36 * Math.PI / 180; p.push(f1(x + rr * Math.sin(w)) + ',' + f1(y + r * 0.08 - rr * Math.cos(w))); }
      return '<polygon points="' + p.join(' ') + '"' + a + ' stroke-linejoin="round"/>';
    case 'herz':
      var s = r / 10;
      return '<path d="M' + f1(x) + ' ' + f1(y + 9 * s) + 'C' + f1(x - 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x - 11 * s) + ' ' + f1(y + 1 * s) + ' ' + f1(x - 11 * s) + ' ' + f1(y - 4 * s) +
        'C' + f1(x - 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x - 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x) + ' ' + f1(y - 5.5 * s) +
        'C' + f1(x + 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 4 * s) +
        'C' + f1(x + 11 * s) + ' ' + f1(y + 1 * s) + ' ' + f1(x + 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x) + ' ' + f1(y + 9 * s) + 'Z"' + a + '/>';
    case 'blume':
      var t = '';
      for (i = 0; i < 5; i++){ var w2 = i * 72 * Math.PI / 180; t += '<circle cx="' + f1(x + r * 0.5 * Math.sin(w2)) + '" cy="' + f1(y - r * 0.5 * Math.cos(w2)) + '" r="' + f1(r * 0.46) + '"' + a + '/>'; }
      return t + '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.3) + '" fill="#fff" fill-opacity=".85"/>';
  }
  return '';
}
// Regenbogen mit n Bändern (aussen die erste Farbe) und Wolken an den Enden
function regenbogenSvg(farben, breite){
  var n = farben.length, R = breite / 2 - 30, band = Math.min(16, (R * 0.55) / n), h = R + 34, cx = breite / 2, cy = R + 14, t = '';
  farben.forEach(function(f, i){
    var r = R - i * band - band / 2;
    t += '<path d="M' + f1(cx - r) + ' ' + f1(cy) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r) + ' ' + f1(cy) + '" fill="none" stroke="' + Kern.FARBE[f] + '" stroke-width="' + f1(band + 0.6) + '"/>';
  });
  function wolke(x, y, s){
    return '<g fill="#fff" stroke="#C9C2BC" stroke-width="1.4">' + [[-26, 6, 15], [-8, -6, 19], [14, -2, 17], [30, 8, 13]].map(function(k){ return '<circle cx="' + f1(x + k[0] * s) + '" cy="' + f1(y + k[1] * s) + '" r="' + f1(k[2] * s) + '"/>'; }).join('') +
      '<rect x="' + f1(x - 40 * s) + '" y="' + f1(y + 4 * s) + '" width="' + f1(84 * s) + '" height="' + f1(17 * s) + '" rx="' + f1(8 * s) + '"/></g>' +
      '<g fill="#fff">' + [[-26, 6, 13.6], [-8, -6, 17.6], [14, -2, 15.6], [30, 8, 11.6]].map(function(k){ return '<circle cx="' + f1(x + k[0] * s) + '" cy="' + f1(y + k[1] * s) + '" r="' + f1(k[2] * s) + '"/>'; }).join('') +
      '<rect x="' + f1(x - 38.6 * s) + '" y="' + f1(y + 5.4 * s) + '" width="' + f1(81.2 * s) + '" height="' + f1(14.2 * s) + '" rx="' + f1(7 * s) + '"/></g>';
  }
  var s = Math.max(0.8, Math.min(1.3, n * band / 70));
  return '<svg class="rb-bogen" width="' + breite + '" height="' + f1(h) + '" viewBox="0 0 ' + breite + ' ' + f1(h) + '" role="img" aria-label="Regenbogen mit ' + n + ' Farben">' + t +
    wolke(cx - R + n * band / 2, cy, s) + wolke(cx + R - n * band / 2, cy, s) + '</svg>';
}
/* Gruppen: jedes Zeichen in einem Feld; oben klein die Formen, die dazugehören (weiss mit Rand), darunter Punkte und
   Ablenker. Gleicher Massstab waagrecht und senkrecht. Lösung: schwarze Linien je Strich, Ablenker blass. */
function gruppenSvg(P, breite, loesung, maxHoehe){
  var g = P.gruppen.length, proZeile = g <= 3 ? g : Math.ceil(g / 2), zeilen = Math.ceil(g / proZeile), H = P.unten - P.oben;
  var w = Math.min(190, (breite - 20) / proZeile), r;
  // so schmal, dass alle Reihen in maxHoehe passen (Höhe einer Gruppe: Kopf + H Einheiten + Rand; eine Einheit = (w − 4r) / 2)
  for (var runde = 0; runde < 3; runde++){
    r = Math.max(11, Math.min(17, w * 0.085));
    var proReihe = (maxHoehe || 1e9) / zeilen - 16, kopf0 = 2 * Math.max(7, r * 0.72) + 12;
    w = Math.min(w, 2 * (proReihe - kopf0 - 4 * r) / H + 4 * r);
  }
  r = Math.max(11, Math.min(17, w * 0.085));
  // Liegen Formen eng beieinander, werden alle etwas kleiner – gleich gross in allen Gruppen
  var eng = Infinity, s0 = (w - 4 * r) / 2;
  P.gruppen.forEach(function(gr){
    var alle = []; gr.striche.forEach(function(st){ st.punkte.forEach(function(q){ alle.push(q); }); }); gr.ablenker.forEach(function(q){ alle.push([q.x, q.y]); });
    alle.forEach(function(a, i){ alle.forEach(function(b, j){ if (j > i) eng = Math.min(eng, Math.hypot(a[0] - b[0], a[1] - b[1]) * s0); }); });
  });
  r = Math.max(7, Math.min(r, eng / 2.3));
  var s = (w - 4 * r) / 2, rk = Math.max(7, r * 0.72), kopf = 2 * rk + 12, h = kopf + H * s + 4 * r, hoehe = zeilen * (h + 16), t = '';
  P.gruppen.forEach(function(gr, i){
    var zeile = Math.floor(i / proZeile), inZeile = Math.min(proZeile, g - zeile * proZeile), spalte = i - zeile * proZeile;
    var x0 = (breite - inZeile * w) / 2 + spalte * w, y0 = zeile * (h + 16) + 8;
    function xy(x, y){ return [x0 + 2 * r + x * s, y0 + kopf + 2 * r + (y - P.oben) * s]; }
    // oben: die Formen dieser Gruppe
    var formen = gr.striche.map(function(st){ return st.form; }), mitte = x0 + w / 2, abst = 2 * rk + 8;
    formen.forEach(function(f, k){ t += formSvg(f, mitte + (k - (formen.length - 1) / 2) * abst, y0 + rk + 2, rk, '#fff', TINTE); });
    t += '<line x1="' + f1(x0 + 10) + '" y1="' + f1(y0 + kopf - 3) + '" x2="' + f1(x0 + w - 10) + '" y2="' + f1(y0 + kopf - 3) + '" stroke="#D8CEC4" stroke-width="1"/>';
    if (loesung) gr.striche.forEach(function(st){
      if (st.punkte.length < 2) return;
      t += '<polyline points="' + st.punkte.map(function(q){ var p = xy(q[0], q[1]); return f1(p[0]) + ',' + f1(p[1]); }).join(' ') + '" fill="none" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.42) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    t += (loesung ? '<g opacity=".28">' : '<g>') + gr.ablenker.map(function(q){ var p = xy(q.x, q.y); return formSvg(q.form, p[0], p[1], r, Kern.FARBE[q.farbe]); }).join('') + '</g>';
    gr.striche.forEach(function(st){ st.punkte.forEach(function(q){ var p = xy(q[0], q[1]); t += formSvg(st.form, p[0], p[1], r, Kern.FARBE[q[2]]); }); });
  });
  return '<svg class="rb-gruppen" width="' + breite + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + breite + ' ' + f1(hoehe) + '" role="img" aria-label="Formen zum Verbinden">' + t + '</svg>';
}

var VORLAGE = '<div class="rb">' +
  '<header class="rb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Regenbogenrätsel</h1>' +
    '<p>Verbinde in jeder Gruppe die Formen in der Reihenfolge der Regenbogenfarben – dann erscheinen Zahlen oder Buchstaben.</p></header>' +
  '<div class="rb-layout"><section class="rb-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zeichen</h2><p>Welche Zahl oder welches Wort soll erscheinen?</p></div></div>' +
      '<label class="feld-label" for="rbZiffern">Zahl oder Wort</label>' +
      '<div class="rb-zeile"><input type="text" id="rbZiffern" maxlength="12" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="rbZufall" title="Eine andere Zahl oder ein anderes Wort">Andere</button></div>' +
      '<p class="hinweis">1 bis 6 Zeichen: Ziffern, Gross- und Kleinbuchstaben, z. B. «243», «MAUS» oder «Hut». Buchstaben mit mehreren Strichen (T, H, i …) bekommen pro Strich eine eigene Form.</p>' +
      '<div class="rb-zaehler" id="rbZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Regenbogen</h2></div></div>' +
      '<p class="feld-label">Anzahl Farben</p><div class="rb-chips" id="rbFarben" role="radiogroup" aria-label="Anzahl Farben im Regenbogen"></div>' +
      '<p class="hinweis" id="rbFarbenInfo"></p>' +
      '<div class="rb-farbfolge" id="rbFolge"></div>' +
    '</div>' +
  '</section>' +
  '<section class="rb-ausgabe" aria-label="Ergebnis">' +
    '<div id="rbMeldung" aria-live="polite"></div>' +
    '<div class="rb-werkzeug">' +
      '<button type="button" class="btn klein" id="rbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="rbNeu" title="Formen und Lage neu mischen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="rbMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="rbPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="rbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="rb-rahmen"><article class="rb-blatt" id="rbBlatt"></article></div>' +
    '<div class="rb-rahmen"><article class="rb-blatt rb-loesungsblatt" id="rbLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M3 17a9 9 0 0 1 18 0"/><path d="M6.5 17a5.5 5.5 0 0 1 11 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>';

Labor.registriere({
  id:'regenbogen',
  titel:'Regenbogenrätsel',
  kurz:'Formen in Regenbogen-Reihenfolge verbinden – Zahlen oder Buchstaben erscheinen',
  beschreibung:'Unter einem Regenbogen liegen Sterne, Kreise, Dreiecke und mehr in seinen Farben. Wer sie in der Reihenfolge der Regenbogenfarben verbindet, zeichnet Zahlen oder Wörter. Zeichen und Anzahl Farben frei wählbar, mit Lösungsblatt.',
  merkmale:['Zahlen und Buchstaben', '3 bis 10 Farben', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/regenbogen/regenbogen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'regenbogen-eingaben', OPT = 'regenbogen-einstellungen';
  var STANDARD = { farben:0, mitLoesung:true, titelAn:true, anleitungAn:true };   // farben 0: so wenige wie nötig
  var st = { ziffern:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.ziffern = String(e.ziffern || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  delete st.opt.antwort;   // früher: Linie für die Antwort
  if (!Kern.zeichen(st.ziffern).length) st.ziffern = '243';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ ziffern:st.ziffern, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#rbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#rbZiffern').value = st.ziffern;
  $('#rbZiffern').addEventListener('input', function(){ st.ziffern = this.value; speichern(); baldZeichnen(); });
  // «Andere»: abwechselnd eine Zahl (2–4 Ziffern) oder ein kurzes Wort (gross oder klein geschrieben)
  var WOERTER = ['Hut', 'Sonne', 'MAUS', 'Igel', 'ZOO', 'Ball', 'Kiwi', 'Haus', 'Fisch', 'LAMA', 'Pony', 'Eis', 'Baum', 'Hase', 'Wolke', 'OTTER', 'Buch', 'Stern', 'Regen'];
  var zahlDran = /[A-Za-z]/.test(st.ziffern);
  $('#rbZufall').addEventListener('click', function(){
    var r = Kern.zufall(Date.now()), z = '';
    if (zahlDran){ var n = 2 + Math.floor(r() * 3); for (var i = 0; i < n; i++) z += Math.floor(r() * 10); }
    else { var l = WOERTER.filter(function(w){ return w !== st.ziffern; }); z = l[Math.floor(r() * l.length)]; }
    zahlDran = !zahlDran;
    st.ziffern = z; $('#rbZiffern').value = z; speichern(); zeichnen();
  });
  // Anzahl Farben: von «so wenige wie nötig» bis 10; zu kleine sind gesperrt
  $('#rbFarben').addEventListener('change', function(ev){ var r = ev.target.closest('input'); if (!r) return; st.opt.farben = +r.value; speichern(); zeichnen(); });
  function farbenZeigen(min){
    var l = [];
    for (var n = 3; n <= Kern.MAX_FARBEN; n++) l.push(n);
    var gewaehlt = Math.max(min, st.opt.farben || min);
    $('#rbFarben').innerHTML = l.map(function(n){
      return '<label' + (n < min ? ' class="gesperrt" title="Diese Zeichen brauchen mindestens ' + min + ' Farben"' : '') + '><input type="radio" name="rbFarben" value="' + n + '"' + (n === gewaehlt ? ' checked' : '') + (n < min ? ' disabled' : '') + '><span>' + n + '</span></label>';
    }).join('');
    $('#rbFarbenInfo').textContent = 'Diese Zeichen brauchen mindestens ' + min + ' Farben. Mit mehr Farben bekommen die Striche zusätzliche Punkte auf ihren Linien – das wird schwieriger. Kurze Striche brauchen nur die ersten Farben.';
    return gewaehlt;
  }
  $('#rbMitLoesung').checked = !!st.opt.mitLoesung;
  $('#rbMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#rbNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#rbZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  /* ---------- Rätsel ---------- */
  var P = null, B = 639;   // Zeichenfläche: 703 Pixel Blatt minus Rand
  function titel(){ return 'Regenbogenrätsel'; }
  function anleitung(z){
    var zahl = z.every(function(c){ return /[0-9]/.test(c); }), mehrere = P.gruppen.some(function(g){ return g.striche.length > 1; }), punkt = P.gruppen.some(function(g){ return g.striche.some(function(st){ return st.punkte.length === 1; }); });
    return 'Über jeder Gruppe siehst du, welche Formen zu ihr gehören. Verbinde ' + (mehrere ? 'jede dieser Formen für sich' : 'sie') + ' der Reihe nach in den Farben des Regenbogens: zuerst ' +
      Kern.FARBNAME[P.farben[0]] + ' (ganz aussen), dann ' + Kern.FARBNAME[P.farben[1]] + ' und so weiter. Die anderen Formen gehören nicht dazu.' +
      (punkt ? ' Eine einzelne Form bleibt ein Punkt.' : '') + ' ' + (zahl ? 'Welche Zahl' : 'Welches Wort') + ' entsteht?' + (z.length > 1 ? ' Lies von links nach rechts.' : '');
  }
  function blattHtml(z, loesung, kopf){
    var o = st.opt;
    return (o.titelAn ? '<h2>' + esc(titel()) + (kopf ? ' – Lösung' : '') + '</h2>' : (kopf ? '<p class="rb-anleitung"><b>Lösung</b></p>' : '')) +
      (o.anleitungAn && !kopf ? '<p class="rb-anleitung">' + esc(anleitung(z)) + '</p>' : '') +
      '<div class="rb-bild">' + regenbogenSvg(P.farben, Math.min(B, 470)) + gruppenSvg(P, B, loesung, 560) + '</div>' +
      (kopf ? '<p class="rb-antwort">Lösung: <b>' + esc(z.join('')) + '</b></p>' : '');
  }
  function zeichnen(){
    if (aus) return;
    var roh = String(st.ziffern || ''), z = Kern.zeichen(roh), h = '', weg = Kern.unbekannt(roh);
    if (weg.length) h += '<p class="warnung">' + esc(weg.join(' ')) + ' gibt es nicht – nur Ziffern und Buchstaben A–Z, a–z (statt Ä, Ö, Ü: AE, OE, UE).</p>';
    if (Array.from(roh).filter(function(c){ return Kern.ZEICHEN[c]; }).length > 6) h += '<p class="warnung">Höchstens 6 Zeichen – es werden die ersten 6 verwendet.</p>';
    $('#rbZaehler').innerHTML = z.length ? '<p class="rb-zaehler-haupt ok">Lösung: <b>' + esc(z.join('')) + '</b></p>' + h : h;
    var leer = !z.length;
    ['#rbZeigeLoesung', '#rbNeu', '#rbPdf', '#rbHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#rbBlatt').parentNode.hidden = true; meldung('info', '<p>Gib links die Zahl oder das Wort ein, das erscheinen soll.</p>'); return; }
    meldung('', ''); $('#rbBlatt').parentNode.hidden = false;
    var min = Kern.mindestens(z), n = farbenZeigen(min);
    P = Kern.planen({ zeichen:z, farben:n, seed:st.seed });
    $('#rbFolge').innerHTML = P.farben.map(function(f, i){ return '<span><i style="background:' + Kern.FARBE[f] + '"></i>' + (i + 1) + '. ' + esc(Kern.FARBNAME[f]) + '</span>'; }).join('');
    var zeige = $('#rbZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#rbBlatt').innerHTML = blattHtml(z, zeige, false);
    $('#rbLoesung').innerHTML = blattHtml(z, true, true);
  }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function ohneLoesung(){ var k = $('#rbZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#rbPdf'), function(){ ohneLoesung(); return P && { blaetter:[$('#rbBlatt'), st.opt.mitLoesung && $('#rbLoesung')], name:Labor.pdfName('Regenbogenraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rbPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rbHerunterladen').hidden = false; });
  }
  $('#rbHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    ohneLoesung();
    var name = Labor.pdfName('Regenbogenraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#rbBlatt'), st.opt.mitLoesung && $('#rbLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Regenbogenrätsel', inhalt, '.rb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
