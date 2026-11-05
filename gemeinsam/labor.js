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
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@500;600&family=Inter:wght@400;500;600;700&display=swap">\n' + schriftLinkHtml() +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="seite">\n' +
      '<div class="leiste"><button class="btn primary" onclick="window.print()">Drucken</button><span>Tipp: Im Druckdialog «Hintergrundgrafiken» einschalten, damit Farben mitgedruckt werden.</span></div>\n' +
      inhalt + '\n</div>\n</body>\n</html>\n';
  }
  /* Schalter «Titel» und «Arbeitsanweisung» für die Werkzeugleiste über dem Blatt – in jedem Generator gleich.
     blattSchalterHtml() kommt in die Werkzeugleiste, blattSchalter() verbindet die Häkchen mit opt.titelAn und
     opt.anleitungAn (Standard: beide an) und ruft nachher() auf, damit der Generator das Blatt neu zeichnet. */
  function blattSchalterHtml(){
    return schriftWahlHtml() + '<label class="blatt-schalter"><input type="checkbox" data-blatt="titelAn"> Titel</label>' +
      '<label class="blatt-schalter"><input type="checkbox" data-blatt="anleitungAn"> Arbeitsanweisung</label>';
  }
  function blattSchalter(bereich, opt, nachher){
    schriftNachher = nachher; schriftBereich = bereich;
    [].forEach.call(bereich.querySelectorAll('.schrift-wahl'), schriftFeld);
    [].forEach.call(bereich.querySelectorAll('input[data-blatt]'), function(c){
      var k = c.getAttribute('data-blatt');
      if (typeof opt[k] !== 'boolean') opt[k] = true;
      c.checked = opt[k];
      c.addEventListener('change', function(){ opt[k] = c.checked; if (nachher) nachher(); });
    });
  }
  /* ---------- Schrift der Arbeitsblätter (in allen Generatoren gleich) ----------
     Die Wahl gilt für alle Generatoren und bleibt gespeichert. Sie setzt drei CSS-Variablen, die die Blätter verwenden:
     --blatt-schrift (Text, Standard Inter), --blatt-buchstaben (Rätselbuchstaben, Standard Andika), --blatt-display
     (Zierschrift, Standard Fredoka). Schriften kommen von Google Fonts und werden erst geladen, wenn man sie braucht.
     Im Suchfeld kann man auch eine beliebige andere Schrift von Google Fonts eintippen.
     Ausnahme: die Deutschschweizer Basisschrift (DCH-Basisschrift, unverbunden). Sie ist urheberrechtlich geschützt –
     Lehrpersonen dürfen sie gratis für Unterrichtsdokumente nutzen, verbreitet werden darf sie nur mit schriftlicher
     Zustimmung (Dienststelle Volksschulbildung Kanton Luzern). Darum liegt die Schriftdatei nicht auf dem Server: Ist sie
     auf dem Computer installiert, kommt sie von dort (@font-face mit local() in labor.css). Sonst wählt man die Datei
     einmal aus; sie wird nur in diesem Browser gespeichert. */
  var BASIS = 'DCH Basisschrift', BASIS_DATEI = 'DCH Basisschrift Datei', BASIS_SPEICHER = 'labor-basisschrift-datei';
  var SCHRIFTEN = [
    { id:'standard', name:'Standard', info:'Inter, Rätselbuchstaben in Andika' },
    { id:'basisschrift', name:'Basisschrift', info:'Deutschschweizer Basisschrift, unverbunden (DCH-Basisschrift vom Computer)', familie:BASIS, lokal:true,
      stapel:"'" + BASIS + "','" + BASIS_DATEI + "',Andika,system-ui,sans-serif" },
    { id:'grundschrift', name:'Grundschrift', info:'aufrechte Schulschrift, unverbunden', familie:'Playwrite DE Grund', gf:'Playwrite+DE+Grund:wght@100..400' },
    { id:'andika', name:'Andika', info:'klar unterscheidbare Buchstaben, für Leseanfänger', familie:'Andika', gf:'Andika:wght@400;700' },
    { id:'atkinson', name:'Atkinson Hyperlegible', info:'besonders gut lesbar, auch bei Sehschwäche', familie:'Atkinson Hyperlegible', gf:'Atkinson+Hyperlegible:wght@400;700' },
    { id:'lexend', name:'Lexend', info:'ruhig und leicht zu lesen', familie:'Lexend', gf:'Lexend:wght@400;600;700' },
    { id:'nunito', name:'Nunito', info:'rund und freundlich', familie:'Nunito', gf:'Nunito:wght@400;600;700' },
    { id:'fredoka', name:'Fredoka', info:'rund und kräftig, für Titel', familie:'Fredoka', gf:'Fredoka:wght@400;500;600;700' },
    { id:'comic', name:'Comic Neue', info:'verspielt, wie gezeichnet', familie:'Comic Neue', gf:'Comic+Neue:wght@400;700' },
    { id:'patrick', name:'Patrick Hand', info:'wie von Hand geschrieben', familie:'Patrick Hand', gf:'Patrick+Hand' },
    { id:'merriweather', name:'Merriweather', info:'mit Serifen, wie in einem Buch', familie:'Merriweather', gf:'Merriweather:wght@400;700' }
  ];
  var SCHRIFT_SPEICHER = 'labor-schrift';
  var schriftGewaehlt = (function(){ try { return JSON.parse(localStorage.getItem(SCHRIFT_SPEICHER)) || null; } catch(e){ return null; } })();
  var schriftNachher = null, schriftBereich = null, schriftZaehler = 0;
  function gfName(f){ return encodeURIComponent(f.trim()).replace(/%20/g, '+'); }
  function schriftStapel(f){ return "'" + String(f).replace(/['"\\;{}<>]/g, '') + "',Andika,system-ui,sans-serif"; }
  function stapelVon(s){ return s.stapel || schriftStapel(s.familie); }
  function googleSchrift(f){ return { id:'google', name:f, info:'von Google Fonts', familie:f, gf:gfName(f) }; }
  function aktuelleSchrift(){
    var g = schriftGewaehlt;
    if (g && g.id === 'google' && g.familie) return googleSchrift(g.familie);
    return (g && SCHRIFTEN.filter(function(s){ return s.id === g.id; })[0]) || SCHRIFTEN[0];
  }
  var schriftLinks = {};
  function schriftLink(s){
    if (!s.gf) return Promise.resolve();
    var href = 'https://fonts.googleapis.com/css2?family=' + s.gf + '&display=swap';
    if (!schriftLinks[href]) schriftLinks[href] = new Promise(function(ok, fehler){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-blatt-schrift', s.familie);
      l.onload = function(){ ok(); };
      l.onerror = function(){ l.remove(); delete schriftLinks[href]; fehler(new Error('Schrift nicht gefunden')); };
      document.head.appendChild(l);
    });
    return schriftLinks[href];
  }
  // Basisschrift aus einer selbst gewählten Datei (im Browser gespeichert) → Promise<true|false>
  var basisDatei = null;
  function basisDateiLaden(daten){
    if (!daten){ try { daten = localStorage.getItem(BASIS_SPEICHER); } catch(e){} }
    if (!daten || !window.FontFace || !document.fonts) return Promise.resolve(false);
    if (basisDatei && basisDatei.daten === daten) return basisDatei.p;
    var bytes; try { bytes = Uint8Array.from(atob(daten), function(c){ return c.charCodeAt(0); }); } catch(e){ return Promise.resolve(false); }
    var ff = new FontFace(BASIS_DATEI, bytes.buffer);
    basisDatei = { daten:daten, p:ff.load().then(function(f){ document.fonts.add(f); return true; }, function(){ return false; }) };
    return basisDatei.p;
  }
  function basisInstalliert(){
    if (!document.fonts || !document.fonts.load) return Promise.resolve(false);
    return document.fonts.load("20px '" + BASIS + "'").then(function(r){ return !!(r && r.length && r[0].status === 'loaded'); }, function(){ return false; });
  }
  function basisFehlt(){ var e = new Error('Die Basisschrift ist auf diesem Computer nicht installiert'); e.code = 'basisFehlt'; return e; }
  function schriftLaden(s){
    if (s.lokal) return basisInstalliert().then(function(da){ return da || basisDateiLaden(); }).then(function(ok){ if (!ok) throw basisFehlt(); });
    return schriftLink(s).then(function(){
      if (!s.familie || !document.fonts || !document.fonts.load) return;
      var f = "'" + s.familie + "'";
      return Promise.all([document.fonts.load('400 20px ' + f), document.fonts.load('700 20px ' + f)]).then(function(r){ if (!r[0].length && !r[1].length) throw new Error('Schrift nicht gefunden'); });
    });
  }
  function schriftSetzen(s){
    var r = document.documentElement.style;
    ['--blatt-schrift', '--blatt-buchstaben', '--blatt-display'].forEach(function(k){ if (s.familie) r.setProperty(k, stapelVon(s)); else r.removeProperty(k); });
  }
  // Schrift für Messungen in Zeichenflächen (z. B. Canvas): 'buchstaben' (Standard Andika) oder 'text' (Standard Inter)
  function blattSchrift(art){ var s = aktuelleSchrift(); return s.familie ? stapelVon(s) : art === 'text' ? "'Inter',system-ui,sans-serif" : "'Andika',Arial,sans-serif"; }
  function schriftNeuZeichnen(){
    [].forEach.call(document.querySelectorAll('.schrift-feld'), schriftAnzeigen);
    if (schriftNachher && schriftBereich && schriftBereich.isConnected) { try { schriftNachher(); } catch(e){} }
  }
  function schriftWaehlen(s){
    return schriftLaden(s).then(function(){
      schriftGewaehlt = s.id === 'google' ? { id:'google', familie:s.familie } : { id:s.id };
      try { localStorage.setItem(SCHRIFT_SPEICHER, JSON.stringify(schriftGewaehlt)); } catch(e){}
      schriftSetzen(s); schriftNeuZeichnen();
    });
  }
  // Beim Start: gewählte Schrift setzen und laden; danach das Blatt neu zeichnen (neu messen)
  (function(){
    var s = aktuelleSchrift(); schriftSetzen(s);
    // Fehlt die Schrift (z. B. Basisschrift auf einem anderen Computer), gilt hier Standard – gespeichert bleibt die Wahl
    if (s.gf || s.lokal) schriftLaden(s).then(schriftNeuZeichnen, function(){ schriftGewaehlt = null; schriftSetzen(SCHRIFTEN[0]); schriftNeuZeichnen(); });
  })();
  function schriftWahlHtml(){
    var id = 'schriftListe' + (++schriftZaehler);
    return '<span class="schrift-wahl" title="Schrift auf dem Blatt – gilt für alle Generatoren"><span class="schrift-aa" aria-hidden="true">Aa</span>' +
      '<input type="text" class="schrift-feld" role="combobox" aria-label="Schrift auf dem Blatt (suchen oder wählen)" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '" autocomplete="off" spellcheck="false">' +
      '<span class="schrift-pfeil" aria-hidden="true"></span><ul class="schrift-liste" id="' + id + '" role="listbox" aria-label="Schriften" hidden></ul>' +
      '<span class="schrift-meldung" role="status" aria-live="polite" hidden></span></span>';
  }
  function schriftAnzeigen(feld){
    if (feld === document.activeElement) return;
    var s = aktuelleSchrift();
    feld.value = s.name; feld.style.fontFamily = s.familie ? stapelVon(s) : '';
  }
  function suchText(t){ return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function grossAnfang(t){ return t.replace(/(^|\s)(\S)/g, function(_, a, b){ return a + b.toUpperCase(); }); }
  var vorschauGeladen = false;
  function schriftFeld(wrap){
    if (wrap.getAttribute('data-bereit')) return;
    wrap.setAttribute('data-bereit', '1');
    var feld = wrap.querySelector('.schrift-feld'), liste = wrap.querySelector('.schrift-liste'), meldung = wrap.querySelector('.schrift-meldung');
    var treffer = [], aktiv = -1, offen = false, getippt = false, meldungZeit = 0;
    schriftAnzeigen(feld);
    function melden(t){ meldung.textContent = t; meldung.hidden = false; clearTimeout(meldungZeit); meldungZeit = setTimeout(function(){ meldung.hidden = true; }, 4000); }
    // Basisschrift nicht installiert: Datei einmal auswählen (bleibt nur in diesem Browser)
    function basisAnbieten(text){
      clearTimeout(meldungZeit);
      meldung.innerHTML = '<span>' + esc(text || 'Die Deutschschweizer Basisschrift ist auf diesem Computer nicht installiert.') + ' Wähle die Schriftdatei <b>DCH-Basisschrift.ttf</b> oder <b>.otf</b> einmal aus – sie bleibt nur in diesem Browser. ' +
        'Oder installiere die Schrift auf dem Computer (gratis für Lehrpersonen).</span>' +
        '<span class="schrift-meldung-knoepfe"><label class="btn klein primary">Schriftdatei wählen …<input type="file" class="vh" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf"></label>' +
        '<button type="button" class="btn klein">Schliessen</button></span>';
      meldung.hidden = false;
      meldung.querySelector('button').addEventListener('click', function(){ meldung.hidden = true; });
      meldung.querySelector('input').addEventListener('change', function(){
        var datei = this.files && this.files[0]; if (!datei) return;
        var lesen = new FileReader();
        lesen.onload = function(){
          var b = new Uint8Array(lesen.result), t = '';
          for (var i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
          var daten = btoa(t);
          basisDateiLaden(daten).then(function(ok){
            if (!ok){ basisAnbieten('Diese Datei ist keine lesbare Schrift.'); return; }
            try { localStorage.setItem(BASIS_SPEICHER, daten); } catch(e){}
            meldung.hidden = true;
            schriftWaehlen(SCHRIFTEN.filter(function(x){ return x.lokal; })[0]).then(function(){ schriftAnzeigen(feld); });
          });
        };
        lesen.readAsArrayBuffer(datei);
      });
    }
    function bauen(){
      var q = getippt ? feld.value.trim() : '', n = suchText(q), akt = aktuelleSchrift();   // vor dem Tippen: alle Schriften
      treffer = SCHRIFTEN.filter(function(s){ return !n || suchText(s.name + ' ' + s.info + ' ' + (s.familie || '')).indexOf(n) >= 0; });
      var genau = SCHRIFTEN.some(function(s){ return suchText(s.name) === n || suchText(s.familie) === n; });
      if (n.length >= 3 && !genau){ var g = googleSchrift(q); g.suche = true; g.info = 'bei Google Fonts suchen und laden'; treffer.push(g); }
      if (aktiv >= treffer.length) aktiv = treffer.length - 1;
      liste.innerHTML = treffer.length ? treffer.map(function(s, i){
        var gewaehlt = s.id === akt.id && (s.id !== 'google' || s.familie === akt.familie);
        return '<li role="option" id="' + liste.id + '-' + i + '" data-i="' + i + '" aria-selected="' + (i === aktiv) + '"' + (gewaehlt ? ' class="gewaehlt"' : '') + '>' +
          '<b' + (s.familie && !s.suche ? ' style="font-family:' + esc(stapelVon(s)) + '"' : '') + '>' + esc(s.suche ? '«' + s.name + '»' : s.name) + '</b>' +
          '<small>' + esc(s.info) + '</small></li>';
      }).join('') : '<li class="leer">Keine passende Schrift</li>';
      feld.setAttribute('aria-activedescendant', aktiv >= 0 ? liste.id + '-' + aktiv : '');
      var a = liste.querySelector('[aria-selected="true"]'); if (a && a.scrollIntoView) a.scrollIntoView({ block:'nearest' });
    }
    function oeffnen(){
      if (!vorschauGeladen){ vorschauGeladen = true; SCHRIFTEN.forEach(function(s){ schriftLink(s).catch(function(){}); }); basisInstalliert().then(function(da){ if (!da) basisDateiLaden(); }); }
      offen = true; getippt = false; liste.hidden = false; feld.setAttribute('aria-expanded', 'true');
      var r = wrap.getBoundingClientRect(); wrap.classList.toggle('rechts', r.left + 300 > window.innerWidth);
      bauen();
    }
    function schliessen(){ offen = false; liste.hidden = true; aktiv = -1; feld.setAttribute('aria-expanded', 'false'); feld.removeAttribute('aria-activedescendant'); }
    function waehlen(s){
      if (!s) return;
      schliessen(); feld.blur();
      if (s.suche){ feld.value = 'Wird geladen …'; feld.style.fontFamily = ''; }
      var versuche = s.suche ? [s.familie, grossAnfang(s.familie)].filter(function(f, i, a){ return a.indexOf(f) === i; }) : [null];
      (function versuch(k){
        var x = versuche[k] === null ? s : googleSchrift(versuche[k]);
        schriftWaehlen(x).then(function(){ schriftAnzeigen(feld); }, function(e){
          if (e && e.code === 'basisFehlt'){ schriftAnzeigen(feld); basisAnbieten(); return; }
          if (k + 1 < versuche.length) return versuch(k + 1);
          schriftAnzeigen(feld); melden(s.suche ? '«' + s.familie + '» gibt es bei Google Fonts nicht. Schreibweise prüfen, z. B. «Open Sans».' : 'Die Schrift konnte nicht geladen werden. Bitte später nochmals versuchen.');
        });
      })(0);
    }
    feld.addEventListener('focus', function(){ feld.select(); oeffnen(); });
    feld.addEventListener('click', function(){ if (!offen) oeffnen(); });
    feld.addEventListener('input', function(){ if (!offen) oeffnen(); getippt = true; aktiv = 0; bauen(); });
    feld.addEventListener('keydown', function(e){
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault(); if (!offen){ oeffnen(); }
        aktiv = Math.max(0, Math.min(treffer.length - 1, aktiv + (e.key === 'ArrowDown' ? 1 : -1))); bauen();
      } else if (e.key === 'Enter'){
        e.preventDefault(); if (offen) waehlen(treffer[aktiv >= 0 ? aktiv : 0]);
      } else if (e.key === 'Escape'){
        if (offen){ e.preventDefault(); schliessen(); feld.blur(); schriftAnzeigen(feld); }
      }
    });
    feld.addEventListener('blur', function(){ setTimeout(function(){ if (document.activeElement !== feld){ schliessen(); schriftAnzeigen(feld); } }, 120); });
    liste.addEventListener('mousedown', function(e){ e.preventDefault(); });
    liste.addEventListener('click', function(e){ var li = e.target.closest('li[data-i]'); if (li) waehlen(treffer[+li.getAttribute('data-i')]); });
    wrap.querySelector('.schrift-pfeil').addEventListener('mousedown', function(e){ e.preventDefault(); if (offen){ schliessen(); feld.blur(); } else feld.focus(); });
  }
  // Link auf die gewählte Schrift (für gespeicherte Blätter)
  function schriftLinkHtml(){ var s = aktuelleSchrift(); return s.gf ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' + s.gf + '&display=swap">\n' : ''; }

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
  // Webschriften als data:-Adressen (für Text in SVG-Grafiken): alle Google-Fonts-Links der Seite (auch die gewählte
  // Blattschrift), jeder einmal pro Seitenaufruf geholt
  var cssAbrufe = {}, dateien = {};
  function schriftBloecke(){
    var links = [].slice.call(document.querySelectorAll('link[href*="fonts.googleapis.com/css2"]'));
    if (!links.length || !window.fetch || !window.FileReader){ var leer = Promise.resolve([]); leer.alsDaten = alsDaten; return leer; }
    function alsDaten(url){
      if (!dateien[url]) dateien[url] = fetch(url).then(function(r){ if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function(b){
        return new Promise(function(ok){ var f = new FileReader(); f.onload = function(){ ok(f.result); }; f.onerror = function(){ ok(''); }; f.readAsDataURL(b); });
      }).catch(function(){ return ''; });
      return dateien[url];
    }
    function bloeckeAus(href){ if (!cssAbrufe[href]) cssAbrufe[href] = fetch(href).then(function(r){ return r.text(); }).then(function(css){
      var bloecke = [];
      css.replace(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g, function(_, teil, block){
        if (teil !== 'latin' && teil !== 'latin-ext' && teil !== 'fallback') return;   // «fallback»: Schriften in einer einzigen Datei (z. B. Playwrite)
        var fam = /font-family:\s*'?([^';]+)'?;/.exec(block), url = /url\((https:[^)]+)\)/.exec(block);
        if (fam && url) bloecke.push({ familie:fam[1].trim().toLowerCase(), css:block, url:url[1] });
      });
      return bloecke;
    }).catch(function(){ delete cssAbrufe[href]; return []; }); return cssAbrufe[href]; }
    var alle = Promise.all(links.map(function(l){ return bloeckeAus(l.href); })).then(function(listen){
      var gesehen = {};
      return [].concat.apply([], listen).filter(function(b){ if (gesehen[b.url]) return false; gesehen[b.url] = true; return true; });
    });
    alle.alsDaten = alsDaten;
    return alle;
  }
  function schriftCssFuer(familien){
    if (!familien.length) return Promise.resolve('');
    var basis = '';
    if (familien.indexOf(BASIS.toLowerCase()) >= 0){
      var daten = ''; try { daten = localStorage.getItem(BASIS_SPEICHER) || ''; } catch(e){}
      basis = "@font-face{font-family:'" + BASIS + "';src:local('DCH-Basisschrift'),local('DCHBasisschrift')" + (daten ? ",url(data:font/otf;base64," + daten + ")" : '') + "}\n";
    }
    if (basis && familien.length === 1) return Promise.resolve(basis);
    var p = schriftBloecke();
    return p.then(function(bloecke){
      var passend = bloecke.filter(function(b){ return familien.indexOf(b.familie) >= 0; });
      return Promise.all(passend.map(function(b){ return p.alsDaten(b.url).then(function(d){ return d ? b.css.replace(b.url, d) : ''; }); }));
    }).then(function(t){ return basis + t.join('\n'); }).catch(function(){ return basis; });
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
    // Basisschrift aus einer gewählten Datei: in der Kopie fehlt sie sonst (Text würde mit falschen Abständen gesetzt)
    var basisWarten = null;
    if (aktuelleSchrift().lokal){
      var daten = ''; try { daten = localStorage.getItem(BASIS_SPEICHER) || ''; } catch(e){}
      if (daten && doc.fonts && doc.fonts.load){
        var basisStil = doc.createElement('style');
        basisStil.textContent = "@font-face{font-family:'" + BASIS_DATEI + "';src:url(data:font/otf;base64," + daten + ")}";
        doc.head.appendChild(basisStil);
        basisWarten = doc.fonts.load("20px '" + BASIS_DATEI + "'").catch(function(){});
      }
    }
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
    if (basisWarten) arbeit.push(basisWarten);
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
  // Ein Blatt (oder ein Teil davon) als Bild zeichnen – gleich wie im PDF (Druckregeln gelten); o: { scale, rand (Pixel Weissraum), eng (rechts zuschneiden; Selektor der Teile, nach denen gemessen wird) }
  function blattLeinwand(blatt, o){
    o = o || {};
    var ausgeschaltet = [].filter.call(document.styleSheets, function(s){ return s.disabled && s.href; }).map(function(s){ return s.href; });
    return ladeSkript('gemeinsam/extern/html2canvas.min.js').then(function(){
      return window.html2canvas(blatt, { scale:o.scale || 3, backgroundColor:'#ffffff', logging:false, useCORS:true, windowWidth:703, scrollX:0, scrollY:0,
        onclone:function(doc, kopie){
          if (o.rand) kopie.style.padding = o.rand + 'px';
          return Promise.resolve(druckKopie(doc, kopie, blatt, ausgeschaltet)).then(function(){
            if (!o.eng) return;   // rechts auf den Inhalt zuschneiden (die Zeilen bleiben gleich umbrochen)
            var r = kopie.getBoundingClientRect(), max = r.left;
            [].forEach.call(kopie.querySelectorAll(typeof o.eng === 'string' ? o.eng : '*'), function(el){ var b = el.getBoundingClientRect(); if (b.width && b.right > max) max = b.right; });
            kopie.style.width = Math.ceil(max - r.left + (o.rand || 0) + 1) + 'px';
          });
        } });
    });
  }
  function alsPng(cv){ return new Promise(function(ok, fehler){ cv.toBlob(function(b){ if (b) ok(b); else fehler(new Error('Bild leer')); }, 'image/png'); }); }
  // Ein Blatt als Bild (PNG) herunterladen
  function bildHerunterladen(blatt, dateiname){
    if (!blatt) return Promise.resolve();
    return blattLeinwand(blatt).then(alsPng).then(function(b){
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = dateiname || 'Blatt.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
    });
  }
  /* Ein Blatt (oder ein Teil davon) als Bild in die Zwischenablage – zum Einfügen in Word & Co.
     Das Bild wird als «Versprechen» übergeben, damit auch Safari den Klick noch als Auslöser gelten lässt. */
  function bildKopieren(blatt, o){
    if (!blatt) return Promise.resolve();
    if (!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem) return Promise.reject(new Error('Dieser Browser kann keine Bilder kopieren'));
    o = Object.assign({ scale:2, rand:14 }, o || {});
    var bild = blattLeinwand(blatt, o).then(alsPng);
    return navigator.clipboard.write([new ClipboardItem({ 'image/png':bild })]).catch(function(){
      return bild.then(function(b){ return navigator.clipboard.write([new ClipboardItem({ 'image/png':b })]); });
    });
  }
  // Knopf «Als Bild»: auftrag() liefert { blatt, name:'….png' }
  function bildKnopf(knopf, auftrag, fehler){
    if (!knopf) return;
    knopf.addEventListener('click', function(){
      if (knopf.disabled) return;
      var a = auftrag(); if (!a || !a.blatt) return;
      var text = knopf.textContent; knopf.disabled = true; knopf.textContent = 'Bild wird erstellt …';
      bildHerunterladen(a.blatt, a.name).catch(function(e){
        if (window.console) console.error(e);
        var t = 'Das Bild konnte nicht erstellt werden' + (e && e.message ? ' (' + e.message + ')' : '') + '. Bitte versuche es noch einmal.';
        if (fehler) fehler(t); else alert(t);
      }).then(function(){ knopf.disabled = false; knopf.textContent = text; });
    });
  }
  // Dateiname für ein PDF: «Labyrinth» + Titel → Labyrinth-Titel.pdf
  function pdfName(art, titel){ var t = dateiname(titel); return art + (t ? '-' + t : '') + '.pdf'; }

  return { registriere:registriere, start:start, imArtefakt:imArtefakt, claude:claude, sammleCss:sammleCss, blattDatei:blattDatei, dateiname:dateiname, esc:esc,
    blattSchalterHtml:blattSchalterHtml, blattSchalter:blattSchalter, pdfHerunterladen:pdfHerunterladen, pdfKnopf:pdfKnopf, pdfName:pdfName,
    bildHerunterladen:bildHerunterladen, bildKnopf:bildKnopf, bildKopieren:bildKopieren, blattSchrift:blattSchrift };
})();
