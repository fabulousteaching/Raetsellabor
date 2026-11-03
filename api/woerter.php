<?php
/* Rätsellabor – Wortvorschläge über eine KI, vom eigenen Server aus
   Der Browser fragt diese Datei, sie fragt die KI (Mistral oder Pollinations.ai). Der Schlüssel steht in geheim.php;
   diese Datei entsteht beim Hochladen aus den GitHub-Secrets KI_SCHLUESSEL (und optional KI_ANBIETER) und steht nie
   im Repository. Welche KI gefragt wird, erkennt der Server am Schlüssel (Pollinations-Schlüssel beginnen mit «sk_»).

   GET  woerter.php           → { bereit, anbieter }            ist die KI eingerichtet?
   POST woerter.php           ← { thema, schon:[…] }            schon gezeigte Wörter werden ausgeschlossen
                              → { woerter:[…], anbieter }  oder  { fehler } mit passendem HTTP-Status

   Schutz: nur Anfragen von dieser Website; höchstens PRO_STUNDE Anfragen pro Stunde und Netz (eine Schule teilt sich
   oft eine Adresse) und PRO_TAG insgesamt; gleiche Fragen kommen aus dem Zwischenspeicher und zählen nicht.
   Gespeichert werden nur Zähler (die IP-Adresse nur verschlüsselt im Dateinamen) und Wortlisten, im Ordner daten/. */
declare(strict_types=1);

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
function kuerzen(string $s, int $n): string { return preg_match('/^.{0,' . $n . '}/us', $s, $m) ? $m[0] : ''; }
function laenge(string $s): int { return (int)preg_match_all('/./us', $s); }

/* ---------- Einstellungen ---------- */
$geheim = is_file(__DIR__ . '/geheim.php') ? (include __DIR__ . '/geheim.php') : [];
if (!is_array($geheim)) $geheim = [];
$schluessel = trim((string)($geheim['schluessel'] ?? ''));
$wahl = strtolower(trim((string)($geheim['anbieter'] ?? '')));
if ($wahl !== 'mistral' && $wahl !== 'pollinations') $wahl = strncmp($schluessel, 'sk_', 3) === 0 ? 'pollinations' : 'mistral';
$ANBIETER = [
  'mistral'      => ['name' => 'Mistral', 'url' => 'https://api.mistral.ai/v1/chat/completions', 'modell' => 'mistral-small-latest', 'json' => true],
  'pollinations' => ['name' => 'Pollinations.ai', 'url' => 'https://gen.pollinations.ai/v1/chat/completions', 'modell' => '', 'json' => false],
];
$ki = $ANBIETER[$wahl];
if (!empty($geheim['modell'])) $ki['modell'] = (string)$geheim['modell'];
if (!empty($geheim['url'])) $ki['url'] = (string)$geheim['url'];   // nur für Tests

$methode = (string)($_SERVER['REQUEST_METHOD'] ?? '');
if ($methode === 'GET') antwort(200, ['bereit' => $schluessel !== '', 'anbieter' => $schluessel !== '' ? $ki['name'] : null]);
if ($methode !== 'POST') antwort(405, ['fehler' => 'methode']);
if ($schluessel === '') antwort(503, ['fehler' => 'nichtEingerichtet']);

/* ---------- Nur Anfragen von dieser Website ---------- */
$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$herkunft = (string)($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
$hh = parse_url($herkunft, PHP_URL_HOST);
$hp = parse_url($herkunft, PHP_URL_PORT);
$herkunftHost = strtolower((string)$hh) . ($hp ? ':' . $hp : '');
if ($host === '' || $herkunftHost !== $host) antwort(403, ['fehler' => 'herkunft']);

/* ---------- Eingabe ---------- */
$e = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true);
if (!is_array($e)) antwort(400, ['fehler' => 'eingabe']);
$thema = trim(kuerzen((string)preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)($e['thema'] ?? '')), 80));
if ($thema === '') antwort(400, ['fehler' => 'eingabe']);
$schon = [];
foreach ((array)($e['schon'] ?? []) as $w) {
  $w = trim((string)$w);
  if ($w !== '' && laenge($w) <= 30 && preg_match('/^\p{L}+$/u', $w)) $schon[$w] = true;
}
$schon = array_slice(array_keys($schon), -80);

/* ---------- Ablage für Zähler und Zwischenspeicher ---------- */
$ordner = __DIR__ . '/daten';
if (!is_dir($ordner)) {
  @mkdir($ordner, 0700, true);
  @file_put_contents($ordner . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
}
if (mt_rand(1, 50) === 1) {   // ab und zu aufräumen
  foreach ((array)glob($ordner . '/*.{txt,json}', GLOB_BRACE) as $d) {
    $alter = time() - (int)@filemtime((string)$d);
    if ($alter > (substr((string)$d, -5) === '.json' ? SPEICHER_TAGE * 86400 : 2 * 86400)) @unlink((string)$d);
  }
}
$speicher = $ordner . '/vorschlag-' . sha1($wahl . '|' . mb_strtolower($thema, 'UTF-8')) . '.json';
if (!$schon && is_file($speicher) && time() - (int)filemtime($speicher) < SPEICHER_TAGE * 86400) {
  $alt = json_decode((string)file_get_contents($speicher), true);
  if (is_array($alt) && !empty($alt['woerter'])) antwort(200, ['woerter' => $alt['woerter'], 'anbieter' => $ki['name'], 'gespeichert' => true]);
}

/* ---------- Anzahl begrenzen ---------- */
function zaehlen(string $datei, int $grenze): bool {
  $f = @fopen($datei, 'c+');
  if (!$f) return true;   // ohne Ablage nicht blockieren
  flock($f, LOCK_EX);
  $n = (int)stream_get_contents($f);
  $ok = $n < $grenze;
  if ($ok) { ftruncate($f, 0); rewind($f); fwrite($f, (string)($n + 1)); fflush($f); }
  flock($f, LOCK_UN);
  fclose($f);
  return $ok;
}
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
if (!zaehlen($ordner . '/netz-' . sha1(hash('sha256', $schluessel) . '|' . $ip . '|' . date('YmdH')) . '.txt', PRO_STUNDE)
    || !zaehlen($ordner . '/tag-' . date('Ymd') . '.txt', PRO_TAG)) antwort(429, ['fehler' => 'zuViele']);

/* ---------- KI fragen ---------- */
$prompt = 'Thema: «' . $thema . "»\n" .
  "Nenne 30 deutsche Nomen, die eng zu diesem Thema gehören und die Kinder von 8 bis 14 Jahren kennen und verstehen.\n" .
  "Regeln:\n- Je ein einzelnes Wort in der Grundform (Einzahl), ohne Artikel, ohne Leerzeichen, Bindestriche oder Ziffern.\n" .
  "- 3 bis 12 Buchstaben, gemischte Längen.\n" .
  '- Kein Wort darf «' . $thema . "» enthalten (keine Zusammensetzungen mit dem Thema selbst).\n" .
  "- Keine Namen von Personen, Marken oder Orten.\n- Schweizer Rechtschreibung: ss statt ß.\n" .
  ($schon ? '- Nicht diese Wörter (schon vorgeschlagen): ' . implode(', ', $schon) . "\n" : '') .
  'Antworte nur so: {"woerter": ["Wort", "Wort", …]}';
$body = ['messages' => [
  ['role' => 'system', 'content' => 'Du hilfst Lehrpersonen in der Schweiz, Worträtsel für Kinder zu erstellen. Du antwortest nur mit JSON.'],
  ['role' => 'user', 'content' => $prompt],
]];
if ($ki['modell'] !== '') $body['model'] = $ki['modell'];
if ($ki['json']) $body['response_format'] = ['type' => 'json_object'];
if ($wahl === 'mistral') $body['temperature'] = 0.7;
else $body['seed'] = random_int(1, 999999);   // sonst kommt bei gleicher Frage dieselbe Antwort

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
if ($status === 401 || $status === 403) antwort(502, ['fehler' => 'serverSchluessel']);
if ($status === 402) antwort(502, ['fehler' => 'guthaben']);
if ($status === 429) antwort(429, ['fehler' => 'zuViele']);
if ($status < 200 || $status >= 300) antwort(502, ['fehler' => 'ki']);

/* ---------- Antwort auslesen: JSON oder Text mit einer Liste darin ---------- */
$j = json_decode($text, true);
$inhalt = is_array($j) ? ($j['choices'][0]['message']['content'] ?? '') : $text;
if (is_array($inhalt)) {   // manche Modelle liefern den Text in Stücken
  $inhalt = implode('', array_map(function($t){ return is_array($t) ? (string)($t['text'] ?? '') : (string)$t; }, $inhalt));
}
$inhalt = (string)$inhalt;
$daten = json_decode($inhalt, true);
if (!is_array($daten) && preg_match('/\[[^\[\]]*\]/u', $inhalt, $m)) $daten = json_decode($m[0], true);
if (is_array($daten) && !isset($daten[0])) {
  $liste = $daten['woerter'] ?? ($daten['wörter'] ?? ($daten['words'] ?? null));
  if (!is_array($liste)) foreach ($daten as $v) if (is_array($v)) { $liste = $v; break; }
  $daten = $liste;
}
$woerter = [];
foreach ((array)$daten as $w) {
  if (!is_string($w)) continue;
  $w = str_replace('ß', 'ss', trim($w));
  if (preg_match('/^\p{L}{2,20}$/u', $w)) $woerter[$w] = true;
}
$woerter = array_slice(array_keys($woerter), 0, 40);
if (count($woerter) < 3) antwort(502, ['fehler' => 'antwort']);

if (!$schon) @file_put_contents($speicher, json_encode(['thema' => $thema, 'woerter' => $woerter], JSON_UNESCAPED_UNICODE));
antwort(200, ['woerter' => $woerter, 'anbieter' => $ki['name']]);
