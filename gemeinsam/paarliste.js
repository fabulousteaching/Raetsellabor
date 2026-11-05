/* Rätsellabor – Baustein «Paarliste»: Wortpaare in Zeilen mit zwei Feldern (Triomino, Kettenrätsel)
   Unten steht immer eine leere Zeile; sobald man hineinschreibt, kommt eine neue dazu. Eingabetaste: links → rechts →
   nächste Zeile; × löscht eine Zeile. Eine eingefügte Liste (z. B. aus Excel oder Word, oder Zeilen wie «Hund = dog»)
   wird auf Zeilen verteilt.
   Englisch und Französisch: Ist nur ein Feld ausgefüllt, kommt beim Verlassen die Übersetzung automatisch ins andere
   (orange hinterlegt, bis man sie ändert) – auf der Website über api/uebersetzen.php, im Claude-Artefakt über Claude.

   Paarliste.html()                      Markup (in einen Behälter setzen)
   Paarliste.teilen(zeile)               «Hund = dog» → ['Hund', 'dog'] (Trennzeichen: Tabulator, ; = : oder « - »)
   Paarliste.starte(behaelter, o)        o.liste(art) → Zeilen [{ a, b, auto }] (gehört dem Generator, wird verändert)
                                         o.art() → aktuelle Liste, o.sprache(art) → 'englisch' | 'franzoesisch' | null
                                         o.kopf() → [links, rechts, Beispiel], o.hilfe() → Hilfetext ohne Übersetzung
                                         o.geaendert() → speichern und neu erzeugen, o.aus() → Generator geschlossen?
                                         → { zeigen() }   zeigen(): Zeilen, Überschriften und Hilfe neu zeichnen */
var Paarliste = (function(){
  'use strict';
  function esc(t){ return Labor.esc(t); }
  function teilen(z){
    z = String(z || '').trim();
    var m = /\s*(?:\t|;|=|:|\s[-–—]\s)\s*/.exec(z);
    return m ? [z.slice(0, m.index).trim(), z.slice(m.index + m[0].length).trim()] : [z, ''];
  }
  function html(){
    return '<div class="pl-kopf" aria-hidden="true"><span data-pl="a"></span><span data-pl="b"></span></div>' +
      '<div class="pl-zeilen" role="list" aria-label="Paare"></div>' +
      '<p class="hinweis pl-hilfe" data-pl="hilfe"></p>' +
      '<p class="pl-meldung" data-pl="meldung" aria-live="polite" hidden></p>';
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
        return '<input type="text" class="pl-' + seite + (auto ? ' pl-auto' : '') + (laedt ? ' pl-laedt' : '') + '" value="' + esc(wert) + '" maxlength="60" autocomplete="off" spellcheck="false"' +
          ' aria-label="' + esc(name) + ' ' + (i + 1) + '"' + (auto ? ' title="Automatisch übersetzt – bitte prüfen"' : '') + (laedt ? ' aria-busy="true"' : '') + '>';
      }
      return '<div class="pl-zeile" role="listitem">' + feld('a', z.a, k[0]) + feld('b', z.b, k[1]) +
        '<button type="button" class="pl-x" aria-label="Zeile ' + (i + 1) + ' löschen" title="Zeile löschen">×</button></div>';
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
        if (z.auto === seite) f.title = 'Automatisch übersetzt – bitte prüfen'; else f.removeAttribute('title');
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
      var listeText = ' Eine Liste mit zwei Spalten (aus Excel oder Word, oder Zeilen wie «' + esc(k[2]) + '») lässt sich auf einmal einfügen.';
      if (!sprache){ h.innerHTML = o.hilfe() + listeText; return; }
      h.innerHTML = 'Schreib ein Wort auf Deutsch oder ' + esc(k[1]) + ' – die Übersetzung erscheint im anderen Feld.' + listeText;
      ueBereit().then(function(w){
        if (o.aus() || o.art() !== art) return;
        h.innerHTML = w ? 'Schreib ein Wort auf Deutsch oder ' + esc(k[1]) + ' – die Übersetzung erscheint automatisch im anderen Feld (<span class="pl-auto-muster">orange hinterlegt</span>: bitte prüfen; einfach überschreiben, wenn sie nicht passt).' + listeText
          : 'Beide Felder selbst ausfüllen. (Die automatische Übersetzung gibt es auf raetsellabor.fabulousteaching.ch.)' + listeText;
      });
    }
    function melden(t){ var m = q('meldung'); m.textContent = t; m.hidden = !t; }
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
          melden(c === 'zuViele' || c === 'rate_limited' ? 'Gerade zu viele Übersetzungen – bitte in einer Minute nochmals versuchen (Feld anklicken und wieder verlassen).'
            : c === 'cancelled' ? '' : 'Die Übersetzung hat gerade nicht geklappt. Bitte das andere Feld selbst ausfüllen oder es später nochmals versuchen.');
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
  return { html:html, teilen:teilen, starte:starte, aufraeumen:aufraeumen };
})();
