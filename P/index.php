<?php
ini_set('display_errors', '0');   // PHP-Hinweise nie auf der Seite zeigen (stehen weiter im Fehlerprotokoll des Servers)
// Rätsellabor: /P/ allein zeigt kein Puzzle – zurück zur Startseite. Die Puzzles liegen in /P/<ID>/.
header('Location: ../', true, 302);
