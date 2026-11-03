/* Rätsellabor – Grundwortschatz für Wortvorschläge
   Nomen, die Kinder von etwa 8 bis 14 Jahren kennen, nach Sachgebieten. Schweizer Schreibweise (ss statt ß),
   Schweizer und deutsche Wörter nebeneinander (Velo und Fahrrad), weil Wikipedia-Texte meist deutsches Deutsch sind.
   Wortvorschläge aus dem Internet werden mit dieser Liste geprüft: Ein Wort aus dem Artikel wird nur vorgeschlagen,
   wenn es hier steht oder aus zwei bekannten Wörtern zusammengesetzt ist (Kinosaal = Kino + Saal).
   Wortschatz.grundform('Kameras') → { form:'Kamera', teile:1 };  Wortschatz.grundform('Tonspuren') → { form:'Tonspur', teile:2 } */
var Wortschatz = (function(){
  'use strict';
  var LISTE = [
    // Familie und Menschen
    'Mutter Vater Eltern Kind Baby Bruder Schwester Geschwister Oma Opa Grossmutter Grossvater Grosseltern Tante Onkel Cousin Cousine Neffe Nichte ' +
    'Familie Freund Freundin Nachbar Nachbarin Mädchen Junge Bub Zwilling Enkel Enkelin Sohn Tochter Hochzeit Braut Bräutigam Gast Besucher ' +
    'Bande Team Riese Zwerg Held Heldin Bewohner Einwohner Bürger Fremder',
    // Körper und Gesundheit
    'Körper Kopf Haar Haare Gesicht Auge Ohr Nase Mund Lippe Zahn Zunge Kinn Wange Stirn Hals Nacken Schulter Arm Ellbogen Hand Finger Daumen ' +
    'Fingernagel Bauch Brust Rücken Po Hintern Bein Knie Fuss Zehe Ferse Haut Knochen Muskel Herz Lunge Magen Darm Leber Niere Gehirn Hirn Blut ' +
    'Ader Skelett Schädel Rippe Wirbelsäule Gelenk Augenbraue Wimper Pupille Nabel Hüfte Wade Oberschenkel Handgelenk Faust Träne Schweiss Atem ' +
    'Stimme Bart Schnurrbart Locke Zopf Sommersprosse Muttermal Gesundheit Krankheit Fieber Husten Schnupfen Erkältung Grippe Bauchweh ' +
    'Kopfweh Pflaster Verband Spritze Tablette Pille Medizin Medikament Salbe Arzt Ärztin Spital Krankenhaus Klinik Praxis Apotheke Brille ' +
    'Kontaktlinse Rollstuhl Krücke Gips Wunde Narbe Beule Allergie Virus Bakterie Impfung Operation Notfall Sanität Krankenwagen Ambulanz ' +
    'Herzschlag Puls Schlaf Traum Hunger Durst Sinn Geruch Geschmack Gehör',
    // Kleidung und Schmuck
    'Kleidung Kleid Hose Hemd Bluse Jacke Mantel Pullover Pulli Rock Socke Strumpf Strumpfhose Schuh Stiefel Sandale Turnschuh Finken Hausschuh ' +
    'Mütze Kappe Hut Helm Schal Handschuh Fäustling Gürtel Krawatte Fliege Weste Pyjama Schlafanzug Nachthemd Badehose Badeanzug Bikini Unterhose ' +
    'Unterhemd Kapuze Knopf Reissverschluss Tasche Handtasche Rucksack Anzug Uniform Kostüm Verkleidung Schürze Halstuch Ring Kette Halskette ' +
    'Armband Ohrring Uhr Armbanduhr Schmuck Krone Schleier Umhang Regenjacke Regenmantel Overall Trainer Trainingsanzug Portemonnaie Geldbeutel ' +
    'Schirm Regenschirm Stoff Wolle Seide Leder Baumwolle Faden Garn Nadel Stecknadel Naht Muster Masche Tracht Sonnenbrille Schnalle Kragen Ärmel',
    // Haus und Wohnen
    'Haus Wohnung Zimmer Küche Bad Badezimmer Toilette Klo Schlafzimmer Wohnzimmer Kinderzimmer Keller Estrich Dachboden Dach Wand Mauer Boden ' +
    'Decke Tür Fenster Fensterladen Treppe Stufe Lift Aufzug Balkon Terrasse Garten Garage Zaun Tor Pforte Schloss Schlüssel Klingel Briefkasten ' +
    'Kamin Ofen Heizung Herd Backofen Kühlschrank Tiefkühler Gefrierschrank Spülmaschine Geschirrspüler Waschmaschine Mikrowelle Toaster ' +
    'Kaffeemaschine Wasserhahn Lavabo Waschbecken Dusche Badewanne Spiegel Handtuch Seife Shampoo Zahnbürste Zahnpasta Kamm Bürste Föhn Bett ' +
    'Etagenbett Kissen Matratze Bettdecke Schrank Kleiderschrank Kommode Regal Schublade Tisch Stuhl Hocker Sofa Couch Sessel Teppich Vorhang ' +
    'Lampe Kerze Bild Poster Wecker Telefon Fernseher Radio Steckdose Kabel Schalter Glühbirne Besen Schaufel Staubsauger Eimer Kübel Lappen ' +
    'Schwamm Abfall Müll Mülleimer Abfalleimer Kehricht Korb Kiste Schachtel Dose Büchse Flasche Glas Tasse Becher Teller Schüssel Schale Topf ' +
    'Pfanne Deckel Löffel Gabel Messer Kelle Schöpflöffel Sieb Brett Krug Kanne Teekanne Serviette Tischtuch Vase Blumentopf Giesskanne Wäsche ' +
    'Wäscheleine Bügeleisen Werkzeugkasten Nachttisch Hausnummer Klingel Zuhause Heim Hütte Stube Flur Korridor Eingang Ausgang Haustür',
    // Essen und Trinken
    'Essen Brot Brötchen Semmel Weggli Gipfeli Croissant Butter Käse Milch Joghurt Jogurt Quark Rahm Sahne Ei Honig Konfitüre Marmelade Müesli ' +
    'Flocke Mehl Zucker Salz Pfeffer Essig Öl Senf Ketchup Mayonnaise Sauce Sosse Suppe Salat Nudel Teigwaren Pasta Spaghetti Reis Kartoffel ' +
    'Pommes Rösti Pizza Hamburger Sandwich Wurst Würstchen Cervelat Schinken Speck Fleisch Steak Schnitzel Poulet Hähnchen Fisch Thunfisch ' +
    'Fondue Raclette Kuchen Torte Keks Guetzli Plätzchen Biskuit Schokolade Bonbon Gummibärchen Lutscher Glace Eis Glacé Pudding Dessert ' +
    'Popcorn Chips Nuss Mandel Erdnuss Haselnuss Walnuss Rosine Getreide Korn Weizen Roggen Hafer Mais Gerste Wasser Saft Sirup Tee Kaffee ' +
    'Kakao Limonade Mineralwasser Getränk Frühstück Mittagessen Abendessen Znüni Zvieri Picknick Mahlzeit Rezept Teig Krümel Scheibe ' +
    'Portion Bäckerei Metzgerei Restaurant Café Kiosk Laden Markt Supermarkt Einkauf Einkaufswagen Kasse Quittung Preis Geld Münze Franken ' +
    'Euro Rappen Cent Vitamin Brezel Waffel Pfannkuchen Crêpe Omelett Spiegelei Knödel Lasagne Burger Döner Kebab Tortilla Sushi Hotdog Grill ' +
    'Grillwurst Bratwurst Gewürz Zimt Vanille Kräuter Rezept Speise Speisekarte Menü Gericht Nachtisch Imbiss Proviant Vorrat Konserve',
    // Obst und Gemüse
    'Obst Frucht Gemüse Apfel Birne Banane Kirsche Traube Weintraube Erdbeere Himbeere Brombeere Heidelbeere Blaubeere Johannisbeere ' +
    'Stachelbeere Beere Pflaume Zwetschge Aprikose Pfirsich Nektarine Zitrone Limette Mandarine Grapefruit Melone Wassermelone Ananas ' +
    'Mango Kiwi Feige Dattel Kokosnuss Papaya Litschi Granatapfel Avocado Olive Karotte Möhre Rüebli Gurke Tomate Paprika Peperoni Zwiebel ' +
    'Knoblauch Lauch Spinat Kohl Rotkohl Blumenkohl Rosenkohl Brokkoli Kürbis Zucchetti Zucchini Aubergine Erbse Bohne Linse Radieschen ' +
    'Rettich Sellerie Fenchel Spargel Artischocke Pilz Champignon Petersilie Schnittlauch Basilikum Minze Rhabarber Randen Kresse Ingwer Chili',
    // Tiere
    'Tier Haustier Hund Katze Kater Hase Kaninchen Meerschweinchen Hamster Maus Ratte Goldfisch Wellensittich Papagei Pferd Pony Esel Maultier ' +
    'Kuh Stier Bulle Ochse Kalb Schaf Lamm Widder Ziege Geiss Bock Schwein Ferkel Huhn Hahn Henne Küken Ente Gans Truthahn Pute Taube Fuchs Wolf ' +
    'Bär Luchs Reh Hirsch Wildschwein Dachs Marder Wiesel Otter Fischotter Biber Igel Eichhörnchen Murmeltier Steinbock Gämse Maulwurf ' +
    'Fledermaus Siebenschläfer Löwe Löwin Tiger Leopard Gepard Jaguar Panther Puma Elefant Nashorn Nilpferd Flusspferd Giraffe Zebra Antilope ' +
    'Gazelle Gnu Büffel Bison Kamel Dromedar Lama Alpaka Känguru Koala Panda Affe Gorilla Schimpanse Pavian Faultier Gürteltier Ameisenbär ' +
    'Erdmännchen Hyäne Schakal Waschbär Stinktier Elch Rentier Eisbär Pinguin Robbe Seehund Walross Seelöwe Wal Delfin Hai Rochen Qualle ' +
    'Krake Tintenfisch Seestern Seepferdchen Seeigel Krebs Krabbe Hummer Garnele Muschel Schnecke Nacktschnecke Koralle Fisch Forelle Lachs ' +
    'Hecht Karpfen Barsch Hering Sardine Aal Clownfisch Kugelfisch Piranha Schildkröte Krokodil Alligator Echse Eidechse Leguan Chamäleon ' +
    'Gecko Schlange Kobra Python Viper Klapperschlange Kreuzotter Ringelnatter Frosch Kröte Kaulquappe Molch Salamander Vogel Spatz Amsel ' +
    'Meise Rotkehlchen Fink Star Elster Rabe Krähe Specht Kuckuck Schwalbe Storch Reiher Kranich Schwan Möwe Adler Steinadler Falke Bussard ' +
    'Geier Habicht Eule Uhu Kauz Kolibri Flamingo Pelikan Strauss Pfau Fasan Wachtel Kakadu Tukan Huhn Insekt Biene Hummel Wespe Hornisse ' +
    'Ameise Käfer Marienkäfer Maikäfer Hirschkäfer Schmetterling Raupe Puppe Motte Fliege Mücke Libelle Heuschrecke Grille Spinne Zecke Floh ' +
    'Laus Wurm Regenwurm Assel Skorpion Tausendfüssler Dinosaurier Saurier Mammut Drache Einhorn Nest Feder Flügel Schnabel Kralle Pfote ' +
    'Tatze Fell Mähne Schwanz Horn Geweih Huf Flosse Kieme Schuppe Panzer Stachel Rüssel Gebiss Höhle Bau Stall Weide Futter Heu Stroh Zoo ' +
    'Tierpark Tierheim Gehege Käfig Aquarium Terrarium Herde Rudel Schwarm Junges Welpe Fohlen Kitz Larve Tierarzt Beute Raubtier Fährte Spur',
    // Pflanzen, Wald und Garten
    'Pflanze Baum Strauch Busch Hecke Blume Blüte Blatt Ast Zweig Stamm Rinde Wurzel Knospe Samen Kern Stiel Dorn Gras Moos Farn Flechte Alge ' +
    'Wald Wiese Feld Acker Park Tanne Fichte Kiefer Föhre Lärche Eibe Buche Eiche Birke Ahorn Linde Kastanie Pappel Esche Ulme Palme Kaktus ' +
    'Bambus Rose Tulpe Narzisse Osterglocke Krokus Schneeglöckchen Veilchen Gänseblümchen Löwenzahn Klee Kleeblatt Mohn Kornblume ' +
    'Sonnenblume Lilie Orchidee Nelke Margerite Lavendel Efeu Brennnessel Distel Seerose Schilf Edelweiss Enzian Alpenrose Zapfen ' +
    'Tannzapfen Eichel Laub Pollen Nektar Erde Kompost Dünger Rechen Spaten Harke Schubkarre Gärtner Gärtnerin Beet Gewächshaus Ernte Saat ' +
    'Unkraut Rasen Rasenmäher Gartenschlauch Sträusschen Strauss Kranz Pilz Fliegenpilz Steinpilz Waldboden Lichtung Försterin Förster Holz',
    // Landschaft und Erde
    'Berg Gipfel Hügel Tal Schlucht Felsen Fels Stein Kiesel Sand Lehm Hang Grat Gletscher Lawine Vulkan Krater Lava Magma Asche Höhle Quelle ' +
    'Bach Fluss Strom See Teich Weiher Tümpel Moor Sumpf Meer Ozean Küste Strand Ufer Insel Halbinsel Bucht Hafen Welle Brandung Riff Düne ' +
    'Wüste Oase Steppe Savanne Dschungel Urwald Regenwald Tundra Pol Nordpol Südpol Äquator Kontinent Erdteil Grenze Stadt Dorf Hauptstadt ' +
    'Kanton Gemeinde Karte Landkarte Atlas Globus Kompass Norden Süden Osten Westen Gebirge Alpen Wasserfall Mündung Damm Staudamm Staumauer ' +
    'Kanal Brücke Erdbeben Erdkruste Erdkugel Kugel Klippe Grotte Geysir Gestein Kristall Mineral Erz Fossil Versteinerung Schlamm Matsch ' +
    'Afrika Amerika Asien Europa Australien Antarktis Arktis Landschaft Natur Umwelt Horizont',
    // Wetter, Zeit, Jahreszeiten
    'Wetter Sonne Mond Stern Himmel Wolke Regen Regentropfen Tropfen Schnee Hagel Nebel Wind Sturm Orkan Tornado Wirbelsturm Hurrikan Gewitter ' +
    'Blitz Donner Regenbogen Frost Reif Raureif Tau Eiszapfen Schneeflocke Schneemann Hitze Kälte Wärme Temperatur Thermometer Klima ' +
    'Jahreszeit Frühling Sommer Herbst Winter Morgen Mittag Nachmittag Abend Nacht Mitternacht Sonnenaufgang Sonnenuntergang Dämmerung ' +
    'Kalender Ferien Wochenende Feiertag Sonnenschein Schatten Pfütze Wetterbericht Föhn Bise Glatteis Hochwasser Überschwemmung Dürre',
    // Weltraum
    'Weltall Weltraum Universum Planet Erde Mars Venus Merkur Jupiter Saturn Uranus Neptun Pluto Sternbild Galaxie Milchstrasse Komet ' +
    'Meteorit Meteor Asteroid Sternschnuppe Satellit Rakete Raumschiff Raumstation Raumanzug Raumfähre Astronaut Astronautin Kosmonaut ' +
    'Teleskop Fernrohr Sternwarte Umlaufbahn Schwerkraft Mondlandung Vollmond Halbmond Neumond Mondfinsternis Sonnenfinsternis Ufo Alien ' +
    'Ausserirdischer Sonnensystem Polarstern Lichtjahr Sonde Raumsonde Mondfahrzeug Countdown',
    // Verkehr und Reisen
    'Verkehr Auto Bus Car Postauto Zug Bahn Eisenbahn Lokomotive Lok Wagen Waggon Tram Strassenbahn Velo Fahrrad Trottinett Roller Motorrad ' +
    'Mofa Lastwagen Lieferwagen Traktor Bagger Kran Feuerwehrauto Polizeiauto Taxi Flugzeug Helikopter Hubschrauber Ballon Heissluftballon ' +
    'Zeppelin Segelflugzeug Schiff Boot Fähre Dampfer Dampfschiff Segelboot Ruderboot Kanu Kajak Floss Jacht Strasse Weg Pfad Autobahn ' +
    'Kreuzung Kreisel Ampel Zebrastreifen Trottoir Gehsteig Bürgersteig Radweg Brücke Tunnel Bahnhof Gleis Schiene Perron Bahnsteig Haltestelle ' +
    'Flughafen Parkplatz Parkhaus Tankstelle Benzin Diesel Motor Rad Reifen Lenkrad Lenker Bremse Sitz Gurt Sicherheitsgurt Scheinwerfer Hupe ' +
    'Klingel Kofferraum Fahrer Fahrerin Pilot Pilotin Kapitän Lokführer Matrose Passagier Fahrgast Fahrkarte Billett Ticket Fahrplan Koffer ' +
    'Gepäck Reise Ausflug Stau Unfall Schild Verkehrsschild Seilbahn Gondel Sessellift Skilift Anker Segel Ruder Mast Steuer Propeller ' +
    'Cockpit Landung Start Piste Hotel Zelt Wohnmobil Wohnwagen Camping Pass Grenze Zoll Urlaub Tourist Souvenir Reiseführer Landkarte Navi',
    // Schule und Lernen
    'Schule Schulhaus Schulzimmer Klasse Klassenzimmer Lehrer Lehrerin Schüler Schülerin Unterricht Lektion Pause Pausenplatz Schulhof ' +
    'Turnhalle Bibliothek Heft Buch Blatt Papier Stift Bleistift Farbstift Buntstift Filzstift Kugelschreiber Kuli Füller Füllfeder Tinte ' +
    'Radiergummi Gummi Spitzer Lineal Geodreieck Zirkel Schere Leim Kleber Pinsel Farbe Wasserfarbe Etui Mäppchen Schulsack Schultasche ' +
    'Schulranzen Thek Ordner Mappe Wandtafel Tafel Kreide Pult Bank Computer Beamer Rechnung Aufgabe Hausaufgabe Prüfung Test Note Zeugnis ' +
    'Stundenplan Schulreise Lager Mathematik Mathe Musik Zeichnen Werken Turnen Sport Geografie ' +
    'Biologie Physik Chemie Satz Buchstabe Alphabet Gedicht Lied Brief Diktat Aufsatz Vortrag Plakat Wörterbuch Lexikon ' +
    'Taschenrechner Mikroskop Experiment Versuch Labor Rechenaufgabe Einmaleins Kindergarten Gymnasium Universität Studium Lernende ' +
    'Rätsel Quiz Kreuzworträtsel Abc Fibel Lesebuch Schulbuch Tafelschwamm Arbeitsblatt Kopie Notizbuch Tagebuch Kalender',
    // Berufe und Arbeit
    'Beruf Bäcker Bäckerin Metzger Metzgerin Fleischer Koch Köchin Kellner Kellnerin Ärztin Zahnarzt Zahnärztin Tierärztin Pflegerin ' +
    'Pfleger Krankenschwester Hebamme Apotheker Apothekerin Polizist Polizistin Polizei Feuerwehr Feuerwehrmann Feuerwehrfrau Busfahrer ' +
    'Chauffeur Bauer Bäuerin Landwirt Landwirtin Jäger Jägerin Fischer Fischerin Schreiner Schreinerin Tischler Zimmermann Maurer Maler ' +
    'Malerin Elektriker Mechaniker Mechanikerin Klempner Sanitär Dachdecker Schlosser Schmied Schneider Schneiderin Coiffeur Coiffeuse Friseur ' +
    'Friseurin Verkäufer Verkäuferin Kassierer Kassiererin Postbote Briefträger Pöstler Journalist Journalistin Fotograf Fotografin ' +
    'Schauspieler Schauspielerin Sänger Sängerin Musiker Musikerin Tänzer Tänzerin Künstler Künstlerin Bildhauer Architekt Architektin ' +
    'Ingenieur Ingenieurin Informatiker Informatikerin Programmierer Wissenschaftler Wissenschaftlerin Forscher Forscherin Erfinder ' +
    'Erfinderin Richter Richterin Anwalt Anwältin Soldat Soldatin Clown Zauberer Zauberin Artist Artistin Akrobat Akrobatin Trainerin ' +
    'Schiedsrichter Spieler Spielerin Sportler Sportlerin Regisseur Regisseurin Kameramann Kamerafrau Autor Autorin Schriftsteller ' +
    'Schriftstellerin Dichter Dichterin Zeichner Zeichnerin Reporter Reporterin Moderator Moderatorin Bibliothekar Bibliothekarin Hausmeister ' +
    'Abwart Händler Händlerin Kaufmann Kauffrau Detektiv Detektivin Pirat Piratin Ritter Knappe Mönch Nonne Pfarrer Pfarrerin Priester ' +
    'Bürgermeister Bürgermeisterin Präsident Präsidentin König Königin Prinz Prinzessin Kaiser Kaiserin Minister Ministerin Chef Chefin ' +
    'Direktor Direktorin Lehrling Hirte Hirtin Schäfer Senn Sennerin Bergführer Taucher Taucherin Gärtnerei Werkstatt Fabrik Büro Firma ' +
    'Baustelle Arbeiter Arbeiterin Kunde Kundin Lohn Feierabend Uniform Werkzeug Kassier Bote Diener Dienerin Wächter Wache Kellner',
    // Sport, Spiel und Freizeit
    'Spiel Ball Fussball Handball Volleyball Basketball Tennis Tischtennis Badminton Federball Hockey Eishockey Unihockey Golf Rugby Baseball ' +
    'Schwimmen Turnen Leichtathletik Sprint Marathon Sprung Weitsprung Hochsprung Wurf Speerwurf Diskus Hürde Ski Snowboard Schlitten ' +
    'Bob Schlittschuh Rollschuh Skateboard Klettern Kletterwand Seil Reck Barren Ringe Trampolin Matte Sprossenwand Netz Korb Schläger Puck ' +
    'Pfeife Pokal Medaille Podest Sieger Siegerin Gewinner Gewinnerin Verlierer Meister Meisterin Meisterschaft Weltmeister Weltmeisterin ' +
    'Olympiade Turnier Wettkampf Wettbewerb Rennen Ziel Punkt Mannschaft Verein Training Trikot Stadion Halle Platz Sportplatz Arena Fan ' +
    'Zuschauer Zuschauerin Schwimmbad Hallenbad Freibad Badi Sprungbrett Rutschbahn Rutsche Spielplatz Schaukel Wippe Sandkasten ' +
    'Klettergerüst Spielzeug Puppe Puppenhaus Teddy Teddybär Plüschtier Stofftier Bauklotz Klotz Murmel Kreisel Drachen Luftballon ' +
    'Seifenblase Puzzle Würfel Spielkarte Brettspiel Kartenspiel Schach Dame Domino Versteckspiel Fangis Zaubertrick Hobby Zirkus Museum ' +
    'Wanderung Lagerfeuer Kostüm Maske Fasnacht Karneval Feuerwerk Freizeit Wanderweg Rucksack Velotour Badetuch Sonnencreme Taucherbrille ' +
    'Schnorchel Surfbrett Segeln Rudern Reiten Judo Karate Boxen Ringen Schwingen Fechten Tanzen Yoga Joggen Kegel Bowling Billard Dart ' +
    'Spielfigur Spielbrett Joker Sieg Niederlage Unentschieden Rekord Tor Torwart Torhüter Stürmer Verteidiger Elfmeter Penalty Abseits ' +
    'Ecke Eckball Freistoss Flanke Kopfball Pass Anstoss Halbzeit Tribüne Pfiff Liga Läufer Läuferin Springer Schwimmer Schwimmerin ' +
    'Turner Turnerin Skifahrer Skifahrerin Rennfahrer Radfahrer Kletterer Reiter Reiterin Ballett Bühne Theater Spass Abenteuer',
    // Musik
    'Musik Lied Song Melodie Ton Note Takt Rhythmus Chor Orchester Band Konzert Gitarre Klavier Piano Flügel Geige Violine Cello Bratsche ' +
    'Kontrabass Bass Flöte Blockflöte Querflöte Trompete Posaune Tuba Horn Waldhorn Saxofon Saxophon Klarinette Oboe Fagott Trommel ' +
    'Schlagzeug Pauke Triangel Xylofon Xylophon Harfe Orgel Akkordeon Handorgel Mundharmonika Alphorn Hackbrett Ukulele Banjo Tamburin ' +
    'Rassel Glocke Dirigent Dirigentin Mikrofon Lautsprecher Kopfhörer Radio Schallplatte Komponist Komponistin Oper Musical Tanz Disco ' +
    'Instrument Musikinstrument Notenblatt Notenschlüssel Saite Taste Bogen Trommelstock Stimme Refrain Strophe Hit Album Sängerin Jodel',
    // Film, Medien, Kunst, Technik
    'Film Kino Kinosaal Leinwand Kamera Fotoapparat Foto Fotografie Video Fernsehen Fernsehsendung Sendung Serie Programm Kanal Nachrichten ' +
    'Werbung Zeichentrick Trickfilm Animation Regie Star Filmstar Hauptrolle Szene Drehbuch Dreh Studio Kulisse Schminke Licht ' +
    'Scheinwerfer Projektor Eintritt Eintrittskarte Saal Premiere Preis Festival Publikum Applaus Bösewicht Monster Gespenst Geist Hexe ' +
    'Fee Roboter Superheld Komödie Krimi Märchen Geschichte Fantasie Trick Effekt Stunt Bildschirm Internet Webseite Website App Videospiel ' +
    'Konsole Tastatur Drucker Monitor Handy Smartphone Tablet Laptop Akku Ladegerät Strom Energie Batterie Solarzelle Solaranlage Windrad ' +
    'Windkraftwerk Kraftwerk Maschine Hammer Nagel Schraube Schraubenzieher Zange Säge Bohrer Bohrmaschine Feile Leiter Werkbank Erfindung ' +
    'Hebel Magnet Lupe Laser Antenne Sender Signal Radar Zeitung Zeitschrift Magazin Comic Zeichnung Bilderbuch Kunst Malerei Gemälde ' +
    'Skulptur Statue Denkmal Ausstellung Galerie Atelier Staffelei Karton Leim Kreide Ton Tonspur Mikrofon Ton Zuschauerraum Vorhang ' +
    'Kasperli Puppentheater Marionette Schattenspiel Zeichentrickfilm Heldin Figur Hauptfigur Erzähler Buchstabe Kapitel ' +
    'Bestseller Bibliothek Leser Leserin Schreibmaschine Brief Briefmarke Post Paket Postkarte Telefon Nachricht Mail Chat Foto Selfie Blog ' +
    'Spielkonsole Joystick Fernbedienung Kassette Lautstärke Musikvideo Trailer Popcorn Kinokarte Filmrolle Klappe Mikro',
    // Geschichte: Steinzeit, Ägypten, Römer, Mittelalter, Piraten
    'Steinzeit Höhlenmalerei Faustkeil Speer Pfeil Bogen Feuer Feuerstein Jäger Sammler Pfahlbau Hütte Töpferei Pyramide Pharao Mumie ' +
    'Sarkophag Tempel Grab Grabkammer Hieroglyphe Papyrus Sphinx Obelisk Römer Legion Legionär Gladiator Kolosseum Forum Therme Aquädukt ' +
    'Toga Tunika Schild Schwert Lanze Streitwagen Amphore Mosaik Villa Kastell Senat Sklave Sklavin Gott Göttin Sage Legende Burg Festung ' +
    'Turm Zinne Zugbrücke Burggraben Graben Kerker Verlies Rüstung Visier Kettenhemd Wappen Fahne Flagge Banner Turnier Thron Zepter Hof ' +
    'Hofnarr Narr Gaukler Spielmann Minnesänger Magd Knecht Kloster Kirche Kathedrale Dom Kapelle Zunft Handwerker Pest Wikinger ' +
    'Drachenboot Langschiff Schatz Schatzkarte Schatztruhe Truhe Kanone Säbel Augenklappe Holzbein Archäologe Archäologin Ausgrabung ' +
    'Skelett Mittelalter Neuzeit Antike Bronzezeit Eisenzeit Jungsteinzeit Altsteinzeit Ritterburg Königreich Reich Armee Heer Krieg ' +
    'Frieden Schlacht Belagerung Eroberer Entdecker Entdeckerin Seefahrer Karawane Kutsche Postkutsche Dampfmaschine Webstuhl Spinnrad ' +
    'Mühle Windmühle Wassermühle Schmiede Amboss Krug Öllampe Fackel Laterne Pergament Feder Tintenfass Siegel Urkunde Chronik Münze ' +
    'Taler Krone Burgfräulein Hofdame Edelmann Fürst Fürstin Graf Gräfin Herzog Herzogin Bauernhof Dorfplatz Marktplatz Stadtmauer Stadttor',
    // Feste und Feiern
    'Fest Feier Party Geburtstag Geburtstagskuchen Geschenk Überraschung Einladung Weihnachten Advent Adventskranz Adventskalender Krippe ' +
    'Engel Tannenbaum Christbaum Weihnachtsbaum Christkind Samichlaus Nikolaus Schmutzli Lametta Lebkuchen Zimtstern Mailänderli Grittibänz ' +
    'Ostern Osterhase Osterei Osternest Halloween Räbe Räbenliechtli Lampion Silvester Neujahr Bundesfeier Umzug Konfetti Girlande Kerze ' +
    'Wunderkerze Glocke Weihnachtsmarkt Bescherung Stern Schneemann Rentier Schlitten Nuss Mandarine Kürbis Laterne Schoggi',
    // Stoffe, Formen, Farben
    'Metall Eisen Stahl Gold Silber Kupfer Bronze Blei Zinn Aluminium Plastik Kunststoff Marmor Beton Ziegel Backstein Wachs Diamant ' +
    'Edelstein Perle Rubin Smaragd Saphir Kohle Erdöl Gas Kreis Dreieck Quadrat Rechteck Würfel Kegel Zylinder Oval Herz Spirale Linie ' +
    'Punkt',
    // Natur und Wissen
    'Dampf Luft Sauerstoff Flamme Rauch Funke Glut Schall Echo Atom Zelle Lebewesen Recycling Abfall Klimawandel Wasserkraft ' +
    'Sonnenenergie Elektrizität Glühbirne Kompass Uhr Sanduhr Zeiger Waage Gewicht Lineal Thermometer Mikroskop Lupe Kristall Salz Zucker',
    // Orte und Gebäude
    'Rathaus Bank Post Gefängnis Palast Schloss Iglu Hochhaus Wolkenkratzer Bauernhof Scheune Brunnen Turm Leuchtturm Bahnhof Kirche ' +
    'Moschee Synagoge Friedhof Kino Theater Museum Stadion Schwimmbad Spielplatz Zoo Markt Laden Kiosk Hotel Restaurant Spital Apotheke ' +
    'Schulhaus Kindergarten Bibliothek Feuerwehrhaus Polizeiposten Kaserne Hafen Flughafen Fabrik Kraftwerk Zelt Hütte Baumhaus Höhle ' +
    'Gasse Platz Quartier Viertel Siedlung Strasse Allee Promenade Ufer Mauer Hof Garten Park',
    // Gefühle und Dinge des Alltags, die Kinder kennen
    'Freude Angst Wut Mut Glück Liebe Freundschaft Streit Witz Lachen Geheimnis Wunsch Idee Gefahr Lärm Stille ' +
    'Geschenk Brief Bild Foto Spielzeug Ball Geld Taschengeld Sparschwein Schlüssel Tasche Uhr Wecker Lampe Taschenlampe Kerze Streichholz ' +
    'Feuerzeug Seil Schnur Kette Gürtel Netz Sack Beutel Karte Ausweis Pass Kassenzettel Kalender'
  ].join(' ');

  var WS = {};   // kleingeschrieben (ß → ss) → Schreibweise
  function klein(w){ return String(w).toLocaleLowerCase('de-CH').replace(/ß/g, 'ss'); }
  function aufnehmen(w){ if (w && !WS[klein(w)]) WS[klein(w)] = w.replace(/ß/g, 'ss'); }
  LISTE.split(/\s+/).forEach(aufnehmen);

  function ohneUmlaut(w){ return w.replace(/ä(?=[^äöü]*$)/, 'a').replace(/ö(?=[^äöü]*$)/, 'o').replace(/ü(?=[^äöü]*$)/, 'u'); }
  // Wörter mit Mehrzahl auf -er ohne Umlaut (Bild → Bilder); sonst gilt -er nur mit Umlaut (Haus → Häuser),
  // damit aus «Spieler» kein «Spiel» wird.
  var ER = {}; 'bild kind lied ei feld kleid brett licht nest rind schild gesicht geist schwert gespenst geld glied ding'.split(' ').forEach(function(w){ ER[w] = 1; });
  var ENDUNGEN = ['', 'n', 'en', 'e', 's', 'es', 'nen', 'ns', 'er', 'ern'];

  /* Grundform eines Worts aus dem Wortschatz (Kameras → Kamera, Häusern → Haus, Lehrerinnen → Lehrerin) */
  function einfach(l){
    if (WS[l]) return WS[l];
    for (var i = 1; i < ENDUNGEN.length; i++){
      var e = ENDUNGEN[i];
      if (l.length - e.length < 2 || l.slice(-e.length) !== e) continue;
      var b = l.slice(0, -e.length), u = ohneUmlaut(b), er = e === 'er' || e === 'ern';
      if (WS[b] && (!er || ER[b])) return WS[b];
      if (u !== b && WS[u]) return WS[u];
    }
    var u0 = ohneUmlaut(l);
    if (u0 !== l && WS[u0]) return WS[u0];   // Mütter → Mutter
    return null;
  }
  var FUGEN = ['', 's', 'n', 'en', 'es', 'e', 'er'];
  /* Ein Wort aus zwei bekannten Teilen (Kino+saal, Ton+spuren, Stern+en+himmel). Liefert null oder { form, teile } */
  function grundform(wort){
    var l = klein(wort);
    if (!/^[a-zäöü]+$/.test(l) || l.length < 2) return null;
    var f = einfach(l);
    if (f) return { form:f, teile:1 };
    if (l.length > 16) return null;
    for (var k = 3; k <= l.length - 3; k++){            // längster bekannter Schluss zuerst
      var hinten = einfach(l.slice(k));
      if (!hinten || hinten.length < 3) continue;
      var vorne = l.slice(0, k);
      for (var j = 0; j < FUGEN.length; j++){
        var fu = FUGEN[j];
        if (fu && vorne.slice(-fu.length) !== fu) continue;
        var v = fu ? vorne.slice(0, -fu.length) : vorne;
        if (v.length >= 3 && WS[v]) return { form:WS[v] + fu + hinten.toLocaleLowerCase('de-CH'), teile:2 };
      }
    }
    return null;
  }
  return { grundform:grundform, aufnehmen:aufnehmen, kennt:function(w){ return !!WS[klein(w)]; }, anzahl:function(){ return Object.keys(WS).length; } };
})();
