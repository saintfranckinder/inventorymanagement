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
  effacerMessages();
  // Place le lecteur d'écran et le clavier au début du nouvel écran.
  const titre = element(id).querySelector('h2');
  if (titre) {
    titre.tabIndex = -1;
    titre.focus();
  }
  window.scrollTo(0, 0);
}

// Affiche un texte dans une zone de message (toujours comme du texte, jamais
// comme du HTML).
export function afficherMessage(id, texte) {
  const zone = element(id);
  zone.textContent = texte;
  zone.hidden = false;
}
