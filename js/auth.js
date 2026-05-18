// https://developer.spotify.com/documentation/web-api/

// Config

const clientId = 'cfeb7e02981d4195b335a0f7045528ca';
const redirectUri = 'http://127.0.0.1:3000/';

// PKCE

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Autorisation

export async function authorizeSpotify() {
  const scope = 'user-read-private user-read-email user-follow-read user-top-read streaming user-read-playback-state user-modify-playback-state';
  const authUrl = new URL('https://accounts.spotify.com/authorize');

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  localStorage.setItem('code_verifier', codeVerifier);

  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  }).toString();

  window.location.href = authUrl.toString();
}

// Tokens

async function getAccessToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');

  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: code,
      code_verifier: codeVerifier
    })
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    return data.access_token;
  }

  return null;
}

async function getRefreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId
    })
  });

  const data = await response.json();

  localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

  return data.access_token;
}

// Fetch Login Data

export async function fetchUserData() {
  const savedProfile = localStorage.getItem('user_profile');
  if (savedProfile) return JSON.parse(savedProfile);

  let accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;

  try {
    let response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });

    if (response.status === 401) {
      accessToken = await getRefreshToken();
      response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: 'Bearer ' + accessToken }
      });
    }

    const data = await response.json();
    localStorage.setItem('user_profile', JSON.stringify(data));
    return data;

  } catch (error) {
    console.error('Fout bij ophalen profiel:', error);
    return null;
  }
}

// Init

(async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  let accessToken = localStorage.getItem('access_token');

  if (code) {
    accessToken = await getAccessToken(code);
    localStorage.removeItem('user_profile');
    window.history.replaceState({}, document.title, redirectUri);

    if (accessToken) {
      window.location.href = 'pages/home.html';
      return;
    }
  }

  if (accessToken) {
    const profile = await fetchUserData();
    console.log(profile);
  }
})();