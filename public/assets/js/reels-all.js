document.addEventListener("DOMContentLoaded", function () {
    const videos = document.querySelectorAll(".reels-video");
    const videoThumbnails = document.querySelectorAll(".video-thumbnail");
    const volumeSliders = document.querySelectorAll(".volume-slider");
    const volumeIcons = document.querySelectorAll(".volume-show i.fa-volume-xmark");

    videos.forEach((video, index) => {
        const videoThumbnail = videoThumbnails[index];
        const videoWrapper = video.closest(".video-wrapper");
        video.muted = true;

        function updateVolume() {
            video.volume = volumeSliders[index].value;
            if (video.volume > 0) {
                video.muted = false;
                volumeIcons[index].classList.remove("fa-volume-xmark");
                volumeIcons[index].classList.add("fa-volume-high");
            } else {
                video.muted = true;
                volumeIcons[index].classList.remove("fa-volume-high");
                volumeIcons[index].classList.add("fa-volume-xmark");
            }
        }

        volumeSliders[index].addEventListener("input", updateVolume);

        video.style.display = "none";
        videoThumbnail.style.display = "block";

        videoWrapper.addEventListener("mouseover", () => {
            video.play();
            video.style.display = "block";
            videoThumbnail.style.display = "none";
        });

        videoWrapper.addEventListener("mouseout", () => {
            video.pause();
        });
    });
});
