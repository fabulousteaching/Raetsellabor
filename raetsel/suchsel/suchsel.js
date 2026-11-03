/* Rätsellabor · Suchsel
   Klassisches Wortsuchrätsel: Wörter liegen kreuz und quer im Buchstabenfeld.
   Teile: Kern (Wörter ins Feld setzen), Vorlage (Oberfläche), Bedienung (wird bei jedem Öffnen gestartet). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  // Richtungen je Stufe: Leicht → ↓ · Mittel dazu ↘ ↗ · Schwer dazu rückwärts ← ↑ ↖ ↙
  var STUFEN = {
    leicht:[[0, 1], [1, 0]],
    mittel:[[0, 1], [1, 0], [1, 1], [-1, 1]],
    schwer:[[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]
  };
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Wörter (längste zuerst) zufällig ins n × n-Feld setzen; mit Kreuzungen werden gemeinsame Buchstaben bevorzugt */
  function setze(woerter, n, dirs, kreuzen, rnd){
    for (var versuch = 0; versuch < 40; versuch++){
      var g = [], gesetzt = [], ok = true, r, c;
      for (r = 0; r < n; r++) g.push(new Array(n).fill(''));
      var reihe = mischen(woerter.slice(), rnd).sort(function(a, b){ return b.b.length - a.b.length; });
      for (var wi = 0; wi < reihe.length && ok; wi++){
        var w = reihe[wi], L = w.b.length, kand = [], summe = 0;
        dirs.forEach(function(d){
          for (var r0 = 0; r0 < n; r0++) for (var c0 = 0; c0 < n; c0++){
            var er = r0 + d[0] * (L - 1), ec = c0 + d[1] * (L - 1);
            if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
            var ueb = 0, gut = true;
            for (var q = 0; q < L; q++){
              var ch = g[r0 + d[0] * q][c0 + d[1] * q];
              if (ch){ if (!kreuzen || ch !== w.b[q]){ gut = false; break; } ueb++; }
            }
            if (!gut || ueb === L) continue;
            var gw = kreuzen ? 1 + ueb * 2.5 : 1;
            kand.push({ r:r0, c:c0, d:d, gw:gw }); summe += gw;
          }
        });
        if (!kand.length){ ok = false; break; }
        var x = rnd() * summe, k = kand[kand.length - 1];
        for (var i = 0; i < kand.length; i++){ x -= kand[i].gw; if (x <= 0){ k = kand[i]; break; } }
        var zellen = [];
        for (var q2 = 0; q2 < L; q2++){ var rr = k.r + k.d[0] * q2, cc = k.c + k.d[1] * q2; g[rr][cc] = w.b[q2]; zellen.push([rr, cc]); }
        gesetzt.push({ text:w.text, b:w.b, zellen:zellen });
      }
      if (ok) return { zeilen:n, spalten:n, gitter:g, woerter:gesetzt };
    }
    return null;
  }

  /* o: { stufe, groesse:'auto'|Zahl, kreuzen, rnd } → { feld } oder { fehler:'zuLang'|'zuVoll', … } */
  function erstelle(woerter, o){
    var rnd = o.rnd || Math.random, dirs = STUFEN[o.stufe] || STUFEN.mittel;
    var lang = Math.max.apply(null, woerter.map(function(w){ return w.b.length; })), total = woerter.reduce(function(s, w){ return s + w.b.length; }, 0);
    if (o.groesse !== 'auto'){
      var n = +o.groesse, zuLang = woerter.filter(function(w){ return w.b.length > n; });
      if (zuLang.length) return { fehler:'zuLang', woerter:zuLang.map(function(w){ return w.text; }), groesse:n };
      var f = setze(woerter, n, dirs, o.kreuzen, rnd);
      return f ? { feld:f } : { fehler:'zuVoll', groesse:n };
    }
    var start = Math.max(8, lang, Math.ceil(Math.sqrt(total / 0.55)));
    for (var m = start; m <= Math.min(start + 8, 30); m++){ var f2 = setze(woerter, m, dirs, o.kreuzen, rnd); if (f2) return { feld:f2 }; }
    return { fehler:'zuVoll', groesse:Math.min(start + 8, 30) };
  }
  return { STUFEN:STUFEN, erstelle:erstelle };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var VORLAGE = '<div class="sb">' +
  '<header class="sb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Suchsel</h1>' +
    '<p>Das klassische Wortsuchrätsel: Die Wörter liegen kreuz und quer im Buchstabenfeld.</p></header>' +
  '<div class="sb-layout"><section class="sb-eingabe" aria-label="Eingaben">' +
    Wortwahl.html(1) +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Feld und Schwierigkeit</h2><p>In welche Richtungen die Wörter laufen.</p></div></div>' +
      '<div class="sb-stufen" role="radiogroup" aria-label="Schwierigkeit">' +
        '<label class="sb-stufe"><input type="radio" name="sbStufe" value="leicht"><span><b>Leicht</b><small>waagrecht → und senkrecht ↓</small></span></label>' +
        '<label class="sb-stufe"><input type="radio" name="sbStufe" value="mittel"><span><b>Mittel</b><small>dazu schräg ↘ ↗</small></span></label>' +
        '<label class="sb-stufe"><input type="radio" name="sbStufe" value="schwer"><span><b>Schwer</b><small>dazu rückwärts ← ↑ ↖ ↙</small></span></label>' +
      '</div>' +
      '<div class="opt-raster"><label for="sbGroesse">Feldgrösse</label><select id="sbGroesse"><option value="auto">automatisch</option>' +
        [10, 12, 15, 18, 20].map(function(n){ return '<option value="' + n + '">' + n + ' × ' + n + '</option>'; }).join('') + '</select></div>' +
      '<label class="opt"><input type="checkbox" id="sbKreuzen"><span>Wörter dürfen sich kreuzen (gemeinsamer Buchstabe)</span></label>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<label class="opt"><input type="checkbox" id="sbUmlaute"><span>Umlaute ersetzen (Ä → AE, Ö → OE, Ü → UE)</span></label>' +
      '<label class="opt"><input type="checkbox" id="sbWortliste"><span>Wörter auf dem Blatt auflisten</span></label>' +
      '<label class="opt"><input type="checkbox" id="sbLinien"><span>Gitterlinien zeichnen</span></label>' +
    '</details></div>' +
    '<button type="button" class="btn primary gross" id="sbLos">Suchsel erstellen</button>' +
  '</section>' +
  '<section class="sb-ausgabe" aria-label="Ergebnis">' +
    '<div id="sbMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="sbLeer"><h2>Noch kein Suchsel</h2><p>In drei Schritten zum Arbeitsblatt:</p><ol>' +
      '<li>Thema eingeben, Wörter vorschlagen lassen und übernehmen – oder eigene eingeben</li><li>Schwierigkeit und Feldgrösse wählen</li><li>«Suchsel erstellen» klicken</li></ol></div>' +
    '<div class="sb-werkzeug" id="sbWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="sbMischen" title="Gleiche Wörter, neue Anordnung">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="sbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="sbMarkWeg">Markierungen löschen</button>' +
      '<span class="abstand"></span>' +
      '<label><input type="checkbox" id="sbMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="sbDrucken">Drucken</button>' +
      '<button type="button" class="btn klein primary" id="sbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="sb-blatt" id="sbBlatt" hidden></article>' +
    '<article class="sb-blatt sb-loesungsblatt" id="sbLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10" stroke-width="3" opacity=".55"/><path d="M8 12l8 5" stroke-width="3" opacity=".55"/></svg>';

Labor.registriere({
  id:'suchsel',
  titel:'Suchsel',
  kurz:'Wörter kreuz und quer im Buchstabenfeld',
  beschreibung:'Das klassische Wortsuchrätsel: Die Wörter liegen waagrecht, senkrecht, schräg oder rückwärts im Feld. Passende Wörter zum Thema lassen sich vorschlagen.',
  merkmale:['Drei Schwierigkeitsstufen', 'Wörter dürfen sich kreuzen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/suchsel/suchsel.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'suchsel-eingaben', OPT = 'suchsel-einstellungen';
  var STANDARD = { stufe:'mittel', groesse:'auto', kreuzen:true, umlaute:false, wortliste:true, linien:true, mitLoesung:true };

  /* ---------- Zustand: Thema und Wörter nur für diesen Tab, Einstellungen bleiben ---------- */
  var st = { titel:'', woerter:[], opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  delete st.opt.look;   // frühere Version speicherte noch einen Look
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e && Array.isArray(e.woerter)){ st.woerter = e.woerter.map(String).filter(Boolean); st.titel = String(e.titel || ''); } } catch(x){}
  var timer = 0;
  function speichernJetzt(){
    clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, woerter:st.woerter })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){}
  }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }

  function norm(t){
    var s = String(t || '').normalize('NFC').toLocaleUpperCase('de-CH');
    if (st.opt.umlaute) s = s.replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
    return s.replace(/[^\p{L}]/gu, '');
  }
  function auswerten(){
    var gesehen = {}, gut = [], weg = [], teil = [];
    st.woerter.forEach(function(t){
      var s = norm(t); if (!s) return;
      if (s.length < 2 || gesehen[s]){ weg.push(String(t).trim()); return; }
      gesehen[s] = true; gut.push({ text:s, b:Array.from(s) });
    });
    gut.forEach(function(a){ gut.forEach(function(b){ if (a !== b && (b.text.indexOf(a.text) >= 0 || b.text.indexOf(Array.from(a.text).reverse().join('')) >= 0)) teil.push([a.text, b.text]); }); });
    return { woerter:gut, weg:weg, teil:teil, buchstaben:gut.reduce(function(s, w){ return s + w.b.length; }, 0) };
  }

  var aktuell = null, spiel = { gefunden:{} }, erstellt = false;   // erstellt: schon einmal «Erstellen» geklickt
  function meldung(art, html){ $('#sbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#sbLeer').hidden = !!aktuell || !!$('#sbMeldung').innerHTML; }
  function info(notiz){
    var a = auswerten(), z = [];
    $('#wortZaehler').textContent = a.woerter.length ? a.woerter.length + ' · ' + a.buchstaben + ' Buchstaben' : '';
    if (notiz) z.push(notiz);
    if (a.weg.length) z.push('Zu kurz oder doppelt, wird weggelassen: ' + a.weg.map(esc).join(', '));
    $('#wortInfo').innerHTML = z.join(' · ');
  }
  function veraltet(){ if (aktuell) $('#sbBlatt').classList.add('veraltet'); }

  /* ---------- Thema und Wörter ---------- */
  var ww = Wortwahl.verbinde(bereich, {
    zustand:st, norm:norm,
    geaendert:function(notiz){ speichern(); info(notiz); veraltet(); },
    titelGeaendert:function(){ speichern(); veraltet(); }
  });

  /* ---------- Einstellungen ---------- */
  [].forEach.call(bereich.querySelectorAll('input[name="sbStufe"]'), function(r){
    r.checked = r.value === st.opt.stufe;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.stufe = r.value; speichern(); if (erstellt) erstellen(); } });
  });
  var groesse = $('#sbGroesse'); groesse.value = String(st.opt.groesse);
  groesse.addEventListener('change', function(){ st.opt.groesse = groesse.value === 'auto' ? 'auto' : +groesse.value; speichern(); if (erstellt) erstellen(); });
  [['sbKreuzen', 'kreuzen', 'neu'], ['sbUmlaute', 'umlaute', 'neu'], ['sbWortliste', 'wortliste', 'zeigen'], ['sbLinien', 'linien', 'zeigen'], ['sbMitLoesung', 'mitLoesung', '']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){
      st.opt[p[1]] = el.checked; speichern();
      if (p[1] === 'umlaute'){ ww.zeichne(); info(); }
      if (p[2] === 'neu' && erstellt) erstellen(); else if (p[2] === 'zeigen' && aktuell) anzeigen();
    });
  });

  /* ---------- Erstellen ---------- */
  function erstellen(){
    var a = auswerten();
    erstellt = true;
    if (!a.woerter.length){ meldung('fehler', '<h3>Noch keine Wörter</h3><p>Gib zuerst einige Wörter zum Thema ein.</p>'); return; }
    setzen(a);
  }
  function setzen(a){
    var r = Kern.erstelle(a.woerter, { stufe:st.opt.stufe, groesse:st.opt.groesse, kreuzen:st.opt.kreuzen });
    if (r.fehler){
      aktuell = null; $('#sbBlatt').hidden = true; $('#sbWerkzeug').hidden = true;
      if (r.fehler === 'zuLang') meldung('fehler', '<h3>Wörter länger als das Feld</h3><p>' + esc(r.woerter.join(', ')) + ' ' + (r.woerter.length === 1 ? 'hat' : 'haben') +
        ' mehr als ' + r.groesse + ' Buchstaben. Wähle ein grösseres Feld oder «automatisch».</p>');
      else meldung('fehler', '<h3>Die Wörter passen nicht ins Feld</h3><p>In ein ' + r.groesse + ' × ' + r.groesse + '-Feld passen nicht alle ' + a.woerter.length +
        ' Wörter. Wähle ein grösseres Feld' + (st.opt.kreuzen ? '' : ', erlaube Kreuzungen') + ' oder nimm weniger Wörter.</p>');
      return;
    }
    var doppelt = Gitter.fuellen(r.feld, a.woerter);
    aktuell = { feld:r.feld, auswertung:a, doppelt:doppelt };
    spiel = { gefunden:{} };
    $('#sbZeigeLoesung').setAttribute('aria-pressed', 'false');
    $('#sbBlatt').classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    anzeigen();
    erfolgsMeldung();
  }
  function kreuzungen(f){ var z = {}, n = 0; f.woerter.forEach(function(w){ w.zellen.forEach(function(rc){ var k = rc + ''; z[k] = (z[k] || 0) + 1; if (z[k] === 2) n++; }); }); return n; }
  function erfolgsMeldung(){
    var f = aktuell.feld, a = aktuell.auswertung, k = kreuzungen(f), h = [];
    var html = '<p><b>Fertig!</b> Feld mit ' + f.spalten + ' × ' + f.zeilen + ' Buchstaben, ' + f.woerter.length + ' Wörter' + (k ? ', ' + k + (k === 1 ? ' Kreuzung' : ' Kreuzungen') : '') +
      '. Du kannst die Wörter direkt im Feld markieren.</p>';
    if (aktuell.doppelt.length) h.push('Achtung: ' + aktuell.doppelt.map(function(t){ return '«' + esc(t) + '»'; }).join(', ') + ' kommt im Feld mehr als einmal vor. «Neu mischen» kann helfen.');
    var gesehen = {};
    a.teil.forEach(function(p){ var key = p.join('|'); if (gesehen[key]) return; gesehen[key] = 1; h.push('«' + esc(p[0]) + '» steckt in «' + esc(p[1]) + '» – das kann beim Suchen verwirren.'); });
    if (h.length) html += '<ul>' + h.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>';
    meldung(h.length ? 'warnung' : 'erfolg', html);
  }

  /* ---------- Anzeige ---------- */
  function blattHtml(art){
    var f = aktuell.feld, t = st.titel.trim(), ri = Gitter.richtungen(f);
    var titel = art === 'loesung' ? 'Lösung' + (t ? ' – ' + t : '') : (t ? 'Suchsel: ' + t : 'Suchsel');
    var html = '<h2>' + esc(titel) + '</h2>';
    if (art === 'spiel'){
      var wie = 'waagrecht' + (ri.schraeg ? ', senkrecht oder schräg' : ' oder senkrecht') + (ri.rueck ? ', manche auch rückwärts' : '');
      html += '<p class="sb-anleitung">Finde die ' + f.woerter.length + ' versteckten Wörter' + (t ? ' zum Thema «' + esc(t) + '»' : '') + ' und markiere sie. Sie stehen ' + wie + '.' +
        (kreuzungen(f) ? ' Manche Wörter kreuzen sich.' : '') + '</p>';
    }
    html += '<div class="sb-gitter"></div>';
    if (st.opt.wortliste){
      html += '<div class="sb-woerter-box"><h3>' + (art === 'loesung' ? 'Wörter' : 'Diese Wörter sind versteckt') + '</h3><ul class="sb-woerter">' +
        f.woerter.map(function(w, i){ return { t:w.text, i:i }; }).sort(function(x, y){ return x.t.localeCompare(y.t, 'de'); })
          .map(function(w){ return '<li data-i="' + w.i + '"' + (art === 'spiel' && spiel.gefunden[w.i] ? ' class="gefunden"' : '') + '>' + esc(w.t) + '</li>'; }).join('') + '</ul></div>';
    }
    if (art === 'spiel') html += '<p class="sb-fortschritt nur-bildschirm" id="sbFortschritt" aria-live="polite"></p>';
    return html;
  }
  function anzeigen(){
    if (!aktuell) return;
    var f = aktuell.feld, blatt = $('#sbBlatt'), loes = $('#sbLoesung');
    blatt.innerHTML = blattHtml('spiel'); loes.innerHTML = blattHtml('loesung');
    var svg = Gitter.svg(f, { spiel:true, linien:st.opt.linien });
    blatt.querySelector('.sb-gitter').appendChild(svg);
    loes.querySelector('.sb-gitter').appendChild(Gitter.svg(f, { linien:st.opt.linien }));
    Gitter.spiel(svg, f, { gefunden:spiel.gefunden, treffer:function(i){
      var li = blatt.querySelector('.sb-woerter li[data-i="' + i + '"]'); if (li) li.classList.add('gefunden');
      fortschritt();
      if (Object.keys(spiel.gefunden).length === f.woerter.length){ blatt.classList.remove('geschafft'); void blatt.offsetWidth; blatt.classList.add('geschafft'); }
    } });
    blatt.hidden = false; $('#sbWerkzeug').hidden = false; leer();
    fortschritt();
  }
  function fortschritt(){
    var f = aktuell.feld, n = Object.keys(spiel.gefunden).length, p = $('#sbFortschritt');
    if (!p) return;
    p.className = 'sb-fortschritt nur-bildschirm' + (n === f.woerter.length ? ' fertig' : '');
    p.textContent = n === f.woerter.length ? '🎉 Geschafft! Alle ' + n + ' Wörter gefunden.' : n + ' von ' + f.woerter.length + ' Wörtern gefunden.';
  }

  /* ---------- Werkzeuge ---------- */
  $('#sbLos').addEventListener('click', erstellen);
  $('#sbMischen').addEventListener('click', function(){ if (aktuell) setzen(auswerten()); });
  $('#sbZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#sbBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#sbMarkWeg').addEventListener('click', function(){ if (!aktuell) return; spiel = { gefunden:{} }; $('#sbBlatt').classList.remove('geschafft'); anzeigen(); });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  $('#sbDrucken').addEventListener('click', function(){ druckVorbereiten(); window.print(); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#sbDrucken').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#sbHerunterladen').hidden = false; });
  }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .ebene-markiert, .ebene-auswahl'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('.gefunden'), function(n){ n.classList.remove('gefunden'); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#sbHerunterladen').addEventListener('click', function(){
    if (!aktuell || !speicherOrt) return;
    var t = st.titel.trim(), inhalt = sauber($('#sbBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#sbLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:'Suchsel' + (t ? '-' + Labor.dateiname(t) : '') + '.html', data:Labor.blattDatei('Suchsel' + (t ? ' – ' + t : ''), inhalt, '.sb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  ww.zeichne(); info(); leer();
  if (auswerten().woerter.length && sessionStorage) { try { if (sessionStorage.getItem(TAB)) erstellen(); } catch(x){} }

  return function stopp(){
    aus = true;
    ww.stopp();
    if (timer) speichernJetzt();
    window.removeEventListener('beforeprint', druckVorbereiten);
    document.body.classList.remove('mit-loesung');
  };
}
})();
