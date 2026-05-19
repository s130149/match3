import { authorizeSpotify } from './auth.js';

const loginButton = document.getElementById('login-btn');

if (loginButton) {
  loginButton.addEventListener('click', () => {
    authorizeSpotify();
  });
}