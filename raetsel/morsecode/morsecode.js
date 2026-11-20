/* Rätsellabor – Generator «Morsecode»
   Ein Text wird zu Morsecode: kurze und lange Töne. Am Bildschirm abspielen (das gerade klingende Zeichen ist markiert)
   und als MP3 herunterladen. Zeiten nach dem üblichen Mass: kurz = 1 Einheit, lang = 3, Pause im Zeichen 1, zwischen
   Zeichen 3, zwischen Wörtern 7; die Einheit kommt aus dem Tempo (Wörter pro Minute, 1200 ms / Tempo). Zum Mitschreiben
   auf Wunsch längere Pausen zwischen Zeichen und Wörtern. Arbeitsblatt: Kästchen für jedes Zeichen, auf Wunsch der Code
   zum Lesen und das Morsealphabet; Lösungsblatt. MP3 mit lamejs (LAME, LGPL-3.0, gemeinsam/extern/lame.min.js, erst beim
   Herunterladen geladen). */
(function(){
'use strict';
var tx = Labor.uebersetzer('morsecode');

/* KERN-START */
var Kern = (function(){
  // Internationales Morsealphabet, dazu Ä, Ö, Ü, CH und gängige Satzzeichen
  var CODE = {
    A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--',
    N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
    '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
    'Ä':'.-.-', 'Ö':'---.', 'Ü':'..--', 'CH':'----',
    '.':'.-.-.-', ',':'--..--', '?':'..--..', '!':'-.-.--', '-':'-....-', '/':'-..-.', ':':'---...', "'":'.----.', '(':'-.--.', ')':'-.--.-',
    '=':'-...-', '+':'.-.-.', '@':'.--.-.', '"':'.-..-.'
  };
  /* Text → Wörter aus Zeichen (Grossbuchstaben; ß → SS; CH bleibt ein Zeichen, wenn gewünscht) → { woerter:[[…]], weg } */
  function lesen(text, mitCH){
    var t = String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/ẞ|ß/g, 'SS').replace(/[«»“”„]/g, '"').replace(/[‘’‚]/g, "'"), weg = [];
    var woerter = t.split(/\s+/).filter(Boolean).map(function(w){
      var z = [], i = 0;
      while (i < w.length){
        if (mitCH && w.substr(i, 2) === 'CH'){ z.push('CH'); i += 2; continue; }
        var c = w.charAt(i);
        if (CODE[c]) z.push(c); else if (weg.indexOf(c) < 0) weg.push(c);
        i++;
      }
      return z;
    }).filter(function(w){ return w.length; });
    return { woerter:woerter, weg:weg };
  }
  /* Ablauf in Einheiten: Töne (kurz 1, lang 3), Pausen im Zeichen 1, zwischen Zeichen 3·dehnung, zwischen Wörtern 7·dehnung.
     → { toene:[{ an, dauer }], zeichen:[{ an, ende, z }], laenge } (alles in Einheiten, Beginn bei 0) */
  function ablauf(woerter, dehnung){
    dehnung = dehnung || 1;
    var t = 0, toene = [], zeichen = [];
    woerter.forEach(function(w, wi){
      if (wi) t += 7 * dehnung - 3 * dehnung;   // Wortpause: aus der Zeichenpause (unten) auf 7 ergänzen
      w.forEach(function(c, ci){
        if (ci || wi) t += 3 * dehnung;
        var an = t;
        CODE[c].split('').forEach(function(s, si){ if (si) t += 1; var d = s === '.' ? 1 : 3; toene.push({ an:t, dauer:d }); t += d; });
        zeichen.push({ an:an, ende:t, z:c, wort:wi });
      });
    });
    return { toene:toene, zeichen:zeichen, laenge:t };
  }
  /* Ton als Abtastwerte (Float32): einheit in Sekunden, frequenz in Hz, rate Abtastrate; vorne und hinten Stille,
     mehrmals mit Pause dazwischen. Weiche Flanken (5 ms), damit es nicht knackst. → { werte, einsaetze (Startzeit jeder Wiederholung) } */
  function ton(ab, einheit, frequenz, rate, wiederholen, pause){
    var vorne = 0.6, hinten = 0.6, eine = ab.laenge * einheit, gesamt = vorne + wiederholen * eine + (wiederholen - 1) * pause + hinten;
    var n = Math.ceil(gesamt * rate), werte = new Float32Array(n), flanke = Math.round(0.005 * rate), einsaetze = [];
    for (var w = 0; w < wiederholen; w++){
      var start = vorne + w * (eine + pause); einsaetze.push(start);
      ab.toene.forEach(function(tn){
        var a = Math.round((start + tn.an * einheit) * rate), l = Math.round(tn.dauer * einheit * rate);
        for (var i = 0; i < l && a + i < n; i++){
          var h = Math.min(1, i / flanke, (l - 1 - i) / flanke);
          werte[a + i] = 0.6 * h * Math.sin(2 * Math.PI * frequenz * i / rate);
        }
      });
    }
    return { werte:werte, einsaetze:einsaetze, dauer:gesamt };
  }
  function int16(werte){ var a = new Int16Array(werte.length); for (var i = 0; i < werte.length; i++) a[i] = Math.max(-32767, Math.min(32767, Math.round(werte[i] * 32767))); return a; }
  return { CODE:CODE, lesen:lesen, ablauf:ablauf, ton:ton, int16:int16 };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', RATE = 22050, MAX = 300;
var TEMPI = [[5, tx('sehr langsam')], [8, 'langsam'], [12, 'mittel'], [16, tx('zügig')], [20, 'schnell']];
function esc(t){ return Labor.esc(t); }
function zeigeCode(c){ return c.replace(/\./g, '·').replace(/-/g, '−'); }

var VORLAGE = '<div class="mc">' +
  tx('<header class="mc-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Morsecode</h1>') +
    tx('<p>Ein Text als kurze und lange Töne – anhören, mitschreiben, als MP3 herunterladen.</p></header>') +
  tx('<div class="mc-layout"><section class="mc-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Text</h2><p>Buchstaben, Ziffern und Satzzeichen – bis 300 Zeichen.</p></div></div>') +
      tx('<label class="feld-label" for="mcText">Text</label>') +
      '<textarea id="mcText" class="mc-text" rows="3" maxlength="300" spellcheck="true"></textarea>' +
      tx('<label class="opt"><input type="checkbox" id="mcCH"><span>CH als eigenes Zeichen (− − − −)</span></label>') +
      '<div class="mc-zaehler" id="mcZaehler" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Ton</h2></div></div>') +
      tx('<label class="feld-label" for="mcTempo">Tempo: <b id="mcTempoWert"></b></label>') +
      '<input type="range" id="mcTempo" min="4" max="25" step="1">' +
      tx('<label class="opt"><input type="checkbox" id="mcPausen"><span>Längere Pausen zwischen Zeichen und Wörtern (zum Mitschreiben)</span></label>') +
      tx('<label class="feld-label" for="mcHoehe">Tonhöhe: <b id="mcHoeheWert"></b></label>') +
      '<input type="range" id="mcHoehe" min="400" max="1000" step="10">' +
      tx('<label class="feld-label" for="mcWdh">Ganze Nachricht abspielen</label>') +
      tx('<select id="mcWdh" class="mc-wahl"><option value="1">1 ×</option><option value="2">2 × (mit Pause dazwischen)</option><option value="3">3 × (mit Pause dazwischen)</option></select>') +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Arbeitsblatt</h2></div></div>') +
      tx('<label class="opt"><input type="checkbox" id="mcCodeZeigen"><span>Morsecode auf dem Blatt (zum Lesen statt Hören)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="mcTabelle"><span>Morsealphabet als Tabelle</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="mc-ausgabe" aria-label="Ergebnis">') +
    '<div id="mcMeldung" aria-live="polite"></div>' +
    '<div class="karte mc-spieler nur-bildschirm" id="mcSpieler">' +
      tx('<div class="mc-knoepfe"><button type="button" class="btn primary" id="mcSpielen">▶ Abspielen</button><button type="button" class="btn" id="mcStopp" disabled>■ Stopp</button>') +
      tx('<button type="button" class="btn" id="mcMp3">MP3 herunterladen</button><span class="mc-dauer" id="mcDauer"></span></div>') +
      '<div class="mc-band" id="mcBand" aria-live="off"></div>' +
      tx('<p class="mc-notiz">MP3 mit <a href="https://lame.sourceforge.net" target="_blank" rel="noopener">LAME</a> (lamejs, LGPL-3.0).</p>') +
    '</div>' +
    '<div class="mc-werkzeug">' +
      tx('<button type="button" class="btn klein" id="mcZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="mcMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="mcPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="mcHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="mc-blaetter"><div class="mc-rahmen"><article class="mc-blatt" id="mcBlatt"></article></div>' +
    '<div class="mc-rahmen mc-loesung-rahmen"><article class="mc-blatt mc-loesungsblatt" id="mcLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M3 8h0M7 8h6M17 8h0M3 16h6M13 16h0M17 16h4"/></svg>';

Labor.registriere({
  id:'morsecode',
  titel:'Morsecode',
  kurz:'Text als kurze und lange Töne – anhören und als MP3',
  beschreibung:'Ein eigener Text wird zu Morsecode: am Bildschirm abspielen (mit Mitlese-Markierung) und als MP3 herunterladen. Tempo, Tonhöhe, längere Pausen zum Mitschreiben. Arbeitsblatt mit Kästchen und Morsealphabet, Lösungsblatt.',
  merkmale:['Töne zum Anhören', 'MP3 herunterladen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/morsecode/morsecode.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'morsecode-eingaben', OPT = 'morsecode-einstellungen';
  var STANDARD = { tempo:8, hoehe:650, pausen:true, wdh:1, ch:false, codeZeigen:false, tabelle:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e) st.text = String(e.text || ''); } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#mcMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  $('#mcText').value = st.text;
  var warte = 0;
  $('#mcText').addEventListener('input', function(){ st.text = this.value; speichern(); stopp(); clearTimeout(warte); warte = setTimeout(zeichnen, 250); });
  function tempoText(){ var n = st.opt.tempo, w = TEMPI.filter(function(t){ return n >= t[0]; }).pop(); return n + tx(' Wörter pro Minute (') + (w ? w[1] : tx('sehr langsam')) + ')'; }
  $('#mcTempo').value = st.opt.tempo; $('#mcHoehe').value = st.opt.hoehe; $('#mcWdh').value = String(st.opt.wdh);
  $('#mcTempo').addEventListener('input', function(){ st.opt.tempo = +this.value; speichern(); stopp(); zeichnen(); });
  $('#mcHoehe').addEventListener('input', function(){ st.opt.hoehe = +this.value; speichern(); stopp(); zeichnen(); });
  $('#mcWdh').addEventListener('change', function(){ st.opt.wdh = +this.value; speichern(); stopp(); zeichnen(); });
  [['#mcPausen', 'pausen'], ['#mcCH', 'ch'], ['#mcCodeZeigen', 'codeZeigen'], ['#mcTabelle', 'tabelle'], ['#mcMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung'){ stopp(); zeichnen(); } });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#mcZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#mcLoesung').classList.toggle('zeigen', an); $('#mcLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });

  /* ---------- Berechnen und Zeichnen ---------- */
  var R = null;
  function berechnen(){
    var L = Kern.lesen(st.text, st.opt.ch);
    if (!L.woerter.length) return { L:L };
    var ab = Kern.ablauf(L.woerter, st.opt.pausen ? 2 : 1), einheit = 1.2 / st.opt.tempo;
    return { L:L, ab:ab, einheit:einheit, ton:Kern.ton(ab, einheit, st.opt.hoehe, RATE, st.opt.wdh, 2.5) };
  }
  function band(){
    var html = '', k = 0;
    R.L.woerter.forEach(function(w){
      html += '<span class="mc-wort">' + w.map(function(c){ return '<span class="mc-zeichen" data-k="' + (k++) + '"><b>' + esc(c) + '</b><i>' + zeigeCode(Kern.CODE[c]) + '</i></span>'; }).join('') + '</span>';
    });
    $('#mcBand').innerHTML = html;
  }
  function tabelleHtml(){
    var l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').concat(['Ä', 'Ö', 'Ü']).concat(st.opt.ch ? ['CH'] : []);
    // dazu die Satzzeichen, die im Text vorkommen
    R.L.woerter.forEach(function(w){ w.forEach(function(c){ if (l.indexOf(c) < 0) l.push(c); }); });
    return '<div class="mc-tabelle">' + l.map(function(c){ return '<span><b>' + esc(c) + '</b><i>' + zeigeCode(Kern.CODE[c]) + '</i></span>'; }).join('') + '</div>';
  }
  function zeichnen(){
    if (aus) return;
    $('#mcTempoWert').textContent = tempoText(); $('#mcHoeheWert').textContent = st.opt.hoehe + ' Hz';
    var r = berechnen(), h = '';
    if (r.L.weg.length) h += '<p class="warnung">' + esc(r.L.weg.join(' ')) + tx(' gibt es im Morsealphabet nicht – fällt weg.</p>');
    var n = r.L.woerter.reduce(function(a, w){ return a + w.length; }, 0);
    if (n) h += '<p class="mc-info">' + n + tx(' Zeichen in ') + r.L.woerter.length + (r.L.woerter.length === 1 ? tx(' Wort.') : tx(' Wörtern.')) + '</p>';
    $('#mcZaehler').innerHTML = h;
    var leer = !n;
    ['#mcPdf', '#mcHerunterladen', '#mcZeigeLoesung', '#mcSpielen', '#mcMp3'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ R = null; $('#mcSpieler').hidden = true; $('#mcBlatt').parentNode.hidden = true; $('#mcLoesung').parentNode.hidden = true; meldung('info', tx('<p>Schreibe links einen Text.</p>')); return; }
    R = r; meldung(''); $('#mcSpieler').hidden = false; $('#mcBlatt').parentNode.hidden = false; $('#mcLoesung').parentNode.hidden = false;
    var s = Math.round(r.ton.dauer); $('#mcDauer').textContent = tx('Dauer: ') + (s >= 60 ? Math.floor(s / 60) + tx(' min ') + (s % 60) + ' s' : s + ' s');
    band();
    var o = st.opt;
    var anleitung = o.codeZeigen ? tx('Übersetze den Morsecode: · ist kurz, − ist lang. Schreibe jedes Zeichen in ein Kästchen.') :
      tx('Hör dir die Aufnahme an: kurze und lange Töne. Schreibe jedes Zeichen in ein Kästchen.') + (o.wdh > 1 ? tx(' Die Nachricht kommt ') + o.wdh + tx('-mal.') : '');
    var woerter = r.L.woerter.map(function(w){
      return '<span class="mc-blattwort">' + w.map(function(c){ return '<span class="mc-feld">' + (o.codeZeigen ? '<i>' + zeigeCode(Kern.CODE[c]) + '</i>' : '') + '<span class="mc-kaestchen"></span></span>'; }).join('') + '</span>';
    }).join('');
    $('#mcBlatt').innerHTML = (o.titelAn ? tx('<h2>Morsecode</h2>') : '') + (o.anleitungAn ? '<p class="mc-anleitung">' + esc(anleitung) + '</p>' : '') +
      '<div class="mc-woerter">' + woerter + '</div>' + (o.tabelle ? tx('<h3 class="mc-tabtitel">Morsealphabet</h3>') + tabelleHtml() : '');
    var loes = r.L.woerter.map(function(w){
      return '<span class="mc-blattwort">' + w.map(function(c){ return '<span class="mc-feld"><i>' + zeigeCode(Kern.CODE[c]) + '</i><span class="mc-kaestchen">' + esc(c) + '</span></span>'; }).join('') + '</span>';
    }).join('');
    $('#mcLoesung').innerHTML = (o.titelAn ? tx('<h2>Morsecode – Lösung</h2>') : tx('<p class="mc-anleitung"><b>Lösung</b></p>')) + '<div class="mc-woerter">' + loes + '</div>' +
      '<p class="mc-loesung-text">' + esc(r.L.woerter.map(function(w){ return w.join(''); }).join(' ')) + '</p>';
  }

  /* ---------- Abspielen (Web Audio), Mitlese-Markierung ---------- */
  var ctx = null, quelle = null, start = 0, rahmen = 0;
  function stopp(){
    if (quelle){ try { quelle.stop(); } catch(x){} quelle = null; }
    cancelAnimationFrame(rahmen); [].forEach.call(bereich.querySelectorAll('.mc-zeichen.an'), function(e){ e.classList.remove('an'); });
    $('#mcSpielen').disabled = !R; $('#mcStopp').disabled = true;
  }
  function markieren(){
    if (!quelle || !R) return;
    var t = ctx.currentTime - start, ab = R.ab, k = -1;
    R.ton.einsaetze.forEach(function(s0){ var u = (t - s0) / R.einheit; ab.zeichen.forEach(function(z, i){ if (u >= z.an - 0.5 && u < z.ende + 1.5) k = i; }); });
    [].forEach.call(bereich.querySelectorAll('.mc-zeichen'), function(e){ e.classList.toggle('an', +e.getAttribute('data-k') === k); });
    rahmen = requestAnimationFrame(markieren);
  }
  $('#mcSpielen').addEventListener('click', function(){
    if (!R) return;
    stopp();
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC){ meldung('warnung', tx('<p>Dieser Browser kann keine Töne abspielen.</p>')); return; }
    if (!ctx) ctx = new AC();
    if (ctx.resume) ctx.resume();
    var puffer = ctx.createBuffer(1, R.ton.werte.length, RATE);
    puffer.copyToChannel ? puffer.copyToChannel(R.ton.werte, 0) : puffer.getChannelData(0).set(R.ton.werte);
    quelle = ctx.createBufferSource(); quelle.buffer = puffer; quelle.connect(ctx.destination);
    quelle.onended = function(){ if (quelle && quelle.buffer === puffer) stopp(); };
    start = ctx.currentTime + 0.05; quelle.start(start);
    $('#mcSpielen').disabled = true; $('#mcStopp').disabled = false;
    markieren();
  });
  $('#mcStopp').addEventListener('click', stopp);

  /* ---------- MP3 ---------- */
  var lame = null;
  function ladeLame(){
    if (window.lamejs) return Promise.resolve();
    if (!lame) lame = new Promise(function(ok, fehler){
      var s = document.createElement('script'); s.src = 'gemeinsam/extern/lame.min.js';
      s.onload = function(){ ok(); }; s.onerror = function(){ lame = null; fehler(new Error('Der MP3-Baustein konnte nicht geladen werden.')); };
      document.head.appendChild(s);
    });
    return lame;
  }
  function mp3(){
    var enc = new window.lamejs.Mp3Encoder(1, RATE, 64), pcm = Kern.int16(R.ton.werte), teile = [], BLOCK = 1152;
    for (var i = 0; i < pcm.length; i += BLOCK){ var b = enc.encodeBuffer(pcm.subarray(i, i + BLOCK)); if (b.length) teile.push(new Uint8Array(b)); }
    var f = enc.flush(); if (f.length) teile.push(new Uint8Array(f));
    return new Blob(teile, { type:'audio/mpeg' });
  }
  function dateiName(){ var w = R.L.woerter.map(function(x){ return x.join(''); }).join('-').replace(/[^A-Z0-9ÄÖÜ-]/gi, '').slice(0, 30); return tx('Morsecode-') + (w || tx('Nachricht')) + '.mp3'; }
  var speicherOrt = null;
  $('#mcMp3').addEventListener('click', function(){
    if (!R) return;
    var knopf = this; knopf.disabled = true; knopf.textContent = tx('MP3 wird erstellt …');
    ladeLame().then(function(){
      var blob = mp3(), name = dateiName();
      if (speicherOrt) return speicherOrt.save({ filename:name, data:blob });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }).catch(function(e){ if (!(e && e.code === 'declined')) meldung('fehler', '<p>' + esc(e && e.message || tx('Die MP3-Datei konnte nicht erstellt werden.')) + '</p>'); })
      .then(function(){ knopf.disabled = !R; knopf.textContent = tx('MP3 herunterladen'); });
  });

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#mcBlatt')].concat(st.opt.mitLoesung ? [$('#mcLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#mcPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Morsecode', '') }; }, fehler);
  if (Labor.imArtefakt()){
    $('#mcPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#mcHerunterladen').hidden = false; });
  }
  $('#mcHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Morsecode', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Morsecode'), inhalt, '.mc-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stoppAlles(){ aus = true; stopp(); if (timer) speichernJetzt(); clearTimeout(warte); if (ctx && ctx.close) ctx.close(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
