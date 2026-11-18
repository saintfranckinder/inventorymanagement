# Décisions du projet

Chaque décision : date, choix, raison. Ne pas modifier une décision sans l'accord du propriétaire.

## 2026-11-16

1. **Base de données : Cloud Firestore, édition Standard, base `(default)`, emplacement `nam5`, mode production.** Raison : gratuit (plan Spark), hors ligne intégré, pas de mise en pause pour inactivité. L'emplacement ne peut plus être changé.
2. **Forfait Firebase : Spark uniquement, jamais Blaze.** Raison : budget zéro. Conséquence : aucune sauvegarde automatique ni export géré du serveur ; l'export Excel est la seule sauvegarde.
3. **Connexion : Google et adresse e-mail / mot de passe.** Raison : Google évite les mots de passe pour ceux qui ont un compte Google ; le mot de passe reste possible pour les autres. Les deux méthodes sont activées dans la console Firebase.
4. **Quantités et montants stockés en entiers : quantités en millièmes, prix en centimes.** Raison : éviter les erreurs d'arrondi des nombres à virgule lors des additions successives et des vérifications des règles de sécurité.
5. **Champ `dernierMouvementId` sur chaque produit.** Raison : permettre aux règles de sécurité de vérifier qu'une modification de quantité correspond à un mouvement enregistré.
6. **Hébergement : GitHub Pages. Dépôt privé pendant le développement, public seulement à la publication après l'audit de sécurité.** Raison : GitHub Pages gratuit exige un dépôt public. *(Moment du passage en public modifié par la décision 10.)*
7. **Publication du code : le propriétaire publie lui-même avec GitHub Desktop.** L'assistant fait uniquement des commits locaux.

## 2026-11-16 — décisions issues de l'audit (phase 1), validées par le propriétaire

8. **Les règles Firestore qui portent sur un lot (produit + mouvement) sont testées avec une page de test de l'application, `tests-regles.html`, et un compte de test.** Le simulateur de la console sert seulement aux refus simples. Raison : le simulateur ne teste qu'une écriture à la fois ; il ne peut pas valider le lien produit-mouvement.
9. **Règles « tolérantes au hors-ligne » et liste locale des opérations non confirmées.** Les règles ne refusent pas un mouvement à cause d'un état qui a pu changer sur un autre appareil (produit renommé ou archivé). L'appareil garde la liste des opérations pas encore confirmées et signale à la réouverture celles que le serveur a refusées. Cette liste reste sur l'appareil : aucun nouveau champ ni collection dans Firestore. Raison : une écriture hors ligne refusée après fermeture de l'application disparaît sinon sans message.
10. **Le dépôt devient public à la fin de la phase 4b, et non plus en phase 13.** Conditions : recherche de secrets dans les fichiers et tout l'historique Git, et règles Firestore publiées. L'audit final de la phase 12 est conservé. Raison : GitHub Pages gratuit exige un dépôt public, et les phases 5 à 10 demandent des tests sur smartphone. Modifie la décision 6.
11. **Les fichiers du SDK Firebase copiés dans `/vendor` ont leur import vers `gstatic.com` remplacé par un chemin local, et le développement utilise un petit serveur local sans installation (script PowerShell).** Raison : sans cette correction l'application dépend d'Internet au démarrage ; les modules et le service worker ne fonctionnent pas en ouvrant le fichier directement.
12. **Règles du lien produit-mouvement complétées.** Le mouvement désigné par `dernierMouvementId` ne doit pas exister avant le lot ; la création d'un produit avec stock initial est traitée comme un cas à part ; un produit créé avec un stock de 0 n'a pas de mouvement et son `dernierMouvementId` est vide. Raison : sans cela, un ancien mouvement pourrait justifier une nouvelle modification, et la création de produit serait refusée.
13. **Suppression du compte : reconnexion demandée en premier, suppression en ligne uniquement, reprise automatique à la connexion suivante si `suppressionDemandee` est vrai.** Une suppression demandée ne s'annule pas. Raison : éviter un compte à moitié supprimé ; la limite gratuite est de 20 000 suppressions par jour.
14. **La phase 4 est coupée en 4a (produits, conversion des nombres) et 4b (mouvements, règles, historique). Le test « rouvrir l'application en mode avion » passe de la phase 8 à la phase 10.** Raison : phase 4 trop chargée pour une session ; ce test exige le service worker, créé en phase 10.
15. **Dossier de travail : `C:\GitHub\Inventory Management`.** Il doit être relié au dépôt GitHub `saintfranckinder/inventorymanagement` avant la phase 0. Raison : le dossier n'était pas un dépôt Git au moment de l'audit. *(Précision du 2026-11-16 : le propriétaire a cloné le dépôt dans le sous-dossier `C:\GitHub\Inventory Management\inventorymanagement`, qui est désormais le dossier de travail.)* *(Précision du 2026-11-18 : le propriétaire a renommé le dépôt GitHub en `saintfranckinder/minstock`. L'adresse prévue du site devient `https://saintfranckinder.github.io/minstock/`. Le dossier de travail ne change pas.)*

## 2026-11-16 — phase 2

16. **Versions fixes des bibliothèques : SDK Firebase 13.4.0 (`firebase-app.js`, `firebase-auth.js`, `firebase-firestore.js`) et SheetJS 0.20.3 (`xlsx.full.min.js`).** Sources officielles, empreintes et correction appliquée notées dans `vendor/LISEZMOI.md`. Raison : `CLAUDE.md` exige une version fixe, jamais `latest` ; ce sont les versions officielles les plus récentes au moment du téléchargement.
17. **Serveur local sur `http://localhost:8080/`, toujours le même port.** Raison : le navigateur range les données locales (comptes, mémoire hors ligne) par adresse ; changer de port ferait apparaître une application « vide » pendant les tests.

## 2026-11-16 — phase 3

18. **Devises proposées : HTG (par défaut), USD, EUR, DOP, CAD.** La liste existe dans `js/entrepot.js` et dans `firestore.rules` ; les deux doivent rester identiques. Raison : liste courte adaptée à Haïti ; les règles refusent toute autre valeur.
19. **Pas de vérification de l'adresse par e-mail à l'inscription.** Raison : non demandée par `CLAUDE.md`, et une étape de plus pour l'utilisateur. Conséquences acceptées : une faute de frappe dans l'adresse empêche de recevoir l'e-mail de « Mot de passe oublié » ; un compte créé par mot de passe avec une adresse Gmail perd ce mot de passe à la première connexion Google (les données restent).
20. **L'écran « Créer votre entrepôt » ne s'affiche que si le serveur confirme qu'aucun entrepôt n'existe.** Quand la réponse vient seulement de la mémoire de l'appareil, l'application attend Internet. Raison : sur un nouvel appareil sans Internet, un compte existant ressemblerait à un compte neuf et son entrepôt pourrait être écrasé.
21. **Mot de passe : 8 caractères minimum, contrôlé dans l'application avant l'envoi**, en plus de la règle réglée dans la console Firebase.

## 2026-11-16 — phase 4a

22. **L'application n'écoute en temps réel que les produits non archivés.** Raison : moins de lectures facturées après chaque coupure de plus de 30 minutes.
23. **Un produit archivé ne peut pas être remis dans la liste (première version).** L'archivage demande une confirmation. Raison : `CLAUDE.md` ne demande que l'archivage. Les règles n'interdisent pas le désarchivage, pour pouvoir l'ajouter plus tard sans les republier.
24. **Les produits archivés ne comptent pas dans la valeur du stock affichée.** Raison : ils ne sont plus affichés.
25. **Un produit dont le stock n'est pas à 0 peut être archivé, avec un avertissement.** Raison : un refus pourrait rejeter une opération faite hors ligne (décision 9).
26. **Deux produits actifs ne peuvent pas porter le même nom (majuscules et accents ignorés). Ce contrôle est fait dans le formulaire, pas dans les règles.** Raison : éviter les confusions dans l'historique ; les règles ne peuvent pas vérifier l'unicité sans lectures coûteuses. Limite acceptée : deux appareils hors ligne peuvent créer le même nom.
27. **L'unité d'un produit est obligatoire (30 caractères au plus).** Raison : elle est recopiée dans chaque mouvement.
28. **Saisie des nombres : virgule ou point pour les décimales, espaces pour les milliers ; 3 décimales au plus pour une quantité, 2 pour un prix ; toute décimale en trop est refusée, jamais arrondie.** Conséquence acceptée : `1.000` est lu comme 1 ; la valeur comprise s'affiche sous le champ.
29. **Limites : 1 milliard d'unités et un prix de 10 milliards dans le formulaire ; bornes de quantité plus larges dans les règles.** Raison : écarter les nombres absurdes sans refuser une opération légitime faite hors ligne.
30. **La valeur d'une ligne est calculée en grands entiers (BigInt), avec le même arrondi que `Math.round(quantiteMilliemes × prixAchatCentimes / 1000)`.** Raison : résultat identique à la formule de `CLAUDE.md`, mais exact avec de très grands nombres.
31. **En phase 4a, un produit est créé avec un stock de 0, sans mouvement ; chaque modification d'un produit écrit `updatedAt` avec l'heure du serveur, et les règles l'exigent.** Raison : toute variation de quantité doit passer par un mouvement (phase 4b).

## 2026-11-16 — phase 4b

32. **L'historique est trié par `dateServeur` (heure de réception par le serveur). `dateAppareil` est affichée comme « Fait le » ; si l'écart dépasse 5 minutes, les deux heures sont affichées.** Raison : l'heure d'un appareil peut être fausse ; le tri par heure du serveur donne un ordre stable aux 50 derniers mouvements.
33. **Saisie d'un mouvement : choisir Entrée, Sortie ou Ajustement. Entrée et Sortie se saisissent sans signe ; l'Ajustement se saisit comme une correction avec son signe.** Raison : plus clair qu'un signe à taper ; l'application ne remplace jamais une quantité par un chiffre calculé à l'écran (`CLAUDE.md`, section 6, règle 3).
34. **Un stock négatif est autorisé : avertissement avant l'envoi, puis mention « Stock négatif : à vérifier ».** Raison : demandé par `CLAUDE.md` ; un refus perdrait des opérations faites hors ligne.
35. **Les règles vérifient la cohérence du type : une entrée est positive, une sortie est négative, un ajustement a le signe qu'on veut ; jamais 0.**
36. **Les règles acceptent un mouvement sur un produit archivé, et ne comparent pas le nom ni l'unité du mouvement à ceux du produit.** Raison : décision 9 (un produit peut être archivé ou renommé sur un autre appareil pendant qu'un mouvement attend hors ligne).
37. **Le suivi des opérations non confirmées couvre les mouvements et les créations de produit. Il est gardé dans `localStorage`, par compte.** Les modifications de fiche et l'archivage ne sont pas suivis. Raison : ce sont les opérations dont la perte fausserait le stock.
38. **Le stock de départ d'un produit est un mouvement d'entrée de motif « Stock initial », créé dans le même lot que le produit. Un stock de départ de 0 ne crée aucun mouvement.**
39. **Les identifiants de produit et de mouvement acceptés par les règles ne contiennent que des lettres, des chiffres, le tiret et le tiret bas.** Raison : ils servent à construire des chemins dans les règles.

## 2026-11-18 — étape « dépôt public »

40. **La page `tests-regles.html` ne se lance qu'avec un compte de test, dont l'adresse se termine par `@example.com`.** Le contrôle est fait à l'ouverture (bouton bloqué, message en français) et de nouveau au lancement, avant toute écriture. Raison : la page est publiée avec le site ; lancée avec un vrai compte, elle ajouterait dans ce vrai entrepôt des données d'essai impossibles à supprimer. Les données des autres comptes étaient déjà protégées par les règles. Limite acceptée : le contrôle est fait dans le navigateur ; quelqu'un qui modifie volontairement la page ne peut toucher qu'à son propre compte.
41. **Un fichier vide `.nojekyll` est placé à la racine du dépôt.** Raison : par défaut, GitHub Pages fait passer les fichiers par Jekyll, un outil prévu pour les blogs, qui peut ignorer certains fichiers ou dossiers ; ce fichier lui demande de tout publier tel quel, dont `vendor/`. Sans effet chez un autre hébergeur.
