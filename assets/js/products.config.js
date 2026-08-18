/* ================================================================
   RUXOVA PERFUMES — Centralized Product & Variant Image Configuration
   Manages local static images and pricing per size/variant.
   No backend API image calls required.
   ================================================================ */

window.RUXOVA_PRODUCTS_CONFIG = {
  'ruxova-premium': {
    id: 'ruxova-premium',
    name: 'RUXOVA Premium Eau De Parfum',
    description: 'An opulent luxury fragrance combining royal oud, French rose, bergamot, and warm golden amber for an irresistible, long-lasting aura.',
    defaultSize: '50ml',
    sizes: {
      '10ml':  { price: 70,   comparePrice: 99,   images: ['products/ruxova-10ml-1.jpg',  'products/ruxova-10ml-2.jpg',  'products/ruxova-10ml-3.jpg',  'products/ruxova-10ml-4.jpg'] },
      '25ml':  { price: 250,  comparePrice: 349,  images: ['products/ruxova-25ml-1.jpg',  'products/ruxova-25ml-2.jpg',  'products/ruxova-25ml-3.jpg',  'products/ruxova-25ml-4.jpg'] },
      '50ml':  { price: 450,  comparePrice: 599,  images: ['products/ruxova-50ml-1.jpg',  'products/ruxova-50ml-2.jpg',  'products/ruxova-50ml-3.jpg',  'products/ruxova-50ml-4.jpg'] },
      '100ml': { price: 799,  comparePrice: 1199, images: ['products/ruxova-100ml-1.jpg', 'products/ruxova-100ml-2.jpg', 'products/ruxova-100ml-3.jpg', 'products/ruxova-100ml-4.jpg'] },
      '200ml': { price: 1499, comparePrice: 1999, images: ['products/ruxova-200ml-1.jpg', 'products/ruxova-200ml-2.jpg', 'products/ruxova-200ml-3.jpg', 'products/ruxova-200ml-4.jpg'] }
    }
  }
};

/**
 * Get product configuration object by productId or fallback to ruxova-premium
 */
window.getProductConfig = function(productId) {
  if (productId && window.RUXOVA_PRODUCTS_CONFIG[productId]) {
    return window.RUXOVA_PRODUCTS_CONFIG[productId];
  }
  return window.RUXOVA_PRODUCTS_CONFIG['ruxova-premium'];
};

/**
 * Get predictable local product image array for a given size/ML
 */
window.getProductLocalImages = function(productId, size = '50ml') {
  const normSize = (size || '50ml').toString().toLowerCase().trim();
  const config = window.getProductConfig(productId);
  if (config && config.sizes && config.sizes[normSize]) {
    return config.sizes[normSize].images;
  }
  const cleanSize = normSize.includes('ml') ? normSize : `${normSize}ml`;
  return [
    `products/ruxova-${cleanSize}-1.jpg`,
    `products/ruxova-${cleanSize}-2.jpg`,
    `products/ruxova-${cleanSize}-3.jpg`,
    `products/ruxova-${cleanSize}-4.jpg`
  ];
};

/**
 * Get primary single image URL for thumbnails in Shop / Cart / Orders
 */
window.getProductPrimaryImage = function(productId, size = '50ml') {
  const imgs = window.getProductLocalImages(productId, size);
  return imgs && imgs.length > 0 ? imgs[0] : 'products/ruxova-50ml-1.jpg';
};
