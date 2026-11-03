/* Rätsellabor – Menü, Startseite und Wechsel zwischen den Rätselgeneratoren.

   Jeder Generator liegt in einem eigenen Ordner unter raetsel/ und meldet sich mit Labor.registriere() an:
     Labor.registriere({
       id: 'zahlen-suchsel',            // erscheint in der Adresse: …#zahlen-suchsel
       titel: 'Zahlen-Suchsel',
       kurz: 'ein Satz für das Menü',
       beschreibung: 'zwei, drei Sätze für die Startseite',
       merkmale: ['…', '…'],             // kleine Stichworte auf der Startseite
       symbol: '<svg …>',               // Symbol (zeichnet mit currentColor)
       css: 'raetsel/…/….css',          // eigenes Stylesheet, nur aktiv, solange der Generator offen ist
       html: '…',                       // Oberfläche des Generators
       start: function(bereich){ …; return function stopp(){ … }; }
     });
   Danach erscheint er automatisch im Menü und auf der Startseite.

   Für jedes Arbeitsblatt gilt: Titel und Arbeitsanweisung lassen sich an- und abwählen (Labor.blattSchalterHtml/
   Labor.blattSchalter in der Werkzeugleiste), und Eingabefelder enthalten keine Beispieltexte (kein placeholder).

   Grundsatz für alle Generatoren: Beim Neuladen der Seite beginnt alles frisch. Eingaben dürfen in sessionStorage
   oder localStorage liegen (z. B. damit sie beim Wechsel zu einem anderen Generator und zurück erhalten bleiben),
   aber start() löscht beim Laden der Seite alles. Damit nach einer neuen Version sicher die neuen Dateien kommen,
   schickt der Server Seite, Skripte und Stile mit «Cache-Control: no-cache» (.htaccess), und beim Hochladen
   bekommen Skripte und Stile eine Versionsnummer (?v=…, siehe .github/workflows/infomaniak.yml). */
var Labor = (function(){
  'use strict';
  var liste = [], aktiv = null, css = {}, $ = function(s){ return document.querySelector(s); };
  // Versionsnummer, die beim Hochladen an labor.js gehängt wird (…/labor.js?v=1a2b3c4d) – gilt auch für die Stile der Generatoren
  var VERSION = (function(){ try { var m = /[?&]v=([\w-]+)/.exec(document.currentScript.src); return m ? m[1] : ''; } catch(e){ return ''; } })();

  function registriere(r){ liste.push(r); }
  function finde(id){ for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; }
  function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }

  /* ---------- Menü ---------- */
  var knopf, menue;
  function baueMenue(){
    var html = '<div class="menue-gruppe"><p class="menue-titel">Übersicht</p><ul class="menue-liste">' +
      '<li><a class="menue-link" href="#start" data-ziel=""><span class="sym" aria-hidden="true">' + HAUS + '</span>' +
      '<span><b>Startseite</b><small>Was das Rätsellabor kann</small></span></a></li></ul></div>' +
      '<div class="menue-gruppe"><p class="menue-titel">Rätselgeneratoren</p><ul class="menue-liste">';
    liste.forEach(function(r){
      html += '<li><a class="menue-link" href="#' + r.id + '" data-ziel="' + r.id + '"><span class="sym" aria-hidden="true">' + r.symbol + '</span>' +
        '<span><b>' + esc(r.titel) + '</b><small>' + esc(r.kurz) + '</small></span></a></li>';
    });
    html += '</ul><p class="menue-bald">Weitere Generatoren folgen.</p></div>';
    menue.innerHTML = html;
  }
  function menueAuf(){
    menue.hidden = false; knopf.setAttribute('aria-expanded', 'true');
    var a = menue.querySelector('[aria-current="page"]') || menue.querySelector('a');
    if (a) a.focus();
  }
  function menueZu(fokus){
    if (menue.hidden) return;
    menue.hidden = true; knopf.setAttribute('aria-expanded', 'false');
    if (fokus) knopf.focus();
  }

  /* ---------- Startseite ---------- */
  function baueStartseite(){
    var karten = '';
    liste.forEach(function(r){
      karten += '<a class="raetsel-karte" href="#' + r.id + '"><span class="sym" aria-hidden="true">' + r.symbol + '</span>' +
        '<h3>' + esc(r.titel) + '</h3><p>' + esc(r.beschreibung) + '</p>' +
        (r.merkmale && r.merkmale.length ? '<ul class="merkmale">' + r.merkmale.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '') +
        '<span class="oeffnen">Öffnen →</span></a>';
    });
    karten += '<div class="raetsel-karte bald"><span class="sym" aria-hidden="true">' + PLUS + '</span><h3>Weitere Generatoren</h3>' +
      '<p>Neue Rätselarten kommen Schritt für Schritt dazu. Sie erscheinen dann hier und im Menü.</p></div>';
    $('#raetselKarten').innerHTML = karten;
  }
  /* ---------- Wechsel zwischen Startseite und Generatoren ---------- */
  function ladeCss(r, fertig){
    if (!r.css){ fertig(); return; }
    var l = css[r.id];
    if (l){ l.disabled = false; fertig(); return; }
    l = css[r.id] = document.createElement('link');
    l.rel = 'stylesheet'; l.href = r.css + (VERSION ? (r.css.indexOf('?') < 0 ? '?' : '&') + 'v=' + VERSION : '');
    var einmal = false; function los(){ if (!einmal){ einmal = true; fertig(); } }
    l.onload = los; l.onerror = los; setTimeout(los, 3000);
    document.head.appendChild(l);
  }
  function markiere(id){
    [].forEach.call(menue.querySelectorAll('.menue-link'), function(a){
      if (a.getAttribute('data-ziel') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function schliesseAktiv(){
    if (!aktiv) return;
    try { if (typeof aktiv.stopp === 'function') aktiv.stopp(); } catch(e){ console.error(e); }
    if (css[aktiv.r.id]) css[aktiv.r.id].disabled = true;
    $('#raetselBereich').innerHTML = '';
    aktiv = null;
  }
  function route(){
    var id = (location.hash || '').replace(/^#/, ''), r = finde(id), bereich = $('#raetselBereich');
    menueZu(false);
    if (aktiv && aktiv.r === r) return;
    schliesseAktiv();
    if (!r){
      bereich.hidden = true; $('#startseite').hidden = false; $('#kopfPfad').hidden = true;
      document.title = 'Rätsellabor'; markiere(''); window.scrollTo(0, 0);
      return;
    }
    $('#startseite').hidden = true; $('#kopfPfad').hidden = false; $('#kopfPfad span').textContent = r.titel;
    document.title = r.titel + ' – Rätsellabor'; markiere(r.id);
    ladeCss(r, function(){
      if ((location.hash || '').replace(/^#/, '') !== r.id || aktiv) return;   // inzwischen weitergeklickt
      bereich.innerHTML = r.html; bereich.hidden = false; window.scrollTo(0, 0);
      aktiv = { r:r, stopp:null };
      try { aktiv.stopp = r.start(bereich); } catch(e){ console.error(e); }
      var h = bereich.querySelector('h1');
      if (h){ h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll:true }); } catch(e){} }
    });
  }

  // Neu laden = frisch anfangen: gespeicherte Eingaben und Einstellungen aller Generatoren löschen
  function frischStarten(){
    try { sessionStorage.clear(); } catch(e){}
    try { localStorage.clear(); } catch(e){}
  }

  /* ---------- Neue Version auf dem Server? ----------
     Das Labor wechselt zwischen den Generatoren, ohne die Seite neu zu laden. Ist sie schon länger offen und gibt es
     inzwischen eine neue Version, liefe sonst das alte Skript (mit neuen Stilen). Beim Hochladen schreibt der Workflow
     die Versionsnummer in version.txt; das Labor fragt sie ab, wenn man zur Seite zurückkehrt und alle 10 Minuten.
     Ist sie neu, lädt der nächste Wechsel zu einem Generator die Seite neu, und ein Hinweis bietet «Neu laden» an. */
  var neueVersion = false;
  function versionPruefen(){
    if (!VERSION || neueVersion || !window.fetch || document.hidden) return;
    fetch('version.txt?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.text() : ''; }).then(function(t){
      t = String(t || '').trim();
      if (!/^[\w-]{4,40}$/.test(t) || t === VERSION) return;
      neueVersion = true;
      var h = document.createElement('div');
      h.className = 'labor-neu'; h.setAttribute('role', 'status');
      h.innerHTML = '<span>Es gibt eine neue Version des Rätsellabors.</span><button type="button" class="btn klein primary">Neu laden</button>';
      h.querySelector('button').addEventListener('click', function(){ location.reload(); });
      document.body.appendChild(h);
    }).catch(function(){});
  }
  function wechsel(){ if (neueVersion) location.reload(); else route(); }

  function start(){
    frischStarten();
    knopf = $('#menueKnopf'); menue = $('#menue');
    baueMenue(); baueStartseite();
    knopf.addEventListener('click', function(e){ e.stopPropagation(); if (menue.hidden) menueAuf(); else menueZu(true); });
    document.addEventListener('click', function(e){ if (!menue.hidden && !menue.contains(e.target) && !knopf.contains(e.target)) menueZu(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !menue.hidden) menueZu(true); });
    menue.addEventListener('click', function(e){ var a = e.target.closest('a'); if (a && a.getAttribute('href') === location.hash) menueZu(true); });
    window.addEventListener('hashchange', wechsel);
    document.addEventListener('visibilitychange', versionPruefen);
    setInterval(versionPruefen, 10 * 60 * 1000);
    route();
  }

  var HAUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>';
  var PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  /* ---------- Helfer für alle Generatoren ---------- */
  // Läuft die Seite als Claude-Artefakt? Dort gibt es kein Drucken, dafür Download und Claude.
  function imArtefakt(){ return !!(window.claude && typeof window.claude.use === 'function'); }
  var faehig = {};
  function claude(name){
    if (!imArtefakt()) return Promise.resolve(null);
    if (!faehig[name]) faehig[name] = Promise.resolve(window.claude.use(name)).catch(function(){ return null; });
    return faehig[name];
  }
  // Alle aktiven Stilregeln der Seite (für eine gespeicherte Datei)
  function sammleCss(){
    return [].map.call(document.styleSheets, function(s){
      if (s.disabled) return '';
      try { return [].map.call(s.cssRules, function(r){ return r.cssText; }).join('\n'); } catch(e){ return ''; }
    }).join('\n');
  }
  // Ein Arbeitsblatt als eigenständige HTML-Datei, die man öffnet und druckt
  function blattDatei(titel, inhalt, extraCss){
    var css = sammleCss() + '\n' + (extraCss || '') +
      '\nbody{display:block;background:#F8F5F1}body::before{display:none}.seite{max-width:960px;margin:0 auto;padding:18px;display:grid;gap:22px}' +
      '.leiste{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:#6E655E;font-size:.9rem}' +
      '@media print{.leiste{display:none}.seite{max-width:none;padding:0;display:block}.neue-seite{break-before:page}}';
    return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(titel) + '</title>\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@500;600&family=Inter:wght@400;500;600;700&display=swap">\n' +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="seite">\n' +
      '<div class="leiste"><button class="btn primary" onclick="window.print()">Drucken</button><span>Tipp: Im Druckdialog «Hintergrundgrafiken» einschalten, damit Farben mitgedruckt werden.</span></div>\n' +
      inhalt + '\n</div>\n</body>\n</html>\n';
  }
  /* Schalter «Titel» und «Arbeitsanweisung» für die Werkzeugleiste über dem Blatt – in jedem Generator gleich.
     blattSchalterHtml() kommt in die Werkzeugleiste, blattSchalter() verbindet die Häkchen mit opt.titelAn und
     opt.anleitungAn (Standard: beide an) und ruft nachher() auf, damit der Generator das Blatt neu zeichnet. */
  function blattSchalterHtml(){
    return '<label class="blatt-schalter"><input type="checkbox" data-blatt="titelAn"> Titel</label>' +
      '<label class="blatt-schalter"><input type="checkbox" data-blatt="anleitungAn"> Arbeitsanweisung</label>';
  }
  function blattSchalter(bereich, opt, nachher){
    [].forEach.call(bereich.querySelectorAll('input[data-blatt]'), function(c){
      var k = c.getAttribute('data-blatt');
      if (typeof opt[k] !== 'boolean') opt[k] = true;
      c.checked = opt[k];
      c.addEventListener('change', function(){ opt[k] = c.checked; if (nachher) nachher(); });
    });
  }
  // Dateinamen-tauglicher Text
  function dateiname(t){ return String(t || '').trim().replace(/[^\p{L}\p{N} _-]+/gu, '').replace(/\s+/g, '-').slice(0, 40); }

  /* ---------- Arbeitsblätter als PDF herunterladen (für alle Generatoren) ----------
     Jedes übergebene Blatt (z. B. Arbeitsblatt und Lösungsblatt) wird zu einer A4-Seite. html2canvas zeichnet das Blatt
     in einer Kopie der Seite, in der die Druckregeln (@media print) der Generatoren gelten – so sieht das PDF aus wie
     der Ausdruck. Grafiken (SVG) bekommen ihre Stile und Schriften eingebettet, weil html2canvas sie als Bild zeichnet.
     Bibliotheken (MIT-Lizenz, gemeinsam/extern/): html2canvas 1.4.1, jsPDF 2.5.2 – erst beim ersten Download geladen. */
  var skripte = {};
  function ladeSkript(src){
    if (!skripte[src]) skripte[src] = new Promise(function(ok, fehler){
      var s = document.createElement('script');
      s.src = src + (VERSION ? '?v=' + VERSION : '');
      s.onload = function(){ ok(); };
      s.onerror = function(){ delete skripte[src]; fehler(new Error('Die PDF-Bausteine konnten nicht geladen werden')); };
      document.head.appendChild(s);
    });
    return skripte[src];
  }
  // Webschriften als data:-Adressen (für Text in SVG-Grafiken), einmal pro Seitenaufruf geholt
  var schriften = null;
  function schriftBloecke(){
    if (schriften) return schriften;
    var link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
    if (!link || !window.fetch || !window.FileReader) return (schriften = Promise.resolve([]));
    var dateien = {};
    function alsDaten(url){
      if (!dateien[url]) dateien[url] = fetch(url).then(function(r){ if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function(b){
        return new Promise(function(ok){ var f = new FileReader(); f.onload = function(){ ok(f.result); }; f.onerror = function(){ ok(''); }; f.readAsDataURL(b); });
      }).catch(function(){ return ''; });
      return dateien[url];
    }
    schriften = fetch(link.href).then(function(r){ return r.text(); }).then(function(css){
      var bloecke = [];
      css.replace(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g, function(_, teil, block){
        if (teil !== 'latin' && teil !== 'latin-ext') return;
        var fam = /font-family:\s*'?([^';]+)'?;/.exec(block), url = /url\((https:[^)]+)\)/.exec(block);
        if (fam && url) bloecke.push({ familie:fam[1].trim().toLowerCase(), css:block, url:url[1] });
      });
      return bloecke;
    }).catch(function(){ return []; });
    schriften.alsDaten = alsDaten;
    return schriften;
  }
  function schriftCssFuer(familien){
    if (!familien.length) return Promise.resolve('');
    var p = schriftBloecke();
    return p.then(function(bloecke){
      var passend = bloecke.filter(function(b){ return familien.indexOf(b.familie) >= 0; });
      return Promise.all(passend.map(function(b){ return p.alsDaten(b.url).then(function(d){ return d ? b.css.replace(b.url, d) : ''; }); }));
    }).then(function(t){ return t.join('\n'); }).catch(function(){ return ''; });
  }
  var SVG_STILE = ['display', 'visibility', 'opacity', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap',
    'stroke-linejoin', 'stroke-dasharray', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'paint-order'];
  // In der Kopie: Druckregeln einschalten, Bildschirm-Zustände entfernen, SVG-Stile und -Schriften einbetten.
  // html2canvas schreibt beim Kopieren die Bildschirm-Stile in jedes SVG-Element; die werden zuerst durch die
  // ursprünglichen Stil-Attribute ersetzt, damit die Druckregeln greifen.
  function druckKopie(doc, blatt, original, ausgeschaltet){
    var svgKopie = blatt.querySelectorAll('svg, svg *'), svgOriginal = original.querySelectorAll('svg, svg *');
    if (svgKopie.length === svgOriginal.length) [].forEach.call(svgKopie, function(el, i){
      el.setAttribute('style', (svgOriginal[i].getAttribute('style') || '') + ';transition:none');
    });
    var keineUebergaenge = doc.createElement('style');   // Ein- und Ausblenden sofort fertig, nicht mitten im Übergang zeichnen
    keineUebergaenge.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
    doc.head.appendChild(keineUebergaenge);
    [].slice.call(doc.querySelectorAll('link[rel="stylesheet"]')).forEach(function(l){ if (ausgeschaltet.indexOf(l.href) >= 0) l.remove(); });
    [].forEach.call(doc.styleSheets, function(sh){
      var regeln; try { regeln = sh.cssRules; } catch(e){ return; }
      if (!regeln) return;
      var neu = [];
      [].forEach.call(regeln, function(r){ if (r.media && /\bprint\b/.test(r.media.mediaText)) [].forEach.call(r.cssRules, function(x){ if (x.type === 1) neu.push(x.cssText); }); });
      neu.forEach(function(t){ try { sh.insertRule(t, sh.cssRules.length); } catch(e){} });
    });
    doc.body.classList.add('mit-loesung');
    [blatt].concat([].slice.call(blatt.querySelectorAll('.zeige-loesung, .geschafft, .veraltet'))).forEach(function(e){ e.classList.remove('zeige-loesung', 'geschafft', 'veraltet'); });
    blatt.removeAttribute('hidden');
    var arbeit = [].map.call(blatt.querySelectorAll('svg'), function(svg){
      var familien = [];
      [svg].concat([].slice.call(svg.querySelectorAll('*'))).forEach(function(el){
        var cs = doc.defaultView.getComputedStyle(el), st = [];
        SVG_STILE.forEach(function(k){ var v = cs.getPropertyValue(k); if (v) st.push(k + ':' + v); });
        el.setAttribute('style', st.join(';'));
        if (/^(text|tspan)$/i.test(el.tagName)){ var f = cs.getPropertyValue('font-family').split(',')[0].replace(/["']/g, '').trim().toLowerCase(); if (familien.indexOf(f) < 0) familien.push(f); }
      });
      return schriftCssFuer(familien).then(function(css){
        if (!css) return;
        var stil = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
        stil.textContent = css;
        svg.insertBefore(stil, svg.firstChild);
      });
    });
    return Promise.all(arbeit);
  }
  function pdfHerunterladen(blaetter, dateiname){
    blaetter = blaetter.filter(Boolean);
    if (!blaetter.length) return Promise.resolve();
    var ausgeschaltet = [].filter.call(document.styleSheets, function(s){ return s.disabled && s.href; }).map(function(s){ return s.href; });
    var BREITE = 703;   // 186 mm bei 96 dpi: A4 mit 12 mm Rand
    return Promise.all([ladeSkript('gemeinsam/extern/html2canvas.min.js'), ladeSkript('gemeinsam/extern/jspdf.umd.min.js')]).then(function(){
      var pdf = new window.jspdf.jsPDF({ unit:'mm', format:'a4', orientation:'portrait', compress:true });
      var kette = Promise.resolve();
      blaetter.forEach(function(blatt, i){
        kette = kette.then(function(){
          return window.html2canvas(blatt, { scale:3, backgroundColor:'#ffffff', logging:false, useCORS:true, windowWidth:BREITE, scrollX:0, scrollY:0,
            onclone:function(doc, kopie){ return druckKopie(doc, kopie, blatt, ausgeschaltet); } });
        }).then(function(cv){
          if (i) pdf.addPage();
          var w = 186, h = cv.height * w / cv.width;
          if (h > 273){ h = 273; w = cv.width * h / cv.height; }
          pdf.addImage(cv, 'PNG', (210 - w) / 2, 12, w, h, undefined, 'FAST');
        });
      });
      return kette.then(function(){ pdf.save(dateiname || 'Arbeitsblatt.pdf'); });
    });
  }
  // Knopf «PDF herunterladen»: auftrag() liefert { blaetter:[…], name:'….pdf' }; fehler(text) zeigt eine Meldung
  function pdfKnopf(knopf, auftrag, fehler){
    if (!knopf) return;
    knopf.addEventListener('click', function(){
      if (knopf.disabled) return;
      var a = auftrag(); if (!a || !a.blaetter || !a.blaetter.filter(Boolean).length) return;
      var text = knopf.textContent; knopf.disabled = true; knopf.textContent = 'PDF wird erstellt …';
      pdfHerunterladen(a.blaetter, a.name).catch(function(e){
        if (window.console) console.error(e);
        var t = 'Das PDF konnte nicht erstellt werden' + (e && e.message ? ' (' + e.message + ')' : '') + '. Bitte versuche es noch einmal.';
        if (fehler) fehler(t); else alert(t);
      }).then(function(){ knopf.disabled = false; knopf.textContent = text; });
    });
  }
  // Dateiname für ein PDF: «Labyrinth» + Titel → Labyrinth-Titel.pdf
  function pdfName(art, titel){ var t = dateiname(titel); return art + (t ? '-' + t : '') + '.pdf'; }

  return { registriere:registriere, start:start, imArtefakt:imArtefakt, claude:claude, sammleCss:sammleCss, blattDatei:blattDatei, dateiname:dateiname, esc:esc,
    blattSchalterHtml:blattSchalterHtml, blattSchalter:blattSchalter, pdfHerunterladen:pdfHerunterladen, pdfKnopf:pdfKnopf, pdfName:pdfName };
})();
