/**
 * 暗号化・ハッシュ関連のユーティリティ関数
 */

/**
 * 簡易的なハッシュ関数（識別子生成用）
 * @param {string} str
 * @returns {string}
 */
export function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Base64エンコード
 * @param {string} str
 * @returns {string}
 */
export function base64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Base64 encoding error:', e);
    return '';
  }
}

/**
 * Base64デコード
 * @param {string} str
 * @returns {string}
 */
export function base64Decode(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Base64 decoding error:', e);
    return '';
  }
}

/**
 * SHA-256ハッシュを生成（Web Crypto API使用）
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * ランダムな文字列を生成
 * @param {number} length
 * @returns {string}
 */
export function generateRandomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

/**
 * UUIDv4を生成
 * @returns {string}
 */
export function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : fallbackUUID();
}

/**
 * フォールバックUUID生成（古いブラウザ用）
 * @returns {string}
 */
function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * センシティブデータの簡易暗号化（XOR）
 * 注意: これは強力な暗号化ではなく、単純な難読化です
 * @param {string} text
 * @param {string} key
 * @returns {string}
 */
export function simpleEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return base64Encode(result);
}

/**
 * センシティブデータの簡易復号化（XOR）
 * @param {string} encrypted
 * @param {string} key
 * @returns {string}
 */
export function simpleDecrypt(encrypted, key) {
  const decoded = base64Decode(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * パスワード強度をチェック
 * @param {string} password
 * @returns {object} { score: number, feedback: string[] }
 */
export function checkPasswordStrength(password) {
  const feedback = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (password.length < 8) {
    feedback.push('8文字以上にしてください');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('小文字を含めてください');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('大文字を含めてください');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('数字を含めてください');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('記号を含めてください');
  }
  
  return { score, feedback };
}