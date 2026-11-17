// Page de test des règles de sécurité (décision 8).
// Elle tente des opérations autorisées et interdites sur le vrai serveur, avec
// le compte connecté, et compare la réponse au résultat attendu.
//
// Phase 3 : isolation des comptes et contrôle des champs de users/{uid}.
// Phase 4a : produits (fiche modifiable, quantité intouchable).
// Les essais sur les mouvements seront ajoutés en phase 4b.
//
// Le compte de test garde un produit « Produit d'essai (règles) », archivé à
// la fin de chaque passage : il n'apparaît donc pas dans la liste.

import { onAuthStateChanged } from '../vendor/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from '../vendor/firebase-firestore.js';
import { demarrerFirebase } from './firebase-init.js';

const DELAI_MAX_MS = 15000;
const AUTRE_COMPTE = 'compte-de-quelqu-un-d-autre';
const ID_PRODUIT_ESSAI = 'essai-regles';

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

// Fiche de produit valide pour une création. `modifications` remplace ou
// ajoute des champs, pour fabriquer les cas interdits.
function produitValide(modifications = {}) {
  return {
    nom: 'Produit d’essai (règles)',
    unite: 'sac',
    quantiteMilliemes: 0,
    seuilAlerteMilliemes: 1500,
    prixAchatCentimes: 12550,
    archive: false,
    dernierMouvementId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...modifications
  };
}

function essaisEntrepot(db, uid, entrepot) {
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
      nom: 'Ajouter un champ non prévu à son entrepôt',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { champNonPrevu: true })
    },
    {
      nom: 'Modifier la date de création de l’entrepôt',
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
      nom: 'Enregistrer un nom d’entrepôt de 101 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: 'x'.repeat(101) })
    },
    {
      nom: 'Enregistrer un nom d’entrepôt qui n’est pas du texte',
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

function essaisProduits(db, uid, produitEssaiExiste) {
  const mesProduits = collection(db, 'users', uid, 'products');
  const produitEssai = doc(mesProduits, ID_PRODUIT_ESSAI);
  // Un nouvel identifiant à chaque tentative de création interdite.
  const nouveau = () => doc(mesProduits);

  const essais = [];

  // Le produit d'essai n'est créé qu'une fois : il ne peut pas être supprimé.
  if (!produitEssaiExiste) {
    essais.push({
      nom: 'Créer un produit valide (stock 0, sans mouvement)',
      attendu: 'autorise',
      operation: () => setDoc(produitEssai, produitValide())
    });
  }

  essais.push(
    {
      nom: 'Lire la liste de ses produits',
      attendu: 'autorise',
      operation: () => getDocsFromServer(query(mesProduits, where('archive', '==', false)))
    },
    {
      nom: 'Modifier la fiche d’un produit (nom, unité, seuil, prix)',
      attendu: 'autorise',
      operation: () => updateDoc(produitEssai, {
        nom: 'Produit d’essai (règles)',
        unite: 'kg',
        seuilAlerteMilliemes: 2500,
        prixAchatCentimes: 9999,
        archive: false,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier directement la quantité d’un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        quantiteMilliemes: 5000,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Augmenter la quantité sans mouvement',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        quantiteMilliemes: increment(1000),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier le dernier mouvement sans mouvement',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        dernierMouvementId: 'mouvement-invente',
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier un produit sans mettre la date à jour',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, { nom: 'Sans date' })
    },
    {
      nom: 'Modifier la date de création d’un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Ajouter un champ non prévu à un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        champNonPrevu: true,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un prix négatif',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        prixAchatCentimes: -1,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un prix à virgule (non entier)',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        prixAchatCentimes: 12.5,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un seuil d’alerte négatif',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        seuilAlerteMilliemes: -1000,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un nom de produit vide',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, { nom: '', updatedAt: serverTimestamp() })
    },
    {
      nom: 'Enregistrer un nom de produit de 101 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        nom: 'x'.repeat(101),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer une unité de 31 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        unite: 'x'.repeat(31),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Créer un produit avec un stock différent de 0',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ quantiteMilliemes: 5000 }))
    },
    {
      nom: 'Créer un produit avec un dernier mouvement inventé',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ dernierMouvementId: 'mouvement-invente' }))
    },
    {
      nom: 'Créer un produit déjà archivé',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ archive: true }))
    },
    {
      nom: 'Créer un produit avec une date choisie par l’appareil',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ createdAt: new Date(2000, 0, 1) }))
    },
    {
      nom: 'Créer un produit avec un champ non prévu',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ champNonPrevu: true }))
    },
    {
      nom: 'Créer un produit sans unité',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ unite: '' }))
    },
    {
      nom: 'Supprimer un produit',
      attendu: 'refuse',
      operation: () => deleteDoc(produitEssai)
    },
    {
      nom: 'Lire un produit d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE, 'products', ID_PRODUIT_ESSAI))
    },
    {
      nom: 'Créer un produit dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(
        doc(db, 'users', AUTRE_COMPTE, 'products', ID_PRODUIT_ESSAI),
        produitValide()
      )
    },
    {
      nom: 'Lire un mouvement (fermé jusqu’à la phase 4b)',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', uid, 'movements', 'essai'))
    },
    {
      // En dernier : le produit d'essai disparaît ainsi de la liste.
      nom: 'Archiver un produit',
      attendu: 'autorise',
      operation: () => updateDoc(produitEssai, { archive: true, updatedAt: serverTimestamp() })
    }
  );

  return essais;
}

async function lancerLesTests(db, utilisateur) {
  const bouton = element('bouton-lancer');
  bouton.disabled = true;
  element('resultats').textContent = '';
  element('message').hidden = true;
  element('bilan').hidden = true;

  // Les essais portent sur l'entrepôt du compte : il doit déjà exister.
  let entrepot;
  let produitEssaiExiste;
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
  try {
    const produit = await getDocFromServer(
      doc(db, 'users', utilisateur.uid, 'products', ID_PRODUIT_ESSAI)
    );
    produitEssaiExiste = produit.exists();
  } catch (erreur) {
    afficherMessage(
      'Impossible de lire les produits de ce compte (' + (erreur.code || 'erreur') + '). ' +
      'Les règles publiées dans la console sont sans doute plus anciennes que le fichier firestore.rules.'
    );
    bouton.disabled = false;
    return;
  }

  const essais = [
    ...essaisEntrepot(db, utilisateur.uid, entrepot),
    ...essaisProduits(db, utilisateur.uid, produitEssaiExiste)
  ];
  let reussis = 0;
  for (const essai of essais) {
    const obtenu = await essayer(essai.operation);
    if (ajouterLigne(essai.nom, essai.attendu, obtenu)) {
      reussis += 1;
    }
  }

  const bilan = element('bilan');
  bilan.textContent = `${reussis} essais réussis sur ${essais.length}.` +
    (produitEssaiExiste ? ' (La création du produit d’essai n’est pas rejouée : il existe déjà.)' : '');
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
