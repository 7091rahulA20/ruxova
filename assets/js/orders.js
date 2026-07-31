/* ================================================================
   RUXOVA PERFUMES — My Orders Page JS
   Search, Filter, Sort, Cancel Order with confirmation popup,
   View Order Details Modal, Invoice PDF Print.
   ================================================================ */

let allOrders = [];
let selectedOrderIdForCancel = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();
  hidePageLoader();

  initFilterControls();
  initModalListeners();
  await loadOrders();
});

// ── Filter Controls ───────────────────────────────────────────────

function initFilterControls() {
  const searchInput = document.getElementById('order-search-input');
  const statusSelect = document.getElementById('order-status-filter');
  const sortSelect   = document.getElementById('order-sort-filter');

  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadOrders, 300);
  });

  statusSelect?.addEventListener('change', loadOrders);
  sortSelect?.addEventListener('change', loadOrders);
}

// ── Load Orders ───────────────────────────────────────────────────

async function loadOrders() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  const search = document.getElementById('order-search-input')?.value.trim() || '';
  const status = document.getElementById('order-status-filter')?.value || 'all';
  const sort   = document.getElementById('order-sort-filter')?.value || 'newest';

  container.innerHTML = `
    <div style="text-align:center;padding:60px;">
      <div class="loader-ring" style="margin:auto;"></div>
      <p style="color:var(--text-muted);margin-top:20px;">Loading your orders...</p>
    </div>`;

  try {
    const queryParams = new URLSearchParams({ search, status, sort });
    const { orders } = await api.get(`/orders/my?${queryParams.toString()}`);
    allOrders = orders || [];

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:80px;" class="fade-up">
          <p style="font-size:64px;margin-bottom:16px;">📦</p>
          <h2 style="font-family:var(--font-serif);font-size:24px;margin-bottom:12px;">No Orders Found</h2>
          <p style="color:var(--text-secondary);margin-bottom:28px;">${search || status !== 'all' ? 'No orders match your filter criteria.' : "You haven't placed any orders yet."}</p>
          <a href="shop.html" class="btn btn-gold btn-lg">Explore Perfumes</a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(renderOrderCard).join('');

    if (typeof initFadeUp === 'function') {
      setTimeout(initFadeUp, 100);
    }
  } catch (err) {
    container.innerHTML = `<p style="color:var(--error);text-align:center;padding:60px;">${err.message || 'Failed to load orders'}</p>`;
  }
}

// ── Render Order Card ─────────────────────────────────────────────

function renderOrderCard(order) {
  const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, '-')}`;
  const statusSteps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentStep = order.status === 'Cancelled' ? -1 : statusSteps.indexOf(order.status);
  const isCancelable = ['Pending', 'Confirmed'].includes(order.status);

  return `
    <div class="card fade-up" style="padding:24px;margin-bottom:24px;border:1px solid var(--black-border);">
      <!-- Header -->
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;">
        <div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">ORDER ID</p>
          <p style="font-family:var(--font-serif);font-size:20px;font-weight:700;color:var(--gold);">${order.orderId}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${formatDate(order.createdAt)}</p>
          <span class="status-badge ${statusClass}" style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${order.status}</span>
        </div>
      </div>

      <!-- Status Tracking Bar -->
      ${order.status !== 'Cancelled' ? `
        <div style="margin-bottom:24px;padding:12px 0;">
          <div style="display:flex;justify-content:space-between;position:relative;">
            <div style="position:absolute;top:14px;left:0;right:0;height:2px;background:var(--black-border);z-index:0;"></div>
            <div style="position:absolute;top:14px;left:0;height:2px;background:var(--gold);z-index:1;width:${currentStep <= 0 ? '0%' : currentStep >= statusSteps.length - 1 ? '100%' : `${(currentStep / (statusSteps.length - 1)) * 100}%`};transition:width 0.5s ease;"></div>
            ${statusSteps.map((step, i) => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;z-index:2;flex:1;">
                <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${i <= currentStep ? 'var(--gold)' : 'var(--black-border)'};background:${i < currentStep ? 'var(--gold)' : i === currentStep ? 'var(--black-card)' : 'var(--black-card)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:${i <= currentStep ? (i < currentStep ? '#000' : 'var(--gold)') : 'var(--text-muted)'};font-weight:700;">
                  ${i < currentStep ? '✓' : i + 1}
                </div>
                <p style="font-size:10px;color:${i <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)'};text-align:center;">${step}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius);padding:14px;margin-bottom:20px;text-align:center;">
          <p style="color:#EF4444;font-size:14px;margin:0;">❌ Order Cancelled ${order.paymentStatus === 'Refund Pending' ? '— Refund is being processed.' : ''}</p>
        </div>
      `}

      <!-- Items List -->
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
        ${order.items.map(item => `
          <div style="display:flex;gap:16px;align-items:center;">
            <img src="${item.image || item.product?.images?.[0]?.url || ''}" alt="${item.name}"
              style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--black-border);">
            <div style="flex:1;">
              <p style="font-size:15px;font-weight:600;margin-bottom:2px;">${item.name}</p>
              <p style="font-size:13px;color:var(--text-muted);">Qty: ${item.quantity} × ${formatCurrency(item.price)}</p>
            </div>
            <p style="font-weight:700;color:var(--gold);">${formatCurrency(item.price * item.quantity)}</p>
          </div>
        `).join('')}
      </div>

      <!-- Footer & Action Buttons -->
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding-top:16px;border-top:1px solid var(--black-border);">
        <div>
          <span style="font-size:13px;color:var(--text-muted);">Method: <strong style="color:var(--text-primary);">${order.paymentMethod}</strong></span>
          <span style="margin:0 8px;color:var(--black-border);">|</span>
          <span style="font-size:13px;color:var(--text-muted);">Payment Status: <strong style="color:var(--gold);">${order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending')}</strong></span>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <p style="font-size:18px;font-weight:700;color:var(--gold);margin-right:8px;">${formatCurrency(order.totalAmount)}</p>
          
          <button type="button" onclick="openOrderDetails('${order._id}')" class="btn btn-outline" style="padding:6px 14px;font-size:13px;">👁 Details</button>
          
          <button type="button" onclick="printInvoice('${order._id}')" class="btn btn-outline" style="padding:6px 14px;font-size:13px;">📄 Invoice</button>

          ${isCancelable ? `
            <button type="button" onclick="openCancelModal('${order._id}', '${order.orderId}')" class="btn btn-danger" style="padding:6px 14px;font-size:13px;">✕ Cancel Order</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ── Modals & Actions ──────────────────────────────────────────────

function initModalListeners() {
  document.getElementById('close-details-modal')?.addEventListener('click', closeDetailsModal);
  document.getElementById('close-cancel-modal')?.addEventListener('click', closeCancelModal);
  document.getElementById('confirm-cancel-btn')?.addEventListener('click', handleConfirmCancel);

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('order-modal')) {
      closeDetailsModal();
      closeCancelModal();
    }
  });
}

function openOrderDetails(orderId) {
  const order = allOrders.find(o => o._id === orderId);
  if (!order) return;

  const modal = document.getElementById('details-modal');
  const body  = document.getElementById('details-modal-body');
  const addr  = order.shippingAddress || {};

  body.innerHTML = `
    <div style="margin-bottom:20px;border-bottom:1px solid var(--black-border);padding-bottom:16px;">
      <h2 style="font-family:var(--font-serif);font-size:24px;color:var(--gold);margin-bottom:4px;">Order Details</h2>
      <p style="font-size:14px;color:var(--text-muted);">Order ID: <strong>${order.orderId}</strong> | Placed on ${formatDateTime(order.createdAt)}</p>
    </div>

    <!-- Customer & Shipping Info -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div style="background:var(--black-soft);padding:16px;border-radius:8px;border:1px solid var(--black-border);">
        <h4 style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:10px;">Shipping Address</h4>
        <p style="font-weight:600;font-size:14px;margin-bottom:4px;">${addr.name || 'N/A'}</p>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:2px;">${addr.street || ''}</p>
        ${addr.landmark ? `<p style="font-size:13px;color:var(--text-muted);margin-bottom:2px;">Landmark: ${addr.landmark}</p>` : ''}
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:2px;">${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</p>
        <p style="font-size:13px;color:var(--text-muted);margin-top:6px;">📞 ${addr.phone || ''}</p>
        <p style="font-size:13px;color:var(--text-muted);">✉️ ${addr.email || ''}</p>
      </div>

      <div style="background:var(--black-soft);padding:16px;border-radius:8px;border:1px solid var(--black-border);">
        <h4 style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:10px;">Payment & Status</h4>
        <p style="font-size:13px;margin-bottom:4px;">Payment Method: <strong>${order.paymentMethod}</strong></p>
        <p style="font-size:13px;margin-bottom:4px;">Payment Status: <strong style="color:var(--gold);">${order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending')}</strong></p>
        ${order.transactionId ? `<p style="font-size:13px;margin-bottom:4px;">Transaction ID: <strong>${order.transactionId}</strong></p>` : ''}
        <p style="font-size:13px;margin-bottom:4px;">Order Status: <strong>${order.status}</strong></p>
        ${order.trackingNumber ? `<p style="font-size:13px;margin-top:8px;color:var(--gold);">Tracking No: ${order.trackingNumber} (${order.courierName || 'Courier'})</p>` : ''}
      </div>
    </div>

    <!-- Items breakdown -->
    <h4 style="font-size:16px;font-weight:700;margin-bottom:12px;">Items Ordered</h4>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
      ${order.items.map(it => `
        <div style="display:flex;gap:12px;align-items:center;background:var(--black-soft);padding:12px;border-radius:8px;">
          <img src="${it.image || it.product?.images?.[0]?.url || ''}" alt="${it.name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
          <div style="flex:1;">
            <p style="font-size:14px;font-weight:600;">${it.name}</p>
            <p style="font-size:12px;color:var(--text-muted);">Quantity: ${it.quantity}</p>
          </div>
          <p style="font-weight:700;color:var(--gold);">${formatCurrency(it.price * it.quantity)}</p>
        </div>
      `).join('')}
    </div>

    <!-- Totals -->
    <div style="border-top:1px solid var(--black-border);padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <button type="button" onclick="printInvoice('${order._id}')" class="btn btn-gold btn-sm">🖨 Print Invoice</button>
      <div style="text-align:right;">
        <p style="font-size:13px;color:var(--text-muted);">Shipping: ${order.shippingCharge ? formatCurrency(order.shippingCharge) : 'FREE'}</p>
        <p style="font-size:18px;font-weight:700;color:var(--gold);margin-top:4px;">Total: ${formatCurrency(order.totalAmount)}</p>
      </div>
    </div>
  `;

  modal?.classList.add('open');
}

function closeDetailsModal() {
  document.getElementById('details-modal')?.classList.remove('open');
}

function openCancelModal(orderId, displayOrderId) {
  selectedOrderIdForCancel = orderId;
  const modal = document.getElementById('cancel-modal');
  const label = document.getElementById('cancel-order-id');
  if (label) label.textContent = `Order ID: ${displayOrderId}`;
  modal?.classList.add('open');
}

function closeCancelModal() {
  selectedOrderIdForCancel = null;
  document.getElementById('cancel-modal')?.classList.remove('open');
}

async function handleConfirmCancel() {
  if (!selectedOrderIdForCancel) return;

  const btn = document.getElementById('confirm-cancel-btn');
  setButtonLoading(btn, true, 'Cancelling...');

  try {
    const res = await api.post(`/orders/${selectedOrderIdForCancel}/cancel`, {
      reason: 'Cancelled by user',
    });

    closeCancelModal();
    showToast(res.message || 'Order cancelled successfully!', 'success');
    await loadOrders();
  } catch (err) {
    showToast(err.message || 'Failed to cancel order', 'error');
  } finally {
    setButtonLoading(btn, false, 'Yes, Cancel Order');
  }
}

function printInvoice(orderId) {
  const order = allOrders.find(o => o._id === orderId);
  if (order && typeof printOrderInvoice === 'function') {
    printOrderInvoice(order);
  }
}

window.openOrderDetails = openOrderDetails;
window.openCancelModal   = openCancelModal;
window.printInvoice       = printInvoice;
