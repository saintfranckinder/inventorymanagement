# Dossier vendor : bibliothèques copiées dans le projet

Ces fichiers viennent des éditeurs officiels. Ils sont copiés ici, en version fixe, pour que l'application puisse s'ouvrir sans Internet et ne dépende d'aucun serveur externe pour démarrer.

Ne pas modifier ces fichiers à la main, sauf la correction décrite ci-dessous.

## Fichiers

Téléchargés le 2026-11-16.

| Fichier | Version | Source officielle | Empreinte SHA-256 du fichier d'origine |
|---|---|---|---|
| `firebase-app.js` | 13.4.0 | `https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js` | `26673F502611BC7B382EDFEE3230C70954DD5E4982779185C7B6B657B5F69737` |
| `firebase-auth.js` | 13.4.0 | `https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js` | `9BE3B6574C0C46F4A0BFB8D85436C30C89871A8D5A9FBEB0E0137D90A74667E9` |
| `firebase-firestore.js` | 13.4.0 | `https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js` | `758596FA33E277D38925D05E8111ACFD209DC0DBFF593E3BB4EAEB35AEC2F85C` |
| `xlsx.full.min.js` (SheetJS) | 0.20.3 | `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` | `CC015130AA8521E7F088F88898EBA949CCDCBFB38DF0BD129B44B7273C3A6F41` |

L'empreinte permet de vérifier qu'un fichier téléchargé de nouveau est bien identique à celui utilisé ici.

## Police Montserrat (identité MinStock, décision 57)

Téléchargée le 2026-11-18, non modifiée.

| Fichier | Contenu | Source officielle | Empreinte SHA-256 |
|---|---|---|---|
| `polices/montserrat-latin.woff2` | Montserrat v31, caractères latins (dont les accents français, `’`, `«`, `»`, `−`), graisses 500 à 700 | `https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2` (adresse donnée par `https://fonts.googleapis.com/css2?family=Montserrat:wght@500..700`) | `06B16DB7A969135D48D38C49183BE7FB88D4452E2A3011957C7851941F4E4879` |
| `polices/OFL-Montserrat.txt` | Licence SIL Open Font License 1.1 : usage, copie et diffusion gratuits, y compris dans une application | `https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt` | — |

La licence doit toujours accompagner le fichier de la police.

## Correction appliquée au SDK Firebase

Les fichiers officiels `firebase-auth.js` et `firebase-firestore.js` chargent `firebase-app.js` depuis Internet. Sans correction, l'application ne démarrerait pas hors ligne.

Dans chacun de ces deux fichiers, une seule ligne a été modifiée :

- avant : `from"https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js"`
- après : `from"./firebase-app.js"`

`firebase-app.js` et `xlsx.full.min.js` ne sont pas modifiés. Les deux adresses `gstatic.com` qui restent dans `firebase-app.js` sont de simples étiquettes de texte, pas des chargements.

## Changer de version

1. Télécharger les trois fichiers Firebase de la même version, depuis la même adresse officielle.
2. Refaire la correction ci-dessus dans `firebase-auth.js` et `firebase-firestore.js`.
3. Mettre à jour ce tableau et `VERSION_SDK_FIREBASE` dans `js/firebase-init.js`.
4. Vérifier dans l'onglet Réseau du navigateur qu'aucun fichier n'est chargé depuis `gstatic.com`.
5. Refaire les tests de la phase 2 (voir `PLAN.md`).

Ne jamais utiliser une adresse contenant `latest`.
