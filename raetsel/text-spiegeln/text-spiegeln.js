/* Rätsellabor – Generator «Text spiegeln»
   Ein eigener Text wird horizontal gespiegelt (Spiegelschrift), vertikal gespiegelt, um 180° gedreht, rückwärts oder
   Wort für Wort rückwärts geschrieben. Jede Fassung lässt sich mit einem Klick kopieren und überall einfügen – dafür
   besteht sie aus ähnlich aussehenden Unicode-Zeichen (nicht jeder Buchstabe hat ein perfektes Gegenstück).
   Bewusst ohne Arbeitsblatt: ein Werkzeug zum Kopieren. */
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
var ARTEN_TEXT = [   // Kürzel, Name, Erklärung
  ['horizontal', 'Horizontal gespiegelt', 'Spiegelschrift – von rechts nach links'],
  ['vertikal', 'Vertikal gespiegelt', 'an einer waagrechten Linie umgeklappt'],
  ['gedreht', 'Auf den Kopf gedreht', 'horizontal und vertikal – um 180° gedreht'],
  ['rueckwaerts', 'Rückwärts', 'Buchstaben in umgekehrter Reihenfolge'],
  ['woerter', 'Wörter rückwärts', 'jedes Wort rückwärts, die Reihenfolge bleibt']
];
var VORLAGE = '<div class="ts">' +
  '<header class="ts-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Text spiegeln</h1>' +
    '<p>Einen eigenen Text horizontal oder vertikal spiegeln, auf den Kopf drehen oder rückwärts schreiben – und mit einem Klick kopieren.</p></header>' +
  '<div class="ts-layout"><section class="ts-eingabe" aria-label="Eingabe">' +
    '<div class="karte"><div class="karte-kopf"><div><h2>Dein Text</h2><p>Ein Wort, ein Satz oder mehrere Zeilen.</p></div></div>' +
      '<label class="vh" for="tsText">Dein Text</label><textarea id="tsText" rows="4" maxlength="600" spellcheck="true"></textarea>' +
      '<p class="hinweis" id="tsInfo"></p></div>' +
  '</section>' +
  '<section class="ts-ausgabe" aria-label="Ergebnis">' +
    '<div class="leer-zustand" id="tsLeer"><h2>Noch kein Text</h2><p>Schreibe links einen Text – hier erscheint er sofort gespiegelt, gedreht und rückwärts.</p></div>' +
    '<div id="tsKopien" hidden><p class="ts-tipp">Klicke auf einen Text, um ihn zu kopieren – dann kannst du ihn überall einfügen, z. B. in WhatsApp, Word oder eine E-Mail. ' +
      'Die Zeichen sind ähnlich aussehende Sonderzeichen; nicht jeder Buchstabe hat ein perfektes Spiegelbild.</p>' +
      '<div class="ts-karten" id="tsKarten"></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 7H4l2.5 10L9 7z"/><path d="M15 7h5l-2.5 10L15 7z"/></svg>';

Labor.registriere({
  id:'text-spiegeln',
  titel:'Text spiegeln',
  kurz:'Text spiegeln, auf den Kopf drehen und kopieren',
  beschreibung:'Ein eigener Text horizontal oder vertikal gespiegelt, auf den Kopf gedreht oder rückwärts – mit einem Klick kopiert und überall einfügbar, z. B. in WhatsApp oder Word.',
  merkmale:['Spiegelschrift und Kopfstand', 'Rückwärts und Wörter rückwärts', 'Kopieren mit einem Klick'],
  symbol:SYMBOL,
  css:'raetsel/text-spiegeln/text-spiegeln.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc;
  var TAB = 'text-spiegeln-eingaben', st = { text:'' }, timer = 0;
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e) st.text = String(e.text || ''); } catch(x){}
  function speichernJetzt(){ clearTimeout(timer); timer = 0; try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text })); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }

  var feld = $('#tsText'); feld.value = st.text;
  feld.addEventListener('input', function(){ st.text = feld.value; speichern(); zeigen(); });

  /* ---------- Kopieren: Zwischenablage, sonst über ein verstecktes Textfeld; geht beides nicht, wird der Text markiert ---------- */
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
  }

  zeigen();
  return function stopp(){ if (timer) speichernJetzt(); };
}
})();
