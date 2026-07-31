/* ================================================================
   RUXOVA PERFUMES — Product Detail Page & Image Gallery JS
   Gallery, Thumbnails, Lightbox Zoom, Touch Swipe, Keyboard Nav,
   Specifications, Reviews & Review Submission, Related Products.
   ================================================================ */

let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];
let currentZoom = 1;
let selectedRating = 5;

document.addEventListener('DOMContentLoaded', async () => {
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();

  const productId = new URLSearchParams(window.location.search).get('id');
  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }

  await loadProduct(productId);
  initKeyboardNav();
  initLightboxControls();
  hidePageLoader();
});

// ── Load Product ──────────────────────────────────────────────────

async function loadProduct(id) {
  const container = document.getElementById('product-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center;padding:80px;"><div class="loader-ring" style="margin:auto;"></div></div>`;

  try {
    const { product } = await api.get(`/products/${id}`);
    currentProduct = product;
    productImages  = product.images?.length > 0
      ? product.images.map(img => img.url)
      : ['assets/images/placeholder.jpg'];

    currentImageIndex = 0;
    preloadImages(productImages);

    renderProduct(product);

    const prodImageUrl = productImages[0] || 'assets/images/placeholder.jpg';
    const canonicalUrl = `${window.location.origin}/product.html?id=${product._id}`;
    const cleanDesc = (product.description || `Buy ${product.name} luxury perfume online at RUXOVA PERFUMES.`).replace(/<[^>]*>?/gm, '');

    if (typeof updatePageSeo === 'function') {
      updatePageSeo({
        title: `${product.name} — Luxury Perfume | RUXOVA PERFUMES`,
        description: cleanDesc,
        keywords: `${product.name}, ${product.category?.name || 'Perfume'}, luxury perfume, fragrance, buy perfume online`,
        image: prodImageUrl,
        type: 'product',
        canonicalUrl: canonicalUrl,
        productSchema: {
          '@context': 'https://schema.org/',
          '@type': 'Product',
          'name': product.name,
          'image': productImages,
          'description': cleanDesc,
          'sku': product._id,
          'brand': {
            '@type': 'Brand',
            'name': 'RUXOVA PERFUMES'
          },
          'offers': {
            '@type': 'Offer',
            'url': canonicalUrl,
            'priceCurrency': 'INR',
            'price': product.price,
            'priceValidUntil': '2028-12-31',
            'itemCondition': 'https://schema.org/NewCondition',
            'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          },
          ...(product.numReviews > 0 ? {
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': product.avgRating || 5,
              'reviewCount': product.numReviews
            }
          } : {})
        }
      });
    } else {
      document.title = `${product.name} — RUXOVA PERFUMES`;
    }

    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = product.name;

    await loadRelatedProducts(product.category?._id || product.category);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px;">
        <p style="color:var(--error);">${err.message || 'Product not found'}</p>
        <a href="shop.html" class="btn btn-gold" style="margin-top:20px;">Back to Shop</a>
      </div>`;
  }
}

// ── Preload Images for smooth transition ──────────────────────────

function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

// ── Render Product Layout ─────────────────────────────────────────

function renderProduct(p) {
  const wishlistActive = isInWishlist(p._id);
  const discountPct = p.comparePrice
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
    : null;

  const avgRatingNum = p.avgRating || 5.0;
  const numReviewsNum = p.numReviews || 0;

  document.getElementById('product-container').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;" class="product-layout fade-up">

      <!-- Image Gallery Column -->
      <div>
        <div id="main-image-box" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;background:var(--black-card);border:1px solid var(--black-border);aspect-ratio:1;cursor:zoom-in;">
          <img id="main-image"
            src="${productImages[0]}"
            alt="${p.name}"
            style="width:100%;height:100%;object-fit:cover;transition:opacity 0.25s ease;"
          >
          ${discountPct ? `<div style="position:absolute;top:16px;left:16px;background:var(--gold);color:var(--black);padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;z-index:2;">${discountPct}% OFF</div>` : ''}
          
          <!-- Prev / Next Slider Arrows -->
          ${productImages.length > 1 ? `
            <button type="button" id="gallery-prev" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:var(--gold);border:1px solid var(--gold);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;z-index:3;transition:background 0.2s;">‹</button>
            <button type="button" id="gallery-next" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:var(--gold);border:1px solid var(--gold);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;z-index:3;transition:background 0.2s;">›</button>
          ` : ''}

          <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.7);color:var(--text-primary);padding:4px 10px;border-radius:12px;font-size:11px;border:1px solid var(--black-border);pointer-events:none;z-index:2;">
            🔍 Click to Zoom (Image 1 of ${productImages.length})
          </div>
        </div>

        <!-- Thumbnails Gallery Row -->
        ${productImages.length > 1 ? `
          <div style="display:flex;gap:12px;margin-top:16px;overflow-x:auto;padding-bottom:6px;" id="thumb-row">
            ${productImages.map((imgUrl, i) => `
              <div style="position:relative;flex-shrink:0;">
                <img
                  src="${imgUrl}"
                  alt="${p.name} thumbnail ${i + 1}"
                  data-index="${i}"
                  class="thumb-img ${i === 0 ? 'active' : ''}"
                  style="width:76px;height:76px;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid ${i === 0 ? 'var(--gold)' : 'var(--black-border)'};transition:all 0.2s;"
                >
                <span style="position:absolute;bottom:2px;right:4px;background:rgba(0,0,0,0.7);color:#fff;font-size:9px;padding:1px 4px;border-radius:4px;pointer-events:none;">
                  #${i + 1}
                </span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info Column -->
      <div>
        <p style="color:var(--gold);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">${p.category?.name || 'Luxury Fragrance'}</p>
        <h1 style="font-family:var(--font-serif);font-size:clamp(26px,3.5vw,40px);font-weight:700;line-height:1.2;margin-bottom:12px;">${p.name}</h1>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
          ${renderStars(avgRatingNum)}
          <span style="color:var(--text-secondary);font-size:14px;font-weight:600;">
            ${avgRatingNum.toFixed(1)} (${numReviewsNum} customer review${numReviewsNum !== 1 ? 's' : ''})
          </span>
        </div>

        <div style="display:flex;align-items:baseline;gap:14px;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:700;color:var(--gold);">${formatCurrency(p.price)}</span>
          ${p.comparePrice ? `<span style="font-size:20px;text-decoration:line-through;color:var(--text-muted);">${formatCurrency(p.comparePrice)}</span>` : ''}
        </div>

        <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:24px;font-size:15px;">${p.description}</p>

        <!-- Specifications & Details Grid -->
        <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
          <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:14px;color:var(--gold);">Product Specifications</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${detailChip('Brand', 'RUXOVA PERFUMES')}
            ${detailChip('Volume', p.volume || '100ml')}
            ${detailChip('Gender', p.gender || 'Unisex')}
            ${detailChip('Stock', p.stock > 0 ? `<span style="color:var(--success);">${p.stock} available</span>` : `<span style="color:var(--error);">Out of Stock</span>`)}
          </div>
        </div>

        <!-- Scent Notes -->
        ${p.scentNotes?.top || p.scentNotes?.middle || p.scentNotes?.base ? `
          <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
            <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:14px;color:var(--gold);">Fragrance Notes Profile</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
              ${p.scentNotes.top    ? scentNote('Top Notes',    p.scentNotes.top)    : ''}
              ${p.scentNotes.middle ? scentNote('Heart Notes',  p.scentNotes.middle) : ''}
              ${p.scentNotes.base   ? scentNote('Base Notes',   p.scentNotes.base)   : ''}
            </div>
          </div>
        ` : ''}

        <!-- Quantity Selector -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:600;">Quantity:</label>
          <div style="display:flex;align-items:center;border:1px solid var(--black-border);border-radius:8px;overflow:hidden;background:var(--black-soft);">
            <button type="button" onclick="changeQty(-1)" style="width:40px;height:40px;background:none;color:var(--text-primary);border:none;cursor:pointer;font-size:18px;">−</button>
            <span id="qty-display" style="width:44px;text-align:center;font-weight:600;color:var(--gold);">1</span>
            <button type="button" onclick="changeQty(1)"  style="width:40px;height:40px;background:none;color:var(--text-primary);border:none;cursor:pointer;font-size:18px;">+</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
          <button id="add-to-cart-btn" class="btn btn-gold btn-lg" onclick="handleAddToCartDetail()" ${p.stock === 0 ? 'disabled' : ''}>
            🛒 Add to Cart
          </button>
          <a href="checkout.html" id="buy-now-btn"
             class="btn btn-outline-gold btn-lg"
             onclick="handleBuyNow()"
             style="text-align:center;text-decoration:none;"
          >
            ⚡ Buy Now
          </a>
        </div>

        <!-- Wishlist -->
        <button
          id="wishlist-btn"
          onclick="handleWishlist('${p._id}')"
          style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;color:${wishlistActive ? 'var(--gold)' : 'var(--text-secondary)'};font-size:14px;padding:0;transition:color 0.2s;"
        >
          ${wishlistActive ? '♥ In Wishlist' : '♡ Add to Wishlist'}
        </button>
      </div>
    </div>

    <!-- Customer Reviews & Submission Form -->
    <div style="margin-top:64px;" id="reviews-section">
      <h2 style="font-family:var(--font-serif);font-size:26px;margin-bottom:24px;border-bottom:1px solid var(--black-border);padding-bottom:16px;">Customer Reviews & Ratings</h2>
      
      <!-- Review Form -->
      <div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:24px;margin-bottom:32px;">
        <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:16px;color:var(--gold);">Write a Customer Review</h3>
        <form id="review-form" onsubmit="submitReview(event)" style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:8px;">Rating Score:</label>
            <div style="display:flex;gap:8px;font-size:24px;cursor:pointer;" id="rating-star-picker">
              ${[1, 2, 3, 4, 5].map(star => `
                <span class="star-opt" data-rating="${star}" onclick="selectRatingScore(${star})" style="color:${star <= selectedRating ? 'var(--gold)' : 'var(--text-muted)'};">★</span>
              `).join('')}
            </div>
          </div>
          <div>
            <label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:8px;">Your Review:</label>
            <textarea id="review-comment" class="form-control" rows="3" placeholder="Share details about the scent profile, longevity, and your experience..." required style="width:100%;padding:12px;background:var(--black-soft);border:1px solid var(--black-border);border-radius:8px;color:#fff;"></textarea>
          </div>
          <button type="submit" class="btn btn-gold" style="align-self:flex-start;">Submit Review</button>
        </form>
      </div>

      <!-- Reviews List -->
      ${renderReviews(p.reviews)}
    </div>

    <!-- Related Products Container -->
    <div style="margin-top:64px;" id="related-section">
      <h2 style="font-family:var(--font-serif);font-size:26px;margin-bottom:32px;border-bottom:1px solid var(--black-border);padding-bottom:16px;">Related Perfumes</h2>
      <div id="related-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px;"></div>
    </div>
  `;

  initGalleryInteractions();
}

// ── Gallery Interactions ──────────────────────────────────────────

function initGalleryInteractions() {
  const mainBox = document.getElementById('main-image-box');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  // Thumbnail clicks
  document.querySelectorAll('.thumb-img').forEach(img => {
    img.addEventListener('click', () => {
      const idx = parseInt(img.dataset.index, 10);
      switchGalleryImage(idx);
    });
  });

  // Prev / Next arrows
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(currentImageIndex - 1);
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(currentImageIndex + 1);
  });

  // Open Lightbox Zoom on main image click
  mainBox?.addEventListener('click', () => {
    openLightbox(currentImageIndex);
  });

  // Touch Swipe Gesture for mobile
  let touchStartX = 0;
  mainBox?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  mainBox?.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) switchGalleryImage(currentImageIndex + 1);
    if (touchEndX - touchStartX > 50) switchGalleryImage(currentImageIndex - 1);
  }, { passive: true });
}

function switchGalleryImage(index) {
  if (!productImages.length) return;

  if (index < 0) index = productImages.length - 1;
  if (index >= productImages.length) index = 0;

  currentImageIndex = index;
  const mainImg = document.getElementById('main-image');
  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = productImages[currentImageIndex];
      mainImg.style.opacity = '1';
    }, 120);
  }

  // Highlight thumbnail
  document.querySelectorAll('.thumb-img').forEach((t, i) => {
    if (i === currentImageIndex) {
      t.style.borderColor = 'var(--gold)';
      t.classList.add('active');
      t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      t.style.borderColor = 'var(--black-border)';
      t.classList.remove('active');
    }
  });
}

// ── Keyboard Arrow Navigation ────────────────────────────────────

function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    const isLbOpen = lightbox && lightbox.classList.contains('open');

    if (e.key === 'ArrowLeft') {
      if (isLbOpen) switchLightboxImage(currentImageIndex - 1);
      else switchGalleryImage(currentImageIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (isLbOpen) switchLightboxImage(currentImageIndex + 1);
      else switchGalleryImage(currentImageIndex + 1);
    } else if (e.key === 'Escape' && isLbOpen) {
      closeLightbox();
    }
  });
}

// ── Fullscreen Lightbox Zoom ─────────────────────────────────────

function initLightboxControls() {
  document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lb-prev')?.addEventListener('click', () => switchLightboxImage(currentImageIndex - 1));
  document.getElementById('lb-next')?.addEventListener('click', () => switchLightboxImage(currentImageIndex + 1));

  document.getElementById('lb-zoom-in')?.addEventListener('click', () => changeZoom(0.25));
  document.getElementById('lb-zoom-out')?.addEventListener('click', () => changeZoom(-0.25));
  document.getElementById('lb-reset-zoom')?.addEventListener('click', () => resetZoom());
}

function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  resetZoom();
  switchLightboxImage(index);
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function switchLightboxImage(index) {
  if (!productImages.length) return;
  if (index < 0) index = productImages.length - 1;
  if (index >= productImages.length) index = 0;

  currentImageIndex = index;
  resetZoom();

  const lbImg = document.getElementById('lightbox-img');
  const counter = document.getElementById('lightbox-counter');

  if (lbImg) {
    lbImg.style.opacity = '0.3';
    setTimeout(() => {
      lbImg.src = productImages[currentImageIndex];
      lbImg.style.opacity = '1';
    }, 100);
  }

  if (counter) {
    counter.textContent = `Image ${currentImageIndex + 1} of ${productImages.length}`;
  }

  switchGalleryImage(currentImageIndex);
}

function changeZoom(delta) {
  currentZoom = Math.min(Math.max(0.5, currentZoom + delta), 3);
  applyZoom();
}

function resetZoom() {
  currentZoom = 1;
  applyZoom();
}

function applyZoom() {
  const lbImg = document.getElementById('lightbox-img');
  if (lbImg) {
    lbImg.style.transform = `scale(${currentZoom})`;
  }
}

// ── Review Functions ──────────────────────────────────────────────

function selectRatingScore(score) {
  selectedRating = score;
  document.querySelectorAll('#rating-star-picker .star-opt').forEach(star => {
    const s = parseInt(star.dataset.rating, 10);
    star.style.color = s <= score ? 'var(--gold)' : 'var(--text-muted)';
  });
}

async function submitReview(e) {
  e.preventDefault();
  const user = getUser();
  if (!user) {
    showToast('Please login to write a review', 'warning');
    return;
  }

  const comment = document.getElementById('review-comment')?.value?.trim();
  if (!comment) return;

  try {
    const res = await api.post(`/products/${currentProduct._id}/reviews`, {
      rating: selectedRating,
      comment
    });
    showToast(res.message || 'Review submitted successfully!', 'success');
    await loadProduct(currentProduct._id);
  } catch (err) {
    showToast(err.message || 'Failed to submit review', 'error');
  }
}

// ── Related Products ──────────────────────────────────────────────

async function loadRelatedProducts(categoryId) {
  const grid = document.getElementById('related-grid');
  if (!grid || !categoryId) return;

  try {
    const { products } = await api.get(`/products?category=${categoryId}&limit=5`);
    const filtered = (products || []).filter(p => p._id !== currentProduct._id).slice(0, 4);

    if (!filtered.length) {
      document.getElementById('related-section').style.display = 'none';
      return;
    }

    if (typeof renderProductCard === 'function') {
      grid.innerHTML = filtered.map(renderProductCard).join('');
      if (typeof attachCartListeners === 'function') attachCartListeners(grid);
      if (typeof attachWishlistListeners === 'function') attachWishlistListeners(grid);
    }
  } catch (err) {
    console.warn('Failed to load related products:', err.message);
  }
}

// ── Details Helpers & Cart Actions ────────────────────────────────

function detailChip(label, value) {
  return `
    <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:10px;padding:14px;">
      <p style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${label}</p>
      <p style="font-size:14px;font-weight:600;">${value}</p>
    </div>`;
}

function scentNote(label, value) {
  return `
    <div style="background:var(--black-card);border:1px solid var(--black-border);padding:12px;border-radius:8px;">
      <p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${label}</p>
      <p style="font-size:13px;color:var(--text-primary);">${value}</p>
    </div>`;
}

function renderReviews(reviews) {
  if (!reviews?.length) return `<p style="color:var(--text-muted);">No customer reviews yet. Be the first to review this perfume!</p>`;
  return reviews.map(r => `
    <div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <p style="font-weight:600;font-size:15px;">${r.name}</p>
          <div style="margin-top:2px;">${renderStars(r.rating)}</div>
        </div>
        <p style="color:var(--text-muted);font-size:13px;">${formatDate(r.createdAt)}</p>
      </div>
      ${r.comment ? `<p style="color:var(--text-secondary);font-size:14px;margin-top:10px;line-height:1.6;">${r.comment}</p>` : ''}
    </div>
  `).join('');
}

let qty = 1;
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById('qty-display').textContent = qty;
}

function handleAddToCartDetail() {
  if (!currentProduct) return;
  for (let i = 0; i < qty; i++) {
    addToCart(currentProduct, 1);
  }
  showToast(`${qty} × ${currentProduct.name} added to cart!`, 'success');
}

function handleBuyNow() {
  if (!currentProduct) return;
  addToCart(currentProduct, qty);
}

async function handleWishlist(id) {
  const user = getUser();
  if (!user) {
    showToast('Please login to use wishlist', 'warning');
    return;
  }
  try {
    const res = await api.put(`/users/wishlist/${id}`);
    const btn  = document.getElementById('wishlist-btn');
    let wishlist = getWishlistIds();
    if (res.added) {
      wishlist.push(id);
      btn.style.color = 'var(--gold)';
      btn.textContent = '♥ In Wishlist';
    } else {
      wishlist = wishlist.filter(w => w !== id);
      btn.style.color = 'var(--text-secondary)';
      btn.textContent = '♡ Add to Wishlist';
    }
    localStorage.setItem('ruxova_wishlist', JSON.stringify(wishlist));
    showToast(res.message, res.added ? 'success' : 'info');
  } catch {
    showToast('Please login to use wishlist', 'warning');
  }
}

window.selectRatingScore = selectRatingScore;
window.submitReview       = submitReview;
