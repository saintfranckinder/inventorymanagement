// Écrans du carnet de clients (phase 6c, décisions 72 et 73) : liste avec
// recherche (nom ou notes), boutons « Appeler », « WhatsApp » et « E-mail »,
// formulaire d'ajout et de modification, suppression définitive.
//
// Copie de js/ecran-fournisseurs.js, sans « produits fournis » : le code des
// fournisseurs n'est pas modifié. Pas de case VIP (décision 72) : « VIP »
// peut s'écrire dans les notes, et la recherche porte aussi sur les notes.
//
// La liste n'est écoutée que pendant que ces écrans sont ouverts : l'écoute
// démarre à l'ouverture et s'arrête au retour à l'écran des produits.

import {
  LIMITES_CLIENT,
  ajouterClient,
  modifierClient,
  nouvelIdClient,
  supprimerClient,
  surveillerClients
} from './clients.js';
import { CARACTERES_TELEPHONE, FORME_EMAIL } from './fournisseurs.js';
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
  { cle: 'nom', id: 'client-nom', libelle: 'Nom' },
  { cle: 'telephone', id: 'client-telephone', libelle: 'Téléphone' },
  { cle: 'whatsapp', id: 'client-whatsapp', libelle: 'WhatsApp' },
  { cle: 'email', id: 'client-email', libelle: 'E-mail' },
  { cle: 'adresse', id: 'client-adresse', libelle: 'Adresse' },
  { cle: 'notes', id: 'client-notes', libelle: 'Notes' }
];

const VUES_CLIENTS = ['vue-clients', 'vue-client'];

let contexte = null;            // { db, uid }
let arreterEcoute = null;
let clients = [];               // triés par nom
let listeRecue = false;         // une réponse de l'écoute est arrivée
let listeDuServeur = false;     // la dernière réponse vient du serveur
let idClientEnCours = null;

// ---------- Liens de contact (comme la décision 53) ----------

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

function carteClient(client) {
  const carte = document.createElement('li');
  carte.className = 'produit fournisseur';
  carte.dataset.client = client.id;

  const titre = document.createElement('h4');
  titre.textContent = client.nom;
  carte.append(titre);

  const appel = client.telephone ? numeroPourAppel(client.telephone) : null;
  const whatsapp = client.whatsapp ? numeroPourWhatsApp(client.whatsapp) : null;
  const email = client.email && FORME_EMAIL.test(client.email) ? client.email : null;

  if (client.telephone) {
    carte.append(ligneDetail('Téléphone', client.telephone));
  }
  if (client.whatsapp) {
    carte.append(ligneDetail('WhatsApp', client.whatsapp));
    if (!whatsapp) {
      const aide = document.createElement('p');
      aide.className = 'aide';
      aide.textContent = 'Pour afficher le bouton WhatsApp, ajoutez l’indicatif du pays au début du numéro (par exemple +509).';
      carte.append(aide);
    }
  }
  if (client.email) {
    carte.append(ligneDetail('E-mail', client.email));
  }
  if (client.adresse) {
    carte.append(ligneDetail('Adresse', client.adresse));
  }
  if (client.notes) {
    carte.append(ligneDetail('Notes', client.notes));
  }
  if (client.enAttente) {
    const attente = document.createElement('p');
    attente.className = 'produit-attente';
    attente.textContent = 'En attente de synchronisation';
    carte.append(attente);
  }

  if (appel || whatsapp || email) {
    const liens = document.createElement('div');
    liens.className = 'liens-contact';
    if (appel) {
      liens.append(lienContact('Appeler', 'tel:' + appel, `Appeler ${client.nom}`, false));
    }
    if (whatsapp) {
      liens.append(lienContact(
        'WhatsApp', 'https://wa.me/' + whatsapp, `Écrire sur WhatsApp à ${client.nom}`, true
      ));
    }
    if (email) {
      liens.append(lienContact('E-mail', 'mailto:' + email, `Envoyer un e-mail à ${client.nom}`, false));
    }
    carte.append(liens);
  }

  const modifier = document.createElement('button');
  modifier.type = 'button';
  modifier.className = 'bouton bouton-secondaire';
  modifier.dataset.action = 'modifier';
  modifier.textContent = 'Modifier';
  modifier.setAttribute('aria-label', `Modifier : ${client.nom}`);
  modifier.addEventListener('click', () => ouvrirFormulaire(client.id));
  carte.append(modifier);

  return carte;
}

function afficherListe() {
  const liste = element('liste-clients');

  // Bouton qui a le focus clavier, pour le lui rendre après reconstruction.
  const actif = document.activeElement;
  const carteActive = actif && liste.contains(actif) ? actif.closest('li[data-client]') : null;
  const idActif = carteActive ? carteActive.dataset.client : null;
  const actionActive = carteActive ? actif.dataset.action || null : null;

  liste.textContent = '';
  const chargement = !listeRecue || (clients.length === 0 && !listeDuServeur);
  element('clients-chargement').hidden = !chargement;
  element('clients-vide').hidden = chargement || clients.length > 0;
  element('bloc-recherche-client').hidden = clients.length === 0;

  // Recherche dans la liste déjà chargée (nom ou notes) : aucune lecture de plus.
  const saisie = element('recherche-client').value;
  const recherche = normaliserPourRecherche(saisie);
  const visibles = recherche
    ? clients.filter((client) =>
      normaliserPourRecherche(client.nom).includes(recherche) ||
      normaliserPourRecherche(client.notes || '').includes(recherche))
    : clients;

  const aucun = element('recherche-client-aucun');
  aucun.hidden = clients.length === 0 || visibles.length > 0;
  aucun.textContent = aucun.hidden ? '' : `Aucun client ne correspond à « ${saisie.trim()} ».`;

  for (const client of visibles) {
    liste.append(carteClient(client));
  }

  if (idActif && actionActive) {
    const bouton = liste.querySelector(
      `li[data-client="${CSS.escape(idActif)}"] [data-action="${actionActive}"]`
    );
    if (bouton) {
      bouton.focus({ preventScroll: true });
    }
  }
}

function surClients(etat) {
  signalerEcoute('clients', etat.depuisCache, etat.clients.some((client) => client.enAttente));
  clients = etat.clients.slice().sort((a, b) => COMPARATEUR.compare(a.nom, b.nom));
  listeRecue = true;
  listeDuServeur = !etat.depuisCache;
  afficherListe();

  // Client ouvert dans le formulaire et supprimé ailleurs : retour à la liste.
  if (vueActuelle() === 'vue-client' && idClientEnCours !== null &&
      !clients.some((client) => client.id === idClientEnCours)) {
    idClientEnCours = null;
    afficherVue('vue-clients');
    afficherMessage(
      'erreur-clients',
      'Ce client a été supprimé, peut-être depuis un autre appareil.'
    );
  }
}

function surErreurClients(erreur) {
  console.error(erreur);
  arreterEcoute = null;
  oublierEcoute('clients');
  element('clients-chargement').hidden = true;
  afficherMessage(
    'erreur-clients',
    'Impossible de charger les clients. ' + messageErreur(erreur) +
    ' Si le problème continue, les règles de sécurité (version 8) ne sont peut-être ' +
    'pas encore publiées dans la console Firebase.'
  );
}

function demarrerEcoute() {
  if (!contexte || arreterEcoute) {
    return;
  }
  listeRecue = false;
  listeDuServeur = false;
  arreterEcoute = surveillerClients(contexte.db, contexte.uid, surClients, surErreurClients);
}

function arreterLEcoute() {
  if (arreterEcoute) {
    arreterEcoute();
    arreterEcoute = null;
  }
  oublierEcoute('clients');
  clients = [];
  listeRecue = false;
  listeDuServeur = false;
  idClientEnCours = null;
  element('liste-clients').textContent = '';
  element('recherche-client').value = '';
}

function ouvrirListe() {
  if (!contexte) {
    return;
  }
  afficherVue('vue-clients');
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
  afficherMessage(VUES_CLIENTS.includes(vueActuelle()) ? 'erreur-clients' : 'erreur-accueil', message);
}

// ---------- Formulaire ----------

function clientEnCours() {
  return clients.find((client) => client.id === idClientEnCours) || null;
}

function ouvrirFormulaire(idClient) {
  idClientEnCours = idClient;
  const client = clientEnCours();
  const modification = client !== null;
  if (idClient !== null && !modification) {
    return;
  }
  element('client-titre').textContent = modification ? 'Modifier le client' : 'Ajouter un client';
  for (const champ of CHAMPS) {
    element(champ.id).value = modification ? client[champ.cle] || '' : '';
  }
  element('bouton-supprimer-client').hidden = !modification;
  afficherVue('vue-client');
}

function fermerFormulaire() {
  idClientEnCours = null;
  afficherVue('vue-clients');
}

// Lit et contrôle le formulaire (limites des décisions 54 et 72). Renvoie
// { ok: true, fiche } ou { ok: false, message, idChamp }.
function lireFiche() {
  const fiche = {};
  for (const champ of CHAMPS) {
    fiche[champ.cle] = element(champ.id).value.trim();
  }
  const erreur = (idChamp, message) => ({ ok: false, idChamp, message });

  if (!fiche.nom) {
    return erreur('client-nom', 'Donnez un nom au client.');
  }
  for (const champ of CHAMPS) {
    const limite = LIMITES_CLIENT[champ.cle];
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
    return erreur('client-email', 'E-mail : l’adresse ne semble pas valide (exemple : nom@exemple.com).');
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
    afficherMessage('erreur-client', lecture.message);
    element(lecture.idChamp).focus();
    return;
  }
  const { fiche } = lecture;

  // Noms en double : autorisés, après avertissement (comme la décision 51).
  const homonyme = clients.find((client) =>
    client.id !== idClientEnCours && COMPARATEUR.compare(client.nom, fiche.nom) === 0);
  if (homonyme && !window.confirm(
    `Un client porte déjà ce nom : « ${homonyme.nom} ».\n\nEnregistrer quand même ?`
  )) {
    return;
  }

  // Pas d'attente : la liste se met à jour dès l'enregistrement sur
  // l'appareil, même sans Internet. Un refus du serveur est signalé.
  const { db, uid } = contexte;
  let information;
  if (idClientEnCours === null) {
    ajouterClient(db, uid, nouvelIdClient(db, uid), fiche).catch((erreur) =>
      signalerRefus(`L’ajout de « ${fiche.nom} » n’a pas été enregistré par le serveur.`, erreur));
    information = `Client ajouté : « ${fiche.nom} ».`;
  } else {
    modifierClient(db, uid, idClientEnCours, fiche).catch((erreur) =>
      signalerRefus(`La modification de « ${fiche.nom} » n’a pas été enregistrée par le serveur.`, erreur));
    information = `Modifications enregistrées : « ${fiche.nom} ».`;
  }
  fermerFormulaire();
  afficherMessage('info-clients', information);
}

function supprimer() {
  const client = clientEnCours();
  if (!client || !contexte) {
    return;
  }
  const question = `Supprimer « ${client.nom} » ?\n\n` +
    'Ses coordonnées seront effacées définitivement. Cette action ne peut pas être annulée.';
  if (!window.confirm(question)) {
    return;
  }
  supprimerClient(contexte.db, contexte.uid, client.id).catch((erreur) =>
    signalerRefus(`La suppression de « ${client.nom} » n’a pas été enregistrée par le serveur.`, erreur));
  fermerFormulaire();
  afficherMessage('info-clients', `Client supprimé : « ${client.nom} ».`);
}

// ---------- Branchement ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranClients() {
  for (const champ of CHAMPS) {
    element(champ.id).maxLength = LIMITES_CLIENT[champ.cle];
  }

  element('bouton-clients').addEventListener('click', ouvrirListe);
  element('bouton-retour-clients').addEventListener('click', retourAuxProduits);
  element('bouton-ajouter-client').addEventListener('click', () => ouvrirFormulaire(null));
  element('recherche-client').addEventListener('input', () => {
    if (contexte) {
      afficherListe();
    }
  });

  element('formulaire-client').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrer();
  });
  element('bouton-annuler-client').addEventListener('click', fermerFormulaire);
  element('bouton-supprimer-client').addEventListener('click', supprimer);
  // Dès qu'un champ est corrigé, l'ancien message d'erreur disparaît.
  element('formulaire-client').addEventListener('input', () => {
    element('erreur-client').hidden = true;
  });
}

// Quitter le carnet par la barre de navigation ou par ⚙ (décision 74) :
// l'écoute de la liste s'arrête, comme avec « Retour aux produits ».
export function quitterEcranClients() {
  arreterLEcoute();
}

// À appeler quand l'entrepôt du compte connecté est connu.
export function demarrerEcranClients(db, uid) {
  if (contexte && contexte.uid === uid) {
    return;
  }
  arreterEcranClients();
  contexte = { db, uid };
}

// À appeler à la déconnexion.
export function arreterEcranClients() {
  arreterLEcoute();
  contexte = null;
  element('clients-chargement').hidden = true;
  element('clients-vide').hidden = true;
  element('bloc-recherche-client').hidden = true;
  element('recherche-client-aucun').hidden = true;
}
