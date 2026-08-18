/* ================================================================
   RUXOVA PERFUMES — Order Confirmation JS
   Fetches and displays order details after successful checkout.
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setActiveNavLink();
  updateNavbarAuth();
  if (typeof clearCart === 'function') clearCart();
  else if (typeof updateCartBadge === 'function') updateCartBadge();
  initMobileMenu();

  await loadOrderDetails();
  hidePageLoader();
});

async function loadOrderDetails() {
  const container = document.getElementById('confirmation-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id') || localStorage.getItem('ruxova_last_order_id');

  if (!orderId) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px;" class="card fade-up">
        <p style="font-size:48px;margin-bottom:16px;">🔍</p>
        <h2 style="font-family:var(--font-serif);font-size:22px;margin-bottom:12px;color:var(--gold);">Order ID Missing</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;">No order ID was provided in the request.</p>
        <a href="orders.html" class="btn btn-gold">View My Orders</a>
      </div>`;
    return;
  }

  try {
    const { order } = await api.get(`/orders/${orderId}`);

    if (!order) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px;" class="card fade-up">
          <p style="font-size:48px;margin-bottom:16px;">⚠️</p>
          <h2 style="font-family:var(--font-serif);font-size:22px;margin-bottom:12px;color:var(--error);">Order Not Found</h2>
          <p style="color:var(--text-secondary);margin-bottom:24px;">We couldn't retrieve the specified order details.</p>
          <a href="orders.html" class="btn btn-gold">View My Orders</a>
        </div>`;
      return;
    }

    renderConfirmation(order, container);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px;" class="card fade-up">
        <p style="font-size:48px;margin-bottom:16px;">✕</p>
        <h2 style="font-family:var(--font-serif);font-size:22px;margin-bottom:12px;color:var(--error);">Error Loading Order</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;">${err.message || 'Failed to load order details'}</p>
        <a href="orders.html" class="btn btn-gold">View My Orders</a>
      </div>`;
  }
}

function renderConfirmation(order, container) {
  const addr = order.shippingAddress || {};
  const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Calculate subtotal from items
  const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = order.discount || 0;
  const shipping = order.shippingCharge || 0;

  container.innerHTML = `
    <div className="fade-up" style="display:flex;flex-direction:column;gap:24px;">
      
      <!-- Top Order Meta Card -->
      <div class="card" style="padding:24px;border:1px solid var(--black-border);">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;">
          <div>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">ORDER REFERENCE</p>
            <p style="font-family:var(--font-serif);font-size:24px;font-weight:700;color:var(--gold);">${order.orderId}</p>
            <p style="font-size:13px;color:var(--text-muted);margin-top:2px;">Placed on ${formatDateTime(order.createdAt)}</p>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <span class="status-badge ${statusClass}" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">
              ${order.status}
            </span>
          </div>
        </div>
      </div>

      <!-- Influencer Discount Banner if Applied -->
      ${(order.couponCode || order.influencerCode) ? `
        <div class="card" style="padding:16px 20px;background:rgba(201,168,76,0.1);border:1px solid var(--gold);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">🎁</span>
            <div>
              <p style="font-weight:600;color:var(--gold);font-size:14px;">Influencer Discount Applied</p>
              <p style="font-size:12px;color:var(--text-secondary);">
                Code: <strong style="color:var(--gold);">${order.couponCode || order.influencerCode}</strong>
              </p>
            </div>
          </div>
          ${discount > 0 ? `<span style="font-weight:700;color:var(--gold);font-size:15px;">-${formatCurrency(discount)}</span>` : ''}
        </div>
      ` : ''}

      <!-- Grid: Shipping & Payment -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
        
        <!-- Shipping Address -->
        <div class="card" style="padding:20px;border:1px solid var(--black-border);">
          <h3 style="font-family:var(--font-serif);font-size:16px;color:var(--gold);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Delivery Address</h3>
          <p style="font-weight:600;font-size:15px;margin-bottom:6px;">${addr.name}</p>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">${addr.street}${addr.landmark ? `, ${addr.landmark}` : ''}</p>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${addr.city}, ${addr.state} — ${addr.pincode}</p>
          <p style="font-size:12px;color:var(--text-muted);">📞 Phone: ${addr.phone}</p>
          ${addr.email ? `<p style="font-size:12px;color:var(--text-muted);">✉️ Email: ${addr.email}</p>` : ''}
        </div>

        <!-- Payment Info -->
        <div class="card" style="padding:20px;border:1px solid var(--black-border);">
          <h3 style="font-family:var(--font-serif);font-size:16px;color:var(--gold);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Payment Information</h3>
          <p style="font-size:14px;margin-bottom:8px;"><span style="color:var(--text-muted);">Method:</span> <strong>${order.paymentMethod === 'UPI' ? 'UPI / QR Payment' : 'Cash on Delivery (COD)'}</strong></p>
          <p style="font-size:14px;margin-bottom:8px;">
            <span style="color:var(--text-muted);">Payment Status:</span> 
            <span style="font-weight:700;color:${order.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--gold)'};">
              ${order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending Verification')}
            </span>
          </p>
          ${order.transactionId ? `<p style="font-size:12px;color:var(--text-muted);">Transaction ID: ${order.transactionId}</p>` : ''}
        </div>
      </div>

      <!-- Items List -->
      <div class="card" style="padding:24px;border:1px solid var(--black-border);">
        <h3 style="font-family:var(--font-serif);font-size:18px;color:var(--gold);margin-bottom:16px;">Ordered Items</h3>
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${order.items.map(item => {
            const itemImg = window.getProductPrimaryImage ? window.getProductPrimaryImage(item.productId || item.product?._id, item.size) : 'products/ruxova-50ml-1.jpg';
            return `
              <div style="display:flex;gap:16px;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--black-border);">
                <img src="${itemImg}" alt="${item.productName || item.name}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--black-border);">
                <div style="flex:1;">
                  <p style="font-weight:600;font-size:15px;margin-bottom:4px;">${item.productName || item.name} <span style="font-size:13px;color:var(--gold);">(${item.size || '50ml'})</span></p>
                  <p style="font-size:13px;color:var(--text-muted);">Quantity: ${item.quantity} × ${formatCurrency(item.price)}</p>
                </div>
                <p style="font-weight:700;color:var(--gold);font-size:16px;">${formatCurrency(item.price * item.quantity)}</p>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Totals Breakdown -->
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--black-border);display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;">
            <span style="color:var(--text-secondary);">Subtotal</span>
            <span>${formatCurrency(itemsSubtotal)}</span>
          </div>
          ${discount > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--gold);">
              <span>Discount (${order.couponCode || 'Coupon'})</span>
              <span>-${formatCurrency(discount)}</span>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;font-size:14px;">
            <span style="color:var(--text-secondary);">Shipping Charge</span>
            <span>${shipping === 0 ? '<span style="color:var(--success);">FREE</span>' : formatCurrency(shipping)}</span>
          </div>
          <div class="gold-divider" style="margin:12px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:700;">
            <span>Grand Total</span>
            <span style="color:var(--gold);">${formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px;">
        <button type="button" onclick="printOrderInvoice(window._currentConfirmedOrder)" class="btn btn-gold btn-lg" style="flex:1;min-width:200px;">
          📄 Print Invoice
        </button>
        <a href="orders.html" class="btn btn-outline btn-lg" style="flex:1;min-width:200px;text-align:center;">
          📦 View All My Orders
        </a>
        <a href="shop.html" class="btn btn-outline btn-lg" style="flex:1;min-width:200px;text-align:center;">
          🛍️ Continue Shopping
        </a>
      </div>

    </div>
  `;

  window._currentConfirmedOrder = order;
}
