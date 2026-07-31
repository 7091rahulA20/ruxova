/* ================================================================
   RUXOVA PERFUMES — Cart Management
   LocalStorage-based cart
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

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item._id === product._id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
    showToast(`${product.name} quantity updated in cart`, 'info');
  } else {
    cart.push({
      _id:      product._id,
      name:     product.name,
      price:    product.price,
      image:    product.images?.[0]?.url || '',
      quantity,
    });
    showToast(`${product.name} added to cart 🛒`, 'success');
  }

  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item._id !== productId);
  saveCart(cart);
  showToast('Item removed from cart', 'info');
}

function updateCartQuantity(productId, quantity) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  const cart = getCart().map(item =>
    item._id === productId ? { ...item, quantity } : item
  );
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
