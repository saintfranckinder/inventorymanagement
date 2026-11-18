// Les produits d'un entrepôt : documents users/{uid}/products/{productId}.
// Champs (CLAUDE.md, section 5) : nom, unite, quantiteMilliemes,
// seuilAlerteMilliemes, prixAchatCentimes, archive, dernierMouvementId,
// createdAt, updatedAt.
//
// Règle essentielle : après sa création, la quantité d'un produit ne change
// JAMAIS depuis ce fichier. Toute variation passe par un mouvement de stock
// (js/mouvements.js).

import {
  collection,
  doc,
  getDocsFromCache,
  getDocsFromServer,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from '../vendor/firebase-firestore.js';
import { contenuMouvement, referenceMouvement } from './mouvements.js';

export const LONGUEUR_MAX_NOM_PRODUIT = 100;
export const LONGUEUR_MAX_UNITE = 30;
export const MOTIF_STOCK_INITIAL = 'Stock initial';

function collectionProduits(db, uid) {
  return collection(db, 'users', uid, 'products');
}

// Crée un identifiant de produit, sans rien envoyer.
export function nouvelIdProduit(db, uid) {
  return doc(collectionProduits(db, uid)).id;
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

// Vrai si l'entrepôt contient au moins un produit, même archivé (décision 49).
// D'abord la mémoire de l'appareil, qui connaît aussi les produits ajoutés ici
// et pas encore envoyés ; puis le serveur, qui connaît ceux des autres
// appareils (une seule lecture). Sans Internet, la promesse échoue : la
// devise reste alors bloquée.
export async function entrepotContientDesProduits(db, uid) {
  const requete = query(collectionProduits(db, uid), limit(1));
  try {
    const local = await getDocsFromCache(requete);
    if (!local.empty) {
      return true;
    }
  } catch {
    // Mémoire de l'appareil illisible : seule la réponse du serveur compte.
  }
  const serveur = await getDocsFromServer(requete);
  return !serveur.empty;
}

// Ajoute un produit.
// `creation` : { idProduit, fiche, stockInitialMilliemes, idMouvement, dateAppareil }
//   - stock de départ à 0 : le produit seul, sans mouvement ;
//   - stock de départ positif : un lot unique crée le produit ET son
//     mouvement d'entrée initial (CLAUDE.md, section 6, règle 8).
// Les promesses de ce fichier ne se terminent que lorsque le serveur a
// répondu : ne pas les attendre pour mettre l'écran à jour, mais traiter leur
// échec (refus du serveur).
export function ajouterProduit(db, uid, creation) {
  const reference = doc(collectionProduits(db, uid), creation.idProduit);
  const avecStock = creation.stockInitialMilliemes > 0;
  const contenu = {
    nom: creation.fiche.nom,
    unite: creation.fiche.unite,
    quantiteMilliemes: avecStock ? creation.stockInitialMilliemes : 0,
    seuilAlerteMilliemes: creation.fiche.seuilAlerteMilliemes,
    prixAchatCentimes: creation.fiche.prixAchatCentimes,
    archive: false,
    dernierMouvementId: avecStock ? creation.idMouvement : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!avecStock) {
    return setDoc(reference, contenu);
  }

  const lot = writeBatch(db);
  lot.set(reference, contenu);
  lot.set(
    referenceMouvement(db, uid, creation.idMouvement),
    contenuMouvement(uid, {
      idProduit: creation.idProduit,
      nomProduit: creation.fiche.nom,
      unite: creation.fiche.unite,
      deltaMilliemes: creation.stockInitialMilliemes,
      type: 'entree',
      motif: MOTIF_STOCK_INITIAL,
      dateAppareil: creation.dateAppareil
    })
  );
  return lot.commit();
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
