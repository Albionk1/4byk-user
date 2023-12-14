document.addEventListener('DOMContentLoaded', function () {
    const profileImage = document.querySelector('.pic-image-profile .image-input-wrapper');
    const avatarImages = document.querySelectorAll('.avatar-select');

    avatarImages.forEach(avatarImage => {
        avatarImage.addEventListener('click', function () {
            const newAvatarUrl = this.getAttribute('data-avatar');
            profileImage.style.opacity = 0;
            setTimeout(() => {
                profileImage.style.backgroundImage = `url(${newAvatarUrl})`;
                profileImage.style.opacity = 1;
            }, 200);
        });
    });
});