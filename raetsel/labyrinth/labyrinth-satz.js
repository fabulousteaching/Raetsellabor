/* Rätsellabor – Labyrinth, Art «Mit Lösungssatz» (wird von labyrinth.js eingebunden, vor diesem laden)
   Ein Lösungssatz versteckt im Labyrinth: Jedes Feld trägt einen Buchstaben, ohne Lücken. Auf dem einzigen Weg vom
   Eingang (links) zum Ausgang (rechts) steht der Satz, Buchstabe für Buchstabe und ohne Leerzeichen. In allen Irrwegen
   stehen Zufallsbuchstaben aus dem Satz selbst, damit der richtige Weg nicht auffällt.
   Ablauf: zuerst einen Weg mit genau so vielen Feldern wie der Satz Zeichen hat, dann das übrige Labyrinth darum
   herum wachsen lassen («perfektes» Labyrinth: zwischen zwei Feldern genau ein Weg). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var O = 1, R = 2, U = 4, L = 8;   // offene Seiten eines Felds: oben, rechts, unten, links
  var RICHTUNG = [[O, -1, 0], [R, 0, 1], [U, 1, 0], [L, 0, -1]], GEGEN = { 1:4, 2:8, 4:1, 8:2 };
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;   // kleine Startwerte gut durchmischen
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Der Satz, wie er angezeigt wird (Leerraum vereinfacht) – und seine Buchstaben für die Felder:
     nur Buchstaben und Ziffern, ohne Leer- und Satzzeichen, damit jedes Feld einen Buchstaben trägt */
  function anzeige(text, gross){
    var t = String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    return gross ? t.toLocaleUpperCase('de-CH') : t;
  }
  function zeichen(text, gross){ return Array.from(anzeige(text, gross).replace(/[^\p{L}\p{N}]/gu, '')); }
  /* Grösse des Gitters: etwa faktor × so viele Felder wie der Satz, leicht breiter als hoch; deutlich schmaler, als der Satz lang ist */
  function groesse(n, faktor){
    var ziel = Math.max(9, n * faktor), w = Math.round(Math.sqrt(ziel * 1.15));
    w = Math.max(2, Math.min(w, n, 24, Math.max(3, Math.round(n * 0.6))));   // Platz zum Abbiegen lassen
    var h = Math.max(2, Math.min(30, Math.ceil(ziel / w), Math.max(3, Math.round(w * 1.4))));   // kurze Sätze: nicht zu schmal und hoch
    return { w:w, h:h };
  }

  /* Weg mit genau n Feldern von der linken Spalte zur rechten (Tiefensuche mit Prüfung, ob der Rest noch aufgeht) */
  function weg(w, h, n, rnd, budget){
    var N = w * h, frei = new Uint8Array(N), dist = new Int32Array(N), schlange = new Int32Array(N);
    frei.fill(1);
    // Reihenfolge der Nachbarn (der letzte wird zuerst versucht): zufällig, aber der Weg rückt gleichmässig nach rechts vor
    // und biegt oft ab – sonst muss er am Schluss gerade zum Ausgang eilen und das Ende des Satzes steht in einer Reihe
    // Dazu schwingt der Weg in der Höhe ein- bis zweimal über das ganze Feld (sonst bleibt er nahe der Startzeile).
    function nachbarn(p, vorher, schritt){
      var r = Math.floor(p / w), c = p % w, a = [], t = (schritt + 1) / Math.max(1, n - 1);
      var zielC = t * (w - 1), zielR = (h - 1) * (0.5 - 0.5 * Math.cos(phase + richtung * Math.PI * schwuenge * t));
      if (r > 0) a.push(p - w); if (r < h - 1) a.push(p + w); if (c > 0) a.push(p - 1); if (c < w - 1) a.push(p + 1);
      var wert = {};
      a.forEach(function(q){ wert[q] = Math.abs(q % w - zielC) * 0.8 + Math.abs(Math.floor(q / w) - zielR) * 0.6 + rnd() * 2.2 + (vorher !== undefined && q === p + (p - vorher) ? 1 : 0); });
      return a.sort(function(x, y){ return wert[y] - wert[x]; });
    }
    // Geht es vom Kopf aus mit genau «rest» weiteren Feldern noch bis zur rechten Spalte?
    function moeglich(kopf, rest){
      if (rest === 0) return kopf % w === w - 1;
      dist.fill(-1); dist[kopf] = 0;
      var a = 0, e = 0, anzahl = 0, ziel = false; schlange[e++] = kopf;
      while (a < e){
        var p = schlange[a++], d = dist[p], r = Math.floor(p / w), c = p % w;
        var nb = [r > 0 ? p - w : -1, r < h - 1 ? p + w : -1, c > 0 ? p - 1 : -1, c < w - 1 ? p + 1 : -1];
        for (var i = 0; i < 4; i++){
          var q = nb[i];
          if (q < 0 || !frei[q] || dist[q] >= 0) continue;
          dist[q] = d + 1; schlange[e++] = q; anzahl++;
          if (q % w === w - 1 && d + 1 <= rest && (rest - d - 1) % 2 === 0) ziel = true;
        }
      }
      return ziel && anzahl >= rest;
    }
    var startR = Math.floor(rnd() * h), start = startR * w, pfad = [start], wahl = [], schritte = 0;
    var phase = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * startR / Math.max(1, h - 1)))), schwuenge = 1 + rnd(), richtung = rnd() < 0.5 ? 1 : -1;
    frei[start] = 0;
    if (!moeglich(start, n - 1)) return null;
    wahl.push(nachbarn(start, undefined, 0));
    while (pfad.length < n){
      if (++schritte > budget) return null;
      var liste = wahl[wahl.length - 1];
      if (!liste.length){   // Sackgasse: einen Schritt zurück
        wahl.pop(); frei[pfad.pop()] = 1;
        if (!pfad.length) return null;
        continue;
      }
      var q = liste.pop();
      if (!frei[q]) continue;
      frei[q] = 0; pfad.push(q);
      if (!moeglich(q, n - pfad.length)){ frei[q] = 1; pfad.pop(); continue; }
      wahl.push(pfad.length < n ? nachbarn(q, pfad[pfad.length - 2], pfad.length - 1) : []);
    }
    return pfad;
  }

  /* Labyrinth erzeugen. o: { seed, faktor, neu, gross } */
  function erzeugen(text, o){
    var z = zeichen(text, o.gross), n = z.length;
    if (n < 3) return { fehler:'kurz' };
    var g = groesse(n, o.faktor || 5), w = g.w, h = g.h, rnd = zufall(o.seed || 1), pfad = null;
    for (var v = 0; v < 80 && !pfad; v++) pfad = weg(w, h, n, rnd, 600 + n * 80);
    if (!pfad) return { fehler:'keinWeg' };
    var offen = [], besucht = new Uint8Array(w * h), i;
    for (var r = 0; r < h; r++){ var zeile = []; for (var c = 0; c < w; c++) zeile.push(0); offen.push(zeile); }
    function zelle(p){ return [Math.floor(p / w), p % w]; }
    function verbinde(a, b){
      var pa = zelle(a), pb = zelle(b), dy = pb[0] - pa[0], dx = pb[1] - pa[1];
      var bit = dy === -1 ? O : dy === 1 ? U : dx === 1 ? R : L;
      offen[pa[0]][pa[1]] |= bit; offen[pb[0]][pb[1]] |= GEGEN[bit];
    }
    for (i = 0; i < n; i++){ besucht[pfad[i]] = 1; if (i) verbinde(pfad[i - 1], pfad[i]); }
    // übrige Felder als Irrwege anhängen («wachsender Baum», ausgehend von allen Feldern des Wegs)
    var aktiv = mischen(pfad.slice(), rnd), neu = o.neu === undefined ? 0.6 : o.neu;
    while (aktiv.length){
      var k = rnd() < neu ? aktiv.length - 1 : Math.floor(rnd() * aktiv.length), p = aktiv[k], pr = Math.floor(p / w), pc = p % w, frei = [];
      if (pr > 0 && !besucht[p - w]) frei.push(p - w); if (pr < h - 1 && !besucht[p + w]) frei.push(p + w);
      if (pc > 0 && !besucht[p - 1]) frei.push(p - 1); if (pc < w - 1 && !besucht[p + 1]) frei.push(p + 1);
      if (!frei.length){ aktiv.splice(k, 1); continue; }
      var q = frei[Math.floor(rnd() * frei.length)];
      verbinde(p, q); besucht[q] = 1; aktiv.push(q);
    }
    // Buchstaben: der Satz auf dem Weg, in allen anderen Feldern Zufallsbuchstaben aus dem Satz (gleich häufig wie dort)
    var feld = [];
    for (r = 0; r < h; r++){ var fz = []; for (c = 0; c < w; c++) fz.push(z[Math.floor(rnd() * n)]); feld.push(fz); }
    var wegZellen = pfad.map(zelle);
    wegZellen.forEach(function(q, j){ feld[q[0]][q[1]] = z[j]; });
    return { h:h, w:w, offen:offen, feld:feld, weg:wegZellen, start:wegZellen[0], ziel:wegZellen[n - 1], satz:anzeige(text, o.gross), buchstaben:z.join(''), n:n };
  }

  /* Der (einzige) Weg vom Eingang zum Ausgang – zur Kontrolle */
  function loesung(lab){
    var w = lab.w, vor = new Int32Array(lab.h * w).fill(-1), s = lab.start[0] * w + lab.start[1], zi = lab.ziel[0] * w + lab.ziel[1], schlange = [s], kopf = 0;
    vor[s] = s;
    while (kopf < schlange.length){
      var p = schlange[kopf++], r = Math.floor(p / w), c = p % w;
      if (p === zi) break;
      RICHTUNG.forEach(function(d){ if (!(lab.offen[r][c] & d[0])) return; var q = (r + d[1]) * w + c + d[2]; if (vor[q] < 0){ vor[q] = p; schlange.push(q); } });
    }
    if (vor[zi] < 0) return [];
    var weg = [], q = zi;
    while (q !== s){ weg.push([Math.floor(q / w), q % w]); q = vor[q]; }
    weg.push(lab.start);
    return weg.reverse();
  }
  function offenZwischen(lab, a, b){
    var dy = b[0] - a[0], dx = b[1] - a[1];
    if (Math.abs(dy) + Math.abs(dx) !== 1) return false;
    var bit = dy === -1 ? O : dy === 1 ? U : dx === 1 ? R : L;
    return !!(lab.offen[a[0]][a[1]] & bit);
  }
  /* Wände als SVG-Pfad (Feldgrösse 10), gerade Stücke zusammengefasst; Öffnung links beim Eingang, rechts beim Ausgang */
  function waende(lab){
    var S = 10, d = [], w = lab.w, h = lab.h, x, y, r, c, anfang, da;
    for (y = 0; y <= h; y++){
      anfang = -1;
      for (c = 0; c <= w; c++){
        da = c < w && (y === 0 || y === h || !(lab.offen[y - 1][c] & U));
        if (da && anfang < 0) anfang = c;
        if (!da && anfang >= 0){ d.push('M' + anfang * S + ' ' + y * S + 'H' + c * S); anfang = -1; }
      }
    }
    for (x = 0; x <= w; x++){
      anfang = -1;
      for (r = 0; r <= h; r++){
        da = r < h && (x === 0 ? r !== lab.start[0] : x === w ? r !== lab.ziel[0] : !(lab.offen[r][x - 1] & R));
        if (da && anfang < 0) anfang = r;
        if (!da && anfang >= 0){ d.push('M' + x * S + ' ' + anfang * S + 'V' + r * S); anfang = -1; }
      }
    }
    return d.join('');
  }
  return { zeichen:zeichen, groesse:groesse, erzeugen:erzeugen, loesung:loesung, offenZwischen:offenZwischen, waende:waende, zufall:zufall };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var STUFEN = { leicht:{ faktor:3, neu:0.5, name:'Leicht' }, mittel:{ faktor:5, neu:0.6, name:'Mittel' }, schwer:{ faktor:8, neu:0.7, name:'Schwer' }, sehrschwer:{ faktor:12, neu:0.75, name:'Sehr schwer' } };
// artKarte: die Karte «Art des Labyrinths» (kommt aus labyrinth.js und steht bei beiden Arten zuoberst)
function vorlage(artKarte){
  return '<div class="sl"><div class="sl-layout"><section class="sl-eingabe" aria-label="Eingaben">' + artKarte +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Lösungssatz</h2><p>Dieser Satz steht Buchstabe für Buchstabe auf dem Weg vom Eingang zum Ausgang – ohne Leerzeichen.</p></div></div>' +
      '<label class="vh" for="slSatz">Lösungssatz</label>' +
      '<textarea id="slSatz" rows="3" maxlength="150"></textarea>' +
      '<p class="hinweis" id="slInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Schwierigkeit</h2><p>Je schwerer, desto grösser das Labyrinth und desto mehr Irrwege.</p></div></div>' +
      '<div class="sl-stufen" role="radiogroup" aria-label="Schwierigkeit">' +
        Object.keys(STUFEN).map(function(k){ return '<label><input type="radio" name="slStufe" value="' + k + '"><span>' + STUFEN[k].name + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="slTitel">Titel auf dem Blatt</label><input type="text" id="slTitel" maxlength="60">' +
        '<label for="slSchrift">Buchstaben</label><select id="slSchrift"><option value="wie">wie eingegeben</option><option value="gross">nur Grossbuchstaben</option></select>' +
        '<label for="slLinie">Linien</label><select id="slLinie"><option value="0.6">dünn</option><option value="0.9">mittel</option><option value="1.3">dick</option></select></div>' +
    '</details></div>' +
    '<button type="button" class="btn primary gross" id="slLos">Labyrinth erstellen</button>' +
  '</section>' +
  '<section class="sl-ausgabe" aria-label="Ergebnis">' +
    '<div id="slMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="slLeer"><h2>Noch kein Labyrinth</h2><p>In drei Schritten zum Arbeitsblatt:</p><ol>' +
      '<li>Lösungssatz eingeben</li><li>Schwierigkeit wählen</li><li>«Labyrinth erstellen» klicken</li></ol></div>' +
    '<div class="sl-werkzeug" id="slWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="slMischen" title="Gleicher Satz, neues Labyrinth">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="slZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="slWegWeg">Weg löschen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="slMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="slDrucken">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="slHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="sl-blatt" id="slBlatt" hidden></article>' +
    '<article class="sl-blatt sl-loesungsblatt" id="slLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';
}

// Für den Generator «Labyrinth» (raetsel/labyrinth/labyrinth.js): Art «Mit Lösungssatz»
window.LabyrinthSatz = { vorlage:vorlage, starte:starte, Kern:Kern };

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false, NS = 'http://www.w3.org/2000/svg';
  var TAB = 'satz-labyrinth-eingaben', OPT = 'satz-labyrinth-einstellungen';
  var STANDARD = { stufe:'mittel', schrift:'wie', linie:'0.9', mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', titel:'', seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || 1; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#slMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#slLeer').hidden = !!aktuell || !!$('#slMeldung').innerHTML; }
  var aktuell = null, weg = [], erstellt = false;

  /* ---------- Eingaben ---------- */
  [].forEach.call(bereich.querySelectorAll('input[name="slStufe"]'), function(r){
    r.checked = r.value === st.opt.stufe;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.stufe = r.value; speichern(); if (erstellt) erstellen(); });
  });
  var satzFeld = $('#slSatz'); satzFeld.value = st.satz;
  function info(){
    var n = Kern.zeichen(st.satz, st.opt.schrift === 'gross').length;
    $('#slInfo').textContent = !n ? 'Im Labyrinth stehen die Wörter ohne Lücke hintereinander, Satzzeichen fallen weg.'
      : n < 3 ? 'Mindestens 3 Buchstaben.'
      : n + ' Buchstaben – der richtige Weg wird genau ' + n + ' Felder lang. Die Wörter stehen ohne Lücke hintereinander.';
  }
  satzFeld.addEventListener('input', function(){ st.satz = satzFeld.value; speichern(); info(); if (aktuell) $('#slBlatt').classList.add('veraltet'); });
  satzFeld.addEventListener('keydown', function(ev){ if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); erstellen(); } });
  $('#slTitel').value = st.titel;
  $('#slTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#slSchrift').value = st.opt.schrift; $('#slSchrift').addEventListener('change', function(){ st.opt.schrift = this.value; speichern(); info(); if (erstellt) erstellen(); });
  $('#slLinie').value = st.opt.linie; $('#slLinie').addEventListener('change', function(){ st.opt.linie = this.value; speichern(); if (aktuell) zeichnen(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); if (aktuell) zeichnen(); });
  $('#slMitLoesung').checked = st.opt.mitLoesung; $('#slMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });

  /* ---------- Erstellen ---------- */
  function erstellen(){
    erstellt = true;
    var stufe = STUFEN[st.opt.stufe] || STUFEN.mittel;
    function fehler(html){ aktuell = null; $('#slBlatt').hidden = true; $('#slWerkzeug').hidden = true; meldung('fehler', html); }
    if (!st.satz.trim()){ fehler('<h3>Noch kein Lösungssatz</h3><p>Schreibe zuerst den Satz, der im Labyrinth versteckt werden soll.</p>'); return; }
    var lab = Kern.erzeugen(st.satz, { seed:st.seed, faktor:stufe.faktor, neu:stufe.neu, gross:st.opt.schrift === 'gross' });
    if (lab.fehler === 'kurz'){ fehler('<h3>Der Satz ist zu kurz</h3><p>Gib mindestens drei Buchstaben ein.</p>'); return; }
    if (lab.fehler){ fehler('<h3>Das hat nicht geklappt</h3><p>Klicke noch einmal auf «Labyrinth erstellen» oder wähle eine andere Stufe.</p>'); st.seed = Math.floor(Math.random() * 1e9) + 1; return; }
    aktuell = { lab:lab };
    weg = [lab.start];
    $('#slZeigeLoesung').setAttribute('aria-pressed', 'false');
    zeichnen();
    var mm = Math.min(186 / (lab.w + 2.4), 190 / (lab.h + 2.4));
    meldung('erfolg', '<p><b>Fertig!</b> Labyrinth mit ' + lab.w + ' × ' + lab.h + ' Feldern. Der richtige Weg ist ' + lab.n + ' Felder lang – ein Feld für jeden Buchstaben deines Satzes. ' +
      'Du kannst ihn hier am Bildschirm suchen: beim Pfeil links hineinziehen.</p>' +
      (mm < 6 ? '<p>Achtung: Gedruckt werden die Felder nur etwa ' + mm.toFixed(1).replace('.', ',') + ' mm gross. Für gut lesbare Buchstaben eine leichtere Stufe oder einen kürzeren Satz wählen.</p>' : ''));
  }

  /* ---------- Zeichnen ---------- */
  function z2(x){ return String(Math.round(x * 10) / 10); }
  function linie(zellen){ return zellen.map(function(q, i){ return (i ? 'L' : 'M') + (q[1] * 10 + 5) + ' ' + (q[0] * 10 + 5); }).join(''); }
  function labSvg(loesungsblatt){
    var lab = aktuell.lab, S = 10, rand = 12, lw = parseFloat(st.opt.linie) || 0.9;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (-rand) + ' ' + (-rand / 2) + ' ' + (lab.w * S + 2 * rand) + ' ' + (lab.h * S + rand));
    s.setAttribute('class', 'sl-svg');
    var t = [], b = [];
    // Weg vom Eingang (links aussen) bis zum Ausgang (rechts aussen)
    var ganz = 'M' + (-rand + 2) + ' ' + (lab.start[0] * S + 5) + linie(lab.weg).replace(/^M/, 'L') + 'L' + (lab.w * S + rand - 2) + ' ' + (lab.ziel[0] * S + 5);
    t.push('<path class="sl-loesung" d="' + ganz + '"/>');
    if (!loesungsblatt) t.push('<path class="sl-weg" d=""/>');
    t.push('<path class="sl-waende" d="' + Kern.waende(lab) + '" style="stroke-width:' + lw + '"/>');
    lab.feld.forEach(function(zeile, r){ zeile.forEach(function(ch, c){ b.push('<text x="' + (c * S + S / 2) + '" y="' + z2(r * S + S / 2 + 0.3) + '">' + esc(ch) + '</text>'); }); });
    t.push('<g class="sl-buchstaben">' + b.join('') + '</g>');
    var ya = lab.start[0] * S + S / 2, yz = lab.ziel[0] * S + S / 2, xz = lab.w * S;
    t.push('<path class="sl-pfeil" d="M' + (-rand + 1) + ' ' + ya + 'H-2.5M-5.5 ' + (ya - 2.6) + 'L-2.5 ' + ya + 'L-5.5 ' + (ya + 2.6) +
      'M' + (xz + 2.5) + ' ' + yz + 'H' + (xz + rand - 1) + 'M' + (xz + rand - 4) + ' ' + (yz - 2.6) + 'L' + (xz + rand - 1) + ' ' + yz + 'L' + (xz + rand - 4) + ' ' + (yz + 2.6) + '"/>');
    s.innerHTML = t.join('');
    return s;
  }
  function zeichnen(){
    var lab = aktuell.lab, titel = st.titel.trim() || 'Finde den Lösungssatz!', blatt = $('#slBlatt'), loes = $('#slLoesung'), o = st.opt;
    var linien = Math.min(4, Math.max(1, Math.ceil(lab.n / 34))), l = '';
    for (var i = 1; i < linien; i++) l += '<span class="sl-linie voll"></span>';
    blatt.classList.remove('veraltet', 'zeige-loesung', 'geschafft');
    blatt.innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="sl-anleitung">Finde den Weg vom Eingang zum Ausgang (bei den Pfeilen), ohne eine Wand zu überqueren. Die Buchstaben auf dem richtigen Weg ergeben einen Satz – die Wörter stehen ohne Lücke hintereinander. Schreibe ihn auf die Linie' + (linien > 1 ? 'n' : '') + '.</p>' : '') +
      '<div class="sl-feld"></div><p class="sl-fortschritt nur-bildschirm" id="slFortschritt" aria-live="polite"></p>' +
      '<div class="sl-antwort"><span>Lösungssatz:</span><span class="sl-linie"></span>' + l + '</div>';
    var svg = labSvg(false);
    blatt.querySelector('.sl-feld').appendChild(svg);
    loes.innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><div class="sl-feld"></div><p class="sl-satz-loesung"><b>Lösungssatz:</b> ' + esc(lab.satz) + '</p>';
    loes.querySelector('.sl-feld').appendChild(labSvg(true));
    blatt.hidden = false; $('#slWerkzeug').hidden = false; leer();
    wegVerbinden(svg); wegZeichnen();
  }

  /* ---------- Am Bildschirm lösen: vom Eingang aus durch die Gänge ziehen (zurückziehen löscht) ---------- */
  function wegVerbinden(svg){
    var zieht = false;
    function feld(ev){
      var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var m = svg.getScreenCTM(); if (!m) return null;
      var q = pt.matrixTransform(m.inverse()), r = Math.floor(q.y / 10), c = Math.floor(q.x / 10), lab = aktuell.lab;
      return r >= 0 && c >= 0 && r < lab.h && c < lab.w ? [r, c] : null;
    }
    function schritt(f){
      if (!f) return;
      var ende = weg[weg.length - 1];
      if (f[0] === ende[0] && f[1] === ende[1]) return;
      var i = weg.findIndex(function(q){ return q[0] === f[0] && q[1] === f[1]; });
      if (i >= 0){ weg = weg.slice(0, i + 1); wegZeichnen(); return; }    // auf den eigenen Weg zurück: dort weitermachen
      if (Kern.offenZwischen(aktuell.lab, ende, f)){ weg.push(f); wegZeichnen(); }
    }
    svg.addEventListener('pointerdown', function(ev){
      var f = feld(ev); if (!f) return;
      var i = weg.findIndex(function(q){ return q[0] === f[0] && q[1] === f[1]; });
      if (i < 0 && !Kern.offenZwischen(aktuell.lab, weg[weg.length - 1], f)) return;
      ev.preventDefault(); zieht = true; try { svg.setPointerCapture(ev.pointerId); } catch(x){}
      schritt(f);
    });
    svg.addEventListener('pointermove', function(ev){ if (zieht) schritt(feld(ev)); });
    function ende(){ zieht = false; }
    svg.addEventListener('pointerup', ende); svg.addEventListener('pointercancel', ende);
  }
  function wegZeichnen(){
    var pfad = bereich.querySelector('#slBlatt .sl-weg'); if (!pfad) return;
    var lab = aktuell.lab, z = lab.ziel, letzte = weg[weg.length - 1], fertig = letzte[0] === z[0] && letzte[1] === z[1];
    pfad.setAttribute('d', 'M-10 ' + (lab.start[0] * 10 + 5) + linie(weg).replace(/^M/, 'L') + (fertig ? 'L' + (lab.w * 10 + 10) + ' ' + (z[0] * 10 + 5) : ''));
    $('#slBlatt').classList.toggle('geschafft', fertig);
    var gelesen = weg.map(function(q){ return lab.feld[q[0]][q[1]]; }).join(''), p = $('#slFortschritt');
    if (!p) return;
    p.className = 'sl-fortschritt nur-bildschirm' + (fertig ? ' fertig' : '');
    p.textContent = fertig ? '🎉 Geschafft! Der Satz lautet: «' + lab.satz + '»'
      : weg.length > 1 ? 'Gelesen: «' + gelesen + '» – zurückziehen löscht den Weg wieder.' : 'Starte beim Pfeil links und ziehe durch die Gänge.';
  }

  /* ---------- Werkzeuge ---------- */
  $('#slLos').addEventListener('click', erstellen);
  $('#slMischen').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#slZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#slBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#slWegWeg').addEventListener('click', function(){ if (!aktuell) return; weg = [aktuell.lab.start]; wegZeichnen(); });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#slDrucken'), function(){ return aktuell && { blaetter:[$('#slBlatt'), st.opt.mitLoesung && $('#slLoesung')], name:Labor.pdfName('Labyrinth-Loesungssatz', st.titel) }; }, function(t){ meldung('fehler', '<p>' + Labor.esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#slDrucken').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#slHerunterladen').hidden = false; }); }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .sl-weg'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#slHerunterladen').addEventListener('click', function(){
    if (!aktuell || !speicherOrt) return;
    var inhalt = sauber($('#slBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#slLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:'Labyrinth-Loesungssatz.html', data:Labor.blattDatei('Labyrinth mit Lösungssatz', inhalt, '.sl-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  info(); leer();
  try { if (st.satz.trim() && sessionStorage.getItem(TAB)) erstellen(); } catch(x){}

  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
