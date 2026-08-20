const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');
const clientHtmlDir = path.join(__dirname, 'client-html');
const clientHtmlDistDir = path.join(clientHtmlDir, 'dist');

console.log('🚀 Building RUXOVA Client Static Site...');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'client-html') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Clean & Build ./dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const rootEntries = fs.readdirSync(srcDir, { withFileTypes: true });
for (const entry of rootEntries) {
  if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'client-html' || entry.name === 'build.js') {
    continue;
  }
  const srcPath = path.join(srcDir, entry.name);
  const destPath = path.join(distDir, entry.name);

  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// 2. Populate /product/index.html and static product SSG routes
const productHtmlFile = path.join(srcDir, 'product.html');
const productFolderInDist = path.join(distDir, 'product');
const productsFolderInDist = path.join(distDir, 'products');

if (fs.existsSync(productHtmlFile)) {
  fs.mkdirSync(productFolderInDist, { recursive: true });
  fs.mkdirSync(productsFolderInDist, { recursive: true });

  // Default product route
  fs.copyFileSync(productHtmlFile, path.join(productFolderInDist, 'index.html'));

  // Static product SSG pages for direct crawler indexing
  const productSlugs = [
    'ruxova-oud-royal',
    'ruxova-velvet-rose',
    'ruxova-golden-amber',
    'ruxova-black-orchid',
    'ruxova-ocean-breeze',
    'ruxova-french-vanilla'
  ];

  productSlugs.forEach(slug => {
    fs.copyFileSync(productHtmlFile, path.join(productsFolderInDist, `${slug}.html`));
  });

  console.log(`✅ SSG PRE-RENDERED ${productSlugs.length} static product pages in dist/products/`);
}

// Clean route folders (e.g. /return-policy -> /return-policy/index.html)
const pageRoutes = [
  'shipping-policy',
  'return-policy',
  'privacy-policy',
  'terms',
  'contact',
  'shop',
  'cart',
  'checkout'
];

pageRoutes.forEach(route => {
  const htmlFile = path.join(srcDir, `${route}.html`);
  const folderInDist = path.join(distDir, route);
  if (fs.existsSync(htmlFile)) {
    fs.mkdirSync(folderInDist, { recursive: true });
    fs.copyFileSync(htmlFile, path.join(folderInDist, 'index.html'));
  }
});
console.log(`✅ Generated clean URL routes for ${pageRoutes.length} pages (${pageRoutes.join(', ')})`);

// 3. Also populate ./client-html folder for Vercel if Vercel Root Directory is set to "client-html"
if (fs.existsSync(clientHtmlDir)) {
  fs.rmSync(clientHtmlDir, { recursive: true, force: true });
}
fs.mkdirSync(clientHtmlDir, { recursive: true });
copyDir(srcDir, clientHtmlDir);
copyDir(distDir, clientHtmlDistDir);

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ BUILD SUCCESSFUL: Generated dist/index.html, dist/shop.html, dist/product.html & policy pages');
} else {
  console.error('❌ BUILD ERROR: index.html missing');
  process.exit(1);
}
