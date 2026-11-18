# Gestion de stock

Application web de gestion de stock pour un entrepôt, utilisable sur ordinateur et smartphone, y compris avec une connexion Internet instable.

Le projet est en cours de construction. L'avancement est suivi dans `PLAN.md`.

## Ce que l'application fait pour l'instant

- Créer un compte et se connecter, avec Google ou avec une adresse e-mail et un mot de passe.
- Demander un nouveau mot de passe (« Mot de passe oublié »).
- Créer son entrepôt au premier lancement : nom et devise.
- Afficher le texte de confidentialité depuis l'écran de connexion.
- Ajouter, modifier et archiver un produit : nom, unité, seuil d'alerte, prix d'achat, stock de départ.
- Enregistrer des mouvements de stock : entrée, sortie, ajustement, avec un motif facultatif.
- Consulter l'historique : les 50 derniers mouvements, puis « Voir plus ».
- Annuler une opération faite par erreur, depuis l'historique.
- Signaler les opérations que le serveur a refusées, même après fermeture de l'application.
- Tableau de bord : valeur du stock (indicative), recherche par nom, alertes « Stock bas » et « Rupture », boutons rapides `−1` et `+1`.
- Paramètres : changer le nom de l'entrepôt ; changer la devise tant que l'entrepôt ne contient aucun produit.
- Carnet de fournisseurs : ajouter, modifier, supprimer, rechercher, et appeler ou écrire en un appui.

## Tableau de bord

- **Valeur du stock (indicative)** : pour chaque produit, quantité × prix d'achat **actuel** ; en haut de l'écran, le total de l'entrepôt, égal à la somme des lignes. Modifier un prix d'achat change la valeur de tout le stock de ce produit. Un stock négatif compte en négatif. Les produits archivés ne comptent pas.
- **Recherche** : par nom de produit, sans tenir compte des majuscules ni des accents (`cimént` trouve « Ciment »). Elle ne porte que sur les produits de la liste et ne consomme aucune lecture du quota gratuit. Le total reste celui de tout l'entrepôt.
- **Alertes**, toujours écrites et pas seulement colorées :
  - « Stock bas » (orange) quand la quantité est inférieure ou égale au seuil d'alerte ;
  - « Rupture » (rouge) quand la quantité est à 0 ou en dessous.
- **Boutons `+1` et `−1`** : chaque appui enregistre aussitôt une entrée ou une sortie d'une unité du produit (un sac, un kg…), sans motif, exactement comme un mouvement saisi dans le formulaire. Chaque appui laisse une ligne dans l'historique et coûte deux écritures du quota gratuit : pour une grande quantité, utiliser « Mouvement de stock ». Si un `−1` rendait le stock négatif, le formulaire s'ouvre déjà rempli, avec l'avertissement : rien n'est envoyé sans confirmation.

## Mouvements de stock

- La quantité d'un produit ne change que par un mouvement. Chaque mouvement laisse une ligne dans l'historique.
- **Entrée** et **Sortie** : saisir la quantité sans signe. **Ajustement** : saisir la correction avec son signe (`-2,5` ou `+3`).
- Un mouvement enregistré ne peut être ni modifié ni supprimé. Une erreur se corrige avec « Annuler cette opération » dans l'historique (voir plus bas), ou par un mouvement d'ajustement.
- Un stock peut devenir négatif. L'application avertit avant l'enregistrement et affiche ensuite « Stock négatif : à vérifier ». Avec plusieurs appareils hors ligne, elle ne peut pas l'empêcher.
- Un mouvement apparaît tout de suite, avec la mention « En attente de synchronisation » tant que le serveur ne l'a pas confirmé.
- L'historique est rangé selon l'heure de réception par le serveur. L'heure indiquée « Fait le » est celle de l'appareil au moment de l'opération ; si l'écart dépasse 5 minutes, les deux sont affichées.

### Annuler une opération faite par erreur

Dans l'historique, chaque opération propose « Annuler cette opération ». Une fenêtre de confirmation montre l'opération et le stock prévu après l'annulation, avec un avertissement s'il est négatif. Après confirmation, l'application enregistre l'opération inverse : un ajustement de valeur opposée, dont le motif décrit l'opération annulée (par exemple « Annulation : Sortie -1 sac du 18/11/2026 14:32 »). L'opération d'origine reste dans l'historique, marquée « Annulée le … ». Rien n'est effacé.

- L'annulation retire seulement l'effet de cette opération : les opérations faites depuis restent comptées.
- Une opération ne peut être annulée qu'une fois. Si on l'annule sur deux appareils, le serveur refuse la seconde fois et l'application l'indique : rien n'est compté deux fois.
- Le bouton n'apparaît pas sur une annulation (une annulation ne s'annule pas : refaire l'opération voulue), sur une opération déjà annulée, sur une opération encore « En attente de synchronisation », ni sur un produit archivé.

### Comment un mouvement est protégé

Chaque opération part dans un seul envoi qui contient le changement de quantité et la ligne d'historique. Le serveur vérifie que le mouvement est nouveau, que le produit le désigne, et que la quantité a changé exactement de la valeur du mouvement. Sinon, il refuse tout. Si le même envoi arrive deux fois après une coupure, le second est refusé : rien n'est compté deux fois.

### Opérations refusées

Chaque mouvement et chaque création de produit est noté sur l'appareil jusqu'à la confirmation du serveur. Si le serveur refuse, un bloc rouge « Opérations refusées par le serveur » décrit l'opération, y compris à la réouverture de l'application. Le bouton « J'ai noté » le fait disparaître. Les simples modifications de fiche (nom, prix, seuil, archivage) ne sont pas suivies de cette façon.

## Paramètres

Le bouton « Paramètres », en bas de l'écran des produits, ouvre :

- **Nom de l'entrepôt** : modifiable à tout moment, même sans Internet (de 1 à 100 caractères).
- **Devise** : modifiable seulement tant que l'entrepôt ne contient aucun produit, même archivé, car changer la devise ne convertit pas les prix déjà saisis. L'application le vérifie auprès du serveur : il faut donc Internet pour changer la devise. Sans réponse du serveur, la devise reste bloquée et le bouton « Vérifier de nouveau » permet de réessayer.

## Carnet de fournisseurs

Le bouton « Fournisseurs », sur l'écran des produits, ouvre le carnet. Il est indépendant du stock : il ne crée et ne modifie aucun mouvement.

- **Fiche d'un fournisseur :** nom (obligatoire), téléphone, WhatsApp, e-mail, adresse, produits fournis (texte libre, par exemple « ciment, fer ») et notes.
- **Limites :** nom 100 caractères ; téléphone et WhatsApp 30 caractères, seulement des chiffres, des espaces et `+ - ( ) .` ; e-mail 254 caractères, de la forme `nom@exemple.com` ; adresse 200 ; produits fournis 500 ; notes 1 000.
- **Recherche :** par nom ou par produit fourni (`ciment` montre qui vend du ciment), sans tenir compte des majuscules ni des accents.
- **Boutons « Appeler », « WhatsApp » et « E-mail » :** ils ouvrent l'application correspondante du téléphone ; l'application de stock n'envoie rien elle-même. Le bouton WhatsApp n'apparaît que si le numéro commence par l'indicatif du pays (`+509…` ou `00509…`).
- **Même nom :** deux fournisseurs peuvent porter le même nom ; l'application demande d'abord « Enregistrer quand même ? ».
- **Supprimer :** depuis le formulaire « Modifier », après confirmation. La suppression est définitive : les coordonnées sont effacées et ne peuvent pas être récupérées.
- **Lecture de la liste :** elle n'est chargée que pendant que l'écran « Fournisseurs » est ouvert, pour économiser le quota gratuit. Sans Internet, la liste déjà vue sur l'appareil reste affichée ; la toute première fois sur un appareil, Internet est nécessaire.

Ce sont des informations sur d'autres personnes : n'enregistrer que ce qui est utile, et supprimer un fournisseur dont on n'a plus besoin.

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

Tant que les règles publiées sont en retard sur le fichier, l'application affiche « Impossible de charger vos données » (ou, pour les fournisseurs, « Impossible de charger les fournisseurs »).

**Ordre à respecter quand les règles changent :** publier d'abord les règles dans la console, puis seulement envoyer le code avec **Push origin**. Les nouvelles règles restent compatibles avec la version déjà en ligne.

## Tester les règles de sécurité

1. Ouvrez l'application et connectez-vous avec un **compte de test** dont l'adresse se termine par `@example.com`. La page refuse tout autre compte (décision 40), pour qu'un vrai entrepôt ne reçoive jamais de données d'essai.
2. Ouvrez `http://localhost:8080/tests-regles.html`.
3. Cliquez sur **Lancer les tests**.
4. Le bilan doit indiquer que tous les essais sont réussis. Un essai marqué « Échec » signifie que les règles publiées ne protègent pas correctement les données.

À refaire après chaque publication des règles.

Ces essais créent dans le compte de test deux produits « Produit d'essai (règles) ». Ils sont archivés à la fin de chaque passage et n'apparaissent donc pas dans la liste. Chaque passage ajoute aussi cinq mouvements à l'historique du compte de test, dont une opération et son annulation (impossibles à supprimer, par conception) ; leur somme est nulle. Un fournisseur d'essai est créé puis supprimé : il ne reste rien. Un passage dure environ une minute.

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
| `.nojekyll` | Fichier vide, à garder : demande à GitHub Pages de publier tous les fichiers tels quels (décision 41) |
| `CLAUDE.md` | Cahier des charges |
| `PLAN.md`, `DECISIONS.md`, `DEMARRAGE.md` | Suivi, décisions et méthode de travail |

Tous les chemins sont relatifs : l'application peut être placée chez n'importe quel hébergeur de fichiers statiques. À chaque nouvel hébergeur, son adresse doit être ajoutée dans la console Firebase (**Authentication** > **Paramètres** > **Domaines autorisés**), sinon la connexion est refusée.

Sur GitHub Pages, le fichier vide `.nojekyll` doit rester à la racine : sans lui, GitHub Pages pourrait ignorer certains fichiers, comme ceux de `vendor/`, et l'application ne démarrerait pas en ligne.

## Version en ligne (GitHub Pages)

- Adresse : `https://saintfranckinder.github.io/minstock/`
- Réglages GitHub (onglet **Settings** > **Pages**) : **Deploy from a branch**, branche `main`, dossier **/ (root)**.
- Domaine autorisé dans Firebase (**Authentication** > **Paramètres** > **Domaines autorisés**) : `saintfranckinder.github.io`.
- Mise à jour : chaque **Push origin** dans GitHub Desktop met le site à jour en quelques minutes. Les règles Firestore, elles, se publient à part dans la console (voir plus haut).
- Le dépôt est public : ne jamais y placer de mot de passe ni de clé secrète. Le fichier `.env.test` reste sur l'ordinateur (ignoré par Git).

## Limites connues

- **Mémoire hors ligne :** elle dépend du navigateur. Si le navigateur bloque l'enregistrement de données sur l'appareil, l'application affiche un avertissement. En navigation privée, les navigateurs récents acceptent d'enregistrer mais effacent tout à la fermeture, et l'application ne peut pas le détecter : ne pas utiliser la navigation privée.
- **Première connexion sur un appareil :** elle demande Internet, pour se connecter et pour charger l'entrepôt une première fois.
- **Réouverture sans Internet :** pas encore possible. Elle sera ajoutée avec l'installation sur téléphone (phase 10).
- **Adresse e-mail non vérifiée :** l'inscription ne demande pas de confirmer l'adresse par e-mail. Une faute de frappe dans l'adresse empêche de recevoir l'e-mail de « Mot de passe oublié ».
- **Suppression du compte :** annoncée dans le texte de confidentialité, elle n'existe pas encore (phase 7).
- **Archivage définitif :** un produit archivé ne peut pas être remis dans la liste. Il reste dans la base avec son historique.
- **Noms en double :** le formulaire refuse deux produits actifs du même nom, mais deux appareils hors ligne peuvent chacun créer le même nom avant de se synchroniser.
- **Produit modifié sur deux appareils :** pour le nom, l'unité, le seuil et le prix, la dernière modification arrivée au serveur l'emporte.
- **Suivi des opérations refusées :** la liste des opérations en attente est gardée sur l'appareil. Si le stockage du navigateur est effacé ou bloqué, un refus du serveur peut passer inaperçu.
- **Valeur du stock indicative :** elle utilise le prix d'achat actuel de chaque produit, pas les prix auxquels le stock a réellement été acheté.
- **Appuis par erreur sur `+1` / `−1` :** chaque appui est un mouvement définitif. Il se corrige avec « Annuler cette opération » dans l'historique, une fois l'appui confirmé par le serveur.
- **Annulation et historique chargé :** la mention « Annulée » ne s'affiche que si l'annulation figure dans la partie de l'historique déjà chargée. Sans Internet, cette partie peut être incomplète ; une seconde annulation serait de toute façon refusée par le serveur.
- **Changement de devise :** la vérification « aucun produit » est faite par l'application, pas par les règles de sécurité. Un produit ajouté sans Internet sur un autre appareil, au moment même où la devise change, ne serait pas détecté. Le risque est faible avec un seul utilisateur.
- **Produit renommé :** l'historique garde le nom du produit au moment de chaque opération.
- **Fournisseurs modifiés sans Internet :** ils ne sont pas suivis par la liste des « Opérations refusées ». Le formulaire vérifie exactement les mêmes limites que les règles, donc un refus ne devrait pas arriver. Si un fournisseur est supprimé sur un appareil pendant qu'un autre, hors ligne, le modifie, la modification est perdue et le fournisseur reste supprimé. Pour le même fournisseur modifié sur deux appareils, la dernière modification arrivée au serveur l'emporte.
- **Fournisseur supprimé :** aucun retour en arrière possible. L'export Excel (phase 9) servira de sauvegarde.
- **Appareil partagé :** pour permettre l'utilisation sans Internet, le navigateur garde une copie des données déjà consultées (produits, mouvements, fournisseurs), **même après « Se déconnecter »**. L'application ne les montre plus, mais une personne qui sait fouiller dans le navigateur pourrait les lire. Utiliser l'application seulement sur ses propres appareils, verrouillés par un code ; sur un ordinateur partagé, effacer ensuite les données du site dans les réglages du navigateur.
- **Sécurité du compte :** quiconque connaît le mot de passe du compte voit tout l'entrepôt et le carnet de fournisseurs. Choisir un mot de passe solide, ou se connecter avec Google en activant la validation en deux étapes du compte Google. Le compte Google qui gère la console Firebase donne accès à toutes les données : il doit être protégé de la même façon.
- **Ajustement d'inventaire :** la correction est saisie à la main. Si un autre appareil a modifié le stock entre-temps, le chiffre affiché au moment de la saisie n'était peut-être plus à jour.
- **Quota gratuit :** chaque mouvement coûte deux écritures et quelques lectures de contrôle. La limite gratuite est de 20 000 écritures et 50 000 lectures par jour pour tous les comptes réunis ; si elle est atteinte, l'application se bloque jusqu'au lendemain, sans perte de données.
