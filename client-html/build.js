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

// 2. Populate /product/index.html for clean URLs like /product?id=...
const productHtmlFile = path.join(srcDir, 'product.html');
const productFolderInDist = path.join(distDir, 'product');
if (fs.existsSync(productHtmlFile)) {
  fs.mkdirSync(productFolderInDist, { recursive: true });
  fs.copyFileSync(productHtmlFile, path.join(productFolderInDist, 'index.html'));
}

// 3. Also populate ./client-html folder for Vercel if Vercel Root Directory is set to "client-html"
if (fs.existsSync(clientHtmlDir)) {
  fs.rmSync(clientHtmlDir, { recursive: true, force: true });
}
fs.mkdirSync(clientHtmlDir, { recursive: true });
copyDir(srcDir, clientHtmlDir);
copyDir(distDir, clientHtmlDistDir);

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ BUILD SUCCESSFUL: Generated dist/index.html & client-html/dist/index.html');
} else {
  console.error('❌ BUILD ERROR: index.html missing');
  process.exit(1);
}
