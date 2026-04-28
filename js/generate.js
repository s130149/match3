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

        moodSection.classList.add("hidden");
        playlistSection.classList.remove("hidden");

        generatePlaylist(mood);
    });
});

btnTerug.addEventListener("click", () => {
    playlistSection.classList.add("hidden");
    moodSection.classList.remove("hidden");
});

async function generatePlaylist(mood) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("Geen Spotify token gevonden");
        return;
    }

    const genre = moodGenres[mood];

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

            // 🔧 element bouwen i.p.v. innerHTML string
            const li = document.createElement("li");
            li.classList.add("playlist-item");

            const img = document.createElement("img");
            img.src = track.album.images?.[0]?.url || "../images/blank-cover.jpg";
            img.style.width = "50px";
            img.style.height = "50px";
            img.style.objectFit = "cover";

            const info = document.createElement("div");

            const title = document.createElement("span");
            title.textContent = track.name;

            const artist = document.createElement("span");
            artist.textContent = track.artists[0].name;

            const duration = document.createElement("span");
            duration.textContent = formatDuration(track.duration_ms);

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "♡";

            saveBtn.addEventListener("click", () => {
                saveBtn.classList.toggle("opgeslagen");
            });

            info.appendChild(title);
            info.appendChild(artist);

            li.appendChild(img);
            li.appendChild(info);
            li.appendChild(duration);
            li.appendChild(saveBtn);

            playlistList.appendChild(li);
        });

    } catch (error) {
        console.error("Playlist fout:", error);
    }
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}