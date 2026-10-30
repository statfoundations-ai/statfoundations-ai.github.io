/* Shared navigation behavior for every conference page. */
(() => {
    'use strict';

    const root = document.documentElement;
    const header = document.querySelector('.site-nav');
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-list');
    const mobile = window.matchMedia('(max-width: 1010px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sectionNav = document.querySelector('.page-subnav, .schedule-jump');
    const alphabet = document.querySelector('.speaker-alphabet');
    const alphabetBack = document.querySelector('.speaker-alphabet-back');
    const alphabetMore = document.querySelector('.speaker-alphabet-more');
    const stickyNav = sectionNav || document.querySelector('.speaker-alphabet-wrap');
    const sectionLinks = sectionNav ? [...sectionNav.querySelectorAll('a[href^="#"]')] : [];
    const sections = sectionLinks.map(link => document.getElementById(link.hash.slice(1)));
    let activeLink = null;
    let scrollFrame = 0;

    const setMenuOpen = (open, restoreFocus = false) => {
        open = open && mobile.matches;
        menu.classList.toggle('active', open);
        menu.inert = mobile.matches && !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('active')));
    // Leave link activation to the browser. The destination page (or pageshow
    // on history restoration) resets the menu without interrupting navigation.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('active')) {
            event.preventDefault();
            setMenuOpen(false, true);
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!header.contains(event.target)) setMenuOpen(false);
    });
    header.addEventListener('focusout', event => {
        // activeElement may still be the body while the browser transfers focus
        // from the toggle to a link. Closing then makes the link inert before
        // its click. relatedTarget identifies where focus is actually going.
        // A null destination can mean window blur or a non-focusable click;
        // outside pointerdown and Escape already handle explicit dismissal.
        if (event.relatedTarget && !header.contains(event.relatedTarget)) {
            setMenuOpen(false);
        }
    });
    const resetMenu = () => {
        const focusedMenuLink = menu.contains(document.activeElement);
        setMenuOpen(false, mobile.matches && focusedMenuLink);
    };
    mobile.addEventListener('change', resetMenu);
    // A restored back/forward page must not retain an expanded mobile menu.
    window.addEventListener('pageshow', resetMenu);
    resetMenu();

    const updateCurrentSection = () => {
        scrollFrame = 0;
        if (!sectionNav || !sectionNav.getBoundingClientRect().height) return;
        const boundary = header.getBoundingClientRect().height +
            sectionNav.getBoundingClientRect().height + 24;
        let current = 0;
        sections.forEach((section, index) => {
            if (section && section.getBoundingClientRect().top <= boundary) current = index;
        });
        const nextLink = sectionLinks[current];
        if (!nextLink || nextLink === activeLink) return;
        activeLink = nextLink;
        sectionLinks.forEach(link => {
            if (link === activeLink) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        // Reveal the active pill without scrolling the document vertically.
        if (sectionNav.scrollWidth > sectionNav.clientWidth) {
            const navRect = sectionNav.getBoundingClientRect();
            const linkRect = activeLink.getBoundingClientRect();
            const delta = linkRect.left < navRect.left ? linkRect.left - navRect.left - 8 :
                linkRect.right > navRect.right ? linkRect.right - navRect.right + 8 : 0;
            if (delta) sectionNav.scrollTo({
                left: sectionNav.scrollLeft + delta,
                behavior: reducedMotion.matches ? 'instant' : 'smooth'
            });
        }
    };
    const scheduleSectionUpdate = () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateCurrentSection);
    };
    const syncAlphabetOverflow = () => {
        if (!alphabet) return;
        if (alphabetBack) alphabetBack.hidden = alphabet.scrollLeft <= 1;
        if (alphabetMore) {
            alphabetMore.hidden = alphabet.scrollWidth - alphabet.clientWidth - alphabet.scrollLeft <= 1;
        }
    };
    if (alphabet) {
        alphabet.addEventListener('scroll', syncAlphabetOverflow, { passive: true });
        for (const [button, direction] of [[alphabetBack, -1], [alphabetMore, 1]]) {
            if (button) button.addEventListener('click', () => {
                alphabet.scrollBy({
                    left: direction * alphabet.clientWidth * 0.75,
                    behavior: reducedMotion.matches ? 'instant' : 'smooth'
                });
            });
        }
        window.addEventListener('pageshow', syncAlphabetOverflow);
    }
    const syncHeights = () => {
        root.style.setProperty('--nav-h', `${header.getBoundingClientRect().height}px`);
        root.style.setProperty('--subnav-h', `${stickyNav ? stickyNav.getBoundingClientRect().height : 0}px`);
        syncAlphabetOverflow();
        // A resized horizontal row may need to reveal the selected pill again.
        activeLink = null;
        scheduleSectionUpdate();
    };
    if (window.ResizeObserver) {
        const observer = new ResizeObserver(syncHeights);
        observer.observe(header);
        if (stickyNav) observer.observe(stickyNav);
    }
    window.addEventListener('resize', syncHeights, { passive: true });
    window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
    window.addEventListener('hashchange', scheduleSectionUpdate);
    if (document.fonts) document.fonts.ready.then(syncHeights);
    syncHeights();
})();
