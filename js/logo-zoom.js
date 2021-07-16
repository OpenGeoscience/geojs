$(function () {
    var resumed = false;

    $(window).on("scroll", function () {
        var y = $(this).scrollTop();

        if (y > 180 && !resumed) {
            resumed = true;
            $('.navbar-logo').addClass('zoomin');
            $('.logo').addClass('zoomout');
        }

        if(y < 180 && resumed){
            resumed = false;
            $('.navbar-logo').removeClass('zoomin');
            $('.logo').removeClass('zoomout');
        }
    });
});