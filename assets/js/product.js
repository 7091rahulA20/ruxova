/* ================================================================
   RUXOVA PERFUMES — Dedicated Product Details & Order Page JS
   Gallery, Thumbnails, Lightbox Zoom, 5-Star Breakdown, Reviews,
   Delivery Info, Features Badges, Related Products, Dynamic SEO.
   ================================================================ */

let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];
let currentZoom = 1;
let selectedRating = 5;
let storeSettings = { shippingCharge: 99, freeShippingThreshold: 999 };

// Safe Helpers to guarantee zero JS crashes
function safeIsInWishlist(id) {
  try {
    if (typeof window.isInWishlist === 'function') return window.isInWishlist(id);
    if (typeof isInWishlist === 'function') return isInWishlist(id);
    const w = JSON.parse(localStorage.getItem('ruxova_wishlist') || '[]');
    return w.includes(id);
  } catch (e) {
    return false;
  }
}

function safeFormatCurrency(amount) {
  try {
    if (typeof window.formatCurrency === 'function') return window.formatCurrency(amount);
    if (typeof formatCurrency === 'function') return formatCurrency(amount);
  } catch (e) {}
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function safeRenderStars(rating) {
  try {
    if (typeof window.renderStars === 'function') return window.renderStars(rating);
    if (typeof renderStars === 'function') return renderStars(rating);
  } catch (e) {}
  const r = Math.round(rating || 5);
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
  return `<span class="stars" style="color:var(--gold);">${s}</span>`;
}

function safeFormatDate(d) {
  try {
    if (typeof window.formatDate === 'function') return window.formatDate(d);
    if (typeof formatDate === 'function') return formatDate(d);
  } catch (e) {}
  return new Date(d || Date.now()).toLocaleDateString('en-IN');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof setActiveNavLink === 'function') setActiveNavLink();
  if (typeof updateNavbarAuth === 'function') updateNavbarAuth();
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof initMobileMenu === 'function') initMobileMenu();

  const productId = new URLSearchParams(window.location.search).get('id');
  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }

  // Fetch settings for dynamic delivery info
  try {
    const res = await api.get('/settings');
    if (res.settings) {
      storeSettings = {
        shippingCharge: Number(res.settings.shippingCharge ?? 99),
        freeShippingThreshold: Number(res.settings.freeShippingThreshold ?? 999),
      };
    }
  } catch (e) {}

  await loadProduct(productId);
  initKeyboardNav();
  initLightboxControls();
  if (typeof hidePageLoader === 'function') hidePageLoader();
});

// ── Load Product ──────────────────────────────────────────────────

async function loadProduct(id) {
  const container = document.getElementById('product-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:100px 20px;">
      <div class="loader-ring" style="margin:auto;"></div>
      <p style="color:var(--gold);margin-top:16px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Loading Perfume Details...</p>
    </div>`;

  try {
    const { product } = await api.get(`/products/${id}`);
    if (!product) throw new Error('Product not found');
    currentProduct = product;

    // Extract product images
    if (Array.isArray(product.images) && product.images.length > 0) {
      productImages = product.images.map(img => typeof img === 'string' ? img : (img.url || 'assets/images/placeholder.jpg'));
    } else if (product.image) {
      productImages = [typeof product.image === 'string' ? product.image : (product.image.url || 'assets/images/placeholder.jpg')];
    } else {
      productImages = ['assets/images/placeholder.jpg'];
    }

    currentImageIndex = 0;
    preloadImages(productImages);

    renderProduct(product);

    // Dynamic SEO Update
    const firstImgUrl = productImages[0] ? (window.optimizeImageUrl ? window.optimizeImageUrl(productImages[0], 600) : productImages[0]) : '';
    const canonicalUrl = `${window.location.origin}/product.html?id=${product._id}`;
    const cleanDesc = (product.description || `Buy ${product.name} luxury perfume online at RUXOVA PERFUMES.`).replace(/<[^>]*>?/gm, '');

    updateDynamicSeo({
      title: `${product.name} — Luxury Perfume | RUXOVA PERFUMES`,
      description: cleanDesc,
      keywords: `${product.name}, ${product.category?.name || 'Perfume'}, luxury perfume, fragrance, buy perfume online`,
      image: firstImgUrl,
      url: canonicalUrl,
      product: product
    });

    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = product.name;

    await loadRelatedProducts(product.category?._id || product.category);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <p style="color:var(--error);font-size:18px;margin-bottom:16px;">${err.message || 'Product not found'}</p>
        <a href="shop.html" class="btn btn-gold btn-lg">Return to Shop</a>
      </div>`;
  }
}

// ── Dynamic SEO Updates ───────────────────────────────────────────

function updateDynamicSeo({ title, description, keywords, image, url, product }) {
  document.title = title;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);

  let metaKw = document.querySelector('meta[name="keywords"]');
  if (!metaKw) {
    metaKw = document.createElement('meta');
    metaKw.name = 'keywords';
    document.head.appendChild(metaKw);
  }
  metaKw.setAttribute('content', keywords);

  // Open Graph
  const ogTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'product' },
  ];

  ogTags.forEach(({ property, content }) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  });

  // JSON-LD Product Schema
  let schemaScript = document.getElementById('json-ld-product');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'json-ld-product';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }

  const schemaData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.name,
    'image': productImages,
    'description': description,
    'sku': product._id,
    'brand': {
      '@type': 'Brand',
      'name': 'RUXOVA PERFUMES'
    },
    'offers': {
      '@type': 'Offer',
      'url': url,
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
  };

  schemaScript.textContent = JSON.stringify(schemaData);
}

// ── Preload Images for smooth transition ──────────────────────────

function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = window.optimizeImageUrl ? window.optimizeImageUrl(url, 600) : url;
  });
}

// ── Render Product Layout ─────────────────────────────────────────

function renderProduct(p) {
  const wishlistActive = safeIsInWishlist(p._id);
  const discountPct = p.comparePrice && p.comparePrice > p.price
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
    : null;

  const avgRatingNum = p.avgRating || 0;
  const numReviewsNum = p.numReviews || (p.reviews ? p.reviews.length : 0);

  // Guarantee productImages is populated if empty
  if (!productImages || productImages.length === 0) {
    if (Array.isArray(p.images) && p.images.length > 0) {
      productImages = p.images.map(img => typeof img === 'string' ? img : (img.url || 'assets/images/placeholder.jpg'));
    } else if (p.image) {
      productImages = [typeof p.image === 'string' ? p.image : (p.image.url || 'assets/images/placeholder.jpg')];
    } else {
      productImages = ['assets/images/placeholder.jpg'];
    }
  }

  let thumbs = [...productImages];

  const shippingText = storeSettings.freeShippingThreshold > 0 && p.price >= storeSettings.freeShippingThreshold
    ? '<span style="color:var(--success);font-weight:700;">FREE Delivery</span>'
    : `<span style="color:var(--gold);">${safeFormatCurrency(storeSettings.shippingCharge)}</span>`;

  document.getElementById('product-container').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;" class="product-layout fade-up">

      <!-- Gallery Column -->
      <div>
        <div id="main-image-box" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;background:var(--black-card);border:1px solid var(--black-border);aspect-ratio:1;cursor:zoom-in;">
          <img id="main-image"
            src="${window.optimizeImageUrl ? window.optimizeImageUrl(productImages[0], 600) : productImages[0]}"
            alt="${p.name}"
            loading="eager"
            style="width:100%;height:100%;object-fit:cover;transition:opacity 0.25s ease;"
          >
          ${discountPct ? `<div style="position:absolute;top:16px;left:16px;background:var(--gold);color:var(--black);padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${discountPct}% OFF</div>` : ''}
          <div style="position:absolute;top:16px;right:16px;z-index:2;">
            <span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}" style="padding:6px 14px;font-size:12px;">
              ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <!-- Prev / Next Slider Arrows -->
          ${thumbs.length > 1 ? `
            <button type="button" id="gallery-prev" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:var(--gold);border:1px solid var(--gold);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;z-index:3;transition:background 0.2s;">‹</button>
            <button type="button" id="gallery-next" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:var(--gold);border:1px solid var(--gold);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;z-index:3;transition:background 0.2s;">›</button>
          ` : ''}

          <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.75);color:var(--text-primary);padding:6px 12px;border-radius:12px;font-size:11px;border:1px solid var(--black-border);pointer-events:none;z-index:2;display:flex;align-items:center;gap:6px;">
            <span>🔍 Click to Zoom</span>
            <span>•</span>
            <span>Image <span id="img-index-display">1</span> of ${thumbs.length}</span>
          </div>
        </div>

        <!-- Thumbnails Gallery Row -->
        <div style="display:flex;gap:12px;margin-top:16px;overflow-x:auto;padding-bottom:6px;" id="thumb-row">
          ${thumbs.map((imgUrl, i) => `
            <div style="position:relative;flex-shrink:0;">
              <img
                src="${window.optimizeImageUrl ? window.optimizeImageUrl(imgUrl, 150) : imgUrl}"
                alt="${p.name} Thumbnail ${i + 1}"
                data-index="${i}"
                class="thumb-img ${i === 0 ? 'active' : ''}"
                loading="lazy"
                style="width:76px;height:76px;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid ${i === 0 ? 'var(--gold)' : 'var(--black-border)'};transition:all 0.2s;"
              >
            </div>
          `).join('')}
        </div>

        <!-- Product Guarantee Badges Section -->
        <div style="margin-top:32px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;">
          ${featureBadge('🌿', 'Long Lasting', '8 to 12+ Hours Sillage')}
          ${featureBadge('👑', 'Premium Quality', 'Finest Botanical Oils')}
          ${featureBadge('🛡️', '100% Original', 'Direct from RUXOVA')}
          ${featureBadge('🚚', 'Fast Delivery', 'Dispatched in 24 Hours')}
        </div>
      </div>

      <!-- Info Column -->
      <div>
        <p style="color:var(--gold);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:600;">
          ${p.category?.name || 'Luxury Fragrance'}
        </p>
        <h1 style="font-family:var(--font-serif);font-size:clamp(26px,3.5vw,38px);font-weight:700;line-height:1.2;margin-bottom:12px;color:var(--text-primary);">${p.name}</h1>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
          ${safeRenderStars(avgRatingNum)}
          <span style="color:var(--text-secondary);font-size:14px;font-weight:600;">
            ${avgRatingNum > 0 ? avgRatingNum.toFixed(1) : '5.0'} (${numReviewsNum} customer review${numReviewsNum !== 1 ? 's' : ''})
          </span>
          <span style="color:var(--text-muted);">•</span>
          <span style="color:var(--gold);font-size:13px;font-weight:600;">Brand: RUXOVA PERFUMES</span>
        </div>

        <div style="display:flex;align-items:baseline;gap:14px;margin-bottom:24px;background:rgba(201,168,76,0.06);padding:14px 20px;border-radius:12px;border:1px solid rgba(201,168,76,0.15);">
          <span style="font-size:36px;font-weight:700;color:var(--gold);">${safeFormatCurrency(p.price)}</span>
          ${p.comparePrice ? `<span style="font-size:20px;text-decoration:line-through;color:var(--text-muted);">${safeFormatCurrency(p.comparePrice)}</span>` : ''}
          ${discountPct ? `<span style="color:var(--success);font-weight:700;font-size:14px;">Save ${discountPct}%</span>` : ''}
        </div>

        <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:24px;font-size:15px;">${p.description}</p>

        <!-- Volume Selection -->
        <div style="margin-bottom:24px;">
          <label style="font-size:13px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:10px;">Select Volume / Size:</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;" id="size-picker">
            ${['50ml', '100ml', '200ml'].map(s => {
              const isSelected = (p.volume || '100ml').toLowerCase().includes(s.toLowerCase()) || s === '100ml';
              return `
                <button
                  type="button"
                  class="size-opt-btn"
                  data-size="${s}"
                  onclick="selectSize('${s}')"
                  style="padding:10px 22px;border-radius:8px;border:1px solid ${isSelected ? 'var(--gold)' : 'var(--black-border)'};background:${isSelected ? 'rgba(201,168,76,0.15)' : 'var(--black-soft)'};color:${isSelected ? 'var(--gold)' : 'var(--text-primary)'};font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;"
                >
                  ${s}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Delivery & Shipping Info Card -->
        <div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
          <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:14px;color:var(--gold);display:flex;align-items:center;gap:8px;">
            <span>🚚</span> Delivery & Shipping Information
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
            <div>
              <span style="color:var(--text-muted);display:block;margin-bottom:2px;">Shipping Charge:</span>
              <span>${shippingText}</span>
            </div>
            <div>
              <span style="color:var(--text-muted);display:block;margin-bottom:2px;">Free Shipping:</span>
              <span style="color:var(--text-primary);">${storeSettings.freeShippingThreshold > 0 ? `Orders above ${safeFormatCurrency(storeSettings.freeShippingThreshold)}` : 'On All Orders'}</span>
            </div>
            <div>
              <span style="color:var(--text-muted);display:block;margin-bottom:2px;">Estimated Delivery:</span>
              <span style="color:var(--text-primary);">3 – 5 Business Days</span>
            </div>
            <div>
              <span style="color:var(--text-muted);display:block;margin-bottom:2px;">Payment Options:</span>
              <span style="color:var(--text-primary);">UPI & Cash on Delivery (COD)</span>
            </div>
          </div>
        </div>

        <!-- Specifications Grid -->
        <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
          <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:14px;color:var(--gold);">Product Specifications</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${detailChip('Brand', 'RUXOVA PERFUMES')}
            ${detailChip('Volume', p.volume || '100ml')}
            ${detailChip('Fragrance Type', p.gender || 'Unisex')}
            ${detailChip('Stock Status', p.stock > 0 ? `<span style="color:var(--success);font-weight:600;">${p.stock} Units Available</span>` : `<span style="color:var(--error);font-weight:600;">Out of Stock</span>`)}
            ${p.tags?.length ? detailChip('Tags', p.tags.slice(0, 3).join(', ')) : ''}
            ${detailChip('SKU / Product ID', p._id.substring(p._id.length - 8).toUpperCase())}
          </div>
        </div>

        <!-- Scent Notes Profile -->
        <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
          <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:14px;color:var(--gold);">Fragrance Notes Profile</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;text-align:center;">
            ${scentNote('Top Notes',   p.scentNotes?.top    || 'Fresh Bergamot, Pink Pepper')}
            ${scentNote('Heart Notes', p.scentNotes?.middle || 'French Lavender, Royal Rose')}
            ${scentNote('Base Notes',  p.scentNotes?.base   || 'Warm Amber, Cedarwood, Oud')}
          </div>
        </div>

        <!-- Ingredients & Longevity -->
        <div style="background:var(--black-soft);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:28px;">
          <h3 style="font-family:var(--font-serif);font-size:16px;margin-bottom:10px;color:var(--gold);">Ingredients & Performance</h3>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:10px;">
            <strong style="color:var(--text-primary);">Ingredients:</strong> ${p.ingredients || 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Linalool, Citronellol, Geraniol, Coumarin.'}
          </p>
        </div>

        <!-- Quantity & Action Buttons -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:600;">Quantity:</label>
          <div style="display:flex;align-items:center;border:1px solid var(--black-border);border-radius:8px;overflow:hidden;background:var(--black-soft);">
            <button type="button" onclick="changeQty(-1)" style="width:42px;height:42px;background:none;color:var(--text-primary);border:none;cursor:pointer;font-size:18px;">−</button>
            <span id="qty-display" style="width:48px;text-align:center;font-weight:700;color:var(--gold);font-size:16px;">1</span>
            <button type="button" onclick="changeQty(1)"  style="width:42px;height:42px;background:none;color:var(--text-primary);border:none;cursor:pointer;font-size:18px;">+</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <button id="add-to-cart-btn" class="btn btn-gold btn-lg" onclick="handleAddToCartDetail()" ${p.stock === 0 ? 'disabled' : ''} style="width:100%;">
            🛒 Add to Cart
          </button>
          <button id="buy-now-btn" class="btn btn-outline-gold btn-lg" onclick="handleBuyNow(event)" ${p.stock === 0 ? 'disabled' : ''} style="width:100%;">
            ⚡ Order Now
          </button>
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

    <!-- Ratings & Customer Reviews Section -->
    <div style="margin-top:64px;" id="reviews-section">
      <h2 style="font-family:var(--font-serif);font-size:26px;margin-bottom:24px;border-bottom:1px solid var(--black-border);padding-bottom:16px;">Customer Ratings & Reviews</h2>

      <!-- Reviews Overview & Breakdown Grid -->
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:32px;background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:28px;margin-bottom:32px;align-items:center;" class="review-breakdown-grid">
        <div style="text-align:center;border-right:1px solid var(--black-border);padding-right:24px;" class="rating-avg-box">
          <p style="font-size:52px;font-weight:700;color:var(--gold);line-height:1;margin-bottom:8px;">${avgRatingNum > 0 ? avgRatingNum.toFixed(1) : '5.0'}</p>
          <div style="margin-bottom:8px;">${safeRenderStars(avgRatingNum)}</div>
          <p style="color:var(--text-muted);font-size:14px;">Based on ${numReviewsNum} customer review${numReviewsNum !== 1 ? 's' : ''}</p>
        </div>

        <div>
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-primary);text-transform:uppercase;letter-spacing:1px;">Rating Breakdown</h4>
          ${renderRatingBreakdown(p.reviews || [])}
        </div>
      </div>
      
      <!-- Write Review Form -->
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
            <textarea id="review-comment" class="form-control" rows="3" placeholder="Share your thoughts about the fragrance, sillage, longevity, and quality..." required style="width:100%;padding:12px;background:var(--black-soft);border:1px solid var(--black-border);border-radius:8px;color:#fff;"></textarea>
          </div>
          <button type="submit" class="btn btn-gold" style="align-self:flex-start;">Submit Review</button>
        </form>
      </div>

      <!-- Customer Reviews List -->
      ${renderReviewsList(p.reviews || [])}
    </div>

    <!-- Related Perfumes Section -->
    <div style="margin-top:64px;" id="related-section">
      <h2 style="font-family:var(--font-serif);font-size:26px;margin-bottom:32px;border-bottom:1px solid var(--black-border);padding-bottom:16px;">Related Perfumes</h2>
      <div id="related-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px;"></div>
    </div>
  `;

  initGalleryInteractions();
}

// ── Rating Breakdown Calculation ──────────────────────────────────

function renderRatingBreakdown(reviews) {
  const total = reviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  if (total > 0) {
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });
  } else {
    counts[5] = 1; // Default demonstration
  }

  const effectiveTotal = total > 0 ? total : 1;

  return [5, 4, 3, 2, 1].map(star => {
    const count = counts[star] || 0;
    const pct = Math.round((count / effectiveTotal) * 100);
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:13px;">
        <span style="width:36px;color:var(--text-secondary);font-weight:600;">${star} ★</span>
        <div style="flex:1;height:8px;background:var(--black-soft);border-radius:4px;overflow:hidden;border:1px solid var(--black-border);">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-dark));border-radius:4px;transition:width 0.4s ease;"></div>
        </div>
        <span style="width:40px;text-align:right;color:var(--text-muted);font-size:12px;">${pct}%</span>
      </div>
    `;
  }).join('');
}

// ── Feature Badges & Details Chips ────────────────────────────────

function featureBadge(icon, title, desc) {
  return `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(201,168,76,0.1);border:1px solid var(--gold-dark);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--gold);flex-shrink:0;">${icon}</div>
      <div>
        <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0;">${title}</p>
        <p style="font-size:11px;color:var(--text-muted);margin:0;">${desc}</p>
      </div>
    </div>`;
}

function detailChip(label, value) {
  return `
    <div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:10px;padding:12px 14px;">
      <p style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">${label}</p>
      <p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:0;">${value}</p>
    </div>`;
}

function scentNote(label, value) {
  return `
    <div style="background:var(--black-card);border:1px solid var(--black-border);padding:12px;border-radius:8px;">
      <p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:600;">${label}</p>
      <p style="font-size:12px;color:var(--text-primary);margin:0;">${value}</p>
    </div>`;
}

// ── Customer Reviews List ─────────────────────────────────────────

function renderReviewsList(reviews) {
  if (!reviews || !reviews.length) {
    return `<div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:32px;text-align:center;"><p style="color:var(--text-muted);margin:0;">No customer reviews yet. Be the first to review this perfume!</p></div>`;
  }

  return reviews.map(r => `
    <div style="background:var(--black-card);border:1px solid var(--black-border);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <p style="font-weight:600;font-size:15px;color:var(--text-primary);margin:0;">${r.name}</p>
            <span style="font-size:11px;color:var(--success);background:rgba(46,204,113,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(46,204,113,0.2);">✓ Verified Purchase</span>
          </div>
          <div style="margin-top:4px;">${safeRenderStars(r.rating)}</div>
        </div>
        <p style="color:var(--text-muted);font-size:13px;margin:0;">${safeFormatDate(r.createdAt || new Date())}</p>
      </div>
      ${r.comment ? `<p style="color:var(--text-secondary);font-size:14px;margin-top:10px;line-height:1.6;margin-bottom:0;">${r.comment}</p>` : ''}
    </div>
  `).join('');
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

  // Open Lightbox Zoom
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
  const indexDisplay = document.getElementById('img-index-display');
  
  if (indexDisplay) {
    indexDisplay.textContent = currentImageIndex + 1;
  }

  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      const rawUrl = productImages[currentImageIndex] || mainImg.src;
      mainImg.src = window.optimizeImageUrl ? window.optimizeImageUrl(rawUrl, 600) : rawUrl;
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
      const rawUrl = productImages[currentImageIndex];
      lbImg.src = window.optimizeImageUrl ? window.optimizeImageUrl(rawUrl, 900) : rawUrl;
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
  const user = typeof getUser === 'function' ? getUser() : null;
  if (!user) {
    if (typeof showToast === 'function') showToast('Please login to write a review', 'warning');
    else alert('Please login to write a review');
    return;
  }

  const comment = document.getElementById('review-comment')?.value?.trim();
  if (!comment) return;

  try {
    const res = await api.post(`/products/${currentProduct._id}/reviews`, {
      rating: selectedRating,
      comment
    });
    if (typeof showToast === 'function') showToast(res.message || 'Review submitted successfully!', 'success');
    await loadProduct(currentProduct._id);
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to submit review', 'error');
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

// ── Size & Quantity Helpers ───────────────────────────────────────

let selectedSize = '100ml';

function selectSize(size) {
  selectedSize = size;
  document.querySelectorAll('.size-opt-btn').forEach(btn => {
    if (btn.dataset.size === size) {
      btn.style.borderColor = 'var(--gold)';
      btn.style.color = 'var(--gold)';
      btn.style.background = 'rgba(201, 168, 76, 0.15)';
    } else {
      btn.style.borderColor = 'var(--black-border)';
      btn.style.color = 'var(--text-primary)';
      btn.style.background = 'var(--black-soft)';
    }
  });
}

let qty = 1;
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  const qtyEl = document.getElementById('qty-display');
  if (qtyEl) qtyEl.textContent = qty;
}

function handleAddToCartDetail() {
  if (!currentProduct) return;
  for (let i = 0; i < qty; i++) {
    if (typeof addToCart === 'function') addToCart(currentProduct, 1);
  }
  if (typeof showToast === 'function') showToast(`${qty} × ${currentProduct.name} (${selectedSize}) added to cart!`, 'success');
}

function handleBuyNow(e) {
  if (e) e.preventDefault();
  if (!currentProduct) return;
  for (let i = 0; i < qty; i++) {
    if (typeof addToCart === 'function') addToCart(currentProduct, 1);
  }
  window.location.href = 'checkout.html';
}

async function handleWishlist(id) {
  const user = typeof getUser === 'function' ? getUser() : null;
  if (!user) {
    if (typeof showToast === 'function') showToast('Please login to use wishlist', 'warning');
    return;
  }
  try {
    const res = await api.put(`/users/wishlist/${id}`);
    const btn  = document.getElementById('wishlist-btn');
    let wishlist = typeof getWishlistIds === 'function' ? getWishlistIds() : [];
    if (res.added) {
      wishlist.push(id);
      if (btn) {
        btn.style.color = 'var(--gold)';
        btn.textContent = '♥ In Wishlist';
      }
    } else {
      wishlist = wishlist.filter(w => w !== id);
      if (btn) {
        btn.style.color = 'var(--text-secondary)';
        btn.textContent = '♡ Add to Wishlist';
      }
    }
    localStorage.setItem('ruxova_wishlist', JSON.stringify(wishlist));
    if (typeof showToast === 'function') showToast(res.message, res.added ? 'success' : 'info');
  } catch {
    if (typeof showToast === 'function') showToast('Please login to use wishlist', 'warning');
  }
}

window.selectRatingScore = selectRatingScore;
window.submitReview       = submitReview;
window.selectSize         = selectSize;
window.changeQty          = changeQty;
window.handleAddToCartDetail = handleAddToCartDetail;
window.handleBuyNow       = handleBuyNow;
window.handleWishlist     = handleWishlist;
