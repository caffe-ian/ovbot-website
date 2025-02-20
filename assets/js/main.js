
(function ($) {

  var  $window = $(window),
  $body = $('body'),
  $sidebar = $('#sidebar');

  // Breakpoints.
    breakpoints({
      xlarge:   [ '1281px',  '1680px' ],
      large:    [ '981px',   '1280px' ],
      medium:   [ '737px',   '980px'  ],
      small:    [ '481px',   '736px'  ],
      xsmall:   [ null,      '480px'  ]
    });

  // Hack: Enable IE flexbox workarounds.
    if (browser.name == 'ie')
      $body.addClass('is-ie');

  // Play initial animations on page load.
    $window.on('load', async function() {

      window.setTimeout(function() {
        $('#transition').removeClass('white');
      }, 1000);
      let path = window.location.href.split("/");
        if (path[path.length-1].includes("#")) {
        window.setTimeout(function() {
          scroll(path[path.length-1].split("#")[1]);
        }, 1000);
      }
      window.setTimeout(function() {
        $body.removeClass('is-preload');
      }, 999);

    });

    $window.on('scroll', function() {
      if (!$window.scrollTop() == 0) {
        $(".top").addClass("show");
      } else {
        $(".top").removeClass("show");
      }
    });

  // Forms.

    // Hack: Activate non-input submits.
      $('form').on('click', '.submit', function(event) {

        // Stop propagation, default.
          event.stopPropagation();
          event.preventDefault();

        // Submit form.
          $(this).parents('form').submit();

      });

    $(document).on("click", "a", function (request) {

      let link = request.target.getAttribute("href");

      if (request.target.classList.contains("icon-2")) {
        link = "..";
      }

      if (link == null || link == "" || link == undefined) {
        request.preventDefault();
        return;
      } else if (link.startsWith("#")) {
        return;
      } else if (link.startsWith("wc:")) {
        request.preventDefault();
        window.location = link;
        return;
      }

      request.preventDefault();

      if (link.startsWith("$")) {
        document.getElementById("transition").classList.add("white");

        window.setTimeout(function () {
          history.back();
        }, 1000);
      } else {
        document.getElementById("transition").classList.add("white");

        window.setTimeout(function () {
          window.location.href = link;
        }, 1000);
        // window.open(link, '_blank').focus();
      }

      return;
    });

    $(".error").click(() => {
      closealert();
    }).children().click(() => {
      return false;
    });

    $(".rep").click(() => {
      closereport();
      closediscard();
    }).children().click(() => {
      return false;
    });

  // Sidebar

  if ($sidebar.length > 0) {

      var $sidebar_a = $sidebar.find('a');

      $sidebar_a
        .on('click', function() {

          var $this = $(this);

          // External link? Bail.
            if (!$this.attr('href').startsWith("#")) {
              return;
            }

          // Deactivate all links.
            $sidebar_a.removeClass('active');

          // Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
            $this
              .addClass('active')
              .addClass('active-locked');

        })
        .each(function() {

            var  $this = $(this),
            id = $this.attr('href'),
            $section = $(id);

          // No section for this link? Bail.
            if ($section.length < 1)
              return;

          // Scrollex.
            $section.scrollex({
              mode: 'middle',
              top: '-20vh',
              bottom: '-20vh',
              initialize: function() {

                // Deactivate section.
                  $section.addClass('inactive');

              },
              enter: function() {

                // Activate section.
                  $section.removeClass('inactive');

                // No locked links? Deactivate all links and activate this section's one.
                  if ($sidebar_a.filter('.active-locked').length == 0) {

                    $sidebar_a.removeClass('active');
                    $this.addClass('active');

                  }

                // Otherwise, if this section's link is the one that's locked, unlock it.
                  else if ($this.hasClass('active-locked'))
                    $this.removeClass('active-locked');

              }
            });

        });

    }

  // Scrolly.
    $('.scrolly').scrolly({
      speed: 2000,
      offset: function() {

        // If <=large, >small, and sidebar is present, use its height as the offset.
          if (breakpoints.active('<=large')
          &&  !breakpoints.active('<=small')
          &&  $sidebar.length > 0)
            return $sidebar.height();

        return 0;

      }
    });

  // Spotlights.
    $('.spotlights > section')
      .scrollex({
        mode: 'middle',
        top: '-10vh',
        bottom: '-10vh',
        initialize: function() {

          // Deactivate section.
            $(this).addClass('inactive');

        },
        enter: function() {

          // Activate section.
            $(this).removeClass('inactive');

        }
      })

  // Features.
    $('.features')
      .scrollex({
        mode: 'middle',
        top: '-20vh',
        bottom: '-20vh',
        initialize: function() {

          // Deactivate section.
            $(this).addClass('inactive');

        },
        enter: function() {

          // Activate section.
            $(this).removeClass('inactive');

        }
      });

  // FAQs

  var faq = document.getElementsByClassName("faq-page");
  var i;
  for (i = 0; i < faq.length; i++) {
      faq[i].addEventListener("click", function () {
        var a;
        for (a = 0; a < faq.length; a++) {
          if (this != faq[a]) {
            faq[a].parentNode.querySelectorAll(".faq-body")[0].classList.remove("show");
            faq[a].parentNode.querySelectorAll(".faq-page > .plus")[0].classList.remove("show");
          }
        }
        this.parentNode.querySelectorAll(".faq-body")[0].classList.toggle("show");
        this.parentNode.querySelectorAll(".faq-page > .plus")[0].classList.toggle("show");
      });
  }

  // Smooth scrolling

  const body = document.body;
  const main = document.getElementById('momentum-scroll');

  if (main != undefined) {

  let dy = 0;
  let prevdy = 0;
  let prev2dy = 0;

      var $a = $body.find('a');

      $a
        .addClass('scrolly')
        .on('click', function() {

          var $this = $(this);

          if ($this.attr('href') == undefined || $this.attr('href') == null || $this.attr('href') == "" || !$this.attr('href').startsWith("#")) {
            return;
          }

          scroll($this.attr('href').replace("#", ""))

        });

  function scroll(id) {

    let el = document.getElementById(id);

    for (var pos=0;el;el=el.offsetParent){
      pos +=  el.offsetTop-el.scrollTop;
    }

    window.scrollTo(0, pos);
  }

  body.style.height = main.clientHeight + 'px';
  main.style.top = 0;

  // Bind a scroll function
  window.addEventListener('mousewheel', easeScroll);

  function easeScroll() {
    sy = window.pageYOffset;
  }

  window.requestAnimationFrame(render);

  function render(){
    if (!browser.mobile) {
      dy = li(dy,window.pageYOffset,0.1);
    } else {
      dy = li(dy,window.pageYOffset,1);
    }
    dy = Math.floor(dy * 100) / 100;
    prev2dy = prevdy;
    prevdy = dy;
    
    main.style.transform = `translateY(-${dy}px)`;

    body.style.height = main.clientHeight + 'px';
    
    window.requestAnimationFrame(render);
  }

  function li(a, b, n) {
    return (1 - n) * a + n * b;
  }

}

  // Close the dropdown if the user clicks outside of it
  $window.on("click", function(event) {
    if (event.target.parentElement != null && !event.target.parentElement.classList.contains('dropdown')) {
      if (document.getElementsByClassName("dropdown-content")[0] != undefined && document.getElementsByClassName("dropdown-content")[0].classList.contains('show')) {
          document.getElementsByClassName("dropdown-content")[0].classList.remove('show');
      }
    }
  });

})(jQuery);

var current_track = 0;
var track_vol = 100;

document.getElementById("slider-bar").addEventListener('change', () => {
  document.getElementById("track").currentTime = document.getElementById("slider-bar").value;
})

document.getElementById("volume-bar").addEventListener('change', () => {
  document.getElementById("track").volume = document.getElementById("volume-bar").value / 100;
  track_vol = document.getElementById("volume-bar").value
  if (track_vol == 0) {
    document.getElementById("mute").src = "../assets/css/images/muted.svg"
  } else {
    document.getElementById("mute").src = "../assets/css/images/volume.svg"
  }
})

setInterval(() => {
  document.getElementById("slider-bar").value = document.getElementById("track").currentTime;
  if(Math.floor(document.getElementById("track").currentTime) == Math.floor(document.getElementById("slider-bar").max)){
      document.getElementById("next").click();
  }
}, 500)

const tracks = ["Sahara", "Close Eyes", "This Feeling"];

function set_track() {
  document.getElementById("slider-bar").value = 0;
  document.getElementById("track").src = `../assets/audio/${current_track}.mp3`;
  document.getElementById("track-name").innerHTML = tracks[current_track];
  document.getElementById("play").classList.toggle("hide");
  document.getElementById("pause").classList.toggle("show");
}

function play_track() {
  if (document.getElementById("pause").classList.contains("show")) {
    document.getElementById("track").pause();
  }
  else {
    document.getElementById("track").play();
  }
  document.getElementById("play").classList.toggle("hide");
  document.getElementById("pause").classList.toggle("show");
  setTimeout(() => {document.getElementById("slider-bar").max = document.getElementById("track").duration}, 500)
}

function previous() {
  if(current_track <= 0){
      current_track = 2;
  } else{
      current_track--;
  }
  set_track();
  play_track();
}

function next() {
  if(current_track >= 2){
      current_track = 0;
  } else{
      current_track++;
  }
  set_track();
  play_track();
}

function mute() {
  if (document.getElementById("track").volume != 0) {
    document.getElementById("track").volume = 0
    document.getElementById("volume-bar").value = 0
    document.getElementById("mute").src = "../assets/css/images/muted.svg"
  } else {
    document.getElementById("track").volume = track_vol / 100;
    document.getElementById("volume-bar").value = track_vol
    document.getElementById("mute").src = "../assets/css/images/volume.svg"
  }
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function showDropdown() {
  document.getElementsByClassName("dropdown-content")[0].classList.toggle("show");
}

function slide() {
  document.getElementsByClassName("right-arrow")[0].classList.toggle("show");
  document.getElementsByClassName("left-arrow")[0].classList.toggle("show");
  document.getElementsByClassName("column-left-content")[0].classList.toggle("show");
  document.getElementsByClassName("column-right-content")[0].classList.toggle("show");
}

function alert(error, title = "Whoops!") {
  document.querySelectorAll(".error-container > p")[0].innerHTML = error;
  document.querySelectorAll(".error-container > h2")[0].innerHTML = title;
  document.getElementsByClassName("error")[0].classList.add("show");
}

function closealert() {
  document.getElementsByClassName('error')[0].classList.remove('show');
  setTimeout(() => {document.querySelectorAll('.error-container > p')[0].innerHTML = 'Too fast! Slow down'}, 1000)
  setTimeout(() => {document.querySelectorAll('.error-container > h2')[0].innerHTML = 'Whoops!'}, 1000)
}

(function ($) {

  $.extend(
  {
      redirectPost: function (location, args) {
          var form = $('<form>', { action: location, method: 'post' });
          $.each(args,
              function (key, value) {
                  $(form).append(
                      $('<input>', { type: 'hidden', name: key, value: value })
                  );
              });
          $(form).appendTo('body').submit();
      }
  });
})( jQuery );
