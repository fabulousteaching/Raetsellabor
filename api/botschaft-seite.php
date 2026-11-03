<?php
/* Rätsellabor – Anzeige einer Botschaft (wird von B/<ID>/index.php geladen) */
declare(strict_types=1);
$id = isset($botschaftId) ? (string)$botschaftId : '';
$b = null;
if (preg_match('/^[A-Z0-9]{4}$/', $id)) {
  $f = __DIR__ . '/daten/botschaften/' . $id . '.json';
  if (is_file($f)) $b = json_decode((string)file_get_contents($f), true);
}
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
if (!is_array($b)) http_response_code(404);
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
$titel = is_array($b) ? (string)($b['titel'] ?? '') : '';
$text = is_array($b) ? (string)($b['text'] ?? '') : '';
$symbol = is_array($b) ? (string)($b['symbol'] ?? '🎉') : '🔍';
?><!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title><?= h($titel !== '' ? $titel : (is_array($b) ? 'Botschaft' : 'Botschaft nicht gefunden')) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;600&display=swap">
<style>
  :root{--bg:#F8F5F1;--karte:#fff;--text:#221C18;--muted:#6E655E;--orange:#F28C38;--orange-hell:#F7A25D;--orange-text:#A9490B;color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px max(18px,env(safe-area-inset-left)) 40px;background:var(--bg);color:var(--text);
    font:17px/1.6 Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;overflow-x:hidden}
  main{position:relative;width:min(640px,100%);background:var(--karte);border-radius:22px;box-shadow:0 2px 4px rgba(45,28,12,.05),0 18px 50px rgba(45,28,12,.12);
    padding:clamp(26px,6vw,48px);text-align:center;border-top:8px solid var(--orange)}
  .symbol{font-size:clamp(3.4rem,14vw,5rem);line-height:1;margin:0 0 10px;animation:hops 1.6s ease .2s both}
  h1{font-family:Fredoka,Inter,sans-serif;font-weight:600;font-size:clamp(1.7rem,6vw,2.4rem);line-height:1.15;margin:0 0 14px;color:var(--text)}
  .text{margin:0;font-size:clamp(1.05rem,3.6vw,1.25rem);white-space:pre-wrap;overflow-wrap:anywhere;text-align:left}
  .text.kurz{text-align:center}
  footer{margin-top:22px;text-align:center;color:var(--muted);font-size:.85rem}
  footer a{color:var(--orange-text);font-weight:600;text-decoration:none}
  .konfetti{position:fixed;inset:0;pointer-events:none;overflow:hidden}
  .konfetti i{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;opacity:.9;animation:fallen 3.2s linear forwards}
  @keyframes fallen{to{transform:translateY(110vh) rotate(540deg)}}
  @keyframes hops{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
  @media (prefers-reduced-motion: reduce){.konfetti{display:none}.symbol{animation:none}}
</style>
</head>
<body>
<?php if (is_array($b)): ?>
<div class="konfetti" aria-hidden="true"><?php
  $farben = ['#F28C38', '#FAD852', '#68D77E', '#63C2EA', '#EC4157', '#F7A25D'];
  for ($i = 0; $i < 28; $i++) echo '<i style="left:' . (($i * 37) % 100) . '%;background:' . $farben[$i % 6] . ';animation-delay:' . (($i * 0.13) % 1.6) . 's;animation-duration:' . (2.6 + ($i % 5) * 0.3) . 's"></i>';
?></div>
<main>
  <p class="symbol" aria-hidden="true"><?= h($symbol) ?></p>
  <?php if ($titel !== ''): ?><h1><?= h($titel) ?></h1><?php endif; ?>
  <p class="text<?= mb_strlen($text) < 90 && strpos($text, "\n") === false ? ' kurz' : '' ?>"><?= h($text) ?></p>
  <footer>Erstellt mit dem <a href="../../">Rätsellabor</a></footer>
</main>
<?php else: ?>
<main>
  <p class="symbol" aria-hidden="true">🔍</p>
  <h1>Diese Botschaft gibt es nicht</h1>
  <p class="text kurz">Vielleicht wurde der Code nicht ganz richtig ausgemalt? Prüfe die Felder und scanne nochmals.</p>
  <footer><a href="../../">Zum Rätsellabor</a></footer>
</main>
<?php endif; ?>
</body>
</html>
