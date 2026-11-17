# Gestion de stock

Application web de gestion de stock pour un entrepôt, utilisable sur ordinateur et smartphone, y compris avec une connexion Internet instable.

Le projet est en cours de construction. L'avancement est suivi dans `PLAN.md`. Pour l'instant, l'application affiche seulement une page de vérification technique.

## Ouvrir l'application sur cet ordinateur

1. Dans le dossier du projet, double-cliquez sur `demarrer.bat`.
2. Une fenêtre noire s'ouvre (c'est le serveur local) et le navigateur affiche `http://localhost:8080/`.
3. Pour arrêter, fermez la fenêtre noire.

Il ne faut pas ouvrir `index.html` par un double-clic : l'application a besoin du serveur local pour fonctionner.

Si un message indique que le serveur ne peut pas démarrer, il est sans doute déjà lancé dans une autre fenêtre noire : fermez-la et recommencez.

## Ce que la page de vérification doit afficher

| Ligne | Résultat normal |
|---|---|
| Connexion à Firebase | « Projet joint. Accès refusé par les règles, comme prévu. » |
| Mémoire hors ligne | « Active » |
| Version | Le numéro de l'application et celui du SDK Firebase |

Le refus d'accès est le bon résultat : à cette étape, les règles de sécurité interdisent tout.

## Publier les règles de sécurité

Le fichier `firestore.rules` n'est pas appliqué automatiquement. À chaque modification de ce fichier :

1. Ouvrez `https://console.firebase.google.com/` et choisissez le projet `inventory-management-app-52866`.
2. Dans le menu de gauche, cliquez sur **Firestore Database** (dans « Créer » ou « Build »).
3. Cliquez sur l'onglet **Règles**.
4. Effacez tout le texte de l'éditeur, puis collez le contenu complet de `firestore.rules`.
5. Cliquez sur **Publier**.

## Organisation des fichiers

| Élément | Rôle |
|---|---|
| `index.html`, `css/`, `js/` | L'application |
| `js/firebase-config.js` | L'adresse du projet Firebase (ce n'est pas un mot de passe) |
| `vendor/` | Bibliothèques copiées dans le projet (Firebase, SheetJS) : voir `vendor/LISEZMOI.md` |
| `firestore.rules` | Règles de sécurité de la base de données |
| `demarrer.bat`, `outils/` | Serveur local pour tester sur cet ordinateur |
| `CLAUDE.md` | Cahier des charges |
| `PLAN.md`, `DECISIONS.md`, `DEMARRAGE.md` | Suivi, décisions et méthode de travail |

Tous les chemins sont relatifs : l'application peut être placée chez n'importe quel hébergeur de fichiers statiques.

## Limites connues

- **Mémoire hors ligne :** elle dépend du navigateur. Si le navigateur bloque l'enregistrement de données sur l'appareil, l'application affiche un avertissement. En navigation privée, les navigateurs récents acceptent d'enregistrer mais effacent tout à la fermeture, et l'application ne peut pas le détecter : ne pas utiliser la navigation privée.
- **Première ouverture :** elle demande toujours Internet.
- **Réouverture sans Internet :** pas encore possible. Elle sera ajoutée avec l'installation sur téléphone (phase 10).
