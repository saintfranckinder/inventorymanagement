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
15. **Dossier de travail : `C:\GitHub\Inventory Management`.** Il doit être relié au dépôt GitHub `saintfranckinder/inventorymanagement` avant la phase 0. Raison : le dossier n'était pas un dépôt Git au moment de l'audit. *(Précision du 2026-11-16 : le propriétaire a cloné le dépôt dans le sous-dossier `C:\GitHub\Inventory Management\inventorymanagement`, qui est désormais le dossier de travail.)*
