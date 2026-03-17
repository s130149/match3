import { authorizeSpotify } from './auth.js';

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        authorizeSpotify();
    });
}

async function getInfo() {
  const response = await fetch("../json/dataset.json");
  const data = await response.json();

  const releaseCards = document.querySelectorAll(".card--release");
  const recommendationCards = document.querySelectorAll(".card--recommendation");
  const artistCards = document.querySelectorAll(".card--artist");

  releaseCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const title = card.querySelector("h3");

    img.src = data.releases[index].image;
    title.textContent = `${data.releases[index].artist} - ${data.releases[index].songTitle}`;
  });

  recommendationCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const titles = card.querySelectorAll("h3");

    img.src = data.albums[index].image;
    titles[0].textContent = data.albums[index].title;
    titles[1].textContent = data.albums[index].artist;
  });

  artistCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const title = card.querySelector("h3");

    img.src = data.artists[index].image;
    title.textContent = data.artists[index].name;
  });
}

getInfo();

