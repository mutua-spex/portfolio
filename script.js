
document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function (e) {
        if (this.getAttribute("href").endsWith(".html")) {
            e.preventDefault();
            document.querySelector(".page-transition").style.animation = "none";
            document.querySelector(".page-transition").offsetHeight;
            document.querySelector(".page-transition").style.animation = "fadeOut 0.5s reverse forwards";
            setTimeout(() => { window.location = this.href; }, 500);
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const lightbox = document.getElementById('galleryLightbox');

    if (galleryCards.length && lightbox) {
        const lightboxImage = lightbox.querySelector('img');
        const lightboxTag = document.getElementById('lightboxTag');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxMeta = document.getElementById('lightboxMeta');
        const lightboxCaption = document.getElementById('lightboxCaption');
        const closeButton = document.querySelector('.lightbox-close');

        function closeLightbox() {
            lightbox.classList.remove('show');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        galleryCards.forEach(card => {
            const openLightbox = () => {
                const image = card.querySelector('img');
                lightboxImage.src = image.src;
                lightboxImage.alt = image.alt || card.dataset.title || 'Portfolio gallery item';
                lightboxTag.textContent = card.querySelector('.gallery-tag')?.textContent || 'Gallery';
                lightboxTitle.textContent = card.dataset.title || 'Gallery item';
                lightboxMeta.textContent = card.dataset.meta || 'Portfolio highlight';
                lightboxCaption.textContent = card.dataset.caption || '';
                lightbox.classList.add('show');
                lightbox.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            };

            card.addEventListener('click', openLightbox);
            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox();
                }
            });
        });

        closeButton && closeButton.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && lightbox.classList.contains('show')) closeLightbox();
        });
    }

    let form = document.getElementById("contactForm");
    if (form) {
        // Modal elements for feedback
        const modal = document.getElementById('contactModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalClose = document.getElementById('modalClose');

        function showModal(title, message) {
            if (!modal) return alert(title + '\n\n' + message);
            modalTitle.textContent = title;
            modalMessage.innerHTML = escapeHtml(message).replace(/\n/g, '<br>');
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            if (modalClose) modalClose.focus();
        }

        function hideModal() {
            if (!modal) return;
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }

        modalClose && modalClose.addEventListener('click', hideModal);
        modal && modal.addEventListener('click', function (e) { if (e.target === modal) hideModal(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && modal.classList.contains('show')) hideModal(); });

        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            const origBtnText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
            const cfg = window.CONTACT_CONFIG || {};
            const formData = new FormData(form);
            const payload = {
                name: formData.get('name') || '',
                email: formData.get('email') || '',
                phone: formData.get('phone') || '',
                subject: formData.get('subject') || 'Website contact',
                message: formData.get('message') || '',
                page_url: window.location.href,
                timestamp: new Date().toISOString()
            };

            try {
                const smtpReady = cfg.mode === 'smtp' && cfg.smtp && cfg.smtp.SecureToken && cfg.smtp.SecureToken !== 'YOUR_SMTPJS_SECURETOKEN_HERE';
                const formspreeReady = cfg.mode === 'formspree' && cfg.formspreeEndpoint && cfg.formspreeEndpoint !== 'https://formspree.io/f/your_form_id_here';

                if (cfg.mode === 'smtp' && !smtpReady) {
                    throw new Error('SMTP is not configured. Add a valid SMTPJS SecureToken or switch to Formspree mode.');
                }

                if (cfg.mode === 'formspree' && !formspreeReady) {
                    throw new Error('Formspree endpoint is missing. Add your Formspree form ID or switch to SMTP mode.');
                }

                if (cfg.mode === 'smtp') {
                    if (!window.Email) {
                        await loadScript('https://smtpjs.com/v3/smtp.js');
                    }
                    const bodyHtml = buildHtml(payload);
                    await window.Email.send({
                        SecureToken: cfg.smtp.SecureToken,
                        To: cfg.smtp.To,
                        From: cfg.smtp.From,
                        Subject: `[Website Contact] ${payload.subject} — ${payload.name}`,
                        Body: bodyHtml
                    });
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origBtnText; }
                    form.reset();
                    showModal('Message sent', `Thanks — your message was sent. I will reply to ${payload.email || 'your email'} soon.`);
                } else if (cfg.mode === 'formspree') {
                    const submitData = new FormData();
                    submitData.append('name', payload.name);
                    submitData.append('email', payload.email);
                    submitData.append('phone', payload.phone);
                    submitData.append('subject', payload.subject);
                    submitData.append('message', payload.message + '\n\nPage: ' + payload.page_url + '\nReceived: ' + payload.timestamp);

                    const res = await fetch(cfg.formspreeEndpoint, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' },
                        body: submitData
                    });
                    if (res.ok) {
                        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origBtnText; }
                        form.reset();
                        showModal('Thanks', `Your message was sent. I will reply to ${payload.email || 'your email'} soon.`);
                    } else {
                        const json = await res.json().catch(() => null);
                        throw new Error((json && json.error) ? json.error : 'Failed to submit form');
                    }
                } else {
                    throw new Error('Contact not configured. Set window.CONTACT_CONFIG with Formspree or SMTP settings.');
                }
            } catch (err) {
                console.error(err);
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origBtnText; }
                showModal('Error', 'Failed to send message: ' + err.message);
            }
        });
    }
});

function buildHtml(payload) {
    return `
	  <h2>New contact form submission</h2>
	  <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
	  <p><strong>Email:</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
	  <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
	  <p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>
	  <p><strong>Message:</strong></p>
	  <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
	  <hr>
	  <p><small>Page: <a href="${escapeHtml(payload.page_url)}">${escapeHtml(payload.page_url)}</a></small></p>
	  <p><small>Received: ${escapeHtml(payload.timestamp)}</small></p>
	`;
}

function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

// Stat Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    let alreadyAnimated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !alreadyAnimated) {
                alreadyAnimated = true;
                counters.forEach(counter => {
                    const target = parseInt(counter.dataset.target);
                    const duration = 1500;
                    const startTime = Date.now();

                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const current = Math.floor(target * progress);
                        counter.textContent = current;

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    };

                    animate();
                });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });

    if (counters.length) {
        counters[0].parentElement.parentElement.forEach((el) => observer.observe(el));
    }
}

// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    // Observe elements with fade-in class
    document.querySelectorAll('.fade-in, .service-card, .timeline-item, .skill-category').forEach(el => {
        observer.observe(el);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    animateCounters();
    initScrollAnimations();
});
