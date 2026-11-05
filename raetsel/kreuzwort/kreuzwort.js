/* Rätsellabor – Generator «Kreuzworträtsel»
   Eigene Wörter mit Hinweisen werden waagrecht und senkrecht ineinander verschränkt (jedes Wort kreuzt mindestens ein
   anderes). Das Blatt ist eine feste A4-Seite: Gitter, Hinweise «Waagrecht» und «Senkrecht» – und hochgeladene Bilder,
   die der Generator zuerst selbst auf freie Flächen setzt, mit Abstand zum Rätsel, zu den Texten und zum Rand. Danach
   lassen sie sich auf dem Blatt verschieben, vergrössern, verkleinern und drehen (von Hand gesetzte Bilder bleiben dort).
   Lösung einblenden, Lösungsblatt, PDF und Bild wie bei den anderen Generatoren. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  // Wort fürs Gitter: Grossbuchstaben, ß → SS, Umlaute bleiben ein Feld, alles andere (Leerzeichen, Bindestriche) fällt weg
  function wort(t){ return String(t || '').replace(/ẞ/g, 'ß').toUpperCase().replace(/[^A-ZÄÖÜ]/g, ''); }
  // eingegebene Paare [{ w, h }] prüfen → { liste:[{ wort, hinweis }], ohne (Hinweis fehlt), kurz, doppelt }
  function pruefen(paare){
    var liste = [], ohne = 0, kurz = 0, doppelt = 0, gesehen = {};
    (paare || []).forEach(function(p){
      var w = wort(p.w), h = String(p.h || '').trim();
      if (!w) return;
      if (w.length < 2){ kurz++; return; }
      if (gesehen[w]){ doppelt++; return; }
      if (!h){ ohne++; return; }
      gesehen[w] = true;
      liste.push({ wort:w, hinweis:h });
    });
    return { liste:liste, ohne:ohne, kurz:kurz, doppelt:doppelt };
  }
  // eingefügter Text mit mehreren Zeilen «Wort = Hinweis» (auch «;», Tabulator, «:» oder « - ») → [{ w, h }]
  function zerlegeText(text){
    return String(text || '').split(/\r?\n/).map(function(z){
      z = z.trim(); if (!z) return null;
      var m = /\s*(?:\t|;|=|:|\s[-–—]\s)\s*/.exec(z);
      return { w:m ? z.slice(0, m.index).trim() : z, h:m ? z.slice(m.index + m[0].length).trim() : '' };
    }).filter(Boolean);
  }
  function eintraege(text){ return pruefen(zerlegeText(text)); }

  /* ---------- Anordnen ----------
     Gitter als Karte "zeile,spalte" → { b: Buchstabe, h: gehört zu einem waagrechten Wort, v: zu einem senkrechten }.
     Regeln: Ein neues Wort kreuzt mindestens einen Buchstaben (gleicher Buchstabe), läuft nie neben einem anderen her,
     und vor und nach ihm bleibt ein Feld frei. Viele Versuche mit anderer Reihenfolge, der beste gewinnt. */
  function versuch(liste, rnd){
    var gitter = {}, gesetzt = [], r0 = 0, r1 = 0, c0 = 0, c1 = 0;
    function feld(r, c){ return gitter[r + ',' + c]; }
    function pruefe(w, r, c, waag){
      var dr = waag ? 0 : 1, dc = waag ? 1 : 0, kreuz = 0;
      if (feld(r - dr, c - dc) || feld(r + dr * w.length, c + dc * w.length)) return -1;
      for (var k = 0; k < w.length; k++){
        var rr = r + dr * k, cc = c + dc * k, z = feld(rr, cc);
        if (z){ if (z.b !== w[k] || (waag ? z.h : z.v)) return -1; kreuz++; }
        else if (waag ? feld(rr - 1, cc) || feld(rr + 1, cc) : feld(rr, cc - 1) || feld(rr, cc + 1)) return -1;
      }
      return kreuz;
    }
    function setze(e, r, c, waag){
      for (var k = 0; k < e.wort.length; k++){
        var rr = r + (waag ? 0 : k), cc = c + (waag ? k : 0), s = rr + ',' + cc;
        gitter[s] = gitter[s] || { b:e.wort[k] }; gitter[s][waag ? 'h' : 'v'] = true;
        r0 = Math.min(r0, rr); r1 = Math.max(r1, rr); c0 = Math.min(c0, cc); c1 = Math.max(c1, cc);
      }
      gesetzt.push({ wort:e.wort, hinweis:e.hinweis, r:r, c:c, waag:waag });
    }
    function bester(e){
      var w = e.wort, best = null;
      Object.keys(gitter).forEach(function(s){
        var z = gitter[s], p = s.split(','), r = +p[0], c = +p[1];
        for (var i = 0; i < w.length; i++){
          if (w[i] !== z.b) continue;
          [true, false].forEach(function(waag){
            if (waag ? z.h : z.v) return;
            var sr = waag ? r : r - i, sc = waag ? c - i : c, k = pruefe(w, sr, sc, waag);
            if (k < 1 || k >= w.length) return;
            var nr0 = Math.min(r0, sr), nc0 = Math.min(c0, sc), nr1 = Math.max(r1, waag ? sr : sr + w.length - 1), nc1 = Math.max(c1, waag ? sc + w.length - 1 : sc);
            var H = nr1 - nr0 + 1, W = nc1 - nc0 + 1, wert = k * 10 - (W * H - (r1 - r0 + 1) * (c1 - c0 + 1)) * 0.35 - Math.abs(W - H * 1.3) * 0.9 + rnd() * 3;
            if (!best || wert > best.wert) best = { r:sr, c:sc, waag:waag, wert:wert, kreuz:k };
          });
        }
      });
      return best;
    }
    var offen = liste.slice(), kreuzungen = 0;
    setze(offen.shift(), 0, 0, rnd() < 0.6);
    for (var runde = 0; runde < 3 && offen.length; runde++){
      var rest = [];
      offen.forEach(function(e){ var b = bester(e); if (b){ setze(e, b.r, b.c, b.waag); kreuzungen += b.kreuz; } else rest.push(e); });
      if (rest.length === offen.length) break;
      offen = rest;
    }
    var H = r1 - r0 + 1, W = c1 - c0 + 1;
    return { gitter:gitter, gesetzt:gesetzt, fehlend:offen, r0:r0, c0:c0, breite:W, hoehe:H, kreuzungen:kreuzungen,
      wert:gesetzt.length * 1000 + kreuzungen * 6 - W * H * 0.6 - Math.abs(W / H - 1.25) * 12 - Math.max(W, H) * 2 };
  }
  function anordnen(liste, seed, versuche){
    if (!liste.length) return null;
    var rnd = zufall(seed), best = null;
    for (var v = 0; v < (versuche || 60); v++){
      var reihe = liste.map(function(e){ return { e:e, k:e.wort.length + rnd() * (v ? 6 : 0.5) }; }).sort(function(a, b){ return b.k - a.k; }).map(function(x){ return x.e; });
      var x = versuch(reihe, rnd);
      if (!best || x.wert > best.wert) best = x;
    }
    // auf (0,0) verschieben und nummerieren: Startfelder in Lesereihenfolge
    var woerter = best.gesetzt.map(function(g){ return { wort:g.wort, hinweis:g.hinweis, r:g.r - best.r0, c:g.c - best.c0, waag:g.waag }; });
    var starts = {};
    woerter.forEach(function(w){ starts[w.r + ',' + w.c] = true; });
    var nummer = {}, n = 0;
    Object.keys(starts).map(function(s){ var p = s.split(','); return [+p[0], +p[1]]; }).sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; })
      .forEach(function(p){ nummer[p[0] + ',' + p[1]] = ++n; });
    woerter.forEach(function(w){ w.nr = nummer[w.r + ',' + w.c]; });
    var zellen = Object.keys(best.gitter).map(function(s){ var p = s.split(','), r = +p[0] - best.r0, c = +p[1] - best.c0; return { r:r, c:c, b:best.gitter[s].b, nr:nummer[r + ',' + c] || 0 }; });
    return { breite:best.breite, hoehe:best.hoehe, zellen:zellen, woerter:woerter, fehlend:best.fehlend, kreuzungen:best.kreuzungen };
  }

  /* ---------- Freie Flächen für Bilder ----------
     belegt: Rechtecke [x, y, b, h] auf der Seite (breite × hoehe); jedes wird um «abstand» vergrössert, der Seitenrand
     bleibt ebenfalls frei. Gesucht wird mit einer Summentabelle auf einem Raster von «schritt» Pixeln. */
  function freieFlaeche(breite, hoehe, belegt, abstand, schritt){
    var nx = Math.ceil(breite / schritt), ny = Math.ceil(hoehe / schritt), b = new Uint8Array(nx * ny);
    function markiere(x, y, w, h){
      var a = Math.max(0, Math.floor((x - abstand) / schritt)), e = Math.min(nx, Math.ceil((x + w + abstand) / schritt));
      var o = Math.max(0, Math.floor((y - abstand) / schritt)), u = Math.min(ny, Math.ceil((y + h + abstand) / schritt));
      for (var j = o; j < u; j++) for (var i = a; i < e; i++) b[j * nx + i] = 1;
    }
    belegt.forEach(function(r){ markiere(r[0], r[1], r[2], r[3]); });
    var sat;
    function summen(){
      sat = new Int32Array((nx + 1) * (ny + 1));
      for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) sat[(j + 1) * (nx + 1) + i + 1] = b[j * nx + i] + sat[j * (nx + 1) + i + 1] + sat[(j + 1) * (nx + 1) + i] - sat[j * (nx + 1) + i];
    }
    function leer(i, j, w, h){ var A = nx + 1; return sat[(j + h) * A + i + w] - sat[j * A + i + w] - sat[(j + h) * A + i] + sat[j * A + i] === 0; }
    summen();
    return {
      // grösstes Rechteck mit Seitenverhältnis ar (Breite/Höhe) zwischen min und max (längere Seite); Rand «rand» zur Seite
      platz:function(ar, max, min, rand){
        for (var L = max; L >= min; L -= 6){
          var w = ar >= 1 ? L : L * ar, h = ar >= 1 ? L / ar : L, wi = Math.ceil(w / schritt), hj = Math.ceil(h / schritt);
          var i0 = Math.ceil(rand / schritt), j0 = Math.ceil(rand / schritt), i1 = Math.floor((breite - rand) / schritt) - wi, j1 = Math.floor((hoehe - rand) / schritt) - hj;
          for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) if (leer(i, j, wi, hj)) return { x:i * schritt, y:j * schritt, b:w, h:h };
        }
        return null;
      },
      /* Deko-Platz: die Stelle mit dem meisten Freiraum rundherum (für ein Bild mit Seitenverhältnis ar). Für jede freie
         Stelle wird die grösste passende Bildgrösse gesucht; gewählt wird die grösste – das Bild steht dann mittig in der
         grössten Lücke. Grösse höchstens max (längere Seite), mindestens min; rand: Abstand zum Seitenrand. */
      mitte:function(ar, max, min, rand){
        var r0 = Math.ceil(rand / schritt), best = null, fx = ar >= 1 ? 1 : ar, fy = ar >= 1 ? 1 / ar : 1;
        function passt(i, j, halb){   // Rechteck um Zelle (i, j) mit halber längerer Seite «halb» (in Zellen)
          var hx = Math.max(1, Math.round(halb * fx)), hy = Math.max(1, Math.round(halb * fy));
          if (i - hx < r0 || j - hy < r0 || i + hx > nx - r0 || j + hy > ny - r0) return false;
          return leer(i - hx, j - hy, 2 * hx, 2 * hy);
        }
        var maxHalb = Math.ceil(max / 2 / schritt) + 12, minHalb = Math.ceil(min / 2 / schritt);
        for (var j = r0; j < ny - r0; j += 2) for (var i = r0; i < nx - r0; i += 2){
          if (b[j * nx + i] || !passt(i, j, minHalb)) continue;
          var lo = minHalb, hi = maxHalb;
          while (lo < hi){ var m = (lo + hi + 1) >> 1; if (passt(i, j, m)) lo = m; else hi = m - 1; }
          if (!best || lo > best.halb) best = { i:i, j:j, halb:lo };
        }
        if (!best) return null;
        var L = Math.min(max, 2 * best.halb * schritt - 10), w = L * fx, h = L * fy;
        return { x:best.i * schritt - w / 2, y:best.j * schritt - h / 2, b:w, h:h };
      },
      belege:function(x, y, w, h){ markiere(x, y, w, h); summen(); }
    };
  }
  return { wort:wort, pruefen:pruefen, zerlegeText:zerlegeText, eintraege:eintraege, anordnen:anordnen, freieFlaeche:freieFlaeche, zufall:zufall };
})();
/* KERN-ENDE */

var SEITE_B = 703, SEITE_H = 1032;   // A4 ohne 12 mm Rand bei 96 dpi (wie das PDF)
var TINTE = '#1C1714';

var VORLAGE = '<div class="kw">' +
  '<header class="kw-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Kreuzworträtsel</h1>' +
    '<p>Deine Wörter mit Hinweisen werden waagrecht und senkrecht verschränkt. Eigene Bilder setzt der Generator dorthin, wo auf dem Blatt Platz frei ist – danach kannst du sie selbst verschieben, vergrössern, verkleinern und drehen.</p></header>' +
  '<div class="kw-layout"><section class="kw-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Wörter und Hinweise</h2><p>Pro Zeile ein Wort und sein Hinweis.</p></div></div>' +
      '<div class="kw-zeilen-kopf" aria-hidden="true"><span>Wort</span><span>Hinweis</span></div>' +
      '<div class="kw-zeilen" id="kwZeilen" role="list" aria-label="Wörter und Hinweise"></div>' +
      '<p class="hinweis">Sobald du in die unterste Zeile schreibst, kommt eine neue dazu. Mit der Eingabetaste springst du weiter. Eine Liste aus Word oder Excel (Wort und Hinweis nebeneinander) kannst du auch einfach einfügen. Leerzeichen und Bindestriche im Wort fallen weg, ß wird zu SS.</p>' +
      '<div class="kw-zaehler" id="kwZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Bilder</h2><p>Freiwillig – zum Verzieren oder als Hilfe.</p></div></div>' +
      '<label class="kw-ablage" id="kwAblage"><input type="file" id="kwDatei" accept="image/*" multiple class="vh">' +
        '<span><b>Bilder auswählen</b><small>oder hierher ziehen (bis 6)</small></span></label>' +
      '<div class="kw-bilder" id="kwBilder"></div>' +
      '<p class="hinweis">Der Generator setzt die Bilder zuerst auf freie Flächen des Blatts. Danach kannst du jedes Bild auf dem Blatt anklicken: ziehen zum Verschieben, an einer Ecke ziehen für die Grösse, am runden Griff oben drehen. Von Hand gesetzte Bilder bleiben an ihrem Platz.</p>' +
      '<button type="button" class="btn klein kw-auto" id="kwBilderAuto" hidden>Bilder automatisch verteilen</button>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="kwLaenge"><span>Anzahl Buchstaben beim Hinweis angeben</span></label>' +
      '<div class="opt-raster"><label for="kwTitel">Titel auf dem Blatt</label><input type="text" id="kwTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="kw-ausgabe" aria-label="Ergebnis">' +
    '<div id="kwMeldung" aria-live="polite"></div>' +
    '<div class="kw-werkzeug">' +
      '<button type="button" class="btn klein" id="kwNeu" title="Die Wörter anders anordnen">Neu anordnen</button>' +
      '<button type="button" class="btn klein" id="kwZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="kwMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein" id="kwBild">Als Bild</button>' +
      '<button type="button" class="btn klein primary" id="kwPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="kwHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="kw-bildleiste" id="kwBildLeiste" role="group" aria-label="Bilder bearbeiten" hidden>' +
      '<span class="kw-bild-tipp" id="kwBildTipp">Klicke auf ein Bild auf dem Blatt: Dann kannst du es verschieben, an einer Ecke grösser oder kleiner ziehen und am runden Griff drehen.</span>' +
      '<span class="kw-bild-werkzeug" id="kwBildWerkzeug" hidden>' +
      '<b id="kwBildName">Bild</b>' +
      '<label class="kw-regler">Grösse <input type="range" id="kwBildGroesse" min="24" max="700" step="1"></label>' +
      '<label class="kw-regler">Drehen <input type="range" id="kwBildDreh" min="-180" max="180" step="1"><output id="kwBildDrehWert" for="kwBildDreh">0°</output></label>' +
      '<button type="button" class="btn klein" id="kwBildGerade">Gerade</button>' +
      '<button type="button" class="btn klein" id="kwBildWeg">Entfernen</button>' +
      '<span class="abstand"></span>' +
      '<button type="button" class="btn klein primary" id="kwBildFertig">Fertig</button>' +
    '</span></div>' +
    '<div class="kw-rahmen" id="kwRahmen"><article class="kw-seite kw-blatt" id="kwBlatt"></article></div>' +
    '<div class="kw-rahmen kw-loesungs-rahmen"><article class="kw-seite kw-blatt kw-loesungsblatt" id="kwLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 9h6V3h6v6h6v6h-6v6H9v-6H3z"/><path d="M9 9h6v6H9zM15 9V3M9 15v6"/></svg>';

Labor.registriere({
  id:'kreuzwort',
  titel:'Kreuzworträtsel',
  kurz:'Wörter waagrecht und senkrecht, mit eigenen Bildern',
  beschreibung:'Eigene Wörter mit Hinweisen werden zu einem Kreuzworträtsel verschränkt. Hochgeladene Bilder setzt der Generator auf freie Flächen – verschieben, vergrössern und drehen kannst du sie selbst. Mit Lösungsblatt.',
  merkmale:['Waagrecht und senkrecht', 'Eigene Bilder frei platzierbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/kreuzwort/kreuzwort.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false;
  var TAB = 'kreuzwort-eingaben', OPT = 'kreuzwort-einstellungen';
  var STANDARD = { laenge:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { paare:[], titel:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.paare = Array.isArray(e.paare) ? e.paare.map(function(p){ return { w:String(p.w || ''), h:String(p.h || '') }; }) : []; st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ paare:st.paare, titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#kwMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  /* Bilder – nur solange die Seite offen ist: { src, b, h (Pixel), lage, auto, notfall }. Eine Lage ist { x, y (Mitte auf
     der Seite), w (Breite), d (Drehung in Grad) }; die Höhe folgt aus dem Seitenverhältnis. lage: von Hand gesetzt (bleibt),
     auto: vom Generator gesetzt (wird bei jedem Aufbau neu gesucht). */
  var bilder = [], gewaehlt = -1, oben = 0;   // oben: zuletzt angeklicktes Bild liegt zuoberst (auch im PDF)
  var raetsel = null;

  /* ---------- Eingaben ---------- */
  /* Zeilen mit zwei Feldern (Wort, Hinweis); unten steht immer eine leere Zeile – sobald man hineinschreibt, kommt eine
     neue dazu. Eingabetaste: Wort → Hinweis → nächste Zeile. Text mit mehreren Zeilen einfügen: wird auf Zeilen verteilt. */
  var warte = 0, zeilen = $('#kwZeilen');
  function baldErzeugen(){ speichern(); clearTimeout(warte); warte = setTimeout(erzeugen, 300); }
  function zeileHtml(p, i){
    return '<div class="kw-zeile" role="listitem"><input type="text" class="kw-w" value="' + esc(p.w) + '" maxlength="30" autocomplete="off" spellcheck="false" aria-label="Wort ' + (i + 1) + '">' +
      '<input type="text" class="kw-h" value="' + esc(p.h) + '" maxlength="120" autocomplete="off" aria-label="Hinweis ' + (i + 1) + '">' +
      '<button type="button" class="kw-x" aria-label="Zeile ' + (i + 1) + ' löschen" title="Zeile löschen">×</button></div>';
  }
  function zeilenZeigen(fokus){
    while (st.paare.length && !st.paare[st.paare.length - 1].w && !st.paare[st.paare.length - 1].h) st.paare.pop();
    zeilen.innerHTML = st.paare.concat([{ w:'', h:'' }]).map(zeileHtml).join('');
    zeilen.lastChild.classList.add('kw-neu');
    if (fokus){ var f = zeilen.children[fokus[0]]; if (f) f.querySelector(fokus[1] ? '.kw-h' : '.kw-w').focus(); }
  }
  function index(el){ return [].indexOf.call(zeilen.children, el.closest('.kw-zeile')); }
  zeilen.addEventListener('input', function(ev){
    var z = ev.target.closest('.kw-zeile'), i = index(ev.target);
    if (!z) return;
    st.paare[i] = { w:z.querySelector('.kw-w').value, h:z.querySelector('.kw-h').value };
    if (z.classList.contains('kw-neu') && (st.paare[i].w || st.paare[i].h)){   // unterste Zeile benutzt: neue leere Zeile darunter
      z.classList.remove('kw-neu');
      zeilen.insertAdjacentHTML('beforeend', zeileHtml({ w:'', h:'' }, i + 1)); zeilen.lastChild.classList.add('kw-neu');
    }
    baldErzeugen();
  });
  zeilen.addEventListener('click', function(ev){
    var k = ev.target.closest('.kw-x'); if (!k) return;
    var i = index(k);
    if (i < st.paare.length){ st.paare.splice(i, 1); zeilenZeigen([Math.min(i, st.paare.length), 0]); baldErzeugen(); }
  });
  zeilen.addEventListener('keydown', function(ev){
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    var i = index(ev.target), z = zeilen.children[i];
    if (ev.target.classList.contains('kw-w')) z.querySelector('.kw-h').focus();
    else if (zeilen.children[i + 1]) zeilen.children[i + 1].querySelector('.kw-w').focus();
  });
  zeilen.addEventListener('paste', function(ev){
    var t = ev.clipboardData && ev.clipboardData.getData('text');
    if (!t || !/[\r\n\t]/.test(t.trim())) return;   // einzelnes Wort: normal einfügen
    ev.preventDefault();
    var neu = Kern.zerlegeText(t), i = index(ev.target);
    if (!neu.length) return;
    var hier = st.paare[i] || { w:'', h:'' }, leer = !hier.w && !hier.h;
    st.paare.splice.apply(st.paare, [i, leer ? 1 : 0].concat(neu));
    zeilenZeigen([i + neu.length, 0]); baldErzeugen();
  });
  zeilenZeigen();
  $('#kwTitel').value = st.titel;
  $('#kwTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); seiten(); });
  $('#kwLaenge').checked = st.opt.laenge;
  $('#kwLaenge').addEventListener('change', function(){ st.opt.laenge = this.checked; speichern(); seiten(); });
  $('#kwMitLoesung').checked = st.opt.mitLoesung;
  $('#kwMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); seiten(); });

  /* ---------- Bilder ---------- */
  function bilderLaden(dateien){
    var liste = [].slice.call(dateien || []).filter(function(f){ return /^image\//.test(f.type); });
    if (!liste.length){ if (dateien && dateien.length) meldung('fehler', '<p>Das ist kein Bild. Wähle Bilddateien (z. B. JPG oder PNG).</p>'); return; }
    var platz = 6 - bilder.length;
    if (platz <= 0){ meldung('warnung', '<p>Es sind schon 6 Bilder auf dem Blatt.</p>'); return; }
    Promise.all(liste.slice(0, platz).map(function(f){
      return new Promise(function(ok){
        var url = URL.createObjectURL(f), img = new Image();
        img.onload = function(){
          var k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.naturalWidth * k)); cv.height = Math.max(1, Math.round(img.naturalHeight * k));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
          var png = /png|gif|webp|svg/.test(f.type);   // durchsichtige Bilder bleiben durchsichtig
          ok({ src:cv.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88), b:cv.width, h:cv.height, lage:null, auto:null, notfall:false });
        };
        img.onerror = function(){ URL.revokeObjectURL(url); ok(null); };
        img.src = url;
      });
    })).then(function(neu){
      if (aus) return;
      bilder = bilder.concat(neu.filter(Boolean));
      if (liste.length > platz) meldung('warnung', '<p>Höchstens 6 Bilder – die übrigen wurden nicht übernommen.</p>');
      bilderZeigen(); seiten();
    });
  }
  function bilderZeigen(){
    $('#kwBilder').innerHTML = bilder.map(function(b, i){ return '<span class="kw-bild-klein"><img src="' + b.src + '" alt="Bild ' + (i + 1) + '"><span class="kw-nr" aria-hidden="true">' + (i + 1) + '</span><button type="button" class="kw-weg" data-i="' + i + '" aria-label="Bild ' + (i + 1) + ' entfernen">×</button></span>'; }).join('');
    [].forEach.call($('#kwBilder').querySelectorAll('.kw-weg'), function(k){ k.addEventListener('click', function(){ entfernen(+k.dataset.i); }); });
    knopfAuto();
  }
  $('#kwDatei').addEventListener('change', function(){ bilderLaden(this.files); this.value = ''; });
  var ablage = $('#kwAblage');
  ablage.addEventListener('dragover', function(ev){ if (ev.dataTransfer && [].indexOf.call(ev.dataTransfer.types, 'Files') >= 0){ ev.preventDefault(); ablage.classList.add('ziehen'); } });
  ablage.addEventListener('dragleave', function(){ ablage.classList.remove('ziehen'); });
  ablage.addEventListener('drop', function(ev){ ablage.classList.remove('ziehen'); if (!ev.dataTransfer || !ev.dataTransfer.files.length) return; ev.preventDefault(); bilderLaden(ev.dataTransfer.files); });

  /* ---------- Rätsel erzeugen ---------- */
  function zaehler(info){
    var n = info.liste.length, h = '<p class="kw-zaehler-haupt ' + (n >= 2 ? 'ok' : 'fehlt') + '"><b>' + n + '</b> ' + (n === 1 ? 'Wort' : 'Wörter') + (n < 2 ? ' – es braucht mindestens 2.' : '') + '</p>';
    if (info.ohne) h += '<p class="warnung">' + info.ohne + ' Wort' + (info.ohne > 1 ? 'e' : '') + ' ohne Hinweis – bitte rechts den Hinweis ergänzen.</p>';
    if (info.doppelt) h += '<p class="warnung">' + info.doppelt + ' Wort' + (info.doppelt > 1 ? 'e' : '') + ' doppelt – nur einmal verwendet.</p>';
    if (info.kurz) h += '<p class="warnung">Wörter mit nur einem Buchstaben werden weggelassen.</p>';
    if (n > 30) h += '<p class="warnung">Mehr als 30 Wörter passen kaum auf ein Blatt – es werden die ersten 30 verwendet.</p>';
    $('#kwZaehler').innerHTML = h;
  }
  function erzeugen(){
    if (aus) return;
    var info = Kern.pruefen(st.paare);
    zaehler(info);
    var liste = info.liste.slice(0, 30).filter(function(e){ return e.hinweis; });
    if (liste.length < 2){
      raetsel = null; leer(liste.length ? '<p>Es braucht mindestens zwei Wörter mit Hinweis.</p>' : '<p>Schreibe links deine Wörter und Hinweise in die Zeilen – links das Wort, rechts den Hinweis.</p>');
      return;
    }
    raetsel = Kern.anordnen(liste, st.seed, liste.length > 18 ? 40 : 70);
    seiten();
  }
  function leer(text){
    $('#kwBlatt').innerHTML = ''; $('#kwLoesung').innerHTML = ''; $('#kwRahmen').hidden = true; gewaehlt = -1; $('#kwBildLeiste').hidden = true; letzte = null;
    ['#kwNeu', '#kwZeigeLoesung', '#kwPdf', '#kwBild', '#kwHerunterladen'].forEach(function(s){ $(s).disabled = true; });
    meldung('info', text);
  }

  /* ---------- Seite aufbauen ----------
     Die Seite ist 703 × 1032 Pixel (A4 ohne Rand). Gitter und Hinweise fliessen von oben nach unten; danach werden die
     belegten Flächen gemessen und die Bilder in die grössten freien Flächen gesetzt. Passt nicht alles, wird das Gitter
     kleiner (Feldgrösse 40 … 16 Pixel). */
  function gitterSvg(R, f, loesung){
    var h = '<svg class="kw-gitter" width="' + (R.breite * f + 2) + '" height="' + (R.hoehe * f + 2) + '" viewBox="-1 -1 ' + (R.breite * f + 2) + ' ' + (R.hoehe * f + 2) + '" role="img" aria-label="Kreuzworträtsel-Gitter">';
    R.zellen.forEach(function(z){ h += '<rect x="' + z.c * f + '" y="' + z.r * f + '" width="' + f + '" height="' + f + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1.4"/>'; });
    R.zellen.forEach(function(z){
      if (z.nr) h += '<text x="' + (z.c * f + 2.2) + '" y="' + (z.r * f + f * 0.3 + 1) + '" font-size="' + (f * 0.3).toFixed(1) + '" style="font-family:var(--blatt-schrift)" font-weight="600" fill="' + TINTE + '">' + z.nr + '</text>';
      h += '<text class="kw-buchstabe' + (loesung ? ' an' : '') + '" x="' + (z.c * f + f / 2) + '" y="' + (z.r * f + f * 0.74) + '" font-size="' + (f * 0.6).toFixed(1) + '" style="font-family:var(--blatt-buchstaben)" font-weight="700" text-anchor="middle">' + esc(z.b) + '</text>';
    });
    return h + '</svg>';
  }
  function seitenHtml(R, f, mitBildern, loesung){
    var o = st.opt, titel = st.titel.trim() || 'Kreuzworträtsel';
    function liste(waag){
      return R.woerter.filter(function(w){ return w.waag === waag; }).sort(function(a, b){ return a.nr - b.nr; }).map(function(w){
        return '<li><span><b>' + w.nr + '</b> ' + esc(w.hinweis) + (o.laenge ? ' <small>(' + w.wort.length + ')</small>' : '') + '</span></li>';   // Lösungsblatt gleich aufgebaut: die Bilder liegen dort am gleichen Platz
      }).join('');
    }
    return '<div class="kw-fluss">' +
      (o.titelAn ? '<h2>' + esc(titel) + (loesung ? ' – Lösung' : '') + '</h2>' : '') +
      (o.anleitungAn ? '<p class="kw-anleitung">Lies die Hinweise und schreibe die Wörter waagrecht (→) und senkrecht (↓) ins Gitter. Die Zahl zeigt, wo ein Wort beginnt.</p>' : '') +
      '<div class="kw-gitter-platz">' + gitterSvg(R, f, loesung) + '</div>' +   // Gitter immer in der Mitte
      '<div class="kw-hinweise"><section><h3>Waagrecht →</h3><ol>' + liste(true) + '</ol></section><section><h3>Senkrecht ↓</h3><ol>' + liste(false) + '</ol></section></div>' +
      '</div>';
  }
  function messen(seite, R, f){
    // belegte Rechtecke relativ zur Seite (ohne Massstab)
    var ps = seite.getBoundingClientRect(), m = ps.width / SEITE_B, belegt = [];
    function rect(el){ var r = el.getBoundingClientRect(); if (r.width && r.height) belegt.push([(r.left - ps.left) / m, (r.top - ps.top) / m, r.width / m, r.height / m]); }
    [].forEach.call(seite.querySelectorAll('.kw-fluss > h2, .kw-fluss > .kw-anleitung, .kw-hinweise h3, .kw-hinweise li > span'), rect);
    var g = seite.querySelector('.kw-gitter').getBoundingClientRect(), gx = (g.left - ps.left) / m + 1, gy = (g.top - ps.top) / m + 1;
    R.zellen.forEach(function(z){ belegt.push([gx + z.c * f, gy + z.r * f, f, f]); });
    var fluss = seite.querySelector('.kw-fluss');
    return { belegt:belegt, hoehe:fluss.getBoundingClientRect().height / m };
  }
  /* ---------- Bilder auf dem Blatt ---------- */
  function bildStil(b, p){
    var h = p.w * b.h / b.b;
    return 'left:' + (p.x - p.w / 2).toFixed(1) + 'px;top:' + (p.y - h / 2).toFixed(1) + 'px;width:' + p.w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px' +
      (p.d ? ';transform:rotate(' + p.d.toFixed(1) + 'deg)' : '') + (b.z ? ';z-index:' + b.z : '');
  }
  // griffe: auf dem Arbeitsblatt am Bildschirm anfassbar (Rahmen mit Ecken zum Vergrössern und Griff zum Drehen)
  function bildHtml(b, i, p, griffe){
    return '<div class="kw-bild' + (griffe && i === gewaehlt ? ' gewaehlt' : '') + '" data-i="' + i + '" style="' + bildStil(b, p) + '"' +
      (griffe ? ' tabindex="0" role="button" aria-label="Bild ' + (i + 1) + ' – ziehen oder Pfeiltasten zum Verschieben, Plus und Minus für die Grösse"' : '') + '>' +
      '<img src="' + b.src + '" alt="" draggable="false">' +
      (griffe ? '<span class="kw-dreh-stiel nur-bildschirm" aria-hidden="true"></span><span class="kw-griff kw-dreh nur-bildschirm" data-griff="dreh" title="Drehen" aria-hidden="true"></span>' +
        ['lo', 'ro', 'lu', 'ru'].map(function(e){ return '<span class="kw-griff kw-ecke-' + e + ' nur-bildschirm" data-griff="gross" title="Grösse ändern" aria-hidden="true"></span>'; }).join('') : '') +
      '</div>';
  }
  /* Bilder der Reihe nach in die grösste freie Lücke setzen (als Deko: mittig, längere Seite 64–190 Pixel, 30 Pixel vom
     Rand), bis eines keinen Platz mehr findet. Die Werte werden sofort in neue Felder kopiert: In einer Chromium-Version
     kam es sonst nach dem PDF vor, dass alle Bilder die Lage des letzten bekamen. */
  function verteilen(platz, liste){
    var lage = [];
    for (var i = 0; i < liste.length; i++){
      var q = platz.mitte(liste[i].b / liste[i].h, 190, 64, 30);
      if (!q) break;
      var x = +q.x, y = +q.y, w = +q.b, h = +q.h;
      platz.belege(x, y, w, h);
      lage.push({ x:x, y:y, b:w, h:h });
    }
    return lage;
  }
  function ausAuto(p){ return { x:p.x + p.b / 2, y:p.y + p.h / 2, w:p.b, d:0 }; }
  // Ecken des (gedrehten) Bildes auf der Seite; Hülle: umschliessendes Rechteck [x, y, b, h]
  function bildEcken(b, p, k){
    var w = p.w * (k || 1), h = w * b.h / b.b, a = (p.d || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function(e){ var dx = e[0] * w / 2, dy = e[1] * h / 2; return [p.x + dx * c - dy * s, p.y + dx * s + dy * c]; });
  }
  function huelle(P){
    var xs = P.map(function(q){ return q[0]; }), ys = P.map(function(q){ return q[1]; });
    var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    return [x0, y0, Math.max.apply(null, xs) - x0, Math.max.apply(null, ys) - y0];
  }
  // Überschneiden sich zwei konvexe Vielecke? (Trennachsen)
  function schneiden(P, Q){
    function proj(V, nx, ny){ var lo = Infinity, hi = -Infinity; V.forEach(function(q){ var t = q[0] * nx + q[1] * ny; if (t < lo) lo = t; if (t > hi) hi = t; }); return [lo, hi]; }
    return [P, Q].every(function(V){
      return V.every(function(a, i){
        var b = V[(i + 1) % V.length], nx = a[1] - b[1], ny = b[0] - a[0], p = proj(P, nx, ny), q = proj(Q, nx, ny);
        return p[1] > q[0] && q[1] > p[0];
      });
    });
  }
  // Liegt das Bild über Gitter, Titel oder Hinweisen? (Bildränder sind oft leer – geprüft wird darum etwas kleiner)
  function liegtUeber(b, p, belegt){
    var P = bildEcken(b, p, 0.85), hb = huelle(P);
    return belegt.some(function(r){
      if (r[0] >= hb[0] + hb[2] || r[0] + r[2] <= hb[0] || r[1] >= hb[1] + hb[3] || r[1] + r[3] <= hb[1]) return false;
      return schneiden(P, [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]]);
    });
  }
  function aufzaehlen(n){ return n.length === 1 ? 'Bild ' + n[0] : 'die Bilder ' + n.slice(0, -1).join(', ') + ' und ' + n[n.length - 1]; }
  var letzte = null;   // letzter Aufbau: { R, belegt (Gitter und Texte), zuHoch }
  function meldungen(){
    if (!letzte) return;
    var R = letzte.R, m = [];
    if (R.fehlend.length) m.push('<p>Nicht eingebaut (passt nirgends über Kreuz): <b>' + R.fehlend.map(function(e){ return esc(e.wort); }).join(', ') + '</b>. «Neu anordnen» probiert eine andere Anordnung.</p>');
    var kein = [], ueber = [];
    bilder.forEach(function(b, i){
      if (b.notfall && !b.lage) kein.push(i + 1);
      else if (liegtUeber(b, b.lage || b.auto, letzte.belegt)) ueber.push(i + 1);
    });
    if (kein.length) m.push('<p>Für ' + aufzaehlen(kein) + ' hat es keinen freien Platz – ' + (kein.length === 1 ? 'es liegt' : 'sie liegen') + ' klein unten rechts. Verschiebe oder verkleinere die Bilder, oder nimm weniger Wörter.</p>');
    if (ueber.length){ var t = aufzaehlen(ueber); m.push('<p>' + t.charAt(0).toUpperCase() + t.slice(1) + (ueber.length === 1 ? ' liegt' : ' liegen') + ' über dem Rätsel oder den Hinweisen. Verschiebe ' + (ueber.length === 1 ? 'es' : 'sie') + ' oder klicke links «Bilder automatisch verteilen».</p>'); }
    if (letzte.zuHoch) m.push('<p>Das Rätsel ist für eine A4-Seite sehr gross – im PDF wird das Blatt verkleinert.</p>');
    meldung(m.length ? 'warnung' : '', m.join(''));
  }
  var meldungZeit = 0;
  function meldungenBald(){ clearTimeout(meldungZeit); meldungZeit = setTimeout(meldungen, 250); }
  function knopfAuto(){ $('#kwBilderAuto').hidden = !bilder.some(function(b){ return b.lage; }); }
  // Sobald man ein Bild anfasst, bleiben alle Bilder dort, wo sie gerade sind (sonst würden die anderen springen)
  function lageVon(b){
    if (!b.lage){ bilder.forEach(function(x){ if (!x.lage && x.auto) x.lage = Object.assign({}, x.auto); x.notfall = false; }); knopfAuto(); }
    return b.lage;
  }
  function breiteKlemm(b, w){ var ar = b.b / b.h; return Math.max(ar >= 1 ? 24 : 24 * ar, Math.min(SEITE_B, SEITE_H * ar, w)); }
  function klemm(v, a, e){ return Math.max(a, Math.min(e, v)); }
  function winkelRund(a, frei){
    a = ((a + 180) % 360 + 360) % 360 - 180;
    if (frei) return Math.round(a / 15) * 15;   // mit Umschalttaste in 15°-Schritten
    var r = Math.round(a / 90) * 90;
    return Math.abs(a - r) < 4 ? (r === -180 ? 180 : r) : Math.round(a);   // nahe bei gerade: einrasten
  }
  function bildEl(blatt, i){ return blatt.querySelector('.kw-bild[data-i="' + i + '"]'); }
  function anwenden(i){
    var b = bilder[i];
    [$('#kwBlatt'), $('#kwLoesung')].forEach(function(bl){ var el = bildEl(bl, i); if (el) el.style.cssText = bildStil(b, b.lage); });
    if (i === gewaehlt) leisteZeigen();
  }
  function waehle(i){
    gewaehlt = bilder[i] ? i : -1;
    var b = bilder[gewaehlt];
    if (b && (!b.z || b.z < oben)){
      b.z = ++oben;
      [$('#kwBlatt'), $('#kwLoesung')].forEach(function(bl){ var el = bildEl(bl, gewaehlt); if (el) el.style.zIndex = b.z; });
    }
    [].forEach.call($('#kwBlatt').querySelectorAll('.kw-bild'), function(el){ el.classList.toggle('gewaehlt', +el.dataset.i === gewaehlt); });
    leisteZeigen();
  }
  function leisteZeigen(){
    // Die Leiste steht da, sobald Bilder auf dem Blatt sind (sonst würde das Blatt beim Anklicken nach unten rutschen)
    var l = $('#kwBildLeiste'), b = bilder[gewaehlt], p = b && (b.lage || b.auto);
    l.hidden = !bilder.length || !raetsel;
    l.classList.toggle('an', !!p); $('#kwBildTipp').hidden = !!p; $('#kwBildWerkzeug').hidden = !p;
    if (!p) return;
    var ar = b.b / b.h, g = $('#kwBildGroesse'), d = Math.round(p.d || 0);
    $('#kwBildName').textContent = 'Bild ' + (gewaehlt + 1);
    g.max = Math.floor(ar >= 1 ? breiteKlemm(b, 1e4) : breiteKlemm(b, 1e4) / ar);
    g.value = Math.round(ar >= 1 ? p.w : p.w / ar);
    $('#kwBildDreh').value = d; $('#kwBildDrehWert').textContent = d + '°';
  }
  function entfernen(i){
    if (!bilder[i]) return;
    bilder.splice(i, 1); gewaehlt = -1; leisteZeigen();
    bilderZeigen(); seiten();
  }
  function seiten(){
    if (aus) return;
    if (!raetsel){ return; }
    var R = raetsel, seite = $('#kwBlatt');
    $('#kwRahmen').hidden = false;
    ['#kwNeu', '#kwZeigeLoesung', '#kwPdf', '#kwBild', '#kwHerunterladen'].forEach(function(s){ $(s).disabled = false; });
    var maxF = Math.max(16, Math.min(40, Math.floor((SEITE_B - 76) / R.breite), Math.floor(600 / R.hoehe)));
    var wahl = null;
    for (var f = maxF; f >= 16; f -= 2){
      seite.innerHTML = seitenHtml(R, f, bilder.length > 0, false);
      var mess = messen(seite, R, f);
      if (mess.hoehe > SEITE_H - 26 && f > 16) continue;   // unten ebenfalls Rand lassen
      var lage = verteilen(Kern.freieFlaeche(SEITE_B, SEITE_H, mess.belegt, 18, 4), bilder), alle = lage.length === bilder.length;
      wahl = { f:f, lage:lage, alle:alle, zuHoch:mess.hoehe > SEITE_H, belegt:mess.belegt };
      if (alle || f <= 16) break;
    }
    /* Bilder setzen. Die Grösse des Gitters hängt nicht davon ab, ob Bilder von Hand verschoben sind (sonst würde es beim
       ersten Anfassen springen). Von Hand gesetzte Bilder bleiben, wo sie sind; die übrigen kommen in die grössten
       freien Flächen um sie herum. Findet ein Bild keinen Platz, liegt es klein unten rechts – zum Selber-Verschieben. */
    var hand = bilder.some(function(b){ return b.lage; }), lagen;
    if (!hand) lagen = bilder.map(function(_, i){ return wahl.lage[i] ? ausAuto(wahl.lage[i]) : null; });
    else {
      var belegt = wahl.belegt.slice();
      bilder.forEach(function(b){ if (b.lage) belegt.push(huelle(bildEcken(b, b.lage))); });
      var frei = Kern.freieFlaeche(SEITE_B, SEITE_H, belegt, 18, 4);
      lagen = bilder.map(function(b){
        if (b.lage) return b.lage;
        var p = verteilen(frei, [b])[0];
        return p ? ausAuto(p) : null;
      });
    }
    var ecke = 0;
    bilder.forEach(function(b, i){
      b.notfall = !lagen[i];
      if (!lagen[i]){ var ar = b.b / b.h, w = ar >= 1 ? 110 : 110 * ar, h = w / ar; lagen[i] = { x:SEITE_B - 26 - w / 2 - ecke * 16, y:SEITE_H - 26 - h / 2 - ecke * 16, w:w, d:0 }; ecke++; }
      b.auto = b.lage ? null : lagen[i];
    });
    if (gewaehlt >= bilder.length) gewaehlt = -1;
    seite.innerHTML = seitenHtml(R, wahl.f, bilder.length > 0, false) + bilder.map(function(b, i){ return bildHtml(b, i, lagen[i], true); }).join('');
    $('#kwLoesung').innerHTML = seitenHtml(R, wahl.f, bilder.length > 0, true) + bilder.map(function(b, i){ return bildHtml(b, i, lagen[i], false); }).join('');
    seite.classList.toggle('zeige-loesung', $('#kwZeigeLoesung').getAttribute('aria-pressed') === 'true');
    letzte = { R:R, belegt:wahl.belegt, zuHoch:wahl.zuHoch };
    meldungen(); leisteZeigen(); knopfAuto();
    massstab();
  }
  // Seite am Bildschirm in die Spalte einpassen (die Seite selbst bleibt 703 Pixel breit, wie im PDF)
  function massstab(){
    var r = $('#kwRahmen'), breit = r.parentNode.clientWidth || SEITE_B, s = Math.min(1, breit / (SEITE_B + 2));
    r.style.setProperty('--massstab', s.toFixed(4));
    r.style.height = (SEITE_H * s + 2).toFixed(0) + 'px';
    $('#kwBlatt').style.marginLeft = Math.max(0, (breit - SEITE_B * s) / 2 - 1).toFixed(1) + 'px';   // Blatt mittig in der Spalte
  }
  var beobachter = window.ResizeObserver ? new ResizeObserver(function(){ massstab(); }) : null;
  if (beobachter) beobachter.observe($('.kw-ausgabe')); else window.addEventListener('resize', massstab);

  /* ---------- Bilder anfassen: verschieben, Grösse, drehen ----------
     Bild ziehen = verschieben, Ecke ziehen = Grösse (um die Mitte, Seitenverhältnis bleibt), runder Griff = drehen
     (rastet bei 0°, 90°, 180° ein; mit Umschalttaste in 15°-Schritten). Tastatur: Pfeiltasten verschieben (mit
     Umschalttaste weiter), Plus/Minus ändern die Grösse, Esc beendet. Das Lösungsblatt zeigt die Bilder am gleichen Ort. */
  var blatt = $('#kwBlatt');
  function seitenPunkt(e){ var r = blatt.getBoundingClientRect(), m = r.width / SEITE_B || 1; return { x:(e.clientX - r.left) / m, y:(e.clientY - r.top) / m }; }
  blatt.addEventListener('pointerdown', function(ev){
    if (ev.button > 0) return;
    var el = ev.target.closest('.kw-bild');
    if (!el){ if (gewaehlt >= 0) waehle(-1); return; }
    var i = +el.dataset.i, b = bilder[i];
    if (!b) return;
    ev.preventDefault();
    if (gewaehlt !== i) waehle(i);
    try { el.focus({ preventScroll:true }); } catch(x){}
    var griff = ev.target.getAttribute('data-griff') || 'zieh', s = Object.assign({}, b.lage || b.auto), p0 = seitenPunkt(ev);
    var d0 = Math.max(4, Math.hypot(p0.x - s.x, p0.y - s.y)), bewegt = false;
    try { el.setPointerCapture(ev.pointerId); } catch(x){}
    el.classList.add('aktiv');
    function zug(e){
      var p = seitenPunkt(e);
      if (!bewegt && Math.hypot(p.x - p0.x, p.y - p0.y) < 2) return;   // nur angeklickt
      bewegt = true;
      var l = lageVon(b);
      if (griff === 'zieh'){ l.x = klemm(s.x + p.x - p0.x, 0, SEITE_B); l.y = klemm(s.y + p.y - p0.y, 0, SEITE_H); }
      else if (griff === 'gross') l.w = breiteKlemm(b, s.w * Math.hypot(p.x - s.x, p.y - s.y) / d0);
      else l.d = winkelRund(Math.atan2(p.y - s.y, p.x - s.x) * 180 / Math.PI + 90, e.shiftKey);
      anwenden(i);
    }
    function ende(){
      el.removeEventListener('pointermove', zug); el.removeEventListener('pointerup', ende); el.removeEventListener('pointercancel', ende);
      el.classList.remove('aktiv');
      if (bewegt) meldungen();
    }
    el.addEventListener('pointermove', zug); el.addEventListener('pointerup', ende); el.addEventListener('pointercancel', ende);
  });
  blatt.addEventListener('focusin', function(ev){ var el = ev.target.closest('.kw-bild'); if (el && +el.dataset.i !== gewaehlt) waehle(+el.dataset.i); });
  blatt.addEventListener('keydown', function(ev){
    var el = ev.target.closest && ev.target.closest('.kw-bild'), i = el ? +el.dataset.i : -1, b = bilder[i];
    if (!b) return;
    if (ev.key === 'Escape'){ waehle(-1); el.blur(); return; }
    var weit = ev.shiftKey ? 10 : 2, dx = 0, dy = 0, k = 1;
    if (ev.key === 'ArrowLeft') dx = -weit; else if (ev.key === 'ArrowRight') dx = weit;
    else if (ev.key === 'ArrowUp') dy = -weit; else if (ev.key === 'ArrowDown') dy = weit;
    else if (ev.key === '+' || ev.key === '=') k = 1.05; else if (ev.key === '-' || ev.key === '_') k = 1 / 1.05;
    else return;
    ev.preventDefault();
    var l = lageVon(b);
    l.x = klemm(l.x + dx, 0, SEITE_B); l.y = klemm(l.y + dy, 0, SEITE_H); l.w = breiteKlemm(b, l.w * k);
    anwenden(i); meldungenBald();
  });
  // ausserhalb von Blatt und Bildleiste klicken: Auswahl aufheben
  function aussen(ev){ if (gewaehlt >= 0 && !blatt.contains(ev.target) && !$('#kwBildLeiste').contains(ev.target)) waehle(-1); }
  document.addEventListener('pointerdown', aussen);
  $('#kwBildGroesse').addEventListener('input', function(){
    var b = bilder[gewaehlt]; if (!b) return;
    var l = lageVon(b), ar = b.b / b.h, L = +this.value;
    l.w = breiteKlemm(b, ar >= 1 ? L : L * ar); anwenden(gewaehlt); meldungenBald();
  });
  $('#kwBildDreh').addEventListener('input', function(){
    var b = bilder[gewaehlt]; if (!b) return;
    lageVon(b).d = +this.value; anwenden(gewaehlt); meldungenBald();
  });
  $('#kwBildGerade').addEventListener('click', function(){ var b = bilder[gewaehlt]; if (!b) return; lageVon(b).d = 0; anwenden(gewaehlt); meldungen(); });
  $('#kwBildWeg').addEventListener('click', function(){ entfernen(gewaehlt); });
  $('#kwBildFertig').addEventListener('click', function(){ waehle(-1); });
  $('#kwBilderAuto').addEventListener('click', function(){ bilder.forEach(function(b){ b.lage = null; b.z = 0; }); oben = 0; waehle(-1); seiten(); });

  /* ---------- Werkzeuge, PDF ---------- */
  $('#kwNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erzeugen(); });
  $('#kwZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#kwBlatt').classList.toggle('zeige-loesung', an);
  });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#kwPdf'), function(){ return raetsel && { blaetter:[$('#kwBlatt'), st.opt.mitLoesung && $('#kwLoesung')], name:Labor.pdfName('Kreuzwortraetsel', st.titel) }; }, fehler);
  Labor.bildKnopf($('#kwBild'), function(){ return raetsel && { blatt:$('#kwBlatt'), name:Labor.pdfName('Kreuzwortraetsel', st.titel).replace(/\.pdf$/, '.png') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#kwPdf').hidden = $('#kwBild').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#kwHerunterladen').hidden = false; }); }
  $('#kwHerunterladen').addEventListener('click', function(){
    if (!raetsel || !speicherOrt) return;
    var bl = [$('#kwBlatt')].concat(st.opt.mitLoesung ? [$('#kwLoesung')] : []);
    var inhalt = bl.map(function(b, i){
      var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeige-loesung'); if (i) k.classList.add('neue-seite');
      [].forEach.call(k.querySelectorAll('.nur-bildschirm'), function(x){ x.remove(); });   // Griffe der Bilder
      [].forEach.call(k.querySelectorAll('.kw-bild'), function(x){ x.classList.remove('gewaehlt', 'aktiv'); ['tabindex', 'role', 'aria-label'].forEach(function(a){ x.removeAttribute(a); }); });
      return k.outerHTML;
    }).join('');
    speicherOrt.save({ filename:Labor.pdfName('Kreuzwortraetsel', st.titel).replace(/\.pdf$/, '.html'), data:Labor.blattDatei('Kreuzworträtsel', inhalt, '.kw-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  erzeugen();
  // mit geladener Schrift neu messen (die Hinweise werden dann etwas anders breit)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus) seiten(); });
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); clearTimeout(meldungZeit); document.removeEventListener('pointerdown', aussen); if (beobachter) beobachter.disconnect(); else window.removeEventListener('resize', massstab);
    window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
