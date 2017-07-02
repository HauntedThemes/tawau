/**
 * Main JS file for Zwei
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'posts-each-load': 2, // must be the same as Posts per page from General page in Ghost Dashboard,
        'infinite-scroll': false,
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

    // Load more posts on click
    if (config['load-more']) {

        $('#load-posts').addClass('visible');

        var nextPage = 2;
        var pagination = config['posts-each-load'];

        $('#load-posts').click(function() {

            var parseUrl = '&include=tags&limit=' + pagination + '&page=' + nextPage;
            if ($('body').attr('data-author')) {
                parseUrl = parseUrl + '&filter=author:' + $('body').attr('data-author');
            }else if($('body').attr('data-tag')){
                parseUrl = parseUrl + '&filter=tag:' + $('body').attr('data-tag');
            }

            $.ajax({
                url: ghost.url.api("posts") + parseUrl,
                type: 'get'
            }).done(function(data) {
                $.each(data.posts, function(i, post) {
                    $.ajax({
                        url: ghost.url.api("users") + '&filter=id:' + post.author,
                        type: 'get'
                    }).done(function(data) {
                        $.each(data.users, function(i, users) {
                            insertPost(post, users);
                        });
                    });
                });
            }).done(function(data) {
                var sum = nextPage*pagination;
                if (sum >= data.meta.pagination.total) {
                    $('#load-posts').addClass('hidden');
                }
                nextPage += 1;
            }).fail(function(err) {
                console.log(err);
            });
        });
    };

    // Infinite scroll
    if (config['infinite-scroll'] && config['load-more']) {
        var checkTimer = 'on';
        if ($('#load-posts').length > 0) {
            $(window).on('scroll', function(event) {
                var timer;
                if (isScrolledIntoView('#load-posts') && checkTimer == 'on') {
                    $('#load-posts').click();
                    checkTimer = 'off';
                    timer = setTimeout(function() {
                        checkTimer = 'on';
                    }, 1000);
                };
            });
        };
    };

    // Position share buttons
    function shareButtons(){
        
        var contentHolderDistanceTop = $('.content-inner .content-holder').offset().top;
        var contentHeight = $('#content').outerHeight(true);
        var contentDistanceTop = $('#content').offset().top - parseInt($('#content').css('marginTop'), 10);
        var socialShareHeight = $('.content-inner .content-holder .social-share').height();
        var contentHeightAndDistance = contentHeight + contentDistanceTop;

        if ($(window).scrollTop() > (contentHolderDistanceTop - 150) && $(window).scrollTop() < (contentHeightAndDistance - 150 - socialShareHeight)) {
            $('.social-share').addClass('active');
            $('.social-share').attr('style', '');
        }else if($(window).scrollTop() > (contentHeightAndDistance - 150 - socialShareHeight)){
            $('.social-share').css({
                position: 'absolute',
                top: (contentHeightAndDistance - contentHolderDistanceTop - socialShareHeight) + 'px'
            });
        }else if($(window).scrollTop() < (contentHolderDistanceTop - 150)){
            $('.social-share').removeClass('active');
            $('.social-share').attr('style', '');
        }
    }

    // Check if element is into view when scrolling
    function isScrolledIntoView(elem){
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    // Get first number of words from a string
    function getWords(str) {
        return str.split(/\s+/).slice(0,44).join(" ");
    }

    // Append posts on masonry container
    function insertPost(postData, authorData) {

        var d = postData.published_at.slice(0, 10).split('-');
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var monthNumber = d[1];
        if (monthNumber.slice(0,1) == '0') {
            monthNumber = monthNumber.slice(1,2) - 1;
        }else{
            monthNumber--;
        };

        var featured = '';

        if (postData.featured) {
            featured = 'featured';
        };

        var datetime = d[0] +'-'+ d[1] +'-'+ d[2];
        var date = d[2] +' '+ monthNames[monthNumber] +' '+ d[0];
        var excerpt = getWords($(postData.html).text());

        var data = {
            title: postData.title,
            date: {
                "datetime": datetime,
                "date": date
            },
            featured: featured,
            url: postData.url,
            excerpt: excerpt,
            tags: function(){
                if (!$.isEmptyObject(postData.tags)) {
                    data.tags.tag = postData.tags;
                    return true;
                };
            },
            image: function(){
                if (postData.image != '' && postData.image != null) {
                    return postData.image;
                };
            },
        }

        var template = [
            '<article class="post {{#tags}}{{#tags.tag}}tag-{{slug}} {{/tags.tag}}{{/tags}}">',
               ' <div class="post-meta">',
                    '<time class="post-date" datetime="{{date.datetime}}">{{date.date}}</time>',
                    '{{#tags}}',
                        '<div class="tags">',
                            '{{#tags.tag}}',
                                '<a href="/tag/{{slug}}">{{name}}</a>,',
                            '{{/tags.tag}}',
                        '</div>',
                    '{{/tags}}',
                '</div>',
                '<h2 class="post-title"><a href="{{url}}" title="{{title}}">{{title}}</a></h2>',
                '<div class="content-holder">',
                    '{{#image}}',
                        '<a href="{{url}}" title="{{title}}" class="img-holder">',
                            '<img src="{{image}}" alt="{{title}}">',
                        '</a>',
                    '{{/image}}',
                    '<p>',
                        '{{excerpt}}',
                    '</p>',
                '</div>',
                '<a class="read-more btn" href="{{url}}" title="{{title}}">Read more</a>',
                '<hr>',
            '</article>'
        ].join("\n");

        var post = Mustache.render(template, data);
        post = $(post);

        if (post.find('.tags').length) {
            post.find('.tags').html(post.find('.tags').html().replace(/,\s*$/, ''));
        };

        post.addClass('hidden');
        $('#content').append( post );
        $('#content').imagesLoaded( function() {
            post.removeClass('hidden');
        });
    }

});