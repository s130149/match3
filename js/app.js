import { authorizeSpotify } from './auth.js';

const loginBtn = document.querySelectorAll('.login-btn');
const mainContainer = document.querySelector('.container');

if (loginBtn) {
  loginBtn.forEach(btn => {
    btn.addEventListener('click', () => {
      authorizeSpotify();
    });
  });
}

async function fetchSpotifyData() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;

  try {
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    const [releasesResponse, recommendationsResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/search?q=year:2024&type=album&limit=4', { headers }),
      fetch('https://api.spotify.com/v1/search?q=pop&type=album&limit=6', { headers }),
      fetch('https://api.spotify.com/v1/search?q=pop&type=artist&limit=6', { headers })
    ]);

    const releasesResult = await releasesResponse.json();
    const recommendationsResult = await recommendationsResponse.json();
    const artistsResult = await artistsResponse.json();

    const formattedData =  {
      releases: releasesResult.albums.items.map(album => ({
        artistId: album.artists[0].id,
        trackId: album.id,
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
    console.error("Fout bij Spotify fetch:", error);
    return null;
  }
}

(async function getInfo() {
  const cacheKey = 'spotify_data';
  const cachedData = localStorage.getItem(cacheKey);
  const songCards = document.querySelectorAll('.card--release');
  const detailContainer = document.getElementById('detail-container');

  let data;

  if (cachedData) {
    const parsedCache = JSON.parse(cachedData);
    const isExpired = Date.now() - parsedCache.timestamp > 24 * 60 * 60 * 1000;
    
    if (!isExpired) {
      data = parsedCache.data;
    }
  }

  if (!data) {
    data = await fetchSpotifyData();
  }

  songCards.forEach((card, index) => {
    card.addEventListener('click', async () => {
        const imgUrl = card.querySelector('img').src;
        const fullTitle = card.querySelector('h3').textContent;
        
        const item = data.releases[index];

        document.getElementById('cover').src = imgUrl;
        document.getElementById('title').textContent = item.title;
        document.getElementById('artist').textContent = item.artist;

        if (detailContainer) {
          mainContainer.classList.add('detail-open');
          detailContainer.style.display = 'flex';
        }

        const token = localStorage.getItem('access_token');
        const artistId = item.artistId;

        try {
          const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const artistData = await artistResponse.json();
          const followers = artistData?.followers?.total;
          console.log(followers); 
          console.log(artistData); 
          console.log(artistId);

          if (followers) {
            document.getElementById('followers').textContent = followers.toLocaleString('nl-NL');
          } 

          if (item.trackId) {
            playTrack(item.trackId);
          }

        } catch (error) {
          console.log(error);
        }
     });
  });

  const releaseCards = document.querySelectorAll('.card--release');
  const recommendationCards = document.querySelectorAll('.card--recommendation');
  const artistCards = document.querySelectorAll('.card--artist');
  const playlistItems = document.querySelectorAll('.playlist-item');

  releaseCards.forEach((card, index) => {
    if (data.releases[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.releases[index].image;
      title.textContent = `${data.releases[index].artist} - ${data.releases[index].title}`;
    }
  });

  recommendationCards.forEach((card, index) => {
    if (data.recommendations[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.recommendations[index].image;
      title.textContent = `${data.recommendations[index].artist} - ${data.recommendations[index].title}`;
    }
  });

  artistCards.forEach((card, index) => {
    if (data.artists[index]) {
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      img.src = data.artists[index].image;
      title.textContent = `${data.artists[index].artist}`;
    }
  });

  playlistItems.forEach((item, index) => {
    const title = item.querySelector('.playlist-item__titel');
    const artist = item.querySelector('.playlist-item__artiest')
    title.textContent = `${data.releases[index].title}`;
    artist.textContent = `${data.releases[index].artist}`;
  });
})();

function playTrack(trackId) {
    const container = document.getElementById('player-container');
    container.innerHTML = `
        <iframe 
            src="https://open.spotify.com/embed/album/${trackId}?utm_source=generator&theme=0" 
            width="100%" 
            height="80" 
            frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">
        </iframe>`;
}

const closeButtons = document.querySelectorAll('.close-trigger');

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const addModal = document.getElementById('add-collection-modal');
        const deleteModal = document.getElementById('delete-collection-modal');
        const editModal = document.getElementById('edit-collection-modal');
        const quizModal = document.getElementById('quiz-modal');
        const detailWindow = document.getElementById('detail-container');

        if (addModal) addModal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
        if (editModal) editModal.style.display = 'none';
        if (quizModal) window.history.back();
        if (detailWindow) {
          mainContainer.classList.remove('detail-open');
          detailWindow.style.display = 'none';
        }
    });
});

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


