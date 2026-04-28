async function loadDetail() {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const response = await fetch("../json/dataset.json");
    const data = await response.json();

    const item = data.releases.find(r => r.id == id);

    if (!item) return;

    document.getElementById("cover").src = item.image;
    document.getElementById("title").textContent = item.songTitle;
    document.getElementById("artist").textContent = item.artist;

    document.getElementById("extra").textContent =
        "Dit is een release uit je bibliotheek";

    document.getElementById("stat1").textContent =
        "Popularity: " + Math.floor(Math.random() * 100);

    document.getElementById("stat2").textContent =
        "Energy: " + Math.floor(Math.random() * 100);

    // ❤️ like knop
    const likeBtn = document.getElementById("likeBtn");

    let liked = false;

    likeBtn.addEventListener("click", () => {
        liked = !liked;
        likeBtn.textContent = liked ? "❤️ Liked" : "♡ Like";
    });
}

loadDetail();