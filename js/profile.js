import { getProfile } from './auth.js';

async function loadUserProfile() {
    try {
        const profile = await getProfile();

        if (profile) {
            const userName = document.getElementById('user-name');
            if (userName && profile.display_name) {
                userName.textContent = profile.display_name;
            }

            if (profile.images && profile.images.length > 0) {
                const photoUrl = profile.images[0].url;
                const profileUserPhoto = document.getElementById('user-photo');
                const headerUserPhoto = document.getElementById('header-user-photo');

                if (profileUserPhoto) {
                    profileUserPhoto.src = photoUrl;
                }
                if (headerUserPhoto) {
                    headerUserPhoto.src = photoUrl;
                } 
            }
        }
    } catch (error) {
        console.error(error);
    }
}

loadUserProfile();