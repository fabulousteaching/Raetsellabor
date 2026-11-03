/* Rätsellabor · Zahlen-Suchsel
   Wörter werden so versteckt, dass sie markiert die Ziffern einer Lösungszahl bilden.
   Teile: Kern (Ziffern aus Strichen bauen, Wörter verteilen, Feld füllen), Vorlage (Oberfläche),
   Bedienung (wird bei jedem Öffnen gestartet und beim Verlassen mit stopp() aufgeräumt). */
(function(){
'use strict';

/* KERN-START */
/* ===== Kern des Zahlen-Suchsels =====
   Jede Ziffer wird wie auf einer Digitalanzeige aus geraden Strichen gebaut:
     a = oben, b = rechts oben, c = rechts unten, d = unten, e = links unten, f = links oben, g = Mitte.
   Jeder Strich wird lückenlos mit Wörtern gefüllt (ein langer Strich darf auch aus mehreren Wörtern bestehen).
   Breite und Höhe der Ziffern richten sich nach den Wortlängen. Alle Ziffern sind gleich hoch. */
var Kern = (function(){
'use strict';

var FORMEN = {
  '0':['abcdef'], '1':['bc', 'bcF'], '2':['abdeg'], '3':['abcdg'], '4':['bcfg'],
  '5':['acdfg'], '6':['acdefg'], '7':['abc'], '8':['abcdefg'], '9':['abcdfg', 'abcfg']
};
var WMIN = 3, HMIN = 5, HMAX = 40;
var ZEIT = { zeit:true };

function mischen(a, rnd){
  for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* Die geraden Linien einer Ziffer. W = Breite, m = Zeile des Mittelstrichs, n = Zeilen darunter (Höhe = m + n + 1).
   Die 1 ist ein senkrechter Strich, wahlweise mit schrägem Fähnchen (F) links oben. */
function linien(z, segs, W, m, n){
  var H = m + n + 1, L = [];
  if (z === '1'){
    if (segs.indexOf('F') < 0) return [{ o:'v', c:0, r0:0, r1:H - 1 }];
    return [{ o:'v', c:W - 1, r0:0, r1:H - 1 }, { o:'d', r0:1, c0:W - 2, len:W - 1 }];
  }
  var s = function(x){ return segs.indexOf(x) >= 0; };
  if (s('a')) L.push({ o:'h', r:0, c0:0, c1:W - 1 });
  if (s('g')) L.push({ o:'h', r:m, c0:0, c1:W - 1 });
  if (s('d')) L.push({ o:'h', r:H - 1, c0:0, c1:W - 1 });
  [[0, 'f', 'e'], [W - 1, 'b', 'c']].forEach(function(v){
    var oben = s(v[1]), unten = s(v[2]);
    if (oben || unten) L.push({ o:'v', c:v[0], r0:oben ? 0 : m, r1:unten ? H - 1 : m });
  });
  return L;
}
/* Felder, in denen sich eine waagrechte und eine senkrechte Linie treffen.
   ecke = beide Linien enden dort (dieses Feld darf auch leer bleiben: die Ecke wirkt dann abgerundet) */
function knoten(L){
  var K = [];
  L.forEach(function(h){ if (h.o !== 'h') return;
    L.forEach(function(v){ if (v.o !== 'v') return;
      if (v.c >= h.c0 && v.c <= h.c1 && h.r >= v.r0 && h.r <= v.r1)
        K.push({ r:h.r, c:v.c, ecke:(v.c === h.c0 || v.c === h.c1) && (h.r === v.r0 || h.r === v.r1) });
    });
  });
  return K;
}
function zellenVon(l){
  var z = [], i;
  if (l.o === 'h') for (i = l.c0; i <= l.c1; i++) z.push([l.r, i]);
  else if (l.o === 'v') for (i = l.r0; i <= l.r1; i++) z.push([i, l.c]);
  else for (i = 0; i < l.len; i++) z.push([l.r0 + i, l.c0 - i]);
  return z;
}
/* zustand je Knoten: 0 = gehört der senkrechten Linie, 1 = der waagrechten, 2 = bleibt leer,
   3 = gehört beiden (die zwei Wörter teilen sich dort einen Buchstaben).
   Daraus entstehen die Stücke, die lückenlos mit Wörtern gefüllt werden. */
function stuecke(L, K, zustand){
  var sperre = {};
  K.forEach(function(k, i){ sperre[k.r + ',' + k.c] = zustand[i] === 3 ? '' : zustand[i] === 2 ? 'hv' : zustand[i] === 1 ? 'v' : 'h'; });
  var P = [];
  L.forEach(function(l){
    var lauf = [];
    zellenVon(l).forEach(function(p){
      var sp = sperre[p[0] + ',' + p[1]];
      if (sp && sp.indexOf(l.o) >= 0){ if (lauf.length) P.push({ o:l.o, zellen:lauf }); lauf = []; }
      else lauf.push(p);
    });
    if (lauf.length) P.push({ o:l.o, zellen:lauf });
  });
  return P;
}
function zustaende(K, teilen){
  var alle = [[]];
  K.forEach(function(k){
    var neu = [], moeglich = k.ecke ? (teilen ? [0, 1, 2, 3] : [0, 1, 2]) : [0, 1];
    alle.forEach(function(z){
      moeglich.forEach(function(s){
        // höchstens ein gemeinsames Eckfeld je Ziffer: hält die Suche schnell
        if (s === 3 && z.indexOf(3) >= 0) return;
        neu.push(z.concat([s]));
      });
    });
    alle = neu;
  });
  return alle;
}

/* Alle unterschiedlichen Arten, eine Ziffer in Stücke zu zerlegen (bei gegebener Höhe).
   Waagrechte (und schräge) Stücke sind W - k lang, senkrechte haben eine feste Länge.
   Buchstaben, die die Ziffer aufnimmt = alpha * W + beta (ein gemeinsames Eckfeld zählt doppelt). */
var cache = {};
function optionen(z, m, n, schraeg, teilen){
  var key = z + ':' + m + ':' + n + ':' + (schraeg ? 1 : 0) + (teilen ? 1 : 0);
  if (cache[key]) return cache[key];
  var W0 = 50, liste = [], sig = {};
  FORMEN[z].forEach(function(segs){
    if (!schraeg && segs.indexOf('F') >= 0) return;
    var L = linien(z, segs, W0, m, n), K = knoten(L);
    zustaende(K, teilen).forEach(function(zu){
      var P = stuecke(L, K, zu), hp = [], vp = [], leer = 0, geteilt = 0;
      zu.forEach(function(s){ if (s === 2) leer++; if (s === 3) geteilt++; });
      P.forEach(function(p){ if (p.o === 'v') vp.push(p.zellen.length); else hp.push({ o:p.o, k:W0 - p.zellen.length }); });
      hp.sort(function(a, b){ return a.k - b.k || (a.o < b.o ? -1 : 1); }); vp.sort(function(a, b){ return b - a; });
      var s = segs + '|' + hp.map(function(p){ return p.o + p.k; }).join(',') + '|' + vp.join(',') + '|' + geteilt;
      if (!sig[s]){
        var beta = 0; vp.forEach(function(v){ beta += v; }); hp.forEach(function(p){ beta -= p.k; });
        liste.push(sig[s] = { segs:segs, hp:hp, vp:vp, zustaende:[], alpha:hp.length, beta:beta, anzahl:P.length, leer:leer, geteilt:geteilt,
          wAnteil:segs.indexOf('F') >= 0 ? 0.5 : 0 });
      }
      sig[s].zustaende.push(zu);
    });
  });
  return cache[key] = liste;
}
function wmaxVon(o, wmax, H){ return o.wAnteil ? Math.min(wmax, Math.max(WMIN, Math.floor(H * o.wAnteil) + 1)) : wmax; }
/* Mindestanzahl Wörter einer Ziffer = Anzahl ihrer geraden Linien */
function minWoerter(z){
  return Math.min.apply(null, FORMEN[z].map(function(s){ return linien(z, s, 5, 2, 2).length; }));
}
function buchstabenBereich(z, m, n, wmax, schraeg, teilen){
  var lo = Infinity, hi = -Infinity, H = m + n + 1;
  optionen(z, m, n, schraeg, teilen).forEach(function(o){
    var a = o.alpha ? o.alpha * WMIN + o.beta : o.beta, b = o.alpha ? o.alpha * wmaxVon(o, wmax, H) + o.beta : o.beta;
    if (a < lo) lo = a; if (b > hi) hi = b;
  });
  return [lo, hi];
}
/* Welche Wörter sich überlappen können: Endbuchstabe des einen = Anfangsbuchstabe des anderen
   (mit «rückwärts» zählt jedes Wortende). paare['5,4'] = es gibt ein 5er-Wort, das in ein 4er-Wort übergehen kann.
   max = wie viele Überlappungen höchstens gleichzeitig möglich sind (grösste Paarung), höchstens 6. */
function ueberlappInfo(woerter, rueck){
  var N = woerter.length, kann = [], paare = {}, i, j;
  function ende(w){ return w.b[w.b.length - 1]; }
  for (i = 0; i < N; i++){ kann.push([]); for (j = 0; j < N; j++){
    if (i === j) continue;
    var a = woerter[i], b = woerter[j];
    var ok = ende(a) === b.b[0] || (rueck && (ende(a) === ende(b) || a.b[0] === b.b[0] || a.b[0] === ende(b)));
    if (ok){ kann[i].push(j); (paare[a.b.length + ',' + b.b.length] = paare[a.b.length + ',' + b.b.length] || []).push([i, j]); }
  } }
  // je Längenpaar: wie viele Paare aus lauter verschiedenen Wörtern es gibt (gierig gezählt)
  Object.keys(paare).forEach(function(k){
    var frei = {}, n = 0;
    paare[k].forEach(function(pq){ if (!frei[pq[0]] && !frei[pq[1]]){ frei[pq[0]] = frei[pq[1]] = true; n++; } });
    paare[k] = n;
  });
  // grösste Paarung «Ende von i» → «Anfang von j»
  var partner = new Array(N).fill(-1), max = 0;
  function erweitern(i, gesehen){
    for (var k = 0; k < kann[i].length; k++){
      var j = kann[i][k]; if (gesehen[j]) continue; gesehen[j] = true;
      if (partner[j] < 0 || erweitern(partner[j], gesehen)){ partner[j] = i; return true; }
    }
    return false;
  }
  for (i = 0; i < N; i++) if (erweitern(i, {})) max++;
  if (rueck) max = Math.floor(max / 2);   // jedes Wort hat nur zwei Enden
  return { max:Math.min(max, 4), paare:paare };
}

function Budget(max, bis){ this.n = 0; this.max = max; this.bis = bis; }
Budget.prototype.tick = function(){ if (++this.n > this.max || ((this.n & 511) === 0 && Date.now() > this.bis)) throw ZEIT; };

/* Suche: Ziffer für Ziffer eine Höhe, eine Zerlegung und eine Breite wählen und die Stücke mit Wortlängen füllen.
   Gleich lange Wörter sind austauschbar, darum wird nur mit der Anzahl Wörter je Länge gerechnet.
   paare[d] = erlaubte Höhen [m, n] der Ziffer d. Mit Überlappungen (B = Vorrat) darf ein Stück
   o Buchstaben mehr aufnehmen, als es Felder hat; welche Wörter sich wirklich überlappen, entscheidet bauen(). */
function suche(ziffern, paare, lens, cnt0, wmaxF, schraeg, B0, wPaare, budget, rnd){
  var D = ziffern.length, K = lens.length, teilen = B0 > 0, i;
  var eintraege = [], sMin = [], sMax = [], sPc = [];
  sMin[D] = sMax[D] = sPc[D] = 0;
  for (i = 0; i < D; i++){
    eintraege.push(paare[i].map(function(p){ return { m:p[0], n:p[1], H:p[0] + p[1] + 1, opts:optionen(ziffern[i], p[0], p[1], schraeg, teilen) }; }));
  }
  for (i = D - 1; i >= 0; i--){
    var lo = Infinity, hi = -Infinity, pc = Infinity;
    eintraege[i].forEach(function(e){
      var ber = buchstabenBereich(ziffern[i], e.m, e.n, wmaxF(e.H), schraeg, teilen);
      if (ber[0] < lo) lo = ber[0]; if (ber[1] > hi) hi = ber[1];
      e.opts.forEach(function(o){ if (o.anzahl < pc) pc = o.anzahl; });
    });
    sMin[i] = sMin[i + 1] + lo; sMax[i] = sMax[i + 1] + hi; sPc[i] = sPc[i + 1] + pc;
  }
  var c = cnt0.slice(), R0 = 0, N0 = 0;
  for (i = 0; i < K; i++){ R0 += lens[i] * c[i]; N0 += c[i]; }
  if (R0 < sMin[0] || R0 > sMax[0] + B0 || N0 < sPc[0]) return null;
  var ord = mischen(lens.map(function(_, j){ return j; }), rnd);
  var memo = {}, wahl = [], wRef = 0, vorratPaare = {};
  Object.keys(wPaare).forEach(function(k){ vorratPaare[k] = wPaare[k]; });
  function paarSig(){ var t = ''; for (var k in vorratPaare) t += vorratPaare[k]; return t; }

  function kleinste(){ for (var j = K - 1; j >= 0; j--) if (c[j]) return lens[j]; return Infinity; }
  // Ein Längenpaar aus diesen Wörtern, für das noch ein passendes Wortpaar übrig ist
  function freiesPaar(l){
    for (var a = 0; a < l.length; a++) for (var b = 0; b < l.length; b++){
      if (a === b) continue;
      var k = l[a] + ',' + l[b];
      if (vorratPaare[k] > 0) return k;
    }
    return null;
  }

  function ziffer(d, R, N, B){
    if (d === D) return R === 0;
    if (R < sMin[d] || R > sMax[d] + B || N < sPc[d]) return false;
    var key = d + ':' + B + ':' + c.join(',') + ':' + paarSig();
    if (memo[key]) return false;
    budget.tick();
    // Höhen zufällig, Zerlegungen mit wenig leeren Ecken bevorzugen
    var es = mischen(eintraege[d].slice(), rnd);
    for (var ei = 0; ei < es.length; ei++){
      var e = es[ei], H = e.H, wmax = wmaxF(H), gewO = new Map();
      e.opts.forEach(function(o){ gewO.set(o, o.leer * 0.8 + o.geteilt * 1.1 + rnd() * 1.6); });
      var os = e.opts.slice().sort(function(a, b){ return gewO.get(a) - gewO.get(b); });
      for (var oi = 0; oi < os.length; oi++){
        var o = os[oi], Ws = [], Bn = B - o.geteilt;
        if (Bn < 0 || o.anzahl + sPc[d + 1] > N) continue;
        if (!o.alpha) Ws.push(1);
        else {
          var wlo = Math.max(WMIN, Math.ceil((R - sMax[d + 1] - Bn - o.beta) / o.alpha));
          var whi = Math.min(wmaxVon(o, wmax, H), Math.floor((R - sMin[d + 1] - o.beta) / o.alpha));
          var ziel = o.wAnteil ? Math.round(H * 0.3) + 1 : (wRef && paare[d].length === 1 ? wRef : Math.round(H * 0.6)), gew = {};
          for (var W = wlo; W <= whi; W++){ Ws.push(W); gew[W] = Math.abs(W - ziel) + rnd() * 0.9; }
          Ws.sort(function(a, b){ return gew[a] - gew[b]; });
        }
        for (var wi = 0; wi < Ws.length; wi++){
          var Wx = Ws[wi], pix = o.alpha ? o.alpha * Wx + o.beta : o.beta;
          if (R - pix < 0) continue;
          var teile = o.vp.map(function(l){ return { o:'v', len:l }; })
            .concat(o.hp.map(function(p){ return { o:p.o, len:Wx - p.k }; }));
          teile.sort(function(a, b){ return b.len - a.len; });
          var alt = wRef; if (!wRef && o.alpha && !o.wAnteil) wRef = Wx;
          var kombis = [];
          if (fuellen(teile, 0, kombis, d, R - pix, N, Bn)){
            wahl[d] = { ziffer:ziffern[d], opt:o, W:Wx, m:e.m, n:e.n, teile:teile, kombis:kombis };
            return true;
          }
          wRef = alt;
        }
      }
    }
    memo[key] = 1;
    return false;
  }

  function fuellen(teile, i, kombis, d, R, N, B){
    if (i === teile.length) return ziffer(d + 1, R, N, B);
    var spaeter = teile.length - i - 1 + sPc[d + 1], pick = [], L = teile[i].len;
    // Anzahl Überlappungen in diesem Stück: meist keine, manchmal eine oder zwei
    var ueb = [0];
    if (B > 0){
      ueb.push(1);   // höchstens eine Überlappung je Strich
      var gu = {}; ueb.forEach(function(x){ gu[x] = x * 0.8 + rnd() * 1.4; });
      ueb.sort(function(a, b){ return gu[a] - gu[b]; });
    }
    for (var ui = 0; ui < ueb.length; ui++){
      var o = ueb[ui];
      if (R < o) continue;
      if (k(0, L + o, o)) return true;
    }
    return false;
    function k(oi, offen, o){
      if (offen === 0){
        if (pick.length < o + 1 || N - pick.length < spaeter) return false;
        var pk = null;
        if (o > 0){ pk = freiesPaar(pick); if (!pk) return false; vorratPaare[pk]--; }
        kombis[i] = { l:pick.slice(), o:o };
        var erg = fuellen(teile, i + 1, kombis, d, R - o, N - pick.length, B - o);
        if (pk && !erg) vorratPaare[pk]++;
        return erg;
      }
      if (oi >= K || offen < kleinste()) return false;
      budget.tick();
      var j = ord[oi], Lj = lens[j], q = Math.min(c[j], Math.floor(offen / Lj));
      for (; q >= 0; q--){
        c[j] -= q; for (var x = 0; x < q; x++) pick.push(Lj);
        var ok = k(oi + 1, offen - q * Lj, o);
        c[j] += q; pick.length -= q;
        if (ok) return true;
      }
      return false;
    }
  }

  return ziffer(0, R0, N0, B0) ? wahl : null;
}

/* Zuerst schöne Proportionen (nicht breiter als hoch, Hälften fast gleich), dann lockerer */
var STUFEN = [
  { diff:1, wmax:function(H){ return Math.max(WMIN, Math.round(H * 0.8)); } },
  { diff:3, wmax:function(H){ return Math.round(H * 1.5) + 2; } }
];
function hoehenPaare(H, diff){
  var p = [];
  for (var m = 2; m <= H - 3; m++){ var n = H - 1 - m; if (Math.abs(m - n) <= diff) p.push([m, n]); }
  return p.sort(function(a, b){ return Math.abs(a[0] - a[1]) - Math.abs(b[0] - b[1]) || a[0] - b[0]; });
}

/* Sucht für die Ziffern (alle Zahlen hintereinander) eine Verteilung der Wortlängen.
   o: { zeit (ms), knoten, schraeg (Fähnchen der 1), verschieden (Ziffern verschieden gross),
        ueberlapp (Vorrat an Überlappungen, 0 = keine), hmax, rnd } */
function loese(ziffern, laengen, o){
  o = o || {};
  var rnd = o.rnd || Math.random, hmax = o.hmax || HMAX, bis = Date.now() + (o.zeit || 1500), schraeg = o.schraeg !== false;
  var B = (o.ueberlapp && o.ueberlapp.max) || 0, wPaare = (o.ueberlapp && o.ueberlapp.paare) || {}, map = {}, zeit = false;
  laengen.forEach(function(l){ map[l] = (map[l] || 0) + 1; });
  var lens = Object.keys(map).map(Number).sort(function(a, b){ return b - a; }), cnt = lens.map(function(l){ return map[l]; });
  function versuch(paare, wmaxF){
    if (Date.now() > bis) throw ZEIT;
    try {
      return suche(ziffern, paare, lens, cnt, wmaxF, schraeg, B, wPaare, new Budget(o.knoten || 30000, bis), rnd);
    } catch(e){ if (e !== ZEIT) throw e; zeit = true; return null; }
  }
  try {
    for (var s = 0; s < STUFEN.length; s++){
      for (var H = HMIN; H <= hmax; H++){
        var r = null;
        if (o.verschieden){
          // jede Ziffer darf zwischen etwa der halben und der vollen Höhe H gross sein
          var alle = [];
          for (var h = Math.max(HMIN, Math.ceil(H * 0.5)); h <= H; h++) alle = alle.concat(hoehenPaare(h, STUFEN[s].diff));
          if (!alle.length) continue;
          r = versuch(ziffern.map(function(){ return alle; }), STUFEN[s].wmax);
          if (r) return { ok:true, wahl:r };
        } else {
          var paare = hoehenPaare(H, STUFEN[s].diff);
          for (var p = 0; p < paare.length; p++){
            r = versuch(ziffern.map(function(){ return [paare[p]]; }), STUFEN[s].wmax);
            if (r) return { ok:true, wahl:r };
          }
        }
      }
    }
  } catch(e){ if (e !== ZEIT) throw e; return { ok:false, zeit:true }; }
  return { ok:false, zeit:zeit };
}

/* Grobe Prüfung für verständliche Meldungen */
function analyse(ziffern, laengen, o){
  o = o || {};
  var hmax = o.hmax || HMAX, schraeg = o.schraeg !== false, B = (o.ueberlapp && o.ueberlapp.max) || 0;
  var T = laengen.reduce(function(s, l){ return s + l; }, 0), minW = 0, minB = 0, maxB = B;
  var mo = Math.floor((hmax - 1) / 2), no = hmax - 1 - mo, wm = STUFEN[STUFEN.length - 1].wmax(hmax);
  ziffern.forEach(function(z){
    minW += minWoerter(z);
    minB += buchstabenBereich(z, 2, 2, WMIN, schraeg, false)[0];
    maxB += buchstabenBereich(z, mo, no, wm, schraeg, B > 0)[1];
  });
  return { woerter:laengen.length, buchstaben:T, minWoerter:minW, minBuchstaben:minB, maxBuchstaben:maxB };
}

/* Buchstabenhäufigkeit im Deutschen (für unauffällige Füllbuchstaben) */
var HAEUFIG = { E:17.4, N:9.8, I:7.6, S:7.3, R:7, A:6.5, T:6.2, D:5.1, H:4.8, U:4.4, L:3.4, C:3.1, G:3, M:2.5, O:2.5, B:1.9, W:1.9,
  F:1.7, K:1.2, Z:1.1, P:0.8, V:0.7, J:0.3, Y:0.1, X:0.1, Q:0.05, 'Ä':0.6, 'Ö':0.3, 'Ü':0.7 };
var RICHTUNGEN = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];

/* Baut aus der Lösung das fertige Buchstabenfeld.
   zahlen: ['2026', '7'], woerter: [{text, b:[Buchstaben]}],
   o: {rueckwaerts, abstand, rand, anordnung (mehrere Zahlen: 'neben'|'unter'), ziffern (Ziffern einer Zahl: 'neben'|'unter'),
       liegen (Ziffern dürfen gedreht liegen), rnd}
   Gibt null zurück, wenn sich die geplanten Überlappungen mit diesen Buchstaben nicht umsetzen lassen. */
function bauen(zahlen, loesung, woerter, o){
  var rnd = o.rnd || Math.random, wahl = loesung.wahl;
  var abstand = o.abstand || 1, rand = o.rand == null ? 2 : o.rand, zahlAbstand = abstand + 2, zeilenAbstand = 2;
  var zifUnter = o.ziffern === 'unter';

  // Lage jeder Ziffer: stehend (0), im Uhrzeigersinn gedreht (1) oder dagegen (-1)
  var lage = wahl.map(function(){ return o.liegen ? (rnd() < 0.5 ? 0 : (rnd() < 0.5 ? 1 : -1)) : 0; });
  if (o.liegen && wahl.length > 1 && lage.every(function(l){ return l === lage[0]; })){
    var j0 = Math.floor(rnd() * wahl.length); lage[j0] = lage[j0] ? 0 : (rnd() < 0.5 ? 1 : -1);
  }
  var kasten = wahl.map(function(w, i){
    var H = w.m + w.n + 1, W = w.ziffer === '1' && w.opt.segs.indexOf('F') < 0 ? 1 : w.W;
    return lage[i] ? { b:H, h:W, H:H, W:W } : { b:W, h:H, H:H, W:W };
  });

  // Ziffern einer Zahl nebeneinander (unten bündig) oder untereinander (mittig), dann die Zahlen anordnen
  var bloecke = [], idx = 0;
  zahlen.forEach(function(z){
    var teil = [], bb = 0, hh = 0, i;
    for (i = 0; i < z.length; i++) teil.push(idx + i);
    if (zifUnter){
      teil.forEach(function(k, t){ bb = Math.max(bb, kasten[k].b); hh += kasten[k].h + (t ? abstand : 0); });
      var y = 0; teil.forEach(function(k){ kasten[k].dx = Math.floor((bb - kasten[k].b) / 2); kasten[k].dy = y; y += kasten[k].h + abstand; });
    } else {
      teil.forEach(function(k, t){ hh = Math.max(hh, kasten[k].h); bb += kasten[k].b + (t ? abstand : 0); });
      var x = 0; teil.forEach(function(k){ kasten[k].dx = x; kasten[k].dy = hh - kasten[k].h; x += kasten[k].b + abstand; });
    }
    bloecke.push({ teil:teil, b:bb, h:hh });
    idx += z.length;
  });
  var spalten, zeilen;
  if (o.anordnung === 'unter'){
    var breit = Math.max.apply(null, bloecke.map(function(b){ return b.b; })), yy = rand;
    bloecke.forEach(function(bl){ bl.x = rand + Math.floor((breit - bl.b) / 2); bl.y = yy; yy += bl.h + zeilenAbstand; });
    spalten = breit + 2 * rand; zeilen = yy - zeilenAbstand + rand;
  } else {
    var hoch = Math.max.apply(null, bloecke.map(function(b){ return b.h; })), xx = rand;
    bloecke.forEach(function(bl){ bl.x = xx; bl.y = rand + (zifUnter ? 0 : hoch - bl.h); xx += bl.b + zahlAbstand; });
    spalten = xx - zahlAbstand + rand; zeilen = hoch + 2 * rand;
  }
  var pos = [];
  bloecke.forEach(function(bl){ bl.teil.forEach(function(k){ pos[k] = { x:bl.x + kasten[k].dx, y:bl.y + kasten[k].dy, lage:lage[k] }; }); });
  function insFeld(rc, k){
    var r = rc[0], c = rc[1], ks = kasten[k], p = pos[k];
    if (p.lage === 1){ var t = r; r = c; c = ks.H - 1 - t; }
    else if (p.lage === -1){ var t2 = r; r = ks.W - 1 - c; c = t2; }
    return [r + p.y, c + p.x];
  }

  var gitter, belegt, gesetzt, r0, c0;

  // Ein Wort darf nur einmal im Feld stehen (auch nicht rückwärts oder schräg)
  function vorkommen(b){
    var res = [];
    for (var r = 0; r < zeilen; r++) for (var c = 0; c < spalten; c++){
      if (gitter[r][c] !== b[0]) continue;
      for (var d = 0; d < 8; d++){
        var dr = RICHTUNGEN[d][0], dc = RICHTUNGEN[d][1], er = r + dr * (b.length - 1), ec = c + dc * (b.length - 1);
        if (er < 0 || er >= zeilen || ec < 0 || ec >= spalten) continue;
        var ok = true;
        for (var q = 1; q < b.length && ok; q++) if (gitter[r + dr * q][c + dc * q] !== b[q]) ok = false;
        if (ok){ var z = []; for (q = 0; q < b.length; q++) z.push([r + dr * q, c + dc * q]); res.push(z); }
      }
    }
    return res;
  }
  function schluessel(z){ return z.map(function(rc){ return rc[0] + ',' + rc[1]; }).sort().join(';'); }

  // Die Stücke aller Ziffern im Feld, jeweils so gerichtet, dass man sie von links nach rechts bzw. von oben nach unten liest
  function stueckeImFeld(){
    var liste = [];
    wahl.forEach(function(w, zi){
      var opt = w.opt, zustand = opt.zustaende[Math.floor(rnd() * opt.zustaende.length)];
      var L = linien(w.ziffer, opt.segs, w.W, w.m, w.n), P = stuecke(L, knoten(L), zustand);
      var frei = w.teile.map(function(t, j){ return { o:t.o, len:t.len, k:w.kombis[j], weg:false }; });
      P.forEach(function(p){
        var f = null;
        for (var j = 0; j < frei.length; j++) if (!frei[j].weg && frei[j].o === p.o && frei[j].len === p.zellen.length){ f = frei[j]; break; }
        if (!f) throw new Error('Stück passt nicht');
        f.weg = true;
        var zellen = p.zellen.map(function(rc){ return insFeld(rc, zi); });
        var a = zellen[0], b = zellen[zellen.length - 1];
        if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) zellen.reverse();
        liste.push({ zellen:zellen, laengen:f.k.l, ueb:f.k.o, ziffer:zi });
      });
    });
    return liste;
  }

  // Wörter auf die Plätze verteilen. Wo sich zwei Plätze ein Feld teilen, müssen die Buchstaben gleich sein.
  /* Wörter auf die Stücke verteilen. Stücke mit Überlappungen oder gemeinsamen Eckfeldern werden Wort für Wort
     gefüllt: eine Überlappung entsteht nur, wo der letzte Buchstabe des einen Wortes der erste des nächsten ist,
     und ein gemeinsames Eckfeld braucht in beiden Wörtern denselben Buchstaben. Die übrigen Stücke sind frei. */
  function verteilen(liste){
    var zaehl = {}, feld = {}, benutzt = new Set(), ergebnis = [], schritte = 0, vorrat = {};
    liste.forEach(function(p){ p.zellen.forEach(function(rc){ var k = rc[0] + ',' + rc[1]; zaehl[k] = (zaehl[k] || 0) + 1; }); });
    liste.forEach(function(p){ p.geteilt = p.zellen.some(function(rc){ return zaehl[rc[0] + ',' + rc[1]] > 1; }); });
    mischen(woerter.slice(), rnd).forEach(function(w){ (vorrat[w.b.length] = vorrat[w.b.length] || []).push(w); });
    var schwer = mischen(liste.filter(function(p){ return p.ueb > 0 || p.geteilt; }), rnd)
      .sort(function(a, b){ return b.ueb - a.ueb; });
    var leicht = liste.filter(function(p){ return !(p.ueb > 0 || p.geteilt); });
    var drehungen = o.rueckwaerts ? [false, true] : [false];

    function stueck(si){
      if (si === schwer.length) return true;
      var p = schwer[si], L = p.zellen.length, rest = {}, summe = 0, anzahl = 0;
      p.laengen.forEach(function(l){ rest[l] = (rest[l] || 0) + 1; summe += l; anzahl++; });
      function weiter(pos, ueb, erstes){
        if (!anzahl) return pos === L && ueb === 0 && stueck(si + 1);
        if (++schritte > 20000) return false;
        var starts = !erstes && ueb > 0 ? mischen([pos - 1, pos], rnd) : [pos];
        for (var a = 0; a < starts.length; a++){
          var st = starts[a], u2 = st < pos ? ueb - 1 : ueb, laengen = mischen(Object.keys(rest).filter(function(l){ return rest[l] > 0; }).map(Number), rnd);
          for (var li = 0; li < laengen.length; li++){
            var len = laengen[li], ende = st + len;
            if (ende > L || ende + (summe - len) - u2 !== L) continue;   // der Rest muss genau aufgehen
            var zellen = p.zellen.slice(st, ende), kand = mischen(vorrat[len], rnd);
            for (var ci = 0; ci < kand.length; ci++){
              var w = kand[ci];
              if (benutzt.has(w)) continue;
              for (var di = 0; di < drehungen.length; di++){
                var dreh = drehungen[di], neu = [], ok = true;
                for (var q = 0; q < len && ok; q++){
                  var k = zellen[q][0] + ',' + zellen[q][1], ch = w.b[dreh ? len - 1 - q : q];
                  if (feld[k] === undefined){ feld[k] = ch; neu.push(k); }
                  else if (feld[k] !== ch) ok = false;
                }
                if (ok){
                  benutzt.add(w); rest[len]--; summe -= len; anzahl--;
                  ergebnis.push({ wort:w, zellen:dreh ? zellen.slice().reverse() : zellen, ziffer:p.ziffer });
                  if (weiter(ende, u2, false)) return true;
                  ergebnis.pop(); benutzt.delete(w); rest[len]++; summe += len; anzahl++;
                }
                neu.forEach(function(k2){ delete feld[k2]; });
                if (schritte > 20000) return false;
              }
            }
          }
        }
        return false;
      }
      return weiter(0, p.ueb, true);
    }
    if (!stueck(0)) return null;
    // freie Stücke: beliebige übrige Wörter passender Länge
    leicht.forEach(function(p){
      var start = 0;
      mischen(p.laengen.slice(), rnd).forEach(function(len){
        var w = null;
        for (var i = 0; i < vorrat[len].length; i++) if (!benutzt.has(vorrat[len][i])){ w = vorrat[len][i]; break; }
        benutzt.add(w);
        var zellen = p.zellen.slice(start, start + len); start += len;
        if (o.rueckwaerts && rnd() < 0.5) zellen = zellen.slice().reverse();
        ergebnis.push({ wort:w, zellen:zellen, ziffer:p.ziffer });
      });
    });
    return ergebnis;
  }

  // Mehrere Versuche: andere Reihenfolge der Wörter, andere Überlappungsstellen, und kein Wort soll doppelt vorkommen
  function setzen(){
    var belegung = null;
    for (var t = 0; t < 12 && !belegung; t++) belegung = verteilen(stueckeImFeld());
    if (!belegung) return null;
    gitter = []; belegt = []; gesetzt = [];
    for (r0 = 0; r0 < zeilen; r0++){ gitter.push(new Array(spalten).fill('')); belegt.push(new Array(spalten).fill(false)); }
    belegung.forEach(function(b){
      b.zellen.forEach(function(rc, q){ gitter[rc[0]][rc[1]] = b.wort.b[q]; belegt[rc[0]][rc[1]] = true; });
      gesetzt.push({ text:b.wort.text, b:b.wort.b, zellen:b.zellen, ziffer:b.ziffer });
    });
    var eigen = {}, doppelt = [];
    gesetzt.forEach(function(g){ eigen[schluessel(g.zellen)] = true; });
    gesetzt.forEach(function(g){ if (vorkommen(g.b).some(function(z){ return !eigen[schluessel(z)]; })) doppelt.push(g.text); });
    return { eigen:eigen, doppelt:doppelt };
  }
  var info = null, best = null;
  for (var versuch = 0; versuch < 25; versuch++){
    info = setzen();
    if (!info) break;
    if (!best || info.doppelt.length < best.info.doppelt.length) best = { info:info, gitter:gitter, belegt:belegt, gesetzt:gesetzt };
    if (!info.doppelt.length) break;
  }
  if (!best) return null;
  info = best.info; gitter = best.gitter; belegt = best.belegt; gesetzt = best.gesetzt;
  var gedreht = lage.some(function(l){ return l !== 0; });

  // Füllbuchstaben: Mischung aus deutscher Häufigkeit und den Buchstaben der Wörter
  var zaehl = {}, total = 0, gewichte = {}, buchst = [], summe = 0, umlaute = false;
  woerter.forEach(function(w){ w.b.forEach(function(ch){ zaehl[ch] = (zaehl[ch] || 0) + 1; total++; if ('ÄÖÜ'.indexOf(ch) >= 0) umlaute = true; }); });
  var sq = 0; Object.keys(HAEUFIG).forEach(function(ch){ if ('ÄÖÜ'.indexOf(ch) < 0 || umlaute) sq += Math.sqrt(HAEUFIG[ch]); });
  Object.keys(HAEUFIG).forEach(function(ch){ if ('ÄÖÜ'.indexOf(ch) < 0 || umlaute) gewichte[ch] = 0.65 * Math.sqrt(HAEUFIG[ch]) / sq; });
  Object.keys(zaehl).forEach(function(ch){ gewichte[ch] = (gewichte[ch] || 0) + 0.35 * zaehl[ch] / total; });
  Object.keys(gewichte).forEach(function(ch){ buchst.push(ch); summe += gewichte[ch]; });
  function zufall(){ var x = rnd() * summe; for (var i = 0; i < buchst.length; i++){ x -= gewichte[buchst[i]]; if (x <= 0) return buchst[i]; } return buchst[buchst.length - 1]; }
  for (r0 = 0; r0 < zeilen; r0++) for (c0 = 0; c0 < spalten; c0++) if (!belegt[r0][c0]) gitter[r0][c0] = zufall();

  // Zufällig entstandene Doppelungen über Füllbuchstaben auflösen
  for (var runde = 0; runde < 400; runde++){
    var geaendert = false;
    gesetzt.forEach(function(g){
      vorkommen(g.b).forEach(function(z){
        if (info.eigen[schluessel(z)]) return;
        var freie = z.filter(function(rc){ return !belegt[rc[0]][rc[1]]; });
        if (!freie.length) return;
        var rc = freie[Math.floor(rnd() * freie.length)], alt = gitter[rc[0]][rc[1]];
        for (var t = 0; t < 10 && gitter[rc[0]][rc[1]] === alt; t++) gitter[rc[0]][rc[1]] = zufall();
        geaendert = true;
      });
    });
    if (!geaendert) break;
  }
  return { zeilen:zeilen, spalten:spalten, gitter:gitter, woerter:gesetzt, zahlen:zahlen.slice(), positionen:pos, gedreht:gedreht, untereinander:zifUnter, doppelt:info.doppelt };
}

return { FORMEN:FORMEN, loese:loese, bauen:bauen, analyse:analyse, minWoerter:minWoerter, ueberlappInfo:ueberlappInfo, HMAX:HMAX };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var VORLAGE = `<div class="zs">
  <header class="zs-kopf">
    <p class="augenbraue">Rätselgenerator</p>
    <h1>Zahlen-Suchsel</h1>
    <p>Wörter verstecken: Wer alle findet und markiert, sieht die Lösungszahl.</p>
  </header>
  <div class="layout">
  <section class="spalte-eingabe" aria-label="Eingaben">
    ${Wortwahl.html(1)}

    <div class="karte">
      <div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span>
        <div><h2>Lösungszahl</h2><p>Diese Zahl entsteht, wenn alle Wörter markiert sind.</p></div>
      </div>
      <ol class="liste" id="zahlListe"></ol>
      <p class="bedarf" id="bedarf" aria-live="polite"></p>
      <div class="striche" aria-label="Mindestens nötige Wörter je Ziffer">
        <span>Wörter je Ziffer mindestens:</span>
        <span><b>1</b> 1</span><span><b>7</b> 2</span><span><b>4</b> 3</span><span><b>0 3 9</b> 4</span><span><b>2 5 6 8</b> 5</span>
      </div>
    </div>

    <div class="karte">
      <details class="optionen" id="optionen">
        <summary>Einstellungen</summary>
        <label class="opt"><input type="checkbox" id="optUeberlappen"><span>Wörter dürfen sich überlappen: der letzte Buchstabe eines Wortes ist zugleich der erste des nächsten</span></label>
        <label class="opt"><input type="checkbox" id="optVerschieden"><span>Ziffern dürfen unterschiedlich gross sein</span></label>
        <label class="opt"><input type="checkbox" id="optLiegen"><span>Ziffern dürfen liegen (zufällig um 90° gedreht)</span></label>
        <label class="opt"><input type="checkbox" id="optRueckwaerts"><span>Wörter auch rückwärts verstecken (schwieriger)</span></label>
        <label class="opt"><input type="checkbox" id="optSchraeg"><span>Die 1 darf ein schräges Fähnchen haben (ein Wort steht dann schräg)</span></label>
        <label class="opt"><input type="checkbox" id="optUmlaute"><span>Umlaute ersetzen (Ä → AE, Ö → OE, Ü → UE)</span></label>
        <label class="opt"><input type="checkbox" id="optWortliste"><span>Wörter auf dem Blatt auflisten</span></label>
        <label class="opt"><input type="checkbox" id="optLinien"><span>Gitterlinien zeichnen</span></label>
        <div class="opt-raster">
          <label for="optZiffern">Anordnung der Ziffern</label>
          <select id="optZiffern"><option value="neben">nebeneinander (horizontal)</option><option value="unter">untereinander (vertikal)</option></select>
          <label for="optAbstand">Abstand der Ziffern</label>
          <select id="optAbstand"><option value="1">1 Feld</option><option value="2">2 Felder</option><option value="3">3 Felder</option></select>
          <label for="optRand">Rand um die Zahlen</label>
          <select id="optRand"><option value="1">1 Feld</option><option value="2">2 Felder</option><option value="3">3 Felder</option><option value="4">4 Felder</option><option value="5">5 Felder</option></select>
        </div>
      </details>
    </div>

    <button type="button" class="btn primary gross" id="los">Suchsel erstellen</button>
  </section>

  <section class="ausgabe" aria-label="Ergebnis">
    <div id="meldung" aria-live="polite"></div>
    <div class="leer-zustand" id="leer">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><rect x="1" y="1" width="54" height="54" rx="12" fill="#FFF1E5" stroke="#F7CBA3"/><g fill="#A0968E"><circle cx="14" cy="14" r="2"/><circle cx="28" cy="14" r="2"/><circle cx="42" cy="14" r="2"/><circle cx="14" cy="28" r="2"/><circle cx="28" cy="28" r="2"/><circle cx="42" cy="28" r="2"/><circle cx="14" cy="42" r="2"/><circle cx="28" cy="42" r="2"/><circle cx="42" cy="42" r="2"/></g><path d="M14 14h28v28" stroke="#F28C38" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/></svg>
      <h2>Noch kein Suchsel</h2>
      <p>In drei Schritten zum Arbeitsblatt:</p>
      <ol>
        <li>Thema eingeben, Wörter vorschlagen lassen und übernehmen – oder eigene eingeben</li>
        <li>Lösungszahl eintragen, z. B. 7 oder 2026</li>
        <li>«Suchsel erstellen» klicken</li>
      </ol>
    </div>
    <div class="werkzeug" id="werkzeug" hidden>
      <button type="button" class="btn klein" id="mischen" title="Gleiche Wörter und Zahlen, neue Anordnung">Neu mischen</button>
      <button type="button" class="btn klein" id="zeigeLoesung" aria-pressed="false">Lösung zeigen</button>
      <button type="button" class="btn klein" id="markWeg">Markierungen löschen</button>
      <span class="abstand"></span>
      <label><input type="checkbox" id="mitLoesung"> mit Lösungsblatt</label>
      <button type="button" class="btn klein primary" id="drucken">Drucken</button>
      <button type="button" class="btn klein primary" id="herunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>
    </div>
    <article class="blatt" id="blatt" hidden>
      <h2 id="blattTitel"></h2>
      <p class="anleitung" id="anleitung"></p>
      <div class="gitter-rahmen" id="gitterRahmen"></div>
      <div class="woerter-box" id="woerterBox">
        <h3>Diese Wörter sind versteckt:</h3>
        <ul class="blatt-woerter" id="blattWoerter"></ul>
      </div>
      <div class="loesungszeile" id="loesungszeile"></div>
      <p class="fortschritt" id="fortschritt" aria-live="polite"></p>
    </article>
    <article class="blatt loesungsblatt" id="loesungsblatt" aria-hidden="true">
      <h2 id="loesungTitel"></h2>
      <div class="gitter-rahmen" id="loesungRahmen"></div>
      <div class="loesungszeile" id="loesungWert"></div>
    </article>
  </section>
  </div>
</div>`;

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><g fill="currentColor" opacity=".45"><circle cx="4" cy="4" r="1.6"/><circle cx="11" cy="4" r="1.6"/><circle cx="18" cy="4" r="1.6"/><circle cx="4" cy="11" r="1.6"/><circle cx="11" cy="11" r="1.6"/><circle cx="18" cy="11" r="1.6"/><circle cx="4" cy="18" r="1.6"/><circle cx="11" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></g><path d="M4 4h14v14" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

Labor.registriere({
  id:'zahlen-suchsel',
  titel:'Zahlen-Suchsel',
  kurz:'Versteckte Wörter ergeben markiert eine Zahl',
  beschreibung:'Ein Suchsel mit Lösungszahl: Die versteckten Wörter bilden zusammen die Ziffern einer Zahl. Wörter selbst eingeben oder zu jedem Thema vorschlagen lassen.',
  merkmale:['Wortvorschläge zum Thema', 'Lösungszahl frei wählbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/zahlen-suchsel/zahlen-suchsel.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var aus = false;
  var $ = function(s){ return document.querySelector(s); };
  var SPEICHER = 'zahlen-suchsel-v2', SPEICHER_TAB = 'zahlen-suchsel-eingaben', SPEICHER_OPT = 'zahlen-suchsel-einstellungen';
  var STANDARD = { rueckwaerts:false, schraeg:true, umlaute:false, wortliste:true, linien:true, anordnung:'neben', abstand:1, rand:2, mitLoesung:true,
    ueberlappen:true, verschieden:false, liegen:false, ziffern:'neben' };
  var FARBEN = ['#FAD852', '#68D77E', '#63C2EA', '#F7A25D', '#F27A8A', '#C4B5FD', '#5EEAD4', '#D8BC94'];
  var S = 10, NS = 'http://www.w3.org/2000/svg';
  var ZAHLWORT = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht'];

  /* ---------- Zustand ---------- */
  var st = laden();
  /* Thema, Wörter und Lösungszahl (sessionStorage) und Einstellungen (localStorage) bleiben erhalten, solange die Seite
     offen ist – auch beim Wechsel zu einem anderen Generator. Beim Neuladen löscht Labor.start() alles. */
  function laden(){
    var d = { titel:'', woerter:[], zahlen:[''], opt:Object.assign({}, STANDARD) }, e = null;
    try {
      // frühere Speicherung (alles in localStorage): Einstellungen übernehmen, Wörter verwerfen
      var alt = JSON.parse(localStorage.getItem(SPEICHER));
      if (alt && alt.opt) Object.assign(d.opt, alt.opt);
      localStorage.removeItem(SPEICHER);
    } catch(x){}
    try { var o = JSON.parse(localStorage.getItem(SPEICHER_OPT)); if (o) Object.assign(d.opt, o); } catch(x){}
    try { e = JSON.parse(sessionStorage.getItem(SPEICHER_TAB)); } catch(x){}
    if (e && Array.isArray(e.woerter) && Array.isArray(e.zahlen)){
      d.titel = String(e.titel || '');
      d.woerter = e.woerter.filter(function(w){ return String(w || '').trim(); });
      d.zahlen = [String(e.zahlen.filter(function(z){ return String(z || '').trim(); })[0] || '')];   // nur eine Lösungszahl
    }
    return d;
  }
  var speicherTimer = 0;
  function speichernJetzt(){
    clearTimeout(speicherTimer); speicherTimer = 0;
    try { sessionStorage.setItem(SPEICHER_TAB, JSON.stringify({ titel:st.titel, woerter:st.woerter, zahlen:st.zahlen })); } catch(x){}
    try { localStorage.setItem(SPEICHER_OPT, JSON.stringify(st.opt)); } catch(x){}
  }
  function speichern(){
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(speichernJetzt, 200);
  }

  /* ---------- Hilfen ---------- */
  function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function aufzaehlung(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1]; }
  function norm(t){
    var s = String(t || '').normalize('NFC').toLocaleUpperCase('de-CH');
    if (st.opt.umlaute) s = s.replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    return s.replace(/[^\p{L}]/gu, '');
  }
  function rueckwaerts(t){ return Array.from(t).reverse().join(''); }
  /* Liest die Wörter aus: gültig, zu kurz, doppelt, und Wörter, die in anderen stecken */
  function auswerten(){
    var gesehen = {}, gut = [], kurz = [], doppelt = [], teil = [];
    st.woerter.forEach(function(t){
      var s = norm(t);
      if (!s) return;
      var b = Array.from(s);
      if (b.length < 2){ kurz.push(String(t).trim()); return; }
      if (gesehen[s]){ doppelt.push(String(t).trim()); return; }
      gesehen[s] = true; gut.push({ text:s, b:b });
    });
    gut.forEach(function(a){ gut.forEach(function(b){
      if (a !== b && (b.text.indexOf(a.text) >= 0 || b.text.indexOf(rueckwaerts(a.text)) >= 0)) teil.push([a.text, b.text]);
    }); });
    var buchstaben = gut.reduce(function(s, w){ return s + w.b.length; }, 0);
    return { woerter:gut, kurz:kurz, doppelt:doppelt, teil:teil, buchstaben:buchstaben };
  }
  function zahlenListe(){ return st.zahlen.map(function(z){ return String(z || '').replace(/\D/g, ''); }).filter(Boolean); }
  function minWoerterZahl(z){ return z.split('').reduce(function(s, d){ return s + Kern.minWoerter(d); }, 0); }
  function zahlWort(n, eins, mehr){ return n === 1 ? eins : mehr; }

  /* ---------- Thema und Wörter (gemeinsamer Baustein gemeinsam/wortwahl.js) ---------- */
  var ww = Wortwahl.verbinde(bereich, {
    zustand:st, norm:norm,
    geaendert:function(notiz){ geaendert(notiz); },
    titelGeaendert:function(){ speichern(); if (aktuell) blattBeschriften(); }
  });
  function zeichneWoerter(){ ww.zeichne(); }

  /* ---------- Eingabe: Zahlen ---------- */
  function zeichneZahlen(fokus){
    var ol = $('#zahlListe'); ol.innerHTML = '';
    var li = document.createElement('li');
    li.innerHTML = '<input type="text" class="zahl" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="z. B. 7 oder 2026" aria-label="Lösungszahl">' +
      '<span class="chip"></span>';
    var inp = li.querySelector('input');
    inp.value = st.zahlen[0] || '';
    inp.addEventListener('input', function(){
      var sauber = inp.value.replace(/\D/g, '');
      if (sauber !== inp.value) inp.value = sauber;
      st.zahlen = [sauber]; geaendert();
    });
    inp.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); erstellen(); } });
    ol.appendChild(li);
    if (fokus != null) inp.focus();
    infoAktualisieren();
  }

  /* ---------- Live-Hinweise ---------- */
  function infoAktualisieren(){
    var a = auswerten(), N = a.woerter.length, teile = [];
    $('#wortZaehler').textContent = N ? N + ' · ' + a.buchstaben + ' Buchstaben' : '';
    if (wortNotiz) teile.push(wortNotiz);
    if (a.kurz.length) teile.push('Zu kurz, wird weggelassen: ' + a.kurz.map(esc).join(', '));
    if (a.doppelt.length) teile.push('Doppelt, wird weggelassen: ' + a.doppelt.map(esc).join(', '));
    $('#wortInfo').innerHTML = teile.join(' · ');

    var chips = document.querySelectorAll('#zahlListe .chip');
    st.zahlen.forEach(function(z, i){
      var c = chips[i]; if (!c) return;
      z = String(z || '').replace(/\D/g, '');
      c.textContent = z ? 'mind. ' + minWoerterZahl(z) + ' Wörter' : '';
      c.hidden = !z;
    });
    var zahlen = zahlenListe(), box = $('#bedarf');
    if (!zahlen.length){ box.className = 'bedarf schlecht'; box.textContent = 'Gib mindestens eine Lösungszahl ein.'; return; }
    var noetig = zahlen.reduce(function(s, z){ return s + minWoerterZahl(z); }, 0), gut = noetig + 2;
    var was = zahlen.length === 1 ? 'Die Zahl ' + zahlen[0] + ' braucht' : 'Die Zahlen brauchen zusammen';
    if (N < noetig){
      box.className = 'bedarf schlecht';
      box.textContent = was + ' mindestens ' + noetig + ' Wörter (jeder Strich mindestens eines). Es ' + zahlWort(noetig - N, 'fehlt', 'fehlen') + ' noch ' + (noetig - N) + '.';
    } else if (N < gut){
      box.className = 'bedarf knapp';
      box.textContent = was + ' mindestens ' + noetig + ' Wörter – du hast ' + N + '. Das ist knapp; mit ' + gut + ' oder mehr klappt es fast immer.';
    } else {
      box.className = 'bedarf gut';
      box.textContent = was + ' mindestens ' + noetig + ' Wörter – du hast ' + N + '. Das reicht gut.';
    }
  }
  var wortNotiz = '';
  function geaendert(notiz){
    wortNotiz = notiz || '';
    speichern(); infoAktualisieren();
    if (aktuell) $('#blatt').classList.add('veraltet');
  }

  /* ---------- Einstellungen ---------- */
  var OPT_FELDER = {
    rueckwaerts:'#optRueckwaerts', schraeg:'#optSchraeg', umlaute:'#optUmlaute', wortliste:'#optWortliste', linien:'#optLinien',
    abstand:'#optAbstand', rand:'#optRand', mitLoesung:'#mitLoesung',
    ueberlappen:'#optUeberlappen', verschieden:'#optVerschieden', liegen:'#optLiegen', ziffern:'#optZiffern'
  };
  Object.keys(OPT_FELDER).forEach(function(k){
    var el = $(OPT_FELDER[k]);
    if (el.type === 'checkbox') el.checked = !!st.opt[k]; else el.value = String(st.opt[k]);
    el.addEventListener('change', function(){
      st.opt[k] = el.type === 'checkbox' ? el.checked : (k === 'anordnung' || k === 'ziffern' ? el.value : parseInt(el.value, 10));
      speichern();
      if (k === 'umlaute'){ zeichneWoerter(); infoAktualisieren(); }
      if (!aktuell || k === 'mitLoesung') return;
      if (k === 'wortliste' || k === 'linien') anzeigen();                       // nur neu zeichnen
      else if (k === 'anordnung' || k === 'ziffern' || k === 'liegen' || k === 'abstand' || k === 'rand' || (k === 'rueckwaerts' && !st.opt.ueberlappen)) neuBauen(); // gleiche Verteilung, neues Feld
      else erstellen();                                                          // Wörter oder Formen ändern sich
    });
  });

  /* ---------- Meldungen ---------- */
  function meldung(art, html){
    var m = $('#meldung');
    if (!html){ m.innerHTML = ''; leerZustand(); return null; }
    m.innerHTML = '<div class="meldung ' + art + '">' + html + '</div>';
    leerZustand();
    return m.firstChild;
  }
  function leerZustand(){ $('#leer').hidden = !!aktuell || !!$('#meldung').innerHTML; }

  /* ---------- Erstellen ---------- */
  var lauf = 0, aktuell = null;
  function bauOpt(){ return { rueckwaerts:st.opt.rueckwaerts, abstand:st.opt.abstand, rand:st.opt.rand, ziffern:st.opt.ziffern, liegen:st.opt.liegen }; }
  function suchOpt(woerter, mitUeberlapp){
    return { schraeg:st.opt.schraeg, verschieden:st.opt.verschieden,
      ueberlapp:mitUeberlapp && st.opt.ueberlappen ? Kern.ueberlappInfo(woerter, st.opt.rueckwaerts) : null };
  }
  /* Verteilung suchen und Feld bauen. Mit Überlappungen zwei Versuche; klappt es nicht, ohne Überlappungen. */
  function planen(zahlen, woerter, zeit){
    var ziffern = zahlen.join('').split(''), laengen = woerter.map(function(w){ return w.b.length; }), zeitWeg = false;
    var stufen = st.opt.ueberlappen ? [true, true, false] : [false];
    for (var i = 0; i < stufen.length; i++){
      var o = suchOpt(woerter, stufen[i]);
      if (stufen[i] && !(o.ueberlapp && o.ueberlapp.max)) continue;
      o.zeit = stufen[i] ? zeit * 0.4 : zeit;
      var r = Kern.loese(ziffern, laengen, o);
      if (!r.ok){ zeitWeg = zeitWeg || r.zeit; continue; }
      var feld = Kern.bauen(zahlen, r, woerter, bauOpt());
      if (feld) return { ok:true, loesung:r, feld:feld };
    }
    return { ok:false, zeit:zeitWeg };
  }
  function beschaeftigt(ja){ var b = $('#los'); b.disabled = ja; b.textContent = ja ? 'Einen Moment …' : 'Suchsel erstellen'; $('#mischen').disabled = ja; }

  function erstellen(){
    var token = ++lauf, a = auswerten(), zahlen = zahlenListe();
    if (!a.woerter.length){ meldung('fehler', '<h3>Noch keine Wörter</h3><p>Gib zuerst einige Wörter zur Kategorie ein.</p>'); return; }
    if (!zahlen.length){ meldung('fehler', '<h3>Noch keine Lösungszahl</h3><p>Gib mindestens eine Zahl ein, die beim Markieren entstehen soll.</p>'); return; }
    var ziffern = zahlen.join('').split(''), laengen = a.woerter.map(function(w){ return w.b.length; });
    var an = Kern.analyse(ziffern, laengen, suchOpt(a.woerter, true));
    beschaeftigt(true);
    meldung('info', '<p><span class="lade" aria-hidden="true"></span>Die Wörter werden auf die Striche der Ziffern verteilt …</p>');
    setTimeout(function(){
      if (token !== lauf) return;
      var r = an.woerter >= an.minWoerter ? planen(zahlen, a.woerter, 2500) : { ok:false };
      beschaeftigt(false);
      if (r.ok){
        aktuell = { zahlen:zahlen, woerter:a.woerter, auswertung:a, loesung:r.loesung, feld:r.feld };
        zeigeNeu();
        return;
      }
      aktuell = null; $('#blatt').hidden = true; $('#werkzeug').hidden = true; leerZustand();
      var grund = an.woerter < an.minWoerter ? 'zuWenig' : an.buchstaben < an.minBuchstaben ? 'zuKurz' : an.buchstaben > an.maxBuchstaben ? 'zuViel' : 'passtNicht';
      zeigeFehler(zahlen, a, an, grund, r.zeit, token);
    }, 40);
  }

  function neuBauen(){
    if (!aktuell) return;
    var feld = null;
    for (var t = 0; t < 6 && !feld; t++) feld = Kern.bauen(aktuell.zahlen, aktuell.loesung, aktuell.woerter, bauOpt());
    if (!feld){ erstellen(); return; }      // die geplanten Überlappungen gehen mit dieser Anordnung nicht: neu verteilen
    aktuell.feld = feld;
    zeigeNeu();
  }
  function zeigeNeu(){
    spiel = { gefunden:{}, anzahl:0, start:null };
    $('#zeigeLoesung').setAttribute('aria-pressed', 'false');
    $('#blatt').classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    anzeigen();
    erfolgsMeldung();
  }

  /* ---------- Wenn eine Zahl nicht geht: erklären und Alternativen suchen ---------- */
  function zeigeFehler(zahlen, a, an, grund, zeit, token){
    var N = an.woerter, wer = zahlen.length === 1 ? 'Die Zahl <b>' + zahlen[0] + '</b> lässt' : 'Die Zahlen <b>' + aufzaehlung(zahlen) + '</b> lassen';
    var html = '<h3>' + wer + ' sich mit diesen Wörtern nicht bilden.</h3>';
    if (grund === 'zuWenig'){
      var teile = [];
      zahlen.join('').split('').forEach(function(d){ teile.push(d + ': ' + Kern.minWoerter(d)); });
      html += '<p><b>Zu wenige Wörter.</b> Jeder Strich einer Ziffer braucht mindestens ein Wort. Zusammen sind das mindestens <b>' + an.minWoerter +
        '</b> Wörter (' + teile.join(', ') + '), du hast ' + N + '.</p>';
    } else if (grund === 'zuKurz'){
      html += '<p><b>Die Wörter sind zu kurz.</b> Zusammen haben sie ' + an.buchstaben + ' Buchstaben; um diese Ziffern zu zeichnen, braucht es mindestens ' + an.minBuchstaben + '.</p>';
    } else if (grund === 'zuViel'){
      html += '<p><b>Zu viele Buchstaben für diese Ziffern.</b> Die Zahl würde riesig: ' + an.buchstaben + ' Buchstaben, Platz ist für höchstens etwa ' + an.maxBuchstaben + '.</p>';
    } else {
      html += '<p><b>Die Wortlängen gehen nicht auf.</b> Jeder Strich muss lückenlos mit Wörtern gefüllt sein, und gleich lange Striche (z. B. oben und unten) brauchen passende Wortlängen. ' +
        (zeit ? 'In der verfügbaren Zeit wurde keine passende Verteilung gefunden.' : 'Mit diesen Wortlängen gibt es keine passende Verteilung.') + '</p>';
    }
    html += '<div class="alt-bereich"><p><span class="lade" aria-hidden="true"></span>Ich suche eine Lösung mit einer anderen Ziffer …</p></div>';
    var box = meldung('fehler', html);
    sucheAlternativen(zahlen, a, an, grund, token, box.querySelector('.alt-bereich'));
  }

  function segAbstand(x, y){
    var A = Kern.FORMEN[x][0], B = Kern.FORMEN[y][0], d = 0;
    'abcdefg'.split('').forEach(function(s){ if ((A.indexOf(s) >= 0) !== (B.indexOf(s) >= 0)) d++; });
    return d;
  }
  function sucheAlternativen(zahlen, a, an, grund, token, bereich){
    var laengen = a.woerter.map(function(w){ return w.b.length; }), N = laengen.length, kand = [];
    zahlen.forEach(function(z, zi){
      z.split('').forEach(function(d, pi){
        '0123456789'.split('').forEach(function(e){
          if (e === d) return;
          var minNeu = an.minWoerter - Kern.minWoerter(d) + Kern.minWoerter(e);
          if (minNeu > N) return;
          var wert;
          if (grund === 'zuViel') wert = -Kern.minWoerter(e) * 3 + segAbstand(d, e);
          else if (grund === 'zuWenig') wert = segAbstand(d, e) + Kern.minWoerter(e) * 0.3;
          else wert = segAbstand(d, e) + Math.abs(+e - +d) * 0.05;
          kand.push({ zi:zi, pi:pi, von:d, nach:e, wert:wert + Math.random() * 0.01 });
        });
      });
    });
    kand.sort(function(x, y){ return x.wert - y.wert; });
    var gefunden = [], i = 0, start = Date.now(), belegtePos = {}, runde = 1, rest = [];
    function schritt(){
      if (token !== lauf) return;
      var t0 = Date.now();
      while (gefunden.length < 3 && Date.now() - t0 < 80){
        if (i >= kand.length){
          if (runde === 1 && rest.length){ runde = 2; kand = rest; rest = []; i = 0; continue; }
          break;
        }
        var k = kand[i++], pos = k.zi + ':' + k.pi;
        if (runde === 1 && belegtePos[pos]){ rest.push(k); continue; }
        var neu = zahlen.slice();
        neu[k.zi] = neu[k.zi].slice(0, k.pi) + k.nach + neu[k.zi].slice(k.pi + 1);
        var r = planen(neu, a.woerter, 350);
        if (r.ok){ gefunden.push({ k:k, zahlen:neu, loesung:r.loesung, feld:r.feld }); belegtePos[pos] = true; }
      }
      var fertig = gefunden.length >= 3 || i >= kand.length || Date.now() - start > 8000;
      zeigeAlternativen(bereich, gefunden, fertig, zahlen, a, an, grund, token);
      if (!fertig) setTimeout(schritt, 0);
    }
    setTimeout(schritt, 0);
  }
  function zeigeAlternativen(bereich, gefunden, fertig, zahlen, a, an, grund, token){
    var html = '';
    if (gefunden.length){
      html += '<p><b>' + (gefunden.length === 1 ? 'Alternativlösung' : 'Alternativlösungen') + ' mit einer anderen Ziffer:</b></p><div class="alternativen">';
      gefunden.forEach(function(g, j){
        var alt = zahlen[g.k.zi], neu = g.zahlen[g.k.zi];
        var was = alt.length === 1 ? neu + ' statt ' + alt : 'statt ' + alt + ' (' + g.k.nach + ' statt ' + g.k.von + ')';
        html += '<button type="button" class="btn alt-knopf" data-j="' + j + '"><span class="gross">' + neu + '</span>' +
          '<span class="klein">' + was + ' · übernehmen</span></button>';
      });
      html += '</div>';
    }
    if (!fertig) html += '<p><span class="lade" aria-hidden="true"></span>Ich suche weitere Möglichkeiten …</p>';
    else {
      if (!gefunden.length) html += '<p>Auch mit einer anderen Ziffer an einer Stelle geht es nicht.</p>';
      var tipp = '';
      if (grund === 'zuWenig') tipp = 'Oder füge noch ' + (an.minWoerter - an.woerter) + ' ' + zahlWort(an.minWoerter - an.woerter, 'Wort', 'Wörter') + ' hinzu, dann geht die gewünschte Zahl.';
      else if (grund === 'zuViel') tipp = 'Oder entferne einige Wörter oder nimm eine Zahl mit mehr Ziffern, damit sich die Buchstaben verteilen.';
      else if (grund === 'zuKurz') tipp = 'Oder nimm ein paar längere Wörter dazu.';
      else tipp = 'Oder füge ein, zwei Wörter hinzu (bzw. entferne eines) – oft passt es dann schon.';
      html += '<p class="hinweis">' + tipp + '</p>';
    }
    bereich.innerHTML = html;
    [].forEach.call(bereich.querySelectorAll('.alt-knopf'), function(b){
      b.addEventListener('click', function(){
        var g = gefunden[+b.dataset.j];
        // Nur die Zahl ersetzen, die betroffen ist
        var zaehler = -1;
        for (var x = 0; x < st.zahlen.length; x++){
          if (String(st.zahlen[x] || '').replace(/\D/g, '')) zaehler++;
          if (zaehler === g.k.zi){ st.zahlen[x] = g.zahlen[g.k.zi]; break; }
        }
        zeichneZahlen(); speichern();
        if (token !== lauf || JSON.stringify(auswerten().woerter.map(function(w){ return w.text; })) !== JSON.stringify(a.woerter.map(function(w){ return w.text; }))){ erstellen(); return; }
        ++lauf;
        aktuell = { zahlen:g.zahlen, woerter:a.woerter, auswertung:a, loesung:g.loesung, feld:g.feld };
        zeigeNeu();
      });
    });
  }

  /* ---------- Erfolg ---------- */
  function erfolgsMeldung(){
    var f = aktuell.feld, a = aktuell.auswertung, html = '', hinweise = [];
    var ue = ueberlappungen(f);
    html += '<p><b>Fertig!</b> Feld mit ' + f.spalten + ' × ' + f.zeilen + ' Buchstaben, ' + f.woerter.length + ' Wörter' +
      (ue ? ', ' + ue + ' ' + zahlWort(ue, 'Überlappung', 'Überlappungen') : '') + '. ' +
      (f.zahlen.length === 1 ? 'Lösungszahl: ' : 'Lösungszahlen: ') + '<b>' + aufzaehlung(f.zahlen) + '</b>. ' +
      'Du kannst die Wörter direkt im Feld markieren (vom ersten bis zum letzten Buchstaben ziehen oder beide antippen).</p>';
    if (a.kurz.length || a.doppelt.length) hinweise.push('Weggelassen: ' + a.kurz.concat(a.doppelt).map(esc).join(', ') + ' (zu kurz oder doppelt).');
    if (f.doppelt.length) hinweise.push('Achtung: ' + aufzaehlung(f.doppelt.map(function(t){ return '«' + esc(t) + '»'; })) + ' kommt im Feld mehr als einmal vor. «Neu mischen» kann helfen.');
    var gesehen = {};
    a.teil.forEach(function(p){
      var k = p.join('|'); if (gesehen[k]) return; gesehen[k] = true;
      hinweise.push('«' + esc(p[0]) + '» steckt in «' + esc(p[1]) + '» – das kann beim Suchen verwirren.');
    });
    if (f.spalten > 34 || f.zeilen > 34){
      var tipps = ['eine Ziffer mit mehr Strichen (z. B. 8)', 'weniger Wörter'];
      var mehrstellig = f.zahlen.join('').length > 1;
      if (mehrstellig && st.opt.ziffern !== 'unter' && f.spalten > f.zeilen * 1.5) tipps.push('Ziffern «untereinander» (Einstellungen)');
      if (mehrstellig && st.opt.ziffern === 'unter' && f.zeilen > f.spalten * 1.5) tipps.push('Ziffern «nebeneinander» (Einstellungen)');
      hinweise.push('Das Feld ist recht gross. Viele Buchstaben auf wenige Striche machen die Zahl riesig – ' +
        tipps.slice(0, -1).join(', ') + ' oder ' + tipps[tipps.length - 1] + ' machen es kompakter.');
    }
    if (hinweise.length) html += '<ul>' + hinweise.map(function(h){ return '<li>' + h + '</li>'; }).join('') + '</ul>';
    meldung(hinweise.length ? 'warnung' : 'erfolg', html);
  }

  /* ---------- Anzeige ---------- */
  function el(tag, attrs, eltern){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function mitte(rc){ return [rc[1] * S + S / 2, rc[0] * S + S / 2]; }
  function kapsel(g, zellen, farbe, klasse){
    var a = mitte(zellen[0]), b = mitte(zellen[zellen.length - 1]);
    return el('line', { x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:farbe, 'stroke-width':S * 0.78, 'stroke-linecap':'round', 'class':'kapsel' + (klasse ? ' ' + klasse : '') }, g);
  }
  function baueSvg(f, art){
    var w = f.spalten * S, h = f.zeilen * S;
    var svg = el('svg', { viewBox:'0 0 ' + w + ' ' + h, 'class':'gitter', role:'img', style:'--spalten:' + f.spalten,
      'aria-label':'Buchstabenfeld mit ' + f.spalten + ' Spalten und ' + f.zeilen + ' Zeilen' });
    el('rect', { x:0, y:0, width:w, height:h, fill:'#fff' }, svg);
    var gL = el('g', { 'class':'ebene-loesung' }, svg);
    f.woerter.forEach(function(wort, i){ kapsel(gL, wort.zellen, FARBEN[i % FARBEN.length]); });
    if (art === 'spiel'){ el('g', { 'class':'ebene-markiert' }, svg); el('g', { 'class':'ebene-auswahl' }, svg); }
    if (st.opt.linien){
      var d = '';
      for (var c = 1; c < f.spalten; c++) d += 'M' + c * S + ' 0V' + h;
      for (var r = 1; r < f.zeilen; r++) d += 'M0 ' + r * S + 'H' + w;
      el('path', { d:d, stroke:'#E9E2DB', 'stroke-width':0.35, fill:'none' }, svg);
    }
    el('rect', { x:0.4, y:0.4, width:w - 0.8, height:h - 0.8, fill:'none', stroke:'#3D3530', 'stroke-width':0.7, rx:1.2 }, svg);
    var gT = el('g', { 'class':'ebene-text' }, svg);
    f.gitter.forEach(function(zeile, r){
      zeile.forEach(function(ch, c){ var t = el('text', { x:c * S + S / 2, y:r * S + S / 2 + 0.3 }, gT); t.textContent = ch; });
    });
    return svg;
  }
  function richtungen(f){
    var schraeg = false, rueck = false;
    f.woerter.forEach(function(w){
      var a = w.zellen[0], b = w.zellen[w.zellen.length - 1];
      if (a[0] !== b[0] && a[1] !== b[1]) schraeg = true;
      if (b[0] < a[0] || (a[0] === b[0] && b[1] < a[1])) rueck = true;
    });
    return { schraeg:schraeg, rueck:rueck };
  }
  function blattBeschriften(){
    var f = aktuell.feld, t = (st.titel || '').trim(), N = f.woerter.length, Z = f.zahlen.length, ri = richtungen(f);
    $('#blattTitel').textContent = t ? 'Suchsel: ' + t : 'Suchsel';
    $('#loesungTitel').textContent = 'Lösung' + (t ? ' – ' + t : '');
    var wie = 'waagrecht' + (ri.schraeg ? ', senkrecht oder schräg' : ' oder senkrecht') + (ri.rueck ? ', manche auch rückwärts' : '');
    var extra = [];
    if (ueberlappungen(f)) extra.push('Manche Wörter teilen sich einen Buchstaben.');
    if (f.gedreht) extra.push('Achtung: Manche Ziffern liegen quer.');
    if (f.untereinander && f.woerter.length && f.zahlen.some(function(z){ return z.length > 1; })) extra.push('Die Ziffern stehen untereinander – von oben nach unten lesen.');
    $('#anleitung').textContent = 'Finde die ' + N + ' versteckten Wörter' + (t ? ' zum Thema «' + t + '»' : '') + ' und markiere sie. Sie stehen ' + wie + '. ' +
      (extra.length ? extra.join(' ') + ' ' : '') +
      'Die markierten Felder ergeben ' + (Z === 1 ? 'eine Zahl. Wie heisst sie?' : (ZAHLWORT[Z] || Z) + ' Zahlen. Wie heissen sie?');
  }
  /* Anzahl Felder, die zwei Wörter gemeinsam haben */
  function ueberlappungen(f){
    var z = {}, n = 0;
    f.woerter.forEach(function(w){ w.zellen.forEach(function(rc){ var k = rc[0] + ',' + rc[1]; z[k] = (z[k] || 0) + 1; if (z[k] === 2) n++; }); });
    return n;
  }
  function anzeigen(){
    if (!aktuell || !aktuell.feld) return;
    var f = aktuell.feld;
    blattBeschriften();
    var svg = baueSvg(f, 'spiel');
    $('#gitterRahmen').innerHTML = ''; $('#gitterRahmen').appendChild(svg);
    spielEinrichten(svg);
    var ul = $('#blattWoerter'); ul.innerHTML = '';
    f.woerter.map(function(w, i){ return { text:w.text, i:i }; })
      .sort(function(x, y){ return x.text.localeCompare(y.text, 'de'); })
      .forEach(function(w){ var li = document.createElement('li'); li.textContent = w.text; li.dataset.i = w.i; if (spiel.gefunden[w.i]) li.classList.add('gefunden'); ul.appendChild(li); });
    $('#woerterBox').hidden = !st.opt.wortliste;
    $('#loesungszeile').innerHTML = (f.zahlen.length === 1 ? 'Lösungszahl:' : 'Lösungszahlen:') + f.zahlen.map(function(){ return ' <span class="linie"></span>'; }).join('');
    // Lösungsblatt zum Drucken
    $('#loesungRahmen').innerHTML = ''; $('#loesungRahmen').appendChild(baueSvg(f, 'loesung'));
    $('#loesungWert').innerHTML = (f.zahlen.length === 1 ? 'Lösungszahl:' : 'Lösungszahlen:') + ' <span class="wert">' + f.zahlen.join(' · ') + '</span>';
    // gefundene Wörter wieder einzeichnen
    var gM = svg.querySelector('.ebene-markiert'), n = 0;
    f.woerter.forEach(function(w, i){ if (spiel.gefunden[i]) kapsel(gM, w.zellen, FARBEN[n++ % FARBEN.length]); });
    $('#blatt').hidden = false; $('#werkzeug').hidden = false; leerZustand();
    fortschritt();
  }

  /* ---------- Markieren im Feld ---------- */
  var spiel = { gefunden:{}, anzahl:0, start:null };
  function schl(rc){ return rc[0] + ',' + rc[1]; }
  function spielEinrichten(svg){
    var f = aktuell.feld, gA = svg.querySelector('.ebene-auswahl'), zieh = null, temp = null, punkt = null;
    function zelle(e){
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
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
    function zeigeTemp(z){
      if (temp) temp.remove();
      temp = kapsel(gA, z, '#F28C38', 'auswahl');
    }
    function startPunkt(rc){
      if (punkt){ punkt.remove(); punkt = null; }
      if (rc){ var m = mitte(rc); punkt = el('circle', { cx:m[0], cy:m[1], r:S * 0.42, 'class':'startpunkt' }, gA); }
    }
    function pruefe(z){
      if (z.length < 2) return false;
      var k1 = z.map(schl).join(';'), k2 = z.slice().reverse().map(schl).join(';');
      for (var i = 0; i < f.woerter.length; i++){
        var wk = f.woerter[i].zellen.map(schl).join(';');
        if (wk === k1 || wk === k2){ if (!spiel.gefunden[i]) treffer(i); return true; }
      }
      return false;
    }
    function abschliessen(z){
      if (!pruefe(z) && z.length > 1 && temp){
        var t = temp; temp = null; t.classList.add('falsch'); setTimeout(function(){ t.remove(); }, 500);
      } else if (temp){ temp.remove(); temp = null; }
    }
    svg.addEventListener('pointerdown', function(e){
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      try { svg.setPointerCapture(e.pointerId); } catch(x){}
      zieh = { a:zelle(e), bewegt:false };
    });
    svg.addEventListener('pointermove', function(e){
      if (!zieh) return;
      var b = zelle(e);
      if (b[0] !== zieh.a[0] || b[1] !== zieh.a[1]) zieh.bewegt = true;
      if (zieh.bewegt){ startPunkt(null); zeigeTemp(linie(zieh.a, b)); }
    });
    function ende(e){
      if (!zieh) return;
      var a = zieh.a, b = zelle(e), bewegt = zieh.bewegt; zieh = null;
      if (bewegt && (a[0] !== b[0] || a[1] !== b[1])){ spiel.start = null; abschliessen(linie(a, b)); return; }
      // Antippen: erster Buchstabe, dann letzter Buchstabe
      if (temp){ temp.remove(); temp = null; }
      if (spiel.start && (spiel.start[0] !== b[0] || spiel.start[1] !== b[1])){
        var z = linie(spiel.start, b); spiel.start = null; startPunkt(null);
        zeigeTemp(z); abschliessen(z);
      } else if (spiel.start){ spiel.start = null; startPunkt(null); }
      else { spiel.start = b; startPunkt(b); }
    }
    svg.addEventListener('pointerup', ende);
    svg.addEventListener('pointercancel', function(){ zieh = null; if (temp){ temp.remove(); temp = null; } });
  }
  function treffer(i){
    var f = aktuell.feld, gM = $('#gitterRahmen .ebene-markiert');
    spiel.gefunden[i] = true;
    kapsel(gM, f.woerter[i].zellen, FARBEN[spiel.anzahl % FARBEN.length]);
    spiel.anzahl++;
    var li = $('#blattWoerter li[data-i="' + i + '"]'); if (li) li.classList.add('gefunden');
    fortschritt();
    if (spiel.anzahl === f.woerter.length){
      var b = $('#blatt'); b.classList.remove('geschafft'); void b.offsetWidth; b.classList.add('geschafft');
    }
  }
  function fortschritt(){
    var f = aktuell.feld, n = 0, p = $('#fortschritt');
    for (var k in spiel.gefunden) if (spiel.gefunden[k]) n++;
    spiel.anzahl = n;
    if (n === f.woerter.length){
      p.className = 'fortschritt fertig';
      p.textContent = '🎉 Geschafft! Alle Wörter gefunden – ' + (f.zahlen.length === 1 ? 'die Lösungszahl ist ' : 'die Lösungszahlen sind ') + aufzaehlung(f.zahlen) + '.';
    } else {
      p.className = 'fortschritt';
      p.textContent = n + ' von ' + f.woerter.length + ' Wörtern gefunden.';
    }
  }

  /* ---------- Werkzeuge ---------- */
  $('#los').addEventListener('click', erstellen);
  $('#mischen').addEventListener('click', erstellen);
  $('#zeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#blatt').classList.toggle('zeige-loesung', an);
  });
  $('#markWeg').addEventListener('click', function(){
    if (!aktuell) return;
    spiel = { gefunden:{}, anzahl:0, start:null };
    $('#blatt').classList.remove('geschafft');
    anzeigen();
  });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  $('#drucken').addEventListener('click', function(){ druckVorbereiten(); window.print(); });

  /* Alle Stilregeln der Seite (Labor und Generator) für die gespeicherte Datei */
  function sammleCss(){
    return [].map.call(document.styleSheets, function(s){
      if (s.disabled) return '';
      try { return [].map.call(s.cssRules, function(r){ return r.cssText; }).join('\n'); } catch(e){ return ''; }
    }).join('\n');
  }
  /* Als Artefakt läuft die Seite in einem Rahmen ohne Druckfunktion. Dort wird das Arbeitsblatt
     als eigene HTML-Datei gespeichert, die man öffnet und druckt. */
  function druckDatei(){
    var blatt = $('#blatt').cloneNode(true);
    blatt.removeAttribute('id'); blatt.classList.remove('veraltet', 'zeige-loesung', 'geschafft');
    [].forEach.call(blatt.querySelectorAll('.ebene-markiert, .ebene-auswahl, .ebene-loesung, .fortschritt'), function(e){ e.remove(); });
    [].forEach.call(blatt.querySelectorAll('.gefunden'), function(e){ e.classList.remove('gefunden'); });
    [].forEach.call(blatt.querySelectorAll('[id]'), function(e){ e.removeAttribute('id'); });
    var teile = blatt.outerHTML;
    if (st.opt.mitLoesung){
      var l = $('#loesungsblatt').cloneNode(true);
      l.removeAttribute('id'); l.removeAttribute('aria-hidden');
      [].forEach.call(l.querySelectorAll('[id]'), function(e){ e.removeAttribute('id'); });
      teile += l.outerHTML;
    }
    var t = (st.titel || '').trim();
    var css = sammleCss() +
      '\nbody{background:#f5f7fa}.seite{max-width:960px;margin:0 auto;padding:18px}' +
      '.leiste{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px;color:#6b7280;font-size:.9rem}' +
      '.loesungsblatt{display:block;margin-top:22px}svg.gitter{cursor:default}' +
      '@media print{.leiste{display:none}.seite{max-width:none;padding:0}.loesungsblatt{break-before:page;margin-top:0}}';
    return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc('Suchsel' + (t ? ' – ' + t : '')) + '</title>\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">\n' +
      '<style>' + css + '</style>\n</head>\n<body class="mit-loesung">\n<div class="seite">\n' +
      '<div class="leiste"><button class="btn primary" onclick="window.print()">Drucken</button><span>Tipp: Im Druckdialog «Hintergrundgrafiken» einschalten, damit das Lösungsblatt farbig wird.</span></div>\n' +
      teile + '\n</div>\n</body>\n</html>\n';
  }
  var speicherOrt = null;
  $('#herunterladen').addEventListener('click', function(){
    if (!aktuell || !speicherOrt) return;
    var t = (st.titel || '').trim().replace(/[^\p{L}\p{N} _-]+/gu, '').replace(/\s+/g, '-').slice(0, 40);
    var name = 'Suchsel' + (t ? '-' + t : '') + '-' + aktuell.feld.zahlen.join('-') + '.html';
    speicherOrt.save({ filename:name, data:druckDatei() }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });
  if (window.claude && typeof window.claude.use === 'function'){
    // Im Artefakt: kein Drucken, dafür Herunterladen (falls erlaubt)
    $('#drucken').hidden = true;
    Promise.resolve(window.claude.use('downloads')).then(function(d){
      if (!d || aus) return;
      speicherOrt = d; $('#herunterladen').hidden = false;
    }).catch(function(){});
  }

  /* ---------- Start ---------- */
  zeichneWoerter();
  zeichneZahlen();
  infoAktualisieren();
  if (auswerten().woerter.length && zahlenListe().length) erstellen(); else leerZustand();

  /* Beim Wechsel zu einem anderen Rätsel: laufende Suchen beenden und aufräumen */
  return function stopp(){
    aus = true; lauf++;
    ww.stopp();
    if (speicherTimer) speichernJetzt();
    window.removeEventListener('beforeprint', druckVorbereiten);
    document.body.classList.remove('mit-loesung');
  };
}
})();
