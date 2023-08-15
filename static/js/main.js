/*
	Massively by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {
    document.addEventListener('DOMContentLoaded', () => {
        let recorder;
        let recordedChunks = [];
    
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const detectButton = document.getElementById('detectButton');
        const listenButton = document.getElementById('listenButton');
        const downloadRecordingButton = document.getElementById('downloadRecordingButton');
        const downloadEmotionButton = document.getElementById('downloadEmotionButton'); // Correct ID
    
        startButton.addEventListener('click', async () => {
            recordedChunks = [];
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recorder = new MediaRecorder(stream);
                recorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };
                recorder.start();
                startButton.disabled = true;
                stopButton.disabled = false;
                detectButton.disabled = true;
            } catch (err) {
                console.error('Error starting recording:', err);
            }
        });
    
        stopButton.addEventListener('click', async () => {
            if (recorder && recorder.state !== 'inactive') {
                recorder.stop();
                stopButton.disabled = true;
                detectButton.style.display = 'block'; // Display detect button
                detectButton.disabled = false; // Enable the detect button
                downloadRecordingButton.style.display = 'block'; // Display download button
                listenButton.style.display = 'block'; // Display listen button
            }
        });
        
    
        listenButton.addEventListener('click', () => {
            const audio = document.getElementById('recordedAudio');
            const blob = new Blob(recordedChunks, { type: 'audio/ogg; codecs=opus' });
            const url = URL.createObjectURL(blob);
            audio.src = url;
            audio.play();
        });
        
    
        downloadRecordingButton.addEventListener('click', () => {
            const blob = new Blob(recordedChunks, { type: 'audio/ogg; codecs=opus' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'recorded_audio.ogg';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
        });
    
        detectButton.addEventListener('click', async () => {
            console.log('Button clicked');
            if (recordedChunks.length === 0) {
                console.log('No recorded audio available.');
                return;
            }
        
            const blob = new Blob(recordedChunks, { type: 'audio/wav' });
            const fileName = 'recorded_audio.wav'; // Provide a meaningful filename here
            const formData = new FormData();
            formData.append('audio', blob, fileName);
            
            console.log('FormData created:', formData);
            try {
                const response = await fetch('/predict_emotion', {
                    method: 'POST',
                    body: formData
                });
                console.log('Fetch response:', response);
                if (response.ok) {
                    const result = await response.json();
                    document.getElementById('result').innerText = `Predicted Emotion: ${result.emotion}`;
                    document.getElementById('result').style.display = 'block';
                    downloadEmotionButton.style.display = 'block';
                    // Remove the line below since there's no 'message' key in the response
                    // console.log('Server message:', result.message);
                } else {
                    console.error('Error predicting emotion:', response.statusText);
                }
            } catch (error) {
                console.error('Error predicting emotion:', error);
            }
        });
    
    });
	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$header = $('#header'),
		$nav = $('#nav'),
		$main = $('#main'),
		$navPanelToggle, $navPanel, $navPanelInner;

	// Breakpoints.
		breakpoints({
			default:   ['1681px',   null       ],
			xlarge:    ['1281px',   '1680px'   ],
			large:     ['981px',    '1280px'   ],
			medium:    ['737px',    '980px'    ],
			small:     ['481px',    '736px'    ],
			xsmall:    ['361px',    '480px'    ],
			xxsmall:   [null,       '360px'    ]
		});

	/**
	 * Applies parallax scrolling to an element's background image.
	 * @return {jQuery} jQuery object.
	 */
	$.fn._parallax = function(intensity) {

		var	$window = $(window),
			$this = $(this);

		if (this.length == 0 || intensity === 0)
			return $this;

		if (this.length > 1) {

			for (var i=0; i < this.length; i++)
				$(this[i])._parallax(intensity);

			return $this;

		}

		if (!intensity)
			intensity = 0.25;

		$this.each(function() {

			var $t = $(this),
				$bg = $('<div class="bg"></div>').appendTo($t),
				on, off;

			on = function() {

				$bg
					.removeClass('fixed')
					.css('transform', 'matrix(1,0,0,1,0,0)');

				$window
					.on('scroll._parallax', function() {

						var pos = parseInt($window.scrollTop()) - parseInt($t.position().top);

						$bg.css('transform', 'matrix(1,0,0,1,0,' + (pos * intensity) + ')');

					});

			};

			off = function() {

				$bg
					.addClass('fixed')
					.css('transform', 'none');

				$window
					.off('scroll._parallax');

			};

			// Disable parallax on ..
				if (browser.name == 'ie'			// IE
				||	browser.name == 'edge'			// Edge
				||	window.devicePixelRatio > 1		// Retina/HiDPI (= poor performance)
				||	browser.mobile)					// Mobile devices
					off();

			// Enable everywhere else.
				else {

					breakpoints.on('>large', on);
					breakpoints.on('<=large', off);

				}

		});

		$window
			.off('load._parallax resize._parallax')
			.on('load._parallax resize._parallax', function() {
				$window.trigger('scroll');
			});

		return $(this);

	};

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Scrolly.
		$('.scrolly').scrolly();

	// Background.
		$wrapper._parallax(0.925);

	// Nav Panel.

		// Toggle.
			$navPanelToggle = $(
				'<a href="#navPanel" id="navPanelToggle">Menu</a>'
			)
				.appendTo($wrapper);

			// Change toggle styling once we've scrolled past the header.
				$header.scrollex({
					bottom: '5vh',
					enter: function() {
						$navPanelToggle.removeClass('alt');
					},
					leave: function() {
						$navPanelToggle.addClass('alt');
					}
				});

		// Panel.
			$navPanel = $(
				'<div id="navPanel">' +
					'<nav>' +
					'</nav>' +
					'<a href="#navPanel" class="close"></a>' +
				'</div>'
			)
				.appendTo($body)
				.panel({
					delay: 500,
					hideOnClick: true,
					hideOnSwipe: true,
					resetScroll: true,
					resetForms: true,
					side: 'right',
					target: $body,
					visibleClass: 'is-navPanel-visible'
				});

			// Get inner.
				$navPanelInner = $navPanel.children('nav');

			// Move nav content on breakpoint change.
				var $navContent = $nav.children();

				breakpoints.on('>medium', function() {

					// NavPanel -> Nav.
						$navContent.appendTo($nav);

					// Flip icon classes.
						$nav.find('.icons, .icon')
							.removeClass('alt');

				});

				breakpoints.on('<=medium', function() {

					// Nav -> NavPanel.
						$navContent.appendTo($navPanelInner);

					// Flip icon classes.
						$navPanelInner.find('.icons, .icon')
							.addClass('alt');

				});

			// Hack: Disable transitions on WP.
				if (browser.os == 'wp'
				&&	browser.osVersion < 10)
					$navPanel
						.css('transition', 'none');

	// Intro.
		var $intro = $('#intro');

		if ($intro.length > 0) {

			// Hack: Fix flex min-height on IE.
				if (browser.name == 'ie') {
					$window.on('resize.ie-intro-fix', function() {

						var h = $intro.height();

						if (h > $window.height())
							$intro.css('height', 'auto');
						else
							$intro.css('height', h);

					}).trigger('resize.ie-intro-fix');
				}

			// Hide intro on scroll (> small).
				breakpoints.on('>small', function() {

					$main.unscrollex();

					$main.scrollex({
						mode: 'bottom',
						top: '25vh',
						bottom: '-50vh',
						enter: function() {
							$intro.addClass('hidden');
						},
						leave: function() {
							$intro.removeClass('hidden');
						}
					});

				});

			// Hide intro on scroll (<= small).
				breakpoints.on('<=small', function() {

					$main.unscrollex();

					$main.scrollex({
						mode: 'middle',
						top: '15vh',
						bottom: '-15vh',
						enter: function() {
							$intro.addClass('hidden');
						},
						leave: function() {
							$intro.removeClass('hidden');
						}
					});

			});

		}

})(jQuery);

