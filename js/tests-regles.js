// Page de test des règles de sécurité (décision 8).
// Elle tente des opérations autorisées et interdites sur le vrai serveur, avec
// le compte connecté, et compare la réponse au résultat attendu.
//
// Phase 3 : isolation des comptes et contrôle des champs de users/{uid}.
// Les essais sur les produits et les mouvements seront ajoutés en phase 4.

import { onAuthStateChanged } from '../vendor/firebase-auth.js';
import {
  deleteDoc,
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  updateDoc
} from '../vendor/firebase-firestore.js';
import { demarrerFirebase } from './firebase-init.js';

const DELAI_MAX_MS = 15000;
const AUTRE_COMPTE = 'compte-de-quelqu-un-d-autre';

function element(id) {
  return document.getElementById(id);
}

function afficherMessage(texte) {
  const zone = element('message');
  zone.textContent = texte;
  zone.hidden = false;
}

// Exécute une opération et renvoie 'autorise', 'refuse' ou une erreur.
async function essayer(operation) {
  let minuterie;
  const delai = new Promise((_, rejeter) => {
    minuterie = setTimeout(() => rejeter({ code: 'pas-de-reponse' }), DELAI_MAX_MS);
  });
  try {
    await Promise.race([operation(), delai]);
    return 'autorise';
  } catch (erreur) {
    if (erreur && erreur.code === 'permission-denied') {
      return 'refuse';
    }
    return 'erreur : ' + (erreur && erreur.code ? erreur.code : String(erreur));
  } finally {
    clearTimeout(minuterie);
  }
}

function ajouterLigne(nom, attendu, obtenu) {
  const libelles = { autorise: 'Autorisé', refuse: 'Refusé' };
  const reussi = attendu === obtenu;
  const ligne = document.createElement('tr');

  const celluleNom = document.createElement('td');
  celluleNom.textContent = nom;

  const celluleAttendu = document.createElement('td');
  celluleAttendu.textContent = libelles[attendu];

  const celluleResultat = document.createElement('td');
  celluleResultat.dataset.resultat = reussi ? 'reussi' : 'echec';
  celluleResultat.textContent =
    (reussi ? '✅ Réussi' : '❌ Échec') + ' — ' + (libelles[obtenu] || obtenu);

  ligne.append(celluleNom, celluleAttendu, celluleResultat);
  element('resultats').append(ligne);
  return reussi;
}

function listeDesEssais(db, uid, entrepot) {
  const monEntrepot = doc(db, 'users', uid);
  const entrepotValide = {
    nomEntrepot: 'Essai',
    devise: 'HTG',
    createdAt: serverTimestamp(),
    suppressionDemandee: false
  };

  return [
    {
      nom: 'Lire son propre entrepôt',
      attendu: 'autorise',
      operation: () => getDocFromServer(monEntrepot)
    },
    {
      nom: 'Enregistrer de nouveau le même nom et la même devise',
      attendu: 'autorise',
      operation: () => updateDoc(monEntrepot, {
        nomEntrepot: entrepot.nomEntrepot,
        devise: entrepot.devise
      })
    },
    {
      nom: 'Lire l’entrepôt d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE))
    },
    {
      nom: 'Créer un entrepôt dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(doc(db, 'users', AUTRE_COMPTE), entrepotValide)
    },
    {
      nom: 'Lire un document en dehors des comptes',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'verification', 'connexion'))
    },
    {
      nom: 'Lire un produit (fermé jusqu’à la phase 4)',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', uid, 'products', 'essai'))
    },
    {
      nom: 'Ajouter un champ non prévu à son entrepôt',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { champNonPrevu: true })
    },
    {
      nom: 'Modifier la date de création',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { createdAt: serverTimestamp() })
    },
    {
      nom: 'Choisir une devise inconnue',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { devise: 'XXX' })
    },
    {
      nom: 'Enregistrer un nom d’entrepôt vide',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: '' })
    },
    {
      nom: 'Enregistrer un nom de 101 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: 'x'.repeat(101) })
    },
    {
      nom: 'Enregistrer un nom qui n’est pas du texte',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: 12345 })
    },
    {
      nom: 'Demander la suppression du compte (fermé jusqu’à la phase 7)',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { suppressionDemandee: true })
    },
    {
      nom: 'Supprimer son entrepôt (fermé jusqu’à la phase 7)',
      attendu: 'refuse',
      operation: () => deleteDoc(monEntrepot)
    }
  ];
}

async function lancerLesTests(db, utilisateur) {
  const bouton = element('bouton-lancer');
  bouton.disabled = true;
  element('resultats').textContent = '';
  element('message').hidden = true;
  element('bilan').hidden = true;

  // Les essais portent sur l'entrepôt du compte : il doit déjà exister.
  let entrepot;
  try {
    const instantane = await getDocFromServer(doc(db, 'users', utilisateur.uid));
    if (!instantane.exists()) {
      afficherMessage('Ce compte n’a pas encore d’entrepôt. Créez-le dans l’application, puis revenez.');
      bouton.disabled = false;
      return;
    }
    entrepot = instantane.data();
  } catch (erreur) {
    afficherMessage(
      'Impossible de lire l’entrepôt de ce compte (' + (erreur.code || 'erreur') + '). ' +
      'Vérifiez Internet et que les règles sont publiées.'
    );
    bouton.disabled = false;
    return;
  }

  const essais = listeDesEssais(db, utilisateur.uid, entrepot);
  let reussis = 0;
  for (const essai of essais) {
    const obtenu = await essayer(essai.operation);
    if (ajouterLigne(essai.nom, essai.attendu, obtenu)) {
      reussis += 1;
    }
  }

  const bilan = element('bilan');
  bilan.textContent = `${reussis} essais réussis sur ${essais.length}.`;
  bilan.className = reussis === essais.length ? 'message-info' : 'message-erreur';
  bilan.hidden = false;
  bouton.disabled = false;
}

async function demarrer() {
  let firebase;
  try {
    firebase = await demarrerFirebase();
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('Firebase n’a pas pu démarrer. Rechargez la page.');
    return;
  }

  let utilisateur = null;
  onAuthStateChanged(firebase.auth, (nouvelUtilisateur) => {
    utilisateur = nouvelUtilisateur;
    element('compte').textContent = utilisateur
      ? (utilisateur.email || utilisateur.uid)
      : 'Aucun compte connecté. Connectez-vous d’abord dans l’application.';
    element('bouton-lancer').disabled = utilisateur === null;
  });

  element('bouton-lancer').addEventListener('click', () => {
    if (utilisateur) {
      lancerLesTests(firebase.db, utilisateur);
    }
  });
}

demarrer();
