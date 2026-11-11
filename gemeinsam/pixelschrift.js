/* Rätsellabor – Baustein «Pixelschrift»: Ziffern 0–9 und Buchstaben A–Z als Blockschrift aus 3 × 5 Feldern
   (eigene Zeichnung). Genutzt von «Überlappende Folien» und «Schiebefenster».
   Ziffern sind eckig, Buchstaben, die leicht mit einer Ziffer zu verwechseln wären, anders gezeichnet:
   O rund (0 eckig), S schräg (5 eckig), Z schräg (2 eckig), B mit Kerben (8 voll), I mit Querstrichen (1 mit Fahne).
   maske(c) → 15 Werte 0/1, Zeile für Zeile von oben links; schluessel(maske) → Text aus 0/1, um Masken zu vergleichen. */
(function(){
'use strict';
var ZEICHEN = {
  0:['###', '#.#', '#.#', '#.#', '###'], 1:['.#.', '##.', '.#.', '.#.', '###'], 2:['###', '..#', '###', '#..', '###'],
  3:['###', '..#', '###', '..#', '###'], 4:['#.#', '#.#', '###', '..#', '..#'], 5:['###', '#..', '###', '..#', '###'],
  6:['###', '#..', '###', '#.#', '###'], 7:['###', '..#', '..#', '..#', '..#'], 8:['###', '#.#', '###', '#.#', '###'],
  9:['###', '#.#', '###', '..#', '###'],
  A:['###', '#.#', '###', '#.#', '#.#'], B:['##.', '#.#', '##.', '#.#', '##.'], C:['###', '#..', '#..', '#..', '###'],
  D:['##.', '#.#', '#.#', '#.#', '##.'], E:['###', '#..', '###', '#..', '###'], F:['###', '#..', '###', '#..', '#..'],
  G:['###', '#..', '#.#', '#.#', '.##'], H:['#.#', '#.#', '###', '#.#', '#.#'], I:['###', '.#.', '.#.', '.#.', '###'],
  J:['..#', '..#', '..#', '#.#', '###'], K:['#.#', '#.#', '##.', '#.#', '#.#'], L:['#..', '#..', '#..', '#..', '###'],
  M:['#.#', '###', '###', '#.#', '#.#'], N:['###', '#.#', '#.#', '#.#', '#.#'], O:['.#.', '#.#', '#.#', '#.#', '.#.'],
  P:['###', '#.#', '###', '#..', '#..'], Q:['###', '#.#', '#.#', '##.', '..#'], R:['###', '#.#', '##.', '#.#', '#.#'],
  S:['.##', '#..', '.#.', '..#', '##.'], T:['###', '.#.', '.#.', '.#.', '.#.'], U:['#.#', '#.#', '#.#', '#.#', '###'],
  V:['#.#', '#.#', '#.#', '#.#', '.#.'], W:['#.#', '#.#', '###', '###', '#.#'], X:['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y:['#.#', '#.#', '.#.', '.#.', '.#.'], Z:['###', '..#', '.#.', '#..', '###']
};
var B = 3, H = 5;
function maske(c){ var z = ZEICHEN[c]; if (!z) return null; var m = []; z.forEach(function(zeile){ for (var i = 0; i < B; i++) m.push(zeile.charAt(i) === '#' ? 1 : 0); }); return m; }
function schluessel(m){ return m.join(''); }
// alle Zeichen nach Schlüssel – um zu prüfen, ob ein Muster ein Zeichen ergibt
var NACH_MUSTER = {};
Object.keys(ZEICHEN).forEach(function(c){ NACH_MUSTER[schluessel(maske(c))] = c; });
function zeichenVon(m){ return NACH_MUSTER[schluessel(m)] || null; }
/* Eingabe → Zeichen der Schrift: Grossbuchstaben (Ä → AE, Ö → OE, Ü → UE, ß → SS), Ziffern; anderes fällt weg (Leerzeichen
   auch). → { zeichen:[…], weg:[nicht darstellbare Zeichen] } */
function lesen(text, max){
  var t = String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS');
  var z = [], weg = [];
  Array.from(t).forEach(function(c){ if (ZEICHEN[c]) z.push(c); else if (/\S/.test(c) && weg.indexOf(c) < 0) weg.push(c); });
  return { zeichen:max ? z.slice(0, max) : z, weg:weg, zuViele:max ? Math.max(0, z.length - max) : 0 };
}
// sehen gleich oder fast gleich aus – Hinweis, wenn beide im Code vorkommen
var AEHNLICH = [['0', 'O'], ['0', 'D'], ['5', 'S'], ['2', 'Z'], ['8', 'B'], ['1', 'I'], ['6', 'G']];
window.Pixelschrift = { ZEICHEN:ZEICHEN, BREITE:B, HOEHE:H, maske:maske, schluessel:schluessel, zeichenVon:zeichenVon, lesen:lesen, AEHNLICH:AEHNLICH };
})();
