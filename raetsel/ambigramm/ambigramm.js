/* Rätsellabor – Generator «Ambigramm»
   Ein Wort, das man auch auf dem Kopf lesen kann (um 180° gedreht): dasselbe Wort oder ein zweites.
   So entsteht es: Der i-te Buchstabe des ersten Worts und – um 180° gedreht – der i-te Buchstabe von hinten des zweiten
   Worts werden übereinander in dasselbe Feld gezeichnet. Aufrecht liest man so das erste Wort, gedreht das zweite.
   Paare, die gedreht ohnehin gleich aussehen (n/u, d/p, b/q, m/w, s/s, o/o …), werden nur einmal gezeichnet.
   Gedreht wird um die Mitte der Kleinbuchstaben (bei lauter Grossbuchstaben um die Mitte der Grossbuchstaben),
   damit beide Lesarten auf derselben Grundlinie stehen. Herunterladen als Bild (PNG) oder PDF. */
(function(){
'use strict';

/* Schriften (Google Fonts, freie Lizenz) – ausgewählt, weil übereinandergelegte Buchstaben in ihnen gut lesbar bleiben
   (sehr fette Schriften und verbundene Schreibschriften verschmieren dabei). Cinzel und Amatic haben nur Grossbuchstaben. */
var SCHRIFTEN = [
  ['elegant', 'Elegant', '"Playfair Display", Georgia, serif', '600'],
  ['fraktur', 'Fraktur', '"UnifrakturMaguntia", serif', '400'],
  ['gotisch', 'Gotisch', '"Pirata One", serif', '400'],
  ['schwung', 'Schwung', '"Lobster", cursive', '400'],
  ['klar', 'Klar', '"Josefin Sans", Arial, sans-serif', '500'],
  ['rund', 'Rund', '"Comfortaa", Arial, sans-serif', '600'],
  ['antik', 'Antik', '"Cinzel", Georgia, serif', '600'],
  ['handschrift', 'Handschrift', '"Amatic SC", cursive', '700']
];
var SCHRIFT_CSS = 'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Cinzel:wght@600&family=Comfortaa:wght@600&family=Josefin+Sans:wght@500&family=Lobster&family=Pirata+One&family=Playfair+Display:wght@600&family=UnifrakturMaguntia&display=swap';
var FARBEN = [['#1C1714', 'Schwarz'], ['#E0741C', 'Orange'], ['#1E63C4', 'Blau'], ['#C62828', 'Rot'], ['#2E7D32', 'Grün'], ['#7B3FB5', 'Lila'], ['#B8860B', 'Gold']];
// Buchstaben, die um 180° gedreht wie ein anderer (oder derselbe) aussehen
var GEDREHT = { n:'u', u:'n', d:'p', p:'d', b:'q', q:'b', m:'w', w:'m', s:'s', o:'o', x:'x', z:'z', l:'l',
  N:'N', S:'S', Z:'Z', O:'O', X:'X', H:'H', I:'I', M:'W', W:'M' };

/* ---------- Zeichnen ----------
   o: { wort1, wort2, schrift, fall, farbe, grund ('weiss' | 'durchsichtig' | 'farbe'), grundFarbe, abstand, F } → Canvas */
function schreibung(t, fall){ t = String(t || '').trim().replace(/\s+/g, ' '); return fall === 'gross' ? t.toUpperCase() : fall === 'klein' ? t.toLowerCase() : t; }
function zeichne(o){
  var S = SCHRIFTEN.filter(function(s){ return s[0] === o.schrift; })[0] || SCHRIFTEN[0], F = o.F || 240;
  var c = document.createElement('canvas'), g = c.getContext('2d'), font = S[3] + ' ' + F + 'px ' + S[2];
  g.font = font;
  var t1 = schreibung(o.wort1, o.fall), t2 = schreibung(o.wort2, o.fall) || t1;
  var a1 = Array.from(t1), a2 = Array.from(t2), n = Math.max(a1.length, a2.length);
  function auffuellen(a){ var d = n - a.length, l = Math.floor(d / 2), r = []; for (var i = 0; i < l; i++) r.push(' '); r = r.concat(a); while (r.length < n) r.push(' '); return r; }
  a1 = auffuellen(a1); a2 = auffuellen(a2);
  var gross = !/\p{Ll}/u.test(t1 + t2), mitte = g.measureText(gross ? 'H' : 'x').actualBoundingBoxAscent / 2;   // Drehpunkt über der Grundlinie
  var sp = (o.abstand || 0) * F, zellen = [], x = 0, links = 0, rechts = 0, oben = -mitte, unten = -mitte;
  for (var i = 0; i < n; i++){
    var a = a1[i], b = a2[n - 1 - i], ma = g.measureText(a), mb = g.measureText(b);
    var nurA = b === ' ' || GEDREHT[a] === b, nurB = a === ' ' && b !== ' ';
    var w = Math.max(a === ' ' ? 0 : ma.width, b === ' ' || nurA ? 0 : mb.width, F * 0.28), cx = x + w / 2;
    var z = { a:a, b:b, ma:ma, mb:mb, cx:cx, zeigA:a !== ' ' && !nurB, zeigB:b !== ' ' && !nurA };
    if (z.zeigA){
      var pa = cx - ma.width / 2;
      links = Math.min(links, pa - ma.actualBoundingBoxLeft); rechts = Math.max(rechts, pa + ma.actualBoundingBoxRight);
      oben = Math.min(oben, -ma.actualBoundingBoxAscent); unten = Math.max(unten, ma.actualBoundingBoxDescent);
    }
    if (z.zeigB){   // gedreht um (cx, −mitte): x → 2cx − x, y → −2·mitte − y
      var pb = cx - mb.width / 2;
      links = Math.min(links, 2 * cx - (pb + mb.actualBoundingBoxRight)); rechts = Math.max(rechts, 2 * cx - (pb - mb.actualBoundingBoxLeft));
      oben = Math.min(oben, -2 * mitte - mb.actualBoundingBoxDescent); unten = Math.max(unten, -2 * mitte + mb.actualBoundingBoxAscent);
    }
    zellen.push(z); x += w + sp;
  }
  var halb = Math.max(-mitte - oben, unten + mitte), R = Math.round(F * 0.16);   // oben und unten gleich viel Platz: gedreht liegt es gleich
  c.width = Math.max(1, Math.ceil(rechts - links + 2 * R)); c.height = Math.max(1, Math.ceil(2 * halb + 2 * R));
  g = c.getContext('2d'); g.font = font; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if (o.grund !== 'durchsichtig'){ g.fillStyle = o.grund === 'farbe' ? o.grundFarbe : '#ffffff'; g.fillRect(0, 0, c.width, c.height); }
  var x0 = R - links, ym = R + halb, y0 = ym + mitte;   // ym: Drehpunkt (Mitte des Bilds), y0: Grundlinie
  g.fillStyle = o.farbe || '#1C1714';
  zellen.forEach(function(z){
    var cx = x0 + z.cx;
    if (z.zeigA) g.fillText(z.a, cx - z.ma.width / 2, y0);
    if (z.zeigB){ g.save(); g.translate(cx, ym); g.rotate(Math.PI); g.translate(-cx, -ym); g.fillText(z.b, cx - z.mb.width / 2, y0); g.restore(); }
  });
  return c;
}

var VORLAGE = '<div class="am">' +
  '<header class="am-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Ambigramm</h1>' +
    '<p>Ein Wort, das man auch auf dem Kopf lesen kann – dasselbe Wort oder ein zweites. Schrift und Farbe wählen, dann als Bild oder PDF herunterladen.</p></header>' +
  '<div class="am-layout"><section class="am-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Wörter</h2><p>Kurze Wörter und Namen gelingen am besten.</p></div></div>' +
      '<label class="am-feld"><span>Wort</span><input type="text" id="amWort1" maxlength="16" autocomplete="off" spellcheck="false"></label>' +
      '<label class="am-feld"><span>Auf dem Kopf gelesen <small>(leer = dasselbe Wort)</small></span><input type="text" id="amWort2" maxlength="16" autocomplete="off" spellcheck="false"></label>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Schrift</h2></div></div>' +
      '<div class="am-schriften" role="radiogroup" aria-label="Schrift">' +
        SCHRIFTEN.map(function(s){ return '<label><input type="radio" name="amSchrift" value="' + s[0] + '"><span><i style="font-family:' + s[2].replace(/"/g, '&quot;') + ';font-weight:' + s[3] + '">Abc</i>' + s[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="feld-label am-abstand-titel">Schreibweise</p>' +
      '<div class="am-chips" role="radiogroup" aria-label="Schreibweise">' +
        [['klein', 'klein'], ['gross', 'GROSS'], ['wie', 'wie geschrieben']].map(function(f){ return '<label><input type="radio" name="amFall" value="' + f[0] + '"><span>' + f[1] + '</span></label>'; }).join('') + '</div>' +
      '<label class="am-regler"><span>Buchstabenabstand</span><input type="range" id="amAbstand" min="-12" max="30" step="1"></label>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Farben</h2></div></div>' +
      '<p class="feld-label">Schriftfarbe</p>' +
      '<div class="am-farben" role="radiogroup" aria-label="Schriftfarbe">' +
        FARBEN.map(function(f){ return '<label title="' + f[1] + '"><input type="radio" name="amFarbe" value="' + f[0] + '"><span style="background:' + f[0] + '"></span><b class="vh">' + f[1] + '</b></label>'; }).join('') +
        '<label class="am-eigene" title="Eigene Farbe"><input type="color" id="amFarbeEigen" aria-label="Eigene Schriftfarbe"></label></div>' +
      '<p class="feld-label am-grund-titel">Hintergrund</p>' +
      '<div class="am-chips" role="radiogroup" aria-label="Hintergrund">' +
        [['weiss', 'Weiss'], ['durchsichtig', 'Durchsichtig'], ['farbe', 'Farbig']].map(function(f){ return '<label><input type="radio" name="amGrund" value="' + f[0] + '"><span>' + f[1] + '</span></label>'; }).join('') +
        '<input type="color" id="amGrundFarbe" aria-label="Hintergrundfarbe"></div>' +
      '<p class="hinweis">Durchsichtig: Das Bild (PNG) lässt sich auf jeden Hintergrund legen, z. B. in Word oder auf einer Karte.</p>' +
    '</div>' +
  '</section>' +
  '<section class="am-ausgabe" aria-label="Ambigramm">' +
    '<div id="amMeldung" aria-live="polite"></div>' +
    '<div class="am-werkzeug">' +
      '<button type="button" class="btn klein" id="amDrehen" aria-pressed="false">Auf den Kopf drehen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<button type="button" class="btn klein" id="amPng">Als Bild (PNG)</button>' +
      '<button type="button" class="btn klein primary" id="amPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="amHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Blatt herunterladen</button>' +
    '</div>' +
    '<article class="am-blatt" id="amBlatt"></article>' +
    '<p class="am-info" id="amInfo"></p>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 10V6a2 2 0 0 1 4 0v4M4 8h4"/><path d="M20 14v4a2 2 0 0 1-4 0v-4M20 16h-4"/><path d="M14 4.5a7.5 7.5 0 0 1 5 4.5M10 19.5A7.5 7.5 0 0 1 5 15"/><path d="M19 5v4h-4M5 19v-4h4"/></svg>';

Labor.registriere({
  id:'ambigramm',
  titel:'Ambigramm',
  kurz:'Wörter, die man auch auf dem Kopf lesen kann',
  beschreibung:'Aus einem Wort wird ein Ambigramm: Auf den Kopf gedreht liest man dasselbe Wort – oder ein zweites. Verschiedene Schriften und Farben, als Bild oder PDF zum Herunterladen.',
  merkmale:['Acht Schriften', 'Farbe frei wählbar', 'Als Bild oder PDF'],
  symbol:SYMBOL,
  css:'raetsel/ambigramm/ambigramm.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'ambigramm-eingaben', OPT = 'ambigramm-einstellungen';
  var STANDARD = { schrift:'elegant', fall:'klein', abstand:4, farbe:'#1C1714', grund:'weiss', grundFarbe:'#FFF1E5', titelAn:true, anleitungAn:true };
  var st = { wort1:'', wort2:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.wort1 = String(e.wort1 || ''); st.wort2 = String(e.wort2 || ''); } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ wort1:st.wort1, wort2:st.wort2 })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#amMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  // die zusätzlichen Schriften einmal laden (nur für diesen Generator)
  if (!document.getElementById('amSchriften')){
    var l = document.createElement('link'); l.id = 'amSchriften'; l.rel = 'stylesheet'; l.href = SCHRIFT_CSS; document.head.appendChild(l);
  }
  function schriftLaden(){
    var S = SCHRIFTEN.filter(function(s){ return s[0] === st.opt.schrift; })[0] || SCHRIFTEN[0];
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var probe = schreibung(st.wort1 + st.wort2, st.opt.fall) || 'Abc';
    return document.fonts.load(S[3] + ' 100px ' + S[2], probe).catch(function(){});
  }

  /* ---------- Eingaben ---------- */
  $('#amWort1').value = st.wort1; $('#amWort2').value = st.wort2;
  $('#amWort1').addEventListener('input', function(){ st.wort1 = this.value; speichern(); bald(); });
  $('#amWort2').addEventListener('input', function(){ st.wort2 = this.value; speichern(); bald(); });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[k];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = r.value; speichern(); grundZeigen(); neu(); });
    });
  }
  radios('amSchrift', 'schrift'); radios('amFall', 'fall'); radios('amGrund', 'grund');
  function farbeZeigen(){
    var bekannt = false;
    [].forEach.call(bereich.querySelectorAll('input[name="amFarbe"]'), function(r){ r.checked = r.value.toLowerCase() === st.opt.farbe.toLowerCase(); bekannt = bekannt || r.checked; });
    $('#amFarbeEigen').value = st.opt.farbe; $('#amFarbeEigen').parentNode.classList.toggle('gewaehlt', !bekannt);
  }
  [].forEach.call(bereich.querySelectorAll('input[name="amFarbe"]'), function(r){
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.farbe = r.value; speichern(); farbeZeigen(); neu(); });
  });
  $('#amFarbeEigen').addEventListener('input', function(){ st.opt.farbe = this.value; speichern(); farbeZeigen(); bald(); });
  $('#amGrundFarbe').value = st.opt.grundFarbe;
  $('#amGrundFarbe').addEventListener('input', function(){ st.opt.grundFarbe = this.value; if (st.opt.grund !== 'farbe'){ st.opt.grund = 'farbe'; radiosNeu(); } speichern(); bald(); });
  function radiosNeu(){ [].forEach.call(bereich.querySelectorAll('input[name="amGrund"]'), function(r){ r.checked = r.value === st.opt.grund; }); grundZeigen(); }
  function grundZeigen(){ $('#amGrundFarbe').classList.toggle('aktiv', st.opt.grund === 'farbe'); }
  $('#amAbstand').value = String(st.opt.abstand);
  $('#amAbstand').addEventListener('input', function(){ st.opt.abstand = +this.value; speichern(); bald(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); blatt(); });

  /* ---------- Ambigramm ---------- */
  var bild = null, warte = 0;
  function bald(){ if (!warte) warte = requestAnimationFrame(function(){ warte = 0; neu(); }); }
  function optionen(F){ return { wort1:st.wort1, wort2:st.wort2, schrift:st.opt.schrift, fall:st.opt.fall, farbe:st.opt.farbe, grund:st.opt.grund, grundFarbe:st.opt.grundFarbe, abstand:st.opt.abstand / 100, F:F }; }
  function neu(){
    if (aus) return;
    var leer = !schreibung(st.wort1, st.opt.fall);
    ['#amDrehen', '#amPng', '#amPdf', '#amHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ bild = null; $('#amBlatt').innerHTML = ''; $('#amBlatt').hidden = true; $('#amInfo').textContent = '';
      meldung('info', '<p>Schreibe links ein Wort – daraus wird das Ambigramm.</p>'); return; }
    meldung('', ''); $('#amBlatt').hidden = false;
    bild = zeichne(optionen(240));
    blatt();
    var w1 = schreibung(st.wort1, st.opt.fall), w2 = schreibung(st.wort2, st.opt.fall) || w1;
    $('#amInfo').innerHTML = 'Aufrecht: <b>' + esc(w1) + '</b> · auf dem Kopf: <b>' + esc(w2) + '</b>';
  }
  function blatt(){
    if (!bild) return;
    var o = st.opt, gedreht = $('#amDrehen').getAttribute('aria-pressed') === 'true';
    $('#amBlatt').innerHTML = (o.titelAn ? '<h2>Ambigramm</h2>' : '') +
      (o.anleitungAn ? '<p class="am-anleitung">Lies das Wort. Dann drehe das Blatt auf den Kopf – was steht jetzt da?</p>' : '') +
      '<div class="am-bild' + (o.grund === 'durchsichtig' ? ' schachbrett' : '') + '"><img id="amBild" class="' + (gedreht ? 'gedreht' : '') + '" src="' + bild.toDataURL('image/png') + '" alt="Ambigramm"></div>';
  }
  $('#amDrehen').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    var img = $('#amBild'); if (img) img.classList.toggle('gedreht', an);
  });

  /* ---------- Herunterladen ---------- */
  function name(endung){ var w = Labor.dateiname(schreibung(st.wort1, st.opt.fall)); return 'Ambigramm' + (w ? '-' + w : '') + '.' + endung; }
  var speicherOrt = null;
  $('#amPng').addEventListener('click', function(){
    if (!bild) return;
    var gross = zeichne(optionen(320));
    if (speicherOrt){   // im Artefakt: als SVG-Datei mit eingebettetem Bild
      var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + gross.width + '" height="' + gross.height + '"><image width="' + gross.width + '" height="' + gross.height + '" href="' + gross.toDataURL('image/png') + '"/></svg>';
      speicherOrt.save({ filename:name('svg'), data:svg }).catch(function(e){ if (!e || e.code !== 'declined') meldung('warnung', '<p>Das Speichern hat nicht geklappt.</p>'); });
      return;
    }
    gross.toBlob(function(b){
      if (!b) return;
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name('png');
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
    }, 'image/png');
  });
  function druckBlatt(){ var b = $('#amBlatt'), img = $('#amBild'); if (img && img.classList.contains('gedreht')){ img.classList.remove('gedreht'); $('#amDrehen').setAttribute('aria-pressed', 'false'); } return b; }
  Labor.pdfKnopf($('#amPdf'), function(){ return bild && { blaetter:[druckBlatt()], name:name('pdf') }; }, function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  if (Labor.imArtefakt()){
    $('#amPdf').hidden = true; $('#amPng').textContent = 'Als Bild (SVG)';
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#amHerunterladen').hidden = false; });
  }
  $('#amHerunterladen').addEventListener('click', function(){
    if (!bild || !speicherOrt) return;
    var k = druckBlatt().cloneNode(true); k.removeAttribute('id'); k.removeAttribute('hidden');
    speicherOrt.save({ filename:name('html'), data:Labor.blattDatei('Ambigramm', k.outerHTML) }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  farbeZeigen(); grundZeigen(); neu();
  schriftLaden().then(function(){ if (!aus) neu(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus) neu(); });
  [].forEach.call(bereich.querySelectorAll('input[name="amSchrift"]'), function(r){ r.addEventListener('change', function(){ schriftLaden().then(function(){ if (!aus) neu(); }); }); });
  $('#amWort1').addEventListener('change', function(){ schriftLaden().then(function(){ if (!aus) neu(); }); });
  $('#amWort2').addEventListener('change', function(){ schriftLaden().then(function(){ if (!aus) neu(); }); });
  return function stopp(){ aus = true; if (timer) speichernJetzt(); };
}
window.Ambigramm = { zeichne:zeichne, SCHRIFTEN:SCHRIFTEN };   // für Tests
})();
