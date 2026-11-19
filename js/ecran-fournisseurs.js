// Écrans du carnet de fournisseurs (phase 6b, décisions 42 et 50 à 54) :
// liste avec recherche, boutons « Appeler », « WhatsApp » et « E-mail »,
// formulaire d'ajout et de modification, suppression définitive.
//
// La liste n'est écoutée que pendant que ces écrans sont ouverts
// (décision 52) : l'écoute démarre à l'ouverture et s'arrête au retour à
// l'écran des produits.

import {
  CARACTERES_TELEPHONE,
  FORME_EMAIL,
  LIMITES_FOURNISSEUR,
  ajouterFournisseur,
  modifierFournisseur,
  nouvelIdFournisseur,
  supprimerFournisseur,
  surveillerFournisseurs
} from './fournisseurs.js';
import {
  afficherMessage,
  afficherVue,
  effacerMessages,
  element,
  normaliserPourRecherche,
  vueActuelle
} from './interface.js';
import { oublierEcoute, signalerEcoute } from './indicateur-synchro.js';
import { messageErreur } from './messages-erreur.js';

// Compare les noms sans tenir compte des majuscules ni des accents.
const COMPARATEUR = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

// « 1 000 » plutôt que « 1000 » dans les messages.
const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');

// Champs du formulaire : identifiant du champ et libellé dans les messages.
const CHAMPS = [
  { cle: 'nom', id: 'fournisseur-nom', libelle: 'Nom' },
  { cle: 'telephone', id: 'fournisseur-telephone', libelle: 'Téléphone' },
  { cle: 'whatsapp', id: 'fournisseur-whatsapp', libelle: 'WhatsApp' },
  { cle: 'email', id: 'fournisseur-email', libelle: 'E-mail' },
  { cle: 'adresse', id: 'fournisseur-adresse', libelle: 'Adresse' },
  { cle: 'produitsFournis', id: 'fournisseur-produits', libelle: 'Produits fournis' },
  { cle: 'notes', id: 'fournisseur-notes', libelle: 'Notes' }
];

const VUES_FOURNISSEURS = ['vue-fournisseurs', 'vue-fournisseur'];

let contexte = null;            // { db, uid }
let arreterEcoute = null;
let fournisseurs = [];          // triés par nom
let listeRecue = false;         // une réponse de l'écoute est arrivée
let listeDuServeur = false;     // la dernière réponse vient du serveur
let idFournisseurEnCours = null;

// ---------- Liens de contact (décision 53) ----------

// Numéro pour un lien « tel: » : les chiffres, avec le « + » éventuel.
function numeroPourAppel(numero) {
  const chiffres = numero.replace(/[^0-9]/g, '');
  if (chiffres.length < 3) {
    return null;
  }
  return (numero.trim().startsWith('+') ? '+' : '') + chiffres;
}

// Numéro pour WhatsApp (https://wa.me/…) : il faut l'indicatif du pays, donc
// un numéro qui commence par « + » ou « 00 ». Sinon, pas de bouton.
function numeroPourWhatsApp(numero) {
  const texte = numero.trim();
  let chiffres = texte.replace(/[^0-9]/g, '');
  if (texte.startsWith('00')) {
    chiffres = chiffres.slice(2);
  } else if (!texte.startsWith('+')) {
    return null;
  }
  return chiffres.length >= 8 ? chiffres : null;
}

function lienContact(texte, adresse, etiquette, nouvelOnglet) {
  const lien = document.createElement('a');
  lien.className = 'bouton bouton-secondaire';
  lien.href = adresse;
  lien.textContent = texte;
  lien.setAttribute('aria-label', etiquette);
  if (nouvelOnglet) {
    lien.target = '_blank';
    lien.rel = 'noopener noreferrer';
  }
  return lien;
}

// ---------- Liste ----------

function ligneDetail(libelle, valeur) {
  const ligne = document.createElement('p');
  ligne.className = 'produit-detail';
  ligne.textContent = `${libelle} : ${valeur}`;
  return ligne;
}

function carteFournisseur(fournisseur) {
  const carte = document.createElement('li');
  carte.className = 'produit fournisseur';
  carte.dataset.fournisseur = fournisseur.id;

  const titre = document.createElement('h4');
  titre.textContent = fournisseur.nom;
  carte.append(titre);

  const appel = fournisseur.telephone ? numeroPourAppel(fournisseur.telephone) : null;
  const whatsapp = fournisseur.whatsapp ? numeroPourWhatsApp(fournisseur.whatsapp) : null;
  const email = fournisseur.email && FORME_EMAIL.test(fournisseur.email) ? fournisseur.email : null;

  if (fournisseur.telephone) {
    carte.append(ligneDetail('Téléphone', fournisseur.telephone));
  }
  if (fournisseur.whatsapp) {
    carte.append(ligneDetail('WhatsApp', fournisseur.whatsapp));
    if (!whatsapp) {
      const aide = document.createElement('p');
      aide.className = 'aide';
      aide.textContent = 'Pour afficher le bouton WhatsApp, ajoutez l’indicatif du pays au début du numéro (par exemple +509).';
      carte.append(aide);
    }
  }
  if (fournisseur.email) {
    carte.append(ligneDetail('E-mail', fournisseur.email));
  }
  if (fournisseur.adresse) {
    carte.append(ligneDetail('Adresse', fournisseur.adresse));
  }
  if (fournisseur.produitsFournis) {
    carte.append(ligneDetail('Produits fournis', fournisseur.produitsFournis));
  }
  if (fournisseur.notes) {
    carte.append(ligneDetail('Notes', fournisseur.notes));
  }
  if (fournisseur.enAttente) {
    const attente = document.createElement('p');
    attente.className = 'produit-attente';
    attente.textContent = 'En attente de synchronisation';
    carte.append(attente);
  }

  if (appel || whatsapp || email) {
    const liens = document.createElement('div');
    liens.className = 'liens-contact';
    if (appel) {
      liens.append(lienContact('Appeler', 'tel:' + appel, `Appeler ${fournisseur.nom}`, false));
    }
    if (whatsapp) {
      liens.append(lienContact(
        'WhatsApp', 'https://wa.me/' + whatsapp, `Écrire sur WhatsApp à ${fournisseur.nom}`, true
      ));
    }
    if (email) {
      liens.append(lienContact('E-mail', 'mailto:' + email, `Envoyer un e-mail à ${fournisseur.nom}`, false));
    }
    carte.append(liens);
  }

  const modifier = document.createElement('button');
  modifier.type = 'button';
  modifier.className = 'bouton bouton-secondaire';
  modifier.dataset.action = 'modifier';
  modifier.textContent = 'Modifier';
  modifier.setAttribute('aria-label', `Modifier : ${fournisseur.nom}`);
  modifier.addEventListener('click', () => ouvrirFormulaire(fournisseur.id));
  carte.append(modifier);

  return carte;
}

function afficherListe() {
  const liste = element('liste-fournisseurs');

  // Bouton qui a le focus clavier, pour le lui rendre après reconstruction.
  const actif = document.activeElement;
  const carteActive = actif && liste.contains(actif) ? actif.closest('li[data-fournisseur]') : null;
  const idActif = carteActive ? carteActive.dataset.fournisseur : null;
  const actionActive = carteActive ? actif.dataset.action || null : null;

  liste.textContent = '';
  const chargement = !listeRecue || (fournisseurs.length === 0 && !listeDuServeur);
  element('fournisseurs-chargement').hidden = !chargement;
  element('fournisseurs-vide').hidden = chargement || fournisseurs.length > 0;
  element('bloc-recherche-fournisseur').hidden = fournisseurs.length === 0;

  // Recherche dans la liste déjà chargée : aucune lecture de plus.
  const saisie = element('recherche-fournisseur').value;
  const recherche = normaliserPourRecherche(saisie);
  const visibles = recherche
    ? fournisseurs.filter((fournisseur) =>
      normaliserPourRecherche(fournisseur.nom).includes(recherche) ||
      normaliserPourRecherche(fournisseur.produitsFournis || '').includes(recherche))
    : fournisseurs;

  const aucun = element('recherche-fournisseur-aucun');
  aucun.hidden = fournisseurs.length === 0 || visibles.length > 0;
  aucun.textContent = aucun.hidden ? '' : `Aucun fournisseur ne correspond à « ${saisie.trim()} ».`;

  for (const fournisseur of visibles) {
    liste.append(carteFournisseur(fournisseur));
  }

  if (idActif && actionActive) {
    const bouton = liste.querySelector(
      `li[data-fournisseur="${CSS.escape(idActif)}"] [data-action="${actionActive}"]`
    );
    if (bouton) {
      bouton.focus({ preventScroll: true });
    }
  }
}

function surFournisseurs(etat) {
  signalerEcoute('fournisseurs', etat.depuisCache, etat.fournisseurs.some((fournisseur) => fournisseur.enAttente));
  fournisseurs = etat.fournisseurs.slice().sort((a, b) => COMPARATEUR.compare(a.nom, b.nom));
  listeRecue = true;
  listeDuServeur = !etat.depuisCache;
  afficherListe();

  // Fournisseur ouvert dans le formulaire et supprimé ailleurs : retour à la liste.
  if (vueActuelle() === 'vue-fournisseur' && idFournisseurEnCours !== null &&
      !fournisseurs.some((fournisseur) => fournisseur.id === idFournisseurEnCours)) {
    idFournisseurEnCours = null;
    afficherVue('vue-fournisseurs');
    afficherMessage(
      'erreur-fournisseurs',
      'Ce fournisseur a été supprimé, peut-être depuis un autre appareil.'
    );
  }
}

function surErreurFournisseurs(erreur) {
  console.error(erreur);
  arreterEcoute = null;
  oublierEcoute('fournisseurs');
  element('fournisseurs-chargement').hidden = true;
  afficherMessage(
    'erreur-fournisseurs',
    'Impossible de charger les fournisseurs. ' + messageErreur(erreur) +
    ' Si le problème continue, les règles de sécurité (version 6) ne sont peut-être ' +
    'pas encore publiées dans la console Firebase.'
  );
}

function demarrerEcoute() {
  if (!contexte || arreterEcoute) {
    return;
  }
  listeRecue = false;
  listeDuServeur = false;
  arreterEcoute = surveillerFournisseurs(contexte.db, contexte.uid, surFournisseurs, surErreurFournisseurs);
}

function arreterLEcoute() {
  if (arreterEcoute) {
    arreterEcoute();
    arreterEcoute = null;
  }
  oublierEcoute('fournisseurs');
  fournisseurs = [];
  listeRecue = false;
  listeDuServeur = false;
  idFournisseurEnCours = null;
  element('liste-fournisseurs').textContent = '';
  element('recherche-fournisseur').value = '';
}

function ouvrirListe() {
  if (!contexte) {
    return;
  }
  afficherVue('vue-fournisseurs');
  demarrerEcoute();
  afficherListe();
}

function retourAuxProduits() {
  arreterLEcoute();
  afficherVue('vue-accueil');
}

// Signale un refus du serveur arrivé après la fermeture du formulaire.
function signalerRefus(texte, erreur) {
  console.error(erreur);
  const message = texte + ' ' + messageErreur(erreur);
  afficherMessage(VUES_FOURNISSEURS.includes(vueActuelle()) ? 'erreur-fournisseurs' : 'erreur-accueil', message);
}

// ---------- Formulaire ----------

function fournisseurEnCours() {
  return fournisseurs.find((fournisseur) => fournisseur.id === idFournisseurEnCours) || null;
}

function ouvrirFormulaire(idFournisseur) {
  idFournisseurEnCours = idFournisseur;
  const fournisseur = fournisseurEnCours();
  const modification = fournisseur !== null;
  if (idFournisseur !== null && !modification) {
    return;
  }
  element('fournisseur-titre').textContent = modification ? 'Modifier le fournisseur' : 'Ajouter un fournisseur';
  for (const champ of CHAMPS) {
    element(champ.id).value = modification ? fournisseur[champ.cle] || '' : '';
  }
  element('bouton-supprimer-fournisseur').hidden = !modification;
  afficherVue('vue-fournisseur');
}

function fermerFormulaire() {
  idFournisseurEnCours = null;
  afficherVue('vue-fournisseurs');
}

// Lit et contrôle le formulaire (décision 54). Renvoie { ok: true, fiche } ou
// { ok: false, message, idChamp }.
function lireFiche() {
  const fiche = {};
  for (const champ of CHAMPS) {
    fiche[champ.cle] = element(champ.id).value.trim();
  }
  const erreur = (idChamp, message) => ({ ok: false, idChamp, message });

  if (!fiche.nom) {
    return erreur('fournisseur-nom', 'Donnez un nom au fournisseur.');
  }
  for (const champ of CHAMPS) {
    const limite = LIMITES_FOURNISSEUR[champ.cle];
    if (fiche[champ.cle].length > limite) {
      return erreur(champ.id, `${champ.libelle} : ${FORMAT_NOMBRE.format(limite)} caractères au plus.`);
    }
  }
  for (const cle of ['telephone', 'whatsapp']) {
    if (!CARACTERES_TELEPHONE.test(fiche[cle])) {
      const champ = CHAMPS.find((element_) => element_.cle === cle);
      return erreur(
        champ.id,
        `${champ.libelle} : utilisez seulement des chiffres, des espaces et les signes + - ( ) .`
      );
    }
  }
  if (fiche.email && !FORME_EMAIL.test(fiche.email)) {
    return erreur('fournisseur-email', 'E-mail : l’adresse ne semble pas valide (exemple : nom@exemple.com).');
  }
  return { ok: true, fiche };
}

function enregistrer() {
  effacerMessages();
  if (!contexte) {
    return;
  }
  const lecture = lireFiche();
  if (!lecture.ok) {
    afficherMessage('erreur-fournisseur', lecture.message);
    element(lecture.idChamp).focus();
    return;
  }
  const { fiche } = lecture;

  // Noms en double : autorisés, après avertissement (décision 51).
  const homonyme = fournisseurs.find((fournisseur) =>
    fournisseur.id !== idFournisseurEnCours && COMPARATEUR.compare(fournisseur.nom, fiche.nom) === 0);
  if (homonyme && !window.confirm(
    `Un fournisseur porte déjà ce nom : « ${homonyme.nom} ».\n\nEnregistrer quand même ?`
  )) {
    return;
  }

  // Pas d'attente : la liste se met à jour dès l'enregistrement sur
  // l'appareil, même sans Internet. Un refus du serveur est signalé.
  const { db, uid } = contexte;
  let information;
  if (idFournisseurEnCours === null) {
    ajouterFournisseur(db, uid, nouvelIdFournisseur(db, uid), fiche).catch((erreur) =>
      signalerRefus(`L’ajout de « ${fiche.nom} » n’a pas été enregistré par le serveur.`, erreur));
    information = `Fournisseur ajouté : « ${fiche.nom} ».`;
  } else {
    modifierFournisseur(db, uid, idFournisseurEnCours, fiche).catch((erreur) =>
      signalerRefus(`La modification de « ${fiche.nom} » n’a pas été enregistrée par le serveur.`, erreur));
    information = `Modifications enregistrées : « ${fiche.nom} ».`;
  }
  fermerFormulaire();
  afficherMessage('info-fournisseurs', information);
}

function supprimer() {
  const fournisseur = fournisseurEnCours();
  if (!fournisseur || !contexte) {
    return;
  }
  const question = `Supprimer « ${fournisseur.nom} » ?\n\n` +
    'Ses coordonnées seront effacées définitivement. Cette action ne peut pas être annulée.';
  if (!window.confirm(question)) {
    return;
  }
  supprimerFournisseur(contexte.db, contexte.uid, fournisseur.id).catch((erreur) =>
    signalerRefus(`La suppression de « ${fournisseur.nom} » n’a pas été enregistrée par le serveur.`, erreur));
  fermerFormulaire();
  afficherMessage('info-fournisseurs', `Fournisseur supprimé : « ${fournisseur.nom} ».`);
}

// ---------- Branchement ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranFournisseurs() {
  for (const champ of CHAMPS) {
    element(champ.id).maxLength = LIMITES_FOURNISSEUR[champ.cle];
  }

  element('bouton-fournisseurs').addEventListener('click', ouvrirListe);
  element('bouton-retour-fournisseurs').addEventListener('click', retourAuxProduits);
  element('bouton-ajouter-fournisseur').addEventListener('click', () => ouvrirFormulaire(null));
  element('recherche-fournisseur').addEventListener('input', () => {
    if (contexte) {
      afficherListe();
    }
  });

  element('formulaire-fournisseur').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrer();
  });
  element('bouton-annuler-fournisseur').addEventListener('click', fermerFormulaire);
  element('bouton-supprimer-fournisseur').addEventListener('click', supprimer);
  // Dès qu'un champ est corrigé, l'ancien message d'erreur disparaît.
  element('formulaire-fournisseur').addEventListener('input', () => {
    element('erreur-fournisseur').hidden = true;
  });
}

// À appeler quand l'entrepôt du compte connecté est connu.
export function demarrerEcranFournisseurs(db, uid) {
  if (contexte && contexte.uid === uid) {
    return;
  }
  arreterEcranFournisseurs();
  contexte = { db, uid };
}

// À appeler à la déconnexion.
export function arreterEcranFournisseurs() {
  arreterLEcoute();
  contexte = null;
  element('fournisseurs-chargement').hidden = true;
  element('fournisseurs-vide').hidden = true;
  element('bloc-recherche-fournisseur').hidden = true;
  element('recherche-fournisseur-aucun').hidden = true;
}
