// Les produits d'un entrepôt : documents users/{uid}/products/{productId}.
// Champs (CLAUDE.md, section 5) : nom, unite, quantiteMilliemes,
// seuilAlerteMilliemes, prixAchatCentimes, archive, dernierMouvementId,
// createdAt, updatedAt.
//
// Règle essentielle : ce fichier ne modifie JAMAIS quantiteMilliemes ni
// dernierMouvementId. Toute variation de quantité passe par un mouvement de
// stock (phase 4b).

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from '../vendor/firebase-firestore.js';

export const LONGUEUR_MAX_NOM_PRODUIT = 100;
export const LONGUEUR_MAX_UNITE = 30;

function collectionProduits(db, uid) {
  return collection(db, 'users', uid, 'products');
}

// Écoute les produits NON archivés du compte (moins de lectures facturées).
// `rappel` reçoit { produits, depuisCache }. Chaque produit porte son `id` et
// `enAttente` (vrai tant que le serveur n'a pas confirmé la dernière
// modification faite sur cet appareil).
export function surveillerProduits(db, uid, rappel, surErreur) {
  const requete = query(collectionProduits(db, uid), where('archive', '==', false));
  return onSnapshot(
    requete,
    { includeMetadataChanges: true },
    (instantane) => {
      rappel({
        produits: instantane.docs.map((document_) => ({
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

// Ajoute un produit avec un stock de 0 et sans mouvement. Le stock initial
// s'enregistre par un mouvement d'entrée (phase 4b).
// Les promesses de ce fichier ne se terminent que lorsque le serveur a
// répondu : ne pas les attendre pour mettre l'écran à jour, mais traiter leur
// échec (refus du serveur).
export function ajouterProduit(db, uid, fiche) {
  const reference = doc(collectionProduits(db, uid));
  return setDoc(reference, {
    nom: fiche.nom,
    unite: fiche.unite,
    quantiteMilliemes: 0,
    seuilAlerteMilliemes: fiche.seuilAlerteMilliemes,
    prixAchatCentimes: fiche.prixAchatCentimes,
    archive: false,
    dernierMouvementId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Modifie uniquement la fiche : nom, unité, seuil, prix. Seuls ces champs
// sont envoyés, pour ne jamais écraser une quantité modifiée ailleurs.
export function modifierProduit(db, uid, idProduit, fiche) {
  return updateDoc(doc(collectionProduits(db, uid), idProduit), {
    nom: fiche.nom,
    unite: fiche.unite,
    seuilAlerteMilliemes: fiche.seuilAlerteMilliemes,
    prixAchatCentimes: fiche.prixAchatCentimes,
    updatedAt: serverTimestamp()
  });
}

// Archive un produit : il disparaît de la liste, mais reste dans la base avec
// son historique. Un produit n'est jamais supprimé.
export function archiverProduit(db, uid, idProduit) {
  return updateDoc(doc(collectionProduits(db, uid), idProduit), {
    archive: true,
    updatedAt: serverTimestamp()
  });
}
