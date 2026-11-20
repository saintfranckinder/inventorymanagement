// Suppression du compte et de toutes ses données (phase 7).
// CLAUDE.md, section 8 ; décisions 13 et 60 à 63.
//
// Déroulement :
//   1. la demande (suppressionDemandee: true) est enregistrée par une
//      transaction : elle exige Internet et ne laisse rien en attente ;
//   2. les données sont effacées par paquets, dans cet ordre : produits,
//      mouvements, fournisseurs, clients (un mouvement envoyé en retard par
//      un autre appareil est alors refusé, car son produit n'existe plus) ;
//   3. puis le document de l'entrepôt ;
//   4. puis le compte de connexion (js/auth.js) ;
//   5. enfin, la copie gardée sur l'appareil est effacée.
// Une demande ne s'annule pas : si la suppression s'interrompt, elle reprend
// à la connexion suivante (js/ecran-suppression.js).

import {
  clearIndexedDbPersistence,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  query,
  runTransaction,
  terminate,
  writeBatch
} from '../vendor/firebase-firestore.js';

// Nombre de documents effacés par lot (taille vérifiée par essai : voir
// PLAN.md, compte rendu de la phase 7).
export const TAILLE_PAQUET = 100;

// Au-delà de ce délai sans réponse du serveur, l'étape est arrêtée et un
// message propose de réessayer.
const DELAI_MAX_MS = 30000;

const PREFIXE_MARQUE = 'suppression-compte:';
const PREFIXE_OPERATIONS = 'operations-en-attente:';

const ETAPES = [
  { collection: 'products', libelle: 'Produits' },
  { collection: 'movements', libelle: 'Historique des mouvements' },
  { collection: 'suppliers', libelle: 'Fournisseurs' },
  // Phase 6c (décision 72) : sans cette ligne, les fiches des clients
  // resteraient sur le serveur après la suppression du compte.
  { collection: 'clients', libelle: 'Clients' }
];

function avecDelai(promesse) {
  let minuterie;
  const delai = new Promise((_, rejeter) => {
    minuterie = window.setTimeout(() => rejeter({ code: 'delai-depasse' }), DELAI_MAX_MS);
  });
  return Promise.race([promesse, delai]).finally(() => window.clearTimeout(minuterie));
}

// ---------- Marque locale ----------
// Elle permet à cet appareil de « terminer la suppression » si seule la
// dernière étape (le compte de connexion) a échoué (décision 62).

export function noterSuppressionCommencee(uid) {
  try {
    window.localStorage.setItem(PREFIXE_MARQUE + uid, '1');
  } catch {
    // Stockage bloqué : la reprise se fera tout de même tant que
    // l'entrepôt existe sur le serveur.
  }
}

export function suppressionCommenceeIci(uid) {
  try {
    return window.localStorage.getItem(PREFIXE_MARQUE + uid) === '1';
  } catch {
    return false;
  }
}

// ---------- 1. La demande ----------

export async function demanderSuppression(db, uid) {
  await avecDelai(runTransaction(db, async (transaction) => {
    const reference = doc(db, 'users', uid);
    const instantane = await transaction.get(reference);
    if (!instantane.exists()) {
      throw { code: 'entrepot-introuvable' };
    }
    if (instantane.data().suppressionDemandee !== true) {
      transaction.update(reference, { suppressionDemandee: true });
    }
  }));
}

// ---------- 2 et 3. Les données, puis l'entrepôt ----------

// `surAvancement` reçoit { etape, total } après chaque paquet.
// Renvoie le nombre de documents effacés.
export async function supprimerLesDonnees(db, uid, surAvancement) {
  let total = 0;
  for (const etape of ETAPES) {
    surAvancement({ etape: etape.libelle, total });
    for (;;) {
      const page = await avecDelai(getDocsFromServer(
        query(collection(db, 'users', uid, etape.collection), limit(TAILLE_PAQUET))
      ));
      if (page.empty) {
        break;
      }
      const lot = writeBatch(db);
      for (const document_ of page.docs) {
        lot.delete(document_.ref);
      }
      await avecDelai(lot.commit());
      total += page.size;
      surAvancement({ etape: etape.libelle, total });
    }
  }

  surAvancement({ etape: 'Entrepôt', total });
  const entrepot = doc(db, 'users', uid);
  const instantane = await avecDelai(getDocFromServer(entrepot));
  if (instantane.exists()) {
    await avecDelai(deleteDoc(entrepot));
    total += 1;
  }
  surAvancement({ etape: 'Entrepôt', total });
  return total;
}

// ---------- 5. La copie gardée sur l'appareil ----------

// Renvoie vrai si la mémoire hors ligne de Firestore a pu être effacée (elle
// ne le peut pas si MinStock est ouvert dans un autre onglet). Après cet
// appel, Firestore n'est plus utilisable : il faut recharger la page.
export async function effacerDonneesLocales(db, uid) {
  try {
    window.localStorage.removeItem(PREFIXE_OPERATIONS + uid);
    window.localStorage.removeItem(PREFIXE_MARQUE + uid);
  } catch {
    // Stockage bloqué : rien n'y était enregistré.
  }
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    return true;
  } catch (erreur) {
    console.error(erreur);
    return false;
  }
}
