$(document).ready(function () {
    var owl = $('.owl-carousel');

    owl.owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        mouseDrag: true, // Enable mouse drag
        touchDrag: true, // Enable touch drag
        responsive: {
            0: {
                items: 1.5
            },
            600: {
                items: 2.5
            },
            1000: {
                items: 3.5
            },
            1300: {
                items: 4.5
            },
            1700: {
                items: 6.5
            }
        }
    });

    owl.on('mousewheel', '.owl-stage', function (e) {
        if (e.deltaY > 0) {
            owl.trigger('next.owl');
        } else {
            owl.trigger('prev.owl');
        }
        e.preventDefault();
    });
});
