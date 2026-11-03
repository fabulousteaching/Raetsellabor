/* Rätsellabor – Generator «Puzzle»
   Ein eigenes Bild wird zum Puzzle mit 12 bis 150 Teilen. Gepuzzelt wird direkt hier (Teile ziehen, sie rasten ein) –
   oder über einen QR-Code auf dem Tablet: Dafür wird das Puzzle auf dem eigenen Server gespeichert (api/puzzle.php),
   der Code führt zur Seite P/<ID>/. Das Spiel selbst steckt in puzzle-spiel.js (gemeinsam mit der Puzzle-Seite). */
(function(){
'use strict';

var TEILE = [[12, 'Leicht'], [24, 'Mittel'], [48, 'Schwer'], [96, 'Sehr schwer'], [150, 'Profi']];
var VORLAGE = '<div class="pz">' +
  '<header class="pz-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Puzzle</h1>' +
    '<p>Dein eigenes Bild wird zum Puzzle. Gepuzzelt wird direkt am Bildschirm oder mit einem QR-Code auf dem Tablet.</p></header>' +
  '<div class="pz-layout"><section class="pz-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Bild</h2><p>Ein Foto oder Bild von deinem Gerät.</p></div></div>' +
      '<label class="pz-ablage" id="pzAblage"><input type="file" id="pzDatei" accept="image/*" class="vh">' +
        '<img id="pzVorschau" alt="Gewähltes Bild" hidden>' +
        '<span class="pz-ablage-text" id="pzAblageText"><b>Bild auswählen</b><small>oder hierher ziehen</small></span></label>' +
      '<p class="hinweis">Am besten ein Bild im Querformat mit vielen Farben und Einzelheiten. Das Bild bleibt auf deinem Gerät – erst für einen QR-Code wird es auf deinem Server gespeichert. Bitte keine Fotos, auf denen Kinder zu erkennen sind.</p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Schwierigkeit</h2><p>Je mehr Teile, desto schwieriger.</p></div></div>' +
      '<div class="pz-stufen" role="radiogroup" aria-label="Anzahl Teile">' +
        TEILE.map(function(t){ return '<label><input type="radio" name="pzTeile" value="' + t[0] + '"><span><b>' + t[0] + ' Teile</b><small>' + t[1] + '</small></span></label>'; }).join('') + '</div>' +
      '<label class="opt"><input type="checkbox" id="pzVorlage"><span>Bild blass auf dem Brett zeigen (leichter)</span></label>' +
    '</div>' +
    '<div class="karte" id="pzQrKarte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>QR-Code zum Puzzle</h2><p>Die Kinder scannen den Code mit dem Tablet oder Handy und puzzeln dort.</p></div></div>' +
      '<button type="button" class="btn primary" id="pzQr">QR-Code erstellen</button>' +
      '<p class="hinweis" id="pzQrInfo" aria-live="polite"></p>' +
      '<div class="pz-qr" id="pzQrErgebnis" hidden>' +
        '<div class="pz-qr-bild" id="pzQrBild"></div>' +
        '<p class="pz-link"><a id="pzLink" target="_blank" rel="noopener"></a></p>' +
        '<div class="pz-qr-knoepfe"><button type="button" class="btn klein" id="pzKopieren">Link kopieren</button>' +
          '<button type="button" class="btn klein" id="pzPng">QR als Bild</button></div>' +
        '<div class="pz-qr-blatt-knoepfe">' + Labor.blattSchalterHtml() + '<button type="button" class="btn klein primary" id="pzPdf">PDF herunterladen</button></div>' +
      '</div>' +
    '</div>' +
  '</section>' +
  '<section class="pz-ausgabe" aria-label="Puzzle">' +
    '<div id="pzMeldung" aria-live="polite"></div>' +
    '<div class="pz-werkzeug">' +
      '<button type="button" class="btn klein" id="pzMischen" disabled>Neu mischen</button>' +
      '<button type="button" class="btn klein" id="pzVoll">Vollbild</button>' +
      '<span class="abstand"></span><span class="pz-status" id="pzStatus" aria-live="polite"></span>' +
    '</div>' +
    '<div class="pz-spiel" id="pzSpiel">' +
      '<div class="pz-leer" id="pzLeer"><span class="pz-leer-symbol" aria-hidden="true">🧩</span><p><b>Lade ein Bild hoch</b> – daraus wird das Puzzle.</p>' +
        '<button type="button" class="btn primary" id="pzLeerKnopf">Bild auswählen</button><small>oder ein Bild hierher ziehen</small></div>' +
      '<div class="pz-fertig" id="pzFertig" hidden></div></div>' +
    '<p class="pz-tipp">Ziehe die Teile mit der Maus oder dem Finger aufs Brett – am richtigen Platz rasten sie ein.</p>' +
    '<article class="pz-blatt" id="pzBlatt" aria-hidden="true"></article>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 4h6v2.2a1.8 1.8 0 1 0 3.6 0V4H20v6h-2.2a1.8 1.8 0 1 0 0 3.6H20V20h-6v-2.2a1.8 1.8 0 1 0-3.6 0V20H4v-6h2.2a1.8 1.8 0 1 0 0-3.6H4z"/></svg>';

Labor.registriere({
  id:'puzzle',
  titel:'Puzzle',
  kurz:'Online-Puzzle aus einem eigenen Bild, auch per QR-Code',
  beschreibung:'Dein eigenes Bild wird zum Puzzle mit 12 bis 150 Teilen. Gepuzzelt wird am Bildschirm – oder die Kinder scannen einen QR-Code und puzzeln auf dem Tablet.',
  merkmale:['Eigenes Bild hochladen', '12 bis 150 Teile', 'QR-Code zum Puzzle'],
  symbol:SYMBOL,
  css:'raetsel/puzzle/puzzle.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var OPT = 'puzzle-einstellungen', SERVER = 'api/puzzle.php';
  var STANDARD = { teile:24, vorlage:false, titelAn:true, anleitungAn:true };
  var st = { opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  function speichern(){ try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function meldung(art, html){ $('#pzMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var bild = null, bildNr = 0, spiel = null, qr = null;   // qr: { schluessel, id, url }

  /* ---------- Bild: auswählen oder hineinziehen; verkleinert auf höchstens 1600 Pixel (läuft flüssig, wird klein gespeichert) ---------- */
  function bildLaden(f){
    if (!f) return;
    if (!/^image\//.test(f.type)){ meldung('fehler', '<p>Das ist kein Bild. Wähle eine Bilddatei (z. B. JPG oder PNG).</p>'); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function(){
      URL.revokeObjectURL(url);
      if (aus) return;
      var k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.naturalWidth * k)); cv.height = Math.max(1, Math.round(img.naturalHeight * k));
      var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
      bild = cv; bildNr++;
      var v = $('#pzVorschau'); v.src = verkleinert(cv, 480); v.hidden = false;
      $('#pzAblageText').innerHTML = '<b>Anderes Bild wählen</b><small>oder hierher ziehen</small>';
      meldung('', ''); neuesSpiel();
    };
    img.onerror = function(){ URL.revokeObjectURL(url); meldung('fehler', '<p>Das Bild konnte nicht geöffnet werden. Versuch ein anderes (JPG oder PNG).</p>'); };
    img.src = url;
  }
  function verkleinert(b, max){
    var k = document.createElement('canvas'), f = Math.min(1, max / Math.max(b.width, b.height));
    k.width = Math.round(b.width * f); k.height = Math.round(b.height * f); k.getContext('2d').drawImage(b, 0, 0, k.width, k.height);
    return k.toDataURL('image/jpeg', 0.85);
  }
  $('#pzDatei').addEventListener('change', function(){ bildLaden(this.files && this.files[0]); this.value = ''; });
  $('#pzLeerKnopf').addEventListener('click', function(){ $('#pzDatei').click(); });
  [$('#pzAblage'), $('#pzSpiel')].forEach(function(z){
    z.addEventListener('dragover', function(ev){ if (ev.dataTransfer && [].indexOf.call(ev.dataTransfer.types, 'Files') >= 0){ ev.preventDefault(); z.classList.add('ziehen'); } });
    z.addEventListener('dragleave', function(){ z.classList.remove('ziehen'); });
    z.addEventListener('drop', function(ev){ z.classList.remove('ziehen'); var f = ev.dataTransfer && ev.dataTransfer.files[0]; if (!f) return; ev.preventDefault(); bildLaden(f); });
  });

  /* ---------- Schwierigkeit ---------- */
  [].forEach.call(bereich.querySelectorAll('input[name="pzTeile"]'), function(r){
    r.checked = +r.value === +st.opt.teile;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.teile = +r.value; speichern(); neuesSpiel(); });
  });
  $('#pzVorlage').checked = st.opt.vorlage;
  $('#pzVorlage').addEventListener('change', function(){ st.opt.vorlage = this.checked; speichern(); if (spiel) spiel.vorlage(st.opt.vorlage); qrVeraltet(); });

  /* ---------- Spielen ---------- */
  function zeit(s){ return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function neuesSpiel(){
    if (spiel){ spiel.stopp(); spiel = null; }
    $('#pzFertig').hidden = true; qrVeraltet();
    $('#pzLeer').hidden = !!bild; $('#pzMischen').disabled = !bild;
    if (!bild){ $('#pzStatus').textContent = ''; return; }
    spiel = PuzzleSpiel.starte($('#pzSpiel'), { bild:bild, teile:st.opt.teile, vorlage:st.opt.vorlage,
      status:function(s){ $('#pzStatus').textContent = s.fest + ' von ' + s.alle + ' Teilen · ' + zeit(s.sekunden); },
      fertig:function(sek){ var f = $('#pzFertig'); f.innerHTML = '<p>🎉 <b>Geschafft!</b> In ' + zeit(sek) + ' Minuten.</p><button type="button" class="btn primary klein">Nochmals</button>';
        f.hidden = false; f.querySelector('button').addEventListener('click', function(){ f.hidden = true; spiel.neu(); }); } });
  }
  $('#pzMischen').addEventListener('click', function(){ if (spiel){ $('#pzFertig').hidden = true; spiel.neu(); } });
  $('#pzVoll').addEventListener('click', function(){
    var el = $('#pzSpiel');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(function(){});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  });
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('#pzVoll').hidden = true;

  /* ---------- QR-Code: Puzzle auf dem Server speichern, Code zeigt auf P/<ID> ---------- */
  var bereit = null;
  function serverBereit(){
    if (bereit) return bereit;
    if (Labor.imArtefakt() || !/^https?:$/.test(location.protocol)) return (bereit = Promise.resolve(false));
    bereit = fetch(SERVER + '?status=1', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return !!(j && j.bereit); }, function(){ return false; });
    return bereit;
  }
  serverBereit().then(function(ok){
    if (ok || aus) return;
    $('#pzQr').hidden = true;
    $('#pzQrInfo').textContent = 'QR-Codes zum Puzzle gibt es auf der Website des Rätsellabors (das Puzzle wird dort gespeichert).';
  });
  function schluessel(){ return JSON.stringify([bildNr, st.opt.teile, st.opt.vorlage]); }
  function qrVeraltet(){
    if (!qr) return;
    var alt = qr.schluessel !== schluessel();
    $('#pzQrErgebnis').classList.toggle('veraltet', alt);
    $('#pzQrInfo').textContent = alt ? 'Bild oder Schwierigkeit geändert – erstelle den QR-Code neu, damit er zu diesem Puzzle führt.' : '';
  }
  function puzzleUrl(id){ return location.origin.toUpperCase() + location.pathname.replace(/[^\/]*$/, '') + 'P/' + id; }   // Grossbuchstaben: kleiner QR-Code
  $('#pzQr').addEventListener('click', function(){
    var knopf = this;
    if (!bild){ meldung('fehler', '<p>Wähle zuerst ein Bild aus.</p>'); return; }
    var daten = { teile:st.opt.teile, vorlage:!!st.opt.vorlage };
    [0.85, 0.72, 0.6, 0.45].some(function(q){ daten.bild = bild.toDataURL('image/jpeg', q); return daten.bild.length < 2600000; });   // höchstens etwa 2 MB
    var key = schluessel();
    knopf.disabled = true; $('#pzQrInfo').innerHTML = '<span class="lade" aria-hidden="true"></span>Das Puzzle wird gespeichert …';
    fetch(SERVER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(daten) }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){ if (!r.ok || !j.id) throw { code:j.fehler || 'server' }; return j.id; });
    }).then(function(id){
      if (aus) return;
      qr = { schluessel:key, id:id, url:puzzleUrl(id) };
      qrZeigen(); $('#pzQrInfo').textContent = '';
    }, function(e){
      var c = e && e.code;
      $('#pzQrInfo').textContent = c === 'zuViele' ? 'Gerade wurden sehr viele Puzzles gespeichert. Versuch es in einer Stunde nochmals.'
        : c === 'zuGross' ? 'Das Bild ist zu gross. Wähle ein kleineres Bild.' : 'Das Puzzle konnte nicht gespeichert werden. Prüfe die Internetverbindung und versuch es nochmals.';
    }).then(function(){ knopf.disabled = false; });
  });
  function qrSvg(text, gross){
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    var q = qrcode(0, 'M'); q.addData(text, /^[0-9A-Z $%*+\-.\/:]+$/.test(text) ? 'Alphanumeric' : 'Byte'); q.make();
    var n = q.getModuleCount(), d = '', R = 4;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) d += 'M' + (x + R) + ' ' + (y + R) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * R) + ' ' + (n + 2 * R) + '" width="' + gross + '" height="' + gross + '" shape-rendering="crispEdges" role="img" aria-label="QR-Code zum Puzzle">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  // Link zum Lesen und Abtippen: Adresse klein, nur die ID gross (…/P/ABCD)
  function linkText(){ return location.host + location.pathname.replace(/[^\/]*$/, '') + 'P/' + qr.id; }
  function qrZeigen(){
    $('#pzQrBild').innerHTML = qrSvg(qr.url, 180);
    var a = $('#pzLink'); a.href = qr.url; a.textContent = linkText();
    $('#pzQrErgebnis').hidden = false; $('#pzQrErgebnis').classList.remove('veraltet');
    blattZeichnen();
  }
  function blattZeichnen(){
    if (!qr) return;
    var o = st.opt;
    $('#pzBlatt').innerHTML = (o.titelAn ? '<h2>Puzzle</h2>' : '') +
      (o.anleitungAn ? '<p class="pz-anleitung">Scanne den QR-Code mit dem Tablet oder Handy. Ziehe die Teile aufs Brett – am richtigen Platz rasten sie ein. (' + o.teile + ' Teile)</p>' : '') +
      '<div class="pz-blatt-inhalt"><div class="pz-blatt-qr">' + qrSvg(qr.url, 340) + '</div><p class="pz-blatt-link">' + esc(linkText()) + '</p></div>';   // ohne Bild: die Kinder sollen es erst beim Puzzeln sehen
  }
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); blattZeichnen(); });
  $('#pzKopieren').addEventListener('click', function(){
    if (!qr) return;
    var k = this, t = location.protocol + '//' + linkText();
    (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ k.textContent = '✓ Kopiert'; setTimeout(function(){ k.textContent = 'Link kopieren'; }, 1500); },
      function(){ var r = document.createRange(); r.selectNodeContents($('#pzLink')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  });
  $('#pzPng').addEventListener('click', function(){
    if (!qr) return;
    var img = new Image(), svg = qrSvg(qr.url, 800);
    img.onload = function(){
      var c = document.createElement('canvas'); c.width = c.height = 800; c.getContext('2d').drawImage(img, 0, 0, 800, 800);
      c.toBlob(function(bl){ var a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'Puzzle-QR-' + qr.id + '.png'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000); });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  Labor.pdfKnopf($('#pzPdf'), function(){ return qr && { blaetter:[$('#pzBlatt')], name:'Puzzle-' + qr.id + '.pdf' }; }, function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });

  neuesSpiel();
  bereich.puzzleSpiel = function(){ return spiel; };   // für Tests
  return function stopp(){ aus = true; if (spiel) spiel.stopp(); if (document.fullscreenElement) document.exitFullscreen().catch(function(){}); };
}
})();
