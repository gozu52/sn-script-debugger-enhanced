/**
 * 文字列関連のユーティリティ関数
 */

/**
 * 文字列を切り詰める
 * @param {string} str
 * @param {number} maxLength
 * @param {string} suffix
 * @returns {string}
 */
export function truncate(str, maxLength = 100, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * キャメルケースをスネークケースに変換
 * @param {string} str
 * @returns {string}
 */
export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * スネークケースをキャメルケースに変換
 * @param {string} str
 * @returns {string}
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * センシティブデータをマスク
 * @param {string} str
 * @param {number} visibleChars - 表示する文字数
 * @returns {string}
 */
export function maskString(str, visibleChars = 0) {
  if (!str) return '';
  
  if (visibleChars === 0) {
    return '*'.repeat(8);
  }
  
  if (str.length <= visibleChars) {
    return str;
  }
  
  const visible = str.substring(0, visibleChars);
  const masked = '*'.repeat(Math.min(str.length - visibleChars, 8));
  return visible + masked;
}

/**
 * HTMLエスケープ
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 大文字小文字を区別しない検索
 * @param {string} str
 * @param {string} searchTerm
 * @returns {boolean}
 */
export function caseInsensitiveIncludes(str, searchTerm) {
  return str.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * ハイライト用のHTMLを生成
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
export function highlightText(text, query) {
  if (!query) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 正規表現の特殊文字をエスケープ
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * UUIDを生成
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}