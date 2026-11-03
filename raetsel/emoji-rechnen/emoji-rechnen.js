/* Rätsellabor – Generator «Emoji-Rechnen»
   Jedes Emoji steht für eine Zahl, gleiche Emojis haben den gleichen Wert. Aus den Hinweiszeilen findet man die Werte
   heraus und rechnet damit die letzte Zeile aus. Die Zeilen sind so gebaut, dass es genau eine Lösung gibt: jede
   Zeile bringt ein neues Emoji, alle anderen darin kennt man schon (auf «Sehr schwer» auch zwei Zeilen mit zwei
   neuen Emojis zusammen, und die Zeilen stehen gemischt). Rechnet mit Punkt vor Strich, nur natürliche Zahlen. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;   // kleine Startwerte gut durchmischen
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function wahl(a, rnd){ return a[Math.floor(rnd() * a.length)]; }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Stufen: n = Anzahl Emojis, Werte min…max, Ergebnisse höchstens ziel; erste/neue = Bauformen der Hinweiszeilen,
     schluss = Anzahl Emojis in der letzten Zeile, mitPunkt = letzte Zeile mit Mal oder Geteilt (Punkt vor Strich) */
  var STUFEN = {
    leicht:     { n:3, min:1, max:9,  ziel:20,  erste:['X+X'], neue:['X+K', 'K+X'], schluss:2, schlussOps:['+'] },
    mittel:     { n:3, min:2, max:30, ziel:100, erste:['X+X', 'X+X+X'], neue:['X+K', 'K+X', 'X−K', 'K−X', 'X+X+K', 'K+K+X'], schluss:3, schlussOps:['+', '−'] },
    schwer:     { n:[3, 4], min:2, max:12, ziel:200, erste:['X+X', 'X+X+X', 'X·X'], neue:['X+K', 'X−K', 'K−X', 'K·X', 'X·K', 'X+X+K', 'X·K+K'], schluss:3, schlussOps:['+', '−', '·'], mitPunkt:true },
    sehrschwer: { n:4, min:2, max:15, ziel:500, system:true, neue:['X+K', 'X−K', 'K·X', 'X:K', 'X·X−K', 'K·K+X', 'K·X−K'], schluss:4, schlussOps:['+', '−', '·', ':'], mitPunkt:true, gemischt:true }
  };
  var MUSTER = {
    'X+X':['X', '+', 'X'], 'X+X+X':['X', '+', 'X', '+', 'X'], 'X·X':['X', '·', 'X'],
    'X+K':['X', '+', 'K'], 'K+X':['K', '+', 'X'], 'X−K':['X', '−', 'K'], 'K−X':['K', '−', 'X'],
    'X+X+K':['X', '+', 'X', '+', 'K'], 'K+K+X':['K', '+', 'K', '+', 'X'], 'K·X':['K', '·', 'X'], 'X·K':['X', '·', 'K'],
    'X·K+K':['X', '·', 'K', '+', 'K'], 'K·X−K':['K', '·', 'X', '−', 'K'], 'X:K':['X', ':', 'K'], 'X·X−K':['X', '·', 'X', '−', 'K'], 'K·K+X':['K', '·', 'K', '+', 'X']
  };

  /* Ausdruck: [Term, Zeichen, Term, …], Term = { e:Emoji-Nummer } oder { z:Zahl }, Zeichen + − · :
     Punkt vor Strich; null, wenn eine Division nicht aufgeht oder ein Zwischenergebnis negativ wird */
  function rechne(t, w){
    function wert(x){ return x.e !== undefined ? w[x.e] : x.z; }
    var teile = [], ops = [], akt = wert(t[0]);
    for (var i = 1; i < t.length; i += 2){
      var op = t[i], b = wert(t[i + 1]);
      if (op === '·') akt *= b;
      else if (op === ':'){ if (!b || akt % b) return null; akt /= b; }
      else { teile.push(akt); ops.push(op); akt = b; }
    }
    teile.push(akt);
    var r = teile[0];
    for (var j = 0; j < ops.length; j++){ r = ops[j] === '+' ? r + teile[j + 1] : r - teile[j + 1]; if (r < 0) return null; }
    return r;
  }
  function mitPunkt(t){ return t.some(function(x){ return x === '·' || x === ':'; }) && t.some(function(x){ return x === '+' || x === '−'; }); }
  // Gleiche Zeile? (bei reinen Plus-Zeilen spielt die Reihenfolge keine Rolle)
  function schluessel(t){
    var nurPlus = t.every(function(x, i){ return i % 2 === 0 || x === '+'; });
    var terme = t.filter(function(x, i){ return i % 2 === 0; }).map(function(x){ return x.e !== undefined ? 'e' + x.e : 'z' + x.z; });
    return nurPlus ? '+' + terme.sort().join(',') : t.map(function(x){ return typeof x === 'string' ? x : x.e !== undefined ? 'e' + x.e : 'z' + x.z; }).join('');
  }
  function baue(muster, x, bekannt, rnd){ return MUSTER[muster].map(function(s){ return s === 'X' ? { e:x } : s === 'K' ? { e:wahl(bekannt, rnd) } : s; }); }

  /* Ein Rätsel. vorrat = Emojis des Themas; seed = Zufall. Ergebnis: { emojis, werte, zeilen:[{t, r}], schluss:{t, r}, punkt } */
  function raetsel(stufe, vorrat, seed){
    var st = STUFEN[stufe] || STUFEN.mittel, rnd = zufall(seed);
    for (var versuch = 0; versuch < 500; versuch++){
      var n = Array.isArray(st.n) ? wahl(st.n, rnd) : st.n, w = [];
      while (w.length < n){ var v = st.min + Math.floor(rnd() * (st.max - st.min + 1)); if (w.indexOf(v) < 0) w.push(v); }
      var zeilen = [], bekannt = [], x0 = 0, ok = true;
      if (st.system){   // zwei neue Emojis in zwei Zeilen zusammen: A + B und A − B (oder A + A + B)
        if (w[0] < w[1]){ var t0 = w[0]; w[0] = w[1]; w[1] = t0; }
        zeilen.push([{ e:0 }, '+', { e:1 }], rnd() < 0.5 ? [{ e:0 }, '−', { e:1 }] : [{ e:0 }, '+', { e:0 }, '+', { e:1 }]);
        bekannt = [0, 1]; x0 = 2;
      }
      for (var x = x0; x < n && ok; x++){
        var formen = mischen((x === 0 ? st.erste : st.neue).slice(), rnd), gefunden = null;
        for (var m = 0; m < formen.length && !gefunden; m++) for (var k = 0; k < 4 && !gefunden; k++){
          var z = baue(formen[m], x, bekannt, rnd), r = rechne(z, w);
          if (r !== null && r > 0 && r <= st.ziel) gefunden = z;
        }
        if (gefunden){ zeilen.push(gefunden); bekannt.push(x); } else ok = false;
      }
      if (!ok || zeilen.some(function(z){ var r = rechne(z, w); return r === null || r < 1 || r > st.ziel; })) continue;
      // Schlusszeile: möglichst alle Emojis, nie gleich wie eine Hinweiszeile
      var vorhanden = zeilen.map(schluessel), schluss = null;
      for (var s = 0; s < 80 && !schluss; s++){
        var reihe = mischen(bekannt.slice(), rnd).slice(0, st.schluss);
        while (reihe.length < st.schluss) reihe.push(wahl(bekannt, rnd));
        if (reihe.every(function(q){ return q === reihe[0]; })) continue;
        var t = [{ e:reihe[0] }];
        for (var i = 1; i < reihe.length; i++) t.push(wahl(st.schlussOps, rnd), { e:reihe[i] });
        if (st.mitPunkt && !mitPunkt(t)) continue;
        var rs = rechne(t, w);
        if (rs === null || rs < 1 || rs > st.ziel || vorhanden.indexOf(schluessel(t)) >= 0) continue;
        schluss = { t:t, r:rs };
      }
      if (!schluss) continue;
      var hinweise = zeilen.map(function(z){ return { t:z, r:rechne(z, w) }; });
      if (st.gemischt) mischen(hinweise, rnd);
      var emojis = mischen(vorrat.slice(), rnd).slice(0, n);
      return { stufe:stufe, emojis:emojis, werte:w, zeilen:hinweise, schluss:schluss, punkt:mitPunkt(schluss.t) || hinweise.some(function(h){ return mitPunkt(h.t); }) };
    }
    return null;
  }
  return { STUFEN:STUFEN, rechne:rechne, raetsel:raetsel, zufall:zufall };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var THEMEN = [   // Kürzel, Name, Emojis (verbreitete Emojis; keine, die sich in klein zu ähnlich sehen)
  ['fruechte', 'Früchte', ['🍎', '🍌', '🍒', '🍇', '🍓', '🍐', '🍉', '🍋', '🍍', '🥝']],
  ['tiere', 'Tiere', ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐷', '🐵']],
  ['meer', 'Meer', ['🐠', '🐙', '🦀', '🐬', '🐳', '🦈', '🐚', '🐢', '⚓', '🌊']],
  ['suesses', 'Süsses', ['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🍦', '🍯', '🍮']],
  ['gemuese', 'Gemüse', ['🥕', '🥦', '🌽', '🍅', '🥒', '🍆', '🥔', '🧅', '🌶️', '🥜']],
  ['natur', 'Natur', ['🌻', '🌳', '🍄', '🌵', '🌸', '🍀', '🌈', '🌾', '🍁', '🌷']],
  ['fahrzeuge', 'Fahrzeuge', ['🚗', '🚌', '🚲', '🚂', '🚀', '🚁', '🚜', '⛵', '🛵', '✈️']],
  ['sport', 'Sport', ['⚽', '🏀', '🎾', '🏈', '⛳', '⚾', '🏓', '🥊', '🛹', '🏸']],
  ['schule', 'Schule', ['✏️', '📚', '✂️', '📏', '🎒', '🖍️', '🎨', '📎', '🧮', '🔔']],
  ['musik', 'Musik', ['🎸', '🥁', '🎺', '🎹', '🎻', '🎷', '🎤', '🎧', '🎵', '📻']],
  ['weltall', 'Weltall', ['🚀', '🪐', '🌙', '⭐', '☀️', '👽', '🛸', '🌍', '☄️', '🛰️']],
  ['gesichter', 'Gesichter', ['😀', '😎', '🤓', '😴', '🥳', '😍', '🤠', '😇', '🤔', '😜']],
  ['gemischt', 'Gemischt', null]
];
var STUFEN_TEXT = { leicht:'Leicht', mittel:'Mittel', schwer:'Schwer', sehrschwer:'Sehr schwer' };
var VORLAGE = '<div class="em">' +
  '<header class="em-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Emoji-Rechnen</h1>' +
    '<p>Jedes Emoji steht für eine Zahl. Aus den Zeilen findet man heraus, welche – und rechnet damit die letzte Zeile aus. Vier Schwierigkeitsstufen und viele Emoji-Themen.</p></header>' +
  '<div class="em-layout"><section class="em-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Schwierigkeit</h2><p>Zahlenraum, Rechenarten und Anzahl Emojis.</p></div></div>' +
      '<div class="em-stufen" role="radiogroup" aria-label="Schwierigkeit">' +
        Object.keys(STUFEN_TEXT).map(function(k){ return '<label class="em-stufe"><input type="radio" name="emStufe" value="' + k + '"><span>' + STUFEN_TEXT[k] + '</span></label>'; }).join('') +
      '</div></div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Emoji-Thema</h2><p>Aus welchen Emojis die Rätsel bestehen.</p></div></div>' +
      '<div class="em-themen" role="radiogroup" aria-label="Emoji-Thema">' +
        THEMEN.map(function(t){ return '<label><input type="radio" name="emThema" value="' + t[0] + '"><span><i aria-hidden="true">' + (t[2] ? t[2].slice(0, 3).join('') : '🍎🐶⚽') + '</i>' + t[1] + '</span></label>'; }).join('') +
      '</div></div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<div class="opt-raster"><label for="emAnzahl">Rätsel pro Blatt</label><select id="emAnzahl"><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="6">6</option></select></div>' +
      '<label class="opt"><input type="checkbox" id="emHilfe"><span>Hilfsfelder für die Werte der Emojis (🍎 = …)</span></label>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="emTitel">Titel auf dem Blatt</label><input type="text" id="emTitel" maxlength="60" autocomplete="off"></div>' +
    '</details></div>' +
  '</section>' +
  '<section class="em-ausgabe" aria-label="Ergebnis">' +
    '<div id="emMeldung" aria-live="polite"></div>' +
    '<div class="em-werkzeug">' +
      '<button type="button" class="btn klein" id="emNeu" title="Gleiche Einstellungen, neue Rätsel">Neue Rätsel</button>' +
      '<button type="button" class="btn klein" id="emZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="emLeeren">Eingaben löschen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="emMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="emPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="emHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="em-blatt" id="emBlatt"></article>' +
    '<article class="em-blatt em-loesungsblatt" id="emLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="7" cy="7" r="4"/><path d="M5.6 8.4c.8.8 2 .8 2.8 0"/><path d="M14 7h7M17.5 3.5v7M14 16h7M14 20h7M4 15l6 6M10 15l-6 6"/></svg>';

Labor.registriere({
  id:'emoji-rechnen',
  titel:'Emoji-Rechnen',
  kurz:'Rechenrätsel, in denen Emojis für Zahlen stehen',
  beschreibung:'Jedes Emoji steht für eine Zahl: Aus den Zeilen findet man die Werte heraus und rechnet die letzte Zeile aus. Vom Zahlenraum 20 bis zu allen vier Grundoperationen, mit vielen Emoji-Themen.',
  merkmale:['Vier Schwierigkeitsstufen', 'Emoji-Themen wählbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/emoji-rechnen/emoji-rechnen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'emoji-rechnen-eingaben', OPT = 'emoji-rechnen-einstellungen';
  var STANDARD = { stufe:'leicht', thema:'fruechte', anzahl:2, hilfe:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { titel:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#emMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var raetsel = [];

  /* ---------- Eingaben ---------- */
  function radios(name, schluessel){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[schluessel];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[schluessel] = r.value; speichern(); erzeugen(); });
    });
  }
  radios('emStufe', 'stufe'); radios('emThema', 'thema');
  $('#emAnzahl').value = String(st.opt.anzahl);
  $('#emAnzahl').addEventListener('change', function(){ st.opt.anzahl = +this.value; speichern(); erzeugen(); });
  $('#emHilfe').checked = st.opt.hilfe;
  $('#emHilfe').addEventListener('change', function(){ st.opt.hilfe = this.checked; speichern(); zeichnen(); });
  $('#emTitel').value = st.titel;
  $('#emTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); });
  $('#emMitLoesung').checked = st.opt.mitLoesung;
  $('#emMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });

  /* ---------- Rätsel erzeugen ---------- */
  function vorrat(thema, rnd){
    var t = THEMEN.filter(function(x){ return x[0] === thema; })[0] || THEMEN[0];
    if (t[2]) return t[2];
    var alle = []; THEMEN.forEach(function(x){ if (x[2]) alle = alle.concat(x[2]); });   // gemischt: aus allen Themen
    return alle.filter(function(x, i){ return alle.indexOf(x) === i; });
  }
  function erzeugen(){
    raetsel = [];
    for (var i = 0; i < st.opt.anzahl; i++){
      var r = null;
      for (var v = 0; v < 5 && !r; v++) r = Kern.raetsel(st.opt.stufe, vorrat(st.opt.thema), st.seed + i * 7919 + v * 104729);
      if (r) raetsel.push(r);
    }
    $('#emZeigeLoesung').setAttribute('aria-pressed', 'false');
    zeichnen();
  }

  /* ---------- Zeichnen ---------- */
  function term(t, r){
    return t.map(function(x){ return typeof x === 'string' ? '<span class="em-op">' + x + '</span>' : x.e !== undefined ? '<span class="em-e">' + r.emojis[x.e] + '</span>' : '<span class="em-z">' + x.z + '</span>'; }).join('');
  }
  function raetselHtml(r, i, loesung){
    var n = raetsel.length, h = '<section class="em-raetsel" data-i="' + i + '">' + (n > 1 ? '<span class="em-nr">' + (i + 1) + '</span>' : '') + '<div class="em-zeilen">';
    r.zeilen.forEach(function(z){ h += '<span class="em-term">' + term(z.t, r) + '</span><span class="em-gleich">=</span><span class="em-wert">' + z.r + '</span>'; });
    h += '<span class="em-term em-schluss">' + term(r.schluss.t, r) + '</span><span class="em-gleich">=</span><span class="em-wert"><span class="em-frage">' +
      (loesung ? '<b>' + r.schluss.r + '</b>' : '<input type="text" class="em-antwort nur-bildschirm" size="3" maxlength="4" inputmode="numeric" autocomplete="off" aria-label="Ergebnis von Rätsel ' + (i + 1) + '"><span class="em-loes">' + r.schluss.r + '</span>') + '</span></span></div>';
    if (st.opt.hilfe || loesung){
      h += '<div class="em-hilfe">' + r.emojis.map(function(em, k){
        return '<span class="em-h"><span class="em-e">' + em + '</span><span class="em-ist">=</span><span class="em-hfeld">' +
          (loesung ? '<b>' + r.werte[k] + '</b>' : '<input type="text" class="em-wertfeld nur-bildschirm" size="3" maxlength="4" data-k="' + k + '" inputmode="numeric" autocomplete="off" aria-label="Wert von ' + em + ' in Rätsel ' + (i + 1) + '"><span class="em-loes">' + r.werte[k] + '</span>') + '</span></span>';
      }).join('') + '</div>';
    }
    if (!loesung) h += '<p class="em-status nur-bildschirm" aria-live="polite"></p>';
    return h + '</section>';
  }
  function anleitung(){
    var punkt = raetsel.some(function(r){ return r.punkt; }), gemischt = st.opt.stufe === 'sehrschwer';
    return 'Jedes Emoji steht für eine Zahl – gleiche Emojis haben immer den gleichen Wert. Finde die Zahlen heraus und rechne die letzte Zeile aus.' +
      (punkt ? ' Denk an «Punkt vor Strich»!' : '') + (gemischt ? ' Tipp: Beginne bei der Zeile, die du schon lösen kannst.' : '') +
      (st.opt.hilfe ? ' Schreibe die Werte der Emojis in die Felder.' : '');
  }
  function zeichnen(){
    var blatt = $('#emBlatt'), loes = $('#emLoesung'), o = st.opt, titel = st.titel.trim() || 'Emoji-Rechnen', klasse = 'em-raster pro-' + raetsel.length;
    blatt.classList.remove('zeige-loesung');
    if (!raetsel.length){ blatt.innerHTML = ''; meldung('fehler', '<p>Es konnte kein Rätsel erstellt werden. Klicke auf «Neue Rätsel».</p>'); return; }
    meldung('', '');
    blatt.innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') + (o.anleitungAn ? '<p class="em-anleitung">' + anleitung() + '</p>' : '') +
      '<div class="' + klasse + '">' + raetsel.map(function(r, i){ return raetselHtml(r, i, false); }).join('') + '</div>';
    loes.innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><div class="' + klasse + '">' + raetsel.map(function(r, i){ return raetselHtml(r, i, true); }).join('') + '</div>';
    $('#emZeigeLoesung').setAttribute('aria-pressed', 'false');
    pruefenVerbinden();
  }

  /* ---------- Am Bildschirm lösen: Ergebnis und Werte eintippen, richtige werden grün ---------- */
  function pruefenVerbinden(){
    [].forEach.call($('#emBlatt').querySelectorAll('.em-raetsel'), function(sec){
      var r = raetsel[+sec.dataset.i], status = sec.querySelector('.em-status');
      function zahl(inp){ var t = inp.value.replace(/\D/g, ''); if (t !== inp.value) inp.value = t; return t === '' ? null : +t; }
      [].forEach.call(sec.querySelectorAll('.em-wertfeld'), function(inp){
        inp.addEventListener('input', function(){ var v = zahl(inp); inp.parentNode.classList.toggle('richtig', v === r.werte[+inp.dataset.k]); inp.parentNode.classList.toggle('falsch', v !== null && v !== r.werte[+inp.dataset.k]); });
      });
      var a = sec.querySelector('.em-antwort');
      a.addEventListener('input', function(){
        var v = zahl(a), ok = v === r.schluss.r;
        a.parentNode.classList.toggle('richtig', ok); a.parentNode.classList.toggle('falsch', v !== null && !ok);
        status.textContent = ok ? '🎉 Richtig!' : v !== null && String(v).length >= String(r.schluss.r).length ? 'Noch nicht – prüfe deine Werte.' : '';
        status.classList.toggle('fertig', ok);
      });
    });
  }

  /* ---------- Werkzeuge ---------- */
  $('#emNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erzeugen(); });
  $('#emZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#emBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#emLeeren').addEventListener('click', function(){ zeichnen(); });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#emPdf'), function(){ return raetsel.length && { blaetter:[$('#emBlatt'), st.opt.mitLoesung && $('#emLoesung')], name:Labor.pdfName('Emoji-Rechnen', st.titel) }; },
    function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#emPdf').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#emHerunterladen').hidden = false; }); }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .em-loes'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('.richtig, .falsch'), function(n){ n.classList.remove('richtig', 'falsch'); });
    return k;
  }
  $('#emHerunterladen').addEventListener('click', function(){
    if (!raetsel.length || !speicherOrt) return;
    var inhalt = sauber($('#emBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#emLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:Labor.pdfName('Emoji-Rechnen', st.titel).replace(/\.pdf$/, '.html'), data:Labor.blattDatei('Emoji-Rechnen', inhalt, '.em-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  erzeugen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
