// Page de test des règles de sécurité (décision 8).
// Elle tente des opérations autorisées et interdites sur le vrai serveur, avec
// le compte connecté, et compare la réponse au résultat attendu.
//
// Phase 3 : isolation des comptes et contrôle des champs de users/{uid}.
// Phase 4a : produits (fiche modifiable, quantité intouchable).
// Phase 4b : mouvements et lien produit-mouvement.
// Phase 6 : annulation d'une opération (identifiant « annulation-… »).
// Phase 6b : carnet de fournisseurs (règles version 6). Le fournisseur
// d'essai est créé puis supprimé à chaque passage : il ne reste rien.
//
// Le compte de test garde deux produits d'essai, archivés à la fin de chaque
// passage : ils n'apparaissent donc pas dans la liste. Chaque passage ajoute
// cinq mouvements à l'historique du compte de test (un mouvement ne peut pas
// être supprimé) ; leur somme est nulle.
//
// Décision 40 : la page étant publiée avec le site, elle ne se lance qu'avec un
// compte de test (adresse en @example.com), pour qu'un vrai entrepôt ne reçoive
// jamais de données d'essai impossibles à supprimer. Le contrôle est fait à
// l'ouverture (bouton bloqué) et de nouveau au lancement, avant toute écriture.

import { onAuthStateChanged } from '../vendor/firebase-auth.js';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from '../vendor/firebase-firestore.js';
import { demarrerFirebase } from './firebase-init.js';

const DELAI_MAX_MS = 15000;
const AUTRE_COMPTE = 'compte-de-quelqu-un-d-autre';
const ID_PRODUIT_ESSAI = 'essai-regles';
const ID_PRODUIT_AVEC_STOCK = 'essai-regles-stock';
const ID_FOURNISSEUR_ESSAI = 'essai-regles-fournisseur';
const FIN_ADRESSE_COMPTE_DE_TEST = '@example.com';
const MESSAGE_PAS_UN_COMPTE_DE_TEST =
  'Ce compte n’est pas un compte de test : les essais ne seront pas lancés. ' +
  'Cette page ne fonctionne qu’avec une adresse qui se termine par @example.com, ' +
  'pour ne jamais ajouter de données d’essai dans un vrai entrepôt.';

function element(id) {
  return document.getElementById(id);
}

// Vrai seulement pour un compte connecté dont l'adresse se termine par
// @example.com (domaine réservé aux exemples : personne ne peut y recevoir
// d'e-mail, donc aucun vrai utilisateur n'a une telle adresse).
function estUnCompteDeTest(utilisateur) {
  const adresse = utilisateur && typeof utilisateur.email === 'string'
    ? utilisateur.email.trim().toLowerCase()
    : '';
  return adresse.length > FIN_ADRESSE_COMPTE_DE_TEST.length &&
    adresse.endsWith(FIN_ADRESSE_COMPTE_DE_TEST);
}

function afficherMessage(texte) {
  const zone = element('message');
  zone.textContent = texte;
  zone.hidden = false;
}

// Exécute une opération et renvoie 'autorise', 'refuse' ou une erreur.
// Une opération de contrôle renvoie vrai ou faux : le résultat est alors
// 'vrai' ou 'faux'.
async function essayer(operation) {
  let minuterie;
  const delai = new Promise((_, rejeter) => {
    minuterie = setTimeout(() => rejeter({ code: 'pas-de-reponse' }), DELAI_MAX_MS);
  });
  try {
    const valeur = await Promise.race([operation(), delai]);
    if (typeof valeur === 'boolean') {
      return valeur ? 'vrai' : 'faux';
    }
    return 'autorise';
  } catch (erreur) {
    if (erreur && erreur.code === 'permission-denied') {
      return 'refuse';
    }
    return 'erreur : ' + (erreur && erreur.code ? erreur.code : String(erreur));
  } finally {
    clearTimeout(minuterie);
  }
}

function ajouterLigne(nom, attendu, obtenu) {
  const libelles = { autorise: 'Autorisé', refuse: 'Refusé', vrai: 'Exact', faux: 'Inexact' };
  const reussi = attendu === obtenu;
  const ligne = document.createElement('tr');

  const celluleNom = document.createElement('td');
  celluleNom.textContent = nom;

  const celluleAttendu = document.createElement('td');
  celluleAttendu.textContent = libelles[attendu];

  const celluleResultat = document.createElement('td');
  celluleResultat.dataset.resultat = reussi ? 'reussi' : 'echec';
  celluleResultat.textContent =
    (reussi ? '✅ Réussi' : '❌ Échec') + ' — ' + (libelles[obtenu] || obtenu);

  ligne.append(celluleNom, celluleAttendu, celluleResultat);
  element('resultats').append(ligne);
  return reussi;
}

// Fiche de produit valide pour une création. `modifications` remplace ou
// ajoute des champs, pour fabriquer les cas interdits.
function produitValide(modifications = {}) {
  return {
    nom: 'Produit d’essai (règles)',
    unite: 'sac',
    quantiteMilliemes: 0,
    seuilAlerteMilliemes: 1500,
    prixAchatCentimes: 12550,
    archive: false,
    dernierMouvementId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...modifications
  };
}

function essaisEntrepot(db, uid, entrepot) {
  const monEntrepot = doc(db, 'users', uid);
  const entrepotValide = {
    nomEntrepot: 'Essai',
    devise: 'HTG',
    createdAt: serverTimestamp(),
    suppressionDemandee: false
  };

  return [
    {
      nom: 'Lire son propre entrepôt',
      attendu: 'autorise',
      operation: () => getDocFromServer(monEntrepot)
    },
    {
      nom: 'Enregistrer de nouveau le même nom et la même devise',
      attendu: 'autorise',
      operation: () => updateDoc(monEntrepot, {
        nomEntrepot: entrepot.nomEntrepot,
        devise: entrepot.devise
      })
    },
    {
      nom: 'Lire l’entrepôt d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE))
    },
    {
      nom: 'Créer un entrepôt dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(doc(db, 'users', AUTRE_COMPTE), entrepotValide)
    },
    {
      nom: 'Lire un document en dehors des comptes',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'verification', 'connexion'))
    },
    {
      nom: 'Ajouter un champ non prévu à son entrepôt',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { champNonPrevu: true })
    },
    {
      nom: 'Modifier la date de création de l’entrepôt',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { createdAt: serverTimestamp() })
    },
    {
      nom: 'Choisir une devise inconnue',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { devise: 'XXX' })
    },
    {
      nom: 'Enregistrer un nom d’entrepôt vide',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: '' })
    },
    {
      nom: 'Enregistrer un nom d’entrepôt de 101 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: 'x'.repeat(101) })
    },
    {
      nom: 'Enregistrer un nom d’entrepôt qui n’est pas du texte',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { nomEntrepot: 12345 })
    },
    {
      nom: 'Demander la suppression du compte (fermé jusqu’à la phase 7)',
      attendu: 'refuse',
      operation: () => updateDoc(monEntrepot, { suppressionDemandee: true })
    },
    {
      nom: 'Supprimer son entrepôt (fermé jusqu’à la phase 7)',
      attendu: 'refuse',
      operation: () => deleteDoc(monEntrepot)
    }
  ];
}

function essaisProduits(db, uid, produitEssaiExiste) {
  const mesProduits = collection(db, 'users', uid, 'products');
  const produitEssai = doc(mesProduits, ID_PRODUIT_ESSAI);
  // Un nouvel identifiant à chaque tentative de création interdite.
  const nouveau = () => doc(mesProduits);

  const essais = [];

  // Le produit d'essai n'est créé qu'une fois : il ne peut pas être supprimé.
  if (!produitEssaiExiste) {
    essais.push({
      nom: 'Créer un produit valide (stock 0, sans mouvement)',
      attendu: 'autorise',
      operation: () => setDoc(produitEssai, produitValide())
    });
  }

  essais.push(
    {
      nom: 'Lire la liste de ses produits',
      attendu: 'autorise',
      operation: () => getDocsFromServer(query(mesProduits, where('archive', '==', false)))
    },
    {
      nom: 'Modifier la fiche d’un produit (nom, unité, seuil, prix)',
      attendu: 'autorise',
      operation: () => updateDoc(produitEssai, {
        nom: 'Produit d’essai (règles)',
        unite: 'kg',
        seuilAlerteMilliemes: 2500,
        prixAchatCentimes: 9999,
        archive: false,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier directement la quantité d’un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        quantiteMilliemes: 5000,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Augmenter la quantité sans mouvement',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        quantiteMilliemes: increment(1000),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier le dernier mouvement sans mouvement',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        dernierMouvementId: 'mouvement-invente',
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier un produit sans mettre la date à jour',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, { nom: 'Sans date' })
    },
    {
      nom: 'Modifier la date de création d’un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Ajouter un champ non prévu à un produit',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        champNonPrevu: true,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un prix négatif',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        prixAchatCentimes: -1,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un prix à virgule (non entier)',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        prixAchatCentimes: 12.5,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un seuil d’alerte négatif',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        seuilAlerteMilliemes: -1000,
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer un nom de produit vide',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, { nom: '', updatedAt: serverTimestamp() })
    },
    {
      nom: 'Enregistrer un nom de produit de 101 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        nom: 'x'.repeat(101),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Enregistrer une unité de 31 caractères',
      attendu: 'refuse',
      operation: () => updateDoc(produitEssai, {
        unite: 'x'.repeat(31),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Créer un produit avec un stock différent de 0',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ quantiteMilliemes: 5000 }))
    },
    {
      nom: 'Créer un produit avec un dernier mouvement inventé',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ dernierMouvementId: 'mouvement-invente' }))
    },
    {
      nom: 'Créer un produit déjà archivé',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ archive: true }))
    },
    {
      nom: 'Créer un produit avec une date choisie par l’appareil',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ createdAt: new Date(2000, 0, 1) }))
    },
    {
      nom: 'Créer un produit avec un champ non prévu',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ champNonPrevu: true }))
    },
    {
      nom: 'Créer un produit sans unité',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), produitValide({ unite: '' }))
    },
    {
      nom: 'Supprimer un produit',
      attendu: 'refuse',
      operation: () => deleteDoc(produitEssai)
    },
    {
      nom: 'Lire un produit d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE, 'products', ID_PRODUIT_ESSAI))
    },
    {
      nom: 'Créer un produit dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(
        doc(db, 'users', AUTRE_COMPTE, 'products', ID_PRODUIT_ESSAI),
        produitValide()
      )
    },
    {
      // Le produit d'essai disparaît ainsi de la liste. Les essais de
      // mouvements qui suivent portent donc sur un produit archivé : les
      // règles doivent les accepter (opération faite hors ligne avant
      // l'archivage sur un autre appareil).
      nom: 'Archiver un produit',
      attendu: 'autorise',
      operation: () => updateDoc(produitEssai, { archive: true, updatedAt: serverTimestamp() })
    }
  );

  return essais;
}

function essaisMouvements(db, uid, produitAvecStockExiste) {
  const mesProduits = collection(db, 'users', uid, 'products');
  const mesMouvements = collection(db, 'users', uid, 'movements');
  const produitEssai = doc(mesProduits, ID_PRODUIT_ESSAI);
  const produitAvecStock = doc(mesProduits, ID_PRODUIT_AVEC_STOCK);
  const nouvelId = () => doc(mesMouvements).id;

  // Identifiants fixés une seule fois, comme dans l'application.
  const idEntree = nouvelId();
  const idSortie = nouvelId();
  const idAjustement = nouvelId();
  // Opération à annuler, et son annulation (décisions 43 et 48).
  const idAAnnuler = nouvelId();
  const idSonAnnulation = 'annulation-' + idAAnnuler;
  let quantiteDepart = null;

  const mouvement = (idProduit, delta, type, modifications = {}) => ({
    productId: idProduit,
    nomProduit: 'Produit d’essai (règles)',
    unite: 'kg',
    deltaMilliemes: delta,
    type,
    motif: 'Essai des règles',
    auteurUid: uid,
    dateAppareil: Timestamp.now(),
    dateServeur: serverTimestamp(),
    ...modifications
  });

  // Lot d'une opération de stock, comme dans l'application. Les options
  // servent à fabriquer les cas interdits.
  function lot(options) {
    const {
      idMouvement,
      delta,
      type,
      deltaProduit = delta,
      idDansProduit = idMouvement,
      modifications = {},
      sansProduit = false,
      sansMouvement = false
    } = options;
    const ecritures = writeBatch(db);
    if (!sansProduit) {
      ecritures.update(produitEssai, {
        quantiteMilliemes: increment(deltaProduit),
        dernierMouvementId: idDansProduit,
        updatedAt: serverTimestamp()
      });
    }
    if (!sansMouvement) {
      ecritures.set(
        doc(mesMouvements, idMouvement),
        mouvement(ID_PRODUIT_ESSAI, delta, type, modifications)
      );
    }
    return ecritures.commit();
  }

  // Lot de création d'un produit avec stock de départ.
  function lotCreation(reference, stock, deltaMouvement, avecMouvement = true) {
    const idMouvement = nouvelId();
    const ecritures = writeBatch(db);
    ecritures.set(reference, produitValide({
      quantiteMilliemes: stock,
      dernierMouvementId: idMouvement
    }));
    if (avecMouvement) {
      ecritures.set(
        doc(mesMouvements, idMouvement),
        mouvement(reference.id, deltaMouvement, 'entree', { motif: 'Stock initial' })
      );
    }
    return ecritures.commit();
  }

  const lireQuantite = async () =>
    (await getDocFromServer(produitEssai)).data().quantiteMilliemes;

  const essais = [
    {
      nom: 'Entrée de 2,5 par un lot complet (sur un produit archivé)',
      attendu: 'autorise',
      operation: async () => {
        quantiteDepart = await lireQuantite();
        await lot({ idMouvement: idEntree, delta: 2500, type: 'entree' });
      }
    },
    {
      nom: 'Après l’entrée, la quantité a augmenté exactement de 2,5',
      attendu: 'vrai',
      operation: async () => (await lireQuantite()) === quantiteDepart + 2500
    },
    {
      nom: 'Renvoyer la même opération (même numéro de mouvement)',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: idEntree, delta: 2500, type: 'entree' })
    },
    {
      nom: 'Après le renvoi, la quantité n’a pas été comptée deux fois',
      attendu: 'vrai',
      operation: async () => (await lireQuantite()) === quantiteDepart + 2500
    },
    {
      nom: 'Sortie de 1 par un lot complet',
      attendu: 'autorise',
      operation: () => lot({ idMouvement: idSortie, delta: -1000, type: 'sortie' })
    },
    {
      nom: 'Ajustement de -1,5 par un lot complet',
      attendu: 'autorise',
      operation: () => lot({ idMouvement: idAjustement, delta: -1500, type: 'ajustement' })
    },
    {
      nom: 'Après +2,5 puis -1 puis -1,5, la quantité est revenue au départ',
      attendu: 'vrai',
      operation: async () => (await lireQuantite()) === quantiteDepart
    },
    {
      nom: 'Entrée de 1 (opération à annuler ensuite)',
      attendu: 'autorise',
      operation: () => lot({ idMouvement: idAAnnuler, delta: 1000, type: 'entree' })
    },
    {
      nom: 'Annuler cette entrée : ajustement de -1, numéro « annulation-… »',
      attendu: 'autorise',
      operation: () => lot({
        idMouvement: idSonAnnulation, delta: -1000, type: 'ajustement',
        modifications: { motif: 'Annulation : Entrée +1 kg' }
      })
    },
    {
      nom: 'Après l’annulation, la quantité est revenue exactement au départ',
      attendu: 'vrai',
      operation: async () => (await lireQuantite()) === quantiteDepart
    },
    {
      nom: 'Annuler une seconde fois la même opération (autre appareil)',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: idSonAnnulation, delta: -1000, type: 'ajustement',
        modifications: { motif: 'Annulation : Entrée +1 kg' }
      })
    },
    {
      nom: 'Après la seconde annulation, rien n’a été compté deux fois',
      attendu: 'vrai',
      operation: async () => (await lireQuantite()) === quantiteDepart
    },
    {
      nom: 'Créer un mouvement sans modifier le produit',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'entree', sansProduit: true })
    },
    {
      nom: 'Modifier le stock en désignant un mouvement qui n’est pas créé',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'entree', sansMouvement: true })
    },
    {
      nom: 'Modifier le stock en réutilisant un ancien mouvement de même valeur',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: idEntree, delta: 2500, type: 'entree', sansMouvement: true })
    },
    {
      nom: 'Chiffres discordants (mouvement de 2,5, stock augmenté de 5)',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'entree', deltaProduit: 5000 })
    },
    {
      nom: 'Le produit désigne un autre numéro que le mouvement créé',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'entree', idDansProduit: nouvelId() })
    },
    {
      nom: 'Mouvement visant un produit qui n’existe pas',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: nouvelId(), delta: 2500, type: 'entree', sansProduit: true,
        modifications: { productId: 'produit-inexistant' }
      })
    },
    {
      nom: 'Mouvement de valeur 0',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 0, type: 'ajustement' })
    },
    {
      nom: 'Mouvement de valeur à virgule (non entière)',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2.5, type: 'entree' })
    },
    {
      nom: 'Type de mouvement inconnu',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'cadeau' })
    },
    {
      nom: 'Entrée de valeur négative',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: -2500, type: 'entree' })
    },
    {
      nom: 'Sortie de valeur positive',
      attendu: 'refuse',
      operation: () => lot({ idMouvement: nouvelId(), delta: 2500, type: 'sortie' })
    },
    {
      nom: 'Motif de 201 caractères',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: nouvelId(), delta: 2500, type: 'entree',
        modifications: { motif: 'x'.repeat(201) }
      })
    },
    {
      nom: 'Mouvement signé par un autre auteur',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: nouvelId(), delta: 2500, type: 'entree',
        modifications: { auteurUid: AUTRE_COMPTE }
      })
    },
    {
      nom: 'Heure du serveur choisie par l’appareil',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: nouvelId(), delta: 2500, type: 'entree',
        modifications: { dateServeur: new Date(2000, 0, 1) }
      })
    },
    {
      nom: 'Mouvement avec un champ non prévu',
      attendu: 'refuse',
      operation: () => lot({
        idMouvement: nouvelId(), delta: 2500, type: 'entree',
        modifications: { champNonPrevu: true }
      })
    },
    {
      nom: 'Modifier un mouvement enregistré',
      attendu: 'refuse',
      operation: () => updateDoc(doc(mesMouvements, idEntree), { motif: 'Modifié après coup' })
    },
    {
      nom: 'Supprimer un mouvement enregistré',
      attendu: 'refuse',
      operation: () => deleteDoc(doc(mesMouvements, idEntree))
    },
    {
      nom: 'Lire ses derniers mouvements',
      attendu: 'autorise',
      operation: () => getDocsFromServer(query(mesMouvements, orderBy('dateServeur', 'desc'), limit(5)))
    },
    {
      nom: 'Lire un mouvement d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE, 'movements', 'essai'))
    },
    {
      nom: 'Créer un mouvement dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(
        doc(db, 'users', AUTRE_COMPTE, 'movements', nouvelId()),
        mouvement(ID_PRODUIT_ESSAI, 2500, 'entree')
      )
    },
    {
      nom: 'Créer un produit avec un stock de départ, sans mouvement',
      attendu: 'refuse',
      operation: () => lotCreation(doc(mesProduits), 5000, 5000, false)
    },
    {
      nom: 'Créer un produit avec un stock de 5 et un mouvement de 3',
      attendu: 'refuse',
      operation: () => lotCreation(doc(mesProduits), 5000, 3000)
    },
    {
      nom: 'Créer un produit avec un stock de départ négatif',
      attendu: 'refuse',
      operation: () => lotCreation(doc(mesProduits), -1000, -1000)
    }
  ];

  // Ce produit n'est créé qu'une fois : il ne peut pas être supprimé.
  if (!produitAvecStockExiste) {
    essais.push(
      {
        nom: 'Créer un produit avec un stock de départ de 4 et son mouvement d’entrée',
        attendu: 'autorise',
        operation: () => lotCreation(produitAvecStock, 4000, 4000)
      },
      {
        nom: 'Le produit créé a bien un stock de 4',
        attendu: 'vrai',
        operation: async () =>
          (await getDocFromServer(produitAvecStock)).data().quantiteMilliemes === 4000
      },
      {
        nom: 'Archiver ce second produit d’essai',
        attendu: 'autorise',
        operation: () => updateDoc(produitAvecStock, { archive: true, updatedAt: serverTimestamp() })
      }
    );
  }

  return essais;
}

// Carnet de fournisseurs (décisions 42, 50 et 54).
function essaisFournisseurs(db, uid) {
  const mesFournisseurs = collection(db, 'users', uid, 'suppliers');
  const fournisseurEssai = doc(mesFournisseurs, ID_FOURNISSEUR_ESSAI);
  const nouveau = () => doc(mesFournisseurs);

  // Fiche valide ; `modifications` remplace ou ajoute des champs.
  const fiche = (modifications = {}) => ({
    nom: 'Fournisseur d’essai (règles)',
    telephone: '+509 3712-3456',
    whatsapp: '(509) 3712.3456',
    email: 'essai@example.com',
    adresse: 'Rue de l’essai\nPort-au-Prince',
    produitsFournis: 'ciment, fer',
    notes: 'Essai des règles',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...modifications
  });
  const sansChamp = (champ) => {
    const resultat = fiche();
    delete resultat[champ];
    return resultat;
  };

  return [
    {
      nom: 'Créer un fournisseur valide (tous les champs)',
      attendu: 'autorise',
      operation: async () => {
        // Reste d'un passage interrompu : on repart d'une place nette.
        await deleteDoc(fournisseurEssai).catch(() => {});
        await setDoc(fournisseurEssai, fiche());
      }
    },
    {
      nom: 'Lire ses fournisseurs',
      attendu: 'autorise',
      operation: () => getDocsFromServer(query(mesFournisseurs, limit(5)))
    },
    {
      nom: 'Modifier son fournisseur (téléphone et notes)',
      attendu: 'autorise',
      operation: () => updateDoc(fournisseurEssai, {
        telephone: '3712 3456',
        notes: 'Modifié',
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Modifier la date de création d’un fournisseur',
      attendu: 'refuse',
      operation: () => updateDoc(fournisseurEssai, {
        createdAt: Timestamp.fromDate(new Date(2000, 0, 1)),
        updatedAt: serverTimestamp()
      })
    },
    {
      nom: 'Fournisseur avec un champ non prévu',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ champNonPrevu: true }))
    },
    {
      nom: 'Fournisseur sans le champ « adresse »',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), sansChamp('adresse'))
    },
    {
      nom: 'Fournisseur sans nom (nom vide)',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ nom: '' }))
    },
    {
      nom: 'Nom de fournisseur de 101 caractères',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ nom: 'x'.repeat(101) }))
    },
    {
      nom: 'Téléphone avec des lettres',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ telephone: '3712 ABCD' }))
    },
    {
      nom: 'WhatsApp de 31 caractères',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ whatsapp: '1'.repeat(31) }))
    },
    {
      nom: 'Téléphone enregistré comme un nombre',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ telephone: 37123456 }))
    },
    {
      nom: 'E-mail sans @',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ email: 'essai.example.com' }))
    },
    {
      nom: 'Notes de 1 001 caractères',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ notes: 'x'.repeat(1001) }))
    },
    {
      nom: 'Date de création choisie par l’appareil',
      attendu: 'refuse',
      operation: () => setDoc(nouveau(), fiche({ createdAt: Timestamp.fromDate(new Date(2000, 0, 1)) }))
    },
    {
      nom: 'Lire un fournisseur d’un autre compte',
      attendu: 'refuse',
      operation: () => getDocFromServer(doc(db, 'users', AUTRE_COMPTE, 'suppliers', 'essai'))
    },
    {
      nom: 'Créer un fournisseur dans un autre compte',
      attendu: 'refuse',
      operation: () => setDoc(doc(db, 'users', AUTRE_COMPTE, 'suppliers', nouveau().id), fiche())
    },
    {
      nom: 'Supprimer son fournisseur d’essai',
      attendu: 'autorise',
      operation: () => deleteDoc(fournisseurEssai)
    },
    {
      nom: 'Le fournisseur supprimé n’existe plus',
      attendu: 'vrai',
      operation: async () => !(await getDocFromServer(fournisseurEssai)).exists()
    }
  ];
}

async function lancerLesTests(db, utilisateur) {
  const bouton = element('bouton-lancer');
  // Second contrôle, avant toute lecture ou écriture (décision 40).
  if (!estUnCompteDeTest(utilisateur)) {
    bouton.disabled = true;
    afficherMessage(MESSAGE_PAS_UN_COMPTE_DE_TEST);
    return;
  }
  bouton.disabled = true;
  element('resultats').textContent = '';
  element('message').hidden = true;
  element('bilan').hidden = true;

  // Les essais portent sur l'entrepôt du compte : il doit déjà exister.
  let entrepot;
  let produitEssaiExiste;
  let produitAvecStockExiste;
  try {
    const instantane = await getDocFromServer(doc(db, 'users', utilisateur.uid));
    if (!instantane.exists()) {
      afficherMessage('Ce compte n’a pas encore d’entrepôt. Créez-le dans l’application, puis revenez.');
      bouton.disabled = false;
      return;
    }
    entrepot = instantane.data();
  } catch (erreur) {
    afficherMessage(
      'Impossible de lire l’entrepôt de ce compte (' + (erreur.code || 'erreur') + '). ' +
      'Vérifiez Internet et que les règles sont publiées.'
    );
    bouton.disabled = false;
    return;
  }
  try {
    const produit = await getDocFromServer(
      doc(db, 'users', utilisateur.uid, 'products', ID_PRODUIT_ESSAI)
    );
    produitEssaiExiste = produit.exists();
    const second = await getDocFromServer(
      doc(db, 'users', utilisateur.uid, 'products', ID_PRODUIT_AVEC_STOCK)
    );
    produitAvecStockExiste = second.exists();
  } catch (erreur) {
    afficherMessage(
      'Impossible de lire les produits de ce compte (' + (erreur.code || 'erreur') + '). ' +
      'Les règles publiées dans la console sont sans doute plus anciennes que le fichier firestore.rules.'
    );
    bouton.disabled = false;
    return;
  }

  const essais = [
    ...essaisEntrepot(db, utilisateur.uid, entrepot),
    ...essaisProduits(db, utilisateur.uid, produitEssaiExiste),
    ...essaisMouvements(db, utilisateur.uid, produitAvecStockExiste),
    ...essaisFournisseurs(db, utilisateur.uid)
  ];
  let reussis = 0;
  for (const essai of essais) {
    const obtenu = await essayer(essai.operation);
    if (ajouterLigne(essai.nom, essai.attendu, obtenu)) {
      reussis += 1;
    }
  }

  const bilan = element('bilan');
  bilan.textContent = `${reussis} essais réussis sur ${essais.length}.` +
    (produitEssaiExiste || produitAvecStockExiste
      ? ' (La création des produits d’essai n’est pas rejouée : ils existent déjà.)'
      : '');
  bilan.className = reussis === essais.length ? 'message-info' : 'message-erreur';
  bilan.hidden = false;
  bouton.disabled = false;
}

async function demarrer() {
  let firebase;
  try {
    firebase = await demarrerFirebase();
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('Firebase n’a pas pu démarrer. Rechargez la page.');
    return;
  }

  let utilisateur = null;
  onAuthStateChanged(firebase.auth, (nouvelUtilisateur) => {
    utilisateur = nouvelUtilisateur;
    element('compte').textContent = utilisateur
      ? (utilisateur.email || utilisateur.uid)
      : 'Aucun compte connecté. Connectez-vous d’abord dans l’application.';
    const compteDeTest = estUnCompteDeTest(utilisateur);
    element('bouton-lancer').disabled = !compteDeTest;
    if (utilisateur && !compteDeTest) {
      afficherMessage(MESSAGE_PAS_UN_COMPTE_DE_TEST);
    } else {
      element('message').hidden = true;
    }
  });

  element('bouton-lancer').addEventListener('click', () => {
    if (estUnCompteDeTest(utilisateur)) {
      lancerLesTests(firebase.db, utilisateur);
    }
  });
}

demarrer();
