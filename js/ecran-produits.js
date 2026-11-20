// Écran des produits : tableau de bord (phase 5) et formulaire d'ajout /
// modification.
// Tableau de bord : valeur du stock « indicative », recherche par nom,
// alertes « Stock bas » et « Rupture », boutons rapides « −1 » / « +1 »
// (décisions 44 à 46).
// Disposition « accueil épuré » (décision 74) : une ligne par produit ;
// toucher la ligne ouvre la fiche du produit, un panneau qui monte du bas.

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
import { oublierEcoute, signalerEcoute } from './indicateur-synchro.js';
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

// Filtre choisi avec les compteurs (décision 59) : 'tous', 'bas' ou 'rupture'.
// `idsDuFiltre` garde les produits retenus au moment du choix : un produit
// qui sort de l'alerte reste affiché, pour que la liste ne bouge pas sous le
// doigt pendant des appuis rapides.
let filtre = 'tous';
let idsDuFiltre = null;

// Produit affiché dans le panneau de sa fiche, ou null (décision 74).
let idFiche = null;

const TEXTES_FILTRE = {
  bas: { nom: 'Stock bas', aucun: 'Aucun produit en stock bas pour l’instant.' },
  rupture: { nom: 'Ruptures', aucun: 'Aucun produit en rupture pour l’instant.' }
};

// ---------- Tableau de bord ----------

// Une unité, en millièmes : la valeur des boutons « +1 » et « −1 ».
const UNE_UNITE_MILLIEMES = 1000;

// Les alertes sont toujours écrites, pas seulement colorées.
const LIBELLES_ETAT = { bas: 'Stock bas', rupture: 'Rupture' };

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
    fermerFiche();
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

function etiquetteAlerte(texte, classe) {
  const etiquette = document.createElement('span');
  etiquette.className = `etiquette ${classe}`;
  etiquette.textContent = texte;
  return etiquette;
}

// Alertes toujours écrites, pas seulement colorées (CLAUDE.md, section 11).
function etiquettesAlerte(produit) {
  const etat = etatDuStock(produit);
  const etiquettes = [];
  if (etat !== 'normal') {
    etiquettes.push(etiquetteAlerte(LIBELLES_ETAT[etat], `etiquette-${etat}`));
  }
  if (produit.quantiteMilliemes < 0) {
    etiquettes.push(etiquetteAlerte('Stock négatif : à vérifier', 'etiquette-rupture'));
  }
  return etiquettes;
}

// Une ligne par produit (décision 74) : nom, « Achat … · seuil … »,
// alertes, puis « −1 », quantité, « +1 ». Toucher le nom ouvre la fiche.
function carteProduit(produit) {
  const etat = etatDuStock(produit);
  const ligne = document.createElement('li');
  ligne.className = etat === 'normal' ? 'produit-ligne' : `produit-ligne produit-ligne-${etat}`;

  const infos = document.createElement('button');
  infos.type = 'button';
  infos.className = 'produit-infos';
  infos.dataset.action = 'fiche';
  infos.dataset.produit = produit.id;

  const nom = document.createElement('span');
  nom.className = 'produit-nom';
  nom.textContent = produit.nom;

  // Tant que le serveur n'a pas confirmé, « En attente de synchronisation »
  // remplace cette ligne, qui garde la même hauteur : rien ne bouge
  // (décisions 65 et 74).
  const details = document.createElement('span');
  details.className = produit.enAttente ? 'produit-meta produit-meta-attente' : 'produit-meta';
  details.textContent = produit.enAttente
    ? 'En attente de synchronisation'
    : `Achat ${formaterMontant(produit.prixAchatCentimes, contexte.devise)} · ` +
      `seuil ${formaterQuantite(produit.seuilAlerteMilliemes)}`;

  const voir = document.createElement('span');
  voir.className = 'lecteur-ecran';
  voir.textContent = ' — ouvrir la fiche';
  infos.append(nom, details);

  const alertes = etiquettesAlerte(produit);
  if (alertes.length > 0) {
    const bloc = document.createElement('span');
    bloc.className = 'produit-alertes';
    bloc.append(...alertes);
    infos.append(bloc);
  }
  infos.append(voir);
  infos.addEventListener('click', () => ouvrirFiche(produit.id));

  const quantite = document.createElement('p');
  quantite.className = 'quantite';
  const valeur = document.createElement('span');
  valeur.className = 'quantite-valeur';
  valeur.textContent = formaterQuantite(produit.quantiteMilliemes);
  const unite = document.createElement('span');
  unite.className = 'quantite-libelle';
  unite.textContent = produit.unite;
  quantite.append(valeur, unite);

  const ligneQuantite = document.createElement('div');
  ligneQuantite.className = 'ligne-quantite';
  ligneQuantite.append(boutonRapide(produit, 'moins'), quantite, boutonRapide(produit, 'plus'));

  ligne.append(infos, ligneQuantite);
  return ligne;
}

// ---------- Fiche d'un produit : panneau qui monte du bas (décision 74) ----------

function produitDeLaFiche() {
  return produits.find((produit) => produit.id === idFiche) || null;
}

// Met le panneau à jour (quantité, alertes, « en attente ») sans le
// reconstruire : les boutons « −1 » / « +1 » restent sous le doigt.
function remplirFiche() {
  const produit = produitDeLaFiche();
  if (!produit || !contexte) {
    return;
  }
  element('fiche-titre').textContent = produit.nom;
  const etiquettes = element('fiche-etiquettes');
  const alertes = etiquettesAlerte(produit).filter((etiquette) =>
    !etiquette.textContent.startsWith('Stock négatif'));
  etiquettes.replaceChildren(...alertes);
  etiquettes.hidden = alertes.length === 0;

  const etat = etatDuStock(produit);
  const quantite = element('fiche-quantite');
  quantite.textContent = formaterQuantite(produit.quantiteMilliemes);
  quantite.classList.toggle('quantite-bas', etat === 'bas');
  quantite.classList.toggle('quantite-rupture', etat === 'rupture');
  const unite = element('fiche-unite');
  unite.textContent = produit.enAttente ? `${produit.unite} · en attente` : `${produit.unite} en stock`;
  unite.classList.toggle('quantite-attente', produit.enAttente === true);
  element('fiche-negatif').hidden = produit.quantiteMilliemes >= 0;

  element('fiche-moins').setAttribute('aria-label', `Retirer 1 ${produit.unite} : ${produit.nom}`);
  element('fiche-plus').setAttribute('aria-label', `Ajouter 1 ${produit.unite} : ${produit.nom}`);
  element('fiche-seuil').textContent =
    `${formaterQuantite(produit.seuilAlerteMilliemes)} ${produit.unite}`;
  element('fiche-prix').textContent = formaterMontant(produit.prixAchatCentimes, contexte.devise);
  element('fiche-valeur').textContent = formaterMontant(
    calculerValeurCentimes(produit.quantiteMilliemes, produit.prixAchatCentimes),
    contexte.devise
  );
}

function ouvrirFiche(idProduit) {
  idFiche = idProduit;
  if (!produitDeLaFiche()) {
    idFiche = null;
    return;
  }
  remplirFiche();
  const panneau = element('fiche-produit');
  if (!panneau.open) {
    panneau.showModal();
  }
}

function fermerFiche() {
  const panneau = element('fiche-produit');
  if (panneau.open) {
    panneau.close();
  }
  surFermetureFiche();
}

// Après la fermeture (par ✕, le fond, Échap ou le bouton retour) : le focus
// revient sur la ligne du produit, qui a pu être reconstruite pendant que le
// panneau était ouvert. Appelée directement, et aussi par l'événement
// « close » du panneau : la seconde fois, elle ne fait rien.
function surFermetureFiche() {
  const id = idFiche;
  idFiche = null;
  if (id && vueActuelle() === 'vue-accueil') {
    const ligne = element('liste-produits').querySelector(
      `button[data-action="fiche"][data-produit="${CSS.escape(id)}"]`
    );
    if (ligne) {
      ligne.focus({ preventScroll: true });
    }
  }
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

// ---------- Filtre des compteurs (décision 59) ----------

// Ligne au-dessus de la liste et état des boutons « Stock bas » / « Ruptures ».
// `nombreAffiches` : produits retenus par le filtre (avant la recherche).
function afficherFiltre(nombreAffiches) {
  element('compteur-bas').setAttribute('aria-pressed', String(filtre === 'bas'));
  element('compteur-rupture').setAttribute('aria-pressed', String(filtre === 'rupture'));

  const bloc = element('bloc-filtre');
  bloc.hidden = filtre === 'tous';
  if (filtre === 'tous') {
    element('filtre-texte').textContent = '';
    return;
  }
  const textes = TEXTES_FILTRE[filtre];
  let texte = nombreAffiches === 0
    ? textes.aucun
    : `Filtre « ${textes.nom} » : ${FORMAT_ENTIER.format(nombreAffiches)} ` +
      (nombreAffiches >= 2 ? 'produits affichés.' : 'produit affiché.');
  // Un produit sorti de l'alerte depuis le choix du filtre reste affiché.
  const encore = produits.filter((produit) => etatDuStock(produit) === filtre).length;
  if (nombreAffiches > 0 && encore !== nombreAffiches) {
    texte += ` Touchez de nouveau « ${textes.nom} » pour mettre la liste à jour.`;
  }
  element('filtre-texte').textContent = texte;
}

// Choix d'un compteur : 'tous', 'bas' ou 'rupture'. La recherche est vidée,
// l'écran descend jusqu'à la liste et le focus clavier suit.
function choisirFiltre(nouveau) {
  if (!contexte) {
    return;
  }
  filtre = nouveau;
  idsDuFiltre = nouveau === 'tous'
    ? null
    : new Set(produits.filter((produit) => etatDuStock(produit) === nouveau).map((produit) => produit.id));
  element('recherche-produit').value = '';
  afficherListe();

  const titre = element('titre-produits');
  titre.scrollIntoView({ block: 'start' });
  if (nouveau === 'tous') {
    titre.focus({ preventScroll: true });
    annoncer(`Tous les produits sont affichés : ${FORMAT_ENTIER.format(produits.length)}.`);
  } else {
    element('filtre-texte').focus({ preventScroll: true });
  }
}

function enleverFiltre() {
  filtre = 'tous';
  idsDuFiltre = null;
}

function afficherListe() {
  const liste = element('liste-produits');

  // La liste est reconstruite à chaque changement : le bouton de la liste
  // (« −1 », « +1 » ou la ligne) qui avait le focus clavier le retrouve
  // ensuite. Les boutons du panneau de la fiche ne sont pas concernés.
  const actif = document.activeElement;
  const focusRapide = actif && liste.contains(actif) && actif.dataset && actif.dataset.action
    ? { action: actif.dataset.action, produit: actif.dataset.produit }
    : null;

  liste.textContent = '';
  element('produits-vide').hidden = produits.length > 0;
  element('bloc-recherche').hidden = produits.length === 0;
  afficherValeurTotale();

  // Filtre des compteurs, puis recherche, dans les produits déjà chargés :
  // aucune lecture de plus. Sans aucun produit, il n'y a rien à filtrer.
  if (produits.length === 0) {
    enleverFiltre();
  }
  const filtres = filtre === 'tous'
    ? produits
    : produits.filter((produit) => idsDuFiltre.has(produit.id));
  afficherFiltre(filtres.length);

  const saisie = element('recherche-produit').value;
  const recherche = normaliserPourRecherche(saisie);
  const visibles = recherche
    ? filtres.filter((produit) => normaliserPourRecherche(produit.nom).includes(recherche))
    : filtres;

  const aucun = element('recherche-aucun');
  aucun.hidden = produits.length === 0 || visibles.length > 0 || !recherche;
  aucun.textContent = aucun.hidden ? '' : `Aucun produit ne correspond à « ${saisie.trim()} ».`;

  for (const produit of visibles) {
    liste.append(carteProduit(produit));
  }

  if (focusRapide && focusRapide.produit) {
    const bouton = liste.querySelector(
      `button[data-action="${focusRapide.action}"][data-produit="${CSS.escape(focusRapide.produit)}"]`
    );
    if (bouton) {
      bouton.focus({ preventScroll: true });
    }
  }
}

function surProduits(etat) {
  signalerEcoute('produits', etat.depuisCache, etat.produits.some((produit) => produit.enAttente));
  produits = etat.produits.slice().sort((a, b) => COMPARATEUR.compare(a.nom, b.nom));
  afficherListe();
  surProduitsActifs(produits);
  // Panneau de la fiche ouvert : mis à jour, ou fermé si le produit vient
  // d'être archivé (ici ou ailleurs).
  if (idFiche !== null) {
    if (produitDeLaFiche()) {
      remplirFiche();
    } else {
      fermerFiche();
    }
  }
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
  element('bouton-ajouter-produit').addEventListener('click', () => {
    // Le nouveau produit doit être visible au retour : le filtre s'enlève.
    if (filtre !== 'tous') {
      enleverFiltre();
      afficherListe();
    }
    ouvrirFormulaire(null);
  });
  // Compteurs de la carte de valeur et « Tout afficher » (décision 59).
  for (const bouton of document.querySelectorAll('.compteur[data-filtre]')) {
    bouton.addEventListener('click', () => choisirFiltre(bouton.dataset.filtre));
  }
  element('bouton-tout-afficher').addEventListener('click', () => choisirFiltre('tous'));

  // Explication de la valeur du stock, derrière l'icône ⓘ (décision 74).
  element('bouton-info-valeur').addEventListener('click', () => {
    const aide = element('valeur-stock-aide');
    aide.hidden = !aide.hidden;
    element('bouton-info-valeur').setAttribute('aria-expanded', String(!aide.hidden));
  });

  // Panneau de la fiche d'un produit (décision 74).
  const panneau = element('fiche-produit');
  panneau.addEventListener('close', surFermetureFiche);
  // Échap ou bouton retour du téléphone : même fermeture que ✕.
  panneau.addEventListener('cancel', (evenement) => {
    evenement.preventDefault();
    fermerFiche();
  });
  // Toucher le fond gris, en dehors du panneau, le ferme.
  panneau.addEventListener('click', (evenement) => {
    const cadre = panneau.getBoundingClientRect();
    const dehors = evenement.clientX < cadre.left || evenement.clientX > cadre.right ||
      evenement.clientY < cadre.top || evenement.clientY > cadre.bottom;
    if (evenement.target === panneau && dehors) {
      fermerFiche();
    }
  });
  element('bouton-fermer-fiche').addEventListener('click', fermerFiche);
  element('fiche-moins').addEventListener('click', () => {
    if (idFiche) {
      actionRapide(idFiche, 'moins');
    }
  });
  element('fiche-plus').addEventListener('click', () => {
    if (idFiche) {
      actionRapide(idFiche, 'plus');
    }
  });
  element('bouton-fiche-mouvement').addEventListener('click', () => {
    const produit = produitDeLaFiche();
    fermerFiche();
    if (produit) {
      ouvrirFormulaireMouvement(produit);
    }
  });
  element('bouton-fiche-modifier').addEventListener('click', () => {
    const produit = produitDeLaFiche();
    fermerFiche();
    if (produit) {
      ouvrirFormulaire(produit.id);
    }
  });

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
  oublierEcoute('produits');
  fermerFiche();
  idFiche = null;
  element('valeur-stock-aide').hidden = true;
  element('bouton-info-valeur').setAttribute('aria-expanded', 'false');
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
  enleverFiltre();
  element('bloc-filtre').hidden = true;
  element('filtre-texte').textContent = '';
  element('compteur-bas').setAttribute('aria-pressed', 'false');
  element('compteur-rupture').setAttribute('aria-pressed', 'false');
}
