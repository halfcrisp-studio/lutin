# Décisions

Questions ouvertes : voir [A_TRANCHER.md](A_TRANCHER.md).

## Produit
- Générateur web de messages de lutins imprimables, gratuit, pour toute la francophonie ; anglais plus tard, quand la version française sera validée (textes déjà séparés dans `js/strings-fr.js`).
- Aucun prénom d'enfant demandé ni stocké ; tout se passe dans le navigateur ; zéro cookie et zéro mesure d'audience. Les noms des lutins favoris restent dans le stockage local du navigateur.
- V1 sans banque de messages : le parent écrit son texte. Un seul texte d'exemple au premier lancement. Signature automatique « Signé A », « Signé A et B », « Signé A, B et C ».
- Le moteur de modèles à variantes (signataires 1/N, destinataires 1/N) est prêt (`js/templates.js`) mais pas branché ; règle d'écriture prévue : éviter les accords selon le genre du lutin.
- Univers : Lutins de Noël d'abord ; les cinq autres existent déjà sous forme de configuration (palette, police, décor, cadre), avec des noms génériques, sans marque ni personnage protégé.
- Formats : A4 et A5 (A5 au minimum, jamais plus petit), portrait ou paysage. L'impression part toujours sur une feuille A4 : l'A5 occupe une demi-feuille, avec deux exemplaires possibles et des traits de coupe.

## Style
- Polices libres hébergées sur le site (aucun appel à Google Fonts) : bulles, rondes à épaisseur réglable, fines et manuscrites, lecture facile, classiques, thèmes ; plus l'import de sa propre police (gardée dans le navigateur).
- Alloy Ink n'est pas intégrée au site (26/11). L'import de police reste ouvert à toute police du parent.
- Couleurs : noir, une couleur, mes couleurs, et des jeux de couleurs indépendants des univers (sapin, arc-en-ciel, licorne, super-héros…). Contraste d'au moins 3:1 sur blanc pour chaque couleur ; une couleur choisie trop claire est assombrie automatiquement.
- Couleur par lettre ou par mot, jamais deux fois la même à la suite ; bouton « Mélanger ».
- Lettres pleines ou en contour à colorier (contour réservé aux polices épaisses).
- Options : MAJUSCULES, effet écrit à la main.
- Cadre (oui/non, 4 styles) et habillage (oui/non, 13 jeux de dessins, 3 placements), au trait, sans aplats ; les dessins viennent des icônes Lucide (ISC), la toile d'araignée est dessinée par le code.

## Validé le 26/11
- Domaine : choisi plus tard ; le site reste sur halfcrisp-studio.github.io/lutin en attendant.
- Noms des univers gardés : Lutins de Noël, Journée Grognon, Académie de Magie, Idoles contre les Ombres, Chiots Sauveteurs, Héros Araignée.
- Réglages par défaut gardés : couleur par lettre, effet main, habillage « Sapins » dans les coins, sans cadre, taille automatique.
- Texte d'exemple gardé (« Coucou les enfants ! … », signé « Lutin Farceur »).
- Contact des mentions légales : page Issues du dépôt. Code : tous droits réservés.
- Apparence (planche du 26/11) : mode clair = style A « Papier crème » (fond papier, rouge Noël, titre Fredoka) ; mode sombre = style B « Nuit de Noël » (bleu nuit étoilé, touches dorées, titre Mountains of Christmas, feuille qui brille). Le site suit le réglage de l'appareil ; les cartes de réglages restent blanches dans les deux modes. Les pages légales suivent aussi les deux modes.

## Demandé le 26/11 (2e série)
- Lutins : on entre toute sa collection une fois, puis on touche ceux qui signent ; l'ordre de la signature suit l'ordre des touchers. Un lutin ajouté signe tout de suite. Les anciennes sauvegardes (noms + favoris) deviennent la collection.
- Cadre sucre d'orge : rayures en biais dans une bande ; couleur au choix (« comme le texte » = les deux premières couleurs du jeu, ex. rouge et vert pour Sapin) ; en mode contour, les rayures se colorient. Une couleur de cadre peut être choisie pour tous les styles de cadre.
- Journée Grognon : uniquement des verts (palette, cadre, dessins).
- Choisir un univers règle tout d'un coup : police, couleurs, cadre (oui/non, style, couleur), habillage (oui/non, dessins, placement).
- Polices des univers : Titan One (Lutins), Freckle Face (Grincheux), Henny Penny (Magie), Bungee (Idoles), Titan One (Chiots), Bangers (Héros Araignée). Toutes ont les accents français ; Henny Penny n'a pas « … » (remplacé par trois points).

## Demandé le 26/11 (3e série)
- Tri des polices : les thèmes en tête de liste (les préférées) ; Titan One remplace Luckiest Guy (quasi identiques) ; plus de polices rondes (Fredoka reste seulement pour les titres de l'interface) ; manuscrites gardées : Patrick Hand et Shadows Into Light ; Great Vibes retirée (illisible). Restent 15 polices.
- « Utiliser ma propre police » est rangé dans un petit volet replié en bas de « Style du texte » (on cliquait dessus par erreur).
- Palettes plus variées, rangées par familles : Simples, Festives, Pastels (Pastel, Macarons, Guimauve), Vives (+ Océan, Forêt, Tropical, Citrouille, Chocolat), Univers. Les pastels gardent leur couleur claire et sont bordés d'un trait plus foncé de la même teinte (contraste du trait ≥ 3:1) ; dessins et cadre prennent ces teintes foncées, les rayures du sucre d'orge restent pastel.

## Demandé le 26/11 (4e série)
- Académie de Magie : livres et grimoires dans le décor (livre ouvert, grimoire, parchemin, plume, fiole, baguette).
- Journée Grognon : bonnet de Père Noël, chaussette de Noël et hotte, en vert (icônes IconOven, MIT ; la hotte est leur sac en toile sans le motif central).
- Lutins de Noël : nouveau décor « Lutins » (sapin décoré, hotte, cadeau, étoile) ; l'ancien « Sapins » reste au choix.
- Nouveaux univers : Princesses et Fées (police Princess Sofia, palette pastel Princesse, couronnes, châteaux, baguettes, cadre festif) et Policiers et Voleurs (police Special Elite, palette Police, gyrophare, empreinte, masque, loupe, clé, voiture, cadre sucre d'orge bleu et rouge).

## Demandé le 26/11 (5e série)
- Noms : « Jour du Grincheux » (au lieu de Journée Grognon), « École de Magie » (au lieu d'Académie de Magie).
- Dessins ajoutés : menottes (Policiers et Voleurs), chouette (École de Magie, icône Lucide Lab, ISC), gamelle (Chiots Sauveteurs).
- Princesses et Fées : Princess Sofia retirée (trop chargée, peu lisible), remplacée par Cherry Swash.

## Technique
- Site statique sans build (Node absent du PC) : HTML, CSS, modules JavaScript natifs.
- Un seul calcul de mise en page à 300 dpi : aperçu, impression et PNG sont la même scène, donc les mêmes retours à la ligne. Les mots ne sont jamais coupés ; la ponctuation française espacée reste collée à son mot ; un nom de lutin n'est jamais coupé.
- Impression : feuille A4 portrait sans marge (pas d'URL ni de date imprimées), cadre à au moins 7 mm du bord. Le PNG porte une résolution de 300 dpi.
- Impression et partage de l'image sont lancés directement par le toucher sur le bouton (exigence des téléphones).
- Hébergement : GitHub Pages, dépôt public `halfcrisp-studio/lutin`, publié depuis la branche `main`.
