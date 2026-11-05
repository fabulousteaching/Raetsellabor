/* Rätsellabor – Generator «Kettenrätsel» (Verbinde-Rätsel)
   Kreise mit Wörtern oder Rechnungen. Wer bei START beginnt und jedes Wort mit seinem Partner in einem anderen Kreis
   verbindet, zeichnet einen Buchstaben oder eine Zahl. Jede Linie der Form ist ein Paar; jeder Kreis der Form enthält
   je ein Wort für jede Linie, die an ihn stösst. Dazu kommen Ablenker-Kreise, deren Wörter keinen Partner haben:
   Jedes Wort auf dem Blatt passt zu höchstens einem anderen (bei Mathe: jeder Wert kommt höchstens zweimal vor).
   Fächer: Mathe (Rechnungen, erzeugt), Deutsch, Englisch, Französisch (eigene Paare; Übersetzung automatisch). */
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
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Formen im Raster 4 × 6 (y nach unten): Striche als Punktfolgen. Derselbe Punkt in mehreren Strichen ist derselbe Kreis
     (Verzweigung, höchstens drei Linien je Kreis). Jeder Teil der Form beginnt bei seinem ersten Punkt (START).
     Abstände geprüft: Kreise mindestens 1.4 auseinander, keine Linie näher als 0.75 an einem fremden Kreis. */
  var ZEICHEN = {
    A:[[[0, 6], [0.8, 3.6], [2, 0], [3.2, 3.6], [4, 6]], [[0.8, 3.6], [3.2, 3.6]]],
    B:[[[0, 6], [0, 3], [0, 0], [2.6, 0], [3.7, 1.5], [2.4, 3], [0, 3]], [[2.4, 3], [4, 4.5], [2.7, 6], [0, 6]]],
    C:[[[3.9, 1], [2, 0], [0.2, 1.3], [0, 3], [0.2, 4.7], [2, 6], [3.9, 5]]],
    D:[[[0, 6], [0, 3], [0, 0], [2, 0], [3.6, 1.2], [4, 3], [3.6, 4.8], [2, 6], [0, 6]]],
    E:[[[4, 0], [2, 0], [0, 0], [0, 3], [0, 6], [2, 6], [4, 6]], [[0, 3], [2.6, 3]]],
    F:[[[0, 6], [0, 3], [0, 0], [2, 0], [4, 0]], [[0, 3], [2.6, 3]]],
    G:[[[3.9, 1], [2, 0], [0.2, 1.3], [0, 3], [0.2, 4.7], [2, 6], [3.8, 5.2], [4, 3.4], [2.4, 3.4]]],
    H:[[[0, 6], [0, 3], [0, 0]], [[4, 0], [4, 3], [4, 6]], [[0, 3], [2, 3], [4, 3]]],
    I:[[[2, 6], [2, 4], [2, 2], [2, 0]]],
    J:[[[4, 0], [4, 2], [4, 4], [3.4, 5.6], [1.8, 6], [0.3, 5]]],
    K:[[[0, 6], [0, 3], [0, 0]], [[3.8, 0], [1.6, 1.74], [0, 3]], [[1.6, 1.74], [2.8, 3.9], [4, 6]]],
    L:[[[0, 0], [0, 2], [0, 4], [0, 6], [2, 6], [4, 6]]],
    M:[[[0, 6], [0, 3], [0, 0], [2, 3], [4, 0], [4, 3], [4, 6]]],
    N:[[[0, 6], [0, 3], [0, 0], [2, 3], [4, 6], [4, 3], [4, 0]]],
    O:[[[2, 0], [3.7, 1.2], [4, 3], [3.7, 4.8], [2, 6], [0.3, 4.8], [0, 3], [0.3, 1.2], [2, 0]]],
    P:[[[0, 6], [0, 3], [0, 0], [2.4, 0], [3.8, 1.5], [2.4, 3], [0, 3]]],
    Q:[[[2, 0], [3.7, 1.2], [4, 3], [3.7, 4.8], [2, 6], [0.3, 4.8], [0, 3], [0.3, 1.2], [2, 0]], [[3.7, 4.8], [4.4, 6.2]]],
    R:[[[0, 6], [0, 3], [0, 0], [2.4, 0], [3.8, 1.5], [2.4, 3], [0, 3]], [[2.4, 3], [3.2, 4.5], [4, 6]]],
    S:[[[3.8, 0.8], [2, 0], [0.2, 1.2], [1.2, 2.7], [2.8, 3.3], [3.8, 4.8], [2, 6], [0.2, 5.2]]],
    T:[[[2, 6], [2, 4], [2, 2], [2, 0]], [[0, 0], [2, 0], [4, 0]]],
    U:[[[0, 0], [0, 2.2], [0.3, 4.6], [2, 6], [3.7, 4.6], [4, 2.2], [4, 0]]],
    V:[[[0, 0], [1, 3], [2, 6], [3, 3], [4, 0]]],
    W:[[[0, 0], [0.5, 3], [1, 6], [2, 2.5], [3, 6], [3.5, 3], [4, 0]]],
    X:[[[0, 0], [1, 1.5], [3, 4.5], [4, 6]], [[4, 0], [3, 1.5], [1, 4.5], [0, 6]]],
    Y:[[[2, 6], [2, 4.5], [2, 3]], [[0, 0], [1, 1.5], [2, 3], [3, 1.5], [4, 0]]],
    Z:[[[0, 0], [2, 0], [4, 0], [2, 3], [0, 6], [2, 6], [4, 6]]],
    0:[[[2, 0], [3.4, 0.9], [3.8, 3], [3.4, 5.1], [2, 6], [0.6, 5.1], [0.2, 3], [0.6, 0.9], [2, 0]]],
    1:[[[0.6, 1.8], [2.4, 0], [2.4, 2], [2.4, 4], [2.4, 6]]],
    2:[[[0.2, 1.2], [2, 0], [3.8, 1.3], [3.2, 3.2], [1.6, 4.6], [0, 6], [2, 6], [4, 6]]],
    3:[[[0.2, 0.8], [2, 0], [3.7, 1.2], [1.6, 3], [3.8, 4.6], [2, 6], [0.2, 5.2]]],
    4:[[[3, 6], [3, 2.4], [3, 0], [1.4, 2.2], [0, 4.2], [1.8, 4.2], [4, 4.2]]],
    5:[[[3.8, 0], [1, 0], [0.4, 2.6], [2.2, 2.4], [3.8, 3.6], [3.6, 5.2], [2, 6], [0.2, 5.3]]],
    6:[[[3.6, 0.6], [2, 0], [0.4, 1.2], [0, 3.4], [0.4, 5.2], [2, 6], [3.7, 5], [3.4, 3.3], [1.8, 2.8], [0, 3.4]]],
    7:[[[0, 0], [2, 0], [4, 0], [2.8, 2], [1.8, 4], [1, 6]]],
    8:[[[2, 0], [3.6, 1.1], [2.9, 2.6], [0.2, 4.6], [2, 6], [3.8, 4.6], [1.1, 2.6], [0.4, 1.1], [2, 0]]]
  };
  ZEICHEN[9] = ZEICHEN[6].map(function(s){ return s.map(function(p){ return [Math.round((4 - p[0]) * 10) / 10, Math.round((6 - p[1]) * 10) / 10]; }); });   // 9 = 6 gedreht
  /* Ohne dreigeteilte Kreise: keine Verzweigung und keine geschlossenen Ringe – Querstriche stossen nicht an, Ringe haben
     eine kleine Lücke. Jeder Teil ist ein offener Strich mit START und ENDE (gleich geprüft wie oben). */
  var ZEICHEN_EINFACH = {
  A:[[[0, 6], [0.9, 3], [2, 0], [3.1, 3], [4, 6]], [[1.3, 4.4], [2.7, 4.4]]],
    B:[[[0, 6], [0, 3], [0, 0], [2.6, 0], [3.7, 1.5], [2.2, 3], [3.9, 4.4], [3, 5.9], [1.5, 6.1]]],
    D:[[[0, 4.6], [0, 2.3], [0, 0], [2, 0], [3.6, 1.2], [4, 3], [3.6, 4.8], [2, 6], [0.5, 6]]],
    E:[[[4, 0], [2, 0], [0, 0], [0, 3], [0, 6], [2, 6], [4, 6]], [[1.5, 3], [3.2, 3]]],
    F:[[[0, 6], [0, 3], [0, 0], [2, 0], [4, 0]], [[1.5, 3], [3.2, 3]]],
    H:[[[0, 6], [0, 4], [0, 2], [0, 0]], [[4, 0], [4, 2], [4, 4], [4, 6]], [[1.3, 3], [2.7, 3]]],
    K:[[[0, 6], [0, 3], [0, 0]], [[3.8, 0], [2.4, 1.5], [1.45, 3], [2.4, 4.5], [3.8, 6]]],
    O:[[[2, 0], [3.7, 1.2], [4, 3], [3.7, 4.8], [2, 6], [0.3, 4.8], [0, 3], [0.3, 1.2]]],
    P:[[[0, 6], [0, 3], [0, 0], [2.4, 0], [3.8, 1.5], [1.5, 3]]],
    Q:[[[4, 3], [3.7, 1.2], [2, 0], [0.3, 1.2], [0, 3], [0.3, 4.8], [2, 6], [3.4, 5.4]], [[2.6, 3.4], [4.9, 5.2]]],
    R:[[[0, 6], [0, 3], [0, 0], [2.4, 0], [3.8, 1.5], [1.5, 3]], [[2.6, 4], [4, 6]]],
    T:[[[0, 0], [2, 0], [4, 0]], [[2, 6], [2, 3.75], [2, 1.5]]],
    Y:[[[0, 0], [1, 1.5], [2, 3], [3, 1.5], [4, 0]], [[2, 6], [2, 4.5]]],
    0:[[[2, 0], [3.4, 0.9], [3.8, 3], [3.4, 5.1], [2, 6], [0.6, 5.1], [0.2, 3], [0.6, 0.9]]],
    6:[[[3.6, 0.6], [2, 0], [0.4, 1.2], [0, 3.4], [0.4, 5.2], [2, 6], [3.7, 5], [3.4, 3.3], [1.8, 2.8]]],
    8:[[[2, 0], [3.6, 1.1], [2.9, 2.6], [0.2, 4.6], [2, 6], [3.8, 4.6], [1.1, 2.6], [0.4, 1.1]]]
  };
  ZEICHEN_EINFACH[9] = ZEICHEN_EINFACH[6].map(function(s){ return s.map(function(p){ return [Math.round((4 - p[0]) * 10) / 10, Math.round((6 - p[1]) * 10) / 10]; }); });

  // Form → { ecken:[[x, y]], kanten:[[a, b]], grad:[], start:[Ecken], ende:[Ecken] }; einfach: ohne dreigeteilte Kreise
  function form(z, einfach){
    var ecken = [], kanten = [], index = {};
    function ecke(p){ var k = p[0].toFixed(2) + ',' + p[1].toFixed(2); if (!(k in index)){ index[k] = ecken.length; ecken.push(p); } return index[k]; }
    ((einfach && ZEICHEN_EINFACH[z]) || ZEICHEN[z] || []).forEach(function(s){
      for (var i = 1; i < s.length; i++){
        var a = ecke(s[i - 1]), b = ecke(s[i]);
        if (a !== b && !kanten.some(function(k){ return (k[0] === a && k[1] === b) || (k[0] === b && k[1] === a); })) kanten.push([a, b]);
      }
    });
    var grad = ecken.map(function(){ return 0; }), teil = ecken.map(function(_, i){ return i; });
    function wurzel(i){ return teil[i] === i ? i : (teil[i] = wurzel(teil[i])); }
    kanten.forEach(function(k){ grad[k[0]]++; grad[k[1]]++; teil[wurzel(k[0])] = wurzel(k[1]); });
    var start = [], gesehen = {};
    ecken.forEach(function(_, i){ var w = wurzel(i); if (!gesehen[w]){ gesehen[w] = true; start.push(i); } });   // je Teil der erste Punkt
    var ende = ecken.map(function(_, i){ return i; }).filter(function(i){ return grad[i] === 1 && start.indexOf(i) < 0; });
    return { ecken:ecken, kanten:kanten, grad:grad, start:start, ende:ende };
  }

  /* ---------- Paare ---------- */
  // Liste [[a, b]] → gültige Paare; jedes Wort (ohne Gross-/Kleinschreibung) nur einmal
  function paareListe(liste){
    var paare = [], ohne = 0, doppelt = 0, gesehen = {};
    liste.forEach(function(x){
      var a = String(x[0] || '').trim(), b = String(x[1] || '').trim();
      if (!a && !b) return;
      if (!a || !b){ ohne++; return; }
      var ka = a.toLowerCase(), kb = b.toLowerCase();
      if (gesehen[ka] || gesehen[kb] || ka === kb){ doppelt++; return; }
      gesehen[ka] = gesehen[kb] = true;
      paare.push({ a:a, b:b });
    });
    return { paare:paare, ohne:ohne, doppelt:doppelt };
  }
  /* Mathe: Paare { a, b, w } mit lauter verschiedenen Werten w – so passt jede Aufgabe zu genau einem Kreis
     (bei Brüchen auch keine gleichwertigen wie 1/2 und 2/4). Aus einer Kandidatenliste in zufälliger Reihenfolge. */
  function auswaehlen(kand, anzahl, rnd){
    var aus = [], werte = {};
    mischen(kand, rnd).forEach(function(k){
      var key = (Math.round(k.w * 1e6) / 1e6).toString();
      if (aus.length >= anzahl || werte[key]) return;
      werte[key] = true; aus.push({ a:k.a, b:k.b });
    });
    return aus;
  }
  // Plus und Minus im Zahlenraum bis max
  function plusMinus(ops, max, anzahl, rnd){
    var kand = [], z = function(a, b){ return a + Math.floor(rnd() * (b - a + 1)); };
    for (var v = 0; v < Math.max(300, anzahl * 20); v++){
      var op = ops[Math.floor(rnd() * ops.length)], a, b, w;
      if (op === 'minus'){ a = z(2, max); b = z(1, a - 1); w = a - b; kand.push({ a:a + ' − ' + b, b:String(w), w:w }); }
      else { w = z(2, max); a = z(1, w - 1); b = w - a; kand.push({ a:a + ' + ' + b, b:String(w), w:w }); }
    }
    return auswaehlen(kand, anzahl, rnd);
  }
  // Einmaleins: gewählte Reihen, Mal und/oder Geteilt (3 · 7 = 21, 21 : 7 = 3)
  function einmaleins(reihen, arten, anzahl, rnd){
    var kand = [];
    reihen.forEach(function(r){
      for (var a = 1; a <= 10; a++){
        if (arten.indexOf('mal') >= 0) kand.push({ a:a + ' · ' + r, b:String(a * r), w:a * r });
        if (arten.indexOf('geteilt') >= 0) kand.push({ a:(a * r) + ' : ' + r, b:String(a), w:a });
      }
    });
    return auswaehlen(kand, anzahl, rnd);
  }
  // Dezimalzahlen: Bruch mit Nenner 10, 100, 1000 ↔ Dezimalzahl (7/100 ↔ 0.07)
  function dezimalText(z, k, sep){ var t = String(z); while (t.length < k + 1) t = '0' + t; return t.slice(0, -k) + sep + t.slice(-k); }
  // art: 'echt' (kleiner als 1: 7/100 = 0.07), 'unecht' (grösser als 1: 145/100 = 1.45) oder 'beides'
  function dezimal(stufe, sep, art, anzahl, rnd){
    var kand = [];
    for (var k = 1; k <= stufe; k++){
      var N = Math.pow(10, k), von = art === 'unecht' ? N + 1 : 1, bis = art === 'echt' ? N - 1 : 3 * N - 1;
      for (var z = von; z <= bis; z++) if (z % 10 && z !== N) kand.push({ a:z + '/' + N, b:dezimalText(z, k, sep), w:z / N });
    }
    return auswaehlen(kand, anzahl, rnd);
  }
  // Brüche in Worten ↔ Bruch («drei Fünftel» ↔ 3/5); reichen die echten Brüche nicht, kommen unechte dazu
  var ZAHLWORT = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn',
    'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig', 'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig'];
  var NENNER = { 2:'Halbe', 3:'Drittel', 4:'Viertel', 5:'Fünftel', 6:'Sechstel', 7:'Siebtel', 8:'Achtel', 9:'Neuntel', 10:'Zehntel', 11:'Elftel', 12:'Zwölftel' };
  function bruchWort(z, n){ return n === 2 ? (z === 1 ? 'ein Halb' : ZAHLWORT[z] + ' Halbe') : ZAHLWORT[z] + ' ' + NENNER[n]; }
  // art: 'echt' (z. B. drei Fünftel), 'unecht' (z. B. sieben Fünftel; keine ganzen Zahlen) oder 'beides'
  function brueche(max, art, anzahl, rnd){
    var kand = [], n, z;
    for (n = 2; n <= max; n++){
      if (art !== 'unecht') for (z = 1; z < n; z++) kand.push({ a:bruchWort(z, n), b:z + '/' + n, w:z / n });
      if (art !== 'echt') for (z = n + 1; z < 2 * n; z++) kand.push({ a:bruchWort(z, n), b:z + '/' + n, w:z / n });
    }
    return auswaehlen(kand, anzahl, rnd);
  }

  /* Deutsch: eingebaute Vorschläge. Reimwörter: jedes Paar aus einer anderen Reimfamilie (kein Wort reimt sich auf ein
     anderes Paar). Einzahl–Mehrzahl: nur Wörter, deren Mehrzahl anders aussieht. Gegenteile: jedes Wort nur einmal. */
  var VORSCHLAEGE = {
    reime:'Haus=Maus Buch=Tuch Stein=Bein Rose=Hose Tasche=Flasche Tisch=Fisch Hand=Sand Baum=Traum Hund=Mund Igel=Spiegel Sonne=Tonne Katze=Tatze ' +
      'Nase=Vase Schnecke=Decke Kanne=Pfanne Feder=Leder Ball=Stall Brille=Grille Socke=Glocke Kopf=Topf Bett=Brett Fuchs=Luchs Schuh=Kuh Zahn=Hahn ' +
      'Stern=Kern Wurst=Durst Kamm=Lamm Wal=Schal Floh=Stroh Reh=Klee Ei=Brei Bauch=Strauch Hut=Mut Licht=Gedicht Wagen=Kragen Riese=Wiese ' +
      'Biene=Schiene Rakete=Trompete Daumen=Pflaumen Teller=Keller Gabel=Schnabel Mücke=Brücke Kiste=Liste Tasse=Kasse Puppe=Suppe Rock=Stock ' +
      'Berg=Zwerg Lampe=Rampe Schiff=Riff',
    mehrzahl:'Hund=Hunde Katze=Katzen Baum=Bäume Haus=Häuser Maus=Mäuse Buch=Bücher Kind=Kinder Apfel=Äpfel Vogel=Vögel Blume=Blumen Auto=Autos ' +
      'Ball=Bälle Stuhl=Stühle Tisch=Tische Hand=Hände Fuss=Füsse Zahn=Zähne Kuh=Kühe Schaf=Schafe Pferd=Pferde Fisch=Fische Bett=Betten Glas=Gläser ' +
      'Nuss=Nüsse Wurm=Würmer Mann=Männer Frau=Frauen Rad=Räder Dorf=Dörfer Wald=Wälder Blatt=Blätter Nest=Nester Ei=Eier Huhn=Hühner Ente=Enten ' +
      'Schuh=Schuhe Hut=Hüte Stern=Sterne Wolke=Wolken Brücke=Brücken Tasche=Taschen Stift=Stifte Heft=Hefte Uhr=Uhren Tür=Türen Zug=Züge Boot=Boote ' +
      'Bild=Bilder Lied=Lieder Kopf=Köpfe Topf=Töpfe Gans=Gänse',
    gegenteile:'gross=klein warm=kalt hell=dunkel laut=leise schnell=langsam alt=jung lang=kurz dick=dünn nass=trocken voll=leer schwer=leicht ' +
      'hart=weich oben=unten früh=spät Tag=Nacht offen=geschlossen viel=wenig stark=schwach reich=arm sauber=schmutzig süss=sauer links=rechts ' +
      'vorne=hinten innen=aussen Anfang=Ende Sommer=Winter lachen=weinen kommen=gehen geben=nehmen kaufen=verkaufen gewinnen=verlieren Freund=Feind ' +
      'fragen=antworten richtig=falsch wach=müde'
  };
  function vorschlaege(art, anzahl, rnd){
    var l = (VORSCHLAEGE[art] || '').split(' ').filter(Boolean).map(function(x){ var t = x.split('='); return { a:t[0], b:t[1] }; });
    return mischen(l, rnd).slice(0, anzahl);
  }

  /* ---------- Rätsel belegen ----------
     → { form, woerter[ecke]: [{ t, kante | label }], ablenker:[[w1, w2]], fehlen, moeglich (Ablenker-Kreise maximal) }
     Linien bekommen je ein Paar (Seiten zufällig). Ablenker: von jedem übrigen Paar nur ein Wort – ohne Partner auf dem Blatt. */
  function belegen(z, paare, ablenkerZiel, rnd, einfach){
    var f = form(z, einfach), p = mischen(paare.slice(), rnd), e = f.kanten.length;
    var aus = { zeichen:String(z), einfach:!!einfach, form:f, woerter:[], ablenker:[], fehlen:Math.max(0, e - p.length), moeglich:Math.max(0, Math.floor((p.length - e) / 2)) };
    if (aus.fehlen) return aus;
    var w = f.ecken.map(function(){ return []; });
    f.kanten.forEach(function(k, i){
      var pa = p[i], tausch = rnd() < 0.5;
      w[k[0]].push({ t:tausch ? pa.b : pa.a, kante:i }); w[k[1]].push({ t:tausch ? pa.a : pa.b, kante:i });
    });
    w.forEach(function(l, i){
      mischen(l, rnd);
      if (f.start.indexOf(i) >= 0) l.push({ t:'START', label:true });
      else if (f.ende.indexOf(i) >= 0) l.push({ t:'ENDE', label:true });
    });
    var rest = p.slice(e), n = Math.min(ablenkerZiel, aus.moeglich);
    for (var i = 0; i < n; i++){
      var x = rest[2 * i], y = rest[2 * i + 1];
      aus.ablenker.push([rnd() < 0.5 ? x.a : x.b, rnd() < 0.5 ? y.a : y.b]);
    }
    aus.woerter = w;
    return aus;
  }
  // Prüfen: jedes Wort hat höchstens einen Partner, jede Linie genau einen (Kontrolle für die Tests)
  function eindeutig(r, paare){
    var partner = {};
    paare.forEach(function(p){ partner[p.a.toLowerCase()] = p.b.toLowerCase(); partner[p.b.toLowerCase()] = p.a.toLowerCase(); });
    var alle = [];
    r.woerter.forEach(function(l, i){ l.forEach(function(x){ if (!x.label) alle.push({ t:x.t.toLowerCase(), k:'f' + i }); }); });
    r.ablenker.forEach(function(l, i){ l.forEach(function(t){ alle.push({ t:t.toLowerCase(), k:'a' + i }); }); });
    var anzahl = {}; alle.forEach(function(x){ anzahl[x.t] = (anzahl[x.t] || 0) + 1; });
    return alle.every(function(x){
      if (anzahl[x.t] > 1) return false;
      var treffer = alle.filter(function(y){ return y.t === partner[x.t]; });
      return x.k[0] === 'a' ? treffer.length === 0 : treffer.length === 1 && treffer[0].k !== x.k;
    });
  }

  /* ---------- Ablenker-Kreise verteilen (Pixel) ----------
     Damit die Anordnung die Form nicht verrät: Zuerst kommen Ablenker auf Plätze, an denen andere Buchstaben oder Zahlen
     ihre Kreise hätten (lockvoegel), dann weitere möglichst in die Nähe der Form. Nie auf einer Linie, nie zu nah an einem
     anderen Kreis, nie am Rand. */
  function abstandStrecke(p, a, b){
    var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function verteilen(kreise, strecken, breite, hoehe, r, anzahl, rnd, lockvoegel, kasten){
    var neu = [], alle = kreise.slice();
    function frei(p){
      if (p[0] < r + 4 || p[1] < r + 4 || p[0] > breite - r - 4 || p[1] > hoehe - r - 4) return false;
      if (!strecken.every(function(s){ return abstandStrecke(p, s[0], s[1]) > r + 10; })) return false;
      return alle.every(function(k){ return Math.hypot(p[0] - k[0], p[1] - k[1]) >= 2 * r + 12; });
    }
    mischen((lockvoegel || []).slice(), rnd).forEach(function(p){ if (neu.length < anzahl && frei(p)){ neu.push(p); alle.push(p); } });
    while (neu.length < anzahl){
      var bester = null, bestWert = -Infinity;
      for (var v = 0; v < 260; v++){
        var p = [r + 4 + rnd() * (breite - 2 * r - 8), r + 4 + rnd() * (hoehe - 2 * r - 8)];
        if (!frei(p)) continue;
        var d = Infinity;
        alle.forEach(function(k){ d = Math.min(d, Math.hypot(p[0] - k[0], p[1] - k[1])); });
        var draussen = kasten ? Math.hypot(Math.max(kasten[0] - p[0], 0, p[0] - kasten[2]), Math.max(kasten[1] - p[1], 0, p[1] - kasten[3])) : 0;
        var wert = Math.min(d, 2.8 * r + 20) - 0.6 * draussen;   // genug Abstand, aber lieber in der Nähe der Form
        if (wert > bestWert){ bestWert = wert; bester = p; }
      }
      if (!bester) break;
      neu.push(bester); alle.push(bester);
    }
    return neu;
  }
  return { zufall:zufall, mischen:mischen, ZEICHEN:ZEICHEN, ZEICHEN_EINFACH:ZEICHEN_EINFACH, form:form, paareListe:paareListe, plusMinus:plusMinus, einmaleins:einmaleins, dezimal:dezimal,
    brueche:brueche, bruchWort:bruchWort, VORSCHLAEGE:VORSCHLAEGE, vorschlaege:vorschlaege, belegen:belegen, eindeutig:eindeutig,
    abstandStrecke:abstandStrecke, verteilen:verteilen };
})();
/* KERN-ENDE */

var FAECHER = [['mathe', 'Mathe'], ['deutsch', 'Deutsch'], ['englisch', 'Englisch'], ['franzoesisch', 'Französisch']];
var MATHE = [['plusminus', 'Plus & Minus'], ['einmaleins', 'Einmaleins'], ['dezimal', 'Dezimalzahlen'], ['brueche', 'Brüche']];
var DEUTSCH = [['reime', 'Reimwörter'], ['mehrzahl', 'Einzahl – Mehrzahl'], ['gegenteile', 'Gegenteile'], ['eigene', 'Eigene Paare']];
// Überschriften der Paarliste [links, rechts, Beispiel]; Schlüssel = Liste (Deutsch je Art eine eigene Liste)
var KOEPFE = { 'd-reime':['Wort', 'Reimwort', 'Haus = Maus'], 'd-mehrzahl':['Einzahl', 'Mehrzahl', 'Hund = Hunde'], 'd-gegenteile':['Wort', 'Gegenteil', 'gross = klein'],
  'd-eigene':['Wort', 'Partner', 'Haus = Maus'], englisch:['Deutsch', 'Englisch', 'Hund = dog'], franzoesisch:['Deutsch', 'Französisch', 'Hund = le chien'] };
var ABLENKER = [[0, 'keine'], [4, 'wenige'], [8, 'einige'], [12, 'viele']];
var BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ZIFFERN = '0123456789'.split('');
var TINTE = '#1C1714', LINIE = '#E46F12';
var BLATT_B = 639, BLATT_H = 800;   // Zeichenfläche auf dem Blatt (Pixel; das Blatt ist 703 Pixel breit = 186 mm)
function esc(t){ return Labor.esc(t); }
function kaestchen(name, liste){ return liste.map(function(x){ return '<label><input type="checkbox" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }
function chips(name, liste){ return liste.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

/* ---------- Zeichnen ---------- */
var messer = document.createElement('canvas').getContext('2d');
function breite(t, gr, label){ messer.font = (label ? 'italic 600 ' : '600 ') + gr + 'px ' + Labor.blattSchrift('text'); return messer.measureText(t).width; }
// Bruch übereinander: Zähler, Bruchstrich, Nenner (Mitte bei y)
var BRUCH = /^(\d+)\/(\d+)$/;
function bruchSvg(x, y, gr, t){
  var m = BRUCH.exec(t), w = Math.max(breite(m[1], gr), breite(m[2], gr)) + gr * 0.35;
  return '<text x="' + x.toFixed(1) + '" y="' + (y - 0.6 * gr).toFixed(1) + '" font-size="' + gr.toFixed(1) + '">' + m[1] + '</text>' +
    '<path d="M' + (x - w / 2).toFixed(1) + ' ' + y.toFixed(1) + 'H' + (x + w / 2).toFixed(1) + '" stroke="' + TINTE + '" stroke-width="' + Math.max(1.2, gr * 0.09).toFixed(1) + '"/>' +
    '<text x="' + x.toFixed(1) + '" y="' + (y + 0.66 * gr).toFixed(1) + '" font-size="' + gr.toFixed(1) + '">' + m[2] + '</text>';
}
function mitBruch(r){ return r.woerter.some(function(l){ return l.some(function(z){ return !z.label && BRUCH.test(z.t); }); }) || r.ablenker.some(function(l){ return l.some(function(t){ return BRUCH.test(t); }); }); }
/* Kreis mit 2 oder 3 Feldern. Jedes Feld zeigt in die Richtung seiner Linie (z.winkel, Bogenmass, 0 = rechts, im
   Uhrzeigersinn wie im SVG): Die Trennlinien liegen genau zwischen den Richtungen. So verlässt jede Linie den Kreis im
   Feld ihres Wortes und trifft beim Partner auf dessen Feld. Ohne Richtung (Ablenker): oben und unten.
   Die Schrift bleibt waagrecht; sie kommt dorthin, wo im Feld am meisten Platz ist, so gross wie es passt. */
var VOLL = 2 * Math.PI;
function normWinkel(a){ a %= VOLL; return a < 0 ? a + VOLL : a; }
function kreisSvg(x, y, r, zeilen){
  var n = zeilen.length, h = '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1.6"/>';
  var w = zeilen.map(function(z, i){ return normWinkel(typeof z.winkel === 'number' ? z.winkel : n === 2 ? (i ? 0.5 : -0.5) * Math.PI : -Math.PI / 2 + i * VOLL / n); });
  var ord = w.map(function(_, i){ return i; }).sort(function(a, b){ return w[a] - w[b]; });
  // Grenze nach dem k-ten Feld (in Winkelreihenfolge): Mitte zum nächsten
  var grenze = ord.map(function(i, k){ var a = w[i], b = w[ord[(k + 1) % n]]; if (b <= a) b += VOLL; return (a + b) / 2; });
  grenze.forEach(function(g){ h += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + (x + r * Math.cos(g)).toFixed(1) + ' ' + (y + r * Math.sin(g)).toFixed(1) + '" stroke="' + TINTE + '" stroke-width="0.9"/>'; });
  var zweiGr = Math.min(n === 3 ? 0.22 * r : 0.27 * r, 15), gr0 = Math.min(n === 3 ? 0.3 * r : 0.33 * r, 16);
  ord.forEach(function(idx, k){
    var s0 = grenze[(k + n - 1) % n], s1 = grenze[k];
    while (s1 <= s0) s1 += VOLL;
    var z = zeilen[idx], mitte = (s0 + s1) / 2;
    function drin(px, py){
      if (px * px + py * py > (r - 3) * (r - 3)) return false;
      if (normWinkel(Math.atan2(py, px) - s0) > s1 - s0) return false;
      return [s0, s1].every(function(g){ var ux = Math.cos(g), uy = Math.sin(g), dot = px * ux + py * uy; return (dot > 0 ? Math.abs(px * uy - py * ux) : Math.hypot(px, py)) >= 2.5; });
    }
    // waagrechter Platz auf Höhe yy (relativ zur Mitte) rund um cx: [links, rechts]
    function lauf(yy, cx){
      var schritt = 1.5, best = null, start = null;
      for (var xx = -r; xx <= r + schritt; xx += schritt){
        var ok = xx <= r && drin(xx, yy);
        if (ok && start === null) start = xx;
        if (!ok && start !== null){ var l = [start, xx - schritt]; if (!best || (cx >= l[0] && cx <= l[1]) || (!(cx >= best[0] && cx <= best[1]) && l[1] - l[0] > best[1] - best[0])) best = l; start = null; }
      }
      return best || [0, 0];
    }
    function platz(yc, hh, cx){ var a = lauf(yc - hh, cx), b = lauf(yc, cx), c = lauf(yc + hh, cx); return [Math.max(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1])]; }
    // beste Stelle im Feld: entlang der Feldmitte verschieden weit vom Mittelpunkt
    function stelle(hh){
      var beste = null;
      [0.3, 0.4, 0.5, 0.6].forEach(function(q){
        var cx = q * r * Math.cos(mitte), cy = q * r * Math.sin(mitte), pl = platz(cy, hh, cx), b = pl[1] - pl[0];
        if (!beste || b > beste.b + 2) beste = { x:(pl[0] + pl[1]) / 2, y:cy, b:Math.max(0, b) };
      });
      return beste;
    }
    if (!z.label && BRUCH.test(z.t)){
      var bs = stelle(1.1 * zweiGr), m = BRUCH.exec(z.t), bw = Math.max(breite(m[1], zweiGr), breite(m[2], zweiGr)) + 0.35 * zweiGr;
      h += bruchSvg(x + bs.x, y + bs.y, Math.max(7, Math.min(zweiGr, zweiGr * bs.b / bw)), z.t);
      return;
    }
    var st = stelle(0.42 * gr0), bw0 = breite(z.t, gr0, z.label), gr = bw0 > st.b ? gr0 * st.b / bw0 : gr0;
    // zu klein und mehrere Wörter: zwei Zeilen (Trennung, bei der die längere Zeile am kürzesten ist)
    var teile = z.t.split(' ');
    if (!z.label && gr < gr0 * 0.8 && teile.length > 1){
      var bester = null;
      for (var t = 1; t < teile.length; t++){
        var l1 = teile.slice(0, t).join(' '), l2 = teile.slice(t).join(' '), bb = Math.max(breite(l1, zweiGr), breite(l2, zweiGr));
        if (!bester || bb < bester.b) bester = { l1:l1, l2:l2, b:bb };
      }
      var st2 = stelle(1.15 * zweiGr), g2 = Math.min(zweiGr, zweiGr * st2.b / bester.b);
      if (g2 > gr){
        h += '<text x="' + (x + st2.x).toFixed(1) + '" y="' + (y + st2.y - 0.58 * g2).toFixed(1) + '" font-size="' + g2.toFixed(1) + '">' + esc(bester.l1) + '</text>' +
          '<text x="' + (x + st2.x).toFixed(1) + '" y="' + (y + st2.y + 0.62 * g2).toFixed(1) + '" font-size="' + g2.toFixed(1) + '">' + esc(bester.l2) + '</text>';
        return;
      }
    }
    gr = Math.max(7, gr);
    h += '<text x="' + (x + st.x).toFixed(1) + '" y="' + (y + st.y).toFixed(1) + '" font-size="' + gr.toFixed(1) + '"' + (z.label ? ' font-style="italic"' : '') + '>' + esc(z.t) + '</text>';
  });
  return h;
}
// Ganzes Rätsel (Form in die Mitte, Ablenker drumherum); loesung: Linien zeichnen
function raetselSvg(r, lage, loesung){
  var h = '';
  if (loesung) r.form.kanten.forEach(function(k){
    var a = lage.ecken[k[0]], b = lage.ecken[k[1]];
    h += '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" stroke="' + LINIE + '" stroke-width="5" stroke-linecap="round"/>';
  });
  lage.ecken.forEach(function(p, i){
    var felder = r.woerter[i].map(function(z){ return { t:z.t, label:z.label, kante:z.kante }; }), winkel = [];
    felder.forEach(function(z){
      if (z.label) return;
      var k = r.form.kanten[z.kante], q = lage.ecken[k[0] === i ? k[1] : k[0]];
      z.winkel = Math.atan2(q[1] - p[1], q[0] - p[0]); winkel.push(normWinkel(z.winkel));
    });
    // START/ENDE in die grösste Lücke zwischen den Linien (bei einer Linie: gegenüber)
    winkel.sort(function(a, b){ return a - b; });
    var luecke = { g:-1, m:0 };
    winkel.forEach(function(a, k){ var b = k + 1 < winkel.length ? winkel[k + 1] : winkel[0] + VOLL; if (b - a > luecke.g) luecke = { g:b - a, m:(a + b) / 2 }; });
    felder.forEach(function(z){ if (z.label) z.winkel = luecke.m; });
    h += kreisSvg(p[0], p[1], lage.r, felder);
  });
  lage.ablenker.forEach(function(p, i){ h += kreisSvg(p[0], p[1], lage.r, r.ablenker[i].map(function(t){ return { t:t }; })); });
  return '<svg class="kt-svg" viewBox="0 0 ' + BLATT_B + ' ' + BLATT_H + '" width="' + BLATT_B + '" height="' + BLATT_H + '" role="img" aria-label="Kreise zum Verbinden">' +
    '<g style="font-family:var(--blatt-schrift)" font-weight="600" fill="' + TINTE + '" text-anchor="middle" dominant-baseline="central">' + h + '</g></svg>';
}
// Lage: Form mittig, Kreisradius aus dem Massstab; Ablenker dazwischen und drumherum
function lageBerechnen(r, rnd){
  var e = r.form.ecken, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  e.forEach(function(p){ minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
  // mit Brüchen etwas grössere Kreise, damit Zähler und Nenner übereinander Platz haben
  var u = Math.min(BLATT_B * 0.7 / (maxX - minX + 1), BLATT_H * 0.86 / (maxY - minY + 1)), rad = mitBruch(r) ? Math.min(0.62 * u, 60) : Math.min(0.56 * u, 54);
  var ox = (BLATT_B - (maxX - minX) * u) / 2 - minX * u, oy = (BLATT_H - (maxY - minY) * u) / 2 - minY * u;
  var ecken = e.map(function(p){ return [ox + p[0] * u, oy + p[1] * u]; });
  var strecken = r.form.kanten.map(function(k){ return [ecken[k[0]], ecken[k[1]]]; });
  // Lockvögel: Kreisplätze von drei anderen Zeichen im gleichen Raster – so sieht man der Anordnung die Form nicht an
  var andere = Kern.mischen(Object.keys(Kern.ZEICHEN).filter(function(k){ return k !== r.zeichen; }), rnd).slice(0, 3), lock = [];
  andere.forEach(function(k){ Kern.form(k, r.einfach).ecken.forEach(function(q){ lock.push([ox + q[0] * u, oy + q[1] * u]); }); });
  var kasten = [ox + minX * u - u, oy + minY * u - u, ox + maxX * u + u, oy + maxY * u + u];
  return { ecken:ecken, r:rad, ablenker:Kern.verteilen(ecken, strecken, BLATT_B, BLATT_H, rad, r.ablenker.length, rnd, lock, kasten) };
}

var VORLAGE = '<div class="kt">' +
  '<header class="kt-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Kettenrätsel</h1>' +
    '<p>Kreise mit Wörtern oder Rechnungen: Wer bei START beginnt und jedes Wort mit seinem Partner verbindet, zeichnet einen Buchstaben oder eine Zahl. Ablenker-Kreise haben keinen Partner.</p></header>' +
  '<div class="kt-layout"><section class="kt-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Was soll erscheinen?</h2></div></div>' +
      '<div class="kt-chips" role="radiogroup" aria-label="Buchstabe oder Zahl">' + chips('ktModus', [['buchstabe', 'Buchstabe'], ['zahl', 'Zahl']]) + '</div>' +
      '<div class="kt-zeichen" id="ktZeichen" role="radiogroup" aria-label="Zeichen"></div>' +
      '<p class="hinweis" id="ktFormInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Inhalt</h2><p>Jede Linie ist ein Paar.</p></div></div>' +
      '<p class="feld-label">Fach</p><div class="kt-chips" role="radiogroup" aria-label="Fach">' + chips('ktFach', FAECHER) + '</div>' +
      '<div class="kt-teil" data-fach="mathe">' +
        '<p class="feld-label">Thema</p><div class="kt-chips" role="radiogroup" aria-label="Mathe-Thema">' + chips('ktMathe', MATHE) + '</div>' +
        '<div class="kt-unter" data-mathe="plusminus">' +
          '<p class="feld-label">Rechenarten</p><div class="kt-chips">' + kaestchen('ktOp', [['plus', 'Plus +'], ['minus', 'Minus −']]) + '</div>' +
          '<p class="feld-label">Zahlenraum</p><div class="kt-chips">' + chips('ktZr', [['20', 'bis 20'], ['100', 'bis 100'], ['1000', 'bis 1000']]) + '</div>' +
        '</div>' +
        '<div class="kt-unter" data-mathe="einmaleins">' +
          '<p class="feld-label">Einmaleins</p><div class="kt-chips">' + chips('ktEinmal', [['klein', 'Kleines 1 × 1'], ['gross', 'Grosses 1 × 1']]) + '</div>' +
          '<p class="feld-label">Rechnungen</p><div class="kt-chips">' + kaestchen('ktEOp', [['mal', 'Mal ·'], ['geteilt', 'Geteilt :']]) + '</div>' +
          '<p class="feld-label">Reihen</p>' +
          '<div class="kt-chips kt-reihen" data-einmal="klein">' + kaestchen('ktReihe', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function(n){ return [n, n + 'er']; })) + '</div>' +
          '<div class="kt-chips kt-reihen" data-einmal="gross">' + kaestchen('ktReiheG', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(function(n){ return [n, n + 'er']; })) + '</div>' +
        '</div>' +
        '<div class="kt-unter" data-mathe="dezimal">' +
          '<p class="feld-label">Brüche</p><div class="kt-chips">' + chips('ktDez', [['1', 'Zehntel'], ['2', 'bis Hundertstel'], ['3', 'bis Tausendstel']]) + '</div>' +
          '<p class="feld-label">Art</p><div class="kt-chips">' + chips('ktDezArt', [['echt', 'kleiner als 1'], ['unecht', 'grösser als 1'], ['beides', 'beides']]) + '</div>' +
          '<p class="feld-label">Dezimaltrennzeichen</p><div class="kt-chips">' + chips('ktSep', [['.', 'Punkt 0.5'], [',', 'Komma 0,5']]) + '</div>' +
          '<p class="hinweis">z. B. 7/100 und 0.07</p>' +
        '</div>' +
        '<div class="kt-unter" data-mathe="brueche">' +
          '<p class="feld-label">Brüche</p><div class="kt-chips">' + chips('ktBruchArt', [['echt', 'echte'], ['unecht', 'unechte'], ['beides', 'beides']]) + '</div>' +
          '<p class="feld-label">Nenner</p><div class="kt-chips">' + chips('ktNenner', [['6', 'bis Sechstel'], ['10', 'bis Zehntel'], ['12', 'bis Zwölftel']]) + '</div>' +
          '<p class="hinweis">z. B. «drei Fünftel» und 3/5 (echt) oder «sieben Fünftel» und 7/5 (unecht)</p>' +
        '</div>' +
        '<p class="hinweis">Alle Ergebnisse sind verschieden – so passt jede Aufgabe nur zu einem einzigen Kreis.</p>' +
      '</div>' +
      '<div class="kt-teil" data-fach="deutsch">' +
        '<p class="feld-label">Art</p><div class="kt-chips" role="radiogroup" aria-label="Art der Paare">' + chips('ktDeutsch', DEUTSCH) + '</div>' +
      '</div>' +
      '<div class="kt-teil kt-paare" data-fach="deutsch englisch franzoesisch">' +
        '<button type="button" class="btn klein kt-vorschlag" id="ktVorschlaege">Andere Vorschläge</button>' +
        '<div class="kt-paarliste" id="ktPaarliste">' + Paarliste.html() + '</div>' +
        '<div class="kt-zaehler" id="ktZaehler" aria-live="polite"></div></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<p class="feld-label">Ablenker-Kreise</p><div class="kt-chips" role="radiogroup" aria-label="Ablenker-Kreise">' + chips('ktAblenker', ABLENKER) + '</div>' +
      '<p class="hinweis" id="ktAblenkerInfo"></p>' +
      '<label class="opt"><input type="checkbox" id="ktDrei"><span>Kreise mit drei Feldern (bei Verzweigungen und Ringen)</span></label>' +
      '<p class="hinweis" id="ktDreiInfo"></p>' +
      '<div class="opt-raster"><label for="ktTitel">Titel auf dem Blatt</label><input type="text" id="ktTitel" maxlength="60" autocomplete="off"></div>' +
    '</div>' +
  '</section>' +
  '<section class="kt-ausgabe" aria-label="Ergebnis">' +
    '<div id="ktMeldung" aria-live="polite"></div>' +
    '<div class="kt-werkzeug">' +
      '<button type="button" class="btn klein" id="ktZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="ktNeu">Neu anordnen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="ktMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="ktPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="ktHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="kt-rahmen"><article class="kt-blatt" id="ktBlatt"></article></div>' +
    '<div class="kt-rahmen"><article class="kt-blatt kt-loesungsblatt" id="ktLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="5" cy="19" r="2.5"/><circle cx="5" cy="5" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/>' +
  '<path d="M5 16.5v-9M6.8 6.8l3.4 3.4M13.8 10.2l3.4-3.4M19 7.5v9"/></svg>';

Labor.registriere({
  id:'kettenraetsel',
  titel:'Kettenrätsel',
  kurz:'Paare verbinden – ein Buchstabe oder eine Zahl erscheint',
  beschreibung:'Kreise mit Wörtern oder Rechnungen: Wer die Paare von START aus verbindet, zeichnet einen Buchstaben oder eine Zahl. Mathe, Deutsch, Englisch oder Französisch, mit Ablenker-Kreisen und Lösungsblatt.',
  merkmale:['Buchstaben A–Z und Zahlen 0–9', 'Jedes Wort mit genau einem Partner', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/kette/kette.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'kettenraetsel-eingaben', OPT = 'kettenraetsel-einstellungen';
  var STANDARD = { modus:'buchstabe', zeichen:'M', fach:'deutsch', deutschArt:'reime', matheArt:'plusminus', ops:['plus', 'minus'], zr:'100',
    eOps:['mal', 'geteilt'], einmal:'klein', reihen:[2, 3, 4, 5, 6, 7, 8, 9, 10], reihenGross:[11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    dez:'2', dezArt:'echt', sep:'.', nenner:'10', bruchArt:'echt', drei:true, ablenker:8, mitLoesung:true, titelAn:true, anleitungAn:true };
  // zeilen: je Liste (d-reime, d-mehrzahl, d-gegenteile, d-eigene, englisch, franzoesisch); vorschlag: Liste ist unverändert vorgeschlagen
  var st = { titel:'', zeilen:{}, vorschlag:{}, seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try {
    var e = JSON.parse(sessionStorage.getItem(TAB));
    if (e){
      st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed;
      Object.keys(KOEPFE).forEach(function(k){ if (e.zeilen && e.zeilen[k]) st.zeilen[k] = Paarliste.aufraeumen(e.zeilen[k]); });
      if (e.zeilen && e.zeilen.deutsch && !st.zeilen['d-eigene']) st.zeilen['d-eigene'] = Paarliste.aufraeumen(e.zeilen.deutsch);   // früher eine Deutsch-Liste
      if (e.vorschlag) Object.keys(e.vorschlag).forEach(function(k){ st.vorschlag[k] = !!e.vorschlag[k]; });
    }
  } catch(x){}
  if (!Kern.ZEICHEN[st.opt.zeichen]) st.opt.zeichen = st.opt.modus === 'zahl' ? '7' : 'M';
  if (!FAECHER.some(function(f){ return f[0] === st.opt.fach; })) st.opt.fach = 'deutsch';
  if (!DEUTSCH.some(function(f){ return f[0] === st.opt.deutschArt; })) st.opt.deutschArt = 'reime';
  if (!MATHE.some(function(f){ return f[0] === st.opt.matheArt; })) st.opt.matheArt = 'plusminus';
  st.opt.ops = (st.opt.ops || []).filter(function(x){ return x === 'plus' || x === 'minus'; }); if (!st.opt.ops.length) st.opt.ops = ['plus', 'minus'];   // früher auch Mal/Geteilt
  if (!Array.isArray(st.opt.eOps) || !st.opt.eOps.length) st.opt.eOps = ['mal', 'geteilt'];
  if (!Array.isArray(st.opt.reihen) || !st.opt.reihen.length) st.opt.reihen = STANDARD.reihen.slice();
  if (!Array.isArray(st.opt.reihenGross) || !st.opt.reihenGross.length) st.opt.reihenGross = STANDARD.reihenGross.slice();
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, zeilen:st.zeilen, vorschlag:st.vorschlag, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#ktMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function titel(){ return st.titel.trim() || 'Kettenrätsel'; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  function radios(name, k, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = typeof STANDARD[k] === 'number' ? +r.value : r.value; speichern(); if (nachher) nachher(); zeichnen(); });
    });
  }
  function zeichenZeigen(){
    var liste = st.opt.modus === 'zahl' ? ZIFFERN : BUCHSTABEN;
    if (liste.indexOf(String(st.opt.zeichen)) < 0) st.opt.zeichen = liste === ZIFFERN ? '7' : 'M';
    $('#ktZeichen').innerHTML = liste.map(function(z){ return '<label><input type="radio" name="ktZeichenWahl" value="' + z + '"' + (String(st.opt.zeichen) === z ? ' checked' : '') + '><span>' + z + '</span></label>'; }).join('');
  }
  $('#ktZeichen').addEventListener('change', function(ev){ if (ev.target.name === 'ktZeichenWahl'){ st.opt.zeichen = ev.target.value; speichern(); zeichnen(); } });
  radios('ktModus', 'modus', zeichenZeigen);
  radios('ktFach', 'fach', fachZeigen);
  radios('ktZr', 'zr'); radios('ktAblenker', 'ablenker');
  radios('ktMathe', 'matheArt', fachZeigen); radios('ktDeutsch', 'deutschArt', fachZeigen);
  radios('ktDez', 'dez'); radios('ktSep', 'sep'); radios('ktNenner', 'nenner'); radios('ktDezArt', 'dezArt'); radios('ktBruchArt', 'bruchArt');
  radios('ktEinmal', 'einmal', fachZeigen);
  // Mehrfachwahl (mindestens eines bleibt gewählt)
  function mehrfach(name, k, zahl){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(c){
      var v = zahl ? +c.value : c.value;
      c.checked = st.opt[k].indexOf(v) >= 0;
      c.addEventListener('change', function(){
        var alle = [].filter.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(x){ return x.checked; }).map(function(x){ return zahl ? +x.value : x.value; });
        if (!alle.length){ c.checked = true; return; }
        st.opt[k] = alle; speichern(); zeichnen();
      });
    });
  }
  mehrfach('ktOp', 'ops'); mehrfach('ktEOp', 'eOps'); mehrfach('ktReihe', 'reihen', true); mehrfach('ktReiheG', 'reihenGross', true);
  $('#ktTitel').value = st.titel;
  $('#ktTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); });
  $('#ktDrei').checked = st.opt.drei !== false;
  $('#ktDrei').addEventListener('change', function(){ st.opt.drei = this.checked; speichern(); zeichnen(); });
  $('#ktMitLoesung').checked = st.opt.mitLoesung;
  $('#ktMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#ktNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#ktZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  function sprache(){ return st.opt.fach !== 'mathe'; }
  function listeName(){ return st.opt.fach === 'deutsch' ? 'd-' + st.opt.deutschArt : st.opt.fach; }
  function vorschlagbar(){ return st.opt.fach === 'deutsch' && st.opt.deutschArt !== 'eigene'; }
  var paarliste = Paarliste.starte($('#ktPaarliste'), {
    liste:function(art){ return st.zeilen[art] || (st.zeilen[art] = []); },
    art:listeName,
    sprache:function(art){ return art === 'englisch' || art === 'franzoesisch' ? art : null; },
    kopf:function(){ return KOEPFE[listeName()] || ['', '', '']; },
    hilfe:function(){ return vorschlagbar() ? 'Vorschläge – ändern und ergänzen geht jederzeit.' : 'Links ein Wort, rechts sein Partner.'; },
    einfuegen:false,
    geaendert:function(){ st.vorschlag[listeName()] = false; speichern(); baldZeichnen(); },
    aus:function(){ return aus; }
  });
  // Vorschläge (Deutsch): so viele Paare, wie die Form und die Ablenker brauchen; ersetzen = neue Auswahl
  function bedarf(){ return Kern.form(String(st.opt.zeichen), st.opt.drei === false).kanten.length + 2 * st.opt.ablenker; }
  function vorschlagen(ersetzen){
    if (!vorschlagbar()) return false;
    var k = listeName(), l = st.zeilen[k] || [], voll = l.filter(function(z){ return z.a && z.b; }).length;
    if (!ersetzen && (l.length && !st.vorschlag[k] || voll >= bedarf())) return false;
    var alt = {}; if (!ersetzen) l.forEach(function(z){ alt[z.a.toLowerCase()] = true; });
    var neu = Kern.vorschlaege(st.opt.deutschArt, 999, Kern.zufall(Math.floor(Math.random() * 1e9) + 1)).filter(function(p){ return !alt[p.a.toLowerCase()]; });
    var liste = (ersetzen ? [] : l.filter(function(z){ return z.a || z.b; })).concat(neu.map(function(p){ return { a:p.a, b:p.b, auto:'' }; }));
    st.zeilen[k] = liste.slice(0, Math.max(bedarf(), ersetzen ? 0 : voll));
    st.vorschlag[k] = true; speichern();
    return true;
  }
  $('#ktVorschlaege').addEventListener('click', function(){ vorschlagen(true); paarliste.zeigen(); zeichnen(); });
  function fachZeigen(){
    [].forEach.call(bereich.querySelectorAll('.kt-teil'), function(d){ d.hidden = d.dataset.fach.split(' ').indexOf(st.opt.fach) < 0; });
    [].forEach.call(bereich.querySelectorAll('.kt-unter'), function(d){ d.hidden = d.dataset.mathe !== st.opt.matheArt; });
    [].forEach.call(bereich.querySelectorAll('[data-einmal]'), function(d){ d.hidden = d.dataset.einmal !== st.opt.einmal; });
    $('#ktVorschlaege').hidden = !vorschlagbar();
    if (sprache()){ vorschlagen(false); paarliste.zeigen(); }
  }

  /* ---------- Rätsel ---------- */
  var raetsel = null, lage = null;
  function paare(rnd, bedarf){
    var o = st.opt;
    if (o.fach === 'mathe'){
      if (o.matheArt === 'einmaleins') return Kern.einmaleins(o.einmal === 'gross' ? o.reihenGross : o.reihen, o.eOps, bedarf, rnd);
      if (o.matheArt === 'dezimal') return Kern.dezimal(+o.dez, o.sep, o.dezArt, bedarf, rnd);
      if (o.matheArt === 'brueche') return Kern.brueche(+o.nenner, o.bruchArt, bedarf, rnd);
      return Kern.plusMinus(o.ops, +o.zr, bedarf, rnd);
    }
    return Kern.paareListe((st.zeilen[listeName()] || []).map(function(z){ return [z.a, z.b]; })).paare;
  }
  function anleitung(){
    var was = st.opt.modus === 'zahl' ? 'Zahl' : 'Buchstabe';
    return 'Beginne beim Kreis mit START. Suche für jedes Wort im Kreis seinen Partner in einem anderen Kreis und verbinde die beiden Kreise mit einer geraden Linie. ' +
      'Mach bei jedem neuen Kreis weiter, bis alle Wörter in den verbundenen Kreisen einen Partner haben. Nicht alle Kreise gehören dazu. Welche' + (was === 'Zahl' ? ' Zahl' : 'r Buchstabe') + ' entsteht?';
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, z = String(o.zeichen), einfach = o.drei === false, f = Kern.form(z, einfach), e = f.kanten.length, rnd = Kern.zufall(st.seed);
    var drei = f.ecken.filter(function(_, i){ return f.grad[i] + (f.start.indexOf(i) >= 0 || f.ende.indexOf(i) >= 0 ? 1 : 0) >= 3; }).length;
    $('#ktDreiInfo').textContent = einfach ? (Kern.ZEICHEN_EINFACH[z] ? 'Darum stösst bei «' + z + '» ein Strich nicht an oder ein Ring hat eine kleine Lücke.' : '')
      : drei ? '«' + z + '» hat ' + drei + ' Kreis' + (drei > 1 ? 'e' : '') + ' mit drei Feldern.' : '';
    if (sprache() && vorschlagen(false)) paarliste.zeigen();   // vorgeschlagene Liste reicht nicht (andere Form, mehr Ablenker): ergänzen
    var liste = paare(rnd, e + 2 * o.ablenker + 4);
    $('#ktFormInfo').innerHTML = '«' + esc(z) + '» hat <b>' + f.ecken.length + ' Kreise</b> und <b>' + e + ' Linien</b> – also braucht es ' + e + ' Paare' +
      (f.start.length > 1 ? '. Die Form hat ' + f.start.length + ' Teile, darum gibt es ' + f.start.length + '-mal START' : '') + '.';
    // Zähler bei den Sprachen
    if (sprache()){
      var p = Kern.paareListe((st.zeilen[listeName()] || []).map(function(x){ return [x.a, x.b]; })), n = p.paare.length, fehlt = e - n, ab = Math.max(0, Math.floor((n - e) / 2));
      var wartend = (st.zeilen[listeName()] || []).filter(function(x){ return x.laedt; }).length;
      $('#ktZaehler').innerHTML = '<p class="kt-zaehler-haupt ' + (fehlt > 0 ? 'fehlt' : 'ok') + '"><b>' + n + '</b> ' + (n === 1 ? 'Paar' : 'Paare') + ' · «' + esc(z) + '» braucht <b>' + e + '</b> für die Linien' +
        (fehlt > 0 ? ' – es fehlen noch <b>' + fehlt + '</b>.' : ' ✓') + '</p>' +
        (fehlt <= 0 ? '<p>Weitere Paare werden zu Ablenkern: Von jedem kommt nur ein Wort aufs Blatt, je zwei Wörter ergeben einen Kreis. Jetzt möglich: <b>' + ab + '</b> Ablenker-Kreise.</p>' : '') +
        (p.ohne > wartend ? '<p class="warnung">' + (p.ohne - wartend) + ' Zeile' + (p.ohne - wartend > 1 ? 'n haben' : ' hat') + ' erst ein Wort – sie zählt, sobald beide Felder ausgefüllt sind.</p>' : '') +
        (p.doppelt ? '<p class="warnung">' + p.doppelt + ' Paar' + (p.doppelt > 1 ? 'e' : '') + ' mit einem doppelten Wort nicht verwendet (sonst gäbe es zwei Partner).</p>' : '');
    }
    raetsel = Kern.belegen(z, liste, o.ablenker, rnd, einfach);
    var leer = raetsel.fehlen > 0;
    ['#ktZeigeLoesung', '#ktNeu', '#ktPdf', '#ktHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    $('#ktAblenkerInfo').textContent = !leer && raetsel.ablenker.length < o.ablenker ? 'Für ' + o.ablenker + ' Ablenker-Kreise braucht es ' + (o.fach === 'mathe' ? 'mehr verschiedene Aufgaben (z. B. mehr Reihen)' : 'mehr Paare') + ' – jetzt sind es ' + raetsel.ablenker.length + '.' : '';
    if (leer){
      $('#ktBlatt').parentNode.hidden = true;
      meldung(sprache() && !liste.length ? 'info' : 'warnung', sprache()
        ? '<p>Für «' + esc(z) + '» braucht es <b>' + e + ' Paare</b>' + (liste.length ? ' – es fehlen noch ' + raetsel.fehlen + '.' : '. Gib links deine Wortpaare ein.') + '</p>'
        : '<p>Mit diesen Einstellungen gibt es nicht genug verschiedene Ergebnisse. Wähle mehr Reihen, einen grösseren Zahlenraum oder mehr Rechenarten.</p>');
      return;
    }
    meldung('', '');
    $('#ktBlatt').parentNode.hidden = false;
    lage = lageBerechnen(raetsel, rnd);
    if (lage.ablenker.length < raetsel.ablenker.length) raetsel.ablenker.length = lage.ablenker.length;   // kein Platz mehr
    var zeige = $('#ktZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#ktBlatt').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') + (o.anleitungAn ? '<p class="kt-anleitung">' + anleitung() + '</p>' : '') +
      raetselSvg(raetsel, lage, zeige) + '<p class="kt-antwort">' + (st.opt.modus === 'zahl' ? 'Zahl' : 'Buchstabe') + ': <span class="kt-linie">' + (zeige ? esc(z) : '') + '</span></p>';
    $('#ktLoesung').innerHTML = (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="kt-anleitung"><b>Lösung</b></p>') +
      raetselSvg(raetsel, lage, true) + '<p class="kt-antwort">' + (st.opt.modus === 'zahl' ? 'Zahl' : 'Buchstabe') + ': <span class="kt-linie">' + esc(z) + '</span></p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  // vor dem PDF «Lösung zeigen» ausschalten, damit das Arbeitsblatt ohne Lösung ins PDF kommt
  function ohneLoesung(){ var k = $('#ktZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#ktPdf'), function(){ ohneLoesung(); return raetsel && !raetsel.fehlen && { blaetter:[$('#ktBlatt'), st.opt.mitLoesung && $('#ktLoesung')], name:Labor.pdfName('Kettenraetsel', st.titel) }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#ktPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#ktHerunterladen').hidden = false; });
  }
  $('#ktHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !raetsel || raetsel.fehlen) return;
    ohneLoesung();
    var name = Labor.pdfName('Kettenraetsel', st.titel).replace(/\.pdf$/, '.html');
    var inhalt = [$('#ktBlatt'), st.opt.mitLoesung && $('#ktLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.kt-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichenZeigen(); fachZeigen(); zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
