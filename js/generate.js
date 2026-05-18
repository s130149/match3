const moodButtons = document.querySelectorAll(".card--mood");
const moodSection = document.getElementById("mood-section");
const playlistSection = document.getElementById("playlist-section");
const playlistMoodLabel = document.getElementById("playlist-mood-label");
const playlistList = document.getElementById("playlist-lijst");
const btnTerug = document.getElementById("btn-terug");

const moodGenres = {
    chill: "chill",
    focus: "focus",
    party: "party",
    sad: "sad",
    workout: "workout",
    aangepast: "pop"
};

moodButtons.forEach(button => {
    button.addEventListener("click", () => {
        const mood = button.dataset.mood;

        playlistMoodLabel.textContent = mood;
        moodSection.style.display = "none";
        playlistSection.style.display = "block";

        generatePlaylist(mood);
    });
});

btnTerug.addEventListener("click", () => {
    playlistSection.style.display = "none";
    moodSection.style.display = "block";
});

async function generatePlaylist(mood) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        playlistList.innerHTML = "<li>Je moet eerst inloggen met Spotify.</li>";
        return;
    }

    const genre = moodGenres[mood];

    playlistList.innerHTML = "<li>Playlist wordt geladen...</li>";

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${genre}&type=track&limit=10`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        playlistList.innerHTML = "";

        data.tracks.items.forEach((track, index) => {
            const li = document.createElement("li");
            li.classList.add("playlist-item");

            li.innerHTML = `
                <span class="playlist-item__nummer">${index + 1}</span>
                <img class="playlist-item__cover" src="${track.album.images[0]?.url || "../images/blank-cover.jpg"}" alt="${track.name}">
                <div class="playlist-item__info">
                    <span class="playlist-item__titel">${track.name}</span>
                    <span class="playlist-item__artiest">${track.artists[0].name}</span>
                </div>
                <span class="playlist-item__duur">${formatDuration(track.duration_ms)}</span>
                <button class="playlist-item__opslaan" aria-label="opslaan">♡</button>
            `;

            const saveBtn = li.querySelector(".playlist-item__opslaan");

            saveBtn.addEventListener("click", () => {
                saveBtn.classList.toggle("opgeslagen");

                if (saveBtn.classList.contains("opgeslagen")) {
                    saveBtn.textContent = "♥";
                } else {
                    saveBtn.textContent = "♡";
                }
            });

            playlistList.appendChild(li);
        });

    } catch (error) {
        console.error("Playlist fout:", error);
        playlistList.innerHTML = "<li>Er ging iets mis bij het genereren van de playlist.</li>";
    }
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}