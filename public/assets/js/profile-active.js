const navItems = document.querySelectorAll("#nav-list .nav-item");

function setActiveListItem() {
    const currentURL = window.location.pathname;
    navItems.forEach((item) => {
        const link = item.querySelector(".nav-link");
        const linkURL = link.getAttribute("href");
        if (linkURL === currentURL) {
            item.classList.add("active-nav");
        } else {
            item.classList.remove("active-nav");
        }
    });
}

setActiveListItem();