/* Rätsellabor – Generator «Freimaurer-Code» (Geheimschrift mit dem Freimaurer-Alphabet, engl. Pigpen Cipher)
   Jeder Buchstabe wird zum Stück Gitter, das ihn im Schlüssel umgibt:
     A–I im Gitter #, J–R im Gitter # mit Punkt, S–V im X, W–Z im X mit Punkt (im X: oben, links, rechts, unten).
   Umlaute werden als AE, OE, UE geschrieben, ß als SS; Ziffern und Satzzeichen bleiben stehen.
   Herunterladen: Geheimtext (PDF, wahlweise mit Lösungsblatt und Alphabet; oder als Bild) und das Alphabet einzeln (PDF oder Bild). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', X_LAGE = ['oben', 'links', 'rechts', 'unten'];
  // Lage eines Buchstabens im Schlüssel
  function form(b){
    var i = ABC.indexOf(b);
    if (i < 0) return null;
    if (i < 18) return { art:'gitter', r:Math.floor(i % 9 / 3), c:i % 3, punkt:i >= 9 };
    return { art:'x', lage:X_LAGE[(i - 18) % 4], punkt:i >= 22 };
  }
  // Text in Grossbuchstaben ohne Umlaute und Akzente
  function normal(text){
    return String(text || '').replace(/ß/g, 'SS').replace(/ẞ/g, 'SS').toUpperCase()
      .replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  // Text → Zeilen → Wörter → Zeichen: { b:'A' } (Buchstabe) oder { t:'!' } (bleibt stehen)
  function zerlege(text){
    return normal(text).split(/\r?\n/).map(function(z){
      return z.split(/\s+/).filter(Boolean).map(function(w){ return Array.from(w).map(function(c){ return ABC.indexOf(c) >= 0 ? { b:c } : { t:c }; }); });
    });
  }
  /* Zeichen eines Buchstabens im Feld 0…100: d = Linien (SVG-Pfad), punkt = [x, y] oder null.
     Im Gitter hat ein Buchstabe dort eine Linie, wo im Schlüssel eine Gitterlinie an sein Feld grenzt. */
  function zeichen(b){
    var f = form(b);
    if (!f) return null;
    if (f.art === 'gitter'){
      var a = 14, z = 86, da = [f.r > 0, f.c < 2, f.r < 2, f.c > 0];   // oben, rechts, unten, links
      var S = [[a, a, z, a], [z, a, z, z], [z, z, a, z], [a, z, a, a]], d;
      if (da[0] && da[1] && da[2] && da[3]) d = 'M' + a + ' ' + a + 'H' + z + 'V' + z + 'H' + a + 'Z';
      else {
        var k0 = [0, 1, 2, 3].filter(function(k){ return da[k] && !da[(k + 3) % 4]; })[0], k = k0;
        d = 'M' + S[k0][0] + ' ' + S[k0][1];
        do { d += 'L' + S[k][2] + ' ' + S[k][3]; k = (k + 1) % 4; } while (da[k] && k !== k0);
      }
      return { d:d, punkt:f.punkt ? [50, 50] : null };
    }
    var X = { oben:['M14 16L50 86L86 16', [50, 40]], links:['M16 14L86 50L16 86', [40, 50]], rechts:['M84 14L14 50L84 86', [60, 50]], unten:['M14 84L50 14L86 84', [50, 60]] }[f.lage];
    return { d:X[0], punkt:f.punkt ? X[1] : null };
  }
  return { ABC:ABC, form:form, normal:normal, zerlege:zerlege, zeichen:zeichen };
})();
/* KERN-ENDE */

var TINTE = '#1C1714';
var GROESSEN = [['klein', 'Klein', 30], ['mittel', 'Mittel', 42], ['gross', 'Gross', 58]];
var SCHRIFT = 'Andika, Arial, Helvetica, sans-serif';

/* ---------- Zeichnen (SVG) ---------- */
function zeichenInnen(b, farbe){
  var z = Kern.zeichen(b), f = farbe || TINTE;
  return '<path d="' + z.d + '" fill="none" stroke="' + f + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    (z.punkt ? '<circle cx="' + z.punkt[0] + '" cy="' + z.punkt[1] + '" r="8.5" fill="' + f + '"/>' : '');
}
function zeichenSvg(b){ return '<svg class="fm-s" viewBox="0 0 100 100" aria-hidden="true">' + zeichenInnen(b) + '</svg>'; }
function txt(x, y, s, gr, farbe){
  return '<text x="' + x + '" y="' + (y + gr * 0.35).toFixed(1) + '" font-family="' + SCHRIFT + '" font-weight="700" font-size="' + gr + '" fill="' + (farbe || TINTE) + '" text-anchor="middle">' + Labor.esc(s) + '</text>';
}
// Schlüssel: Gitter # mit 9 Buchstaben ab «ab» bzw. X mit 4 Buchstaben, im Feld 0…300
function gitterInnen(ab, punkt){
  var h = '<path d="M100 14V286M200 14V286M14 100H286M14 200H286" stroke="' + TINTE + '" stroke-width="7" stroke-linecap="round" fill="none"/>';
  for (var i = 0; i < 9; i++){
    var cx = 50 + i % 3 * 100, cy = 50 + Math.floor(i / 3) * 100;
    h += txt(punkt ? cx - 11 : cx, cy, Kern.ABC[ab + i], 46);
    if (punkt) h += '<circle cx="' + (cx + 22) + '" cy="' + cy + '" r="7" fill="' + TINTE + '"/>';
  }
  return h;
}
function xInnen(ab, punkt){
  var h = '<path d="M30 30L270 270M270 30L30 270" stroke="' + TINTE + '" stroke-width="7" stroke-linecap="round" fill="none"/>', P = [[150, 70], [70, 150], [230, 150], [150, 230]];
  P.forEach(function(p, i){
    h += txt(punkt ? p[0] - 11 : p[0], p[1], Kern.ABC[ab + i], 46);
    if (punkt) h += '<circle cx="' + (p[0] + 22) + '" cy="' + p[1] + '" r="7" fill="' + TINTE + '"/>';
  });
  return h;
}
var SCHLUESSEL = [[gitterInnen, 0, false, 'A bis I'], [gitterInnen, 9, true, 'J bis R, mit Punkt'], [xInnen, 18, false, 'S bis V'], [xInnen, 22, true, 'W bis Z, mit Punkt']];
function schluesselSvg(k){ return '<svg class="fm-schluessel" viewBox="0 0 300 300" role="img" aria-label="Schlüssel ' + k[3] + '">' + k[0](k[1], k[2]) + '</svg>'; }

var VORLAGE = '<div class="fm">' +
  '<header class="fm-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Freimaurer-Code</h1>' +
    '<p>Dein Text wird zur Geheimschrift: Jeder Buchstabe ist ein Stück Gitter, manche mit Punkt. Mit dem Freimaurer-Alphabet lässt er sich entschlüsseln – beides kannst du herunterladen.</p></header>' +
  '<div class="fm-layout"><section class="fm-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimer Text</h2><p>Wörter oder Sätze, auch mehrere Zeilen.</p></div></div>' +
      '<label class="vh" for="fmText">Geheimer Text</label><textarea id="fmText" rows="5" maxlength="400" autocomplete="off" spellcheck="false"></textarea>' +
      '<p class="hinweis">Umlaute werden als AE, OE, UE geschrieben, ß als SS. Ziffern und Satzzeichen bleiben stehen.</p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Blatt</h2></div></div>' +
      '<p class="feld-label">Grösse der Zeichen</p>' +
      '<div class="fm-chips" role="radiogroup" aria-label="Grösse der Zeichen">' +
        GROESSEN.map(function(g){ return '<label><input type="radio" name="fmGroesse" value="' + g[0] + '"><span>' + g[1] + '</span></label>'; }).join('') + '</div>' +
      '<label class="opt"><input type="checkbox" id="fmLinien"><span>Schreiblinien unter den Zeichen</span></label>' +
      '<div class="opt-raster"><label for="fmTitel">Titel auf dem Blatt</label><input type="text" id="fmTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="fm-ausgabe" aria-label="Ergebnis">' +
    '<div id="fmMeldung" aria-live="polite"></div>' +
    '<div class="fm-teil">' +
      '<h2 class="fm-teil-titel">Geheimtext</h2>' +
      '<div class="fm-werkzeug">' +
        '<button type="button" class="btn klein" id="fmZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
        '<span class="abstand"></span>' +
        Labor.blattSchalterHtml() +
        '<label><input type="checkbox" id="fmMitLoesung"> mit Lösungsblatt</label>' +
        '<label><input type="checkbox" id="fmMitAlphabet"> mit Alphabet</label>' +
        '<button type="button" class="btn klein" id="fmCodeBild">Als Bild</button>' +
        '<button type="button" class="btn klein primary" id="fmPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="fmHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
      '</div>' +
      '<article class="fm-blatt" id="fmBlatt"></article>' +
      '<article class="fm-blatt fm-loesungsblatt" id="fmLoesung" aria-hidden="true"></article>' +
    '</div>' +
    '<div class="fm-teil">' +
      '<h2 class="fm-teil-titel">Freimaurer-Alphabet</h2>' +
      '<div class="fm-werkzeug"><span class="fm-werkzeug-text">Der Schlüssel zum Entschlüsseln – auch einzeln.</span><span class="abstand"></span>' +
        '<button type="button" class="btn klein" id="fmAlphabetBild">Als Bild</button>' +
        '<button type="button" class="btn klein primary" id="fmAlphabetPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="fmAlphabetHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Alphabet herunterladen</button>' +
      '</div>' +
      '<article class="fm-blatt fm-alphabet" id="fmAlphabet"></article>' +
    '</div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 4h6v6H4z"/><path d="M14 4l3 6 3-6"/><path d="M10 14v6H4"/><path d="M14 20l3-6 3 6"/><circle cx="7" cy="7" r=".6" fill="currentColor"/><circle cx="17" cy="17.6" r=".6" fill="currentColor"/></svg>';

Labor.registriere({
  id:'freimaurer',
  titel:'Freimaurer-Code',
  kurz:'Geheimschrift aus Gittern und Punkten',
  beschreibung:'Ein eigener Text wird zur Geheimschrift mit dem Freimaurer-Alphabet: Jeder Buchstabe ist ein Stück Gitter, manche mit Punkt. Geheimtext und Alphabet lassen sich einzeln herunterladen.',
  merkmale:['Alphabet zum Entschlüsseln', 'Einzeln als PDF oder Bild', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/freimaurer/freimaurer.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'freimaurer-eingaben', OPT = 'freimaurer-einstellungen';
  var STANDARD = { groesse:'mittel', linien:true, mitLoesung:true, mitAlphabet:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#fmMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function titel(){ return st.titel.trim() || 'Geheimbotschaft'; }
  function hatBuchstaben(){ return /[A-Z]/.test(Kern.normal(st.text)); }

  /* ---------- Eingaben ---------- */
  $('#fmText').value = st.text;
  $('#fmText').addEventListener('input', function(){ st.text = this.value; speichern(); zeichnen(); });
  $('#fmTitel').value = st.titel;
  $('#fmTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="fmGroesse"]'), function(r){
    r.checked = r.value === st.opt.groesse;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.groesse = r.value; speichern(); zeichnen(); });
  });
  [['#fmLinien', 'linien', true], ['#fmMitLoesung', 'mitLoesung'], ['#fmMitAlphabet', 'mitAlphabet']].forEach(function(c){
    $(c[0]).checked = !!st.opt[c[1]];
    $(c[0]).addEventListener('change', function(){ st.opt[c[1]] = this.checked; speichern(); if (c[2]) zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); alphabetZeichnen(); });

  /* ---------- Geheimtext ---------- */
  function px(){ return (GROESSEN.filter(function(g){ return g[0] === st.opt.groesse; })[0] || GROESSEN[1])[2]; }
  function codeHtml(loesung){
    var linien = st.opt.linien;
    return '<div class="fm-code' + (linien ? '' : ' ohne-linien') + '" style="--fm:' + px() + 'px">' + Kern.zerlege(st.text).map(function(zeile){
      return '<div class="fm-zeile">' + zeile.map(function(wort){
        return '<span class="fm-wort">' + wort.map(function(c){
          if (c.b) return '<span class="fm-z">' + zeichenSvg(c.b) + '<span class="fm-linie"><b class="fm-loes">' + c.b + '</b></span></span>';
          return '<span class="fm-z fm-andere"><span class="fm-t">' + esc(c.t) + '</span><span class="fm-linie fm-leer"></span></span>';
        }).join('') + '</span>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function zeichnen(){
    var o = st.opt, leer = !hatBuchstaben();
    $('#fmBlatt').hidden = $('#fmLoesung').hidden = leer;
    ['#fmZeigeLoesung', '#fmCodeBild', '#fmPdf', '#fmHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){
      $('#fmBlatt').innerHTML = $('#fmLoesung').innerHTML = '';
      meldung('info', '<p>Schreibe links einen Text – er erscheint hier als Freimaurer-Code. Das Alphabet unten kannst du schon jetzt herunterladen.</p>');
      return;
    }
    meldung('', '');
    var kopf = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '');
    $('#fmBlatt').innerHTML = kopf + (o.anleitungAn ? '<p class="fm-anleitung">Entschlüssle die Geheimschrift mit dem Freimaurer-Alphabet' + (o.linien ? ' und schreibe die Buchstaben auf die Linien' : '') + '.</p>' : '') + codeHtml(false);
    $('#fmLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="fm-anleitung"><b>Lösung</b></p>') + codeHtml(true);
    // passt der Text auf eine A4-Seite? (Verhältnis Höhe : Breite des Blatts, ungefähr)
    var b = $('#fmBlatt'), zuLang = b.offsetWidth && b.scrollHeight / b.offsetWidth > 1.5;
    if (zuLang) meldung('warnung', '<p>Der Text ist lang für eine A4-Seite – im PDF wird das Blatt verkleinert. Wähle kleinere Zeichen oder kürze den Text.</p>');
  }
  $('#fmZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#fmBlatt').classList.toggle('zeige-loesung', an);
  });

  /* ---------- Alphabet (Schlüssel und Tabelle) ---------- */
  function alphabetZeichnen(){
    var o = st.opt, tab = '';
    [[0, 9], [9, 18], [18, 26]].forEach(function(g){
      tab += '<div class="fm-tab-zeile">';
      for (var i = g[0]; i < g[1]; i++) tab += '<span class="fm-tab-zelle"><b>' + Kern.ABC[i] + '</b>' + zeichenSvg(Kern.ABC[i]) + '</span>';
      tab += '</div>';
    });
    $('#fmAlphabet').innerHTML = (o.titelAn ? '<h2>Freimaurer-Alphabet</h2>' : '') +
      (o.anleitungAn ? '<p class="fm-anleitung">Jeder Buchstabe wird als das Stück Gitter geschrieben, das ihn umgibt – mit Punkt, wenn neben ihm ein Punkt steht.</p>' : '') +
      '<div class="fm-schluessel-reihe">' + SCHLUESSEL.map(schluesselSvg).join('') + '</div>' +
      '<div class="fm-tabelle">' + tab + '</div>';
  }

  /* ---------- Als Bild: PNG auf der Website, SVG im Artefakt ---------- */
  function codeBild(){
    var G = 64, L = 12, WORT = 44, LIN = st.opt.linien ? 44 : 0, ABST = 30, PAD = 32, MAX = 14 * (G + L) - L, zeilen = [];
    Kern.zerlege(st.text).forEach(function(z){
      var akt = [], w = 0;
      z.forEach(function(wort){
        var breite = function(x){ return x.reduce(function(a, c){ return a + (c.b ? G : G * 0.6) + L; }, 0) - L; };
        while (breite(wort) > MAX){   // sehr langes Wort teilen
          if (akt.length){ zeilen.push(akt); akt = []; w = 0; }
          var n = 1; while (breite(wort.slice(0, n + 1)) <= MAX) n++;
          zeilen.push([wort.slice(0, n)]); wort = wort.slice(n);
        }
        if (!wort.length) return;
        if (akt.length && w + WORT + breite(wort) > MAX){ zeilen.push(akt); akt = []; w = 0; }
        w += (akt.length ? WORT : 0) + breite(wort); akt.push(wort);
      });
      zeilen.push(akt);
    });
    while (zeilen.length && !zeilen[zeilen.length - 1].length) zeilen.pop();
    var ZH = G + LIN, breit = 0, inhalt = '';
    zeilen.forEach(function(zeile, j){
      var x = PAD, y = PAD + j * (ZH + ABST);
      zeile.forEach(function(wort, k){
        if (k) x += WORT - L;
        wort.forEach(function(c){
          if (c.b) inhalt += '<svg x="' + x + '" y="' + y + '" width="' + G + '" height="' + G + '" viewBox="0 0 100 100">' + zeichenInnen(c.b) + '</svg>';
          else inhalt += txt(x + G * 0.3, y + G / 2, c.t, G * 0.62);
          if (LIN && c.b) inhalt += '<path d="M' + (x + 4) + ' ' + (y + ZH - 2) + 'H' + (x + G - 4) + '" stroke="' + TINTE + '" stroke-width="2.5"/>';
          x += (c.b ? G : G * 0.6) + L;
        });
      });
      breit = Math.max(breit, x - L + PAD);
    });
    var hoch = PAD * 2 + zeilen.length * (ZH + ABST) - ABST;
    return { svg:'<svg xmlns="http://www.w3.org/2000/svg" width="' + breit + '" height="' + hoch + '" viewBox="0 0 ' + breit + ' ' + hoch + '"><rect width="100%" height="100%" fill="#fff"/>' + inhalt + '</svg>', name:'Freimaurer-Code-' + (Labor.dateiname(titel()) || 'Geheimtext') };
  }
  function alphabetBild(){
    var F = 250, GAP = 34, PAD = 36, inhalt = '', ZW = 112, ZH2 = 150;
    SCHLUESSEL.forEach(function(k, i){ inhalt += '<svg x="' + (PAD + i * (F + GAP)) + '" y="' + PAD + '" width="' + F + '" height="' + F + '" viewBox="0 0 300 300">' + k[0](k[1], k[2]) + '</svg>'; });
    var breit = PAD * 2 + 4 * F + 3 * GAP, ox = (breit - 9 * ZW) / 2, oy = PAD + F + 50;
    for (var i = 0; i < 26; i++){
      var r = i < 9 ? 0 : i < 18 ? 1 : 2, c = i < 9 ? i : i < 18 ? i - 9 : i - 18, x = ox + c * ZW + (r === 2 ? ZW / 2 : 0), y = oy + r * ZH2;
      inhalt += '<rect x="' + (x + 6) + '" y="' + y + '" width="' + (ZW - 12) + '" height="' + (ZH2 - 14) + '" rx="12" fill="none" stroke="#D8CEC4" stroke-width="2"/>';
      inhalt += txt(x + ZW / 2, y + 34, Kern.ABC[i], 36);
      inhalt += '<svg x="' + (x + ZW / 2 - 34) + '" y="' + (y + 60) + '" width="68" height="68" viewBox="0 0 100 100">' + zeichenInnen(Kern.ABC[i]) + '</svg>';
    }
    var hoch = oy + 3 * ZH2 + PAD - 14;
    return { svg:'<svg xmlns="http://www.w3.org/2000/svg" width="' + breit + '" height="' + hoch + '" viewBox="0 0 ' + breit + ' ' + hoch + '"><rect width="100%" height="100%" fill="#fff"/>' + inhalt + '</svg>', name:'Freimaurer-Alphabet' };
  }
  function herunterladen(blob, name){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  }
  function bildSpeichern(b){
    if (speicherOrt){
      speicherOrt.save({ filename:b.name + '.svg', data:'<?xml version="1.0" encoding="UTF-8"?>\n' + b.svg }).catch(function(e){
        if (e && e.code === 'declined') return;
        meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
      });
      return;
    }
    var img = new Image(), w = +b.svg.match(/width="(\d+(?:\.\d+)?)"/)[1], h = +b.svg.match(/height="(\d+(?:\.\d+)?)"/)[1];
    img.onload = function(){
      var cv = document.createElement('canvas'), k = 2; cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      var g = cv.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0, w, h);
      cv.toBlob(function(bl){ if (bl) herunterladen(bl, b.name + '.png'); }, 'image/png');
    };
    img.onerror = function(){ meldung('warnung', '<p>Das Bild konnte nicht erstellt werden.</p>'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(b.svg);
  }
  $('#fmCodeBild').addEventListener('click', function(){ if (hatBuchstaben()) bildSpeichern(codeBild()); });
  $('#fmAlphabetBild').addEventListener('click', function(){ bildSpeichern(alphabetBild()); });

  /* ---------- PDF und Herunterladen ---------- */
  function codeBlaetter(){ return [$('#fmBlatt'), st.opt.mitAlphabet && $('#fmAlphabet'), st.opt.mitLoesung && $('#fmLoesung')].filter(Boolean); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#fmPdf'), function(){ return hatBuchstaben() && { blaetter:codeBlaetter(), name:Labor.pdfName('Freimaurer-Code', st.titel) }; },
    function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  Labor.pdfKnopf($('#fmAlphabetPdf'), function(){ return { blaetter:[$('#fmAlphabet')], name:'Freimaurer-Alphabet.pdf' }; },
    function(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#fmPdf').hidden = $('#fmAlphabetPdf').hidden = true;
    $('#fmCodeBild').title = $('#fmAlphabetBild').title = 'Als SVG-Bild speichern';
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#fmHerunterladen').hidden = $('#fmAlphabetHerunterladen').hidden = false; });
  }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung');
    return k;
  }
  function htmlSpeichern(blaetter, name){
    if (!speicherOrt) return;
    var inhalt = blaetter.map(function(b, i){ var k = sauber(b); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.fm-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  }
  $('#fmHerunterladen').addEventListener('click', function(){ if (hatBuchstaben()) htmlSpeichern(codeBlaetter(), Labor.pdfName('Freimaurer-Code', st.titel).replace(/\.pdf$/, '.html')); });
  $('#fmAlphabetHerunterladen').addEventListener('click', function(){ htmlSpeichern([$('#fmAlphabet')], 'Freimaurer-Alphabet.html'); });

  zeichnen(); alphabetZeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
