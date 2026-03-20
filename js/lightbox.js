/* Lightbox — extracted for CSP compliance (no inline scripts/handlers) */

function openLightbox(src, alt) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxImg').alt = alt || '';
    document.getElementById('lightbox').classList.add('is-open');
    document.addEventListener('keydown', _lbEsc);
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('is-open');
    document.removeEventListener('keydown', _lbEsc);
}

function _lbEsc(e) {
    if (e.key === 'Escape') {
        document.getElementById('lightbox').classList.remove('is-open');
        document.removeEventListener('keydown', _lbEsc);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Lightbox triggers — read src and alt from data attributes
    document.querySelectorAll('.lightbox-trigger').forEach(function (img) {
        img.addEventListener('click', function () {
            openLightbox(this.dataset.full, this.alt);
        });
    });

    // Lightbox backdrop — click to close
    var lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', closeLightbox);
        // Prevent close when clicking the image itself
        var content = lightbox.querySelector('.lightbox-content');
        if (content) {
            content.addEventListener('click', function (e) { e.stopPropagation(); });
        }
        // Close button
        var closeBtn = lightbox.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }
    }

    // Logo fallback — replace broken image with placeholder
    var logo = document.querySelector('.landing-logo');
    if (logo) {
        logo.addEventListener('error', function () {
            this.outerHTML = '<div class="landing-logo-placeholder">CLUB<br>LOGO</div>';
        });
    }
});
