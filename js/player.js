// https://developer.spotify.com/documentation/web-playback-sdk

let spotifyPlayer;
let progressInterval;

export function initSpotifyPlayer() {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const token = localStorage.getItem('access_token');

    spotifyPlayer = new Spotify.Player({
      name: 'Music Match',
      getOAuthToken: cb => cb(token),
      volume: 0.5,
      play: true
    });

    spotifyPlayer.addListener('initialization_error', ({ message }) => console.error(message));
    spotifyPlayer.addListener('authentication_error', ({ message }) => console.error(message));
    spotifyPlayer.addListener('account_error', ({ message }) => console.error(message));

    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      localStorage.setItem('device_id', device_id);

      setupUIControls();
    });

    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state || !state.track_window) return;
      updatePlayerUI(state);
    });

    spotifyPlayer.connect();
  };
}

function setupUIControls() {
  const playPauseBtn = document.getElementById('play-pause-btn');

  if (playPauseBtn || playPauseCardBtn) {
    playPauseBtn.onclick = () => spotifyPlayer.togglePlay();
  }

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.addEventListener('input', async (e) => {
      const state = await spotifyPlayer.getCurrentState();
      if (!state) return;

      const newPosition = (e.target.value / 100) * state.duration;
      spotifyPlayer.seek(newPosition);
    });
  }

  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volumeValue = e.target.value / 100;
      
      if (spotifyPlayer) {
        spotifyPlayer.setVolume(volumeValue).then(() => {
          console.log(`Volume aangepast naar: ${volumeValue}`);
        });
      }
      
      const percentage = e.target.value;
      volumeSlider.style.background = `linear-gradient(to right, #d4ff3f ${percentage}%, #4f4f4f ${percentage}%)`;
    });
  }
}

function updatePlayerUI(state) {
  const currentTrack = state.track_window.current_track;
  const isPaused = state.paused;
  const currentTrackId = currentTrack.id;
  
  const title = document.getElementById('player-title');
  const artist = document.getElementById('player-artist');
  const img = document.getElementById('player-img');

  if (title) title.textContent = currentTrack.name;
  if (artist) artist.textContent = currentTrack.artists[0].name;
  if (img) img.src = currentTrack.album.images[0].url;

  updateAllCardButtons(currentTrackId, isPaused);

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    updateProgress(state, progressBar);
  }

  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    const icon = playPauseBtn.querySelector('img');
    if (icon) {
      icon.src = state.paused ? `../images/icons/play.png` : `../images/icons/pause.png`;
    }
  }
}

function updateAllCardButtons(playingTrackId, isPaused) {
  const allCards = document.querySelectorAll('.song-card');

  allCards.forEach(card => {    const cardTrackId = card.dataset.id;
    const playBtnImg = card.querySelector('.play-card-btn img');

    if (cardTrackId === playingTrackId) {
      card.classList.add('is-playing');
      if (playBtnImg) {
        playBtnImg.src = isPaused ? '../images/icons/play-card-btn.png' : '../images/icons/pause-card-btn.png';
      }
    } else {
      card.classList.remove('is-playing');
      if (playBtnImg) {
        playBtnImg.src = '../images/icons/play-card-btn.png';
      }
    }
  });
}

function updateProgress(state, progressBar) {
  clearInterval(progressInterval);

  const updateBarColor = (position, duration) => {
    const percentage = (position / duration) * 100;
    progressBar.value = percentage;
    progressBar.style.background = `linear-gradient(to right, #d4ff3f ${percentage}%, #4f4f4f ${percentage}%)`;
  };

  if (!state.paused) {
    let startTime = Date.now();
    let startPos = state.position;

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPos = startPos + elapsed;
      
      updateBarColor(currentPos, state.duration);

      if (currentPos >= state.duration) {
        clearInterval(progressInterval);
      }
    }, 30);
  } else {
    updateBarColor(state.position, state.duration);
  }
}

export async function playTrack(trackId) {
  const state = await spotifyPlayer.getCurrentState();
  const currentTrackId = state?.track_window?.current_track?.id;

  if (currentTrackId === trackId) {
    spotifyPlayer.togglePlay();
  } else {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('access_token');
    const trackUri = `spotify:track:${trackId}`;

    if (spotifyPlayer) {
        spotifyPlayer.activateElement();
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
  }
}