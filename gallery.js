/* Native photo links remain usable when the enhanced viewer is unavailable. */
(() => {
    'use strict';

    const links = [...document.querySelectorAll('.photo-link')];
    const viewer = document.querySelector('.photo-viewer');
    if (!links.length || !viewer || typeof viewer.showModal !== 'function') return;

    const photo = viewer.querySelector('.photo-viewer-image');
    const caption = viewer.querySelector('.photo-viewer-caption');
    const count = viewer.querySelector('.photo-viewer-count');
    const openPhoto = viewer.querySelector('.photo-viewer-open-link');
    const stage = viewer.querySelector('.photo-viewer-stage');
    let current = 0;
    let trigger = null;
    let swipeStart = null;

    const showPhoto = index => {
        current = (index + links.length) % links.length;
        const link = links[current];
        photo.src = link.href;
        photo.alt = link.querySelector('img').alt;
        caption.textContent = link.dataset.caption;
        count.textContent = `${current + 1} / ${links.length}`;
        openPhoto.href = link.href;
    };

    links.forEach((link, index) => {
        link.addEventListener('click', event => {
            // Preserve new-tab clicks and other native link gestures.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            trigger = link;
            showPhoto(index);
            viewer.showModal();
            document.documentElement.classList.add('photo-viewer-open');
        });
    });

    viewer.querySelector('.photo-viewer-close').addEventListener('click', () => viewer.close());
    viewer.querySelector('.photo-viewer-prev').addEventListener('click', () => showPhoto(current - 1));
    viewer.querySelector('.photo-viewer-next').addEventListener('click', () => showPhoto(current + 1));
    viewer.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            showPhoto(current + (event.key === 'ArrowLeft' ? -1 : 1));
        }
    });
    viewer.addEventListener('click', event => {
        if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener('close', () => {
        document.documentElement.classList.remove('photo-viewer-open');
        swipeStart = null;
        if (trigger) trigger.focus({ preventScroll: true });
    });

    stage.addEventListener('pointerdown', event => {
        swipeStart = event.pointerType === 'touch' && event.target === photo ?
            { x: event.clientX, y: event.clientY } : null;
    });
    stage.addEventListener('pointerup', event => {
        if (!swipeStart) return;
        const dx = event.clientX - swipeStart.x;
        const dy = event.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            showPhoto(current + (dx < 0 ? 1 : -1));
        }
    });
    stage.addEventListener('pointercancel', () => { swipeStart = null; });
})();
