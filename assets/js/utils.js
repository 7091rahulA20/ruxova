/* ================================================================
   RUXOVA PERFUMES — Utility Functions
   Toast, loading, format helpers, animations, PDF Invoice export,
   Product Card rendering & Wishlist/Cart helpers.
   ================================================================ */

// ── Toast Notifications ──────────────────────────────────────────

function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warning: '⚠',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:18px;font-weight:700;">${icons[type] || '•'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ── Page Loader ──────────────────────────────────────────────────

function showPageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.remove('hidden');
}

function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 400);
  }
}

// ── Button Loading State ─────────────────────────────────────────

function setButtonLoading(btn, loading, text = '') {
  if (!btn) return;
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${text || 'Loading...'}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._originalText || text;
    btn.disabled = false;
  }
}

// ── Currency Format ──────────────────────────────────────────────

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  const hasDecimals = num % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// ── Date Format ──────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Star Rating HTML ─────────────────────────────────────────────

function renderStars(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += i <= Math.round(rating) ? '★' : '☆';
  }
  return `<span class="stars">${html}</span>`;
}

// ── Scroll Fade Animation ────────────────────────────────────────

function initFadeUp() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ── Cart Count Badge ─────────────────────────────────────────────

function updateCartBadge() {
  const cart  = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-count');
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── Wishlist Set ─────────────────────────────────────────────────

function getWishlistIds() {
  try {
    return JSON.parse(localStorage.getItem('ruxova_wishlist') || '[]');
  } catch {
    return [];
  }
}

function isInWishlist(productId) {
  return getWishlistIds().includes(productId);
}

// ── Product Card Renderer ─────────────────────────────────────────

function escHtml(str) {
  return String(str || '').replace(/'/g, "\\'");
}

function renderProductCard(p) {
  const discountPct = p.comparePrice
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
    : null;

  let rawImageUrl = 'assets/images/ruxova-perfumes-logo.png';
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    rawImageUrl = typeof first === 'string' ? first : (first.url || first.src || rawImageUrl);
  } else if (p.image) {
    rawImageUrl = typeof p.image === 'string' ? p.image : (p.image.url || p.image.src || rawImageUrl);
  }
  const imageUrl = window.optimizeImageUrl ? window.optimizeImageUrl(rawImageUrl, 500) : rawImageUrl;

  return `
    <div class="product-card fade-up"
         data-id="${p._id}"
         onclick="if(!event.target.closest('button')) { window.location.href='product.html?id=${p._id}'; }"
         style="cursor:pointer;"
    >
      <div style="position:relative;overflow:hidden;">
        <img
          class="product-img"
          src="${imageUrl}"
          alt="${p.name} — RUXOVA Luxury Perfume"
          title="${p.name} — RUXOVA Luxury Perfume"
          loading="lazy"
          decoding="async"
        >
        ${discountPct ? `<span class="badge">${discountPct}% OFF</span>` : ''}
        <button
          type="button"
          class="wishlist-btn ${isInWishlist(p._id) ? 'active' : ''}"
          data-id="${p._id}"
          aria-label="Add to wishlist"
          onclick="event.stopPropagation();"
        >♡</button>
      </div>
      <div class="product-card-body" style="padding:16px;">
        <p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
          ${p.category?.name || 'Fragrance'}
        </p>
        <h3 class="product-card-title" style="font-family:var(--font-serif);font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text-primary);line-height:1.3;">${p.name}</h3>
        ${p.numReviews > 0
          ? `<div style="margin-bottom:8px;">${renderStars(p.avgRating)} <span style="font-size:12px;color:var(--text-muted);">(${p.numReviews})</span></div>`
          : ''}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          <span style="font-size:18px;font-weight:700;color:var(--gold);">${formatCurrency(p.price)}</span>
          ${p.comparePrice ? `<span style="font-size:14px;text-decoration:line-through;color:var(--text-muted);">${formatCurrency(p.comparePrice)}</span>` : ''}
        </div>
        <div class="product-actions-wrap" style="display:flex;gap:8px;">
          <button
            type="button"
            class="btn btn-gold btn-add-cart"
            style="flex:1;font-size:13px;padding:10px;"
            onclick="event.stopPropagation(); handleAddToCart('${p._id}', '${escHtml(p.name)}', ${p.price}, '${imageUrl}')"
          >
            Add to Cart
          </button>
          <button
            type="button"
            class="btn btn-outline-gold btn-view-prod"
            style="padding:10px 14px;"
            onclick="window.location.href='product.html?id=${p._id}';"
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletons(count) {
  return Array(count).fill(`
    <div class="product-card" style="animation:pulse 1.5s ease infinite;">
      <div style="height:280px;background:var(--black-border);border-radius:var(--radius) var(--radius) 0 0;"></div>
      <div style="padding:16px;">
        <div style="height:12px;background:var(--black-border);border-radius:4px;margin-bottom:8px;width:60%;"></div>
        <div style="height:16px;background:var(--black-border);border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:12px;background:var(--black-border);border-radius:4px;margin-bottom:14px;width:40%;"></div>
        <div style="height:40px;background:var(--black-border);border-radius:8px;"></div>
      </div>
    </div>
  `).join('');
}

function handleAddToCart(id, name, price, image) {
  addToCart({ _id: id, name, price, images: [{ url: image }] });
  showToast(`${name} added to cart!`, 'success');
}

function attachCartListeners(container) {
  container.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id    = btn.dataset.addCart;
      const name  = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const image = btn.dataset.image;
      addToCart({ _id: id, name, price, images: [{ url: image }] });
      showToast(`${name} added to cart!`, 'success');
    });
  });
}

async function attachWishlistListeners(container) {
  container.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const user = getUser();
      if (!user) {
        showToast('Please login to use wishlist', 'warning');
        return;
      }
      const id = btn.dataset.id;
      try {
        const res = await api.put(`/users/wishlist/${id}`);
        btn.classList.toggle('active', res.added);
        btn.textContent = res.added ? '♥' : '♡';
        
        let wishlist = getWishlistIds();
        if (res.added) {
          wishlist.push(id);
        } else {
          wishlist = wishlist.filter(w => w !== id);
        }
        localStorage.setItem('ruxova_wishlist', JSON.stringify(wishlist));
        
        showToast(res.message, res.added ? 'success' : 'info');
      } catch {
        showToast('Please login to use wishlist', 'warning');
      }
    });
  });
}

// ── Navbar Active Link ────────────────────────────────────────────

function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ── Auth Guard ───────────────────────────────────────────────────

function requireAuth() {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    return false;
  }
  return true;
}

// ── Navbar Auth State ────────────────────────────────────────────

function updateNavbarAuth() {
  const user = getUser();
  const authLinks = document.getElementById('nav-auth-links');
  if (!authLinks) return;

  if (user) {
    authLinks.innerHTML = `
      <a href="orders.html">My Orders</a>
      <a href="#" id="nav-logout" class="btn btn-outline-gold btn-sm">Logout</a>
    `;
    document.getElementById('nav-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await api.post('/auth/logout'); } catch {}
      clearAuth();
      showToast('Logged out successfully', 'info');
      setTimeout(() => window.location.href = 'index.html', 800);
    });
  } else {
    authLinks.innerHTML = `
      <a href="login.html">Login</a>
      <a href="register.html" class="btn btn-gold btn-sm">Register</a>
    `;
  }
}

// ── Mobile Menu Toggle ────────────────────────────────────────────

function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ── Download Invoice PDF / Print ─────────────────────────────────

function printOrderInvoice(order) {
  const printWindow = window.open('', '_blank');
  const addr = order.shippingAddress || {};
  const itemsHtml = order.items.map((it, idx) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${idx + 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">${it.name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${it.price}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${it.price * it.quantity}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice — ${order.orderId}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; margin: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #C9A84C; letter-spacing: 2px; }
        .invoice-title { font-size: 22px; font-weight: bold; text-align: right; color: #444; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f8f8f8; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
        .total-box { margin-top: 30px; text-align: right; font-size: 16px; line-height: 1.8; }
        .footer { margin-top: 50px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">RUXOVA PERFUMES</div>
          <p style="margin:4px 0 0;color:#666;font-size:13px;">Luxury Fragrances & Perfumes</p>
        </div>
        <div>
          <div class="invoice-title">INVOICE</div>
          <p style="margin:4px 0 0;color:#666;font-size:13px;">Order #${order.orderId}</p>
          <p style="margin:4px 0 0;color:#666;font-size:13px;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <h4 style="margin:0 0 10px;color:#C9A84C;">Billed / Shipped To:</h4>
          <p style="margin:0;font-weight:bold;">${addr.name || 'Customer'}</p>
          <p style="margin:4px 0;">${addr.street || ''} ${addr.landmark ? '(Landmark: ' + addr.landmark + ')' : ''}</p>
          <p style="margin:4px 0;">${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</p>
          <p style="margin:4px 0;">Phone: ${addr.phone || ''}</p>
          <p style="margin:4px 0;">Email: ${addr.email || ''}</p>
        </div>
        <div>
          <h4 style="margin:0 0 10px;color:#C9A84C;">Order & Payment Info:</h4>
          <p style="margin:0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p style="margin:4px 0;"><strong>Payment Status:</strong> ${order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending')}</p>
          ${order.transactionId ? `<p style="margin:4px 0;"><strong>Transaction ID:</strong> ${order.transactionId}</p>` : ''}
          <p style="margin:4px 0;"><strong>Order Status:</strong> ${order.status}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-box">
        <p style="margin:0;">Subtotal: ₹${order.totalAmount - (order.shippingCharge || 0)}</p>
        <p style="margin:0;">Shipping Charge: ₹${order.shippingCharge || 0}</p>
        <p style="margin:4px 0;font-size:20px;font-weight:bold;color:#C9A84C;">Grand Total: ₹${order.totalAmount}</p>
      </div>

      <div class="footer">
        <p>Thank you for shopping with RUXOVA PERFUMES!</p>
        <p>For support, email us at hello@ruxova.com or call +91 98765 43210.</p>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── Influencer Referral Code Detection ──────────────────────────────

function captureReferralCode() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('coupon') || urlParams.get('influencer') || urlParams.get('r');
    if (ref) {
      const cleanRef = ref.trim().toUpperCase();
      localStorage.setItem('ruxova_ref', cleanRef);
      sessionStorage.setItem('ruxova_ref', cleanRef);
    }
  } catch (err) {
    // ignore
  }
}
captureReferralCode();

function getStoredRefCode() {
  return localStorage.getItem('ruxova_ref') || sessionStorage.getItem('ruxova_ref') || '';
}

function clearStoredRefCode() {
  localStorage.removeItem('ruxova_ref');
  sessionStorage.removeItem('ruxova_ref');
}

function initReferralBanner() {
  const code = getStoredRefCode();
  if (!code) return;

  let banner = document.getElementById('referral-top-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'referral-top-banner';
    banner.style.cssText = `
      background: linear-gradient(90deg, #9A7B3A 0%, #C9A84C 50%, #9A7B3A 100%);
      color: #0A0A0A;
      text-align: center;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      position: relative;
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    `;
    document.body.prepend(banner);
  }
  banner.innerHTML = `
    <span>🎁 Referral Link Active: You're shopping with <strong>${code}</strong>'s exclusive discount!</span>
    <span style="font-size:11px;opacity:0.8;">(Discount auto-applied at checkout)</span>
  `;
}

// ── Dynamic SEO & Schema (JSON-LD) Helper ──────────────────────────

function updatePageSeo(options = {}) {
  const {
    title,
    description,
    keywords,
    image,
    type = 'website',
    canonicalUrl = window.location.href,
    productSchema,
  } = options;

  if (title) {
    document.title = title;
    setMetaTag('property', 'og:title', title);
    setMetaTag('name', 'twitter:title', title);
  }

  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:description', description);
  }

  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }

  if (image) {
    setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'twitter:image', image);
  }

  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonicalUrl);

  if (productSchema) {
    let script = document.getElementById('json-ld-product');
    if (!script) {
      script = document.createElement('script');
      script.id = 'json-ld-product';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(productSchema);
  }
}

function setMetaTag(attr, key, content) {
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

document.addEventListener('DOMContentLoaded', () => {
  captureReferralCode();
  initReferralBanner();
});

// ── Expose Globals ────────────────────────────────────────────────

window.showToast               = showToast;
window.showPageLoader          = showPageLoader;
window.hidePageLoader          = hidePageLoader;
window.setButtonLoading        = setButtonLoading;
window.formatCurrency          = formatCurrency;
window.formatDate              = formatDate;
window.formatDateTime          = formatDateTime;
window.renderStars             = renderStars;
window.initFadeUp              = initFadeUp;
window.updateCartBadge         = updateCartBadge;
window.getWishlistIds          = getWishlistIds;
window.isInWishlist            = isInWishlist;
window.escHtml                 = escHtml;
window.renderProductCard       = renderProductCard;
window.renderSkeletons         = renderSkeletons;
window.handleAddToCart         = handleAddToCart;
window.attachCartListeners     = attachCartListeners;
window.attachWishlistListeners = attachWishlistListeners;
window.setActiveNavLink        = setActiveNavLink;
window.requireAuth             = requireAuth;
window.updateNavbarAuth        = updateNavbarAuth;
window.initMobileMenu          = initMobileMenu;
window.printOrderInvoice       = printOrderInvoice;
window.getStoredRefCode        = getStoredRefCode;
window.clearStoredRefCode      = clearStoredRefCode;
window.initReferralBanner      = initReferralBanner;
window.updatePageSeo           = updatePageSeo;
