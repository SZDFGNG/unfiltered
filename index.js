const nav = document.querySelector('nav');
const logoImg = document.querySelector('.nav-logo img');
const stickyCta = document.getElementById('stickyCta');
const navSectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const navAnchorLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
let scrollAnimationFrameId = null;
let wheelScrollFrameId = null;
let wheelTargetTop = window.scrollY;

function easeInOutCubic(progress) {
    if (progress < 0.5) {
        return 4 * progress * progress * progress;
    }

    return 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function animateWindowScroll(targetTop) {
    if (wheelScrollFrameId) {
        window.cancelAnimationFrame(wheelScrollFrameId);
        wheelScrollFrameId = null;
    }

    if (scrollAnimationFrameId) {
        window.cancelAnimationFrame(scrollAnimationFrameId);
        scrollAnimationFrameId = null;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        window.scrollTo(0, targetTop);
        return;
    }

    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    const duration = Math.min(1100, Math.max(450, Math.abs(distance) * 0.6));
    const startTime = performance.now();
    wheelTargetTop = targetTop;

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        window.scrollTo(0, startTop + distance * easedProgress);

        if (progress < 1) {
            scrollAnimationFrameId = window.requestAnimationFrame(step);
            return;
        }

        scrollAnimationFrameId = null;
    }

    scrollAnimationFrameId = window.requestAnimationFrame(step);
}

function isInsideScrollableContainer(element) {
    let currentElement = element instanceof Element ? element : null;

    while (currentElement && currentElement !== document.body) {
        const styles = window.getComputedStyle(currentElement);
        const overflowY = styles.overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && currentElement.scrollHeight > currentElement.clientHeight;

        if (isScrollable) {
            return true;
        }

        currentElement = currentElement.parentElement;
    }

    return false;
}

function startWheelScrollAnimation() {
    if (wheelScrollFrameId) {
        return;
    }

    function step() {
        const currentTop = window.scrollY;
        const distance = wheelTargetTop - currentTop;

        if (Math.abs(distance) < 0.5) {
            window.scrollTo(0, wheelTargetTop);
            wheelScrollFrameId = null;
            return;
        }

        window.scrollTo(0, currentTop + distance * 0.14);
        wheelScrollFrameId = window.requestAnimationFrame(step);
    }

    wheelScrollFrameId = window.requestAnimationFrame(step);
}

function handleWheelScroll(event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || event.ctrlKey || event.defaultPrevented) {
        return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || isInsideScrollableContainer(event.target)) {
        return;
    }

    event.preventDefault();

    if (scrollAnimationFrameId) {
        window.cancelAnimationFrame(scrollAnimationFrameId);
        scrollAnimationFrameId = null;
    }

    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const deltaMultiplier = event.deltaMode === 1 ? 36 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * deltaMultiplier;

    wheelTargetTop = Math.max(0, Math.min(maxScrollTop, wheelTargetTop + delta));
    startWheelScrollAnimation();
}

function setActiveNavLink(activeId) {
    navSectionLinks.forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
    });
}

function getCurrentSectionId() {
    if (!navSectionLinks.length) {
        return null;
    }

    const trackedSections = navSectionLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!trackedSections.length) {
        return null;
    }

    const navHeight = nav ? nav.offsetHeight : 0;
    const markerPosition = window.scrollY + navHeight + window.innerHeight * 0.35;
    let currentSectionId = null;

    trackedSections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (markerPosition >= sectionTop && markerPosition < sectionBottom) {
            currentSectionId = section.id;
        }
    });

    if (!currentSectionId && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        currentSectionId = trackedSections[trackedSections.length - 1].id;
    }

    return currentSectionId;
}

function updateActiveNavSection() {
    const currentSectionId = getCurrentSectionId();
    setActiveNavLink(currentSectionId);
}

function handleNavAnchorClick(event) {
    const clickedLink = event.target instanceof Element
        ? event.target.closest('a[href^="#"]')
        : null;

    if (!clickedLink || !nav || !nav.contains(clickedLink)) {
        return;
    }

    const targetSelector = clickedLink.getAttribute('href');
    const targetSection = targetSelector ? document.querySelector(targetSelector) : null;

    if (!targetSection) {
        return;
    }

    event.preventDefault();

    const navHeight = nav.offsetHeight;
    const top = targetSection.getBoundingClientRect().top + window.scrollY - navHeight - 16;

    animateWindowScroll(Math.max(top, 0));

    if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState(null, '', targetSelector);
    }

    if (clickedLink.closest('.nav-links')) {
        setActiveNavLink(targetSection.id);
    }
}

if (nav) {
    nav.addEventListener('click', handleNavAnchorClick, true);
}

function updateNavAndStickyState() {
    if (!nav || !logoImg) {
        return;
    }

    if (!wheelScrollFrameId && !scrollAnimationFrameId) {
        wheelTargetTop = window.scrollY;
    }

    const isScrolled = window.scrollY > 0;
    const distanceFromBottom = document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
    const isAtPageBottom = distanceFromBottom <= 8;
    const shouldShowStickyCta = isScrolled && !isAtPageBottom;

    nav.classList.toggle('scrolled', isScrolled);
    logoImg.classList.toggle('scrolled', isScrolled);

    if (stickyCta) {
        stickyCta.classList.toggle('is-visible', shouldShowStickyCta);
        stickyCta.setAttribute('aria-hidden', shouldShowStickyCta ? 'false' : 'true');
    }

    document.body.classList.toggle('sticky-cta-visible', shouldShowStickyCta && Boolean(stickyCta));
}

updateNavAndStickyState();
updateActiveNavSection();
document.addEventListener('scroll', updateNavAndStickyState);
document.addEventListener('scroll', updateActiveNavSection);
window.addEventListener('wheel', handleWheelScroll, { passive: false });
window.addEventListener('resize', updateNavAndStickyState);
window.addEventListener('resize', updateActiveNavSection);
window.addEventListener('resize', () => {
    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    wheelTargetTop = Math.max(0, Math.min(maxScrollTop, window.scrollY));
});
window.addEventListener('load', () => {
    wheelTargetTop = window.scrollY;
});

function syncFestivalPhotoHeight() {
    const schedule = document.querySelector('.festival-schedule');
    const highlights = document.querySelector('.festival-highlights');
    const scheduleLabel = schedule ? schedule.querySelector('.festival-col-label') : null;
    const dayFlowList = schedule ? schedule.querySelector('.day-flow-list') : null;

    if (!schedule || !highlights || !scheduleLabel || !dayFlowList) {
        return;
    }

    if (window.innerWidth <= 920) {
        schedule.style.removeProperty('--festival-photo-height');
        return;
    }

    const available = highlights.offsetHeight - scheduleLabel.offsetHeight - dayFlowList.offsetHeight - 20;
    const clampedHeight = Math.max(180, Math.min(520, available));
    schedule.style.setProperty('--festival-photo-height', clampedHeight + 'px');
}

syncFestivalPhotoHeight();
window.addEventListener('resize', syncFestivalPhotoHeight);
window.addEventListener('load', syncFestivalPhotoHeight);

const locationSlider = document.querySelector('.location-description-media');

if (locationSlider) {
    const locationImages = locationSlider.querySelectorAll('.location-description-images img');
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

const winemakersTrack = document.getElementById('winemakersList');
const winemakersDots = document.getElementById('winemakersDots');
const winemakersPrev = document.getElementById('winemakersPrev');
const winemakersNext = document.getElementById('winemakersNext');

if (winemakersTrack && winemakersDots && winemakersPrev && winemakersNext) {
    const winemakerCards = Array.from(winemakersTrack.querySelectorAll('.winemaker-item'));
    let activeWinemakersPage = 0;

    function getWinemakersCardsPerPage() {
        if (window.innerWidth <= 640) {
            return 1;
        }

        if (window.innerWidth <= 920) {
            return 2;
        }

        if (window.innerWidth <= 1200) {
            return 3;
        }

        return 5;
    }

    function getWinemakersTotalPages() {
        const cardsPerPage = getWinemakersCardsPerPage();

        return Math.max(1, Math.ceil(winemakerCards.length / cardsPerPage));
    }

    function renderWinemakersDots() {
        const totalPages = getWinemakersTotalPages();
        winemakersDots.innerHTML = '';

        winemakersPrev.disabled = activeWinemakersPage === 0;
        winemakersNext.disabled = activeWinemakersPage === totalPages - 1;

        if (totalPages <= 1) {
            return;
        }

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'winemakers-slider-dot';
            dot.setAttribute('aria-label', 'Go to winemakers page ' + (pageIndex + 1));

            if (pageIndex === activeWinemakersPage) {
                dot.classList.add('is-active');
                dot.setAttribute('aria-current', 'true');
            }

            dot.addEventListener('click', function() {
                showWinemakersPage(pageIndex);
            });

            winemakersDots.appendChild(dot);
        }
    }

    function showWinemakersPage(pageIndex) {
        const cardsPerPage = getWinemakersCardsPerPage();
        const totalPages = getWinemakersTotalPages();
        const clampedPageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
        const firstCard = winemakerCards[0];

        if (!firstCard) {
            return;
        }

        const trackStyles = window.getComputedStyle(winemakersTrack);
        const gapValue = parseFloat(trackStyles.columnGap || trackStyles.gap || '0');
        const cardWidth = firstCard.getBoundingClientRect().width;
        const offset = (cardWidth + gapValue) * cardsPerPage * clampedPageIndex;

        activeWinemakersPage = clampedPageIndex;
        winemakersTrack.style.transform = 'translateX(-' + offset + 'px)';
        renderWinemakersDots();
    }

    function updateWinemakersSlider() {
        activeWinemakersPage = Math.min(activeWinemakersPage, getWinemakersTotalPages() - 1);
        showWinemakersPage(activeWinemakersPage);
    }

    winemakersPrev.addEventListener('click', function() {
        showWinemakersPage(activeWinemakersPage - 1);
    });

    winemakersNext.addEventListener('click', function() {
        showWinemakersPage(activeWinemakersPage + 1);
    });

    updateWinemakersSlider();
    window.addEventListener('resize', updateWinemakersSlider);
    window.addEventListener('load', updateWinemakersSlider);
}

const navHamburger = document.querySelector('.nav-hamburger');
const navEl = document.querySelector('nav');

if (navHamburger && navEl) {
    navHamburger.addEventListener('click', () => {
        navEl.classList.toggle('mobile-open');
        const isOpen = navEl.classList.contains('mobile-open');
        navHamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navAnchorLinks.forEach(link => {
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


const todoElements = Array.from(document.querySelectorAll('.todo:not(.show)'));
let lastTodoScrollY = window.scrollY;

function revealTodoElementsOnDownScroll() {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastTodoScrollY + 2;
    lastTodoScrollY = currentScrollY;

    if (!isScrollingDown) {
        return;
    }

    const revealLine = window.innerHeight * 0.88;

    const visibleElementsToReveal = [];

    todoElements.forEach(el => {
        if (el.classList.contains('show')) {
            return;
        }

        const rect = el.getBoundingClientRect();
        const isVisibleNearViewport = rect.top <= revealLine && rect.bottom >= 0;

        if (isVisibleNearViewport) {
            visibleElementsToReveal.push(el);
        }
    });

    visibleElementsToReveal.forEach((el, batchIndex) => {
        el.style.setProperty('--stagger-index', batchIndex);
        el.classList.add('show');
    });
}

document.addEventListener('scroll', revealTodoElementsOnDownScroll, { passive: true });
