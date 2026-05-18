// Local Storage

function getCollections() {
  return JSON.parse(localStorage.getItem('collections')) || [];
}

function saveCollections(collections) {
  localStorage.setItem('collections', JSON.stringify(collections));
}

// Render Collections

function renderNavCollections(collections) {
  const navItems = document.querySelector('.nav-collection-items');
  if (!navItems) return;

  const urlParams = new URLSearchParams(window.location.search);
  const currentId = urlParams.get('id');

  navItems.innerHTML = '';
  collections.forEach(item => {
    const isActive = String(item.id) === currentId ? 'active' : '';

    navItems.innerHTML += `
      <li class="${isActive}">
        <a href="collection-details.html?id=${item.id}">
          <img src="../images/icons/playlist.png" alt="playlist icon" class="nav-icon">
          <span>${item.name}</span>
        </a>
      </li>`;
  });
}

function renderMainCollections(collections) {
  const mainItems = document.querySelector('.main-collection-items');
  if (!mainItems) return;

  mainItems.innerHTML = `
    <a href="likes.html" class="card card--likes" id="btn-likes">
      <img src="../images/covers/likes-cover.png" alt="likes">
      <div class="card-content"><h3>gelikte liedjes</h3></div>
    </a>`;

  collections.forEach(item => {
    mainItems.innerHTML += `
      <a href="collection-details.html?id=${item.id}" class="card card--collection">
        <img src="../images/covers/default-cover.png" alt="collection" class="card-collection-cover">
        <div class="card-content"><h3>${item.name}</h3></div>
      </a>`;
  });
}

function renderCollectionDropdown(collections) {
  const dropdown = document.querySelector('#add-to-collection-dropdown');

  collections.forEach(item => {
    dropdown.innerHTML += `
      <button class="collection-option" data-id="${item.id}">
        <img src="../images/icons/playlist.png" class="nav-icon">
        <span>${item.name}</span>
      </button>`;
  });
}

// Load collections

export function loadCollections() {
  const collections = getCollections();
  renderNavCollections(collections);
  renderMainCollections(collections);
  renderCollectionDropdown(collections);
}

// Add to collection

export function addTrackToCollection(track, collectionId) {
  let collections = JSON.parse(localStorage.getItem('collections')) || [];
  
  const collectionIndex = collections.findIndex(c => c.id === parseInt(collectionId));

  if (collectionIndex !== -1) {
    const trackIndex = collections[collectionIndex].tracks.findIndex(t => t.trackId === track.trackId);

    if (trackIndex === -1) {
      collections[collectionIndex].tracks.push({
        trackId: track.trackId,
        title: track.title,
        artist: track.artist,
        image: track.image
      });
      alert(`Toegevoegd aan ${collections[collectionIndex].name}`);
    } else {
      collections[collectionIndex].tracks.splice(trackIndex, 1);
      alert(`Verwijderd uit ${collections[collectionIndex].name}`);
    }

    localStorage.setItem('collections', JSON.stringify(collections));
  }
}

// Create collection

function setupCreateCollection() {
  const addCollectionBtn = document.getElementById('add-collection-btn');
  const addCollectionModal = document.getElementById('add-collection-modal');
  const input = document.getElementById('collection-input');
  const saveBtn = document.getElementById('add-save-btn');
  const errorMsg = document.querySelector('.error');

    if (!addCollectionBtn || !addCollectionModal) return;

  addCollectionBtn.onclick = () => addCollectionModal.style.display = 'flex'; 
  
  saveBtn.onclick = (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name !== '') {
      const collections = getCollections();
      collections.push({ id: Date.now(), name: name, tracks: [] });
      saveCollections(collections);
      
      input.value = '';
      addCollectionModal.style.display = 'none';
      loadCollections();
    } else {
      input.style.border = '1px solid red';
      if (errorMsg) errorMsg.innerHTML = 'Collectie naam is vereist';
    }
  };
}

// Init

export function initCollections() {
  setupCreateCollection();
  loadCollections();
}