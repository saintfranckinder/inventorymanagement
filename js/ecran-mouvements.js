// Écrans des mouvements de stock : formulaire d'entrée / sortie / ajustement,
// historique (50 derniers, puis « Voir plus ») et liste des opérations
// refusées par le serveur.

import { afficherMessage, afficherVue, effacerMessages, element, vueActuelle } from './interface.js';
import {
  LIBELLES_TYPE,
  LONGUEUR_MAX_MOTIF,
  TAILLE_PAGE_HISTORIQUE,
  chargerMouvementsSuivants,
  enregistrerMouvement,
  nouvelIdMouvement,
  surveillerDerniersMouvements
} from './mouvements.js';
import {
  DECIMALES_QUANTITE,
  analyserQuantite,
  formaterQuantite,
  messageNombreRefuse
} from './nombres.js';
import {
  operationsRefusees,
  oublierOperation,
  suivreOperation,
  surChangementDesOperations,
  verifierOperationsAuDemarrage
} from './operations-en-attente.js';
import { messageErreur } from './messages-erreur.js';

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Au-delà de cet écart entre l'heure de l'opération et l'heure de réception
// par le serveur, l'historique affiche les deux.
const ECART_SYNCHRONISATION_MS = 5 * 60 * 1000;

let contexte = null;             // { db, uid }
let produitDuFormulaire = null;  // { id, nom, unite, quantiteMilliemes }
let arreterEcoute = null;

// Tous les mouvements déjà vus pendant cette session (les 50 derniers écoutés
// en direct, plus ceux chargés par « Voir plus »).
const mouvementsConnus = new Map();
let idsEnDirect = new Map();     // id -> enAttente, pour le dernier état écouté
let pagesChargees = false;
let peutEtreDAutres = false;
let historiquePartiel = false;

// ---------- Textes partagés ----------

// +2,5 ou -2,5 : le signe est toujours affiché.
export function formaterVariation(deltaMilliemes) {
  return (deltaMilliemes > 0 ? '+' : '') + formaterQuantite(deltaMilliemes);
}

function libelleMouvement(type, deltaMilliemes, unite, nomProduit) {
  return `${LIBELLES_TYPE[type]} ${formaterVariation(deltaMilliemes)} ${unite} — ${nomProduit}`;
}

// Affiche le résultat d'une opération suivie (voir operations-en-attente.js).
// Un refus s'affiche dans le bloc « Opérations refusées », mis à jour à part.
export function signalerResultatOperation(resultat, libelle) {
  if (resultat === 'deja-enregistree') {
    afficherMessage(
      'info-accueil',
      `Cette opération était déjà enregistrée : ${libelle}. Rien n’a été compté deux fois.`
    );
  }
}

// ---------- Opérations refusées ----------

function afficherOperationsRefusees() {
  const bloc = element('operations-refusees');
  const liste = element('liste-operations-refusees');
  liste.textContent = '';
  const refusees = contexte ? operationsRefusees(contexte.uid) : [];
  bloc.hidden = refusees.length === 0;

  for (const operation of refusees) {
    const ligne = document.createElement('li');
    ligne.className = 'operation-refusee';

    const texte = document.createElement('p');
    texte.textContent = operation.libelle;
    const date = document.createElement('p');
    date.className = 'aide';
    date.textContent = 'Faite le ' + FORMAT_DATE.format(new Date(operation.dateAppareil));

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'bouton bouton-secondaire';
    bouton.textContent = 'J’ai noté';
    bouton.setAttribute('aria-label', `J’ai noté : ${operation.libelle}`);
    bouton.addEventListener('click', () => oublierOperation(contexte.uid, operation.id));

    ligne.append(texte, date, bouton);
    liste.append(ligne);
  }
}

// ---------- Formulaire de mouvement ----------

function typeChoisi() {
  const coche = document.querySelector('input[name="mouvement-type"]:checked');
  return coche ? coche.value : 'entree';
}

// Lit le formulaire. Renvoie { ok: true, deltaMilliemes, type } ou
// { ok: false, message }.
function lireVariation() {
  const type = typeChoisi();
  const texte = element('mouvement-quantite').value;

  if (type === 'ajustement') {
    const resultat = analyserQuantite(texte, true);
    if (!resultat.ok) {
      return { ok: false, message: messageNombreRefuse(resultat, 'Correction', DECIMALES_QUANTITE) };
    }
    if (resultat.valeur === 0) {
      return { ok: false, message: 'Correction : la valeur ne peut pas être 0. Exemples : -2,5 ou +3.' };
    }
    return { ok: true, type, deltaMilliemes: resultat.valeur };
  }

  const resultat = analyserQuantite(texte, false);
  if (!resultat.ok) {
    const message = resultat.raison === 'negatif'
      ? 'Quantité : saisissez un nombre sans signe. Le type choisi indique déjà le sens.'
      : messageNombreRefuse(resultat, 'Quantité', DECIMALES_QUANTITE);
    return { ok: false, message };
  }
  if (resultat.valeur === 0) {
    return { ok: false, message: 'Quantité : la valeur doit être supérieure à 0.' };
  }
  return {
    ok: true,
    type,
    deltaMilliemes: type === 'sortie' ? -resultat.valeur : resultat.valeur
  };
}

// Met à jour le texte d'aide : valeur comprise et stock estimé après l'opération.
function mettreAJourApercu() {
  if (!produitDuFormulaire) {
    return;
  }
  const type = typeChoisi();
  element('mouvement-libelle-quantite').textContent =
    type === 'ajustement' ? 'Correction (avec son signe)' : 'Quantité';
  element('mouvement-exemple').textContent = type === 'ajustement'
    ? 'Exemples : -2,5 pour retirer, +3 pour ajouter.'
    : 'Exemples : 10 ou 2,5.';

  const apercu = element('mouvement-apercu');
  const alerte = element('mouvement-alerte-negatif');
  alerte.hidden = true;

  if (element('mouvement-quantite').value.trim() === '') {
    apercu.textContent = '';
    return;
  }
  const variation = lireVariation();
  if (!variation.ok) {
    apercu.textContent = variation.message;
    return;
  }
  const apres = produitDuFormulaire.quantiteMilliemes + variation.deltaMilliemes;
  apercu.textContent =
    `Valeur comprise : ${formaterVariation(variation.deltaMilliemes)} ${produitDuFormulaire.unite}. ` +
    `Stock après l’opération : ${formaterQuantite(apres)} ${produitDuFormulaire.unite} ` +
    '(estimation d’après ce que cet appareil connaît).';
  if (apres < 0) {
    alerte.textContent = 'Attention : le stock deviendra négatif.';
    alerte.hidden = false;
  }
}

function afficherProduitDuFormulaire() {
  element('mouvement-produit').textContent = produitDuFormulaire.nom;
  element('mouvement-stock').textContent =
    `${formaterQuantite(produitDuFormulaire.quantiteMilliemes)} ${produitDuFormulaire.unite}`;
}

// Ouvre le formulaire pour un produit de la liste.
export function ouvrirFormulaireMouvement(produit) {
  produitDuFormulaire = {
    id: produit.id,
    nom: produit.nom,
    unite: produit.unite,
    quantiteMilliemes: produit.quantiteMilliemes
  };
  element('mouvement-type-entree').checked = true;
  element('mouvement-quantite').value = '';
  element('mouvement-motif').value = '';
  afficherVue('vue-mouvement');
  effacerMessages();
  afficherProduitDuFormulaire();
  mettreAJourApercu();
}

// Appelé à chaque mise à jour de la liste des produits : le stock affiché
// dans le formulaire ouvert reste à jour.
export function mettreAJourProduitDuFormulaire(produits) {
  if (!produitDuFormulaire || vueActuelle() !== 'vue-mouvement') {
    return;
  }
  const produit = produits.find((element_) => element_.id === produitDuFormulaire.id);
  if (produit) {
    produitDuFormulaire.nom = produit.nom;
    produitDuFormulaire.unite = produit.unite;
    produitDuFormulaire.quantiteMilliemes = produit.quantiteMilliemes;
    afficherProduitDuFormulaire();
    mettreAJourApercu();
  }
}

function fermerFormulaireMouvement() {
  produitDuFormulaire = null;
  afficherVue('vue-accueil');
}

function enregistrerLeMouvement() {
  effacerMessages();
  const variation = lireVariation();
  if (!variation.ok) {
    afficherMessage('erreur-mouvement', variation.message);
    return;
  }
  const motif = element('mouvement-motif').value.trim();
  if (motif.length > LONGUEUR_MAX_MOTIF) {
    afficherMessage('erreur-mouvement', `Le motif ne doit pas dépasser ${LONGUEUR_MAX_MOTIF} caractères.`);
    return;
  }

  // L'identifiant et l'heure sont fixés une seule fois, avant l'envoi.
  const mouvement = {
    idMouvement: nouvelIdMouvement(contexte.db, contexte.uid),
    idProduit: produitDuFormulaire.id,
    nomProduit: produitDuFormulaire.nom,
    unite: produitDuFormulaire.unite,
    deltaMilliemes: variation.deltaMilliemes,
    type: variation.type,
    motif,
    dateAppareil: new Date()
  };
  const libelle = libelleMouvement(
    mouvement.type, mouvement.deltaMilliemes, mouvement.unite, mouvement.nomProduit
  );

  // Pas d'attente : le stock et l'historique se mettent à jour dès
  // l'enregistrement local, même sans Internet.
  suivreOperation(
    contexte.db,
    contexte.uid,
    {
      id: mouvement.idMouvement,
      chemin: ['users', contexte.uid, 'movements', mouvement.idMouvement],
      libelle,
      dateAppareil: mouvement.dateAppareil
    },
    enregistrerMouvement(contexte.db, contexte.uid, mouvement),
    (resultat) => signalerResultatOperation(resultat, libelle)
  );
  fermerFormulaireMouvement();
}

// ---------- Historique ----------

function mouvementsTries() {
  return [...mouvementsConnus.values()].sort((a, b) => {
    // Les mouvements pas encore confirmés en premier, puis du plus récent au
    // plus ancien selon l'heure du serveur.
    if (a.dateServeur === null || b.dateServeur === null) {
      if (a.dateServeur === null && b.dateServeur === null) {
        return b.dateAppareil - a.dateAppareil;
      }
      return a.dateServeur === null ? -1 : 1;
    }
    return b.dateServeur - a.dateServeur;
  });
}

function paragraphe(classe, texte) {
  const ligne = document.createElement('p');
  if (classe) {
    ligne.className = classe;
  }
  ligne.textContent = texte;
  return ligne;
}

function afficherHistorique() {
  const liste = element('liste-historique');
  liste.textContent = '';
  const mouvements = mouvementsTries();
  element('historique-vide').hidden = mouvements.length > 0;

  for (const mouvement of mouvements) {
    const article = document.createElement('li');
    article.className = 'mouvement';

    const titre = document.createElement('h4');
    titre.textContent = mouvement.nomProduit;
    article.append(titre);

    article.append(paragraphe(
      'mouvement-variation',
      `${LIBELLES_TYPE[mouvement.type] || mouvement.type} : ` +
      `${formaterVariation(mouvement.deltaMilliemes)} ${mouvement.unite}`
    ));

    // Heure de l'opération (appareil) et heure de réception (serveur) ne
    // sont jamais confondues.
    if (mouvement.dateAppareil) {
      article.append(paragraphe('', 'Fait le ' + FORMAT_DATE.format(mouvement.dateAppareil)));
    }
    if (mouvement.enAttente || mouvement.dateServeur === null) {
      article.append(paragraphe('produit-attente', 'En attente de synchronisation'));
    } else if (mouvement.dateAppareil &&
        Math.abs(mouvement.dateServeur - mouvement.dateAppareil) > ECART_SYNCHRONISATION_MS) {
      article.append(paragraphe(
        'aide',
        'Reçu par le serveur le ' + FORMAT_DATE.format(mouvement.dateServeur)
      ));
    }
    if (mouvement.motif) {
      article.append(paragraphe('', 'Motif : ' + mouvement.motif));
    }

    liste.append(article);
  }

  element('bouton-voir-plus').hidden = !peutEtreDAutres;
  element('historique-partiel').hidden = !historiquePartiel;
}

function surMouvements(etat) {
  // Un mouvement qui était « en attente » et qui a disparu de l'écoute a été
  // refusé par le serveur : il sort de l'historique.
  const nouveauxIds = new Map(etat.mouvements.map((mouvement) => [mouvement.id, mouvement.enAttente]));
  for (const [id, etaitEnAttente] of idsEnDirect) {
    if (etaitEnAttente && !nouveauxIds.has(id)) {
      mouvementsConnus.delete(id);
    }
  }
  idsEnDirect = nouveauxIds;

  for (const mouvement of etat.mouvements) {
    mouvementsConnus.set(mouvement.id, mouvement);
  }
  if (!pagesChargees) {
    peutEtreDAutres = etat.mouvements.length >= TAILLE_PAGE_HISTORIQUE;
  }
  afficherHistorique();
}

function surErreurMouvements(erreur) {
  console.error(erreur);
  afficherMessage(
    'erreur-historique',
    'Impossible de charger l’historique. ' + messageErreur(erreur) + ' Rechargez la page.'
  );
}

async function voirPlus() {
  // Le plus ancien mouvement confirmé sert de point de départ.
  const confirmes = mouvementsTries().filter((mouvement) => mouvement.dateServeur !== null);
  const plusAncien = confirmes[confirmes.length - 1];
  if (!plusAncien) {
    return;
  }
  const bouton = element('bouton-voir-plus');
  bouton.disabled = true;
  try {
    const page = await chargerMouvementsSuivants(contexte.db, contexte.uid, plusAncien.document);
    pagesChargees = true;
    for (const mouvement of page.mouvements) {
      mouvementsConnus.set(mouvement.id, mouvement);
    }
    peutEtreDAutres = page.mouvements.length >= TAILLE_PAGE_HISTORIQUE;
    historiquePartiel = page.depuisCache;
    afficherHistorique();
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('erreur-historique', 'Impossible de charger la suite. ' + messageErreur(erreur));
  } finally {
    bouton.disabled = false;
  }
}

// ---------- Branchement ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranMouvements() {
  element('mouvement-motif').maxLength = LONGUEUR_MAX_MOTIF;

  element('formulaire-mouvement').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrerLeMouvement();
  });
  element('formulaire-mouvement').addEventListener('input', () => {
    element('erreur-mouvement').hidden = true;
    mettreAJourApercu();
  });
  element('bouton-annuler-mouvement').addEventListener('click', fermerFormulaireMouvement);

  element('bouton-historique').addEventListener('click', () => afficherVue('vue-historique'));
  element('bouton-retour-historique').addEventListener('click', () => afficherVue('vue-accueil'));
  element('bouton-voir-plus').addEventListener('click', voirPlus);

  surChangementDesOperations(afficherOperationsRefusees);
}

// À appeler quand l'entrepôt du compte connecté est connu.
export function demarrerEcranMouvements(db, uid) {
  if (contexte && contexte.uid === uid) {
    return;
  }
  arreterEcranMouvements();
  contexte = { db, uid };
  arreterEcoute = surveillerDerniersMouvements(db, uid, surMouvements, surErreurMouvements);
  afficherOperationsRefusees();
  verifierOperationsAuDemarrage(db, uid);
}

// À appeler à la déconnexion.
export function arreterEcranMouvements() {
  if (arreterEcoute) {
    arreterEcoute();
    arreterEcoute = null;
  }
  contexte = null;
  produitDuFormulaire = null;
  mouvementsConnus.clear();
  idsEnDirect = new Map();
  pagesChargees = false;
  peutEtreDAutres = false;
  historiquePartiel = false;
  element('liste-historique').textContent = '';
  element('historique-vide').hidden = true;
  element('bouton-voir-plus').hidden = true;
  element('historique-partiel').hidden = true;
  afficherOperationsRefusees();
}
