import { authorizeSpotify } from './auth.js';

const loginBtn = document.getElementById('login-btn');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        authorizeSpotify();
    });
}

(async function getInfo() {
  const cacheKey = 'spotify_data';
  let data;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp < oneDay) {
      data = parsed.data;
    }
  }

  if (!data) {
    data = await fetchSpotifyData();
  }

  if (!data || !data.releases || !data.recommendations) return;

  // Releases 

  const releaseCards = document.querySelectorAll('.card--release');
  releaseCards.forEach((card, index) => {
    if (data.releases[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.releases[index].image;
      title.textContent = `${data.releases[index].artist} - ${data.releases[index].title}`;
    }
  });

  // Suggesties

  const recommendationCards = document.querySelectorAll('.card--recommendation');
  recommendationCards.forEach((card, index) => {
    if (data.recommendations[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.recommendations[index].image;
      title.textContent = `${data.recommendations[index].artist} - ${data.recommendations[index].title}`;
    }
  });

  // Artiesten

  const artistCards = document.querySelectorAll('.card--artist');
  artistCards.forEach((card, index) => {
    if (data.artists[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.artists[index].image;
      title.textContent = `${data.artists[index].artist}`;
    }
  });

  // Collecties

  const playlistItems = document.querySelectorAll('.playlist-item');
  playlistItems.forEach((item, index) => {
    const title = item.querySelector('.playlist-item__titel');
    const artist = item.querySelector('.playlist-item__artiest')
    title.textContent = `${data.releases[index].title}`;
    artist.textContent = `${data.releases[index].artist}`;
  });
})();

async function fetchSpotifyData() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;

  try {

    // Releases 

    const releasesResponse = await fetch('https://api.spotify.com/v1/search?q=year:2024&type=album&limit=4', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const releasesResult = await releasesResponse.json();

    // Suggesties

    const recommendationsResponse = await fetch('https://api.spotify.com/v1/search?q=pop&type=album&limit=6', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const recommendationsResult = await recommendationsResponse.json();

    // Artiesten

    const artistsResponse = await fetch('https://api.spotify.com/v1/search?q=pop&type=artist&limit=6', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const artistsResult = await artistsResponse.json();

    const formattedData =  {
      releases: releasesResult.albums.items.map(album => ({
        image: album.images[0].url,
        artist: album.artists[0].name,
        title: album.name
      })),
      recommendations: recommendationsResult.albums.items.map(album => ({
        image: album.images[0].url,
        artist: album.artists[0].name,
        title: album.name
      })),
      artists: artistsResult.artists.items.map(artist => ({
        image: artist.images[0].url,
        artist: artist.name
      }))
    };

    localStorage.setItem('spotify_data', JSON.stringify({
      data: formattedData,
      timestamp: Date.now()
    }));

    return formattedData;

  } catch (error) {
    console.error("Netwerkfout:", error);
    return null;
  }
}

// Modals sluiten 

const closeButtons = document.querySelectorAll('.close-trigger');

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const addModal = document.getElementById('add-collection-modal');
        const deleteModal = document.getElementById('delete-collection-modal');
        const editModal = document.getElementById('edit-collection-modal');
        const quizModal = document.getElementById('quiz-modal');

        if (addModal) addModal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
        if (editModal) editModal.style.display = 'none';
        if (quizModal) window.history.back();
    });
});

// Search 

window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search');

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query !== '') {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    const searchDisplay = document.getElementById('search-input');

    if (searchDisplay) {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q');

      if (query) {
        searchDisplay.innerText = query;
      }
    }
});


