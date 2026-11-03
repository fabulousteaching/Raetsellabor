<?php
/* Rätsellabor – Botschaften für QR-Codes
   Eine längere Botschaft passt nicht in einen QR-Code zum Ausmalen (das Raster würde riesig). Darum wird sie hier
   gespeichert, und der QR-Code enthält nur einen kurzen Link auf ihre eigene Seite: …/B/<ID>/

   GET  botschaft.php?status=1      → { bereit }
   POST botschaft.php                ← { titel, text, symbol }   → { id }

   Gespeichert in daten/botschaften/<ID>.json; die Seite B/<ID>/index.php zeigt sie mit botschaft-seite.php an.
   Gleicher Inhalt ergibt die gleiche ID (nichts wird doppelt gespeichert). Schutz: nur Anfragen von dieser Website,
   höchstens PRO_STUNDE neue Botschaften pro Stunde und Netz und PRO_TAG insgesamt. */
declare(strict_types=1);

const MAX_TEXT = 1500;
const MAX_TITEL = 80;
const PRO_STUNDE = 30;
const PRO_TAG = 300;
const SYMBOLE = ['🎉', '⭐', '🏆', '💡', '🔑', '🗺️', '🎁', '❤️'];
const ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ohne 0/O und 1/I, damit IDs gut lesbar sind

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, array $daten): void { http_response_code($status); echo json_encode($daten, JSON_UNESCAPED_UNICODE); exit; }
function kuerzen(string $s, int $n): string { return preg_match('/^.{0,' . $n . '}/us', $s, $m) ? $m[0] : ''; }

$ablage = __DIR__ . '/daten/botschaften';
$seiten = dirname(__DIR__) . '/B';
function ordner(string $o): bool {
  if (!is_dir($o) && !@mkdir($o, 0755, true)) return false;
  $schutz = __DIR__ . '/daten/.htaccess';   // Ablage von aussen sperren (wie in woerter.php)
  if (is_dir(__DIR__ . '/daten') && !is_file($schutz))
    @file_put_contents($schutz, "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
  return is_writable($o);
}

$methode = (string)($_SERVER['REQUEST_METHOD'] ?? '');
if ($methode === 'GET') antwort(200, ['bereit' => ordner($ablage) && ordner($seiten)]);
if ($methode !== 'POST') antwort(405, ['fehler' => 'methode']);

// nur von dieser Website
$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$herkunft = (string)($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
$hh = parse_url($herkunft, PHP_URL_HOST); $hp = parse_url($herkunft, PHP_URL_PORT);
if ($host === '' || strtolower((string)$hh) . ($hp ? ':' . $hp : '') !== $host) antwort(403, ['fehler' => 'herkunft']);

$e = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true);
if (!is_array($e)) antwort(400, ['fehler' => 'eingabe']);
$titel = trim(kuerzen((string)preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)($e['titel'] ?? '')), MAX_TITEL));
$text = str_replace(["\r\n", "\r"], "\n", (string)($e['text'] ?? ''));
$text = trim(kuerzen((string)preg_replace('/[\x00-\x09\x0B-\x1F\x7F]+/u', ' ', $text), MAX_TEXT));
$symbol = in_array((string)($e['symbol'] ?? ''), SYMBOLE, true) ? (string)$e['symbol'] : SYMBOLE[0];
if ($text === '') antwort(400, ['fehler' => 'leer']);
if (!ordner($ablage) || !ordner($seiten)) antwort(500, ['fehler' => 'speichern']);

$inhalt = ['titel' => $titel, 'text' => $text, 'symbol' => $symbol];
$json = json_encode($inhalt, JSON_UNESCAPED_UNICODE);
$hash = sha1($json, true);

// ID aus dem Inhalt; ist sie schon für etwas anderes vergeben, die nächsten Zeichen nehmen
for ($k = 0; $k <= 16; $k++) {
  $id = '';
  for ($i = 0; $i < 4; $i++) $id .= ZEICHEN[ord($hash[$k + $i]) % 32];
  $datei = $ablage . '/' . $id . '.json';
  if (is_file($datei)) {
    $alt = json_decode((string)file_get_contents($datei), true);
    if (is_array($alt) && ($alt['titel'] ?? null) === $titel && ($alt['text'] ?? null) === $text && ($alt['symbol'] ?? null) === $symbol) {
      seite($seiten, $id);
      antwort(200, ['id' => $id]);
    }
    continue;
  }
  // neue Botschaft: Anzahl begrenzen
  $zaehler = __DIR__ . '/daten';
  if (!zaehlen($zaehler . '/botschaft-netz-' . sha1(__FILE__ . '|' . ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . date('YmdH')) . '.txt', PRO_STUNDE)
      || !zaehlen($zaehler . '/botschaft-tag-' . date('Ymd') . '.txt', PRO_TAG)) antwort(429, ['fehler' => 'zuViele']);
  $f = @fopen($datei, 'x');
  if (!$f) continue;
  fwrite($f, (string)json_encode($inhalt + ['erstellt' => date('c')], JSON_UNESCAPED_UNICODE));
  fclose($f);
  if (!seite($seiten, $id)) antwort(500, ['fehler' => 'speichern']);
  antwort(200, ['id' => $id]);
}
antwort(500, ['fehler' => 'speichern']);

/* Kleine Seite B/<ID>/index.php, die die gemeinsame Anzeige lädt (so gelten Gestaltungsänderungen für alle) */
function seite(string $seiten, string $id): bool {
  $o = $seiten . '/' . $id;
  if (is_file($o . '/index.php')) return true;
  if (!is_dir($o) && !@mkdir($o, 0755)) return false;
  return @file_put_contents($o . '/index.php', "<?php\n\$botschaftId = '" . $id . "';\nrequire __DIR__ . '/../../api/botschaft-seite.php';\n") !== false;
}
function zaehlen(string $datei, int $grenze): bool {
  $f = @fopen($datei, 'c+');
  if (!$f) return true;
  flock($f, LOCK_EX);
  $n = (int)stream_get_contents($f);
  $ok = $n < $grenze;
  if ($ok) { ftruncate($f, 0); rewind($f); fwrite($f, (string)($n + 1)); fflush($f); }
  flock($f, LOCK_UN); fclose($f);
  return $ok;
}
