# Gestion de stock

Application web de gestion de stock pour un entrepôt, utilisable sur ordinateur et smartphone, y compris avec une connexion Internet instable.

Le projet est en cours de construction. L'avancement est suivi dans `PLAN.md`.

## Ce que l'application fait pour l'instant

- Créer un compte et se connecter, avec Google ou avec une adresse e-mail et un mot de passe.
- Demander un nouveau mot de passe (« Mot de passe oublié »).
- Créer son entrepôt au premier lancement : nom et devise.
- Afficher le texte de confidentialité depuis l'écran de connexion.
- Ajouter, modifier et archiver un produit : nom, unité, seuil d'alerte, prix d'achat.

Un produit est créé avec un stock de 0. Les entrées et sorties de stock arrivent à la prochaine étape.

## Saisie des nombres

- La virgule et le point sont tous deux acceptés pour les décimales : `2,5` ou `2.5`.
- Les espaces servent de séparateur de milliers : `1 000`.
- Au plus 3 chiffres après la virgule pour une quantité, 2 pour un prix. Au-delà, la saisie est refusée : l'application n'arrondit jamais en silence.
- Attention : `1.000` est lu comme **1**, pas comme mille. La valeur comprise s'affiche sous le champ pendant la saisie.
- Limites : 1 milliard d'unités ; prix jusqu'à 10 milliards.

Dans la base, les quantités sont enregistrées en millièmes et les prix en centimes, toujours en nombres entiers, pour éviter toute erreur d'arrondi.

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

Ces essais créent dans le compte de test un produit « Produit d'essai (règles) ». Il est archivé à la fin de chaque passage et n'apparaît donc pas dans la liste.

## Tester les conversions de nombres

1. Ouvrez `http://localhost:8080/tests-nombres.html` (aucune connexion nécessaire).
2. Le bilan doit indiquer que tous les essais sont réussis.

À refaire après toute modification de `js/nombres.js`.

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
| `tests-nombres.html` | Page de test des conversions de nombres |
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
- **Archivage définitif :** un produit archivé ne peut pas être remis dans la liste. Il reste dans la base avec son historique.
- **Noms en double :** le formulaire refuse deux produits actifs du même nom, mais deux appareils hors ligne peuvent chacun créer le même nom avant de se synchroniser.
- **Produit modifié sur deux appareils :** pour le nom, l'unité, le seuil et le prix, la dernière modification arrivée au serveur l'emporte.
- **Opération refusée après fermeture :** si un ajout fait hors ligne est refusé par le serveur alors que l'application est fermée, aucun message ne s'affiche pour l'instant (corrigé à la prochaine étape).
