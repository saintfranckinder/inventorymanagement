// L'entrepôt d'un compte : le document users/{uid} de Firestore.
// Champs (CLAUDE.md, section 5) : nomEntrepot, devise, createdAt,
// suppressionDemandee.

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from '../vendor/firebase-firestore.js';

export const LONGUEUR_MAX_NOM_ENTREPOT = 100;

// Cette liste doit rester identique à celle de firestore.rules.
export const DEVISES = [
  { code: 'HTG', nom: 'Gourde haïtienne (HTG)' },
  { code: 'USD', nom: 'Dollar américain (USD)' },
  { code: 'EUR', nom: 'Euro (EUR)' },
  { code: 'DOP', nom: 'Peso dominicain (DOP)' },
  { code: 'CAD', nom: 'Dollar canadien (CAD)' }
];

export function nomDevise(code) {
  const devise = DEVISES.find((element) => element.code === code);
  return devise ? devise.nom : code;
}

function referenceEntrepot(db, uid) {
  return doc(db, 'users', uid);
}

// Écoute l'entrepôt du compte. `rappel` reçoit :
//   existe      : le document existe ;
//   donnees     : son contenu (ou null) ;
//   depuisCache : la réponse vient de la mémoire de l'appareil, pas du serveur.
//
// Important : « existe = false » avec « depuisCache = true » ne prouve PAS que
// le compte est nouveau. L'entrepôt peut exister sur le serveur sans avoir
// encore été chargé sur cet appareil. Seule une réponse du serveur
// (depuisCache = false) permet de proposer la création d'un entrepôt.
export function surveillerEntrepot(db, uid, rappel, surErreur) {
  return onSnapshot(
    referenceEntrepot(db, uid),
    { includeMetadataChanges: true },
    (instantane) => {
      rappel({
        existe: instantane.exists(),
        donnees: instantane.exists() ? instantane.data() : null,
        depuisCache: instantane.metadata.fromCache
      });
    },
    surErreur
  );
}

// Crée l'entrepôt au premier lancement. La promesse ne se termine que lorsque
// le serveur a répondu : ne pas l'attendre pour mettre l'écran à jour, mais
// traiter son échec (refus du serveur).
export function creerEntrepot(db, uid, nomEntrepot, devise) {
  return setDoc(referenceEntrepot(db, uid), {
    nomEntrepot,
    devise,
    createdAt: serverTimestamp(),
    suppressionDemandee: false
  });
}

// Paramètres (décision 49). Seul le champ concerné est envoyé. Comme
// ci-dessus, la promesse ne se termine que lorsque le serveur a répondu.
export function modifierNomEntrepot(db, uid, nomEntrepot) {
  return updateDoc(referenceEntrepot(db, uid), { nomEntrepot });
}

// À n'appeler qu'après avoir vérifié qu'aucun produit n'existe : changer la
// devise ne convertit pas les montants.
export function modifierDevise(db, uid, devise) {
  return updateDoc(referenceEntrepot(db, uid), { devise });
}
