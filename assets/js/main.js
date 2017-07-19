/**
 * Main JS file for Zwei
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'posts-each-load': 2, // must be the same as Posts per page from General page in Ghost Dashboard,
        'infinite-scroll': false,
        'disqus-shortname': 'lizun-1'
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    
    $('.post-content img').each(function(index, el) {
        if (!$(this).parent().is("a") && !$(this).hasClass('error')) {
            $( "<a href='" + $(this).attr('src') + "' class='zoom'></a>" ).insertAfter( $(this) );
            $(this).appendTo($(this).next("a"));
            console.log('t2');
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
        $('mark').on('mouseover', function(event) {
            event.preventDefault();

        });
    };

    // Position social share buttons inside a single post
    if ($('.social-share').length) {
        $(window).scroll(function() {
            shareButtons();
        });
        shareButtons();
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
        }

        morphing.complete = function(){
            $('body, html').removeClass('overflow-y begin ' + 'begin-' + c);
        }

    }

    $('.search-trigger, .nav-trigger').on('click', function(event) {
        event.preventDefault();

        var className = event.currentTarget.className;

        if ($('body').hasClass('scroll') && !$('body').hasClass('overflow-y')) {
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
        }
    });

    var scroll = 0;
    var lastScrollTop = 0;
    $(document).scroll(function(event) {
        if (scroll == 1) {
            var st = $(this).scrollTop();
            if (st > lastScrollTop){
                $('body').addClass('scroll');
            } else {
                $('body').removeClass('scroll');
            }
            lastScrollTop = st;
        }
        scroll = 1;
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

    // Validate email input
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    } 

    $('mark').each(function(index, el) {
        $(this).on('mouseover', function(event) {
            event.preventDefault();
            var rect = $(this)[0].getBoundingClientRect();
        });
    });

    $('.tooltip').prependTo('.share-selected-text-inner');
    $('.share-selected-text-btn').prependTo('.tooltip__content');

    {
        const config = {
            smaug: {
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
            }   
        };

        const tooltips = Array.from(document.querySelectorAll('.tooltip'));
        
        class Tooltip {
            constructor(el) {
                this.DOM = {};
                this.DOM.el = el;
                this.type = this.DOM.el.getAttribute('data-type');
                this.DOM.trigger = this.DOM.el.querySelector('.tooltip__trigger');
                this.DOM.triggerSpan = this.DOM.el.querySelector('.tooltip__trigger-text');
                this.DOM.base = this.DOM.el.querySelector('.tooltip__base');
                this.DOM.shape = this.DOM.base.querySelector('.tooltip__shape');
                if( this.DOM.shape ) {
                    this.DOM.path = this.DOM.shape.childElementCount > 1 ? Array.from(this.DOM.shape.querySelectorAll('path')) : this.DOM.shape.querySelector('path');
                }
                this.DOM.deco = this.DOM.base.querySelector('.tooltip__deco');
                this.DOM.content = this.DOM.base.querySelector('.tooltip__content');

                this.DOM.letters = this.DOM.content.querySelector('.tooltip__letters');
                if( this.DOM.letters ) {
                    // Create spans for each letter.
                    charming(this.DOM.letters);
                    // Redefine content.
                    this.DOM.content = this.DOM.letters.querySelectorAll('span');
                }
                this.initEvents();
            }
            initEvents() {
                this.mouseenterFn = () => {
                    this.mouseTimeout = setTimeout(() => {
                        this.isShown = true;
                        this.show();
                    }, 75);
                }
                this.mouseleaveFn = () => {
                    clearTimeout(this.mouseTimeout);
                    if( this.isShown ) {
                        this.isShown = false;
                        this.hide();
                    }
                }
                var $this = this;
                $('.content-inner .post-content').bind('mouseup', function(e){
                    if (window.getSelection || document.selection) {
                        var sel = window.getSelection();
                        $this.mouseTimeout = setTimeout(() => {
                            $this.isShown = true;
                            $this.show();
                        }, 500);
                    }
                });
                $('body').bind('mousedown', function(e){
                    if (window.getSelection || document.selection) {
                        clearTimeout($this.mouseTimeout);
                        if( $this.isShown ) {
                            $this.isShown = false;
                            $this.hide();
                        }
                    }
                });
                // this.DOM.trigger.addEventListener('mouseenter', this.mouseenterFn);
                // this.DOM.trigger.addEventListener('mouseleave', this.mouseleaveFn);
                // this.DOM.trigger.addEventListener('touchstart', this.mouseenterFn);
                // this.DOM.trigger.addEventListener('touchend', this.mouseleaveFn);
            }
            show() {
                this.animate('in');
            }
            hide() {
                this.animate('out');
            }
            animate(dir) {
                if ( config[this.type][dir].base ) {
                    anime.remove(this.DOM.base);
                    let baseAnimOpts = {targets: this.DOM.base};
                    anime(Object.assign(baseAnimOpts, config[this.type][dir].base));
                }
                if ( config[this.type][dir].content ) {
                    anime.remove(this.DOM.content);
                    let contentAnimOpts = {targets: this.DOM.content};
                    anime(Object.assign(contentAnimOpts, config[this.type][dir].content));
                }
                if ( config[this.type][dir].trigger ) {
                    anime.remove(this.DOM.triggerSpan);
                    let triggerAnimOpts = {targets: this.DOM.triggerSpan};
                    anime(Object.assign(triggerAnimOpts, config[this.type][dir].trigger));
                }
            }
            destroy() {
                // this.DOM.trigger.removeEventListener('mouseenter', this.mouseenterFn);
                // this.DOM.trigger.removeEventListener('mouseleave', this.mouseleaveFn);
                // this.DOM.trigger.removeEventListener('touchstart', this.mouseenterFn);
                // this.DOM.trigger.removeEventListener('touchend', this.mouseleaveFn);
            }
        }

        const init = (() => tooltips.forEach(t => new Tooltip(t)))();
    };

});