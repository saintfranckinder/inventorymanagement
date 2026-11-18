// Le carnet de fournisseurs : documents users/{uid}/suppliers/{supplierId}
// (phase 6b, décisions 42 et 50 à 54).
// Champs (CLAUDE.md, section 5) : nom, telephone, whatsapp, email, adresse,
// produitsFournis, notes, createdAt, updatedAt.
//
// Le carnet est indépendant du stock : il ne crée ni ne modifie aucun
// mouvement. Un fournisseur supprimé est effacé définitivement (décision 50).

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from '../vendor/firebase-firestore.js';

// Limites des champs (décision 54), identiques à celles de firestore.rules.
export const LIMITES_FOURNISSEUR = {
  nom: 100,
  telephone: 30,
  whatsapp: 30,
  email: 254,
  adresse: 200,
  produitsFournis: 500,
  notes: 1000
};

// Téléphone et WhatsApp : chiffres, espaces et + - ( ) . seulement (comme
// dans firestore.rules).
export const CARACTERES_TELEPHONE = /^[0-9 +().-]*$/;

// E-mail : plus strict que les règles (qui demandent seulement x@y) : le
// formulaire exige aussi un point après le @.
export const FORME_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function collectionFournisseurs(db, uid) {
  return collection(db, 'users', uid, 'suppliers');
}

function referenceFournisseur(db, uid, idFournisseur) {
  return doc(collectionFournisseurs(db, uid), idFournisseur);
}

// Crée un identifiant de fournisseur, sans rien envoyer.
export function nouvelIdFournisseur(db, uid) {
  return doc(collectionFournisseurs(db, uid)).id;
}

// Seuls les sept champs de la fiche sont envoyés, jamais autre chose.
function champsDeLaFiche(fiche) {
  return {
    nom: fiche.nom,
    telephone: fiche.telephone,
    whatsapp: fiche.whatsapp,
    email: fiche.email,
    adresse: fiche.adresse,
    produitsFournis: fiche.produitsFournis,
    notes: fiche.notes
  };
}

// Écoute tous les fournisseurs du compte. À arrêter dès que l'écran des
// fournisseurs est quitté (décision 52). `rappel` reçoit
// { fournisseurs, depuisCache } ; chaque fournisseur porte son `id` et
// `enAttente` (vrai tant que le serveur n'a pas confirmé la dernière
// modification faite sur cet appareil).
export function surveillerFournisseurs(db, uid, rappel, surErreur) {
  return onSnapshot(
    collectionFournisseurs(db, uid),
    { includeMetadataChanges: true },
    (instantane) => {
      rappel({
        fournisseurs: instantane.docs.map((document_) => ({
          id: document_.id,
          ...document_.data(),
          enAttente: document_.metadata.hasPendingWrites
        })),
        depuisCache: instantane.metadata.fromCache
      });
    },
    surErreur
  );
}

// Les promesses de ce fichier ne se terminent que lorsque le serveur a
// répondu : ne pas les attendre pour mettre l'écran à jour, mais traiter leur
// échec (refus du serveur).

export function ajouterFournisseur(db, uid, idFournisseur, fiche) {
  return setDoc(referenceFournisseur(db, uid, idFournisseur), {
    ...champsDeLaFiche(fiche),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function modifierFournisseur(db, uid, idFournisseur, fiche) {
  return updateDoc(referenceFournisseur(db, uid, idFournisseur), {
    ...champsDeLaFiche(fiche),
    updatedAt: serverTimestamp()
  });
}

export function supprimerFournisseur(db, uid, idFournisseur) {
  return deleteDoc(referenceFournisseur(db, uid, idFournisseur));
}
