// Écran « Paramètres » (phase 6, décision 49) : nom de l'entrepôt et devise.
//
// La devise n'est modifiable que si l'entrepôt ne contient aucun produit,
// même archivé : changer la devise ne convertit pas les montants
// (CLAUDE.md, section 4, point 12). La vérification demande au serveur, donc
// Internet ; sans réponse, la devise reste bloquée. Les règles Firestore ne
// peuvent pas faire cette vérification (limite notée dans le README).

import {
  DEVISES,
  LONGUEUR_MAX_NOM_ENTREPOT,
  modifierDevise,
  modifierNomEntrepot,
  nomDevise
} from './entrepot.js';
import { afficherMessage, afficherVue, effacerMessages, element, vueActuelle } from './interface.js';
import { messageErreur } from './messages-erreur.js';
import { entrepotContientDesProduits } from './produits.js';

// Au-delà de ce délai sans réponse du serveur, la devise reste bloquée.
const DELAI_VERIFICATION_MS = 15000;

const TEXTES_DEVISE = {
  verification: 'Vérification auprès du serveur…',
  libre:
    'L’entrepôt ne contient encore aucun produit : vous pouvez changer la devise. ' +
    'Elle sera bloquée dès le premier produit.',
  bloquee:
    'La devise ne peut plus être changée : l’entrepôt contient déjà des produits ' +
    '(même archivés). Changer la devise ne convertirait pas les prix déjà saisis.',
  horsLigne:
    'Vérification impossible sans Internet : la devise ne peut pas être changée ' +
    'pour l’instant.'
};

let contexte = null;            // { db, uid, entrepot }
let numeroVerification = 0;     // une réponse d'une vérification dépassée est ignorée
let deviseModifiable = false;
let changementEnCours = false;

// ---------- Devise ----------

// `etat` : 'verification', 'libre', 'bloquee' ou 'horsLigne'.
function afficherEtatDevise(etat) {
  element('parametres-devise-etat').textContent = TEXTES_DEVISE[etat];
  if (etat === 'verification') {
    // Les boutons restent en place pendant la vérification : le focus
    // clavier ne doit pas se perdre.
    element('parametres-devise').disabled = true;
    return;
  }
  deviseModifiable = etat === 'libre';
  element('parametres-devise').disabled = !deviseModifiable;
  element('bouton-enregistrer-devise').hidden = !deviseModifiable;
  element('bouton-verifier-devise').hidden = etat !== 'horsLigne';
}

function avecDelai(promesse) {
  let minuterie;
  const delai = new Promise((_, rejeter) => {
    minuterie = window.setTimeout(
      () => rejeter(new Error('Pas de réponse du serveur.')),
      DELAI_VERIFICATION_MS
    );
  });
  return Promise.race([promesse, delai]).finally(() => window.clearTimeout(minuterie));
}

// Demande si un produit existe. Renvoie 'libre', 'bloquee', 'horsLigne', ou
// null si la réponse est dépassée (autre vérification, changement de compte).
async function verifierDevise() {
  if (!contexte) {
    return null;
  }
  const numero = ++numeroVerification;
  const { db, uid } = contexte;
  afficherEtatDevise('verification');
  let etat;
  try {
    etat = (await avecDelai(entrepotContientDesProduits(db, uid))) ? 'bloquee' : 'libre';
  } catch (erreur) {
    console.error(erreur);
    etat = 'horsLigne';
  }
  if (numero !== numeroVerification || !contexte || contexte.uid !== uid) {
    return null;
  }
  afficherEtatDevise(etat);
  return etat;
}

async function verifierDeNouveau() {
  effacerMessages();
  await verifierDevise();
  // Le bouton « Vérifier de nouveau » a pu disparaître : le focus clavier
  // passe sur la liste des devises, ou sur l'explication.
  if (element('bouton-verifier-devise').hidden && vueActuelle() === 'vue-parametres') {
    const liste = element('parametres-devise');
    if (!liste.disabled) {
      liste.focus();
    } else {
      const explication = element('parametres-devise-etat');
      explication.tabIndex = -1;
      explication.focus();
    }
  }
}

async function enregistrerDevise() {
  effacerMessages();
  if (!contexte || !deviseModifiable || changementEnCours) {
    return;
  }
  const devise = element('parametres-devise').value;
  if (!DEVISES.some((choix) => choix.code === devise)) {
    afficherMessage('erreur-parametres-devise', 'Choisissez une devise dans la liste.');
    return;
  }
  if (devise === contexte.entrepot.devise) {
    afficherMessage('info-parametres-devise', 'C’est déjà la devise de l’entrepôt.');
    return;
  }

  // Nouvelle vérification juste avant d'enregistrer : un produit a pu être
  // ajouté depuis l'ouverture de l'écran.
  changementEnCours = true;
  let etat;
  try {
    etat = await verifierDevise();
  } finally {
    changementEnCours = false;
  }
  if (etat === null) {
    return;
  }
  if (etat !== 'libre') {
    afficherMessage(
      'erreur-parametres-devise',
      etat === 'bloquee'
        ? 'La devise n’a pas été changée : l’entrepôt contient déjà un produit.'
        : 'La devise n’a pas été changée : la vérification est impossible sans Internet.'
    );
    return;
  }

  const { db, uid } = contexte;
  modifierDevise(db, uid, devise).catch((erreur) =>
    signalerRefus('erreur-parametres-devise', 'info-parametres-devise', 'Le changement de devise', erreur));
  afficherMessage('info-parametres-devise', `Devise changée : ${nomDevise(devise)}.`);
}

// ---------- Nom de l'entrepôt ----------

function enregistrerNom() {
  effacerMessages();
  if (!contexte) {
    return;
  }
  const champ = element('parametres-nom');
  const nom = champ.value.trim();
  if (!nom) {
    afficherMessage('erreur-parametres-nom', 'Donnez un nom à votre entrepôt.');
    return;
  }
  if (nom.length > LONGUEUR_MAX_NOM_ENTREPOT) {
    afficherMessage(
      'erreur-parametres-nom',
      `Le nom ne doit pas dépasser ${LONGUEUR_MAX_NOM_ENTREPOT} caractères.`
    );
    return;
  }
  champ.value = nom;
  if (nom === contexte.entrepot.nomEntrepot) {
    afficherMessage('info-parametres-nom', 'C’est déjà le nom de l’entrepôt.');
    return;
  }
  // Pas d'attente : l'écran se met à jour dès l'enregistrement sur
  // l'appareil, même sans Internet. Un refus du serveur est signalé.
  const { db, uid } = contexte;
  modifierNomEntrepot(db, uid, nom).catch((erreur) =>
    signalerRefus('erreur-parametres-nom', 'info-parametres-nom', 'Le nouveau nom', erreur));
  afficherMessage('info-parametres-nom', `Nom enregistré : « ${nom} ».`);
}

// Signale un refus du serveur, sur cet écran s'il est encore ouvert, sinon
// sur l'écran des produits.
function signalerRefus(idErreur, idInfo, action, erreur) {
  console.error(erreur);
  const texte = `${action} n’a pas été enregistré par le serveur. ` + messageErreur(erreur);
  if (vueActuelle() === 'vue-parametres') {
    element(idInfo).hidden = true;
    afficherMessage(idErreur, texte);
  } else {
    afficherMessage('erreur-accueil', texte);
  }
}

// ---------- Ouverture ----------

function ouvrirParametres() {
  if (!contexte) {
    return;
  }
  element('parametres-nom').value = contexte.entrepot.nomEntrepot;
  element('parametres-devise').value = contexte.entrepot.devise;
  afficherVue('vue-parametres');
  verifierDevise();
}

// ---------- Branchement ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranParametres() {
  const liste = element('parametres-devise');
  for (const devise of DEVISES) {
    const option = document.createElement('option');
    option.value = devise.code;
    option.textContent = devise.nom;
    liste.append(option);
  }
  element('parametres-nom').maxLength = LONGUEUR_MAX_NOM_ENTREPOT;

  element('bouton-parametres').addEventListener('click', ouvrirParametres);
  element('bouton-retour-parametres').addEventListener('click', () => afficherVue('vue-accueil'));
  element('formulaire-nom-entrepot').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrerNom();
  });
  element('formulaire-devise').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrerDevise();
  });
  element('bouton-verifier-devise').addEventListener('click', verifierDeNouveau);

  // Dès qu'un champ est modifié, les anciens messages disparaissent.
  element('parametres-nom').addEventListener('input', () => {
    element('erreur-parametres-nom').hidden = true;
    element('info-parametres-nom').hidden = true;
  });
  liste.addEventListener('change', () => {
    element('erreur-parametres-devise').hidden = true;
    element('info-parametres-devise').hidden = true;
  });
}

// À appeler quand l'entrepôt du compte connecté est connu (ou a changé).
export function demarrerEcranParametres(db, uid, entrepot) {
  if (contexte && contexte.uid !== uid) {
    arreterEcranParametres();
  }
  contexte = { db, uid, entrepot };
}

// À appeler à la déconnexion.
export function arreterEcranParametres() {
  contexte = null;
  numeroVerification += 1;
  deviseModifiable = false;
  changementEnCours = false;
  element('parametres-nom').value = '';
  element('parametres-devise-etat').textContent = '';
  element('parametres-devise').disabled = true;
  element('bouton-enregistrer-devise').hidden = true;
  element('bouton-verifier-devise').hidden = true;
}
