import { authorizeSpotify } from './auth.js';

const loginButton = document.getElementById('login-btn');

if (loginButton) {
  loginButton.addEventListener('click', () => {
    console.log("Login knop met ID geklikt!");
    authorizeSpotify();
  });
}