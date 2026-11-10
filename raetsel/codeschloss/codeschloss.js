/* Rätsellabor – Generator «Code-Schloss»
   Ein Feld mit Buchstaben und Emojis. Daneben kleine Kästchen (2 × 2 Felder, 3 × 3 Punkte): An einem Punkt sitzt ein
   Emoji, an einem anderen das Schloss 🔐. Man sucht das Emoji im Feld und geht von dort genau so weit wie im Kästchen
   vom Emoji zum Schloss – dort steht ein Buchstabe. Die Emojis eines Themas haben verschiedene Farben (rot, orange,
   gelb, grün, blau, violett); die Farbpunkte beim Code geben die Reihenfolge der Buchstaben an. So entsteht der Code
   fürs Zahlenschloss. Arbeitsblatt, Lösungsblatt, PDF; am Bildschirm lässt sich der Code eintippen. */
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
  // Farben in Regenbogen-Reihenfolge: Sie bestimmen die Reihenfolge der Buchstaben im Code
  var REIHE = ['rot', 'orange', 'gelb', 'gruen', 'blau', 'violett'];
  var FARBE = { rot:'#E53935', orange:'#F57C00', gelb:'#FBC02D', gruen:'#7CB342', blau:'#1E88E5', violett:'#8E24AA' };
  /* Themen: je Farbe ein Emoji, das auf allen Geräten (Apple, Google, Microsoft) deutlich diese Farbe hat; dazu andere
     Emojis desselben Themas für die übrigen Felder (nie eines der Ziel-Emojis – jedes Ziel-Emoji steht genau einmal im Feld). */
  var THEMEN = [
    { id:'fruechte', name:'Früchte', ziel:{ rot:'🍓', orange:'🍊', gelb:'🍋', gruen:'🍏', blau:'🫐', violett:'🍇' }, andere:'🍌 🥝 🍈 🍉 🍍 🥭 🍑 🍒 🍐 🍎 🥥' },
    { id:'gemuese', name:'Gemüse', ziel:{ rot:'🍅', orange:'🥕', gelb:'🌽', gruen:'🥦', violett:'🍆' }, andere:'🥔 🧅 🧄 🥒 🥬 🍄 🌶️ 🥑 🥜 🌰' },
    { id:'tiere', name:'Tiere', ziel:{ rot:'🐞', orange:'🦊', gelb:'🐥', gruen:'🐸', blau:'🐳' }, andere:'🐶 🐱 🐭 🐰 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐵 🐧 🐢 🐌 🦔' },
    { id:'buecher', name:'Bücher', ziel:{ rot:'📕', orange:'📙', gelb:'📒', gruen:'📗', blau:'📘' }, andere:'📚 📓 📔 📖 ✏️ 📏 ✂️ 📎 🖍️ 🎒 📐' },
    { id:'herzen', name:'Herzen', ziel:{ rot:'❤️', orange:'🧡', gelb:'💛', gruen:'💚', blau:'💙', violett:'💜' }, andere:'🤍 🖤 🤎 💖 💗 💕 💝 💞' },
    { id:'formen', name:'Formen', ziel:{ rot:'🔴', orange:'🟠', gelb:'🟡', gruen:'🟢', blau:'🔵', violett:'🟣' }, andere:'⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🔺 🔷 ⭐' }
  ];
  var WOERTER = ['ZOO', 'OHR', 'UHR', 'BAUM', 'HAUS', 'MOND', 'BALL', 'BASEL', 'APFEL', 'TIGER', 'BLUME', 'SONNE', 'STERN', 'PIRAT', 'SCHULE', 'FREUND', 'ZAUBER', 'DRACHE'];
  function thema(id){ for (var i = 0; i < THEMEN.length; i++) if (THEMEN[i].id === id) return THEMEN[i]; return THEMEN[0]; }
  function farbenVon(id){ var T = thema(id); return REIHE.filter(function(f){ return T.ziel[f]; }); }
  // Eingabe → Code: Grossbuchstaben (auch Ä, Ö, Ü) und Ziffern; alles andere fällt weg
  function code(text){ return String(text || '').replace(/ß/g, 'SS').toUpperCase().replace(/[^0-9A-ZÄÖÜ]/g, '').split(''); }
  function zufallsWort(rnd, max, ausser){ var l = WOERTER.filter(function(w){ return w.length >= 3 && w.length <= max && w !== ausser; }); return l[Math.floor(rnd() * l.length)]; }
  // Punkte am Rand eines Kästchens mit gr × gr Feldern (Ecken und Randpunkte), [x, y] von 0 bis gr, y nach unten
  function punkte(gr){ var l = []; for (var y = 0; y <= gr; y++) for (var x = 0; x <= gr; x++) if (!x || !y || x === gr || y === gr) l.push([x, y]); return l; }
  var PUNKTE = punkte(2);

  /* Satz im Feld: Liest man die Buchstaben Zeile für Zeile (ohne Emojis), ergeben sie den Satz. Der Code muss sich aus
     seinen Buchstaben legen lassen, und für die Emojis braucht es mindestens so viele Felder, wie der Code Zeichen hat.
     → { L (Buchstaben im Satz), maxL (höchstens im Feld), fehlt:[{ c, hat, braucht }] } */
  function satzPruefen(satz, codeZ, n){
    var hat = {}, braucht = {};
    satz.forEach(function(c){ hat[c] = (hat[c] || 0) + 1; });
    codeZ.forEach(function(c){ braucht[c] = (braucht[c] || 0) + 1; });
    var fehlt = Object.keys(braucht).filter(function(c){ return (hat[c] || 0) < braucht[c]; }).map(function(c){ return { c:c, hat:hat[c] || 0, braucht:braucht[c] }; });
    return { L:satz.length, maxL:n * n - codeZ.length, fehlt:fehlt };
  }
  var SAETZE = ['Basel liegt am Rhein', 'Heute lösen wir ein Rätsel', 'Das Schloss ist bald offen', 'Alle Kinder lieben Rätsel', 'Die Sonne scheint warm',
    'Im Garten blühen Blumen', 'Der Tiger schläft im Zoo', 'Wir suchen den geheimen Code', 'Ein Apfel fällt vom Baum', 'Der Pirat findet einen Schatz',
    'Mein Freund hat einen Hund', 'Die Schule beginnt um acht', 'Der Mond scheint hell', 'Im Haus brennt Licht'];
  /* Sätze zum Thema der Wörter, die «Andere» vorschlägt: Jeder enthält alle Buchstaben des Worts (so oft, wie es sie
     braucht), aber nicht das Wort selbst, und hat höchstens 30 Buchstaben (geprüft). Für andere Wörter fragt die Seite die KI. */
  var THEMA = {
    ZOO:['Zebras und Robben wohnen dort', 'Zwei Robben spielen und toben', 'Zebras grasen, Affen toben froh'],
    OHR:['Wir horchen auf jedes Geräusch', 'Leise Worte hört man schlecht', 'Hörst du das Rauschen vom Bach'],
    UHR:['Der Zeiger dreht sich rundherum', 'Die Stunden gehen schnell vorbei', 'Der Wecker klingelt um halb acht'],
    BAUM:['Im Wald wachsen hohe Buchen', 'Die Blätter fallen im Herbst um', 'Vögel bauen Nester im Ast'],
    HAUS:['Unsere Wohnung hat einen Balkon', 'Das Dach schützt uns vor Regen', 'Hinter der Tür wartet unser Hund'],
    MOND:['Nachts kommen die Sterne hervor', 'Die Nacht kommt, es wird dunkel', 'Hoch oben am dunklen Himmel'],
    BALL:['Alle laufen zum Tor und jubeln', 'Beim Spielen rollt alles schnell', 'Lea wirft, Ben fängt alles'],
    BASEL:['Die Fasnacht ist bunt und laut', 'Im Zolli sieht man Bären und Affen', 'Bunte Laternen und schräge Musik'],
    APFEL:['Pflaumen schmecken sehr fein', 'Wir pflücken Pflaumen im Garten', 'Im Herbst pflücken alle Obst'],
    TIGER:['Die grosse Katze hat Streifen', 'Im Dschungel jagt eine Raubkatze', 'Gestreift schleicht er durchs Gras'],
    BLUME:['Im Frühling blüht der Garten bunt', 'Die Rose duftet herrlich im Beet', 'Bunte Tulpen wachsen im Mai'],
    SONNE:['Die Strahlen wärmen den Sommertag', 'Im Sommer baden wir gern am See', 'Am Morgen wird es hell und schön'],
    STERN:['In der Nacht funkelt es oben', 'Nachts glitzert es am Himmel', 'Sie leuchten hell in der Nacht'],
    PIRAT:['Der Kapitän sucht einen Schatz', 'Ein Papagei sitzt auf der Schulter', 'Mit Augenklappe segelt er los, Ahoi'],
    SCHULE:['Wir lernen lesen und schreiben', 'In der Pause rechnen alle zusammen', 'Im Unterricht lesen wir viel'],
    FREUND:['Wir helfen uns und teilen gerne', 'Zusammen lachen macht Freude', 'Du hilfst mir immer gern'],
    ZAUBER:['Zwei Tauben flattern aus dem Hut', 'Bravo, der Hase kommt zurück'],
    DRACHE:['Rauch steigt aus der Höhle', 'Feuer und Rauch kommen aus dem Maul', 'Ein Ritter wacht auf der Burg']
  };
  // passt der Satz zum Code? (Buchstaben reichen, passt ins Feld, enthält das Codewort nicht – sonst verriete das Feld die Lösung)
  function satzPasst(t, codeZ, n){ var z = code(t), p = satzPruefen(z, codeZ, n); return !p.fehlt.length && p.L <= p.maxL && p.L >= 8 && z.join('').indexOf(codeZ.join('')) < 0; }
  function themenSaetze(codeZ, n){ return (THEMA[codeZ.join('')] || []).filter(function(t){ return satzPasst(t, codeZ, n); }); }
  // ein Satz, aus dem sich der Code legen lässt und der ins Feld passt – zuerst zum Thema, sonst irgendeiner (sonst null)
  function satzVorschlag(codeZ, n, rnd, ausser){
    var l = themenSaetze(codeZ, n).filter(function(t){ return t !== ausser; });
    if (!l.length) l = SAETZE.filter(function(t){ var p = satzPruefen(code(t), codeZ, n); return !p.fehlt.length && p.L <= p.maxL && t !== ausser; });
    return l.length ? l[Math.floor(rnd() * l.length)] : null;
  }

  /* Rätsel planen. o: { code:[…], thema, n (Feld n × n), kaestchen (2, 3 oder 4: Kästchen mit so vielen Feldern je Seite),
     satz (auf Wunsch: Buchstaben, die im Feld der Reihe nach stehen sollen), seed }
     → { n, gr (Kästchengrösse), zellen:[{ typ:'e'|'b', t, ziel }] (Zeile für Zeile), ziele:[{ farbe, emoji, c, e:[x, y], l:[x, y], p, q }],
         reihe (Reihenfolge der Kästchen auf dem Blatt) } – oder null, wenn es nicht aufgeht.
     Für jedes Zeichen: ein Paar Punkte p (Emoji) → q (Schloss) im Kästchen; das Emoji kommt an eine freie Stelle e im
     Feld, das Zeichen genau um (q − p) daneben. Die Hälfte der übrigen Felder bekommt andere Emojis, der Rest Buchstaben.
     Bei Kästchen ab 3 × 3 liegen Emoji und Schloss nie direkt nebeneinander (die Symbole würden sich überdecken). */
  function planen(o){
    var rnd = zufall(o.seed), T = thema(o.thema), farben = farbenVon(o.thema), k = o.code.length, n = o.n, ziele = null;
    var gr = [2, 3, 4].indexOf(+o.kaestchen) >= 0 ? +o.kaestchen : 2, pkt = punkte(gr), paare = [];
    pkt.forEach(function(p){ pkt.forEach(function(q){
      if (p !== q && (gr === 2 || Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) >= 2)) paare.push([p, q]);
    }); });
    if (o.satz && o.satz.length) return mitSatz(o, rnd, T, farben, paare, gr);
    for (var versuch = 0; versuch < 200 && !ziele; versuch++){
      var belegt = {}, liste = [];
      for (var i = 0; i < k; i++){
        var gefunden = false;
        for (var t = 0; t < 400 && !gefunden; t++){
          var pq = paare[Math.floor(rnd() * paare.length)], dx = pq[1][0] - pq[0][0], dy = pq[1][1] - pq[0][1];
          var ex = Math.floor(rnd() * n), ey = Math.floor(rnd() * n), lx = ex + dx, ly = ey + dy;
          if (lx < 0 || ly < 0 || lx >= n || ly >= n || belegt[ex + ',' + ey] || belegt[lx + ',' + ly]) continue;
          // Abwechslung: möglichst jedes Kästchen mit einem anderen Weg
          if (t < 250 && liste.some(function(z){ return z.p[0] - z.q[0] === -dx && z.p[1] - z.q[1] === -dy; })) continue;
          belegt[ex + ',' + ey] = belegt[lx + ',' + ly] = true;
          liste.push({ farbe:farben[i], emoji:T.ziel[farben[i]], c:o.code[i], e:[ex, ey], l:[lx, ly], p:pq[0], q:pq[1] });
          gefunden = true;
        }
        if (!gefunden) break;
      }
      if (liste.length === k) ziele = liste;
    }
    if (!ziele) return null;
    var zellen = [];
    for (var j = 0; j < n * n; j++) zellen.push(null);
    ziele.forEach(function(z, i){
      zellen[z.e[1] * n + z.e[0]] = { typ:'e', t:z.emoji, ziel:i };
      zellen[z.l[1] * n + z.l[0]] = { typ:'b', t:z.c, ziel:i };
    });
    var frei = mischen(zellen.map(function(z, i){ return z ? -1 : i; }).filter(function(i){ return i >= 0; }), rnd);
    var anzahlEmoji = Math.max(0, Math.round(n * n / 2) - k), andere = mischen(T.andere.split(' '), rnd);
    var ziffern = o.code.every(function(c){ return /\d/.test(c); });
    var abc = (ziffern ? '0123456789' : 'ABCDEFGHIJKLMNOPRSTUVWZ').split('').concat(o.code, o.code);   // Code-Zeichen öfter – sie verraten nichts
    frei.forEach(function(pos, i){
      zellen[pos] = i < anzahlEmoji ? { typ:'e', t:andere[i % andere.length], ziel:-1 } : { typ:'b', t:abc[Math.floor(rnd() * abc.length)], ziel:-1 };
    });
    return { n:n, gr:gr, zellen:zellen, ziele:ziele, reihe:reihenfolge(k, rnd) };
  }
  function reihenfolge(k, rnd){   // Kästchen nicht in Code-Reihenfolge
    var reihe = [];
    for (var i = 0; i < k; i++) reihe.push(i);
    for (var m = 0; m < 20; m++){ mischen(reihe, rnd); if (k < 3 || reihe.some(function(x, i){ return x !== i; })) break; }
    return reihe;
  }
  /* Feld mit Satz: Zuerst werden die Emoji-Felder zufällig gewählt (so viele, wie nach dem Satz übrig sind); die übrigen
     Felder bekommen der Reihe nach die Buchstaben des Satzes. Dann sucht jedes Code-Zeichen einen Buchstaben im Satz, von
     dem aus ein Kästchen-Weg rückwärts auf ein freies Emoji-Feld führt. Geht das nicht auf, neue Emoji-Felder (bis 400-mal). */
  function mitSatz(o, rnd, T, farben, paare, gr){
    var n = o.n, k = o.code.length, L = o.satz.length, M = n * n - L;
    if (M < k) return null;
    var alle = [];
    for (var c = 0; c < n * n; c++) alle.push(c);
    for (var versuch = 0; versuch < 400; versuch++){
      var istE = {}, buchst = {}, b = 0, belegt = {}, liste = [];
      mischen(alle, rnd).slice(0, M).forEach(function(c){ istE[c] = true; });
      for (c = 0; c < n * n; c++) if (!istE[c]) buchst[c] = o.satz[b++];
      for (var i = 0; i < k; i++){
        var kand = [];
        Object.keys(buchst).forEach(function(cs){
          var l = +cs;
          if (buchst[l] !== o.code[i] || belegt[l]) return;
          paare.forEach(function(pq){
            var ex = l % n - (pq[1][0] - pq[0][0]), ey = Math.floor(l / n) - (pq[1][1] - pq[0][1]), e = ey * n + ex;
            if (ex >= 0 && ey >= 0 && ex < n && ey < n && istE[e] && !belegt[e]) kand.push({ pq:pq, l:l, e:e });
          });
        });
        if (!kand.length) break;
        // Abwechslung: möglichst ein Weg, den noch kein anderes Kästchen hat
        var neu = kand.filter(function(x){ return !liste.some(function(z){ return z.q[0] - z.p[0] === x.pq[1][0] - x.pq[0][0] && z.q[1] - z.p[1] === x.pq[1][1] - x.pq[0][1]; }); });
        var w = (neu.length ? neu : kand)[Math.floor(rnd() * (neu.length || kand.length))];
        belegt[w.l] = belegt[w.e] = true;
        liste.push({ farbe:farben[i], emoji:T.ziel[farben[i]], c:o.code[i], e:[w.e % n, Math.floor(w.e / n)], l:[w.l % n, Math.floor(w.l / n)], p:w.pq[0], q:w.pq[1] });
      }
      if (liste.length < k) continue;
      var andere = mischen(T.andere.split(' '), rnd), ai = 0, zellen = [];
      for (c = 0; c < n * n; c++){
        var ziel = -1;
        liste.forEach(function(z, j){ if (z.e[1] * n + z.e[0] === c || z.l[1] * n + z.l[0] === c) ziel = j; });
        zellen.push(istE[c] ? { typ:'e', t:ziel >= 0 ? liste[ziel].emoji : andere[ai++ % andere.length], ziel:ziel } : { typ:'b', t:buchst[c], ziel:ziel });
      }
      return { n:n, gr:gr, zellen:zellen, ziele:liste, reihe:reihenfolge(k, rnd), satz:true };
    }
    return null;
  }
  return { zufall:zufall, mischen:mischen, REIHE:REIHE, FARBE:FARBE, THEMEN:THEMEN, WOERTER:WOERTER, thema:thema, farbenVon:farbenVon,
    code:code, zufallsWort:zufallsWort, PUNKTE:PUNKTE, punkte:punkte, planen:planen, satzPruefen:satzPruefen, satzVorschlag:satzVorschlag, satzPasst:satzPasst, themenSaetze:themenSaetze, SAETZE:SAETZE, THEMA:THEMA };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', BLAU = '#1593D6';
var FELD = { 5:60, 6:52, 7:45 };   // Feldgrösse in Pixeln (je nach Anzahl Felder)
function esc(t){ return Labor.esc(t); }
function chips(name, liste){ return liste.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

/* ---------- Zeichnen ---------- */
// Feld mit Buchstaben und Emojis; Lösung: Ziel-Emojis mit Ring in ihrer Farbe, Ziel-Buchstaben gelb hinterlegt
function feldHtml(R, loesung){
  var Z = FELD[R.n] || 48;
  return '<div class="cs-feld" style="--z:' + Z + 'px;grid-template-columns:repeat(' + R.n + ',var(--z))">' + R.zellen.map(function(z){
    var ring = loesung && z.ziel >= 0, farbe = ring ? Kern.FARBE[R.ziele[z.ziel].farbe] : '';
    return z.typ === 'e'
      ? '<span class="cs-z cs-emoji' + (ring ? ' cs-start' : '') + '"' + (ring ? ' style="--ring:' + farbe + '"' : '') + '>' + z.t + '</span>'
      : '<span class="cs-z cs-buchstabe' + (ring ? ' cs-ziel' : '') + '">' + esc(z.t) + '</span>';
  }).join('') + '</div>';
}
/* Kästchen: gr × gr Felder (Feld u Pixel), am Punkt p das Emoji, am Punkt q das Schloss. Die Linien laufen unter den
   Symbolen durch; ein weisser Kreis hinter jedem Symbol lässt sie dort aus (wie Lücken). Lösung: Buchstabe beim Schloss.
   Grössere Kästchen haben kleinere Felder, damit sie gleich viel Platz brauchen. */
var KAESTCHEN = { 2:{ u:42, rand:30, sym:30 }, 3:{ u:32, rand:24, sym:25 }, 4:{ u:25, rand:24, sym:22 } };
function figurHtml(z, loesung, gr){
  var K = KAESTCHEN[gr] || KAESTCHEN[2], u = K.u, rand = K.rand, s = gr * u, g = s + 2 * rand, linien = '';
  function pos(p){ return 'left:' + (rand + p[0] * u) + 'px;top:' + (rand + p[1] * u) + 'px;font-size:' + K.sym + 'px'; }
  for (var i = 1; i < gr; i++) linien += 'M' + (rand + i * u) + ' ' + rand + 'V' + (rand + s) + 'M' + rand + ' ' + (rand + i * u) + 'H' + (rand + s);
  var svg = '<svg class="cs-linien" width="' + g + '" height="' + g + '" viewBox="0 0 ' + g + ' ' + g + '" aria-hidden="true"><g fill="none" stroke="' + TINTE + '" stroke-width="2" stroke-linecap="square">' +
    '<rect x="' + rand + '" y="' + rand + '" width="' + s + '" height="' + s + '"/><path d="' + linien + '"/></g></svg>';
  // Lösungsbuchstabe neben dem Schloss, zur Mitte des Kästchens hin
  var lx = Math.sign(gr / 2 - z.q[0]), ly = Math.sign(gr / 2 - z.q[1]), weg = Math.min(30, u * 0.8);
  var l = loesung ? '<span class="cs-figur-l" style="left:' + (rand + z.q[0] * u + lx * weg) + 'px;top:' + (rand + z.q[1] * u + ly * weg) + 'px">' + esc(z.c) + '</span>' : '';
  return '<div class="cs-figur" style="width:' + g + 'px;height:' + g + 'px">' + svg +
    '<span class="cs-sym" style="' + pos(z.p) + '">' + z.emoji + '</span><span class="cs-sym" style="' + pos(z.q) + '">🔐</span>' + l + '</div>';
}
// Zahlenschloss mit k Rädchen (gezeichnet); Lösung: der Code in den Rädchen
function schlossSvg(k, zeichen){
  var rb = 26, gap = 4, bw = k * rb + (k - 1) * gap + 28, bh = 74, w = bw + 8, sh = 52, h = sh + bh + 6, x0 = (w - bw) / 2;
  var t = '<svg class="cs-schloss" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
    '<path d="M' + (w / 2 - bw * 0.3) + ' ' + (sh + 4) + 'V' + (sh * 0.62) + 'a' + (bw * 0.3) + ' ' + (sh * 0.5) + ' 0 0 1 ' + (bw * 0.6) + ' 0V' + (sh + 4) + '" fill="none" stroke="#9AA0A6" stroke-width="9" stroke-linecap="round"/>' +
    '<rect x="' + x0 + '" y="' + sh + '" width="' + bw + '" height="' + bh + '" rx="16" fill="#26221F"/>';
  for (var i = 0; i < k; i++){
    var x = x0 + 14 + i * (rb + gap);
    t += '<rect x="' + x + '" y="' + (sh + 16) + '" width="' + rb + '" height="' + (bh - 32) + '" rx="4" fill="#EDEAE6"/>';
    if (zeichen) t += '<text x="' + (x + rb / 2) + '" y="' + (sh + bh / 2) + '" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="700" fill="#26221F" style="font-family:var(--blatt-schrift)">' + esc(zeichen[i]) + '</text>';
  }
  return t + '</svg>';
}
// Code: Farbpunkte in Regenbogen-Reihenfolge, darunter je eine Linie; Lösung: Emoji über dem Punkt, Zeichen auf der Linie
function codeHtml(R, loesung){
  return '<div class="cs-code' + (loesung ? ' mit-emoji' : '') + '"><span class="cs-code-titel">Code:</span><div class="cs-punkte">' + R.ziele.map(function(z){
    return '<div class="cs-stelle">' + (loesung ? '<span class="cs-stelle-emoji">' + z.emoji + '</span>' : '') +
      '<span class="cs-punkt" style="background:' + Kern.FARBE[z.farbe] + '"></span><span class="cs-strich">' + (loesung ? esc(z.c) : '') + '</span></div>';
  }).join('') + '</div></div>';
}

var VORLAGE = '<div class="cs">' +
  '<header class="cs-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Code-Schloss</h1>' +
    '<p>Ein Feld mit Buchstaben und Emojis: Jedes Kästchen zeigt, wie weit es vom Emoji bis zum Buchstaben ist. Die Farben der Emojis geben die Reihenfolge – so entsteht der Code fürs Schloss.</p></header>' +
  '<div class="cs-layout"><section class="cs-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Code</h2><p>Das Lösungswort fürs Schloss.</p></div></div>' +
      '<label class="feld-label" for="csCode">Code</label>' +
      '<div class="cs-code-zeile"><input type="text" id="csCode" maxlength="20" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="csZufall" title="Ein anderes Wort vorschlagen">Andere</button></div>' +
      '<p class="hinweis">3 bis 6 Buchstaben oder Ziffern – so viele, wie das Thema Farben hat.</p>' +
      '<div class="cs-zaehler" id="csZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Emojis</h2><p>Jedes Thema hat Emojis in passenden Farben.</p></div></div>' +
      '<div class="cs-themen" role="radiogroup" aria-label="Emoji-Thema">' + Kern.THEMEN.map(function(T){
        return '<label><input type="radio" name="csThema" value="' + T.id + '"><span><i aria-hidden="true">' + Kern.farbenVon(T.id).map(function(f){ return T.ziel[f]; }).join('') + '</i><b>' + esc(T.name) + '</b></span></label>';
      }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Feld und Kästchen</h2></div></div>' +
      '<p class="feld-label">Buchstaben im Feld</p><div class="cs-chips" role="radiogroup" aria-label="Buchstaben im Feld">' + chips('csFeldArt', [['zufall', 'zufällig'], ['satz', 'ein Satz']]) + '</div>' +
      '<div id="csSatzTeil" hidden><label class="feld-label" for="csSatz">Satz</label>' +
        '<div class="cs-code-zeile"><input type="text" id="csSatz" class="cs-satz-feld" maxlength="80" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="csSatzVorschlag" title="Einen Satz vorschlagen, der zum Code passt">Vorschlag</button></div>' +
        '<div class="cs-satz-liste" id="csSatzListe" aria-live="polite"></div>' +
        '<p class="hinweis">Liest man die Buchstaben im Feld der Reihe nach (Zeile für Zeile, Emojis auslassen), ergeben sie diesen Satz. Die Buchstaben des Codes müssen darin vorkommen. «Vorschlag» sucht Sätze, die zum Codewort passen.</p>' +
        '<div class="cs-zaehler" id="csSatzInfo" aria-live="polite"></div></div>' +
      '<p class="feld-label">Feld</p><div class="cs-chips" role="radiogroup" aria-label="Grösse des Felds">' + chips('csN', [[5, '5 × 5 · leicht'], [6, '6 × 6'], [7, '7 × 7 · schwer']]) + '</div>' +
      '<p class="feld-label">Kästchen</p><div class="cs-chips" role="radiogroup" aria-label="Grösse der Kästchen">' + chips('csKaestchen', [[2, '2 × 2 · leicht'], [3, '3 × 3'], [4, '4 × 4 · schwer']]) + '</div>' +
      '<p class="hinweis">Grössere Kästchen haben längere Wege (bis 4 Felder weit).</p>' +
    '</div>' +
  '</section>' +
  '<section class="cs-ausgabe" aria-label="Ergebnis">' +
    '<div id="csMeldung" aria-live="polite"></div>' +
    '<div class="cs-werkzeug">' +
      '<button type="button" class="btn klein" id="csZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="csNeu" title="Feld und Kästchen neu verteilen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="csMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="csPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="csHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="cs-inhalt" id="csInhalt">' +
      '<div class="karte cs-spiel"><div><h2>Am Bildschirm lösen</h2><p id="csSpielText">Tippe den Code ein – unter jedem Farbpunkt ein Zeichen.</p></div><div class="cs-eingaben" id="csEingaben"></div></div>' +
      '<div class="cs-rahmen"><article class="cs-blatt" id="csBlatt"></article></div>' +
      '<div class="cs-rahmen cs-loesungs-rahmen"><article class="cs-blatt cs-loesungsblatt" id="csLoesung" aria-hidden="true"></article></div>' +
    '</div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"/><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8.5 15.5h1M11.5 15.5h1M14.5 15.5h1"/></svg>';

Labor.registriere({
  id:'code-schloss',
  titel:'Code-Schloss',
  kurz:'Emojis suchen, Wege gehen, den Code knacken',
  beschreibung:'Ein Feld mit Buchstaben und Emojis: Jedes Kästchen zeigt, wie weit es vom Emoji zum Buchstaben ist. Die Farben der Emojis geben die Reihenfolge – so entsteht der Code fürs Schloss. Mit Lösungsblatt.',
  merkmale:['Eigener Code (3–6 Zeichen)', 'Emoji-Themen in Regenbogenfarben', 'Am Bildschirm lösbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/codeschloss/codeschloss.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'code-schloss-eingaben', OPT = 'code-schloss-einstellungen';
  // feldArt: zufällige Buchstaben oder ein Satz (satz: der eingegebene Text)
  var STANDARD = { thema:'fruechte', n:6, kaestchen:2, feldArt:'zufall', mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', satz:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.satz = String(e.satz || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (['zufall', 'satz'].indexOf(st.opt.feldArt) < 0) st.opt.feldArt = 'zufall';
  if (!Kern.THEMEN.some(function(T){ return T.id === st.opt.thema; })) st.opt.thema = 'fruechte';
  if ([5, 6, 7].indexOf(+st.opt.n) < 0) st.opt.n = 6;
  if ([2, 3, 4].indexOf(+st.opt.kaestchen) < 0) st.opt.kaestchen = 2;
  if (!Kern.code(st.code).length) st.code = Kern.zufallsWort(Kern.zufall(st.seed + 5), 5);
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, satz:st.satz, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#csMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  function radios(name, k, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = typeof STANDARD[k] === 'number' ? +r.value : r.value; speichern(); if (nachher) nachher(); zeichnen(); });
    });
  }
  function codeJetzt(){ return Kern.code(st.code).slice(0, Kern.farbenVon(st.opt.thema).length); }
  // Satz im Feld: beim ersten Mal einen passenden Satz vorschlagen
  function satzArtZeigen(){
    var an = st.opt.feldArt === 'satz';
    $('#csSatzTeil').hidden = !an;
    if (an && !st.satz.trim()){
      st.satz = Kern.satzVorschlag(codeJetzt(), st.opt.n, Kern.zufall(st.seed + 9)) || Kern.SAETZE[0]; $('#csSatz').value = st.satz; speichern();
      var eigene = Kern.themenSaetze(codeJetzt(), st.opt.n);
      if (eigene.length) vorschlaegeZeigen(eigene, 'Sätze zu «' + codeJetzt().join('') + '» – zum Auswählen anklicken:');
    }
  }
  radios('csThema', 'thema'); radios('csN', 'n'); radios('csKaestchen', 'kaestchen'); radios('csFeldArt', 'feldArt', satzArtZeigen);
  $('#csSatz').value = st.satz; satzArtZeigen();
  $('#csSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); baldZeichnen(); });
  /* ---------- Satz-Vorschläge zum Codewort ----------
     Für die Wörter von «Andere» gibt es eingebaute Sätze; für eigene Wörter fragt die Seite die KI – auf der Website
     api/saetze.php (Mistral), im Claude-Artefakt Claude. Gezeigt werden nur Sätze, aus denen sich der Code legen lässt,
     die ins Feld passen und das Codewort nicht enthalten. */
  var SATZ_SERVER = 'api/saetze.php', kiWeg = null, kiSpeicher = {};
  function kiBereit(){
    if (kiWeg) return kiWeg;
    if (Labor.imArtefakt()) return (kiWeg = Labor.claude('sample').then(function(ki){ return ki ? { art:'claude', ki:ki } : null; }));
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return (kiWeg = Promise.resolve(null));
    kiWeg = fetch(SATZ_SERVER, { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return j && j.bereit ? { art:'server' } : null; }, function(){ return null; });
    return kiWeg;
  }
  function kiAuftrag(wort, max){
    var anzeige = wort.charAt(0) + wort.slice(1).toLowerCase(), zaehl = {};
    wort.split('').forEach(function(c){ zaehl[c] = (zaehl[c] || 0) + 1; });
    return 'Du schreibst Rätsel-Sätze für Arbeitsblätter an Schweizer Primarschulen.\n' +
      'Schreibe 10 kurze, einfache deutsche Sätze für Kinder von 8 bis 12 Jahren, die thematisch zum Wort «' + anzeige + '» passen.\nRegeln:\n' +
      '- Schweizer Rechtschreibung: ss statt ß.\n- Jeder Satz hat zwischen 15 und ' + max + ' Buchstaben (Leerzeichen und Satzzeichen zählen nicht).\n' +
      '- In jedem Satz kommen diese Buchstaben mindestens so oft vor (gross oder klein; ä zählt nicht als a): ' + Object.keys(zaehl).map(function(c){ return c + (zaehl[c] > 1 ? ' (' + zaehl[c] + '-mal)' : ''); }).join(', ') + '.\n' +
      '- Das Wort «' + anzeige + '» selbst kommt nicht vor, auch nicht als Teil eines längeren Worts.\n- Keine Zahlen und keine Namen echter Personen.\n' +
      'Antworte nur mit JSON in dieser Form: {"saetze": ["…", "…"]}';
  }
  function kiSaetze(w, wort, max){
    var schl = wort + '|' + max;
    if (kiSpeicher[schl]) return Promise.resolve(kiSpeicher[schl]);
    var p = w.art === 'server'
      ? fetch(SATZ_SERVER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ wort:wort, max:max }) }).then(function(r){
          return r.json().catch(function(){ return {}; }).then(function(j){ if (r.ok && j && Array.isArray(j.saetze)) return j.saetze; var e = new Error('ki'); e.code = (j && j.fehler) || (r.status === 429 ? 'zuViele' : 'ki'); throw e; });
        })
      : w.ki.json(kiAuftrag(wort, max), { modelTier:'quick' }).then(function(d){ return d && Array.isArray(d.saetze) ? d.saetze : []; });
    return p.then(function(l){ l = l.map(function(t){ return String(t || '').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim(); }).filter(Boolean); kiSpeicher[schl] = l; return l; });
  }
  function satzWaehlen(t){ st.satz = t; $('#csSatz').value = t; speichern(); listeMarkieren(); zeichnen(); }
  function listeMarkieren(){ [].forEach.call($('#csSatzListe').querySelectorAll('button'), function(b){ b.setAttribute('aria-pressed', b.textContent === st.satz ? 'true' : 'false'); }); }
  function vorschlaegeZeigen(liste, titel){
    $('#csSatzListe').innerHTML = liste.length ? '<p>' + esc(titel) + '</p>' + liste.map(function(t){ return '<button type="button" class="cs-satz-knopf" aria-pressed="false">' + esc(t) + '</button>'; }).join('') : '';
    listeMarkieren();
  }
  $('#csSatzListe').addEventListener('click', function(ev){ var b = ev.target.closest('button'); if (b) satzWaehlen(b.textContent); });
  var knopfText = $('#csSatzVorschlag').textContent;
  $('#csSatzVorschlag').addEventListener('click', function(){
    var z = codeJetzt(), wort = z.join(''), n = st.opt.n, knopf = this;
    function ersatz(text){   // ohne Thema: irgendein Satz, aus dem sich der Code legen lässt
      var v = Kern.satzVorschlag(z, n, Kern.zufall(Date.now()), st.satz.trim());
      if (v) satzWaehlen(v);
      meldung(v ? 'info' : 'warnung', '<p>' + esc(text) + (v ? ' Darum ein Satz, aus dem sich der Code legen lässt.' : ' Schreib einen eigenen Satz, in dem alle Buchstaben des Codes vorkommen.') + '</p>');
    }
    if (z.length < 3) return;
    var eigene = Kern.themenSaetze(z, n);
    if (eigene.length){ vorschlaegeZeigen(eigene, 'Sätze zu «' + wort + '» – zum Auswählen anklicken:'); satzWaehlen(eigene[Math.floor(Math.random() * eigene.length)]); return; }
    if (/\d/.test(wort)) { vorschlaegeZeigen([], ''); ersatz('Zu Zahlen-Codes gibt es keine Sätze zum Thema.'); return; }
    knopf.disabled = true; knopf.textContent = 'Sucht …';
    kiBereit().then(function(w){
      if (!w) return ersatz('Sätze zum Thema schlägt die KI auf raetsellabor.fabulousteaching.ch vor.');
      return kiSaetze(w, wort, Math.min(45, n * n - z.length)).then(function(l){
        var ok = l.filter(function(t){ return Kern.satzPasst(t, z, n); });
        if (!ok.length) return ersatz('Die KI hat keinen Satz gefunden, aus dem sich «' + wort + '» legen lässt.');
        vorschlaegeZeigen(ok, 'Sätze zu «' + wort + '» – zum Auswählen anklicken:'); satzWaehlen(ok[0]);
      }, function(e){
        ersatz(e && (e.code === 'zuViele' || e.code === 'rate_limited') ? 'Gerade zu viele Anfragen an die KI – bitte in einer Minute nochmals.' : 'Die KI war gerade nicht erreichbar.');
      });
    }).then(function(){ if (!aus){ knopf.disabled = false; knopf.textContent = knopfText; } });
  });
  $('#csCode').value = st.code;
  $('#csCode').addEventListener('input', function(){ st.code = this.value; speichern(); vorschlaegeZeigen([], ''); baldZeichnen(); });
  $('#csZufall').addEventListener('click', function(){
    st.code = Kern.zufallsWort(Kern.zufall(Date.now()), Kern.farbenVon(st.opt.thema).length, Kern.code(st.code).join(''));
    $('#csCode').value = st.code; speichern(); vorschlaegeZeigen([], '');
    // Satz im Feld: zum neuen Wort gleich einen passenden Satz
    if (st.opt.feldArt === 'satz'){ var eigene = Kern.themenSaetze(codeJetzt(), st.opt.n); if (eigene.length){ vorschlaegeZeigen(eigene, 'Sätze zu «' + codeJetzt().join('') + '» – zum Auswählen anklicken:'); satzWaehlen(eigene[0]); return; } }
    zeichnen();
  });
  $('#csMitLoesung').checked = !!st.opt.mitLoesung;
  $('#csMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#csNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#csZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  /* ---------- Rätsel ---------- */
  var R = null, eingabeSchluessel = '';
  function anleitung(z){
    var ziffern = z.every(function(c){ return /\d/.test(c); }), was = ziffern ? 'eine Ziffer' : 'ein Buchstabe';
    return 'Jedes Kästchen zeigt einen Weg. Suche sein Emoji im grossen Feld. Gehe von dort so viele Felder nach oben, unten, links oder rechts wie im Kästchen vom Emoji bis zum Schloss 🔐. ' +
      'Dort steht ' + was + '. Schreibe ' + (ziffern ? 'sie' : 'ihn') + ' unter den Punkt mit der Farbe des Emojis. Wie heisst der Code?' +
      (R && R.satz ? ' Zum Schluss: Lies alle Buchstaben im Feld der Reihe nach, Zeile für Zeile – sie ergeben einen Satz.' : '');
  }
  function titel(){ return 'Code-Schloss'; }
  function blattHtml(R, z, loesung, kopf){
    var o = st.opt;
    return (o.titelAn ? '<h2>' + esc(titel()) + (kopf ? ' – Lösung' : '') + '</h2>' : (kopf ? '<p class="cs-anleitung"><b>Lösung</b></p>' : '')) +
      (o.anleitungAn && !kopf ? '<p class="cs-anleitung">' + esc(anleitung(z)) + '</p>' : '') +
      '<div class="cs-haupt"><div class="cs-links">' + feldHtml(R, loesung) + codeHtml(R, loesung) +
        '<div class="cs-schloss-platz">' + schlossSvg(z.length, loesung ? z : null) + (loesung ? '<span class="cs-jubel" aria-hidden="true">🥳</span>' : '') + '</div></div>' +
      '<div class="cs-figuren">' + R.reihe.map(function(i){ return figurHtml(R.ziele[i], loesung, R.gr); }).join('') + '</div></div>' +
      (kopf && R.satz ? '<p class="cs-satz-loesung">Satz im Feld: <b>' + esc(st.satz.trim()) + '</b></p>' : '');
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, max = Kern.farbenVon(o.thema).length, alle = Kern.code(st.code), z = alle.slice(0, max), T = Kern.thema(o.thema), h = '';
    if (alle.length > max) h += '<p class="warnung">«' + esc(T.name) + '» hat ' + max + ' Farben – es werden die ersten ' + max + ' Zeichen verwendet.</p>';
    if (z.length && z.length < 3) h += '<p class="warnung">Es braucht mindestens 3 Zeichen.</p>';
    $('#csZaehler').innerHTML = z.length ? '<p class="cs-zaehler-haupt ' + (z.length >= 3 ? 'ok' : 'fehlt') + '">Code: <b>' + esc(z.join('')) + '</b> (' + z.length + ' Zeichen)</p>' + h : '';
    var leer = z.length < 3;
    ['#csZeigeLoesung', '#csNeu', '#csPdf', '#csHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){
      R = null; $('#csInhalt').hidden = true;
      meldung('info', '<p>Gib links den Code ein – 3 bis ' + max + ' Buchstaben oder Ziffern.</p>');
      return;
    }
    // Satz im Feld: Lässt sich der Code aus seinen Buchstaben legen, und passt er ins Feld?
    var satzZ = null;
    if (o.feldArt === 'satz'){
      satzZ = Kern.code(st.satz);
      var pr = Kern.satzPruefen(satzZ, z, o.n), passt = [5, 6, 7].filter(function(n){ return satzZ.length <= n * n - z.length; })[0];
      $('#csSatzInfo').innerHTML = satzZ.length ? '<p class="cs-zaehler-haupt ' + (pr.fehlt.length || pr.L > pr.maxL ? 'fehlt' : 'ok') + '"><b>' + pr.L + '</b> Buchstaben' +
        (pr.L > pr.maxL ? ' – im Feld ' + o.n + ' × ' + o.n + ' haben höchstens ' + pr.maxL + ' Platz.' : ' · ' + (o.n * o.n - pr.L) + ' Felder für Emojis') + '</p>' +
        (!pr.fehlt.length && pr.L <= pr.maxL && pr.L < o.n * o.n * 0.35 ? '<p class="warnung">Der Satz ist kurz – im Feld stehen viele Emojis. Ein kleineres Feld passt besser.</p>' : '') : '';
      var problem = '';
      if (!satzZ.length) problem = '<p>Gib links den Satz ein, der im Feld stehen soll.</p>';
      else if (pr.fehlt.length) problem = '<p>Der Code «' + esc(z.join('')) + '» lässt sich aus diesem Satz nicht legen: ' + pr.fehlt.map(function(f){
          return f.hat ? '«' + esc(f.c) + '» kommt nur ' + f.hat + '-mal vor, der Code braucht es ' + f.braucht + '-mal' : '«' + esc(f.c) + '» kommt im Satz nicht vor';
        }).join(', ') + '. Ändere den Satz oder den Code' + (Kern.satzVorschlag(z, o.n, Kern.zufall(1)) ? ' – oder nimm einen «Vorschlag»' : '') + '.</p>';
      else if (pr.L > pr.maxL) problem = '<p>Der Satz hat ' + pr.L + ' Buchstaben – im Feld ' + o.n + ' × ' + o.n + ' haben höchstens ' + pr.maxL + ' Platz, weil es noch ' + z.length + ' Felder für die Emojis braucht. ' +
        (passt ? 'Wähle das Feld ' + passt + ' × ' + passt + ' oder kürze den Satz.' : 'Kürze den Satz.') + '</p>';
      if (problem){ R = null; $('#csInhalt').hidden = true; ['#csZeigeLoesung', '#csNeu', '#csPdf', '#csHerunterladen'].forEach(function(s){ $(s).disabled = true; }); meldung(satzZ.length ? 'warnung' : 'info', problem); return; }
    }
    R = Kern.planen({ code:z, thema:o.thema, n:o.n, kaestchen:o.kaestchen, satz:satzZ, seed:st.seed });
    if (!R){
      $('#csInhalt').hidden = true;
      meldung('warnung', satzZ ? '<p>Mit diesem Satz finde ich keine Anordnung, bei der alle Wege aufgehen. Versuche ein anderes Feld, kleinere Kästchen oder «Neu mischen».</p>' : '<p>Das Feld ist zu klein für diesen Code. Wähle ein grösseres Feld.</p>');
      return;
    }
    meldung('', ''); $('#csInhalt').hidden = false;
    var zeige = $('#csZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#csBlatt').innerHTML = blattHtml(R, z, zeige, false);
    $('#csLoesung').innerHTML = blattHtml(R, z, true, true);
    eingabenZeigen(z);
  }

  /* ---------- Am Bildschirm lösen: je Farbpunkt ein Feld ---------- */
  function eingabenZeigen(z){
    var schluessel = st.opt.thema + '|' + z.join('');
    if (schluessel === eingabeSchluessel) return;
    eingabeSchluessel = schluessel;
    $('#csEingaben').innerHTML = R.ziele.map(function(ziel, i){
      return '<label class="cs-eingabe-stelle"><span class="cs-punkt" style="background:' + Kern.FARBE[ziel.farbe] + '"></span>' +
        '<input type="text" maxlength="1" autocomplete="off" spellcheck="false" data-i="' + i + '" aria-label="Zeichen ' + (i + 1) + ' (Punkt ' + ziel.farbe.replace('gruen', 'grün') + ')"></label>';
    }).join('');
    pruefen();
  }
  function pruefen(){
    if (!R) return;
    var felder = [].slice.call($('#csEingaben').querySelectorAll('input')), voll = true, richtig = true;
    felder.forEach(function(f, i){
      var v = Kern.code(f.value).join(''), ok = v === R.ziele[i].c;
      if (!v) voll = false;
      if (!ok) richtig = false;
      f.classList.toggle('falsch', !!v && !ok && felder.every(function(x){ return x.value; }));
    });
    $('#csSpielText').innerHTML = richtig ? '<b>Geschafft! 🥳</b> Das Schloss ist offen.' : voll ? 'Noch nicht ganz – prüfe die rot markierten Zeichen.' : 'Tippe den Code ein – unter jedem Farbpunkt ein Zeichen.';
    $('#csEingaben').classList.toggle('offen', richtig);
  }
  $('#csEingaben').addEventListener('input', function(ev){
    var f = ev.target; if (!f.matches('input')) return;
    f.value = Kern.code(f.value).join('').slice(-1);
    if (f.value){ var n = f.parentNode.nextSibling; if (n) n.querySelector('input').focus(); }
    pruefen();
  });
  $('#csEingaben').addEventListener('keydown', function(ev){
    var f = ev.target; if (!f.matches('input') || ev.key !== 'Backspace' || f.value) return;
    var v = f.parentNode.previousSibling; if (v){ ev.preventDefault(); var i = v.querySelector('input'); i.value = ''; i.focus(); pruefen(); }
  });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  // vor dem PDF «Lösung zeigen» ausschalten, damit das Arbeitsblatt ohne Lösung ins PDF kommt
  function ohneLoesung(){ var k = $('#csZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#csPdf'), function(){ ohneLoesung(); return R && { blaetter:[$('#csBlatt'), st.opt.mitLoesung && $('#csLoesung')], name:Labor.pdfName('Code-Schloss', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#csPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#csHerunterladen').hidden = false; });
  }
  $('#csHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    ohneLoesung();
    var name = Labor.pdfName('Code-Schloss', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#csBlatt'), st.opt.mitLoesung && $('#csLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Code-Schloss', inhalt, '.cs-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
