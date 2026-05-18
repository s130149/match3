
import { toggleLike,  fetchArtistDetails, openDetailPanel, closeDetailPanel, fetchAndDisplayLyrics } from './app.js';
import { initSpotifyPlayer, playTrack } from './player.js';
import { getCachedData, saveToCache } from './cache.js';

// Global

const mainContainer = document.querySelector('.container');

let spotifyPlayer;
let progressInterval;
let currentActiveItemId = null;

// Fetch Profile Data

async function fetchSpotifyProfileData() {
    const token = localStorage.getItem('access_token');
    const cacheKey = 'spotify_profile_data';
    if (!token) return null;

    try {
        const response = await fetch('/api/spotify-profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json(); 
        
        saveToCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error("Fout bij ophalen profiel:", error);
        return null;
    }
}

// Fill Profile Data

function fillUserHeader(user) {
    const userName = document.querySelector('.username');
    const profileUserPhotos = document.querySelectorAll('.user-photo');

    const followersSpan = document.getElementById('followers-count');
    const followingSpan = document.getElementById('following-count');

    if (userName) userName.textContent = user.name;

    if (followersSpan) followersSpan.textContent = user.followers;
    if (followingSpan) followingSpan.textContent = user.following;
    
    profileUserPhotos.forEach(photo => {
        photo.src = user.image;
    });
}

function fillFollowedArtistsCards(artists) {
    const cards = document.querySelectorAll('.card--followed-artist');
    cards.forEach((card, index) => {
        if (!artists[index]) {return;}

        card.querySelector('img').src = artists[index].image;
        card.querySelector('h3').textContent = artists[index].name;
    });
}

function fillRecentTracksCards(tracks) {
    const cards = document.querySelectorAll('.card--recent-track');
    cards.forEach((card, index) => {
        if (!tracks[index]) return;

        card.dataset.id = tracks[index].trackId;

        card.querySelector('img').src = tracks[index].image;
        card.querySelector('h3').textContent = `${tracks[index].artist} - ${tracks[index].title}`;
    });
}

// Event Listeners

function setupRecentTrackCardListeners(releases) {
  document.querySelectorAll('.card--recent-track').forEach((card, index) => {
    const item = releases[index];
    const playBtn = card.querySelector('.play-card-btn');

    card.addEventListener('click', async () => {
      const imgUrl = card.querySelector('img').src;
      const detailContainer = document.getElementById('detail-container');

      if (mainContainer.classList.contains('detail-open') && currentActiveItemId === item.trackId) {
        closeDetailPanel();
        currentActiveItemId = null;
        return;
      }

      currentActiveItemId = item.trackId;
      openDetailPanel(item, imgUrl);

      try {
        const artistData = await fetchArtistDetails(item.artistId);
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

// Colorthief

function applyProfileColor(imageUrl, elementToChange) {
    if (!elementToChange) return;
    
    const colorThief = new ColorThief();
    const img = new Image();
    
    img.crossOrigin = "Anonymous";
    
    img.onload = function() {
        try {
            const color = colorThief.getColor(img);
        
            const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

            elementToChange.style.background = `linear-gradient(180deg, ${rgb} 0%, rgba(18, 18, 18, 0.9) 35%, #121212 100%)`;
        } catch (error) {
            console.error(error);
            elementToChange.style.background = `linear-gradient(180deg, #444 0%, #121212 100%)`;
        }
    };

    img.src = imageUrl;
}

// Init

(async function init() {
    const data = getCachedData('spotify_profile_data') || await fetchSpotifyProfileData();
    if (!data) return;

    const profileHeader = document.getElementById('profile');
    const userImage = data.user.image;
    
    if (userImage && profileHeader) {
        applyProfileColor(userImage, profileHeader);
    }

    fillUserHeader(data.user);
    fillFollowedArtistsCards(data.followedArtists);
    fillRecentTracksCards(data.recent);
    setupRecentTrackCardListeners(data.recent);
})();