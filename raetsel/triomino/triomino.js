/* Rätsellabor – Generator «Triomino» (früher «Trimino»; alte Links …/#trimino öffnen ihn weiterhin)
   Dreieckige Spielsteine, die so aneinandergelegt werden, dass aufeinandertreffende Seiten zusammenpassen
   (Aufgabe und Ergebnis, Wort und Übersetzung …). Je nach Form entsteht ein Dreieck, ein Stern oder ein Sechseck.

   Formen (Dreiecksgitter): Dreieck klein 9 Teile / 9 Paare · Stern 12 / 12 · Dreieck gross 16 / 18 · Sechseck 24 / 30.
   Inhalte: Rechnen (+ − · : in Zahlenräumen), Dezimalbrüche ↔ Dezimalzahlen, Stellenwerte (farbige Ziffer ↔ «4 Hundertstel»),
   Brüche in Worten ↔ Brüche, Englisch, Französisch und eigene Paare (Wortlisten zum Einfügen).
   Blatt: Schnittbogen (die Teile liegen in der Form, aber vertauscht und gedreht – so schneidet man entlang gemeinsamer
   Linien und verrät die Lösung nicht) und Lösungsblatt (die fertige Figur). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var R3 = Math.sqrt(3) / 2;
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function zz(rnd, a, b){ return a + Math.floor(rnd() * (b - a + 1)); }

  /* ---------- Formen im Dreiecksgitter ----------
     Gitterpunkt (a, b) liegt bei x = a + b/2, y = −b·√3/2. Ein Dreieck ist eine Liste von drei Gitterpunkten
     (immer im gleichen Umlaufsinn), Kante k verbindet Ecke k mit Ecke k+1. */
  var FORMEN = {
    dreieck:{ name:'Dreieck klein', figur:'ein Dreieck', teile:9, paare:9 },
    stern:{ name:'Stern', figur:'ein Stern', teile:12, paare:12 },
    dreieckGross:{ name:'Dreieck gross', figur:'ein Dreieck', teile:16, paare:18 },
    sechseck:{ name:'Sechseck', figur:'ein Sechseck', teile:24, paare:30 }
  };
  function abstand(a, b){ return (Math.abs(a) + Math.abs(b) + Math.abs(a + b)) / 2; }   // Schritte vom Mittelpunkt
  function ecken(a, b, auf){ return auf ? [[a, b], [a + 1, b], [a, b + 1]] : [[a + 1, b], [a + 1, b + 1], [a, b + 1]]; }
  function dreiecke(form){
    var liste = [], a, b;
    if (form === 'dreieck' || form === 'dreieckGross'){
      var n = form === 'dreieck' ? 3 : 4;
      for (b = 0; b < n; b++) for (a = 0; a + b < n; a++){ liste.push(ecken(a, b, true)); if (a + b < n - 1) liste.push(ecken(a, b, false)); }
      return liste;
    }
    for (b = -3; b <= 3; b++) for (a = -3; a <= 3; a++) [true, false].forEach(function(auf){
      var e = ecken(a, b, auf), d = e.map(function(p){ return abstand(p[0], p[1]); }), max = Math.max.apply(null, d);
      var innen = d.filter(function(x){ return x <= 1; }).length;
      if (form === 'sechseck' ? max <= 2 : innen === 3 || (innen === 2 && max === 2)) liste.push(e);
    });
    return liste;
  }
  function punkt(p){ return [p[0] + p[1] / 2, -p[1] * R3]; }
  // gemeinsame Kanten (innen: zwei Dreiecke) und Randkanten (aussen); je [[dreieck, kante], …]
  function kanten(tris){
    var karte = {}, innen = [], aussen = [];
    tris.forEach(function(e, t){
      for (var k = 0; k < 3; k++){ var s = [String(e[k]), String(e[(k + 1) % 3])].sort().join('|'); (karte[s] = karte[s] || []).push([t, k]); }
    });
    Object.keys(karte).sort().forEach(function(s){ (karte[s].length === 2 ? innen : aussen).push(karte[s]); });
    return { innen:innen, aussen:aussen };
  }

  /* ---------- Paare auswählen ----------
     Ein Kandidat: { a, b, ka, kb } – a und b sind Inhalte ({ t:'3 + 4' } | { bruch:[3, 5] } | { zahl:'0.345', mark:3 }),
     ka und kb Schlüssel: Kein Schlüssel darf zweimal vorkommen, sonst passten zwei Teile an dieselbe Seite.
     quelle: Funktion (rnd, i) → Kandidat, oder Liste von Kandidaten. Ablenker: einzelne Hälften unbenutzter Kandidaten. */
  function auswahl(quelle, n, m, rnd){
    var paare = [], benutzt = {}, doppelt = false, ablenker = [];
    function frei(x){ return !benutzt[x.ka] && !benutzt[x.kb]; }
    function nimm(x){ benutzt[x.ka] = benutzt[x.kb] = true; }
    if (Array.isArray(quelle)){
      var liste = mischen(quelle.slice(), rnd);
      liste.forEach(function(x){ if (paare.length < n && frei(x)){ nimm(x); paare.push(x); } });
      liste.forEach(function(x){ if (ablenker.length < m && frei(x)){ nimm(x); ablenker.push(rnd() < 0.5 ? x.a : x.b); } });
      return { paare:mischen(paare, rnd), ablenker:ablenker, doppelt:false, fehlen:n - paare.length };
    }
    for (var i = 0; i < n; i++){
      var ok = null, v, x;
      for (v = 0; v < 800 && !ok; v++){ x = quelle(rnd, i); if (x && frei(x)) ok = x; }
      if (!ok){ for (v = 0; v < 400 && !ok; v++){ x = quelle(rnd, i); if (x && !benutzt[x.ka]) ok = x; } if (ok) doppelt = true; }
      if (!ok) break;
      nimm(ok); paare.push(ok);
    }
    for (var j = 0, w = 0; j < m && w < 3000; w++){ var z = quelle(rnd, j); if (z && frei(z)){ nimm(z); ablenker.push(rnd() < 0.5 ? z.a : z.b); j++; } }
    return { paare:mischen(paare, rnd), ablenker:ablenker, doppelt:doppelt, fehlen:n - paare.length };
  }

  /* ---------- Rechnen ---------- */
  function faktoren(zr, rnd){
    if (zr === 10){ var a = zz(rnd, 1, 5); return [a, zz(rnd, 1, Math.floor(10 / a))]; }
    if (zr === 20){ var a2 = zz(rnd, 2, 10); return [a2, zz(rnd, 1, Math.floor(20 / a2))]; }
    if (zr === 100) return [zz(rnd, 2, 10), zz(rnd, 2, 10)];
    var a3 = zz(rnd, 2, 9); return rnd() < 0.45 ? [a3, zz(rnd, 2, 9) * 10] : [a3, zz(rnd, 11, Math.floor(1000 / a3))];
  }
  function aufgabe(op, zr, rnd){
    var a, b, s;
    if (op === 'plus'){
      if (zr <= 20){ s = zz(rnd, 2, zr); a = zz(rnd, 1, s - 1); }
      else if (zr === 100){ s = zz(rnd, 20, 100); a = zz(rnd, 5, s - 5); }
      else { s = zz(rnd, 150, 1000); a = zz(rnd, 30, s - 30); }
      return { term:a + ' + ' + (s - a), wert:s };
    }
    if (op === 'minus'){
      if (zr <= 20){ a = zz(rnd, 2, zr); b = zz(rnd, 1, a - 1); }
      else if (zr === 100){ a = zz(rnd, 20, 100); b = zz(rnd, 5, a - 2); }
      else { a = zz(rnd, 150, 1000); b = zz(rnd, 20, a - 10); }
      return { term:a + ' − ' + b, wert:a - b };
    }
    var f = faktoren(zr, rnd);
    if (op === 'geteilt' && zr === 100 && rnd() < 0.5){ f[1] = zz(rnd, 2, Math.floor(100 / f[0])); }   // auch 84 : 4 – sonst gibt es nur 9 verschiedene Ergebnisse
    if (op === 'mal') return { term:f[0] + ' · ' + f[1], wert:f[0] * f[1] };
    return { term:(f[0] * f[1]) + ' : ' + f[0], wert:f[1] };
  }
  function rechnen(ops, zr){
    ops = ops && ops.length ? ops : ['plus'];
    return function(rnd, i){
      var op = rnd() < 0.8 ? ops[i % ops.length] : ops[Math.floor(rnd() * ops.length)], x = aufgabe(op, zr, rnd);
      return { a:{ t:x.term }, b:{ t:String(x.wert) }, ka:'t' + x.term, kb:'w' + x.wert };
    };
  }

  /* ---------- Dezimalbrüche ↔ Dezimalzahlen ---------- */
  function dezimal(z, k, sep){ var s = String(z); while (s.length < k + 1) s = '0' + s; return s.slice(0, -k) + sep + s.slice(-k); }
  function dezimalbrueche(stufe, sep){
    var ks = stufe === 1 ? [1] : stufe === 2 ? [1, 2] : [1, 2, 3];
    return function(rnd){
      var k = ks[Math.floor(rnd() * ks.length)], N = Math.pow(10, k), z;
      do { z = k === 1 ? zz(rnd, 1, 49) : zz(rnd, 1, rnd() < 0.85 ? N - 1 : 2 * N - 1); } while (z % 10 === 0);
      return { a:{ bruch:[z, N] }, b:{ t:dezimal(z, k, sep) }, ka:'b' + z + '/' + N, kb:'d' + z / N };
    };
  }

  /* ---------- Stellenwerte: Zahl mit farbiger Ziffer ↔ «4 Hundertstel» ---------- */
  var STELLEN = { '3':'Tausender', '2':'Hunderter', '1':'Zehner', '0':'Einer', '-1':'Zehntel', '-2':'Hundertstel', '-3':'Tausendstel' };
  function stellenwerte(art, sep){
    var plaetze = art === 'ganz' ? [0, 1, 2, 3] : art === 'dezimal' ? [0, -1, -2, -3] : [3, 2, 1, 0, -1, -2, -3];
    return function(rnd){
      var p = plaetze[Math.floor(rnd() * plaetze.length)], d = zz(rnd, 1, 9), vor, nach;
      if (art === 'ganz'){ vor = Math.max(p + 1, zz(rnd, 3, 4)); nach = 0; }
      else if (art === 'dezimal'){ vor = zz(rnd, 1, 2); nach = Math.max(-p, zz(rnd, 2, 3)); }
      else { vor = Math.max(p + 1, zz(rnd, 1, 4)); nach = Math.max(-p, zz(rnd, 0, 3)); }
      var ganz = '', bruch = '';
      for (var s = vor - 1; s >= -nach; s--){
        var z = s === p ? d : (s === vor - 1 && vor > 1) || (s === -nach && nach > 0) ? zz(rnd, 1, 9) : zz(rnd, 0, 9);
        if (s >= 0) ganz += z; else bruch += z;
      }
      var text = ganz + (nach ? sep + bruch : ''), mark = p >= 0 ? vor - 1 - p : vor - p;
      return { a:{ zahl:text, mark:mark }, b:{ t:d + ' ' + STELLEN[p] }, ka:'z' + text + '@' + mark, kb:'s' + d + '|' + p };
    };
  }

  /* ---------- Brüche in Worten ↔ Brüche ---------- */
  var ZAHLWORT = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn',
    'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig', 'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig'];
  var NENNER = { 2:'Halbe', 3:'Drittel', 4:'Viertel', 5:'Fünftel', 6:'Sechstel', 7:'Siebtel', 8:'Achtel', 9:'Neuntel', 10:'Zehntel', 11:'Elftel', 12:'Zwölftel' };
  function bruchWort(z, n){ return n === 2 ? (z === 1 ? 'ein Halb' : ZAHLWORT[z] + ' Halbe') : ZAHLWORT[z] + ' ' + NENNER[n]; }
  // Liste aller Brüche bis zum Nenner max; reichen die echten Brüche nicht für «bedarf», kommen unechte dazu (z. B. fünf Viertel)
  function brueche(max, bedarf){
    var liste = [], n, z;
    for (n = 2; n <= max; n++) for (z = 1; z < n; z++) liste.push([z, n]);
    if (liste.length < bedarf * 1.25) for (n = 2; n <= max; n++) for (z = n + 1; z < 2 * n; z++) liste.push([z, n]);
    return liste.map(function(b){ return { a:{ t:bruchWort(b[0], b[1]) }, b:{ bruch:b }, ka:'w' + b, kb:'b' + b }; });
  }

  /* ---------- Wortpaare (Englisch, Französisch, eigene) ----------
     Eine Zeile pro Paar, getrennt durch Tabulator, «;», «=», «:» oder « - ». Doppelte Wörter zählen nur einmal. */
  // Eine Zeile Text → [a, b] (b leer, wenn kein Trennzeichen da ist)
  function teilen(z){
    z = String(z || '').trim();
    var m = /\s*(?:\t|;|=|:|\s[-–—]\s)\s*/.exec(z);
    return m ? [z.slice(0, m.index).trim(), z.slice(m.index + m[0].length).trim()] : [z, ''];
  }
  // Liste [[a, b], …] → Paare; unvollständige Zeilen und doppelte Wörter werden gezählt, aber nicht verwendet
  function paareListe(liste){
    var paare = [], ohne = 0, doppelt = 0, gesehen = {};
    liste.forEach(function(x){
      var a = String(x[0] || '').trim(), b = String(x[1] || '').trim();
      if (!a && !b) return;
      if (!a || !b){ ohne++; return; }
      var ka = 'a' + a.toLowerCase(), kb = 'b' + b.toLowerCase();
      if (gesehen[ka] || gesehen[kb]){ doppelt++; return; }
      gesehen[ka] = gesehen[kb] = true;
      paare.push({ a:{ t:a }, b:{ t:b }, ka:ka, kb:kb });
    });
    return { paare:paare, ohne:ohne, doppelt:doppelt };
  }
  function wortpaare(text){ return paareListe(String(text || '').split(/\r?\n/).filter(function(z){ return z.trim(); }).map(teilen)); }

  /* ---------- Triomino bauen ----------
     → { tris, inhalt[t][k], plaetze: [{ teil, dreh }] (Schnittbogen), paare, aussen } */
  function belegen(form, paare, ablenker, rnd){
    var tris = dreiecke(form), k = kanten(tris), inhalt = tris.map(function(){ return [null, null, null]; });
    mischen(k.innen.slice(), rnd).forEach(function(kante, i){
      var p = paare[i]; if (!p) return;
      var tausch = rnd() < 0.5;
      inhalt[kante[0][0]][kante[0][1]] = tausch ? p.b : p.a;
      inhalt[kante[1][0]][kante[1][1]] = tausch ? p.a : p.b;
    });
    mischen(k.aussen.slice(), rnd).forEach(function(kante, i){ if (ablenker && i < ablenker.length) inhalt[kante[0][0]][kante[0][1]] = ablenker[i]; });
    // Schnittbogen: jedes Teil auf einen anderen Platz, gedreht (Kante k des Platzes zeigt Kante (k + dreh) % 3 des Teils)
    var reihe = tris.map(function(_, i){ return i; });
    for (var v = 0; v < 30; v++){ mischen(reihe, rnd); if (reihe.every(function(x, i){ return x !== i; })) break; }
    var plaetze = reihe.map(function(t){ return { teil:t, dreh:Math.floor(rnd() * 3) }; });
    return { tris:tris, inhalt:inhalt, plaetze:plaetze, innen:k.innen.length, aussen:k.aussen.length };
  }

  return { FORMEN:FORMEN, R3:R3, zufall:zufall, dreiecke:dreiecke, kanten:kanten, punkt:punkt, auswahl:auswahl,
    rechnen:rechnen, dezimalbrueche:dezimalbrueche, stellenwerte:stellenwerte, brueche:brueche, bruchWort:bruchWort, teilen:teilen, paareListe:paareListe, wortpaare:wortpaare, belegen:belegen };
})();
/* KERN-ENDE */

// zuerst das Fach; die Mathe-Themen erscheinen erst, wenn Mathe gewählt ist
var FAECHER = [['mathe', 'Mathe'], ['englisch', 'Englisch'], ['franzoesisch', 'Französisch'], ['eigene', 'Eigene Paare']];
var MATHE = [['rechnen', 'Rechnen'], ['dezimalbrueche', 'Dezimalbrüche'], ['stellenwerte', 'Stellenwerte'], ['brueche', 'Brüche in Worten']];
var MATHE_ARTEN = MATHE.map(function(m){ return m[0]; }).join(' ');
var SPRACHE = { englisch:['Deutsch', 'Englisch', 'Hund = dog'], franzoesisch:['Deutsch', 'Französisch', 'Hund = le chien'], eigene:['Begriff', 'Partner', 'Hauptstadt der Schweiz = Bern'] };
var FARBEN = [['#F28C38', 'Orange'], ['#C62828', 'Rot'], ['#1E63C4', 'Blau'], ['#2E7D32', 'Grün'], ['#7B3FB5', 'Lila'], ['#E3B505', 'Gelb'], ['#9E9E9E', 'Grau']];
var MARKE = '#D32F2F';   // farbige Ziffer bei den Stellenwerten
var TINTE = '#1C1714';

function chips(name, liste){ return liste.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }
function formBild(form){
  var tris = Kern.dreiecke(form), pts = [];
  tris.forEach(function(t){ t.forEach(function(p){ pts.push(Kern.punkt(p)); }); });
  var x0 = Math.min.apply(null, pts.map(function(p){ return p[0]; })), x1 = Math.max.apply(null, pts.map(function(p){ return p[0]; }));
  var y0 = Math.min.apply(null, pts.map(function(p){ return p[1]; })), y1 = Math.max.apply(null, pts.map(function(p){ return p[1]; }));
  return '<svg viewBox="' + (x0 - 0.1).toFixed(2) + ' ' + (y0 - 0.1).toFixed(2) + ' ' + (x1 - x0 + 0.2).toFixed(2) + ' ' + (y1 - y0 + 0.2).toFixed(2) + '" aria-hidden="true">' +
    tris.map(function(t){ return '<path d="M' + t.map(function(p){ var q = Kern.punkt(p); return q[0].toFixed(3) + ' ' + q[1].toFixed(3); }).join('L') + 'Z"/>'; }).join('') + '</svg>';
}

var VORLAGE = '<div class="tr">' +
  '<header class="tr-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Triomino</h1>' +
    '<p>Dreieckige Spielsteine: Aneinanderstossende Seiten müssen zusammenpassen, dann entsteht ein Dreieck, ein Stern oder ein Sechseck. Mit fertigen Mathe-Aufgaben oder deinen eigenen Wörtern.</p></header>' +
  '<div class="tr-layout"><section class="tr-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Form</h2></div></div>' +
      '<div class="tr-formen" role="radiogroup" aria-label="Form">' +
        Object.keys(Kern.FORMEN).map(function(k){ var f = Kern.FORMEN[k]; return '<label><input type="radio" name="trForm" value="' + k + '"><span>' + formBild(k) + '<b>' + f.name + '</b><small>' + f.teile + ' Teile · ' + f.paare + ' Paare</small></span></label>'; }).join('') +
      '</div></div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Inhalt</h2></div></div>' +
      '<p class="feld-label">Fach</p><div class="tr-chips" role="radiogroup" aria-label="Fach">' + chips('trFach', FAECHER) + '</div>' +
      '<div class="tr-teil" data-art="' + MATHE_ARTEN + '">' +
      '<p class="feld-label">Thema</p><div class="tr-chips" role="radiogroup" aria-label="Mathe-Thema">' + chips('trArt', MATHE) + '</div>' +
      '<div class="tr-unter" data-art="rechnen">' +
        '<p class="feld-label">Rechenarten</p><div class="tr-chips tr-mehr">' +
          [['plus', 'Plus +'], ['minus', 'Minus −'], ['mal', 'Mal ·'], ['geteilt', 'Geteilt :']].map(function(x){ return '<label><input type="checkbox" name="trOp" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
        '<p class="feld-label">Zahlenraum</p><div class="tr-chips">' + chips('trZr', [['10', 'bis 10'], ['20', 'bis 20'], ['100', 'bis 100'], ['1000', 'bis 1000']]) + '</div>' +
      '</div>' +
      '<div class="tr-unter" data-art="dezimalbrueche">' +
        '<p class="feld-label">Brüche</p><div class="tr-chips">' + chips('trDez', [['1', 'Zehntel'], ['2', 'bis Hundertstel'], ['3', 'bis Tausendstel']]) + '</div>' +
        '<p class="hinweis">z. B. 7/100 und 0.07</p>' +
      '</div>' +
      '<div class="tr-unter" data-art="stellenwerte">' +
        '<p class="feld-label">Zahlen</p><div class="tr-chips">' + chips('trStellen', [['dezimal', 'Dezimalzahlen'], ['ganz', 'Ganze Zahlen'], ['gemischt', 'Gemischt']]) + '</div>' +
        '<p class="hinweis">Eine Ziffer ist farbig, z. B. 0.3<b style="color:' + MARKE + '">4</b>5 und «4 Hundertstel».</p>' +
      '</div>' +
      '<div class="tr-unter" data-art="brueche">' +
        '<p class="feld-label">Nenner</p><div class="tr-chips">' + chips('trBruch', [['6', 'bis Sechstel'], ['10', 'bis Zehntel'], ['12', 'bis Zwölftel']]) + '</div>' +
        '<p class="hinweis">z. B. «drei Fünftel» und 3/5. Reichen die echten Brüche nicht, kommen unechte dazu (z. B. fünf Viertel).</p>' +
      '</div>' +
      '<div class="tr-unter" data-art="dezimalbrueche stellenwerte">' +
        '<p class="feld-label">Dezimaltrennzeichen</p><div class="tr-chips">' + chips('trSep', [['.', 'Punkt 0.5'], [',', 'Komma 0,5']]) + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="tr-teil" data-art="englisch franzoesisch eigene">' +
        '<div class="tr-paarliste" id="trPaarliste">' + Paarliste.html() + '</div>' +
        '<div class="tr-zaehler" id="trZaehler" aria-live="polite"></div>' +
      '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Gestaltung</h2></div></div>' +
      '<p class="feld-label">Aussenkanten</p><div class="tr-chips">' + chips('trRand', [['leer', 'leer (leichter)'], ['ablenker', 'mit Ablenkern (schwieriger)']]) + '</div>' +
      '<p class="hinweis" id="trRandInfo"></p>' +
      '<p class="feld-label">Farbe der Ecken</p>' +
      '<div class="tr-farben" role="radiogroup" aria-label="Farbe der Ecken">' +
        FARBEN.map(function(f){ return '<label title="' + f[1] + '"><input type="radio" name="trFarbe" value="' + f[0] + '"><span style="background:' + f[0] + '"></span><b class="vh">' + f[1] + '</b></label>'; }).join('') + '</div>' +
      '<div class="opt-raster"><label for="trTitel">Titel auf dem Blatt</label><input type="text" id="trTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="tr-ausgabe" aria-label="Ergebnis">' +
    '<div id="trMeldung" aria-live="polite"></div>' +
    '<div class="tr-werkzeug">' +
      '<button type="button" class="btn klein" id="trNeu" title="Neue Aufgaben und neue Verteilung">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="trZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="trMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="trPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="trHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="tr-blatt" id="trBlatt"></article>' +
    '<article class="tr-blatt tr-loesungsblatt" id="trLoesung" aria-hidden="true"></article>' +
    '<details class="tr-paare" id="trPaare"><summary>Verwendete Paare</summary><ol id="trPaarListe"></ol></details>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3 21 19H3z"/><path d="M7.5 11h9L12 19z"/></svg>';

Labor.registriere({
  id:'triomino',
  titel:'Triomino',
  kurz:'Dreieckige Legespiele mit Aufgaben und Lösungen',
  beschreibung:'Dreiecke, deren Seiten zusammenpassen müssen – am Schluss entsteht ein Dreieck, ein Stern oder ein Sechseck. Mit fertigen Mathe-Aufgaben oder eigenen Wörtern für Englisch und Französisch.',
  merkmale:['Vier Formen', 'Mathe fertig, Sprachen mit eigenen Wörtern', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/triomino/triomino.css',
  html:VORLAGE,
  start:starte
});

// alte Links …/#trimino → …/#triomino (läuft vor dem Labor, damit dieses gleich die richtige Seite zeigt)
function alterLink(){ if (location.hash === '#trimino') history.replaceState(null, '', location.pathname + location.search + '#triomino'); }
alterLink();
window.addEventListener('hashchange', alterLink);

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'triomino-eingaben', OPT = 'triomino-einstellungen';
  var STANDARD = { form:'stern', art:'rechnen', matheArt:'rechnen', ops:['plus', 'minus'], zr:'100', dez:'2', stellen:'dezimal', bruch:'10', sep:'.', rand:'leer', farbe:'#F28C38',
    mitLoesung:true, titelAn:true, anleitungAn:true };
  // zeilen[art]: [{ a, b, auto }] – auto: welche Seite automatisch übersetzt wurde ('a', 'b' oder '')
  var st = { titel:'', zeilen:{ englisch:[], franzoesisch:[], eigene:[] }, seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try {
    var e = JSON.parse(sessionStorage.getItem(TAB));
    if (e){
      st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed;
      Object.keys(st.zeilen).forEach(function(k){
        if (e.zeilen && Array.isArray(e.zeilen[k])) st.zeilen[k] = Paarliste.aufraeumen(e.zeilen[k]);
        else if (e.woerter && e.woerter[k]) st.zeilen[k] = String(e.woerter[k]).split(/\r?\n/).filter(function(z){ return z.trim(); }).map(function(z){ var t = Kern.teilen(z); return { a:t[0], b:t[1], auto:'' }; });   // früher: Textfeld
      });
    }
  } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, zeilen:st.zeilen, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#trMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function sprache(){ return !!SPRACHE[st.opt.art]; }

  /* ---------- Eingaben ---------- */
  function radios(name, k, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = r.value; speichern(); if (nachher) nachher(); erzeugen(); });
    });
  }
  if (!SPRACHE[st.opt.art] && MATHE_ARTEN.split(' ').indexOf(st.opt.art) < 0) st.opt.art = 'rechnen';
  if (MATHE_ARTEN.split(' ').indexOf(st.opt.matheArt) < 0) st.opt.matheArt = 'rechnen';
  function fach(){ return SPRACHE[st.opt.art] ? st.opt.art : 'mathe'; }
  [].forEach.call(bereich.querySelectorAll('input[name="trFach"]'), function(r){
    r.checked = r.value === fach();
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = r.value === 'mathe' ? st.opt.matheArt : r.value; speichern(); artZeigen(); erzeugen(); });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="trArt"]'), function(r){
    r.checked = r.value === st.opt.matheArt;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = st.opt.matheArt = r.value; speichern(); artZeigen(); erzeugen(); });
  });
  radios('trForm', 'form'); radios('trZr', 'zr'); radios('trDez', 'dez'); radios('trStellen', 'stellen');
  radios('trBruch', 'bruch'); radios('trSep', 'sep'); radios('trRand', 'rand'); radios('trFarbe', 'farbe');
  [].forEach.call(bereich.querySelectorAll('input[name="trOp"]'), function(c){
    c.checked = st.opt.ops.indexOf(c.value) >= 0;
    c.addEventListener('change', function(){
      var alle = [].filter.call(bereich.querySelectorAll('input[name="trOp"]'), function(x){ return x.checked; }).map(function(x){ return x.value; });
      if (!alle.length){ c.checked = true; return; }   // mindestens eine Rechenart
      st.opt.ops = alle; speichern(); erzeugen();
    });
  });
  $('#trTitel').value = st.titel;
  $('#trTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); });
  $('#trMitLoesung').checked = st.opt.mitLoesung;
  $('#trMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  var warte = 0;
  function baldErzeugen(){ clearTimeout(warte); warte = setTimeout(erzeugen, 250); }
  function artZeigen(){
    [].forEach.call(bereich.querySelectorAll('.tr-teil, .tr-unter'), function(d){ d.hidden = d.dataset.art.split(' ').indexOf(st.opt.art) < 0; });
    if (sprache()){
      var s = SPRACHE[st.opt.art];
      paarliste.zeigen();
    }
  }

  /* ---------- Wortpaare: Zeilen mit zwei Feldern (Baustein gemeinsam/paarliste.js, mit automatischer Übersetzung) ---------- */
  function zeilen(){ return st.zeilen[st.opt.art] || (st.zeilen[st.opt.art] = []); }
  function paare(){ return Kern.paareListe(zeilen().map(function(z){ return [z.a, z.b]; })); }
  var paarliste = Paarliste.starte($('#trPaarliste'), {
    liste:function(art){ return st.zeilen[art] || (st.zeilen[art] = []); },
    art:function(){ return st.opt.art; },
    sprache:function(art){ return art === 'englisch' || art === 'franzoesisch' ? art : null; },
    kopf:function(){ return SPRACHE[st.opt.art] || ['', '', '']; },
    hilfe:function(){ return 'Links der Begriff, rechts das Gegenstück – zum Beispiel «Hauptstadt der Schweiz» und «Bern».'; },
    geaendert:function(){ speichern(); baldErzeugen(); },
    aus:function(){ return aus; }
  });

  /* ---------- Triomino erzeugen ---------- */
  var trimino = null, info = null;
  function form(){ return Kern.FORMEN[st.opt.form] || Kern.FORMEN.stern; }
  function quelle(bedarf){
    var o = st.opt;
    if (o.art === 'rechnen') return Kern.rechnen(o.ops, +o.zr);
    if (o.art === 'dezimalbrueche') return Kern.dezimalbrueche(+o.dez, o.sep);
    if (o.art === 'stellenwerte') return Kern.stellenwerte(o.stellen, o.sep);
    if (o.art === 'brueche') return Kern.brueche(+o.bruch, bedarf);
    return paare().paare;
  }
  function zaehlerZeigen(){
    if (!sprache()) return;
    var w = paare(), n = w.paare.length, f = form(), fehlt = f.paare - n;
    var h = '<p class="tr-zaehler-haupt ' + (fehlt > 0 ? 'fehlt' : 'ok') + '"><b>' + n + '</b> ' + (n === 1 ? 'Paar' : 'Paare') + ' eingegeben · ' + f.name + ' braucht <b>' + f.paare + '</b>' +
      (fehlt > 0 ? ' – es fehlen noch <b>' + fehlt + '</b>.' : ' ✓') + '</p>';
    h += '<p class="tr-zaehler-formen">' + Object.keys(Kern.FORMEN).map(function(k){ var x = Kern.FORMEN[k]; return '<span class="' + (n >= x.paare ? 'ok' : '') + '">' + x.name + ': ' + x.paare + '</span>'; }).join('') + '</p>';
    if (fehlt < 0) h += '<p>' + (-fehlt) + ' Paare mehr als nötig: Es werden zufällig ' + f.paare + ' ausgewählt' + (st.opt.rand === 'ablenker' ? ', übrige Wörter dienen als Ablenker an den Aussenkanten.' : '.') + '</p>';
    var wartend = zeilen().filter(function(z){ return z.laedt; }).length;
    if (w.ohne > wartend) h += '<p class="warnung">' + (w.ohne - wartend) + ' Zeile' + (w.ohne - wartend > 1 ? 'n haben' : ' hat') + ' erst ein Wort – sie zählt, sobald beide Felder ausgefüllt sind.</p>';
    if (w.doppelt) h += '<p class="warnung">' + w.doppelt + ' doppelte' + (w.doppelt > 1 ? '' : 's') + ' Wort' + (w.doppelt > 1 ? 'e' : '') + ' nicht verwendet (sonst passten zwei Teile).</p>';
    $('#trZaehler').innerHTML = h;
  }
  function erzeugen(){
    if (aus) return;
    var f = form(), rnd = Kern.zufall(st.seed), tris = Kern.dreiecke(st.opt.form), k = Kern.kanten(tris);
    var ablenker = st.opt.rand === 'ablenker' ? k.aussen.length : 0;
    zaehlerZeigen();
    info = Kern.auswahl(quelle(f.paare + ablenker), f.paare, ablenker, rnd);
    $('#trRandInfo').textContent = st.opt.rand === 'ablenker' ? (sprache() && info.ablenker.length < k.aussen.length ? 'Für Ablenker braucht es zusätzliche Wortpaare (bis ' + k.aussen.length + '). Jetzt: ' + info.ablenker.length + '.' : 'An den Aussenkanten stehen Aufgaben oder Lösungen, die nirgends passen.') : 'Randteile erkennt man an den leeren Seiten.';
    if (info.fehlen > 0){
      trimino = null;
      $('#trBlatt').hidden = $('#trLoesung').hidden = $('#trPaare').hidden = true;
      ['#trZeigeLoesung', '#trPdf', '#trHerunterladen'].forEach(function(s){ $(s).disabled = true; });
      meldung(sprache() && !paare().paare.length ? 'info' : 'warnung', sprache()
        ? '<p>Für ' + (st.opt.form === 'stern' ? 'einen ' : st.opt.form === 'sechseck' ? 'ein ' : 'ein ') + esc(f.name) + ' braucht es <b>' + f.paare + ' Paare</b>' + (paare().paare.length ? ' – es fehlen noch ' + info.fehlen + '.' : '. Gib links deine Wortpaare ein.') + '</p>'
        : '<p>Mit diesen Einstellungen gibt es nicht genug verschiedene Aufgaben. Wähle einen grösseren Zahlenraum oder eine kleinere Form.</p>');
      return;
    }
    meldung(info.doppelt ? 'warnung' : '', info.doppelt ? '<p>Nicht genug verschiedene Ergebnisse: Einige kommen mehrmals vor – dann passen manchmal mehrere Teile an dieselbe Seite. Ein grösserer Zahlenraum oder mehr Rechenarten helfen.</p>' : '');
    $('#trBlatt').hidden = $('#trPaare').hidden = false; $('#trLoesung').hidden = false;
    ['#trZeigeLoesung', '#trPdf', '#trHerunterladen'].forEach(function(s){ $(s).disabled = false; });
    trimino = Kern.belegen(st.opt.form, info.paare, info.ablenker, rnd);
    zeichnen();
  }

  /* ---------- Zeichnen ----------
     Ein Teil hat die Seitenlänge S = 100. Jeder Text steht parallel zu seiner Kante, die Oberseite zur Mitte des Teils;
     die Schriftgrösse passt sich der verfügbaren Länge an (gemessen mit der Blattschrift, Standard Andika). */
  var S = 100, H = S * Kern.R3, messer = document.createElement('canvas').getContext('2d');
  function breite(t, fett){ messer.font = (fett ? '700' : '400') + ' 100px ' + Labor.blattSchrift('buchstaben'); return messer.measureText(t).width / 100; }
  function textInhalt(x){
    // → { b: Breite je Schriftgrösse 1, h: Zeilen, svg(fs) }
    if (x.bruch){
      var w = Math.max(breite(String(x.bruch[0])), breite(String(x.bruch[1]))) + 0.35;
      return { b:w, h:2, svg:function(fs){ return '<text y="' + (-0.24 * fs).toFixed(2) + '">' + x.bruch[0] + '</text><path d="M' + (-w * fs / 2).toFixed(2) + ' 0H' + (w * fs / 2).toFixed(2) + '" stroke="' + TINTE + '" stroke-width="' + (fs * 0.075).toFixed(2) + '"/><text y="' + (0.94 * fs).toFixed(2) + '">' + x.bruch[1] + '</text>'; } };
    }
    if (x.zahl){
      var t = x.zahl, vor = t.slice(0, x.mark), m = t.charAt(x.mark), nach = t.slice(x.mark + 1);
      return { b:breite(vor) + breite(m, true) + breite(nach), h:1, svg:function(fs){ return '<text y="' + (0.34 * fs).toFixed(2) + '">' + esc(vor) + '<tspan font-weight="700" fill="' + MARKE + '">' + esc(m) + '</tspan>' + esc(nach) + '</text>'; } };
    }
    return { b:breite(x.t), h:1, svg:function(fs){ return '<text y="' + (0.34 * fs).toFixed(2) + '">' + esc(x.t) + '</text>'; } };
  }
  /* Platz für einen Text: Er liegt als Band (Dicke d·fs) im Abstand RAND von seiner Kante. In der 60°-Ecke darf er nicht
     in das Band der Nachbarkante (Ausdehnung Enb) ragen: Ein Punkt im Abstand u von der Ecke und y von der eigenen Kante
     hat von der Nachbarkante den Abstand 0,866·u − 0,5·y. Daraus die nutzbare Länge L. */
  var RAND = 3.5;
  function darstellungen(x){
    if (!x) return null;
    var ti = textInhalt(x), arten = [{ b:ti.b, d:ti.h === 2 ? 2 : 1, kappe:ti.h === 2 ? 10 : 12, svg:ti.svg }];
    if (x.t && x.t.indexOf(' ') > 0){   // lange Wörter mit Leerzeichen: auch zweizeilig versuchen
      var w = x.t.split(' '), best = null;
      for (var k = 1; k < w.length; k++){ var a = w.slice(0, k).join(' '), b = w.slice(k).join(' '), bb = Math.max(breite(a), breite(b)); if (!best || bb < best.bb) best = { a:a, b:b, bb:bb }; }
      arten.push({ b:best.bb, d:2.15, kappe:10, zwei:true, svg:function(fs){ return '<text y="' + (-0.22 * fs).toFixed(2) + '">' + esc(best.a) + '</text><text y="' + (0.9 * fs).toFixed(2) + '">' + esc(best.b) + '</text>'; } });
    }
    return arten;
  }
  function laenge(E, Enb){ return Math.min(S * (1 - E / H) - 16, S - 2 * (Enb + 0.5 * E) / 0.866 - 4); }
  /* die drei Texte eines Teils: gemeinsame, möglichst grosse Schrift; für jeden Text ein- oder zweizeilig,
     je nachdem, was die grössere Schrift erlaubt (alle Kombinationen, Grösse jeweils durch Halbieren gesucht) */
  function teilTexte(P, C, inhalte){
    var arten = inhalte.map(darstellungen), best = null;
    function geht(wahl, fs){
      var E = wahl.map(function(a){ return a ? RAND + a.d * fs : 0; });
      return wahl.every(function(a, k){ return !a || (fs <= a.kappe && a.b * fs <= laenge(E[k], Math.max(E[(k + 1) % 3], E[(k + 2) % 3]))); });
    }
    (function probieren(k, wahl){
      if (k === 3){
        var lo = 0, hi = 12;
        for (var i = 0; i < 18; i++){ var m = (lo + hi) / 2; if (geht(wahl, m)) lo = m; else hi = m; }
        var zwei = wahl.filter(function(a){ return a && a.zwei; }).length;
        if (!best || lo > best.fs * (1 + 0.06 * (zwei - best.zwei))) best = { fs:lo, wahl:wahl.slice(), zwei:zwei };
        return;
      }
      if (!arten[k]){ wahl[k] = null; probieren(k + 1, wahl); return; }
      arten[k].forEach(function(a){ wahl[k] = a; probieren(k + 1, wahl); });
    })(0, [null, null, null]);
    var fs = Math.max(3, best.fs), lage = best.wahl.map(function(a){ return a ? { fs:fs, abst:RAND + a.d * fs / 2, svg:a.svg } : null; });
    return lage.map(function(l, k){
      if (!l) return '';
      var A = P[k], B = P[(k + 1) % 3], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], n = [C[0] - M[0], C[1] - M[1]], ln = Math.hypot(n[0], n[1]);
      n = [n[0] / ln, n[1] / ln];
      var winkel = Math.atan2(n[0], -n[1]) * 180 / Math.PI, Q = [M[0] + n[0] * l.abst, M[1] + n[1] * l.abst];   // Textrichtung (−n.y, n.x), Oberseite zur Mitte
      return '<g transform="translate(' + Q[0].toFixed(2) + ' ' + Q[1].toFixed(2) + ') rotate(' + winkel.toFixed(2) + ')" font-size="' + l.fs.toFixed(2) + '">' + l.svg(l.fs) + '</g>';
    }).join('');
  }
  function figurSvg(loesung){
    var t = trimino, farbe = st.opt.farbe, alle = [];
    var pos = t.tris.map(function(e){ return e.map(function(p){ var q = Kern.punkt(p); return [q[0] * S, q[1] * S]; }); });
    pos.forEach(function(p){ alle = alle.concat(p); });
    var x0 = Math.min.apply(null, alle.map(function(p){ return p[0]; })) - 3, x1 = Math.max.apply(null, alle.map(function(p){ return p[0]; })) + 3;
    var y0 = Math.min.apply(null, alle.map(function(p){ return p[1]; })) - 3, y1 = Math.max.apply(null, alle.map(function(p){ return p[1]; })) + 3;
    var ecken = '', linien = '', texte = '';
    pos.forEach(function(P, i){
      var platz = loesung ? { teil:i, dreh:0 } : t.plaetze[i], C = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
      for (var k = 0; k < 3; k++){
        var V = P[k], V1 = P[(k + 1) % 3], V2 = P[(k + 2) % 3], f = 0.12;
        ecken += 'M' + V[0].toFixed(2) + ' ' + V[1].toFixed(2) + 'L' + (V[0] + (V1[0] - V[0]) * f).toFixed(2) + ' ' + (V[1] + (V1[1] - V[1]) * f).toFixed(2) + 'L' + (V[0] + (V2[0] - V[0]) * f).toFixed(2) + ' ' + (V[1] + (V2[1] - V[1]) * f).toFixed(2) + 'Z';
      }
      texte += teilTexte(P, C, [0, 1, 2].map(function(k){ return t.inhalt[platz.teil][(k + platz.dreh) % 3]; }));
      linien += 'M' + P.map(function(p){ return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('L') + 'Z';
    });
    return '<svg class="tr-figur" viewBox="' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' ' + (x1 - x0).toFixed(1) + ' ' + (y1 - y0).toFixed(1) + '" role="img" aria-label="Triomino ' + esc(form().name) + (loesung ? ', Lösung' : '') + '">' +
      '<path d="' + ecken + '" fill="' + farbe + '"/>' +
      '<path d="' + linien + '" fill="none" stroke="' + TINTE + '" stroke-width="0.9" stroke-linejoin="round"/>' +
      '<g style="font-family:var(--blatt-buchstaben)" fill="' + TINTE + '" text-anchor="middle">' + texte + '</g></svg>';
  }
  function titel(){ return st.titel.trim() || 'Triomino'; }
  function zeichnen(){
    if (!trimino) return;
    var o = st.opt, f = form();
    $('#trBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="tr-anleitung">Schneide die Dreiecke aus. Lege sie so aneinander, dass die Seiten zusammenpassen – es entsteht ' + f.figur + '.</p>' : '') +
      '<div class="tr-figur-rahmen tr-' + o.form + '">' + figurSvg(false) + '</div>';
    $('#trLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="tr-anleitung"><b>Lösung</b></p>') +
      '<div class="tr-figur-rahmen tr-' + o.form + '">' + figurSvg(true) + '</div>';
    $('#trPaarListe').innerHTML = info.paare.map(function(p){ return '<li>' + kurz(p.a) + ' <span aria-hidden="true">↔</span> ' + kurz(p.b) + '</li>'; }).join('') +
      (info.ablenker.length ? '<li class="tr-ablenker">Ablenker: ' + info.ablenker.map(kurz).join(' · ') + '</li>' : '');
    $('#trPaare').querySelector('summary').textContent = 'Verwendete Paare (' + info.paare.length + ')';
  }
  function kurz(x){ return x.bruch ? x.bruch[0] + '/' + x.bruch[1] : x.zahl ? esc(x.zahl.slice(0, x.mark)) + '<b style="color:' + MARKE + '">' + esc(x.zahl.charAt(x.mark)) + '</b>' + esc(x.zahl.slice(x.mark + 1)) : esc(x.t); }

  /* ---------- Werkzeuge, PDF ---------- */
  $('#trNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erzeugen(); });
  $('#trZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#trLoesung').classList.toggle('sichtbar', an);
    if (an) $('#trLoesung').scrollIntoView({ behavior:'smooth', block:'start' });
  });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#trPdf'), function(){ return trimino && { blaetter:[$('#trBlatt'), st.opt.mitLoesung && $('#trLoesung')], name:Labor.pdfName('Triomino', st.titel) }; },
    function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#trPdf').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#trHerunterladen').hidden = false; }); }
  $('#trHerunterladen').addEventListener('click', function(){
    if (!trimino || !speicherOrt) return;
    var bl = [$('#trBlatt')].concat(st.opt.mitLoesung ? [$('#trLoesung')] : []);
    var inhalt = bl.map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:Labor.pdfName('Triomino', st.titel).replace(/\.pdf$/, '.html'), data:Labor.blattDatei('Triomino', inhalt, '.tr-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  artZeigen(); erzeugen();
  // Schriftbreiten erst mit geladener Schrift messen
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('400 20px Andika'), document.fonts.load('700 20px Andika')]).then(function(){ if (!aus && trimino) zeichnen(); }, function(){});
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
