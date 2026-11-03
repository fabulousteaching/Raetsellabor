/* Rätsellabor – Generator «QR-Code»
   Zwei Teile:
   – Zum Ausmalen: Aus einem Text oder Link entsteht ein Raster. Die Kinder malen die richtigen Felder aus; ist alles
     richtig, lässt sich der Code mit Tablet oder Handy scannen und verrät die Botschaft (Selbstkontrolle).
     Woran die Felder erkennbar sind: Kreise, Zahlen (gerade oder aus einer Einmaleins-Reihe) oder Rechnungen
     (Ergebnis gerade). Die Erkennungsquadrate in den Ecken können vorgedruckt sein.
   – Fertige QR-Codes: ein oder mehrere Codes mit Titel, als Blatt zum Ausdrucken oder als Bild.
   Die QR-Codes berechnet gemeinsam/extern/qrcode.js (Kazuhiko Arase, MIT-Lizenz). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var STUFEN = { L:7, M:15, Q:25, H:30 };   // so viel Prozent der Datenblöcke darf beschädigt sein (QR-Norm)
  // Fehlerkorrektur-Wörter je Version (1–6) und Stufe, und wie viele davon kleine Codes zum Schutz vor Fehllesungen brauchen.
  // Daraus: wie viele einzeln verstreute Ausmalfehler ein Code sicher verträgt (mit dem QR-Leser jsQR nachgemessen).
  var KORREKTUR = { L:[7, 10, 15, 20, 26, 36], M:[10, 16, 26, 36, 48, 64], Q:[13, 22, 36, 52, 72, 96], H:[17, 28, 44, 64, 88, 112] };
  var SCHUTZ = { L:[3, 2, 1], M:[2], Q:[1], H:[1] };
  var BLOECKE = { L:[1, 1, 1, 1, 1, 2], M:[1, 1, 1, 2, 2, 4], Q:[1, 1, 2, 2, 4, 4], H:[1, 1, 2, 4, 4, 4] };   // Fehler verteilen sich ungleich auf Blöcke
  // Mittelpunkte der kleinen Ausrichtungsquadrate je Version (QR-Norm)
  var AUSRICHTUNG = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var GRENZE = { punkte:41, zahlen:33, rechnungen:25 };   // grösstes Raster je Ausmal-Art (Felder pro Seite)

  /* QR-Code berechnen → { n, version, dunkel[r][c] }; zu langer Text → null */
  function code(text, stufe){
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];   // Umlaute richtig
    var q;
    try { q = qrcode(0, stufe || 'M'); q.addData(String(text), 'Byte'); q.make(); } catch(e){ return null; }
    var n = q.getModuleCount(), d = [];
    for (var r = 0; r < n; r++){ var z = []; for (var c = 0; c < n; c++) z.push(q.isDark(r, c)); d.push(z); }
    return { n:n, version:(n - 17) / 4, dunkel:d };
  }
  /* Erkennungsmuster: die drei grossen Quadrate (mit hellem Rand) und die kleinen Ausrichtungsquadrate */
  function muster(n){
    var v = (n - 17) / 4, m = [];
    for (var r = 0; r < n; r++){ var z = []; for (var c = 0; c < n; c++) z.push(false); m.push(z); }
    function feld(r0, c0, g){ for (var r = r0; r < r0 + g; r++) for (var c = c0; c < c0 + g; c++) if (r >= 0 && c >= 0 && r < n && c < n) m[r][c] = true; }
    feld(0, 0, 8); feld(0, n - 8, 8); feld(n - 8, 0, 8);
    var p = AUSRICHTUNG[v] || [];
    p.forEach(function(a){ p.forEach(function(b){
      if ((a < 9 && b < 9) || (a < 9 && b > n - 10) || (a > n - 10 && b < 9)) return;
      feld(a - 2, b - 2, 5);
    }); });
    return m;
  }
  function zufall(seed){   // kleiner Zufallsgenerator, damit «Neu mischen» und das Lösungsblatt zusammenpassen
    var s = seed >>> 0 || 1;
    return function(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  }
  function zahl(min, max, r){ return min + Math.floor(r() * (max - min + 1)); }
  /* Eine Rechnung, deren Ergebnis gerade (bzw. ungerade) ist */
  function rechnung(gerade, art, r){
    for (var i = 0; i < 500; i++){
      var a, b, e, t;
      if (art === 'plus20'){ a = zahl(1, 19, r); b = zahl(1, 20 - a, r); e = a + b; t = a + '+' + b; }
      else if (art === 'minus20'){ a = zahl(2, 20, r); b = zahl(1, a - 1, r); e = a - b; t = a + '−' + b; }
      else if (art === 'pm100'){
        if (r() < 0.5){ a = zahl(2, 98, r); b = zahl(1, 100 - a, r); e = a + b; t = a + '+' + b; }
        else { a = zahl(3, 100, r); b = zahl(1, a - 1, r); e = a - b; t = a + '−' + b; }
      }
      else if (art === 'mal'){ a = zahl(2, 10, r); b = zahl(2, 10, r); e = a * b; t = a + '·' + b; }
      else { b = zahl(2, 10, r); e = zahl(1, 10, r); a = e * b; t = a + ':' + b; }
      if ((e % 2 === 0) === gerade) return { text:t, ergebnis:e };
    }
    return null;
  }
  /* Inhalt eines Felds. dunkel = muss ausgemalt werden. */
  function feldinhalt(dunkel, o, r){
    if (o.art === 'punkte') return dunkel ? '○' : '';   // Kreis mit weisser Mitte: vor dem Ausmalen nicht scannbar
    if (o.art === 'zahlen'){
      var k = o.regel === 'reihe' ? o.reihe : 2, max = o.regel === 'reihe' ? o.reihe * 10 : o.zahlenraum, x;   // Reihen wie im Einmaleins bis 10·k
      for (var i = 0; i < 500; i++){ x = zahl(1, max, r); if ((x % k === 0) === dunkel) return String(x); }
      return '';
    }
    var rc = rechnung(dunkel, o.rechenart, r);
    return rc ? rc.text : '';
  }
  /* Ganzes Ausmal-Raster: { n, dunkel, vorgedruckt, inhalt, anzahl (auszumalende Felder) } oder { fehler, … } */
  function raster(text, o){
    var q = code(text, o.stufe);
    if (!q) return { fehler:'zuLang' };
    var grenze = GRENZE[o.art] || 41;
    if (q.n > grenze) return { fehler:'zuGross', n:q.n, grenze:grenze };
    var m = o.ecken ? muster(q.n) : null, r = zufall(o.seed || 1), inhalt = [], anzahl = 0;
    for (var y = 0; y < q.n; y++){
      var z = [];
      for (var x = 0; x < q.n; x++){
        var vor = !!(m && m[y][x]);
        if (!vor && q.dunkel[y][x]) anzahl++;
        z.push(vor ? '' : feldinhalt(q.dunkel[y][x], o, r));
      }
      inhalt.push(z);
    }
    return { n:q.n, version:q.version, dunkel:q.dunkel, vorgedruckt:m, inhalt:inhalt, anzahl:anzahl };
  }
  /* Kleinste Fehlertoleranz-Stufe, mit der der Text noch ins Raster passt */
  function passendeStufe(text, grenze){
    var s = ['H', 'Q', 'M', 'L'];
    for (var i = 0; i < s.length; i++){ var q = code(text, s[i]); if (q && q.n <= grenze) return s[i]; }
    return null;
  }
  /* Etwa so viele falsch ausgemalte oder vergessene Felder verträgt der Code (vorsichtig geschätzt) */
  function verzeiht(n, stufe){
    var v = (n - 17) / 4, k = KORREKTUR[stufe] && KORREKTUR[stufe][v - 1];
    if (!k) return null;
    var p = (SCHUTZ[stufe] || [])[v - 1] || 0, b = BLOECKE[stufe][v - 1];
    return Math.max(1, Math.floor((k - p) / 2 * (b === 1 ? 0.8 : b === 2 ? 0.7 : 0.6)));
  }
  return { STUFEN:STUFEN, GRENZE:GRENZE, code:code, muster:muster, raster:raster, rechnung:rechnung, zufall:zufall, passendeStufe:passendeStufe, verzeiht:verzeiht };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var VORLAGE = '<div class="qr">' +
  '<header class="qr-kopf"><p class="augenbraue">Rätselgenerator</p><h1>QR-Code</h1>' +
    '<p>Aus einem Text oder Link wird ein QR-Code: zum Ausmalen mit eingebauter Selbstkontrolle oder fertig zum Ausdrucken.</p></header>' +
  '<div class="qr-modus" role="tablist" aria-label="Was möchtest du erstellen?">' +
    '<button type="button" role="tab" id="qrTabMalen" data-modus="malen">Zum Ausmalen</button>' +
    '<button type="button" role="tab" id="qrTabFertig" data-modus="fertig">Fertige QR-Codes</button></div>' +
  '<div class="qr-layout"><section class="qr-eingabe" aria-label="Eingaben">' +
    /* ---- Zum Ausmalen ---- */
    '<div class="qr-teil" data-teil="malen">' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Botschaft</h2><p>Was zeigt das Handy, wenn der fertig ausgemalte Code gescannt wird?</p></div></div>' +
        '<label class="vh" for="qrText">Text oder Link</label>' +
        '<textarea id="qrText" rows="3" maxlength="300" placeholder="z. B. Super gemacht! Das Lösungswort ist SONNE." spellcheck="true"></textarea>' +
        '<p class="hinweis" id="qrTextInfo" aria-live="polite"></p></div>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Welche Felder ausmalen?</h2><p>Woran die Kinder erkennen, welche Felder sie ausmalen.</p></div></div>' +
        '<div class="qr-arten" role="radiogroup" aria-label="Ausmal-Art">' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="punkte"><span><b>Kreise</b><small>Felder mit einem Kreis ausmalen – schon ab der 1. Klasse</small></span></label>' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="zahlen"><span><b>Zahlen</b><small>gerade Zahlen oder Zahlen einer Einmaleins-Reihe ausmalen</small></span></label>' +
          '<label class="qr-art"><input type="radio" name="qrArt" value="rechnungen"><span><b>Rechnungen</b><small>rechnen – ist das Ergebnis gerade, wird ausgemalt</small></span></label>' +
        '</div>' +
        '<div class="opt-raster" data-fuer="zahlen"><label for="qrRegel">Ausmalen, wenn die Zahl …</label><select id="qrRegel"><option value="gerade">gerade ist</option>' +
          [3, 4, 5, 6, 7, 8, 9, 10].map(function(k){ return '<option value="' + k + '">in der ' + k + 'er-Reihe ist</option>'; }).join('') + '</select>' +
          '<label for="qrZahlenraum" data-gerade>Zahlenraum</label><select id="qrZahlenraum" data-gerade><option value="20">bis 20</option><option value="50">bis 50</option><option value="100">bis 100</option></select></div>' +
        '<div class="opt-raster" data-fuer="rechnungen"><label for="qrRechenart">Rechnungen</label><select id="qrRechenart">' +
          '<option value="plus20">Plus bis 20</option><option value="minus20">Minus bis 20</option><option value="pm100">Plus und Minus bis 100</option>' +
          '<option value="mal">Einmaleins (mal)</option><option value="geteilt">Einmaleins (geteilt)</option></select></div>' +
      '</div>' +
      '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
        '<div class="opt-raster"><label for="qrStufe">Fehlertoleranz</label><select id="qrStufe">' +
          '<option value="L">gering – kleinstes Raster</option><option value="M">mittel</option><option value="Q">hoch (empfohlen)</option><option value="H">sehr hoch – grösstes Raster</option></select>' +
          '<label for="qrTitel">Titel auf dem Blatt</label><input type="text" id="qrTitel" maxlength="60" placeholder="Male den QR-Code aus!"></div>' +
        '<label class="opt"><input type="checkbox" id="qrEcken"><span>Erkennungsquadrate in den Ecken schon ausgemalt</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrNummern"><span>Zeilen und Spalten nummerieren</span></label>' +
        '<p class="hinweis">Die Fehlertoleranz bestimmt, wie viele falsch ausgemalte Felder der Code verzeiht. Mehr Toleranz gibt ein grösseres Raster.</p>' +
      '</details></div>' +
      '<button type="button" class="btn primary gross" id="qrLos">QR-Code erstellen</button>' +
    '</div>' +
    /* ---- Fertige QR-Codes ---- */
    '<div class="qr-teil" data-teil="fertig" hidden>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>QR-Codes</h2><p>Pro Code ein Inhalt (Text oder Link), der Titel ist freiwillig.</p></div></div>' +
        '<ol class="qr-liste" id="qrListe"></ol>' +
        '<button type="button" class="btn" id="qrPlus">+ Weiterer QR-Code</button></div>' +
      '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Blatt</h2><p>Wie die Codes auf dem Blatt stehen.</p></div></div>' +
        '<div class="opt-raster"><label for="qrProBlatt">Codes pro Blatt</label><select id="qrProBlatt">' +
          [1, 2, 4, 6, 12].map(function(k){ return '<option value="' + k + '">' + k + '</option>'; }).join('') + '</select>' +
          '<label for="qrStufeFertig">Fehlertoleranz</label><select id="qrStufeFertig"><option value="L">7 %</option><option value="M">15 %</option><option value="Q">25 %</option><option value="H">30 %</option></select></div>' +
        '<label class="opt"><input type="checkbox" id="qrTitelZeigen"><span>Titel unter dem Code zeigen</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrInhaltZeigen"><span>Inhalt klein als Text darunter</span></label>' +
        '<label class="opt"><input type="checkbox" id="qrSchnitt"><span>Schnittlinien zum Ausschneiden</span></label>' +
      '</div>' +
    '</div>' +
  '</section>' +
  '<section class="qr-ausgabe" aria-label="Ergebnis">' +
    '<div id="qrMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="qrLeer"><h2>Noch kein QR-Code</h2><p>So entsteht ein QR-Code zum Ausmalen:</p><ol>' +
      '<li>Botschaft eingeben, z. B. ein Lob, ein Lösungswort oder einen Link</li><li>Wählen, woran die Kinder die Felder erkennen</li><li>«QR-Code erstellen» klicken</li></ol></div>' +
    '<div class="qr-werkzeug" id="qrWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="qrMischen" title="Gleicher Code, neue Zahlen oder Rechnungen">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="qrZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="qrMalWeg">Ausmalen löschen</button>' +
      '<span class="abstand"></span>' +
      '<label id="qrMitLoesungWahl"><input type="checkbox" id="qrMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="qrDrucken">Drucken</button>' +
      '<button type="button" class="btn klein primary" id="qrHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div id="qrBlaetter"></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' +
  '<path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20v1M20 14v1" stroke-linecap="round"/></svg>';

Labor.registriere({
  id:'qr-code',
  titel:'QR-Code',
  kurz:'QR-Codes zum Ausmalen und fertige Codes',
  beschreibung:'Aus einem Text oder Link wird ein QR-Code. Die Kinder malen ihn nach Kreisen, Zahlen oder Rechnungen aus – ist alles richtig, verrät das Handy die Botschaft. Oder fertige Codes zum Ausdrucken.',
  merkmale:['Selbstkontrolle durch Scannen', 'Kreise, Zahlen oder Rechnungen', 'Fertige Codes zum Ausdrucken'],
  symbol:SYMBOL,
  css:'raetsel/qr-code/qr-code.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'qr-code-eingaben', OPT = 'qr-code-einstellungen', NS = 'http://www.w3.org/2000/svg';
  var STANDARD = { modus:'malen', art:'punkte', regel:'gerade', zahlenraum:20, rechenart:'plus20', stufe:'Q', ecken:true, nummern:true, mitLoesung:true,
    proBlatt:4, stufeFertig:'M', titelZeigen:true, inhaltZeigen:false, schnitt:true };

  /* ---------- Zustand: Inhalte nur für diesen Tab, Einstellungen bleiben ---------- */
  var st = { text:'', titel:'', liste:[{ titel:'', inhalt:'' }], seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try {
    var e = JSON.parse(sessionStorage.getItem(TAB));
    if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || 1;
      if (Array.isArray(e.liste) && e.liste.length) st.liste = e.liste.map(function(x){ return { titel:String(x.titel || ''), inhalt:String(x.inhalt || '') }; }); }
  } catch(x){}
  var timer = 0;
  function speichernJetzt(){
    clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel, liste:st.liste, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){}
  }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }

  function meldung(art, html){ $('#qrMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#qrLeer').hidden = !!$('#qrBlaetter').innerHTML || !!$('#qrMeldung').innerHTML || st.opt.modus !== 'malen'; }
  // www.… ohne https:// öffnet nicht jedes Handy als Link
  function inhalt(t){ t = String(t || '').trim(); return /^www\./i.test(t) ? 'https://' + t : t; }

  /* ---------- Modus: Zum Ausmalen / Fertige QR-Codes ---------- */
  function modusZeigen(){
    [].forEach.call(bereich.querySelectorAll('.qr-modus [role=tab]'), function(t){ t.setAttribute('aria-selected', t.dataset.modus === st.opt.modus ? 'true' : 'false'); });
    [].forEach.call(bereich.querySelectorAll('.qr-teil'), function(t){ t.hidden = t.dataset.teil !== st.opt.modus; });
    var malen = st.opt.modus === 'malen';
    $('#qrMischen').hidden = !malen || st.opt.art === 'punkte';   // bei Kreisen gibt es nichts zu mischen
    $('#qrZeigeLoesung').hidden = !malen; $('#qrMalWeg').hidden = !malen;
    $('#qrMitLoesungWahl').hidden = !malen;
  }
  [].forEach.call(bereich.querySelectorAll('.qr-modus [role=tab]'), function(t){
    t.addEventListener('click', function(){
      if (st.opt.modus === t.dataset.modus) return;
      st.opt.modus = t.dataset.modus; speichern(); modusZeigen();
      $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true; meldung('', '');
      if (st.opt.modus === 'fertig') fertigZeigen(); else if (erstellt) erstellen();
    });
  });

  /* ================= Zum Ausmalen ================= */
  var textFeld = $('#qrText'), aktuell = null, gemalt = {}, erstellt = false;
  textFeld.value = st.text; $('#qrTitel').value = st.titel;
  function textInfo(){
    var t = inhalt(st.text), box = $('#qrTextInfo');
    if (!t){ box.textContent = 'Tipp: Ein kurzer Text ergibt ein kleines Raster, das schneller ausgemalt ist.'; return; }
    var q = Kern.code(t, st.opt.stufe);
    if (!q){ box.textContent = 'Der Text ist zu lang für einen QR-Code.'; return; }
    var grenze = Kern.GRENZE[st.opt.art];
    var v = Kern.verzeiht(q.n, st.opt.stufe);
    box.innerHTML = 'Raster: <b>' + q.n + ' × ' + q.n + ' Felder</b>' + (q.n > grenze ? ' – für «' + artName() + '» sind höchstens ' + grenze + ' × ' + grenze + ' möglich.' :
      v ? ' · verzeiht etwa ' + v + ' falsch ausgemalte Felder' : '') +
      (/^www\./i.test(st.text.trim()) ? '<br>Der Link bekommt automatisch «https://» davor, damit das Handy ihn direkt öffnet.' : '');
  }
  function artName(){ return { punkte:'Kreise', zahlen:'Zahlen', rechnungen:'Rechnungen' }[st.opt.art]; }
  textFeld.addEventListener('input', function(){ st.text = textFeld.value; speichern(); textInfo(); veraltet(); });
  $('#qrTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  function veraltet(){ var b = bereich.querySelector('.qr-blatt'); if (b && st.opt.modus === 'malen' && aktuell) b.classList.add('veraltet'); }

  [].forEach.call(bereich.querySelectorAll('input[name="qrArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = r.value; speichern(); unteroptionen(); textInfo(); modusZeigen(); if (erstellt) erstellen(); });
  });
  function unteroptionen(){
    [].forEach.call(bereich.querySelectorAll('[data-fuer]'), function(d){ d.hidden = d.dataset.fuer !== st.opt.art; });
    [].forEach.call(bereich.querySelectorAll('[data-gerade]'), function(d){ d.hidden = st.opt.regel !== 'gerade'; });   // Reihen gehen immer bis 10·k
  }
  var regel = $('#qrRegel'); regel.value = st.opt.regel === 'gerade' ? 'gerade' : String(st.opt.reihe || 3);
  regel.addEventListener('change', function(){ if (regel.value === 'gerade'){ st.opt.regel = 'gerade'; } else { st.opt.regel = 'reihe'; st.opt.reihe = +regel.value; } speichern(); unteroptionen(); if (erstellt) erstellen(); });
  [['qrZahlenraum', 'zahlenraum', true], ['qrRechenart', 'rechenart', false], ['qrStufe', 'stufe', false]].forEach(function(p){
    var el = $('#' + p[0]); el.value = String(st.opt[p[1]]);
    el.addEventListener('change', function(){ st.opt[p[1]] = p[2] ? +el.value : el.value; speichern(); textInfo(); if (erstellt) erstellen(); });
  });
  [['qrEcken', 'ecken'], ['qrNummern', 'nummern'], ['qrMitLoesung', 'mitLoesung']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){ st.opt[p[1]] = el.checked; speichern(); if (p[1] !== 'mitLoesung' && erstellt) erstellen(); });
  });

  function erstellen(){
    erstellt = true;
    var t = inhalt(st.text);
    if (!t){ aktuell = null; $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true; meldung('fehler', '<h3>Noch keine Botschaft</h3><p>Gib zuerst einen Text oder Link ein.</p>'); return; }
    var o = { art:st.opt.art, regel:st.opt.regel, reihe:st.opt.reihe || 3, zahlenraum:st.opt.zahlenraum, rechenart:st.opt.rechenart, stufe:st.opt.stufe, ecken:st.opt.ecken, seed:st.seed };
    var r = Kern.raster(t, o);
    if (r.fehler){
      aktuell = null; $('#qrBlaetter').innerHTML = ''; $('#qrWerkzeug').hidden = true;
      if (r.fehler === 'zuLang') meldung('fehler', '<h3>Der Text ist zu lang</h3><p>So viel Text passt in keinen QR-Code. Kürze ihn bitte.</p>');
      else {
        var besser = Kern.passendeStufe(t, r.grenze), stufenText = { L:'«gering»', M:'«mittel»', Q:'«hoch»', H:'«sehr hoch»' };
        meldung('fehler', '<h3>Das Raster wird zu gross</h3><p>Mit diesem Text hätte das Raster ' + r.n + ' × ' + r.n + ' Felder. Für «' + artName() + '» sind höchstens ' +
          r.grenze + ' × ' + r.grenze + ' möglich, damit alles gut lesbar bleibt.</p><ul><li>Kürze den Text' +
          (besser ? ',</li><li>oder stelle in den Einstellungen die Fehlertoleranz auf ' + stufenText[besser] + ' – dann passt er' : '') +
          (st.opt.art !== 'punkte' ? ',</li><li>oder wähle «Kreise» – damit sind bis 41 × 41 Felder möglich' : '') + '.</li></ul>');
      }
      return;
    }
    aktuell = { r:r, text:t, o:o }; gemalt = {};
    $('#qrZeigeLoesung').setAttribute('aria-pressed', 'false');
    zeichnen();
    erfolgsMeldung();
  }
  function erfolgsMeldung(){
    var r = aktuell.r;
    meldung('erfolg', '<p><b>Fertig!</b> Raster mit ' + r.n + ' × ' + r.n + ' Feldern, davon <b>' + r.anzahl + ' zum Ausmalen</b>. ' +
      (Kern.verzeiht(r.n, aktuell.o.stufe) ? 'Der Code verzeiht etwa ' + Kern.verzeiht(r.n, aktuell.o.stufe) + ' falsch ausgemalte oder vergessene Felder. ' : '') +
      'Du kannst ihn auch hier am Bildschirm ausmalen.</p>');
  }

  /* ---------- Blatt zeichnen ---------- */
  function anleitung(){
    var o = aktuell.o, a;
    if (o.art === 'punkte') a = 'Male alle Felder mit einem Kreis aus.';
    else if (o.art === 'zahlen') a = o.regel === 'reihe'
      ? 'Male alle Felder aus, deren Zahl in der ' + o.reihe + 'er-Reihe vorkommt (' + o.reihe + ', ' + 2 * o.reihe + ', ' + 3 * o.reihe + ' … ' + 10 * o.reihe + ').'
      : 'Male alle Felder mit einer geraden Zahl aus (2, 4, 6, 8, …).';
    else a = 'Rechne in jedem Feld. Ist das Ergebnis gerade, malst du das Feld aus.';
    return a + (o.ecken ? ' Die Quadrate in den Ecken sind schon ausgemalt.' : '') + ' Nimm einen dunklen Stift und male die Felder ganz aus.';
  }
  // Raster als SVG. art: 'spiel' (mit Inhalt, ausmalbar) oder 'loesung' (fertiger Code)
  function rasterSvg(art){
    var r = aktuell.r, n = r.n, S = 10, rand = st.opt.nummern && art === 'spiel' ? 9 : 0, w = n * S + rand;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (-rand) + ' ' + (-rand) + ' ' + w + ' ' + w);
    s.setAttribute('class', 'qr-raster ' + (art === 'spiel' ? 'spiel' : 'fertig'));
    s.style.setProperty('--felder', n);
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', art === 'spiel' ? 'Raster mit ' + n + ' mal ' + n + ' Feldern zum Ausmalen' : 'Fertiger QR-Code');
    var h = [];
    if (rand) for (var i = 0; i < n; i++){
      h.push('<text class="nr" x="' + (i * S + S / 2) + '" y="' + (-rand / 2) + '">' + (i + 1) + '</text>');
      h.push('<text class="nr" x="' + (-rand / 2) + '" y="' + (i * S + S / 2) + '">' + (i + 1) + '</text>');
    }
    h.push('<rect x="0" y="0" width="' + n * S + '" height="' + n * S + '" fill="#fff"/>');
    var schrift = aktuell.o.art === 'rechnungen' ? 2.9 : aktuell.o.art === 'zahlen' ? 4 : 6;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++){
      var dunkel = r.dunkel[y][x], vor = r.vorgedruckt && r.vorgedruckt[y][x];
      if (art === 'loesung'){ if (dunkel) h.push('<rect x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '" fill="#000"/>'); continue; }
      if (vor){ if (dunkel) h.push('<rect x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '" fill="#000"/>'); continue; }
      h.push('<rect class="feld" data-f="' + (y * n + x) + '" x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '"/>');
      var t = r.inhalt[y][x];
      if (t === '○') h.push('<circle class="kreis" cx="' + (x * S + S / 2) + '" cy="' + (y * S + S / 2) + '" r="2.3"/>');
      else if (t) h.push('<text class="inhalt" x="' + (x * S + S / 2) + '" y="' + (y * S + S / 2 + 0.35) + '" style="font-size:' + schrift + 'px">' + esc(t) + '</text>');
    }
    if (art === 'spiel'){
      // Lösung (eingeblendet mit «Lösung zeigen») und Ausgemaltes (nur am Bildschirm)
      var l = [];
      for (var y2 = 0; y2 < n; y2++) for (var x2 = 0; x2 < n; x2++) if (r.dunkel[y2][x2] && !(r.vorgedruckt && r.vorgedruckt[y2][x2])) l.push('M' + x2 * S + ' ' + y2 * S + 'h' + S + 'v' + S + 'h-' + S + 'z');
      h.push('<path class="ebene-loesung" d="' + l.join('') + '"/>');
      h.push('<g class="ebene-gemalt"></g>');
      h.push('<rect class="rahmen" x="0" y="0" width="' + n * S + '" height="' + n * S + '" fill="none"/>');
    }
    s.innerHTML = h.join('');
    return s;
  }
  function zeichnen(){
    var titel = st.titel.trim() || 'Male den QR-Code aus!', box = $('#qrBlaetter');
    box.innerHTML = '';
    var blatt = document.createElement('article');
    blatt.className = 'qr-blatt';
    blatt.innerHTML = '<h2>' + esc(titel) + '</h2><p class="qr-anleitung">' + esc(anleitung()) + '</p><div class="qr-gitter"></div>' +
      '<p class="qr-fuss">Fertig? Scanne den Code mit einem Tablet oder Handy – er verrät dir eine Botschaft.</p>' +
      '<p class="qr-fortschritt nur-bildschirm" id="qrFortschritt" aria-live="polite"></p>';
    var svg = rasterSvg('spiel');
    blatt.querySelector('.qr-gitter').appendChild(svg);
    box.appendChild(blatt);
    var loes = document.createElement('article');
    loes.className = 'qr-blatt qr-loesungsblatt';
    loes.setAttribute('aria-hidden', 'true');
    loes.innerHTML = '<h2>Lösung – ' + esc(titel) + '</h2><p class="qr-anleitung">So sieht der fertig ausgemalte Code aus. Er enthält:</p>' +
      '<p class="qr-botschaft">' + esc(aktuell.text) + '</p><div class="qr-gitter"></div>';
    loes.querySelector('.qr-gitter').appendChild(rasterSvg('loesung'));
    box.appendChild(loes);
    $('#qrWerkzeug').hidden = false; leer();
    malenVerbinden(svg, blatt);
    gemaltZeichnen(); fortschritt();
  }

  /* ---------- Am Bildschirm ausmalen: tippen oder mit gedrückter Maus über die Felder fahren ---------- */
  function malenVerbinden(svg, blatt){
    var modus = null;
    function feldAn(ev){ var el = document.elementFromPoint(ev.clientX, ev.clientY); return el && el.getAttribute && el.getAttribute('data-f') !== null && svg.contains(el) ? +el.getAttribute('data-f') : null; }
    function setze(f){ if (f === null) return; if (modus) gemalt[f] = true; else delete gemalt[f]; gemaltZeichnen(); }
    svg.addEventListener('pointerdown', function(ev){
      var f = feldAn(ev); if (f === null) return;
      ev.preventDefault(); modus = !gemalt[f]; setze(f);
      try { svg.setPointerCapture(ev.pointerId); } catch(x){}
    });
    svg.addEventListener('pointermove', function(ev){ if (modus === null) return; setze(feldAn(ev)); });
    function ende(){ if (modus === null) return; modus = null; fortschritt(); }
    svg.addEventListener('pointerup', ende); svg.addEventListener('pointercancel', ende); svg.addEventListener('lostpointercapture', ende);
  }
  function gemaltZeichnen(){
    var g = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt) .ebene-gemalt'); if (!g) return;
    var n = aktuell.r.n, S = 10, d = Object.keys(gemalt).map(function(f){ f = +f; return 'M' + (f % n) * S + ' ' + Math.floor(f / n) * S + 'h' + S + 'v' + S + 'h-' + S + 'z'; }).join('');
    g.innerHTML = d ? '<path d="' + d + '"/>' : '';
  }
  function fortschritt(){
    var p = $('#qrFortschritt'); if (!p || !aktuell) return;
    var r = aktuell.r, n = r.n, richtig = 0, falsch = 0;
    Object.keys(gemalt).forEach(function(f){ f = +f; if (r.dunkel[Math.floor(f / n)][f % n]) richtig++; else falsch++; });
    var fertig = richtig === r.anzahl && !falsch;
    p.className = 'qr-fortschritt nur-bildschirm' + (fertig ? ' fertig' : '');
    p.textContent = fertig ? '🎉 Geschafft! Der Code ist komplett – scanne ihn jetzt mit dem Handy oder Tablet.'
      : (Object.keys(gemalt).length ? Object.keys(gemalt).length + ' Felder ausgemalt.' : 'Tippe auf ein Feld oder fahre mit gedrückter Maus über mehrere Felder, um sie auszumalen.');
    var blatt = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt)');
    if (blatt) blatt.classList.toggle('geschafft', fertig);
  }

  /* ---------- Werkzeuge ---------- */
  $('#qrLos').addEventListener('click', erstellen);
  $('#qrMischen').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#qrZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    var b = bereich.querySelector('.qr-blatt:not(.qr-loesungsblatt)'); if (b) b.classList.toggle('zeige-loesung', an);
  });
  $('#qrMalWeg').addEventListener('click', function(){ gemalt = {}; gemaltZeichnen(); fortschritt(); });

  /* ================= Fertige QR-Codes ================= */
  var liste = $('#qrListe');
  function listeZeichnen(fokus){
    liste.innerHTML = '';
    st.liste.forEach(function(x, i){
      var li = document.createElement('li');
      li.innerHTML = '<input type="text" class="qr-titel" maxlength="60" placeholder="Titel (freiwillig)" aria-label="Titel von Code ' + (i + 1) + '">' +
        '<input type="text" class="qr-inhalt" maxlength="500" placeholder="Text oder Link, z. B. www.fabulousteaching.ch" aria-label="Inhalt von Code ' + (i + 1) + '">' +
        '<button type="button" class="qr-weg" aria-label="Code ' + (i + 1) + ' entfernen" title="Entfernen">×</button>';
      var ti = li.querySelector('.qr-titel'), inh = li.querySelector('.qr-inhalt');
      ti.value = x.titel; inh.value = x.inhalt;
      ti.addEventListener('input', function(){ x.titel = ti.value; speichern(); fertigSpaeter(); });
      inh.addEventListener('input', function(){ x.inhalt = inh.value; speichern(); fertigSpaeter(); });
      li.querySelector('.qr-weg').addEventListener('click', function(){
        st.liste.splice(i, 1); if (!st.liste.length) st.liste.push({ titel:'', inhalt:'' });
        speichern(); listeZeichnen(); fertigZeigen();
      });
      liste.appendChild(li);
      if (fokus && i === st.liste.length - 1) inh.focus();
    });
  }
  $('#qrPlus').addEventListener('click', function(){ st.liste.push({ titel:'', inhalt:'' }); speichern(); listeZeichnen(true); });
  [['qrProBlatt', 'proBlatt', true], ['qrStufeFertig', 'stufeFertig', false]].forEach(function(p){
    var el = $('#' + p[0]); el.value = String(st.opt[p[1]]);
    el.addEventListener('change', function(){ st.opt[p[1]] = p[2] ? +el.value : el.value; speichern(); fertigZeigen(); });
  });
  [['qrTitelZeigen', 'titelZeigen'], ['qrInhaltZeigen', 'inhaltZeigen'], ['qrSchnitt', 'schnitt']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){ st.opt[p[1]] = el.checked; speichern(); fertigZeigen(); });
  });
  var fertigTimer = 0;
  function fertigSpaeter(){ clearTimeout(fertigTimer); fertigTimer = setTimeout(fertigZeigen, 250); }
  // Fertiger Code als SVG-Text (mit weissem Rand, den Scanner brauchen)
  function codeSvg(q, titel){
    var rand = 4, w = q.n + 2 * rand, d = [];
    for (var y = 0; y < q.n; y++) for (var x = 0; x < q.n; x++) if (q.dunkel[y][x]) d.push('M' + (x + rand) + ' ' + (y + rand) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" shape-rendering="crispEdges" role="img" aria-label="QR-Code' + (titel ? ': ' + esc(titel) : '') + '">' +
      '<rect width="' + w + '" height="' + w + '" fill="#fff"/><path fill="#000" d="' + d.join('') + '"/></svg>';
  }
  function fertigZeigen(){
    if (st.opt.modus !== 'fertig') return;
    var box = $('#qrBlaetter'), codes = [], zuLang = [];
    st.liste.forEach(function(x, i){
      var t = inhalt(x.inhalt); if (!t) return;
      var q = Kern.code(t, st.opt.stufeFertig);
      if (!q){ zuLang.push(i + 1); return; }
      codes.push({ titel:x.titel.trim(), text:t, q:q });
    });
    if (!codes.length){
      box.innerHTML = ''; $('#qrWerkzeug').hidden = true;
      meldung(zuLang.length ? 'fehler' : 'info', zuLang.length ? '<p>Code ' + zuLang.join(', ') + ': Der Text ist zu lang für einen QR-Code.</p>' : '<p>Gib links einen Text oder Link ein – die QR-Codes erscheinen sofort hier.</p>');
      return;
    }
    meldung(zuLang.length ? 'warnung' : '', zuLang.length ? '<p>Code ' + zuLang.join(', ') + ' ist zu lang und wird weggelassen.</p>' : '');
    var pro = st.opt.proBlatt, html = '';
    for (var s = 0; s < codes.length; s += pro){
      html += '<article class="qr-blatt qr-karten pro-' + pro + (st.opt.schnitt ? ' schnitt' : '') + (s ? ' neue-seite' : '') + '">';
      codes.slice(s, s + pro).forEach(function(c, k){
        html += '<figure class="qr-karte">' + codeSvg(c.q, c.titel) +
          (st.opt.titelZeigen && c.titel ? '<figcaption class="qr-karte-titel">' + esc(c.titel) + '</figcaption>' : '') +
          (st.opt.inhaltZeigen ? '<p class="qr-karte-text">' + esc(c.text) + '</p>' : '') +
          '<button type="button" class="btn ghost klein nur-bildschirm qr-bild" data-i="' + (s + k) + '">Als Bild speichern</button></figure>';
      });
      html += '</article>';
    }
    box.innerHTML = html;
    $('#qrWerkzeug').hidden = false; leer();
    [].forEach.call(box.querySelectorAll('.qr-bild'), function(b){
      if (Labor.imArtefakt()){ b.hidden = true; return; }
      b.addEventListener('click', function(){ bildSpeichern(codes[+b.dataset.i]); });
    });
  }
  // PNG mit 12 Bildpunkten pro Feld
  function bildSpeichern(c){
    var rand = 4, px = 12, w = (c.q.n + 2 * rand) * px, cv = document.createElement('canvas');
    cv.width = cv.height = w;
    var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, w); g.fillStyle = '#000';
    for (var y = 0; y < c.q.n; y++) for (var x = 0; x < c.q.n; x++) if (c.q.dunkel[y][x]) g.fillRect((x + rand) * px, (y + rand) * px, px, px);
    cv.toBlob(function(blob){
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'QR-Code' + (c.titel ? '-' + Labor.dateiname(c.titel) : '') + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
    }, 'image/png');
  }

  /* ---------- Drucken und Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', st.opt.modus === 'malen' && !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  $('#qrDrucken').addEventListener('click', function(){ druckVorbereiten(); window.print(); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#qrDrucken').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#qrHerunterladen').hidden = false; });
  }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .ebene-gemalt, .ebene-loesung'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#qrHerunterladen').addEventListener('click', function(){
    if (!speicherOrt) return;
    var blaetter = [].slice.call(bereich.querySelectorAll('#qrBlaetter .qr-blatt'));
    if (st.opt.modus === 'malen' && !st.opt.mitLoesung) blaetter = blaetter.filter(function(b){ return !b.classList.contains('qr-loesungsblatt'); });
    if (!blaetter.length) return;
    var inhaltHtml = blaetter.map(function(b, i){ var k = sauber(b); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    var name = st.opt.modus === 'malen' ? 'QR-Code-zum-Ausmalen' : 'QR-Codes';
    speicherOrt.save({ filename:name + '.html', data:Labor.blattDatei(name.replace(/-/g, ' '), inhaltHtml, '.qr-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  /* ---------- Start ---------- */
  unteroptionen(); modusZeigen(); listeZeichnen(); textInfo();
  if (st.opt.modus === 'fertig') fertigZeigen();
  else { leer(); try { if (st.text.trim() && sessionStorage.getItem(TAB)) erstellen(); } catch(x){} }

  return function stopp(){
    aus = true; clearTimeout(fertigTimer);
    if (timer) speichernJetzt();
    window.removeEventListener('beforeprint', druckVorbereiten);
    document.body.classList.remove('mit-loesung');
  };
}
})();
