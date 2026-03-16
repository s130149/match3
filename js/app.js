const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
    const token = localStorage.getItem("access_token");

    if (token) {
        logout();
        console.log("TEST");
    } else {
        authorizeSpotify();
    }
});