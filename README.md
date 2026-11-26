# Lutin

Générateur de petits mots de lutins (et d'autres personnages) à imprimer : le parent écrit le message, choisit les lutins qui signent, le style et le décor, puis imprime une feuille A4 ou A5 sur papier blanc, ou l'enregistre en image.

- Tout se passe dans le navigateur : aucun serveur, aucun compte, aucun cookie, aucun prénom d'enfant demandé.
- Site statique sans étape de build (HTML, CSS, JavaScript natif en modules). GitHub Pages le sert tel quel.

## Lancer en local

```
python -m http.server 8793 --bind 127.0.0.1
```

Puis ouvrir http://127.0.0.1:8793/. Les modules JavaScript ne se chargent pas en ouvrant `index.html` directement depuis le disque.

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `js/layout.js` | Mise en page du texte : retours à la ligne entre les mots seulement, taille automatique |
| `js/render.js` | Construction de la scène (texte, couleurs, cadre, décor) et dessin à n'importe quelle échelle |
| `js/sheet.js` | Sorties pleine résolution : feuille A4 à imprimer, image PNG à 300 dpi |
| `js/decor.js`, `js/decor-icons.js` | Cadres et dessins au trait (icônes Lucide converties) |
| `js/fonts.js` | Polices intégrées et polices importées (gardées dans le navigateur) |
| `js/palettes.js`, `js/universes.js` | Jeux de couleurs et univers (simple configuration) |
| `js/templates.js` | Modèles de messages à variantes (prévu pour la future banque de messages) |
| `js/strings-fr.js` | Textes de l'interface (l'anglais viendra dans un fichier jumeau) |
| `fonts/` | Polices woff2 (sous-ensemble latin) et leurs licences |
| `tools/` | Scripts de récupération des polices et des icônes |
| `dev/tests.html` | Vérifications de la logique clé (ouvrir dans un navigateur : « ALL OK ») |
| `dev/gallery.html` | Planche de rendus pour comparer les combinaisons |

Le rendu repose sur un seul calcul de mise en page à 300 dpi : l'aperçu, l'impression et l'image sont la même scène dessinée à des échelles différentes, donc les retours à la ligne sont identiques partout.
