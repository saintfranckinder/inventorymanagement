# Plan du projet

Ce fichier suit l'avancement. `CLAUDE.md` reste le cahier des charges ; `DECISIONS.md` contient les décisions validées.

Dossier de travail : `C:\GitHub\Inventory Management\inventorymanagement` (dépôt cloné par le propriétaire avec GitHub Desktop le 2026-11-16).

Dépôt GitHub : `saintfranckinder/minstock`, renommé par le propriétaire le 2026-11-18 (ancien nom : `inventorymanagement`). Adresse prévue du site : `https://saintfranckinder.github.io/minstock/`. Le dossier de travail garde son nom.

## 1. État d'avancement

| Phase | Travail | État |
|---|---|---|
| 0 | Préparer le dossier (Git, `.gitignore`, `README.md`) | **Terminée le 2026-11-16** |
| 1 | Audit et plan | **Terminée le 2026-11-16** (analyse validée, aucun code écrit) |
| 2 | Structure, Firebase, persistance hors ligne | **Terminée le 2026-11-16** |
| 3 | Connexion, premier lancement, confidentialité | **Faite le 2026-11-16** ; trois tests du propriétaire restent à faire (Google, e-mail de réinitialisation, même adresse) |
| 4a | Produits et conversion des nombres | **Terminée le 2026-11-16** |
| 4b | Mouvements, règles complètes, historique | **Terminée le 2026-11-16** (tests hors ligne et à deux appareils non faits) |
| — | Vérification des secrets, dépôt public, GitHub Pages activé | **Terminée le 2026-11-18** (site en ligne ; premier test sur smartphone réussi selon le propriétaire) |
| 5 | Tableau de bord | **Terminée le 2026-11-18** (test sur smartphone réussi le même jour, selon le propriétaire) |
| 6 | Formulaires, historique lisible (avec « Annuler cette opération »), paramètres | **Terminée le 2026-11-18** (test sur smartphone réussi le même jour, selon le propriétaire) |
| 6b | Carnet de fournisseurs (décisions 42 et 50 à 54) | **Terminée le 2026-11-18** (règles version 6 publiées par le propriétaire ; test sur smartphone réussi le même jour) |
| — | Identité visuelle MinStock (décisions 55 à 58) et compteurs cliquables (décision 59) | **Terminée le 2026-11-18** (validées sur smartphone par le propriétaire) |
| 7 | Suppression du compte (décisions 60 à 63) | **Terminée le 2026-11-18** (règles version 7 publiées par le propriétaire ; test sur smartphone réussi avec un compte jetable) |
| 8 | Hors ligne et indicateur de synchronisation | **Prochaine étape** (voir section 8.7) |
| 9 | Export Excel | À faire |
| 10 | Application installable (PWA) | À faire |
| 11 | Données de démonstration | À faire |
| 12 | Audit final de sécurité | À faire |
| 13 | Documentation et publication finale | À faire |

## 2. Détail des phases : résultat attendu et tests

### Phase 0 : préparer le dossier
- **Résultat :** le dossier est un vrai dépôt Git relié à `saintfranckinder/minstock` (appelé `inventorymanagement` jusqu'au 2026-11-18) ; Git fonctionne (celui de GitHub Desktop suffit) ; `.gitignore` et `README.md` existent.
- **Test :** un commit local apparaît dans l'onglet **History** de GitHub Desktop.

### Phase 2 : structure, Firebase, persistance
- **Résultat :**
  - Structure : `index.html`, `css/`, `js/` (petits modules), `vendor/`, `firestore.rules`. Tous les chemins sont relatifs (`./`).
  - SDK Firebase (version fixe) copié dans `vendor/`, avec la ligne d'import vers `https://www.gstatic.com/...` remplacée par un chemin local dans chaque fichier. Modification documentée dans le README.
  - Petit serveur local sans installation (script PowerShell) pour ouvrir l'application sur `http://localhost`.
  - Persistance hors ligne activée avant toute lecture, avec test préalable du stockage local et avertissement en cas d'échec.
  - `firestore.rules` qui refuse tout, avec les instructions de publication dans la console.
- **Tests :**
  - La page s'ouvre en local et se connecte au projet Firebase.
  - Dans l'onglet Réseau du navigateur, aucun appel vers `gstatic.com`.
  - Quand le navigateur bloque le stockage local, l'avertissement de persistance s'affiche.

**Compte rendu de la phase 2 (2026-11-16)**

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/` :

| Test | Résultat |
|---|---|
| Le serveur local démarre et sert la page | Réussi |
| Les trois fichiers du SDK sont chargés depuis `vendor/` ; aucun appel vers `gstatic.com` | Réussi |
| Firebase répond « accès refusé » (projet joint, règles actives) | Réussi |
| Mémoire hors ligne active ; la base locale `firestore/[DEFAULT]/inventory-management-app-52866/main` existe | Réussi |
| Stockage local bloqué (simulé par une page de test temporaire, supprimée ensuite) : avertissement affiché, « Indisponible » | Réussi |
| Affichage à 360 pixels de large, sans défilement horizontal | Réussi |
| Le serveur local refuse `.git`, `.gitignore` et les chemins hors du projet | Réussi |
| Aucune erreur dans la console du navigateur | Réussi |

Tests non exécutés :

- Double-clic sur `demarrer.bat` par le propriétaire (seul le script qu'il lance a été testé).
- Coupure d'Internet : la ligne doit afficher « Serveur injoignable ».
- Publication de `firestore.rules` dans la console (action du propriétaire).
- Aucun test sur smartphone (impossible avant la mise en ligne, fin de phase 4b).

Constats :

- Le SDK Firebase 13.4.0 confirme l'analyse : si le stockage local est bloqué, Firestore continue en mémoire sans prévenir l'application (seulement un message dans la console). L'application teste donc elle-même le stockage local au démarrage, puis vérifie que la base locale de Firestore existe quand le navigateur permet de le savoir.
- Cette détection est approximative. En navigation privée, les navigateurs récents acceptent le stockage puis l'effacent à la fermeture : l'application affiche alors « Active » à tort. Limite notée dans le README.
- La page de vérification fait une tentative de lecture sur le serveur à chaque ouverture. C'est provisoire : à retirer en phase 3, quand la connexion des utilisateurs existera.
- `firebase-auth.js` est chargé et démarré pour valider la copie locale, mais aucune fonction de connexion n'existe encore.
- SheetJS (`xlsx.full.min.js`, 0.20.3) est copié dans `vendor/` mais n'est pas encore utilisé ni chargé par la page.

### Phase 3 : connexion, premier lancement, confidentialité
- **Résultat :** connexion Google (popup) et e-mail / mot de passe, inscription, mot de passe oublié, premier lancement (nom de l'entrepôt, devise), texte de confidentialité, règles d'isolation par compte. Messages génériques quand l'e-mail existe déjà avec l'autre méthode.
- **Avant de coder :** expliquer au propriétaire le cas « même adresse e-mail avec les deux méthodes ».
- **Tests :**
  - Créer un compte par chaque méthode, se déconnecter, se reconnecter.
  - Même adresse par les deux méthodes, dans les deux ordres ; noter le comportement réel.
  - Popup bloquée : le message d'aide s'affiche.
  - Un second compte ne voit pas les données du premier.

**Compte rendu de la phase 3 (2026-11-16)**

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test `test-phase3@example.com` (mot de passe dans `.env.test`, fichier ignoré par Git) :

| Test | Résultat |
|---|---|
| Création du compte par e-mail et mot de passe | Réussi |
| Mot de passe de moins de 8 caractères refusé avant l'envoi | Réussi |
| Seconde inscription avec la même adresse : message « a déjà un compte » | Réussi |
| Mauvais mot de passe : message générique | Réussi |
| Déconnexion, puis reconnexion | Réussi |
| Mot de passe oublié avec une adresse sans compte : même message que pour une adresse existante | Réussi |
| Texte de confidentialité accessible depuis la connexion | Réussi |
| Règles non publiées : message « Impossible de charger vos données » | Réussi |
| Premier lancement : nom vide refusé, puis entrepôt créé (4 champs, date du serveur) | Réussi |
| Rechargement : l'accueil s'affiche avec l'entrepôt existant, sans repasser par le premier lancement | Réussi |
| `tests-regles.html` : 14 essais sur 14 (2 autorisés, 12 refusés) | Réussi |
| Tous les écrans à 360 pixels, sans défilement horizontal, cibles d'au moins 48 pixels | Réussi |

Tests non exécutés :

- Connexion avec Google (popup) et message de popup bloquée : à faire par le propriétaire.
- Réception réelle de l'e-mail de réinitialisation, en français : à faire par le propriétaire.
- Même adresse par les deux méthodes, dans les deux ordres : à faire par le propriétaire, avec son compte Google.
- Second compte réel qui ne voit pas les données du premier : seule la lecture d'un autre identifiant de compte a été testée (refusée).
- Premier chargement sans Internet sur un nouvel appareil (écran « Connexion Internet nécessaire ») : non simulé.
- Smartphone : impossible avant la mise en ligne.

Constats :

- La publication des règles a d'abord semblé sans effet : le serveur a continué de tout refuser pendant plusieurs minutes, puis la version 3 est devenue active. Cause non identifiée (délai du serveur ou publication refaite). Le README demande désormais de vérifier la ligne « Version des regles » dans la console.
- La lecture de test provisoire de la phase 2 est retirée.
- L'écran de premier lancement ne s'affiche que si le serveur confirme qu'aucun entrepôt n'existe (décision 20).
- Le texte de confidentialité mentionne la suppression du compte, qui n'existera qu'en phase 7.
- La liste des devises existe à deux endroits qui doivent rester identiques : `js/entrepot.js` et `firestore.rules`.
- Le compte de test reste dans Firebase Authentication, avec son entrepôt « Entrepôt de test ». Il resservira en phase 4.

### Phase 4a : produits et nombres
- **Résultat :** ajouter, modifier, archiver un produit ; fonction unique de conversion (saisie ↔ entiers) ; bornes sur les quantités et les prix ; règles de validation des produits (types, champs, longueurs).
- **Tests :**
  - Page `tests-nombres.html` entièrement verte (`2,5`, `-2,5`, `1 000`, plus de 3 décimales refusées, etc.).
  - Modifier un produit ne change jamais sa quantité.

**Compte rendu de la phase 4a (2026-11-16)**

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test :

| Test | Résultat |
|---|---|
| `tests-nombres.html` : 98 essais sur 98 (dont `1,005`, `4,35`, `-2,5`, `1 000`, très grands nombres) | Réussi |
| Formulaire : nom vide, unité vide, trop de décimales, texte non numérique refusés | Réussi |
| Valeur comprise affichée sous les champs ; `1.000` affiché comme 1 | Réussi |
| Ajout de deux produits : affichage immédiat « En attente de synchronisation », puis confirmation | Réussi |
| Sur le serveur : 9 champs, quantité 0, `dernierMouvementId` vide, 2,5 enregistré `2500`, 1 250,50 enregistré `125050` | Réussi |
| Nom en double refusé, sans tenir compte des majuscules ni des espaces | Réussi |
| Modification du nom, du seuil et du prix : quantité et `dernierMouvementId` inchangés | Réussi |
| Archivage : annulation respectée, puis produit retiré de la liste et conservé sur le serveur | Réussi |
| `tests-regles.html` : 39 essais sur 39 au premier passage, 38 sur 38 au second (la création du produit d'essai n'est pas rejouée) | Réussi |
| Règles version 3 encore actives : message « Impossible de charger les produits » | Réussi |
| Formulaire à 360 pixels, cibles d'au moins 48 pixels | Réussi |

Tests non exécutés :

- Ajout ou modification hors ligne, puis retour en ligne.
- Deux appareils modifiant le même produit.
- Message d'avertissement de l'archivage quand le stock n'est pas à 0 (aucun produit n'a encore de stock).
- Smartphone : impossible avant la mise en ligne.

Constats :

- La valeur d'une ligne (`calculerValeurCentimes`) est calculée en grands entiers (BigInt) : même résultat que la formule de `CLAUDE.md`, mais exact avec de très grands nombres.
- Les règles exigent `updatedAt` égal à l'heure du serveur à chaque modification d'un produit : le lot de mouvement de la phase 4b devra l'écrire aussi.
- Les bornes de quantité des règles (±10^15 millièmes) sont volontairement plus larges que celles du formulaire (10^12), pour ne pas refuser une opération légitime faite hors ligne.
- Le compte de test contient maintenant : « Riz 25 kg (Tchako) » (actif), « Huile » et « Produit d'essai (règles) » (archivés).
- `js/interface.js` regroupe les fonctions d'affichage partagées, auparavant dans `js/app.js`.

### Phase 4b : mouvements, règles, historique
- **Résultat :**
  - Entrées, sorties, ajustements par lot unique (`increment`, `dernierMouvementId`, mouvement).
  - Stock initial par mouvement dans le lot de création.
  - Règles complètes du lien produit-mouvement (voir décision 12).
  - Liste locale des opérations non confirmées, vérifiée à chaque ouverture.
  - Historique : 50 derniers mouvements, puis « Voir plus ».
- **Avant de coder :** expliquer simplement au propriétaire comment les règles vérifient le lien produit-mouvement.
- **Tests :** page `tests-regles.html` entièrement verte avec un compte de test :
  - opération correcte acceptée ; création avec stock initial acceptée ; création avec stock 0 acceptée ;
  - quantité modifiée sans mouvement : refusée ;
  - mouvement sans modification du produit : refusé ;
  - écart entre le mouvement et la quantité : refusé ;
  - même identifiant rejoué : refusé, sans double comptage ;
  - ancien mouvement réutilisé : refusé ;
  - mouvement modifié ou supprimé : refusé ;
  - accès aux données d'un autre compte : refusé.

**Compte rendu de la phase 4b (2026-11-16)**

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test et les règles version 5 publiées :

| Test | Résultat |
|---|---|
| `tests-regles.html` : 70 essais sur 70 | Réussi |
| Lot complet (entrée, sortie, ajustement) accepté, y compris sur un produit archivé | Réussi |
| Quantité augmentée exactement de la valeur du mouvement (lecture sur le serveur) | Réussi |
| Même numéro de mouvement renvoyé : refusé, quantité non comptée deux fois | Réussi |
| Mouvement sans changement de stock, changement sans mouvement, chiffres discordants, ancien mouvement réutilisé, autre numéro désigné : refusés | Réussi |
| Mouvement modifié ou supprimé : refusé | Réussi |
| Valeur 0, valeur à virgule, type inconnu ou incohérent, motif trop long, autre auteur, heure serveur choisie par l'appareil, champ inconnu : refusés | Réussi |
| Produit créé avec stock de départ et mouvement d'entrée : accepté ; sans mouvement, avec chiffres discordants ou négatif : refusé | Réussi |
| Application : entrée +10, sortie -2,5, ajustement -0,5 sur un produit à 0 : quantité 7, égale à la somme des mouvements sur le serveur | Réussi |
| Affichage immédiat « En attente de synchronisation », puis confirmation | Réussi |
| Produit « Ciment » créé avec un stock de départ de 12,5 : mouvement « Stock initial » présent | Réussi |
| Sortie de 15 sur 12,5 : avertissement avant l'envoi, puis « Stock négatif : à vérifier » | Réussi |
| Refus simulé : bloc « Opérations refusées » affiché, bouton « J'ai noté » | Réussi |
| Opération déjà enregistrée renvoyée : message « était déjà enregistrée », quantité inchangée | Réussi |
| Réouverture avec une opération notée « en attente » mais absente du serveur : signalée comme refusée ; une autre, présente sur le serveur : retirée sans message | Réussi |
| Historique : ordre, motif, heure ; 56 mouvements ajoutés, « Voir plus » passe de 50 à 65 lignes, sans doublon | Réussi |
| 56 mouvements alternés +1 / -1 : la quantité revient exactement à 7 | Réussi |
| Formulaire de mouvement à 360 pixels, cibles d'au moins 48 pixels | Réussi |

Tests non exécutés :

- Mouvement fait réellement hors ligne (mode avion), puis retour en ligne.
- Coupure de connexion entre l'envoi et la réponse (le renvoi automatique par Firebase n'a été que simulé).
- Deux appareils modifiant le même produit.
- « Voir plus » sans Internet (avertissement d'historique incomplet).
- Affichage des deux heures quand l'écart dépasse 5 minutes (aucun mouvement dans ce cas).
- Smartphone : impossible avant la mise en ligne.

Constats :

- **Point incertain n° 1 levé :** les règles voient bien la quantité après l'addition faite par le serveur (`increment`), dans `request.resource` comme dans `getAfter()`.
- **Point à vérifier n° 3 :** les lots de l'application (2 écritures) sont acceptés. La limite documentée par Firebase est de 20 appels de vérification par lot et 10 par écriture ; les appels répétés sur un même document ne comptent qu'une fois. Le nombre exact d'appels n'a pas été mesuré. La taille de lot sûre pour la suppression du compte reste à déterminer en phase 7.
- Les refus et le cas « déjà enregistrée » ont été provoqués en appelant les fonctions de l'application avec des données fabriquées, pas par une vraie coupure de réseau.
- L'historique du compte de test contient maintenant 65 mouvements, dont 56 « Essai du bouton Voir plus ». Ils ne peuvent pas être supprimés.
- Compte de test : « Riz 25 kg (Tchako) » à 7 sac, « Ciment » à -2,5 sac, trois produits archivés.
- Le suivi des opérations utilise `localStorage`, par compte (clé `operations-en-attente:{uid}`).
- Un passage complet de `tests-regles.html` dure environ une minute.

### Étape intermédiaire : dépôt public et GitHub Pages
- **Résultat :** recherche de secrets dans les fichiers et tout l'historique Git ; règles publiées ; dépôt passé en public ; GitHub Pages activé ; `saintfranckinder.github.io` dans les domaines autorisés de Firebase Authentication.
- **Test :** le lien s'ouvre sur le smartphone et la connexion fonctionne.

**Compte rendu partiel : recherche de secrets (2026-11-18)**

Faite avec l'accord du propriétaire **avant tout envoi sur GitHub** (le dépôt `minstock` était encore vide), avec le Git de GitHub Desktop, sur les 7 commits de la branche `main` (seule branche, aucune étiquette). Le commit de ce compte rendu a été revérifié après sa création.

| Vérification | Résultat |
|---|---|
| Tous les fichiers ayant existé dans l'historique (34) : aucun fichier inattendu | Réussi |
| `.env.test`, et tout fichier `.env*`, `.pem`, `.key`, compte de service, `.firebaserc` ou `.claude/` : jamais commité ; `.env.test` ignoré par Git | Réussi |
| Clés privées et jetons connus (GitHub, AWS, Slack, compte de service Google…), `vendor/` compris : aucun | Réussi |
| Clé d'API Google : seulement dans `js/firebase-config.js`, ce qui est normal (configuration web, pas un secret) | Réussi |
| Mots de passe écrits en clair : aucun (3 fausses alertes : case « Afficher le mot de passe », message d'erreur) | Réussi |
| Mot de passe du compte de test : absent des fichiers et des messages de commit (recherché sans être affiché) | Réussi |
| Adresses e-mail : seulement l'adresse fictive du compte de test dans `PLAN.md` ; aucune adresse `gmail.com` | Réussi |
| Auteur et validateur de tous les commits : uniquement l'adresse `noreply` de GitHub | Réussi |
| Messages de commit : ni secret ni adresse | Réussi |

Limites : la recherche porte sur des formes connues de secrets ; un secret de forme inhabituelle pourrait lui échapper. Les fichiers de `vendor/` sont des copies officielles (`vendor/LISEZMOI.md`) : ils n'ont été fouillés que pour les clés, les jetons et les adresses e-mail.

**Compte rendu partiel : protections avant la mise en public (2026-11-18)**

Décisions 40 et 41, validées par le propriétaire. Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/` :

| Test | Résultat |
|---|---|
| `tests-regles.html` avec `test-phase3@example.com` : 67 essais sur 67 (la création des produits d'essai n'est pas rejouée) | Réussi |
| Aucun compte connecté : bouton « Lancer les tests » bloqué | Réussi |
| Second compte de test `test-isolation@example.org` : bouton bloqué, message « Ce compte n'est pas un compte de test » | Réussi |
| Même compte, bouton débloqué de force puis cliqué : aucun essai lancé, rien d'écrit | Réussi |
| Second compte : écran « Créer votre entrepôt », puis « Aucun produit pour l'instant » ; il ne voit pas les données du premier | Réussi |
| Page de test à 360 pixels sans défilement horizontal ; aucune erreur dans la console | Réussi |
| Fichier vide `.nojekyll` créé à la racine | Fait |

Tests non exécutés :

- Le contrôle placé au début du lancement des essais ne peut pas être déclenché sans modifier la page ; il utilise la même fonction que les deux contrôles testés.
- Effet réel de `.nojekyll` : à vérifier sur GitHub Pages (les trois fichiers Firebase doivent se charger depuis `vendor/`).

Constats :

- Second compte de test : `test-isolation@example.org`, mot de passe dans `.env.test` (ignoré par Git), entrepôt « Entrepôt isolation (test) » sans produit. À supprimer en fin de projet, comme le premier.
- Compte de test principal : 68 mouvements après ce passage.

**Compte rendu partiel : mise en ligne (2026-11-18)**

Actions du propriétaire, guidé clic par clic : « Publish branch » dans GitHub Desktop ; `saintfranckinder.github.io` dans les domaines autorisés de Firebase Authentication ; dépôt passé en public ; GitHub Pages activé (branche `main`, dossier racine) ; protection contre l'envoi de secrets (Push protection) vérifiée dans les réglages GitHub.

Vérifications de l'assistant :

| Vérification | Résultat |
|---|---|
| Les 9 commits sont sur GitHub, identiques à la copie locale (dernier : `d5a7808`) | Réussi |
| Le dépôt est public et GitHub Pages est actif (vu sans connexion, par l'API publique de GitHub) | Réussi |
| `https://saintfranckinder.github.io/minstock/` : page, style, 13 modules `js/` et les 3 fichiers Firebase répondent (code 200) | Réussi |
| Les 3 fichiers de `vendor/` ont exactement la même taille qu'en local : `.nojekyll` fonctionne (décision 41) | Réussi |
| `.env.test` absent du site (404) et du dépôt public | Réussi |
| Dans Chrome, le site affiche l'écran « Connexion » avec le bouton Google ; tous les fichiers de l'application viennent de `/minstock/` ; aucun appel à `gstatic.com` ; aucune erreur de l'application dans la console | Réussi |

Tests non exécutés par l'assistant :

- Connexion sur le site en ligne : l'assistant ne saisit pas de mot de passe sur le site public. À faire par le propriétaire, sur smartphone ; la connexion Google confirmera aussi le domaine autorisé.
- Réglages GitHub (Push protection) et domaine autorisé dans Firebase : faits par le propriétaire, non vus par l'assistant.
- Affichage à 360 pixels sur le site en ligne : mêmes fichiers que sur `localhost`, où il a été testé ; à confirmer sur le smartphone.

Constat : juste après la mise en ligne, GitHub Pages a répondu 503 au lieu de 404 pour des fichiers inexistants ; quelques secondes plus tard, `.env.test` répondait bien 404. Défaut passager de GitHub Pages, sans conséquence.

**Premier test sur smartphone (2026-11-18), fait par le propriétaire**

Le propriétaire indique que tout fonctionne, sur `https://saintfranckinder.github.io/minstock/` :

- site ouvert sur le téléphone, affichage lisible ;
- connexion par e-mail avec le compte de test ;
- entrée de 1 sur « Riz 25 kg (Tchako) » (attendu : de 7 à 8 sac), puis ligne visible dans l'historique ;
- connexion avec Google : le domaine `saintfranckinder.github.io` est donc bien autorisé dans Firebase.

Non précisé : modèle du téléphone et navigateur ; type de clavier proposé pour la quantité ; création ou non d'un vrai entrepôt avec le compte Google du propriétaire. Non testé : message d'aide quand la fenêtre Google est bloquée.

**Étape terminée le 2026-11-18.**

### Phase 5 : tableau de bord
- **Résultat :** liste, recherche, quantité, seuil, prix, valeur « indicative », `+1` / `-1` (48 × 48 px), saisie d'une quantité précise, alertes `Stock bas` et `Rupture`.
- **Tests :** smartphone (360 px) et ordinateur ; alertes orange et rouge avec leur texte.

**Compte rendu de la phase 5 (2026-11-18)**

Choix validés par le propriétaire avant de coder : décisions 44 (`−1` qui rendrait le stock négatif : formulaire prérempli) et 45 (stock négatif compté en négatif dans le total). Les règles Firestore ne changent pas (version 5).

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test :

| Test | Résultat |
|---|---|
| `tests-nombres.html` : 104 essais sur 104, dont 6 nouveaux sur le total (entrepôt vide, stock négatif, somme des lignes arrondies, très grands nombres, affichage négatif) | Réussi |
| Alertes : Riz 8 / seuil 3 sans alerte ; 2 / seuil 5 « Stock bas » orange ; 5 / seuil 5 « Stock bas » ; 6 / seuil 5 sans alerte ; 0 / seuil 0 « Rupture » rouge ; -2,5 « Rupture » et « Stock négatif : à vérifier » | Réussi |
| Valeurs : 10 400,00 ; -2 375,00 ; 20,00 puis 50,00 ; 0,00 HTG ; total égal à la somme des lignes à chaque étape (8 025,00 ; 8 045,00 ; 8 075,00) | Réussi |
| Recherche : `riz`, `RIZ`, `cimént`, `  CIM  `, `zero`, `tchako)` trouvent le bon produit ; `zzz` affiche « Aucun produit ne correspond » ; le total ne change pas pendant une recherche | Réussi |
| `+1` : 10 appuis rapides (dont 1 au clavier) sur le Riz, de 8 à 18 sac ; sur le serveur : 18 000 millièmes et exactement 10 mouvements « Entrée +1 », sans doublon | Réussi |
| « En attente de synchronisation » puis confirmation ; aucune opération suivie restante après la synchronisation | Réussi |
| `−1` sur un stock à 0 : formulaire prérempli (Sortie, 1) avec « le stock deviendra négatif » ; « Annuler » : rien n'est envoyé, stock inchangé | Réussi |
| `−1` ordinaire : de 6 à 5 pièces, « Stock bas » réapparaît | Réussi |
| Formulaire « Mouvement de stock » après la mise en commun de l'envoi : Sortie de 10, le Riz revient à 8 sac | Réussi |
| Clavier : après un appui sur Entrée, le focus reste sur le bouton `+1` du même produit, contour visible | Réussi |
| 360 pixels : aucun défilement horizontal ; boutons `−1` / `+1` d'au moins 56 × 48 pixels, écartés de 12 pixels ; champ de recherche de 48 pixels de haut, police de 16 pixels | Réussi |
| Historique : les appuis rapides apparaissent comme « Entrée : +1 sac » ou « Sortie : -1 pièce » | Réussi |
| `tests-regles.html` : 67 essais sur 67 | Réussi |
| Aucune erreur dans la console | Réussi |

Tests non exécutés :

- *(Fait le 2026-11-18 par le propriétaire : voir plus bas.)* Smartphone.
- Appuis hors ligne réels (mode avion) : phase 8.
- Deux appareils qui appuient sur le même produit : phase 8 ou 12.
- Lecteur d'écran réel : l'annonce « Entrée +1 sac — … Quantité mise à jour sur cet appareil. » est bien écrite dans la zone prévue, mais n'a pas été écoutée avec un lecteur d'écran.

Constats :

- Le compte de test contient deux nouveaux produits, « Essai phase 5 (stock bas) » (5 pièces) et « Essai phase 5 (zéro) » (0 pièce), et 20 mouvements de plus (essais et 3 de `tests-regles.html`).
- Le mouvement « Test smartphone » du propriétaire est présent sur le serveur : son test de l'étape « dépôt public » est confirmé.
- La liste est reconstruite à chaque changement ; elle reste rapide avec quelques produits. À revoir si un entrepôt approche la taille à annoncer (question ouverte de la section 4).

**Test sur smartphone (2026-11-18), fait par le propriétaire**

Sur `https://saintfranckinder.github.io/minstock/`, version 0.6.0 affichée, avec le compte de test (captures d'écran envoyées à l'assistant) :

- `+1` au doigt : « Ciment » de -2,5 à -1,5 sac, toujours « Rupture » avec bordure rouge, « Stock négatif : à vérifier » et valeur -1 425,00 HTG ; « Essai phase 5 (stock bas) » de 5 à 7 pièces, sans étiquette au-dessus du seuil de 5, valeur 70,00 HTG ; « Essai phase 5 (zéro) » de 0 à 1 pièce.
- `−1` : « Essai phase 5 (zéro) » de 1 à 0 pièce, puis un second `−1` ouvre le formulaire prérempli (Sortie, 1, stock après l'opération -1 pièce, « Attention : le stock deviendra négatif. »).
- Recherche : seul « Ciment » reste affiché.
- « En attente de synchronisation » s'affiche brièvement après chaque appui, puis disparaît : comportement normal, le message disparaît quand le serveur a confirmé.

Défaut constaté à cette occasion, sans danger : la ligne « En attente de synchronisation » s'ajoute dans la fiche du produit ; pendant un instant, les boutons « Mouvement de stock » et « Modifier » et les produits placés en dessous descendent, puis remontent. Les boutons `−1` et `+1` du produit touché ne bougent pas ; au pire, un appui tombe sur « Modifier », qui s'annule. Correction prévue en phase 8, avec l'indicateur de synchronisation (section 5, point 7).

Non précisé : lisibilité des étiquettes en extérieur ; modèle du téléphone et navigateur.

**Phase terminée le 2026-11-18.**

### Phase 6 : formulaires, historique, paramètres
- **Résultat :** formulaire d'ajout et de modification ; historique lisible (les deux dates distinguées) ; bouton « Annuler cette opération » sur chaque ligne (décision 43) ; nom de l'entrepôt modifiable ; devise modifiable seulement sans produit.
- **Tests :** devise bloquée dès qu'un produit existe ; historique compréhensible après renommage d'un produit ; annulation : le stock revient exactement à sa valeur, l'opération d'origine est marquée « annulée », une seconde annulation de la même opération est refusée sans double comptage, une annulation ne propose pas d'être annulée.

**Compte rendu de la phase 6 (2026-11-18)**

Choix validés par le propriétaire avant de coder : décisions 47 (pas de filtre par produit dans l'historique), 48 (cas où le bouton « Annuler cette opération » n'apparaît pas) et 49 (devise vérifiée auprès du serveur). Les règles Firestore ne changent pas (version 5) ; aucune nouvelle donnée dans la base.

Ce qui a été fait :

- Historique : bouton « Annuler cette opération » sur chaque ligne qui le permet ; fenêtre de confirmation (opération, opération inverse, stock estimé après, avertissement si négatif) ; opération inverse `ajustement` d'identifiant `annulation-{id}` envoyée par `envoyerMouvement`, le seul chemin d'envoi ; mention « Annulée le … » sur l'opération d'origine ; « Produit archivé : cette opération ne peut plus être annulée » ; court texte d'aide en haut de l'historique ; le focus clavier reste sur la même ligne quand la liste est reconstruite.
- Message propre à une annulation déjà faite sur un autre appareil ; les messages « déjà enregistrée » s'affichent dans l'historique quand il est ouvert.
- Écran « Paramètres » (nouveau fichier `js/ecran-parametres.js`) : nom de l'entrepôt ; devise modifiable seulement si aucun produit n'existe (mémoire de l'appareil, puis serveur ; vérifiée de nouveau juste avant d'enregistrer ; délai maximal de 15 secondes) ; bouton « Vérifier de nouveau » sans Internet.
- Petites retouches : « le stock restera négatif » au lieu de « deviendra négatif » quand il l'est déjà (formulaire de mouvement et annulation) ; liste de devises bloquée gardée lisible (texte foncé sur fond gris clair).
- `tests-regles.html` : 5 essais d'annulation de plus (72 au total).
- Version `0.7.0`.

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec les deux comptes de test :

| Test | Résultat |
|---|---|
| `tests-nombres.html` : 104 sur 104 | Réussi |
| `tests-regles.html` : 72 sur 72, dont annulation acceptée, quantité revenue exactement au départ, seconde annulation refusée, rien compté deux fois | Réussi |
| Fenêtre de confirmation, réponse « Annuler » : rien n'est envoyé | Réussi |
| Annuler une entrée de +1 (« Essai phase 5 (stock bas) ») : de 7 à 6 pièces sur le serveur ; ligne « Ajustement : -1 pièce », motif « Annulation : Entrée +1 pièce du 18/11/2026 10:49 » ; origine « Annulée le … » ; focus resté sur la ligne | Réussi |
| Annuler une sortie de -1 (« Essai phase 5 (zéro) ») : de 0 à 1 pièce sur le serveur | Réussi |
| Ajustement de -2,5 sur « Ciment » (de -1,5 à -4) : pas de bouton tant qu'il est en attente, bouton après confirmation ; annulation avec « le stock restera négatif » ; retour exact à -1,5 sac sur le serveur | Réussi |
| Seconde annulation de la même opération, envoyée comme par un autre appareil : refusée par le serveur, stock inchangé (-1,5), message « Cette opération avait déjà été annulée… Rien n'a été compté deux fois. », aucune opération refusée affichée | Réussi |
| Pas de bouton sur une annulation ni sur une opération déjà annulée ; « Produit archivé » sur les opérations des produits archivés | Réussi |
| Paramètres, compte avec produits : devise bloquée avec explication ; nom vide, nom de 101 caractères refusés ; même nom signalé ; nouveau nom enregistré sur le serveur et affiché sur l'écran des produits, puis nom d'origine remis ; tentative forcée de changer la devise : rien n'est envoyé | Réussi |
| Paramètres, second compte de test (aucun produit) : devise libre ; passage à USD puis retour à HTG, vérifiés sur le serveur et sur l'écran des produits | Réussi |
| Paramètres sans réseau (réseau Firestore coupé) : « Vérification impossible sans Internet », bouton « Vérifier de nouveau » ; réseau rétabli : devise libre, focus sur la liste des devises | Réussi |
| Produit renommé puis nom d'origine remis : l'historique garde l'ancien nom sur les anciennes lignes | Réussi |
| Archivage d'un produit avec du stock : la confirmation indique « il reste 6 pièce en stock » (réponse « Annuler ») | Réussi |
| 360 pixels : aucun défilement horizontal ; boutons et champs de 294 × 48 pixels ; police de 16 pixels | Réussi |

Tests non exécutés :

- *(Fait le 2026-11-18 par le propriétaire : voir plus bas.)* Smartphone.
- Coupure réelle d'Internet (mode avion) pendant la vérification de la devise : la vérification s'arrête au plus tard après 15 secondes ; phase 8.
- Deux vrais appareils qui annulent la même opération : remplacé par l'envoi direct de la même annulation (même chemin que l'application) et par `tests-regles.html`.
- Affichage des deux heures quand l'écart dépasse 5 minutes : aucun mouvement de ce type dans le compte de test ; phase 8 (essais hors ligne).
- Lecteur d'écran réel et vraie navigation au clavier (touche Tab) : focus vérifié par programme seulement.

Constats :

- Le compte de test contient 4 mouvements de plus dans l'application (deux annulations, un ajustement de -2,5 sur « Ciment » et son annulation), plus 5 à chaque passage de `tests-regles.html`.
- L'historique affiché au démarrage peut contenir plus de 50 lignes (les mouvements gardés en mémoire de l'appareil d'une session précédente, plus les 50 derniers du serveur). Comportement de la phase 4b, sans conséquence ; noté pour mémoire.

**Test sur smartphone (2026-11-18), fait par le propriétaire**

Sur le site en ligne, version 0.7.0, avec le compte de test : le propriétaire indique que tout fonctionne (annulation d'une opération dans l'historique, écran « Paramètres » : renommer l'entrepôt puis remettre son nom, devise bloquée). Non précisé : quelle opération a été annulée ; modèle du téléphone et navigateur.

**Phase terminée le 2026-11-18.**

### Phase 6b : carnet de fournisseurs
- **Résultat :** liste des fournisseurs, recherche simple, formulaire d'ajout et de modification (nom obligatoire ; téléphone, WhatsApp, e-mail, adresse, produits fournis, notes), suppression (décision 50, à la place de l'archivage) ; règles Firestore version 6 pour `users/{uid}/suppliers` ; texte de confidentialité complété (décision 42).
- **Avant de coder :** proposer les longueurs maximales de chaque champ ; trancher les questions de la section 4 sur les fournisseurs ; expliquer comment les fournisseurs sont lus (écoute permanente ou chargement à l'ouverture de l'écran) au regard du quota de lectures.
- **Tests :** `tests-regles.html` complété (champs inconnus, longueurs, types, accès à un autre compte refusés) ; ajout, modification, suppression dans l'application ; un compte ne voit pas les fournisseurs d'un autre ; affichage à 360 pixels et sur smartphone.

**Compte rendu de la phase 6b (2026-11-18)**

Choix validés par le propriétaire avant de coder : décisions 50 (suppression définitive au lieu de l'archivage ; `CLAUDE.md` et `DEMARRAGE.md` mis à jour), 51 (noms en double autorisés avec avertissement), 52 (liste écoutée seulement pendant que l'écran est ouvert), 53 (boutons « Appeler », « WhatsApp », « E-mail ») et 54 (limites des champs).

Ce qui a été fait :

- Règles Firestore **version 6** : `users/{uid}/suppliers` (lecture, création, modification, suppression par le propriétaire du compte ; neuf champs exactement ; limites de la décision 54 ; dates du serveur ; date de création inchangée). Le reste est identique à la version 5. **Publiées par le propriétaire le 2026-11-18**, vérifiées actives (90 essais sur 90).
- Nouveaux fichiers `js/fournisseurs.js` (lecture et écriture) et `js/ecran-fournisseurs.js` (liste, recherche, liens de contact, formulaire, suppression) ; bouton « Fournisseurs » sur l'écran des produits ; deux écrans dans `index.html`.
- Texte de confidentialité complété (coordonnées des fournisseurs, données de tiers).
- `normaliserPourRecherche` déplacée dans `js/interface.js`, partagée par les produits et les fournisseurs (aucun changement de comportement).
- `tests-regles.html` : 18 essais de plus (90 au total quand les produits d'essai existent déjà, 93 sinon).
- Version `0.8.0`.

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec les deux comptes de test :

| Test | Résultat |
|---|---|
| Avant la publication des règles : l'écran « Fournisseurs » affiche « Impossible de charger les fournisseurs… règles de sécurité (version 6) ne sont peut-être pas encore publiées » ; le reste de l'application fonctionne | Réussi |
| `tests-regles.html` après publication : 90 sur 90, dont les 18 essais des fournisseurs (création, lecture, modification, suppression acceptées ; champ en trop, champ manquant, nom vide ou trop long, lettres dans un téléphone, WhatsApp trop long, téléphone en nombre, e-mail sans @, notes trop longues, dates choisies par l'appareil, accès à un autre compte refusés) | Réussi |
| Liste vide : « Chargement… » puis « Aucun fournisseur pour l'instant. » | Réussi |
| Formulaire : nom vide, nom de 101 caractères, lettres dans le téléphone, `#` dans WhatsApp, e-mail sans point, notes de 1 001 caractères refusés, avec un message clair et le curseur placé sur le champ | Réussi |
| Ajout de deux fournisseurs : « En attente de synchronisation » puis confirmation ; sur le serveur, exactement les neuf champs, champs vides enregistrés comme chaînes vides, nom sans espaces autour | Réussi |
| Liens : `tel:+50937123456`, `https://wa.me/50937123456` (nouvel onglet), `mailto:…` ; numéro WhatsApp sans indicatif : pas de bouton et phrase d'explication ; adresse sur deux lignes affichée sur deux lignes | Réussi |
| Nom en double (majuscules différentes) : avertissement avec le nom existant ; « Annuler » : rien n'est ajouté ; « OK » : ajouté | Réussi |
| Modification : notes changées sur le serveur, date de création inchangée ; pas d'avertissement de doublon pour son propre nom | Réussi |
| Suppression : « Annuler » ne fait rien ; confirmation : fournisseur effacé du serveur | Réussi |
| Recherche : `ciment` et `SABLE` (produits fournis), `  MARIE ` (nom), `zzz` (« Aucun fournisseur ne correspond ») | Réussi |
| Fournisseur supprimé « ailleurs » pendant que son formulaire est ouvert : retour à la liste avec un message | Réussi |
| Écoute arrêtée au retour à l'écran des produits : un fournisseur ajouté entre-temps n'apparaît qu'à la réouverture de l'écran | Réussi |
| Second compte de test : aucun fournisseur visible (0 sur le serveur pour ce compte) | Réussi |
| 360 pixels : aucun défilement horizontal ; « Appeler », « WhatsApp », « E-mail » côte à côte (environ 92 × 48 pixels) ; champs de 48 pixels, police de 16 pixels | Réussi |
| Aucune erreur dans la console | Réussi |

Tests non exécutés :

- *(Fait le 2026-11-18 par le propriétaire : voir plus bas.)* Smartphone.
- Liste des fournisseurs sans Internet (mode avion) : phase 8.
- Deux vrais appareils qui modifient le même fournisseur : non testé (dernière modification gagnante, comme les produits).
- Lecteur d'écran réel et vraie navigation au clavier (touche Tab).

Constats :

- Les fournisseurs d'essai ont tous été supprimés à la fin des essais : les comptes de test n'en contiennent aucun.
- L'entrepôt du compte de test s'appelle maintenant « NzuriDeal » (renommé par le propriétaire pendant son test de la phase 6). Laissé tel quel.

**Test sur smartphone (2026-11-18), fait par le propriétaire**

Sur le site en ligne, version 0.8.0, avec le compte de test : le propriétaire indique que tout fonctionne (ajout d'un fournisseur avec son propre numéro, « Appeler », « WhatsApp », recherche, modification, suppression). Non précisé : modèle du téléphone et navigateur.

Question du propriétaire à cette occasion : risque d'exposition des données des fournisseurs. Réponse donnée : données protégées par les règles (seul le compte propriétaire les lit ; vérifié par `tests-regles.html` et le second compte de test), aucune donnée dans le dépôt public, échanges chiffrés, affichage toujours en texte. Risques restants notés dans le README (« Appareil partagé », « Sécurité du compte ») et proposition en section 4 (effacer les données de l'appareil à la déconnexion).

**Phase terminée le 2026-11-18.**

### Étape intermédiaire : identité visuelle MinStock

Demandée par le propriétaire le 2026-11-18, avant la phase 7, avec son logo (fichier JPEG « MinStock Logo », 1536 × 1536) et sa maquette « MinStock – UI mobile glossy » (PDF de 8 pages : 7 écrans de téléphone et une planche pour ordinateur). Consigne du propriétaire : garder les options et réglages convenus, travail « propre et épuré ». Décisions 55 à 58.

**Compte rendu (2026-11-18)**

Ce qui a été fait :

- Nom « MinStock » : en-tête (symbole et nom en deux couleurs), onglet du navigateur, README.
- Symbole du logo redessiné en SVG (`images/logo-minstock.svg`, fond transparent), aussi utilisé comme icône d'onglet (pages de test comprises). Le JPEG d'origine n'est pas copié dans le dépôt.
- Police Montserrat téléchargée sur Google Fonts avec l'accord du propriétaire (`vendor/polices/montserrat-latin.woff2`, 37 956 octets, signature `wOF2` vérifiée, empreinte dans `vendor/LISEZMOI.md`) et sa licence `OFL-Montserrat.txt` ; `*.woff2` déclaré binaire dans `.gitattributes`.
- `css/style.css` réécrit avec les mêmes classes : couleurs en variables, fond dégradé léger, cartes claires très arrondies avec ombre douce, boutons principaux bleu nuit légèrement brillants, `+1` bleu plein, `−1` blanc, alertes sur fond teinté avec bordure de couleur et étiquette écrite, quantité colorée selon l'alerte, carte « Valeur du stock » bleu nuit, type de mouvement choisi entouré de bleu.
- Trois compteurs dans la carte de valeur (produits, « Stock bas », « Ruptures »), au singulier pour 0 et 1.
- Version `0.9.0`. Aucun changement des données ni des règles Firestore.

Tests exécutés par l'assistant, dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test :

| Test | Résultat |
|---|---|
| Contrastes des couleurs proposées (calculés) : textes de 5,4 à 12,6, bordures d'alerte de 3,6 à 4,5 | Réussi |
| Police Montserrat chargée depuis le projet (aucun appel à Google pendant l'utilisation) | Réussi |
| Compteurs : 4 produits, 0 puis 1 « Stock bas » (produit d'essai passé de 7 à 5 pièces), 2 « Ruptures », conformes aux cartes affichées | Réussi |
| Écrans connexion, produits (carte normale, « Stock bas », « Rupture »), mouvement, historique (bouton d'annulation, « Annulée le »), paramètres, fournisseurs : affichage vérifié sur captures | Réussi |
| 360 pixels : aucun défilement horizontal sur les écrans produits, mouvement, fiche produit, historique, paramètres, fournisseurs ; boutons `−1` / `+1` de 56 × 48 pixels ; compteurs de 92 × 64 pixels | Réussi |
| En-tête aligné sur le contenu des écrans | Réussi (corrigé pendant les essais) |
| `tests-nombres.html` : 104 sur 104 | Réussi |
| Aucune erreur dans la console | Réussi |

Tests non exécutés : lecteur d'écran réel ; très grande taille de texte réglée dans le téléphone.

**Test sur smartphone (2026-11-18), fait par le propriétaire :** version 0.9.0 sur le site en ligne, avec le compte de test ; capture envoyée (en-tête MinStock, carte bleu nuit avec « 4 Produits », « 1 Stock bas », « 2 Ruptures », boutons). Le propriétaire indique que le résultat lui plaît, et demande que les compteurs soient cliquables pour afficher les produits concernés (décision 59). Non précisé : test en extérieur.

Constat : le produit « Essai phase 5 (stock bas) » du compte de test est revenu à 5 pièces (seuil 5), pour montrer l'alerte « Stock bas » (2 mouvements de plus).

**Compteurs cliquables (décision 59), 2026-11-18**

Demandés par le propriétaire après son test sur smartphone. Les trois compteurs de la carte de valeur sont devenus des boutons : « Stock bas » et « Ruptures » filtrent la liste, « Produits » et « Tout afficher » enlèvent le filtre. Version `0.9.1`. Fichiers : `index.html`, `css/style.css`, `js/ecran-produits.js`, `js/app.js`.

Tests exécutés par l'assistant, sur `http://localhost:8080/`, avec le compte de test :

| Test | Résultat |
|---|---|
| « Ruptures » : Ciment et Essai (zéro) seulement, « Filtre « Ruptures » : 2 produits affichés. », compteur mis en évidence, écran descendu jusqu'à la liste, total inchangé | Réussi |
| « Stock bas » : Essai (stock bas) seulement, « 1 produit affiché. » | Réussi |
| `+1` sur le produit filtré (5 → 6, sorti de l'alerte) : il reste affiché avec le focus sur `+1`, la ligne propose de retoucher « Stock bas » ; `−1` sur la même carte (6 → 5) : elle est toujours là | Réussi |
| Filtre vide : « Aucun produit en stock bas pour l'instant. », sans autre message | Réussi |
| Recherche dans un filtre (`cim` → Ciment ; `zzz` → « Aucun produit ne correspond ») ; choisir un filtre vide la recherche | Réussi |
| « Modifier » puis « Annuler » : le filtre reste ; « Ajouter un produit » : le filtre s'enlève | Réussi |
| « Tout afficher » et compteur « Produits » : les 4 produits, focus sur le titre « Produits », annonce pour les lecteurs d'écran | Réussi |
| Clavier : Entrée sur le compteur « Ruptures » applique le filtre, Tab mène à « Tout afficher » (contour visible) | Réussi |
| Déconnexion avec un filtre actif, puis reconnexion : plus de filtre | Réussi |
| 360 pixels : aucun défilement horizontal (écran des produits filtré, historique, fournisseurs, paramètres) ; compteurs de 92 × 64 pixels, « Tout afficher » de 48 pixels de haut | Réussi |
| Non-régression : `tests-nombres.html` 104 sur 104 ; `tests-regles.html` 90 sur 90 ; aucune erreur dans la console | Réussi |

Non testé : lecteur d'écran réel.

**Test sur smartphone (2026-11-18), fait par le propriétaire :** version 0.9.1 sur le site en ligne ; le propriétaire indique que les compteurs cliquables fonctionnent.

Question du propriétaire à cette occasion : pourquoi « Ciment » affiche des demi-sacs (7,5) après des `+1`. Vérifié sur le serveur, sans rien modifier : son stock de départ d'essai était de 12,5 sacs (phase 4b) ; chaque `+1` ajoute exactement 1 ; la somme des 14 mouvements du Ciment (7,5) et celle des 79 mouvements du Riz (4) sont égales aux quantités enregistrées. Correction possible pour un vrai produit : ajustement de `+0,5` ou `-0,5` avec un motif.

### Phase 7 : suppression du compte
- **Résultat :** double confirmation, rappel d'exporter, reconnexion demandée en premier, suppression en ligne uniquement, reprise automatique si `suppressionDemandee` est vrai. Les fournisseurs sont supprimés avec le reste (décision 42).
- **Tests (compte de test uniquement) :**
  - suppression complète ; données et compte disparus dans la console ;
  - suppression interrompue (fermer l'application au milieu), puis reprise à la connexion suivante ;
  - tentative hors ligne : refusée avec un message clair.

**Compte rendu de la phase 7 (2026-11-18)**

Choix validés par le propriétaire avant de coder : décisions 60 (double confirmation et reconnexion), 61 (règles version 7, dont le blocage des ajouts pendant une suppression), 62 (déroulement, effacement de la copie locale à la fin) et 63 (comptes jetables). Changement signalé au propriétaire après coup : les produits sont effacés **avant** les mouvements (et non après, comme dans le plan présenté), pour qu'un mouvement envoyé en retard par un autre appareil soit refusé sans ajouter de lecture à chaque mouvement (décision 62).

Ce qui a été fait :

- Règles Firestore **version 7** (publiées par le propriétaire le 2026-11-18) : demande de suppression `false → true` seule et sans retour ; entrepôt figé puis supprimable après la demande ; produits et mouvements supprimables seulement après la demande ; création de produit ou de fournisseur refusée si l'entrepôt n'existe pas ou si sa suppression est demandée.
- **Danger évité :** l'ancien essai « Demander la suppression du compte » de `tests-regles.html`, qui attendait un refus, aurait été accepté par la version 7 et aurait lancé la suppression du compte de test principal. Il a été retiré de la série habituelle avec « Supprimer son entrepôt » ; les deux sont refaits dans une série réservée aux comptes jetables. La série habituelle refuse en plus de tourner sur un compte en cours de suppression.
- `tests-regles.html` : série « suppression du compte » de 20 essais, lancée seulement avec un compte `test-suppression…@example.com` ; la série habituelle compte désormais 88 essais (91 si les produits d'essai sont à créer).
- Nouveaux fichiers `js/suppression-compte.js` (demande par transaction, effacement par paquets de 100, effacement de la copie locale) et `js/ecran-suppression.js` (écrans de confirmation et d'avancement, reprise, reconnexion pour la dernière étape) ; `js/auth.js` (reconnexion par mot de passe ou Google, suppression du compte de connexion) ; `js/app.js` (reprise automatique dès que `suppressionDemandee` est vrai, message après le rechargement) ; trois messages d'erreur ajoutés ; bloc « Supprimer mon compte » dans Paramètres et message sur l'écran de connexion.
- Version `0.10.0`.

Tests exécutés par l'assistant, sur `http://localhost:8080/`, avec le compte de test principal et trois comptes jetables créés pour l'occasion (accord du propriétaire) :

| Test | Résultat |
|---|---|
| Série habituelle de `tests-regles.html` avec les règles version 7 (compte principal) : 88 sur 88 | Réussi |
| Série « suppression du compte » (compte jetable 1) : 20 sur 20 — effacements refusés sans demande, demande accompagnée d'un autre changement refusée, demande acceptée, retour en arrière refusé, renommage refusé pendant la suppression, création de produit et de fournisseur refusée, effacement chez un autre compte refusé, lot de 4 effacements accepté, entrepôt supprimé après la demande, plus aucune création possible sans entrepôt | Réussi |
| Taille sûre des paquets (section 3, n° 3) : 120 produits créés, demande de suppression, **un lot de 100 suppressions accepté en une seconde** (la lecture de l'entrepôt faite par les règles n'est comptée qu'une fois par lot) ; paquets de 100 retenus | Réussi |
| Formulaire (compte jetable 2) : case non cochée, mot mal tapé, mot de passe vide, mauvais mot de passe : refusés avec « Rien n'a été supprimé », curseur sur le champ ; sur le serveur, aucune demande enregistrée ; « Annuler » ramène aux Paramètres | Réussi |
| Suppression complète (compte jetable 2, mot `supprimer` en minuscules accepté) : avancement Produits → Historique → Fournisseurs → Entrepôt → compte de connexion, 10 éléments (3 produits, 5 mouvements, 1 fournisseur, l'entrepôt) ; rechargement ; « Votre compte et toutes vos données ont été supprimés. » ; copie locale Firestore et marques locales effacées ; nouvelle connexion avec ce compte refusée | Réussi |
| Suppression interrompue (compte jetable 3) : arrêt dès le début, message « La suppression s'est arrêtée… » et bouton « Réessayer » ; page rechargée comme après une fermeture : l'application revient d'elle-même sur l'écran de suppression, termine (9 éléments et l'entrepôt), affiche le message final ; nouvelle connexion refusée | Réussi |
| Sans Internet (compte jetable 1) : navigateur hors ligne → « Pas de connexion Internet… Rien n'a été supprimé » ; réseau en panne pendant la reconnexion → même refus ; sur le serveur, aucune demande enregistrée | Réussi |
| 360 pixels : aucun défilement horizontal (Paramètres, confirmation, avancement) ; bouton « Supprimer définitivement » et champs de 48 pixels de haut | Réussi |
| Compte de test principal intact (« NzuriDeal », 4 produits, aucune demande de suppression) | Réussi |

Tests non exécutés :

- Smartphone du propriétaire, **avec un compte jetable uniquement**.
- Reconnexion par la fenêtre Google : aucun compte Google de test.
- Reconnexion demandée par Firebase pour la dernière étape (`auth/requires-recent-login`) : ne se produit qu'après plusieurs minutes ; écran prévu mais non déclenché.
- Coupure d'Internet réelle (mode avion) pendant la suppression ; deux appareils connectés au même compte pendant la suppression ; reprise « Terminer la suppression » quand seul le compte de connexion reste.
- Constat d'essai : couper le réseau de Firestore depuis la page n'empêche pas les transactions ; le premier essai « sans réseau » a donc réellement envoyé la demande du compte jetable 3, ce qui a servi d'essai de suppression interrompue. Le refus sans Internet a ensuite été vérifié autrement (voir le tableau).

**Test sur smartphone (2026-11-18), fait par le propriétaire :** version 0.10.0 sur le site en ligne, avec un compte jetable créé sur le téléphone ; le propriétaire indique que tout fonctionne (création du compte et de l'entrepôt, ajout d'un produit, suppression complète, retour à l'écran de connexion avec le message). Non précisé : adresse exacte du compte jetable utilisé.

**Phase terminée le 2026-11-18.**

### Phase 8 : hors ligne et indicateur
- **Résultat :** indicateur à quatre états, présenté comme approximatif ; messages pour les opérations refusées et « déjà enregistrées » ; avertissement avant déconnexion s'il reste des écritures en attente ; demande de stockage persistant au navigateur ; mention « En attente de synchronisation » qui ne fait plus bouger les boutons placés en dessous (défaut constaté au test sur smartphone de la phase 5).
- **Tests :** étapes 1 à 7 et 9 à 11 de `DEMARRAGE.md` section 9 (application restée ouverte). L'étape 8 (rouvrir en mode avion) est testée en phase 10.

**Plan présenté au propriétaire le 2026-11-18 (en attente de son accord, rien n'est codé)**

Quatre choix recommandés par l'assistant, à valider :

1. **Indicateur dans l'en-tête**, à droite du logo (comme la maquette) : mot écrit et pastille de couleur — « Synchronisé », « En attente de synchronisation », « Hors ligne » (avec une ligne « des modifications attendent d'être envoyées », sans nombre), « Erreur de synchronisation » (un toucher mène au bloc « Opérations refusées »). Un toucher affiche une courte explication : indicateur approximatif. Une à deux secondes d'attente avant de changer d'état, pour éviter le clignotement. Calcul prévu : erreur si une opération est refusée ; sinon hors ligne si `navigator.onLine` est faux ou si les données ne viennent que de la mémoire de l'appareil (de façon durable) ; sinon en attente si `hasPendingWrites` ; sinon synchronisé.
2. **« En attente » à la place du mot « Quantité »** dans la fiche du produit (même ligne), au lieu de la ligne ajoutée qui fait bouger les boutons (section 5, point 7).
3. **Avertissement avant « Se déconnecter »** s'il reste des modifications non envoyées : elles restent sur l'appareil et partiront à la prochaine connexion ici, mais seraient perdues si les données du navigateur étaient effacées.
4. **Nouvelle option dans Paramètres : « Effacer les données de cet appareil et me déconnecter »** (appareils partagés, section 4), refusée tant que des modifications attendent ; réutilise l'effacement de la copie locale de la phase 7.

En plus, sans changement visible : demande de stockage persistant au navigateur (`navigator.storage.persist()`). Aucune modification des règles Firestore. Fichiers prévus : nouveau `js/indicateur-synchro.js` ; `index.html`, `css/style.css`, `js/app.js`, `js/ecran-produits.js`, `js/ecran-mouvements.js`, `js/produits.js`, `js/mouvements.js`, `js/ecran-parametres.js` ; version `0.11.0`. Essais : coupures simulées sur l'ordinateur (attention : `disableNetwork` de Firestore ne bloque pas les transactions, voir 8.5) ; vrai essai en mode avion par le propriétaire sur son téléphone, avec un guide pas à pas.

### Phase 9 : export Excel
- **Résultat :** `stock_AAAA-MM-JJ.xlsx`, feuilles `Stock`, `Historique` et `Fournisseurs` (décision 42), SheetJS local (pris sur le site officiel de l'éditeur, version fixe), avertissements hors ligne / en attente.
- **Tests :** ouverture dans Excel, décimales correctes ; export hors ligne avec avertissement ; téléchargement sur smartphone.

### Phase 10 : PWA
- **Résultat :** manifeste, icônes, service worker (fichiers de l'application seulement, jamais les échanges avec Firebase), bouton « Nouvelle version disponible ».
- **Tests :** installation sur le téléphone ; réouverture en mode avion après une visite en ligne ; connexion Google dans l'application installée ; mise à jour visible après une nouvelle publication.

### Phase 11 : données de démonstration
- **Résultat :** bouton visible seulement si l'entrepôt est vide ; un lot par produit, par le même chemin que les vraies opérations.
- **Tests :** bouton absent dès qu'un produit existe ; historique cohérent avec les quantités.

### Phase 12 : audit final
- **Résultat :** rapport classé par gravité (règles, doublons, nombres, suppression, hors ligne, export, mobile, secrets). App Check et autres protections avancées évalués à ce moment.
- **Tests :** rejouer `tests-regles.html` et `tests-nombres.html` ; test à deux appareils sur le même produit.

### Phase 13 : documentation et publication finale
- **Résultat :** README complet en français (limites connues, sauvegarde par export, paramètres de déploiement, changement d'hébergeur).
- **Tests :** lien final testé sur ordinateur et smartphone.

## 3. Points à vérifier par un essai réel

Ces points viennent de l'analyse et n'ont pas été testés.

1. *(Vérifié le 2026-11-16.)* Avec la méthode moderne de persistance, un échec n'est pas signalé à l'application. Solution en place : test du stockage local au démarrage (voir le compte rendu de la phase 2).
2. *(Vérifié en partie le 2026-11-16.)* Avec la protection contre l'énumération : l'inscription avec une adresse existante est refusée avec un message précis ; une mauvaise connexion donne un message générique ; « Mot de passe oublié » ne signale jamais d'adresse inconnue. Reste à tester par le propriétaire : le passage d'un compte par mot de passe à Google avec la même adresse.
3. *(Vérifié le 2026-11-18 pour les suppressions : un lot de 100 suppressions dont chaque règle lit l'entrepôt est accepté ; paquets de 100 retenus en phase 7.)* **Phase 11 :** taille de lot sûre pour les créations (produit et mouvement d'entrée, avec `getAfter`) à vérifier au moment voulu.

## 4. Propositions de l'analyse pas encore validées

À trancher avec le propriétaire au début de la phase concernée.

- *(Tranché : décision 32.)* Trier l'historique par `dateServeur` et afficher `dateAppareil` comme « fait le » (phase 4b).
- *(Tranché : décision 22.)* N'écouter en temps réel que les produits non archivés (phase 4a).
- *(Tranché : décision 47, pas pour l'instant.)* Filtre par produit dans l'historique : prévu par `DEMARRAGE.md` (phase 6) mais absent de `CLAUDE.md` ; il exige un index à créer dans la console.
- Annoncer une taille raisonnable d'entrepôt (environ 500 produits) à cause du quota de lectures.
- Facultatif : numéro de version affiché ; regroupement des appuis rapides sur `+1` ; vérification dans les règles que le compte n'est pas en cours de suppression.
- *(Tranché : décisions 23 et 24.)* Peut-on désarchiver un produit ? Un produit archivé compte-t-il dans la valeur du stock ?
- Les produits archivés doivent-ils figurer dans l'export Excel (feuille `Stock`) ? À trancher en phase 9.
- Appareil partagé (question du propriétaire, 2026-11-18) : la mémoire hors ligne du navigateur garde les données après « Se déconnecter » (vérifié : 68 documents encore présents après la déconnexion du compte de test). Proposition à étudier en phase 8 ou 12 : un bouton « Se déconnecter et effacer les données de cet appareil », qui refuserait d'effacer tant que des modifications attendent d'être envoyées (`CLAUDE.md` section 9 : ne jamais supprimer en silence des écritures en attente). Limite notée dans le README en attendant.
- *(Tranché : décision 18.)* Liste des devises proposées au premier lancement.
- *(Tranché : décisions 50 et 51.)* Fournisseurs (phase 6b) : suppression définitive plutôt qu'archivage, puisque ce sont des données personnelles de tiers et que rien ne s'y rattache ? Deux fournisseurs du même nom autorisés ? Fournisseurs archivés dans l'export Excel (question devenue sans objet) ?

## 5. Problèmes connus

1. *(Résolu le 2026-11-16.)* Le dépôt est cloné dans `C:\GitHub\Inventory Management\inventorymanagement` et relié à `saintfranckinder/minstock`. Renommé sur GitHub le 2026-11-18 (ancien nom : `inventorymanagement`) ; GitHub Desktop a mis à jour l'adresse du dépôt tout seul (vérifié le 2026-11-18).
2. **La commande `git` n'est pas dans le terminal, mais ce n'est pas bloquant.** Git for Windows est absent ; le Git interne de GitHub Desktop fonctionne (version 2.53, vérifié le 2026-11-16) et sert aux commits locaux. Chemin : `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe` (le numéro de version change à chaque mise à jour de GitHub Desktop : toujours le rechercher). Le nom et une adresse `noreply` sont déjà réglés : l'adresse personnelle n'apparaîtra pas dans les commits.
3. **Node.js, Java et Python ne sont pas installés** : pas d'émulateur Firebase, serveur local par script PowerShell.
4. **Une ancienne copie des fichiers existe dans `C:\Inventory Management`.** Elle n'est plus utilisée et ne contient ni ce plan ni les nouvelles décisions. Le propriétaire peut la supprimer.
5. **Le dépôt sur GitHub était vide au moment du premier commit local (phase 0).** La première publication se fait dans GitHub Desktop avec le bouton **Publish branch** ; les suivantes avec **Push origin**.
6. **Le fichier facultatif `.claude/settings.json`** proposé dans `DEMARRAGE.md` (phase 0) n'a pas été créé : le propriétaire ne l'a pas demandé.
7. **La ligne « En attente de synchronisation » fait bouger un instant les boutons placés en dessous** (constaté le 2026-11-18 sur smartphone, après un appui sur `+1` ou `−1`). Sans danger : au pire, un appui tombe sur « Modifier », qui s'annule. Correction prévue en phase 8.

## 6. Écarts corrigés entre les décisions validées et les autres fichiers

Corrigés le 2026-11-16 avec l'accord du propriétaire. Ce tableau garde la trace de ce qui a changé dans `CLAUDE.md` et `DEMARRAGE.md`.

| Fichier | Ancien texte | Nouveau texte |
|---|---|---|
| `CLAUDE.md` §3 et `DEMARRAGE.md` §8, phase 13 | Dépôt privé jusqu'à la publication, après l'audit | Public dès la fin de la phase 4b (décision 10) |
| `CLAUDE.md` §8 et §12 | Règles vérifiées avec le simulateur | Page `tests-regles.html` ; simulateur pour les refus simples (décision 8) |
| `CLAUDE.md` §8, suppression du compte | Reconnexion demandée à la fin si nécessaire | Reconnexion en premier, en ligne, avec reprise (décision 13) |
| `DEMARRAGE.md` phase 4 | Une seule phase | Phases 4a et 4b (décision 14) |
| `DEMARRAGE.md` phase 8 | Test de réouverture en mode avion | Test déplacé en phase 10 (décision 14) |
| `DEMARRAGE.md` §3 | Git for Windows installé, dépôt cloné | Déplacé dans « Reste à faire sur l'ordinateur » (section 5) |
| `DEMARRAGE.md` phase 0 | Créer `PLAN.md` vide | Ne pas remplacer `PLAN.md`, qui existe depuis la phase 1 |
| `CLAUDE.md` §3, §5, §6 | — | Ajouts : import du SDK corrigé et serveur local (décision 11), `dernierMouvementId` vide si stock 0 (décision 12), règles tolérantes au hors-ligne et liste locale (décision 9) |
| `CLAUDE.md` §4, §5, §8, §10, §12 et `DEMARRAGE.md` §4 (2026-11-18) | — | Ajouts validés par le propriétaire : carnet de fournisseurs, phase 6b, 3e feuille d'export, suppression du compte et confidentialité (décision 42) ; « Annuler cette opération » en phase 6, règle 12 de la section 6 (décision 43) ; ordre de priorité : fournisseurs avant les données de démonstration |
| `CLAUDE.md` §4 (point 15), §5, §8, §12 et `DEMARRAGE.md` phase 6b (2026-11-18) | Fournisseurs : « ajouter, modifier et archiver », champ `archive`, longueurs « fixées au début de la phase 6b » | Accord du propriétaire : « ajouter, modifier et supprimer », recherche et boutons de contact, champ `archive` retiré, longueurs de la décision 54 (décisions 50 à 54) |

## 7. Résumé de l'analyse des risques (phase 1)

Gravité élevée :
1. Le simulateur de règles ne teste qu'une écriture à la fois : il ne peut pas valider un lot produit + mouvement.
2. GitHub Pages gratuit exige un dépôt public : pas de test sur smartphone tant que le dépôt est privé.
3. Une écriture faite hors ligne puis refusée par le serveur après fermeture de l'application disparaît sans message.
4. Les fichiers du SDK Firebase copiés tels quels continuent d'appeler Internet.

Gravité moyenne : trous dans les règles du lien produit-mouvement ; suppression du compte interrompue ; même e-mail avec deux méthodes ; écritures en attente perdues (déconnexion, nettoyage du navigateur, iPhone non installé) ; règles et code publiés séparément ; quotas (relecture après 30 minutes de coupure, export complet, abus par inscription publique) ; date de tri de l'historique ; popup Google dans l'application installée sur iPhone ; échec de persistance non signalé ; écran figé si l'on attend la confirmation du serveur hors ligne.

Gravité faible : ajustement calculé sur une quantité ancienne ; dernier arrivé gagne sur le nom et le prix ; très grands nombres ; source de SheetJS ; devise contrôlée seulement dans l'interface ; changement d'hébergeur (données locales non transférées) ; adresse e-mail visible dans les commits publics ; téléchargement Excel sur iPhone.

Règles de conception retenues pour le code :
- Ne jamais attendre la confirmation du serveur pour mettre à jour l'écran ; afficher « en attente ».
- Les règles ne refusent jamais un mouvement à cause d'un état qui a pu changer sur un autre appareil (nom, archivage).
- Après la mise en service, ne publier que des changements de règles compatibles avec les versions déjà installées.

## 8. Note de passation

*Mise à jour le 2026-11-18, après la phase 7 et la présentation du plan de la phase 8. Cette note remplace les journaux intermédiaires des phases 3, 4a et 4b : leurs blocages sont résolus, et leur contenu est repris dans les comptes rendus de la section 2 et dans l'historique Git. Ne pas recommencer le projet ni réécrire le code qui fonctionne : reprendre à la section 8.7.*

### 8.1 Phase actuelle

- **Phase 7 (suppression du compte) terminée le 2026-11-18**, test sur smartphone réussi avec un compte jetable. Phases 5, 6, 6b et l'étape « identité visuelle » terminées le même jour. Prochaine étape : **phase 8** (hors ligne et indicateur de synchronisation). Plan présenté au propriétaire le 2026-11-18 ; rien n'est codé avant son accord.
- Version de l'application : `0.10.0`. Règles Firestore : **version 7**, publiée dans la console par le propriétaire le 2026-11-18, vérifiée active le même jour (série habituelle 88 sur 88 ; série « suppression » 20 sur 20).
- Dépôt GitHub : `saintfranckinder/minstock`, **public**. Site : `https://saintfranckinder.github.io/minstock/` (GitHub Pages, branche `main`, dossier racine).
- Dépôt Git, branche `main` : `cecf8d3` (phases 0 et 1), `48d55b3` (phase 2), `f09bf30` (phase 3), `96f2a3d` (phase 4a), `d8f1b5b` (phase 4b), `2f53da4` (note de passation), `b26abb6` (dépôt renommé), `e166a30` (recherche de secrets), `d5a7808` (décisions 40 et 41), `86d4eb4` (mise en ligne), `e1a5c70` (fin de l'étape « dépôt public »), `e202b2a` (décisions 42 et 43), `7e156a3` (phase 5), `eb40c59` (test sur smartphone de la phase 5), `456dff6` (phase 6), `de2ef92` (test sur smartphone de la phase 6), `14e00c9` (phase 6b), `36f5d20` (test sur smartphone de la phase 6b), `6eeb438` (identité visuelle), `c95d942` (compteurs cliquables), `f60525d` (test sur smartphone des compteurs), `d952342` (phase 7), `b2cc014` (test sur smartphone de la phase 7), puis cette note de passation. Le propriétaire envoie chaque commit avec **Push origin** dans GitHub Desktop ; le site se met à jour quelques minutes après.
- **État de l'envoi sur GitHub (vérifié le 2026-11-18) :** GitHub a reçu jusqu'à `d952342` : le site en ligne est en version `0.10.0`, identique au code. Restent à envoyer : `b2cc014` et cette note (documentation seulement).
- **Dossier de la session :** l'outil de travail peut s'ouvrir sur le dossier parent `C:\GitHub\Inventory Management` ; le dépôt reste `C:\GitHub\Inventory Management\inventorymanagement` (utiliser des chemins complets, et `git -C <dépôt>`).

### 8.2 Travail terminé

| Phase | Résultat | Preuve |
|---|---|---|
| 0 | `.gitignore`, `README.md`, dépôt relié à `saintfranckinder/minstock` (ancien nom : `inventorymanagement`) | commit `cecf8d3` |
| 1 | Analyse des risques, plan, décisions 8 à 15, `CLAUDE.md` et `DEMARRAGE.md` alignés | commit `cecf8d3` |
| 2 | Structure, SDK Firebase 13.4.0 et SheetJS 0.20.3 dans `vendor/` (import corrigé), mémoire hors ligne avec avertissement, serveur local | compte rendu de la phase 2 |
| 3 | Connexion Google et e-mail, inscription, mot de passe oublié, premier lancement, confidentialité, règles version 3 | `tests-regles.html` : 14 sur 14 |
| 4a | Conversion des nombres, produits (ajout, modification, archivage), règles version 4 | `tests-nombres.html` : 98 sur 98 ; `tests-regles.html` : 39 sur 39 |
| 4b | Mouvements (entrée, sortie, ajustement), stock de départ, historique (50 derniers puis « Voir plus »), suivi local des opérations refusées, règles version 5 | `tests-regles.html` : 70 sur 70 ; essais dans l'application (compte rendu de la phase 4b) |
| Dépôt public | Recherche de secrets, dépôt renommé `minstock`, page de test réservée aux comptes de test, `.nojekyll`, dépôt public, GitHub Pages | comptes rendus de l'étape « dépôt public » (section 2) |
| 5 | Tableau de bord : valeur du stock indicative et total, recherche, alertes « Stock bas » / « Rupture », boutons `−1` / `+1` | `tests-nombres.html` : 104 sur 104 ; `tests-regles.html` : 67 sur 67 ; compte rendu de la phase 5 ; test sur smartphone réussi |
| 6 | « Annuler cette opération » dans l'historique, écran « Paramètres » (nom de l'entrepôt, devise tant qu'aucun produit n'existe) | `tests-regles.html` : 72 sur 72 ; compte rendu de la phase 6 ; test sur smartphone réussi |
| 6b | Carnet de fournisseurs : liste, recherche, « Appeler » / « WhatsApp » / « E-mail », ajout, modification, suppression ; règles version 6 | `tests-regles.html` : 90 sur 90 ; compte rendu de la phase 6b ; test sur smartphone réussi |
| Identité | Nom MinStock, symbole SVG, police Montserrat, couleurs et style de la maquette, compteurs de la carte de valeur (cliquables) | compte rendu de l'étape « identité visuelle » ; tests sur smartphone réussis |
| 7 | Suppression du compte et de toutes ses données : double confirmation, reconnexion, effacement par paquets, reprise automatique, effacement de la copie locale ; règles version 7 | `tests-regles.html` : 88 sur 88 et 20 sur 20 (compte jetable) ; suppressions complète et interrompue réussies ; compte rendu de la phase 7 |

Les tests des phases 2 à 7 ont été exécutés par l'assistant dans le navigateur intégré, sur `http://localhost:8080/`, avec les comptes de test (et des comptes jetables pour la phase 7). Tests sur smartphone faits par le propriétaire le 2026-11-18, sur le site en ligne, tous réussis : étape « dépôt public », phases 5, 6 et 6b, identité visuelle, compteurs cliquables, phase 7 (avec un compte jetable).

### 8.3 Travail restant

**Tests du propriétaire en attente (phase 3) :**

1. *(Connexion Google réussie sur smartphone le 2026-11-18, selon le propriétaire.)* Reste : message d'aide si la fenêtre Google (popup) est bloquée.
2. Réception de l'e-mail « Mot de passe oublié », en français.
3. Même adresse e-mail par les deux méthodes, dans les deux ordres.

**Tests non faits, à reprendre dans la phase indiquée :**

| Test | Phase |
|---|---|
| *(Fait le 2026-11-18 pour les phases 5, 6, 6b, l'identité et la phase 7.)* Affichage sur smartphone, à refaire pour chaque nouvel écran | Phases 8, 9, 10 |
| *(Fait le 2026-11-18 par le propriétaire ; lisibilité en extérieur non précisée.)* Tableau de bord sur smartphone : recherche, boutons `−1` / `+1` au doigt, alertes | Phase 5 (propriétaire) |
| *(Fait le 2026-11-18 avec le second compte de test.)* Second compte réel qui ne voit pas les données du premier | Étape « dépôt public » |
| *(Avertissement d'archivage fait le 2026-11-18.)* Affichage des deux heures quand l'écart dépasse 5 minutes | Phase 8 |
| *(Fait le 2026-11-18 par le propriétaire.)* Historique et Paramètres sur smartphone : annuler une opération au doigt, renommer l'entrepôt, devise bloquée | Phase 6 (propriétaire) |
| *(Fait le 2026-11-18 par le propriétaire.)* Fournisseurs sur smartphone : ajouter, rechercher, « Appeler » et « WhatsApp » avec son propre numéro, modifier, supprimer | Phase 6b (propriétaire) |
| Liste des fournisseurs sans Internet (mode avion) | Phase 8 |
| *(Fait le 2026-11-18 par le propriétaire.)* Suppression du compte sur smartphone, **avec un compte jetable** | Phase 7 (propriétaire) |
| Suppression d'un compte Google (reconnexion par la fenêtre Google) ; reconnexion exigée par Firebase pour la dernière étape ; coupure réelle pendant la suppression ; deux appareils pendant la suppression | Phases 8 et 12 |
| Hors ligne réel (mode avion) : ajout de produit, mouvement, retour en ligne ; coupure entre l'envoi et la réponse ; « Voir plus » sans Internet ; premier chargement sans Internet sur un nouvel appareil | Phase 8 |
| Deux appareils qui modifient le même produit | Phase 8 ou 12 |
| Réouverture de l'application en mode avion | Phase 10 |

Les vérifications de la phase 2 sont réglées : `demarrer.bat` a été lancé par le propriétaire pendant la phase 3, et le test « Serveur injoignable » n'a plus d'objet (la page de vérification a été remplacée en phase 3 ; le comportement hors ligne se teste en phases 8 et 10).

**Étapes du plan :** phases 8 à 13 (section 2). La phase 8 attend l'accord du propriétaire sur son plan (section 2, phase 8 : quatre choix recommandés).

**Questions encore ouvertes (section 4) :** « Effacer les données de cet appareil » (choix 4 du plan de la phase 8) ; taille d'entrepôt raisonnable à annoncer (environ 500 produits) ; produits archivés dans l'export Excel (phase 9) ; options facultatives.

**À ajouter en phase 9 :** un bouton « Exporter » sur l'écran « Supprimer mon compte » (décision 60) et la feuille `Fournisseurs` de l'export (décision 42).

**Point à vérifier (section 3, n° 3) :** taille de lot sûre pour les données de démonstration (phase 11). Pour les suppressions, vérifié en phase 7 (paquets de 100).

**À nettoyer en fin de projet (phases 12 et 13) :** supprimer les comptes de test `test-phase3@example.com`, `test-isolation@example.org` et `test-suppression-1@example.com` (et tout autre compte jetable restant) par le parcours de suppression de la phase 7, ou dans la console Firebase (Authentication) avec leurs données ; supprimer `.env.test`. Le propriétaire peut supprimer dès maintenant l'ancienne copie `C:\Inventory Management`, inutilisée.

### 8.4 Fichiers du projet

| Fichier | Rôle | Phases |
|---|---|---|
| `index.html`, `css/style.css` | Tous les écrans de l'application ; identité visuelle (couleurs en variables au début de `style.css`) | 2, 3, 4a, 4b, 5, 6, 6b, identité, 7 |
| `images/logo-minstock.svg` | Symbole du logo MinStock, aussi icône d'onglet | identité |
| `js/app.js` | Démarrage, enchaînement des écrans, connexion ; reprise de la suppression du compte ; numéro de version (`VERSION_APP`) | 2, 3, 4a, 4b, 5, 6, 6b, identité, 7 |
| `js/fournisseurs.js` | Lecture et écriture des fournisseurs ; limites des champs (décision 54) | 6b |
| `js/ecran-fournisseurs.js` | Carnet de fournisseurs : liste, recherche, liens de contact, formulaire, suppression | 6b |
| `js/firebase-config.js` | Configuration web Firebase (ce n'est pas un secret) | 2 |
| `js/firebase-init.js` | Démarrage de Firebase, mémoire hors ligne, test du stockage local | 2, 3 |
| `js/auth.js` | Connexion, inscription, mot de passe oublié, déconnexion ; reconnexion et suppression du compte de connexion | 3, 7 |
| `js/messages-erreur.js` | Erreurs Firebase traduites en français | 3, 7 |
| `js/suppression-compte.js` | Suppression du compte : demande (transaction), effacement par paquets de 100, effacement de la copie locale | 7 |
| `js/ecran-suppression.js` | Écrans « Supprimer mon compte » et « Suppression en cours », reprise automatique | 7 |
| `js/entrepot.js` | Document `users/{uid}`, liste des devises ; changement du nom et de la devise | 3, 6 |
| `js/ecran-parametres.js` | Écran « Paramètres » : nom de l'entrepôt, devise tant qu'aucun produit n'existe (décision 49) | 6 |
| `js/interface.js` | Fonctions d'affichage partagées ; texte comparable pour les recherches | 4a, 6b |
| `js/nombres.js` | **Seule** conversion saisie ↔ entiers ; valeur d'une ligne et total du stock | 4a, 5 |
| `js/produits.js` | Lecture et écriture des produits ; stock de départ ; « l'entrepôt contient-il un produit ? » | 4a, 4b, 6 |
| `js/ecran-produits.js` | Tableau de bord (valeurs, recherche, alertes, `−1` / `+1`, compteurs et leurs filtres) et formulaire des produits | 4a, 4b, 5, identité |
| `js/mouvements.js` | Lot d'une opération de stock ; lecture de l'historique ; identifiant `annulation-…` | 4b, 6 |
| `js/operations-en-attente.js` | Suivi local des opérations non confirmées (`localStorage`, clé `operations-en-attente:{uid}`) | 4b |
| `js/ecran-mouvements.js` | Formulaire de mouvement, `envoyerMouvement` (seul chemin d'envoi d'un mouvement), historique avec « Annuler cette opération », opérations refusées | 4b, 5, 6 |
| `firestore.rules` | Règles de sécurité, version 7 | 2, 3, 4a, 4b, 6b, 7 |
| `tests-regles.html`, `js/tests-regles.js` | **Ne jamais y ajouter d'essai qui touche à `suppressionDemandee` ou supprime l'entrepôt dans la série habituelle** (danger évité en phase 7). Série habituelle : 91 essais des règles sur le vrai serveur, 88 quand les produits d'essai existent déjà (compte de test en `@example.com` uniquement, décision 40 ; environ une minute). Série « suppression du compte » : 20 essais, seulement avec un compte jetable `test-suppression…@example.com` (décision 63) | 3, 4a, 4b, dépôt public, 6, 6b, 7 |
| `tests-nombres.html`, `js/tests-nombres.js` | 104 essais de conversion et de calcul, sans connexion | 4a, 5 |
| `vendor/` | SDK Firebase 13.4.0 (import corrigé), SheetJS 0.20.3, police Montserrat et sa licence (`polices/`), `LISEZMOI.md` | 2, identité |
| `demarrer.bat`, `outils/serveur-local.ps1` | Serveur local sur `http://localhost:8080/` | 2 |
| `.gitignore`, `.gitattributes` | Fichiers exclus de Git ; `vendor/*.js` jamais modifiés par Git ; `*.woff2` en binaire | 0, 2, identité |
| `.nojekyll` | Fichier vide : GitHub Pages publie tout tel quel (décision 41) | dépôt public |
| `CLAUDE.md`, `DEMARRAGE.md` | Cahier des charges et méthode de travail ; modifiés avec l'accord du propriétaire (fournisseurs, annulation, suppression au lieu d'archivage des fournisseurs : section 6 de ce fichier) | 1, évolutions 42 et 43, 6b |
| `PLAN.md`, `DECISIONS.md`, `README.md` | Suivi, décisions 1 à 63, documentation | Toutes |

**Hors Git :** `.env.test` contient l'adresse et le mot de passe des deux comptes de test et des comptes jetables `test-suppression-1` à `-3@example.com` (2 et 3 supprimés par les essais de la phase 7 ; 1 actif, entrepôt d'essai vide, réservé à la série « suppression » de `tests-regles.html`). Il est ignoré par Git et n'apparaît dans aucun commit (vérifié le 2026-11-18).

**État du compte de test dans Firebase :** entrepôt « NzuriDeal » (HTG ; ancien nom « Entrepôt de test », renommé par le propriétaire pendant son test de la phase 6), aucune suppression demandée (vérifié après les essais de la phase 7) ; aucun fournisseur ; 4 produits actifs — dernières quantités relevées sur le serveur le 2026-11-18 (le propriétaire fait aussi des essais sur son téléphone, elles peuvent avoir changé) : « Ciment » 7,5 sac (14 mouvements, stock de départ d'essai de 12,5), « Riz 25 kg (Tchako) » 4 sac (79 mouvements), « Essai phase 5 (stock bas) » 5 pièces (seuil 5), « Essai phase 5 (zéro) » 0 pièce (seuil 0) ; produits archivés « Huile » et deux « Produit d'essai (règles) » ; plus de 120 mouvements au total, plus 5 à chaque passage de `tests-regles.html`. Les mouvements ne peuvent pas être supprimés. Second compte de test `test-isolation@example.org` (créé le 2026-11-18) : entrepôt « Entrepôt isolation (test) » (HTG), aucun produit ; sa devise a été passée à USD puis remise à HTG pendant les essais de la phase 6. Il doit rester sans produit pour pouvoir refaire l'essai du changement de devise. Compte jetable `test-suppression-1@example.com` : entrepôt d'essai « Essai hors ligne », vide ; réservé à la série « suppression » de `tests-regles.html`, qui le remet à zéro à chaque passage. Comptes jetables 2 et 3 supprimés par les essais ; le compte jetable créé par le propriétaire sur son téléphone a été supprimé par son essai.

### 8.5 Erreurs rencontrées

1. **Règles publiées mais pas actives tout de suite (phase 3).** Le serveur a refusé l'accès (`permission-denied`) pendant plusieurs minutes après l'annonce de la publication, alors que la connexion, le projet et la base étaient corrects. La version 3 est ensuite devenue active ; la cause n'est pas identifiée. Conduite à tenir : faire vérifier la ligne « Version des regles » dans la console, attendre quelques minutes, relancer `tests-regles.html`. Les versions 4 et 5 n'ont pas posé ce problème.
2. **Mauvais dossier au départ.** L'audit a commencé dans `C:\Inventory Management`, qui n'est pas un dépôt Git. Le vrai dépôt est `C:\GitHub\Inventory Management\inventorymanagement`. Une session ouverte dans l'ancien dossier charge une ancienne version de `CLAUDE.md`.
3. **Git for Windows demandé à tort.** Le Git de GitHub Desktop suffit (section 5, point 2).
4. **Port 8080 déjà occupé.** Quand le propriétaire a lancé `demarrer.bat`, un second serveur ne démarre pas (« Impossible de demarrer le serveur sur le port 8080 ») : sans gravité, il suffit d'utiliser celui qui tourne. Arrêter le serveur lancé par l'assistant fait apparaître une tâche « échouée » : sans gravité.
5. **Outils du navigateur intégré.** Un passage de `tests-regles.html` dure environ une minute, plus que le délai d'un appel de script (45 secondes) : lancer les essais, puis lire le bilan dans un second appel. Un onglet qui affiche un fichier local ne peut pas changer d'adresse : un nouvel onglet s'ouvre, sans conséquence.
6. **Un seul défaut connu dans le code, sans danger :** la ligne « En attente de synchronisation » fait bouger un instant les boutons placés en dessous (section 5, point 7 ; correction prévue en phase 8). Retouches mineures faites pendant les tests : message « adresse déjà utilisée » (phase 3) ; effacement du message d'erreur du formulaire de produit (phase 4a) ; « le stock restera négatif » (phase 6) ; longueurs écrites « 1 000 » et nom du fournisseur existant dans l'avertissement de doublon (phase 6b) ; alignement de l'en-tête (identité) ; tournure du message d'arrêt de la suppression (phase 7).
7. **Danger évité dans `tests-regles.html` (phase 7).** L'essai « Demander la suppression du compte », qui attendait un refus, aurait été accepté par les règles version 7 et aurait lancé la suppression du compte de test principal. Il a été retiré avant la publication des règles. Leçon : tout essai qui touche à `suppressionDemandee` ou supprime l'entrepôt se fait uniquement avec un compte jetable (décision 63).
8. **Couper le réseau de Firestore depuis la page (`disableNetwork`) n'arrête pas les transactions** (phase 7) : un essai « sans réseau » a réellement envoyé une demande de suppression (compte jetable 3, sans conséquence). Pour simuler l'absence d'Internet, forcer `navigator.onLine` à faux, ou faire échouer `fetch` vers `identitytoolkit` ; le vrai essai se fait en mode avion sur le téléphone.
9. **Commandes Git : « Exit code 255 » alors que le commit est fait.** Git écrit des avertissements de fins de ligne (LF/CRLF) sur la sortie d'erreur ; l'outil le signale comme une erreur. Toujours vérifier avec `git log --oneline -1`. Un message de commit contenant des guillemets droits casse la commande PowerShell : écrire les messages sans guillemets.
10. **Navigateur intégré.** Quand le panneau est caché, captures d'écran et clics échouent parfois (« tab not ready ») : réessayer, ou passer par la lecture de la page et le JavaScript. Juste après le démarrage du serveur local, une navigation peut échouer : réessayer après une seconde. En largeur 360 pixels simulée, les captures peuvent être rognées : mesurer les éléments plutôt que se fier à l'image.
11. **PDF de la maquette illisible directement** (programme `pdftoppm` absent) : les 8 images JPEG ont été extraites du PDF par un petit script PowerShell (lecture seule), dans le dossier temporaire de la session.

### 8.6 Décisions prises

Toutes sont dans `DECISIONS.md` (63 décisions, aucune effacée) :

- **1 à 7 (choix initiaux) :** Firestore en plan Spark ; connexion Google et e-mail ; quantités et prix en entiers ; `dernierMouvementId` ; GitHub Pages ; publication du code par le propriétaire.
- **8 à 15 (audit) :** page `tests-regles.html` à la place du simulateur ; règles tolérantes au hors-ligne et suivi local des opérations ; dépôt public dès la fin de la phase 4b ; SDK local corrigé et serveur local ; règles produit-mouvement complétées ; suppression du compte avec reconnexion d'abord ; phase 4 coupée en deux ; dossier de travail.
- **16 et 17 (phase 2) :** versions fixes Firebase 13.4.0 et SheetJS 0.20.3 ; port 8080 toujours le même.
- **18 à 21 (phase 3) :** devises HTG, USD, EUR, DOP, CAD ; pas de vérification de l'adresse e-mail ; premier lancement seulement si le serveur confirme qu'aucun entrepôt n'existe ; mot de passe de 8 caractères au moins.
- **22 à 31 (phase 4a) :** écoute des seuls produits non archivés ; archivage définitif ; produits archivés hors de la valeur du stock ; archivage possible avec du stock ; noms de produits uniques dans le formulaire ; unité obligatoire ; règles de saisie des nombres ; limites des nombres ; calcul de la valeur en grands entiers ; `updatedAt` à l'heure du serveur exigé.
- **32 à 39 (phase 4b) :** historique trié par heure du serveur ; types Entrée, Sortie, Ajustement ; stock négatif autorisé et signalé ; signe cohérent avec le type ; mouvements acceptés sur un produit archivé ; suivi des mouvements et des créations de produit ; stock de départ par un mouvement ; identifiants contrôlés.
- **40 et 41 (étape « dépôt public ») :** page `tests-regles.html` réservée aux comptes en `@example.com` ; fichier `.nojekyll` pour GitHub Pages.
- **42 et 43 (évolutions demandées par le propriétaire) :** carnet de fournisseurs en phase 6b ; « Annuler cette opération » par opération inverse en phase 6.
- **44 à 46 (phase 5) :** boutons `+1` / `−1` (formulaire prérempli si le stock deviendrait négatif) ; total du stock égal à la somme des lignes, stock négatif compté en négatif ; recherche sans majuscules ni accents, alertes « Stock bas » et « Rupture ».
- **47 à 49 (phase 6) :** pas de filtre par produit dans l'historique pour l'instant ; cas où « Annuler cette opération » n'apparaît pas (annulation, déjà annulée, en attente, produit archivé) ; devise modifiable seulement si le serveur confirme qu'aucun produit n'existe.
- **50 à 54 (phase 6b) :** fournisseur supprimé définitivement (plus d'archivage, décision 42 modifiée) ; noms en double autorisés avec avertissement ; liste écoutée seulement pendant que l'écran est ouvert ; boutons « Appeler », « WhatsApp », « E-mail » ; limites des champs.
- **55 à 58 (identité visuelle) :** nom « MinStock » ; identité appliquée sans ajouter ni retirer de fonction (couleurs vérifiées, éléments de la maquette hors périmètre non repris) ; police Montserrat locale ; symbole SVG et trois compteurs dans la carte de valeur.
- **59 (demande du propriétaire) :** compteurs cliquables qui filtrent la liste des produits ; la liste filtrée ne bouge pas sous le doigt.
- **60 à 63 (phase 7) :** double confirmation et reconnexion avant la suppression ; règles version 7 (demande sans retour, effacements seulement après la demande, ajouts bloqués pendant la suppression) ; déroulement par paquets de 100 (produits avant mouvements), reprise automatique, effacement de la copie locale ; essais avec des comptes jetables.

Les règles de conception de la section 7 restent à respecter dans toute la suite.

### 8.7 Prochaine action précise

*(La phase 7 est terminée, test sur smartphone compris. Le plan de la phase 8 a été présenté au propriétaire le 2026-11-18 ; sa réponse est attendue. Rien de la phase 8 n'est codé.)*

1. **Propriétaire :** répondre au plan de la phase 8 (section 2, phase 8 : quatre choix recommandés) — « Oui, commence » ou ses questions. Quand il le souhaite : **Push origin** dans GitHub Desktop (2 commits de documentation : `b2cc014` et cette note) ; les deux tests restants de la phase 3 et le message d'aide quand la fenêtre Google est bloquée. Conseillé : activer la validation en deux étapes du compte Google qui gère la console Firebase.
2. **Assistant, au début de la prochaine session (ouverte dans `C:\GitHub\Inventory Management\inventorymanagement`, ou dans son dossier parent) :** lire `CLAUDE.md`, `PLAN.md` et `DECISIONS.md`. Si l'accord du propriétaire sur la phase 8 n'est pas noté ici, lui rappeler en quelques lignes le plan de la section 2 (phase 8) et attendre. Après l'accord : noter les décisions 64 et suivantes, puis coder par petites étapes (indicateur, « En attente » dans la fiche, avertissement de déconnexion, effacement de l'appareil, stockage persistant), tester sur `http://localhost:8080/` avec le compte `test-phase3@example.com` (mot de passe dans `.env.test`, jamais dans la conversation), faire un commit local, puis donner au propriétaire le guide de l'essai en mode avion (`DEMARRAGE.md`, section 9, étapes 1 à 7 et 9 à 11).
3. **Rappels pour la suite :** aucune modification des règles Firestore n'est prévue en phase 8 ; ne jamais faire de `git push` ; ne jamais essayer la suppression du compte avec un vrai compte ; ne jamais ajouter d'essai touchant à `suppressionDemandee` dans la série habituelle de `tests-regles.html`.
