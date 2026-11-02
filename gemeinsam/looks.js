/* Rätsellabor – Looks: thematische Gestaltung von Arbeitsblättern
   Ein Look hat eine Hauptfarbe, Deko-Emojis (Kopfzeile, Ecken, Aufzählungszeichen) und ein Muster für den Rahmen.
   Looks.fuerThema('Fussball') → 'fussball' · Looks.entwurf('Dinosaurier') → Promise (im Artefakt entwirft Claude einen Look)
   Looks.anwenden(element, look) setzt die CSS-Variablen --l-farbe, --l-hell, --l-tief, --l-text, --l-punkt, --l-tapete
   und das Attribut data-muster. Das Aussehen selbst steht im Stylesheet des Generators. */
var Looks = (function(){
  'use strict';
  // stichworte: Wortanfänge im Thema; mit «=» nur ganze Wörter
  var LOOKS = {
    schlicht:{ name:'Schlicht', farbe:'#0075BA', deko:['🔍', '🧩', '✏️', '📄'], muster:'punkte', stichworte:[] },
    fussball:{ name:'Fussball', farbe:'#2e7d32', deko:['⚽', '🥅', '🏆', '👟'], ecken:['🚩', '🚩', '🚩', '🚩'], punkt:'⚽', muster:'rasen',
      stichworte:['fussball', 'fußball', 'soccer', 'kick', 'penalty', 'elfmeter', 'stadion', 'bundesliga', 'champions', '=tor', '=wm', '=em', '=fcb', '=fcz', '=yb', '=fifa', '=uefa'] },
    sport:{ name:'Sport', farbe:'#c62f45', deko:['🏅', '🏀', '🎾', '⛷️'], muster:'emoji',
      stichworte:['sport', 'wintersport', 'olympi', 'turnen', 'ski', 'tennis', 'basketball', 'handball', 'volleyball', 'hockey', 'eishockey', 'schwimm', 'leichtathlet', 'unihockey', 'turnier'] },
    weltraum:{ name:'Weltraum', farbe:'#283593', deko:['🚀', '🪐', '⭐', '🌙'], punkt:'⭐', muster:'sterne',
      stichworte:['weltraum', 'weltall', '=all', 'planet', 'stern', 'rakete', 'astronaut', 'mond', 'univers', 'galax', 'sonnensystem', 'komet', 'astronom', '=ufo', 'alien'] },
    meer:{ name:'Meer', farbe:'#0277bd', deko:['🐟', '🐚', '🐙', '⚓'], punkt:'🐟', muster:'wellen',
      stichworte:['meer', 'ozean', '=see', 'wasser', 'strand', 'pirat', 'hafen', 'insel', 'unterwasser', 'fisch', 'delfin', '=wal'] },
    tiere:{ name:'Tiere', farbe:'#8d6e3f', deko:['🦁', '🐘', '🦒', '🐒'], punkt:'🐾', muster:'emoji', tapete:['🐾'],
      stichworte:['tier', 'zoo', 'bauernhof', 'haustier', 'safari', '=hund', '=katze', 'pferd', 'vogel', 'vögel', 'insekt'] },
    dinos:{ name:'Dinosaurier', farbe:'#558b2f', deko:['🦕', '🦖', '🌋', '🥚'], punkt:'🦴', muster:'emoji',
      stichworte:['dino', 'saurier', 'urzeittier', 'fossil'] },
    wald:{ name:'Wald und Natur', farbe:'#33691e', deko:['🌳', '🍄', '🦔', '🌲'], punkt:'🍃', muster:'emoji',
      stichworte:['wald', 'baum', 'bäume', 'pflanz', 'blume', 'natur', 'garten', 'pilz', 'wiese', 'umwelt'] },
    essen:{ name:'Essen', farbe:'#d84315', deko:['🍎', '🥕', '🧀', '🥨'], punkt:'🍴', muster:'karo',
      stichworte:['essen', 'küche', 'koch', 'obst', 'gemüse', 'frucht', 'früchte', 'lebensmittel', 'backen', 'frühstück', 'ernährung', 'znüni', 'restaurant', 'pizza'] },
    musik:{ name:'Musik', farbe:'#6a1b9a', deko:['🎵', '🎸', '🎹', '🥁'], punkt:'🎵', muster:'emoji', tapete:['🎵', '🎶'],
      stichworte:['musik', 'instrument', 'lied', 'orchester', 'konzert', 'tanz', 'singen', '=band', 'chor'] },
    schule:{ name:'Schule', farbe:'#1565c0', deko:['✏️', '📚', '📐', '🎒'], punkt:'✏️', muster:'kariert',
      stichworte:['schul', 'klasse', 'unterricht', 'lernen', 'mathe', 'rechnen', 'lesen', 'wörter', 'grammatik'] },
    wetter:{ name:'Wetter', farbe:'#0288d1', deko:['☀️', '🌧️', '🌈', '⛅'], punkt:'☀️', muster:'emoji',
      stichworte:['wetter', 'klima', '=regen', 'gewitter', 'wolke', 'sonne', 'wind', 'sturm'] },
    verkehr:{ name:'Verkehr', farbe:'#37474f', deko:['🚗', '🚦', '🚲', '🚌'], punkt:'🚗', muster:'strasse',
      stichworte:['verkehr', 'fahrzeug', 'auto', '=zug', 'bahn', 'strasse', 'velo', 'fahrrad', 'flugzeug', 'mobilität', 'schulweg'] },
    welt:{ name:'Länder und Reisen', farbe:'#00796b', deko:['🌍', '✈️', '🗺️', '🧭'], punkt:'📍', muster:'emoji',
      stichworte:['länder', '=land', 'reise', '=welt', 'kontinent', 'geograf', 'europa', 'hauptstadt', 'ferien', 'urlaub', 'schweiz', 'kantone'] },
    koerper:{ name:'Körper', farbe:'#c2185b', deko:['❤️', '👀', '🦷', '🦴'], punkt:'❤️', muster:'emoji',
      stichworte:['körper', 'mensch', 'gesundheit', 'organ', 'sinne', '=arzt', 'skelett'] },
    kleidung:{ name:'Kleidung', farbe:'#ad1457', deko:['👕', '👗', '🧦', '🧢'], punkt:'👕', muster:'emoji', stichworte:['kleid', 'mode', 'anziehen'] },
    farben:{ name:'Farben und Formen', farbe:'#7b1fa2', deko:['🎨', '🔺', '🟦', '🟡'], punkt:'🎨', muster:'emoji', tapete:['🔺', '🟦', '🟡', '🟩'],
      stichworte:['farbe', 'form', 'geometr', 'kunst', 'malen'] },
    jahreszeiten:{ name:'Jahreszeiten', farbe:'#ef6c00', deko:['🌸', '☀️', '🍂', '❄️'], punkt:'🍂', muster:'emoji',
      stichworte:['jahreszeit', 'herbst', 'frühling', 'sommer', '=winter'] },
    ostern:{ name:'Ostern', farbe:'#8e24aa', deko:['🐰', '🥚', '🐣', '🌷'], punkt:'🥚', muster:'emoji', stichworte:['ostern', 'oster'] },
    halloween:{ name:'Halloween', farbe:'#e65100', deko:['🎃', '👻', '🦇', '🕸️'], punkt:'🎃', muster:'emoji', stichworte:['halloween', 'gespenst', 'grusel', 'hexe', 'monster'] },
    weihnachten:{ name:'Weihnachten', farbe:'#c62828', deko:['🎄', '⭐', '🎁', '🔔'], punkt:'❄️', muster:'schnee',
      stichworte:['weihnacht', 'advent', 'samichlaus', 'nikolaus', 'christkind', 'winterfest'] },
    steinzeit:{ name:'Steinzeit', farbe:'#795548', deko:['🦣', '🔥', '🪨', '🏹'], punkt:'🪨', muster:'emoji',
      stichworte:['steinzeit', 'urzeit', 'urgeschicht', 'neandert', 'mammut', 'höhle'] },
    roemer:{ name:'Römer', farbe:'#8e1b1b', deko:['🏛️', '⚔️', '🛡️', '🏺'], punkt:'🏛️', muster:'emoji',
      stichworte:['römer', 'römisch', '=rom', 'antik', 'griech', 'gladiator'] },
    mittelalter:{ name:'Mittelalter', farbe:'#4527a0', deko:['🏰', '⚔️', '👑', '🐉'], punkt:'🛡️', muster:'emoji',
      stichworte:['mittelalter', 'ritter', 'burg', 'könig', 'prinz', 'schloss', 'drache', 'märchen'] },
    berufe:{ name:'Berufe', farbe:'#455a64', deko:['👩‍🍳', '👨‍🔧', '👩‍⚕️', '👷'], punkt:'🔧', muster:'emoji', stichworte:['beruf', 'arbeit', 'handwerk', '=job'] }
  };

  function woerter(t){ return String(t || '').toLocaleLowerCase('de-CH').replace(/ß/g, 'ss').split(/[^\p{L}]+/u).filter(Boolean); }
  /* Welcher Look passt zum Thema? Zuerst die eingebauten Themen, dann Stichworte. null = keiner gefunden */
  function fuerThema(thema){
    var th = typeof Wortwahl !== 'undefined' ? Wortwahl.findeThema(thema) : null;
    if (th && th.look && LOOKS[th.look]) return th.look;
    var ws = woerter(thema), best = null, bestWert = 0;
    if (!ws.length) return null;
    // ganzes Wort zählt am meisten, dann Wortanfang; mitten im Wort nur bei langen Stichworten («Schulfussball»)
    Object.keys(LOOKS).forEach(function(key){
      LOOKS[key].stichworte.forEach(function(s){
        s = s.replace('ß', 'ss');
        var genau = s.charAt(0) === '=';
        if (genau) s = s.slice(1);
        ws.forEach(function(w){
          var wert = w === s ? s.length + 3 : genau ? 0 : w.indexOf(s) === 0 ? s.length + 1 : (s.length >= 7 && w.indexOf(s) > 0) ? s.length : 0;
          if (wert > bestWert){ bestWert = wert; best = key; }
        });
      });
    });
    return best;
  }

  /* Farben mischen und Kontrast */
  function rgb(hex){ var h = hex.replace('#', ''); return [0, 2, 4].map(function(i){ return parseInt(h.substr(i, 2), 16); }); }
  function hex(c){ return '#' + c.map(function(v){ v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mische(a, b, anteil){ var x = rgb(a), y = rgb(b); return hex(x.map(function(v, i){ return v + (y[i] - v) * anteil; })); }
  function leucht(h){ return rgb(h).map(function(v){ v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function(s, v, i){ return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function kontrast(a, b){ var x = leucht(a), y = leucht(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  /* Emoji-Tapete als SVG-Kachel */
  function tapete(emojis){
    var e = emojis.slice(0, 4); while (e.length < 4) e = e.concat(emojis);
    var pos = [[10, 34, -12], [66, 28, 14], [34, 84, 8], [88, 92, -8]];
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g opacity='0.32' font-size='24' font-family='Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif'>" +
      pos.map(function(p, i){ return "<text x='" + p[0] + "' y='" + p[1] + "' transform='rotate(" + p[2] + ' ' + (p[0] + 12) + ' ' + (p[1] - 10) + ")'>" + e[i] + '</text>'; }).join('') + '</g></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27') + '")';
  }

  /* Look-Objekt vervollständigen (Hilfsfarben, Textfarbe auf der Hauptfarbe) */
  function fertig(l){
    var f = /^#[0-9a-fA-F]{6}$/.test(l.farbe) ? l.farbe : '#0075BA';
    return {
      name:l.name, farbe:f, hell:mische(f, '#ffffff', 0.88), tief:mische(f, '#000000', 0.32),
      text:kontrast(f, '#ffffff') >= 3 ? '#ffffff' : '#111827',
      deko:l.deko, ecken:l.ecken || l.deko, punkt:l.punkt || l.deko[0], muster:l.muster || 'emoji', tapete:l.tapete || l.deko
    };
  }
  function look(key){ return fertig(LOOKS[key] || LOOKS.schlicht); }

  /* Für ein unbekanntes Thema einen Look von Claude entwerfen lassen (nur im Artefakt) */
  var entwuerfe = {};
  function entwurf(thema){
    var k = woerter(thema).join(' ');
    if (!k) return Promise.resolve(null);
    if (entwuerfe[k]) return entwuerfe[k];
    entwuerfe[k] = Labor.claude('sample').then(function(ki){
      if (!ki) return null;
      var prompt = 'Gestalte ein Arbeitsblatt (Suchsel) passend zum Thema «' + String(thema).slice(0, 60) + '».\n' +
        'Antworte nur mit JSON: {"farbe":"#RRGGBB","emojis":["…","…","…","…"],"muster":"…"}\n' +
        '- farbe: kräftige, zum Thema passende Hauptfarbe, dunkel genug für weisse Schrift.\n' +
        '- emojis: 4 gut erkennbare, verbreitete Emojis zum Thema (keine Flaggen).\n' +
        '- muster: eines von rasen, sterne, wellen, kariert, karo, strasse, schnee, punkte, emoji.';
      return ki.json(prompt, { modelTier:'quick' }).then(function(j){
        if (!j || !/^#[0-9a-fA-F]{6}$/.test(j.farbe) || !Array.isArray(j.emojis)) return null;
        var em = j.emojis.map(String).filter(function(e){ return e && e.length <= 12 && !/[\p{L}\p{N}]/u.test(e); }).slice(0, 4);
        if (em.length < 2) return null;
        var muster = ['rasen', 'sterne', 'wellen', 'kariert', 'karo', 'strasse', 'schnee', 'punkte', 'emoji'].indexOf(j.muster) >= 0 ? j.muster : 'emoji';
        return fertig({ name:String(thema).trim(), farbe:j.farbe, deko:em, muster:muster });
      });
    }).catch(function(){ delete entwuerfe[k]; return null; });
    return entwuerfe[k];
  }

  /* Look auf ein Element anwenden */
  function anwenden(el, l){
    el.style.setProperty('--l-farbe', l.farbe);
    el.style.setProperty('--l-hell', l.hell);
    el.style.setProperty('--l-tief', l.tief);
    el.style.setProperty('--l-text', l.text);
    el.style.setProperty('--l-punkt', '"' + l.punkt + '"');
    el.style.setProperty('--l-tapete', tapete(l.tapete));
    el.setAttribute('data-muster', l.muster);
  }
  function liste(){ return Object.keys(LOOKS).map(function(k){ return { key:k, name:LOOKS[k].name }; }).sort(function(a, b){ return a.key === 'schlicht' ? -1 : b.key === 'schlicht' ? 1 : a.name.localeCompare(b.name, 'de'); }); }

  return { fuerThema:fuerThema, look:look, entwurf:entwurf, anwenden:anwenden, liste:liste };
})();
