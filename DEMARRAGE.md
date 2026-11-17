# Guide de démarrage du projet

## Rôle de ce fichier

- `CLAUDE.md` est le **seul cahier des charges** : fonctions, technologies, sécurité, priorités. En cas de différence, CLAUDE.md l'emporte.
- `DECISIONS.md` contient les décisions déjà validées. Ne pas les modifier sans l'accord du propriétaire.
- Ce fichier décrit seulement **la façon de travailler** : ordre des phases, choix du modèle, messages à copier, tests manuels.

Le propriétaire est débutant en programmation. Chaque étape doit être expliquée simplement.

## 1. Règles de travail

1. Travailler par phases. **Une session Claude Code par phase.** Si une session devient très longue, faire une note de passation (section 7) et continuer dans une nouvelle session.
2. Commencer chaque phase avec le message de début de phase (section 5).
3. Attendre l'accord du propriétaire avant toute modification importante.
4. Terminer chaque phase avec le message de fin de phase (section 6).
5. Claude ne fait jamais de `git push`. Le propriétaire vérifie les changements dans GitHub Desktop et publie lui-même (bouton **Push origin**).

## 2. Choix du modèle

Les noms, prix et offres des modèles changent. Vérifier le sélecteur de modèle et **Paramètres > Utilisation** au moment de travailler. Ne pas se fier à une date ou un quota écrit dans ce guide.

**Règle de budget :** utiliser uniquement des modèles **inclus dans l'abonnement sans frais supplémentaires**. Si un modèle n'est disponible qu'avec des crédits payants, ne pas l'utiliser.

**Offre temporaire :** si un modèle plus capable est temporairement inclus sans frais, le réserver en priorité aux phases 1, 2, 3, 4a, 4b, 7 et 12, dans cet ordre.

Choisir le modèle **avant** le premier message de la session.

| Phase | Travail | Niveau de modèle |
|---|---|---|
| 0 | Préparation du dossier | Intermédiaire |
| 1 | Audit et plan | Le plus capable inclus sans frais |
| 2 | Structure, Firebase, persistance hors ligne | Le plus capable inclus sans frais |
| 3 | Connexion, premier lancement, confidentialité | Le plus capable inclus sans frais |
| 4a | Produits et conversion des nombres | Le plus capable inclus sans frais |
| 4b | Mouvements, règles Firestore, historique, puis dépôt public | Le plus capable inclus sans frais |
| 5 | Tableau de bord | Intermédiaire |
| 6 | Formulaires, historique lisible, paramètres | Intermédiaire |
| 7 | Suppression du compte | Le plus capable inclus sans frais |
| 8 | Hors ligne et indicateur de synchronisation | Intermédiaire |
| 9 | Export Excel | Intermédiaire |
| 10 | Application installable (PWA) | Intermédiaire |
| 11 | Données de démonstration | Rapide |
| 12 | Audit final de sécurité | Le plus capable inclus sans frais |
| 13 | Documentation et publication | Intermédiaire |

**En cas de difficulté :**

1. Reproduire le problème.
2. Copier le message d'erreur exact (ou faire une capture d'écran).
3. Demander une analyse de la cause sans modifier le code.
4. Si le problème résiste après deux tentatives, faire une note de passation (section 7) et passer à un modèle plus capable inclus sans frais.

Ne pas changer de modèle simplement parce qu'une tâche prend du temps.

## 3. État de la préparation

### Déjà fait

- Claude Code fonctionne dans l'application de bureau (onglet Code).
- GitHub Desktop est installé.
- Dépôt `saintfranckinder/inventorymanagement` créé sur GitHub, en **privé**.
- Projet Firebase créé, plan Spark.
- Firestore : édition Standard, base `(default)`, emplacement `nam5`, mode production.
- Authentication : Google et adresse e-mail / mot de passe activés.
- Application Web enregistrée ; le bloc `firebaseConfig` est conservé hors du dossier du projet, à donner à Claude en phase 2.

### Reste à faire sur l'ordinateur (constaté le 2026-11-16)

1. Git : rien à installer. La commande `git` n'existe pas séparément, mais GitHub Desktop contient son propre Git, que Claude utilise pour les commits locaux (`%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe` ; le numéro de version dans le chemin change à chaque mise à jour de GitHub Desktop). Installer Git for Windows reste facultatif.
2. *(Fait le 2026-11-16.)* Dépôt cloné avec GitHub Desktop dans `C:\GitHub\Inventory Management\inventorymanagement`.

### Reste à faire dans la console Firebase (Authentication > onglets Modèles et Paramètres)

1. Modèles : langue des modèles en **Français**, nom d'expéditeur lisible.
2. Domaines autorisés : ajouter `saintfranckinder.github.io`.
3. Actions des utilisateurs : vérifier que la protection contre l'énumération des adresses e-mail est cochée.
4. Règles de mot de passe : 8 caractères minimum, mode « Exiger ».

Ne jamais passer au forfait Blaze. Si une fonction exige un service payant, arrêter et expliquer la limite avant de continuer.

## 4. Les phases

### Phase 0 : préparer le dossier

```text
Lis CLAUDE.md et DECISIONS.md en entier. Examine le dossier du projet avant de modifier quoi que ce soit.

Le dépôt Git existe déjà (cloné avec GitHub Desktop) : ne le réinitialise pas.
Ne remplace pas CLAUDE.md, DEMARRAGE.md, DECISIONS.md ni PLAN.md (PLAN.md existe depuis la phase 1).

Explique-moi simplement ce qui est présent et ce qui manque.

Crée uniquement :
- .gitignore (au minimum : .env, .env.*, node_modules/, .claude/settings.local.json, Thumbs.db, .DS_Store)
- README.md (titre et une phrase de présentation)

Vérifie que Git fonctionne (git --version).
Ne publie rien sur GitHub. Attends mon accord avant chaque action qui modifie mon ordinateur, puis fais un commit local.
```

**Facultatif, recommandé :** demander aussi à Claude de créer `.claude/settings.json` avec ce contenu. Il l'empêche de lire des fichiers secrets et l'oblige à demander avant toute publication ou installation.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "ask": ["Bash(git push *)", "Bash(npm install *)", "Bash(npx *)"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(rm -rf *)", "Bash(curl * | bash)"]
  }
}
```

### Phase 1 : audit et plan

Mode Plan si disponible. Ne rien coder.

```text
Lis intégralement CLAUDE.md, DECISIONS.md et DEMARRAGE.md.

Pour cette phase, ne code rien et ne modifie aucun fichier.

Analyse les risques et les contradictions du projet, en particulier :
- le fonctionnement hors ligne et les coupures de plus de 30 minutes ;
- les mouvements de stock et le stockage en entiers (millièmes, centimes) ;
- les modifications faites depuis plusieurs appareils ;
- les règles de sécurité Firestore, notamment le lien produit-mouvement avec dernierMouvementId ;
- la connexion Google et e-mail avec la même adresse ;
- la suppression du compte ;
- la publication sur GitHub Pages ;
- les limites des offres gratuites.

Explique les problèmes en français simple. Distingue l'indispensable du facultatif.

Propose un plan qui suit les phases 2 à 13 de DEMARRAGE.md, avec pour chaque phase le résultat attendu et les tests.

Attends mon accord. Ensuite, enregistre le plan dans PLAN.md et ajoute à DECISIONS.md (sans rien effacer) les nouvelles décisions validées.
```

### Phase 2 : structure, Firebase et persistance hors ligne

Objectifs :

- Créer la structure minimale du projet.
- Copier dans `/vendor` les fichiers du SDK Firebase (version fixe) et SheetJS. Dans chaque fichier du SDK, remplacer l'import vers `gstatic.com` par un chemin local.
- Préparer un petit serveur local sans installation (script PowerShell) pour ouvrir l'application sur `http://localhost`.
- Connecter l'application au projet Firebase avec `firebaseConfig`.
- Activer la persistance hors ligne de Firestore et gérer son échec.
- Préparer un premier `firestore.rules` qui refuse tout par défaut, et expliquer comment le publier.

Ne pas construire de fonctionnalités dans cette phase.

### Phase 3 : connexion, premier lancement et confidentialité

Objectifs :

- Connexion avec Google (fenêtre popup) et avec e-mail / mot de passe.
- Inscription et mot de passe oublié (e-mail uniquement).
- Gestion de la même adresse e-mail utilisée par les deux méthodes.
- Premier lancement : nom de l'entrepôt et devise.
- Texte de confidentialité accessible depuis l'écran de connexion.
- Règles : chaque utilisateur n'accède qu'à `users/{son uid}`.

Tests : créer un compte avec chaque méthode, se déconnecter, se reconnecter ; vérifier avec un second compte qu'il ne voit pas les données du premier.

### Phase 4 : produits, mouvements, règles et historique

Phase prioritaire, en **deux sessions** : 4a puis 4b. Pas de design soigné avant que les opérations de stock soient correctes.

- **Phase 4a :** produits (ajouter, modifier, archiver) et fonction unique de conversion des nombres, testée avec la page `tests-nombres.html`.
- **Phase 4b :** mouvements, règles complètes, liste locale des opérations non confirmées, historique.

Objectifs :

- Ajouter, modifier et archiver un produit.
- Stock initial enregistré comme mouvement, dans le même batch que la création.
- Entrées, sorties et ajustements, en entiers (millièmes, centimes), avec `dernierMouvementId`.
- Protection contre les doublons lors d'une nouvelle tentative.
- Règles Firestore complètes pour produits et mouvements, testées avec la page `tests-regles.html` et un compte de test (le simulateur de la console ne teste qu'une écriture à la fois : il sert aux refus simples).
- Liste locale des opérations non confirmées, vérifiée à chaque ouverture de l'application.
- Historique : 50 derniers mouvements, puis bouton « Voir plus ».

Tests : chaque opération, y compris avec décimales (`-2,5`) ; quantité et historique concordants ; modification directe de la quantité refusée.

**À la fin de la phase 4b, passage du dépôt en public :**

1. Rechercher des secrets dans les fichiers et dans tout l'historique Git.
2. Publier `firestore.rules` dans la console.
3. Passer le dépôt en **public** sur github.com (obligatoire pour GitHub Pages gratuit) et activer GitHub Pages, avec les instructions de Claude clic par clic.
4. Vérifier que `saintfranckinder.github.io` figure dans les domaines autorisés de Firebase Authentication.

Les tests sur smartphone des phases suivantes se font sur ce lien.

### Phase 5 : tableau de bord

Objectifs :

- Liste des produits et recherche.
- Quantité, seuil, prix d'achat, valeur (indiquée comme indicative).
- Boutons tactiles `+1` et `-1`, saisie d'une quantité précise.
- Alertes orange et rouge, avec les mentions `Stock bas` et `Rupture`.

Tests : smartphone (360 pixels de large) et ordinateur.

### Phase 6 : formulaires, historique lisible et paramètres

Objectifs :

- Formulaire simple d'ajout et de modification.
- Historique lisible, filtre par produit, dates et motifs.
- Paramètres : nom de l'entrepôt ; devise modifiable seulement si l'entrepôt ne contient aucun produit.

### Phase 7 : suppression du compte

Objectifs :

- Bouton « Supprimer mon compte et mes données », double confirmation, rappel d'exporter avant.
- Parcours décrit dans CLAUDE.md (section 8) : reconnexion demandée en premier, suppression en ligne uniquement, reprise automatique si elle est interrompue.

Tests : uniquement avec un compte de test, jamais avec le compte du propriétaire.

### Phase 8 : hors ligne et indicateur de synchronisation

Objectifs :

- Indicateur simple à quatre états, présenté comme approximatif (CLAUDE.md, section 7).
- Messages clairs pour les opérations rejetées et les opérations déjà enregistrées.

Tests : section 9 de ce guide, sauf l'étape 8 (rouvrir en mode avion), qui exige le service worker et se teste en phase 10.

### Phase 9 : export Excel

Objectifs :

- SheetJS local dans `/vendor`.
- Fichier `stock_AAAA-MM-JJ.xlsx` avec les feuilles `Stock` et `Historique` (historique complet), nombres convertis en décimaux.
- Avertissement si l'appareil est hors ligne ou si des écritures sont en attente.

Tests : ouvrir le fichier dans Excel et vérifier les quantités à virgule.

### Phase 10 : application installable (PWA)

Objectifs :

- Manifeste et icônes.
- Service worker qui met en cache l'interface, le SDK Firebase et SheetJS de `/vendor`.
- Chemins compatibles avec l'adresse GitHub Pages, qui contient le nom du dépôt (`https://saintfranckinder.github.io/inventorymanagement/`).

Tests : installation sur le téléphone ; réouverture en mode avion après une première visite en ligne.

### Phase 11 : données de démonstration

Objectif : bouton « Charger des données de démonstration », visible seulement si l'entrepôt est vide. Les données passent par des mouvements, comme de vraies données.

### Phase 12 : audit final

```text
Lis CLAUDE.md, PLAN.md et DECISIONS.md.

Effectue un audit final sans supposer que les fonctions marchent parce que le code existe.

Vérifie :
- les règles Firestore et l'isolation des comptes ;
- le lien produit-mouvement et les risques de doublons ;
- les nombres entiers et les conversions ;
- la suppression du compte ;
- les erreurs de synchronisation et les tests hors ligne ;
- l'export Excel ;
- l'affichage sur smartphone ;
- les fichiers et tout l'historique Git, à la recherche de secrets (le dépôt est public depuis la fin de la phase 4b).

Classe les problèmes par gravité et explique-les simplement.
Ne corrige pas une partie importante sans mon accord.
Ne prétends pas avoir testé ce qui ne l'a pas été.
```

### Phase 13 : documentation et publication

Objectifs :

- Finaliser le README en français, y compris les limites connues (valorisation au prix actuel, absence de sauvegarde automatique, indicateur approximatif).
- Le dépôt est public et GitHub Pages est activé depuis la fin de la phase 4b. Ne présenter l'application comme terminée que si l'audit de la phase 12 est validé.
- Vérifier que GitHub Pages publie bien la dernière version.
- Vérifier que `saintfranckinder.github.io` figure dans les domaines autorisés de Firebase Authentication.
- Publier `firestore.rules` dans la console si ce n'est pas déjà fait.
- Tester le lien publié sur ordinateur et smartphone.

## 5. Message de début de phase

```text
Lis CLAUDE.md, PLAN.md et DECISIONS.md.

Résume en français simple :
1. L'objectif de la phase actuelle (phase N : nom).
2. Ce qui est déjà terminé.
3. Les décisions importantes à respecter.
4. Les fichiers que tu comptes modifier.
5. Les risques et les tests prévus.

Ne commence pas à coder avant mon accord.
Ne modifie pas les décisions déjà validées sans me demander.
```

Vérifier ce résumé avant de répondre « vas-y ». S'il oublie ou déforme une décision, le corriger d'abord.

## 6. Message de fin de phase

```text
Avant de terminer :

1. Explique ce qui a été réalisé.
2. Donne-moi les étapes exactes pour tester le résultat.
3. Indique les tests réellement exécutés et ceux qui restent à faire.
4. Signale les erreurs et limites connues.
5. Mets à jour PLAN.md, DECISIONS.md (sans rien effacer) et README.md si nécessaire.
6. Vérifie les changements, puis crée un commit Git local.

Ne fais aucun git push.
Explique-moi comment vérifier le commit dans GitHub Desktop.
```

Ensuite : vérifier dans GitHub Desktop, cliquer sur **Push origin**, fermer la session.

## 7. Changement de modèle ou de session au milieu d'une phase

```text
Prépare une note de passation dans PLAN.md :
- phase actuelle ;
- travail terminé ;
- travail restant ;
- fichiers modifiés ;
- erreurs rencontrées ;
- décisions prises ;
- prochaine action précise.

Ne recommence pas le projet et ne réécris pas le code qui fonctionne.
Fais un commit local après vérification.
```

Ouvrir ensuite une nouvelle session avec le modèle choisi et utiliser le message de début de phase.

**Si un modèle a cassé quelque chose :** dans GitHub Desktop, onglet **History**, clic droit sur le commit fautif, puis **Revert changes in commit**.

## 8. Rappels de sécurité

- Ne jamais mettre de mot de passe, de clé privée ni les codes de secours Google ou GitHub dans le dossier du projet.
- La configuration web Firebase est visible dans le navigateur : la protection vient des règles Firestore et de l'authentification.
- Le dépôt reste privé jusqu'à la fin de la phase 4b. Avant de le rendre public, rechercher des secrets dans les fichiers et dans tout l'historique Git.

## 9. Tests manuels du mode hors ligne

Dans cet ordre :

1. Ouvrir l'application avec Internet.
2. Se connecter et attendre que les produits soient chargés.
3. Vérifier que l'indicateur affiche `Synchronisé`.
4. Activer le mode avion.
5. Vérifier que les données déjà consultées restent visibles.
6. Faire un mouvement de test.
7. Vérifier que l'application indique qu'il est en attente.
8. Fermer puis rouvrir l'application en mode avion et noter ce qui reste accessible. (À partir de la phase 10 seulement : cette étape exige le service worker.)
9. Rétablir Internet.
10. Vérifier que le mouvement est synchronisé et apparaît dans l'historique.
11. Si possible, ouvrir le compte sur un deuxième appareil et vérifier que les données confirmées apparaissent.

Si un test échoue, noter exactement le résultat. Ne pas masquer l'échec et ne pas déclarer le mode hors ligne opérationnel.

## 10. Règle finale

Le projet doit rester à la portée d'un débutant qui utilise Claude Code. Les priorités sont celles de CLAUDE.md (section 4). Ne pas sacrifier la compréhension, la fiabilité ou le budget pour ajouter des technologies ou des fonctionnalités impressionnantes mais inutiles.
