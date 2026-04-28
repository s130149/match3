const addCollectionBtn = document.getElementById('add-collection-btn');
const collectionWindow = document.getElementById('add-collection-modal');
const error = document.querySelector('.error');
const saveBtn = document.getElementById('add-save-btn');
const collectionInput = document.getElementById('collection-input');

addCollectionBtn.addEventListener("click", () => {
    collectionWindow.style.display = 'flex';
});

// Collecties aanmaken

let collections = JSON.parse(localStorage.getItem('collections')) || [];

export function loadCollections() {
    const navCollectionItems = document.querySelector('.nav-collection-items');
    const mainCollectionItems = document.querySelector('.main-collection-items');

    let collections = JSON.parse(localStorage.getItem('collections')) || [];

    if (navCollectionItems) {
        navCollectionItems.innerHTML = '';

        collections.forEach(item => {
            navCollectionItems.innerHTML += `
                <li>
                    <a href="collection-details.html?id=${item.id}">
                        <img src="../images/icons/playlist.png" alt="playlist icon" class="nav-icon">
                        <span>${item.name}</span>
                    </a>
                </li>
            `;
        });
    }

    if (mainCollectionItems) {
        mainCollectionItems.innerHTML = '';

        mainCollectionItems.innerHTML = `
            <a href="likes.html" class="card card--likes" id="btn-likes">
                <img src="https://misc.scdn.co/liked-songs/liked-songs-300.png" alt="">
                <div class="card-content">
                    <h3>gelikte liedjes</h3>
                </div>
            </a>
        `;

        collections.forEach(item => {
            mainCollectionItems.innerHTML += `
                <a href="collection-details.html?id=${item.id}" class="card card--collection" id="collection-item">
                    <img src="../images/blank-cover.jpg" alt="collection cover">
                    <div class="card-content">
                        <h3 id="collection-name">${item.name}</h3>
                    </div>
                </a>

            `;
         });
    }
}

saveBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const name = collectionInput.value;

    if (name != ""){
        const newCollection = {
            id: Date.now(),
            name: name,
            tracks: []
        }

        collections.push(newCollection);
        localStorage.setItem('collections', JSON.stringify(collections));

        loadCollections();
        
        collectionWindow.style.display = 'none';
        collectionInput.value = '';
    } else {
        error.innerHTML = 'Collectie naam is vereist';
        collectionInput.style.border = "1px solid red";
    }
});

collectionInput.addEventListener('input', () => {
    if (collectionInput.value.length > 0) {
        collectionInput.style.border = "1px solid #545454"; 
        error.innerHTML = ''; 
    }
})

loadCollections();