/* ================================================================
   RUXOVA PERFUMES — Contact Page JS
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();
  hidePageLoader();
  initContactForm();
});

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit');
    setButtonLoading(btn, true, 'Sending...');

    const name    = document.getElementById('contact-name').value.trim();
    const email   = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showToast('Please fill all required fields', 'error');
      setButtonLoading(btn, false);
      return;
    }

    // Simulate sending (replace with actual API if needed)
    await new Promise(r => setTimeout(r, 1200));

    showToast('Message sent successfully! We\'ll get back to you soon. 🌹', 'success');
    form.reset();
    setButtonLoading(btn, false);
  });
}
