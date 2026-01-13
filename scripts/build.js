/**
 * カスタムビルドスクリプト
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Script Debugger Enhanced...\n');

// Webpackビルドを実行
try {
  execSync('webpack --mode production', { stdio: 'inherit' });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}

// ビルドサイズを表示
const distPath = path.join(__dirname, '../dist');
const files = fs.readdirSync(distPath);

console.log('\n📦 Build Output:');
files.forEach(file => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  
  if (stats.isFile()) {
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   ${file.padEnd(30)} ${sizeKB.padStart(10)} KB`);
  }
});

console.log('\n✨ Extension is ready to load in Chrome!\n');