let activeSlot = 0;
let selectedItems = [null, null];
let currentResults = [];

const token = localStorage.getItem("access_token");

function openModal(slot) {
    activeSlot = slot;
    document.getElementById("modal-overlay").style.display = "flex";
    document.getElementById("modal-search").value = "";
    document.getElementById("song-list").innerHTML = "";
}

function closeModal() {
    document.getElementById("modal-overlay").style.display = "none";
}

async function filterSongs(query) {
    if (!query) return;

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track,artist&limit=5`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        currentResults = [
            ...data.tracks.items.map(t => ({ type: "track", data: t })),
            ...data.artists.items.map(a => ({ type: "artist", data: a }))
        ];

        renderResults(currentResults);

    } catch (error) {
        console.error(error);
    }
}

function renderResults(results) {
    const list = document.getElementById("song-list");
    list.innerHTML = "";

    results.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("search-item");

        let name, image;

        if (item.type === "track") {
            name = item.data.name + " - " + item.data.artists[0].name;
            image = item.data.album.images[0]?.url;
        } else {
            name = item.data.name;
            image = item.data.images[0]?.url;
        }

        div.innerHTML = `
            <img src="${image}" width="40">
            <span>${name}</span>
        `;

        div.addEventListener("click", () => selectItem(item));

        list.appendChild(div);
    });
}

async function selectItem(item) {
    selectedItems[activeSlot] = item;

    closeModal();

    renderSlots();

    if (selectedItems[0] && selectedItems[1]) {
        await compareItems();
    }
}

function renderSlots() {
    const buttons = document.querySelectorAll(".toevoegen");

    buttons.forEach((btn, index) => {
        const item = selectedItems[index];

        if (!item) return;

        let name, image;

        if (item.type === "track") {
            name = item.data.name;
            image = item.data.album.images[0]?.url;
        } else {
            name = item.data.name;
            image = item.data.images[0]?.url;
        }

        btn.innerHTML = `
            <img src="${image}" width="80">
            <p>${name}</p>
        `;
    });
}

async function compareItems() {
    const container = document.createElement("div");
    container.classList.add("compare-result");

    let stats1, stats2;

    if (selectedItems[0].type === "track" && selectedItems[1].type === "track") {

        const f1 = await getAudioFeatures(selectedItems[0].data.id);
        const f2 = await getAudioFeatures(selectedItems[1].data.id);

        stats1 = {
            popularity: selectedItems[0].data.popularity,
            energy: f1.energy,
            danceability: f1.danceability,
            tempo: f1.tempo
        };

        stats2 = {
            popularity: selectedItems[1].data.popularity,
            energy: f2.energy,
            danceability: f2.danceability,
            tempo: f2.tempo
        };

    } else if (selectedItems[0].type === "artist" && selectedItems[1].type === "artist") {

        stats1 = {
            popularity: selectedItems[0].data.popularity,
            followers: selectedItems[0].data.followers.total,
            albums: 0
        };

        stats2 = {
            popularity: selectedItems[1].data.popularity,
            followers: selectedItems[1].data.followers.total,
            albums: 0
        };

    } else {
        alert("Vergelijk alleen twee artiesten of twee nummers");
        return;
    }

    container.innerHTML = buildCompareTable(stats1, stats2);

    document.querySelector(".main").appendChild(container);
}

async function getAudioFeatures(id) {
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return await response.json();
}

function buildCompareTable(s1, s2) {
    let html = "<h2>Vergelijking</h2>";

    for (let key in s1) {
        let val1 = s1[key];
        let val2 = s2[key];

        let result1 = val1 > val2 ? "✅" : "❌";
        let result2 = val2 > val1 ? "✅" : "❌";

        html += `
            <div class="stat-row">
                <span>${key}</span>
                <span>${val1} ${result1}</span>
                <span>${val2} ${result2}</span>
            </div>
        `;
    }

    return html;
}

document.getElementById("modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
});

window.filterSongs = filterSongs;
window.openModal = openModal;
window.closeModal = closeModal;