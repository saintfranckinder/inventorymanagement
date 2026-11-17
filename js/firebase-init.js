// Démarrage de Firebase : application, comptes (Authentication) et base de
// données (Firestore) avec la mémoire hors ligne.
//
// Les fichiers du SDK viennent du dossier /vendor (copie locale, version fixe),
// jamais d'Internet : voir vendor/LISEZMOI.md.

import { initializeApp } from '../vendor/firebase-app.js';
import { getAuth } from '../vendor/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from '../vendor/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const VERSION_SDK_FIREBASE = '13.4.0';

// Vérifie que le navigateur accepte d'enregistrer des données sur l'appareil
// (IndexedDB), en écrivant puis en effaçant une petite base de test.
// Firestore en a besoin pour sa mémoire hors ligne.
function testerStockageLocal() {
  return new Promise((resolve) => {
    let termine = false;
    const finir = (resultat) => {
      if (!termine) {
        termine = true;
        resolve(resultat);
      }
    };

    try {
      if (!globalThis.indexedDB) {
        finir(false);
        return;
      }
      const nomBase = 'test-stockage-local';
      const demande = globalThis.indexedDB.open(nomBase, 1);

      demande.onupgradeneeded = () => {
        demande.result.createObjectStore('test');
      };
      demande.onsuccess = () => {
        const base = demande.result;
        try {
          const transaction = base.transaction('test', 'readwrite');
          transaction.objectStore('test').put(1, 'cle');
          transaction.oncomplete = () => {
            base.close();
            globalThis.indexedDB.deleteDatabase(nomBase);
            finir(true);
          };
          transaction.onerror = () => {
            base.close();
            finir(false);
          };
          transaction.onabort = transaction.onerror;
        } catch {
          base.close();
          finir(false);
        }
      };
      demande.onerror = () => finir(false);
      demande.onblocked = () => finir(false);

      // Sécurité : ne jamais bloquer le démarrage si le navigateur ne répond pas.
      setTimeout(() => finir(false), 5000);
    } catch {
      finir(false);
    }
  });
}

// Cherche la base locale créée par Firestore. Elle n'existe que si la mémoire
// hors ligne a réellement démarré, et seulement après une première opération.
// Renvoie true, false, ou null quand le navigateur ne permet pas de le savoir.
async function baseLocaleFirestorePresente() {
  try {
    if (!globalThis.indexedDB || typeof globalThis.indexedDB.databases !== 'function') {
      return null;
    }
    const bases = await globalThis.indexedDB.databases();
    return bases.some((base) =>
      typeof base.name === 'string' &&
      base.name.startsWith('firestore/') &&
      base.name.includes(firebaseConfig.projectId)
    );
  } catch {
    return null;
  }
}

// Démarre Firebase. À appeler une seule fois, avant toute lecture ou écriture.
export async function demarrerFirebase() {
  const stockageLocalDisponible = await testerStockageLocal();

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // La mémoire hors ligne est toujours demandée. Si le navigateur la refuse,
  // Firestore continue sans elle et sans prévenir : c'est pourquoi l'état est
  // vérifié à part, pour pouvoir avertir l'utilisateur.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

  // À appeler seulement APRÈS une première opération Firestore : avant, la
  // base locale n'existe pas encore et le résultat serait faux.
  // Résultat approximatif, à présenter comme tel :
  //   true  : la mémoire hors ligne semble active ;
  //   false : elle est indisponible (les données ne survivront pas à la
  //           fermeture de l'application).
  async function verifierMemoireHorsLigne() {
    if (!stockageLocalDisponible) {
      return false;
    }
    const presente = await baseLocaleFirestorePresente();
    return presente !== false;
  }

  // `stockageLocalDisponible` est connu dès le démarrage, avant toute
  // opération Firestore.
  return { app, auth, db, stockageLocalDisponible, verifierMemoireHorsLigne };
}
