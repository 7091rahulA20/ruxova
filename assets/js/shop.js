/* ================================================================
   RUXOVA PERFUMES — Shop Page JS
   Search, Filter by Category, Pagination, Sort
   ================================================================ */

let currentPage = 1;
let currentFilters = { search: '', category: '', sort: 'newest', gender: '' };

document.addEventListener('DOMContentLoaded', async () => {
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();
  hidePageLoader();

  await loadCategories();
  readUrlParams();
  await loadProducts();
  initFilters();
  initFadeUp();
});

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) {
    currentFilters.category = params.get('category');
    const el = document.getElementById('filter-category');
    if (el) el.value = params.get('category');
  }
  if (params.get('search')) {
    currentFilters.search = params.get('search');
    const el = document.getElementById('search-input');
    if (el) el.value = params.get('search');
  }
}

// ── Load Products ────────────────────────────────────────

async function loadProducts() {
  const grid    = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  grid.innerHTML = renderSkeletons(8);

  const params = new URLSearchParams({
    page:  currentPage,
    limit: 12,
    ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v)),
  });

  try {
    const { products, total, pages } = await api.get(`/products?${params}`);

    if (countEl) countEl.textContent = `${total} product${total !== 1 ? 's' : ''} found`;

    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0;">
          <p style="font-size:48px;margin-bottom:16px;">🔍</p>
          <p style="color:var(--text-secondary);font-size:18px;">No products found</p>
          <p style="color:var(--text-muted);font-size:14px;margin-top:8px;">Try adjusting your filters</p>
        </div>`;
      renderPagination(0, 0);
      return;
    }

    grid.innerHTML = products.map(renderProductCard).join('');
    attachCartListeners(grid);
    attachWishlistListeners(grid);
    renderPagination(pages, currentPage);
    initFadeUp();
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--error);grid-column:1/-1;text-align:center;">${err.message}</p>`;
  }
}

// ── Load Categories for Filter Dropdown ──────────────────────────

async function loadCategories() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  try {
    const { categories } = await api.get('/categories');
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat._id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch {}
}

// ── Filters ───────────────────────────────────────────────────────

function initFilters() {
  const searchInput  = document.getElementById('search-input');
  const searchBtn    = document.getElementById('search-btn');
  const catFilter    = document.getElementById('filter-category');
  const sortFilter   = document.getElementById('filter-sort');
  const genderFilter = document.getElementById('filter-gender');
  const clearBtn     = document.getElementById('clear-filters');

  const doSearch = () => {
    currentFilters.search = searchInput?.value?.trim() || '';
    currentPage = 1;
    loadProducts();
  };

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  catFilter?.addEventListener('change', () => {
    currentFilters.category = catFilter.value;
    currentPage = 1;
    loadProducts();
  });

  sortFilter?.addEventListener('change', () => {
    currentFilters.sort = sortFilter.value;
    currentPage = 1;
    loadProducts();
  });

  genderFilter?.addEventListener('change', () => {
    currentFilters.gender = genderFilter.value;
    currentPage = 1;
    loadProducts();
  });

  clearBtn?.addEventListener('click', () => {
    currentFilters = { search: '', category: '', sort: 'newest', gender: '' };
    currentPage = 1;
    if (searchInput)  searchInput.value = '';
    if (catFilter)    catFilter.value   = '';
    if (sortFilter)   sortFilter.value  = 'newest';
    if (genderFilter) genderFilter.value = '';
    loadProducts();
  });
}

// ── Pagination ────────────────────────────────────────────────────

function renderPagination(totalPages, page) {
  const container = document.getElementById('pagination');
  if (!container) return;

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';

  if (page > 1) {
    html += `<button class="btn btn-dark btn-sm" onclick="goToPage(${page - 1})">← Prev</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `<button
      class="btn ${i === page ? 'btn-gold' : 'btn-dark'} btn-sm"
      onclick="goToPage(${i})"
      style="min-width:40px;"
    >${i}</button>`;
  }

  if (page < totalPages) {
    html += `<button class="btn btn-dark btn-sm" onclick="goToPage(${page + 1})">Next →</button>`;
  }

  container.innerHTML = `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">${html}</div>`;
}

function goToPage(page) {
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToPage = goToPage;
