/**
 * Main JS file for Tawau
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'infinite-scroll': false,
        'disqus-shortname': 'hauntedthemes-demo'
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        checkMorph = false,
        didScroll,
        lastScrollTop = 0,
        delta = 5;

    // Execute on load
    $(window).on('load', function(event) {
        setMorphHeight();
    });
    
    // Add classes and attributes for Fluidbox library
    $('.post-content img').each(function(index, el) {
        if (!$(this).parent().is("a") && !$(this).hasClass('error')) {
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
    var checkIfSticky = 0;
    if (w >= 992) {
        stickIt();
        checkIfSticky = 1;
    };

    // Initialize Disqus comments
    if ($('#content').attr('data-id') && config['disqus-shortname'] != '') {

        $('.comments').append('<div id="disqus_thread"></div>')

        var disqus_config = function () {
            this.page.url = window.location.href;
            this.page.identifier = $('#content').attr('data-id');
        };

        (function() {
        var d = document, s = d.createElement('script');
        s.src = '//'+ config['disqus-shortname'] +'.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
        })();
    };

    // Load more posts on click
    if (config['load-more']) {

        $('#load-posts').addClass('visible');

        var nextPage = 2;
        var pagination = $('#load-posts').attr('data-posts_per_page');

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

    // Search and Menu triggers
    $('.search-trigger, .nav-trigger').on('click', function(event) {
        event.preventDefault();

        var className = event.currentTarget.className;

        if ($('body').hasClass('scroll') && !$('body').hasClass('overflow-y')) {
            return;
        };

        if ($('body, html').hasClass('end-search-trigger') && $(this).hasClass('nav-trigger')) {
            $('body, html').removeClass('begin-search-trigger end-search-trigger').addClass('begin-nav-trigger end-nav-trigger');
            return;
        };

        if ($('body, html').hasClass('end-nav-trigger') && $(this).hasClass('search-trigger')) {
            $('body, html').removeClass('begin-nav-trigger end-nav-trigger').addClass('begin-search-trigger end-search-trigger');
            return;
        };

        if (!$('body').hasClass('end')) {
            if (!$('body').hasClass('begin')) {
                morphStart(className);
            };
        }else{
            morphReverse(className);
        }
    });

    // Initialize ghostHunter - A Ghost blog search engine
    $("#search-field").ghostHunter({
        results             : "#results",
        onKeyUp             : true,
        zeroResultsInfo     : true,
        displaySearchInfo   : true,
        info_template       : "<p>No posts found</p>",
        result_template     : "<li><a href='{{link}}' title='{{title}}'>{{title}}</a></li>",
        onComplete      : function( results ){
            if (results.length == 0 && $('#search-field').val() != '') {
                $('#results p').addClass('empty');
            };
            $('#results li').each(function(index, el) {
                if (index > 11) {
                    $(this).hide();
                };
            });
        }
    });

    // Validate Subscribe input
    $('.gh-signin').on('submit', function(event) {
        var email = $('.gh-input').val();
        if (!validateEmail(email)) {
            $('.gh-input').addClass('error');
            setTimeout(function() {
                $('.gh-input').removeClass('error');
            }, 500);
            event.preventDefault();
        };
    });

    // Animation for shareSelectedText
    $('.tooltip').prependTo('.share-selected-text-inner');
    $('.share-selected-text-btn').prependTo('.tooltip-content');

    const config_tooltip = {
        in: {
            base: {
                duration: 200,
                easing: 'easeOutQuad',
                rotate: [35,0],
                opacity: {
                    value: 1,
                    easing: 'linear',
                    duration: 100
                }
            },
            content: {
                duration: 1000,
                delay: 50,
                easing: 'easeOutElastic',
                translateX: [50,0],
                rotate: [10, 0],
                opacity: {
                    value: 1,
                    easing: 'linear',
                    duration: 100
                }
            },
            trigger: {
                translateX: [
                    {value: '-30%', duration: 130, easing: 'easeInQuad'},
                    {value: ['30%','0%'], duration: 900, easing: 'easeOutElastic'}
                ],
                opacity: [
                    {value: 0, duration: 130, easing: 'easeInQuad'},
                    {value: 1, duration: 130, easing: 'easeOutQuad'}
                ],
                color: [
                    {value: '#6fbb95', duration: 1, delay: 130, easing: 'easeOutQuad'}
                ]
            }
        },
        out: {
            base: {
                duration: 200,
                delay: 100,
                easing: 'easeInQuad',
                rotate: -35,
                opacity: 0
            },
            content: {
                duration: 200,
                easing: 'easeInQuad',
                translateX: -30,
                rotate: -10,
                opacity: 0
            },
            trigger: {
                translateX: [
                    {value: '-30%', duration: 200, easing: 'easeInQuad'},
                    {value: ['30%','0%'], duration: 200, easing: 'easeOutQuad'}
                ],
                opacity: [
                    {value: 0, duration: 200, easing: 'easeInQuad'},
                    {value: 1, duration: 200, easing: 'easeOutQuad'}
                ],
                color: [
                    {value: '#666', duration: 1, delay: 200, easing: 'easeOutQuad'}
                ]
            }
        }
    };

    $('.tooltip').each(function(index, el) {
        var $this = $(this);
        var base = $(this).find('.tooltip-base')[0];
        var content = $(this).find('.tooltip-content')[0];
        $('.content-inner .post-content').bind('mouseup', function(e){
            if (window.getSelection || document.selection) {
                var sel = window.getSelection();
                $this.mouseTimeout = setTimeout(function() {
                    $this.isShown = true;
                    animateTooltip('in', base, content);
                }, 500);
            }
        });
        $('body').bind('mousedown', function(e){
            if (window.getSelection || document.selection) {
                clearTimeout($this.mouseTimeout);
                if( $this.isShown ) {
                    $this.isShown = false;
                    animateTooltip('out', base, content);
                }
            }
        });
    });

    if (typeof Object.assign != 'function') {
      Object.assign = function(target) {
        'use strict';
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source != null) {
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
        }
        return target;
      };
    }

    // On scroll check if header should be visible or not
    $(window).on('scroll', function(event) {
        didScroll = true;
    });

    setInterval(function() {
        if (didScroll && checkMorph == false) {
            hasScrolled();
            didScroll = false;
        }
    }, 250);

    // Execute on resize
    $(window).on('resize', function () {

        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (w < 960) {
            $('.content-inner .post-content .social-share').trigger("sticky_kit:detach");
            checkIfSticky = 0;
        }else{
            if (checkIfSticky == 0) {
                stickIt();
                checkIfSticky++;
            }
        };

        setMorphHeight();

    });

    // Tawau's functions

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
        var excerpt;
        if (postData.custom_excerpt != null) {
            excerpt = postData.custom_excerpt;
        }else{
            excerpt = getWords($(postData.html).text());
        };

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
            feature_image: function(){
                if (postData.feature_image != '' && postData.feature_image != null) {
                    return postData.feature_image;
                };
            },
        }

        var template = [
            '<article class="post {{#featured}}featured{{/featured}} {{#tags}}{{#tags.tag}}tag-{{slug}} {{/tags.tag}}{{/tags}}">',
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
                    '{{#feature_image}}',
                        '<a href="{{url}}" title="{{title}}" class="img-holder">',
                            '<img src="{{feature_image}}" alt="{{title}}">',
                        '</a>',
                    '{{/feature_image}}',
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

    // Morph effect start
    function morphStart(c){
        var morphing = anime({
            targets: '#morphing .path',
            d: [
              { value: 'M 10,0 L 10,0 C 10,0 10,0 5,0 C 0,0 0,0 0,0 L 0,0 Z' },
              { value: 'M 10,0 L 10,0 C 10,0 10,5 5,5 C 0,5 0,0 0,0 L 0,0 Z' },
              { value: 'M10 0 L10 10 C10 10 10 10 5 10 C0 10 0 10 0 10 L0 0 '}
            ],
            easing: 'easeInOutQuint',
            duration: 1000,
            loop: false,
        });  

        morphing.begin = function(){
            $('body, html').addClass('overflow-y begin ' + 'begin-' + c);
        }

        morphing.complete = function(){
            $('body, html').addClass('overflow-y end ' + 'end-' + c);
            setTimeout(function() {
                $('#search-field').focus();
            }, 100);
        }

    }

    // Morph effect reverse
    function morphReverse(c){
        var morphing = anime({
            targets: '#morphing .path',
            d: [
              { value: 'M10 0 L10 10 C10 10 10 10 5 10 C0 10 0 10 0 10 L0 0' },
              { value: 'M 10,0 L 10,0 C 10,0 10,5 5,5 C 0,5 0,0 0,0 L 0,0 Z' },
              { value: 'M 10,0 L 10,0 C 10,0 10,0 5,0 C 0,0 0,0 0,0 L 0,0 Z '}
            ],
            easing: 'easeInOutQuint',
            duration: 1000,
            loop: false
        });  

        morphing.begin = function(){
            $('body, html').removeClass('overflow-y end ' + 'end-' + c);
            checkMorph = true;
        }

        morphing.complete = function(){
            $('body, html').removeClass('overflow-y begin ' + 'begin-' + c);
            checkMorph = false;
        }

    }

    // Validate email input
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    } 

    // Set morph height
    function setMorphHeight(){
        var headerContainerHeight = $('header .header-container').outerHeight();

        $('#morphing').css({
            top: headerContainerHeight + 'px',
            height: 'calc(100vh - '+ headerContainerHeight +'px)'
        });   
    }

    // Animate tooltip for shareSelectedText
    function animateTooltip(dir, base, content){
        if ( config_tooltip[dir].base ) {
            anime.remove(base);
            var baseAnimOpts = {targets: base};
            anime(Object.assign(baseAnimOpts, config_tooltip[dir].base));
        }
        if ( config_tooltip[dir].content ) {
            anime.remove(content);
            var contentAnimOpts = {targets: content};
            anime(Object.assign(contentAnimOpts, config_tooltip[dir].content));
        }
    }

    // Initialize stick_in_parent
    function stickIt(){
        $('.content-inner .post-content .social-share').stick_in_parent({
            offset_top: 150
        });
    }

    // Show/Hide menu on scroll
    function hasScrolled() {
        var st = $(this).scrollTop();
        
        if(Math.abs(lastScrollTop - st) <= delta)
            return;
        
        if (st > lastScrollTop){
            $('body').addClass('scroll');
        } else {
            if(st + $(window).height() < $(document).height()) {
                $('body').removeClass('scroll');
            }
        }
        
        lastScrollTop = st;
    }

});