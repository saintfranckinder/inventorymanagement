// Enchaînement des écrans : connexion, inscription, mot de passe oublié,
// confidentialité, premier lancement, puis écran des produits.

import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  connecterAvecGoogle,
  connecterAvecMotDePasse,
  creerCompte,
  envoyerReinitialisation,
  seDeconnecter,
  surveillerConnexion
} from './auth.js';
import {
  arreterEcranMouvements,
  brancherEcranMouvements,
  demarrerEcranMouvements
} from './ecran-mouvements.js';
import {
  arreterEcranFournisseurs,
  brancherEcranFournisseurs,
  demarrerEcranFournisseurs
} from './ecran-fournisseurs.js';
import {
  arreterEcranParametres,
  brancherEcranParametres,
  demarrerEcranParametres
} from './ecran-parametres.js';
import {
  arreterEcranProduits,
  brancherEcranProduits,
  demarrerEcranProduits
} from './ecran-produits.js';
import {
  CLE_COMPTE_SUPPRIME,
  arreterEcranSuppression,
  brancherEcranSuppression,
  demarrerEcranSuppression,
  reprendreSuppression,
  suppressionPriseEnMain
} from './ecran-suppression.js';
import { suppressionCommenceeIci } from './suppression-compte.js';
import {
  DEVISES,
  LONGUEUR_MAX_NOM_ENTREPOT,
  creerEntrepot,
  nomDevise,
  surveillerEntrepot
} from './entrepot.js';
import { demarrerFirebase, VERSION_SDK_FIREBASE } from './firebase-init.js';
import { afficherMessage, afficherVue, effacerMessages, element, vueActuelle } from './interface.js';
import { messageErreur } from './messages-erreur.js';

const VERSION_APP = '0.10.0';

// Écrans accessibles sans être connecté.
const VUES_SANS_COMPTE = ['vue-connexion', 'vue-inscription', 'vue-oubli', 'vue-confidentialite'];

// Écrans de travail d'un compte connecté. Tant que l'utilisateur est sur l'un
// d'eux, une simple mise à jour de l'entrepôt ne doit pas le déplacer.
const VUES_DE_TRAVAIL = [
  'vue-accueil', 'vue-produit', 'vue-mouvement', 'vue-historique', 'vue-parametres',
  'vue-fournisseurs', 'vue-fournisseur', 'vue-suppression'
];

const AVERTISSEMENT_STOCKAGE =
  'Ce navigateur n’enregistre pas les données sur l’appareil. ' +
  'Sans Internet, l’application ne pourra pas se rouvrir avec vos données, ' +
  'et une modification non envoyée sera perdue à la fermeture. ' +
  'Évitez la navigation privée et vérifiez que le stockage du site est autorisé.';

let firebase = null;
let utilisateur = null;
let arreterEcouteEntrepot = null;
let memoireHorsLigneVerifiee = false;
let premierEtatConnu = false;

// ---------- Affichage ----------

function afficherProbleme(titre, texte) {
  element('probleme-titre').textContent = titre;
  element('probleme-texte').textContent = texte;
  element('bouton-deconnexion-probleme').hidden = utilisateur === null;
  afficherVue('vue-probleme');
}

function afficherAvertissementStockage() {
  const zone = element('avertissement-stockage');
  zone.textContent = AVERTISSEMENT_STOCKAGE;
  zone.hidden = false;
}

// Désactive un bouton pendant une opération, pour éviter les doubles envois.
async function avecBoutonOccupe(bouton, texteOccupe, action) {
  const texteNormal = bouton.textContent;
  bouton.disabled = true;
  bouton.textContent = texteOccupe;
  try {
    await action();
  } finally {
    bouton.disabled = false;
    bouton.textContent = texteNormal;
  }
}

function viderMotsDePasse() {
  for (const champ of document.querySelectorAll('input[data-mot-de-passe]')) {
    champ.value = '';
    champ.type = 'password';
  }
  for (const caseACocher of document.querySelectorAll('input[data-afficher-mdp]')) {
    caseACocher.checked = false;
  }
}

// ---------- Entrepôt ----------

async function verifierMemoireHorsLigneUneFois() {
  if (memoireHorsLigneVerifiee) {
    return;
  }
  memoireHorsLigneVerifiee = true;
  const active = await firebase.verifierMemoireHorsLigne();
  if (!active) {
    afficherAvertissementStockage();
  }
}

// Arrête les écoutes des écrans de travail (déconnexion, suppression du compte).
function arreterEcransDeTravail() {
  arreterEcranProduits();
  arreterEcranMouvements();
  arreterEcranParametres();
  arreterEcranFournisseurs();
}

function surEtatEntrepot(etat) {
  verifierMemoireHorsLigneUneFois();

  // Suppression du compte commencée sur cet appareil : l'écran de suppression
  // garde la main jusqu'au rechargement de la page (décision 62).
  if (suppressionPriseEnMain()) {
    arreterEcransDeTravail();
    return;
  }

  // Suppression demandée (sur cet appareil ou un autre) : plus d'écoute des
  // données, la suppression reprend où elle s'était arrêtée.
  if (etat.existe && etat.donnees.suppressionDemandee === true) {
    arreterEcransDeTravail();
    reprendreSuppression();
    return;
  }

  // L'entrepôt n'existe plus sur le serveur alors que cet appareil avait
  // commencé une suppression : il ne reste que le compte de connexion.
  if (!etat.existe && !etat.depuisCache && suppressionCommenceeIci(utilisateur.uid)) {
    arreterEcransDeTravail();
    reprendreSuppression();
    return;
  }

  if (etat.existe) {
    element('accueil-entrepot').textContent = etat.donnees.nomEntrepot;
    element('accueil-devise').textContent = nomDevise(etat.donnees.devise);
    element('accueil-compte').textContent = utilisateur.email || 'Compte sans adresse e-mail';
    demarrerEcranProduits(firebase.db, utilisateur.uid, etat.donnees);
    demarrerEcranMouvements(firebase.db, utilisateur.uid);
    demarrerEcranParametres(firebase.db, utilisateur.uid, etat.donnees);
    demarrerEcranFournisseurs(firebase.db, utilisateur.uid);
    if (!VUES_DE_TRAVAIL.includes(vueActuelle())) {
      afficherVue('vue-accueil');
    }
    return;
  }

  arreterEcransDeTravail();

  if (!etat.depuisCache) {
    // Le serveur confirme qu'aucun entrepôt n'existe : c'est un nouveau compte.
    afficherVue('vue-premier-lancement');
    return;
  }

  // Réponse venue de la mémoire de l'appareil : impossible de savoir si le
  // compte est nouveau. Ne surtout pas proposer de créer un entrepôt.
  afficherProbleme(
    'Connexion Internet nécessaire',
    'Vos données n’ont pas encore été chargées sur cet appareil. ' +
    'Dès qu’Internet revient, l’application continue toute seule.'
  );
}

// Après la suppression d'un compte, la page est rechargée : le message
// s'affiche une fois sur l'écran de connexion (décision 62).
function afficherMessageCompteSupprime() {
  let resultat = null;
  try {
    resultat = window.sessionStorage.getItem(CLE_COMPTE_SUPPRIME);
    window.sessionStorage.removeItem(CLE_COMPTE_SUPPRIME);
  } catch {
    return;
  }
  if (!resultat) {
    return;
  }
  afficherMessage(
    'info-connexion',
    'Votre compte et toutes vos données ont été supprimés.' +
    (resultat === 'complet'
      ? ''
      : ' La copie gardée par ce navigateur n’a pas pu être effacée : fermez les autres onglets de MinStock, ' +
        'puis effacez les données du site dans les réglages du navigateur.')
  );
}

function surErreurEntrepot(erreur) {
  if (suppressionPriseEnMain()) {
    // Fin de la suppression du compte : l'écran de suppression s'en occupe.
    return;
  }
  console.error(erreur);
  afficherProbleme(
    'Impossible de charger vos données',
    messageErreur(erreur) + ' Rechargez la page. Si le problème continue, ' +
    'les règles de sécurité ne sont peut-être pas publiées dans la console Firebase.'
  );
}

function surChangementUtilisateur(nouvelUtilisateur) {
  if (arreterEcouteEntrepot) {
    arreterEcouteEntrepot();
    arreterEcouteEntrepot = null;
  }
  arreterEcransDeTravail();
  arreterEcranSuppression();
  utilisateur = nouvelUtilisateur;
  viderMotsDePasse();
  // Le message « compte supprimé » ne se lit qu'au premier état de connexion
  // après le rechargement de la page.
  const premierEtat = !premierEtatConnu;
  premierEtatConnu = true;

  if (!utilisateur) {
    if (!VUES_SANS_COMPTE.includes(vueActuelle())) {
      afficherVue('vue-connexion');
    }
    if (premierEtat) {
      afficherMessageCompteSupprime();
    }
    return;
  }

  demarrerEcranSuppression(firebase.db, firebase.auth);
  afficherVue('vue-chargement');
  arreterEcouteEntrepot = surveillerEntrepot(
    firebase.db,
    utilisateur.uid,
    surEtatEntrepot,
    surErreurEntrepot
  );
}

// ---------- Formulaires ----------

function brancherConnexion() {
  element('bouton-google').addEventListener('click', () => {
    effacerMessages();
    // Appel direct depuis le clic : indispensable pour que la popup s'ouvre.
    connecterAvecGoogle(firebase.auth).catch((erreur) => {
      afficherMessage('erreur-connexion', messageErreur(erreur));
    });
  });

  element('formulaire-connexion').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    effacerMessages();
    const email = element('connexion-email').value.trim();
    const motDePasse = element('connexion-mdp').value;
    if (!email || !motDePasse) {
      afficherMessage('erreur-connexion', 'Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    avecBoutonOccupe(evenement.submitter || element('bouton-connexion'), 'Connexion…', async () => {
      try {
        await connecterAvecMotDePasse(firebase.auth, email, motDePasse);
      } catch (erreur) {
        afficherMessage('erreur-connexion', messageErreur(erreur));
      }
    });
  });
}

function brancherInscription() {
  element('formulaire-inscription').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    effacerMessages();
    const email = element('inscription-email').value.trim();
    const motDePasse = element('inscription-mdp').value;
    if (!email) {
      afficherMessage('erreur-inscription', 'Saisissez votre adresse e-mail.');
      return;
    }
    if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
      afficherMessage(
        'erreur-inscription',
        `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`
      );
      return;
    }
    avecBoutonOccupe(evenement.submitter || element('bouton-inscription'), 'Création…', async () => {
      try {
        await creerCompte(firebase.auth, email, motDePasse);
      } catch (erreur) {
        afficherMessage('erreur-inscription', messageErreur(erreur));
      }
    });
  });
}

function brancherMotDePasseOublie() {
  element('formulaire-oubli').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    effacerMessages();
    const email = element('oubli-email').value.trim();
    if (!email) {
      afficherMessage('erreur-oubli', 'Saisissez votre adresse e-mail.');
      return;
    }
    avecBoutonOccupe(evenement.submitter || element('bouton-oubli'), 'Envoi…', async () => {
      try {
        await envoyerReinitialisation(firebase.auth, email);
        // Même message que l'adresse ait un compte ou non.
        afficherMessage(
          'info-oubli',
          'Si un compte existe pour cette adresse, un e-mail vient d’être envoyé. ' +
          'Pensez à regarder dans le courrier indésirable.'
        );
      } catch (erreur) {
        afficherMessage('erreur-oubli', messageErreur(erreur));
      }
    });
  });
}

function brancherPremierLancement() {
  const liste = element('lancement-devise');
  for (const devise of DEVISES) {
    const option = document.createElement('option');
    option.value = devise.code;
    option.textContent = devise.nom;
    liste.append(option);
  }
  element('lancement-nom').maxLength = LONGUEUR_MAX_NOM_ENTREPOT;

  element('formulaire-lancement').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    effacerMessages();
    const nom = element('lancement-nom').value.trim();
    const devise = liste.value;
    if (!nom) {
      afficherMessage('erreur-lancement', 'Donnez un nom à votre entrepôt.');
      return;
    }
    if (nom.length > LONGUEUR_MAX_NOM_ENTREPOT) {
      afficherMessage(
        'erreur-lancement',
        `Le nom ne doit pas dépasser ${LONGUEUR_MAX_NOM_ENTREPOT} caractères.`
      );
      return;
    }
    if (!DEVISES.some((choix) => choix.code === devise)) {
      afficherMessage('erreur-lancement', 'Choisissez une devise dans la liste.');
      return;
    }
    // Pas d'attente : l'écran se met à jour dès l'enregistrement local.
    // Si le serveur refuse, l'écran de premier lancement revient avec ce message.
    creerEntrepot(firebase.db, utilisateur.uid, nom, devise).catch((erreur) => {
      console.error(erreur);
      afficherVue('vue-premier-lancement');
      afficherMessage(
        'erreur-lancement',
        'L’entrepôt n’a pas pu être créé. ' + messageErreur(erreur)
      );
    });
  });
}

function brancherNavigation() {
  for (const bouton of document.querySelectorAll('[data-aller]')) {
    bouton.addEventListener('click', () => {
      // Ces liens n'existent que sur les écrans sans compte.
      if (!utilisateur) {
        afficherVue(bouton.dataset.aller);
      }
    });
  }

  for (const bouton of document.querySelectorAll('[data-deconnexion]')) {
    bouton.addEventListener('click', () => {
      seDeconnecter(firebase.auth).catch((erreur) => console.error(erreur));
    });
  }

  for (const caseACocher of document.querySelectorAll('input[data-afficher-mdp]')) {
    caseACocher.addEventListener('change', () => {
      element(caseACocher.dataset.afficherMdp).type = caseACocher.checked ? 'text' : 'password';
    });
  }

  element('bouton-recharger').addEventListener('click', () => {
    window.location.reload();
  });
}

// ---------- Démarrage ----------

async function demarrer() {
  element('version').textContent =
    `Version ${VERSION_APP} — SDK Firebase ${VERSION_SDK_FIREBASE}`;

  try {
    firebase = await demarrerFirebase();
  } catch (erreur) {
    console.error(erreur);
    afficherProbleme(
      'L’application n’a pas pu démarrer',
      'Rechargez la page. Si le problème continue, vérifiez la connexion Internet.'
    );
    return;
  }

  if (!firebase.stockageLocalDisponible) {
    afficherAvertissementStockage();
  }

  brancherNavigation();
  brancherConnexion();
  brancherInscription();
  brancherMotDePasseOublie();
  brancherPremierLancement();
  brancherEcranProduits();
  brancherEcranMouvements();
  brancherEcranParametres();
  brancherEcranFournisseurs();
  brancherEcranSuppression();

  surveillerConnexion(firebase.auth, surChangementUtilisateur);
}

demarrer();
