/* ================================================================
   RUXOVA PERFUMES — Local Product Gallery Image Configuration
   Product metadata (Title, Description, Size Variants, Prices, Stock)
   is dynamically fetched from the MongoDB Backend API.
   This file ONLY maps local 5-image static assets.
   ================================================================ */

window.PRODUCT_IMAGES = {
  'ruxova-premium': [
    '/products/ruxova-premium-1.jpg',
    '/products/ruxova-premium-2.jpg',
    '/products/ruxova-premium-3.jpg',
    '/products/ruxova-premium-4.jpg',
    '/products/ruxova-premium-5.jpg'
  ],
  '10ml': [
    '/products/ruxova-10ml-1.jpg',
    '/products/ruxova-10ml-2.jpg',
    '/products/ruxova-10ml-3.jpg',
    '/products/ruxova-10ml-4.jpg',
    '/products/ruxova-10ml-5.jpg'
  ],
  '25ml': [
    '/products/ruxova-25ml-1.jpg',
    '/products/ruxova-25ml-2.jpg',
    '/products/ruxova-25ml-3.jpg',
    '/products/ruxova-25ml-4.jpg',
    '/products/ruxova-25ml-5.jpg'
  ],
  '50ml': [
    '/products/ruxova-50ml-1.jpg',
    '/products/ruxova-50ml-2.jpg',
    '/products/ruxova-50ml-3.jpg',
    '/products/ruxova-50ml-4.jpg',
    '/products/ruxova-50ml-5.jpg'
  ],
  '100ml': [
    '/products/ruxova-100ml-1.jpg',
    '/products/ruxova-100ml-2.jpg',
    '/products/ruxova-100ml-3.jpg',
    '/products/ruxova-100ml-4.jpg',
    '/products/ruxova-100ml-5.jpg'
  ],
  '200ml': [
    '/products/ruxova-200ml-1.jpg',
    '/products/ruxova-200ml-2.jpg',
    '/products/ruxova-200ml-3.jpg',
    '/products/ruxova-200ml-4.jpg',
    '/products/ruxova-200ml-5.jpg'
  ]
};

/**
 * Helper to get 5-image local product array for Flipkart gallery
 */
window.getProductLocalImages = function(productId, size = '50ml') {
  const cleanId = (productId || 'ruxova-premium').toString().toLowerCase().trim();
  const cleanSize = (size || '50ml').toString().toLowerCase().trim();

  if (window.PRODUCT_IMAGES[cleanId]) return window.PRODUCT_IMAGES[cleanId];
  if (window.PRODUCT_IMAGES[cleanSize]) return window.PRODUCT_IMAGES[cleanSize];
  return window.PRODUCT_IMAGES['ruxova-premium'];
};

/**
 * Helper to get primary thumbnail image for product cards and cart
 */
window.getProductPrimaryImage = function(productId, size = '50ml') {
  const imgs = window.getProductLocalImages(productId, size);
  return imgs && imgs.length > 0 ? imgs[0] : '/products/ruxova-50ml-1.jpg';
};

// Legacy compatibility wrapper
window.getProductConfig = function(productId) {
  return {
    id: productId || 'ruxova-premium',
    images: window.getProductLocalImages(productId)
  };
};
