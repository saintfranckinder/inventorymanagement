// Le carnet de clients : documents users/{uid}/clients/{clientId}
// (phase 6c, décisions 72 et 73).
// Champs (CLAUDE.md, section 5) : nom, telephone, whatsapp, email, adresse,
// notes, createdAt, updatedAt.
//
// Copie du carnet de fournisseurs (js/fournisseurs.js), sans « produits
// fournis ». Le carnet est indépendant du stock : il ne crée ni ne modifie
// aucun mouvement, et ne gère pas les ventes. Un client supprimé est effacé
// définitivement.

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from '../vendor/firebase-firestore.js';

// Limites des champs (décisions 54 et 72), identiques à celles de
// firestore.rules.
export const LIMITES_CLIENT = {
  nom: 100,
  telephone: 30,
  whatsapp: 30,
  email: 254,
  adresse: 200,
  notes: 1000
};

function collectionClients(db, uid) {
  return collection(db, 'users', uid, 'clients');
}

function referenceClient(db, uid, idClient) {
  return doc(collectionClients(db, uid), idClient);
}

// Crée un identifiant de client, sans rien envoyer.
export function nouvelIdClient(db, uid) {
  return doc(collectionClients(db, uid)).id;
}

// Seuls les six champs de la fiche sont envoyés, jamais autre chose.
function champsDeLaFiche(fiche) {
  return {
    nom: fiche.nom,
    telephone: fiche.telephone,
    whatsapp: fiche.whatsapp,
    email: fiche.email,
    adresse: fiche.adresse,
    notes: fiche.notes
  };
}

// Écoute tous les clients du compte. À arrêter dès que l'écran des clients
// est quitté (comme la décision 52 pour les fournisseurs). `rappel` reçoit
// { clients, depuisCache } ; chaque client porte son `id` et `enAttente`
// (vrai tant que le serveur n'a pas confirmé la dernière modification faite
// sur cet appareil).
export function surveillerClients(db, uid, rappel, surErreur) {
  return onSnapshot(
    collectionClients(db, uid),
    { includeMetadataChanges: true },
    (instantane) => {
      rappel({
        clients: instantane.docs.map((document_) => ({
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

export function ajouterClient(db, uid, idClient, fiche) {
  return setDoc(referenceClient(db, uid, idClient), {
    ...champsDeLaFiche(fiche),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function modifierClient(db, uid, idClient, fiche) {
  return updateDoc(referenceClient(db, uid, idClient), {
    ...champsDeLaFiche(fiche),
    updatedAt: serverTimestamp()
  });
}

export function supprimerClient(db, uid, idClient) {
  return deleteDoc(referenceClient(db, uid, idClient));
}
