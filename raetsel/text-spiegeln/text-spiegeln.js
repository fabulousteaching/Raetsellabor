/* Rätsellabor – Generator «Text spiegeln»
   Ein eigener Text wird horizontal gespiegelt (Spiegelschrift), vertikal gespiegelt, um 180° gedreht, rückwärts oder
   Wort für Wort rückwärts geschrieben. Jede Fassung lässt sich mit einem Klick kopieren und überall einfügen – dafür
   besteht sie aus ähnlich aussehenden Unicode-Zeichen (nicht jeder Buchstabe hat ein perfektes Gegenstück).
   Das Arbeitsblatt spiegelt dagegen die echte Schrift (CSS), also exakt; dazu Linien zum Aufschreiben und ein
   Lösungsblatt. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function tabelle(paare){ var t = {}; paare.split(' ').forEach(function(p){ var z = Array.from(p); t[z[0]] = z.slice(1).join(''); }); return t; }
  // Um 180° gedreht (auf dem Kopf): Zeichen → gedrehtes Gegenstück
  var KOPF = tabelle('aɐ bq cɔ dp eǝ fɟ gƃ hɥ iᴉ jɾ kʞ ll mɯ nu oo pd qb rɹ ss tʇ un vʌ wʍ xx yʎ zz ' +
    'A∀ Bꓭ CƆ Dꓷ EƎ FℲ G⅁ HH II Jſ Kꓘ L˥ MW NN OO PԀ QΌ Rꓤ SS T⊥ U∩ VΛ WM XX Y⅄ ZZ ' +
    '00 1Ɩ 2ᄅ 3Ɛ 4ㄣ 5ϛ 69 7ㄥ 88 96 .˙ ,\' \', !¡ ?¿ ¡! ¿? () )( [] ][ {} }{ <> >< _‾ &⅋ ;؛ «» »«');
  KOPF['"'] = '„'; KOPF['„'] = '"'; KOPF['“'] = '„';
  // Horizontal gespiegelt (Spiegelschrift): Zeichen → gespiegeltes Gegenstück
  var SPIEGEL = tabelle('aɒ bd cɔ db eɘ fʇ gϱ hʜ ii jį kʞ ll mm nn oo pq qp rɿ sƨ tƚ uu vv ww xx yγ zz ' +
    'AA Bᙠ CƆ Dᗡ EƎ Fꟻ GᎮ HH II JႱ Kꓘ L⅃ MM NИ OO Pꟼ QϘ RЯ SꙄ TT UU VV WW XX YY ZƸ ' +
    '3Ɛ ?⸮ () )( [] ][ {} }{ <> >< «» »«');
  SPIEGEL['/'] = '\\'; SPIEGEL['\\'] = '/';
  // Vertikal gespiegelt (an einer waagrechten Linie, Reihenfolge bleibt): Zeichen → umgeklapptes Gegenstück
  var VERTIKAL = tabelle('aɐ bp cc dq eǝ fɟ gƃ hɥ iᴉ jɾ kʞ ll mɯ nu oo pb qd rɹ ss tʇ un vʌ wʍ xx yʎ zz ' +
    'A∀ BB CC DD EE FℲ G⅁ HH II Jſ KK LΓ MW NN OO Pᑲ QΌ Rʁ SS T⊥ U∩ VΛ WM XX Y⅄ ZZ ' +
    '00 1Ɩ 2ᄅ 33 4ㄣ 5ϛ 69 7ㄥ 88 96 .˙ ,\' \', !¡ ?¿ ¡! ¿?');
  VERTIKAL['"'] = '„'; VERTIKAL['„'] = '"';
  var UNTEN = '̤', OBEN = '̈';   // Pünktchen unten (für Umlaute auf dem Kopf) und oben
  var UMLAUT = { 'ä':'a', 'ö':'o', 'ü':'u', 'Ä':'A', 'Ö':'O', 'Ü':'U' };

  // Ein Zeichen umwandeln; Umlaute: Grundbuchstabe umwandeln, Pünktchen dazu (oben bleibt oben, beim Kopfstand unten)
  function zeichen(z, tab, punkteUnten){
    if (UMLAUT[z]){ var g = UMLAUT[z]; return (tab[g] || g) + (punkteUnten ? UNTEN : OBEN); }
    return tab[z] !== undefined ? tab[z] : z;
  }
  function vorbereiten(text){ return String(text || '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/ß/g, 'ss').replace(/ẞ/g, 'SS'); }
  function zeilen(text){ return vorbereiten(text).split('\n'); }
  function zeichenListe(s){ return Array.from(s); }

  var ARTEN = {
    // Spiegelschrift: jede Zeile von rechts nach links, Buchstaben gespiegelt
    horizontal:function(t){ return zeilen(t).map(function(z){ return zeichenListe(z).reverse().map(function(c){ return zeichen(c, SPIEGEL, false); }).join(''); }).join('\n'); },
    // an einer waagrechten Linie gespiegelt: Zeilen in umgekehrter Reihenfolge, Buchstaben umgeklappt
    vertikal:function(t){ return zeilen(t).reverse().map(function(z){ return zeichenListe(z).map(function(c){ return zeichen(c, VERTIKAL, true); }).join(''); }).join('\n'); },
    // um 180° gedreht: alles rückwärts, Buchstaben auf dem Kopf – liest sich richtig, wenn man das Blatt dreht
    gedreht:function(t){ return zeichenListe(vorbereiten(t)).reverse().map(function(c){ return c === '\n' ? c : zeichen(c, KOPF, true); }).join(''); },
    // nur die Reihenfolge der Buchstaben umgedreht (jede Zeile)
    rueckwaerts:function(t){ return zeilen(t).map(function(z){ return zeichenListe(z).reverse().join(''); }).join('\n'); },
    // jedes Wort rückwärts, Wörter und Satzzeichen bleiben an ihrem Platz
    woerter:function(t){ return vorbereiten(t).replace(/[\p{L}\p{M}\p{N}]+/gu, function(w){ return zeichenListe(w).reverse().join(''); }); }
  };
  return { ARTEN:ARTEN, vorbereiten:vorbereiten };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var ARTEN_TEXT = [   // Kürzel, Name, Erklärung, Auftrag auf dem Arbeitsblatt
  ['horizontal', 'Horizontal gespiegelt', 'Spiegelschrift – von rechts nach links',
    'Dieser Text ist gespiegelt. Lies ihn mit einem Spiegel oder von rechts nach links und schreibe ihn richtig auf die Linien.'],
  ['vertikal', 'Vertikal gespiegelt', 'an einer waagrechten Linie umgeklappt',
    'Dieser Text ist an einer waagrechten Linie gespiegelt – er steht auf dem Kopf. Halte einen Spiegel unter den Text und schreibe ihn richtig auf die Linien.'],
  ['gedreht', 'Auf den Kopf gedreht', 'horizontal und vertikal – um 180° gedreht',
    'Dieser Text steht auf dem Kopf. Drehe das Blatt um und schreibe den Text richtig auf die Linien.'],
  ['rueckwaerts', 'Rückwärts', 'Buchstaben in umgekehrter Reihenfolge',
    'Hier stehen die Buchstaben rückwärts. Lies von hinten nach vorne und schreibe den Text richtig auf die Linien.'],
  ['woerter', 'Wörter rückwärts', 'jedes Wort rückwärts, die Reihenfolge bleibt',
    'Jedes Wort ist rückwärts geschrieben. Lies die Wörter von hinten nach vorne und schreibe den Text richtig auf die Linien.']
];
function artText(k){ return ARTEN_TEXT.filter(function(a){ return a[0] === k; })[0] || ARTEN_TEXT[0]; }
var VORLAGE = '<div class="ts">' +
  '<header class="ts-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Text spiegeln</h1>' +
    '<p>Einen eigenen Text horizontal oder vertikal spiegeln, auf den Kopf drehen oder rückwärts schreiben – zum Kopieren mit einem Klick oder als Arbeitsblatt zum Entziffern.</p></header>' +
  '<div class="ts-layout"><section class="ts-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Dein Text</h2><p>Ein Wort, ein Satz oder mehrere Zeilen.</p></div></div>' +
      '<label class="vh" for="tsText">Dein Text</label><textarea id="tsText" rows="4" maxlength="600" spellcheck="true"></textarea>' +
      '<p class="hinweis" id="tsInfo"></p></div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Arbeitsblatt</h2><p>Wie der Text auf dem Blatt steht. Die Kinder entziffern ihn und schreiben ihn richtig auf.</p></div></div>' +
      '<div class="ts-arten" role="radiogroup" aria-label="Darstellung auf dem Arbeitsblatt">' +
        ARTEN_TEXT.map(function(a){ return '<label><input type="radio" name="tsArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
      '<div class="opt-raster"><label for="tsGroesse">Schriftgrösse</label><select id="tsGroesse"><option value="m">mittel</option><option value="l">gross</option><option value="xl">sehr gross</option></select></div>' +
      '<label class="opt"><input type="checkbox" id="tsLinien"><span>Linien zum Aufschreiben</span></label>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="tsTitel">Titel auf dem Blatt</label><input type="text" id="tsTitel" maxlength="60" autocomplete="off"></div>' +
    '</details></div>' +
  '</section>' +
  '<section class="ts-ausgabe" aria-label="Ergebnis">' +
    '<div id="tsMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="tsLeer"><h2>Noch kein Text</h2><p>Schreibe links einen Text – hier erscheint er sofort gespiegelt, gedreht und rückwärts.</p></div>' +
    '<div id="tsKopien" hidden><h2 class="ts-abschnitt">Zum Kopieren</h2><p class="ts-tipp">Klicke auf einen Text, um ihn zu kopieren – dann kannst du ihn überall einfügen, z. B. in WhatsApp, Word oder eine E-Mail. ' +
      'Die Zeichen sind ähnlich aussehende Sonderzeichen; nicht jeder Buchstabe hat ein perfektes Spiegelbild.</p>' +
      '<div class="ts-karten" id="tsKarten"></div>' +
      '<h2 class="ts-abschnitt">Arbeitsblatt</h2>' +
      '<div class="ts-werkzeug">' +
        '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
        '<label><input type="checkbox" id="tsMitLoesung"> mit Lösungsblatt</label>' +
        '<button type="button" class="btn klein primary" id="tsPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="tsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
      '</div>' +
      '<article class="ts-blatt" id="tsBlatt"></article>' +
      '<article class="ts-blatt ts-loesungsblatt" id="tsLoesung" aria-hidden="true"></article>' +
    '</div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 7H4l2.5 10L9 7z"/><path d="M15 7h5l-2.5 10L15 7z"/></svg>';

Labor.registriere({
  id:'text-spiegeln',
  titel:'Text spiegeln',
  kurz:'Text spiegeln, auf den Kopf drehen und kopieren',
  beschreibung:'Ein eigener Text horizontal oder vertikal gespiegelt, auf den Kopf gedreht oder rückwärts – mit einem Klick kopieren oder als Arbeitsblatt zum Entziffern herunterladen.',
  merkmale:['Spiegelschrift und Kopfstand', 'Kopieren mit einem Klick', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/text-spiegeln/text-spiegeln.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'text-spiegeln-eingaben', OPT = 'text-spiegeln-einstellungen';
  var STANDARD = { art:'horizontal', groesse:'l', linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#tsMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  /* ---------- Eingaben ---------- */
  var feld = $('#tsText'); feld.value = st.text;
  feld.addEventListener('input', function(){ st.text = feld.value; speichern(); zeigen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="tsArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.art = r.value; speichern(); blatt(); });
  });
  $('#tsGroesse').value = st.opt.groesse;
  $('#tsGroesse').addEventListener('change', function(){ st.opt.groesse = this.value; speichern(); blatt(); });
  $('#tsLinien').checked = st.opt.linien;
  $('#tsLinien').addEventListener('change', function(){ st.opt.linien = this.checked; speichern(); blatt(); });
  $('#tsTitel').value = st.titel;
  $('#tsTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); blatt(); });
  $('#tsMitLoesung').checked = st.opt.mitLoesung;
  $('#tsMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); blatt(); });

  /* ---------- Kopieren ---------- */
  function kopieren(text){
    function alt(){
      return new Promise(function(ok, fehler){
        var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.top = '0'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); var gut = false;
        try { gut = document.execCommand('copy'); } catch(x){}
        t.remove(); if (gut) ok(); else fehler(new Error('kopieren'));
      });
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(alt);
    return alt();
  }
  var ergebnisse = {};
  $('#tsKarten').addEventListener('click', function(ev){
    var k = ev.target.closest('.ts-karte'); if (!k) return;
    var marke = k.querySelector('.ts-kopiert');
    kopieren(ergebnisse[k.dataset.art] || '').then(function(){
      k.classList.add('kopiert'); marke.textContent = '✓ Kopiert';
      setTimeout(function(){ k.classList.remove('kopiert'); marke.textContent = 'Kopieren'; }, 1600);
    }, function(){
      marke.textContent = 'Markieren und kopieren';
      var sel = window.getSelection(), r = document.createRange(); r.selectNodeContents(k.querySelector('.ts-text')); sel.removeAllRanges(); sel.addRange(r);
    });
  });

  /* ---------- Anzeige ---------- */
  function zeigen(){
    var t = st.text, leer = !t.trim();
    $('#tsLeer').hidden = !leer; $('#tsKopien').hidden = leer;
    $('#tsInfo').textContent = leer ? '' : Array.from(t).length + ' Zeichen';
    if (leer) return;
    ergebnisse = {};
    $('#tsKarten').innerHTML = ARTEN_TEXT.map(function(a){
      var r = ergebnisse[a[0]] = Kern.ARTEN[a[0]](t);
      return '<button type="button" class="ts-karte" data-art="' + a[0] + '" title="Klicken zum Kopieren"><span class="ts-karte-kopf"><span><b>' + a[1] + '</b><small>' + a[2] + '</small></span>' +
        '<span class="ts-kopiert">Kopieren</span></span><span class="ts-text">' + esc(r) + '</span></button>';
    }).join('');
    blatt();
  }
  // Arbeitsblatt: die echte Schrift gespiegelt (CSS), darunter Linien; Lösungsblatt mit dem Originaltext
  function blatt(){
    if (!st.text.trim()) return;
    var a = artText(st.opt.art), o = st.opt, titel = st.titel.trim() || 'Spiegeltext';
    var anzeige = st.opt.art === 'rueckwaerts' || st.opt.art === 'woerter' ? Kern.ARTEN[st.opt.art](st.text) : st.text.replace(/\r\n?/g, '\n');
    var n = Math.min(12, Math.max(2, Math.ceil(Array.from(st.text).length / (o.groesse === 'xl' ? 22 : o.groesse === 'l' ? 30 : 40)) + 1));
    var linien = o.linien ? '<div class="ts-linien">' + new Array(n + 1).join('<span class="ts-linie"></span>') + '</div>' : '';
    $('#tsBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') + (o.anleitungAn ? '<p class="ts-anleitung">' + a[3] + '</p>' : '') +
      '<div class="ts-feld groesse-' + o.groesse + '"><div class="ts-spiegel art-' + o.art + '">' + esc(anzeige) + '</div></div>' + linien;
    $('#tsLoesung').innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><div class="ts-feld groesse-' + o.groesse + '"><div class="ts-spiegel ts-original">' + esc(st.text.replace(/\r\n?/g, '\n')) + '</div></div>';
  }

  /* ---------- PDF und Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#tsPdf'), function(){ return st.text.trim() && { blaetter:[$('#tsBlatt'), st.opt.mitLoesung && $('#tsLoesung')], name:Labor.pdfName('Spiegeltext', st.titel) }; },
    function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#tsPdf').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#tsHerunterladen').hidden = false; }); }
  $('#tsHerunterladen').addEventListener('click', function(){
    if (!st.text.trim() || !speicherOrt) return;
    var b = $('#tsBlatt').cloneNode(true), inhalt; b.removeAttribute('id'); inhalt = b.outerHTML;
    if (st.opt.mitLoesung){ var l = $('#tsLoesung').cloneNode(true); l.removeAttribute('id'); l.removeAttribute('aria-hidden'); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:Labor.pdfName('Spiegeltext', st.titel).replace(/\.pdf$/, '.html'), data:Labor.blattDatei('Spiegeltext', inhalt, '.ts-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeigen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
