// Liste locale des opérations pas encore confirmées par le serveur
// (décision 9).
//
// Pourquoi : une opération faite hors ligne puis refusée par le serveur est
// annulée en silence par Firebase si l'application a été fermée entre-temps.
// Cette liste, gardée sur l'appareil, permet de le signaler à la réouverture.
//
// Fonctionnement :
//   1. avant l'envoi, l'opération est notée ici ;
//   2. si le serveur l'accepte, elle est retirée ;
//   3. si le serveur la refuse, on vérifie d'abord si elle n'était pas déjà
//      enregistrée (nouvel envoi après une coupure) ; sinon elle est marquée
//      « refusée » et affichée à l'utilisateur ;
//   4. au démarrage, les opérations restées « en attente » sont vérifiées une
//      fois que Firebase a fini d'envoyer ce qui attendait.
//
// La liste reste sur l'appareil (localStorage). Elle n'ajoute aucun champ ni
// collection dans Firestore.

import { waitForPendingWrites } from '../vendor/firebase-firestore.js';
import { documentExisteSurServeur } from './mouvements.js';

const PREFIXE_CLE = 'operations-en-attente:';

let avertirChangement = () => {};

// Fonction appelée après chaque changement de la liste.
export function surChangementDesOperations(rappel) {
  avertirChangement = rappel;
}

function cle(uid) {
  return PREFIXE_CLE + uid;
}

// Renvoie la liste des opérations notées pour ce compte.
export function lireOperations(uid) {
  try {
    const texte = window.localStorage.getItem(cle(uid));
    const liste = texte ? JSON.parse(texte) : [];
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

function ecrireOperations(uid, liste) {
  try {
    if (liste.length === 0) {
      window.localStorage.removeItem(cle(uid));
    } else {
      window.localStorage.setItem(cle(uid), JSON.stringify(liste));
    }
  } catch {
    // Stockage bloqué : l'opération continue, mais elle ne sera pas suivie.
    // L'avertissement « ce navigateur n'enregistre pas les données » est
    // déjà affiché dans ce cas.
  }
  avertirChangement();
}

function retirer(uid, id) {
  ecrireOperations(uid, lireOperations(uid).filter((operation) => operation.id !== id));
}

function marquerRefusee(uid, id) {
  ecrireOperations(uid, lireOperations(uid).map((operation) =>
    operation.id === id ? { ...operation, etat: 'refusee' } : operation));
}

export function operationsRefusees(uid) {
  return lireOperations(uid).filter((operation) => operation.etat === 'refusee');
}

// L'utilisateur a pris connaissance d'une opération refusée.
export function oublierOperation(uid, id) {
  retirer(uid, id);
}

// Décide du sort d'une opération que le serveur n'a pas confirmée.
// Renvoie 'deja-enregistree', 'refusee' ou 'inconnu' (serveur injoignable).
async function verifierSurServeur(db, uid, operation) {
  let existe;
  try {
    existe = await documentExisteSurServeur(db, operation.chemin);
  } catch {
    // Pas de réponse du serveur : on réessaiera au prochain démarrage.
    return 'inconnu';
  }
  if (existe) {
    retirer(uid, operation.id);
    return 'deja-enregistree';
  }
  marquerRefusee(uid, operation.id);
  return 'refusee';
}

// Note une opération et suit sa promesse d'envoi.
// `operation` : { id, chemin, libelle, dateAppareil }
//   id      : identifiant unique (celui du mouvement ou du produit) ;
//   chemin  : chemin du document qui prouve l'enregistrement ;
//   libelle : texte montré à l'utilisateur en cas de refus.
// `surResultat` reçoit 'confirmee', 'deja-enregistree', 'refusee' ou 'inconnu'.
export function suivreOperation(db, uid, operation, promesse, surResultat = () => {}) {
  const entree = {
    id: operation.id,
    chemin: operation.chemin,
    libelle: operation.libelle,
    dateAppareil: operation.dateAppareil.toISOString(),
    etat: 'en-attente'
  };
  ecrireOperations(uid, [...lireOperations(uid).filter((autre) => autre.id !== entree.id), entree]);

  promesse.then(
    () => {
      retirer(uid, entree.id);
      surResultat('confirmee');
    },
    async (erreur) => {
      console.error(erreur);
      surResultat(await verifierSurServeur(db, uid, entree), erreur);
    }
  );
}

// Au démarrage : vérifie les opérations notées lors d'une session précédente.
// Attend d'abord que Firebase ait fini d'envoyer ce qui attendait (cela peut
// durer tant qu'Internet est absent).
export async function verifierOperationsAuDemarrage(db, uid) {
  const anciennes = lireOperations(uid).filter((operation) => operation.etat === 'en-attente');
  if (anciennes.length === 0) {
    return;
  }
  try {
    await waitForPendingWrites(db);
  } catch {
    // Changement de compte pendant l'attente : rien à faire.
    return;
  }
  for (const operation of anciennes) {
    const toujoursLa = lireOperations(uid).some((autre) =>
      autre.id === operation.id && autre.etat === 'en-attente');
    if (toujoursLa) {
      await verifierSurServeur(db, uid, operation);
    }
  }
}
