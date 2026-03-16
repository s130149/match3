const clientId = "cfeb7e02981d4195b335a0f7045528ca";
const redirectUri = "http://127.0.0.1:5500/index.html";

const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export async function authorizeSpotify() {
  const scope = "user-read-private user-read-email user-library-read";
  const authUrl = new URL("https://accounts.spotify.com/authorize");

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  window.localStorage.setItem("code_verifier", codeVerifier);

  const params = {
    response_type: "code",
    client_id: clientId,
    scope,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
}

async function getAccessToken(code) {
  const codeVerifier = localStorage.getItem("code_verifier");

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    payload,
  );
  const data = await response.json();

  localStorage.setItem("access_token", data.access_token);
  return data.access_token;
}

async function getProfile() {
  let accessToken = localStorage.getItem("access_token");

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const data = await response.json();
  return data;
}

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get("code");

async function init() {
  let accessToken = localStorage.getItem("access_token");

  if (code && !accessToken) {
    accessToken = await getAccessToken(code);

    window.history.replaceState({}, document.title, redirectUri);
  }

  if (accessToken) {
    const profile = await getProfile(accessToken);
    console.log("Spotify profiel:", profile);
  }
}

init();
