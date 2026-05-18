// https://docs.genius.com

import { initSpotifyPlayer, playTrack } from './player.js';
import { initCollections, addTrackToCollection } from './collection.js';
import { getCachedData, saveToCache } from './cache.js';

// Global

const mainContainer = document.querySelector('.container');

let spotifyPlayer;
let progressInterval;
let currentActiveItemId = null;
let currentItemForCollection = null;

// Fetch Home Data

async function fetchSpotifyHomeData() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;

  const cacheKey = 'spotify_home_data';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('/api/spotify-home', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const formattedData = await response.json();

    if (formattedData.error) {
      console.error(formattedData.error);
      return null; 
    }

    saveToCache(cacheKey, formattedData);
    return formattedData;

  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchArtistDetails(artistId) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return response.json();
}

// Fill Home Data

function fillReleaseCards(releases) {
  document.querySelectorAll('.card--release').forEach((card, index) => {
    if (!releases[index]) return;

    const item = releases[index];

    card.dataset.id = item.trackId;

    card.querySelector('img').src = releases[index].image;
    card.querySelector('h3').textContent = `${releases[index].artist} - ${releases[index].title}`;
  });
}

function fillRecommendationCards(recommendations) {
  document.querySelectorAll('.card--recommendation').forEach((card, index) => {
    if (!recommendations[index]) return;

    const item = recommendations[index];

    card.dataset.id = item.trackId;

    card.querySelector('img').src = recommendations[index].image;
    card.querySelector('h3').textContent = `${recommendations[index].artist} - ${recommendations[index].title}`;
  });
}

function fillArtistCards(artists) {
  document.querySelectorAll('.card--artist').forEach((card, index) => {
    if (!artists[index]) return;

    card.querySelector('img').src = artists[index].image;
    card.querySelector('h3').textContent = artists[index].artist;
  });
}

function fillPlaylistItems(releases) {
  document.querySelectorAll('.playlist-item').forEach((item, index) => {
    item.querySelector('.playlist-item__titel').textContent = releases[index].title;
    item.querySelector('.playlist-item__artiest').textContent = releases[index].artist;
  });
}

async function updateHeaderUserPhoto() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return;

  const cachedData = getCachedData('spotify_profile_data');
  
  if (cachedData && cachedData.user && cachedData.user.image) {
    const headerUserPhotos = document.querySelectorAll('.user-photo');
    headerUserPhotos.forEach(img => img.src = cachedData.user.image);
  } else {
    try {
      const response = await fetch('/api/spotify-profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      const headerUserPhotos = document.querySelectorAll('.user-photo');
      headerUserPhotos.forEach(img => img.src = data.user.image);
      saveToCache('spotify_profile_data', data);
    } catch (e) {
      console.error("Kon header foto niet laden", e);
    }
  }
}

// Likes

export function toggleLike(track, likeImgElement) {
  let likes = JSON.parse(localStorage.getItem('likes')) || [];
  const index = likes.findIndex(l => l.trackId === track.trackId);

  const notLiked = '../images/icons/not-liked.png';
  const liked = '../images/icons/liked.png';

  if (index === -1) {
    likes.push({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      image: track.image
    });
    likeImgElement.src = liked;
  } else {
    likes.splice(index, 1);
    likeImgElement.src = notLiked;
  }
  
  localStorage.setItem('likes', JSON.stringify(likes));
}

function displayLikedSongs() {
  const likesContainer = document.getElementById('likes-container');
  const emptyCollection = document.querySelector('.empty-collection');

  if (!likesContainer) return;

  const likes = JSON.parse(localStorage.getItem('likes')) || [];

  if (likes.length === 0) {
    likesContainer.style.display = 'none';
    emptyCollection.style.display = 'flex';
  } else {
    emptyCollection.style.display = 'none';
    likesContainer.style.display = 'grid';

    likesContainer.innerHTML = '';

    likes.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.className = 'liked-track-item';
      
      trackElement.innerHTML = `
        <div class="track-info">
          <img src="${track.image}" alt="${track.title}" class="track-img">
          <div class="track-text">
            <span class="track-title">${track.title}</span>
            <span class="track-artist">${track.artist}</span>
          </div>
        </div>
        <button class="remove-like-btn" data-id="${track.trackId}">
          <img src="../images/icons/liked.png" alt="verwijder">
        </button>
        <p class="track-time"></p>
      `;

      trackElement.addEventListener('click', () => {
        openDetailPanel(track, track.image);
      });

      likesContainer.appendChild(trackElement);
    });
  }
}

// Details

export function openDetailPanel(item, imgUrl) {
  const detailContainer = document.getElementById('detail-container');
  const likeBtnImg = document.querySelector('#like-btn img');
  const likeBtn = document.getElementById('like-btn');
  const main = document.getElementById('home');
  const lyricsContainer = document.getElementById('lyrics-container');

  document.getElementById('cover').src = imgUrl;
  document.getElementById('title').textContent = item.title;
  document.getElementById('artist').textContent = item.artist;

  applyColor(imgUrl, main, true);
  applyColor(imgUrl, lyricsContainer, false);

  item.image = imgUrl;
  
  if (likeBtnImg){
    const likes = JSON.parse(localStorage.getItem('likes')) || [];
    const isLiked = likes.some(l => l.trackId === item.trackId);
    likeBtnImg.src = isLiked ? '../images/icons/liked.png' : '../images/icons/not-liked.png';

    const newLikeBtnImg = likeBtnImg.cloneNode(true);
    likeBtnImg.parentNode.replaceChild(newLikeBtnImg, likeBtnImg);

    newLikeBtnImg.addEventListener('click', () => {
      toggleLike(item, newLikeBtnImg);
    });
  }

  currentItemForCollection = { ...item, image: imgUrl }

  mainContainer.classList.add('detail-open');
  detailContainer.style.display = 'flex';
}

export function closeDetailPanel() {
  const detailContainer = document.getElementById('detail-container');
  if (!detailContainer) return;

  mainContainer.classList.remove('detail-open');
  detailContainer.style.display = 'none';
}

// Event listeners

function setupSongCardListeners(items, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('.song-card').forEach((card, index) => {
    const item = items[index];
    if (!item) return;

    const playBtn = card.querySelector('.play-card-btn');

    card.addEventListener('click', async () => {
      const imgUrl = card.querySelector('img').src;

      if (mainContainer.classList.contains('detail-open') && currentActiveItemId === item.trackId) {
        closeDetailPanel();
        currentActiveItemId = null;
        return;
      }

      currentActiveItemId = item.trackId;
      openDetailPanel(item, imgUrl);

      try {
        if (item.artistId) {
            await fetchArtistDetails(item.artistId);
        }
        fetchAndDisplayLyrics(item.artist, item.title);
      } catch (error) {
        console.error('Fout bij laden van artiest:', error);
      }
    });

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 

        if (item.trackId) {
          playTrack(item.trackId);
        }
      });
    }
  });
}

// Lyrics

export async function fetchAndDisplayLyrics(artist, title) {
  const content = document.getElementById('lyrics-text');
  if (!content) return;

  const cleanTitle = title.split(/ - | \(| \[/)[0].trim();
  console.log(`Zoeken naar lyrics voor: ${cleanTitle}`);

  content.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(cleanTitle)}`);
    const data = await response.json();

    if (data.lyrics) {
      let lyrics = data.lyrics;

      if (lyrics.includes("Lyrics")) {
          lyrics = lyrics.split("Lyrics").slice(1).join("Lyrics").trim();
      }

      const startIndex = lyrics.indexOf('[');
      if (startIndex !== -1) {
          lyrics = lyrics.substring(startIndex);
      } else if (lyrics.includes("Lyrics")) {
          lyrics = lyrics.split("Lyrics").slice(1).join("Lyrics").trim();
      }

      lyrics = lyrics.replace(/\d*Embed$/i, '').trim();

      content.textContent = lyrics;
      content.scrollTop = 0;
    } else {
      content.innerHTML = "Geen lyrics gevonden voor dit nummer.";
    }
  } catch (error) {
    console.error(error);
  }
}

// Close buttons

function setupCloseButtons() {
  document.querySelectorAll('.close-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const addModal = document.getElementById('add-collection-modal');
      const deleteModal = document.getElementById('delete-collection-modal');
      const editModal = document.getElementById('edit-collection-modal');
      const quizModal = document.getElementById('quiz-modal');

      if (addModal) addModal.style.display = 'none';
      if (deleteModal) deleteModal.style.display = 'none';
      if (editModal) editModal.style.display = 'none';
      if (quizModal) window.history.back();

      closeDetailPanel();
    });
  });
}

// Colorthief

export function applyColor(imageUrl, elementToChange, useGradient = true) {
  if (!elementToChange) return;

  const colorThief = new ColorThief();
  const img = new Image();
  
  img.crossOrigin = "Anonymous";
  
  img.onload = function() {
      try {
          const color = colorThief.getColor(img);
          const r = color[0];
          const g = color[1];
          const b = color[2];
          const rgb = `rgb(${r}, ${g}, ${b})`;

          if (useGradient) {
              elementToChange.style.background = `linear-gradient(180deg, ${rgb} 0%, rgba(18, 18, 18, 0.9) 35%, #121212 100%)`;
          } else {
              elementToChange.style.background = rgb;
              
              const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
              const isLightBackground = yiq >= 128;
              const textColor = (yiq >= 128) ? '#000000' : '#ffffff';

              const lyricsTitle = elementToChange.querySelector('#lyrics-title');
              const lyricsText = elementToChange.querySelector('#lyrics-text');
              const expandBtn = elementToChange.querySelector('#expand-lyrics-btn');

              if (lyricsText && lyricsTitle) {
                lyricsTitle.style.color = textColor;
                lyricsText.style.color = textColor;
              }

              if (expandBtn) {
                expandBtn.style.filter = isLightBackground ? 'invert(1)' : 'invert(0)' ;
              }
          }
      } catch (error) {
          console.log(error);
          elementToChange.style.background = `linear-gradient(180deg, #444 0%, #121212 100%)`;
      }
  };

  img.src = imageUrl;
}

// Collection dropdown

function setupCollectionDropdown() {
  const dropdownMenuBtn = document.querySelector('.add-to-collection-dropdown-btn');
  const dropdownMenu = document.getElementById('add-to-collection-dropdown');

  dropdownMenuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  if (dropdownMenu) {
    dropdownMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.collection-option');
      
      if (option && currentItemForCollection) {
        const colId = option.dataset.id;
        
        addTrackToCollection(currentItemForCollection, colId);
        
        dropdownMenu.classList.remove('show');
      }
    });
  }
}

// Init

(async function init() {
  const data = getCachedData('spotify_home_data') || await fetchSpotifyHomeData();
  if (!data) return;

  fillReleaseCards(data.releases);
  fillRecommendationCards(data.recommendations);
  fillArtistCards(data.artists);
  fillPlaylistItems(data.releases);
  
  setupSongCardListeners(data.releases, '#releases'); 
  setupSongCardListeners(data.recommendations, '#recommendations');

  initCollections();
  initSpotifyPlayer();

  updateHeaderUserPhoto();

  setupCloseButtons();
  displayLikedSongs();
  setupCollectionDropdown();
})();