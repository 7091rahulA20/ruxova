const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');

console.log('🚀 Building RUXOVA Client Static Site...');

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean & create dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all root files and directories except dist, node_modules, .git
const rootEntries = fs.readdirSync(srcDir, { withFileTypes: true });
for (const entry of rootEntries) {
  if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'build.js') {
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

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ BUILD SUCCESSFUL: Generated dist/index.html');
  console.log(`📦 dist directory contains ${fs.readdirSync(distDir).length} top-level entries.`);
} else {
  console.error('❌ BUILD ERROR: dist/index.html was not generated!');
  process.exit(1);
}
