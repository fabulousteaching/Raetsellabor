/* Rätsellabor – Generator «Geheimschriften»
   Ein Text in einer von zehn Geheimschriften, jeweils mit dem passenden Schlüssel zum Entschlüsseln:
   Caesar-Verschiebung (mit Caesar-Scheibe zum Basteln), Rückwärts-Alphabet, Zahlen-Code, Handy-Tasten,
   Koordinaten-Gitter (Polybios), Freimaurer-Code, Vögel auf dem Draht, Morse-Code, Blindenschrift (Braille) und Hieroglyphen.
   Alte Links auf …/#freimaurer (früher ein eigener Generator) öffnen die Geheimschriften mit dem Freimaurer-Code.
   Herunterladen: Geheimtext (PDF, wahlweise mit Lösungsblatt und Schlüssel; oder als Bild) und der Schlüssel einzeln. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', GITTER = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';   // Polybios: I und J teilen sich ein Feld
  var MORSE = { A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--',
    N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
    'Ä':'.-.-', 'Ö':'---.', 'Ü':'..--', 'ß':'...--..',
    '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
    '.':'.-.-.-', ',':'--..--', '?':'..--..', '!':'-.-.--', ':':'---...', '-':'-....-' };
  // Blindenschrift (deutsche Basisschrift): Punkte 1–3 links von oben nach unten, 4–6 rechts
  var BRAILLE = { A:[1], B:[1, 2], C:[1, 4], D:[1, 4, 5], E:[1, 5], F:[1, 2, 4], G:[1, 2, 4, 5], H:[1, 2, 5], I:[2, 4], J:[2, 4, 5],
    K:[1, 3], L:[1, 2, 3], M:[1, 3, 4], N:[1, 3, 4, 5], O:[1, 3, 5], P:[1, 2, 3, 4], Q:[1, 2, 3, 4, 5], R:[1, 2, 3, 5], S:[2, 3, 4], T:[2, 3, 4, 5],
    U:[1, 3, 6], V:[1, 2, 3, 6], W:[2, 4, 5, 6], X:[1, 3, 4, 6], Y:[1, 3, 4, 5, 6], Z:[1, 3, 5, 6],
    'Ä':[3, 4, 5], 'Ö':[2, 4, 6], 'Ü':[1, 2, 5, 6], 'ß':[2, 3, 4, 6],
    '.':[3], ',':[2], '?':[2, 6], '!':[2, 3, 5], ':':[2, 5], '-':[3, 6] };
  var ZAHLZEICHEN = [3, 4, 5, 6], ZIFFER_BRAILLE = 'JABCDEFGHI';   // Zahlzeichen, dann 1 = a … 9 = i, 0 = j
  var HANDY = [['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
  // Hieroglyphen (Einkonsonantenzeichen, wie sie in der Schule als «Alphabet» verwendet werden)
  var HIERO = { A:[0x1313F], B:[0x130C0], C:[0x133A1], D:[0x130A7], E:[0x131CB], F:[0x13191], G:[0x133BC], H:[0x13254], I:[0x131CB], J:[0x13193],
    K:[0x133A1], L:[0x130ED], M:[0x13153], N:[0x13216], O:[0x1336F], P:[0x132AA], Q:[0x1320E], R:[0x1308B], S:[0x132F4], T:[0x133CF],
    U:[0x13171], V:[0x13191], W:[0x13171], X:[0x133A1, 0x132F4], Y:[0x131CC], Z:[0x13283] };
  var HIERO_NAME = { A:'Geier', B:'Fuss', C:'Korb', D:'Hand', E:'Schilfblatt', F:'Hornviper', G:'Krugständer', H:'Hof', I:'Schilfblatt', J:'Kobra',
    K:'Korb', L:'Löwe', M:'Eule', N:'Wasser', O:'Lasso', P:'Hocker', Q:'Hügel', R:'Mund', S:'Tuch', T:'Brot', U:'Küken', V:'Hornviper', W:'Küken',
    X:'Korb + Tuch', Y:'zwei Schilfblätter', Z:'Riegel' };

  /* Freimaurer-Code: A–I im Gitter #, J–R im Gitter # mit Punkt, S–V im X (oben, links, rechts, unten), W–Z im X mit Punkt.
     Zeichen im Feld 0…100: d = Linien (SVG-Pfad), punkt = [x, y] oder null – eine Linie dort, wo im Schlüssel eine
     Gitterlinie an das Feld des Buchstabens grenzt. */
  function freimaurer(c){
    var i = ABC.indexOf(c);
    if (i < 0) return null;
    if (i < 18){
      var r = Math.floor(i % 9 / 3), s = i % 3, a = 14, z = 86, da = [r > 0, s < 2, r < 2, s > 0];   // oben, rechts, unten, links
      var S = [[a, a, z, a], [z, a, z, z], [z, z, a, z], [a, z, a, a]], d;
      if (da[0] && da[1] && da[2] && da[3]) d = 'M' + a + ' ' + a + 'H' + z + 'V' + z + 'H' + a + 'Z';
      else {
        var k0 = [0, 1, 2, 3].filter(function(k){ return da[k] && !da[(k + 3) % 4]; })[0], k = k0;
        d = 'M' + S[k0][0] + ' ' + S[k0][1];
        do { d += 'L' + S[k][2] + ' ' + S[k][3]; k = (k + 1) % 4; } while (da[k] && k !== k0);
      }
      return { d:d, punkt:i >= 9 ? [50, 50] : null };
    }
    var X = [['M14 16L50 86L86 16', [50, 40]], ['M16 14L86 50L16 86', [40, 50]], ['M84 14L14 50L84 86', [60, 50]], ['M14 84L50 14L86 84', [50, 60]]][(i - 18) % 4];
    return { d:X[0], punkt:i >= 22 ? X[1] : null };
  }
  /* Vögel auf dem Draht (Birds on a Wire): jeder Buchstabe ein Vogel in einer anderen Haltung – nach einem System, damit
     man sie gut unterscheidet: [Haltung, Blick (1 rechts, −1 links), Schwanz (kurz, lang, schräg)].
     A–F sitzend, G–L Flügel hoch, M–R pickend, S–X Küken, Y und Z liegend. */
  var VOEGEL = {}, HALTUNGEN = ['sitzend', 'fluegel', 'pickend', 'kueken'], SCHWAENZE = ['kurz', 'lang', 'schraeg'];
  HALTUNGEN.forEach(function(h, a){ [1, -1].forEach(function(blick, b){ SCHWAENZE.forEach(function(sw, c){ VOEGEL[ABC[a * 6 + b * 3 + c]] = [h, blick, sw]; }); }); });
  VOEGEL.Y = ['liegend', 1, 'lang']; VOEGEL.Z = ['liegend', -1, 'lang'];
  // Text in Grossbuchstaben; Umlaute und ß bleiben (Morse, Blindenschrift) oder werden zu AE, OE, UE, SS
  function normal(text, umlaute){
    var t = String(text || '').replace(/ẞ/g, 'ß').replace(/ß/g, umlaute ? '' : 'SS').toUpperCase();
    if (!umlaute) t = t.replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    return t.replace(/Ä/g, '').replace(/Ö/g, '').replace(/Ü/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(//g, 'Ä').replace(//g, 'Ö').replace(//g, 'Ü').replace(//g, 'ß');
  }
  /* Ein Zeichen verschlüsseln → { text } | { morse } | { braille:[muster, …] } | { glyphe:[codepoints] } | null (bleibt stehen)
     vorher: das Zeichen davor (für das Zahlzeichen der Blindenschrift) */
  function zeichen(art, c, o, vorher){
    var i = ABC.indexOf(c);
    switch (art){
      case 'caesar': return i < 0 ? null : { text:ABC[(i + (o.verschiebung || 3)) % 26] };
      case 'atbasch': return i < 0 ? null : { text:ABC[25 - i] };
      case 'zahlen': return i < 0 ? null : { text:String(i + 1) };
      case 'handy':
        for (var h = 0; h < HANDY.length; h++){ var p = HANDY[h][1].indexOf(c); if (p >= 0) return { text:new Array(p + 2).join(HANDY[h][0]) }; }
        return null;
      case 'polybios':
        var g = GITTER.indexOf(c === 'J' ? 'I' : c);
        return g < 0 ? null : { text:String(Math.floor(g / 5) + 1) + String(g % 5 + 1) };
      case 'freimaurer': return i < 0 ? null : { freimaurer:freimaurer(c) };
      case 'voegel': return i < 0 ? null : { vogel:VOEGEL[c] };
      case 'morse': return MORSE[c] ? { morse:MORSE[c] } : null;
      case 'braille':
        if (/[0-9]/.test(c)){ var m = BRAILLE[ZIFFER_BRAILLE[+c]]; return { braille:/[0-9]/.test(vorher || '') ? [m] : [ZAHLZEICHEN, m] }; }
        return BRAILLE[c] ? { braille:[BRAILLE[c]] } : null;
      case 'hieroglyphen': return HIERO[c] ? { glyphe:HIERO[c] } : null;
    }
    return null;
  }
  var UMLAUTE = { morse:true, braille:true };
  // Text → Zeilen → Wörter → Zellen { b: Buchstabe (Lösung), code } (code null: Zeichen bleibt stehen)
  function zerlege(text, art, o){
    return normal(text, UMLAUTE[art]).split(/\r?\n/).map(function(z){
      return z.split(/\s+/).filter(Boolean).map(function(w){
        var zeichenListe = Array.from(w);
        return zeichenListe.map(function(c, k){ return { b:c, code:zeichen(art, c, o, zeichenListe[k - 1]) }; });
      });
    });
  }
  return { ABC:ABC, GITTER:GITTER, MORSE:MORSE, BRAILLE:BRAILLE, ZAHLZEICHEN:ZAHLZEICHEN, HANDY:HANDY, HIERO:HIERO, HIERO_NAME:HIERO_NAME,
    normal:normal, zeichen:zeichen, zerlege:zerlege, freimaurer:freimaurer, VOEGEL:VOEGEL, UMLAUTE:UMLAUTE };
})();
/* KERN-ENDE */

var SCHRIFTEN = [
  ['caesar', 'Caesar-Verschiebung', 'Jeder Buchstabe rückt im Alphabet weiter.'],
  ['atbasch', 'Rückwärts-Alphabet', 'A wird zu Z, B zu Y …'],
  ['zahlen', 'Zahlen-Code', 'A = 1, B = 2 … Z = 26'],
  ['handy', 'Handy-Tasten', 'So oft tippen wie auf der Handytaste: B = 22'],
  ['polybios', 'Koordinaten-Gitter', 'Zeile und Spalte im Gitter: B = 12'],
  ['freimaurer', 'Freimaurer-Code', 'Stücke von Gittern, manche mit Punkt'],
  ['voegel', 'Vögel auf dem Draht', 'Jeder Vogel sitzt anders (Birds on a Wire)'],
  ['morse', 'Morse-Code', 'Punkte und Striche'],
  ['braille', 'Blindenschrift', 'Punkte zum Ertasten (Braille)'],
  ['hieroglyphen', 'Hieroglyphen', 'Bildzeichen aus dem alten Ägypten']
];
var HIERO_SCHRIFT = '"Noto Sans Egyptian Hieroglyphs"';
var HIERO_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Egyptian+Hieroglyphs&display=swap';
var TINTE = '#1C1714';
var GROESSEN = [['klein', 'Klein', 30], ['mittel', 'Mittel', 42], ['gross', 'Gross', 58]];

/* ---------- Zeichnen der Zeichen ---------- */
function esc(t){ return Labor.esc(t); }
function morseSvg(code, klasse){
  var x = 0.3, teile = '';
  Array.from(code).forEach(function(z, i){
    if (i) x += 0.75;
    if (z === '.'){ teile += '<circle cx="' + (x + 0.45).toFixed(2) + '" cy="2.5" r="0.45"/>'; x += 0.9; }
    else { teile += '<rect x="' + x.toFixed(2) + '" y="2.07" width="2.2" height="0.86" rx="0.43"/>'; x += 2.2; }
  });
  var w = (x + 0.3).toFixed(2);
  return '<svg class="' + (klasse || 'gs-morse') + '" viewBox="0 0 ' + w + ' 5" style="aspect-ratio:' + w + '/5" fill="' + TINTE + '" aria-hidden="true">' + teile + '</svg>';
}
function brailleSvg(muster, klasse){
  var w = muster.length * 2.4 - 0.5, teile = '';
  muster.forEach(function(m, z){
    for (var p = 1; p <= 6; p++){
      var cx = z * 2.4 + 0.55 + (p > 3 ? 1.0 : 0), cy = 0.6 + ((p - 1) % 3) * 1.15, an = m.indexOf(p) >= 0;
      teile += an ? '<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="0.4" fill="' + TINTE + '"/>' : '<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="0.13" fill="#B9AFA6"/>';
    }
  });
  return '<svg class="' + (klasse || 'gs-braille') + '" viewBox="0 0 ' + w.toFixed(2) + ' 3.5" style="aspect-ratio:' + w.toFixed(2) + '/3.5" aria-hidden="true">' + teile + '</svg>';
}
// Hieroglyphen als Bild (Canvas), damit sie auch im PDF und im Bild sicher erscheinen
var glyphenBilder = {}, hieroBereit = false, hieroMass = null;
/* Alle Hieroglyphen-Bilder bekommen denselben senkrechten Ausschnitt: so hoch, dass das höchste und das tiefste Zeichen
   ganz hineinpassen. Waagrecht wird jedes Bild auf seine Tinte zugeschnitten. So füllt jedes Bild genau seinen Platz und
   ragt nie über den Rand hinaus, und die Zeichen bleiben untereinander gleich gross. */
var HIERO_GR = 160, HIERO_RAND = 6;
function hieroMessen(){
  var m = document.createElement('canvas').getContext('2d'), oben = 0, unten = 0;
  m.font = HIERO_GR + 'px ' + HIERO_SCHRIFT;
  Object.keys(Kern.HIERO).forEach(function(k){
    var x = m.measureText(String.fromCodePoint.apply(null, Kern.HIERO[k]));
    oben = Math.max(oben, x.actualBoundingBoxAscent || HIERO_GR * 0.8); unten = Math.max(unten, x.actualBoundingBoxDescent || 0);
  });
  return { oben:Math.ceil(oben), unten:Math.ceil(unten) };
}
function glyphe(cps, klasse){
  var t = String.fromCodePoint.apply(null, cps);
  if (!hieroBereit) return '<span class="' + (klasse || 'gs-h') + ' gs-h-text">' + t + '</span>';
  if (!hieroMass) hieroMass = hieroMessen();
  if (!glyphenBilder[t]){
    var m = document.createElement('canvas').getContext('2d');
    m.font = HIERO_GR + 'px ' + HIERO_SCHRIFT;
    var x = m.measureText(t), links = Math.ceil(x.actualBoundingBoxLeft || 0), rechts = Math.ceil(x.actualBoundingBoxRight || x.width);
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, links + rechts + 2 * HIERO_RAND); cv.height = hieroMass.oben + hieroMass.unten + 2 * HIERO_RAND;
    var g = cv.getContext('2d'); g.font = HIERO_GR + 'px ' + HIERO_SCHRIFT; g.fillStyle = TINTE; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillText(t, HIERO_RAND + links, HIERO_RAND + hieroMass.oben);
    glyphenBilder[t] = { src:cv.toDataURL('image/png'), w:cv.width, h:cv.height };
  }
  var b = glyphenBilder[t];
  return '<img class="' + (klasse || 'gs-h') + '" src="' + b.src + '" width="' + b.w + '" height="' + b.h + '" style="aspect-ratio:' + b.w + '/' + b.h + '" alt="">';
}
function fmInnen(z){
  return '<path d="' + z.d + '" fill="none" stroke="' + TINTE + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    (z.punkt ? '<circle cx="' + z.punkt[0] + '" cy="' + z.punkt[1] + '" r="8.5" fill="' + TINTE + '"/>' : '');
}
function fmSvg(z, klasse){ return '<svg class="' + (klasse || 'gs-fm') + '" viewBox="0 0 100 100" aria-hidden="true">' + fmInnen(z) + '</svg>'; }
// Freimaurer-Schlüssel: Gitter # mit 9 Buchstaben ab «ab» bzw. X mit 4 Buchstaben, im Feld 0…300
function fmText(x, y, t){ return '<text x="' + x + '" y="' + (y + 16).toFixed(1) + '" font-family="Andika, Arial, sans-serif" font-weight="700" font-size="46" fill="' + TINTE + '" text-anchor="middle">' + t + '</text>'; }
function fmGitter(ab, punkt){
  var h = '<path d="M100 14V286M200 14V286M14 100H286M14 200H286" stroke="' + TINTE + '" stroke-width="7" stroke-linecap="round" fill="none"/>';
  for (var i = 0; i < 9; i++){
    var cx = 50 + i % 3 * 100, cy = 50 + Math.floor(i / 3) * 100;
    h += fmText(punkt ? cx - 11 : cx, cy, Kern.ABC[ab + i]);
    if (punkt) h += '<circle cx="' + (cx + 22) + '" cy="' + cy + '" r="7" fill="' + TINTE + '"/>';
  }
  return h;
}
function fmX(ab, punkt){
  var h = '<path d="M30 30L270 270M270 30L30 270" stroke="' + TINTE + '" stroke-width="7" stroke-linecap="round" fill="none"/>';
  [[150, 70], [70, 150], [230, 150], [150, 230]].forEach(function(p, i){
    h += fmText(punkt ? p[0] - 11 : p[0], p[1], Kern.ABC[ab + i]);
    if (punkt) h += '<circle cx="' + (p[0] + 22) + '" cy="' + p[1] + '" r="7" fill="' + TINTE + '"/>';
  });
  return h;
}
/* Vogel im Feld 0…100 (Draht bei y = 78), gezeichnet mit Blick nach rechts und für «links» gespiegelt */
var DRAHT_Y = 78;
function draht(x0, x1){ return '<path d="M' + x0 + ' ' + DRAHT_Y + 'H' + x1 + '" stroke="' + TINTE + '" stroke-width="3.4"/>'; }
function vogelInnen(v){
  var h = v[0], sw = v[2], k = '', f = TINTE;
  function schwanz(x, y, gr){   // Ansatz (x, y) hinten unten am Körper
    gr = gr || 1;
    if (sw === 'kurz') return '<path d="M' + (x - 4 * gr) + ' ' + y + 'L' + (x + 4 * gr) + ' ' + y + 'L' + (x + 3 * gr) + ' ' + (y + 18 * gr) + 'L' + (x - 3 * gr) + ' ' + (y + 18 * gr) + 'Z" fill="' + f + '"/>';
    if (sw === 'lang') return '<path d="M' + (x - 4 * gr) + ' ' + y + 'L' + (x + 4 * gr) + ' ' + y + 'L' + (x + 5 * gr) + ' ' + (y + 32 * gr) + 'L' + (x - 5 * gr) + ' ' + (y + 32 * gr) + 'Z" fill="' + f + '"/>';
    return '<path d="M' + (x - 2 * gr) + ' ' + (y - 5 * gr) + 'L' + (x + 5 * gr) + ' ' + (y + 2 * gr) + 'L' + (x - 17 * gr) + ' ' + (y + 26 * gr) + 'L' + (x - 23 * gr) + ' ' + (y + 21 * gr) + 'Z" fill="' + f + '"/>';
  }
  function fuesse(x){ return '<path d="M' + (x - 3) + ' ' + (DRAHT_Y - 6) + 'V' + DRAHT_Y + 'M' + (x + 3) + ' ' + (DRAHT_Y - 6) + 'V' + DRAHT_Y + '" stroke="' + f + '" stroke-width="2.4"/>'; }
  function kopf(x, y, r, schnabelRunter){
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>' +
      (schnabelRunter ? '<path d="M' + (x + r * 0.6) + ' ' + (y + r * 0.5) + 'L' + (x + r * 1.1) + ' ' + (y + r * 1.6) + 'L' + (x + r * 0.05) + ' ' + (y + r * 0.95) + 'Z" fill="' + f + '"/>'
        : '<path d="M' + (x + r * 0.8) + ' ' + (y - r * 0.35) + 'L' + (x + r * 1.75) + ' ' + (y + r * 0.05) + 'L' + (x + r * 0.8) + ' ' + (y + r * 0.45) + 'Z" fill="' + f + '"/>') +
      '<circle cx="' + (x + r * 0.35) + '" cy="' + (y - r * 0.2) + '" r="' + (r * 0.17) + '" fill="#fff"/>';
  }
  if (h === 'liegend'){
    k = '<path d="M30 60L8 52L10 60L30 66Z" fill="' + f + '"/>' + '<ellipse cx="50" cy="63" rx="24" ry="11" fill="' + f + '"/>' + kopf(72, 52, 9) + fuesse(52);
  } else if (h === 'kueken'){
    k = schwanz(46, 68, 0.7) + '<ellipse cx="50" cy="62" rx="11" ry="12" fill="' + f + '"/>' + kopf(54, 46, 8) + fuesse(50);
  } else if (h === 'pickend'){
    k = schwanz(41, 62) + '<ellipse cx="50" cy="58" rx="19" ry="13" transform="rotate(28 50 58)" fill="' + f + '"/>' + kopf(66, 66, 9, true) + fuesse(50);
  } else {
    if (h === 'fluegel') k += '<path d="M42 48L16 20L22 40L38 58Z" fill="' + f + '"/><path d="M58 48L84 20L78 40L62 58Z" fill="' + f + '"/>';
    k += schwanz(47, 66) + '<ellipse cx="50" cy="55" rx="14" ry="19" fill="' + f + '"/>' + kopf(55, 30, 10.5) + fuesse(50);
  }
  return v[1] < 0 ? '<g transform="translate(100 0) scale(-1 1)">' + k + '</g>' : k;
}
function vogelSvg(v, klasse){ return '<svg class="' + (klasse || 'gs-vogel') + '" viewBox="0 0 100 100" aria-hidden="true">' + draht(-1, 101) + vogelInnen(v) + '</svg>'; }
// Draht ohne Vogel (zwischen den Wörtern) bzw. mit einem stehenbleibenden Zeichen darüber
function drahtSvg(text){
  return '<svg class="gs-vogel ' + (text ? 'gs-draht-zeichen' : 'gs-draht-luecke') + '" viewBox="0 0 ' + (text ? 60 : 70) + ' 100" aria-hidden="true">' + draht(-1, text ? 61 : 71) +
    (text ? '<text x="30" y="66" font-family="Andika, Arial, sans-serif" font-size="40" fill="#6E655E" text-anchor="middle">' + esc(text) + '</text>' : '') + '</svg>';
}
function symbolHtml(code){
  if (code.vogel) return vogelSvg(code.vogel);
  if (code.text !== undefined) return '<span class="gs-t">' + esc(code.text) + '</span>';
  if (code.freimaurer) return fmSvg(code.freimaurer);
  if (code.morse) return morseSvg(code.morse);
  if (code.braille) return brailleSvg(code.braille);
  return glyphe(code.glyphe);
}
function vorschauHtml(art){
  var o = { verschiebung:3 }, w = art === 'hieroglyphen' ? 'ABC' : art === 'braille' || art === 'morse' ? 'ABC' : 'ABC';
  return '<span class="gs-vorschau gs-v-' + art + '">' + Array.from(w).map(function(c){ var z = Kern.zeichen(art, c, o); return '<span class="gs-vz">' + symbolHtml(z) + '</span>'; }).join('') + '</span>';
}

/* ---------- Schlüssel ---------- */
function zweiReihen(oben, unten, beschriftung){
  var h = '';
  [[0, 13], [13, 26]].forEach(function(b){
    h += '<table class="gs-reihen"><tr><th>' + beschriftung[0] + '</th>' + oben.slice(b[0], b[1]).map(function(x){ return '<td>' + x + '</td>'; }).join('') + '</tr>' +
      '<tr><th>' + beschriftung[1] + '</th>' + unten.slice(b[0], b[1]).map(function(x){ return '<td class="gs-geheim">' + x + '</td>'; }).join('') + '</tr></table>';
  });
  return h;
}
function tabelle(eintraege, klasse){
  return '<div class="gs-tabelle ' + (klasse || '') + '">' + eintraege.map(function(e){ return '<span class="gs-tab-zelle"><b>' + esc(e[0]) + '</b>' + e[1] + (e[2] ? '<small>' + esc(e[2]) + '</small>' : '') + '</span>'; }).join('') + '</div>';
}
function caesarScheibe(){
  function scheibe(cx, R, rText, rInnen, gr, beschriftung){
    var h = '<circle cx="' + cx + '" cy="110" r="' + R + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1.2"/>' +
      '<circle cx="' + cx + '" cy="110" r="' + rInnen + '" fill="none" stroke="#B9AFA6" stroke-width="0.6"/>';
    for (var i = 0; i < 26; i++){
      var a = i * 360 / 26, a2 = (i + 0.5) * 360 / 26, rad = a2 * Math.PI / 180;
      h += '<path d="M' + (cx + rInnen * Math.sin(rad)).toFixed(2) + ' ' + (110 - rInnen * Math.cos(rad)).toFixed(2) + 'L' + (cx + R * Math.sin(rad)).toFixed(2) + ' ' + (110 - R * Math.cos(rad)).toFixed(2) + '" stroke="#B9AFA6" stroke-width="0.6"/>';
      h += '<text transform="translate(' + cx + ' 110) rotate(' + a.toFixed(2) + ')" y="' + (-rText + gr * 0.35).toFixed(2) + '" font-size="' + gr + '">' + Kern.ABC[i] + '</text>';
    }
    h += '<circle cx="' + cx + '" cy="110" r="2" fill="' + TINTE + '"/><text x="' + cx + '" y="' + (110 + R + 9) + '" font-size="7.5" font-weight="400" fill="#6E655E">' + beschriftung + '</text>';
    return h;
  }
  return '<svg class="gs-scheibe" viewBox="0 0 400 230" role="img" aria-label="Caesar-Scheibe zum Ausschneiden">' +
    '<g font-family="Andika, Arial, sans-serif" font-weight="700" fill="' + TINTE + '" text-anchor="middle">' +
    scheibe(108, 100, 88, 74, 15, 'grosse Scheibe (aussen: Klartext)') + scheibe(300, 72, 61, 47, 13, 'kleine Scheibe (Geheimtext)') + '</g></svg>';
}
function schluesselHtml(art, o){
  var A = Kern.ABC.split('');
  switch (art){
    case 'caesar':
      return '<p class="gs-erklaerung">Verschiebung um <b>' + o.verschiebung + '</b>: Jeder Buchstabe rückt ' + o.verschiebung + ' Stellen weiter – aus A wird ' + Kern.ABC[o.verschiebung % 26] + '. Zum Entschlüsseln den Geheimbuchstaben unten suchen und den Buchstaben darüber lesen.</p>' +
        zweiReihen(A, A.map(function(c){ return Kern.zeichen('caesar', c, o).text; }), ['Klartext', 'Geheim']) +
        (o.scheibe ? '<h3 class="gs-unter">Caesar-Scheibe zum Basteln</h3><p class="gs-erklaerung">Beide Scheiben ausschneiden, die kleine auf die grosse legen und in der Mitte mit einer Musterbeutelklammer befestigen. Dann das A der kleinen Scheibe unter das ' + Kern.ABC[o.verschiebung % 26] + ' der grossen drehen. Aussen steht der Klartext, innen der Geheimtext.</p>' + caesarScheibe() : '');
    case 'atbasch':
      return '<p class="gs-erklaerung">Das Alphabet wird umgedreht: A und Z tauschen, B und Y, C und X … Verschlüsseln und Entschlüsseln geht gleich.</p>' +
        zweiReihen(A, A.map(function(c){ return Kern.zeichen('atbasch', c, o).text; }), ['Klartext', 'Geheim']);
    case 'zahlen':
      return '<p class="gs-erklaerung">Jeder Buchstabe wird durch seine Stelle im Alphabet ersetzt.</p>' + zweiReihen(A, A.map(function(c, i){ return String(i + 1); }), ['Buchstabe', 'Zahl']);
    case 'handy':
      return '<p class="gs-erklaerung">Wie früher beim SMS-Schreiben: Die Ziffer zeigt die Taste, und so oft, wie sie dasteht, wird getippt. B ist der zweite Buchstabe auf der Taste 2, also <b>22</b>.</p>' +
        '<div class="gs-handy">' + [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', ''], ['#', '']]
          .map(function(t){ return '<span class="gs-taste"><b>' + t[0] + '</b><small>' + (t[1] || '&nbsp;') + '</small></span>'; }).join('') + '</div>' +
        tabelle(A.map(function(c){ return [c, '<span class="gs-t">' + Kern.zeichen('handy', c, o).text + '</span>']; }), 'gs-tab-text');
    case 'polybios':
      var g = '<table class="gs-gitter"><tr><th></th>' + [1, 2, 3, 4, 5].map(function(s){ return '<th>' + s + '</th>'; }).join('') + '</tr>';
      for (var r = 0; r < 5; r++){ g += '<tr><th>' + (r + 1) + '</th>'; for (var c = 0; c < 5; c++){ var b = Kern.GITTER[r * 5 + c]; g += '<td>' + (b === 'I' ? 'I/J' : b) + '</td>'; } g += '</tr>'; }
      return '<p class="gs-erklaerung">Jeder Buchstabe wird zu zwei Ziffern: zuerst die <b>Zeile</b>, dann die <b>Spalte</b>. B steht in Zeile 1, Spalte 2, also <b>12</b>. I und J teilen sich ein Feld.</p>' + g + '</table>';
    case 'freimaurer':
      return '<p class="gs-erklaerung">Jeder Buchstabe wird als das Stück Gitter geschrieben, das ihn umgibt – mit Punkt, wenn neben ihm ein Punkt steht.</p>' +
        '<div class="gs-fm-schluessel">' + [[fmGitter, 0, false, 'A bis I'], [fmGitter, 9, true, 'J bis R, mit Punkt'], [fmX, 18, false, 'S bis V'], [fmX, 22, true, 'W bis Z, mit Punkt']]
          .map(function(k){ return '<svg viewBox="0 0 300 300" role="img" aria-label="Schlüssel ' + k[3] + '">' + k[0](k[1], k[2]) + '</svg>'; }).join('') + '</div>' +
        tabelle(A.map(function(c){ return [c, fmSvg(Kern.freimaurer(c), 'gs-fm-k')]; }), 'gs-tab-fm');
    case 'voegel':
      return '<p class="gs-erklaerung">Jeder Buchstabe ist ein Vogel auf dem Draht – achte darauf, wohin er schaut, wie sein Schwanz hängt (kurz, lang oder schräg) und was er tut: sitzen (A–F), mit den Flügeln schlagen (G–L), picken (M–R), als Küken sitzen (S–X) oder liegen (Y, Z).</p>' +
        tabelle(A.map(function(c){ return [c, vogelSvg(Kern.VOEGEL[c], 'gs-vogel-k')]; }), 'gs-tab-voegel');
    case 'morse':
      return '<p class="gs-erklaerung">Jeder Buchstabe besteht aus kurzen (Punkt) und langen (Strich) Zeichen.</p>' +
        tabelle(A.concat(['Ä', 'Ö', 'Ü', 'ß']).map(function(c){ return [c, morseSvg(Kern.MORSE[c], 'gs-morse-k')]; }), 'gs-tab-morse') +
        '<h3 class="gs-unter">Ziffern und Satzzeichen</h3>' + tabelle('0123456789.,?!'.split('').map(function(c){ return [c, morseSvg(Kern.MORSE[c], 'gs-morse-k')]; }), 'gs-tab-morse');
    case 'braille':
      return '<p class="gs-erklaerung">Jedes Zeichen hat sechs Plätze für Punkte, zwei Spalten mit je drei. Blinde Menschen ertasten die erhabenen Punkte mit dem Finger. Die kleinen grauen Punkte zeigen nur die freien Plätze.</p>' +
        tabelle(A.concat(['Ä', 'Ö', 'Ü', 'ß']).map(function(c){ return [c, brailleSvg([Kern.BRAILLE[c]], 'gs-braille-k')]; }), 'gs-tab-braille') +
        '<h3 class="gs-unter">Zahlen und Satzzeichen</h3><p class="gs-erklaerung">Vor einer Zahl steht das Zahlzeichen, danach die Buchstaben a bis j für 1 bis 0.</p>' +
        tabelle([['Zahlzeichen', brailleSvg([Kern.ZAHLZEICHEN], 'gs-braille-k')], ['1', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.A], 'gs-braille-k')], ['2', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.B], 'gs-braille-k')], ['0', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.J], 'gs-braille-k')]]
          .concat('.,?!'.split('').map(function(c){ return [c, brailleSvg([Kern.BRAILLE[c]], 'gs-braille-k')]; })), 'gs-tab-braille');
    case 'hieroglyphen':
      return '<p class="gs-erklaerung">Die alten Ägypter schrieben mit Bildzeichen. Für unser Alphabet nimmt man Zeichen, die für einen Laut stehen. Manche stehen für zwei Buchstaben: C und K, E und I, F und V, U und W.</p>' +
        tabelle(A.map(function(c){ return [c, glyphe(Kern.HIERO[c], 'gs-h-k'), Kern.HIERO_NAME[c]]; }), 'gs-tab-hiero');
  }
  return '';
}
function schriftName(art, o){ var s = SCHRIFTEN.filter(function(x){ return x[0] === art; })[0]; return s[1] + (art === 'caesar' ? ' um ' + o.verschiebung : ''); }

var VORLAGE = '<div class="gs">' +
  '<header class="gs-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Geheimschriften</h1>' +
    '<p>Dein Text in einer Geheimschrift – von der Caesar-Verschiebung über den Freimaurer-Code und das Morsen bis zu Hieroglyphen. Zu jeder Schrift gibt es den Schlüssel zum Entschlüsseln.</p></header>' +
  '<div class="gs-layout"><section class="gs-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimer Text</h2><p>Wörter oder Sätze, auch mehrere Zeilen.</p></div></div>' +
      '<label class="vh" for="gsText">Geheimer Text</label><textarea id="gsText" rows="5" maxlength="400" autocomplete="off" spellcheck="false"></textarea>' +
      '<p class="hinweis" id="gsTextHinweis"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Geheimschrift</h2></div></div>' +
      '<div class="gs-schriften" role="radiogroup" aria-label="Geheimschrift">' +
        SCHRIFTEN.map(function(s){ return '<label><input type="radio" name="gsSchrift" value="' + s[0] + '"><span><i class="gs-vorschau-platz" data-art="' + s[0] + '"></i><b>' + s[1] + '</b><small>' + s[2] + '</small></span></label>'; }).join('') +
      '</div>' +
      '<div class="gs-caesar" id="gsCaesar">' +
        '<div class="opt-raster"><label for="gsVerschiebung">Verschiebung</label><select id="gsVerschiebung">' +
          Array.from({ length:25 }, function(_, i){ return '<option value="' + (i + 1) + '">' + (i + 1) + ' (A → ' + Kern.ABC[i + 1] + ')</option>'; }).join('') + '</select></div>' +
        '<label class="opt"><input type="checkbox" id="gsScheibe"><span>Caesar-Scheibe zum Basteln im Schlüssel</span></label>' +
      '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<p class="feld-label">Grösse der Zeichen</p>' +
      '<div class="gs-chips" role="radiogroup" aria-label="Grösse der Zeichen">' +
        GROESSEN.map(function(g){ return '<label><input type="radio" name="gsGroesse" value="' + g[0] + '"><span>' + g[1] + '</span></label>'; }).join('') + '</div>' +
      '<label class="opt"><input type="checkbox" id="gsLinien"><span>Schreiblinien unter den Zeichen</span></label>' +
      '<div class="opt-raster"><label for="gsTitel">Titel auf dem Blatt</label><input type="text" id="gsTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="gs-ausgabe" aria-label="Ergebnis">' +
    '<div id="gsMeldung" aria-live="polite"></div>' +
    '<div class="gs-teil">' +
      '<h2 class="gs-teil-titel">Geheimtext</h2>' +
      '<div class="gs-werkzeug">' +
        '<button type="button" class="btn klein" id="gsZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
        '<span class="abstand"></span>' +
        Labor.blattSchalterHtml() +
        '<label><input type="checkbox" id="gsMitLoesung"> mit Lösungsblatt</label>' +
        '<label><input type="checkbox" id="gsMitSchluessel"> mit Schlüssel</label>' +
        '<button type="button" class="btn klein" id="gsCodeKopieren" title="Den Geheimtext als Bild kopieren – zum Einfügen in Word">Bild kopieren</button>' +
        '<button type="button" class="btn klein" id="gsCodeBild">Als Bild</button>' +
        '<button type="button" class="btn klein primary" id="gsPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="gsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
      '</div>' +
      '<article class="gs-blatt" id="gsBlatt"></article>' +
      '<p class="gs-tipp" id="gsTipp">Tipp: Auf den Geheimtext klicken – er wird als Bild kopiert und lässt sich in Word mit Ctrl+V (Mac: Cmd+V) einfügen.</p>' +
      '<article class="gs-blatt gs-loesungsblatt" id="gsLoesung" aria-hidden="true"></article>' +
    '</div>' +
    '<div class="gs-teil">' +
      '<h2 class="gs-teil-titel">Schlüssel</h2>' +
      '<div class="gs-werkzeug"><span class="gs-werkzeug-text">Zum Entschlüsseln – auch einzeln.</span><span class="abstand"></span>' +
        '<button type="button" class="btn klein" id="gsSchluesselKopieren" title="Den Schlüssel als Bild kopieren – zum Einfügen in Word">Bild kopieren</button>' +
        '<button type="button" class="btn klein" id="gsSchluesselBild">Als Bild</button>' +
        '<button type="button" class="btn klein primary" id="gsSchluesselPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="gsSchluesselHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Schlüssel herunterladen</button>' +
      '</div>' +
      '<article class="gs-blatt gs-schluessel" id="gsSchluessel"></article>' +
    '</div>' +
  '</section></div>' +
  '<div class="gs-kopiert" id="gsKopiert" role="status" aria-live="polite" hidden></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/></svg>';

Labor.registriere({
  id:'geheimschrift',
  titel:'Geheimschriften',
  kurz:'Caesar, Freimaurer, Vögel, Morse, Blindenschrift, Hieroglyphen und mehr',
  beschreibung:'Ein eigener Text in einer von zehn Geheimschriften – Caesar-Verschiebung, Rückwärts-Alphabet, Zahlen, Handy-Tasten, Koordinaten, Freimaurer-Code, Vögel auf dem Draht, Morse, Blindenschrift oder Hieroglyphen. Mit Schlüssel zum Entschlüsseln.',
  merkmale:['Zehn Geheimschriften', 'Schlüssel einzeln als PDF oder Bild', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/geheimschrift/geheimschrift.css',
  html:VORLAGE,
  start:starte
});

/* Alte Links auf den früheren Generator «Freimaurer-Code» (…/#freimaurer): Geheimschriften mit dem Freimaurer-Code öffnen.
   Läuft vor dem Labor (beim Laden und vor dessen Adresswechsel), damit dieses gleich die richtige Seite zeigt. */
var vorwahl = null;
function alterLink(){ if (location.hash === '#freimaurer'){ vorwahl = 'freimaurer'; history.replaceState(null, '', location.pathname + location.search + '#geheimschrift'); } }
alterLink();
window.addEventListener('hashchange', alterLink);

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'geheimschrift-eingaben', OPT = 'geheimschrift-einstellungen';
  var STANDARD = { art:'caesar', verschiebung:3, scheibe:true, groesse:'mittel', linien:true, mitLoesung:true, mitSchluessel:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); } } catch(x){}
  if (vorwahl){ st.opt.art = vorwahl; vorwahl = null; }
  if (!SCHRIFTEN.some(function(s){ return s[0] === st.opt.art; })) st.opt.art = 'caesar';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#gsMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function titel(){ return st.titel.trim() || 'Geheimbotschaft'; }
  function zellen(){ return Kern.zerlege(st.text, st.opt.art, st.opt); }
  function hatZeichen(){ return zellen().some(function(z){ return z.some(function(w){ return w.some(function(c){ return c.code; }); }); }); }

  // Hieroglyphen-Schrift laden (für die Vorschau und die Schrift selbst); danach alles neu zeichnen
  function hieroLaden(){
    if (hieroBereit || !document.fonts || !document.fonts.load) return;
    var alle = Object.keys(Kern.HIERO).map(function(k){ return String.fromCodePoint.apply(null, Kern.HIERO[k]); }).join('');
    function fertig(){ if (hieroBereit) return; hieroBereit = true; glyphenBilder = {}; hieroMass = null; if (!aus){ vorschauen(); alles(); } }
    function laden(versuch){
      document.fonts.load('40px ' + HIERO_SCHRIFT, alle).then(function(f){
        var da = (f && f.length) || (document.fonts.check && document.fonts.check('40px ' + HIERO_SCHRIFT, alle) && [].some.call(document.fonts, function(x){ return /Egyptian/i.test(x.family) && x.status === 'loaded'; }));
        if (da) fertig(); else if ((versuch || 0) < 8) setTimeout(function(){ laden((versuch || 0) + 1); }, 400);
      }, function(){ if ((versuch || 0) < 8) setTimeout(function(){ laden((versuch || 0) + 1); }, 400); });
    }
    var l = document.getElementById('gsHieroSchrift');
    if (!l){ l = document.createElement('link'); l.id = 'gsHieroSchrift'; l.rel = 'stylesheet'; l.href = HIERO_CSS; l.addEventListener('load', laden); document.head.appendChild(l); }
    else if (l.sheet) laden();
    else l.addEventListener('load', laden);
  }

  /* ---------- Eingaben ---------- */
  $('#gsText').value = st.text;
  $('#gsText').addEventListener('input', function(){ st.text = this.value; speichern(); zeichnen(); });
  $('#gsTitel').value = st.titel;
  $('#gsTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); schluesselZeichnen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="gsSchrift"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = r.value; speichern(); $('#gsZeigeLoesung').setAttribute('aria-pressed', 'false'); hieroLaden(); alles(); });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="gsGroesse"]'), function(r){
    r.checked = r.value === st.opt.groesse;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.groesse = r.value; speichern(); zeichnen(); });
  });
  $('#gsVerschiebung').value = String(st.opt.verschiebung);
  $('#gsVerschiebung').addEventListener('change', function(){ st.opt.verschiebung = +this.value; speichern(); alles(); });
  [['#gsLinien', 'linien', zeichnen], ['#gsScheibe', 'scheibe', schluesselZeichnen], ['#gsMitLoesung', 'mitLoesung'], ['#gsMitSchluessel', 'mitSchluessel']].forEach(function(c){
    $(c[0]).checked = !!st.opt[c[1]];
    $(c[0]).addEventListener('change', function(){ st.opt[c[1]] = this.checked; speichern(); if (c[2]) c[2](); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); schluesselZeichnen(); });
  function vorschauen(){ [].forEach.call(bereich.querySelectorAll('.gs-vorschau-platz'), function(p){ p.innerHTML = vorschauHtml(p.dataset.art); }); }

  /* ---------- Geheimtext ---------- */
  function px(){ return (GROESSEN.filter(function(g){ return g[0] === st.opt.groesse; })[0] || GROESSEN[1])[2]; }
  function codeHtml(){
    var voegel = st.opt.art === 'voegel';   // Vögel: alle Zellen ohne Abstand, dazwischen Draht – ein durchgehender Draht pro Zeile
    var luecke = '<span class="gs-z gs-andere"><span class="gs-s">' + drahtSvg('') + '</span><span class="gs-linie gs-leer"></span></span>';
    return '<div class="gs-code gs-art-' + st.opt.art + (st.opt.linien ? '' : ' ohne-linien') + '" style="--fm:' + px() + 'px">' + zellen().map(function(zeile){
      return '<div class="gs-zeile">' + zeile.map(function(wort, k){
        return (voegel && k ? luecke : '') + '<span class="gs-wort">' + wort.map(function(c){
          if (c.code) return '<span class="gs-z"><span class="gs-s">' + symbolHtml(c.code) + '</span><span class="gs-linie"><b class="gs-loes">' + esc(c.b) + '</b></span></span>';
          if (voegel) return '<span class="gs-z gs-andere"><span class="gs-s">' + drahtSvg(c.b) + '</span><span class="gs-linie gs-leer"></span></span>';
          return '<span class="gs-z gs-andere"><span class="gs-s"><span class="gs-t gs-bleibt">' + esc(c.b) + '</span></span><span class="gs-linie gs-leer"></span></span>';
        }).join('') + '</span>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function zeichnen(){
    var o = st.opt, leer = !hatZeichen();
    $('#gsCaesar').hidden = o.art !== 'caesar';
    $('#gsTextHinweis').textContent = Kern.UMLAUTE[o.art] ? 'Ä, Ö, Ü und ß haben in dieser Schrift eigene Zeichen' + (o.art === 'morse' ? '; Ziffern und einige Satzzeichen auch.' : '; Ziffern bekommen das Zahlzeichen.') :
      'Umlaute werden als AE, OE, UE geschrieben, ß als SS.' + (o.art === 'polybios' ? ' J wird wie I geschrieben.' : '') + ' Ziffern und Satzzeichen bleiben stehen.';
    $('#gsBlatt').hidden = $('#gsLoesung').hidden = leer;
    ['#gsZeigeLoesung', '#gsCodeKopieren', '#gsCodeBild', '#gsPdf', '#gsHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    $('#gsTipp').hidden = leer;
    if (leer){
      $('#gsBlatt').innerHTML = $('#gsLoesung').innerHTML = '';
      meldung('info', '<p>Schreibe links einen Text – er erscheint hier in der Geheimschrift. Den Schlüssel unten kannst du schon jetzt herunterladen.</p>');
      return;
    }
    meldung('', '');
    var name = schriftName(o.art, o);
    $('#gsBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="gs-anleitung">Entschlüssle die Geheimschrift (' + esc(name) + ') mit dem Schlüssel' + (o.linien ? ' und schreibe die Buchstaben auf die Linien' : '') + '.</p>' : '') + codeHtml();
    $('#gsLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="gs-anleitung"><b>Lösung</b></p>') + codeHtml();
    $('#gsBlatt').classList.toggle('zeige-loesung', $('#gsZeigeLoesung').getAttribute('aria-pressed') === 'true');
    var code = $('#gsBlatt .gs-code');
    code.setAttribute('role', 'button'); code.setAttribute('tabindex', '0'); code.title = 'Klicken: als Bild kopieren (zum Einfügen in Word)';
    code.setAttribute('aria-label', 'Geheimtext – klicken, um ihn als Bild zu kopieren');
    var b = $('#gsBlatt');
    if (b.offsetWidth && b.scrollHeight / b.offsetWidth > 1.5) meldung('warnung', '<p>Der Text ist lang für eine A4-Seite – im PDF wird das Blatt verkleinert. Wähle kleinere Zeichen oder kürze den Text.</p>');
  }
  $('#gsZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#gsBlatt').classList.toggle('zeige-loesung', an);
  });

  /* ---------- Schlüssel ---------- */
  function schluesselZeichnen(){
    var o = st.opt;
    $('#gsSchluessel').innerHTML = (o.titelAn ? '<h2>Schlüssel: ' + esc(schriftName(o.art, o)) + '</h2>' : '') + '<div class="gs-art-' + o.art + '">' + schluesselHtml(o.art, o) + '</div>';
  }
  function alles(){ zeichnen(); schluesselZeichnen(); }

  /* ---------- PDF, Bild, Herunterladen ---------- */
  function dateiName(art, endung){ return Labor.pdfName(art, st.titel).replace(/\.pdf$/, '.' + endung); }
  function codeBlaetter(){ return [$('#gsBlatt'), st.opt.mitSchluessel && $('#gsSchluessel'), st.opt.mitLoesung && $('#gsLoesung')].filter(Boolean); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#gsPdf'), function(){ return hatZeichen() && { blaetter:codeBlaetter(), name:dateiName('Geheimschrift', 'pdf') }; }, fehler);
  Labor.pdfKnopf($('#gsSchluesselPdf'), function(){ return { blaetter:[$('#gsSchluessel')], name:'Schluessel-' + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || 'Geheimschrift') + '.pdf' }; }, fehler);
  Labor.bildKnopf($('#gsCodeBild'), function(){ return hatZeichen() && { blatt:$('#gsBlatt'), name:dateiName('Geheimschrift', 'png') }; }, fehler);
  Labor.bildKnopf($('#gsSchluesselBild'), function(){ return { blatt:$('#gsSchluessel'), name:'Schluessel-' + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || 'Geheimschrift') + '.png' }; }, fehler);
  /* ---------- Als Bild kopieren (zum Einfügen in Word) ---------- */
  var kopiertZeit = 0;
  function bestaetigen(text){
    var k = $('#gsKopiert'); k.textContent = text; k.hidden = false; k.classList.add('an');
    clearTimeout(kopiertZeit); kopiertZeit = setTimeout(function(){ k.classList.remove('an'); setTimeout(function(){ k.hidden = true; }, 300); }, 2600);
  }
  function kopieren(el, was, knopf, eng){
    if (!el) return;
    var text = knopf && knopf.textContent;
    if (knopf){ knopf.disabled = true; knopf.textContent = 'Wird kopiert …'; }
    el.classList.add('gs-wird-kopiert');
    Labor.bildKopieren(el, eng ? { eng:'.gs-z' } : {}).then(function(){
      bestaetigen('✓ ' + was + ' als Bild kopiert – in Word mit Ctrl+V (Mac: Cmd+V) einfügen.');
    }, function(e){
      meldung('warnung', '<p>Das Kopieren hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '. Lade das Bild mit «Als Bild» herunter und füge es in Word ein.</p>');
    }).then(function(){ el.classList.remove('gs-wird-kopiert'); if (knopf){ knopf.disabled = false; knopf.textContent = text; } });
  }
  $('#gsCodeKopieren').addEventListener('click', function(){ if (hatZeichen()) kopieren($('#gsBlatt .gs-code'), 'Geheimtext', this, true); });
  $('#gsSchluesselKopieren').addEventListener('click', function(){ kopieren($('#gsSchluessel'), 'Schlüssel', this); });
  $('#gsBlatt').addEventListener('click', function(ev){ var c = ev.target.closest('.gs-code'); if (c) kopieren(c, 'Geheimtext', null, true); });
  $('#gsBlatt').addEventListener('keydown', function(ev){ var c = ev.target.closest('.gs-code'); if (c && (ev.key === 'Enter' || ev.key === ' ')){ ev.preventDefault(); kopieren(c, 'Geheimtext', null, true); } });

  var speicherOrt = null;
  if (Labor.imArtefakt()){
    ['#gsPdf', '#gsSchluesselPdf', '#gsCodeBild', '#gsSchluesselBild'].forEach(function(s){ $(s).hidden = true; });
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#gsHerunterladen').hidden = $('#gsSchluesselHerunterladen').hidden = false; });
  }
  function htmlSpeichern(blaetter, name){
    if (!speicherOrt) return;
    var inhalt = blaetter.map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.gs-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  }
  $('#gsHerunterladen').addEventListener('click', function(){ if (hatZeichen()) htmlSpeichern(codeBlaetter(), dateiName('Geheimschrift', 'html')); });
  $('#gsSchluesselHerunterladen').addEventListener('click', function(){ htmlSpeichern([$('#gsSchluessel')], 'Schluessel-' + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || 'Geheimschrift') + '.html'); });

  vorschauen(); alles();
  hieroLaden();
  if (document.fonts && document.fonts.load) document.fonts.load('700 20px Andika').then(function(){ if (!aus) schluesselZeichnen(); }, function(){});
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
