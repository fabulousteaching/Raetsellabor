<?php
/* Rätsellabor – Sätze zu einem Codewort (Code-Schloss: Satz im Buchstabenfeld), vom eigenen Server aus
   Gleiche KI und gleicher Schlüssel wie bei den Wortvorschlägen (woerter.php): Mistral, Schlüssel in geheim.php
   (entsteht beim Hochladen aus dem GitHub-Secret KI_SCHLUESSEL, steht nie im Repository).

   GET  saetze.php       → { bereit, anbieter }
   POST saetze.php       ← { wort:'TIGER', max:31 }   (wort: 3–6 Grossbuchstaben, max: höchstens so viele Buchstaben pro Satz)
                         → { saetze:['Die grosse Katze hat Streifen', …], anbieter }  oder  { fehler } mit passendem HTTP-Status

   Die Sätze passen thematisch zum Wort, enthalten seine Buchstaben (so oft, wie das Wort sie braucht), aber nicht das Wort
   selbst. Die Seite prüft das nochmals und zeigt nur Sätze, aus denen sich der Code legen lässt.
   Schutz wie bei woerter.php: nur Anfragen von dieser Website; höchstens PRO_STUNDE Anfragen pro Stunde und Netz und
   PRO_TAG insgesamt; schon gefragte Wörter kommen aus dem Zwischenspeicher (Ordner daten/) und zählen nicht. */
declare(strict_types=1);
ini_set('display_errors', '0');

const PRO_STUNDE = 60;
const PRO_TAG = 1000;
const SPEICHER_TAGE = 30;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, array $daten): void {
  http_response_code($status);
  echo json_encode($daten, JSON_UNESCAPED_UNICODE);
  exit;
}

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
$e = json_decode((string)file_get_contents('php://input', false, null, 0, 2000), true);
if (!is_array($e)) antwort(400, ['fehler' => 'eingabe']);
$wort = mb_strtoupper(trim((string)($e['wort'] ?? '')), 'UTF-8');
$max = (int)($e['max'] ?? 30);
if (!preg_match('/^[A-ZÄÖÜ]{3,6}$/u', $wort) || $max < 12 || $max > 48) antwort(400, ['fehler' => 'eingabe']);

/* ---------- Zwischenspeicher, Zähler ---------- */
$ordner = __DIR__ . '/daten';
if (!is_dir($ordner)) {
  @mkdir($ordner, 0700, true);
  @file_put_contents($ordner . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
}
$datei = $ordner . '/saetze-' . sha1($wort . '|' . $max) . '.json';
if (is_file($datei) && time() - (int)filemtime($datei) < SPEICHER_TAGE * 86400) {
  $alt = json_decode((string)file_get_contents($datei), true);
  if (is_array($alt) && !empty($alt['saetze'])) antwort(200, ['saetze' => $alt['saetze'], 'anbieter' => $ki['name'], 'gespeichert' => true]);
}
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
if (!zaehlen($ordner . '/netz-sa-' . sha1(hash('sha256', $schluessel) . '|' . $ip . '|' . date('YmdH')) . '.txt', PRO_STUNDE)
    || !zaehlen($ordner . '/tag-sa-' . date('Ymd') . '.txt', PRO_TAG)) antwort(429, ['fehler' => 'zuViele']);

/* ---------- KI fragen ---------- */
$anzeige = mb_substr($wort, 0, 1, 'UTF-8') . mb_strtolower(mb_substr($wort, 1, null, 'UTF-8'), 'UTF-8');
$braucht = [];
foreach (preg_split('//u', $wort, -1, PREG_SPLIT_NO_EMPTY) as $c) $braucht[$c] = ($braucht[$c] ?? 0) + 1;
$liste = [];
foreach ($braucht as $c => $n) $liste[] = $c . ($n > 1 ? ' (' . $n . '-mal)' : '');
$prompt = 'Schreibe 10 kurze, einfache deutsche Sätze für Kinder von 8 bis 12 Jahren, die thematisch zum Wort «' . $anzeige . "» passen.\nRegeln:\n" .
  "- Schweizer Rechtschreibung: ss statt ß.\n" .
  '- Jeder Satz hat zwischen 15 und ' . $max . " Buchstaben (Leerzeichen und Satzzeichen zählen nicht).\n" .
  '- In jedem Satz kommen diese Buchstaben mindestens so oft vor (gross oder klein; ä zählt nicht als a): ' . implode(', ', $liste) . ".\n" .
  '- Das Wort «' . $anzeige . "» selbst kommt nicht vor, auch nicht als Teil eines längeren Worts.\n" .
  "- Keine Zahlen und keine Namen echter Personen.\n" .
  'Antworte nur mit JSON in dieser Form: {"saetze": ["…", "…"]}';
$body = [
  'model' => $ki['modell'],
  'messages' => [
    ['role' => 'system', 'content' => 'Du schreibst Rätsel-Sätze für Arbeitsblätter an Schweizer Primarschulen. Du antwortest nur mit JSON.'],
    ['role' => 'user', 'content' => $prompt],
  ],
  'response_format' => ['type' => 'json_object'],
  'temperature' => 0.7,
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

/* ---------- Antwort auslesen: nur saubere, kurze Sätze ---------- */
$j = json_decode($text, true);
$inhalt = is_array($j) ? ($j['choices'][0]['message']['content'] ?? '') : $text;
if (is_array($inhalt)) $inhalt = implode('', array_map(function($t){ return is_array($t) ? (string)($t['text'] ?? '') : (string)$t; }, $inhalt));
$daten = json_decode((string)$inhalt, true);
if (!is_array($daten) && preg_match('/\{[\s\S]*\}/u', (string)$inhalt, $m)) $daten = json_decode($m[0], true);
$saetze = [];
foreach ((array)(is_array($daten) ? ($daten['saetze'] ?? $daten) : []) as $s) {
  if (!is_string($s)) continue;
  $s = trim(str_replace('ß', 'ss', (string)preg_replace('/\s+/u', ' ', $s)));
  if ($s === '' || mb_strlen($s, 'UTF-8') > 90 || !preg_match("/^[\\p{L} ,.!?'’\\-]+$/u", $s)) continue;
  $saetze[$s] = true;
}
$saetze = array_slice(array_keys($saetze), 0, 12);
if (!$saetze) antwort(502, ['fehler' => 'antwort']);
@file_put_contents($datei, json_encode(['saetze' => $saetze], JSON_UNESCAPED_UNICODE));
antwort(200, ['saetze' => $saetze, 'anbieter' => $ki['name']]);
