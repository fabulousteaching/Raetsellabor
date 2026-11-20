/* Rätsellabor – Generator «Plättchenrätsel»
   Ein Raster: In jedem Feld steht eine Antwort. Dazu Plättchen mit Aufgaben zum Ausschneiden – genau so viele, wie die
   gewünschten Ziffern oder Buchstaben Felder haben (Blockschrift 3 × 5, window.Pixelschrift). Wer jedes Plättchen auf die
   richtige Antwort legt, sieht die Zeichen. Die übrigen Felder tragen Ablenk-Antworten, die nie die Antwort eines
   Plättchens sind – so passt jedes Plättchen nur auf seine Felder (gleiche Antwort auf mehreren Plättchen: dann gibt es
   genau so viele Felder damit, die Form stimmt so oder so). Inhalte wie bei den Legekärtchen (window.KettenKern,
   Paarliste). Raster, Plättchen, Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('plaettchen');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function mischen(l, rnd){ l = l.slice(); for (var i = l.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), x = l[i]; l[i] = l[j]; l[j] = x; } return l; }
  /* Zeichen → Raster (0/1): je Zeile höchstens proZeile Zeichen, dazwischen eine leere Spalte, zwischen den Zeilen eine
     leere Zeile, auf Wunsch ein leerer Rand. → Zeilen aus 0/1 */
  function raster(zeichen, Z, b, h, proZeile, rand){
    var zeilen = [];
    for (var i = 0; i < zeichen.length; i += proZeile) zeilen.push(zeichen.slice(i, i + proZeile));
    var W = Math.max.apply(null, zeilen.map(function(z){ return z.length * (b + 1) - 1; })), g = [];
    zeilen.forEach(function(z, k){
      if (k) g.push(new Array(W).fill(0));
      var links = Math.floor((W - (z.length * (b + 1) - 1)) / 2);
      for (var y = 0; y < h; y++){
        var r = new Array(W).fill(0);
        z.forEach(function(c, ci){ for (var x = 0; x < b; x++) if (Z[c][y].charAt(x) === '#') r[links + ci * (b + 1) + x] = 1; });
        g.push(r);
      }
    });
    if (rand){ g = g.map(function(r){ return [0].concat(r, [0]); }); g.unshift(new Array(W + 2).fill(0)); g.push(new Array(W + 2).fill(0)); }
    return g;
  }
  // Rechenaufgaben (alle oder eine grosse Auswahl), Aufgabe a, Antwort b
  function plusMinus(ops, max, rnd){
    var l = [], s = {};
    function dazu(a, b){ if (!s[a]){ s[a] = 1; l.push({ a:a, b:String(b) }); } }
    if (max <= 20){
      for (var x = 1; x <= max; x++) for (var y = 1; x + y <= max; y++){ if (ops.indexOf('plus') >= 0) dazu(x + ' + ' + y, x + y); if (ops.indexOf('minus') >= 0) dazu((x + y) + ' − ' + y, x); }
    } else for (var i = 0; i < 1500 && l.length < 700; i++){
      var c = 2 + Math.floor(rnd() * (max - 1)), y2 = 1 + Math.floor(rnd() * (c - 1)), x2 = c - y2;
      if (max >= 1000 && rnd() < 0.6){ x2 = Math.round(x2 / 10) * 10 || 10; y2 = Math.round(y2 / 10) * 10 || 10; c = x2 + y2; if (c > max) continue; }
      if (ops.indexOf('plus') >= 0 && (ops.indexOf('minus') < 0 || rnd() < 0.5)) dazu(x2 + ' + ' + y2, c); else dazu(c + ' − ' + y2, x2);
    }
    return l;
  }
  function einmaleins(reihen, ops){
    var l = [];
    reihen.forEach(function(r){ for (var k = 1; k <= 10; k++){
      if (ops.indexOf('mal') >= 0){ l.push({ a:k + ' · ' + r, b:String(k * r) }); if (k !== r) l.push({ a:r + ' · ' + k, b:String(k * r) }); }
      if (ops.indexOf('geteilt') >= 0) l.push({ a:(k * r) + ' : ' + r, b:String(k) });
    } });
    var s = {}; return l.filter(function(p){ if (s[p.a]) return false; s[p.a] = 1; return true; });
  }
  /* Antworten verteilen. pool: [{ a, b }]; n Plättchen, m Ablenk-Felder. Antworten in zwei Gruppen teilen: A für die
     Plättchen, D (der Rest) für die Ablenk-Felder – nie dieselbe Antwort in beiden. A so gross wie möglich, aber D soll
     genug Vielfalt behalten. → { plaettchen:[{ a, b }], ablenker:[Antworten], vielfalt } oder { fehler } */
  function verteilen(pool, n, m, rnd){
    var nach = {}, werte = [];
    pool.forEach(function(p){ if (!p.a || !p.b) return; if (!nach[p.b]){ nach[p.b] = []; werte.push(p.b); } if (nach[p.b].every(function(q){ return q.a !== p.a; })) nach[p.b].push(p); });
    werte = mischen(werte, rnd);
    if (werte.length < 2) return { fehler:'zu wenige verschiedene Antworten' };
    var dZiel = m ? Math.min(m, Math.max(3, Math.ceil(werte.length * 0.35))) : 0;
    var aMax = Math.max(1, werte.length - dZiel), A = [], aufgaben = 0;
    for (var i = 0; i < werte.length && A.length < aMax; i++){ A.push(werte[i]); aufgaben += nach[werte[i]].length; if (A.length >= n && aufgaben >= n) break; }
    var D = werte.filter(function(w){ return A.indexOf(w) < 0; });
    if (m && !D.length) return { fehler:'keine Antworten für die Ablenk-Felder übrig' };
    // Plättchen: reihum über die Antworten in A, jede Aufgabe möglichst nur einmal
    var plaettchen = [], runde = 0;
    A.forEach(function(w){ nach[w] = mischen(nach[w], rnd); });
    while (plaettchen.length < n){
      var neu = 0;
      for (var k = 0; k < A.length && plaettchen.length < n; k++){ var l = nach[A[k]]; if (runde < l.length){ plaettchen.push(l[runde]); neu++; } }
      if (!neu){ // alle Aufgaben verbraucht: wiederholen
        for (var k2 = 0; plaettchen.length < n; k2++) plaettchen.push(nach[A[k2 % A.length]][0]);
      }
      runde++;
    }
    var ablenker = [], Dm = mischen(D, rnd);
    for (var j = 0; j < m; j++) ablenker.push(Dm[j % Dm.length]);
    return { plaettchen:mischen(plaettchen, rnd), ablenker:mischen(ablenker, rnd), vielfalt:D.length, wiederholt:plaettchen.length - new Set(plaettchen.map(function(p){ return p.a; })).size };
  }
  // Raster belegen: angemalte Felder bekommen die Antworten der Plättchen, die anderen die Ablenk-Antworten
  function belegen(g, vert, rnd){
    var antworten = mischen(vert.plaettchen.map(function(p){ return p.b; }), rnd), ai = 0, di = 0;
    return g.map(function(r){ return r.map(function(v){ return v ? { b:antworten[ai++], teil:true } : { b:vert.ablenker[di++], teil:false }; }); });
  }
  // Prüfen: Jede Antwort eines Plättchens steht genau so oft im Raster, wie es Plättchen mit ihr gibt, und nie auf einem Ablenk-Feld
  function pruefen(feld, plaettchen){
    var soll = {}, ist = {}, ok = true;
    plaettchen.forEach(function(p){ soll[p.b] = (soll[p.b] || 0) + 1; });
    feld.forEach(function(r){ r.forEach(function(c){ if (soll[c.b] !== undefined){ ist[c.b] = (ist[c.b] || 0) + 1; if (!c.teil) ok = false; } }); });
    Object.keys(soll).forEach(function(k){ if (soll[k] !== ist[k]) ok = false; });
    return ok;
  }
  /* Einfache deutsche Silbentrennung: Stellen, vor denen getrennt werden darf. Zwischen Vokalen: ein Mitlaut geht auf
     die nächste Zeile (Ha-se), von mehreren nur der letzte (Fens-ter, ant-wor-ten); sch, ch, ck, ph, qu bleiben zusammen;
     Doppel-Mitlaute werden getrennt (Was-ser, schmut-zig). */
  function trennstellen(wort){
    var w = String(wort), klein = w.toLowerCase(), einheiten = [], i = 0, vok = /[aeiouäöüy]/;
    while (i < klein.length){
      var drei = klein.substr(i, 3), zwei = klein.substr(i, 2);
      if (drei === 'sch'){ einheiten.push([i, 3, false]); i += 3; continue; }
      if (zwei === 'ch' || zwei === 'ck' || zwei === 'ph' || zwei === 'qu'){ einheiten.push([i, 2, false]); i += 2; continue; }
      einheiten.push([i, 1, vok.test(klein.charAt(i))]); i++;
    }
    var stellen = [], k = 0;
    while (k < einheiten.length && !einheiten[k][2]) k++;          // bis zum ersten Vokal
    while (k < einheiten.length){
      while (k < einheiten.length && einheiten[k][2]) k++;          // Vokale überspringen
      var start = k; while (k < einheiten.length && !einheiten[k][2]) k++;
      if (k >= einheiten.length) break;                             // keine Vokale mehr: Wortende
      var lauf = einheiten.slice(start, k);
      if (!lauf.length) continue;
      var n = lauf.length, letzter = lauf[n - 1];
      // «sch» + l, r, m, n, w beginnt eine Silbe gemeinsam (ge-schlos-sen, Ta-schen … ver-schwin-den)
      if (n >= 2 && klein.substr(lauf[n - 2][0], 3) === 'sch' && /[lrmnw]/.test(klein.charAt(letzter[0]))) stellen.push(lauf[n - 2][0]);
      else stellen.push(letzter[0]);                                // vor dem letzten Mitlaut
    }
    return stellen;
  }
  return { trennstellen:trennstellen, zufall:zufall, mischen:mischen, raster:raster, plusMinus:plusMinus, einmaleins:einmaleins, verteilen:verteilen, belegen:belegen, pruefen:pruefen };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639, MM = 703 / 186, MAX = 4;
// Fach «deutsch» = Sprache der Seite (Reime, Mehrzahl, Gegenteile in dieser Sprache); Englisch und Französisch = Wörter mit deutscher Übersetzung
var SPRACHFACH = { en:'English', fr:'Français' }[Labor.sprache] || 'Deutsch';
var FAECHER = [['deutsch', SPRACHFACH], ['mathe', tx('Mathe')], ['englisch', Labor.sprache === 'de' ? tx('Englisch') : tx('Deutsch – Englisch')], ['franzoesisch', Labor.sprache === 'de' ? tx('Französisch') : tx('Deutsch – Französisch')], ['eigene', tx('Eigene Paare')]];
var DEUTSCH = [['reime', tx('Reimwörter')], ['mehrzahl', tx('Einzahl – Mehrzahl')], ['gegenteile', tx('Gegenteile')]];
var MATHE = [['plusminus', tx('Plus & Minus')], ['einmaleins', tx('Einmaleins')], ['dezimal', tx('Dezimalzahlen')], ['brueche', tx('Brüche')]];
var KOEPFE = { englisch:[tx('Deutsch'), tx('Englisch'), tx('Körper = body')], franzoesisch:[tx('Deutsch'), tx('Französisch'), tx('Pferd = le cheval')], eigene:[tx('Aufgabe (Plättchen)'), tx('Antwort (Raster)'), tx('Hauptstadt der Schweiz = Bern')] };
var PLATTFARBE = '#D6EAF8';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function chips(name, l){ return l.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }
function kaestchen(name, l){ return l.map(function(x){ return '<label><input type="checkbox" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

var VORLAGE = '<div class="pt">' +
  tx('<header class="pt-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Plättchenrätsel</h1>') +
    tx('<p>Aufgaben auf Plättchen, Antworten im Raster: Wer jedes Plättchen auf seine Antwort legt, sieht Ziffern oder Buchstaben.</p></header>') +
  tx('<div class="pt-layout"><section class="pt-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Lösung</h2><p>Ziffern oder Buchstaben, die entstehen – 1 bis 4 Zeichen (Blockschrift 3 × 5).</p></div></div>') +
      tx('<label class="feld-label" for="ptCode">Ziffern oder Buchstaben</label>') +
      tx('<div class="pt-zeile"><input type="text" id="ptCode" maxlength="8" autocomplete="off" spellcheck="false"><button type="button" class="btn klein" id="ptLeeren">Leeren</button></div>') +
      '<div class="pt-zaehler" id="ptZaehler" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Aufgaben</h2><p>Auf den Plättchen die Aufgabe, im Raster die Antwort.</p></div></div>') +
      tx('<div class="pt-chips" role="radiogroup" aria-label="Fach">') + chips('ptFach', FAECHER) + '</div>' +
      '<div class="pt-stufe pt-teil" data-fach="deutsch"><p class="feld-label">' + tx('{fach}: Art der Paare', { fach:SPRACHFACH }) + '</p>' +
        tx('<div class="pt-chips" role="radiogroup" aria-label="Deutsch">') + chips('ptDeutsch', DEUTSCH) + '</div></div>' +
      tx('<div class="pt-stufe pt-teil" data-fach="mathe"><p class="feld-label">Mathe: Thema</p>') +
        tx('<div class="pt-chips" role="radiogroup" aria-label="Mathe">') + chips('ptMathe', MATHE) + '</div>' +
        '<div class="pt-stufe pt-unter" data-mathe="plusminus">' +
          tx('<p class="feld-label">Zahlenraum</p><div class="pt-chips" role="radiogroup" aria-label="Zahlenraum">') + chips('ptZr', [['10', tx('bis 10')], ['20', tx('bis 20')], ['100', tx('bis 100')], ['1000', tx('bis 1000')]]) + '</div>' +
          tx('<p class="feld-label">Rechenarten</p><div class="pt-chips">') + kaestchen('ptOps', [['plus', tx('Plus')], ['minus', tx('Minus')]]) + '</div></div>' +
        '<div class="pt-stufe pt-unter" data-mathe="einmaleins">' +
          tx('<p class="feld-label">Reihen</p><div class="pt-chips pt-reihen">') + kaestchen('ptReihen', [2, 3, 4, 5, 6, 7, 8, 9, 10].map(function(r){ return [r, r]; })) + '</div>' +
          tx('<p class="feld-label">Rechenarten</p><div class="pt-chips">') + kaestchen('ptEOps', [['mal', tx('Mal')], ['geteilt', tx('Geteilt')]]) + '</div></div>' +
        '<div class="pt-stufe pt-unter" data-mathe="dezimal">' +
          tx('<p class="feld-label">Brüche mit Nenner</p><div class="pt-chips" role="radiogroup" aria-label="Nenner">') + chips('ptDez', [['1', '10'], ['2', tx('10 und 100')], ['3', tx('10, 100 und 1000')]]) + '</div></div>' +
        '<div class="pt-stufe pt-unter" data-mathe="brueche">' +
          tx('<p class="feld-label">Nenner bis</p><div class="pt-chips" role="radiogroup" aria-label="Nenner bis">') + chips('ptNenner', [['4', '4'], ['6', '6'], ['10', '10'], ['12', '12']]) + '</div></div>' +
      '</div>' +
      '<div class="pt-stufe pt-teil pt-paarliste" data-fach="englisch franzoesisch eigene" id="ptPaarliste">' + Paarliste.html() + '</div>' +
      '<div class="pt-zaehler" id="ptPaarInfo" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>') +
      tx('<label class="opt"><input type="checkbox" id="ptRand"><span>Rand aus Ablenk-Feldern rund um die Zeichen (schwieriger)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ptFarbig"><span>Plättchen farbig hinterlegen (gelegt sieht man die Zeichen besser)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ptLinie"><span>Linie für die Lösung</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="pt-ausgabe" aria-label="Ergebnis">') +
    '<div id="ptMeldung" aria-live="polite"></div>' +
    '<div class="pt-werkzeug">' +
      tx('<button type="button" class="btn klein" id="ptZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="ptNeu" title="Andere Aufgaben und andere Verteilung">Neu mischen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="ptMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="ptPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="ptHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="pt-blaetter"><div class="pt-seiten" id="ptSeiten"></div>' +
    '<div class="pt-rahmen pt-loesung-rahmen"><article class="pt-blatt pt-loesungsblatt" id="ptLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M9.6 3.6h4.8v4.8H9.6zM9.6 9.6h4.8v4.8H9.6zM9.6 15.6h4.8v4.8H9.6z" fill="currentColor" stroke="none"/></svg>';

Labor.registriere({
  id:'plaettchen',
  titel:'Plättchenrätsel',
  kurz:'Plättchen auf die richtige Antwort legen – Ziffern erscheinen',
  beschreibung:'Plättchen mit Aufgaben zum Ausschneiden und ein Raster voller Antworten: Liegt jedes Plättchen auf seiner Antwort, erscheinen Ziffern oder Buchstaben. Ablenk-Antworten passen nie zu einem Plättchen. Mathe, Deutsch, Englisch, Französisch oder eigene Paare.',
  merkmale:['Zum Ausschneiden', 'Mathe und Sprachen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/plaettchen/plaettchen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false, PS = window.Pixelschrift, KK = window.KettenKern;
  var TAB = 'plaettchen-eingaben', OPT = 'plaettchen-einstellungen';
  // Keine Vorauswahl: jede Stufe klappt erst auf, wenn darüber etwas gewählt ist
  var STANDARD = { fach:'', deutschArt:'', matheArt:'', zr:'', ops:[], reihen:[], eOps:[], dez:'', nenner:'', rand:false, farbig:true, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', zeilen:{ englisch:[], franzoesisch:[], eigene:[] }, seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.seed = +e.seed || st.seed;
    Object.keys(KOEPFE).forEach(function(k){ if (e.zeilen && e.zeilen[k]) st.zeilen[k] = Paarliste.aufraeumen(e.zeilen[k]); }); } } catch(x){}
  function gueltig(k, liste){ if (!liste.some(function(x){ return x[0] === st.opt[k]; })) st.opt[k] = ''; }
  ['ops', 'reihen', 'eOps'].forEach(function(k){ if (!Array.isArray(st.opt[k])) st.opt[k] = []; });
  gueltig('fach', FAECHER); gueltig('deutschArt', DEUTSCH); gueltig('matheArt', MATHE);
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed, zeilen:st.zeilen })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#ptMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 300); }

  $('#ptCode').value = st.code;
  $('#ptCode').addEventListener('input', function(){ st.code = this.value; speichern(); baldZeichnen(); });
  $('#ptLeeren').addEventListener('click', function(){ st.code = ''; $('#ptCode').value = ''; speichern(); zeichnen(); $('#ptCode').focus(); });
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
        st.opt[k] = [].filter.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(x){ return x.checked; }).map(function(x){ return zahl ? +x.value : x.value; });
        speichern(); zeichnen();
      });
    });
  }
  radios('ptFach', 'fach'); radios('ptDeutsch', 'deutschArt'); radios('ptMathe', 'matheArt'); radios('ptZr', 'zr'); radios('ptDez', 'dez'); radios('ptNenner', 'nenner');
  haekchen('ptOps', 'ops'); haekchen('ptReihen', 'reihen', true); haekchen('ptEOps', 'eOps');
  [['#ptRand', 'rand'], ['#ptFarbig', 'farbig'], ['#ptLinie', 'linie'], ['#ptMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#ptZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#ptLoesung').classList.toggle('zeigen', an); $('#ptLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#ptNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  var paarliste = Paarliste.starte($('#ptPaarliste'), {
    liste:function(art){ return st.zeilen[art] || (st.zeilen[art] = []); },
    art:function(){ return st.opt.fach; },
    sprache:function(art){ return art === 'englisch' || art === 'franzoesisch' ? art : null; },
    kopf:function(){ return KOEPFE[st.opt.fach] || ['', '', '']; },
    hilfe:function(){ return st.opt.fach === 'eigene' ? tx('Links die Aufgabe (kommt aufs Plättchen), rechts die Antwort (kommt ins Raster). Ein paar Paare mehr als Plättchen geben Ablenk-Antworten.') : tx('Links das deutsche Wort (Plättchen), rechts die Übersetzung (Raster). Ein paar Paare mehr als Plättchen geben Ablenk-Antworten.'); },
    einfuegen:true,
    geaendert:function(){ speichern(); baldZeichnen(); },
    aus:function(){ return aus; }
  });
  function teileZeigen(){
    [].forEach.call(bereich.querySelectorAll('.pt-teil'), function(d){ d.hidden = d.dataset.fach.split(' ').indexOf(st.opt.fach) < 0; });
    [].forEach.call(bereich.querySelectorAll('.pt-unter'), function(d){ d.hidden = d.dataset.mathe !== st.opt.matheArt; });
    if (KOEPFE[st.opt.fach]) paarliste.zeigen();
  }
  teileZeigen();

  /* ---------- Inhalte ---------- */
  function fehltNoch(){
    var o = st.opt;
    if (!o.fach) return tx('ein Fach');
    if (o.fach === 'deutsch' && !o.deutschArt) return tx('bei {fach} die Art der Paare', { fach:SPRACHFACH });
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
  function pool(rnd){
    var o = st.opt;
    if (o.fach === 'deutsch') return KK.vorschlaege(o.deutschArt, 999, rnd);
    if (o.fach === 'mathe'){
      if (o.matheArt === 'plusminus') return Kern.plusMinus(o.ops, +o.zr, rnd);
      if (o.matheArt === 'einmaleins') return Kern.einmaleins(o.reihen, o.eOps);
      if (o.matheArt === 'dezimal') return KK.dezimal(+o.dez, '.', 'echt', 999, rnd);
      return KK.brueche(+o.nenner, 'echt', 999, rnd);
    }
    return KK.paareListe((st.zeilen[o.fach] || []).map(function(z){ return [z.a, z.b]; })).paare;
  }

  /* ---------- Zeichnen ---------- */
  var messer = document.createElement('canvas').getContext('2d');
  function breite(t, gr){ messer.font = '600 ' + gr + 'px ' + Labor.blattSchrift('text'); return messer.measureText(t).width; }
  // Text in ein Feld (Mitte x, y; Seite s): Brüche übereinander, sonst eine oder zwei Zeilen, so gross wie möglich
  /* Möglichkeiten, einen Text in ein Feld (Seite s) zu setzen: eine Zeile, zwei Zeilen an einem Leerzeichen, ein langes
     Wort mit Silbentrennung – je mit der grössten Schrift, die passt. Brüche übereinander. → [{ g, z, bruch }] */
  function varianten(t, s){
    var m = /^(\d+)\/(\d+)$/.exec(t);
    if (m) return [{ g:Math.min(s * 0.28, (s * 0.8) / (Math.max(m[1].length, m[2].length) * 0.62)), bruch:m }];
    var l = [{ g:Math.min(s * 0.3, s * 0.86 / (breite(t, 100) / 100)), z:[t] }], w = t.split(' ');
    var zwei = function(a, b){ return { g:Math.min(s * 0.26, s * 0.86 / (Math.max(breite(a, 100), breite(b, 100)) / 100)), z:[a, b] }; };
    var bestZ = null;
    for (var i = 1; i < w.length; i++){ var v = zwei(w.slice(0, i).join(' '), w.slice(i).join(' ')); if (!bestZ || v.g > bestZ.g) bestZ = v; }
    if (bestZ) l.push(bestZ);
    if (w.length === 1){   // ein langes Wort: an einer Silbengrenze nahe der Mitte trennen, mit Bindestrich
      var stellen = Kern.trennstellen(t), mitte = t.length / 2, stelle = -1;
      stellen.forEach(function(k){ if (k >= 3 && t.length - k >= 3 && (stelle < 0 || Math.abs(k - mitte) < Math.abs(stelle - mitte))) stelle = k; });
      if (stelle > 0) l.push(zwei(t.slice(0, stelle) + '-', t.slice(stelle)));
    }
    return l;
  }
  // Grösste Schrift für diesen Text (zwei Zeilen nur, wenn sie deutlich grösser werden)
  function groesste(t, s){ var l = varianten(t, s), g = l[0].g; l.slice(1).forEach(function(v){ if (v.g > l[0].g * 1.15) g = Math.max(g, v.g); }); return g; }
  // Einheitliche Schrift für viele Texte: die kleinste der grössten – so sind alle Felder eines Blatts gleich gross beschriftet
  function einheit(texte, s){ return Math.min.apply(null, texte.map(function(t){ return groesste(t, s); })); }
  // Text ins Feld (Mitte x, y) mit der Schriftgrösse g: eine Zeile, wenn sie passt, sonst die passende Variante mit zwei Zeilen
  function feldText(x, y, s, t, g){
    var l = varianten(t, s), v = l[0];
    if (!v.bruch && v.g < g - 0.01) v = l.filter(function(x2){ return x2.g >= g - 0.01; })[0] || l.reduce(function(a, b2){ return b2.g > a.g ? b2 : a; });
    if (v.bruch){
      var m = v.bruch, n = Math.max(m[1].length, m[2].length);
      return '<text x="' + f1(x) + '" y="' + f1(y - g * 0.18) + '" font-size="' + f1(g) + '" font-weight="600" text-anchor="middle" fill="' + TINTE + '">' + m[1] + '</text>' +
        '<path d="M' + f1(x - g * 0.6 * n * 0.55 - 2) + ' ' + f1(y) + 'h' + f1(g * 0.66 * n + 4) + '" stroke="' + TINTE + '" stroke-width="' + f1(Math.max(1, g * 0.08)) + '"/>' +
        '<text x="' + f1(x) + '" y="' + f1(y + g * 0.92) + '" font-size="' + f1(g) + '" font-weight="600" text-anchor="middle" fill="' + TINTE + '">' + m[2] + '</text>';
    }
    return v.z.map(function(z, k){ return '<text x="' + f1(x) + '" y="' + f1(y + (k - (v.z.length - 1) / 2) * g * 1.12 + g * 0.36) + '" font-size="' + f1(g) + '" font-weight="600" text-anchor="middle" fill="' + TINTE + '">' + esc(z) + '</text>'; }).join('');
  }
  // Raster als SVG; breite: Zeichenfläche des Blatts (hoch 639, quer 968 Pixel)
  function rasterSvg(R, s, loesung, breite){
    var BB = breite || B, H = R.feld.length, W = R.feld[0].length, x0 = (BB - W * s) / 2, t = '';
    var g = einheit([].concat.apply([], R.feld.map(function(r){ return r.map(function(c){ return c.b; }); })), s);
    R.feld.forEach(function(r, y){ r.forEach(function(c, x){
      var fx = x0 + x * s, fy = y * s;
      if (loesung && c.teil) t += '<rect x="' + f1(fx) + '" y="' + f1(fy) + '" width="' + f1(s) + '" height="' + f1(s) + '" fill="' + (st.opt.farbig ? PLATTFARBE : '#D8D2CC') + '"/>';
      t += feldText(fx + s / 2, fy + s / 2, s, c.b, g);
    }); });
    var d = '';
    for (var i = 1; i < W; i++) d += 'M' + f1(x0 + i * s) + ' 0V' + f1(H * s);
    for (var j = 1; j < H; j++) d += 'M' + f1(x0) + ' ' + f1(j * s) + 'H' + f1(x0 + W * s);
    t += '<path d="' + d + '" stroke="#8A8079" stroke-width="1"/><rect x="' + f1(x0) + '" y="0" width="' + f1(W * s) + '" height="' + f1(H * s) + '" fill="none" stroke="' + TINTE + '" stroke-width="2"/>';
    return '<svg class="pt-raster" width="' + BB + '" height="' + f1(H * s + 1) + '" viewBox="0 -0.5 ' + BB + ' ' + f1(H * s + 1) + '">' + t + '</svg>';
  }
  // Plättchen (eine Seite); gPl: eine Schriftgrösse für alle Plättchen (auch über mehrere Seiten)
  function plaettchenSvg(liste, s, sp, gPl){
    var zeilen = Math.ceil(liste.length / sp), x0 = (B - sp * s) / 2, t = '';
    liste.forEach(function(p, i){
      var fx = x0 + (i % sp) * s, fy = Math.floor(i / sp) * s;
      if (st.opt.farbig) t += '<rect x="' + f1(fx) + '" y="' + f1(fy) + '" width="' + f1(s) + '" height="' + f1(s) + '" fill="' + PLATTFARBE + '"/>';
      t += feldText(fx + s / 2, fy + s / 2, s, p.a, gPl);
    });
    // Schnittlinien nur um die Plättchen (volle Zeilen als Raster, in der letzten Zeile nur so weit, wie Plättchen da sind)
    var d = '', voll = Math.floor(liste.length / sp), rest = liste.length % sp;
    for (var j = 0; j <= voll; j++) d += 'M' + f1(x0) + ' ' + f1(j * s) + 'H' + f1(x0 + sp * s);
    for (var i = 0; i <= sp; i++) d += 'M' + f1(x0 + i * s) + ' 0V' + f1(voll * s);
    if (rest){ d += 'M' + f1(x0) + ' ' + f1((voll + 1) * s) + 'H' + f1(x0 + rest * s); for (var k = 0; k <= rest; k++) d += 'M' + f1(x0 + k * s) + ' ' + f1(voll * s) + 'V' + f1((voll + 1) * s); }
    t += '<path d="' + d + '" stroke="#8A8079" stroke-width="1" stroke-dasharray="4 3"/>';
    return '<svg class="pt-plaettchen" width="' + B + '" height="' + f1(zeilen * s + 1) + '" viewBox="0 -0.5 ' + B + ' ' + f1(zeilen * s + 1) + '">' + t + '</svg>';
  }
  var R = null;
  function zeichnen(){
    if (aus) return;
    var L = PS.lesen(st.code, MAX), h = '', o = st.opt;
    if (L.weg.length) h += '<p class="warnung">' + esc(L.weg.join(' ')) + tx(' gibt es in der Blockschrift nicht – nur Buchstaben A–Z und Ziffern.</p>');
    if (L.zuViele) h += '<p class="warnung">' + tx('Höchstens {n} Zeichen.', { n:MAX }) + '</p>';
    var z = L.zeichen, g = z.length ? Kern.raster(z, PS.ZEICHEN, PS.BREITE, PS.HOEHE, MAX, o.rand) : null;
    var n = g ? g.reduce(function(a, r){ return a + r.filter(Boolean).length; }, 0) : 0, m = g ? g.length * g[0].length - n : 0;
    if (g) h += '<p class="pt-info">' + tx('{n} Plättchen, Raster {b} × {h} ({m} Ablenk-Felder).', { n:n, b:g[0].length, h:g.length, m:m }) + '</p>';
    $('#ptZaehler').innerHTML = h;
    var fehlt = !z.length ? tx('Ziffern oder Buchstaben') : fehltNoch();
    $('#ptPaarInfo').innerHTML = '';
    var aus2 = function(text){ R = null; $('#ptSeiten').innerHTML = ''; $('#ptLoesung').parentNode.hidden = true; ['#ptPdf', '#ptHerunterladen', '#ptZeigeLoesung', '#ptNeu'].forEach(function(s){ $(s).disabled = true; }); meldung('info', text); };
    if (fehlt) return aus2('<p>' + tx('Wähle links {x}.', { x:fehlt }) + '</p>');
    var rnd = Kern.zufall(st.seed), vert = Kern.verteilen(pool(rnd), n, m, rnd);
    if (vert.fehler){
      $('#ptPaarInfo').innerHTML = '<p class="warnung">' + tx('Zu wenige Paare: {f}.', { f:esc(vert.fehler) }) + ' ' + (KOEPFE[o.fach] ? tx('Ergänze die Liste – es braucht {n} oder mehr Paare.', { n:n + 3 }) : tx('Wähle mehr aus (z. B. einen grösseren Zahlenraum oder mehr Reihen).')) + '</p>';
      return aus2(tx('<p>Es hat noch zu wenige Aufgaben.</p>'));
    }
    if (vert.vielfalt < Math.min(m, 4)) $('#ptPaarInfo').innerHTML = '<p class="warnung">' + tx('Nur {n} verschiedene Ablenk-Antworten – sie kommen mehrmals vor. Mehr Paare oder ein grösserer Zahlenraum geben mehr Abwechslung.', { n:vert.vielfalt }) + '</p>';
    else if (vert.wiederholt) $('#ptPaarInfo').innerHTML = '<p class="pt-info">' + vert.wiederholt + tx(' Plättchen wiederholen eine Aufgabe (es gibt zu wenige verschiedene) – das geht: Gleiche Plättchen kommen auf gleiche Antworten.</p>');
    var feld = Kern.belegen(g, vert, rnd);
    if (!Kern.pruefen(feld, vert.plaettchen)) return aus2(tx('<p>Interner Fehler beim Verteilen – bitte «Neu mischen».</p>'));
    R = { g:g, feld:feld, plaettchen:vert.plaettchen, code:z.join('') };
    meldung(''); ['#ptPdf', '#ptHerunterladen', '#ptZeigeLoesung', '#ptNeu'].forEach(function(s){ $(s).disabled = false; }); $('#ptLoesung').parentNode.hidden = false;
    // Feldgrösse: Raster und Plättchen gleich gross (höchstens 26 mm), Raster passt aufs Blatt
    /* Alle Zeichen in einer Reihe. Feldgrösse: Raster und Plättchen gleich gross, höchstens 26 mm. Würden die Felder
       hochkant kleiner als 20 mm, kommen Raster und Lösung auf ein Blatt im Querformat (PDF: A4 quer). */
    var W = g[0].length, H = g.length, BQ = 968;
    var sHoch = Math.min(26 * MM, (B - 2) / W, (o.anleitungAn ? 770 : 850) / H), sQuer = Math.min(26 * MM, (BQ - 2) / W, (o.anleitungAn ? 470 : 540) / H);
    var quer = sHoch < 20 * MM && sQuer > sHoch, s = quer ? sQuer : sHoch, BB = quer ? BQ : B, sp = Math.floor((B - 2) / s), proSeite = sp * Math.floor(940 / s);
    var anleitung = tx('Schneide die Plättchen aus. Löse die Aufgabe auf jedem Plättchen und lege es auf das Feld mit der richtigen Antwort. ') +
      tx(z.length > 1 ? 'Nicht jede Antwort im Raster gehört zu einem Plättchen. Welche Zeichen entstehen?' : 'Nicht jede Antwort im Raster gehört zu einem Plättchen. Welche Ziffer oder welcher Buchstabe entsteht?');
    var html = '<div class="pt-rahmen"><article class="pt-blatt pt-seite' + (quer ? ' blatt-quer' : '') + '">' + (o.titelAn ? tx('<h2>Plättchenrätsel</h2>') : '') + (o.anleitungAn ? '<p class="pt-anleitung">' + esc(anleitung) + '</p>' : '') +
      rasterSvg(R, s, false, BB) + (o.linie ? tx('<p class="pt-antwort">Lösung: <span class="pt-linie"></span></p>') : '') + '</article></div>';
    var gPl = einheit(R.plaettchen.map(function(x){ return x.a; }), s);
    for (var i = 0; i < R.plaettchen.length; i += proSeite){
      var teil = R.plaettchen.slice(i, i + proSeite), seiten = Math.ceil(R.plaettchen.length / proSeite);
      html += tx('<div class="pt-rahmen"><article class="pt-blatt pt-seite"><p class="pt-seitenkopf">✂ Plättchen zum Ausschneiden') + (seiten > 1 ? ' – ' + tx('Seite {i} von {n}', { i:i / proSeite + 1, n:seiten }) : '') + ' · ' + tx('{n} Stück', { n:R.plaettchen.length }) + '</p>' +
        plaettchenSvg(teil, s, sp, gPl) + '</article></div>';
    }
    $('#ptSeiten').innerHTML = html;
    $('#ptLoesung').classList.toggle('blatt-quer', quer);
    $('#ptLoesung').innerHTML = (o.titelAn ? tx('<h2>Plättchenrätsel – Lösung</h2>') : tx('<p class="pt-anleitung"><b>Lösung</b></p>')) + rasterSvg(R, s, true, BB) + tx('<p class="pt-loesung-text">Lösung: <b>') + esc(R.code) + '</b></p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#ptSeiten .pt-blatt')).concat(st.opt.mitLoesung ? [$('#ptLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#ptPdf'), function(){ return R && { blaetter:blaetter(), name:Labor.pdfName('Plaettchenraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#ptPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#ptHerunterladen').hidden = false; });
  }
  $('#ptHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = Labor.pdfName('Plaettchenraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Plättchenrätsel'), inhalt, '.pt-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
