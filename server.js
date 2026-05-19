const express = require("express");
const path = require("path");
const Genius = require("genius-lyrics");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const redirectUri = "http://127.0.0.1:3000/";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const geniusClient = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN);

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Spotify Token

app.post("/api/token", async (req, res) => {
  const { code, code_verifier } = req.body;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString(
          "base64",
        ),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      code_verifier: code_verifier,
    }),
  });

  const data = await response.json();
  res.json(data);
});

// Spotify Data

app.get("/api/spotify-home", async (req, res) => {
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(401).json({ error: "Geen toegangstoken gevonden" });
  }

  const headers = { Authorization: accessToken };

  try {
    const [releasesRes, recommendationsRes, artistsRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/search?q=tag:new&type=album&limit=4", {
        headers,
      }),
      fetch(
        "https://api.spotify.com/v1/search?q=genre:pop&type=track&limit=6",
        { headers },
      ),
      fetch(
        "https://api.spotify.com/v1/search?q=genre:pop&type=artist&limit=6",
        { headers },
      ),
    ]);

    const releasesResult = await releasesRes.json();
    const recommendationsResult = await recommendationsRes.json();
    const artistsResult = await artistsRes.json();

    const formattedData = {
      releases: await Promise.all(
        releasesResult.albums.items.map(async (album) => {
          const tracksResponse = await fetch(
            `https://api.spotify.com/v1/albums/${album.id}/tracks`,
            { headers },
          );
          const tracksData = await tracksResponse.json();
          const firstTrack = tracksData.items[0];

          return {
            artistId: album.artists[0].id,
            trackId: firstTrack.id,
            image: album.images[0].url,
            artist: album.artists[0].name,
            title: firstTrack.name,
          };
        }),
      ),
      recommendations: recommendationsResult.tracks.items.map((track) => ({
        trackId: track.id,
        image: track.album.images[0].url,
        artist: track.artists[0].name,
        title: track.name,
      })),
      artists: (artistsResult.artists?.items || artistsResult.items || []).map(
        (artist) => ({
          image: artist.images?.[0]?.url || "",
          artist: artist.name,
        }),
      ),
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Fout bij Spotify fetch:", error);
  }
});

app.get("/api/spotify-profile", async (req, res) => {
  const accessToken = req.headers.authorization;
  if (!accessToken) return res.status(401).json({ error: "Geen token" });

  const headers = { Authorization: accessToken };

  try {
    const [profileRes, topTracksRes, followedArtistsRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me", { headers }),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=10", { headers }),
      fetch("https://api.spotify.com/v1/me/following?type=artist&limit=6", {
        headers,
      }),
    ]);

    const profile = await profileRes.json();
    const topTracks = await topTracksRes.json();
    const followed = await followedArtistsRes.json();

    const formattedProfile = {
      user: {
        name: profile.display_name,
        image: profile.images?.[0]?.url || "",
        followers: profile.followers.total,
        following: followed.artists.total,
      },
      recent: topTracks.items.map((track) => ({
        trackId: track.id,
        title: track.name,
        artist: track.artists[0].name,
        image: track.album.images[0].url,
      })),
      followedArtists: followed.artists.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || "",
      })),
    };

    res.json(formattedProfile);
  } catch (error) {
    console.error("Fout bij profiel fetch:", error);
  }
});

// Deezer Quiz Data

app.get("/api/quiz-data", async (req, res) => {
  try {
    const { query, index } = req.query;
    const deezerUrl = `https://api.deezer.com/search?q=${query}&index=${index || 0}`;

    const response = await fetch(deezerUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Fout bij Deezer fetch:", error);
    res.status(500).json({ error: "Fout bij ophalen Deezer data" });
  }
});

// Genius Lyrics

app.get("/api/lyrics", async (req, res) => {
  const { artist, title } = req.query;

  try {
    const searches = await geniusClient.songs.search(`${artist} ${title}`);

    if (searches.length === 0) {
      return res.json({ lyrics: "Geen lyrics gevonden." });
    }

    const lyrics = await searches[0].lyrics();
    res.json({ lyrics });
  } catch (error) {
    console.error("Genius fout:", error);
    res.status(500).json({ error: "Fout bij ophalen lyrics" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
