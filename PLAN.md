# Plan du projet

Ce fichier suit l'avancement. `CLAUDE.md` reste le cahier des charges ; `DECISIONS.md` contient les décisions validées.

Dossier de travail : `C:\GitHub\Inventory Management\inventorymanagement` (dépôt cloné par le propriétaire avec GitHub Desktop le 2026-11-16).

## 1. État d'avancement

| Phase | Travail | État |
|---|---|---|
| 0 | Préparer le dossier (Git, `.gitignore`, `README.md`) | **Terminée le 2026-11-16** |
| 1 | Audit et plan | **Terminée le 2026-11-16** (analyse validée, aucun code écrit) |
| 2 | Structure, Firebase, persistance hors ligne | **Terminée le 2026-11-16** (deux vérifications du propriétaire restent à faire) |
| 3 | Connexion, premier lancement, confidentialité | **Faite le 2026-11-16** ; trois tests du propriétaire restent à faire (Google, e-mail de réinitialisation, même adresse) |
| 4a | Produits et conversion des nombres | **Terminée le 2026-11-16** |
| 4b | Mouvements, règles complètes, historique | À faire |
| — | Vérification des secrets, dépôt public, GitHub Pages activé | À faire (fin de la phase 4b) |
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
- **Résultat :** le dossier est un vrai dépôt Git relié à `saintfranckinder/inventorymanagement` ; Git fonctionne (celui de GitHub Desktop suffit) ; `.gitignore` et `README.md` existent.
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

### Étape intermédiaire : dépôt public et GitHub Pages
- **Résultat :** recherche de secrets dans les fichiers et tout l'historique Git ; règles publiées ; dépôt passé en public ; GitHub Pages activé ; `saintfranckinder.github.io` dans les domaines autorisés de Firebase Authentication.
- **Test :** le lien s'ouvre sur le smartphone et la connexion fonctionne.

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

- Trier l'historique par `dateServeur` et afficher `dateAppareil` comme « fait le » (phase 4b).
- *(Tranché : décision 22.)* N'écouter en temps réel que les produits non archivés (phase 4a).
- Filtre par produit dans l'historique : prévu par `DEMARRAGE.md` (phase 6) mais absent de `CLAUDE.md` ; il exige un index à créer dans la console.
- Annoncer une taille raisonnable d'entrepôt (environ 500 produits) à cause du quota de lectures.
- Facultatif : numéro de version affiché ; regroupement des appuis rapides sur `+1` ; vérification dans les règles que le compte n'est pas en cours de suppression.
- *(Tranché : décisions 23 et 24.)* Peut-on désarchiver un produit ? Un produit archivé compte-t-il dans la valeur du stock ?
- Les produits archivés doivent-ils figurer dans l'export Excel (feuille `Stock`) ? À trancher en phase 9.
- *(Tranché : décision 18.)* Liste des devises proposées au premier lancement.

## 5. Problèmes connus

1. *(Résolu le 2026-11-16.)* Le dépôt est cloné dans `C:\GitHub\Inventory Management\inventorymanagement` et relié à `saintfranckinder/inventorymanagement`.
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

## 8. Notes de passation

- **Phase actuelle :** phases 0, 1 et 2 terminées ; phase 3 faite et dans un commit local (tests du propriétaire en attente) ; phase 4a terminée et dans un commit local ; phase 4b à faire.
- **Phase 4a, journal intermédiaire du 2026-11-16 (terminée depuis : voir le compte rendu de la phase 4a, section 2) :** code écrit (`js/nombres.js`, `js/tests-nombres.js`, `tests-nombres.html`, `js/interface.js`, `js/produits.js`, `js/ecran-produits.js`, `js/app.js`, `index.html`, `css/style.css`, `js/tests-regles.js`, `firestore.rules` version 4). `tests-nombres.html` : 98 essais sur 98. Formulaire de produit vérifié en local (contrôles, aides de saisie, 360 pixels). **En attente :** publication de `firestore.rules` version 4 par le propriétaire ; ensuite ajouter, modifier, archiver un produit avec le compte de test et relancer `tests-regles.html`.
- **Phase 3, journal intermédiaire du 2026-11-16 (blocage résolu depuis : voir le compte rendu de la phase 3, section 2) :** code écrit (`index.html`, `css/style.css`, `js/app.js`, `js/auth.js`, `js/entrepot.js`, `js/messages-erreur.js`, `js/tests-regles.js`, `tests-regles.html`, `firestore.rules` version 3). Testé en local avec le compte de test (identifiants dans `.env.test`, fichier ignoré par Git) : inscription, mot de passe trop court, adresse déjà utilisée, mauvais mot de passe, déconnexion, reconnexion, mot de passe oublié (adresse sans compte), confidentialité, affichage à 360 pixels. **Blocage constaté :** après l'annonce de la publication, le serveur refuse toujours la lecture et la création de `users/{uid}` pour le compte de test (`permission-denied`), alors que le jeton de connexion, le projet et la base `(default)` sont corrects. Les règles actives sur le serveur ne sont donc pas la version 3 : vérifier dans la console (Firestore > Règles) que la ligne 4 indique « Version des regles : 3 (phase 3) » et qu'aucune erreur n'a empêché la publication. **En attente :** le propriétaire doit publier `firestore.rules` dans la console ; ensuite tester le premier lancement et lancer `tests-regles.html`. Restent aussi les tests du propriétaire : connexion Google, e-mail de réinitialisation, même adresse par les deux méthodes.
- **Travail terminé :** analyse, plan (ce fichier), décisions 8 à 15 dans `DECISIONS.md`.
- **Fichiers modifiés :** `PLAN.md` (créé), `DECISIONS.md` (décisions ajoutées), `CLAUDE.md` et `DEMARRAGE.md` (alignés sur les décisions 8 à 14). Phase 0 : `.gitignore` et `README.md` créés ; premier commit local fait.
- **Phase 2 :** fichiers créés : `index.html`, `css/style.css`, `js/app.js`, `js/firebase-config.js`, `js/firebase-init.js`, `firestore.rules`, `demarrer.bat`, `outils/serveur-local.ps1`, `vendor/` (SDK Firebase 13.4.0 corrigé, SheetJS 0.20.3, `LISEZMOI.md`). Commit local fait.
- **Prochaine action précise :** le propriétaire fait ses trois tests de la phase 3 (Google, e-mail de réinitialisation, même adresse par les deux méthodes), puis vérifie et publie les commits dans GitHub Desktop. Ensuite, phase 4b (mouvements, règles du lien produit-mouvement, liste locale des opérations non confirmées, historique). Avant de coder la 4b : expliquer simplement au propriétaire comment les règles vérifient qu'un mouvement correspond à la modification de stock. À trancher au début de la 4b : tri de l'historique par `dateServeur` (section 4). À la fin de la 4b : recherche de secrets, puis dépôt public et GitHub Pages (décision 10).
