/**
 * Main JS file for Zwei
 */

jQuery(document).ready(function($) {

    var config = {
        
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    
    $('.post-content img').each(function(index, el) {
        if (!$(this).parent().is("a")) {
            $( "<a href='" + $(this).attr('src') + "' class='zoom'></a>" ).insertAfter( $(this) );
            $(this).appendTo($(this).next("a"));
        };
    });

    $('.zoom').fluidbox();

    $(window).scroll(function() {
        $('.zoom').fluidbox('close');
    });

});