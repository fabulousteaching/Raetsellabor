/* Rätsellabor – Generator «Gegenlicht-Rätsel»
   Ein eigener Text; die Lehrperson tippt Wörter an und markiert sie so. Auf der Rückseite des Blatts steht genau hinter
   jedem markierten Wort ein Zeichen (Zahl, Buchstabe, eigenes Zeichen, Punkt, Stern oder Kreis). Hält man das Blatt
   gegen das Licht, scheint das Zeichen durch, und man sieht, welche Wörter markiert sind.
   Die Rückseite ist eine Kopie der Vorderseite – gleicher Text, gleiche Schrift, gleicher Umbruch –, aber alles
   unsichtbar (visibility:hidden) ausser den Zeichen, und waagrecht gespiegelt (beidseitig drucken, «an der langen Kante
   wenden»). So liegt jedes Zeichen genau hinter seinem Wort, ohne dass etwas gemessen werden muss; beide Seiten sind
   gleich hoch und stehen im PDF gleich gross und gleich weit oben. Blatt 703 px breit (= 186 mm im PDF). */
(function(){
'use strict';
var tx = Labor.uebersetzer('gegenlicht');
function esc(s){ return Labor.esc(String(s)); }

/* KERN-START */
var Kern = (function(){
  /* Text → Zeilen → Gruppen (alles zwischen zwei Leerräumen) → Stücke { t, w (Wort), nr, key }.
     Satzzeichen am Rand gehören nicht zum Wort: «(Haus),» → «(» «Haus» «),». key: Wort klein + «#» + wievieltes
     gleiches Wort – so bleiben Markierungen erhalten, wenn man den Text weiter bearbeitet. */
  function zerlege(text){
    var nr = 0, anz = {};
    return String(text || '').replace(/\r\n?/g, '\n').split('\n').map(function(zeile){
      return zeile.split(/\s+/).filter(Boolean).map(function(teil){
        var m = teil.match(/^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u), g = [];
        if (!m || !m[2]){ g.push({ t:teil }); return g; }
        if (m[1]) g.push({ t:m[1] });
        var k = m[2].toLocaleLowerCase('de-CH');
        anz[k] = (anz[k] || 0) + 1;
        g.push({ t:m[2], w:true, nr:nr++, key:k + '#' + anz[k] });
        if (m[3]) g.push({ t:m[3] });
        return g;
      });
    });
  }
  function woerter(zeilen){ var l = []; zeilen.forEach(function(z){ z.forEach(function(g){ g.forEach(function(s){ if (s.w) l.push(s); }); }); }); return l; }
  // A, B … Z, AA, AB …
  function buchstabe(i){ var s = ''; i++; while (i > 0){ var r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; }
  /* Zeichen für die markierten Wörter in Lesereihenfolge. eigene: Text, ein Zeichen pro Wort (Leerzeichen zählen nicht);
     fehlt eines, kommt «?» */
  function zeichenListe(art, n, eigene){
    var e = Array.from(String(eigene || '').replace(/\s+/g, '')), l = [];
    for (var i = 0; i < n; i++) l.push(art === 'zahlen' ? String(i + 1) : art === 'buchstaben' ? buchstabe(i) : art === 'eigene' ? (e[i] || '?') : art === 'punkt' ? '●' : art === 'stern' ? '★' : '');
    return l;
  }
  // Zufall mit Startwert (für die bunten Farben)
  function zufall(seed){ var s = (seed >>> 0) || 1; return function(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  /* Kräftige Farben, die gut drucken; bunt: jedes Wort zufällig, nie gleich wie die beiden davor */
  var FARBEN = { schwarz:'#1C2530', blau:'#1555A8', rot:'#B71C1C', gruen:'#1B6E2A', violett:'#5E2390' };
  var BUNT = ['#C62828', '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00838F', '#AD1457', '#5D4037', '#283593', '#827717'];
  function buntFarben(n, seed){
    var r = zufall(seed), l = [];
    for (var i = 0; i < n; i++){
      var f; do { f = BUNT[Math.floor(r() * BUNT.length)]; } while (f === l[i - 1] || f === l[i - 2]);
      l.push(f);
    }
    return l;
  }
  return { zerlege:zerlege, woerter:woerter, buchstabe:buchstabe, zeichenListe:zeichenListe, buntFarben:buntFarben, FARBEN:FARBEN, BUNT:BUNT };
})();
/* KERN-ENDE */

var BEISPIELE = {
  de:{ text:'Lina und Max spielen im Garten. Der Hund bellt laut, und die Katze schläft auf dem Dach. Plötzlich finden die Kinder eine alte Karte. Sie zeigt den Weg zum Schatz. Er liegt unter dem grossen Baum hinter dem Haus.',
    marks:['schatz#1', 'liegt#1', 'unter#1', 'dem#2', 'baum#1'] },
  en:{ text:'Lina and Max are playing in the garden. The dog barks loudly and the cat sleeps on the roof. Suddenly the children find an old map. It shows the way to the treasure. It is buried under the big tree behind the house.',
    marks:['treasure#1', 'is#1', 'under#1', 'the#8', 'tree#1'] },
  fr:{ text:'Lina et Max jouent dans le jardin. Le chien aboie fort et le chat dort sur le toit. Soudain, les enfants trouvent une vieille carte. Elle montre le chemin du trésor. Il est caché sous le grand arbre derrière la maison.',
    marks:['trésor#1', 'est#1', 'sous#1', 'le#6', 'grand#1', 'arbre#1'] }
};
var ZEICHEN = [['zahlen', tx('Zahlen'), '1 2 3', tx('zeigen auch die Reihenfolge')], ['buchstaben', tx('Buchstaben'), 'A B C', tx('der Reihe nach')],
  ['eigene', tx('Eigene Zeichen'), 'S O S', tx('z. B. ein Lösungswort')], ['punkt', tx('Punkt'), '●', tx('einfach und gut sichtbar')],
  ['stern', tx('Sternchen'), '★', tx('ein Stern über dem Wort')], ['kreis', tx('Kreis'), '◯', tx('das Wort wirkt eingekreist')]];
var GROESSEN = [['klein', tx('Klein'), 22], ['mittel', tx('Mittel'), 28], ['gross', tx('Gross'), 36]];
var FARBWAHL = [['schwarz', tx('Schwarz')], ['blau', tx('Blau')], ['rot', tx('Rot')], ['gruen', tx('Grün')], ['violett', tx('Violett')], ['bunt', tx('Bunt')]];

var VORLAGE = '<div class="gl">' +
  tx('<header class="gl-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Gegenlicht-Rätsel</h1>') +
    tx('<p>Tippe in deinem Text Wörter an. Auf der Rückseite des Blatts steht hinter jedem dieser Wörter ein Zeichen – hält man das Blatt gegen das Licht, scheint es durch.</p></header>') +
  tx('<div class="gl-layout"><section class="gl-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Text</h2><p>Schreibe einen Text oder füge ihn ein.</p></div></div>') +
      tx('<label class="vh" for="glText">Text</label><textarea id="glText" rows="7" maxlength="1500" autocomplete="off"></textarea>') +
      tx('<div class="gl-zeile-knoepfe"><button type="button" class="btn klein" id="glBeispiel" title="Einen Beispieltext einfügen">Beispiel</button><span class="hinweis" id="glTextInfo"></span></div>') +
    '</div>' +
    tx('<div class="karte" id="glMarkKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Wörter markieren</h2><p>Tippe die Wörter an, die auf der Rückseite ein Zeichen bekommen. Nochmals tippen hebt die Markierung auf – das geht auch auf dem Blatt rechts.</p></div></div>') +
      tx('<div class="gl-woerter" id="glWoerter" aria-label="Wörter zum Markieren"></div>') +
      '<div class="gl-zeile-knoepfe"><span class="gl-mark-info" id="glMarkInfo" aria-live="polite"></span>' +
        tx('<button type="button" class="btn klein ghost" id="glKeine">Alle Markierungen entfernen</button></div>') +
    '</div>' +
    tx('<div class="karte" id="glZeichenKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Zeichen auf der Rückseite</h2><p>Was hinter den markierten Wörtern steht.</p></div></div>') +
      tx('<div class="gl-wahl drei" role="radiogroup" aria-label="Zeichen auf der Rückseite">') +
        ZEICHEN.map(function(z){ return '<label><input type="radio" name="glZeichen" value="' + z[0] + '"><span><i aria-hidden="true">' + z[2] + '</i><b>' + z[1] + '</b><small>' + z[3] + '</small></span></label>'; }).join('') +
      '</div>' +
      tx('<div id="glEigeneZeile" hidden><label class="feld-label gl-abstand" for="glEigene">Deine Zeichen, der Reihe nach</label>') +
        '<input type="text" id="glEigene" maxlength="40" autocomplete="off" spellcheck="false">' +
        '<p class="hinweis" id="glEigeneInfo"></p></div>' +
      tx('<div id="glPosZeile" hidden><p class="feld-label gl-abstand">Wo steht das Zeichen?</p><div class="gl-chips" role="radiogroup" aria-label="Wo steht das Zeichen?">') +
        tx('<label><input type="radio" name="glPos" value="ueber"><span>Über dem Wort</span></label>') +
        tx('<label><input type="radio" name="glPos" value="auf"><span>Auf dem Wort</span></label></div></div>') +
    '</div>' +
    tx('<div class="karte" id="glAussehenKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Blatt und Schrift</h2><p>Format des Blatts, Grösse und Farbe des Texts.</p></div></div>') +
      tx('<p class="feld-label">Format</p><div class="gl-chips" role="radiogroup" aria-label="Format des Blatts">') +
        tx('<label><input type="radio" name="glFormat" value="hoch"><span><i class="gl-format gl-format-hoch" aria-hidden="true"></i>Hochformat</span></label>') +
        tx('<label><input type="radio" name="glFormat" value="quer"><span><i class="gl-format gl-format-quer" aria-hidden="true"></i>Querformat</span></label></div>') +
      tx('<p class="feld-label gl-abstand">Grösse</p><div class="gl-chips" role="radiogroup" aria-label="Schriftgrösse">') +
        GROESSEN.map(function(g){ return '<label><input type="radio" name="glGroesse" value="' + g[0] + '"><span style="font-size:' + (0.72 + g[2] / 100).toFixed(2) + 'rem">' + g[1] + '</span></label>'; }).join('') + '</div>' +
      tx('<p class="feld-label gl-abstand">Farbe</p><div class="gl-chips gl-farben" role="radiogroup" aria-label="Farbe">') +
        FARBWAHL.map(function(f){ return '<label><input type="radio" name="glFarbe" value="' + f[0] + '"><span><i class="gl-farbpunkt gl-fp-' + f[0] + '"' + (Kern.FARBEN[f[0]] ? ' style="background:' + Kern.FARBEN[f[0]] + '"' : '') + ' aria-hidden="true"></i>' + f[1] + '</span></label>'; }).join('') + '</div>' +
      tx('<button type="button" class="btn klein gl-abstand" id="glNeueFarben" hidden title="Den Wörtern andere Farben geben">Andere Farben</button>') +
    '</div>' +
    tx('<div class="karte" id="glEinstKarte" hidden><details class="optionen"><summary>Einstellungen</summary>') +
      tx('<label class="feld-label" for="glTitel">Titel auf dem Blatt</label>') + '<input type="text" id="glTitel" maxlength="60" autocomplete="off">' +
      tx('<label class="opt"><input type="checkbox" id="glSpiegeln"><span>Zeichen spiegeln, damit man sie gegen das Licht richtig herum sieht (empfohlen)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="glLinien"><span>Linien für die markierten Wörter unter dem Text</span></label>') +
    '</details></div>' +
  '</section>' +
  tx('<section class="gl-ausgabe" aria-label="Ergebnis">') +
    '<div id="glMeldung" aria-live="polite"></div>' +
    '<div class="gl-werkzeug" id="glWerkzeug" hidden>' +
      tx('<button type="button" class="btn klein" id="glLicht" aria-pressed="false" title="So ungefähr sieht die Vorderseite gegen das Licht aus">Gegen das Licht halten</button>') +
      tx('<button type="button" class="btn klein" id="glZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="glMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="glPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="glHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<p class="gl-druckhinweis" id="glDruckhinweis" hidden></p>' +
    tx('<div class="gl-rahmen" id="glRahmenVorne" hidden><p class="gl-seitenname">Vorderseite</p><article class="gl-blatt gl-vorne" id="glVorne"></article></div>') +
    tx('<div class="gl-rahmen" id="glRahmenHinten" hidden><p class="gl-seitenname">Rückseite – gespiegelt, damit jedes Zeichen beim beidseitigen Druck genau hinter seinem Wort liegt</p><article class="gl-blatt gl-hinten" id="glHinten"></article></div>') +
    '<div class="gl-rahmen"><article class="gl-blatt gl-loesungsblatt" id="glLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
  '<rect x="4.5" y="3" width="15" height="18" rx="2"/><circle cx="12" cy="11" r="2.6" fill="currentColor" stroke="none"/><path d="M12 5.6v1.3M12 15.1v1.3M6.6 11h1.3M16.1 11h1.3M8.3 7.3l.9.9M14.8 13.8l.9.9M15.7 7.3l-.9.9M9.2 13.8l-.9.9"/></svg>';

Labor.registriere({
  id:'gegenlicht',
  titel:'Gegenlicht-Rätsel',
  kurz:'Markierte Wörter scheinen durchs Papier',
  beschreibung:'Ein eigener Text: Die Wörter, die du antippst, bekommen auf der Rückseite ein Zeichen – eine Zahl, einen Buchstaben, ein eigenes Zeichen, einen Punkt, einen Stern oder einen Kreis. Hält man das Blatt gegen das Licht, scheint das Zeichen genau hinter dem Wort durch. Schriftgrösse und Farben wählbar, beidseitig drucken, mit Lösungsblatt.',
  merkmale:['Wörter antippen', 'Zeichen auf der Rückseite', 'Beidseitig drucken'],
  symbol:SYMBOL,
  css:'raetsel/gegenlicht/gegenlicht.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'gegenlicht-eingaben', OPT = 'gegenlicht-einstellungen';
  var STANDARD = { zeichen:'', pos:'ueber', eigene:'', format:'hoch', groesse:'mittel', farbe:'schwarz', spiegeln:true, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', marks:[], farbSeed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) }, licht = false, zeigeLoesung = false;
  try { var o0 = JSON.parse(localStorage.getItem(OPT)); if (o0) Object.assign(st.opt, o0); } catch(x){}
  try { var e0 = JSON.parse(sessionStorage.getItem(TAB)); if (e0){ st.text = String(e0.text || ''); st.titel = String(e0.titel || ''); st.marks = Array.isArray(e0.marks) ? e0.marks.map(String) : []; st.farbSeed = +e0.farbSeed || st.farbSeed; } } catch(x){}
  if (!ZEICHEN.some(function(z){ return z[0] === st.opt.zeichen; })) st.opt.zeichen = '';   // keine Vorauswahl
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel, marks:st.marks, farbSeed:st.farbSeed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#glMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 200); }

  /* ---------- Eingaben ---------- */
  $('#glText').value = st.text;
  $('#glText').addEventListener('input', function(){ st.text = this.value; speichern(); baldZeichnen(); });
  $('#glBeispiel').addEventListener('click', function(){
    var b = BEISPIELE[Labor.sprache] || BEISPIELE.de;
    st.text = b.text; st.marks = b.marks.slice(); $('#glText').value = st.text; speichern(); zeichnen();
  });
  $('#glTitel').value = st.titel;
  $('#glTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); baldZeichnen(); });
  $('#glEigene').value = st.opt.eigene;
  $('#glEigene').addEventListener('input', function(){ st.opt.eigene = this.value; speichern(); baldZeichnen(); });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){
        if (!r.checked) return; st.opt[k] = r.value; speichern(); zeichnen();
        if (k === 'zeichen' && r.value === 'eigene') setTimeout(function(){ $('#glEigene').focus(); }, 0);
      });
    });
  }
  radios('glZeichen', 'zeichen'); radios('glPos', 'pos'); radios('glFormat', 'format'); radios('glGroesse', 'groesse'); radios('glFarbe', 'farbe');
  [['#glSpiegeln', 'spiegeln'], ['#glLinien', 'linien'], ['#glMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#glNeueFarben').addEventListener('click', function(){ st.farbSeed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#glKeine').addEventListener('click', function(){ st.marks = []; speichern(); zeichnen(); });

  /* Markieren: Antippen in der Wortliste links oder direkt auf der Vorderseite */
  function umschalten(key){
    var i = st.marks.indexOf(key);
    if (i >= 0) st.marks.splice(i, 1); else st.marks.push(key);
    speichern(); zeichnen();
    var el = $('#glWoerter .gl-wahl-w[data-key="' + cssWert(key) + '"]');
    return el;
  }
  function cssWert(s){ return String(s).replace(/["\\]/g, '\\$&'); }
  function tippen(ev, ort){
    var w = ev.target.closest(ort === 'liste' ? '.gl-wahl-w' : '.gl-w');
    if (!w) return;
    var key = w.getAttribute('data-key'), tastatur = ev.type === 'keydown';
    if (tastatur){ if (ev.key !== 'Enter' && ev.key !== ' ') return; ev.preventDefault(); }
    umschalten(key);
    if (tastatur){ var neu = (ort === 'liste' ? $('#glWoerter') : $('#glVorne')).querySelector('[data-key="' + cssWert(key) + '"]'); if (neu) neu.focus(); }
  }
  $('#glWoerter').addEventListener('click', function(ev){ tippen(ev, 'liste'); });
  $('#glWoerter').addEventListener('keydown', function(ev){ tippen(ev, 'liste'); });
  $('#glVorne').addEventListener('click', function(ev){ tippen(ev, 'blatt'); });
  $('#glVorne').addEventListener('keydown', function(ev){ tippen(ev, 'blatt'); });

  $('#glLicht').addEventListener('click', function(){ licht = !licht; this.setAttribute('aria-pressed', licht ? 'true' : 'false'); $('#glVorne').classList.toggle('licht', licht); });
  $('#glZeigeLoesung').addEventListener('click', function(){ zeigeLoesung = !zeigeLoesung; this.setAttribute('aria-pressed', zeigeLoesung ? 'true' : 'false'); $('#glLoesung').classList.toggle('offen', zeigeLoesung); });

  /* ---------- Blatt ---------- */
  function titel(){ return st.titel.trim() || tx('Gegen das Licht'); }
  function anleitung(){
    var o = st.opt;
    return tx('Halte das Blatt gegen das Licht – am besten ans Fenster. Auf der Rückseite sind einige Wörter markiert, und die Zeichen scheinen durch.') + ' ' +
      (o.zeichen === 'zahlen' ? tx('Schreibe die markierten Wörter in der Reihenfolge der Zahlen auf.') : o.zeichen === 'buchstaben' || o.zeichen === 'eigene' ? tx('Schreibe die markierten Wörter mit ihrem Zeichen auf.') : tx('Schreibe die markierten Wörter der Reihe nach auf.'));
  }
  /* Ein Blatt. art 'vorne' (Vorder- und Rückseite – die Rückseite blendet per CSS alles ausser den Zeichen aus und spiegelt)
     oder 'loesung'. Jedes markierte Wort trägt sein Zeichen als absolut gesetztes Element (.gl-z): über oder auf dem Wort. */
  function blattHtml(art, Z, nummer, labels){
    var o = st.opt, loesung = art === 'loesung', px = (GROESSEN.filter(function(g){ return g[0] === o.groesse; })[0] || GROESSEN[1])[2];
    var farben = o.farbe === 'bunt' ? Kern.buntFarben(Kern.woerter(Z).length, st.farbSeed) : null, einfarbig = Kern.FARBEN[o.farbe] || Kern.FARBEN.schwarz;
    var h = '<div class="gl-innen">';
    if (o.titelAn) h += '<h2>' + esc(loesung ? tx('Lösung – {t}', { t:titel() }) : titel()) + '</h2>';
    if (o.anleitungAn && !loesung) h += '<p class="gl-anleitung">' + anleitung() + '</p>';
    var pos = o.zeichen === 'kreis' ? 'kreis' : o.pos === 'auf' ? 'auf' : 'ueber';
    h += '<div class="gl-text gl-pos-' + pos + '" style="font-size:' + px + 'px;color:' + einfarbig + '">' + Z.map(function(zeile){
      if (!zeile.length) return '<p class="gl-absatz gl-leer">&nbsp;</p>';
      return '<p class="gl-absatz">' + zeile.map(function(g){
        var f = '';
        g.forEach(function(s){ if (s.w && farben) f = farben[s.nr]; });
        return '<span class="gl-g"' + (f ? ' style="color:' + f + '"' : '') + '>' + g.map(function(s){
          if (!s.w) return esc(s.t);
          var k = nummer[s.key], an = k !== undefined;
          var z = an && o.zeichen ? '<span class="gl-z gl-z-' + o.zeichen + '" aria-hidden="true">' + (o.zeichen === 'kreis' ? '' : '<span class="gl-z-in">' + esc(labels[k]) + '</span>') + '</span>' : '';
          return '<span class="gl-w' + (an ? ' an' : '') + '"' + (loesung ? '' : ' data-key="' + esc(s.key) + '" role="button" tabindex="0" aria-pressed="' + (an ? 'true' : 'false') + '"') + '>' + z + esc(s.t) + '</span>';
        }).join('') + '</span>';
      }).join(' ') + '</p>';
    }).join('') + '</div>';
    // Linien für die Antworten (mit dem Zeichen davor, wenn es eines ist, das die Wörter unterscheidet)
    var n = labels.length, mitZeichen = o.zeichen === 'zahlen' || o.zeichen === 'buchstaben' || o.zeichen === 'eigene';
    if ((o.linien || loesung) && n){
      var woerterListe = Kern.woerter(Z).filter(function(s){ return nummer[s.key] !== undefined; }).sort(function(a, b){ return nummer[a.key] - nummer[b.key]; });
      h += '<div class="gl-antworten">' + (loesung ? '' : '<p class="gl-antworten-titel">' + tx('Die markierten Wörter:') + '</p>') + '<ol class="gl-linien">' + woerterListe.map(function(s, i){
        return '<li>' + (mitZeichen ? '<b class="gl-l-zeichen">' + esc(labels[i]) + '</b>' : '') + '<span class="gl-linie">' + (loesung ? '<b class="gl-l-wort">' + esc(s.t) + '</b>' : '') + '</span></li>';
      }).join('') + '</ol></div>';
    }
    return h + '</div>';
  }

  function wortListeHtml(Z, nummer){
    return Z.map(function(zeile){
      if (!zeile.length) return '<br>';
      return '<span class="gl-wahl-zeile">' + zeile.map(function(g){
        return '<span class="gl-wahl-g">' + g.map(function(s){
          if (!s.w) return '<span class="gl-wahl-p">' + esc(s.t) + '</span>';
          var an = nummer[s.key] !== undefined;
          return '<span class="gl-wahl-w' + (an ? ' an' : '') + '" data-key="' + esc(s.key) + '" role="button" tabindex="0" aria-pressed="' + (an ? 'true' : 'false') + '">' + esc(s.t) + '</span>';
        }).join('') + '</span>';
      }).join(' ') + '</span>';
    }).join('');
  }

  function zeichnen(){
    if (aus) return;
    var o = st.opt, Z = Kern.zerlege(st.text), W = Kern.woerter(Z), text = !!W.length;
    // Markierungen, die im Text (noch) vorkommen – in Lesereihenfolge nummeriert
    var nummer = {}, n = 0;
    W.forEach(function(s){ if (st.marks.indexOf(s.key) >= 0) nummer[s.key] = n++; });
    var labels = Kern.zeichenListe(o.zeichen, n, o.eigene);
    $('#glTextInfo').textContent = text ? tx('{n} Wörter', { n:W.length }) : '';
    $('#glMarkKarte').hidden = !text;
    $('#glZeichenKarte').hidden = !text || !n;
    var bereit = text && n && !!o.zeichen;
    $('#glAussehenKarte').hidden = $('#glEinstKarte').hidden = !bereit;
    $('#glEigeneZeile').hidden = o.zeichen !== 'eigene';
    $('#glPosZeile').hidden = !o.zeichen || o.zeichen === 'kreis';
    $('#glNeueFarben').hidden = o.farbe !== 'bunt';
    $('#glWoerter').innerHTML = text ? wortListeHtml(Z, nummer) : '';
    $('#glMarkInfo').textContent = !n ? tx('Noch kein Wort markiert.') : n === 1 ? tx('1 Wort markiert') : tx('{n} Wörter markiert', { n:n });
    $('#glKeine').hidden = !n;
    if (o.zeichen === 'eigene'){
      var e = Array.from(o.eigene.replace(/\s+/g, '')).length;
      $('#glEigeneInfo').textContent = tx('Ein Zeichen pro markiertem Wort, in der Reihenfolge im Text (Leerzeichen zählen nicht).') + ' ' +
        (e < n ? tx('Es fehlen noch {k} Zeichen – dort steht sonst «?».', { k:n - e }) : e > n ? tx('{k} Zeichen zu viel – sie werden nicht gebraucht.', { k:e - n }) : tx('Passt: {n} Zeichen für {n} Wörter.', { n:n }));
    }
    ['#glWerkzeug', '#glDruckhinweis', '#glRahmenVorne', '#glRahmenHinten'].forEach(function(s){ $(s).hidden = !bereit; });
    if (!bereit){
      $('#glVorne').innerHTML = $('#glHinten').innerHTML = $('#glLoesung').innerHTML = '';
      meldung('info', !text ? tx('<p>Schreibe links einen Text oder füge ihn ein – oder nimm das Beispiel.</p>')
        : !n ? tx('<p>Tippe links die Wörter an, die auf der Rückseite ein Zeichen bekommen sollen.</p>')
        : tx('<p>Wähle links, welches Zeichen auf der Rückseite hinter den markierten Wörtern stehen soll.</p>'));
      return;
    }
    meldung('', '');
    /* Querformat: 273 mm breit (A4 quer im PDF). Beidseitig: beim Hochformat an der langen, beim Querformat an der kurzen
       Kante wenden – dann ist die Rückseite in beiden Fällen links-rechts gespiegelt (wie eine Buchseite) */
    var quer = o.format === 'quer';
    ['#glVorne', '#glHinten', '#glLoesung'].forEach(function(s){ $(s).classList.toggle('blatt-quer', quer); });
    $('#glDruckhinweis').classList.toggle('quer', quer);
    $('#glDruckhinweis').innerHTML = tx('<b>Beidseitig drucken:</b> {k} und in Originalgrösse (100 %). Dünnes Papier scheint besser durch.', { k:quer ? tx('«an der kurzen Kante wenden»') : tx('«an der langen Kante wenden»') }) + ' ' +
      tx('Tipp: zuerst ein Blatt ausprobieren – stehen die Zeichen auf dem Kopf oder auf der falschen Seite, die andere Kante wählen.');
    var vorne = blattHtml('vorne', Z, nummer, labels);
    $('#glVorne').innerHTML = vorne;
    $('#glHinten').innerHTML = vorne;   // dieselbe Seite: per CSS unsichtbar bis auf die Zeichen, gespiegelt
    [].forEach.call($('#glHinten').querySelectorAll('[data-key]'), function(x){ x.removeAttribute('data-key'); x.removeAttribute('role'); x.removeAttribute('tabindex'); x.removeAttribute('aria-pressed'); });
    $('#glHinten').setAttribute('aria-hidden', 'true');
    $('#glHinten').classList.toggle('ungespiegelt', !o.spiegeln);
    $('#glVorne').classList.toggle('ungespiegelt', !o.spiegeln);
    $('#glVorne').classList.toggle('licht', licht);
    $('#glLoesung').innerHTML = blattHtml('loesung', Z, nummer, labels);
    var b = $('#glVorne');
    if (b.offsetHeight > (quer ? 703 : 1032)) meldung('warnung', (quer ? tx('<p>Der Text ist lang für eine A4-Seite quer – im PDF werden Vorder- und Rückseite gleich stark verkleinert (die Zeichen bleiben hinter ihren Wörtern). Kürze den Text, wähle eine kleinere Schrift oder das Hochformat.</p>') : tx('<p>Der Text ist lang für eine A4-Seite – im PDF werden Vorder- und Rückseite gleich stark verkleinert (die Zeichen bleiben hinter ihren Wörtern). Kürze den Text oder wähle eine kleinere Schrift.</p>')));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus) zeichnen(); });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function blaetter(){ return [$('#glVorne'), $('#glHinten'), st.opt.mitLoesung && $('#glLoesung')]; }
  function fehlerMeldung(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#glPdf'), function(){ druckVorbereiten(); return !$('#glWerkzeug').hidden && { blaetter:blaetter(), name:Labor.pdfName(tx('Gegenlicht'), st.titel) }; }, fehlerMeldung);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#glPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#glHerunterladen').hidden = false; });
  }
  $('#glHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || $('#glWerkzeug').hidden) return;
    var name = Labor.pdfName(tx('Gegenlicht'), st.titel).replace(/\.pdf$/, '.html');
    var inhalt = blaetter().filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('licht'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Gegenlicht-Rätsel'), inhalt, '.gl-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
