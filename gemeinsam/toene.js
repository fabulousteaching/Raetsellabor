/* Rätsellabor – gemeinsamer Baustein «Töne»: kurze, weiche Töne (wie ein Glockenspiel).
   Gebraucht von der Notenschrift (Geheimschriften) und ihrer Hörseite (T/index.html).
     Toene.spiele(midi)                         → einen Ton spielen (MIDI-Nummer: 60 = tiefes C, 69 = A, 72 = hohes C)
     Toene.folge([[midi, …], …], { beiTon(i), fertig() }) → Wörter nacheinander, zwischen den Wörtern eine Pause;
                                                  beiTon bekommt die laufende Nummer des Tons (über alle Wörter)
     Toene.stopp()                              → alles anhalten
   Die Töne werden selbst berechnet und als kleine WAV-Datei über ein normales Audio-Element abgespielt – nicht mit
   Web Audio. So klingen sie auch auf iPhone und iPad, wenn das Gerät auf «lautlos» steht, und in Browsern, die Web
   Audio erst nach besonderen Freigaben erlauben. Abspielen nur nach einem Antippen (so wollen es alle Browser). */
window.Toene = (function(){
  'use strict';
  var RATE = 22050, DAUER = 1.4, SCHRITT = 0.55, WORTPAUSE = 0.5;
  var spieler = null, uhren = [], dateien = {};
  function audio(){ if (!spieler && window.Audio){ spieler = new Audio(); spieler.preload = 'auto'; } return spieler; }
  // Abtastwerte: jeder Ton ab seiner Startzeit (s); Dreieck mit zwei leisen Obertönen, kurzer Anschlag, Ausklingen
  function abtasten(toene){
    var ende = toene.reduce(function(a, t){ return Math.max(a, t[1] + DAUER); }, 0) + 0.05;
    var n = Math.ceil(ende * RATE), x = new Float32Array(n);
    toene.forEach(function(t){
      var f = 440 * Math.pow(2, (t[0] - 69) / 12), s0 = Math.round(t[1] * RATE), m = Math.round(DAUER * RATE);
      for (var i = 0; i < m && s0 + i < n; i++){
        var z = i / RATE, p = f * z, tri = 4 * Math.abs(p - Math.floor(p + 0.5)) - 1;
        var huelle = Math.min(1, z / 0.01) * Math.exp(-z * 3.2) * Math.min(1, (DAUER - z) / 0.05);
        x[s0 + i] += huelle * (tri + 0.3 * Math.sin(2 * Math.PI * 2 * p) + 0.1 * Math.sin(2 * Math.PI * 3 * p));
      }
    });
    var spitze = 0; for (var k = 0; k < n; k++) spitze = Math.max(spitze, Math.abs(x[k]));
    var faktor = spitze ? 0.8 / spitze : 0; for (k = 0; k < n; k++) x[k] *= faktor;
    return x;
  }
  // WAV (PCM, 16 Bit, mono)
  function wav(x){
    var b = new ArrayBuffer(44 + x.length * 2), v = new DataView(b), o = 0;
    function txt(s){ for (var i = 0; i < s.length; i++) v.setUint8(o++, s.charCodeAt(i)); }
    function u32(z){ v.setUint32(o, z, true); o += 4; } function u16(z){ v.setUint16(o, z, true); o += 2; }
    txt('RIFF'); u32(36 + x.length * 2); txt('WAVE'); txt('fmt '); u32(16); u16(1); u16(1); u32(RATE); u32(RATE * 2); u16(2); u16(16); txt('data'); u32(x.length * 2);
    for (var i = 0; i < x.length; i++){ v.setInt16(o, Math.max(-1, Math.min(1, x[i])) * 32767, true); o += 2; }
    return URL.createObjectURL(new Blob([b], { type:'audio/wav' }));
  }
  function datei(schluessel, toene){ return dateien[schluessel] || (dateien[schluessel] = wav(abtasten(toene))); }
  function abspielen(url, nachStart, beiFehler){
    var a = audio(); if (!a){ if (beiFehler) beiFehler(); return false; }
    a.pause(); a.src = url; a.currentTime = 0;
    var p = a.play();
    function los(){ if (nachStart) nachStart(); }
    if (p && p.then) p.then(los, function(){ if (beiFehler) beiFehler(); }); else los();
    return true;
  }
  function stopp(){ if (spieler) spieler.pause(); uhren.forEach(clearTimeout); uhren = []; }
  function spiele(m){ stopp(); return abspielen(datei('t' + m, [[m, 0]])); }
  function folge(woerter, o){
    o = o || {}; stopp();
    var toene = [], t = 0.05;
    woerter.forEach(function(w, wi){ if (wi) t += WORTPAUSE; w.forEach(function(m){ toene.push([m, t]); t += SCHRITT; }); });
    var ende = t - SCHRITT + 0.4;
    return abspielen(datei('f' + JSON.stringify(woerter), toene), function(){
      toene.forEach(function(x, i){ if (o.beiTon) uhren.push(setTimeout(function(){ o.beiTon(i); }, x[1] * 1000)); });
      if (o.fertig) uhren.push(setTimeout(o.fertig, ende * 1000));
    }, o.fertig);
  }
  return { spiele:spiele, folge:folge, stopp:stopp, geht:function(){ return !!(window.Audio && window.Blob && window.URL && URL.createObjectURL); }, _abtasten:abtasten };
})();
