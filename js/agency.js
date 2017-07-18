// Agency Theme JavaScript

(function($) {
    "use strict"; // Start of use strict

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function(){ 
            $('.navbar-toggle:visible').click();
    });

    // Offset for Main Navigation
    if(!$('#mainNav').hasClass('affix')){
        $('#mainNav').affix({
            offset: {
                top: 100
            }
        });
    }

})(jQuery); // End of use strict
