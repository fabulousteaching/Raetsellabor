/* Rätsellabor – Falt-Figuren für das Falträtsel: Himmel und Hölle, Stern, Segelboot
   Ein eigener Faltrechner für schräge Faltungen: Das Blatt (ein Quadrat) besteht aus Stücken (konvexe Vielecke), jedes mit
   einer Abbildung vom Blatt in die jetzige Lage und einer Höhe. Gefaltet wird entlang beliebiger Linien – durch alle Lagen
   oder nur durch einen Lappen. Am Schluss steht die Botschaft im Lesefeld der fertigen Figur; jedes Stück bekommt genau den
   Teil, der dann bei ihm oben zu sehen ist (am Rand abgeschnitten, passend gedreht), alles andere Füllbuchstaben.
   Die Figuren sind so gewählt, dass die Botschaft am Schluss nur auf der Seite steht, die beim Falten unten liegt – darum
   genügt ein einseitiger Druck. window.Faltfiguren wird von raetsel/faltraetsel/faltraetsel.js benutzt. */
(function(){
'use strict';
/* KERN-START */
var Figuren = (function(){
  /* ---------- Geometrie ----------
     Das Blatt ist ein Quadrat [0, 1] × [0, 1] (y nach unten). Ein Stück: { poly (Ecken im Blatt), M (Abbildung Blatt → jetzt:
     [a, b, c, d, e, f] mit x' = a·x + c·y + e, y' = b·x + d·y + f), z (Höhe) }. Vorderseite oben, solange det(M) > 0. */
  function abb(M, p){ return [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]]; }
  function mal(A, B){ return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
  function invers(M){ var det = M[0] * M[3] - M[1] * M[2], a = M[3] / det, b = -M[1] / det, c = -M[2] / det, d = M[0] / det; return [a, b, c, d, -(a * M[4] + c * M[5]), -(b * M[4] + d * M[5])]; }
  function det(M){ return M[0] * M[3] - M[1] * M[2]; }
  /* Spiegelung an der Geraden durch p und q */
  function spiegel(p, q){
    var dx = q[0] - p[0], dy = q[1] - p[1], l = dx * dx + dy * dy, a = (dx * dx - dy * dy) / l, b = 2 * dx * dy / l;
    // x' = p + S (x − p) mit S = [[a, b], [b, −a]]
    return [a, b, b, -a, p[0] - a * p[0] - b * p[1], p[1] - b * p[0] + a * p[1]];
  }
  function seite(p, q, x){ return (q[0] - p[0]) * (x[1] - p[1]) - (q[1] - p[1]) * (x[0] - p[0]); }
  /* konvexes Vieleck an der Geraden p–q schneiden: Teil mit seite·s > 0 */
  function schneide(poly, p, q, s){
    var aus = [], n = poly.length;
    for (var i = 0; i < n; i++){
      var A = poly[i], B = poly[(i + 1) % n], sa = seite(p, q, A) * s, sb = seite(p, q, B) * s;
      if (sa >= 0) aus.push(A);
      if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)){ var t = sa / (sa - sb); aus.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]); }
    }
    return aus;
  }
  function flaeche(poly){ var s = 0; for (var i = 0; i < poly.length; i++){ var a = poly[i], b = poly[(i + 1) % poly.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function innen(poly, x){   // Punkt im konvexen Vieleck (Rand zählt mit)
    var vz = 0;
    for (var i = 0; i < poly.length; i++){ var s = seite(poly[i], poly[(i + 1) % poly.length], x); if (Math.abs(s) < 1e-9) continue; var v = s > 0 ? 1 : -1; if (vz && v !== vz) return false; vz = v; }
    return true;
  }
  function jetzt(st){ return st.poly.map(function(p){ return abb(st.M, p); }); }

  /* ---------- Falten ----------
     Schritt: { p, q (Faltlinie, jetzige Lage), weg (ein Punkt auf der Seite, die gefaltet wird), t:'tal'|'berg',
                nur (optional: Bereich des Blatts – nur Stücke daraus werden gefaltet, z. B. ein einzelner Lappen) }
     oder { umdrehen:true } (wie eine Buchseite, um die senkrechte Mitte) oder { drehen:Grad } (nur die Ansicht). */
  function start(){ return [{ poly:[[0, 0], [1, 0], [1, 1], [0, 1]], M:[1, 0, 0, 1, 0, 0], z:0 }]; }
  function falte(stuecke, op){
    if (op.umdrehen){
      var xs = [].concat.apply([], stuecke.map(function(s){ return jetzt(s).map(function(p){ return p[0]; }); })), m = Math.min.apply(null, xs) + Math.max.apply(null, xs);
      return stuecke.map(function(s){ return { poly:s.poly, M:mal([-1, 0, 0, 1, m, 0], s.M), z:-s.z, lappen:s.lappen }; });
    }
    if (op.drehen){
      // um die Mitte drehen (im Uhrzeigersinn, y nach unten)
      var r = rahmen(stuecke), mx = (r.x0 + r.x1) / 2, my = (r.y0 + r.y1) / 2, w = op.drehen * Math.PI / 180, c = Math.cos(w), sn = Math.sin(w);
      var D = [c, sn, -sn, c, mx - c * mx + sn * my, my - sn * mx - c * my];
      return stuecke.map(function(s){ return { poly:s.poly, M:mal(D, s.M), z:s.z, lappen:s.lappen }; });
    }
    var sw = seite(op.p, op.q, op.weg) > 0 ? 1 : -1, S = spiegel(op.p, op.q), neu = [], weg = [];
    stuecke.forEach(function(s){
      var J = jetzt(s), invM = invers(s.M);
      var darf = waehlbar(s, op);
      var bleibt = darf ? schneide(J, op.p, op.q, -sw) : J, geht = darf ? schneide(J, op.p, op.q, sw) : [];
      if (bleibt.length >= 3 && flaeche(bleibt) > 1e-9) neu.push({ poly:bleibt.map(function(p){ return abb(invM, p); }), M:s.M, z:s.z, lappen:s.lappen });
      if (geht.length >= 3 && flaeche(geht) > 1e-9) weg.push({ poly:geht.map(function(p){ return abb(invM, p); }), M:mal(S, s.M), z:s.z, lappen:op.lappen || s.lappen });
    });
    if (!weg.length) return neu;
    var zs = stuecke.map(function(s){ return s.z; }), zmax = Math.max.apply(null, zs), zmin = Math.min.apply(null, zs);
    var wz = weg.map(function(s){ return s.z; }), wmax = Math.max.apply(null, wz), wmin = Math.min.apply(null, wz);
    weg.forEach(function(s){ s.z = op.t === 'berg' ? zmin - 1 - (s.z - wmin) : zmax + 1 + (wmax - s.z); });
    return neu.concat(weg);
  }
  /* Darf dieses Stück bei diesem Schritt mitgefaltet werden? (nur ein Bereich des Blatts oder nur ein bestimmter Lappen) */
  function waehlbar(s, op){ return (!op.nur || innen(op.nur, schwer(s.poly))) && (!op.nurLappen || s.lappen === op.nurLappen); }
  function schwer(poly){ var x = 0, y = 0; poly.forEach(function(p){ x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; }
  /* alle Zustände eines Modells: [Anfang, nach Schritt 1, …]; ein Schritt kann mehrere Faltungen enthalten (op.folge) */
  function falten(modell){
    var S = start(), l = [S];
    modell.schritte.forEach(function(sch){ (sch.folge || [sch]).forEach(function(op){ S = falte(S, op); }); l.push(S); });
    return l;
  }
  function rahmen(stuecke){
    var pts = [].concat.apply([], stuecke.map(jetzt)), xs = pts.map(function(p){ return p[0]; }), ys = pts.map(function(p){ return p[1]; });
    return { x0:Math.min.apply(null, xs), y0:Math.min.apply(null, ys), x1:Math.max.apply(null, xs), y1:Math.max.apply(null, ys) };
  }
  /* Was liegt am Schluss an der Stelle x oben? (Stück mit grösster Höhe, das x enthält) */
  function obenBei(stuecke, x){
    var best = null;
    stuecke.forEach(function(s){ if ((!best || s.z > best.z) && innen(jetzt(s), x)) best = s; });
    return best;
  }

  /* ---------- Modelle ----------
     Linien in der jetzigen Lage. «lesefeld»: Rechteck im fertigen Modell (Ansicht wie gezeichnet), in dem die Botschaft steht. */
  var ECKEN_ZUR_MITTE = [
    { p:[0.5, 0], q:[0, 0.5], weg:[0, 0], t:'tal' }, { p:[0.5, 0], q:[1, 0.5], weg:[1, 0], t:'tal' },
    { p:[1, 0.5], q:[0.5, 1], weg:[1, 1], t:'tal' }, { p:[0, 0.5], q:[0.5, 1], weg:[0, 1], t:'tal' }];
  var MODELLE = {
    himmel:{
      schritte:[
        { folge:ECKEN_ZUR_MITTE, text:'ecken' },
        { umdrehen:true, text:'umdrehen' },
        { folge:[{ p:[0, 0.25], q:[1, 0.25], weg:[0.5, 0], t:'tal' }, { p:[0.75, 0], q:[0.75, 1], weg:[1, 0.5], t:'tal' },
          { p:[0, 0.75], q:[1, 0.75], weg:[0.5, 1], t:'tal' }, { p:[0.25, 0], q:[0.25, 1], weg:[0, 0.5], t:'tal' }], text:'ecken' },
        { umdrehen:true, text:'umdrehenLesen' }
      ],
      lesefeld:[0.27, 0.27, 0.73, 0.73],
      schluss:'himmel'
    },
    stern:{
      // Grundform wie Himmel und Hölle, dann die vier Spitzen in der Mitte nach aussen klappen → achtzackiger Stern
      schritte:[
        { folge:ECKEN_ZUR_MITTE, text:'ecken' },
        { umdrehen:true, text:'umdrehen' },
        { folge:[{ p:[0, 0.25], q:[1, 0.25], weg:[0.5, 0], t:'tal', lappen:'o' }, { p:[0.75, 0], q:[0.75, 1], weg:[1, 0.5], t:'tal', lappen:'r' },
          { p:[0, 0.75], q:[1, 0.75], weg:[0.5, 1], t:'tal', lappen:'u' }, { p:[0.25, 0], q:[0.25, 1], weg:[0, 0.5], t:'tal', lappen:'l' }], text:'ecken' },
        { folge:[{ p:[0.2, 0.323], q:[0.8, 0.323], weg:[0.5, 0.5], t:'tal', nurLappen:'o' }, { p:[0.677, 0.2], q:[0.677, 0.8], weg:[0.5, 0.5], t:'tal', nurLappen:'r' },
          { p:[0.2, 0.677], q:[0.8, 0.677], weg:[0.5, 0.5], t:'tal', nurLappen:'u' }, { p:[0.323, 0.2], q:[0.323, 0.8], weg:[0.5, 0.5], t:'tal', nurLappen:'l' }], text:'spitzenRaus' },
        { umdrehen:true, text:'umdrehenLesen' }
      ],
      lesefeld:[0.27, 0.27, 0.73, 0.73]
    },
    boot:{
      // vier Ecken zur Mitte (das Quadrat liegt jetzt übers Eck), halbieren, nur die vordere Hälfte als Segel wieder hochklappen,
      // zum Schluss die untere Spitze des Rumpfs hochfalten
      schritte:[
        { folge:ECKEN_ZUR_MITTE, text:'ecken' },
        { p:[-0.1, 0.5], q:[1.1, 0.5], weg:[0.5, 0], t:'tal', lappen:'vorne', text:'halbieren' },
        { p:[-0.1, 0.656], q:[1.1, 0.656], weg:[0.5, 0.95], t:'tal', nurLappen:'vorne', text:'segel' },
        { p:[-0.1, 0.854], q:[1.1, 0.854], weg:[0.5, 0.97], t:'tal', text:'rumpf' }
      ],
      lesefeld:[0.34, 0.48, 0.66, 0.84]
    }
  };
  return { abb:abb, mal:mal, invers:invers, det:det, spiegel:spiegel, schneide:schneide, flaeche:flaeche, innen:innen, jetzt:jetzt, start:start, falte:falte, falten:falten, rahmen:rahmen, obenBei:obenBei, MODELLE:MODELLE, ECKEN_ZUR_MITTE:ECKEN_ZUR_MITTE, waehlbar:waehlbar };
})();
/* KERN-ENDE */

/* ---------- Plan: Figur falten, Botschaft im Lesefeld verteilen, Faltlinien sammeln ---------- */
var VOR = 0.62, ZEILE = 1.28;
function textLayout(woerter, W, H){
  var best = null, alle = woerter.join(' ').length;
  for (var n = 1; n <= 8; n++){
    var ziel = Math.ceil(alle / n), zeilen;
    for (;;){
      zeilen = []; var z = '';
      woerter.forEach(function(w){ if (!z) z = w; else if ((z + ' ' + w).length <= ziel) z += ' ' + w; else { zeilen.push(z); z = w; } });
      if (z) zeilen.push(z);
      if (zeilen.length <= n) break;
      ziel++;
    }
    var lang = Math.max.apply(null, zeilen.map(function(z){ return Array.from(z).length; }));
    var fs = Math.min(W * 0.94 / (lang * VOR), H * 0.92 / (zeilen.length * ZEILE));
    if (!best || fs > best.fs + 1e-9) best = { fs:fs, zeilen:zeilen };
  }
  return best;
}
function planen(form, woerter, seed){
  var m = Figuren.MODELLE[form], zust = [Figuren.start()], falz = [], S = zust[0];
  m.schritte.forEach(function(sch){
    (sch.folge || [sch]).forEach(function(op){
      if (op.p){
        // Faltlinie: auf jedem Stück, das sie schneidet, ein Stück Knick (Blattkoordinaten)
        S.forEach(function(st){
          if (!Figuren.waehlbar(st, op)) return;
          var J = Figuren.jetzt(st), a = Figuren.schneide(J, op.p, op.q, 1), b = Figuren.schneide(J, op.p, op.q, -1);
          if (a.length < 3 || b.length < 3 || Figuren.flaeche(a) < 1e-9 || Figuren.flaeche(b) < 1e-9) return;
          var auf = a.filter(function(p){ return Math.abs((op.q[0] - op.p[0]) * (p[1] - op.p[1]) - (op.q[1] - op.p[1]) * (p[0] - op.p[0])) < 1e-7; });
          if (auf.length >= 2){ var inv = Figuren.invers(st.M); falz.push([Figuren.abb(inv, auf[0]), Figuren.abb(inv, auf[auf.length - 1])]); }
        });
      }
      S = Figuren.falte(S, op);
    });
    zust.push(S);
  });
  var ende = zust[zust.length - 1], L = m.lesefeld, W = L[2] - L[0], H = L[3] - L[1];
  var lay = textLayout(woerter, W * 10, H * 10), fs = lay.fs / 10, zeichen = [];
  lay.zeilen.forEach(function(z, k){
    var y = L[1] + H / 2 + (k - (lay.zeilen.length - 1) / 2) * ZEILE * fs, a = Array.from(z), x0 = L[0] + (W - a.length * VOR * fs) / 2;
    a.forEach(function(c, q){ if (c !== ' ') zeichen.push({ c:c, x:x0 + (q + 0.5) * VOR * fs, y:y }); });
  });
  // welche Seiten am Schluss oben liegen (sichtbare Stücke)
  var sichtbar = { v:false, r:false };
  ende.forEach(function(st){ if (sichtbarerTeil(ende, st)) sichtbar[Figuren.det(st.M) > 0 ? 'v' : 'r'] = true; });
  return { form:form, modell:m, zust:zust, ende:ende, falz:falz, fs:fs, zeichen:zeichen, zeilen:lay.zeilen, beide:sichtbar.v && sichtbar.r, nurRueck:!sichtbar.v, seed:seed };
}
function mitte(poly){ var x = 0, y = 0; poly.forEach(function(p){ x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; }
/* Liegt ein Teil des Stücks am Schluss oben? (grob: ein Probepunkt im Stück, an dem es das oberste ist) */
function sichtbarerTeil(ende, st){
  var J = Figuren.jetzt(st), c = mitte(J), proben = [c].concat(J.map(function(p){ return [p[0] * 0.7 + c[0] * 0.3, p[1] * 0.7 + c[1] * 0.3]; }));
  return proben.some(function(x){ return Figuren.obenBei(ende, x) === st; });
}

/* ---------- Zeichnen ---------- */
var TINTE = '#1C2530', RUECK = '#E3F0FA';
function f1(x){ return (Math.round(x * 100) / 100).toString(); }
function pts(poly, T){ return poly.map(function(p){ var q = T ? Figuren.abb(T, p) : p; return f1(q[0]) + ',' + f1(q[1]); }).join(' '); }
function matrix(T){ return 'matrix(' + T.map(f1).join(' ') + ')'; }
/* Füllbuchstaben in einem Stück: Zeilen in zufälliger Richtung (wie die Stücke der Botschaft), gleiche Grösse */
function fueller(P, rnd, B, vorrat){
  var fs = P.fs * B, adv = VOR * fs, zh = ZEILE * fs, t = '', dreh = Math.floor(rnd() * 8) * 45;
  for (var y = -B; y < 2 * B; y += zh) for (var x = -B + rnd() * adv; x < 2 * B; x += adv){
    if (rnd() < 0.12) continue;
    t += '<text x="' + f1(x) + '" y="' + f1(y) + '">' + esc(vorrat[Math.floor(rnd() * vorrat.length)]) + '</text>';
  }
  return '<g transform="rotate(' + dreh + ' ' + f1(B / 2) + ' ' + f1(B / 2) + ')">' + t + '</g>';
}
/* Botschaft im fertigen Modell (Koordinaten des Modells × B) */
function botschaft(P, B){
  return P.zeichen.map(function(z){ return '<text x="' + f1(z.x * B) + '" y="' + f1(z.y * B) + '">' + esc(z.c) + '</text>'; }).join('');
}
function schrift(P, B, inhalt){ return '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="' + f1(P.fs * B) + '" fill="' + TINTE + '" text-anchor="middle" dominant-baseline="central">' + inhalt + '</g>'; }
/* Das Faltblatt (Quadrat, B Pixel) – Seite 'v' oder 'r' (Rückseite seitenverkehrt, wie beim Wenden an der langen Kante).
   Jedes Stück zeigt auf seiner Seite, die am Schluss oben liegt, sein Stück der Botschaft – nur dort, wo es dann wirklich zu
   sehen ist (Maske); sonst Füllbuchstaben. Gestrichelt die Faltlinien. */
function blattSvg(P, seite, B, o){
  o = o || {};
  var id = 'ff' + (o.id || '') + seite, t = '<defs>', inhalt = '', rnd = zufall(P.seed + (seite === 'v' ? 11 : 29)), vorrat = o.vorrat;
  var SP = seite === 'r' ? [-B, 0, 0, B, B, 0] : [B, 0, 0, B, 0, 0];   // Blatt (0…1) → Seite in Pixeln
  P.ende.forEach(function(st, i){
    var oben = (Figuren.det(st.M) > 0 ? 'v' : 'r') === seite, ziel = Figuren.mal(SP, Figuren.invers(st.M));   // Modell → Seite
    t += '<clipPath id="' + id + 'c' + i + '"><polygon points="' + pts(st.poly, SP) + '"/></clipPath>';
    var fuell = fueller(P, rnd, B, vorrat);
    if (!oben){ inhalt += '<g clip-path="url(#' + id + 'c' + i + ')">' + schrift(P, B, fuell) + '</g>'; return; }
    // was am Schluss darüber liegt: Stücke mit grösserer Höhe, in die Lage dieses Stücks auf der Seite gebracht
    var drueber = P.ende.filter(function(q){ return q.z > st.z; }).map(function(q){ return '<polygon points="' + pts(Figuren.jetzt(q), ziel) + '" fill="black"/>'; }).join('');
    t += '<mask id="' + id + 'm' + i + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + B + '" height="' + B + '"><rect width="' + B + '" height="' + B + '" fill="white"/>' + drueber + '</mask>';
    t += '<mask id="' + id + 'n' + i + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + B + '" height="' + B + '"><rect width="' + B + '" height="' + B + '" fill="black"/>' + drueber.replace(/fill="black"/g, 'fill="white"') + '</mask>';
    inhalt += '<g clip-path="url(#' + id + 'c' + i + ')"><g mask="url(#' + id + 'm' + i + ')">' + (o.marke ? '<polygon points="' + pts(st.poly, SP) + '" fill="#FFF3B0"/>' : '') +
      '<g transform="' + matrix(ziel) + '">' + schrift(P, 1, botschaft(P, 1)) + '</g></g><g mask="url(#' + id + 'n' + i + ')">' + schrift(P, B, fuell) + '</g></g>';
  });
  t += '</defs>';
  var grund = seite === 'r' ? '<rect width="' + B + '" height="' + B + '" fill="' + RUECK + '"/>' : '';
  var falz = P.falz.map(function(l){ var a = Figuren.abb(SP, l[0]), b = Figuren.abb(SP, l[1]); return 'M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]); }).join('');
  var f = o.massstab || 1;
  return '<svg class="ft-gitter" width="' + f1(B * f) + '" height="' + f1(B * f) + '" viewBox="0 0 ' + B + ' ' + B + '">' + t + grund + inhalt +
    '<path d="' + falz + '" fill="none" stroke="#8E99A6" stroke-width="' + (o.klein ? 0.8 : 1.1) + '" stroke-dasharray="' + (o.klein ? '3 2' : '6 4') + '"/>' +
    '<rect x="0.8" y="0.8" width="' + f1(B - 1.6) + '" height="' + f1(B - 1.6) + '" fill="none" stroke="' + TINTE + '" stroke-width="1.6"/></svg>';
}
/* Anleitungsbild: Zustand vor Schritt k (k = Anzahl Schritte: fertiges Modell). mitText: die Botschaft auf dem fertigen Modell. */
function schrittSvg(P, k, groesse, o){
  o = o || {};
  var S = P.zust[k], sch = P.modell.schritte[k], r = Figuren.rahmen(S), pad = 0.12, B = groesse, s = B / Math.max(r.x1 - r.x0 + 2 * pad, r.y1 - r.y0 + 2 * pad);
  var T = [s, 0, 0, s, (pad - r.x0) * s, (pad - r.y0) * s], H = (r.y1 - r.y0 + 2 * pad) * s, t = '', farbe = { v:'#FFFFFF', r:RUECK };
  S.slice().sort(function(a, b){ return a.z - b.z; }).forEach(function(st, i){
    var J = Figuren.jetzt(st), sv = Figuren.det(st.M) > 0 ? 'v' : 'r';
    t += '<polygon points="' + pts(J, T) + '" fill="' + farbe[sv] + '" stroke="#5B6675" stroke-width="0.9" stroke-linejoin="round"/>';
  });
  if (o.mitText){
    // Botschaft nur dort, wo das oberste Stück liegt – über alle Stücke gezeichnet, am Umriss abgeschnitten
    t += '<defs><clipPath id="ffa' + (o.id || '') + '">' + S.map(function(st){ return '<polygon points="' + pts(Figuren.jetzt(st), T) + '"/>'; }).join('') + '</clipPath></defs>' +
      '<g clip-path="url(#ffa' + (o.id || '') + ')"><g transform="' + matrix(T) + '">' + schrift(P, 1, botschaft(P, 1)) + '</g></g>';
  }
  if (sch && !o.mitText) (sch.folge || [sch]).forEach(function(op){
    if (!op.p) return;
    var d = [op.q[0] - op.p[0], op.q[1] - op.p[1]], l = Math.hypot(d[0], d[1]), u = [d[0] / l, d[1] / l];
    // Linie über das ganze Päckchen (bzw. den Lappen) verlängern
    var a = Figuren.abb(T, [op.p[0] - u[0] * 0.08, op.p[1] - u[1] * 0.08]), b = Figuren.abb(T, [op.q[0] + u[0] * 0.08, op.q[1] + u[1] * 0.08]);
    t += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#D32F2F" stroke-width="2" stroke-dasharray="' + (op.t === 'berg' ? '9 3 2 3' : '7 4') + '"/>';
    // gefalteter Teil gelb, Pfeil von seiner Mitte zum Spiegelbild
    var teile = [];
    S.forEach(function(st){
      if (!Figuren.waehlbar(st, op)) return;
      var g = Figuren.schneide(Figuren.jetzt(st), op.p, op.q, (op.q[0] - op.p[0]) * (op.weg[1] - op.p[1]) - (op.q[1] - op.p[1]) * (op.weg[0] - op.p[0]) > 0 ? 1 : -1);
      if (g.length >= 3 && Figuren.flaeche(g) > 1e-9) teile.push(g);
    });
    teile.forEach(function(g){ t += '<polygon points="' + pts(g, T) + '" fill="rgba(255,193,7,.32)"/>'; });
    if (teile.length){
      var c = mitte([].concat.apply([], teile)), z = Figuren.abb(Figuren.spiegel(op.p, op.q), c), m = [(c[0] + z[0]) / 2 + (z[1] - c[1]) * 0.25, (c[1] + z[1]) / 2 - (z[0] - c[0]) * 0.25];
      var A = Figuren.abb(T, c), Z = Figuren.abb(T, z), M = Figuren.abb(T, m), w = Math.atan2(Z[1] - M[1], Z[0] - M[0]), pf = 7;
      t += '<path d="M' + f1(A[0]) + ' ' + f1(A[1]) + 'Q' + f1(M[0]) + ' ' + f1(M[1]) + ' ' + f1(Z[0]) + ' ' + f1(Z[1]) + '" fill="none" stroke="#D32F2F" stroke-width="1.7"/>' +
        '<polygon points="' + f1(Z[0]) + ',' + f1(Z[1]) + ' ' + f1(Z[0] - pf * Math.cos(w - 0.45)) + ',' + f1(Z[1] - pf * Math.sin(w - 0.45)) + ' ' + f1(Z[0] - pf * Math.cos(w + 0.45)) + ',' + f1(Z[1] - pf * Math.sin(w + 0.45)) + '" fill="#D32F2F"/>';
    }
  });
  if (sch && sch.umdrehen){
    var mx = B / 2;
    t += '<path d="M' + f1(mx + 30) + ' ' + f1(H - 8) + 'Q' + f1(mx) + ' ' + f1(H + 6) + ' ' + f1(mx - 30) + ' ' + f1(H - 8) + '" fill="none" stroke="#D32F2F" stroke-width="1.7" stroke-dasharray="4 3"/>';
  }
  return '<svg class="ft-schritt-bild" width="' + f1(B) + '" height="' + f1(H + (sch && sch.umdrehen ? 10 : 0)) + '" viewBox="0 0 ' + f1(B) + ' ' + f1(H + (sch && sch.umdrehen ? 10 : 0)) + '">' + t + '</svg>';
}
function zufall(seed){
  var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
  function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
  for (var i = 0; i < 8; i++) n();
  return n;
}
function esc(t){ return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

window.Faltfiguren = { Figuren:Figuren, planen:planen, blattSvg:blattSvg, schrittSvg:schrittSvg, MODELLE:Figuren.MODELLE };
})();
