import { authorizeSpotify } from "./auth.js";

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
  const token = localStorage.getItem("access_token");

  authorizeSpotify();
});
