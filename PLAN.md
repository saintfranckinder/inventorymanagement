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
| — | Vérification des secrets, dépôt public, GitHub Pages activé | **En cours** : recherche de secrets faite le 2026-11-18, aucun secret ; reste la publication (voir section 8.7) |
| 5 | Tableau de bord | À faire |
| 6 | Formulaires, historique lisible, paramètres | À faire |
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

Reste à faire : « Publish branch », dépôt en public, GitHub Pages, domaine autorisé dans Firebase, premier test sur smartphone.

### Phase 5 : tableau de bord
- **Résultat :** liste, recherche, quantité, seuil, prix, valeur « indicative », `+1` / `-1` (48 × 48 px), saisie d'une quantité précise, alertes `Stock bas` et `Rupture`.
- **Tests :** smartphone (360 px) et ordinateur ; alertes orange et rouge avec leur texte.

### Phase 6 : formulaires, historique, paramètres
- **Résultat :** formulaire d'ajout et de modification ; historique lisible (les deux dates distinguées) ; nom de l'entrepôt modifiable ; devise modifiable seulement sans produit.
- **Tests :** devise bloquée dès qu'un produit existe ; historique compréhensible après renommage d'un produit.

### Phase 7 : suppression du compte
- **Résultat :** double confirmation, rappel d'exporter, reconnexion demandée en premier, suppression en ligne uniquement, reprise automatique si `suppressionDemandee` est vrai.
- **Tests (compte de test uniquement) :**
  - suppression complète ; données et compte disparus dans la console ;
  - suppression interrompue (fermer l'application au milieu), puis reprise à la connexion suivante ;
  - tentative hors ligne : refusée avec un message clair.

### Phase 8 : hors ligne et indicateur
- **Résultat :** indicateur à quatre états, présenté comme approximatif ; messages pour les opérations refusées et « déjà enregistrées » ; avertissement avant déconnexion s'il reste des écritures en attente ; demande de stockage persistant au navigateur.
- **Tests :** étapes 1 à 7 et 9 à 11 de `DEMARRAGE.md` section 9 (application restée ouverte). L'étape 8 (rouvrir en mode avion) est testée en phase 10.

### Phase 9 : export Excel
- **Résultat :** `stock_AAAA-MM-JJ.xlsx`, feuilles `Stock` et `Historique`, SheetJS local (pris sur le site officiel de l'éditeur, version fixe), avertissements hors ligne / en attente.
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
- Filtre par produit dans l'historique : prévu par `DEMARRAGE.md` (phase 6) mais absent de `CLAUDE.md` ; il exige un index à créer dans la console.
- Annoncer une taille raisonnable d'entrepôt (environ 500 produits) à cause du quota de lectures.
- Facultatif : numéro de version affiché ; regroupement des appuis rapides sur `+1` ; vérification dans les règles que le compte n'est pas en cours de suppression.
- *(Tranché : décisions 23 et 24.)* Peut-on désarchiver un produit ? Un produit archivé compte-t-il dans la valeur du stock ?
- Les produits archivés doivent-ils figurer dans l'export Excel (feuille `Stock`) ? À trancher en phase 9.
- *(Tranché : décision 18.)* Liste des devises proposées au premier lancement.

## 5. Problèmes connus

1. *(Résolu le 2026-11-16.)* Le dépôt est cloné dans `C:\GitHub\Inventory Management\inventorymanagement` et relié à `saintfranckinder/minstock`. Renommé sur GitHub le 2026-11-18 (ancien nom : `inventorymanagement`) ; GitHub Desktop a mis à jour l'adresse du dépôt tout seul (vérifié le 2026-11-18).
2. **La commande `git` n'est pas dans le terminal, mais ce n'est pas bloquant.** Git for Windows est absent ; le Git interne de GitHub Desktop fonctionne (version 2.53, vérifié le 2026-11-16) et sert aux commits locaux. Chemin : `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe` (le numéro de version change à chaque mise à jour de GitHub Desktop : toujours le rechercher). Le nom et une adresse `noreply` sont déjà réglés : l'adresse personnelle n'apparaîtra pas dans les commits.
3. **Node.js, Java et Python ne sont pas installés** : pas d'émulateur Firebase, serveur local par script PowerShell.
4. **Une ancienne copie des fichiers existe dans `C:\Inventory Management`.** Elle n'est plus utilisée et ne contient ni ce plan ni les nouvelles décisions. Le propriétaire peut la supprimer.
5. **Le dépôt sur GitHub était vide au moment du premier commit local (phase 0).** La première publication se fait dans GitHub Desktop avec le bouton **Publish branch** ; les suivantes avec **Push origin**.
6. **Le fichier facultatif `.claude/settings.json`** proposé dans `DEMARRAGE.md` (phase 0) n'a pas été créé : le propriétaire ne l'a pas demandé.

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

- **Phase 4b terminée.** Prochaine étape : **« dépôt public »**, entre la phase 4b et la phase 5 (décision 10). *(2026-11-18 : recherche de secrets faite, aucun secret ; le reste de l'étape n'est pas commencé.)*
- Version de l'application : `0.5.0`. Règles Firestore : **version 5**, publiée dans la console et vérifiée active le 2026-11-16 (`tests-regles.html` : 70 essais sur 70).
- Dépôt Git, branche `main` : `cecf8d3` (phases 0 et 1), `48d55b3` (phase 2), `f09bf30` (phase 3), `96f2a3d` (phase 4a), `d8f1b5b` (phase 4b), puis le commit de cette note. **Aucun commit n'est publié sur GitHub** (vérifié le 2026-11-18) : la première publication se fait avec **Publish branch** dans GitHub Desktop.

### 8.2 Travail terminé

| Phase | Résultat | Preuve |
|---|---|---|
| 0 | `.gitignore`, `README.md`, dépôt relié à `saintfranckinder/minstock` (ancien nom : `inventorymanagement`) | commit `cecf8d3` |
| 1 | Analyse des risques, plan, décisions 8 à 15, `CLAUDE.md` et `DEMARRAGE.md` alignés | commit `cecf8d3` |
| 2 | Structure, SDK Firebase 13.4.0 et SheetJS 0.20.3 dans `vendor/` (import corrigé), mémoire hors ligne avec avertissement, serveur local | compte rendu de la phase 2 |
| 3 | Connexion Google et e-mail, inscription, mot de passe oublié, premier lancement, confidentialité, règles version 3 | `tests-regles.html` : 14 sur 14 |
| 4a | Conversion des nombres, produits (ajout, modification, archivage), règles version 4 | `tests-nombres.html` : 98 sur 98 ; `tests-regles.html` : 39 sur 39 |
| 4b | Mouvements (entrée, sortie, ajustement), stock de départ, historique (50 derniers puis « Voir plus »), suivi local des opérations refusées, règles version 5 | `tests-regles.html` : 70 sur 70 ; essais dans l'application (compte rendu de la phase 4b) |

Tous ces tests ont été exécutés par l'assistant dans le navigateur intégré, sur `http://localhost:8080/`, avec le compte de test. Aucun test n'a encore été fait sur smartphone.

### 8.3 Travail restant

**Tests du propriétaire en attente (phase 3) :**

1. Connexion avec Google (fenêtre popup), et message d'aide si la popup est bloquée.
2. Réception de l'e-mail « Mot de passe oublié », en français.
3. Même adresse e-mail par les deux méthodes, dans les deux ordres.

**Tests non faits, à reprendre dans la phase indiquée :**

| Test | Phase |
|---|---|
| Tout l'affichage et la connexion Google sur smartphone | Étape « dépôt public » |
| Second compte réel qui ne voit pas les données du premier | Étape « dépôt public » ou phase 12 |
| Avertissement d'archivage quand le stock n'est pas à 0 ; affichage des deux heures quand l'écart dépasse 5 minutes | Phase 6 |
| Hors ligne réel (mode avion) : ajout de produit, mouvement, retour en ligne ; coupure entre l'envoi et la réponse ; « Voir plus » sans Internet ; premier chargement sans Internet sur un nouvel appareil | Phase 8 |
| Deux appareils qui modifient le même produit | Phase 8 ou 12 |
| Réouverture de l'application en mode avion | Phase 10 |

Les vérifications de la phase 2 sont réglées : `demarrer.bat` a été lancé par le propriétaire pendant la phase 3, et le test « Serveur injoignable » n'a plus d'objet (la page de vérification a été remplacée en phase 3 ; le comportement hors ligne se teste en phases 8 et 10).

**Étapes du plan :** étape « dépôt public », puis phases 5 à 13 (section 2).

**Questions encore ouvertes (section 4) :** filtre par produit dans l'historique (phase 6 ; exige un index à créer dans la console) ; taille d'entrepôt raisonnable à annoncer (environ 500 produits) ; produits archivés dans l'export Excel (phase 9) ; options facultatives.

**Point à vérifier (section 3, n° 3) :** taille de lot sûre pour la suppression du compte (phase 7) et les données de démonstration (phase 11).

**À nettoyer en fin de projet (phases 12 et 13) :** supprimer le compte de test `test-phase3@example.com` dans la console Firebase (Authentication) et ses données, ou le parcours de suppression de la phase 7 ; supprimer `.env.test`. Le propriétaire peut supprimer dès maintenant l'ancienne copie `C:\Inventory Management`, inutilisée.

### 8.4 Fichiers du projet

| Fichier | Rôle | Phases |
|---|---|---|
| `index.html`, `css/style.css` | Tous les écrans de l'application | 2, 3, 4a, 4b |
| `js/app.js` | Démarrage, enchaînement des écrans, connexion | 2, 3, 4a, 4b |
| `js/firebase-config.js` | Configuration web Firebase (ce n'est pas un secret) | 2 |
| `js/firebase-init.js` | Démarrage de Firebase, mémoire hors ligne, test du stockage local | 2, 3 |
| `js/auth.js` | Connexion, inscription, mot de passe oublié, déconnexion | 3 |
| `js/messages-erreur.js` | Erreurs Firebase traduites en français | 3 |
| `js/entrepot.js` | Document `users/{uid}`, liste des devises | 3 |
| `js/interface.js` | Fonctions d'affichage partagées | 4a |
| `js/nombres.js` | **Seule** conversion saisie ↔ entiers ; valeur d'une ligne | 4a |
| `js/produits.js` | Lecture et écriture des produits ; stock de départ | 4a, 4b |
| `js/ecran-produits.js` | Liste et formulaire des produits | 4a, 4b |
| `js/mouvements.js` | Lot d'une opération de stock ; lecture de l'historique | 4b |
| `js/operations-en-attente.js` | Suivi local des opérations non confirmées (`localStorage`, clé `operations-en-attente:{uid}`) | 4b |
| `js/ecran-mouvements.js` | Formulaire de mouvement, historique, opérations refusées | 4b |
| `firestore.rules` | Règles de sécurité, version 5 | 2, 3, 4a, 4b |
| `tests-regles.html`, `js/tests-regles.js` | 70 essais des règles sur le vrai serveur (compte de test, environ une minute) | 3, 4a, 4b |
| `tests-nombres.html`, `js/tests-nombres.js` | 98 essais de conversion, sans connexion | 4a |
| `vendor/` | SDK Firebase 13.4.0 (import corrigé), SheetJS 0.20.3, `LISEZMOI.md` | 2 |
| `demarrer.bat`, `outils/serveur-local.ps1` | Serveur local sur `http://localhost:8080/` | 2 |
| `.gitignore`, `.gitattributes` | Fichiers exclus de Git ; `vendor/*.js` jamais modifiés par Git | 0, 2 |
| `CLAUDE.md`, `DEMARRAGE.md` | Cahier des charges et méthode de travail | 1 |
| `PLAN.md`, `DECISIONS.md`, `README.md` | Suivi, décisions 1 à 39, documentation | Toutes |

**Hors Git :** `.env.test` contient l'adresse et le mot de passe du compte de test. Il est ignoré par Git et n'apparaît dans aucun commit (vérifié le 2026-11-18).

**État du compte de test dans Firebase :** entrepôt « Entrepôt de test » (HTG) ; produits actifs « Riz 25 kg (Tchako) » à 7 sac et « Ciment » à -2,5 sac ; produits archivés « Huile » et deux « Produit d'essai (règles) » ; 65 mouvements, plus 3 à chaque passage de `tests-regles.html`. Les mouvements ne peuvent pas être supprimés.

### 8.5 Erreurs rencontrées

1. **Règles publiées mais pas actives tout de suite (phase 3).** Le serveur a refusé l'accès (`permission-denied`) pendant plusieurs minutes après l'annonce de la publication, alors que la connexion, le projet et la base étaient corrects. La version 3 est ensuite devenue active ; la cause n'est pas identifiée. Conduite à tenir : faire vérifier la ligne « Version des regles » dans la console, attendre quelques minutes, relancer `tests-regles.html`. Les versions 4 et 5 n'ont pas posé ce problème.
2. **Mauvais dossier au départ.** L'audit a commencé dans `C:\Inventory Management`, qui n'est pas un dépôt Git. Le vrai dépôt est `C:\GitHub\Inventory Management\inventorymanagement`. Une session ouverte dans l'ancien dossier charge une ancienne version de `CLAUDE.md`.
3. **Git for Windows demandé à tort.** Le Git de GitHub Desktop suffit (section 5, point 2).
4. **Port 8080 déjà occupé.** Quand le propriétaire a lancé `demarrer.bat`, un second serveur ne démarre pas (« Impossible de demarrer le serveur sur le port 8080 ») : sans gravité, il suffit d'utiliser celui qui tourne. Arrêter le serveur lancé par l'assistant fait apparaître une tâche « échouée » : sans gravité.
5. **Outils du navigateur intégré.** Un passage de `tests-regles.html` dure environ une minute, plus que le délai d'un appel de script (45 secondes) : lancer les essais, puis lire le bilan dans un second appel. Un onglet qui affiche un fichier local ne peut pas changer d'adresse : un nouvel onglet s'ouvre, sans conséquence.
6. **Aucun défaut connu dans le code.** Deux retouches mineures ont été faites pendant les tests : le message « adresse déjà utilisée » (phase 3) et l'effacement du message d'erreur du formulaire de produit pendant la saisie (phase 4a).

### 8.6 Décisions prises

Toutes sont dans `DECISIONS.md` (39 décisions, aucune effacée) :

- **1 à 7 (choix initiaux) :** Firestore en plan Spark ; connexion Google et e-mail ; quantités et prix en entiers ; `dernierMouvementId` ; GitHub Pages ; publication du code par le propriétaire.
- **8 à 15 (audit) :** page `tests-regles.html` à la place du simulateur ; règles tolérantes au hors-ligne et suivi local des opérations ; dépôt public dès la fin de la phase 4b ; SDK local corrigé et serveur local ; règles produit-mouvement complétées ; suppression du compte avec reconnexion d'abord ; phase 4 coupée en deux ; dossier de travail.
- **16 et 17 (phase 2) :** versions fixes Firebase 13.4.0 et SheetJS 0.20.3 ; port 8080 toujours le même.
- **18 à 21 (phase 3) :** devises HTG, USD, EUR, DOP, CAD ; pas de vérification de l'adresse e-mail ; premier lancement seulement si le serveur confirme qu'aucun entrepôt n'existe ; mot de passe de 8 caractères au moins.
- **22 à 31 (phase 4a) :** écoute des seuls produits non archivés ; archivage définitif ; produits archivés hors de la valeur du stock ; archivage possible avec du stock ; noms de produits uniques dans le formulaire ; unité obligatoire ; règles de saisie des nombres ; limites des nombres ; calcul de la valeur en grands entiers ; `updatedAt` à l'heure du serveur exigé.
- **32 à 39 (phase 4b) :** historique trié par heure du serveur ; types Entrée, Sortie, Ajustement ; stock négatif autorisé et signalé ; signe cohérent avec le type ; mouvements acceptés sur un produit archivé ; suivi des mouvements et des créations de produit ; stock de départ par un mouvement ; identifiants contrôlés.

Les règles de conception de la section 7 restent à respecter dans toute la suite.

### 8.7 Prochaine action précise

1. **Propriétaire :** faire les trois tests de la phase 3 (section 8.3), puis vérifier les commits dans GitHub Desktop (onglet **History**) et cliquer sur **Publish branch**.
2. **Assistant, dans une nouvelle session ouverte dans `C:\GitHub\Inventory Management\inventorymanagement` :** lire `CLAUDE.md`, `PLAN.md` et `DECISIONS.md`, puis proposer l'étape « dépôt public » et attendre l'accord du propriétaire :
   - *(Fait le 2026-11-18, avant « Publish branch », avec l'accord du propriétaire : aucun secret. Voir le compte rendu partiel de l'étape « dépôt public », section 2.)* rechercher des secrets dans tous les fichiers suivis et dans tout l'historique Git (`.env.test` doit rester absent ; `js/firebase-config.js` est normal) ;
   - *(Fait le 2026-11-18 : uniquement l'adresse `noreply`.)* vérifier que les commits n'exposent que l'adresse `noreply` ;
   - guider le propriétaire clic par clic : dépôt en public, GitHub Pages (branche `main`, dossier racine), ajout de `saintfranckinder.github.io` aux domaines autorisés de Firebase Authentication ;
   - premier test sur smartphone à l'adresse `https://saintfranckinder.github.io/minstock/` : connexion, mouvement de stock, affichage à 360 pixels.
3. **Ensuite :** phase 5, tableau de bord (recherche, valeur du stock « indicative », boutons `+1` / `-1`, alertes `Stock bas` et `Rupture`).
