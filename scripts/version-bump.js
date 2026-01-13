/**
 * バージョン番号を更新するスクリプト
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // major, minor, patch

// manifest.json を読み込み
const manifestPath = path.join(__dirname, '../manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// package.json を読み込み
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 現在のバージョンを取得
const currentVersion = manifest.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 新しいバージョンを計算
let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${currentVersion} → ${newVersion}`);

// manifest.json を更新
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// package.json を更新
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Version updated successfully!');
console.log(`   manifest.json: ${newVersion}`);
console.log(`   package.json: ${newVersion}`);