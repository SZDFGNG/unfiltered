document.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    const img = document.querySelector('.nav-logo img');

    if (!nav || !img) {
        return;
    }

    if (window.scrollY > 0) {
        nav.classList.add('scrolled');
        img.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
        img.classList.remove('scrolled');
    }
});

const locationSlider = document.querySelector('.location-description-images');

if (locationSlider) {
    const locationImages = locationSlider.querySelectorAll('img');
    const prevButton = locationSlider.querySelector('.location-slider-arrow-prev');
    const nextButton = locationSlider.querySelector('.location-slider-arrow-next');
    const dotsContainer = locationSlider.querySelector('.location-slider-dots');

    if (locationImages.length > 1 && prevButton && nextButton && dotsContainer) {
        let activeImageIndex = 0;
        let sliderIntervalId;

        function renderDots() {
            dotsContainer.innerHTML = '';

            locationImages.forEach(function(_, index) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'location-slider-dot';
                dot.setAttribute('aria-label', 'Go to venue photo ' + (index + 1));

                if (index === activeImageIndex) {
                    dot.classList.add('is-active');
                }

                dot.addEventListener('click', function() {
                    showImage(index);
                    restartSliderInterval();
                });

                dotsContainer.appendChild(dot);
            });
        }

        function showImage(index) {
            locationImages[activeImageIndex].classList.remove('is-active');
            activeImageIndex = index;
            locationImages[activeImageIndex].classList.add('is-active');
            renderDots();
        }

        function showNextImage() {
            showImage((activeImageIndex + 1) % locationImages.length);
        }

        function showPreviousImage() {
            showImage((activeImageIndex - 1 + locationImages.length) % locationImages.length);
        }

        function restartSliderInterval() {
            clearInterval(sliderIntervalId);
            sliderIntervalId = setInterval(showNextImage, 5000);
        }

        prevButton.addEventListener('click', function() {
            showPreviousImage();
            restartSliderInterval();
        });

        nextButton.addEventListener('click', function() {
            showNextImage();
            restartSliderInterval();
        });

        renderDots();
        restartSliderInterval();
    }
}

const winemakersToggle = document.getElementById('winemakersToggle');
const winemakersMore = document.getElementById('winemakersMore');

if (winemakersToggle && winemakersMore) {
    winemakersToggle.addEventListener('click', () => {
        const isOpen = winemakersMore.classList.contains('is-open');
        if (!isOpen) {
            winemakersMore.classList.add('is-open');
            winemakersMore.style.maxHeight = winemakersMore.scrollHeight + 'px';
            winemakersToggle.textContent = 'Show less';
        } else {
            winemakersMore.style.maxHeight = '0';
            winemakersMore.classList.remove('is-open');
            winemakersToggle.textContent = 'Show more winemakers';
        }
    });
}

const navHamburger = document.querySelector('.nav-hamburger');
const navEl = document.querySelector('nav');

if (navHamburger && navEl) {
    navHamburger.addEventListener('click', () => {
        navEl.classList.toggle('mobile-open');
        const isOpen = navEl.classList.contains('mobile-open');
        navHamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navEl.classList.remove('mobile-open');
            navHamburger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', e => {
        if (!navEl.contains(e.target) && navEl.classList.contains('mobile-open')) {
            navEl.classList.remove('mobile-open');
            navHamburger.setAttribute('aria-expanded', 'false');
        }
    });
}
