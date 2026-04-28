import { loadCollections } from './collection.js';

const urlParams = new URLSearchParams(window.location.search);
const collectionId = urlParams.get('id');
const numericId = Number(collectionId);
const collections = JSON.parse(localStorage.getItem('collections')) || [];

const currentCollection = collections.find(item => item.id === numericId);

if (currentCollection) {
    document.getElementById('collection-title').innerText = currentCollection.name;
}

const dropdownMenuBtn = document.getElementById('collection-dropdown-btn');
const dropdownMenu = document.getElementById('collection-dropdown');

const deleteCollectionBtn = document.getElementById('delete-dropdown-btn');
const deleteCollectionWindow = document.getElementById('delete-collection-modal');

const editModal = document.getElementById('edit-collection-modal');
const editInput = document.getElementById('edit-collection-input');
const editError = document.querySelector('.error'); 
const editBtn = document.getElementById('edit-collection-btn')
const editBtnDropdown = document.getElementById('edit-dropdown-btn');
const editSaveBtn = document.getElementById('edit-save-btn');

const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Collectie bewerken 

const openEditModal = () => {
    if (currentCollection) {
        editInput.value = currentCollection.name;
        editModal.style.display = 'flex';
    }
};

editBtn?.addEventListener('click', openEditModal);
editBtnDropdown?.addEventListener('click', openEditModal);

editSaveBtn?.addEventListener('click', () => {
    const newName = editInput.value;
    if (newName !== "") {
        currentCollection.name = newName;
        localStorage.setItem('collections', JSON.stringify(collections));
        
        document.getElementById('collection-title').innerText = newName;

        loadCollections();

        editModal.style.display = 'none';
    }
});

// Collectie verwijderen 

deleteCollectionBtn.addEventListener('click', () => {
    deleteCollectionWindow.style.display = 'flex';
})

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        const list = JSON.parse(localStorage.getItem('collections')) || [];
        const updatedCollections = collections.filter(item => item.id !== numericId);
        localStorage.setItem('collections', JSON.stringify(updatedCollections));
        window.location.href = "collections.html";
    })
}

// Dropdown menu openen

dropdownMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
})

window.addEventListener('click', () => {
    if (dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
    }
})