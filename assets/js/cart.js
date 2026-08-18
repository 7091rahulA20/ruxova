/* ================================================================
   RUXOVA PERFUMES — Cart Management
   LocalStorage-based cart supporting multi-ML items & local images
   ================================================================ */

const CART_KEY = 'ruxova_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1, size = null, silent = false) {
  const cart = getCart();
  const prodId = product.productId || product._id || 'ruxova-premium';
  const itemSize = (size || product.size || (typeof selectedSize !== 'undefined' ? selectedSize : '50ml')).toString();
  const prodName = product.name || product.productName || 'RUXOVA Premium Eau De Parfum';

  // Get price for selected size from product or config if needed
  let itemPrice = product.price;
  if (!itemPrice && window.getProductConfig) {
    const cfg = window.getProductConfig(prodId);
    if (cfg && cfg.sizes && cfg.sizes[itemSize.toLowerCase()]) {
      itemPrice = cfg.sizes[itemSize.toLowerCase()].price;
    }
  }
  if (!itemPrice) itemPrice = 450;

  // Uniquely identify item by productId AND size
  const existingIndex = cart.findIndex(item => 
    (item.productId === prodId || item._id === product._id) && item.size === itemSize
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
    if (!silent && typeof showToast === 'function') {
      showToast(`${prodName} (${itemSize}) quantity updated in cart`, 'info');
    }
  } else {
    cart.push({
      _id:         product._id || prodId,
      productId:   prodId,
      productName: prodName,
      name:        prodName,
      size:        itemSize,
      price:       itemPrice,
      quantity,
      images:      product.images || []
    });
    if (!silent && typeof showToast === 'function') {
      showToast(`${prodName} (${itemSize}) added to cart`, 'success');
    }
  }

  saveCart(cart);
}

function removeFromCart(cartIndexOrId, size = null) {
  let cart = getCart();
  if (typeof cartIndexOrId === 'number') {
    cart.splice(cartIndexOrId, 1);
  } else if (size) {
    cart = cart.filter(item => !(item._id === cartIndexOrId && item.size === size));
  } else {
    cart = cart.filter(item => item._id !== cartIndexOrId && item.productId !== cartIndexOrId);
  }
  saveCart(cart);
  if (typeof showToast === 'function') showToast('Item removed from cart', 'info');
}

function updateCartQuantity(cartIndexOrId, quantity, size = null) {
  let cart = getCart();
  if (quantity < 1) {
    removeFromCart(cartIndexOrId, size);
    return;
  }
  if (typeof cartIndexOrId === 'number') {
    if (cart[cartIndexOrId]) cart[cartIndexOrId].quantity = quantity;
  } else {
    cart = cart.map(item => {
      if ((item._id === cartIndexOrId || item.productId === cartIndexOrId) && (!size || item.size === size)) {
        return { ...item, quantity };
      }
      return item;
    });
  }
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// ── Expose ────────────────────────────────────────────────────────
window.getCart             = getCart;
window.addToCart           = addToCart;
window.removeFromCart      = removeFromCart;
window.updateCartQuantity  = updateCartQuantity;
window.clearCart           = clearCart;
window.getCartTotal        = getCartTotal;
window.getCartCount        = getCartCount;

