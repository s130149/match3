const searchInput = document.querySelector(".search");
const searchTitle = document.getElementById("search-input");
const resultsList = document.getElementById("results-list");

let debounceTimer;

window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");

    if (query) {
        searchInput.value = query;
        searchTitle.textContent = query;
        searchSpotify(query);
    }
});

searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    const query = searchInput.value.trim();

    debounceTimer = setTimeout(() => {
        if (query === "") {
            searchTitle.textContent = "";
            resultsList.innerHTML = "";
            return;
        }

        searchTitle.textContent = query;
        window.history.replaceState(null, "", `search.html?q=${encodeURIComponent(query)}`);
        searchSpotify(query);
    }, 1000);
});

async function searchSpotify(query) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        resultsList.innerHTML = "<p>Je moet eerst inloggen met Spotify.</p>";
        return;
    }

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist&limit=10`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        renderResults(data);
    } catch (error) {
        console.error("Fout bij zoeken:", error);
        resultsList.innerHTML = "<p>Er ging iets mis bij het zoeken.</p>";
    }
}

function renderResults(data) {
    resultsList.innerHTML = "";

    const tracks = data.tracks.items;
    const artists = data.artists.items;

    tracks.forEach(track => {
        const image = track.album.images[0]?.url || "../images/blank-cover.jpg";

        resultsList.innerHTML += `
            <div class="search-result-item">
                <img src="${image}" alt="${track.name}">
                <div>
                    <h3>${track.name}</h3>
                    <p>${track.artists[0].name} • nummer</p>
                </div>
            </div>
        `;
    });

    artists.forEach(artist => {
        const image = artist.images[0]?.url || "../images/default_profile.jpg";

        resultsList.innerHTML += `
            <div class="search-result-item">
                <img src="${image}" alt="${artist.name}">
                <div>
                    <h3>${artist.name}</h3>
                    <p>artiest</p>
                </div>
            </div>
        `;
    });

    if (tracks.length === 0 && artists.length === 0) {
        resultsList.innerHTML = "<p>Geen resultaten gevonden.</p>";
    }
}