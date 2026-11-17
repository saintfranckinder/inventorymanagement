// Écran des produits : liste simple et formulaire d'ajout / modification.
// L'affichage est volontairement sobre : le tableau de bord complet (alertes,
// valeur du stock, boutons +1 / -1) arrive en phase 5.

import {
  formaterVariation,
  mettreAJourProduitDuFormulaire,
  ouvrirFormulaireMouvement,
  signalerResultatOperation
} from './ecran-mouvements.js';
import { afficherMessage, afficherVue, effacerMessages, element, vueActuelle } from './interface.js';
import { messageErreur } from './messages-erreur.js';
import { nouvelIdMouvement } from './mouvements.js';
import { suivreOperation } from './operations-en-attente.js';
import {
  DECIMALES_PRIX,
  DECIMALES_QUANTITE,
  analyserPrix,
  analyserQuantite,
  formaterMontant,
  formaterQuantite,
  messageNombreRefuse,
  prixPourSaisie,
  quantitePourSaisie
} from './nombres.js';
import {
  LONGUEUR_MAX_NOM_PRODUIT,
  LONGUEUR_MAX_UNITE,
  ajouterProduit,
  archiverProduit,
  modifierProduit,
  nouvelIdProduit,
  surveillerProduits
} from './produits.js';

// Compare les noms sans tenir compte des majuscules ni des accents.
const COMPARATEUR = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

let contexte = null;          // { db, uid, devise }
let produits = [];            // produits non archivés, triés par nom
let arreterEcoute = null;
let idProduitEnCours = null;  // produit en cours de modification, ou null pour un ajout

// ---------- Liste ----------

function ligneDetail(libelle, valeur) {
  const ligne = document.createElement('p');
  ligne.className = 'produit-detail';
  ligne.textContent = `${libelle} : ${valeur}`;
  return ligne;
}

function afficherListe() {
  const liste = element('liste-produits');
  liste.textContent = '';
  element('produits-vide').hidden = produits.length > 0;

  for (const produit of produits) {
    const article = document.createElement('li');
    article.className = 'produit';

    const nom = document.createElement('h4');
    nom.textContent = produit.nom;
    article.append(nom);

    article.append(
      ligneDetail('Quantité', `${formaterQuantite(produit.quantiteMilliemes)} ${produit.unite}`),
      ligneDetail('Seuil d’alerte', `${formaterQuantite(produit.seuilAlerteMilliemes)} ${produit.unite}`),
      ligneDetail('Prix d’achat', formaterMontant(produit.prixAchatCentimes, contexte.devise))
    );

    if (produit.quantiteMilliemes < 0) {
      // Signalé par un texte, pas seulement par une couleur.
      const negatif = document.createElement('p');
      negatif.className = 'produit-negatif';
      negatif.textContent = 'Stock négatif : à vérifier';
      article.append(negatif);
    }

    if (produit.enAttente) {
      const attente = document.createElement('p');
      attente.className = 'produit-attente';
      attente.textContent = 'En attente de synchronisation';
      article.append(attente);
    }

    const boutonMouvement = document.createElement('button');
    boutonMouvement.type = 'button';
    boutonMouvement.className = 'bouton bouton-principal';
    boutonMouvement.textContent = 'Mouvement de stock';
    boutonMouvement.setAttribute('aria-label', `Mouvement de stock pour ${produit.nom}`);
    boutonMouvement.addEventListener('click', () => ouvrirFormulaireMouvement(produit));
    article.append(boutonMouvement);

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'bouton bouton-secondaire';
    bouton.textContent = 'Modifier';
    bouton.setAttribute('aria-label', `Modifier ${produit.nom}`);
    bouton.addEventListener('click', () => ouvrirFormulaire(produit.id));
    article.append(bouton);

    liste.append(article);
  }
}

function surProduits(etat) {
  produits = etat.produits.slice().sort((a, b) => COMPARATEUR.compare(a.nom, b.nom));
  afficherListe();
  mettreAJourProduitDuFormulaire(produits);
  // Si le produit ouvert dans le formulaire vient d'être archivé ailleurs,
  // revenir à la liste.
  if (vueActuelle() === 'vue-produit' && idProduitEnCours !== null &&
      !produits.some((produit) => produit.id === idProduitEnCours)) {
    afficherVue('vue-accueil');
  } else if (vueActuelle() === 'vue-produit' && idProduitEnCours !== null) {
    afficherQuantiteDuFormulaire();
  }
}

function surErreurProduits(erreur) {
  console.error(erreur);
  afficherMessage(
    'erreur-accueil',
    'Impossible de charger les produits. ' + messageErreur(erreur) + ' Rechargez la page.'
  );
}

// Signale un refus du serveur arrivé après la fermeture du formulaire.
function signalerRefus(action, erreur) {
  console.error(erreur);
  afficherMessage(
    'erreur-accueil',
    `${action} n’a pas été enregistré par le serveur. ` + messageErreur(erreur)
  );
}

// ---------- Formulaire ----------

function produitEnCours() {
  return produits.find((produit) => produit.id === idProduitEnCours) || null;
}

function afficherQuantiteDuFormulaire() {
  const produit = produitEnCours();
  if (produit) {
    element('produit-quantite').textContent =
      `${formaterQuantite(produit.quantiteMilliemes)} ${produit.unite}`;
  }
}

// Affiche sous le champ la valeur comprise par l'application, ou l'erreur.
function mettreAJourAide(idChamp, idAide, analyser, afficher, sujet, decimales) {
  const texte = element(idChamp).value;
  const aide = element(idAide);
  if (texte.trim() === '') {
    aide.textContent = '';
    return;
  }
  const resultat = analyser(texte);
  aide.textContent = resultat.ok
    ? `Valeur comprise : ${afficher(resultat.valeur)}`
    : messageNombreRefuse(resultat, sujet, decimales);
}

function mettreAJourAides() {
  mettreAJourAide(
    'produit-stock', 'aide-produit-stock',
    analyserQuantite, formaterQuantite, 'Stock de départ', DECIMALES_QUANTITE
  );
  mettreAJourAide(
    'produit-seuil', 'aide-produit-seuil',
    analyserQuantite, formaterQuantite, 'Seuil d’alerte', DECIMALES_QUANTITE
  );
  mettreAJourAide(
    'produit-prix', 'aide-produit-prix',
    analyserPrix, (centimes) => formaterMontant(centimes, contexte.devise),
    'Prix d’achat', DECIMALES_PRIX
  );
}

function ouvrirFormulaire(idProduit) {
  idProduitEnCours = idProduit;
  const produit = produitEnCours();
  const modification = produit !== null;

  element('produit-titre').textContent = modification ? 'Modifier le produit' : 'Ajouter un produit';
  element('produit-nom').value = modification ? produit.nom : '';
  element('produit-unite').value = modification ? produit.unite : '';
  element('produit-seuil').value = modification ? quantitePourSaisie(produit.seuilAlerteMilliemes) : '0';
  element('produit-prix').value = modification ? prixPourSaisie(produit.prixAchatCentimes) : '0';

  element('produit-stock').value = '0';
  element('produit-stock-bloc').hidden = modification;
  element('produit-quantite-bloc').hidden = !modification;
  element('bouton-archiver-produit').hidden = !modification;
  element('produit-note-quantite').textContent = modification
    ? 'La quantité ne se modifie pas ici. Utilisez « Mouvement de stock » dans la liste des produits.'
    : '';

  afficherVue('vue-produit');
  effacerMessages();
  afficherQuantiteDuFormulaire();
  mettreAJourAides();
}

function fermerFormulaire() {
  idProduitEnCours = null;
  afficherVue('vue-accueil');
}

// Lit et contrôle le formulaire. Renvoie la fiche, ou null après avoir
// affiché l'erreur.
function lireFormulaire() {
  const nom = element('produit-nom').value.trim();
  const unite = element('produit-unite').value.trim();

  if (!nom) {
    afficherMessage('erreur-produit', 'Donnez un nom au produit.');
    return null;
  }
  if (nom.length > LONGUEUR_MAX_NOM_PRODUIT) {
    afficherMessage('erreur-produit', `Le nom ne doit pas dépasser ${LONGUEUR_MAX_NOM_PRODUIT} caractères.`);
    return null;
  }
  if (produits.some((produit) =>
    produit.id !== idProduitEnCours && COMPARATEUR.compare(produit.nom, nom) === 0)) {
    afficherMessage('erreur-produit', 'Un autre produit porte déjà ce nom. Choisissez un nom différent.');
    return null;
  }
  if (!unite) {
    afficherMessage('erreur-produit', 'Indiquez l’unité, par exemple : sac, kg, pièce.');
    return null;
  }
  if (unite.length > LONGUEUR_MAX_UNITE) {
    afficherMessage('erreur-produit', `L’unité ne doit pas dépasser ${LONGUEUR_MAX_UNITE} caractères.`);
    return null;
  }

  const seuil = analyserQuantite(element('produit-seuil').value);
  if (!seuil.ok) {
    afficherMessage('erreur-produit', messageNombreRefuse(seuil, 'Seuil d’alerte', DECIMALES_QUANTITE));
    return null;
  }
  const prix = analyserPrix(element('produit-prix').value);
  if (!prix.ok) {
    afficherMessage('erreur-produit', messageNombreRefuse(prix, 'Prix d’achat', DECIMALES_PRIX));
    return null;
  }

  // Le stock de départ n'existe qu'à la création d'un produit.
  let stockInitialMilliemes = 0;
  if (idProduitEnCours === null) {
    const stock = analyserQuantite(element('produit-stock').value);
    if (!stock.ok) {
      afficherMessage('erreur-produit', messageNombreRefuse(stock, 'Stock de départ', DECIMALES_QUANTITE));
      return null;
    }
    stockInitialMilliemes = stock.valeur;
  }

  return {
    stockInitialMilliemes,
    fiche: {
      nom,
      unite,
      seuilAlerteMilliemes: seuil.valeur,
      prixAchatCentimes: prix.valeur
    }
  };
}

// Ajoute un produit. Avec un stock de départ, le produit et son mouvement
// d'entrée initial partent dans le même lot.
function ajouterLeProduit(fiche, stockInitialMilliemes) {
  // Les identifiants et l'heure sont fixés une seule fois, avant l'envoi.
  const creation = {
    idProduit: nouvelIdProduit(contexte.db, contexte.uid),
    fiche,
    stockInitialMilliemes,
    idMouvement: stockInitialMilliemes > 0 ? nouvelIdMouvement(contexte.db, contexte.uid) : null,
    dateAppareil: new Date()
  };
  const libelle = `Ajout du produit « ${fiche.nom} »` + (stockInitialMilliemes > 0
    ? ` avec un stock de départ de ${formaterVariation(stockInitialMilliemes)} ${fiche.unite}`
    : '');

  suivreOperation(
    contexte.db,
    contexte.uid,
    {
      id: creation.idProduit,
      chemin: ['users', contexte.uid, 'products', creation.idProduit],
      libelle,
      dateAppareil: creation.dateAppareil
    },
    ajouterProduit(contexte.db, contexte.uid, creation),
    (resultat) => signalerResultatOperation(resultat, libelle)
  );
}

function enregistrer() {
  effacerMessages();
  const saisie = lireFormulaire();
  if (!saisie) {
    return;
  }
  const fiche = saisie.fiche;
  // Pas d'attente : la liste se met à jour dès l'enregistrement local, même
  // sans Internet. Un refus du serveur est signalé sur l'écran des produits.
  if (idProduitEnCours === null) {
    ajouterLeProduit(fiche, saisie.stockInitialMilliemes);
  } else {
    modifierProduit(contexte.db, contexte.uid, idProduitEnCours, fiche)
      .catch((erreur) => signalerRefus(`La modification de « ${fiche.nom} »`, erreur));
  }
  fermerFormulaire();
}

function archiver() {
  const produit = produitEnCours();
  if (!produit) {
    return;
  }
  let question = `Archiver « ${produit.nom} » ?\n\n` +
    'Le produit disparaîtra de la liste. Son historique sera conservé. ' +
    'Il ne pourra pas être remis dans la liste.';
  if (produit.quantiteMilliemes !== 0) {
    question += `\n\nAttention : il reste ${formaterQuantite(produit.quantiteMilliemes)} ${produit.unite} en stock.`;
  }
  if (!window.confirm(question)) {
    return;
  }
  archiverProduit(contexte.db, contexte.uid, produit.id)
    .catch((erreur) => signalerRefus(`L’archivage de « ${produit.nom} »`, erreur));
  fermerFormulaire();
}

// ---------- Branchement ----------

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranProduits() {
  element('produit-nom').maxLength = LONGUEUR_MAX_NOM_PRODUIT;
  element('produit-unite').maxLength = LONGUEUR_MAX_UNITE;

  element('bouton-ajouter-produit').addEventListener('click', () => ouvrirFormulaire(null));
  element('bouton-annuler-produit').addEventListener('click', fermerFormulaire);
  element('bouton-archiver-produit').addEventListener('click', archiver);
  element('formulaire-produit').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    enregistrer();
  });
  element('produit-stock').addEventListener('input', mettreAJourAides);
  element('produit-seuil').addEventListener('input', mettreAJourAides);
  element('produit-prix').addEventListener('input', mettreAJourAides);
  // Dès qu'un champ est corrigé, l'ancien message d'erreur disparaît.
  element('formulaire-produit').addEventListener('input', () => {
    element('erreur-produit').hidden = true;
  });
}

// À appeler quand l'entrepôt du compte connecté est connu (ou a changé).
export function demarrerEcranProduits(db, uid, entrepot) {
  if (contexte && contexte.uid === uid) {
    // Même compte : seule la devise a pu changer.
    if (contexte.devise !== entrepot.devise) {
      contexte.devise = entrepot.devise;
      afficherListe();
    }
    return;
  }
  arreterEcranProduits();
  contexte = { db, uid, devise: entrepot.devise };
  arreterEcoute = surveillerProduits(db, uid, surProduits, surErreurProduits);
}

// À appeler à la déconnexion.
export function arreterEcranProduits() {
  if (arreterEcoute) {
    arreterEcoute();
    arreterEcoute = null;
  }
  contexte = null;
  produits = [];
  idProduitEnCours = null;
  element('liste-produits').textContent = '';
  element('produits-vide').hidden = true;
}
