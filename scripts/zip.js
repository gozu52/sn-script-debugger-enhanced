/**
 * Chrome Web Store用のzipファイル作成スクリプト
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '../dist');
const outputDir = path.join(__dirname, '..');
const manifest = require('../dist/manifest.json');
const version = manifest.version;
const zipName = `sn-script-debugger-enhanced-v${version}.zip`;
const zipPath = path.join(outputDir, zipName);

console.log('Creating Chrome Extension package...');

// distディレクトリが存在するかチェック
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// 既存のzipファイルを削除
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
  console.log('Removed existing zip file');
}

// zipファイルを作成
try {
  execSync(`cd dist && zip -r ../${zipName} ./*`, { stdio: 'inherit' });
  console.log(`\n✅ Package created: ${zipName}`);
  console.log(`   Size: ${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB`);
  console.log(`\nReady to upload to Chrome Web Store!`);
} catch (error) {
  console.error('Error creating zip file:', error);
  process.exit(1);
}