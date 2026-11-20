/* Rätsellabor – Baustein «Paarliste»: Wortpaare in Zeilen mit zwei Feldern (Triomino, Kettenrätsel)
   Unten steht immer eine leere Zeile; sobald man hineinschreibt, kommt eine neue dazu. Eingabetaste: links → rechts →
   nächste Zeile; × löscht eine Zeile. Eine eingefügte Liste (z. B. aus Excel oder Word, oder Zeilen wie «Hund = dog»)
   wird auf Zeilen verteilt. Eine Datei (Excel .xlsx, Word .docx, Text .txt/.csv/.tsv) oder markierter Text lässt sich
   auf die Liste ziehen (oder mit «Liste aus Datei» wählen – auf Tablet und Handy); die ersten zwei Spalten werden zu
   Paaren, eine Kopfzeile fällt weg. Steht bei Englisch/Französisch die Fremdsprache links (wie bei Vokaboom
   «apple – Apfel»), werden die Spalten getauscht, damit Deutsch links steht.
   Englisch und Französisch: Ist nur ein Feld ausgefüllt, kommt beim Verlassen die Übersetzung automatisch ins andere
   (orange hinterlegt, bis man sie ändert) – auf der Website über api/uebersetzen.php, im Claude-Artefakt über Claude.

   Paarliste.html()                      Markup (in einen Behälter setzen)
   Paarliste.teilen(zeile)               «Hund = dog» → ['Hund', 'dog'] (Trennzeichen: Tabulator, ; = : oder « - »)
   Paarliste.starte(behaelter, o)        o.liste(art) → Zeilen [{ a, b, auto }] (gehört dem Generator, wird verändert)
                                         o.art() → aktuelle Liste, o.sprache(art) → 'englisch' | 'franzoesisch' | null
                                         o.kopf() → [links, rechts, Beispiel], o.hilfe() → Hilfetext ohne Übersetzung
                                         o.geaendert() → speichern und neu erzeugen, o.aus() → Generator geschlossen?
                                         o.einfuegen: false → kein Hinweis aufs Einfügen einer Liste
                                         → { zeigen() }   zeigen(): Zeilen, Überschriften und Hilfe neu zeichnen */
var Paarliste = (function(){
  'use strict';
var tx = Labor.uebersetzer('labor');
  function esc(t){ return Labor.esc(t); }
  function teilen(z){
    z = String(z || '').trim();
    var m = /\s*(?:\t|;|=|:|\s[-–—]\s)\s*/.exec(z);
    return m ? [z.slice(0, m.index).trim(), z.slice(m.index + m[0].length).trim()] : [z, ''];
  }
  function html(){
    return '<div class="pl-kopf" aria-hidden="true"><span data-pl="a"></span><span data-pl="b"></span></div>' +
      tx('<div class="pl-zeilen" role="list" aria-label="Paare"></div>') +
      tx('<div class="pl-datei"><label class="btn klein pl-dateiknopf"><input type="file" data-pl="datei" accept=".xlsx,.docx,.csv,.tsv,.txt,text/plain,text/csv">Liste aus Datei</label>') +
        tx('<span class="pl-dateihinweis">Excel, Word oder Text – oder die Datei auf die Liste ziehen</span></div>') +
      '<p class="hinweis pl-hilfe" data-pl="hilfe"></p>' +
      '<p class="pl-meldung" data-pl="meldung" aria-live="polite" hidden></p>';
  }

  /* ---------- Listen aus Dateien (Excel, Word, Text) ---------- */
  // Zip-Archiv (xlsx, docx) lesen: Inhaltsverzeichnis am Ende, Einträge mit «deflate» entpackt der Browser (DecompressionStream)
  function entpacken(puffer){
    var d = new DataView(puffer), u8 = new Uint8Array(puffer), i = u8.length - 22, ende = Math.max(0, u8.length - 65557), liste = {};
    while (i >= ende && d.getUint32(i, true) !== 0x06054b50) i--;
    if (i < ende) return null;
    var n = d.getUint16(i + 10, true), p = d.getUint32(i + 16, true);
    for (var k = 0; k < n; k++){
      if (d.getUint32(p, true) !== 0x02014b50) break;
      var methode = d.getUint16(p + 10, true), gepackt = d.getUint32(p + 20, true), ln = d.getUint16(p + 28, true), le = d.getUint16(p + 30, true), lk = d.getUint16(p + 32, true), off = d.getUint32(p + 42, true);
      liste[new TextDecoder().decode(u8.subarray(p + 46, p + 46 + ln))] = { methode:methode, gepackt:gepackt, off:off };
      p += 46 + ln + le + lk;
    }
    return function lesen(name){
      var e = liste[name]; if (!e) return Promise.resolve(null);
      var start = e.off + 30 + d.getUint16(e.off + 26, true) + d.getUint16(e.off + 28, true), daten = u8.subarray(start, start + e.gepackt);
      if (e.methode === 0) return Promise.resolve(new TextDecoder().decode(daten));
      if (e.methode !== 8 || !window.DecompressionStream) return Promise.reject(new Error('entpacken'));
      return new Response(new Blob([daten]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
  }
  function xml(t){ return new DOMParser().parseFromString(t, 'application/xml'); }
  function kinder(el, name){ return [].filter.call(el.getElementsByTagName('*'), function(x){ return x.localName === name; }); }
  // Excel: erstes Blatt → Zeilen (Spalten nach Buchstaben)
  function xlsxZeilen(lesen){
    return Promise.all([lesen('xl/sharedStrings.xml'), lesen('xl/worksheets/sheet1.xml')]).then(function(r){
      var texte = r[0] ? kinder(xml(r[0]).documentElement, 'si').map(function(si){ return kinder(si, 't').map(function(t){ return t.textContent; }).join(''); }) : [];
      if (!r[1]) throw new Error('blatt');
      return kinder(xml(r[1]).documentElement, 'row').map(function(row){
        var zeile = [];
        kinder(row, 'c').forEach(function(c){
          var ref = c.getAttribute('r') || '', buch = (/^[A-Z]+/.exec(ref) || ['A'])[0], sp = 0;
          for (var i = 0; i < buch.length; i++) sp = sp * 26 + buch.charCodeAt(i) - 64;
          var typ = c.getAttribute('t'), v = kinder(c, 'v')[0], wert = '';
          if (typ === 's' && v) wert = texte[+v.textContent] || '';
          else if (typ === 'inlineStr') wert = kinder(c, 't').map(function(t){ return t.textContent; }).join('');
          else if (v) wert = v.textContent;
          zeile[sp - 1] = wert;
        });
        return zeile;
      });
    });
  }
  // Word: Tabellen → Zeilen aus Zellen; ohne Tabelle die Absätze (wie eingefügter Text)
  function docxZeilen(lesen){
    return lesen('word/document.xml').then(function(t){
      if (!t) throw new Error('dokument');
      var doc = xml(t).documentElement, tabellen = kinder(doc, 'tbl');
      function text(el){ return kinder(el, 't').map(function(x){ return x.textContent; }).join(''); }
      if (tabellen.length){
        var zeilen = [];
        tabellen.forEach(function(tb){ kinder(tb, 'tr').forEach(function(tr){ zeilen.push(kinder(tr, 'tc').map(text)); }); });
        return zeilen;
      }
      return kinder(doc, 'p').map(text).filter(function(z){ return z.trim(); }).map(teilen);
    });
  }
  // Text, CSV, TSV: UTF-8, sonst Windows-Zeichensatz; Trennzeichen erkennen (Tabulator, Semikolon, Komma, sonst wie beim Einfügen)
  function textZeilen(puffer){
    var t;
    try { t = new TextDecoder('utf-8', { fatal:true }).decode(puffer); } catch(e){ t = new TextDecoder('windows-1252').decode(puffer); }
    var zeilen = t.replace(/^﻿/, '').split(/\r?\n/).filter(function(z){ return z.trim(); });
    var proben = zeilen.slice(0, 20), trenn = ['\t', ';', ','].filter(function(c){ return proben.length && proben.every(function(z){ return z.indexOf(c) >= 0; }); })[0];
    return zeilen.map(function(z){
      if (!trenn) return teilen(z);
      return z.split(trenn).map(function(x){ return x.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'); });
    });
  }
  var KOPF = /^(deutsch|englisch|französisch|franzoesisch|english|german|french|français|francais|allemand|anglais|wort|wörter|word|words|vokabel|vokabeln|übersetzung|begriff|partner|frage|antwort|aufgabe|lösung|loesung)$/i;
  /* Zeilen (Listen von Zellen) → Paare: die ersten zwei Spalten, die etwas enthalten; Kopfzeile weg */
  function zuPaaren(zeilen){
    var voll = [];
    zeilen.forEach(function(z){ (z || []).forEach(function(c, i){ if (c && String(c).trim()) voll[i] = (voll[i] || 0) + 1; }); });
    var sp = []; voll.forEach(function(n, i){ if (n && sp.length < 2) sp.push(i); });
    if (!sp.length) return { paare:[], kopf:null };
    var paare = zeilen.map(function(z){ return [String((z || [])[sp[0]] || '').trim(), sp[1] !== undefined ? String((z || [])[sp[1]] || '').trim() : '']; }).filter(function(p){ return p[0] || p[1]; });
    var kopf = null;
    if (paare.length && KOPF.test(paare[0][0]) && (!paare[0][1] || KOPF.test(paare[0][1]))) kopf = paare.shift();
    return { paare:paare, kopf:kopf };
  }
  function dateiLesen(datei){
    var name = (datei.name || '').toLowerCase();
    if (/\.(xls|doc|ods|odt|pages|numbers|pdf)$/.test(name)) return Promise.reject(new Error('format'));
    return datei.arrayBuffer().then(function(puffer){
      if (/\.(xlsx|docx)$/.test(name)){
        var lesen = entpacken(puffer); if (!lesen) throw new Error('zip');
        return /\.xlsx$/.test(name) ? xlsxZeilen(lesen) : docxZeilen(lesen);
      }
      return textZeilen(puffer);
    }).then(zuPaaren);
  }
  // Steht die Fremdsprache links? (Artikel und «to» vorne, deutsche Nomen gross – zählt Zeilen, die eindeutig sind)
  function fremdLinks(paare, sprache){
    var art = sprache === 'franzoesisch' ? /^(le|la|les|l'|l’|un|une|des|du)\s?/i : /^(the|a|an|to)\s/i, deArt = /^(der|die|das|ein|eine)\s/i, links = 0, rechts = 0;
    paare.forEach(function(p){
      if (!p[0] || !p[1]) return;
      if (art.test(p[0]) || deArt.test(p[1])) links++;
      if (art.test(p[1]) || deArt.test(p[0])) rechts++;
      if (sprache === 'englisch'){ if (/^[A-ZÄÖÜ]/.test(p[1]) && /^[a-z]/.test(p[0])) links += 0.5; if (/^[A-ZÄÖÜ]/.test(p[0]) && /^[a-z]/.test(p[1])) rechts += 0.5; }
    });
    return links > rechts * 1.5 && links >= 2;
  }

  /* ---------- Übersetzen (gemeinsam für alle Listen) ---------- */
  var UE_SERVER = 'api/uebersetzen.php', ueWeg = null;
  function ueBereit(){   // → { art:'server' } | { art:'claude', ki } | null
    if (ueWeg) return ueWeg;
    if (Labor.imArtefakt()) return (ueWeg = Labor.claude('sample').then(function(ki){ return ki ? { art:'claude', ki:ki } : null; }));
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return (ueWeg = Promise.resolve(null));
    ueWeg = fetch(UE_SERVER, { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return j && j.bereit ? { art:'server' } : null; }, function(){ return null; });
    return ueWeg;
  }
  function ueFehler(code){ var e = new Error(code); e.code = code; return e; }
  function ueServer(sprache, richtung, woerter){
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, uhr = setTimeout(function(){ if (ctl) ctl.abort(); }, 40000);
    return fetch(UE_SERVER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ sprache:sprache, richtung:richtung, woerter:woerter }),
      signal:ctl ? ctl.signal : undefined }).then(function(r){
      clearTimeout(uhr);
      return r.json().catch(function(){ return {}; }).then(function(j){
        if (r.ok && j && j.uebersetzungen && typeof j.uebersetzungen === 'object') return j.uebersetzungen;
        throw ueFehler((j && j.fehler) || (r.status === 429 ? 'zuViele' : 'ki'));
      });
    }, function(){ clearTimeout(uhr); throw ueFehler('netz'); });
  }
  function ueClaude(ki, sprache, richtung, woerter){
    var fremd = sprache === 'englisch' ? 'Englisch (britisches Englisch)' : 'Französisch', von = richtung === 'hin' ? 'Deutsch' : fremd, nach = richtung === 'hin' ? fremd : 'Deutsch';
    var regeln = ['Nimm die gebräuchlichste Übersetzung, wie sie in einem Schulwörterbuch für Kinder steht; bei mehreren Bedeutungen die häufigste.',
      'Gleiche Form wie das Original: Nomen bleiben Nomen (Einzahl oder Mehrzahl wie im Original), Verben und Adjektive in der Grundform; Ausdrücke als Ganzes übersetzen.',
      'Hat das Original einen Artikel, übersetze mit Artikel; sonst ohne.'];
    if (nach === 'Französisch') regeln.push("Französische Nomen immer mit bestimmtem Artikel (le, la, l', les).");
    if (nach === 'Deutsch') regeln.push('Deutsche Nomen mit grossem Anfangsbuchstaben; Schweizer Rechtschreibung: ss statt ß.');
    if (sprache === 'englisch' && richtung === 'hin') regeln.push('Englische Verben ohne «to».');
    var auftrag = 'Du bist ein zuverlässiges Wörterbuch für den Sprachunterricht an Schweizer Schulen (Kinder von 8 bis 14 Jahren).\n' +
      'Übersetze jedes dieser Wörter von ' + von + ' nach ' + nach + '.\nRegeln:\n- ' + regeln.join('\n- ') + '\nWörter (JSON-Liste): ' + JSON.stringify(woerter) + '\n' +
      'Antworte nur mit JSON in dieser Form: {"uebersetzungen": [{"von": "…", "nach": "…"}]} – für jedes Wort genau einen Eintrag, «von» genau wie in der Liste.';
    return ki.json(auftrag, { modelTier:'quick' }).then(function(d){
      var ergebnis = {}, liste = d && (d.uebersetzungen || d);
      (Array.isArray(liste) ? liste : []).forEach(function(x){
        var v = x && String(x.von || '').trim(), n = x && String(x.nach || '').trim();
        if (!v || !n || n.length > 80) return;
        var o = woerter.filter(function(w){ return w.toLowerCase() === v.toLowerCase(); })[0];
        if (o) ergebnis[o] = nach === 'Deutsch' ? n.replace(/ß/g, 'ss') : n;
      });
      return ergebnis;
    });
  }

  function starte(wurzel, o){
    var zeilenEl = wurzel.querySelector('.pl-zeilen'), ueTimer = 0, ueOffen = {}, ueSperre = 0;
    function q(n){ return wurzel.querySelector('[data-pl="' + n + '"]'); }
    function liste(){ return o.liste(o.art()); }
    function zeileHtml(z, i){
      var k = o.kopf();
      function feld(seite, wert, name){
        var auto = z.auto === seite, laedt = z.laedt === seite;
        return '<input type="text" class="pl-' + seite + (auto ? tx(' pl-auto') : '') + (laedt ? tx(' pl-laedt') : '') + '" value="' + esc(wert) + '" maxlength="60" autocomplete="off" spellcheck="false"' +
          ' aria-label="' + esc(name) + ' ' + (i + 1) + '"' + (auto ? tx(' title="Automatisch übersetzt – bitte prüfen"') : '') + (laedt ? ' aria-busy="true"' : '') + '>';
      }
      return '<div class="pl-zeile" role="listitem">' + feld('a', z.a, k[0]) + feld('b', z.b, k[1]) +
        tx('<button type="button" class="pl-x" aria-label="Zeile ') + (i + 1) + tx(' löschen" title="Zeile löschen">×</button></div>');
    }
    function zeilenZeigen(fokus){
      var l = liste();
      while (l.length && !l[l.length - 1].a && !l[l.length - 1].b && !l[l.length - 1].laedt) l.pop();
      zeilenEl.innerHTML = l.concat([{ a:'', b:'', auto:'' }]).map(zeileHtml).join('');
      zeilenEl.lastChild.classList.add('pl-neu');
      if (fokus){ var f = zeilenEl.children[fokus[0]]; if (f) f.querySelector(fokus[1] ? '.pl-b' : '.pl-a').focus(); }
    }
    // eine Zeile im Bildschirm nachführen, ohne den Fokus zu verlieren
    function zeileAuffrischen(i){
      var el = zeilenEl.children[i], z = liste()[i]; if (!el || !z) return;
      ['a', 'b'].forEach(function(seite){
        var f = el.querySelector('.pl-' + seite);
        if (f.value !== z[seite]) f.value = z[seite];
        f.classList.toggle('pl-auto', z.auto === seite); f.classList.toggle('pl-laedt', z.laedt === seite);
        if (z.auto === seite) f.title = tx('Automatisch übersetzt – bitte prüfen'); else f.removeAttribute('title');
        if (z.laedt === seite) f.setAttribute('aria-busy', 'true'); else f.removeAttribute('aria-busy');
      });
    }
    function index(el){ return [].indexOf.call(zeilenEl.children, el.closest('.pl-zeile')); }
    zeilenEl.addEventListener('input', function(ev){
      var el = ev.target.closest('.pl-zeile'), i = index(ev.target); if (!el) return;
      var l = liste(), z = l[i] || (l[i] = { a:'', b:'', auto:'' }), seite = ev.target.classList.contains('pl-a') ? 'a' : 'b';
      z[seite] = ev.target.value;
      if (z.auto === seite){ z.auto = ''; ev.target.classList.remove('pl-auto'); ev.target.removeAttribute('title'); }   // selbst geändert: eigene Eingabe
      if (z.laedt === seite){ z.laedt = ''; zeileAuffrischen(i); }
      if (el.classList.contains('pl-neu') && (z.a || z.b)){   // unterste Zeile benutzt: neue leere Zeile darunter
        el.classList.remove('pl-neu');
        zeilenEl.insertAdjacentHTML('beforeend', zeileHtml({ a:'', b:'', auto:'' }, i + 1)); zeilenEl.lastChild.classList.add('pl-neu');
      }
      o.geaendert();
    });
    // Feld verlassen (nach einer Änderung): fehlt die andere Seite, übersetzen
    zeilenEl.addEventListener('change', function(ev){
      var i = index(ev.target); if (i < 0) return;
      uebersetzen(i, ev.target.classList.contains('pl-a') ? 'a' : 'b');
    });
    zeilenEl.addEventListener('click', function(ev){
      var k = ev.target.closest('.pl-x'); if (!k) return;
      var i = index(k), l = liste();
      if (i < l.length){ l.splice(i, 1); zeilenZeigen([Math.min(i, l.length), 0]); o.geaendert(); }
    });
    zeilenEl.addEventListener('keydown', function(ev){
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      var i = index(ev.target), el = zeilenEl.children[i];
      if (ev.target.classList.contains('pl-a')) el.querySelector('.pl-b').focus();
      else if (zeilenEl.children[i + 1]) zeilenEl.children[i + 1].querySelector('.pl-a').focus();
    });
    /* Paare hinten an die Liste hängen (statt der leeren letzten Zeile), fehlende Seite übersetzen */
    function anhaengen(paare, woher){
      var sprache = o.sprache(o.art()), getauscht = false;
      if (sprache && fremdLinks(paare, sprache)){ paare = paare.map(function(p){ return [p[1], p[0]]; }); getauscht = true; }
      var neu = paare.map(function(p){ return { a:p[0], b:p[1], auto:'' }; });
      if (!neu.length){ melden(tx('In {woher} wurden keine Wortpaare gefunden.', { woher:woher })); return; }
      var l = liste();
      while (l.length && !l[l.length - 1].a && !l[l.length - 1].b) l.pop();
      var i = l.length;
      l.push.apply(l, neu);
      zeilenZeigen(); o.geaendert();
      neu.forEach(function(z, k){ if (!z.b) uebersetzen(i + k, 'a'); else if (!z.a) uebersetzen(i + k, 'b'); });
      melden(tx(neu.length === 1 ? '1 Paar aus {woher} übernommen.' : '{n} Paare aus {woher} übernommen.', { n:neu.length, woher:woher }) + (getauscht ? tx(' Die Spalten wurden getauscht, damit Deutsch links steht.') : ''), true);
    }
    var FEHLER = { format:tx('Diese Datei kann ich nicht lesen. Bitte als Excel (.xlsx), Word (.docx) oder Text (.txt, .csv) speichern – oder die Liste kopieren und einfügen.'),
      zip:tx('Die Datei ist beschädigt oder kein Excel-/Word-Dokument.'), entpacken:tx('Dieser Browser kann die Datei nicht entpacken – bitte die Liste kopieren und einfügen.'),
      blatt:tx('In der Excel-Datei wurde kein Blatt gefunden.'), dokument:tx('Im Word-Dokument wurde kein Text gefunden.') };
    function dateiNehmen(datei){
      melden(tx('Liste wird gelesen …'), true);
      dateiLesen(datei).then(function(r){ anhaengen(r.paare, '«' + datei.name + '»'); }, function(e){ melden(FEHLER[e && e.message] || FEHLER.format); });
    }
    // Ziehen: Datei oder markierten Text auf die Liste
    var tiefe = 0;
    function ziehbar(ev){ var t = ev.dataTransfer && ev.dataTransfer.types; return !!t && ([].indexOf.call(t, 'Files') >= 0 || [].indexOf.call(t, 'text/plain') >= 0); }
    wurzel.addEventListener('dragenter', function(ev){ if (!ziehbar(ev)) return; ev.preventDefault(); tiefe++; wurzel.classList.add('pl-ziehen'); });
    wurzel.addEventListener('dragover', function(ev){ if (!ziehbar(ev)) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
    wurzel.addEventListener('dragleave', function(){ if (--tiefe <= 0){ tiefe = 0; wurzel.classList.remove('pl-ziehen'); } });
    wurzel.addEventListener('drop', function(ev){
      if (!ziehbar(ev)) return;
      ev.preventDefault(); tiefe = 0; wurzel.classList.remove('pl-ziehen');
      var f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f){ dateiNehmen(f); return; }
      var t = ev.dataTransfer.getData('text/plain') || '';
      anhaengen(t.split(/\r?\n/).filter(function(z){ return z.trim(); }).map(teilen), tx('dem gezogenen Text'));
    });
    q('datei').addEventListener('change', function(){ var f = this.files && this.files[0]; if (f) dateiNehmen(f); this.value = ''; });
    zeilenEl.addEventListener('paste', function(ev){
      var t = ev.clipboardData && ev.clipboardData.getData('text');
      if (!t || !/[\r\n\t]/.test(t.trim())) return;   // einzelnes Wort: normal einfügen
      ev.preventDefault();
      var neu = t.split(/\r?\n/).filter(function(z){ return z.trim(); }).map(function(z){ var x = teilen(z); return { a:x[0], b:x[1], auto:'' }; });
      if (!neu.length) return;
      var l = liste(), i = index(ev.target), hier = l[i], leer = !hier || (!hier.a && !hier.b);
      l.splice.apply(l, [i, leer ? 1 : 0].concat(neu));
      zeilenZeigen([i + neu.length, 0]); o.geaendert();
      neu.forEach(function(z, k){ if (!z.b) uebersetzen(i + k, 'a'); else if (!z.a) uebersetzen(i + k, 'b'); });
    });

    function hilfeZeigen(){
      var k = o.kopf(), h = q('hilfe'), art = o.art(), sprache = o.sprache(art);
      var listeText = o.einfuegen === false ? '' : tx(' Eine Liste mit zwei Spalten (aus Excel oder Word, oder Zeilen wie «') + esc(k[2]) + tx('») lässt sich auf einmal einfügen – oder als Datei hierher ziehen.');
      if (!sprache){ h.innerHTML = o.hilfe() + listeText; h.hidden = !h.innerHTML; return; }
      h.hidden = false;
      h.innerHTML = tx('Schreib ein Wort auf Deutsch oder ') + esc(k[1]) + tx(' – die Übersetzung erscheint im anderen Feld.') + listeText;
      ueBereit().then(function(w){
        if (o.aus() || o.art() !== art) return;
        h.innerHTML = w ? tx('Schreib ein Wort auf Deutsch oder ') + esc(k[1]) + tx(' – die Übersetzung erscheint automatisch im anderen Feld (<span class="pl-auto-muster">orange hinterlegt</span>: bitte prüfen; einfach überschreiben, wenn sie nicht passt).') + listeText
          : tx('Beide Felder selbst ausfüllen. (Die automatische Übersetzung gibt es auf raetsellabor.fabulousteaching.ch.)') + listeText;
      });
    }
    function melden(t, gut){ var m = q('meldung'); m.textContent = t; m.hidden = !t; m.classList.toggle('pl-gut', !!gut); }
    function uebersetzen(i, seite){
      var art = o.art(), sprache = o.sprache(art), z = liste()[i];
      if (!sprache || !z) return;
      var ziel = seite === 'a' ? 'b' : 'a', wort = z[seite].trim();
      if (!wort || (z[ziel].trim() && z.auto !== ziel)) return;   // nichts zu tun: leer, oder die andere Seite ist eine eigene Eingabe
      if (Date.now() < ueSperre) return;
      ueBereit().then(function(w){
        if (!w || o.aus()) return;
        z.laedt = ziel; zeileAuffrischen(liste().indexOf(z));
        var schl = art + '|' + sprache + '|' + (seite === 'a' ? 'hin' : 'zurueck');
        (ueOffen[schl] = ueOffen[schl] || {})[wort] = true;
        clearTimeout(ueTimer); ueTimer = setTimeout(function(){ senden(w); }, 350);
      });
    }
    function senden(w){
      var auftraege = ueOffen; ueOffen = {};
      Object.keys(auftraege).forEach(function(schl){
        var t = schl.split('|'), art = t[0], sprache = t[1], richtung = t[2], woerter = Object.keys(auftraege[schl]).slice(0, 40);
        var von = richtung === 'hin' ? 'a' : 'b', ziel = richtung === 'hin' ? 'b' : 'a';
        (w.art === 'server' ? ueServer(sprache, richtung, woerter) : ueClaude(w.ki, sprache, richtung, woerter)).then(function(ergebnis){
          melden(''); eintragen(art, von, ziel, woerter, ergebnis);
        }, function(e){
          var c = e && e.code;
          melden(c === 'zuViele' || c === 'rate_limited' ? tx('Gerade zu viele Übersetzungen – bitte in einer Minute nochmals versuchen (Feld anklicken und wieder verlassen).')
            : c === 'cancelled' ? '' : tx('Die Übersetzung hat gerade nicht geklappt. Bitte das andere Feld selbst ausfüllen oder es später nochmals versuchen.'));
          if (c === 'zuViele' || c === 'rate_limited') ueSperre = Date.now() + 60000;
          eintragen(art, von, ziel, woerter, {});
        });
      });
    }
    // Ergebnis in die Zeilen eintragen, die noch auf genau dieses Wort warten
    function eintragen(art, von, ziel, woerter, ergebnis){
      if (o.aus()) return;
      (o.liste(art) || []).forEach(function(z, i){
        if (z.laedt !== ziel || woerter.indexOf(z[von].trim()) < 0) return;
        z.laedt = '';
        var t = ergebnis[z[von].trim()];
        if (t && (!z[ziel].trim() || z.auto === ziel)){ z[ziel] = t; z.auto = ziel; }
        if (art === o.art()) zeileAuffrischen(i);
      });
      o.geaendert();
    }
    function zeigen(){
      var k = o.kopf();
      q('a').textContent = k[0]; q('b').textContent = k[1];
      zeilenZeigen(); hilfeZeigen(); melden('');
    }
    return { zeigen:zeigen };
  }
  // Zeilen aus gespeicherten Daten (ohne «lädt …»)
  function aufraeumen(l){ return (Array.isArray(l) ? l : []).map(function(z){ return { a:String(z.a || ''), b:String(z.b || ''), auto:z.auto === 'a' || z.auto === 'b' ? z.auto : '' }; }); }
  return { html:html, teilen:teilen, starte:starte, aufraeumen:aufraeumen, dateiLesen:dateiLesen, zuPaaren:zuPaaren, fremdLinks:fremdLinks, textZeilen:textZeilen };
})();
