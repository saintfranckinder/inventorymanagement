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
| 6b | Carnet de fournisseurs (décision 42) | **Prochaine étape** (voir section 8.7) |
| 7 | Suppression du compte | À faire |
| 8 | Hors ligne et indicateur de synchronisation | À faire |
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
- **Résultat :** liste des fournisseurs, recherche simple, formulaire d'ajout et de modification (nom obligatoire ; téléphone, WhatsApp, e-mail, adresse, produits fournis, notes), archivage ; règles Firestore version 6 pour `users/{uid}/suppliers` ; texte de confidentialité complété (décision 42).
- **Avant de coder :** proposer les longueurs maximales de chaque champ ; trancher les questions de la section 4 sur les fournisseurs ; expliquer comment les fournisseurs sont lus (écoute permanente ou chargement à l'ouverture de l'écran) au regard du quota de lectures.
- **Tests :** `tests-regles.html` complété (champs inconnus, longueurs, types, accès à un autre compte refusés) ; ajout, modification, archivage dans l'application ; un compte ne voit pas les fournisseurs d'un autre ; affichage à 360 pixels et sur smartphone.

### Phase 7 : suppression du compte
- **Résultat :** double confirmation, rappel d'exporter, reconnexion demandée en premier, suppression en ligne uniquement, reprise automatique si `suppressionDemandee` est vrai. Les fournisseurs sont supprimés avec le reste (décision 42).
- **Tests (compte de test uniquement) :**
  - suppression complète ; données et compte disparus dans la console ;
  - suppression interrompue (fermer l'application au milieu), puis reprise à la connexion suivante ;
  - tentative hors ligne : refusée avec un message clair.

### Phase 8 : hors ligne et indicateur
- **Résultat :** indicateur à quatre états, présenté comme approximatif ; messages pour les opérations refusées et « déjà enregistrées » ; avertissement avant déconnexion s'il reste des écritures en attente ; demande de stockage persistant au navigateur ; mention « En attente de synchronisation » qui ne fait plus bouger les boutons placés en dessous (défaut constaté au test sur smartphone de la phase 5).
- **Tests :** étapes 1 à 7 et 9 à 11 de `DEMARRAGE.md` section 9 (application restée ouverte). L'étape 8 (rouvrir en mode avion) est testée en phase 10.

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
3. **Phases 7 et 11 :** nombre maximal d'écritures par lot quand les règles font des vérifications (`get`, `getAfter`). Déterminer la taille de lot sûre.

## 4. Propositions de l'analyse pas encore validées

À trancher avec le propriétaire au début de la phase concernée.

- *(Tranché : décision 32.)* Trier l'historique par `dateServeur` et afficher `dateAppareil` comme « fait le » (phase 4b).
- *(Tranché : décision 22.)* N'écouter en temps réel que les produits non archivés (phase 4a).
- *(Tranché : décision 47, pas pour l'instant.)* Filtre par produit dans l'historique : prévu par `DEMARRAGE.md` (phase 6) mais absent de `CLAUDE.md` ; il exige un index à créer dans la console.
- Annoncer une taille raisonnable d'entrepôt (environ 500 produits) à cause du quota de lectures.
- Facultatif : numéro de version affiché ; regroupement des appuis rapides sur `+1` ; vérification dans les règles que le compte n'est pas en cours de suppression.
- *(Tranché : décisions 23 et 24.)* Peut-on désarchiver un produit ? Un produit archivé compte-t-il dans la valeur du stock ?
- Les produits archivés doivent-ils figurer dans l'export Excel (feuille `Stock`) ? À trancher en phase 9.
- *(Tranché : décision 18.)* Liste des devises proposées au premier lancement.
- Fournisseurs (phase 6b) : suppression définitive plutôt qu'archivage, puisque ce sont des données personnelles de tiers et que rien ne s'y rattache ? Deux fournisseurs du même nom autorisés ? Fournisseurs archivés dans l'export Excel ?

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

*Mise à jour le 2026-11-18. Cette note remplace les journaux intermédiaires des phases 3, 4a et 4b : leurs blocages sont résolus, et leur contenu est repris dans les comptes rendus de la section 2 et dans l'historique Git.*

### 8.1 Phase actuelle

- **Phase 6 (historique avec « Annuler cette opération », paramètres) terminée le 2026-11-18**, test sur smartphone réussi le même jour. Prochaine étape : **phase 6b** (carnet de fournisseurs). Plan présenté au propriétaire le 2026-11-18 ; rien n'est codé avant son accord.
- Version de l'application : `0.7.0`. Règles Firestore : **version 5**, publiée dans la console, vérifiée active le 2026-11-16 (70 essais sur 70) et le 2026-11-18 (72 sur 72 après la phase 6, produits d'essai déjà créés).
- Dépôt GitHub : `saintfranckinder/minstock`, **public**. Site : `https://saintfranckinder.github.io/minstock/` (GitHub Pages, branche `main`, dossier racine).
- Dépôt Git, branche `main` : `cecf8d3` (phases 0 et 1), `48d55b3` (phase 2), `f09bf30` (phase 3), `96f2a3d` (phase 4a), `d8f1b5b` (phase 4b), `2f53da4` (note de passation), `b26abb6` (dépôt renommé), `e166a30` (recherche de secrets), `d5a7808` (décisions 40 et 41), `86d4eb4` (mise en ligne), `e1a5c70` (fin de l'étape « dépôt public »), `e202b2a` (décisions 42 et 43), `7e156a3` (phase 5), `eb40c59` (test sur smartphone de la phase 5), `456dff6` (phase 6), puis la note du test sur smartphone de la phase 6. Le propriétaire envoie chaque commit avec **Push origin** dans GitHub Desktop ; le site se met à jour quelques minutes après.

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

Les tests des phases 2 à 6 ont été exécutés par l'assistant dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test. Tests sur smartphone faits par le propriétaire le 2026-11-18, sur le site en ligne (étape « dépôt public », puis phase 5).

### 8.3 Travail restant

**Tests du propriétaire en attente (phase 3) :**

1. *(Connexion Google réussie sur smartphone le 2026-11-18, selon le propriétaire.)* Reste : message d'aide si la fenêtre Google (popup) est bloquée.
2. Réception de l'e-mail « Mot de passe oublié », en français.
3. Même adresse e-mail par les deux méthodes, dans les deux ordres.

**Tests non faits, à reprendre dans la phase indiquée :**

| Test | Phase |
|---|---|
| *(Premier test fait le 2026-11-18 par le propriétaire.)* Affichage sur smartphone, à refaire pour chaque nouvel écran | Phases 5, 6, 6b, 9, 10 |
| *(Fait le 2026-11-18 par le propriétaire ; lisibilité en extérieur non précisée.)* Tableau de bord sur smartphone : recherche, boutons `−1` / `+1` au doigt, alertes | Phase 5 (propriétaire) |
| *(Fait le 2026-11-18 avec le second compte de test.)* Second compte réel qui ne voit pas les données du premier | Étape « dépôt public » |
| *(Avertissement d'archivage fait le 2026-11-18.)* Affichage des deux heures quand l'écart dépasse 5 minutes | Phase 8 |
| *(Fait le 2026-11-18 par le propriétaire.)* Historique et Paramètres sur smartphone : annuler une opération au doigt, renommer l'entrepôt, devise bloquée | Phase 6 (propriétaire) |
| Hors ligne réel (mode avion) : ajout de produit, mouvement, retour en ligne ; coupure entre l'envoi et la réponse ; « Voir plus » sans Internet ; premier chargement sans Internet sur un nouvel appareil | Phase 8 |
| Deux appareils qui modifient le même produit | Phase 8 ou 12 |
| Réouverture de l'application en mode avion | Phase 10 |

Les vérifications de la phase 2 sont réglées : `demarrer.bat` a été lancé par le propriétaire pendant la phase 3, et le test « Serveur injoignable » n'a plus d'objet (la page de vérification a été remplacée en phase 3 ; le comportement hors ligne se teste en phases 8 et 10).

**Étapes du plan :** phase 6b, puis 7 à 13 (section 2).

**Questions encore ouvertes (section 4) :** taille d'entrepôt raisonnable à annoncer (environ 500 produits) ; produits archivés dans l'export Excel (phase 9) ; fournisseurs : suppression ou archivage, noms en double, fournisseurs archivés dans l'export (phase 6b) ; options facultatives.

**Point à vérifier (section 3, n° 3) :** taille de lot sûre pour la suppression du compte (phase 7) et les données de démonstration (phase 11).

**À nettoyer en fin de projet (phases 12 et 13) :** supprimer les comptes de test `test-phase3@example.com` et `test-isolation@example.org` dans la console Firebase (Authentication) et leurs données, ou par le parcours de suppression de la phase 7 ; supprimer `.env.test`. Le propriétaire peut supprimer dès maintenant l'ancienne copie `C:\Inventory Management`, inutilisée.

### 8.4 Fichiers du projet

| Fichier | Rôle | Phases |
|---|---|---|
| `index.html`, `css/style.css` | Tous les écrans de l'application | 2, 3, 4a, 4b, 5, 6 |
| `js/app.js` | Démarrage, enchaînement des écrans, connexion ; numéro de version | 2, 3, 4a, 4b, 5, 6 |
| `js/firebase-config.js` | Configuration web Firebase (ce n'est pas un secret) | 2 |
| `js/firebase-init.js` | Démarrage de Firebase, mémoire hors ligne, test du stockage local | 2, 3 |
| `js/auth.js` | Connexion, inscription, mot de passe oublié, déconnexion | 3 |
| `js/messages-erreur.js` | Erreurs Firebase traduites en français | 3 |
| `js/entrepot.js` | Document `users/{uid}`, liste des devises ; changement du nom et de la devise | 3, 6 |
| `js/ecran-parametres.js` | Écran « Paramètres » : nom de l'entrepôt, devise tant qu'aucun produit n'existe (décision 49) | 6 |
| `js/interface.js` | Fonctions d'affichage partagées | 4a |
| `js/nombres.js` | **Seule** conversion saisie ↔ entiers ; valeur d'une ligne et total du stock | 4a, 5 |
| `js/produits.js` | Lecture et écriture des produits ; stock de départ ; « l'entrepôt contient-il un produit ? » | 4a, 4b, 6 |
| `js/ecran-produits.js` | Tableau de bord (valeurs, recherche, alertes, `−1` / `+1`) et formulaire des produits | 4a, 4b, 5 |
| `js/mouvements.js` | Lot d'une opération de stock ; lecture de l'historique ; identifiant `annulation-…` | 4b, 6 |
| `js/operations-en-attente.js` | Suivi local des opérations non confirmées (`localStorage`, clé `operations-en-attente:{uid}`) | 4b |
| `js/ecran-mouvements.js` | Formulaire de mouvement, `envoyerMouvement` (seul chemin d'envoi d'un mouvement), historique avec « Annuler cette opération », opérations refusées | 4b, 5, 6 |
| `firestore.rules` | Règles de sécurité, version 5 | 2, 3, 4a, 4b |
| `tests-regles.html`, `js/tests-regles.js` | 75 essais des règles sur le vrai serveur, 72 quand les produits d'essai existent déjà (compte de test en `@example.com` uniquement, décision 40 ; environ une minute) | 3, 4a, 4b, dépôt public, 6 |
| `tests-nombres.html`, `js/tests-nombres.js` | 104 essais de conversion et de calcul, sans connexion | 4a, 5 |
| `vendor/` | SDK Firebase 13.4.0 (import corrigé), SheetJS 0.20.3, `LISEZMOI.md` | 2 |
| `demarrer.bat`, `outils/serveur-local.ps1` | Serveur local sur `http://localhost:8080/` | 2 |
| `.gitignore`, `.gitattributes` | Fichiers exclus de Git ; `vendor/*.js` jamais modifiés par Git | 0, 2 |
| `.nojekyll` | Fichier vide : GitHub Pages publie tout tel quel (décision 41) | dépôt public |
| `CLAUDE.md`, `DEMARRAGE.md` | Cahier des charges et méthode de travail | 1 |
| `PLAN.md`, `DECISIONS.md`, `README.md` | Suivi, décisions 1 à 49, documentation | Toutes |

**Hors Git :** `.env.test` contient l'adresse et le mot de passe des deux comptes de test. Il est ignoré par Git et n'apparaît dans aucun commit (vérifié le 2026-11-18).

**État du compte de test dans Firebase :** entrepôt « Entrepôt de test » (HTG) ; produits actifs, vérifiés sur le serveur après la phase 6 : « Riz 25 kg (Tchako) » à 8 sac, « Ciment » à -1,5 sac, « Essai phase 5 (stock bas) » à 6 pièces (seuil 5) et « Essai phase 5 (zéro) » à 1 pièce (seuil 0) ; produits archivés « Huile » et deux « Produit d'essai (règles) » ; environ 103 mouvements au 2026-11-18 après la phase 6, plus 5 à chaque passage de `tests-regles.html`. Les mouvements ne peuvent pas être supprimés. Second compte de test `test-isolation@example.org` (créé le 2026-11-18) : entrepôt « Entrepôt isolation (test) » (HTG), aucun produit ; sa devise a été passée à USD puis remise à HTG pendant les essais de la phase 6. Il doit rester sans produit pour pouvoir refaire l'essai du changement de devise.

### 8.5 Erreurs rencontrées

1. **Règles publiées mais pas actives tout de suite (phase 3).** Le serveur a refusé l'accès (`permission-denied`) pendant plusieurs minutes après l'annonce de la publication, alors que la connexion, le projet et la base étaient corrects. La version 3 est ensuite devenue active ; la cause n'est pas identifiée. Conduite à tenir : faire vérifier la ligne « Version des regles » dans la console, attendre quelques minutes, relancer `tests-regles.html`. Les versions 4 et 5 n'ont pas posé ce problème.
2. **Mauvais dossier au départ.** L'audit a commencé dans `C:\Inventory Management`, qui n'est pas un dépôt Git. Le vrai dépôt est `C:\GitHub\Inventory Management\inventorymanagement`. Une session ouverte dans l'ancien dossier charge une ancienne version de `CLAUDE.md`.
3. **Git for Windows demandé à tort.** Le Git de GitHub Desktop suffit (section 5, point 2).
4. **Port 8080 déjà occupé.** Quand le propriétaire a lancé `demarrer.bat`, un second serveur ne démarre pas (« Impossible de demarrer le serveur sur le port 8080 ») : sans gravité, il suffit d'utiliser celui qui tourne. Arrêter le serveur lancé par l'assistant fait apparaître une tâche « échouée » : sans gravité.
5. **Outils du navigateur intégré.** Un passage de `tests-regles.html` dure environ une minute, plus que le délai d'un appel de script (45 secondes) : lancer les essais, puis lire le bilan dans un second appel. Un onglet qui affiche un fichier local ne peut pas changer d'adresse : un nouvel onglet s'ouvre, sans conséquence.
6. **Un seul défaut connu dans le code, sans danger :** la ligne « En attente de synchronisation » fait bouger un instant les boutons placés en dessous (section 5, point 7 ; correction en phase 8). Deux retouches mineures ont été faites pendant les tests : le message « adresse déjà utilisée » (phase 3) et l'effacement du message d'erreur du formulaire de produit pendant la saisie (phase 4a).

### 8.6 Décisions prises

Toutes sont dans `DECISIONS.md` (49 décisions, aucune effacée) :

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

Les règles de conception de la section 7 restent à respecter dans toute la suite.

### 8.7 Prochaine action précise

*(La phase 6 est terminée, test sur smartphone compris : détail dans son compte rendu, section 2.)*

1. **Propriétaire :** lire le plan de la phase 6b présenté par l'assistant le 2026-11-18, répondre à ses questions et donner son accord. Quand il le souhaite : **Push origin** dans GitHub Desktop (note du test sur smartphone), les deux tests restants de la phase 3 et le message d'aide quand la fenêtre Google est bloquée.
2. **Assistant :** coder la phase 6b seulement après l'accord du propriétaire, par petites étapes. Au début d'une nouvelle session (ouverte dans `C:\GitHub\Inventory Management\inventorymanagement`) : lire `CLAUDE.md`, `PLAN.md` et `DECISIONS.md` ; si l'accord sur la phase 6b n'est pas noté ici, présenter de nouveau son plan (objectif, fichiers, risques, tests) et attendre.
3. **Phase 6b (carnet de fournisseurs, décision 42) :** avant de coder, proposer les longueurs maximales des champs ; trancher les questions de la section 4 (suppression ou archivage, noms en double, fournisseurs archivés dans l'export) ; expliquer comment les fournisseurs sont lus au regard du quota. Règles Firestore version 6 à publier par le propriétaire.
