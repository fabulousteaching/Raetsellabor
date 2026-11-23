/* Rätsellabor – Generator «Geheimschriften»
   Ein Text in einer von siebzehn Geheimschriften, jeweils mit dem passenden Schlüssel zum Entschlüsseln:
   Caesar-Verschiebung (mit Caesar-Scheibe zum Basteln), Rückwärts-Alphabet, Zahlen-Code, Handy-Tasten,
   Koordinaten-Gitter (Polybios), Freimaurer-Code, Vögel auf dem Draht, Kreis-Code, Bücher-Code, Bärte-Code, Segment-Code,
   Altlatein, Runen, Fingeralphabet, Morse-Code, Blindenschrift (Braille) und Hieroglyphen.
   Alte Links auf …/#freimaurer (früher ein eigener Generator) öffnen die Geheimschriften mit dem Freimaurer-Code.
   Herunterladen: Geheimtext (PDF, wahlweise mit Lösungsblatt und Schlüssel; oder als Bild) und der Schlüssel einzeln. */
(function(){
'use strict';
var tx = Labor.uebersetzer('geheimschrift');

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
  /* Kreis-Code (Circles, Vorlage kryptografie.de): jedes Zeichen aus Bögen eines Kreises und Strecken.
     ['b', von, bis]: Bogen im Uhrzeigersinn, Winkel in Grad (0 rechts, 90 unten, 180 links, 270 oben); ['k']: ganzer Kreis;
     ['l', x1, y1, x2, y2]: Strecke, Kreis mit Radius 1 um (0, 0), y nach unten. Wie in der Vorlage sehen 5 und S gleich aus. */
  var H = ['l', -1, 0, 1, 0], V = ['l', 0, -1, 0, 1], LUECKE_UNTEN = ['b', 100, 440], LUECKE_OBEN = ['b', 280, 620];
  var KREISE = {
    '0':[['k'], ['l', -0.04, 0.04, -0.5, 0.54]],
    '1':[['b', 190, 270], ['b', 10, 170], V],
    '2':[['b', 190, 270], V, ['b', 10, 90]],
    '3':[['b', 190, 270], ['l', 0, -1, 0, 0], ['l', 0, 0, 1, 0], ['b', 0, 80]],
    '4':[['b', 180, 270], V, H],
    '5':[['b', 180, 260], H, ['b', 0, 80]],
    '6':[['b', 0, 258], H],
    '7':[['b', 190, 360], ['l', 1, 0, 0, 0], ['l', 0, 0, 0, 1]],
    '8':[['b', 180, 270], V, H, ['b', 0, 90]],
    '9':[['b', 180, 440], H],
    A:[LUECKE_UNTEN, H], B:[['b', 0, 270], ['l', 0, 0, 1, 0], ['l', 0, 0, 0, -1]], C:[['b', 10, 350]], D:[['b', 190, 440]],
    E:[['b', 10, 350], ['l', -1, 0, -0.15, 0]], F:[['b', 100, 350], ['l', -1, 0, -0.15, 0]], G:[['b', 0, 260], ['l', 0.16, 0, 1, 0]],
    H:[['b', 280, 440], ['b', 100, 260], H], I:[['b', 10, 170], ['b', 190, 350], V], J:[['b', 280, 530]],
    K:[['b', 180, 260], H, ['l', 0, 0, 0, 1]], L:[['b', 10, 260]], M:[LUECKE_UNTEN, ['l', 0, -1, 0, -0.15]], N:[LUECKE_UNTEN], O:[['k']],
    P:[['b', 100, 360], H], Q:[['k'], ['l', 0, 0.15, 0, 1]], R:[['b', 100, 270], ['l', 0, -1, 0, 0], H, ['b', 0, 80]],
    S:[['b', 180, 260], H, ['b', 0, 80]], T:[['b', 190, 350], V], U:[LUECKE_OBEN], V:[['b', 90, 260], ['l', 0, 1, 0, 0], ['l', 0, 0, 1, 0]],
    W:[LUECKE_OBEN, ['l', 0, 0.15, 0, 1]], X:[H, V], Y:[['b', 180, 260], ['b', 280, 360], H, ['l', 0, 0, 0, 1]], Z:[['b', 280, 360], H, ['b', 100, 180]]
  };
  /* Bücher-Code: das Bücher-Alphabet aus der Vorlage (Bilder in raetsel/geheimschrift/buecher/, alle im gleichen
     Massstab auf gleich grossen Feldern mit gemeinsamer Grundlinie) – A–Z und . , ! - */
  var BUECHER = {};
  ABC.split('').forEach(function(c){ BUECHER[c] = c.toLowerCase(); });
  BUECHER['.'] = 'punkt'; BUECHER[','] = 'komma'; BUECHER['!'] = 'ausrufezeichen'; BUECHER['-'] = 'bindestrich';
  /* Bärte-Code, Altlatein und Runen: die ausgeschnittenen Zeichen der Vorlagen (raetsel/geheimschrift/<art>/a … z) */
  var BILDZEICHEN = {};
  ABC.split('').forEach(function(c){ BILDZEICHEN[c] = c.toLowerCase(); });
  /* Segment-Code: 14-Segment-Anzeige. a oben, b rechts oben, c rechts unten, d unten, e links unten, f links oben,
     g1 und g2 Mitte links und rechts, h i j oben (schräg links, senkrecht, schräg rechts), k l m unten (schräg links, senkrecht, schräg rechts) */
  var SEGMENTE = {
    A:'a b c e f g1 g2', B:'a b c d g2 i l', C:'a d e f', D:'a b c d i l', E:'a d e f g1 g2', F:'a e f g1 g2', G:'a c d e f g2', H:'b c e f g1 g2',
    I:'a d i l', J:'b c d e', K:'e f g1 j m', L:'d e f', M:'b c e f h j', N:'b c e f h m', O:'a b c d e f', P:'a b e f g1 g2', Q:'a b c d e f m',
    R:'a b e f g1 g2 m', S:'a c d g2 h', T:'a i l', U:'b c d e f', V:'e f j k', W:'b c e f k m', X:'h j k m', Y:'h j l', Z:'a d j k',
    0:'a b c d e f j k', 1:'b c j', 2:'a b d e g1 g2', 3:'a b c d g2', 4:'b c f g1 g2', 5:'a c d f g1 g2', 6:'a c d e f g1 g2', 7:'a b c',
    8:'a b c d e f g1 g2', 9:'a b c d f g1 g2'
  };
  Object.keys(SEGMENTE).forEach(function(k){ SEGMENTE[k] = SEGMENTE[k].split(' '); });
  /* Bausteine: jeder Buchstabe ein Baustein von oben – die Anzahl Noppen und die Farbe verraten ihn. A–I: 2 × 2 Noppen,
     J–R: 2 × 3, S–Z: 2 × 4; in jeder Gruppe die Farben der Reihe nach (wie im Regenbogen, dazu Rosa). → [Farbe, Noppen je Reihe] */
  var STEIN_FARBEN = ['rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'hellblau', 'blau', 'violett', 'rosa'];
  var BAUSTEINE = {};
  ABC.split('').forEach(function(c, i){ BAUSTEINE[c] = [STEIN_FARBEN[i % 9], 2 + Math.floor(i / 9)]; });
  // Text in Grossbuchstaben; Umlaute und ß bleiben (Morse, Blindenschrift) oder werden zu AE, OE, UE, SS
  function normal(text, umlaute){
    var t = String(text || '').replace(/ẞ/g, 'ß').replace(/ß/g, umlaute ? '' : 'SS').toUpperCase().replace(/Œ/g, 'OE').replace(/Æ/g, 'AE');
    if (!umlaute) t = t.replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    return t.replace(/Ä/g, '').replace(/Ö/g, '').replace(/Ü/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(//g, 'Ä').replace(//g, 'Ö').replace(//g, 'Ü').replace(//g, 'ß');
  }
  /* Ein Zeichen verschlüsseln → { text } | { morse } | { braille:[muster, …] } | { glyphe:[codepoints] } | null (bleibt stehen)
     vorher: das Zeichen davor (für das Zahlzeichen der Blindenschrift) */
  function roemisch(n){
    var t = '';
    [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(function(p){ while (n >= p[0]){ t += p[1]; n -= p[0]; } });
    return t;
  }
  function binaer(n){ return ('00000' + n.toString(2)).slice(-5); }
  function zeichen(art, c, o, vorher){
    var i = ABC.indexOf(c);
    switch (art){
      case 'caesar': return i < 0 ? null : { text:ABC[(i + (o.verschiebung || 3)) % 26] };
      // Caesar für die Unterstufe: innere Scheibe mit Emojis (Thema wählbar) oder 26 Farben; Verschiebung 0–25
      case 'emojis': return i < 0 || !EMOJI_THEMEN[o.emojiThema] ? null : { emoji:EMOJI_THEMEN[o.emojiThema].liste[(i + (+o.bildVerschiebung || 0)) % 26] };
      case 'farben': return i < 0 ? null : { farbe:FARB_CODE[(i + (+o.bildVerschiebung || 0)) % 26] };
      // Anlaut-Emojis: ein Emoji, dessen Wort mit dem Buchstaben anfängt (welches, entscheidet zerlege – siehe anlautWahl)
      case 'anlaut': return i < 0 ? null : anlautWahl(c, o, 0);
      case 'atbasch': return i < 0 ? null : { text:ABC[25 - i] };
      // Spiegelschrift: das Zeichen selbst, gespiegelt oder gedreht gezeichnet (o.spiegelArt)
      case 'spiegel': return /\s/.test(c) ? null : { spiegel:c, sp:o.spiegelArt || 'horizontal' };
      case 'zahlen': return i < 0 ? null : { text:String(i + 1) };
      // Römische Zahlen: Stelle im Alphabet (A = I … Z = XXVI); Ziffern 1–9 ebenfalls römisch, die Null bleibt
      case 'roemisch': return i >= 0 ? { text:roemisch(i + 1) } : /[1-9]/.test(c) ? { text:roemisch(+c) } : null;
      // Binärcode: Stelle im Alphabet als Binärzahl mit 5 Stellen (A = 00001 … Z = 11010), als Ziffern oder Perlen
      case 'binaer': return i < 0 ? null : o.binArt === 'perlen' ? { perlen:binaer(i + 1) } : { text:binaer(i + 1) };
      // Halbe Schrift: nur die obere oder untere Hälfte jedes Buchstabens (und jeder Ziffer)
      case 'halb': return /[A-Z0-9]/.test(c) ? { halb:c, ha:o.halbArt === 'unten' ? 'unten' : 'oben' } : null;
      case 'handy':
        for (var h = 0; h < HANDY.length; h++){ var p = HANDY[h][1].indexOf(c); if (p >= 0) return { text:new Array(p + 2).join(HANDY[h][0]) }; }
        return null;
      case 'polybios':
        var g = GITTER.indexOf(c === 'J' ? 'I' : c);
        return g < 0 ? null : { text:String(Math.floor(g / 5) + 1) + String(g % 5 + 1) };
      case 'freimaurer': return i < 0 ? null : { freimaurer:freimaurer(c) };
      case 'voegel': return i < 0 ? null : { vogel:VOEGEL[c] };
      case 'kreise': return KREISE[c] ? { kreis:KREISE[c] } : null;
      case 'buecher': return BUECHER[c] ? { bild:['buecher', BUECHER[c]] } : null;
      case 'baerte': case 'altlatein': case 'runen': return i < 0 ? null : { bild:[art, BILDZEICHEN[c]] };
      case 'finger': return FINGER[c] ? { bild:['finger', FINGER[c]] } : null;
      case 'segmente': return SEGMENTE[c] ? { segmente:SEGMENTE[c], ausmalen:o.segArt === 'ausmalen' } : null;
      case 'bausteine': return i < 0 ? null : { stein:BAUSTEINE[c] };
      // Erpresserschrift: Buchstaben (mit Umlauten und ß), Ziffern, ! und ? als ausgeschnittene Schnipsel; das Aussehen
      // (Schrift, Farben, Papier, Drehung) kommt beim Zeichnen aus seed und der Nummer des Schnipsels (nr, siehe zerlege)
      case 'erpresser': return /^[A-ZÄÖÜß0-9!?]$/.test(c) ? { schnipsel:c, seed:o.erpSeed || 1, misch:o.erpMisch !== false } : null;
      case 'noten': return notenBuchstaben(o.notenBS).indexOf(c) >= 0 ? { note:SPR !== 'de' && c === 'B' ? 'H' : c } : null;
      case 'morse': return MORSE[c] ? { morse:MORSE[c] } : null;
      case 'braille':
        if (/[0-9]/.test(c)){ var m = BRAILLE[ZIFFER_BRAILLE[+c]]; return { braille:/[0-9]/.test(vorher || '') ? [m] : [ZAHLZEICHEN, m] }; }
        return BRAILLE[c] ? { braille:[BRAILLE[c]] } : null;
      case 'hieroglyphen': return HIERO[c] ? { glyphe:HIERO[c] } : null;
    }
    return null;
  }
  /* Fingeralphabet (Deutschschweizer Gebärdensprache, Darstellung SGB-FSS): A–Z, dazu eigene Handzeichen für Ä, Ö, Ü, CH und SCH */
  var FINGER = {};
  ABC.split('').forEach(function(c){ FINGER[c] = c.toLowerCase(); });
  FINGER['Ä'] = 'ae'; FINGER['Ö'] = 'oe'; FINGER['Ü'] = 'ue'; FINGER.CH = 'ch'; FINGER.SCH = 'sch';
  // Wort in Zeichen teilen; beim Fingeralphabet sind SCH und CH je ein Zeichen
  function teilen(w, art){
    if (art !== 'finger') return Array.from(w);
    var aus = [], z = Array.from(w);
    for (var i = 0; i < z.length;){
      var drei = z.slice(i, i + 3).join(''), zwei = z.slice(i, i + 2).join('');
      if (drei === 'SCH'){ aus.push(drei); i += 3; } else if (zwei === 'CH'){ aus.push(zwei); i += 2; } else { aus.push(z[i]); i++; }
    }
    return aus;
  }
  var UMLAUTE = { morse:true, braille:true, finger:true, erpresser:true, noten:true };
  /* Notenschrift: nur die Tonnamen C D E F G A H. Wörter mit anderen Buchstaben (auch Umlauten) oder Ziffern gehen nicht. */
  /* Emoji-Scheibe: je Thema 26 gut unterscheidbare Emojis (verbreitete Zeichen, auf allen Geräten vorhanden) */
  var EMOJI_THEMEN = {
    tiere:{ name:'Tiere', liste:['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦉', '🐴', '🦄', '🐝', '🐞', '🦋', '🐢', '🐘', '🦒', '🐙', '🐳'] },
    essen:{ name:'Essen', liste:['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🍅', '🥕', '🌽', '🥦', '🍄', '🥨', '🧀', '🍕', '🍔', '🍟', '🌭', '🍦', '🍩', '🍪'] },
    weltall:{ name:'Weltall & Wetter', liste:['☀️', '🌙', '⭐', '☁️', '🌧️', '🌈', '❄️', '⛄', '🌪️', '💧', '🔥', '⚡', '🌍', '🪐', '🚀', '🛸', '👽', '☄️', '🔭', '🌋', '🌊', '🌡️', '☂️', '🌌', '🧭', '🏔️'] },
    sport:{ name:'Sport & Spiel', liste:['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '⛸️', '🛹', '🚲', '🏆', '🥇', '🎯', '🎳', '🎮', '🧩', '🎲', '♟️', '🪁', '🎨', '🎸', '🥁', '🎺', '🎻'] },
    natur:{ name:'Natur & Garten', liste:['🌲', '🌳', '🌴', '🌵', '🌱', '🌿', '🍀', '🍁', '🍂', '🌾', '🌷', '🌹', '🌻', '🌼', '🌸', '💐', '🍄', '🌰', '🐚', '🐌', '🐛', '🐜', '🕷️', '🐿️', '🦔', '🐸'] },
    fahrzeuge:{ name:'Fahrzeuge', liste:['🚗', '🚕', '🚌', '🚑', '🚒', '🚓', '🚜', '🏎️', '🏍️', '🚲', '🛴', '🛹', '🚂', '🚄', '🚇', '🚁', '✈️', '🪂', '🚀', '🛸', '🛶', '⛵', '🚢', '🚤', '🚠', '🎈'] }
  };
  /* Anlaut-Emojis: jeder Buchstabe ein Emoji, dessen Wort mit diesem Buchstaben anfängt – in der Sprache der Seite.
     Je Buchstabe mehrere Emojis (gut erkennbar, möglichst eindeutig benannt; ohne Wörter, die gleich klingen wie ein anderer
     Buchstabe, z. B. kein «Schlange» für S). «*» = neues Emoji (ab 2021), nur wenn das Gerät es zeigen kann (o.anlautDa).
     Für X gibt es (fast) kein Emoji: X bleibt dann stehen. */
  var ANLAUT_ROH = {
    de:{ A:'🐒 Affe|🍎 Apfel|🍍 Ananas|⚓ Anker', B:'🍌 Banane|🐝 Biene|🐻 Bär|🌳 Baum|📖 Buch', C:'🤡 Clown|💻 Computer|🤠 Cowboy', D:'🦕 Dino|🐉 Drache|🍩 Donut',
      E:'🐘 Elefant|🦆 Ente|🍓 Erdbeere', F:'🐸 Frosch|🐟 Fisch|🦊 Fuchs|🔥 Feuer', G:'🦒 Giraffe|🎸 Gitarre|👻 Gespenst|🎁 Geschenk', H:'🏠 Haus|🐶 Hund|🎩 Hut|🐔 Huhn|🍯 Honig',
      I:'🦔 Igel|🏝️ Insel', J:'🧥 Jacke|👖 Jeans|🃏 Joker', K:'🐱 Katze|👑 Krone|🌵 Kaktus|🍒 Kirsche|🐄 Kuh', L:'🦁 Löwe|🦙 Lama|🍭 Lolli',
      M:'🐭 Maus|🌙 Mond|🐞 Marienkäfer|🧲 Magnet', N:'👃 Nase|🦏 Nashorn|*🪺 Nest', O:'👂 Ohr|🍊 Orange|👵 Oma|🦦 Otter', P:'🐧 Pinguin|🍕 Pizza|🍄 Pilz|🐼 Panda',
      Q:'*🪼 Qualle|🟦 Quadrat', R:'🚀 Rakete|🌈 Regenbogen|🤖 Roboter|🌹 Rose', S:'☀️ Sonne|🧦 Socken|🥗 Salat|🍲 Suppe', T:'🐯 Tiger|🍅 Tomate|🌷 Tulpe|🚜 Traktor|🥁 Trommel',
      U:'⌚ Uhr|🛸 Ufo|🩲 Unterhose', V:'🐦 Vogel|🌋 Vulkan|🧛 Vampir', W:'🐋 Wal|🐺 Wolf|🎲 Würfel|☁️ Wolke', X:'', Y:'🧘 Yoga|🪀 Yo-Yo', Z:'🦓 Zebra|🍋 Zitrone|⛺ Zelt|🧅 Zwiebel|🦷 Zahn' },
    en:{ A:'🍎 apple|🐜 ant|🥑 avocado|🚑 ambulance', B:'🍌 banana|🐻 bear|🎈 balloon|🦋 butterfly|🐝 bee', C:'🐱 cat|🚗 car|🐄 cow|🍪 cookie|🤡 clown', D:'🐶 dog|🦆 duck|🐬 dolphin|🐉 dragon|🍩 donut',
      E:'🐘 elephant|🥚 egg|👂 ear|🦅 eagle', F:'🐸 frog|🐟 fish|🦊 fox|🔥 fire', G:'🦒 giraffe|🍇 grapes|🎸 guitar|👻 ghost|🎁 gift', H:'🏠 house|🐴 horse|🎩 hat|🍯 honey|🦔 hedgehog',
      I:'🍦 ice cream|🏝️ island|🧊 ice', J:'🧥 jacket|👖 jeans|🧃 juice|🃏 joker|*🪼 jellyfish', K:'🔑 key|🪁 kite|🦘 kangaroo|🐨 koala|🥝 kiwi', L:'🦁 lion|🍋 lemon|🐞 ladybug|🦙 llama',
      M:'🐭 mouse|🌙 moon|🐒 monkey|🍄 mushroom|🧲 magnet', N:'👃 nose|🍜 noodles|📰 newspaper|*🪺 nest', O:'🐙 octopus|🍊 orange|🦉 owl|🧅 onion|🦦 otter', P:'🐧 penguin|🍕 pizza|🐷 pig|🐼 panda|🍍 pineapple',
      Q:'❓ question mark', R:'🚀 rocket|🌈 rainbow|🐰 rabbit|🤖 robot|🌹 rose', S:'⭐ star|🐍 snake|🐌 snail|🧦 socks|🍓 strawberry|☀️ sun', T:'🐯 tiger|🍅 tomato|🌳 tree|🐢 turtle|🚂 train',
      U:'🦄 unicorn|☂️ umbrella|🛸 UFO', V:'🌋 volcano|🎻 violin|🧛 vampire|🚐 van', W:'🐋 whale|🐺 wolf|🍉 watermelon|⌚ watch', X:'*🩻 x-ray', Y:'🪀 yo-yo|🧶 yarn|🧘 yoga', Z:'🦓 zebra|🧟 zombie' },
    fr:{ A:'🐝 abeille|🍍 ananas|🌳 arbre|⚓ ancre|🥑 avocat', B:'🍌 banane|⛵ bateau|🍬 bonbon|🐳 baleine', C:'🥕 carotte|🍒 cerise|🦀 crabe|🐊 crocodile|🐱 chat', D:'🐬 dauphin|🐉 dragon|🎲 dé|🦷 dent|🦕 dinosaure',
      E:'🐘 éléphant|⭐ étoile|🐌 escargot|🧽 éponge', F:'🍓 fraise|🐜 fourmi|🧀 fromage|👻 fantôme|🌸 fleur', G:'🦒 girafe|🍰 gâteau|🎸 guitare|🐸 grenouille|🧤 gants', H:'🦉 hibou|🚁 hélicoptère|🦔 hérisson|🍔 hamburger',
      I:'🏝️ île|🏢 immeuble', J:'🧃 jus|👖 jean|🦵 jambe|🃏 joker', K:'🥝 kiwi|🦘 kangourou|🐨 koala|🛶 kayak', L:'🦁 lion|🐰 lapin|🌙 lune|🐺 loup|🥛 lait',
      M:'🐑 mouton|🍯 miel|🍈 melon|🏍️ moto', N:'👃 nez|☁️ nuage|🍜 nouilles|*🪺 nid', O:'👂 oreille|🍊 orange|🐦 oiseau|🐻 ours|🧅 oignon', P:'🍎 pomme|🐧 pingouin|🐔 poule|🍐 poire|🦜 perroquet',
      Q:'🎳 quilles', R:'🤖 robot|🌹 rose|🦊 renard|🦈 requin|🍇 raisin', S:'🐍 serpent|🐭 souris|🐒 singe|☀️ soleil|🍲 soupe', T:'🐯 tigre|🍅 tomate|🐢 tortue|🚂 train|🚜 tracteur',
      U:'🏭 usine', V:'🚲 vélo|🐄 vache|🌋 volcan|🎻 violon|🚗 voiture', W:'🚃 wagon', X:'', Y:'👀 yeux|🪀 yo-yo|🧘 yoga', Z:'🦓 zèbre|🧟 zombie' }
  };
  var ANLAUT = {};   // Sprache → Buchstabe → [[Emoji, Wort, neu], …]
  Object.keys(ANLAUT_ROH).forEach(function(sp){
    ANLAUT[sp] = {};
    Object.keys(ANLAUT_ROH[sp]).forEach(function(c){
      ANLAUT[sp][c] = ANLAUT_ROH[sp][c] ? ANLAUT_ROH[sp][c].split('|').map(function(x){ var neu = x[0] === '*', t = neu ? x.slice(1) : x, k = t.indexOf(' '); return [t.slice(0, k), t.slice(k + 1), neu]; }) : [];
    });
  });
  // die Emojis, die das Gerät zeigen kann: alte immer, neue nur mit o.anlautDa[emoji]
  function anlautListe(c, o){ return ((ANLAUT[SPR] || ANLAUT.de)[c] || []).filter(function(x){ return !x[2] || !!(o && o.anlautDa && o.anlautDa[x[0]]); }); }
  /* k: wievielter gleicher Buchstabe im Text (0, 1, 2 …) – mit Abwechslung bekommt jeder ein anderes Emoji; anlautSeed: «Andere Emojis» */
  function anlautWahl(c, o, k){
    var l = anlautListe(c, o);
    if (!l.length) return null;
    var s = +(o && o.anlautSeed) || 0, start = s ? (s * 7 + ABC.indexOf(c) * 3) % l.length : 0, w = l[(start + (o && o.anlautMisch === false ? 0 : k)) % l.length];
    return { emoji:w[0], wort:w[1], anlaut:c };
  }
  /* Regenbogen-Scheibe: 13 Regenbogenfarben, je dunkel und hell abwechselnd – Nachbarn sind so gut zu unterscheiden */
  var FARB_CODE = ['#B71C1C', '#FF8A80', '#E65100', '#FFB74D', '#A86400', '#FFD54F', '#8C8500', '#FFF176', '#4E7D16', '#C5E384', '#1B5E20', '#7FCF86', '#00695C',
    '#7ED3C8', '#00707F', '#84E0EC', '#01579B', '#8BD3F9', '#1A3FA8', '#9DB4F0', '#311B92', '#B8A6E0', '#6A1B9A', '#DDA0E8', '#A0105A', '#F7A1C4'];
  // Sprache der Seite: auf Englisch und Französisch heissen die Töne C D E F G A B (B = deutsches H, ohne ♭); in Node-Tests Deutsch
  var SPR = typeof Labor !== 'undefined' && Labor.sprache ? Labor.sprache : 'de';
  var NOTEN = SPR === 'de' ? 'CDEFGAH' : 'CDEFGAB';
  // Mit B und S (wie bei Bach, nur Deutsch): B = H mit ♭, S = Es = E mit ♭
  function notenBuchstaben(bs){ return bs && SPR === 'de' ? 'CDEFGAHBS' : NOTEN; }
  // Name eines Tons, wie er auf dem Blatt steht (intern ist H der Ton zwischen A und dem hohen C)
  function notenName(n){ return SPR !== 'de' && n === 'H' ? 'B' : n; }
  // Höhe im Notensystem (0 = tiefes C … 6 = H); B steht wie H, S wie E – nur mit ♭ davor
  var NOTEN_STUFE = { C:0, D:1, E:2, S:2, F:3, G:4, A:5, H:6, B:6 };
  // Tonhöhe als MIDI-Nummer (für die Hörseite): tiefes C = 60
  var NOTEN_MIDI = { C:60, D:62, S:63, E:64, F:65, G:67, A:69, B:70, H:71 };
  function notenMidi(code){ return code.note === 'C' && code.hoch ? 72 : NOTEN_MIDI[code.note]; }
  var NOTEN_WOERTER = SPR === 'en' ? ['bad', 'bag', 'bed', 'bee', 'cab', 'dad', 'egg', 'add', 'age', 'ace', 'fee', 'face', 'cafe', 'cage', 'bead', 'beef', 'edge',
      'fade', 'deaf', 'aged', 'badge', 'faced', 'baggage', 'cabbage', 'decade']
    : SPR === 'fr' ? ['bac', 'bec', 'dé', 'fée', 'âge', 'âgé', 'gag', 'abbé', 'bébé', 'café', 'cage', 'face', 'fade', 'baba', 'dada', 'gaffe', 'baffe', 'bagage', 'dégage', 'décade']
    : ['da', 'ach', 'aha', 'ade', 'Ehe', 'Fee', 'Gag', 'Hag', 'fad', 'geh', 'haha', 'Dach', 'Fach', 'Chef', 'Cafe', 'Affe', 'Egge', 'Gage', 'gaga', 'Dada',
    'fade', 'Hege', 'gehe', 'fege', 'Haff', 'Fehde', 'gaffe', 'Cache', 'Gehege'];
  // Zusätzlich mit B und S
  var NOTEN_WOERTER_BS = SPR !== 'de' ? [] : ['das', 'des', 'dass', 'sah', 'Ass', 'Bad', 'Gas', 'Bach', 'Base', 'Bass', 'bade', 'Ebbe', 'Gabe', 'Hase', 'Fass', 'Asse', 'Esse', 'gebe', 'hebe',
    'Bache', 'Dachs', 'Gasse', 'Sache', 'Asche', 'Esche', 'Abgas', 'Schaf', 'schade', 'fasse', 'Schach', 'Abgabe', 'Seebad', 'Bagage', 'schaffe'];
  // Wörter eines Textes, die sich nicht mit Noten schreiben lassen → [{ wort, falsch:'U, S' }]
  function notenFalsch(text, bs){
    var aus = [], gesehen = {}, erlaubt = notenBuchstaben(bs);
    String(text || '').split(/\s+/).forEach(function(w){
      var b = Array.from(normal(w, true)).filter(function(c){ return /[\p{L}\p{N}]/u.test(c) && erlaubt.indexOf(c) < 0; });
      var rein = w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      if (b.length && !gesehen[rein]){ gesehen[rein] = true; aus.push({ wort:rein, falsch:b.filter(function(c, i){ return b.indexOf(c) === i; }).join(', ') }); }
    });
    return aus;
  }
  /* Spiegelschrift: Gross-/Kleinschreibung, Umlaute und Satzzeichen bleiben; nur die Reihenfolge ändert sich je nach Art:
     horizontal (Spiegelschrift) und rückwärts: jede Zeile von rechts nach links · Kopf: alles rückwärts, unterste Zeile oben ·
     vertikal: Zeilen von unten nach oben · Wörter rückwärts: jedes Wort für sich */
  function spiegelZerlegen(text, o){
    var sp = o.spiegelArt || 'horizontal';
    var zeilen = String(text || '').normalize('NFC').replace(/\r\n?/g, '\n').split('\n').map(function(z){
      return z.split(/\s+/).filter(Boolean).map(function(w){ return Array.from(w).map(function(c){ return { b:c, code:{ spiegel:c, sp:sp } }; }); });
    });
    if (sp === 'kopf' || sp === 'vertikal') zeilen.reverse();
    if (sp === 'horizontal' || sp === 'rueckwaerts' || sp === 'kopf') zeilen.forEach(function(z){ z.reverse(); z.forEach(function(w){ w.reverse(); }); });
    if (sp === 'woerter') zeilen.forEach(function(z){ z.forEach(function(w){ w.reverse(); }); });
    return zeilen;
  }
  /* Spiegelschrift als Text zum Kopieren (aus «Text spiegeln»): ähnlich aussehende Unicode-Zeichen – nicht jeder Buchstabe
     hat ein perfektes Gegenstück. Auf dem Blatt wird dagegen die echte Schrift gespiegelt. */
  function tabelle(paare){ var t = {}; paare.split(' ').forEach(function(p){ var z = Array.from(p); t[z[0]] = z.slice(1).join(''); }); return t; }
  var KOPF = tabelle('aɐ bq cɔ dp eǝ fɟ gƃ hɥ iᴉ jɾ kʞ ll mɯ nu oo pd qb rɹ ss tʇ un vʌ wʍ xx yʎ zz ' +
    'A∀ Bꓭ CƆ Dꓷ EƎ FℲ G⅁ HH II Jſ Kꓘ L˥ MW NN OO PԀ QΌ Rꓤ SS T⊥ U∩ VΛ WM XX Y⅄ ZZ ' +
    '00 1Ɩ 2ᄅ 3Ɛ 4ㄣ 5ϛ 69 7ㄥ 88 96 .˙ ,\' \', !¡ ?¿ ¡! ¿? () )( [] ][ {} }{ <> >< _‾ &⅋ ;؛ «» »«');
  KOPF['"'] = '„'; KOPF['„'] = '"'; KOPF['“'] = '„';
  var SPIEGEL = tabelle('aɒ bd cɔ db eɘ fʇ gϱ hʜ ii jį kʞ ll mm nn oo pq qp rɿ sƨ tƚ uu vv ww xx yγ zz ' +
    'AA Bᙠ CƆ Dᗡ EƎ Fꟻ GᎮ HH II JႱ Kꓘ L⅃ MM NИ OO Pꟼ QϘ RЯ SꙄ TT UU VV WW XX YY ZƸ ' +
    '3Ɛ ?⸮ () )( [] ][ {} }{ <> >< «» »«');
  SPIEGEL['/'] = '\\'; SPIEGEL['\\'] = '/';
  var VERTIKAL = tabelle('aɐ bp cc dq eǝ fɟ gƃ hɥ iᴉ jɾ kʞ ll mɯ nu oo pb qd rɹ ss tʇ un vʌ wʍ xx yʎ zz ' +
    'A∀ BB CC DD EE FℲ G⅁ HH II Jſ KK LΓ MW NN OO Pᑲ QΌ Rʁ SS T⊥ U∩ VΛ WM XX Y⅄ ZZ ' +
    '00 1Ɩ 2ᄅ 33 4ㄣ 5ϛ 69 7ㄥ 88 96 .˙ ,\' \', !¡ ?¿ ¡! ¿?');
  VERTIKAL['"'] = '„'; VERTIKAL['„'] = '"';
  var SP_UMLAUT = { 'ä':'a', 'ö':'o', 'ü':'u', 'Ä':'A', 'Ö':'O', 'Ü':'U' };
  function spZeichen(z, tab, punkteUnten){
    if (SP_UMLAUT[z]){ var g = SP_UMLAUT[z]; return (tab[g] || g) + (punkteUnten ? '\u0324' : '\u0308'); }
    return tab[z] !== undefined ? tab[z] : z;
  }
  function spiegelText(text, sp){
    var t = String(text || '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/ß/g, 'ss').replace(/ẞ/g, 'SS'), z = t.split('\n');
    if (sp === 'vertikal') return z.reverse().map(function(l){ return Array.from(l).map(function(c){ return spZeichen(c, VERTIKAL, true); }).join(''); }).join('\n');
    if (sp === 'kopf') return Array.from(t).reverse().map(function(c){ return c === '\n' ? c : spZeichen(c, KOPF, true); }).join('');
    if (sp === 'rueckwaerts') return z.map(function(l){ return Array.from(l).reverse().join(''); }).join('\n');
    if (sp === 'woerter') return t.replace(/[\p{L}\p{M}\p{N}]+/gu, function(w){ return Array.from(w).reverse().join(''); });
    return z.map(function(l){ return Array.from(l).reverse().map(function(c){ return spZeichen(c, SPIEGEL, false); }).join(''); }).join('\n');
  }
  // Text → Zeilen → Wörter → Zellen { b: Buchstabe (Lösung), code } (code null: Zeichen bleibt stehen)
  function zerlege(text, art, o){
    if (art === 'spiegel') return spiegelZerlegen(text, o || {});
    if (art === 'finger') text = String(text || '').replace(/[ßẞ]/g, 'SS');   // ß hat kein eigenes Handzeichen
    var nr = 0;   // laufende Nummer der Schnipsel (Erpresserschrift): jeder sieht anders aus
    var schon = {};   // Anlaut-Emojis: wie oft der Buchstabe schon vorkam
    return normal(text, UMLAUTE[art]).split(/\r?\n/).map(function(z){
      return z.split(/\s+/).filter(Boolean).map(function(w){
        var zeichenListe = teilen(w, art);
        var zellen = zeichenListe.map(function(c, k){ var code = zeichen(art, c, o, zeichenListe[k - 1]); if (code && code.schnipsel) code.nr = nr++; if (code && code.anlaut){ code = anlautWahl(c, o, schon[c] || 0); schon[c] = (schon[c] || 0) + 1; } return { b:c, code:code }; });
        if (art === 'noten'){
          // Wort mit Buchstaben, die keine Töne sind: weglassen (die Oberfläche meldet es)
          if (zellen.some(function(z){ return !z.code && /[\p{L}\p{N}]/u.test(z.b); })) return null;
          // Das C gibt es tief (Hilfslinie) und hoch: das, welches näher bei den Nachbarnoten liegt
          zellen.forEach(function(z, i){
            if (!z.code || z.code.note !== 'C') return;
            var n = [zellen[i - 1], zellen[i + 1]].filter(function(x){ return x && x.code && x.code.note !== 'C'; }).map(function(x){ return NOTEN_STUFE[x.code.note]; });
            z.code.hoch = n.length ? n.reduce(function(a, b){ return a + b; }, 0) / n.length >= 4 : false;   // G, A, H in der Nähe → hohes C
          });
        }
        return zellen;
      }).filter(Boolean);
    });
  }
  return { ABC:ABC, GITTER:GITTER, MORSE:MORSE, BRAILLE:BRAILLE, ZAHLZEICHEN:ZAHLZEICHEN, HANDY:HANDY, HIERO:HIERO, HIERO_NAME:HIERO_NAME, notenName:notenName, spiegelText:spiegelText,
    normal:normal, zeichen:zeichen, zerlege:zerlege, roemisch:roemisch, binaer:binaer, freimaurer:freimaurer, VOEGEL:VOEGEL, KREISE:KREISE, BUECHER:BUECHER, BILDZEICHEN:BILDZEICHEN,
    SEGMENTE:SEGMENTE, FINGER:FINGER, UMLAUTE:UMLAUTE, BAUSTEINE:BAUSTEINE, STEIN_FARBEN:STEIN_FARBEN,
    EMOJI_THEMEN:EMOJI_THEMEN, FARB_CODE:FARB_CODE, ANLAUT:ANLAUT, anlautListe:anlautListe, anlautWahl:anlautWahl, NOTEN:NOTEN, NOTEN_WOERTER:NOTEN_WOERTER, NOTEN_WOERTER_BS:NOTEN_WOERTER_BS, notenFalsch:notenFalsch, notenBuchstaben:notenBuchstaben, notenMidi:notenMidi };
})();
/* KERN-ENDE */

var SCHRIFTEN = [
  ['caesar', tx('Caesar-Verschiebung'), tx('Jeder Buchstabe rückt im Alphabet weiter.')],
  ['emojis', tx('Emoji-Scheibe'), tx('Wie Caesar, innen 26 Emojis zu einem Thema')],
  ['farben', tx('Regenbogen-Scheibe'), tx('Wie Caesar, innen 26 Farben im Regenbogen')],
  ['anlaut', tx('Anlaut-Emojis'), tx('Jedes Emoji steht für seinen ersten Buchstaben: 🐒 Affe = A')],
  ['atbasch', tx('Rückwärts-Alphabet'), tx('A wird zu Z, B zu Y …')],
  ['spiegel', tx('Spiegelschrift'), tx('Gespiegelt, auf dem Kopf oder rückwärts')],
  ['halb', tx('Halbe Schrift'), tx('Nur die obere oder die untere Hälfte jedes Buchstabens')],
  ['zahlen', tx('Zahlen-Code'), 'A = 1, B = 2 … Z = 26'],
  ['roemisch', tx('Römische Zahlen'), 'A = I, B = II … Z = XXVI'],
  ['binaer', tx('Binärcode'), tx('Nullen und Einsen wie im Computer: A = 00001')],
  ['handy', tx('Handy-Tasten'), tx('So oft tippen wie auf der Handytaste: B = 22')],
  ['polybios', tx('Koordinaten-Gitter'), tx('Zeile und Spalte im Gitter: B = 12')],
  ['freimaurer', tx('Freimaurer-Code'), tx('Stücke von Gittern, manche mit Punkt')],
  ['voegel', tx('Vögel auf dem Draht'), tx('Jeder Vogel sitzt anders (Birds on a Wire)')],
  ['kreise', tx('Kreis-Code'), tx('Bögen und Striche im Kreis (Circles)')],
  ['buecher', tx('Bücher-Code'), tx('Buchstaben aus Büchern gelegt')],
  ['baerte', tx('Bärte-Code'), tx('Haare und Bart formen den Buchstaben')],
  ['segmente', tx('Segment-Code'), tx('Leuchtende Striche wie auf einer Anzeige')],
  ['bausteine', tx('Bausteine'), tx('Farbe und Anzahl Noppen der Bausteine')],
  ['erpresser', tx('Erpresserschrift'), tx('Wie aus Zeitungen ausgeschnitten und aufgeklebt')],
  ['noten', tx('Notenschrift'), tx('Wörter aus den Tönen C D E F G A H')],
  ['altlatein', tx('Altlatein'), tx('Alte Buchstaben aus Italien, oft gespiegelt')],
  ['runen', tx('Runen'), tx('Schriftzeichen der Germanen')],
  ['finger', tx('Fingeralphabet'), tx('Handzeichen der Gebärdensprache')],
  ['morse', tx('Morse-Code'), tx('Punkte und Striche')],
  ['braille', tx('Blindenschrift'), tx('Punkte zum Ertasten (Braille)')],
  ['hieroglyphen', tx('Hieroglyphen'), tx('Bildzeichen aus dem alten Ägypten')]
];
var HIERO_SCHRIFT = '"Noto Sans Egyptian Hieroglyphs"';
var HIERO_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Egyptian+Hieroglyphs&display=swap';
var TINTE = '#1C1714';
var SPIEGEL_ARTEN = [['horizontal', tx('Spiegelschrift'), tx('von rechts nach links, Buchstaben gespiegelt')], ['kopf', tx('Auf dem Kopf'), tx('um 180° gedreht')],
  ['vertikal', tx('Vertikal gespiegelt'), tx('an einer waagrechten Linie umgeklappt')], ['rueckwaerts', tx('Rückwärts'), tx('Buchstaben in umgekehrter Reihenfolge')],
  ['woerter', tx('Wörter rückwärts'), tx('jedes Wort rückwärts, die Reihenfolge bleibt')]];
var GROESSEN = [['klein', tx('Klein'), 30], ['mittel', tx('Mittel'), 42], ['gross', tx('Gross'), 58]];

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
function fmText(x, y, t){ return '<text x="' + x + '" y="' + (y + 16).toFixed(1) + '" style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="46" fill="' + TINTE + '" text-anchor="middle">' + t + '</text>'; }
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
    (text ? '<text x="30" y="66" style="font-family:var(--blatt-buchstaben)" font-size="40" fill="#6E655E" text-anchor="middle">' + esc(text) + '</text>' : '') + '</svg>';
}
// Kreis-Code: Feld 0…100, Kreis mit Radius 38 um (50, 50)
function kreisInnen(teile){
  var R = 38, h = '';
  function p(w){ var a = w * Math.PI / 180; return (50 + R * Math.cos(a)).toFixed(2) + ' ' + (50 + R * Math.sin(a)).toFixed(2); }
  teile.forEach(function(t){
    if (t[0] === 'k' || (t[0] === 'b' && t[2] - t[1] >= 360)) h += '<circle cx="50" cy="50" r="' + R + '" fill="none"/>';
    else if (t[0] === 'b') h += '<path d="M' + p(t[1]) + 'A' + R + ' ' + R + ' 0 ' + (t[2] - t[1] > 180 ? 1 : 0) + ' 1 ' + p(t[2]) + '" fill="none" stroke-linecap="butt"/>';
    else h += '<path d="M' + (50 + R * t[1]).toFixed(2) + ' ' + (50 + R * t[2]).toFixed(2) + 'L' + (50 + R * t[3]).toFixed(2) + ' ' + (50 + R * t[4]).toFixed(2) + '" stroke-linecap="square"/>';
  });
  return '<g stroke="' + TINTE + '" stroke-width="7.6">' + h + '</g>';
}
function kreisSvg(teile, klasse){ return '<svg class="' + (klasse || 'gs-kreis') + '" viewBox="0 0 100 100" aria-hidden="true">' + kreisInnen(teile) + '</svg>'; }
/* Ausgeschnittene Zeichen der Vorlagen: Bücher und Bärte als Bild (gleich grosse Felder) */
var BILDSAETZE = {
  buecher:{ endung:'webp', h:236, b:232, klasse:'gs-buch' },
  baerte:{ endung:'webp', h:234, b:174, klasse:'gs-bart' },
  // Fingeralphabet: aus der Vorlage des SGB-FSS (Vektorgrafik) gerendert, ohne Hintergrund, gleich hoch, unten bündig
  finger:{ endung:'webp', h:300, klasse:'gs-hand', b:{ a:156, b:133, c:221, d:145, e:154, f:161, g:266, h:294, i:144, j:140, k:175, l:217, m:158, n:163, o:169, p:324, q:308, r:135, s:130, t:140, u:137, v:157, w:165, x:140, y:267, z:143, ae:208, oe:144, ue:132, ch:212, sch:287 } }
};
/* Altlatein und Runen: selbst neu gezeichnet als Linien, mit dem Aufbau der Zeichen aus den Vorlagen (welche Striche, wo,
   in welchem Winkel, Bögen, Punkte und Querbalken) – ohne Teile der Vorlagen zu übernehmen. Je Zeichen: [Breite, Pfad] oder
   [Breite, [[Strichstärke, Pfad], …], [[x, y, Radius] Punkte]]; alle Zeichen gleich hoch (h) mit gemeinsamer Grundlinie. */
var STRICHZEICHEN = {
  altlatein:{ h:68, sw:6.2, klasse:'gs-alt', z:{
    a:[39, 'M32.5 4.5V59M6 59V23Q9 11 22 8L31 7.2M6 31L32.5 44'],
    b:[40, 'M32 5V59M32 7.5L7 19L32 30.5L5 42L32 57'],
    c:[34, 'M5 6.5Q27 13 28 34Q27 50 5 60'],
    d:[41, 'M32.5 5V59M31 7C15 16 6 26 6 38C6 46 9 52 15 57'],
    e:[36, 'M28 5V59M28 8L5 15.5M28 27L5 34.5M28 45L5 52.5'],
    f:[36, 'M27.5 5V59M27.5 8L4.5 15.5M27.5 34L4.5 42'],
    g:[34, 'M5 6.5Q27 13 28 34Q27 50 5 60'],
    h:[40, 'M6 8H33V56H6ZM6 30H33'],
    i:[14, 'M7 5V59'],
    j:[14, 'M7 5V59'],
    k:[38, 'M28.5 5V59M5 16L27 33M5 46L27 36'],
    l:[36, 'M28 5V59M5.5 44.5L27 56.5'],
    m:[59, 'M50 59V8L35 26L25.5 8L13 25.5L5 7'],
    n:[38, 'M31 59V8L15 25.5L6 7'],
    o:[55, 'M20 8H35C44 8 48.5 16 48.5 26V40C48.5 50 44 56 35 56H20C11 56 6.5 50 6.5 40V26C6.5 16 11 8 20 8Z'],
    p:[36, 'M28.5 5V59M28 8L5.5 21'],
    q:[47, 'M23.5 9C33 9 41 15.5 41 24.5C41 33.5 33 40 23.5 40C14 40 6 33.5 6 24.5C6 15.5 14 9 23.5 9ZM23 40V59'],
    r:[40, 'M32.5 5V59M32 8C14 9 6 20 6 32C6 46 14 56 32 56'],
    s:[39, 'M6 8.5L24 16.5L10 38.5L35.5 54.5'],
    t:[45, 'M6 8L21 12L41.5 20.5M21 12V60.5'],
    u:[51, 'M8 6L24.5 33L41.5 6M24.5 31V59.5'],
    v:[51, 'M8 6L24.5 33L41.5 6M24.5 31V59.5'],
    w:[50, 'M8 6L24.5 33L41.5 6M24.5 31V59.5'],
    x:[59, 'M8 6L49 57.5M51 6L6.5 57.5'],
    y:[14, 'M7 5V59'],
    z:[40, 'M7 18.5L32 8M20 13V56.5M5.5 60.5L35 50.5']
  } },
  runen:{ h:66, klasse:'gs-rune', z:{
    a:[47, [[8, 'M29.5 7V58'], [5, 'M18 7.5H44M15 57.5H45'], [6, 'M28 29L6 45.5']]],
    b:[50, [[8, 'M20 9V60'], [5, 'M5 9.5H32M3 59H34'], [7, 'M20 10H32C40.5 10 44 15 43.5 21C43 27 37.5 30 28 30H20M20 30H35C42.5 30 46.5 36 46 43.5C45.5 52 40 59 31 59H20']]],
    c:[61, [[8, 'M20.5 9V60'], [5, 'M4 9H32M5 59.5H34M34 8.5H59'], [6, 'M22 38L50 9']]],
    d:[92, [[8, 'M28 60V10M56 9V59'], [6, 'M29 10L4 41.5H47'], [5, 'M22 58.5H33M43 9H66M45 58.5H70'], [7, 'M57 24C62 18 70 16 76 18C84 21 88 30 87.5 37C87 46 80 51 72 51C66 51 61 49 57 47']]],
    e:[42, [[8, 'M21 5V59'], [5, 'M16 6.5H32M7 57.5H34'], [6, 'M3 30H39']]],
    f:[57, [[8, 'M20 7V60'], [5, 'M3 7H38M6 58.5H34'], [6, 'M22 26L38 6.5M23 41L53 5']]],
    g:[58, [[8, 'M17 8V60'], [5, 'M3 8.5H33M3 58.5H33'], [6, 'M20 32C30 28 36 20 40 14C43 9 46.5 7 49.5 8C52 9 53.5 11.5 53.5 15']], [[28.5, 17, 4.2]]],
    h:[46, [[8, 'M21 6V59'], [5, 'M13 7H34M10 58.5H36'], [6, 'M5 19.5L39.5 47M39 14.5L5.5 44']]],
    i:[33, [[9, 'M16.5 10V59'], [5, 'M3 11H30M3 58.5H30']]],
    j:[33, [[9, 'M16.5 10V59'], [5, 'M3 11H30M3 58.5H30']]],
    k:[58, [[8.5, 'M17 8V60'], [5, 'M3 9H27M3 58.5H32M33 9H55'], [6, 'M20 33L42 10.5']]],
    l:[50, [[8, 'M17.5 5V59'], [5, 'M3 57.5H34'], [6, 'M19 8L44.5 37']]],
    m:[71, [[8, 'M36 9V59'], [5, 'M4 8.5H24M28 8.5H67M20 58H50'], [7, 'M18 10C18 22 22 30 34 34M58 10C58 22 52 30 40 34']]],
    n:[53, [[8, 'M17.5 8V58'], [5, 'M3 9H30M4 57H30'], [6, 'M20 24L47 55']]],
    o:[43, [[8, 'M29 9V58'], [5, 'M17 9H41M13 58H39'], [6, 'M27 24L4.5 38.5M27 37L8 49']]],
    p:[49, [[8, 'M16 8V58'], [5, 'M3 9H28M3 58H27'], [7, 'M18 9H33C40 9 43 14 43 19C43 25 38 28 30 28H18M30 28C38 29 43 35 43 42C43 47 40 51 37 52.5']], [[28, 47, 4.6]]],
    q:[56, [[8, 'M16.5 8V58'], [5, 'M4 8H52M4 57H30'], [7, 'M44 9V22C44 32 37 37 28 37H19']]],
    r:[47, [[8, 'M17.5 9V58'], [5, 'M3 10H34M3 57H28'], [7, 'M18 11H33C39 11 42 15 42 20C42 26 38 30 31 30H19M31 30C38 33 41 38 41 44C41 49 39 52 37 54']]],
    s:[58, [[7.5, 'M17 10V47.5L42.5 23V59'], [5, 'M1 10H31M30 58H55']]],
    t:[51, [[8, 'M25 13V58'], [6, 'M4 36L25 13L46 32.5'], [5, 'M13 57H37']]],
    u:[62, [[7.5, 'M17.5 59V10L46 32V59'], [5, 'M3 57H29M33 57H58']]],
    v:[62, [[7.5, 'M17.5 59V10L46 32V59'], [5, 'M3 57H29M33 57H58']]],
    w:[62, [[7.5, 'M17.5 59V10L46 32V59'], [5, 'M3 57H29M33 57H58']]],
    x:[63, [[8, 'M17 11V58'], [5, 'M4 11H30M4 58H32'], [6, 'M20 33L44 10.5M21 49L59 9.5']]],
    y:[88, [[8, 'M26 10V58'], [7.5, 'M52.5 10V41.5L74 23V58'], [5, 'M16 10H37M15 58H37M45 9H66M60 58H86'], [6, 'M4.5 16.5L44.5 47.5M42.5 15.5L5 44.5']]],
    z:[59, [[7.5, 'M17 58V9L46 31.5V58'], [5, 'M3 58H29M31 58H56']]]
  } }
};
function strichHtml(satz, name, zusatz){
  var s = STRICHZEICHEN[satz], z = s.z[name], striche = typeof z[1] === 'string' ? [[s.sw, z[1]]] : z[1];
  return '<svg class="' + s.klasse + (zusatz ? ' ' + s.klasse + zusatz : '') + '" viewBox="0 0 ' + z[0] + ' ' + s.h + '" style="aspect-ratio:' + z[0] + '/' + s.h + '" aria-hidden="true">' +
    '<g fill="none" stroke="' + TINTE + '" stroke-linejoin="round">' + striche.map(function(t){ return '<path d="' + t[1] + '" stroke-width="' + t[0] + '"/>'; }).join('') + '</g>' +
    (z[2] || []).map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + TINTE + '"/>'; }).join('') + '</svg>';
}
function bildHtml(satz, name, zusatz){
  if (STRICHZEICHEN[satz]) return strichHtml(satz, name, zusatz);
  var s = BILDSAETZE[satz], b = typeof s.b === 'number' ? s.b : s.b[name];
  return '<img class="' + s.klasse + (zusatz ? ' ' + s.klasse + zusatz : '') + '" src="raetsel/geheimschrift/' + satz + '/' + name + '.' + s.endung + '" width="' + b + '" height="' + s.h +
    '" style="aspect-ratio:' + b + '/' + s.h + '" alt="">';
}
function buchSvg(name, klasse){ return bildHtml('buecher', name, klasse === 'gs-buch-k' ? '-k' : ''); }
/* Segment-Code: 14-Segment-Anzeige im Feld 0…100 × 0…160. Leuchtende Segmente in Tinte, die anderen als feiner Umriss
   (zum Erkennen der Anzeige und zum Ausmalen) */
var SEG_LINIEN = { a:[20, 12, 80, 12], b:[88, 20, 88, 72], c:[88, 88, 88, 140], d:[20, 148, 80, 148], e:[12, 88, 12, 140], f:[12, 20, 12, 72],
  g1:[20, 80, 44, 80], g2:[56, 80, 80, 80], h:[23, 25, 39, 69], i:[50, 23, 50, 70], j:[77, 25, 61, 69], k:[39, 91, 23, 135], l:[50, 90, 50, 137], m:[61, 91, 77, 135] };
var SEG_NAMEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm'];
function segmentInnen(an, farbe, umriss){
  var leer = '', voll = '';
  SEG_NAMEN.forEach(function(s){
    var p = SEG_LINIEN[s], d = 'M' + p[0] + ' ' + p[1] + 'L' + p[2] + ' ' + p[3];
    if (an.indexOf(s) >= 0) voll += d; else leer += d;
  });
  return '<g fill="none" stroke-linecap="round">' + (leer ? '<path d="' + leer + '" stroke="' + (umriss || '#C9BEB4') + '" stroke-width="9"/><path d="' + leer + '" stroke="#fff" stroke-width="6"/>' : '') +
    (voll ? '<path d="' + voll + '" stroke="' + (farbe || TINTE) + '" stroke-width="9"/>' : '') + '</g>';
}
function segmentSvg(an, klasse, farbe, umriss){ return '<svg class="' + (klasse || 'gs-seg') + '" viewBox="0 0 100 160" aria-hidden="true">' + segmentInnen(an, farbe, umriss) + '</svg>'; }
// Beschriftete Anzeige für den Schlüssel
function segmentPlan(){
  var t = '';
  [['a', 50, -1, 15], ['d', 50, 168, 15], ['f', -3, 51, 15], ['b', 103, 51, 15], ['e', -3, 119, 15], ['c', 103, 119, 15],
    ['g1', 25, 74, 9], ['g2', 75, 74, 9], ['h', 37, 31, 9], ['i', 56, 31, 9], ['j', 65, 31, 9], ['k', 35, 134, 9], ['l', 56, 134, 9], ['m', 66, 134, 9]].forEach(function(l){
    t += '<text x="' + l[1] + '" y="' + l[2] + '" font-size="' + l[3] + '">' + l[0] + '</text>';
  });
  return tx('<svg class="gs-seg-plan" viewBox="-16 -16 132 192" role="img" aria-label="Die 14 Segmente mit ihren Namen">') + segmentInnen(SEG_NAMEN, '#E4572E') +
    '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" fill="' + TINTE + '" text-anchor="middle">' + t + '</g></svg>';
}
function segmentHtml(code){
  if (!code.ausmalen) return segmentSvg(code.segmente);
  // Zum Ausmalen: Namen der Segmente über einer leeren Anzeige; in der Lösung leuchten die Segmente
  // Namen ab fünf Segmenten auf zwei ausgeglichene Zeilen verteilt
  var n = code.segmente, teil = n.length > 4 ? Math.ceil(n.length / 2) : n.length;
  var namen = n.slice(0, teil).join(' ') + (teil < n.length ? '<br>' + n.slice(teil).join(' ') : '');
  return '<span class="gs-seg-mal"><span class="gs-seg-namen">' + namen + '</span>' +
    segmentSvg([], 'gs-seg gs-seg-leer', null, '#8F837A') + segmentSvg(code.segmente, 'gs-seg gs-seg-loes', '#005A90', '#B5AAA0') + '</span>';
}
/* Bausteine: von oben gesehen, 2 Reihen Noppen; Breite je nach Anzahl Noppen (2, 3 oder 4 je Reihe) */
var STEIN = { rot:['#E3342F', '#A61E1A'], orange:['#F28C28', '#B35F0E'], gelb:['#F7D02C', '#B39207'], hellgruen:['#8BC34A', '#5A8A26'], gruen:['#2E8B57', '#1B5E38'],
  hellblau:['#4FC3F7', '#1F8BBE'], blau:['#1E5AA8', '#123A70'], violett:['#8E44AD', '#5E2A75'], rosa:['#F48FB1', '#C2577D'] };
var STEIN_NAME = { rot:tx('rot'), orange:tx('orange'), gelb:tx('gelb'), hellgruen:tx('hellgrün'), gruen:tx('dunkelgrün'), hellblau:tx('hellblau'), blau:tx('blau'), violett:tx('violett'), rosa:tx('rosa') };
function steinSvg(stein, klasse){
  var f = STEIN[stein[0]], n = stein[1], w = n * 10 + 2, noppen = '';
  for (var r = 0; r < 2; r++) for (var c = 0; c < n; c++) noppen += '<circle cx="' + (6 + c * 10) + '" cy="' + (6 + r * 10) + '" r="3.3"/>';
  return '<svg class="' + (klasse || 'gs-stein') + '" viewBox="0 0 ' + w + ' 22" style="aspect-ratio:' + w + '/22" aria-hidden="true">' +
    '<rect x="1" y="1" width="' + (n * 10) + '" height="20" rx="1.6" fill="' + f[0] + '" stroke="' + f[1] + '" stroke-width="1"/>' +
    '<g fill="' + f[0] + '" stroke="' + f[1] + '" stroke-width="0.9">' + noppen + '</g></svg>';
}
/* Erpresserschrift: jeder Buchstabe ein ausgeschnittener Papierschnipsel – andere Schrift, Farbe, Grösse, Form und Drehung.
   Das Papier ist ein kleines SVG (nur Formen), der Buchstabe normaler Text darüber: so zeichnet das PDF ihn mit der
   geladenen Webschrift, ohne jede Schrift in jedes SVG einzubetten. Schriften: Google Fonts (SIL Open Font License). */
var ERP_SCHRIFTEN = [   // [Familie, Ersatz, Gewicht, kursiv, nur 'gross' | nur 'klein', Umriss möglich (Schrift ohne überlappende Konturen)]
  ['Abril Fatface', 'serif', 400, 0, '', 1], ['Alfa Slab One', 'serif', 400, 0, '', 1], ['Anton', 'sans-serif', 400, 0, '', 1], ['Archivo Black', 'sans-serif', 400, 0, '', 1],
  ['Bebas Neue', 'sans-serif', 400, 0, 'gross', 1], ['Bungee', 'sans-serif', 400, 0, 'gross', 1], ['Courier Prime', 'monospace', 700], ['Libre Baskerville', 'serif', 700],
  ['Lobster', 'cursive', 400], ['Oswald', 'sans-serif', 700, 0, '', 1], ['Playfair Display', 'serif', 900, 1], ['Righteous', 'sans-serif', 400, 0, '', 1],
  ['Rye', 'serif', 400], ['Shrikhand', 'serif', 400], ['Special Elite', 'monospace', 400], ['Ultra', 'serif', 400, 0, '', 1], ['UnifrakturMaguntia', 'serif', 400, 0, 'klein']
];
var FRAKTUR_LESBAR = 'abcdeghilmnopqrtuyäöü';   // Kleinbuchstaben, die in Fraktur gut zu erkennen sind
function erpHell(farbe){ var n = parseInt(farbe.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
var ERP_CSS = 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Bungee' +
  '&family=Courier+Prime:wght@700&family=Libre+Baskerville:wght@700&family=Lobster&family=Oswald:wght@700&family=Playfair+Display:ital,wght@1,900' +
  '&family=Righteous&family=Rye&family=Shrikhand&family=Special+Elite&family=Ultra&family=UnifrakturMaguntia&display=swap';
var ERP_FARBEN = [   // [Papier, Buchstabe] – immer gut lesbar
  ['#F3EEE2', '#1C1714'], ['#FFFFFF', '#1C1714'], ['#E6D7B8', '#7A3B1D'], ['#1C1714', '#F5EFE0'], ['#1C1714', '#F7D02C'], ['#B8312F', '#F9E27A'],
  ['#2D3E87', '#FFFFFF'], ['#7FAEDF', '#1C1714'], ['#F7E36B', '#1C1714'], ['#F4B6C2', '#1C1714'], ['#B9DCEF', '#C8312B'], ['#4F8A3B', '#FFFFFF'],
  ['#EE9A4A', '#1C1714'], ['#CBC4BA', '#1C1714'], ['#6E4A9E', '#F7D02C'], ['#FFFFFF', '#C8312B'], ['#2F6F62', '#F5EFE0'], ['#D6B98E', '#2D3E87'],
  ['#E3463F', '#FFFFFF'], ['#F2E8CF', '#2E7D4F'], ['#8C5A3C', '#F7E9C8'], ['#FFFFFF', '#2D3E87']
];
function erpZufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* Aussehen des Schnipsels Nummer nr: Schrift und Farbe nie gleich wie beim Schnipsel davor */
var erpListen = {};
/* Zufall für die Erpresserschrift: bei jedem Öffnen des Generators und jedes Mal, wenn man die Schrift wählt, neu –
   so sieht sie nie zweimal gleich aus (kein festes Alphabet). Während man tippt, bleiben die Schnipsel stehen. */
function erpNeuerZufall(){ erpListen = {}; return Math.floor(Math.random() * 1e6) + 2; }
var erpVorschau = erpNeuerZufall();
function erpStil(seed, nr){
  var liste = erpListen[seed] || (erpListen[seed] = []);
  while (liste.length <= nr){
    var i = liste.length, vor = liste[i - 1], r = erpZufall(seed * 7919 + i * 104729 + 13);
    var sch = vor ? (vor.schrift + 1 + Math.floor(r() * (ERP_SCHRIFTEN.length - 1))) % ERP_SCHRIFTEN.length : Math.floor(r() * ERP_SCHRIFTEN.length);
    var fa = vor ? (vor.farbe + 1 + Math.floor(r() * (ERP_FARBEN.length - 1))) % ERP_FARBEN.length : Math.floor(r() * ERP_FARBEN.length);
    while (vor && ERP_FARBEN[fa][0] === ERP_FARBEN[vor.farbe][0]) fa = (fa + 1) % ERP_FARBEN.length;   // auch das Papier nie gleich wie davor
    var form = []; for (var k = 0; k < 8; k++) form.push(r() * 9);
    var ecke = r() < 0.35 ? Math.floor(r() * 4) : -1, hinten = -1, form2 = [];
    for (var k2 = 0; k2 < 8; k2++) form2.push(r() * 9);
    if (ecke < 0 && r() < 0.2){ hinten = (fa + 1 + Math.floor(r() * (ERP_FARBEN.length - 1))) % ERP_FARBEN.length; }   // zweites Papier dahinter, andere Farbe
    liste.push({ schrift:sch, farbe:fa, klein:r(), dreh:(r() * 2 - 1) * 8, groesse:0.84 + r() * 0.26, dy:(r() * 2 - 1) * 5, padL:0.1 + r() * 0.16, padR:0.1 + r() * 0.16,
      form:form, form2:form2, ecke:ecke, hinten:hinten, kontur:r() < 0.5 });
  }
  return liste[nr];
}
/* Ein Schnipsel: zeichen = der Buchstabe, wie er dastehen soll (gross oder klein schon entschieden) */
function erpHtml(zeichen, stil){
  var klein = zeichen !== zeichen.toUpperCase() || zeichen === 'ß', ziffer = !/\p{L}/u.test(zeichen);
  // Schrift passend zu gross/klein: ab der zufälligen die nächste, die passt
  var n = ERP_SCHRIFTEN.length, sch = null;
  for (var k = 0; k < n && !sch; k++){ var s = ERP_SCHRIFTEN[(stil.schrift + k) % n]; if (!(s[4] === 'gross' && (klein || zeichen === 'ß')) && !(s[4] === 'klein' && FRAKTUR_LESBAR.indexOf(zeichen) < 0)) sch = s; }
  // Umriss nur bei heller Schrift auf mittlerem Papier (auf dunklem wäre er unsichtbar) und nur bei Schriften ohne überlappende Konturen
  var f = ERP_FARBEN[stil.farbe], umriss = stil.kontur && sch[5] && erpHell(f[1]) > 0.7 && erpHell(f[0]) > 0.3;
  // Papier: Viereck mit unregelmässigen Ecken, manchmal eine Ecke abgeschnitten; dahinter ein leichter Schatten
  var j = stil.form, P = [[j[0], j[1]], [100 - j[2], j[3]], [100 - j[4], 100 - j[5]], [j[6], 100 - j[7]]];
  if (stil.ecke >= 0){ var e = P[stil.ecke], a = P[(stil.ecke + 3) % 4], b = P[(stil.ecke + 1) % 4];
    // Reihenfolge: zuerst der Punkt Richtung vorherige Ecke, dann Richtung nächste – sonst kreuzt sich die Kante
    P.splice(stil.ecke, 1, [e[0] + (a[0] - e[0]) * 0.2, e[1] + (a[1] - e[1]) * 0.2], [e[0] + (b[0] - e[0]) * 0.22, e[1] + (b[1] - e[1]) * 0.22]); }
  var pkt = function(dx, dy, g, Q){ return (Q || P).map(function(q){ return ((q[0] - 50) * (g || 1) + 50 + dx).toFixed(1) + ',' + ((q[1] - 50) * (g || 1) + 50 + dy).toFixed(1); }).join(' '); };
  var j2 = stil.form2, H = [[j2[0] - 4, j2[1] - 4], [104 - j2[2], j2[3] - 4], [104 - j2[4], 104 - j2[5]], [j2[6] - 4, 104 - j2[7]]];   // zweites Papier: eigene, grössere Form
  var svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    (stil.hinten >= 0 ? '<polygon points="' + pkt(-2, 2, 1.1, H) + '" fill="' + ERP_FARBEN[stil.hinten][0] + '"/>' : '') +
    '<polygon points="' + pkt(2, 3) + '" fill="#000" fill-opacity=".16"/><polygon points="' + pkt(0, 0) + '" fill="' + f[0] + '"' + (f[0] === '#FFFFFF' || f[0] === '#F3EEE2' ? ' stroke="#CFC6BC" stroke-width="1.2" vector-effect="non-scaling-stroke"' : '') + '/></svg>';
  var stilText = 'font-family:\'' + sch[0] + '\',' + sch[1] + ';font-weight:' + sch[2] + (sch[3] ? ';font-style:italic' : '') + ';color:' + f[1] +
    (umriss ? ';-webkit-text-stroke:max(1px,.03em) #1C1714' : '');
  return '<span class="gs-erp" style="--s:' + stil.groesse.toFixed(2) + ';--r:' + stil.dreh.toFixed(1) + 'deg;--dy:' + stil.dy.toFixed(1) + '%;--pl:' + stil.padL.toFixed(2) + 'em;--pr:' + stil.padR.toFixed(2) + 'em">' +
    svg + '<span class="gs-erp-b" style="' + stilText + '">' + esc(zeichen) + '</span></span>';
}
/* Notenschrift: Viertelnoten im Notensystem mit Violinschlüssel. Linien bei y = 40 … 80 (unten E, Mitte H, G-Linie 70);
   jedes Stück ist ein eigenes SVG mit allen fünf Linien – nebeneinander ergeben sie ein durchgehendes Notensystem. */
var NOTE_Y = { C:90, D:85, E:80, F:75, G:70, A:65, H:60, B:60, S:80 };   // B wie H, S wie E – jeweils mit ♭
var VIOLIN = 'M16.5 74.5C11.5 76 9 71 12.5 67.5C16 64.5 22 66.5 22 72C22 78.5 14 81.5 9 78C3.5 74 4.5 64.5 10.5 58.5C15 54 20.5 49.5 21 41C21.5 32 17 25.5 14.5 29C12 32.5 12.8 40 13.6 50L16.5 94C17 100.5 10.5 101.5 8.5 97.5';
function notenSvg(inhalt, breite, klasse){
  return '<svg class="' + (klasse || 'gs-note') + '" viewBox="0 18 ' + breite + ' 86" style="aspect-ratio:' + breite + '/86" aria-hidden="true">' +
    '<path d="' + [40, 50, 60, 70, 80].map(function(y){ return 'M0 ' + y + 'H' + breite; }).join('') + '" stroke="' + TINTE + '" stroke-width="1.1"/>' + inhalt + '</svg>';
}
// Notenkopf (schräge Ellipse), Hals (unter der Mittellinie nach oben, sonst nach unten), Hilfslinie beim tiefen C
function noteKopf(x, y){
  var hals = y > 60 ? '<path d="M' + (x + 5.2) + ' ' + (y - 1) + 'V' + (y - 33) + '"/>' : '<path d="M' + (x - 5.2) + ' ' + (y + 1) + 'V' + (y + 33) + '"/>';
  return (y >= 90 ? '<path d="M' + (x - 9) + ' 90H' + (x + 9) + '" stroke="' + TINTE + '" stroke-width="1.1"/>' : '') +
    '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="4.2" transform="rotate(-20 ' + x + ' ' + y + ')" fill="' + TINTE + '"/>' +
    '<g stroke="' + TINTE + '" stroke-width="1.5">' + hals + '</g>';
}
function noteY(n, hoch){ return n === 'C' && hoch ? 55 : NOTE_Y[n]; }
// Be-Zeichen ♭ (macht den Ton einen halben Ton tiefer): Strich mit Bauch, links vor dem Notenkopf
function be(x, y){ return '<path d="M' + x + ' ' + (y - 17) + 'V' + (y + 4.5) + 'C' + (x + 7.5) + ' ' + (y + 0.5) + ' ' + (x + 8) + ' ' + (y - 6.5) + ' ' + x + ' ' + (y - 3)
  + '" fill="none" stroke="' + TINTE + '" stroke-width="1.6" stroke-linejoin="round"/>'; }
function noteSvg(n, hoch, klasse){
  var y = noteY(n, hoch);
  return n === 'B' || n === 'S' ? notenSvg(be(5, y) + noteKopf(22, y), 34, klasse) : notenSvg(noteKopf(13, y), 26, klasse);
}
function violinPfad(dx){ return '<g transform="translate(' + (dx || 0) + ' 0)"><path d="' + VIOLIN + '" fill="none" stroke="' + TINTE + '" stroke-width="2.3" stroke-linecap="round"/><circle cx="10.3" cy="96" r="2.6" fill="' + TINTE + '"/></g>'; }
function violinSvg(){ return notenSvg(violinPfad(0), 28); }
function taktendeSvg(){ return notenSvg('<path d="M2.5 40V80" stroke="' + TINTE + '" stroke-width="1.2"/><path d="M6.2 40V80" stroke="' + TINTE + '" stroke-width="2.8"/>', 8); }
// Schlüssel: alle Noten vom tiefen bis zum hohen C, darunter ihr Name
function notenSchluesselSvg(bs){
  var noten = [['C', false], ['D'], ['E'], ['F'], ['G'], ['A'], ['H'], ['C', true]].concat(bs ? [['S'], ['B']] : []);
  var xs = noten.map(function(n, i){ return 56 + i * 40 + (i >= 8 ? 30 : 0); }), b = xs[xs.length - 1] + 30;
  var inhalt = violinPfad(4) + noten.map(function(n, i){ var y = noteY(n[0], n[1]); return (n[0] === 'B' || n[0] === 'S' ? be(xs[i] - 17, y) : '') + noteKopf(xs[i], y); }).join('') +
    (bs ? '<path d="M' + (xs[7] + 22) + ' 40V80" stroke="' + TINTE + '" stroke-width="1.2"/>' : '') +   // Taktstrich vor den Noten mit ♭
    '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="15" fill="#005A90" text-anchor="middle">' +
    noten.map(function(n, i){ return '<text x="' + xs[i] + '" y="128">' + Kern.notenName(n[0]) + '</text>'; }).join('') + '</g>';
  return '<svg class="gs-noten-schluessel" viewBox="0 18 ' + b + tx(' 116" role="img" aria-label="Noten vom tiefen C bis zum hohen C mit ihren Namen">') +
    '<path d="' + [40, 50, 60, 70, 80].map(function(y){ return 'M0 ' + y + 'H' + b; }).join('') + '" stroke="' + TINTE + '" stroke-width="1.1"/>' + inhalt + '</svg>';
}
function schnipselHtml(code){
  var stil = erpStil(code.seed, code.nr || 0), c = code.schnipsel;
  return erpHtml(code.misch && stil.klein < 0.42 && c !== 'ß' ? c.toLowerCase() : c, stil);
}
/* Binärcode als Perlen: dunkle Perle = 1, helle = 0 */
function perlenSvg(bits, klasse){
  var t = '';
  Array.from(bits).forEach(function(b, i){ t += '<circle cx="' + (10 + i * 20) + '" cy="10" r="7.6" fill="' + (b === '1' ? TINTE : '#fff') + '" stroke="' + TINTE + '" stroke-width="1.6"/>'; });
  return '<svg class="' + (klasse || 'gs-perlen') + '" viewBox="0 0 100 20" aria-hidden="true"><path d="M0 10H100" stroke="#9AA4B1" stroke-width="1.2"/>' + t + '</svg>';
}
/* Halbe Schrift: der Buchstabe in der Blattschrift, die Hälfte über oder unter der Mitte der Grossbuchstaben weggeschnitten.
   Die Höhe der Grossbuchstaben wird für die gewählte Schrift gemessen, damit der Schnitt genau in der Mitte liegt. */
var halbMass = null;
function halbMasse(){
  var fam = (getComputedStyle(document.body).getPropertyValue('--blatt-buchstaben') || '').trim() || 'sans-serif';
  if (halbMass && halbMass.fam === fam) return halbMass;
  var cv = document.createElement('canvas').getContext('2d');
  cv.font = '700 100px ' + fam;
  var h = cv.measureText('H'), q = cv.measureText('Q'), j = cv.measureText('J');
  halbMass = { fam:fam, cv:cv, cap:(h.actualBoundingBoxAscent || 70) / 100, unter:Math.max(q.actualBoundingBoxDescent || 0, j.actualBoundingBoxDescent || 0, 0.02) / 100 };
  return halbMass;
}
function halbSvg(c, art, klasse){
  var M = halbMasse(), w = Math.max(30, M.cv.measureText(c).width), B = 100, mitte = B - M.cap * 50, rand = 4;
  var y0 = art === 'unten' ? mitte : B - M.cap * 100 - rand, y1 = art === 'unten' ? B + M.unter * 100 + rand : mitte, hoehe = (y1 - y0) / 100;
  return '<svg class="' + (klasse || 'gs-halb') + '" viewBox="0 ' + y0.toFixed(1) + ' ' + (w + 8).toFixed(1) + ' ' + (y1 - y0).toFixed(1) + '" style="--hh:' + hoehe.toFixed(3) + '" aria-hidden="true">' +
    '<text x="' + ((w + 8) / 2).toFixed(1) + '" y="' + B + '" text-anchor="middle" font-size="100" font-weight="700" fill="' + TINTE + '" style="font-family:var(--blatt-buchstaben)">' + esc(c) + '</text>' +
    '<path d="M0 ' + mitte.toFixed(1) + 'H' + (w + 8).toFixed(1) + '" stroke="#9AA4B1" stroke-width="2" stroke-dasharray="6 5"/></svg>';
}
/* Anlaut-Emojis: Kann dieses Gerät ein neues Emoji zeigen? Farbig gezeichnet = ja (fehlt es, erscheint ein graues Kästchen).
   Das PDF zeichnet mit denselben Schriften wie der Bildschirm – was hier fehlt, fehlt auch dort. */
function anlautNeueDa(){
  var da = {}, neue = [];
  Object.keys(Kern.ANLAUT).forEach(function(sp){ Object.keys(Kern.ANLAUT[sp]).forEach(function(c){ Kern.ANLAUT[sp][c].forEach(function(x){ if (x[2] && neue.indexOf(x[0]) < 0) neue.push(x[0]); }); }); });
  try {
    var cv = document.createElement('canvas'); cv.width = cv.height = 40;
    var g = cv.getContext('2d', { willReadFrequently:true });
    neue.forEach(function(e){
      g.clearRect(0, 0, 40, 40); g.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textBaseline = 'top'; g.fillStyle = '#000'; g.fillText(e, 2, 2);
      var d = g.getImageData(0, 0, 40, 40).data, bunt = 0;
      for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 60 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) bunt++;
      da[e] = bunt > 20;
    });
  } catch(x){}
  return da;
}
function symbolHtml(code){
  if (code.emoji) return '<span class="gs-t gs-emoji">' + code.emoji + '</span>';
  if (code.farbe) return '<span class="gs-farbpunkt" style="background:' + code.farbe + '"></span>';
  if (code.schnipsel) return schnipselHtml(code);
  if (code.note) return noteSvg(code.note, code.hoch);
  if (code.stein) return steinSvg(code.stein);
  if (code.bild) return bildHtml(code.bild[0], code.bild[1]);
  if (code.segmente) return segmentHtml(code);
  if (code.kreis) return kreisSvg(code.kreis);
  if (code.vogel) return vogelSvg(code.vogel);
  if (code.perlen) return perlenSvg(code.perlen);
  if (code.halb) return halbSvg(code.halb, code.ha);
  if (code.text !== undefined) return '<span class="gs-t">' + esc(code.text) + '</span>';
  if (code.spiegel !== undefined) return '<span class="gs-t gs-sp gs-sp-' + code.sp + '">' + esc(code.spiegel) + '</span>';
  if (code.freimaurer) return fmSvg(code.freimaurer);
  if (code.morse) return morseSvg(code.morse);
  if (code.braille) return brailleSvg(code.braille);
  return glyphe(code.glyphe);
}
function vorschauHtml(art){
  if (art === 'scheibe') return '<span class="gs-vorschau gs-v-scheibe">' + [{ text:'D' }, { emoji:'🐶' }, { farbe:Kern.FARB_CODE[2] }].map(function(z){ return '<span class="gs-vz">' + symbolHtml(z) + '</span>'; }).join('') + '</span>';
  var o = { verschiebung:3, emojiThema:'tiere', bildVerschiebung:0 }, w = art === 'hieroglyphen' ? 'ABC' : art === 'braille' || art === 'morse' ? 'ABC' : 'ABC';
  if (art === 'noten') w = 'CEG';
  return '<span class="gs-vorschau gs-v-' + art + '">' + Array.from(w).map(function(c, i){ var z = Kern.zeichen(art, c, o); if (z && z.schnipsel){ z.seed = erpVorschau; z.nr = i; z.misch = false; } return '<span class="gs-vz">' + symbolHtml(z) + '</span>'; }).join('') + '</span>';
}

/* QR-Code als SVG (gemeinsam/extern/qrcode.js) – für die Hörseite der Notenschrift */
function qrSvg(text){
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  var q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
  var n = q.getModuleCount(), d = '', R = 0;   // ohne weissen Rand: die gewählte Grösse ist die des sichtbaren Codes (das Blatt ist rundherum weiss)
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) d += 'M' + (x + R) + ' ' + (y + R) + 'h1v1h-1z';
  return '<svg class="gs-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * R) + ' ' + (n + 2 * R) + tx('" shape-rendering="crispEdges" role="img" aria-label="QR-Code zur Hörseite">') +
    '<rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
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
/* Scheibe zum Basteln: grosse Scheibe (aussen) und kleine Scheibe (innen) zum Ausschneiden.
   z.aussen(i) / z.innen(i): Beschriftung von Feld i (Text oder SVG); z.innenFarbe(i): Feld innen farbig füllen;
   z.aussenFarbe(i): Farbe des Buchstabens aussen (hell → mit dunklem Rand) */
function caesarScheibe(z){
  z = z || {};
  function hell(f){ var n = parseInt(f.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.6; }
  function feld(cx, R, rInnen, i, farbe){
    var a1 = (i - 0.5) * 2 * Math.PI / 26, a2 = (i + 0.5) * 2 * Math.PI / 26, p = function(r, a){ return (cx + r * Math.sin(a)).toFixed(2) + ' ' + (110 - r * Math.cos(a)).toFixed(2); };
    return '<path d="M' + p(rInnen, a1) + 'L' + p(R, a1) + 'A' + R + ' ' + R + ' 0 0 1 ' + p(R, a2) + 'L' + p(rInnen, a2) + 'A' + rInnen + ' ' + rInnen + ' 0 0 0 ' + p(rInnen, a1) + 'Z" fill="' + farbe + '" stroke="none"/>';
  }
  // Stern als Startmarke: zeigt auf der kleinen Scheibe das erste Feld (dreht sich mit)
  function stern(x, y, r){
    var pkt = [];
    for (var k = 0; k < 10; k++){ var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pkt.push((x + rr * Math.cos(a)).toFixed(2) + ',' + (y + rr * Math.sin(a)).toFixed(2)); }
    return '<polygon points="' + pkt.join(' ') + '" fill="#005A90" stroke="#fff" stroke-width="0.6"/>';
  }
  function scheibe(cx, R, rText, rInnen, gr, beschriftung, inhalt, farbe, textFarbe, mitStern){
    var h = '<circle cx="' + cx + '" cy="110" r="' + R + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1.2"/>';
    if (farbe) for (var k = 0; k < 26; k++) h += feld(cx, R - 0.6, rInnen, k, farbe(k));
    h += '<circle cx="' + cx + '" cy="110" r="' + rInnen + '" fill="none" stroke="#B9AFA6" stroke-width="0.6"/>';
    for (var i = 0; i < 26; i++){
      var a = i * 360 / 26, a2 = (i + 0.5) * 360 / 26, rad = a2 * Math.PI / 180;
      h += '<path d="M' + (cx + rInnen * Math.sin(rad)).toFixed(2) + ' ' + (110 - rInnen * Math.cos(rad)).toFixed(2) + 'L' + (cx + R * Math.sin(rad)).toFixed(2) + ' ' + (110 - R * Math.cos(rad)).toFixed(2) + '" stroke="' + (farbe ? '#fff' : '#B9AFA6') + '" stroke-width="' + (farbe ? 0.9 : 0.6) + '"/>';
      var tf = textFarbe ? textFarbe(i) : null;
      var stil = tf ? ' fill="' + tf + '"' + (hell(tf) ? ' stroke="' + TINTE + '" stroke-width="0.7" paint-order="stroke"' : '') : '';
      var t = inhalt ? inhalt(i) : Kern.ABC[i];
      if (t) h += '<text transform="translate(' + cx + ' 110) rotate(' + a.toFixed(2) + ')" y="' + (-rText + gr * 0.35).toFixed(2) + '" font-size="' + gr + '"' + stil + '>' + t + '</text>';
    }
    if (mitStern) h += stern(cx, 110 - rInnen + 9, 6.5);
    h += '<circle cx="' + cx + '" cy="110" r="2" fill="' + TINTE + '"/><text x="' + cx + '" y="' + (110 + R + 9) + '" font-size="7.5" font-weight="400" fill="#6E655E">' + beschriftung + '</text>';
    return h;
  }
  return '<svg class="gs-scheibe" viewBox="0 0 400 230" role="img" aria-label="' + tx('{s} zum Ausschneiden', { s:z.name || tx('Caesar-Scheibe') }) + '">' +
    '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" fill="' + TINTE + '" text-anchor="middle">' +
    scheibe(108, 100, 88, 74, 15, tx('grosse Scheibe (aussen: Klartext)'), z.aussen, null, z.aussenFarbe) +
    scheibe(300, 72, 61, 47, z.innenGroesse || 13, tx('kleine Scheibe (Geheimtext)'), z.innen, z.innenFarbe, null, true) + '</g></svg>';
}
function schluesselHtml(art, o){
  var A = Kern.ABC.split('');
  switch (art){
    case 'caesar':
      return '<p class="gs-erklaerung">' + tx('Verschiebung um {n}: Jeder Buchstabe rückt {v} Stellen weiter – aus A wird {b}. Zum Entschlüsseln den Geheimbuchstaben unten suchen und den Buchstaben darüber lesen.', { n:'<b>' + o.verschiebung + '</b>', v:o.verschiebung, b:Kern.ABC[o.verschiebung % 26] }) + '</p>' +
        zweiReihen(A, A.map(function(c){ return Kern.zeichen('caesar', c, o).text; }), [tx('Klartext'), tx('Geheim')]) +
        (o.scheibe ? tx('<h3 class="gs-unter">Caesar-Scheibe zum Basteln</h3>') + '<p class="gs-erklaerung">' + tx('Beide Scheiben ausschneiden, die kleine auf die grosse legen und in der Mitte mit einer Musterbeutelklammer befestigen. Dann die kleine Scheibe so drehen, dass ihr {a} unter dem A der grossen steht – oder anders gesagt: der ★ (er markiert das A der kleinen Scheibe) unter dem {b}. Aussen steht der Klartext, innen der Geheimtext.', { a:Kern.ABC[o.verschiebung % 26], b:Kern.ABC[(26 - o.verschiebung % 26) % 26] }) + '</p>' + caesarScheibe() : '');
    case 'emojis':
      if (!Kern.EMOJI_THEMEN[o.emojiThema]) return tx('<p class="gs-erklaerung">Wähle zuerst ein Emoji-Thema.</p>');
      var E = Kern.EMOJI_THEMEN[o.emojiThema].liste, sv = +o.bildVerschiebung || 0;
      return '<p class="gs-erklaerung">' + tx('Jeder Buchstabe ist ein Emoji: A ist {a}, B ist {b}, C ist {c} … Zum Entschlüsseln das Emoji unten suchen und den Buchstaben darüber lesen.', { a:E[sv], b:E[(sv + 1) % 26], c:E[(sv + 2) % 26] }) + '</p>' +
        zweiReihen(A, A.map(function(c, i){ return '<span class="gs-emoji-k">' + E[(i + sv) % 26] + '</span>'; }), [tx('Buchstabe'), tx('Emoji')]) +
        (o.bildScheibe ? tx('<h3 class="gs-unter">Emoji-Scheibe zum Basteln</h3>') + '<p class="gs-erklaerung">' + tx('Beide Scheiben ausschneiden, die kleine auf die grosse legen und in der Mitte mit einer Musterbeutelklammer befestigen.') + ' ' +
          (sv ? tx('Der ★ auf der kleinen Scheibe zeigt den Anfang. Dreh die kleine Scheibe so, dass der ★ unter dem {b} steht.', { b:'<b>' + Kern.ABC[(26 - sv) % 26] + '</b>' }) : tx('Der ★ auf der kleinen Scheibe zeigt den Anfang. Dreh die kleine Scheibe so, dass der ★ unter dem {b} steht (also unter dem A).', { b:'<b>A</b>' })) + ' ' +
          tx('Jetzt steht unter jedem Buchstaben sein Emoji – unter dem A {e}.', { e:E[sv] }) + '</p>' +
          caesarScheibe({ name:tx('Emoji-Scheibe'), innen:function(i){ return E[i]; }, innenGroesse:10.5 }) : '');
    case 'farben':
      var F = Kern.FARB_CODE, sf = +o.bildVerschiebung || 0;
      function punkt(f){ return '<span class="gs-farb-k" style="background:' + f + '"></span>'; }
      function bunt(c, i){ return '<span class="gs-farbbuchstabe" style="color:' + F[i] + '">' + c + '</span>'; }
      return '<p class="gs-erklaerung">' + tx('Jeder Buchstabe ist eine Farbe. Die Farben folgen dem Regenbogen – immer abwechselnd dunkel und hell.') + ' ' + (sf ? tx('Die Farben sind um {n} verschoben.', { n:sf }) + ' ' : '') +
        tx('Zum Entschlüsseln die Farbe unten suchen und den Buchstaben darüber lesen. Am besten farbig drucken.') + '</p>' +
        zweiReihen(A.map(bunt), A.map(function(c, i){ return punkt(F[(i + sf) % 26]); }), [tx('Buchstabe'), tx('Farbe')]) +
        (o.bildScheibe ? tx('<h3 class="gs-unter">Regenbogen-Scheibe zum Basteln</h3>') + '<p class="gs-erklaerung">' + tx('Beide Scheiben ausschneiden, die kleine auf die grosse legen und in der Mitte mit einer Musterbeutelklammer befestigen.') + ' ' +
          (sf ? tx('Der ★ auf der kleinen Scheibe zeigt den Anfang. Dreh die kleine Scheibe so, dass der ★ unter dem {b} steht.', { b:'<b>' + Kern.ABC[(26 - sf) % 26] + '</b>' }) : tx('Der ★ auf der kleinen Scheibe zeigt den Anfang. Dreh die kleine Scheibe so, dass der ★ unter dem {b} steht (also unter dem A).', { b:'<b>A</b>' })) + ' ' +
          tx('Jetzt steht unter jedem Buchstaben seine Farbe – unter dem A {f}.', { f:punkt(F[sf]) }) + '</p>' +
          caesarScheibe({ name:tx('Regenbogen-Scheibe'), innen:function(){ return ''; }, innenFarbe:function(i){ return F[i]; }, aussenFarbe:function(i){ return F[i]; } }) : '');
    case 'anlaut':
      var misch = o.anlautMisch !== false, fehlt = [];
      var zeilen = A.map(function(c){
        var l = misch ? Kern.anlautListe(c, o) : [Kern.anlautWahl(c, o, 0)].filter(Boolean).map(function(w){ return [w.emoji, w.wort]; });
        if (!l.length){ fehlt.push(c); return ''; }
        return '<div class="gs-anlaut-zeile"><b>' + c + '</b><span>' + l.map(function(x){ return '<span class="gs-anlaut-paar"><span class="gs-emoji-k">' + x[0] + '</span> <span class="gs-anlaut-wort"><u>' + esc(Array.from(x[1])[0]) + '</u>' + esc(Array.from(x[1]).slice(1).join('')) + '</span></span>'; }).join('') + '</span></div>';
      }).join('');
      return '<p class="gs-erklaerung">' + tx('Jedes Emoji steht für den ersten Buchstaben seines Namens: {e} {w} ist {b}. Sag das Wort leise vor dich hin und schreib nur den ersten Buchstaben auf.', { e:Kern.anlautListe('A', o)[0] ? Kern.anlautListe('A', o)[0][0] : '', w:Kern.anlautListe('A', o)[0] ? esc(Kern.anlautListe('A', o)[0][1]) : '', b:'<b>A</b>' }) +
        (misch ? ' ' + tx('Derselbe Buchstabe kann verschiedene Emojis haben.') : '') + (fehlt.length ? ' ' + tx('Für {x} gibt es kein passendes Emoji – im Geheimtext steht der Buchstabe selbst.', { x:'<b>' + fehlt.join(', ') + '</b>' }) : '') + '</p>' +
        '<div class="gs-anlaut-tabelle">' + zeilen + '</div>';
    case 'spiegel':
      var sp = o.spiegelArt || 'horizontal', spA = A.concat([]), klein = 'abcdefghijklmnopqrstuvwxyz'.split('');
      function sz(c){ return '<span class="gs-t gs-sp gs-sp-' + sp + '">' + esc(c) + '</span>'; }
      var spText = {
        horizontal:tx('Spiegelschrift liest man am besten mit einem Spiegel: Stell ihn senkrecht neben die Zeile – im Spiegel steht der Text richtig. Ohne Spiegel: von rechts nach links lesen und jeden Buchstaben im Kopf umdrehen.'),
        kopf:tx('Der Text steht auf dem Kopf. Dreh das Blatt einmal halb herum – dann kannst du ihn lesen.'),
        vertikal:tx('Der Text ist an einer waagrechten Linie umgeklappt: Die Buchstaben stehen auf dem Kopf, die Zeilen von unten nach oben. Mit einem Spiegel, den du waagrecht unter die Zeile hältst, kannst du ihn lesen.'),
        rueckwaerts:tx('Die Buchstaben stehen in umgekehrter Reihenfolge. Lies jede Zeile von rechts nach links.'),
        woerter:tx('Jedes Wort ist rückwärts geschrieben, die Wörter stehen aber am richtigen Platz. Lies jedes Wort von hinten nach vorne.')
      }[sp];
      return '<p class="gs-erklaerung">' + spText + '</p>' + (sp === 'rueckwaerts' || sp === 'woerter' ? '' :
        zweiReihen(spA, spA.map(sz), [tx('Normal'), tx('Geheim')]) + zweiReihen(klein, klein.map(sz), [tx('Normal'), tx('Geheim')]));
    case 'atbasch':
      return tx('<p class="gs-erklaerung">Das Alphabet wird umgedreht: A und Z tauschen, B und Y, C und X … Verschlüsseln und Entschlüsseln geht gleich.</p>') +
        zweiReihen(A, A.map(function(c){ return Kern.zeichen('atbasch', c, o).text; }), [tx('Klartext'), tx('Geheim')]);
    case 'zahlen':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe wird durch seine Stelle im Alphabet ersetzt.</p>') + zweiReihen(A, A.map(function(c, i){ return String(i + 1); }), [tx('Buchstabe'), tx('Zahl')]);
    case 'roemisch':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe ist seine Stelle im Alphabet als römische Zahl. Die Römer schrieben <b>I</b> = 1, <b>V</b> = 5 und <b>X</b> = 10 und zählten zusammen: XII = 10 + 1 + 1 = 12 = L. Steht I vor V oder X, wird es abgezogen: IV = 4, IX = 9. Ziffern im Text sind auch römisch geschrieben – eine Null kannten die Römer nicht, sie bleibt stehen.</p>') +
        tabelle(A.map(function(c, i){ return [c, '<span class="gs-t">' + Kern.roemisch(i + 1) + '</span>']; }), 'gs-tab-text') +
        tx('<h3 class="gs-unter">Ziffern</h3>') + tabelle('123456789'.split('').map(function(d){ return [d, '<span class="gs-t">' + Kern.roemisch(+d) + '</span>']; }), 'gs-tab-text');
    case 'binaer':
      var perlen = o.binArt === 'perlen';
      return '<p class="gs-erklaerung">' + tx('So rechnet der Computer: Jeder Buchstabe ist seine Stelle im Alphabet als Binärzahl mit fünf Stellen. Die Stellen sind von links nach rechts <b>16, 8, 4, 2, 1</b> wert. Zähle die Werte zusammen, wo eine 1 steht: 01011 = 8 + 2 + 1 = 11, also K.') +
        (perlen ? ' ' + tx('Eine dunkle Perle bedeutet 1, eine helle 0.') : '') + '</p>' +
        // Beispiel K = 01011: Perlen bzw. Ziffern, darunter der Wert jeder Stelle
        '<div class="gs-bin-beispiel"><svg viewBox="0 0 100 34" aria-hidden="true">' + Array.from('01011').map(function(b, i){ return (perlen ? '<circle cx="' + (10 + i * 20) + '" cy="9" r="7.6" fill="' + (b === '1' ? TINTE : '#fff') + '" stroke="' + TINTE + '" stroke-width="1.6"/>' :
          '<text x="' + (10 + i * 20) + '" y="14" text-anchor="middle" font-size="15" font-weight="700" fill="' + TINTE + '">' + b + '</text>') +
          '<text x="' + (10 + i * 20) + '" y="31" text-anchor="middle" font-size="10" font-weight="700" fill="#005A90">' + [16, 8, 4, 2, 1][i] + '</text>'; }).join('') + '</svg><span>' + tx('8 + 2 + 1 = 11 → K') + '</span></div>' +
        tabelle(A.map(function(c, i){ var b = Kern.binaer(i + 1); return perlen ? [c, perlenSvg(b, 'gs-perlen-k'), b] : [c, '<span class="gs-t">' + b + '</span>']; }), perlen ? 'gs-tab-perlen' : 'gs-tab-text');
    case 'halb':
      var ha = o.halbArt === 'unten' ? 'unten' : 'oben';
      return '<p class="gs-erklaerung">' + (ha === 'oben' ? tx('Von jedem Buchstaben ist nur die obere Hälfte zu sehen. Ergänze im Kopf die untere Hälfte – manche Buchstaben sehen oben gleich aus, dann hilft das Wort.') : tx('Von jedem Buchstaben ist nur die untere Hälfte zu sehen. Ergänze im Kopf die obere Hälfte – manche Buchstaben sehen unten gleich aus, dann hilft das Wort.')) + '</p>' +
        tabelle(A.concat('0123456789'.split('')).map(function(c){ return [c, halbSvg(c, ha, 'gs-halb-k')]; }), 'gs-tab-halb');
    case 'handy':
      return tx('<p class="gs-erklaerung">Wie früher beim SMS-Schreiben: Die Ziffer zeigt die Taste, und so oft, wie sie dasteht, wird getippt. B ist der zweite Buchstabe auf der Taste 2, also <b>22</b>.</p>') +
        '<div class="gs-handy">' + [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', ''], ['#', '']]
          .map(function(t){ return '<span class="gs-taste"><b>' + t[0] + '</b><small>' + (t[1] || '&nbsp;') + '</small></span>'; }).join('') + '</div>' +
        tabelle(A.map(function(c){ return [c, '<span class="gs-t">' + Kern.zeichen('handy', c, o).text + '</span>']; }), 'gs-tab-text');
    case 'polybios':
      var g = '<table class="gs-gitter"><tr><th></th>' + [1, 2, 3, 4, 5].map(function(s){ return '<th>' + s + '</th>'; }).join('') + '</tr>';
      for (var r = 0; r < 5; r++){ g += '<tr><th>' + (r + 1) + '</th>'; for (var c = 0; c < 5; c++){ var b = Kern.GITTER[r * 5 + c]; g += '<td>' + (b === 'I' ? 'I/J' : b) + '</td>'; } g += '</tr>'; }
      return tx('<p class="gs-erklaerung">Jeder Buchstabe wird zu zwei Ziffern: zuerst die <b>Zeile</b>, dann die <b>Spalte</b>. B steht in Zeile 1, Spalte 2, also <b>12</b>. I und J teilen sich ein Feld.</p>') + g + '</table>';
    case 'freimaurer':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe wird als das Stück Gitter geschrieben, das ihn umgibt – mit Punkt, wenn neben ihm ein Punkt steht.</p>') +
        '<div class="gs-fm-schluessel">' + [[fmGitter, 0, false, tx('A bis I')], [fmGitter, 9, true, tx('J bis R, mit Punkt')], [fmX, 18, false, tx('S bis V')], [fmX, 22, true, tx('W bis Z, mit Punkt')]]
          .map(function(k){ return '<svg viewBox="0 0 300 300" role="img" aria-label="' + tx('Schlüssel {k}', { k:k[3] }) + '">' + k[0](k[1], k[2]) + '</svg>'; }).join('') + '</div>' +
        tabelle(A.map(function(c){ return [c, fmSvg(Kern.freimaurer(c), 'gs-fm-k')]; }), 'gs-tab-fm');
    case 'voegel':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe ist ein Vogel auf dem Draht – achte darauf, wohin er schaut, wie sein Schwanz hängt (kurz, lang oder schräg) und was er tut: sitzen (A–F), mit den Flügeln schlagen (G–L), picken (M–R), als Küken sitzen (S–X) oder liegen (Y, Z).</p>') +
        tabelle(A.map(function(c){ return [c, vogelSvg(Kern.VOEGEL[c], 'gs-vogel-k')]; }), 'gs-tab-voegel');
    case 'buecher':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe ist aus Büchern gelegt – liegend, stehend, schräg oder aufgeklappt. Schau genau, welche Form die Bücher zusammen bilden.</p>') +
        tabelle(A.map(function(c){ return [c, buchSvg(Kern.BUECHER[c], 'gs-buch-k')]; }), 'gs-tab-buecher') +
        tx('<h3 class="gs-unter">Satzzeichen</h3>') + tabelle([['.', tx('Punkt')], [',', tx('Komma')], ['!', tx('Ausrufezeichen')], ['-', tx('Bindestrich')]].map(function(x){ return [x[0], buchSvg(Kern.BUECHER[x[0]], 'gs-buch-k'), x[1]]; }), 'gs-tab-buecher');
    case 'baerte':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe ist ein Gesicht: Haare und Bart formen zusammen den Buchstaben. Schau genau auf den Umriss des Bartes und der Haare.</p>') +
        tabelle(A.map(function(c){ return [c, bildHtml('baerte', Kern.BILDZEICHEN[c], '-k')]; }), 'gs-tab-baerte');
    case 'segmente':
      return tx('<p class="gs-erklaerung">Wie auf einer Leuchtanzeige besteht jedes Zeichen aus bis zu 14 Strichen (Segmenten). Jedes Segment hat einen Namen. Für jeden Buchstaben leuchten bestimmte Segmente') +
        (o.segArt === 'ausmalen' ? tx(' – male die genannten Segmente an und lies den Buchstaben ab.') : '.') + '</p>' +
        '<div class="gs-seg-kopf">' + segmentPlan() + tx('<p class="gs-erklaerung">Aussen: <b>a</b> oben, <b>b</b> und <b>c</b> rechts, <b>d</b> unten, <b>e</b> und <b>f</b> links.<br>Mitte: <b>g1</b> und <b>g2</b> waagrecht.<br>Innen oben: <b>h</b>, <b>i</b>, <b>j</b>; innen unten: <b>k</b>, <b>l</b>, <b>m</b>.</p></div>') +
        tabelle(A.map(function(c){ return [c, segmentSvg(Kern.SEGMENTE[c], 'gs-seg-k'), Kern.SEGMENTE[c].join(' ')]; }), 'gs-tab-seg') +
        tx('<h3 class="gs-unter">Ziffern</h3>') + tabelle('0123456789'.split('').map(function(c){ return [c, segmentSvg(Kern.SEGMENTE[c], 'gs-seg-k'), Kern.SEGMENTE[c].join(' ')]; }), 'gs-tab-seg');
    case 'bausteine':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe ist ein Baustein, von oben gesehen. Zähle die Noppen und schau die Farbe an: A bis I haben 4 Noppen (2 × 2), J bis R 6 Noppen (2 × 3) und S bis Z 8 Noppen (2 × 4). ') +
        tx('In jeder Gruppe kommen die Farben in derselben Reihenfolge: rot, orange, gelb, hellgrün, dunkelgrün, hellblau, blau, violett, rosa.</p>') +
        tabelle(A.map(function(c){ return [c, steinSvg(Kern.BAUSTEINE[c], 'gs-stein-k'), STEIN_NAME[Kern.BAUSTEINE[c][0]]]; }), 'gs-tab-steine');
    case 'noten':
      return tx('<p class="gs-erklaerung">Jeder Ton in der Musik hat einen Namen: C, D, E, F, G, A und H – nach dem H kommt wieder ein C. Im Notensystem mit dem Violinschlüssel steht jede Note auf einer Linie oder in einem Zwischenraum. ') +
        tx('Der Name der Note ist der Buchstabe. Das C gibt es zweimal: tief unten auf einer kleinen Hilfslinie und hoch im dritten Zwischenraum.') + (o.notenBS ? '' : tx(' Darum lassen sich nur Wörter mit diesen sieben Buchstaben schreiben.')) + '</p>' +
        notenSchluesselSvg(o.notenBS) +
        (o.notenBS ? tx('<p class="gs-erklaerung">Das ♭ (Be) macht einen Ton ein wenig tiefer. Das H mit ♭ heisst <b>B</b>, das E mit ♭ heisst <b>Es</b> – das ist hier das <b>S</b>. ') +
          tx('So hat der Komponist Johann Sebastian Bach seinen Namen in Musik geschrieben: B – A – C – H.</p>') : '') +
        tx('<p class="gs-erklaerung gs-noten-merk">Merkhilfe: Die Note auf der untersten Linie ist das E, die auf der Mittellinie das H. Um die zweitunterste Linie (G) dreht sich der Violinschlüssel.</p>');
    case 'finger':
      return tx('<p class="gs-erklaerung">Mit dem Fingeralphabet buchstabieren gehörlose Menschen Namen und Wörter, für die es keine eigene Gebärde gibt. Jeder Buchstabe ist eine Handform. ') +
        tx('Im Fingeralphabet der Deutschschweiz haben auch Ä, Ö, Ü, CH und SCH eigene Zeichen. Bei J und Z bewegt sich die Hand (Pfeil).</p>') +
        tabelle(A.map(function(c){ return [c, bildHtml('finger', Kern.FINGER[c], '-k')]; }).concat(['Ä', 'Ö', 'Ü', 'CH', 'SCH'].map(function(c){ return [c, bildHtml('finger', Kern.FINGER[c], '-k')]; })), 'gs-tab-finger') +
        tx('<p class="gs-quelle">Fingeralphabet: © SGB-FSS Schweizerischer Gehörlosenbund, www.sgb-fss.ch</p>');
    case 'altlatein':
      return tx('<p class="gs-erklaerung">So schrieb man in Italien vor über 2500 Jahren. Damals schrieb man oft von rechts nach links – darum sehen manche Buchstaben gespiegelt aus. Achtung: C und G haben dasselbe Zeichen, ebenso I, J und Y sowie U, V und W.</p>') +
        tabelle(A.map(function(c){ return [c, bildHtml('altlatein', Kern.BILDZEICHEN[c], '-k')]; }), 'gs-tab-alt');
    case 'runen':
      return tx('<p class="gs-erklaerung">Runen sind die alten Schriftzeichen der Germanen. Sie wurden oft in Holz, Knochen oder Stein geritzt. Achtung: I und J haben dieselbe Rune, ebenso U, V und W.</p>') +
        tabelle(A.map(function(c){ return [c, bildHtml('runen', Kern.BILDZEICHEN[c], '-k')]; }), 'gs-tab-runen');
    case 'kreise':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe besteht aus Bögen eines Kreises und geraden Strichen. Achte darauf, wo der Kreis offen ist und wo die Striche liegen. Achtung: 5 und S sehen gleich aus.</p>') +
        tabelle(A.map(function(c){ return [c, kreisSvg(Kern.KREISE[c], 'gs-kreis-k')]; }), 'gs-tab-kreise') +
        tx('<h3 class="gs-unter">Ziffern</h3>') + tabelle('0123456789'.split('').map(function(c){ return [c, kreisSvg(Kern.KREISE[c], 'gs-kreis-k')]; }), 'gs-tab-kreise');
    case 'morse':
      return tx('<p class="gs-erklaerung">Jeder Buchstabe besteht aus kurzen (Punkt) und langen (Strich) Zeichen.</p>') +
        tabelle(A.concat(['Ä', 'Ö', 'Ü', 'ß']).map(function(c){ return [c, morseSvg(Kern.MORSE[c], 'gs-morse-k')]; }), 'gs-tab-morse') +
        tx('<h3 class="gs-unter">Ziffern und Satzzeichen</h3>') + tabelle('0123456789.,?!'.split('').map(function(c){ return [c, morseSvg(Kern.MORSE[c], 'gs-morse-k')]; }), 'gs-tab-morse');
    case 'braille':
      return tx('<p class="gs-erklaerung">Jedes Zeichen hat sechs Plätze für Punkte, zwei Spalten mit je drei. Blinde Menschen ertasten die erhabenen Punkte mit dem Finger. Die kleinen grauen Punkte zeigen nur die freien Plätze.</p>') +
        tabelle(A.concat(['Ä', 'Ö', 'Ü', 'ß']).map(function(c){ return [c, brailleSvg([Kern.BRAILLE[c]], 'gs-braille-k')]; }), 'gs-tab-braille') +
        tx('<h3 class="gs-unter">Zahlen und Satzzeichen</h3><p class="gs-erklaerung">Vor einer Zahl steht das Zahlzeichen, danach die Buchstaben a bis j für 1 bis 0.</p>') +
        tabelle([[tx('Zahlzeichen'), brailleSvg([Kern.ZAHLZEICHEN], 'gs-braille-k')], ['1', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.A], 'gs-braille-k')], ['2', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.B], 'gs-braille-k')], ['0', brailleSvg([Kern.ZAHLZEICHEN, Kern.BRAILLE.J], 'gs-braille-k')]]
          .concat('.,?!'.split('').map(function(c){ return [c, brailleSvg([Kern.BRAILLE[c]], 'gs-braille-k')]; })), 'gs-tab-braille');
    case 'hieroglyphen':
      return tx('<p class="gs-erklaerung">Die alten Ägypter schrieben mit Bildzeichen. Für unser Alphabet nimmt man Zeichen, die für einen Laut stehen. Manche stehen für zwei Buchstaben: C und K, E und I, F und V, U und W.</p>') +
        tabelle(A.map(function(c){ return [c, glyphe(Kern.HIERO[c], 'gs-h-k'), tx(Kern.HIERO_NAME[c])]; }), 'gs-tab-hiero');
  }
  return '';
}
/* In der Auswahl stehen Caesar, Emoji- und Regenbogen-Scheibe unter einem Eintrag «Geheimscheibe»; darin wählt
   man zuerst die Scheibe. Intern bleiben es drei Schriften (st.opt.art), der Listeneintrag ist st.opt.wahl. */
var SCHEIBEN = [['caesar', tx('Buchstaben'), tx('Caesar: A wird zu D …')], ['emojis', tx('Emojis'), tx('26 Emojis zu einem Thema')], ['farben', tx('Regenbogen-Farben'), tx('26 Farben im Regenbogen')]];
var LISTE = [['scheibe', tx('Geheimscheibe'), tx('Buchstaben, Emojis oder Farben – mit Scheibe zum Drehen')]].concat(SCHRIFTEN.filter(function(x){ return !SCHEIBEN.some(function(y){ return y[0] === x[0]; }); }));
function istScheibe(art){ return SCHEIBEN.some(function(y){ return y[0] === art; }); }
function schriftName(art, o){ var s = SCHRIFTEN.filter(function(x){ return x[0] === art; })[0]; return art === 'caesar' ? tx('{s} um {n}', { s:s[1], n:o.verschiebung }) : s[1]; }

var VORLAGE = '<div class="gs">' +
  tx('<header class="gs-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Geheimschriften</h1>') +
    tx('<p>Dein Text in einer Geheimschrift – von der Caesar-Verschiebung über den Freimaurer-Code und das Morsen bis zu Hieroglyphen. Zu jeder Schrift gibt es den Schlüssel zum Entschlüsseln.</p></header>') +
  tx('<div class="gs-layout"><section class="gs-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimschrift</h2><p id="gsSchriftFrage">Wähle zuerst, in welcher Schrift der Text stehen soll.</p></div></div>') +
      tx('<div class="gs-schriften" role="radiogroup" aria-label="Geheimschrift">') +
        LISTE.map(function(s){ return '<label><input type="radio" name="gsSchrift" value="' + s[0] + '"><span><i class="gs-vorschau-platz" data-art="' + s[0] + '"></i><b>' + s[1] + '</b><small>' + s[2] + '</small></span></label>'; }).join('') +
      '</div>' +
      tx('<button type="button" class="btn klein gs-andere" id="gsAndere" hidden>Andere Geheimschrift wählen</button>') +
      tx('<div class="gs-caesar" id="gsScheibenWahl" hidden><p class="feld-label">Welche Scheibe?</p><div class="gs-themen gs-scheiben" role="radiogroup" aria-label="Welche Scheibe">') +
        SCHEIBEN.map(function(x){ return '<label><input type="radio" name="gsScheibenArt" value="' + x[0] + '"><span><b>' + x[1] + '</b><i class="gs-scheiben-vorschau" data-art="' + x[0] + '"></i><small>' + x[2] + '</small></span></label>'; }).join('') + '</div></div>' +
      '<div class="gs-caesar" id="gsCaesar">' +
        tx('<div class="opt-raster"><label for="gsVerschiebung">Verschiebung</label><select id="gsVerschiebung">') +
          Array.from({ length:25 }, function(_, i){ return '<option value="' + (i + 1) + '">' + (i + 1) + ' (A → ' + Kern.ABC[i + 1] + ')</option>'; }).join('') + '</select></div>' +
        tx('<label class="opt"><input type="checkbox" id="gsScheibe"><span>Caesar-Scheibe zum Basteln im Schlüssel</span></label>') +
      '</div>' +
      '<div class="gs-caesar" id="gsBild">' +
        tx('<div id="gsEmojiThemen"><p class="feld-label">Emoji-Thema</p><div class="gs-themen" role="radiogroup" aria-label="Emoji-Thema">') +
          Object.keys(Kern.EMOJI_THEMEN).map(function(k){ var t = Kern.EMOJI_THEMEN[k]; return '<label><input type="radio" name="gsEmojiThema" value="' + k + '"><span><b>' + tx(t.name) + '</b><i>' + t.liste.slice(0, 6).join('') + '</i></span></label>'; }).join('') + '</div></div>' +
        tx('<div id="gsBildMehr"><div class="opt-raster"><label for="gsBildVerschiebung">Verschiebung</label><select id="gsBildVerschiebung">') +
          Array.from({ length:26 }, function(_, i){ return '<option value="' + i + '">' + (i ? i : tx('0 (keine)')) + '</option>'; }).join('') + '</select></div>' +
        tx('<label class="opt"><input type="checkbox" id="gsBildScheibe"><span>Scheibe zum Basteln im Schlüssel</span></label></div>') +
      '</div>' +
      '<div class="gs-caesar" id="gsSpiegel">' +
        tx('<p class="feld-label">Wie gespiegelt?</p><div class="gs-themen gs-spiegel-arten" role="radiogroup" aria-label="Art der Spiegelschrift">') +
          SPIEGEL_ARTEN.map(function(a){ return '<label><input type="radio" name="gsSpiegelArt" value="' + a[0] + '"><span><b>' + a[1] + '</b><i class="gs-vorschau"><span class="gs-t gs-sp gs-sp-' + a[0] + '">' +
            esc(a[0] === 'rueckwaerts' ? 'cbA' : a[0] === 'woerter' ? 'cbA' : 'Abc') + '</span></i><small>' + a[2] + '</small></span></label>'; }).join('') + '</div>' +
        tx('<button type="button" class="btn klein" id="gsSpiegelKopieren" title="Als Text zum Einfügen in WhatsApp, Word oder eine E-Mail">Als Text kopieren</button>') +
        tx('<p class="hinweis">«Als Text kopieren» nimmt ähnlich aussehende Sonderzeichen – so lässt sich der Text überall einfügen. Auf dem Blatt wird die echte Schrift gespiegelt.</p>') +
      '</div>' +
      '<div class="gs-caesar" id="gsBinaer">' +
        tx('<p class="feld-label">Darstellung</p><div class="gs-chips" role="radiogroup" aria-label="Darstellung des Binärcodes">') +
          [['ziffern', tx('Nullen und Einsen')], ['perlen', tx('Perlen (dunkel = 1)')]].map(function(a){ return '<label><input type="radio" name="gsBinArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="gs-caesar" id="gsHalb">' +
        tx('<p class="feld-label">Welche Hälfte bleibt sichtbar?</p><div class="gs-chips" role="radiogroup" aria-label="Sichtbare Hälfte">') +
          [['oben', tx('Obere Hälfte')], ['unten', tx('Untere Hälfte')]].map(function(a){ return '<label><input type="radio" name="gsHalbArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
        tx('<p class="hinweis">Die obere Hälfte ist meist leichter zu lesen als die untere.</p>') +
      '</div>' +
      '<div class="gs-caesar" id="gsSegment">' +
        tx('<p class="feld-label">Aufgabe</p><div class="gs-chips" role="radiogroup" aria-label="Aufgabe beim Segment-Code">') +
          [['ausmalen', tx('Segmente ausmalen')], ['anzeige', tx('Anzeige lesen')]].map(function(a){ return '<label><input type="radio" name="gsSegArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
        tx('<p class="hinweis">Beim Ausmalen stehen über jeder leeren Anzeige die Namen der Segmente (z. B. «a b c d g2 i l»); wer sie anmalt, sieht den Buchstaben.</p>') +
      '</div>' +
      '<div class="gs-caesar" id="gsNoten">' +
        (Labor.sprache === 'de' ? tx('<label class="opt"><input type="checkbox" id="gsNotenBS"><span>Mit B und S – wie bei Bach: B ist das H mit ♭, S das Es (E mit ♭)</span></label>') : '<input type="checkbox" id="gsNotenBS" hidden>') +
      '</div>' +
      '<div class="gs-caesar" id="gsAnlaut">' +
        tx('<label class="opt"><input type="checkbox" id="gsAnlautMisch"><span>Abwechslung: Derselbe Buchstabe bekommt verschiedene Emojis</span></label>') +
        tx('<button type="button" class="btn klein" id="gsAnlautNeu" title="Andere Emojis für die Buchstaben wählen">Andere Emojis</button>') +
        tx('<p class="hinweis">Jedes Emoji steht für den ersten Buchstaben seines Namens – auf Deutsch. Wechselst du oben die Sprache, passen die Emojis zur neuen Sprache. Im Schlüssel stehen alle Emojis mit ihren Wörtern.</p>') +
      '</div>' +
      '<div class="gs-caesar" id="gsErpresser">' +
        tx('<button type="button" class="btn klein" id="gsErpNeu" title="Alle Buchstaben neu ausschneiden und aufkleben">Neu ausschneiden</button>') +
        tx('<label class="opt"><input type="checkbox" id="gsErpMisch"><span>Gross- und Kleinbuchstaben gemischt</span></label>') +
        tx('<p class="hinweis">Jeder Buchstabe sieht anders aus: Schrift, Farbe, Grösse, Papier und Drehung sind zufällig. «Neu ausschneiden» klebt alles neu.</p>') +
      '</div>' +
    '</div>' +
    tx('<div class="karte" id="gsTextKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Geheimer Text</h2><p>Wörter oder Sätze, auch mehrere Zeilen.</p></div></div>') +
      tx('<label class="vh" for="gsText">Geheimer Text</label><textarea id="gsText" rows="5" maxlength="400" autocomplete="off" spellcheck="false"></textarea>') +
      '<p class="hinweis" id="gsTextHinweis"></p>' +
      '<div id="gsNotenText" hidden>' +
        tx('<p class="feld-label">Wörter, die mit Noten gehen</p><div class="gs-notenwoerter">') +
          Kern.NOTEN_WOERTER.map(function(w){ return '<button type="button" class="gs-wortchip" data-wort="' + w + '">' + w + '</button>'; }).join('') +
          Kern.NOTEN_WOERTER_BS.map(function(w){ return '<button type="button" class="gs-wortchip gs-bs" data-wort="' + w + '">' + w + '</button>'; }).join('') + '</div>' +
        '<p class="hinweis" id="gsNotenHinweis"></p>' +
        tx('<div class="gs-noten-ton"><button type="button" class="btn klein" id="gsNotenSpielen">▶ Anhören</button><button type="button" class="btn klein" id="gsNotenStopp">■ Stopp</button></div>') +
      '</div>' +
    '</div>' +
    tx('<div class="karte" id="gsBlattKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>') +
      tx('<p class="feld-label">Grösse der Zeichen</p>') +
      tx('<div class="gs-chips" role="radiogroup" aria-label="Grösse der Zeichen">') +
        GROESSEN.map(function(g){ return '<label><input type="radio" name="gsGroesse" value="' + g[0] + '"><span>' + g[1] + '</span></label>'; }).join('') + '</div>' +
      tx('<div class="opt-raster"><label for="gsTitel">Titel auf dem Blatt</label><input type="text" id="gsTitel" maxlength="60" autocomplete="off"></div>') +
      '<div id="gsNotenBlatt" hidden>' +
        tx('<label class="opt"><input type="checkbox" id="gsNotenAudio"><span>Mit Audio: Auf dem Blatt steht nur ein QR-Code zur Hörseite (alle Töne der Botschaft und das Tonalphabet zum Vergleichen); die Lösung kommt auf ein eigenes Blatt</span></label>') +
        tx('<div class="gs-einzug gs-qr-groesse" id="gsQrGroesseFeld" hidden><label class="feld-label" for="gsQrGroesse">Grösse des QR-Codes: <b id="gsQrGroesseWert"></b></label><input type="range" id="gsQrGroesse" min="3" max="16" step="0.5"></div>') +
        tx('<p class="hinweis gs-einzug" id="gsNotenSeiteZeile" hidden><a id="gsNotenSeite" href="#" target="_blank" rel="noopener">Hörseite öffnen</a> (so sehen es die Kinder nach dem Scannen)</p>') +
      '</div>' +
    '</div>' +
  '</section>' +
  tx('<section class="gs-ausgabe" aria-label="Ergebnis">') +
    '<div id="gsMeldung" aria-live="polite"></div>' +
    '<div class="gs-teil" id="gsTeilText">' +
      tx('<h2 class="gs-teil-titel">Geheimtext</h2>') +
      '<div class="gs-werkzeug">' +
        tx('<button type="button" class="btn klein gs-nur-geheim" id="gsZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
        '<span class="abstand"></span>' +
        Labor.blattSchalterHtml() +
        tx('<label class="gs-nur-geheim" title="Linien unter den Zeichen zum Hinschreiben der Buchstaben"><input type="checkbox" id="gsLinien"> Schreiblinien</label>') +
        tx('<label class="gs-nur-geheim"><input type="checkbox" id="gsMitLoesung"> mit Lösungsblatt</label>') +
        tx('<label class="gs-nur-geheim gs-mit-schluessel"><input type="checkbox" id="gsMitSchluessel"> mit Schlüssel</label>') +
        tx('<button type="button" class="btn klein" id="gsCodeBild">Als Bild</button>') +
        tx('<button type="button" class="btn klein primary" id="gsPdf">PDF herunterladen</button>') +
        tx('<button type="button" class="btn klein primary" id="gsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
      '</div>' +
      '<article class="gs-blatt" id="gsBlatt"></article>' +
      tx('<p class="gs-tipp" id="gsTipp">Tipp: Auf den Geheimtext klicken – er wird als Bild kopiert und lässt sich in Word mit Ctrl+V (Mac: Cmd+V) einfügen.</p>') +
      '<article class="gs-blatt gs-loesungsblatt" id="gsLoesung" aria-hidden="true"></article>' +
    '</div>' +
    '<div class="gs-teil gs-teil-schluessel">' +
      tx('<h2 class="gs-teil-titel">Schlüssel</h2>') +
      tx('<div class="gs-werkzeug"><span class="gs-werkzeug-text">Zum Entschlüsseln – auch einzeln.</span><span class="abstand"></span>') +
        tx('<button type="button" class="btn klein" id="gsSchluesselBild">Als Bild</button>') +
        tx('<button type="button" class="btn klein primary" id="gsSchluesselPdf">PDF herunterladen</button>') +
        tx('<button type="button" class="btn klein primary" id="gsSchluesselHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Schlüssel herunterladen</button>') +
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
  kurz:'Geheimscheibe, Freimaurer, Vögel, Bücher, Bärte, Segmente, Bausteine, Erpresserschrift, Noten, Runen, Morse, Hieroglyphen und mehr',
  beschreibung:'Ein eigener Text in einer von 25 Geheimschriften – Geheimscheibe (Buchstaben wie bei Caesar, Emojis oder Regenbogen-Farben), Anlaut-Emojis, Rückwärts-Alphabet, Spiegelschrift, Halbe Schrift, Zahlen, Römische Zahlen, Binärcode, Handy-Tasten, Koordinaten, Freimaurer-Code, Vögel auf dem Draht, Kreis-Code, Bücher-Code, Bärte-Code, Segment-Code, Bausteine, Erpresserschrift, Notenschrift, Altlatein, Runen, Fingeralphabet, Morse, Blindenschrift oder Hieroglyphen. Mit Schlüssel zum Entschlüsseln.',
  merkmale:['25 Geheimschriften', 'Schlüssel einzeln als PDF oder Bild', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/geheimschrift/geheimschrift.css',
  html:VORLAGE,
  start:starte
});

/* Alte Links auf den früheren Generator «Freimaurer-Code» (…/#freimaurer): Geheimschriften mit dem Freimaurer-Code öffnen.
   Läuft vor dem Labor (beim Laden und vor dessen Adresswechsel), damit dieses gleich die richtige Seite zeigt. */
var vorwahl = null;
// alte Adressen: #freimaurer (früher eigener Generator) und #text-spiegeln (jetzt «Spiegelschrift»)
function alterLink(){
  var alt = { '#freimaurer':'freimaurer', '#text-spiegeln':'spiegel' }[location.hash];
  if (alt){ vorwahl = alt; location.replace(location.pathname + location.search + '#geheimschrift'); }
}
alterLink();
window.addEventListener('hashchange', alterLink);

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'geheimschrift-eingaben', OPT = 'geheimschrift-einstellungen';
  var STANDARD = { art:'', wahl:'', scheibenArt:'', spiegelArt:'horizontal', binArt:'ziffern', halbArt:'oben', verschiebung:3, scheibe:true, segArt:'ausmalen', erpSeed:1, erpMisch:true, anlautMisch:true, anlautSeed:0, emojiThema:'', bildVerschiebung:0, bildScheibe:true, notenBS:false, notenAudio:false, qrCm:6, groesse:'mittel', linien:true, mitLoesung:true, mitSchluessel:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  if (Labor.sprache !== 'de') st.opt.notenBS = false;   // B und S (wie bei Bach) gibt es nur mit deutschen Tonnamen
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); } } catch(x){}
  if (vorwahl){ st.opt.art = st.opt.wahl = vorwahl; vorwahl = null; }
  if (!SCHRIFTEN.some(function(s){ return s[0] === st.opt.art; })) st.opt.art = '';   // keine Vorauswahl: zuerst die Schrift wählen
  // Listeneintrag passend zur Schrift (die drei Scheiben gehören zur «Geheimscheibe»)
  if (istScheibe(st.opt.art)){ st.opt.wahl = 'scheibe'; st.opt.scheibenArt = st.opt.art; }
  else if (st.opt.art) st.opt.wahl = st.opt.art;
  else if (st.opt.wahl !== 'scheibe') st.opt.wahl = '';
  if (!istScheibe(st.opt.scheibenArt)) st.opt.scheibenArt = '';
  st.opt.erpSeed = erpNeuerZufall(); erpVorschau = erpNeuerZufall();   // Erpresserschrift: jedes Mal anders
  st.opt.anlautDa = anlautNeueDa();   // Anlaut-Emojis: welche neuen Emojis dieses Gerät zeigen kann
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#gsMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function titel(){ return st.titel.trim() || tx('Geheimbotschaft'); }
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
    r.checked = r.value === st.opt.wahl;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.wahl = r.value; st.opt.art = r.value === 'scheibe' ? st.opt.scheibenArt : r.value;
      if (r.value === 'erpresser') st.opt.erpSeed = erpNeuerZufall(); speichern(); listeZu(true);
      // weiter zum nächsten Schritt: Textfeld, wenn noch kein Text da ist
      setTimeout(function(){ if (!st.text.trim()) $('#gsText').focus(); }, 0); $('#gsZeigeLoesung').setAttribute('aria-pressed', 'false'); hieroLaden(); alles(); });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="gsGroesse"]'), function(r){
    r.checked = r.value === st.opt.groesse;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.groesse = r.value; speichern(); zeichnen(); });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="gsSegArt"]'), function(r){
    r.checked = r.value === st.opt.segArt;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.segArt = r.value; speichern(); alles(); });
  });
  [].forEach.call(bereich.querySelectorAll('.gs-wortchip'), function(k){
    k.addEventListener('click', function(){
      var t = $('#gsText').value.replace(/\s+$/, '');
      $('#gsText').value = (t ? t + ' ' : '') + k.dataset.wort; st.text = $('#gsText').value; speichern(); zeichnen();
    });
  });
  // Notenschrift: Melodie der Botschaft (MIDI-Nummern je Wort)
  function notenMelodie(){
    var w = [];
    if (st.opt.art === 'noten') zellen().forEach(function(z){ z.forEach(function(wort){ var m = wort.filter(function(c){ return c.code && c.code.note; }).map(function(c){ return Kern.notenMidi(c.code); }); if (m.length) w.push(m); }); });
    return w;
  }
  // Adresse der Hörseite: auf der Website die eigene, im Artefakt die öffentliche
  function hoerUrl(){
    var basis = Labor.imArtefakt() || !/^https?:$/.test(location.protocol) ? 'https://raetsellabor.fabulousteaching.ch/' : location.origin + location.pathname.replace(/[^\/]*$/, '');
    return basis + 'T/?t=' + notenMelodie().map(function(w){ return w.join(''); }).join('-') + (st.opt.notenBS && Labor.sprache === 'de' ? '&bs=1' : '') + (Labor.sprache !== 'de' ? '&l=' + Labor.sprache : '');
  }
  $('#gsNotenSpielen').addEventListener('click', function(){
    var m = notenMelodie(), knopf = this;
    if (!m.length || !window.Toene) return;
    var noten = [].slice.call(bereich.querySelectorAll('#gsBlatt .gs-z:not(.gs-andere)'));
    knopf.disabled = true;
    Toene.folge(m, { beiTon:function(i){ noten.forEach(function(n, k){ n.classList.toggle('gs-spielt', k === i); }); },
      fertig:function(){ knopf.disabled = false; noten.forEach(function(n){ n.classList.remove('gs-spielt'); }); } });
  });
  $('#gsQrGroesse').value = st.opt.qrCm;
  $('#gsQrGroesse').addEventListener('input', function(){ st.opt.qrCm = +this.value; speichern(); zeichnen(); });
  $('#gsNotenStopp').addEventListener('click', function(){ if (window.Toene) Toene.stopp(); $('#gsNotenSpielen').disabled = false; [].forEach.call(bereich.querySelectorAll('.gs-spielt'), function(n){ n.classList.remove('gs-spielt'); }); });
  // Liste der Schriften: nach der Wahl zuklappen (nur die gewählte bleibt), «Andere Geheimschrift wählen» öffnet sie wieder
  function listeZu(zu){
    bereich.querySelector('.gs-schriften').classList.toggle('zu', !!zu && !!st.opt.wahl);
    $('#gsAndere').hidden = !(zu && st.opt.wahl);
    $('#gsSchriftFrage').hidden = !!st.opt.wahl;
  }
  $('#gsAndere').addEventListener('click', function(){ listeZu(false); var r = bereich.querySelector('input[name="gsSchrift"]:checked'); if (r) r.focus(); });
  $('#gsErpNeu').addEventListener('click', function(){ st.opt.erpSeed = erpNeuerZufall(); speichern(); alles(); });
  $('#gsAnlautNeu').addEventListener('click', function(){ st.opt.anlautSeed = ((+st.opt.anlautSeed || 0) % 97) + 1; speichern(); alles(); });
  $('#gsVerschiebung').value = String(st.opt.verschiebung);
  // Geheimscheibe: welche Scheibe?
  [].forEach.call(bereich.querySelectorAll('input[name="gsScheibenArt"]'), function(r){
    r.checked = r.value === st.opt.scheibenArt;
    r.addEventListener('change', function(){
      if (!r.checked) return; st.opt.scheibenArt = st.opt.art = r.value; speichern();
      $('#gsZeigeLoesung').setAttribute('aria-pressed', 'false'); alles();
      setTimeout(function(){ if (r.value !== 'emojis' && !st.text.trim()) $('#gsText').focus(); }, 0);
    });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="gsEmojiThema"]'), function(r){
    r.checked = r.value === st.opt.emojiThema;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.emojiThema = r.value; speichern(); alles(); setTimeout(function(){ if (!st.text.trim()) $('#gsText').focus(); }, 0); });
  });
  $('#gsBildVerschiebung').value = String(st.opt.bildVerschiebung || 0);
  $('#gsBildVerschiebung').addEventListener('change', function(){ st.opt.bildVerschiebung = +this.value; speichern(); alles(); });
  $('#gsVerschiebung').addEventListener('change', function(){ st.opt.verschiebung = +this.value; speichern(); alles(); });
  [['gsBinArt', 'binArt', 'ziffern'], ['gsHalbArt', 'halbArt', 'oben']].forEach(function(x){
    [].forEach.call(bereich.querySelectorAll('input[name="' + x[0] + '"]'), function(r){
      r.checked = r.value === (st.opt[x[1]] || x[2]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[x[1]] = r.value; speichern(); alles(); });
    });
  });
  // Halbe Schrift misst die Blattschrift: sobald sie geladen ist, noch einmal zeichnen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus && st.opt.art === 'halb'){ halbMass = null; alles(); } });
  [].forEach.call(bereich.querySelectorAll('input[name="gsSpiegelArt"]'), function(r){
    r.checked = r.value === (st.opt.spiegelArt || 'horizontal');
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.spiegelArt = r.value; speichern(); alles(); });
  });
  $('#gsSpiegelKopieren').addEventListener('click', function(){
    var t = Kern.spiegelText(st.text, st.opt.spiegelArt || 'horizontal'), k = this, alt = k.textContent;
    if (!st.text.trim()){ $('#gsText').focus(); return; }
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){
      k.textContent = tx('✓ Kopiert'); setTimeout(function(){ k.textContent = alt; }, 1600);
    }, function(){ meldung('warnung', '<p>' + tx('Das Kopieren hat nicht geklappt') + '.</p>'); });
  });
  [['#gsLinien', 'linien', zeichnen], ['#gsScheibe', 'scheibe', schluesselZeichnen], ['#gsBildScheibe', 'bildScheibe', schluesselZeichnen], ['#gsErpMisch', 'erpMisch', zeichnen], ['#gsAnlautMisch', 'anlautMisch', alles], ['#gsNotenBS', 'notenBS', alles], ['#gsNotenAudio', 'notenAudio', zeichnen], ['#gsMitLoesung', 'mitLoesung'], ['#gsMitSchluessel', 'mitSchluessel']].forEach(function(c){
    $(c[0]).checked = !!st.opt[c[1]];
    $(c[0]).addEventListener('change', function(){ st.opt[c[1]] = this.checked; speichern(); if (c[2]) c[2](); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); schluesselZeichnen(); });
  function vorschauen(){
    [].forEach.call(bereich.querySelectorAll('.gs-vorschau-platz'), function(p){ p.innerHTML = vorschauHtml(p.dataset.art); });
    [].forEach.call(bereich.querySelectorAll('.gs-scheiben-vorschau'), function(p){ p.innerHTML = vorschauHtml(p.dataset.art); });
  }

  /* ---------- Geheimtext ---------- */
  function px(){ return (GROESSEN.filter(function(g){ return g[0] === st.opt.groesse; })[0] || GROESSEN[1])[2]; }
  function codeHtml(){
    // Vögel: alle Zellen ohne Abstand, dazwischen Draht – ein durchgehender Draht pro Zeile · Erpresserschrift: nur die geklebten Buchstaben, ohne Linien
    var voegel = st.opt.art === 'voegel', ohneLinie = st.opt.art === 'erpresser', noten = st.opt.art === 'noten';
    // Notenschrift: jedes Wort ein eigenes Notensystem mit Violinschlüssel vorne und Schlussstrich hinten
    function rand(svg){ return '<span class="gs-z gs-andere gs-noten-rand"><span class="gs-s">' + svg + '</span><span class="gs-linie gs-leer"></span></span>'; }
    var luecke = '<span class="gs-z gs-andere"><span class="gs-s">' + drahtSvg('') + '</span><span class="gs-linie gs-leer"></span></span>';
    return '<div class="gs-code gs-art-' + st.opt.art + (st.opt.art === 'spiegel' ? ' gs-sp-art-' + (st.opt.spiegelArt || 'horizontal') : '') + (st.opt.art === 'segmente' && st.opt.segArt === 'ausmalen' ? ' gs-seg-ausmalen' : '') + (st.opt.linien ? '' : ' ohne-linien') + '" style="--fm:' + px() + 'px">' + zellen().map(function(zeile){
      return '<div class="gs-zeile">' + zeile.map(function(wort, k){
        return (voegel && k ? luecke : '') + '<span class="gs-wort">' + (noten ? rand(violinSvg()) : '') + wort.map(function(c){
          if (c.code) return '<span class="gs-z"><span class="gs-s">' + symbolHtml(c.code) + '</span>' + (ohneLinie ? '' : '<span class="gs-linie"><b class="gs-loes">' + esc(c.b) + '</b></span>') + '</span>';
          if (voegel) return '<span class="gs-z gs-andere"><span class="gs-s">' + drahtSvg(c.b) + '</span><span class="gs-linie gs-leer"></span></span>';
          return '<span class="gs-z gs-andere"><span class="gs-s"><span class="gs-t gs-bleibt">' + esc(c.b) + '</span></span>' + (ohneLinie ? '' : '<span class="gs-linie gs-leer"></span>') + '</span>';
        }).join('') + (noten ? rand(taktendeSvg()) : '') + '</span>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function zeichnen(){
    var o = st.opt, leer = !hatZeichen();
    $('#gsCaesar').hidden = o.art !== 'caesar';
    $('#gsSegment').hidden = o.art !== 'segmente';
    $('#gsSpiegel').hidden = o.art !== 'spiegel';
    $('#gsBinaer').hidden = o.art !== 'binaer';
    $('#gsHalb').hidden = o.art !== 'halb';
    $('#gsAnlaut').hidden = o.art !== 'anlaut';
    $('#gsScheibenWahl').hidden = o.wahl !== 'scheibe';
    // Menüs nacheinander: Text erst nach der Wahl der Schrift, Blatt erst mit Text
    var bild = o.art === 'emojis' || o.art === 'farben', themaFehlt = o.art === 'emojis' && !Kern.EMOJI_THEMEN[o.emojiThema];
    $('#gsBild').hidden = !bild; $('#gsEmojiThemen').hidden = o.art !== 'emojis'; $('#gsBildMehr').hidden = themaFehlt;
    $('#gsTextKarte').hidden = !o.art || themaFehlt;
    $('#gsBlattKarte').hidden = !o.art || themaFehlt || !st.text.trim();
    $('#gsNotenText').hidden = $('#gsNotenBlatt').hidden = o.art !== 'noten';
    $('#gsTeilText').hidden = !o.art;
    bereich.querySelector('.gs-teil-schluessel').hidden = !o.art;
    $('#gsErpresser').hidden = o.art !== 'erpresser';
    $('#gsNoten').hidden = o.art !== 'noten';
    var melodie = o.art === 'noten' ? notenMelodie() : [];
    $('#gsNotenSeiteZeile').hidden = !melodie.length; $('#gsNotenSeite').href = melodie.length ? hoerUrl() : '#';
    $('#gsNotenSpielen').disabled = !melodie.length;
    $('#gsQrGroesseFeld').hidden = !(o.art === 'noten' && o.notenAudio); $('#gsQrGroesseWert').textContent = o.qrCm + ' cm';
    bereich.querySelector('.gs').classList.toggle('gs-nur-qr', o.art === 'noten' && !!o.notenAudio);
    // Notenschrift: Wörter mit anderen Buchstaben gehen nicht – sagen, welche und warum
    var nichtNoten = o.art === 'noten' ? Kern.notenFalsch(st.text, o.notenBS) : [];
    var tonnamen = o.notenBS && Labor.sprache === 'de' ? tx('C, D, E, F, G, A, H, B und S') : tx('C, D, E, F, G, A und H');
    [].forEach.call(bereich.querySelectorAll('.gs-wortchip.gs-bs'), function(k){ k.hidden = !o.notenBS; });
    $('#gsNotenHinweis').textContent = tx('Antippen fügt das Wort in den Text ein. Eigene Wörter gehen auch – wenn sie nur aus {t} bestehen.', { t:tonnamen });
    var notenWarnung = nichtNoten.length ? '<p>' + (nichtNoten.length === 1 ? tx('{b} und fehlt auf dem Blatt: {w}.', { b:'<b>' + tx('Dieses Wort kann nicht mit Noten geschrieben werden') + '</b>', w:'«' + esc(nichtNoten[0].wort) + '» (' + esc(nichtNoten[0].falsch) + ')' })
      : tx('{b} und fehlen auf dem Blatt: {w}.', { b:'<b>' + tx('Diese Wörter können nicht mit Noten geschrieben werden') + '</b>', w:nichtNoten.map(function(x){ return '«' + esc(x.wort) + '» (' + esc(x.falsch) + ')'; }).join(', ') })) + ' ' + tx('Es gibt nur die Töne {t}.', { t:tonnamen }) + '</p>' : '';
    var erp = o.art === 'erpresser';   // keine Geheimschrift: ohne Linien, Lösung und Schlüssel – nur die Nachricht zum Drucken oder Kopieren
    bereich.querySelector('.gs').classList.toggle('gs-erpresser', erp);
    $('.gs-teil-titel').textContent = erp ? tx('Nachricht') : tx('Geheimtext');
    $('#gsTextHinweis').textContent = o.art === 'spiegel' ? tx('Gross- und Kleinbuchstaben, Umlaute, Ziffern und Satzzeichen bleiben, wie sie sind.') :
      o.art === 'roemisch' ? tx('Umlaute werden als AE, OE, UE geschrieben, ß als SS. Ziffern 1–9 werden auch römisch, die Null bleibt; Satzzeichen bleiben stehen.') :
      o.art === 'halb' ? tx('Alles in Grossbuchstaben; Umlaute werden als AE, OE, UE geschrieben, ß als SS. Ziffern werden auch halbiert, Satzzeichen bleiben stehen.') : o.art === 'noten' ? tx('Nur Wörter aus den Buchstaben {t} – den Namen der Töne. Andere Wörter werden weggelassen; Satzzeichen bleiben stehen.', { t:tonnamen }) : o.art === 'erpresser' ? tx('Buchstaben (auch Ä, Ö, Ü und ß), Ziffern, ! und ? werden ausgeschnitten; andere Satzzeichen bleiben stehen.') : o.art === 'finger' ? tx('Ä, Ö, Ü, CH und SCH haben eigene Handzeichen; ß wird als SS geschrieben. Ziffern und Satzzeichen bleiben stehen.') : o.art === 'segmente' ? tx('Umlaute werden als AE, OE, UE geschrieben, ß als SS. Ziffern haben eigene Zeichen; Satzzeichen bleiben stehen.') : Kern.UMLAUTE[o.art] ? tx('Ä, Ö, Ü und ß haben in dieser Schrift eigene Zeichen') + (o.art === 'morse' ? tx('; Ziffern und einige Satzzeichen auch.') : tx('; Ziffern bekommen das Zahlzeichen.')) :
      tx('Umlaute werden als AE, OE, UE geschrieben, ß als SS.') + (o.art === 'polybios' ? tx(' J wird wie I geschrieben.') : '') + tx(' Ziffern und Satzzeichen bleiben stehen.') +
      (o.art === 'anlaut' ? ' ' + tx('Buchstaben ohne passendes Emoji (wie X) bleiben auch stehen.') : '');
    if (!o.art || themaFehlt){
      $('#gsBlatt').innerHTML = $('#gsLoesung').innerHTML = '';
      $('#gsTeilText').hidden = true;
      meldung('info', themaFehlt ? tx('<p>Wähle links ein Emoji-Thema. Danach schreibst du den Text.</p>')
        : o.wahl === 'scheibe' ? tx('<p>Wähle links, welche Scheibe: Buchstaben, Emojis oder Regenbogen-Farben. Danach schreibst du den Text.</p>')
        : tx('<p>Wähle links zuerst eine Geheimschrift. Danach schreibst du den Text.</p>'));
      return;
    }
    $('#gsBlatt').hidden = $('#gsLoesung').hidden = leer;
    ['#gsZeigeLoesung', '#gsCodeBild', '#gsPdf', '#gsHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    $('#gsTipp').hidden = leer;
    if (leer){
      $('#gsBlatt').innerHTML = $('#gsLoesung').innerHTML = '';
      if (notenWarnung){ meldung('warnung', notenWarnung + tx('<p>Tipp: Unter «Notenschrift» stehen Wörter, die gehen.</p>')); return; }
      meldung('info', o.art === 'erpresser' ? tx('<p>Schreibe links einen Text – er erscheint hier in der Erpresserschrift.</p>') : tx('<p>Schreibe links einen Text – er erscheint hier in der Geheimschrift. Den Schlüssel unten kannst du schon jetzt herunterladen.</p>'));
      return;
    }
    meldung(notenWarnung ? 'warnung' : '', notenWarnung);
    if (erp){
      $('#gsBlatt').innerHTML = (o.titelAn && st.titel.trim() ? '<h2>' + esc(st.titel.trim()) + '</h2>' : '') + codeHtml();
      $('#gsLoesung').innerHTML = '';
      $('#gsBlatt').classList.remove('zeige-loesung');
      var c0 = $('#gsBlatt .gs-code');
      c0.setAttribute('role', 'button'); c0.setAttribute('tabindex', '0'); c0.title = tx('Klicken: als Bild kopieren (zum Einfügen in Word)');
      c0.setAttribute('aria-label', tx('Nachricht in Erpresserschrift – klicken, um sie als Bild zu kopieren'));
      return;
    }
    var name = schriftName(o.art, o);
    var anleitung = o.art === 'segmente' && o.segArt === 'ausmalen' ? (o.linien ? tx('Male in jeder Anzeige die genannten Segmente an und lies den Buchstaben ab. Schreibe ihn auf die Linie. Der Schlüssel zeigt, wo welches Segment liegt.')
        : tx('Male in jeder Anzeige die genannten Segmente an und lies den Buchstaben ab. Der Schlüssel zeigt, wo welches Segment liegt.'))
      : o.linien ? tx('Entschlüssle die Geheimschrift ({n}) mit dem Schlüssel und schreibe die Buchstaben auf die Linien.', { n:esc(name) }) : tx('Entschlüssle die Geheimschrift ({n}) mit dem Schlüssel.', { n:esc(name) });
    // Notenschrift mit Audio: auf dem Blatt nur der QR-Code (Grösse in cm) und Schreiblinien je Wort; die Noten stehen im Lösungsblatt
    var mitTon = o.art === 'noten' && o.notenAudio;
    if (mitTon){
      anleitung = tx('Scanne den QR-Code mit dem Tablet oder Handy. Dort hörst du die Töne der Geheimbotschaft. Vergleiche jeden Ton mit dem Tonalphabet – klingen zwei Töne gleich, hast du den Buchstaben.') +
        (o.linien ? tx(' Schreibe die Buchstaben auf die Linien.') : '');
      var woerter = []; zellen().forEach(function(z){ z.forEach(function(w){ var b = w.filter(function(c){ return c.code && c.code.note; }).map(function(c){ return c.b; }); if (b.length) woerter.push(b); }); });
      var qrPx = o.qrCm * 10 * 703 / 186;   // echte Grösse: 703 px = 186 mm
      $('#gsBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') + (o.anleitungAn ? '<p class="gs-anleitung">' + anleitung + '</p>' : '') +
        '<div class="gs-code gs-qr-code"><div class="gs-qr-gross" style="width:' + qrPx.toFixed(1) + 'px">' + qrSvg(hoerUrl()) + '</div></div>' +
        (o.linien ? '<div class="gs-hoer-linien">' + woerter.map(function(w, i){ return '<span class="gs-hoer-wort"><small>' + tx('Wort {i}', { i:i + 1 }) + '</small><span>' +
          w.map(function(b){ return '<span class="gs-linie"><b class="gs-loes">' + esc(b) + '</b></span>'; }).join('') + '</span></span>'; }).join('') + '</div>' : '');
    } else
    $('#gsBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="gs-anleitung">' + anleitung + '</p>' : '') + codeHtml();
    $('#gsLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' ' + tx('– Lösung') + '</h2>' : tx('<p class="gs-anleitung"><b>Lösung</b></p>')) + codeHtml();
    $('#gsBlatt').classList.toggle('zeige-loesung', $('#gsZeigeLoesung').getAttribute('aria-pressed') === 'true');
    var code = $('#gsBlatt .gs-code');
    code.setAttribute('role', 'button'); code.setAttribute('tabindex', '0'); code.title = tx('Klicken: als Bild kopieren (zum Einfügen in Word)');
    code.setAttribute('aria-label', mitTon ? tx('QR-Code – klicken, um ihn als Bild zu kopieren') : tx('Geheimtext – klicken, um ihn als Bild zu kopieren'));
    var b = $('#gsBlatt');
    if (b.offsetWidth && b.scrollHeight / b.offsetWidth > 1.5) meldung('warnung', tx('<p>Der Text ist lang für eine A4-Seite – im PDF wird das Blatt verkleinert. Wähle kleinere Zeichen oder kürze den Text.</p>'));
  }
  $('#gsZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#gsBlatt').classList.toggle('zeige-loesung', an);
  });

  /* ---------- Schlüssel ---------- */
  function schluesselZeichnen(){
    var o = st.opt;
    if (!o.art){ $('#gsSchluessel').innerHTML = ''; return; }
    $('#gsSchluessel').innerHTML = (o.titelAn ? '<h2>' + tx('Schlüssel: {s}', { s:esc(schriftName(o.art, o)) }) + '</h2>' : '') + '<div class="gs-art-' + o.art + '">' + schluesselHtml(o.art, o) + '</div>';
  }
  function alles(){ zeichnen(); schluesselZeichnen(); }

  /* ---------- PDF, Bild, Herunterladen ---------- */
  function dateiName(art, endung){ return Labor.pdfName(art, st.titel).replace(/\.pdf$/, '.' + endung); }
  function codeBlaetter(){ if (st.opt.art === 'erpresser') return [$('#gsBlatt')];
    if (st.opt.art === 'noten' && st.opt.notenAudio) return [$('#gsBlatt'), st.opt.mitLoesung && $('#gsLoesung')].filter(Boolean);   // QR-Blatt und Lösung, ohne Schlüssel
    return [$('#gsBlatt'), st.opt.mitSchluessel && $('#gsSchluessel'), st.opt.mitLoesung && $('#gsLoesung')].filter(Boolean); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung && st.opt.art !== 'erpresser'); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#gsPdf'), function(){ return hatZeichen() && { blaetter:codeBlaetter(), name:dateiName(tx('Geheimschrift'), 'pdf') }; }, fehler);
  Labor.pdfKnopf($('#gsSchluesselPdf'), function(){ return { blaetter:[$('#gsSchluessel')], name:tx('Schluessel-') + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || tx('Geheimschrift')) + '.pdf' }; }, fehler);
  Labor.bildKnopf($('#gsCodeBild'), function(){ return hatZeichen() && { blatt:$('#gsBlatt'), name:dateiName(tx('Geheimschrift'), 'png') }; }, fehler);
  Labor.bildKnopf($('#gsSchluesselBild'), function(){ return { blatt:$('#gsSchluessel'), name:tx('Schluessel-') + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || tx('Geheimschrift')) + '.png' }; }, fehler);
  /* ---------- Als Bild kopieren (zum Einfügen in Word) ---------- */
  var kopiertZeit = 0;
  function bestaetigen(text){
    var k = $('#gsKopiert'); k.textContent = text; k.hidden = false; k.classList.add('an');
    clearTimeout(kopiertZeit); kopiertZeit = setTimeout(function(){ k.classList.remove('an'); setTimeout(function(){ k.hidden = true; }, 300); }, 2600);
  }
  function kopieren(el, was, knopf, eng){
    if (!el) return;
    var text = knopf && knopf.textContent;
    if (knopf){ knopf.disabled = true; knopf.textContent = tx('Wird kopiert …'); }
    el.classList.add('gs-wird-kopiert');
    Labor.bildKopieren(el, eng ? { eng:'.gs-z' } : {}).then(function(){
      bestaetigen('✓ ' + tx('{w} als Bild kopiert – in Word mit Ctrl+V (Mac: Cmd+V) einfügen.', { w:was }));
    }, function(e){
      meldung('warnung', '<p>' + tx('Das Kopieren hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '. ' + tx('Lade das Bild mit «Als Bild» herunter und füge es in Word ein.') + '</p>');
    }).then(function(){ el.classList.remove('gs-wird-kopiert'); if (knopf){ knopf.disabled = false; knopf.textContent = text; } });
  }
  $('#gsBlatt').addEventListener('click', function(ev){ var c = ev.target.closest('.gs-code'); if (c) kopieren(c, tx('Geheimtext'), null, true); });
  $('#gsBlatt').addEventListener('keydown', function(ev){ var c = ev.target.closest('.gs-code'); if (c && (ev.key === 'Enter' || ev.key === ' ')){ ev.preventDefault(); kopieren(c, tx('Geheimtext'), null, true); } });

  var speicherOrt = null;
  if (Labor.imArtefakt()){
    ['#gsPdf', '#gsSchluesselPdf', '#gsCodeBild', '#gsSchluesselBild'].forEach(function(s){ $(s).hidden = true; });
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#gsHerunterladen').hidden = $('#gsSchluesselHerunterladen').hidden = false; });
  }
  function htmlSpeichern(blaetter, name){
    if (!speicherOrt) return;
    var inhalt = blaetter.map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    if (st.opt.art === 'erpresser') inhalt = '<link rel="stylesheet" href="' + ERP_CSS + '">' + inhalt;   // Schriften der Schnipsel
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.gs-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>' + tx('Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  }
  $('#gsHerunterladen').addEventListener('click', function(){ if (hatZeichen()) htmlSpeichern(codeBlaetter(), dateiName(tx('Geheimschrift'), 'html')); });
  $('#gsSchluesselHerunterladen').addEventListener('click', function(){ htmlSpeichern([$('#gsSchluessel')], tx('Schluessel-') + (Labor.dateiname(schriftName(st.opt.art, st.opt)) || tx('Geheimschrift')) + '.html'); });

  if (!document.getElementById('gsErpSchriften')){ var l = document.createElement('link'); l.id = 'gsErpSchriften'; l.rel = 'stylesheet'; l.href = ERP_CSS; document.head.appendChild(l); }
  vorschauen(); alles(); listeZu(true);
  hieroLaden();
  if (document.fonts && document.fonts.load) document.fonts.load('700 20px Andika').then(function(){ if (!aus) schluesselZeichnen(); }, function(){});
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
