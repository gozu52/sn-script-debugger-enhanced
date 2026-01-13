/**
 * 開発用のwatchスクリプト
 */

const { execSync } = require('child_process');

console.log('👀 Starting development mode...\n');
console.log('Watching for file changes...\n');

try {
  execSync('webpack --mode development --watch', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Watch mode stopped!');
  process.exit(1);
}