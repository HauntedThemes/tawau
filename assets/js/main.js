/**
 * Main JS file for Zwei
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
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

    $(window).on('scroll', function(event) {
        $('.zoom').fluidbox('close');
    });

    // Initialize shareSelectedText
    if (config['share-selected-text']) {
        shareSelectedText('.content-inner .post-content', {
            sanitize: true,
            buttons: [
                'twitter',
            ],
            tooltipTimeout: 250
        });
    };

    // Position social share buttons inside a single post
    if ($('.social-share').length) {
        $(window).scroll(function() {
            shareButtons();
        });
        shareButtons();
    };

    // Position share buttons
    function shareButtons(){
        var contentHolderDistanceTop = $('.content-inner .content-holder').offset().top;
        var contentHeight = $('#content').outerHeight(true);
        var contentDistanceTop = $('#content').offset().top - parseInt($('#content').css('marginTop'), 10);

        console.log(contentDistanceTop);

        if ($(window).scrollTop() > (contentHolderDistanceTop - 150) && $(window).scrollTop() < (contentHeight + contentDistanceTop - 150 - $('.content-inner .content-holder .social-share').height())) {
            $('.social-share').addClass('active');
            $('.social-share').attr('style', '');
            console.log($(window).scrollTop());
            console.log(contentHeight + contentDistanceTop);
            console.log('-----');
        }
        // else if($(window).scrollTop() > (contentHeight + contentDistanceTop - 190)){
        //     $('.social-share').css({
        //         position: 'absolute',
        //         top: contentHeight - 300 + 'px'
        //     });
        // }else if($(window).scrollTop() < (contentHolderDistanceTop - 150)){
        //     $('.social-share').removeClass('active');
        //     $('.social-share').attr('style', '');
        // }
    }

});