/* ================================================================
   RUXOVA PERFUMES — Checkout Page JS
   COD / UPI, QR generation, screenshot upload, order creation,
   Dynamic Admin Shipping Charges, Influencer Referral & Coupon Codes.
   ================================================================ */

let upiDetails = null;
let storeSettings = { shippingCharge: 99, freeShippingThreshold: 999 };
let appliedCoupon = null;

document.addEventListener('DOMContentLoaded', async () => {
  setActiveNavLink();
  updateNavbarAuth();
  updateCartBadge();
  initMobileMenu();

  prefillUserData();
  await fetchStoreSettings();
  renderOrderSummary();
  initPaymentToggle();
  initScreenshotPreview();
  await initCouponSystem();
  initCheckoutForm();
  hidePageLoader();
});

// ── Auto-Prefill Logged-In User Data ──────────────────────────────

function prefillUserData() {
  const user = getUser();
  if (!user) return;

  const nameEl    = document.getElementById('field-name');
  const emailEl   = document.getElementById('field-email');
  const phoneEl   = document.getElementById('field-phone');
  const addrEl    = document.getElementById('field-address');
  const landEl    = document.getElementById('field-landmark');
  const cityEl    = document.getElementById('field-city');
  const stateEl   = document.getElementById('field-state');
  const pinEl     = document.getElementById('field-pincode');

  if (nameEl && !nameEl.value && user.name)   nameEl.value  = user.name;
  if (emailEl && !emailEl.value && user.email) emailEl.value = user.email;
  if (phoneEl && !phoneEl.value && user.phone) phoneEl.value = user.phone;

  if (user.address) {
    if (addrEl && !addrEl.value && user.address.street)   addrEl.value  = user.address.street;
    if (landEl && !landEl.value && user.address.landmark) landEl.value  = user.address.landmark;
    if (cityEl && !cityEl.value && user.address.city)     cityEl.value  = user.address.city;
    if (stateEl && !stateEl.value && user.address.state)   stateEl.value = user.address.state;
    if (pinEl && !pinEl.value && user.address.pincode)   pinEl.value   = user.address.pincode;
  }
}

// ── Fetch Settings (Dynamic Admin Shipping & UPI) ─────────────────

async function fetchStoreSettings() {
  try {
    const { settings } = await api.get('/settings');
    if (settings) {
      storeSettings = {
        shippingCharge:        Number(settings.shippingCharge ?? 99),
        freeShippingThreshold: Number(settings.freeShippingThreshold ?? 999)
      };
      upiDetails = {
        id:   settings.upiId   || 'rahul947372@ybl',
        name: settings.upiName || 'RUXOVA PERFUMES',
        note: settings.upiNote || 'Payment for Order'
      };
    }
  } catch (err) {
    console.warn('Failed to load live store settings, using defaults');
  }
}

// ── Order Summary ─────────────────────────────────────────────────

function renderOrderSummary() {
  const cart  = getCart();
  const container = document.getElementById('order-summary');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = '<p style="color:var(--text-muted);">Your cart is empty.</p>';
    document.getElementById('place-order-btn')?.setAttribute('disabled', true);
    return;
  }

  const subtotal  = getCartTotal();
  const threshold = storeSettings.freeShippingThreshold;
  const standardFee = storeSettings.shippingCharge;
  
  const shipping = (threshold > 0 && subtotal >= threshold) || standardFee === 0 ? 0 : standardFee;
  
  let discountAmount = 0;
  if (appliedCoupon && appliedCoupon.discountPercentage > 0) {
    discountAmount = Math.round(subtotal * (appliedCoupon.discountPercentage / 100) * 100) / 100;
  }

  const total = Math.max(0, Math.round((subtotal - discountAmount + shipping) * 100) / 100);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
      ${cart.map(item => `
        <div style="display:flex;gap:12px;align-items:center;">
          <img src="${item.image || ''}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--black-border);">
          <div style="flex:1;">
            <p style="font-size:14px;font-weight:500;">${item.name}</p>
            <p style="font-size:13px;color:var(--text-muted);">Qty: ${item.quantity}</p>
          </div>
          <p style="font-weight:600;color:var(--gold);">${formatCurrency(item.price * item.quantity)}</p>
        </div>
      `).join('')}
    </div>
    <div class="gold-divider" style="margin:16px 0;"></div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
      ${discountAmount > 0 ? `
        <div style="display:flex;justify-content:space-between;color:var(--gold);">
          <span>Discount (${appliedCoupon.discountPercentage}% OFF - ${appliedCoupon.code})</span>
          <span>-${formatCurrency(discountAmount)}</span>
        </div>
      ` : ''}
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--text-secondary);">Shipping</span>
        <span>${shipping === 0 ? '<span style="color:var(--success);">FREE</span>' : formatCurrency(shipping)}</span>
      </div>
      ${shipping > 0 && threshold > 0 ? `<p style="font-size:12px;color:var(--text-muted);">Free shipping on orders above ${formatCurrency(threshold)}</p>` : ''}
    </div>
    <div class="gold-divider" style="margin:16px 0;"></div>
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;">
      <span>Total</span>
      <span style="color:var(--gold);" id="checkout-total">${formatCurrency(total)}</span>
    </div>
  `;

  window._checkoutSubtotal = subtotal;
  window._checkoutDiscount = discountAmount;
  window._checkoutTotal    = total;
  window._checkoutShipping = shipping;

  // Re-generate QR if UPI panel is visible
  const upiRadio = document.getElementById('pay-upi');
  if (upiRadio && upiRadio.checked) {
    generateUpiQr();
  }
}

// ── Coupon / Referral Code System ──────────────────────────────────

async function initCouponSystem() {
  const couponInput = document.getElementById('coupon-input');
  const applyBtn    = document.getElementById('apply-coupon-btn');
  const msgBox      = document.getElementById('coupon-message');

  if (!couponInput || !applyBtn || !msgBox) return;

  const storedRef = getStoredRefCode();
  if (storedRef) {
    couponInput.value = storedRef;
    await verifyAndApplyCoupon(storedRef, true);
  }

  applyBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      showCouponMsg('Please enter a coupon code', 'error');
      return;
    }
    verifyAndApplyCoupon(code, false);
  });

  couponInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBtn.click();
    }
  });
}

async function verifyAndApplyCoupon(code, isAuto = false) {
  const applyBtn = document.getElementById('apply-coupon-btn');
  if (applyBtn) setButtonLoading(applyBtn, true, 'Applying...');

  try {
    const res = await api.get(`/influencers/validate-coupon/${code}`);
    if (res.valid) {
      appliedCoupon = {
        code: res.code,
        referralCode: res.referralCode,
        couponCode: res.couponCode,
        discountPercentage: res.discountPercentage,
        influencerName: res.influencerName,
      };
      renderOrderSummary();
      if (isAuto) {
        showCouponMsg(`✓ Referral link active (${res.code}) — ${res.discountPercentage}% discount auto-applied!`, 'success');
      } else {
        showCouponMsg(`✓ Coupon ${res.code} applied! ${res.discountPercentage}% OFF`, 'success');
        showToast(`Coupon applied! ${res.discountPercentage}% discount added.`, 'success');
      }
    }
  } catch (err) {
    appliedCoupon = null;
    renderOrderSummary();
    const errorText = err.message || 'Invalid or expired coupon code';
    showCouponMsg(errorText, 'error');
    if (!isAuto) showToast(errorText, 'error');
  } finally {
    if (applyBtn) setButtonLoading(applyBtn, false, 'Apply');
  }
}

function showCouponMsg(text, type) {
  const msgBox = document.getElementById('coupon-message');
  if (!msgBox) return;
  msgBox.style.display = 'block';
  msgBox.style.color = type === 'success' ? 'var(--gold)' : 'var(--error)';
  msgBox.textContent = text;
}

// ── UPI Toggle & QR ────────────────────────────────────────────────

function initPaymentToggle() {
  const codRadio = document.getElementById('pay-cod');
  const upiRadio = document.getElementById('pay-upi');
  const upiBox   = document.getElementById('upi-panel');

  if (!codRadio || !upiRadio || !upiBox) return;

  const update = () => {
    if (upiRadio.checked) {
      upiBox.style.display = 'block';
      generateUpiQr();
    } else {
      upiBox.style.display = 'none';
    }
  };

  codRadio.addEventListener('change', update);
  upiRadio.addEventListener('change', update);

  const copyBtn = document.getElementById('copy-upi-btn');
  copyBtn?.addEventListener('click', () => {
    if (!upiDetails?.id) return;
    navigator.clipboard.writeText(upiDetails.id);
    showToast('UPI ID copied to clipboard!', 'success');
  });
}

function generateUpiQr() {
  if (!upiDetails) return;

  const total = window._checkoutTotal || 0;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiDetails.id)}&pn=${encodeURIComponent(upiDetails.name)}&tn=${encodeURIComponent(upiDetails.note)}&am=${total}&cu=INR`;

  const qrContainer = document.getElementById('qr-container');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
    img.alt = 'Scan to Pay via UPI';
    img.style.margin = 'auto';
    img.style.borderRadius = '8px';
    qrContainer.appendChild(img);
  }

  const idEl   = document.getElementById('display-upi-id');
  const linkEl = document.getElementById('open-upi-app-btn');

  if (idEl)   idEl.textContent = upiDetails.id;
  if (linkEl) linkEl.href      = upiUri;
}

// ── Screenshot Preview ───────────────────────────────────────────

function initScreenshotPreview() {
  const fileInput = document.getElementById('screenshot-input');
  const previewBox = document.getElementById('screenshot-preview-container');
  const previewImg = document.getElementById('screenshot-preview');

  if (!fileInput || !previewBox || !previewImg) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        previewBox.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      previewBox.style.display = 'none';
    }
  });
}

// ── Silent Guest Token Generator ──────────────────────────────────

async function ensureGuestToken(name, email, phone) {
  if (typeof getToken === 'function' && getToken()) return true;

  const cleanPhone = (phone || '').replace(/\D/g, '') || String(Date.now());
  const guestEmail = email || `guest_${cleanPhone}@ruxova.com`;
  const guestName  = name || 'Guest Customer';
  const guestPassword = `RuxovaGuest#${cleanPhone}`;

  try {
    const res = await api.post('/auth/register', {
      name: guestName,
      email: guestEmail,
      phone: phone || cleanPhone,
      password: guestPassword,
    });
    if (res.token) {
      setAuth(res.token, res.user);
      return true;
    }
  } catch (regErr) {
    try {
      const res = await api.post('/auth/login', {
        email: guestEmail,
        password: guestPassword,
      });
      if (res.token) {
        setAuth(res.token, res.user);
        return true;
      }
    } catch (loginErr) {
      try {
        const fallbackEmail = `guest_${Date.now()}@ruxova.com`;
        const res = await api.post('/auth/register', {
          name: guestName,
          email: fallbackEmail,
          phone: phone || cleanPhone,
          password: guestPassword,
        });
        if (res.token) {
          setAuth(res.token, res.user);
          return true;
        }
      } catch (e) {
        console.error('Guest authentication error:', e);
      }
    }
  }
  return false;
}

// ── Form Submit ─────────────────────────────────────────────────

function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cart = getCart();
    if (!cart.length) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    const btn = document.getElementById('place-order-btn');
    setButtonLoading(btn, true, 'Placing Order...');

    try {
      const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'COD';
      const screenshotFile = document.getElementById('screenshot-input')?.files[0];

      if (paymentMethod === 'UPI' && !screenshotFile) {
        setButtonLoading(btn, false, 'Place Order');
        showToast('Please upload your UPI payment screenshot', 'warning');
        return;
      }

      const shippingAddress = {
        name:     document.getElementById('field-name')?.value?.trim(),
        phone:    document.getElementById('field-phone')?.value?.trim(),
        email:    document.getElementById('field-email')?.value?.trim(),
        street:   document.getElementById('field-address')?.value?.trim(),
        landmark: document.getElementById('field-landmark')?.value?.trim() || '',
        city:     document.getElementById('field-city')?.value?.trim(),
        state:    document.getElementById('field-state')?.value?.trim(),
        pincode:  document.getElementById('field-pincode')?.value?.trim(),
      };

      if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.email || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
        setButtonLoading(btn, false, 'Place Order');
        showToast('Please fill in all required address fields', 'warning');
        return;
      }

      // Ensure JWT token is silently generated so backend accepts order
      await ensureGuestToken(shippingAddress.name, shippingAddress.email, shippingAddress.phone);

      const couponCodeInput = document.getElementById('coupon-input')?.value?.trim()?.toUpperCase() || '';
      const activeRefCode   = appliedCoupon?.code || getStoredRefCode() || couponCodeInput;

      const formData = new FormData();
      formData.append('items',           JSON.stringify(cart.map(i => ({ product: i._id, name: i.name, quantity: i.quantity, price: i.price }))));
      formData.append('shippingAddress', JSON.stringify(shippingAddress));
      formData.append('paymentMethod',   paymentMethod);
      formData.append('totalAmount',     window._checkoutTotal);
      formData.append('shippingCharge',  window._checkoutShipping);
      formData.append('discount',        window._checkoutDiscount || 0);

      if (activeRefCode) {
        formData.append('couponCode',     activeRefCode);
        formData.append('influencerCode', activeRefCode);
      }

      if (paymentMethod === 'UPI' && screenshotFile) {
        formData.append('paymentScreenshot', screenshotFile);
      }

      const res = await api.post('/orders', formData, true);

      clearCart();
      if (res.order?._id) {
        localStorage.setItem('ruxova_last_order_id', res.order._id);
      }
      if (typeof clearStoredRefCode === 'function') {
        clearStoredRefCode();
      }
      showToast('Order placed successfully!', 'success');
      setTimeout(() => {
        window.location.href = `order-success.html?id=${res.order._id}`;
      }, 800);
    } catch (err) {
      setButtonLoading(btn, false, 'Place Order');
      showToast(err.message || 'Failed to place order', 'error');
    }
  });
}
