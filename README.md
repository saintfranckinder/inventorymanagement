# Gestion de stock

Application web de gestion de stock pour un entrepôt, utilisable sur ordinateur et smartphone, y compris avec une connexion Internet instable.

Le projet est en cours de construction. L'avancement est suivi dans `PLAN.md`.

## Ce que l'application fait pour l'instant

- Créer un compte et se connecter, avec Google ou avec une adresse e-mail et un mot de passe.
- Demander un nouveau mot de passe (« Mot de passe oublié »).
- Créer son entrepôt au premier lancement : nom et devise.
- Afficher le texte de confidentialité depuis l'écran de connexion.

Les produits et les mouvements de stock arrivent dans les prochaines étapes.

## Ouvrir l'application sur cet ordinateur

1. Dans le dossier du projet, double-cliquez sur `demarrer.bat`.
2. Une fenêtre noire s'ouvre (c'est le serveur local) et le navigateur affiche `http://localhost:8080/`.
3. Pour arrêter, fermez la fenêtre noire.

Il ne faut pas ouvrir `index.html` par un double-clic : l'application a besoin du serveur local pour fonctionner.

Si un message indique que le serveur ne peut pas démarrer, il est sans doute déjà lancé dans une autre fenêtre noire : fermez-la et recommencez.

## Publier les règles de sécurité

Le fichier `firestore.rules` n'est pas appliqué automatiquement. À chaque modification de ce fichier :

1. Ouvrez `https://console.firebase.google.com/` et choisissez le projet `inventory-management-app-52866`.
2. Dans le menu de gauche, cliquez sur **Firestore Database**.
3. Cliquez sur l'onglet **Règles**.
4. Effacez tout le texte de l'éditeur, puis collez le contenu complet de `firestore.rules`.
5. Cliquez sur **Publier**.
6. Vérifiez que la ligne « Version des regles » affichée dans la console est la même que dans le fichier.

Tant que les règles publiées sont en retard sur le fichier, l'application affiche « Impossible de charger vos données ».

## Tester les règles de sécurité

1. Ouvrez l'application et connectez-vous avec un **compte de test** (jamais votre vrai compte).
2. Ouvrez `http://localhost:8080/tests-regles.html`.
3. Cliquez sur **Lancer les tests**.
4. Le bilan doit indiquer que tous les essais sont réussis. Un essai marqué « Échec » signifie que les règles publiées ne protègent pas correctement les données.

À refaire après chaque publication des règles.

## Même adresse e-mail avec les deux méthodes

Une adresse e-mail correspond toujours à un seul compte et aux mêmes données.

- Compte créé avec Google, puis inscription par mot de passe avec la même adresse : refusé. Il faut se connecter avec Google, ou utiliser « Mot de passe oublié » pour ajouter un mot de passe au compte.
- Compte créé par mot de passe avec une adresse Gmail, puis connexion avec Google : Google prend le dessus et l'ancien mot de passe ne fonctionne plus. « Mot de passe oublié » permet d'en recréer un.
- Pour ne pas révéler quelles adresses ont un compte, l'application répond de la même façon à un mauvais mot de passe et à une adresse inconnue.

## Organisation des fichiers

| Élément | Rôle |
|---|---|
| `index.html`, `css/`, `js/` | L'application |
| `js/firebase-config.js` | L'adresse du projet Firebase (ce n'est pas un mot de passe) |
| `vendor/` | Bibliothèques copiées dans le projet (Firebase, SheetJS) : voir `vendor/LISEZMOI.md` |
| `firestore.rules` | Règles de sécurité de la base de données |
| `tests-regles.html` | Page de test des règles de sécurité |
| `demarrer.bat`, `outils/` | Serveur local pour tester sur cet ordinateur |
| `CLAUDE.md` | Cahier des charges |
| `PLAN.md`, `DECISIONS.md`, `DEMARRAGE.md` | Suivi, décisions et méthode de travail |

Tous les chemins sont relatifs : l'application peut être placée chez n'importe quel hébergeur de fichiers statiques. À chaque nouvel hébergeur, son adresse doit être ajoutée dans la console Firebase (**Authentication** > **Paramètres** > **Domaines autorisés**), sinon la connexion est refusée.

## Limites connues

- **Mémoire hors ligne :** elle dépend du navigateur. Si le navigateur bloque l'enregistrement de données sur l'appareil, l'application affiche un avertissement. En navigation privée, les navigateurs récents acceptent d'enregistrer mais effacent tout à la fermeture, et l'application ne peut pas le détecter : ne pas utiliser la navigation privée.
- **Première connexion sur un appareil :** elle demande Internet, pour se connecter et pour charger l'entrepôt une première fois.
- **Réouverture sans Internet :** pas encore possible. Elle sera ajoutée avec l'installation sur téléphone (phase 10).
- **Adresse e-mail non vérifiée :** l'inscription ne demande pas de confirmer l'adresse par e-mail. Une faute de frappe dans l'adresse empêche de recevoir l'e-mail de « Mot de passe oublié ».
- **Suppression du compte :** annoncée dans le texte de confidentialité, elle n'existe pas encore (phase 7).
