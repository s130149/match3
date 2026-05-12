// https://developer.spotify.com/documentation/web-api/

const clientId = 'cfeb7e02981d4195b335a0f7045528ca';
const redirectUri = 'http://127.0.0.1:3000/';

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function authorizeSpotify() {
    const scope = 'user-read-private user-read-email user-follow-read';
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const codeVerifier  = generateRandomString(64);
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem('code_verifier', codeVerifier);

    const params =  {
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    }

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

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

async function getRefreshToken(){
   const refreshToken = localStorage.getItem('refresh_token');
   const url = "https://accounts.spotify.com/api/token";

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId
      }),
    }
    const body = await fetch(url, payload);
    let response = await body.json();

    localStorage.setItem('access_token', response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response.access_token;
}

export async function getProfile() {
  const savedProfile = localStorage.getItem('user_profile');

  if (savedProfile) {
    return JSON.parse(savedProfile); 
  }

  let accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    return null;
  } 

  try {
    let response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });

    if (response.status === 401){
      accessToken = await getRefreshToken();

      response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      });
    }

    const data = await response.json();

    localStorage.setItem('user_profile', JSON.stringify(data));

    return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

(async function init() {
  let accessToken = localStorage.getItem('access_token');

  if (code) {
    accessToken = await getAccessToken(code);
    localStorage.removeItem('user_profile');
    window.history.replaceState({}, document.title, redirectUri);
    if (accessToken) {
      window.location.href = "pages/home.html";
      return;
    }
  }

  if (accessToken) {
    const profile = await getProfile();
    console.log(profile);
  } 
})();

