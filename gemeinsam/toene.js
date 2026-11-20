/* Rätsellabor – gemeinsamer Baustein «Töne»: kurze, weiche Töne (wie ein Glockenspiel) mit Web Audio.
   Gebraucht von der Notenschrift (Geheimschriften) und ihrer Hörseite (T/index.html).
     Toene.spiele(midi)                         → einen Ton spielen (MIDI-Nummer: 60 = tiefes C, 69 = A, 72 = hohes C)
     Toene.folge([[midi, …], …], { beiTon(i), fertig() }) → Wörter nacheinander, zwischen den Wörtern eine Pause;
                                                  beiTon bekommt die laufende Nummer des Tons (über alle Wörter)
     Toene.stopp()                              → alles anhalten
   Der Klang entsteht erst beim ersten Antippen (Browser erlauben Ton nur nach einer Berührung). */
window.Toene = (function(){
  'use strict';
  var ctx = null, laufend = [], uhren = [];
  var SCHRITT = 0.55, WORTPAUSE = 0.5, DAUER = 1.4;
  function kontext(){
    if (!ctx){ var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  // Ein Ton: Grundton (Dreieck) mit zwei leisen Obertönen, schneller Anschlag, langsames Ausklingen
  function ton(midi, wann){
    var c = kontext(); if (!c) return false;
    var t = Math.max(wann || 0, c.currentTime), f = 440 * Math.pow(2, (midi - 69) / 12), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + DAUER);
    g.connect(c.destination);
    [[1, 'triangle', 1], [2, 'sine', 0.3], [3, 'sine', 0.1]].forEach(function(h){
      var o = c.createOscillator(), v = c.createGain();
      o.type = h[1]; o.frequency.value = f * h[0]; v.gain.value = h[2];
      o.connect(v); v.connect(g); o.start(t); o.stop(t + DAUER + 0.05);
      laufend.push(o);
      o.onended = function(){ var i = laufend.indexOf(o); if (i >= 0) laufend.splice(i, 1); };
    });
    return true;
  }
  function stopp(){
    laufend.slice().forEach(function(o){ try { o.stop(); } catch(e){} });
    laufend = []; uhren.forEach(clearTimeout); uhren = [];
  }
  function folge(woerter, o){
    o = o || {}; stopp();
    var c = kontext(); if (!c){ if (o.fertig) o.fertig(); return false; }
    var t = c.currentTime + 0.08, nr = 0, start = t;
    woerter.forEach(function(w, wi){
      if (wi) t += WORTPAUSE;
      w.forEach(function(m){
        var i = nr++, wann = t;
        ton(m, wann);
        if (o.beiTon) uhren.push(setTimeout(function(){ o.beiTon(i); }, (wann - start) * 1000 + 80));
        t += SCHRITT;
      });
    });
    if (o.fertig) uhren.push(setTimeout(o.fertig, (t - start) * 1000 + 300));
    return true;
  }
  return { spiele:function(m){ stopp(); return ton(m); }, folge:folge, stopp:stopp, geht:function(){ return !!(window.AudioContext || window.webkitAudioContext); } };
})();
