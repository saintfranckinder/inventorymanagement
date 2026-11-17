// Page de vérification technique (phase 2).
// Elle affiche seulement trois états : Firebase joint, mémoire hors ligne,
// version. Les écrans de l'application arrivent à partir de la phase 3.

import { doc, getDocFromServer } from '../vendor/firebase-firestore.js';
import { demarrerFirebase, VERSION_SDK_FIREBASE } from './firebase-init.js';

const VERSION_APP = '0.2.0';

function afficherEtat(idElement, niveau, texte) {
  const element = document.getElementById(idElement);
  element.textContent = texte;
  element.dataset.niveau = niveau;
}

function afficherAvertissement(texte) {
  const zone = document.getElementById('avertissement');
  zone.textContent = texte;
  zone.hidden = false;
}

// Essaie de lire un document sur le serveur. Avec des règles qui refusent
// tout, la réponse attendue est un refus : cela prouve que le projet Firebase
// a bien été joint et que les règles protègent les données.
async function verifierConnexionFirebase(db) {
  try {
    await getDocFromServer(doc(db, 'verification', 'connexion'));
    return 'ouvert';
  } catch (erreur) {
    if (erreur && erreur.code === 'permission-denied') {
      return 'refuse';
    }
    if (erreur && erreur.code === 'unavailable') {
      return 'injoignable';
    }
    console.error(erreur);
    return 'erreur';
  }
}

async function demarrer() {
  afficherEtat(
    'etat-version',
    'info',
    `Application ${VERSION_APP} — SDK Firebase ${VERSION_SDK_FIREBASE}`
  );

  let firebase;
  try {
    firebase = await demarrerFirebase();
  } catch (erreur) {
    console.error(erreur);
    afficherEtat('etat-firebase', 'erreur', 'Erreur au démarrage de Firebase');
    afficherEtat('etat-persistance', 'erreur', 'Non vérifiée');
    return;
  }

  const resultat = await verifierConnexionFirebase(firebase.db);
  if (resultat === 'refuse') {
    afficherEtat('etat-firebase', 'ok', 'Projet joint. Accès refusé par les règles, comme prévu.');
  } else if (resultat === 'ouvert') {
    afficherEtat('etat-firebase', 'alerte', 'Projet joint, mais les règles laissent lire les données.');
    afficherAvertissement(
      'Les règles de sécurité ne sont pas en place : publiez le fichier firestore.rules dans la console Firebase.'
    );
  } else if (resultat === 'injoignable') {
    afficherEtat('etat-firebase', 'alerte', 'Serveur injoignable. Vérifiez la connexion Internet.');
  } else {
    afficherEtat('etat-firebase', 'erreur', 'Erreur inattendue. Voir la console du navigateur.');
  }

  const memoireActive = await firebase.verifierMemoireHorsLigne();
  if (memoireActive) {
    afficherEtat('etat-persistance', 'ok', 'Active');
  } else {
    afficherEtat('etat-persistance', 'alerte', 'Indisponible');
    afficherAvertissement(
      'Ce navigateur n’enregistre pas les données sur l’appareil. ' +
      'Sans Internet, l’application ne pourra pas se rouvrir avec vos données, ' +
      'et une modification non envoyée sera perdue à la fermeture. ' +
      'Évitez la navigation privée et vérifiez que le stockage du site est autorisé.'
    );
  }
}

demarrer();
