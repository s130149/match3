import { authorizeSpotify } from './auth.js';

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        authorizeSpotify();
    });
}