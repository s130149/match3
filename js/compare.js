const songs = [
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Shape of You", artist: "Ed Sheeran" },
];

let activeSlot = 0;

function openModal(slot) {
  activeSlot = slot;
  document.getElementById("modal-overlay").style.display = "flex";
  document.getElementById("modal-search").value = "";
  renderSongs(songs);
}

function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}

function selectSong(song) {
  console.log(`Slot ${activeSlot}:`, song);
  closeModal();
}

document
  .getElementById("modal-overlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });