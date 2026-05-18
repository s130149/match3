import { loadCollections } from './collection.js';

// Get current collection

const urlParams = new URLSearchParams(window.location.search);
const collectionId = urlParams.get('id');
const numericId = Number(collectionId);
const collections = JSON.parse(localStorage.getItem('collections')) || [];
const currentCollection = collections.find(item => item.id === numericId);

// Collection tracks

function displayCollectionTracks() {
  const tracksContainer = document.getElementById('collection-tracks-container');
  const emptyCollection = document.querySelector('.empty-collection');

  if (!tracksContainer) return;

  const tracks = currentCollection.tracks || [];

  if (tracks.length === 0) {
    tracksContainer.style.display = 'none';
    emptyCollection.style.display = 'flex';
  } else {
    tracksContainer.style.display = 'grid';
    emptyCollection.style.display = 'none';

    tracksContainer.innerHTML = '';

    tracks.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.className = 'collection-track-item';
      
      trackElement.innerHTML = `
        <div class="track-info">
          <img src="${track.image}" alt="${track.title}" class="track-img">
          <div class="track-text">
            <span class="track-title">${track.title}</span>
            <span class="track-artist">${track.artist}</span>
          </div>
        </div>
      `;

      tracksContainer.appendChild(trackElement);
    });
  }
}

// Edit collection

function setupEditCollection(){
  const collectionTitle = document.getElementById('collection-title');
  const editModal = document.getElementById('edit-collection-modal');
  const editInput = document.getElementById('edit-collection-input');
  const editError = document.querySelector('.error');
  const editBtn = document.getElementById('edit-collection-btn');
  const editBtnDropdown = document.getElementById('edit-dropdown-btn');
  const editSaveBtn = document.getElementById('edit-save-btn');

  const openEditModal = () => {
    editInput.value = currentCollection.name;
    editModal.style.display = 'flex';
  };

    editBtn?.addEventListener('click', openEditModal);
  editBtnDropdown?.addEventListener('click', openEditModal);

  editSaveBtn?.addEventListener('click', (e) => {
    e.preventDefault();

    const newName = editInput.value.trim();

    if (newName !== '') {
      currentCollection.name = newName;
      localStorage.setItem('collections', JSON.stringify(collections));
      collectionTitle.innerText = newName;
      loadCollections();

      console.log("Modal zou nu moeten sluiten");
      editModal.style.display = 'none';
    }
  });
}

// Collection details dropdown

function setupDetailsDropdown(){
  const dropdownMenu = document.querySelector('.dropdown');
  const dropdownMenuBtn = document.getElementById('collection-dropdown-btn');

  dropdownMenuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
}

// Delete collection

function setupDeleteCollection(){
  const deleteCollectionBtn = document.getElementById('delete-collection-btn');
  const deleteCollectionWindow = document.getElementById('delete-collection-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  if (deleteCollectionBtn) {
    deleteCollectionBtn?.addEventListener('click', () => {
      deleteCollectionWindow.style.display = 'flex';
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn?.addEventListener('click', () => {
      const updatedCollections = collections.filter(item => item.id !== numericId);
      localStorage.setItem('collections', JSON.stringify(updatedCollections));
      window.location.href = 'collections.html';
    });
  }
}

// Init 

export function initCollectionDetails() {
  const collectionTitle = document.getElementById('collection-title');
  if (collectionTitle) collectionTitle.innerText = currentCollection.name;

  setupEditCollection();
  setupDetailsDropdown();
  setupDeleteCollection();
  displayCollectionTracks();
}

initCollectionDetails();