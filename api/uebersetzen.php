<?php
/* Rätsellabor – Wörter übersetzen (Triomino: Deutsch ↔ Englisch / Französisch), vom eigenen Server aus
   Gleiche KI und gleicher Schlüssel wie bei den Wortvorschlägen (woerter.php): Mistral, Schlüssel in geheim.php
   (entsteht beim Hochladen aus dem GitHub-Secret KI_SCHLUESSEL, steht nie im Repository).

   GET  uebersetzen.php       → { bereit, anbieter }
   POST uebersetzen.php       ← { sprache:'englisch'|'franzoesisch', richtung:'hin'|'zurueck', woerter:['Hund', …] }
                                 hin = aus dem Deutschen in die Fremdsprache, zurueck = aus der Fremdsprache ins Deutsche
                              → { uebersetzungen:{ 'Hund':'dog', … }, anbieter }  oder  { fehler } mit passendem HTTP-Status

   Schutz wie bei woerter.php: nur Anfragen von dieser Website; höchstens PRO_STUNDE Anfragen pro Stunde und Netz und
   PRO_TAG insgesamt; schon übersetzte Wörter kommen aus dem Zwischenspeicher (Ordner daten/) und zählen nicht. */
declare(strict_types=1);
ini_set('display_errors', '0');

const PRO_STUNDE = 120;
const PRO_TAG = 2000;
const SPEICHER_TAGE = 30;
const HOECHSTENS = 40;   // Wörter pro Anfrage

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, array $daten): void {
  http_response_code($status);
  echo json_encode($daten, JSON_UNESCAPED_UNICODE);
  exit;
}
function klein(string $s): string { return mb_strtolower(trim($s), 'UTF-8'); }

/* ---------- Einstellungen ---------- */
$geheim = is_file(__DIR__ . '/geheim.php') ? (include __DIR__ . '/geheim.php') : [];
if (!is_array($geheim)) $geheim = [];
$schluessel = trim((string)($geheim['schluessel'] ?? ''));
$ki = [
  'name'   => 'Mistral',
  'url'    => !empty($geheim['url']) ? (string)$geheim['url'] : 'https://api.mistral.ai/v1/chat/completions',
  'modell' => !empty($geheim['modell']) ? (string)$geheim['modell'] : 'mistral-small-latest',
];

$methode = (string)($_SERVER['REQUEST_METHOD'] ?? '');
if ($methode === 'GET') antwort(200, ['bereit' => $schluessel !== '', 'anbieter' => $schluessel !== '' ? $ki['name'] : null]);
if ($methode !== 'POST') antwort(405, ['fehler' => 'methode']);
if ($schluessel === '') antwort(503, ['fehler' => 'nichtEingerichtet']);

/* ---------- Nur Anfragen von dieser Website ---------- */
$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$herkunft = (string)($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
$hh = parse_url($herkunft, PHP_URL_HOST);
$hp = parse_url($herkunft, PHP_URL_PORT);
if ($host === '' || strtolower((string)$hh) . ($hp ? ':' . $hp : '') !== $host) antwort(403, ['fehler' => 'herkunft']);

/* ---------- Eingabe ---------- */
$e = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true);
if (!is_array($e)) antwort(400, ['fehler' => 'eingabe']);
$SPRACHEN = ['englisch' => 'Englisch (britisches Englisch)', 'franzoesisch' => 'Französisch'];
$sprache = (string)($e['sprache'] ?? '');
$richtung = (string)($e['richtung'] ?? 'hin');
if (!isset($SPRACHEN[$sprache]) || !in_array($richtung, ['hin', 'zurueck'], true)) antwort(400, ['fehler' => 'eingabe']);
$woerter = [];
foreach ((array)($e['woerter'] ?? []) as $w) {
  $w = trim((string)preg_replace('/\s+/u', ' ', (string)$w));
  if ($w !== '' && mb_strlen($w, 'UTF-8') <= 60 && preg_match("/^[\\p{L}\\p{M}\\p{N} '’.,!?()\\-]+$/u", $w)) $woerter[$w] = true;
}
$woerter = array_slice(array_keys($woerter), 0, HOECHSTENS);
if (!$woerter) antwort(400, ['fehler' => 'eingabe']);

/* ---------- Ablage: Zwischenspeicher je Wort, Zähler ---------- */
$ordner = __DIR__ . '/daten';
if (!is_dir($ordner)) {
  @mkdir($ordner, 0700, true);
  @file_put_contents($ordner . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
}
function speicherDatei(string $ordner, string $sprache, string $richtung, string $wort): string {
  return $ordner . '/uebersetzung-' . sha1($sprache . '|' . $richtung . '|' . klein($wort)) . '.json';
}
$fertig = []; $offen = [];
foreach ($woerter as $w) {
  $d = speicherDatei($ordner, $sprache, $richtung, $w);
  $alt = is_file($d) && time() - (int)filemtime($d) < SPEICHER_TAGE * 86400 ? json_decode((string)file_get_contents($d), true) : null;
  // Gross-/Kleinschreibung des Originals zählt (z. B. Artikel), darum nur bei gleichem Wort aus dem Speicher
  if (is_array($alt) && ($alt['von'] ?? '') === $w && is_string($alt['nach'] ?? null)) $fertig[$w] = $alt['nach']; else $offen[] = $w;
}
if (!$offen) antwort(200, ['uebersetzungen' => $fertig, 'anbieter' => $ki['name'], 'gespeichert' => true]);

function zaehlen(string $datei, int $grenze): bool {
  $f = @fopen($datei, 'c+');
  if (!$f) return true;
  flock($f, LOCK_EX);
  $n = (int)stream_get_contents($f);
  $ok = $n < $grenze;
  if ($ok) { ftruncate($f, 0); rewind($f); fwrite($f, (string)($n + 1)); fflush($f); }
  flock($f, LOCK_UN);
  fclose($f);
  return $ok;
}
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
if (!zaehlen($ordner . '/netz-ue-' . sha1(hash('sha256', $schluessel) . '|' . $ip . '|' . date('YmdH')) . '.txt', PRO_STUNDE)
    || !zaehlen($ordner . '/tag-ue-' . date('Ymd') . '.txt', PRO_TAG)) antwort(429, ['fehler' => 'zuViele']);

/* ---------- KI fragen ---------- */
$fremd = $SPRACHEN[$sprache];
$von = $richtung === 'hin' ? 'Deutsch' : $fremd;
$nach = $richtung === 'hin' ? $fremd : 'Deutsch';
$regeln = [
  'Nimm die gebräuchlichste Übersetzung, wie sie in einem Schulwörterbuch für Kinder steht; bei mehreren Bedeutungen die häufigste.',
  'Gleiche Form wie das Original: Nomen bleiben Nomen (Einzahl oder Mehrzahl wie im Original), Verben in der Grundform, Adjektive in der Grundform. Ausdrücke und kurze Sätze als Ganzes übersetzen.',
  'Hat das Original einen Artikel, übersetze mit Artikel; sonst ohne.',
];
if ($nach === $SPRACHEN['franzoesisch']) $regeln[] = 'Französische Nomen immer mit bestimmtem Artikel (le, la, l\', les). Akzente korrekt setzen.';
if ($nach === 'Deutsch') $regeln[] = 'Deutsche Nomen mit grossem Anfangsbuchstaben; Schweizer Rechtschreibung: ss statt ß.';
if ($nach !== 'Deutsch' && $sprache === 'englisch') $regeln[] = 'Englische Verben ohne «to».';
$prompt = 'Übersetze jedes dieser Wörter von ' . $von . ' nach ' . $nach . ".\nRegeln:\n- " . implode("\n- ", $regeln) . "\n" .
  "Wörter (JSON-Liste): " . json_encode($offen, JSON_UNESCAPED_UNICODE) . "\n" .
  'Antworte nur mit JSON in dieser Form: {"uebersetzungen": [{"von": "…", "nach": "…"}]} – für jedes Wort genau einen Eintrag, «von» genau wie in der Liste.';
$body = [
  'model' => $ki['modell'],
  'messages' => [
    ['role' => 'system', 'content' => 'Du bist ein zuverlässiges Wörterbuch für den Sprachunterricht an Schweizer Schulen (Kinder von 8 bis 14 Jahren). Du antwortest nur mit JSON.'],
    ['role' => 'user', 'content' => $prompt],
  ],
  'response_format' => ['type' => 'json_object'],
  'temperature' => 0.1,
];
function senden(string $url, array $body, string $schluessel): array {
  $json = (string)json_encode($body, JSON_UNESCAPED_UNICODE);
  $kopf = ['Content-Type: application/json', 'Accept: application/json', 'Authorization: Bearer ' . $schluessel];
  if (function_exists('curl_init')) {
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $json, CURLOPT_HTTPHEADER => $kopf,
      CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_CONNECTTIMEOUT => 8]);
    $text = curl_exec($c);
    $status = (int)curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);
    return $text === false ? [0, ''] : [$status, (string)$text];
  }
  $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => implode("\r\n", $kopf), 'content' => $json, 'timeout' => 30, 'ignore_errors' => true]]);
  $text = @file_get_contents($url, false, $ctx);
  $zeilen = function_exists('http_get_last_response_headers') ? (array)http_get_last_response_headers() : ($http_response_header ?? []);
  $status = isset($zeilen[0]) && preg_match('/\s(\d{3})\b/', (string)$zeilen[0], $m) ? (int)$m[1] : 0;
  return [$status, $text === false ? '' : (string)$text];
}
[$status, $text] = senden($ki['url'], $body, $schluessel);
if ($status === 429) { sleep(2); [$status, $text] = senden($ki['url'], $body, $schluessel); }
if ($status === 401 || $status === 403) antwort(502, ['fehler' => 'serverSchluessel']);
if ($status === 402) antwort(502, ['fehler' => 'guthaben']);
if ($status === 429) antwort(429, ['fehler' => 'zuViele']);
if ($status < 200 || $status >= 300) antwort(502, ['fehler' => 'ki']);

/* ---------- Antwort auslesen ---------- */
$j = json_decode($text, true);
$inhalt = is_array($j) ? ($j['choices'][0]['message']['content'] ?? '') : $text;
if (is_array($inhalt)) $inhalt = implode('', array_map(function($t){ return is_array($t) ? (string)($t['text'] ?? '') : (string)$t; }, $inhalt));
$daten = json_decode((string)$inhalt, true);
if (!is_array($daten) && preg_match('/\{[\s\S]*\}/u', (string)$inhalt, $m)) $daten = json_decode($m[0], true);
$liste = is_array($daten) ? ($daten['uebersetzungen'] ?? $daten) : [];
$offenKlein = [];
foreach ($offen as $w) $offenKlein[klein($w)] = $w;
foreach ((array)$liste as $k => $x) {
  // [{von, nach}] oder {wort: übersetzung}
  if (is_array($x)) { $v = (string)($x['von'] ?? ''); $n = (string)($x['nach'] ?? ''); } else { $v = (string)$k; $n = (string)$x; }
  $n = trim(preg_replace('/\s+/u', ' ', $n));
  if ($nach === 'Deutsch') $n = str_replace('ß', 'ss', $n);
  $orig = $offenKlein[klein($v)] ?? null;
  if ($orig === null || $n === '' || mb_strlen($n, 'UTF-8') > 80 || preg_match('/[<>{}\[\]]/u', $n)) continue;
  $fertig[$orig] = $n;
  @file_put_contents(speicherDatei($ordner, $sprache, $richtung, $orig), json_encode(['von' => $orig, 'nach' => $n], JSON_UNESCAPED_UNICODE));
}
if (!$fertig) antwort(502, ['fehler' => 'antwort']);
antwort(200, ['uebersetzungen' => $fertig, 'anbieter' => $ki['name']]);
