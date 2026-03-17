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

  // recommendations

  const recommendationCards = document.querySelectorAll(".card--recommendation");

  recommendationCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const titles = card.querySelectorAll("h3");

    img.src = data.albums[index].image;
    titles[0].textContent = data.albums[index].title;
    titles[1].textContent = data.albums[index].artist;
  });

  // artists 

  const artistCards = document.querySelectorAll(".card--artist");

  artistCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const title = card.querySelector("h3");

    img.src = data.artists[index].image;
    title.textContent = data.artists[index].name;
  });

  // releases

  const releaseCards = document.querySelectorAll(".card--release");

  releaseCards.forEach((card, index) => {
    const img = card.querySelector("img");
    const title = card.querySelector("h3");

    img.src = data.releases[index].image;
    title.textContent = `${data.releases[index].artist} - ${data.releases[index].songTitle}`;
  });

  // playlists

  const playlistItems = document.querySelectorAll(".playlist-item");

  playlistItems.forEach((item, index) => {
    const title = item.querySelector(".playlist-item__titel");
    const artist = item.querySelector(".playlist-item__artiest");

    title.textContent = `${data.releases[index].songTitle}`;
    artist.textContent = `${data.releases[index].artist}`;
  });
}

getInfo();

