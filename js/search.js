document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.querySelector(".search");
    const topResults = document.querySelector(".top-results");
    const artistsContainer = document.querySelector(".artists");

    const detailImage = document.querySelector(".detail-image");
    const detailInfo = document.querySelector(".detail-info");

    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                searchSpotify(searchInput.value);
            }, 400);
        });
    }

    async function searchSpotify(query) {
        if (!query.trim()) return;

        const token = localStorage.getItem("access_token");

        if (!token) {
            console.error("Geen Spotify token gevonden");
            return;
        }

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${query}&type=track,artist&limit=6`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            renderTracks(data.tracks.items);
            renderArtists(data.artists.items);

        } catch (error) {
            console.error("Zoekfout:", error);
        }
    }

    function renderTracks(tracks) {
        topResults.innerHTML = "";

        tracks.forEach(track => {
            const card = document.createElement("div");
            card.classList.add("card", "card--top");

            const image = track.album.images[0]?.url || "";

            card.innerHTML = `
                <img src="${image}" alt="${track.name}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">
            `;

            card.addEventListener("click", () => {
                showTrackDetails(track);
            });

            topResults.appendChild(card);
        });
    }

    function renderArtists(artists) {
        artistsContainer.innerHTML = "";

        artists.forEach(artist => {
            const card = document.createElement("div");
            card.classList.add("card", "card--artist");

            const image = artist.images[0]?.url || "";

            card.innerHTML = `
                <img src="${image}" alt="${artist.name}">
                <h3>${artist.name}</h3>
            `;

            card.addEventListener("click", () => {
                showArtistDetails(artist);
            });

            artistsContainer.appendChild(card);
        });
    }

    function showTrackDetails(track) {
        detailImage.innerHTML = `
            <img src="${track.album.images[0]?.url}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">
        `;

        detailInfo.innerHTML = `
            <h3 class="song-title">${track.name}</h3>
            <p>${track.artists[0].name}</p>
            <div class="detail-meta">
                <span>${track.album.name}</span>
                <span>${track.album.release_date}</span>
            </div>
            <h3>Spotify link</h3>
            <p>
                <a href="${track.external_urls.spotify}" target="_blank" style="color:white;">
                    open in Spotify
                </a>
            </p>
        `;
    }

    function showArtistDetails(artist) {
        detailImage.innerHTML = `
            <img src="${artist.images[0]?.url}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">
        `;

        detailInfo.innerHTML = `
            <h3 class="song-title">${artist.name}</h3>
            <p>Popularity: ${artist.popularity}</p>
            <div class="detail-meta">
                <span>Followers</span>
                <span>${artist.followers.total}</span>
            </div>
            <h3>Spotify link</h3>
            <p>
                <a href="${artist.external_urls.spotify}" target="_blank" style="color:white;">
                    open in Spotify
                </a>
            </p>
        `;
    }

});