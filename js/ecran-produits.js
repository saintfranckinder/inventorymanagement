// Écran des produits : tableau de bord (phase 5) et formulaire d'ajout /
// modification.
// Tableau de bord : valeur du stock « indicative », recherche par nom,
// alertes « Stock bas » et « Rupture », boutons rapides « −1 » / « +1 »
// (décisions 44 à 46).

import {
  envoyerMouvement,
  formaterVariation,
  ouvrirFormulaireMouvement,
  signalerResultatOperation,
  surProduitsActifs
} from './ecran-mouvements.js';
import {
  afficherMessage,
  afficherVue,
  effacerMessages,
  element,
  normaliserPourRecherche,
  vueActuelle
} from './interface.js';
import { messageErreur } from './messages-erreur.js';
import { nouvelIdMouvement } from './mouvements.js';
import { suivreOperation } from './operations-en-attente.js';
import {
  DECIMALES_PRIX,
  DECIMALES_QUANTITE,
  analyserPrix,
  analyserQuantite,
  calculerValeurCentimes,
  calculerValeurTotaleCentimes,
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

// Nombres entiers des compteurs : « 1 250 » plutôt que « 1250 ».
const FORMAT_ENTIER = new Intl.NumberFormat('fr-FR');

let contexte = null;          // { db, uid, devise }
let produits = [];            // produits non archivés, triés par nom
let arreterEcoute = null;
let idProduitEnCours = null;  // produit en cours de modification, ou null pour un ajout

// ---------- Tableau de bord ----------

// Une unité, en millièmes : la valeur des boutons « +1 » et « −1 ».
const UNE_UNITE_MILLIEMES = 1000;

// Les alertes sont toujours écrites, pas seulement colorées.
const LIBELLES_ETAT = { bas: 'Stock bas', rupture: 'Rupture' };

function ligneDetail(libelle, valeur) {
  const ligne = document.createElement('p');
  ligne.className = 'produit-detail';
  ligne.textContent = `${libelle} : ${valeur}`;
  return ligne;
}

// « rupture » (rouge) si la quantité est à 0 ou en dessous ; sinon « bas »
// (orange) si elle atteint le seuil d'alerte (CLAUDE.md, section 11).
function etatDuStock(produit) {
  if (produit.quantiteMilliemes <= 0) {
    return 'rupture';
  }
  if (produit.quantiteMilliemes <= produit.seuilAlerteMilliemes) {
    return 'bas';
  }
  return 'normal';
}

// Annonce un texte aux lecteurs d'écran, sans rien déplacer à l'écran (la
// page ne doit pas bouger sous le doigt pendant les appuis rapides).
function annoncer(texte) {
  const zone = element('annonce-produits');
  zone.textContent = '';
  window.setTimeout(() => {
    zone.textContent = texte;
  }, 50);
}

// « +1 » et « −1 » : un mouvement d'une unité, sans motif, envoyé tout de
// suite par le même chemin que le formulaire (décision 44). Le produit est
// relu au moment de l'appui, pour tenir compte des appuis précédents.
function actionRapide(idProduit, action) {
  const produit = produits.find((element_) => element_.id === idProduit);
  if (!produit) {
    return;
  }
  if (action === 'moins' && produit.quantiteMilliemes - UNE_UNITE_MILLIEMES < 0) {
    // Le stock deviendrait négatif : l'avertissement passe avant l'envoi
    // (décision 34). Le formulaire s'ouvre prérempli ; rien n'est envoyé.
    ouvrirFormulaireMouvement(produit, { type: 'sortie', quantite: '1' });
    return;
  }
  const libelle = action === 'plus'
    ? envoyerMouvement(produit, 'entree', UNE_UNITE_MILLIEMES, '')
    : envoyerMouvement(produit, 'sortie', -UNE_UNITE_MILLIEMES, '');
  if (libelle) {
    annoncer(`${libelle}. Quantité mise à jour sur cet appareil.`);
  }
}

function boutonRapide(produit, action) {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'bouton-rapide';
  bouton.dataset.action = action;
  bouton.dataset.produit = produit.id;
  bouton.textContent = action === 'plus' ? '+1' : '−1';
  bouton.setAttribute('aria-label', action === 'plus'
    ? `Ajouter 1 ${produit.unite} : ${produit.nom}`
    : `Retirer 1 ${produit.unite} : ${produit.nom}`);
  bouton.addEventListener('click', () => actionRapide(produit.id, action));
  return bouton;
}

function carteProduit(produit) {
  const etat = etatDuStock(produit);
  const article = document.createElement('li');
  article.className = etat === 'normal' ? 'produit' : `produit produit-${etat}`;

  const nom = document.createElement('h4');
  nom.textContent = produit.nom;
  article.append(nom);

  if (etat !== 'normal') {
    const etiquette = document.createElement('p');
    etiquette.className = `etiquette etiquette-${etat}`;
    etiquette.textContent = LIBELLES_ETAT[etat];
    article.append(etiquette);
  }

  // La quantité, entre « −1 » et « +1 ».
  const quantite = document.createElement('p');
  quantite.className = 'quantite';
  const libelle = document.createElement('span');
  libelle.className = 'quantite-libelle';
  libelle.textContent = 'Quantité';
  const valeur = document.createElement('span');
  valeur.className = 'quantite-valeur';
  valeur.textContent = `${formaterQuantite(produit.quantiteMilliemes)} ${produit.unite}`;
  quantite.append(libelle, valeur);

  const ligneQuantite = document.createElement('div');
  ligneQuantite.className = 'ligne-quantite';
  ligneQuantite.append(boutonRapide(produit, 'moins'), quantite, boutonRapide(produit, 'plus'));
  article.append(ligneQuantite);

  article.append(
    ligneDetail('Seuil d’alerte', `${formaterQuantite(produit.seuilAlerteMilliemes)} ${produit.unite}`),
    ligneDetail('Prix d’achat', formaterMontant(produit.prixAchatCentimes, contexte.devise)),
    ligneDetail(
      'Valeur (indicative)',
      formaterMontant(
        calculerValeurCentimes(produit.quantiteMilliemes, produit.prixAchatCentimes),
        contexte.devise
      )
    )
  );

  if (produit.quantiteMilliemes < 0) {
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

  return article;
}

// Valeur de tout l'entrepôt (produits actifs), même pendant une recherche :
// somme exacte des valeurs affichées sur chaque ligne (décision 45).
function afficherValeurTotale() {
  element('bloc-valeur').hidden = produits.length === 0;
  element('valeur-stock-total').textContent =
    formaterMontant(calculerValeurTotaleCentimes(produits), contexte.devise);

  // Trois compteurs sur tous les produits actifs, même pendant une recherche,
  // avec les seuils des alertes (décisions 46 et 58). Aucune lecture de plus.
  let bas = 0;
  let ruptures = 0;
  for (const produit of produits) {
    const etat = etatDuStock(produit);
    if (etat === 'bas') {
      bas += 1;
    } else if (etat === 'rupture') {
      ruptures += 1;
    }
  }
  afficherCompteur('compteur-produits', produits.length, 'Produit', 'Produits');
  afficherCompteur('compteur-bas', bas, 'Stock bas', 'Stock bas');
  afficherCompteur('compteur-rupture', ruptures, 'Rupture', 'Ruptures');
}

// En français, 0 et 1 s'écrivent au singulier.
function afficherCompteur(id, nombre, singulier, pluriel) {
  const compteur = element(id);
  compteur.querySelector('.compteur-nombre').textContent = FORMAT_ENTIER.format(nombre);
  compteur.querySelector('.compteur-libelle').textContent = nombre >= 2 ? pluriel : singulier;
}

function afficherListe() {
  // La liste est reconstruite à chaque changement : le bouton « +1 » / « −1 »
  // qui avait le focus clavier le retrouve ensuite.
  const actif = document.activeElement;
  const focusRapide = actif && actif.classList && actif.classList.contains('bouton-rapide')
    ? { action: actif.dataset.action, produit: actif.dataset.produit }
    : null;

  const liste = element('liste-produits');
  liste.textContent = '';
  element('produits-vide').hidden = produits.length > 0;
  element('bloc-recherche').hidden = produits.length === 0;
  afficherValeurTotale();

  // Recherche dans les produits déjà chargés : aucune lecture de plus.
  const saisie = element('recherche-produit').value;
  const recherche = normaliserPourRecherche(saisie);
  const visibles = recherche
    ? produits.filter((produit) => normaliserPourRecherche(produit.nom).includes(recherche))
    : produits;

  const aucun = element('recherche-aucun');
  aucun.hidden = produits.length === 0 || visibles.length > 0;
  aucun.textContent = aucun.hidden ? '' : `Aucun produit ne correspond à « ${saisie.trim()} ».`;

  for (const produit of visibles) {
    liste.append(carteProduit(produit));
  }

  if (focusRapide) {
    const bouton = liste.querySelector(
      `button[data-action="${focusRapide.action}"][data-produit="${CSS.escape(focusRapide.produit)}"]`
    );
    if (bouton) {
      bouton.focus({ preventScroll: true });
    }
  }
}

function surProduits(etat) {
  produits = etat.produits.slice().sort((a, b) => COMPARATEUR.compare(a.nom, b.nom));
  afficherListe();
  surProduitsActifs(produits);
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

  element('recherche-produit').addEventListener('input', () => {
    if (contexte) {
      afficherListe();
    }
  });
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
  element('recherche-produit').value = '';
  element('bloc-recherche').hidden = true;
  element('recherche-aucun').hidden = true;
  element('bloc-valeur').hidden = true;
  element('valeur-stock-total').textContent = '';
  element('annonce-produits').textContent = '';
}
