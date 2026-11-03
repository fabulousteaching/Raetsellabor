<?php
/* Rätsellabor – Puzzle-Seite (wird von P/<ID>/index.php geladen; dorthin führt der QR-Code aus dem Generator «Puzzle»)
   Das Spiel selbst ist dasselbe wie im Generator: raetsel/puzzle/puzzle-spiel.js */
declare(strict_types=1);
ini_set('display_errors', '0');   // PHP-Hinweise nie auf der Seite zeigen (stehen weiter im Fehlerprotokoll des Servers)
$id = isset($puzzleId) ? (string)$puzzleId : '';
$p = null;
if (preg_match('/^[A-Z0-9]{4}$/', $id)) {
  $f = __DIR__ . '/daten/puzzles/' . $id . '.json';
  if (is_file($f)) $p = json_decode((string)file_get_contents($f), true);
}
// Pfad der Website (meist «/»): aus /P/<ID>/index.php zwei Ordner nach oben
$basis = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/P/X/index.php'), 3)), '/') . '/';
$spiel = __DIR__ . '/../raetsel/puzzle/puzzle-spiel.js';
$daten = null;
if (is_array($p)) {
  $daten = ['teile' => (int)($p['teile'] ?? 24), 'vorlage' => !empty($p['vorlage'])];
  if (isset($p['bild'])) $daten['bild'] = $basis . 'P/' . $id . '/bild.jpg?v=' . substr((string)$p['bild'], 0, 8);
  else $daten['szene'] = (string)($p['szene'] ?? 'bauernhof');
}
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
if (!is_array($p)) http_response_code(404);
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
?><!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F8F5F1">
<title><?= is_array($p) ? 'Puzzle' : 'Puzzle nicht gefunden' ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;600&display=swap">
<style>
  :root{--bg:#F8F5F1;--karte:#fff;--text:#221C18;--muted:#6E655E;--linie:#E7DFD6;--orange:#F28C38;--orange-dunkel:#E0741C;--orange-soft:#FFF1E5;--orange-linie:#F7CBA3;--orange-text:#A9490B;color-scheme:light}
  *{box-sizing:border-box}
  html,body{height:100%}
  body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;overscroll-behavior:none;overflow:hidden}
  .seite{display:flex;flex-direction:column;height:100vh;height:100dvh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
  header{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:10px 14px;background:var(--karte);border-bottom:1px solid var(--linie)}
  h1{font-family:Fredoka,Inter,sans-serif;font-weight:600;font-size:1.35rem;line-height:1.1;margin:0 6px 0 0}
  .status{font-weight:600;color:var(--muted);font-size:.92rem;font-variant-numeric:tabular-nums;margin-right:auto}
  button{font:inherit;font-weight:600;font-size:.9rem;border:1px solid #D9CFC5;border-radius:9px;padding:7px 13px;background:#fff;color:var(--text);cursor:pointer;touch-action:manipulation}
  button:hover{background:#FBF8F5}
  button[aria-pressed="true"]{background:var(--orange-soft);border-color:var(--orange-linie);color:var(--orange-text)}
  button.haupt{background:var(--orange);border-color:var(--orange);color:#221C18}
  button.haupt:hover{background:var(--orange-dunkel)}
  button:focus-visible{outline:2px solid var(--orange-text);outline-offset:2px}
  .spiel{position:relative;flex:1;min-height:0;overflow:hidden;background:radial-gradient(circle at 30% 20%,#F4ECE3,#E6D9CB)}
  .bild-gross{position:absolute;right:10px;top:10px;z-index:2;max-width:min(42%,340px);max-height:42%;border-radius:8px;border:3px solid #fff;box-shadow:0 8px 24px rgba(45,28,12,.25);cursor:pointer;background:#fff}
  .geschafft{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:3;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;
    max-width:calc(100% - 24px);background:#fff;border-radius:16px;padding:12px 18px;box-shadow:0 10px 30px rgba(45,28,12,.25);font-size:1.1rem}
  .geschafft p{margin:0}
  [hidden]{display:none!important}
  .laden{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font-weight:600}
  .konfetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:4}
  .konfetti i{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;opacity:.9;animation:fallen 3.2s linear forwards}
  @keyframes fallen{to{transform:translateY(110vh) rotate(540deg)}}
  @media (max-width:520px){ h1{font-size:1.15rem} button{padding:6px 10px;font-size:.84rem} }
  @media (prefers-reduced-motion: reduce){.konfetti{display:none}}
  /* nicht gefunden */
  .fehlt{min-height:100vh;display:grid;place-items:center;padding:28px 18px;text-align:center}
  .fehlt main{width:min(560px,100%);background:var(--karte);border-radius:22px;padding:clamp(26px,6vw,44px);border-top:8px solid var(--orange);box-shadow:0 18px 50px rgba(45,28,12,.12)}
  .fehlt .symbol{font-size:4rem;line-height:1;margin:0 0 10px}
  .fehlt h1{font-size:clamp(1.5rem,5vw,2rem);margin:0 0 10px}
  .fehlt a{color:var(--orange-text);font-weight:600;text-decoration:none}
</style>
</head>
<body>
<?php if (is_array($daten)): ?>
<div class="seite">
  <header>
    <h1>Puzzle</h1>
    <span class="status" id="status" aria-live="polite"></span>
    <button type="button" id="bildKnopf" aria-pressed="false">Bild ansehen</button>
    <button type="button" id="mischen">Neu mischen</button>
    <button type="button" id="voll">Vollbild</button>
  </header>
  <div class="spiel" id="spiel">
    <p class="laden" id="laden">Das Puzzle wird geladen …</p>
    <img class="bild-gross" id="bildGross" alt="Das ganze Bild" title="Zum Schliessen antippen" hidden>
    <div class="geschafft" id="geschafft" hidden></div>
  </div>
</div>
<script src="<?= h($basis . 'raetsel/puzzle/puzzle-spiel.js?v=' . (is_file($spiel) ? filemtime($spiel) : 0)) ?>"></script>
<script>
(function(){
  'use strict';
  var P = <?= json_encode($daten, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES) ?>;
  var $ = function(i){ return document.getElementById(i); }, spiel = null;
  function zeit(s){ return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function konfetti(){
    var k = document.createElement('div'), f = ['#F28C38', '#FAD852', '#68D77E', '#63C2EA', '#EC4157', '#F7A25D'];
    k.className = 'konfetti'; k.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 34; i++){ var e = document.createElement('i'); e.style.cssText = 'left:' + (i * 37 % 100) + '%;background:' + f[i % 6] + ';animation-delay:' + (i * 0.13 % 1.6).toFixed(2) + 's;animation-duration:' + (2.6 + i % 5 * 0.3).toFixed(1) + 's'; k.appendChild(e); }
    document.body.appendChild(k); setTimeout(function(){ k.remove(); }, 5200);
  }
  function bildZeigen(an){ $('bildGross').hidden = !an; $('bildKnopf').setAttribute('aria-pressed', an ? 'true' : 'false'); }
  function los(bild){
    $('laden').remove();
    var k = document.createElement('canvas'), w = bild.naturalWidth || bild.width, h = bild.naturalHeight || bild.height, f = Math.min(1, 640 / Math.max(w, h));
    k.width = Math.round(w * f); k.height = Math.round(h * f); k.getContext('2d').drawImage(bild, 0, 0, k.width, k.height);
    $('bildGross').src = k.toDataURL('image/jpeg', 0.85);
    spiel = PuzzleSpiel.starte($('spiel'), { bild:bild, teile:P.teile, vorlage:P.vorlage,
      status:function(s){ $('status').textContent = s.fest + ' von ' + s.alle + ' Teilen · ' + zeit(s.sekunden); },
      fertig:function(sek){
        var g = $('geschafft');
        g.innerHTML = '<p>🎉 <b>Geschafft!</b> In ' + zeit(sek) + ' Minuten.</p><button type="button" class="haupt">Nochmals</button>';
        g.hidden = false; konfetti();
        g.querySelector('button').addEventListener('click', function(){ g.hidden = true; spiel.neu(); });
      } });
  }
  $('bildKnopf').addEventListener('click', function(){ if (spiel) bildZeigen($('bildGross').hidden); });
  $('bildGross').addEventListener('click', function(){ bildZeigen(false); });
  $('mischen').addEventListener('click', function(){ if (spiel){ $('geschafft').hidden = true; bildZeigen(false); spiel.neu(); } });
  var voll = $('voll'), wurzel = document.documentElement;
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) voll.hidden = true;
  voll.addEventListener('click', function(){
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (wurzel.requestFullscreen) wurzel.requestFullscreen().catch(function(){});
    else if (wurzel.webkitRequestFullscreen) wurzel.webkitRequestFullscreen();
  });
  if (P.bild){
    var img = new Image();
    img.onload = function(){ los(img); };
    img.onerror = function(){ $('laden').textContent = 'Das Bild konnte nicht geladen werden. Lade die Seite neu.'; };
    img.src = P.bild;
  } else los(PuzzleSpiel.szene(P.szene, 1200, 900));
})();
</script>
<?php else: ?>
<div class="fehlt"><main>
  <p class="symbol" aria-hidden="true">🧩</p>
  <h1>Dieses Puzzle gibt es nicht</h1>
  <p>Prüfe den Link oder scanne den QR-Code nochmals.</p>
  <p><a href="<?= h($basis) ?>">Zum Rätsellabor</a></p>
</main></div>
<?php endif; ?>
</body>
</html>
