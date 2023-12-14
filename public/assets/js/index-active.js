const navLinks = document.querySelectorAll(".scrollable-nav .nav-link");

function setActiveLink() {
    const currentURL = window.location.pathname;

    navLinks.forEach((link) => {
        if (link.getAttribute("href") === currentURL) {
            link.classList.add("active-page");
        } else {
            link.classList.remove("active-page");
        }
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        setActiveLink(); // Update the active link
    });
});

setActiveLink();
