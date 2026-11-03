<?php
/* Rätsellabor – Puzzles für QR-Codes
   Der Generator «Puzzle» speichert hier ein Puzzle (fertiges Bild oder eigenes Foto, Anzahl Teile), damit ein QR-Code
   direkt dazu führt: …/P/<ID>/

   GET  puzzle.php?status=1   → { bereit }
   POST puzzle.php            ← { teile, vorlage, szene }  oder  { teile, vorlage, bild: 'data:image/jpeg;base64,…' }
                              → { id }

   Gespeichert in daten/puzzles/<ID>.json, ein eigenes Bild als P/<ID>/bild.jpg; die Seite P/<ID>/index.php zeigt das
   Puzzle mit puzzle-seite.php. Gleicher Inhalt ergibt die gleiche ID (nichts wird doppelt gespeichert). Schutz: nur
   Anfragen von dieser Website, nur echte JPEG-Bilder (mit GD neu gespeichert, damit nichts anderes mitkommt), höchstens
   PRO_STUNDE neue Puzzles pro Stunde und Netz und PRO_TAG insgesamt. */
declare(strict_types=1);
ini_set('display_errors', '0');   // PHP-Hinweise nie auf der Seite zeigen (stehen weiter im Fehlerprotokoll des Servers)

const TEILE = [12, 24, 48, 96, 150];
const SZENEN = ['bauernhof', 'meer', 'weltall', 'dschungel', 'winter', 'stadt', 'savanne', 'strand', 'markt', 'suesses'];
const MAX_EINGABE = 4000000;   // Bytes der ganzen Anfrage (Bild als Base64)
const MAX_BILD = 2800000;      // Bytes des JPEG-Bildes
const MAX_SEITE = 2400;        // Pixel (der Generator verkleinert auf 1600)
const PRO_STUNDE = 20;
const PRO_TAG = 200;
const ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ohne 0/O und 1/I, damit IDs gut lesbar sind

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, array $daten): void { http_response_code($status); echo json_encode($daten, JSON_UNESCAPED_UNICODE); exit; }

$ablage = __DIR__ . '/daten/puzzles';
$seiten = dirname(__DIR__) . '/P';
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

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_EINGABE) antwort(413, ['fehler' => 'zuGross']);
$roh = (string)file_get_contents('php://input', false, null, 0, MAX_EINGABE + 1);
if (strlen($roh) > MAX_EINGABE) antwort(413, ['fehler' => 'zuGross']);
$e = json_decode($roh, true);
unset($roh);
if (!is_array($e)) antwort(400, ['fehler' => 'eingabe']);

$teile = (int)($e['teile'] ?? 0);
if (!in_array($teile, TEILE, true)) antwort(400, ['fehler' => 'teile']);
$vorlage = !empty($e['vorlage']);
$inhalt = ['teile' => $teile, 'vorlage' => $vorlage];
$jpg = null;

if (isset($e['bild'])) {
  if (!is_string($e['bild']) || !preg_match('#^data:image/jpeg;base64,([A-Za-z0-9+/]+={0,2})$#', $e['bild'], $m)) antwort(400, ['fehler' => 'bild']);
  $jpg = base64_decode($m[1], true);
  unset($e, $m);
  if ($jpg === false || $jpg === '') antwort(400, ['fehler' => 'bild']);
  if (strlen($jpg) > MAX_BILD) antwort(413, ['fehler' => 'zuGross']);
  $info = @getimagesizefromstring($jpg);
  if (!$info || ($info[2] ?? 0) !== IMAGETYPE_JPEG) antwort(400, ['fehler' => 'bild']);
  $b = (int)$info[0]; $h = (int)$info[1];
  if ($b < 40 || $h < 40 || $b > MAX_SEITE || $h > MAX_SEITE) antwort(400, ['fehler' => 'bild']);
  $inhalt += ['bild' => sha1($jpg), 'breite' => $b, 'hoehe' => $h];
} else {
  $szene = (string)($e['szene'] ?? '');
  if (!in_array($szene, SZENEN, true)) antwort(400, ['fehler' => 'szene']);
  $inhalt['szene'] = $szene;
}
if (!ordner($ablage) || !ordner($seiten)) antwort(500, ['fehler' => 'speichern']);

$hash = sha1((string)json_encode($inhalt), true);

// ID aus dem Inhalt; ist sie schon für etwas anderes vergeben, die nächsten Zeichen nehmen
for ($k = 0; $k <= 16; $k++) {
  $id = '';
  for ($i = 0; $i < 4; $i++) $id .= ZEICHEN[ord($hash[$k + $i]) % 32];
  $datei = $ablage . '/' . $id . '.json';
  if (is_file($datei)) {
    $alt = json_decode((string)file_get_contents($datei), true);
    if (is_array($alt) && gleich($alt, $inhalt)) {
      if (seite($seiten, $id) && (!isset($inhalt['bild']) || is_file($seiten . '/' . $id . '/bild.jpg') || bildSpeichern($seiten, $id, (string)$jpg)))
        antwort(200, ['id' => $id]);
      antwort(500, ['fehler' => 'speichern']);
    }
    continue;
  }
  // neues Puzzle: Anzahl begrenzen
  $zaehler = __DIR__ . '/daten';
  if (!zaehlen($zaehler . '/puzzle-netz-' . sha1(__FILE__ . '|' . ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . date('YmdH')) . '.txt', PRO_STUNDE)
      || !zaehlen($zaehler . '/puzzle-tag-' . date('Ymd') . '.txt', PRO_TAG)) antwort(429, ['fehler' => 'zuViele']);
  $f = @fopen($datei, 'x');
  if (!$f) continue;
  fwrite($f, (string)json_encode($inhalt + ['erstellt' => date('c')], JSON_UNESCAPED_UNICODE));
  fclose($f);
  if (!seite($seiten, $id) || ($jpg !== null && !bildSpeichern($seiten, $id, $jpg))) { @unlink($datei); antwort(500, ['fehler' => 'speichern']); }
  antwort(200, ['id' => $id]);
}
antwort(500, ['fehler' => 'speichern']);

function gleich(array $a, array $b): bool {
  foreach (['teile', 'vorlage', 'szene', 'bild'] as $k) if (($a[$k] ?? null) !== ($b[$k] ?? null)) return false;
  return true;
}
/* Kleine Seite P/<ID>/index.php, die die gemeinsame Anzeige lädt (so gelten Änderungen für alle Puzzles) */
function seite(string $seiten, string $id): bool {
  $o = $seiten . '/' . $id;
  if (is_file($o . '/index.php')) return true;
  if (!is_dir($o) && !@mkdir($o, 0755)) return false;
  return @file_put_contents($o . '/index.php', "<?php\n\$puzzleId = '" . $id . "';\nrequire __DIR__ . '/../../api/puzzle-seite.php';\n") !== false;
}
/* Bild neu speichern: mit GD neu kodiert bleibt nur das Bild übrig (keine Zusatzdaten, keine Ortsangaben aus dem Foto) */
function bildSpeichern(string $seiten, string $id, string $jpg): bool {
  if (function_exists('imagecreatefromstring') && function_exists('imagejpeg')) {
    $im = @imagecreatefromstring($jpg);
    if ($im === false) return false;
    ob_start(); $ok = imagejpeg($im, null, 86); $neu = (string)ob_get_clean();
    imagedestroy($im);
    if ($ok && $neu !== '') $jpg = $neu;
  }
  return @file_put_contents($seiten . '/' . $id . '/bild.jpg', $jpg, LOCK_EX) !== false;
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
