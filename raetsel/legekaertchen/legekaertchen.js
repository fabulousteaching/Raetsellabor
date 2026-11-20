/* Rätsellabor – Generator «Legekärtchen»
   Kärtchen von 5 × 10 cm zum Ausschneiden. Richtig aneinandergelegt – immer gerade Kante an gerade Kante – bilden sie eine
   Ziffer oder einen Grossbuchstaben. Wo sich zwei Kärtchen berühren, stehen sich die zwei Hälften eines Paars gegenüber
   (KÖRPER | BODY, 3 + 4 | = 7, GEL | ÄCHTER, ein halbes Tier …). An Aussenkanten stehen auf Wunsch Ablenker ohne Partner.
   Jedes Wort passt zu genau einem anderen – so ist die Lösung eindeutig. Inhalte: Mathe und Deutsch wie beim Kettenrätsel
   (window.KettenKern), dazu Worttrennungen, Vorsilben, Bilder (Emojis, halbiert) und eigene Paare (gemeinsam/paarliste.js).
   Kärtchenblätter in Originalgrösse (6 Kärtchen je Seite), Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('legekaertchen');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* Figuren aus Feldern von 5 × 5 cm (Zeilen von oben). Jede Figur hat eine gerade Zahl Felder und lässt sich mit Kärtchen
     von 5 × 10 cm (zwei Felder) lückenlos auslegen (geprüft). Nur Buchstaben mit geraden Kanten, die nicht wie eine Ziffer
     aussehen: kein B (wie 8), O und D (wie 0), S (wie 5), Z (wie 2), I (wie 1), G (wie 6); kein K, M, N, Q, R, V, W, X, Y
     (schräge Striche). */
  var FIGUREN = {
    0:['###', '#.#', '#.#', '#.#', '###'], 1:['##', '.#', '.#', '.#', '.#'], 2:['###', '..#', '###', '#..', '##.'],
    3:['###', '..#', '.##', '..#', '###'], 4:['#..', '#.#', '###', '..#', '..#'], 5:['##.', '#..', '###', '..#', '###'],
    6:['###', '#..', '###', '#.#', '###'], 7:['###', '..#', '.##', '..#', '..#'], 8:['####', '#..#', '####', '#..#', '####'],
    9:['###', '#.#', '###', '..#', '###'],
    A:['###', '#.#', '###', '#.#', '#.#'], C:['###', '#..', '#..', '#..', '#..', '###'], E:['###', '#..', '##.', '#..', '###'],
    F:['###', '#..', '##.', '#..', '#..'], H:['#..#', '#..#', '####', '#..#', '#..#'], J:['..#', '..#', '..#', '#.#', '###'],
    L:['#.', '#.', '#.', '#.', '##'], P:['###', '#.#', '###', '#..', '#..'], T:['#####', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U:['#..#', '#..#', '#..#', '#..#', '####']
  };
  // warum ein Zeichen nicht geht
  // Buchstaben, die wie eine Ziffer aussehen (→ diese Ziffer)
  var NICHT = { B:'8', O:'0', D:'0', Q:'0', S:'5', Z:'2', I:'1', G:'6' };
  function lesen(text, max){
    var t = String(text || '').toUpperCase(), z = [], weg = [];
    Array.from(t).forEach(function(c){ if (FIGUREN[c]) z.push(c); else if (/\S/.test(c) && weg.indexOf(c) < 0) weg.push(c); });
    return { zeichen:z.slice(0, max), weg:weg, zuViele:Math.max(0, z.length - max) };
  }
  function felder(c){ var l = []; (FIGUREN[c] || []).forEach(function(z, r){ for (var s = 0; s < z.length; s++) if (z.charAt(s) === '#') l.push([r, s]); }); return l; }
  // alle Arten, die Figur mit Kärtchen auszulegen → [[ [[r, s], [r, s]] je Kärtchen ]]
  function auslegungen(c){
    var f = felder(c), da = {}, frei = {}, l = [], karten = [];
    f.forEach(function(p){ da[p] = true; frei[p] = true; });
    (function weiter(){
      var p = null; for (var i = 0; i < f.length; i++) if (frei[f[i]]){ p = f[i]; break; }
      if (!p){ l.push(karten.slice()); return; }
      [[0, 1], [1, 0]].forEach(function(d){
        var q = [p[0] + d[0], p[1] + d[1]];
        if (!da[q] || !frei[q]) return;
        frei[p] = frei[q] = false; karten.push([p, q]); weiter(); karten.pop(); frei[p] = frei[q] = true;
      });
    })();
    return l;
  }
  var SEITEN = { o:[-1, 0], u:[1, 0], l:[0, -1], r:[0, 1] }, GEGEN = { o:'u', u:'o', l:'r', r:'l' };
  /* Kanten einer Auslegung: innen (zwei Kärtchen berühren sich auf 5 cm) und aussen (Rand der Figur).
     k = Kärtchen, f = Feld im Kärtchen (0 = oben bzw. links), s = Seite des Felds */
  function kanten(karten){
    var wo = {}, innen = [], aussen = [];
    karten.forEach(function(k, i){ k.forEach(function(p, j){ wo[p] = { k:i, f:j }; }); });
    karten.forEach(function(k, i){ k.forEach(function(p, j){
      Object.keys(SEITEN).forEach(function(s){
        var w = wo[[p[0] + SEITEN[s][0], p[1] + SEITEN[s][1]]];
        if (!w) aussen.push({ k:i, f:j, s:s });
        else if (w.k > i) innen.push([{ k:i, f:j, s:s }, { k:w.k, f:w.f, s:GEGEN[s] }]);
      });
    }); });
    return { innen:innen, aussen:aussen };
  }
  // so viele Ablenker je Figur: keine, wenige (jedes zweite Kärtchen), viele (eines je Kärtchen)
  function ablenkerZahl(c, stufe){ var n = felder(c).length / 2; return stufe === 'viele' ? n : stufe === 'wenige' ? Math.ceil(n / 2) : 0; }
  function bedarf(zeichen, stufe){
    var innen = 0, ab = 0;
    zeichen.forEach(function(c){ var a = auslegungen(c)[0]; innen += kanten(a).innen.length; ab += ablenkerZahl(c, stufe); });
    return { innen:innen, ablenker:ab };
  }
  /* Rätsel belegen. o: { zeichen:[…], paare:[{ a, b }] (genug, jedes Wort einmal), ablenker:'keine'|'wenige'|'viele', reihenfolge, seed }
     → { figuren:[{ c, karten:[{ felder:[[r, s], [r, s]], texte:[{ f, s, t, rolle:'a'|'b'|'x', nr }] }] }], fehlen, ablenkerFehlen }
     Jede Innenkante bekommt ein Paar (Seiten zufällig); Ablenker: von übrigen Paaren nur ein Wort, auf Aussenkanten
     verschiedener Kärtchen. nr = Nummer des Paars (für Bilder: welche Hälfte zu welcher gehört). */
  function belegen(o){
    var rnd = zufall(o.seed), paare = mischen(o.paare.slice(), rnd), naechstes = 0, fehlen = 0, abFehlen = 0;
    var figuren = o.zeichen.map(function(c){
      var al = auslegungen(c), karten = al[Math.floor(rnd() * al.length)], k = kanten(karten);
      var F = { c:c, karten:karten.map(function(f){ return { felder:f, texte:[] }; }) };
      k.innen.forEach(function(e){
        var p = paare[naechstes++];
        if (!p){ fehlen++; return; }
        // mit Reihenfolge (Worttrennung, Rechnung, Bild): erste Hälfte links bzw. oben – so liest man GEL | ÄCHTER in Leserichtung
        var tausch = o.reihenfolge ? !(e[0].s === 'r' || e[0].s === 'u') : rnd() < 0.5, a = tausch ? e[1] : e[0], b = tausch ? e[0] : e[1];
        F.karten[a.k].texte.push({ f:a.f, s:a.s, t:p.a, rolle:'a', nr:naechstes - 1 });
        F.karten[b.k].texte.push({ f:b.f, s:b.s, t:p.b, rolle:'b', nr:naechstes - 1 });
      });
      // Ablenker: auf Aussenkanten, möglichst auf verschiedenen Kärtchen
      var n = ablenkerZahl(c, o.ablenker), plaetze = mischen(k.aussen.slice(), rnd), belegt = {};
      plaetze.sort(function(x, y){ return (belegt[x.k] || 0) - (belegt[y.k] || 0); });
      for (var i = 0; i < n; i++){
        var frei = plaetze.filter(function(q){ return !q.weg; }).sort(function(x, y){ return (belegt[x.k] || 0) - (belegt[y.k] || 0); })[0];
        var p = paare[naechstes];
        if (!frei) break;
        if (!p){ abFehlen++; continue; }
        naechstes++; frei.weg = true; belegt[frei.k] = (belegt[frei.k] || 0) + 1;
        var seite = rnd() < 0.5 ? 'a' : 'b';
        F.karten[frei.k].texte.push({ f:frei.f, s:frei.s, t:p[seite], rolle:'x', nr:naechstes - 1, haelfte:seite });
      }
      return F;
    });
    return { figuren:figuren, fehlen:fehlen, ablenkerFehlen:abFehlen };
  }
  /* Deutsch: Worttrennungen – zusammengesetzte Wörter, an einer lustigen Stelle getrennt (Gel-ächter statt Gelächter).
     Kindgerecht ausgewählt; keine sehr kurzen Hälften (ER, AU …), die mit anderen Hälften leicht ein anderes Wort ergeben. */
  var TRENNUNGEN = 'GEL|ÄCHTER SIEB|ENTE STAUB|ECKEN NACH|TRUHE KAU|FLADEN EID|OTTER GRÜN|DUNG MUSI|KNOTEN MUSIK|ERLEBEN SPIELER|ÖFFNUNG ' +
    'PATEN|TRICHTER BROTHER|STELLUNG GELDAU|TOMATEN DAMPFER|ZEUGER BLUMENTO|PFERDE EURO|PARAT MINISTER|EOANLAGE SPRECHER|ZIEHUNG ' +
    'ARBEIT|SAMT ALL|EINREISENDE STREIK|ENDE GAS|TRAUM FRUST|RATION WACHS|TUBE DRUCKER|ZEUGNIS STIEFEL|TERN BEIN|HALTUNG ' +
    'ALTBAUCH|ARME BILLI|GREISE HOFFEN|STERCHEN KREISCH|ORVERBAND DUDEL|EI NACHTEIL|ZUG MÜLLER|ZEUGUNG DISCO|UNTERPREISE ' +
    'ALPENO|STRAND ALTER|STEILZEIT VERS|ENDUNG TAL|ENTFÖRDERUNG';
  function trennungen(){ return TRENNUNGEN.split(' ').map(function(x){ var t = x.split('|'); return { a:t[0], b:t[1] }; }); }
  // Mathe: Vorsilben der Masseinheiten ↔ Zahl (Tausender mit ', Dezimalzahlen immer mit Punkt)
  var SPR = typeof Labor !== 'undefined' && Labor.sprache ? Labor.sprache : 'de';
  var VORSILBEN = SPR === 'en' ? 'KILO=1,000 HECTO=100 DECA=10 DECI=0.1 CENTI=0.01 MILLI=0.001 MEGA=1,000,000 GIGA=1,000,000,000 MICRO=0.000001 NANO=0.000000001'
    : SPR === 'fr' ? 'KILO=1\'000 HECTO=100 DÉCA=10 DÉCI=0.1 CENTI=0.01 MILLI=0.001 MÉGA=1\'000\'000 GIGA=1\'000\'000\'000 MICRO=0.000001 NANO=0.000000001'
    : 'KILO=1\'000 HEKTO=100 DEKA=10 DEZI=0.1 ZENTI=0.01 MILLI=0.001 MEGA=1\'000\'000 GIGA=1\'000\'000\'000 MIKRO=0.000001 NANO=0.000000001';
  function vorsilben(){ return VORSILBEN.split(' ').map(function(x){ var t = x.split('='); return { a:t[0], b:t[1] }; }); }
  // Bilder: Emojis, die halbiert gut zu erkennen sind
  var BILDER = {
    tiere:'🐻 🐯 🦊 🦁 🐘 🐵 🐸 🐷 🐮 🐰 🐨 🐼 🐧 🐢 🦒 🦓 🐙 🦀 🐝 🦋 🐞 🐌 🦔 🦉 🐳 🐬 🦜 🦩 🐊 🐔',
    essen:'🍎 🍌 🍓 🍇 🍉 🍍 🥕 🌽 🥦 🍕 🍔 🥨 🧀 🍩 🍪 🍰 🍦 🥐 🍒 🍋 🥑 🍄 🌶️ 🥚',
    fahrzeuge:'🚗 🚌 🚲 🚂 🚀 🚁 ⛵ 🚜 🚒 🚑 🛴 🚤 🛸 🚕 🚓 🚛 🏎️ 🚠'
  };
  function bilder(thema){
    var l = thema === 'gemischt' ? (BILDER.tiere + ' ' + BILDER.essen + ' ' + BILDER.fahrzeuge) : (BILDER[thema] || BILDER.tiere);
    return l.split(' ').filter(Boolean).map(function(e){ return { a:e, b:e, bild:true }; });
  }
  return { zufall:zufall, mischen:mischen, FIGUREN:FIGUREN, NICHT:NICHT, lesen:lesen, felder:felder, auslegungen:auslegungen, kanten:kanten,
    ablenkerZahl:ablenkerZahl, bedarf:bedarf, belegen:belegen, trennungen:trennungen, vorsilben:vorsilben, bilder:bilder, BILDER:BILDER };
})();
/* KERN-ENDE */

var MM = 703 / 186, K = 50 * MM;     // Pixel je Millimeter; 5 cm (ein Feld, Kärtchenbreite)
var TINTE = '#1C1714', RAND = '#8A8079', B = 639;
// Farben für die Schnittlinien (ohne Wahl: grau)
var LINIENFARBEN = [['#8A8079', tx('Grau')], ['#1C1714', tx('Schwarz')], ['#E53935', tx('Rot')], ['#1E88E5', tx('Blau')], ['#43A047', tx('Grün')], ['#FB8C00', tx('Orange')], ['#8E24AA', tx('Violett')]];
var FARBEN = [['#FCE4EC', tx('rosa')], ['#E3F2E6', tx('grün')], ['#E1EEFB', tx('blau')], ['#FFF0D9', tx('orange')], ['#EFE4F8', tx('violett')], ['#DDF4F2', tx('türkis')]];
// Fach «deutsch» = Sprache der Seite (Reime, Mehrzahl, Gegenteile in dieser Sprache); Englisch und Französisch = Wörter mit deutscher Übersetzung
var SPRACHFACH = { en:'English', fr:'Français' }[Labor.sprache] || 'Deutsch';
var FAECHER = [['deutsch', SPRACHFACH], ['mathe', tx('Mathe')], ['englisch', Labor.sprache === 'de' ? tx('Englisch') : tx('Deutsch – Englisch')], ['franzoesisch', Labor.sprache === 'de' ? tx('Französisch') : tx('Deutsch – Französisch')], ['bilder', tx('Bilder')], ['eigene', tx('Eigene Paare')]];
// Lustige Worttrennungen gibt es nur auf Deutsch
var DEUTSCH = (Labor.sprache === 'de' ? [['trennung', tx('Lustige Worttrennungen')]] : []).concat([['reime', tx('Reimwörter')], ['mehrzahl', tx('Einzahl – Mehrzahl')], ['gegenteile', tx('Gegenteile')]]);
var MATHE = [['plusminus', tx('Plus & Minus')], ['einmaleins', tx('Einmaleins')], ['dezimal', tx('Dezimalzahlen')], ['brueche', tx('Brüche')], ['vorsilben', tx('Vorsilben (kilo, milli …)')]];
var BILDTHEMEN = [['tiere', tx('Tiere')], ['essen', tx('Essen')], ['fahrzeuge', tx('Fahrzeuge')], ['gemischt', tx('gemischt')]];
var KOEPFE = { englisch:[tx('Deutsch'), tx('Englisch'), tx('Körper = body')], franzoesisch:[tx('Deutsch'), tx('Französisch'), tx('Pferd = le cheval')], eigene:[tx('Wort'), tx('Partner'), tx('Albert = Einstein')] };
var ABLENKER = [['keine', tx('keine')], ['wenige', tx('wenige')], ['viele', tx('viele')]];
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function chips(name, l){ return l.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }
function kaestchen(name, l){ return l.map(function(x){ return '<label><input type="checkbox" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

/* ---------- Zeichnen ---------- */
var messer = document.createElement('canvas').getContext('2d');
function breite(t, gr){ messer.font = '700 ' + gr + 'px ' + Labor.blattSchrift('text'); return messer.measureText(t).width; }
var WINKEL = { u:0, o:180, l:90, r:-90 };
var BRUCH = /^(\d+)\/(\d+)$/;   // «3/5» wird als Bruch übereinander gezeichnet   // Drehung des Texts: «unten» im Text zeigt zur Kante
/* Ein Kärtchen in seiner Lage in der Figur (waagrecht 2K × K oder senkrecht K × 2K), oben links bei (0, 0).
   Texte an den Kanten, zur Kante hin ausgerichtet (wie auf dem Kärtchen gegenüber); Bilder: halbes Emoji auf der Kante,
   beim Partner um 180° gedreht – zusammengelegt ist das Tier ganz. */
function kartenInhalt(karte, farbe, z, linie){
  var waag = karte.felder[0][0] === karte.felder[1][0], W = waag ? 2 * z : z, H = waag ? z : 2 * z, t = '', id = 'k' + Math.floor(Math.random() * 1e9);
  t += '<rect x="0" y="0" width="' + f1(W) + '" height="' + f1(H) + '" fill="' + farbe + '"/>';
  var bild = '';
  karte.texte.forEach(function(x){
    var fx = waag ? x.f * z : 0, fy = waag ? 0 : x.f * z, px, py;
    if (x.s === 'o'){ px = fx + z / 2; py = fy; } else if (x.s === 'u'){ px = fx + z / 2; py = fy + z; }
    else if (x.s === 'l'){ px = fx; py = fy + z / 2; } else { px = fx + z; py = fy + z / 2; }
    var w = WINKEL[x.s];
    if (x.bild){
      var dreh = x.rolle === 'b' || x.haelfte === 'b' ? 180 : 0;
      bild += '<text x="0" y="0" font-size="' + f1(z * 0.5) + '" text-anchor="middle" dominant-baseline="central" transform="translate(' + f1(px) + ' ' + f1(py) + ') rotate(' + (w + dreh) + ')">' + x.t + '</text>';
      return;
    }
    var trafo = ' transform="translate(' + f1(px) + ' ' + f1(py) + ') rotate(' + w + ')"', bruch = BRUCH.exec(x.t);
    if (bruch){
      // Bruch übereinander: Nenner näher an der Kante, Zähler darüber (im gedrehten Bild)
      var g2 = z * 0.085, bw = Math.max(breite(bruch[1], g2), breite(bruch[2], g2)) + g2 * 0.4, ym = -z * 0.07 - 1.2 * g2;
      t += '<g' + trafo + ' font-size="' + f1(g2) + '" font-weight="700" fill="' + TINTE + '" text-anchor="middle">' +
        '<text x="0" y="' + f1(ym - 0.22 * g2) + '">' + esc(bruch[1]) + '</text>' +
        '<path d="M' + f1(-bw / 2) + ' ' + f1(ym) + 'H' + f1(bw / 2) + '" stroke="' + TINTE + '" stroke-width="' + f1(Math.max(1, g2 * 0.09)) + '"/>' +
        '<text x="0" y="' + f1(ym + 0.98 * g2) + '">' + esc(bruch[2]) + '</text></g>';
      return;
    }
    var gr = z * 0.095, max = z * 0.86, b = breite(x.t, gr);
    if (b > max) gr = Math.max(z * 0.045, gr * max / b);
    t += '<text x="0" y="' + f1(-z * 0.085) + '" font-size="' + f1(gr) + '" font-weight="700" fill="' + TINTE + '" text-anchor="middle"' + trafo + '>' + esc(x.t) + '</text>';
  });
  if (bild) t += '<clipPath id="' + id + '"><rect x="0" y="0" width="' + f1(W) + '" height="' + f1(H) + '"/></clipPath><g clip-path="url(#' + id + ')">' + bild + '</g>';
  t += '<rect x="0.4" y="0.4" width="' + f1(W - 0.8) + '" height="' + f1(H - 0.8) + '" fill="none" stroke="' + (linie || RAND) + '" stroke-width="' + (linie && linie !== RAND ? 1.3 : 0.9) + '"/>';
  return { svg:t, W:W, H:H, waag:waag };
}

var VORLAGE = '<div class="lk">' +
  tx('<header class="lk-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Legekärtchen</h1>') +
    tx('<p>Kärtchen zum Ausschneiden: Richtig aneinandergelegt – immer zwei passende Begriffe gegenüber – bilden sie eine Ziffer oder einen Buchstaben.</p></header>') +
  tx('<div class="lk-layout"><section class="lk-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Figuren</h2><p>Diese Zeichen entstehen aus den Kärtchen.</p></div></div>') +
      tx('<p class="feld-label">Was soll entstehen?</p>') +
      tx('<div class="lk-chips" role="radiogroup" aria-label="Zahl oder Buchstabe">') + chips('lkModus', [['zahl', tx('Zahl')], ['buchstabe', tx('Buchstabe')]]) + '</div>' +
      '<div class="lk-stufe" id="lkWahlStufe" hidden><p class="feld-label" id="lkWahlTitel"></p>' +
        '<div class="lk-zeichenwahl" id="lkZeichenWahl" role="group" aria-labelledby="lkWahlTitel"></div></div>' +
      tx('<label class="feld-label" for="lkCode">Oder selbst schreiben</label>') +
      '<div class="lk-zeile"><input type="text" id="lkCode" maxlength="12" autocomplete="off" spellcheck="false">' +
        tx('<button type="button" class="btn klein" id="lkLeeren" title="Alle Zeichen löschen">Leeren</button>') +
        tx('<button type="button" class="btn klein" id="lkZufall" title="Etwas anderes vorschlagen">Andere</button></div>') +
      tx('<p class="hinweis">1 bis 4 Zeichen, auch gemischt. Möglich sind die Ziffern 0–9 und die Buchstaben A, C, E, F, H, J, L, P, T, U (nur gerade Kanten, keine, die wie eine Ziffer aussehen).</p>') +
      '<div class="lk-zaehler" id="lkZaehler" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Paare</h2><p>Was steht sich an den Kanten gegenüber?</p></div></div>') +
      tx('<p class="feld-label">Fach</p>') +
      tx('<div class="lk-chips" role="radiogroup" aria-label="Fach">') + chips('lkFach', FAECHER) + '</div>' +
      '<div class="lk-stufe lk-teil" data-fach="deutsch"><p class="feld-label">' + tx('{fach}: Art der Paare', { fach:SPRACHFACH }) + '</p>' +
        '<div class="lk-chips" role="radiogroup" aria-label="' + SPRACHFACH + '">' + chips('lkDeutsch', DEUTSCH) + '</div>' +
        tx('<p class="hinweis" data-deutsch="trennung">Zusammengesetzte Wörter, an einer lustigen Stelle getrennt: GEL | ÄCHTER, SIEB | ENTE, STAUB | ECKEN …</p></div>') +
      tx('<div class="lk-stufe lk-teil" data-fach="mathe"><p class="feld-label">Mathe: Thema</p>') +
        tx('<div class="lk-chips" role="radiogroup" aria-label="Mathe">') + chips('lkMathe', MATHE) + '</div>' +
        '<div class="lk-stufe lk-unter" data-mathe="plusminus">' +
          tx('<p class="feld-label">Zahlenraum</p><div class="lk-chips" role="radiogroup" aria-label="Zahlenraum">') + chips('lkZr', [['10', tx('bis 10')], ['20', tx('bis 20')], ['100', tx('bis 100')], ['1000', tx('bis 1000')]]) + '</div>' +
          tx('<p class="feld-label">Rechenarten</p><div class="lk-chips">') + kaestchen('lkOps', [['plus', tx('Plus')], ['minus', tx('Minus')]]) + '</div></div>' +
        '<div class="lk-stufe lk-unter" data-mathe="einmaleins">' +
          tx('<p class="feld-label">Reihen</p><div class="lk-chips lk-reihen">') + kaestchen('lkReihen', [2, 3, 4, 5, 6, 7, 8, 9, 10].map(function(r){ return [r, r]; })) + '</div>' +
          tx('<p class="feld-label">Rechenarten</p><div class="lk-chips">') + kaestchen('lkEOps', [['mal', tx('Mal')], ['geteilt', tx('Geteilt')]]) + '</div></div>' +
        '<div class="lk-stufe lk-unter" data-mathe="dezimal">' +
          tx('<p class="feld-label">Brüche mit Nenner</p><div class="lk-chips" role="radiogroup" aria-label="Nenner">') + chips('lkDez', [['1', '10'], ['2', tx('10 und 100')], ['3', tx('10, 100 und 1000')]]) + '</div></div>' +
        '<div class="lk-stufe lk-unter" data-mathe="brueche">' +
          tx('<p class="feld-label">Nenner bis</p><div class="lk-chips" role="radiogroup" aria-label="Nenner bis">') + chips('lkNenner', [['4', '4'], ['6', '6'], ['10', '10'], ['12', '12']]) + '</div></div>' +
        tx('<p class="hinweis lk-unter" data-mathe="vorsilben">KILO | 1\'000, MILLI | 0.001, MEGA | 1\'000\'000 … – zehn Vorsilben.</p></div>') +
      tx('<div class="lk-stufe lk-teil" data-fach="bilder"><p class="feld-label">Bilder: Thema</p>') +
        tx('<div class="lk-chips" role="radiogroup" aria-label="Bilder">') + chips('lkBild', BILDTHEMEN) + '</div>' +
        tx('<p class="hinweis">Jedes Bild ist auf zwei Kärtchen halbiert – zusammengelegt ist es wieder ganz.</p></div>') +
      '<div class="lk-stufe lk-teil lk-paarliste" data-fach="englisch franzoesisch eigene" id="lkPaarliste">' + Paarliste.html() + '</div>' +
      '<div class="lk-zaehler" id="lkPaarInfo" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Kärtchen</h2></div></div>') +
      tx('<p class="feld-label">Ablenker an den Aussenkanten</p><div class="lk-chips" role="radiogroup" aria-label="Ablenker">') + chips('lkAblenker', ABLENKER) + '</div>' +
      tx('<p class="hinweis" id="lkAblenkerInfo">Ablenker sind Wörter ohne Partner – so sieht man nicht sofort, welche Kanten aussen liegen.</p>') +
      tx('<p class="feld-label">Farbe der Schnittlinien</p><div class="lk-farbwahl" role="radiogroup" aria-label="Farbe der Schnittlinien">') +
        LINIENFARBEN.map(function(f){ return '<label title="' + f[1] + '"><input type="radio" name="lkSchnitt" value="' + f[0] + '"><span style="background:' + f[0] + '"></span><b class="vh">' + f[1] + '</b></label>'; }).join('') +
        tx('<label class="lk-eigene" title="Eigene Farbe"><input type="color" id="lkSchnittEigen" value="#8A8079"><span>eigene</span></label></div>') +
      '<p class="hinweis" id="lkSchnittInfo"></p>' +
      tx('<label class="opt"><input type="checkbox" id="lkFarbig"><span>Jede Figur in einer eigenen Farbe (so weiss man, welche Kärtchen zusammengehören)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="lkLinie"><span>Linie für die Lösung</span></label>') +
      tx('<p class="hinweis">Die Kärtchen sind 5 × 10 cm gross, sechs auf einer Seite – in Originalgrösse (100 %) drucken.</p>') +
    '</div>' +
  '</section>' +
  tx('<section class="lk-ausgabe" aria-label="Ergebnis">') +
    '<div id="lkMeldung" aria-live="polite"></div>' +
    '<div class="lk-werkzeug">' +
      tx('<button type="button" class="btn klein" id="lkZeigeLoesung" aria-pressed="false" title="Die zusammengelegten Figuren hier oben zeigen">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="lkNeu" title="Andere Paare und Lage">Neu mischen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="lkMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="lkPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="lkHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="lk-blaetter"><div class="lk-seiten" id="lkSeiten"></div>' +
    '<div class="lk-rahmen lk-loesung-rahmen"><article class="lk-blatt lk-loesungsblatt" id="lkLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="2" width="8" height="10"/><rect x="11" y="2" width="10" height="5"/><rect x="3" y="12" width="8" height="10"/><path d="M5.5 7h3M14 4.5h4"/></svg>';

Labor.registriere({
  id:'legekaertchen',
  titel:'Legekärtchen',
  kurz:'Kärtchen mit Paaren aneinanderlegen – eine Ziffer oder ein Buchstabe entsteht',
  beschreibung:'Kärtchen von 5 × 10 cm zum Ausschneiden: An jeder Kante steht ein Begriff. Wer immer zwei passende Begriffe gegenüberlegt, bildet eine Ziffer oder einen Buchstaben. Deutsch, Mathe, Englisch, Französisch, Bilder oder eigene Paare – mit Lösungsblatt.',
  merkmale:['Ziffern und Buchstaben', 'Viele Fächer und eigene Paare', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/legekaertchen/legekaertchen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false, KK = window.KettenKern;
  var TAB = 'legekaertchen-eingaben', OPT = 'legekaertchen-einstellungen';
  // Keine Vorauswahl: Jede Stufe klappt erst auf, wenn in der Stufe darüber etwas gewählt ist
  var STANDARD = { modus:'', fach:'', deutschArt:'', matheArt:'', zr:'', ops:[], reihen:[], eOps:[], dez:'', nenner:'', bild:'', ablenker:'',
    schnitt:'', farbig:true, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', zeilen:{ englisch:[], franzoesisch:[], eigene:[] }, seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.seed = +e.seed || st.seed;
    Object.keys(KOEPFE).forEach(function(k){ if (e.zeilen && e.zeilen[k]) st.zeilen[k] = Paarliste.aufraeumen(e.zeilen[k]); }); } } catch(x){}
  function gueltig(k, liste){ if (!liste.some(function(x){ return x[0] === st.opt[k]; })) st.opt[k] = ''; }
  ['ops', 'reihen', 'eOps'].forEach(function(k){ if (!Array.isArray(st.opt[k])) st.opt[k] = []; });
  if (st.opt.schnitt && !/^#[0-9a-f]{6}$/i.test(st.opt.schnitt)) st.opt.schnitt = '';
  gueltig('modus', [['zahl'], ['buchstabe']]); gueltig('fach', FAECHER); gueltig('deutschArt', DEUTSCH); gueltig('matheArt', MATHE); gueltig('bild', BILDTHEMEN); gueltig('ablenker', ABLENKER);

  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed, zeilen:st.zeilen })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#lkMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 300); }

  /* ---------- Eingaben ---------- */
  /* Zahl oder Buchstabe: die möglichen Zeichen zum Antippen (hängt das Zeichen hinten an, höchstens 4); das Feld bleibt frei */
  var WAHL = { zahl:'0123456789'.split(''), buchstabe:Object.keys(Kern.FIGUREN).filter(function(c){ return /[A-Z]/.test(c); }) };
  function wahlZeigen(){
    var m = st.opt.modus, drin = Kern.lesen(st.code, 99).zeichen;
    $('#lkWahlStufe').hidden = !m;
    if (!m) return;
    $('#lkWahlTitel').textContent = m === 'zahl' ? tx('Ziffer antippen') : tx('Buchstabe antippen');
    $('#lkZeichenWahl').innerHTML = WAHL[m].map(function(c){
      var n = drin.filter(function(x){ return x === c; }).length;
      return '<button type="button" class="lk-zeichen' + (n ? ' drin' : '') + '" data-c="' + c + '" aria-label="' + (n ? tx('{c} anhängen (schon {n}-mal)', { c:c, n:n }) : tx('{c} anhängen', { c:c })) + '">' + c + '</button>';
    }).join('');
  }
  function codeSetzen(t){ st.code = t; $('#lkCode').value = t; speichern(); wahlZeigen(); zeichnen(); }
  $('#lkZeichenWahl').addEventListener('click', function(ev){
    var b = ev.target.closest('.lk-zeichen'); if (!b) return;
    var z = Kern.lesen(st.code, 99).zeichen;
    if (z.length >= 4){ meldung('info', tx('<p>Höchstens 4 Zeichen – lösche zuerst eines (Feld unten oder «Leeren»).</p>')); return; }
    codeSetzen(z.join('') + b.getAttribute('data-c'));
  });
  [].forEach.call(bereich.querySelectorAll('input[name="lkModus"]'), function(r){
    r.checked = r.value === st.opt.modus;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.modus = r.value; speichern(); wahlZeigen(); } });
  });
  $('#lkCode').value = st.code;
  $('#lkCode').addEventListener('input', function(){ st.code = this.value; speichern(); wahlZeigen(); baldZeichnen(); });
  $('#lkLeeren').addEventListener('click', function(){ codeSetzen(''); $('#lkCode').focus(); });
  $('#lkZufall').addEventListener('click', function(){
    var alle = WAHL[st.opt.modus] || WAHL.zahl.concat(WAHL.buchstabe), r = Kern.zufall(Date.now()), z = alle[Math.floor(r() * alle.length)];
    if (z === st.code) z = alle[(alle.indexOf(z) + 1) % alle.length];
    codeSetzen(z);
  });
  wahlZeigen();
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (r.checked){ st.opt[k] = r.value; speichern(); teileZeigen(); zeichnen(); } });
    });
  }
  function haekchen(name, k, zahl){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(c){
      c.checked = st.opt[k].map(String).indexOf(c.value) >= 0;
      c.addEventListener('change', function(){
        var l = [].filter.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(x){ return x.checked; }).map(function(x){ return zahl ? +x.value : x.value; });
        st.opt[k] = l; speichern(); zeichnen();
      });
    });
  }
  radios('lkFach', 'fach'); radios('lkDeutsch', 'deutschArt'); radios('lkMathe', 'matheArt'); radios('lkZr', 'zr'); radios('lkDez', 'dez'); radios('lkNenner', 'nenner');
  radios('lkBild', 'bild'); radios('lkAblenker', 'ablenker');
  haekchen('lkOps', 'ops'); haekchen('lkReihen', 'reihen', true); haekchen('lkEOps', 'eOps');
  [['#lkFarbig', 'farbig'], ['#lkLinie', 'linie'], ['#lkMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  /* Farbe der Schnittlinien: eine der Farben oder eine eigene; ohne Wahl grau */
  function schnittZeigen(){
    var f = (st.opt.schnitt || '').toLowerCase(), eigen = f && !LINIENFARBEN.some(function(x){ return x[0].toLowerCase() === f; });
    [].forEach.call(bereich.querySelectorAll('input[name="lkSchnitt"]'), function(r){ r.checked = r.value.toLowerCase() === f; });
    $('.lk-eigene').classList.toggle('gewaehlt', !!eigen);
    if (eigen) $('#lkSchnittEigen').value = st.opt.schnitt;
    var name = !f ? '' : eigen ? tx('eigene Farbe') : LINIENFARBEN.filter(function(x){ return x[0].toLowerCase() === f; })[0][1];
    $('#lkSchnittInfo').textContent = f ? tx('Schnittlinien: {f}.', { f:name }) : tx('Noch nichts gewählt: Schnittlinien grau.');
  }
  [].forEach.call(bereich.querySelectorAll('input[name="lkSchnitt"]'), function(r){
    r.addEventListener('change', function(){ if (r.checked){ st.opt.schnitt = r.value; speichern(); schnittZeigen(); if (R){ seitenZeichnen(); loesungZeichnen(); } } });
  });
  $('#lkSchnittEigen').addEventListener('input', function(){ st.opt.schnitt = this.value; speichern(); schnittZeigen(); if (R){ seitenZeichnen(); loesungZeichnen(); } });
  schnittZeigen();
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  // Lösung am Bildschirm: das Lösungsblatt oben über den Kärtchen (fürs PDF und den Druck zählt weiter «mit Lösungsblatt»)
  $('#lkZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#lkLoesung').classList.toggle('zeigen', an);
    $('#lkLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#lkNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  var paarliste = Paarliste.starte($('#lkPaarliste'), {
    liste:function(art){ return st.zeilen[art] || (st.zeilen[art] = []); },
    art:function(){ return st.opt.fach; },
    sprache:function(art){ return art === 'englisch' || art === 'franzoesisch' ? art : null; },
    kopf:function(){ return KOEPFE[st.opt.fach] || ['', '', '']; },
    hilfe:function(){ return st.opt.fach === 'eigene' ? tx('Links ein Begriff, rechts sein Partner – z. B. Vorname und Nachname, Land und Hauptstadt.') : tx('Links das deutsche Wort, rechts die Übersetzung.'); },
    einfuegen:true,
    geaendert:function(){ speichern(); baldZeichnen(); },
    aus:function(){ return aus; }
  });
  function teileZeigen(){
    [].forEach.call(bereich.querySelectorAll('.lk-teil'), function(d){ d.hidden = d.dataset.fach.split(' ').indexOf(st.opt.fach) < 0; });
    [].forEach.call(bereich.querySelectorAll('.lk-unter'), function(d){ d.hidden = d.dataset.mathe !== st.opt.matheArt; });
    [].forEach.call(bereich.querySelectorAll('[data-deutsch]'), function(d){ d.hidden = d.dataset.deutsch !== st.opt.deutschArt; });
    $('#lkAblenkerInfo').textContent = st.opt.ablenker ? tx('Ablenker sind Wörter ohne Partner – so sieht man nicht sofort, welche Kanten aussen liegen.') : tx('Noch nichts gewählt: ohne Ablenker. Ablenker sind Wörter ohne Partner – so sieht man nicht sofort, welche Kanten aussen liegen.');
    if (KOEPFE[st.opt.fach]) paarliste.zeigen();
  }
  teileZeigen();

  /* ---------- Paare ---------- */
  // Was fehlt noch, bevor es Paare gibt? '' = alles gewählt
  function fehltNoch(){
    var o = st.opt;
    if (!o.fach) return tx('ein Fach');
    if (o.fach === 'deutsch' && !o.deutschArt) return tx('bei {fach} die Art der Paare', { fach:SPRACHFACH });
    if (o.fach === 'bilder' && !o.bild) return tx('bei Bilder ein Thema');
    if (o.fach === 'mathe'){
      if (!o.matheArt) return tx('bei Mathe ein Thema');
      if (o.matheArt === 'plusminus' && !o.zr) return tx('den Zahlenraum');
      if (o.matheArt === 'plusminus' && !o.ops.length) return tx('mindestens eine Rechenart');
      if (o.matheArt === 'einmaleins' && !o.reihen.length) return tx('mindestens eine Reihe');
      if (o.matheArt === 'einmaleins' && !o.eOps.length) return tx('mindestens eine Rechenart');
      if (o.matheArt === 'dezimal' && !o.dez) return tx('die Nenner');
      if (o.matheArt === 'brueche' && !o.nenner) return tx('den grössten Nenner');
    }
    return '';
  }
  function paare(rnd, anzahl){
    var o = st.opt, l;
    if (o.fach === 'deutsch') return o.deutschArt === 'trennung' ? Kern.trennungen() : KK.vorschlaege(o.deutschArt, 999, rnd);
    if (o.fach === 'bilder') return Kern.bilder(o.bild);
    if (o.fach === 'mathe'){
      var gleich = function(p){ return { a:p.a, b:'= ' + p.b }; };
      if (o.matheArt === 'plusminus') return KK.plusMinus(o.ops, +o.zr, anzahl, rnd).map(gleich);
      if (o.matheArt === 'einmaleins') return KK.einmaleins(o.reihen, o.eOps, anzahl, rnd).map(gleich);
      if (o.matheArt === 'dezimal') return KK.dezimal(+o.dez, '.', 'echt', anzahl, rnd);
      if (o.matheArt === 'brueche') return KK.brueche(+o.nenner, 'echt', anzahl, rnd);
      return Kern.vorsilben();
    }
    l = (st.zeilen[o.fach] || []).map(function(z){ return [z.a, z.b]; });
    return KK.paareListe(l).paare;
  }

  /* ---------- Blätter ---------- */
  var R = null, Z = [];
  function anleitung(){
    var mehrere = Z.length > 1, bild = st.opt.fach === 'bilder';
    return [
      bild ? tx('Schneide die Kärtchen aus. Lege sie so aneinander, dass sich immer die zwei Hälften eines Bilds genau gegenüberliegen – gerade Kante an gerade Kante.')
        : tx('Schneide die Kärtchen aus. Lege sie so aneinander, dass sich immer zwei passende Begriffe genau gegenüberliegen – gerade Kante an gerade Kante.'),
      st.opt.ablenker === 'keine' ? '' : bild ? tx('Manche Bildhälften haben keinen Partner: Sie liegen aussen.') : tx('Manche Begriffe haben keinen Partner: Sie liegen aussen.'),
      mehrere && st.opt.farbig ? tx('Kärtchen mit gleicher Farbe gehören zusammen.') : '',
      !mehrere ? tx('Es entsteht eine Figur: Welche Ziffer oder welcher Buchstabe ist es?')
        : st.opt.farbig ? tx('Es entstehen {n} Figuren – lies sie in der Reihenfolge der Farben unten.', { n:Z.length }) : tx('Es entstehen {n} Figuren. Welche Reihenfolge ergibt die Lösung?', { n:Z.length })
    ].filter(Boolean).join(' ');
  }
  function zeichnen(){
    if (aus) return;
    var L = Kern.lesen(st.code, 4), h = '', o = st.opt;
    Z = L.zeichen;
    var nicht = L.weg.map(function(c){ return c + (Kern.NICHT[c] ? ' (' + tx('sieht aus wie {z}', { z:Kern.NICHT[c] }) + ')' : /[A-Z]/.test(c) ? ' (' + tx('schräge Striche') + ')' : ''); });
    if (nicht.length) h += tx('<p class="warnung">Nicht möglich: ') + esc(nicht.join(', ')) + '.</p>';
    if (L.zuViele) h += tx('<p class="warnung">Höchstens 4 Zeichen – es werden die ersten 4 verwendet.</p>');
    var leer = !Z.length;
    ['#lkNeu', '#lkPdf', '#lkHerunterladen', '#lkZeigeLoesung'].forEach(function(s){ $(s).disabled = leer; });
    var fehlt = fehltNoch();
    if (leer || fehlt){
      R = null; $('#lkZaehler').innerHTML = h; $('#lkSeiten').innerHTML = ''; $('#lkLoesung').parentNode.hidden = true; $('#lkPaarInfo').innerHTML = '';
      ['#lkNeu', '#lkPdf', '#lkHerunterladen', '#lkZeigeLoesung'].forEach(function(s){ $(s).disabled = true; });
      meldung('info', '<p>' + (!leer ? tx('Wähle links {x}.', { x:fehlt }) : fehlt ? tx('Wähle links zuerst, ob eine Zahl oder ein Buchstabe entstehen soll, und dann die Zeichen – danach {x}.', { x:fehlt })
        : tx('Wähle links zuerst, ob eine Zahl oder ein Buchstabe entstehen soll, und dann die Zeichen.')) + '</p>');
      return;
    }
    var be = Kern.bedarf(Z, o.ablenker), rnd = Kern.zufall(st.seed), liste = paare(rnd, be.innen + be.ablenker + 6);
    var karten = Z.reduce(function(s, c){ return s + Kern.felder(c).length / 2; }, 0);
    $('#lkZaehler').innerHTML = '<p class="lk-zaehler-haupt ok">' + tx('Lösung:') + ' <b>' + esc(Z.join('')) + '</b> · ' + tx('{k} Kärtchen', { k:karten }) + ', ' + (Math.ceil(karten / 6) === 1 ? tx('1 Seite') : tx('{n} Seiten', { n:Math.ceil(karten / 6) })) + '</p>' + h;
    var info = be.ablenker ? tx('{n} Paare an den Kanten + {a} Ablenker – vorhanden: {v}.', { n:be.innen, a:be.ablenker, v:liste.length }) : tx('{n} Paare an den Kanten – vorhanden: {v}.', { n:be.innen, v:liste.length });
    if (liste.length < be.innen){
      $('#lkPaarInfo').innerHTML = '<p class="warnung">' + esc(info) + ' ' + (KOEPFE[o.fach] ? tx('Es braucht mindestens {n} Paare – ergänze die Liste.', { n:be.innen }) : tx('Es braucht mindestens {n} Paare – wähle mehr aus (z. B. einen grösseren Zahlenraum oder mehr Reihen).', { n:be.innen })) + '</p>';
      R = null; $('#lkSeiten').innerHTML = ''; $('#lkLoesung').parentNode.hidden = true; ['#lkPdf', '#lkHerunterladen'].forEach(function(s){ $(s).disabled = true; });
      meldung('info', '<p>' + tx('Für {z} braucht es mindestens {n} Paare.', { z:esc(Z.join('')), n:be.innen }) + '</p>'); return;
    }
    $('#lkPaarInfo').innerHTML = '<p class="' + (liste.length < be.innen + be.ablenker ? 'warnung' : 'lk-info') + '">' + esc(info) + (liste.length < be.innen + be.ablenker ? tx(' Für alle Ablenker reicht es nicht – es gibt weniger.') : '') + '</p>';
    meldung('', '');
    var reihenfolge = o.fach === 'mathe' || o.fach === 'bilder' || (o.fach === 'deutsch' && o.deutschArt === 'trennung');
    R = Kern.belegen({ zeichen:Z, paare:liste, ablenker:o.ablenker, reihenfolge:reihenfolge, seed:st.seed });
    var bild = o.fach === 'bilder';
    if (bild) R.figuren.forEach(function(F){ F.karten.forEach(function(k){ k.texte.forEach(function(x){ x.bild = true; }); }); });
    seitenZeichnen();
    loesungZeichnen();
  }
  function farbe(i){ return st.opt.farbig ? FARBEN[i % FARBEN.length][0] : '#FFFFFF'; }
  // Kärtchen aller Figuren, je Figur gemischt; senkrecht gedruckt, zufällig gedreht (0°/180°, waagrechte 90°/270°)
  function seitenZeichnen(){
    var rnd = Kern.zufall(st.seed + 31), alle = [], o = st.opt;
    R.figuren.forEach(function(F, i){ Kern.mischen(F.karten.slice(), rnd).forEach(function(k){ alle.push({ k:k, farbe:farbe(i), dreh:rnd() < 0.5 }); }); });
    var seiten = [], PRO = 6;
    for (var s = 0; s < alle.length; s += PRO) seiten.push(alle.slice(s, s + PRO));
    var html = '';
    seiten.forEach(function(teil, si){
      var x0 = (B - 3 * K) / 2, t = '';
      teil.forEach(function(e, i){
        var x = x0 + (i % 3) * K, y = Math.floor(i / 3) * 2 * K, I = kartenInhalt(e.k, e.farbe, K, st.opt.schnitt), tr;
        if (I.waag) tr = e.dreh ? 'translate(' + f1(x + K) + ' ' + f1(y) + ') rotate(90)' : 'translate(' + f1(x) + ' ' + f1(y + 2 * K) + ') rotate(-90)';
        else tr = e.dreh ? 'translate(' + f1(x + K) + ' ' + f1(y + 2 * K) + ') rotate(180)' : 'translate(' + f1(x) + ' ' + f1(y) + ')';
        t += '<g transform="' + tr + '">' + I.svg + '</g>';
      });
      var hoehe = Math.ceil(teil.length / 3) * 2 * K + 2;
      var kopf = si === 0 ? (o.titelAn ? tx('<h2>Legekärtchen</h2>') : '') + (o.anleitungAn ? '<p class="lk-anleitung">' + esc(anleitung()) + '</p>' : '') +
          (Z.length > 1 && o.farbig ? '<p class="lk-farben">' + R.figuren.map(function(F, i){ return '<span><i style="background:' + farbe(i) + '"></i>' + (i + 1) + '. ' + FARBEN[i % FARBEN.length][1] + '</span>'; }).join('') + '</p>' : '') +
          (o.linie ? tx('<p class="lk-antwort">Lösung: <span class="lk-linie"></span></p>') : '')
        : '<p class="lk-seitenkopf">' + tx('Legekärtchen – Seite {i} von {n}', { i:si + 1, n:seiten.length }) + '</p>';
      html += '<div class="lk-rahmen"><article class="lk-blatt lk-kartenblatt">' + kopf +
        '<svg class="lk-karten" width="' + B + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + B + ' ' + f1(hoehe) + '">' + t + '</svg>' +
        tx('<p class="lk-notiz">In Originalgrösse (100 %) drucken · Kärtchen 5 × 10 cm</p></article></div>');
    });
    $('#lkSeiten').innerHTML = html;
  }
  // Lösung: die Figuren zusammengesetzt (verkleinert), darunter die Lösung
  function loesungZeichnen(){
    var o = st.opt, l = $('#lkLoesung'), n = R.figuren.length;
    var masse = R.figuren.map(function(F){ var f = Kern.FIGUREN[F.c]; return { b:f[0].length, h:f.length }; });
    var sumB = masse.reduce(function(s, m){ return s + m.b; }, 0) + (n - 1) * 0.6, maxH = Math.max.apply(null, masse.map(function(m){ return m.h; }));
    var z = Math.min(96, (B - 4) / sumB, 760 / maxH), x = (B - sumB * z) / 2, t = '';
    R.figuren.forEach(function(F, i){
      F.karten.forEach(function(k){ var I = kartenInhalt(k, farbe(i), K, st.opt.schnitt), p = k.felder[0];
        t += '<g transform="translate(' + f1(x + p[1] * z) + ' ' + f1(p[0] * z) + ') scale(' + (z / K).toFixed(4) + ')">' + I.svg + '</g>'; });
      x += (masse[i].b + 0.6) * z;
    });
    var h = maxH * z + 2;
    l.innerHTML = (o.titelAn ? tx('<h2>Legekärtchen – Lösung</h2>') : tx('<p class="lk-anleitung"><b>Lösung</b></p>')) +
      '<svg class="lk-karten" width="' + B + '" height="' + f1(h) + '" viewBox="0 0 ' + B + ' ' + f1(h) + '">' + t + '</svg>' +
      tx('<p class="lk-loesung-text">Lösung: <b>') + esc(Z.join('')) + '</b></p>';
    l.parentNode.hidden = false;
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#lkSeiten .lk-blatt')).concat(st.opt.mitLoesung ? [$('#lkLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#lkPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Legekaertchen', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#lkPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#lkHerunterladen').hidden = false; });
  }
  $('#lkHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Legekaertchen', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Legekärtchen'), inhalt, '.lk-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>' + tx('Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
