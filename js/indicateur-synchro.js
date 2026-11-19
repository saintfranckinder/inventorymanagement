// Indicateur de synchronisation, dans l'en-tête (phase 8, décision 64 ;
// CLAUDE.md, section 7).
//
// Il est approximatif, et le dit : Firestore pour le Web ne fournit pas
// d'indicateur fiable de connexion au serveur, et le navigateur peut se croire
// en ligne sur un Wi-Fi sans Internet.
//
// Sources utilisées, sans aucune lecture de plus :
//   - navigator.onLine et les événements « online » / « offline » ;
//   - les écoutes déjà ouvertes (entrepôt, produits, 50 derniers mouvements,
//     fournisseurs quand leur écran est ouvert) : leurs données viennent-elles
//     seulement de la mémoire de l'appareil (fromCache) ? contiennent-elles
//     des modifications non confirmées (hasPendingWrites) ?
//   - la file d'envoi de Firebase (waitForPendingWrites), qui couvre aussi les
//     modifications que les écoutes ne voient plus (produit archivé,
//     fournisseur supprimé) ;
//   - la liste locale des opérations refusées (operations-en-attente.js).
//
// États, du plus important au moins important : « Erreur de
// synchronisation », « Hors ligne », « En attente de synchronisation »,
// « Synchronisé ». Aucun nombre de modifications n'est affiché.

import { waitForPendingWrites } from '../vendor/firebase-firestore.js';
import { afficherVue, element } from './interface.js';
import { operationsRefusees, surChangementDesOperations } from './operations-en-attente.js';

// Un nouvel état n'est affiché qu'après ce délai, pour éviter le clignotement.
const DELAI_AFFICHAGE_MS = 1500;

// « Hors ligne » déduit de la seule mémoire de l'appareil : délai plus long,
// car au démarrage les premières données viennent toujours de la mémoire.
const DELAI_HORS_LIGNE_MEMOIRE_MS = 3000;

// Si la file d'envoi n'est pas vide après ce délai, des modifications
// attendent la confirmation du serveur.
const DELAI_FILE_MS = 500;

// Vérification régulière de la file d'envoi (opération locale, gratuite).
const INTERVALLE_VERIFICATION_MS = 3000;

// Pour « Se déconnecter » et « Effacer les données de cet appareil » : au-delà
// de ce délai sans confirmation du serveur, des modifications attendent.
const DELAI_VERIFICATION_MS = 2000;

const ETATS = {
  synchronise: {
    texte: 'Synchronisé',
    explication:
      'Synchronisé : le serveur a reçu les modifications faites sur cet appareil, ' +
      'et les données affichées viennent du serveur.'
  },
  attente: {
    texte: 'En attente de synchronisation',
    explication:
      'En attente de synchronisation : des modifications faites sur cet appareil ' +
      'n’ont pas encore été confirmées par le serveur. Gardez l’application ouverte ' +
      'avec Internet : elles partiront toutes seules.'
  },
  horsLigne: {
    texte: 'Hors ligne',
    explication:
      'Hors ligne : pas de connexion au serveur. Vous pouvez continuer à travailler : ' +
      'les données affichées sont celles de la dernière connexion, et vos ' +
      'modifications sont gardées sur cet appareil jusqu’au retour d’Internet.'
  },
  erreur: {
    texte: 'Erreur de synchronisation',
    explication: ''
  }
};

const TEXTE_MODIFICATIONS_EN_ATTENTE =
  'Des modifications attendent d’être envoyées. N’effacez pas les données du ' +
  'navigateur avant leur envoi.';

let contexte = null;               // { db, uid }
let numeroSession = 0;             // une réponse d'une session terminée est ignorée
const ecoutes = new Map();         // nom de l'écoute -> données venues de la mémoire seule ?
let ecrituresEnAttente = false;    // la file d'envoi de Firebase n'est pas vide
let numeroSignal = 0;              // augmente à chaque modification signalée
let attenteEnCours = false;        // un appel à waitForPendingWrites est en cours
let intervalle = null;

let cleAffichee = null;            // état affiché, par exemple « horsLigne+ »
let cleVisee = null;               // état qui sera affiché à la fin du délai
let minuterie = null;

// ---------- Calcul de l'état ----------

function etatCalcule() {
  if (operationsRefusees(contexte.uid).length > 0) {
    return { etat: 'erreur', delai: 0 };
  }
  if (navigator.onLine === false) {
    return { etat: 'horsLigne', delai: DELAI_AFFICHAGE_MS };
  }
  if ([...ecoutes.values()].some(Boolean)) {
    return { etat: 'horsLigne', delai: DELAI_HORS_LIGNE_MEMOIRE_MS };
  }
  if (ecrituresEnAttente) {
    return { etat: 'attente', delai: DELAI_AFFICHAGE_MS };
  }
  return { etat: 'synchronise', delai: DELAI_AFFICHAGE_MS };
}

function annulerMinuterie() {
  if (minuterie !== null) {
    window.clearTimeout(minuterie);
    minuterie = null;
  }
  cleVisee = null;
}

function recalculer() {
  if (!contexte) {
    return;
  }
  const { etat, delai } = etatCalcule();
  const detail = etat === 'horsLigne' && ecrituresEnAttente;
  const cle = etat + (detail ? '+' : '');
  if (cle === cleAffichee) {
    annulerMinuterie();
    return;
  }
  if (cle === cleVisee) {
    return;
  }
  annulerMinuterie();
  cleVisee = cle;
  // Premier affichage : tout de suite, sauf un « Hors ligne » déduit de la
  // mémoire de l'appareil (les premières données en viennent toujours).
  const attente = cleAffichee === null && delai !== DELAI_HORS_LIGNE_MEMOIRE_MS ? 0 : delai;
  minuterie = window.setTimeout(() => {
    minuterie = null;
    cleVisee = null;
    afficher(etat, detail, cle);
  }, attente);
}

// ---------- Affichage ----------

function afficher(etat, detail, cle) {
  cleAffichee = cle;
  const bouton = element('indicateur-synchro');
  bouton.dataset.etat = etat;
  element('synchro-etat').textContent = ETATS[etat].texte;
  element('synchro-detail').hidden = !detail;
  bouton.setAttribute(
    'aria-label',
    `Synchronisation : ${ETATS[etat].texte}` + (detail ? ', envoi en attente' : '') +
    (etat === 'erreur' ? '. Toucher pour voir les opérations refusées.' : '. Toucher pour une explication.')
  );
  bouton.hidden = false;
  if (etat === 'erreur') {
    fermerExplication();
  } else {
    remplirExplication(etat, detail);
  }
}

function remplirExplication(etat, detail) {
  element('synchro-explication-texte').textContent = ETATS[etat].explication;
  const attente = element('synchro-explication-attente');
  attente.textContent = detail ? TEXTE_MODIFICATIONS_EN_ATTENTE : '';
  attente.hidden = !detail;
}

function fermerExplication() {
  element('synchro-explication').hidden = true;
  element('indicateur-synchro').setAttribute('aria-expanded', 'false');
}

// Un toucher : explication de l'état, ou, en cas d'erreur, le bloc
// « Opérations refusées » de l'écran des produits.
function surToucher() {
  const bouton = element('indicateur-synchro');
  if (bouton.dataset.etat === 'erreur') {
    afficherVue('vue-accueil');
    const bloc = element('operations-refusees');
    const titre = bloc.querySelector('h3');
    bloc.scrollIntoView({ block: 'start' });
    if (titre) {
      titre.tabIndex = -1;
      titre.focus({ preventScroll: true });
    }
    return;
  }
  const explication = element('synchro-explication');
  explication.hidden = !explication.hidden;
  bouton.setAttribute('aria-expanded', String(!explication.hidden));
}

// ---------- File d'envoi de Firebase ----------

// Demande à Firebase si toutes les modifications faites sur cet appareil ont
// été confirmées. Un seul appel à la fois : pendant une coupure, la réponse
// n'arrive qu'au retour d'Internet.
function verifierFile() {
  if (!contexte || attenteEnCours) {
    return;
  }
  attenteEnCours = true;
  const session = numeroSession;
  const signal = numeroSignal;
  let repondu = false;
  const minuterieFile = window.setTimeout(() => {
    if (!repondu && session === numeroSession) {
      ecrituresEnAttente = true;
      recalculer();
    }
  }, DELAI_FILE_MS);

  waitForPendingWrites(contexte.db).then(() => true, () => false).then((confirme) => {
    repondu = true;
    window.clearTimeout(minuterieFile);
    if (session !== numeroSession) {
      return;
    }
    attenteEnCours = false;
    if (!confirme) {
      // Changement de compte ou Firebase arrêté : rien à conclure.
      return;
    }
    if (signal !== numeroSignal) {
      // Une modification a été faite pendant l'attente : elle n'était pas
      // couverte par cet appel.
      verifierFile();
      return;
    }
    ecrituresEnAttente = false;
    recalculer();
  });
}

function surReseau() {
  recalculer();
  verifierFile();
}

// ---------- Fonctions appelées par les écrans ----------

// À appeler à chaque réponse d'une écoute ouverte.
//   nom         : 'entrepot', 'produits', 'mouvements' ou 'fournisseurs' ;
//   depuisCache : les données viennent seulement de la mémoire de l'appareil ;
//   enAttente   : elles contiennent une modification non confirmée.
export function signalerEcoute(nom, depuisCache, enAttente = false) {
  if (!contexte) {
    return;
  }
  ecoutes.set(nom, depuisCache);
  if (enAttente) {
    numeroSignal += 1;
    ecrituresEnAttente = true;
    verifierFile();
  }
  recalculer();
}

// À appeler quand une écoute s'arrête.
export function oublierEcoute(nom) {
  if (ecoutes.delete(nom)) {
    recalculer();
  }
}

// Vrai si des modifications faites sur cet appareil n'ont pas été confirmées
// par le serveur dans un court délai. Sert avant « Se déconnecter » et
// « Effacer les données de cet appareil » (décisions 66 et 67).
export async function modificationsEnAttente(db) {
  let minuterieDelai;
  const delai = new Promise((resolve) => {
    minuterieDelai = window.setTimeout(() => resolve(true), DELAI_VERIFICATION_MS);
  });
  try {
    return await Promise.race([waitForPendingWrites(db).then(() => false), delai]);
  } catch {
    // Firebase arrêté (fin de la suppression du compte) : rien n'attend.
    return false;
  } finally {
    window.clearTimeout(minuterieDelai);
  }
}

// ---------- Démarrage et arrêt ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherIndicateur() {
  element('indicateur-synchro').addEventListener('click', surToucher);
  window.addEventListener('online', surReseau);
  window.addEventListener('offline', surReseau);
  surChangementDesOperations(recalculer);
}

// À appeler quand l'entrepôt du compte connecté est chargé. Sans effet si
// l'indicateur tourne déjà pour ce compte.
export function demarrerIndicateur(db, uid) {
  if (contexte && contexte.uid === uid) {
    return;
  }
  arreterIndicateur();
  contexte = { db, uid };
  // Des modifications d'une session précédente peuvent encore attendre.
  verifierFile();
  intervalle = window.setInterval(verifierFile, INTERVALLE_VERIFICATION_MS);
  recalculer();
}

// À appeler à la déconnexion, et quand les écrans de travail s'arrêtent.
export function arreterIndicateur() {
  numeroSession += 1;
  contexte = null;
  ecoutes.clear();
  ecrituresEnAttente = false;
  attenteEnCours = false;
  if (intervalle !== null) {
    window.clearInterval(intervalle);
    intervalle = null;
  }
  annulerMinuterie();
  cleAffichee = null;
  const bouton = element('indicateur-synchro');
  bouton.hidden = true;
  delete bouton.dataset.etat;
  fermerExplication();
}
