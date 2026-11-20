// Petites fonctions d'affichage partagées par tous les écrans.

export function element(id) {
  return document.getElementById(id);
}

// Identifiant de l'écran actuellement visible.
export function vueActuelle() {
  const vue = document.querySelector('[data-vue]:not([hidden])');
  return vue ? vue.id : null;
}

export function effacerMessages() {
  for (const message of document.querySelectorAll('.message-erreur, .message-info')) {
    message.hidden = true;
    message.textContent = '';
  }
}

// Affiche un écran et masque les autres. Sans effet si l'écran est déjà visible.
export function afficherVue(id) {
  if (vueActuelle() === id) {
    return;
  }
  for (const vue of document.querySelectorAll('[data-vue]')) {
    vue.hidden = vue.id !== id;
  }
  // Prévient la barre de navigation et le bouton ⚙ (décision 74).
  document.dispatchEvent(new CustomEvent('vue-changee', { detail: id }));
  effacerMessages();
  // Place le lecteur d'écran et le clavier au début du nouvel écran.
  const titre = element(id).querySelector('h2');
  if (titre) {
    titre.tabIndex = -1;
    titre.focus();
  }
  window.scrollTo(0, 0);
}

// Texte comparable pour une recherche : sans majuscules ni accents, espaces et
// apostrophes uniformisés (décision 46). Sert aux produits et aux fournisseurs.
export function normaliserPourRecherche(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, '\'')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Affiche un texte dans une zone de message (toujours comme du texte, jamais
// comme du HTML).
export function afficherMessage(id, texte) {
  const zone = element(id);
  zone.textContent = texte;
  zone.hidden = false;
}
