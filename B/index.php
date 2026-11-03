<?php
ini_set('display_errors', '0');   // PHP-Hinweise nie auf der Seite zeigen (stehen weiter im Fehlerprotokoll des Servers)
// Rätsellabor: /B/ allein zeigt keine Botschaft – zurück zur Startseite. Die Botschaften liegen in /B/<ID>/.
header('Location: ../', true, 302);
