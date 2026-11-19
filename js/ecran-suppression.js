// Écrans de la suppression du compte (phase 7, décisions 13 et 60 à 62) :
//   - « Supprimer mon compte » : explication, double confirmation (case à
//     cocher et mot SUPPRIMER), reconnexion, puis demande de suppression ;
//   - « Suppression en cours » : avancement, reprise après une coupure,
//     reconnexion si Firebase l'exige pour la dernière étape.
// Dès que la suppression est commencée, cet écran garde la main jusqu'au
// rechargement de la page (js/app.js consulte suppressionPriseEnMain()).

import {
  methodeDeReconnexion,
  reconnecterAvecGoogle,
  reconnecterAvecMotDePasse,
  supprimerCompteDeConnexion
} from './auth.js';
import { afficherMessage, afficherVue, effacerMessages, element } from './interface.js';
import { messageErreur } from './messages-erreur.js';
import {
  demanderSuppression,
  effacerDonneesLocales,
  noterSuppressionCommencee,
  supprimerLesDonnees
} from './suppression-compte.js';

// Mot à taper pour confirmer (en majuscules ou non).
const MOT_DE_CONFIRMATION = 'SUPPRIMER';

// Clé lue au redémarrage pour afficher « Votre compte a été supprimé ».
export const CLE_COMPTE_SUPPRIME = 'minstock-compte-supprime';

// Codes qui signifient que le compte de connexion n'existe déjà plus.
const COMPTE_DEJA_SUPPRIME = ['auth/user-not-found', 'auth/user-token-expired', 'auth/user-disabled'];

let contexte = null;          // { db, auth }
let priseEnMain = false;      // l'écran de suppression a la main jusqu'au rechargement
let enCours = false;          // une tentative est en train de s'exécuter
let demandeEnvoi = false;     // la confirmation est en cours d'envoi

// ---------- Confirmation ----------

function preparerConfirmation() {
  const utilisateur = contexte && contexte.auth.currentUser;
  const parMotDePasse = methodeDeReconnexion(utilisateur) === 'motDePasse';
  element('formulaire-suppression').reset();
  element('suppression-mdp').type = 'password';
  element('suppression-bloc-mdp').hidden = !parMotDePasse;
  element('suppression-aide-google').hidden = parMotDePasse;
  afficherVue('vue-suppression');
}

// Erreur de la confirmation : rien n'a été supprimé.
function refuser(texte) {
  afficherMessage('erreur-suppression', texte);
}

async function confirmer(evenement) {
  evenement.preventDefault();
  effacerMessages();
  if (!contexte || demandeEnvoi) {
    return;
  }
  const utilisateur = contexte.auth.currentUser;
  if (!utilisateur) {
    return;
  }
  if (!element('suppression-comprendre').checked) {
    refuser('Cochez la case pour confirmer que vous avez compris. Rien n’a été supprimé.');
    element('suppression-comprendre').focus();
    return;
  }
  if (element('suppression-mot').value.trim().toUpperCase() !== MOT_DE_CONFIRMATION) {
    refuser(`Tapez le mot ${MOT_DE_CONFIRMATION} pour confirmer. Rien n’a été supprimé.`);
    element('suppression-mot').focus();
    return;
  }
  if (!navigator.onLine) {
    refuser('Pas de connexion Internet : la suppression du compte demande Internet. Rien n’a été supprimé.');
    return;
  }
  const parMotDePasse = methodeDeReconnexion(utilisateur) === 'motDePasse';
  const motDePasse = element('suppression-mdp').value;
  if (parMotDePasse && !motDePasse) {
    refuser('Saisissez votre mot de passe. Rien n’a été supprimé.');
    element('suppression-mdp').focus();
    return;
  }

  const bouton = element('bouton-confirmer-suppression');
  const texteNormal = bouton.textContent;
  demandeEnvoi = true;
  bouton.disabled = true;
  bouton.textContent = 'Vérification…';
  try {
    // 1. Reconnexion d'abord (décision 13). Pour Google, la fenêtre doit
    //    s'ouvrir directement depuis l'appui : aucune attente avant.
    try {
      if (parMotDePasse) {
        await reconnecterAvecMotDePasse(utilisateur, motDePasse);
      } else {
        await reconnecterAvecGoogle(utilisateur);
      }
    } catch (erreur) {
      console.error(erreur);
      refuser(messageErreur(erreur) + ' Rien n’a été supprimé.');
      return;
    }
    // 2. La demande, enregistrée sur le serveur (transaction).
    try {
      await demanderSuppression(contexte.db, utilisateur.uid);
    } catch (erreur) {
      console.error(erreur);
      refuser(
        'La demande n’a pas pu être enregistrée. ' + messageErreur(erreur) +
        ' Rien n’a été supprimé. Si la demande arrive malgré tout au serveur, ' +
        'la suppression commencera automatiquement.'
      );
      return;
    }
  } finally {
    demandeEnvoi = false;
    bouton.disabled = false;
    bouton.textContent = texteNormal;
    element('suppression-mdp').value = '';
  }
  // 3. La suppression commence.
  reprendreSuppression();
}

// ---------- Suppression en cours ----------

function afficherAvancement({ etape, total }) {
  const elements = total >= 2 ? 'éléments supprimés' : 'élément supprimé';
  element('suppression-avancement').textContent = `En cours : ${etape}. ${total} ${elements}.`;
}

function montrerErreur(texte) {
  afficherMessage('erreur-suppression-en-cours', texte);
  element('bouton-reessayer-suppression').hidden = false;
}

function cacherErreur() {
  element('erreur-suppression-en-cours').hidden = true;
  element('bouton-reessayer-suppression').hidden = true;
  element('formulaire-reconnexion-suppression').hidden = true;
}

// Appelé par js/app.js quand la suppression est demandée (sur cet appareil
// ou un autre), ou quand cet appareil l'avait commencée et que l'entrepôt
// n'existe plus. Ne lance qu'une tentative à la fois.
export function reprendreSuppression() {
  if (!contexte) {
    return;
  }
  priseEnMain = true;
  afficherVue('vue-suppression-en-cours');
  executer();
}

async function executer() {
  const utilisateur = contexte && contexte.auth.currentUser;
  if (!utilisateur || enCours) {
    return;
  }
  enCours = true;
  const db = contexte.db;
  cacherErreur();
  element('suppression-avancement').textContent = 'Préparation…';
  noterSuppressionCommencee(utilisateur.uid);
  try {
    await supprimerLesDonnees(db, utilisateur.uid, afficherAvancement);
  } catch (erreur) {
    console.error(erreur);
    enCours = false;
    montrerErreur(
      'La suppression s’est arrêtée. ' + messageErreur(erreur) +
      ' La suppression reprendra au retour d’Internet, ou avec le bouton « Réessayer ».'
    );
    return;
  }
  if (!contexte) {
    // Déconnexion pendant la suppression : elle reprendra à la connexion suivante.
    enCours = false;
    return;
  }
  await terminerAvecLeCompte(utilisateur);
}

// Dernière étape : le compte de connexion, puis la copie locale.
async function terminerAvecLeCompte(utilisateur) {
  // Gardé tout de suite : la déconnexion qui suit la suppression du compte
  // remet le contexte à zéro.
  const db = contexte.db;
  element('suppression-avancement').textContent = 'En cours : compte de connexion.';
  try {
    await supprimerCompteDeConnexion(utilisateur);
  } catch (erreur) {
    if (!COMPTE_DEJA_SUPPRIME.includes(erreur && erreur.code)) {
      console.error(erreur);
      enCours = false;
      if (erreur && erreur.code === 'auth/requires-recent-login') {
        demanderReconnexion(utilisateur);
      } else {
        montrerErreur('Le compte de connexion n’a pas pu être supprimé. ' + messageErreur(erreur));
      }
      return;
    }
  }
  const copieEffacee = await effacerDonneesLocales(db, utilisateur.uid);
  try {
    window.sessionStorage.setItem(CLE_COMPTE_SUPPRIME, copieEffacee ? 'complet' : 'copie-locale');
  } catch {
    // Sans stockage, le message final ne s'affichera pas : sans gravité.
  }
  // Firestore est arrêté : un rechargement repart de zéro (écran de connexion).
  window.location.reload();
}

// Firebase exige parfois une connexion récente pour supprimer le compte.
function demanderReconnexion(utilisateur) {
  const parMotDePasse = methodeDeReconnexion(utilisateur) === 'motDePasse';
  element('reconnexion-bloc-mdp').hidden = !parMotDePasse;
  element('reconnexion-mdp').value = '';
  element('formulaire-reconnexion-suppression').hidden = false;
  element('suppression-avancement').textContent =
    'Vos données sont supprimées. Il reste à supprimer votre compte de connexion.';
}

async function reconnecterPuisTerminer(evenement) {
  evenement.preventDefault();
  const utilisateur = contexte && contexte.auth.currentUser;
  if (!utilisateur || enCours) {
    return;
  }
  element('erreur-suppression-en-cours').hidden = true;
  try {
    if (methodeDeReconnexion(utilisateur) === 'motDePasse') {
      const motDePasse = element('reconnexion-mdp').value;
      if (!motDePasse) {
        afficherMessage('erreur-suppression-en-cours', 'Saisissez votre mot de passe.');
        return;
      }
      await reconnecterAvecMotDePasse(utilisateur, motDePasse);
    } else {
      await reconnecterAvecGoogle(utilisateur);
    }
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('erreur-suppression-en-cours', messageErreur(erreur));
    return;
  } finally {
    element('reconnexion-mdp').value = '';
  }
  element('formulaire-reconnexion-suppression').hidden = true;
  enCours = true;
  await terminerAvecLeCompte(utilisateur);
}

// ---------- Branchement ----------

// Vrai dès que la suppression est commencée sur cet appareil : js/app.js ne
// doit plus changer d'écran.
export function suppressionPriseEnMain() {
  return priseEnMain;
}

// À appeler une seule fois, au démarrage de l'application.
export function brancherEcranSuppression() {
  element('bouton-supprimer-compte').addEventListener('click', preparerConfirmation);
  element('bouton-annuler-suppression').addEventListener('click', () => afficherVue('vue-parametres'));
  element('formulaire-suppression').addEventListener('submit', confirmer);
  element('formulaire-suppression').addEventListener('input', () => {
    element('erreur-suppression').hidden = true;
  });
  element('bouton-reessayer-suppression').addEventListener('click', executer);
  element('formulaire-reconnexion-suppression').addEventListener('submit', reconnecterPuisTerminer);
  // Au retour d'Internet, une suppression arrêtée reprend toute seule.
  window.addEventListener('online', () => {
    if (priseEnMain && !enCours && element('formulaire-reconnexion-suppression').hidden) {
      executer();
    }
  });
}

// À appeler quand un compte est connecté.
export function demarrerEcranSuppression(db, auth) {
  contexte = { db, auth };
}

// À appeler à la déconnexion.
export function arreterEcranSuppression() {
  contexte = null;
  priseEnMain = false;
  enCours = false;
  cacherErreur();
}
