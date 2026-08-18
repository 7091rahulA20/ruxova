/* ================================================================
   RUXOVA PERFUMES — Home Page JS
   Hero, Featured Products, Most Loved, Testimonials
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Init shared utilities
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();
  hidePageLoader();

  await Promise.all([
    loadFeaturedProducts(),
    loadMostLoved(),
    loadCategories(),
  ]);

  initFadeUp();
  initHeroAnimations();
});

// ── Hero Animations ──────────────────────────────────────────────

function initHeroAnimations() {
  const heroTitle = document.querySelector('.hero-title');
  const heroSub   = document.querySelector('.hero-subtitle');
  const heroBtns  = document.querySelector('.hero-buttons');

  if (heroTitle) {
    heroTitle.style.animation  = 'fadeUp 0.8s ease 0.2s both';
  }
  if (heroSub) {
    heroSub.style.animation = 'fadeUp 0.8s ease 0.4s both';
  }
  if (heroBtns) {
    heroBtns.style.animation = 'fadeUp 0.8s ease 0.6s both';
  }
}

// ── Featured Products ─────────────────────────────────────────────

async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  try {
    grid.innerHTML = renderSkeletons(4);
    const { products } = await api.get('/products/featured');
    
    if (!products || products.length === 0) {
      grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;">No featured products yet.</p>';
      return;
    }

    grid.innerHTML = products.slice(0, 8).map(renderProductCard).join('');
    attachCartListeners(grid);
    attachWishlistListeners(grid);
  } catch (err) {
    grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;">Failed to load products.</p>';
  }
}

// ── Most Loved ────────────────────────────────────────────────────

async function loadMostLoved() {
  const grid = document.getElementById('most-loved-grid');
  if (!grid) return;

  try {
    grid.innerHTML = renderSkeletons(3);
    const { products } = await api.get('/products/most-loved');
    
    if (!products || products.length === 0) {
      grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;">Check back soon.</p>';
      return;
    }

    grid.innerHTML = products.slice(0, 6).map(renderProductCard).join('');
    attachCartListeners(grid);
    attachWishlistListeners(grid);
  } catch (err) {
    console.error(err);
  }
}

// ── Categories ────────────────────────────────────────────────────

async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  try {
    const { categories } = await api.get('/categories');
    if (!categories?.length) return;

    grid.innerHTML = categories.map(cat => `
      <a href="shop.html?category=${cat._id}" class="category-card fade-up" style="text-decoration:none;">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05));border:1px solid var(--gold-dark);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">
          ${cat.image?.url
            ? `<img src="${cat.image.url}" alt="${cat.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : '🌸'}
        </div>
        <p style="font-family:var(--font-serif);font-size:15px;text-align:center;color:var(--text-primary);">${cat.name}</p>
      </a>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}
