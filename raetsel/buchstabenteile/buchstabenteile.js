/* Rätsellabor – Generator «Buchstaben-Teile»
   Ein Satz wird – mit den Abständen zwischen den Wörtern – in gleich lange Teile geschnitten (2 bis 5 Zeichen je Teil).
   Die Teile stehen gemischt oben auf dem Blatt, darunter so viele leere Felder, wie es Teile hat. Wer die Teile in die
   richtige Reihenfolge bringt, kann den Satz wieder lesen. Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('buchstabenteile');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Satz → Zeichen (Abstände zu einem Leerzeichen zusammengefasst); gross: alles in Grossbuchstaben (ß wird SS) */
  function zeichen(text, gross){
    var t = String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    return Array.from(gross ? t.toLocaleUpperCase('de-CH') : t);
  }
  /* In Teile zu je k Zeichen schneiden; das letzte Teil wird mit null aufgefüllt (leere Kästchen, kein Abstand) */
  function teile(z, k){
    var T = [];
    for (var i = 0; i < z.length; i += k){ var t = z.slice(i, i + k); while (t.length < k) t.push(null); T.push(t); }
    return T;
  }
  /* Reihenfolge der Teile mischen: möglichst kein Teil an seinem Platz und keine zwei Teile, die auch im Satz
     aufeinander folgen, nebeneinander (sonst wäre ein Stück schon gelöst). Bestes von 300 Versuchen. → [Index, …] */
  function mischen(n, rnd){
    var best = null, bestP = Infinity;
    for (var v = 0; v < 300 && bestP > 0; v++){
      var p = []; for (var i = 0; i < n; i++) p.push(i);
      for (var j = n - 1; j > 0; j--){ var x = Math.floor(rnd() * (j + 1)), h = p[j]; p[j] = p[x]; p[x] = h; }
      var pkt = 0;
      for (var m = 0; m < n; m++){ if (p[m] === m) pkt += 2; if (m && p[m] === p[m - 1] + 1) pkt += 1; }
      if (pkt < bestP){ bestP = pkt; best = p; }
    }
    return best || [];
  }
  return { zufall:zufall, zeichen:zeichen, teile:teile, mischen:mischen };
})();
/* KERN-ENDE */

var SCHREIB = [['wie', tx('wie geschrieben')], ['gross', 'GROSSBUCHSTABEN']];
var GROESSEN = [[2, '2'], [3, '3'], [4, '4'], [5, '5']];
var SAETZE = [tx('Das ist ein Test.'), tx('Heute scheint die Sonne.'), tx('Wir gehen morgen in den Zoo.'), tx('Meine Katze schläft auf dem Sofa.'), tx('Im Herbst fallen die Blätter.'),
  tx('Der Hund bellt laut im Garten.'), tx('Lesen macht Spass.'), tx('Am Wochenende backen wir einen Kuchen.'), tx('Die Klasse singt ein Lied.'), tx('Im Wald wohnen Füchse und Rehe.'),
  tx('Der Schnee glitzert in der Sonne.'), tx('Wer findet den Schatz zuerst?'), tx('Mein Bruder spielt gerne Fussball.'), tx('Auf der Wiese blühen viele Blumen.'), tx('Nach der Schule gehen wir schwimmen.'),
  tx('Der Mond scheint hell in der Nacht.')];
function esc(t){ return Labor.esc(t); }
function chips(name, liste, label){ return '<div class="bt-chips" role="radiogroup" aria-label="' + label + '">' + liste.map(function(a){ return '<label><input type="radio" name="' + name + '" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>'; }

var VORLAGE = '<div class="bt">' +
  tx('<header class="bt-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Buchstaben-Teile</h1>') +
    tx('<p>Ein Satz ist in gleich lange Teile zerschnitten. In der richtigen Reihenfolge ergeben sie wieder den Satz.</p></header>') +
  tx('<div class="bt-layout"><section class="bt-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Satz</h2><p>Ein Satz oder mehrere – bis 200 Zeichen.</p></div></div>') +
      tx('<label class="feld-label" for="btSatz">Satz</label>') +
      '<textarea id="btSatz" class="bt-text" rows="3" maxlength="200" spellcheck="true"></textarea>' +
      tx('<div class="bt-zeile"><button type="button" class="btn klein" id="btVorschlag">Satz vorschlagen</button><span class="bt-info" id="btInfo" aria-live="polite"></span></div>') +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Teile</h2></div></div>') +
      tx('<p class="feld-label">Zeichen pro Teil (Abstände zählen mit)</p>') + chips('btGroesse', GROESSEN, tx('Zeichen pro Teil')) +
      tx('<p class="feld-label">Schreibweise</p>') + chips('btSchreib', SCHREIB, tx('Schreibweise')) +
      '<p class="hinweis" id="btTeileInfo"></p>' +
      tx('<label class="opt"><input type="checkbox" id="btLeer"><span>Abstände sichtbar machen (␣)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="btErstes"><span>Erstes Teil schon eingesetzt (leichter)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="btUnterteilt"><span>Felder für die Lösung mit Kästchen (je Zeichen eines)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="btSchneiden"><span>Zum Ausschneiden: Felder und Teile auf zwei Blättern, möglichst gross</span></label>') +
      tx('<p class="hinweis bt-einzug">Ohne Häkchen ist alles auf einem Blatt – zum Eintragen.</p>') +
    '</div>' +
  '</section>' +
  tx('<section class="bt-ausgabe" aria-label="Ergebnis">') +
    '<div id="btMeldung" aria-live="polite"></div>' +
    '<div class="bt-werkzeug">' +
      tx('<button type="button" class="btn klein" id="btZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="btNeu" title="Die Teile anders mischen">Neu mischen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="btMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="btPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="btHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="bt-blaetter"><div class="bt-rahmen"><article class="bt-blatt" id="btBlatt" hidden></article></div>' +
    '<div class="bt-rahmen" id="btTeileRahmen" hidden><article class="bt-blatt bt-seite" id="btTeileBlatt"></article></div>' +
    '<div class="bt-rahmen bt-loesung-rahmen"><article class="bt-blatt bt-loesungsblatt" id="btLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="2" y="3.5" width="9" height="6" rx="1"/><rect x="13" y="3.5" width="9" height="6" rx="1" transform="rotate(6 17.5 6.5)"/>' +
  '<path d="M2 15.5h20v5H2z"/><path d="M8.7 15.5v5M15.3 15.5v5" stroke-dasharray="1.6 1.2"/></svg>';

Labor.registriere({
  id:'buchstabenteile',
  titel:'Buchstaben-Teile',
  kurz:'Ein Satz in Teile zerschnitten – in die richtige Reihenfolge bringen',
  beschreibung:'Ein eigener Satz wird mit den Abständen in gleich lange Teile geschnitten (2 bis 5 Zeichen) und gemischt. Wer die Teile richtig in die Felder legt oder schreibt, kann den Satz wieder lesen. Mit Lösungsblatt.',
  merkmale:['Eigener Satz', 'Teile 2 bis 5 Zeichen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/buchstabenteile/buchstabenteile.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'buchstabenteile-eingaben', OPT = 'buchstabenteile-einstellungen';
  // Keine Vorauswahl bei Teilgrösse und Schreibweise; Kästchen in den Feldern angekreuzt
  var STANDARD = { k:0, schreib:'', leer:false, erstes:false, unterteilt:true, schneiden:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!GROESSEN.some(function(g){ return g[0] === +st.opt.k; })) st.opt.k = 0;
  if (!SCHREIB.some(function(a){ return a[0] === st.opt.schreib; })) st.opt.schreib = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#btMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  var warte = 0;
  $('#btSatz').value = st.satz;
  $('#btSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 200); });
  $('#btVorschlag').addEventListener('click', function(){
    var jetzt = st.satz.trim(), l = SAETZE.filter(function(t){ return t !== jetzt; });
    st.satz = l[Math.floor(Math.random() * l.length)]; $('#btSatz').value = st.satz; speichern(); zeichnen();
  });
  [].forEach.call(bereich.querySelectorAll('input[name="btGroesse"]'), function(r){
    r.checked = +r.value === +st.opt.k;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.k = +r.value; speichern(); zeichnen(); } });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="btSchreib"]'), function(r){
    r.checked = r.value === st.opt.schreib;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.schreib = r.value; speichern(); zeichnen(); } });
  });
  [['#btLeer', 'leer'], ['#btErstes', 'erstes'], ['#btUnterteilt', 'unterteilt'], ['#btSchneiden', 'schneiden'], ['#btMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#btZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#btLoesung').classList.toggle('zeigen', an); $('#btLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#btNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Zeichnen ---------- */
  var R = null;
  // Ein Teil (oben, gemischt) und ein Feld (unten, leer oder in der Lösung ausgefüllt)
  function zelle(c){ return '<span class="bt-z">' + (c === null ? '' : c === ' ' ? (st.opt.leer ? '<i class="bt-abstand">␣</i>' : '') : esc(c)) + '</span>'; }
  function teilHtml(t){ return '<span class="bt-teil">' + t.map(zelle).join('') + '</span>'; }
  function feldHtml(t, voll){ return '<span class="bt-feld' + (voll ? tx(' bt-voll') : '') + '">' + (t || new Array(+st.opt.k).fill(null)).map(zelle).join('') + '</span>'; }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, k = +o.k, z = Kern.zeichen(st.satz, o.schreib === 'gross');
    var buchst = z.filter(function(c){ return c !== ' '; }).length;
    $('#btInfo').textContent = z.length ? z.length + tx(' Zeichen (') + buchst + tx(' ohne Abstände)') : '';
    var T = k && z.length ? Kern.teile(z, k) : [];
    $('#btTeileInfo').textContent = T.length ? T.length + tx(' Teile zu je ') + k + tx(' Zeichen') + (z.length % k ? tx('; das letzte ist kürzer.') : '.') : '';
    var fehlt = !z.length ? tx('Schreib links einen Satz oder lass dir einen vorschlagen.') : !k ? tx('Wähle links, wie viele Zeichen ein Teil hat.') : !o.schreib ? tx('Wähle links die Schreibweise.') : T.length < 3 ? tx('Der Satz ist zu kurz für so grosse Teile – schreib einen längeren Satz oder nimm kleinere Teile.') : '';
    ['#btPdf', '#btHerunterladen', '#btZeigeLoesung', '#btNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ R = null; $('#btBlatt').hidden = true; $('#btBlatt').innerHTML = ''; $('#btTeileRahmen').hidden = true; $('#btLoesung').parentNode.hidden = true; meldung('info', '<p>' + fehlt + '</p>'); return; }
    meldung(''); $('#btBlatt').hidden = false; $('#btLoesung').parentNode.hidden = false;
    // Mischen; mit «erstes Teil eingesetzt» wird es aus den Teilen genommen
    var reihe = Kern.mischen(T.length, Kern.zufall(st.seed));
    if (o.erstes) reihe = reihe.filter(function(i){ return i !== 0; });
    R = { T:T, reihe:reihe };
    var anleitung = tx('Der Satz ist in Teile zu je ') + k + tx(' Zeichen zerschnitten – auch die Abstände zwischen den Wörtern sind darin. ') +
      (o.schneiden ? tx('Schneide die Teile aus (zweites Blatt), bringe sie in die richtige Reihenfolge und lege oder klebe sie in die Felder.') : tx('Bringe die Teile in die richtige Reihenfolge und schreibe sie in die Felder.')) +
      tx(' Dann kannst du den Satz lesen.') + (o.leer ? tx(' ␣ steht für einen Abstand.') : '') + (o.erstes ? tx(' Das erste Teil ist schon eingesetzt.') : '');
    var kopf = (o.titelAn ? tx('<h2>Buchstaben-Teile</h2>') : '') + (o.anleitungAn ? '<p class="bt-anleitung">' + esc(anleitung) + '</p>' : '');
    var klassen = 'bt-inhalt' + (o.unterteilt ? tx(' bt-unterteilt') : '') + (o.schneiden ? tx(' bt-schneiden') : '');
    var teileHtml = '<div class="bt-teile">' + reihe.map(function(i){ return teilHtml(T[i]); }).join('') + '</div>';
    var felderHtml = '<div class="bt-felder">' + T.map(function(t, i){ return feldHtml(o.erstes && i === 0 ? t : null, o.erstes && i === 0); }).join('') + '</div>';
    // Zum Ausschneiden: Felder auf dem ersten Blatt, die Teile auf einem eigenen zweiten; sonst beides auf einem Blatt
    $('#btBlatt').innerHTML = kopf + '<div class="' + klassen + '" style="--k:' + k + '">' + (o.schneiden ? felderHtml : teileHtml + felderHtml) + '</div>';
    $('#btTeileRahmen').hidden = !o.schneiden;
    $('#btTeileBlatt').innerHTML = o.schneiden ? (o.titelAn ? tx('<h2>Buchstaben-Teile – zum Ausschneiden</h2>') : '') +
      (o.anleitungAn ? tx('<p class="bt-anleitung">Schneide die Teile entlang der gestrichelten Linien aus.</p>') : '') + '<div class="' + klassen + '" style="--k:' + k + '">' + teileHtml + '</div>' : '';
    $('#btLoesung').innerHTML = (o.titelAn ? tx('<h2>Buchstaben-Teile – Lösung</h2>') : tx('<p class="bt-anleitung"><b>Lösung</b></p>')) +
      '<div class="' + klassen + '" style="--k:' + k + '"><div class="bt-felder">' + T.map(function(t){ return feldHtml(t, true); }).join('') + '</div></div>' +
      '<p class="bt-loesung-text">' + esc(z.join('')) + '</p>';
    passen();
  }
  /* Feldgrösse: so gross wie möglich, aber jedes Blatt bleibt eine A4-Seite (980 px hoch). Zum Eintragen höchstens 34 px
     je Zeichen; zum Ausschneiden bis 60 px (etwa 16 mm) – Felder- und Teile-Blatt gleich, damit die Teile genau passen. */
  function passen(){
    var gruppen = st.opt.schneiden ? [[$('#btBlatt'), $('#btTeileBlatt')], [$('#btLoesung')]] : [[$('#btBlatt')], [$('#btLoesung')]];
    gruppen.forEach(function(g){
      var loes = g[0] === $('#btLoesung'), versteckt = loes && !g[0].classList.contains('zeigen');
      if (versteckt) g[0].classList.add('bt-messen');
      var c = st.opt.schneiden && !loes ? 60 : 34;
      for (; c > 16; c -= 2){
        g.forEach(function(b){ b.style.setProperty('--c', c + 'px'); });
        if (g.every(function(b){ return b.offsetHeight <= 980; })) break;
      }
      g.forEach(function(b){ b.style.setProperty('--c', c + 'px'); });
      if (versteckt) g[0].classList.remove('bt-messen');
    });
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#btBlatt')].concat(st.opt.schneiden ? [$('#btTeileBlatt')] : [], st.opt.mitLoesung ? [$('#btLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function dateiname(){ return Labor.pdfName('Buchstaben-Teile', st.satz.trim().split(/\s+/).slice(0, 3).join(' ')); }
  Labor.pdfKnopf($('#btPdf'), function(){ return R && { blaetter:blaetter(), name:dateiname() }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#btPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#btHerunterladen').hidden = false; });
  }
  $('#btHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = dateiname().replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Buchstaben-Teile'), inhalt, '.bt-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
