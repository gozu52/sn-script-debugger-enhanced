/**
 * データマスキングヘルパー
 * センシティブなデータを自動的にマスク
 */

import { MASKING_CONFIG } from '../../shared/constants/config.js';

export class DataMasking {
  constructor() {
    this.sensitivePatterns = MASKING_CONFIG.SENSITIVE_PATTERNS;
    this.valuePatterns = MASKING_CONFIG.VALUE_PATTERNS;
    this.maskChar = MASKING_CONFIG.MASK_CHAR;
    this.maskLength = MASKING_CONFIG.MASK_LENGTH;
  }

  /**
   * オブジェクト全体をマスク
   * @param {object} obj
   * @param {boolean} deep - ネストされたオブジェクトもマスクするか
   * @returns {object}
   */
  maskObject(obj, deep = true) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const masked = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        masked[key] = this.maskValue(value);
      } else if (deep && typeof value === 'object' && value !== null) {
        masked[key] = this.maskObject(value, deep);
      } else if (typeof value === 'string') {
        masked[key] = this.maskSensitiveValues(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * キーがセンシティブかどうかをチェック
   * @param {string} key
   * @returns {boolean}
   */
  isSensitiveKey(key) {
    if (!key) return false;

    const lowerKey = key.toLowerCase();
    return this.sensitivePatterns.some(pattern => pattern.test(lowerKey));
  }

  /**
   * 値をマスク
   * @param {any} value
   * @returns {string}
   */
  maskValue(value) {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string' && value.length > 0) {
      return this.maskChar.repeat(this.maskLength);
    }

    return this.maskChar.repeat(this.maskLength);
  }

  /**
   * 文字列内のセンシティブな値をマスク
   * @param {string} text
   * @returns {string}
   */
  maskSensitiveValues(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let masked = text;

    // 定義されたパターンでマスク
    this.valuePatterns.forEach(({ pattern, replacement }) => {
      masked = masked.replace(pattern, replacement);
    });

    return masked;
  }

  /**
   * ログメッセージをマスク
   * @param {string} message
   * @returns {string}
   */
  maskLogMessage(message) {
    return this.maskSensitiveValues(message);
  }

  /**
   * URLパラメータをマスク
   * @param {string} url
   * @returns {string}
   */
  maskURL(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      // センシティブなパラメータをマスク
      for (const [key, value] of params.entries()) {
        if (this.isSensitiveKey(key)) {
          params.set(key, this.maskChar.repeat(this.maskLength));
        }
      }

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      // URLのパースに失敗した場合はそのまま返す
      return url;
    }
  }

  /**
   * フォームデータをマスク
   * @param {FormData|object} formData
   * @returns {object}
   */
  maskFormData(formData) {
    const masked = {};

    if (formData instanceof FormData) {
      for (const [key, value] of formData.entries()) {
        if (this.isSensitiveKey(key)) {
          masked[key] = this.maskValue(value);
        } else {
          masked[key] = value;
        }
      }
    } else {
      for (const [key, value] of Object.entries(formData)) {
        if (this.isSensitiveKey(key)) {
          masked[key] = this.maskValue(value);
        } else {
          masked[key] = value;
        }
      }
    }

    return masked;
  }

  /**
   * HTTPヘッダーをマスク
   * @param {object} headers
   * @returns {object}
   */
  maskHeaders(headers) {
    const masked = {};
    const sensitiveHeaders = [
      'authorization',
      'x-usertoken',
      'cookie',
      'x-api-key',
      'api-key',
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        masked[key] = this.maskValue(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * クレジットカード番号を検出してマスク
   * @param {string} text
   * @returns {string}
   */
  maskCreditCard(text) {
    // 一般的なクレジットカード番号のパターン
    const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    return text.replace(ccPattern, '****-****-****-****');
  }

  /**
   * 社会保障番号を検出してマスク
   * @param {string} text
   * @returns {string}
   */
  maskSSN(text) {
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    return text.replace(ssnPattern, '***-**-****');
  }

  /**
   * メールアドレスを部分的にマスク
   * @param {string} email
   * @returns {string}
   */
  maskEmail(email) {
    const emailPattern = /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    return email.replace(emailPattern, (match, username, domain) => {
      const maskedUsername = username.charAt(0) +
                            this.maskChar.repeat(Math.min(username.length - 1, 3));
      return `${maskedUsername}@${domain}`;
    });
  }

  /**
   * 電話番号をマスク
   * @param {string} phone
   * @returns {string}
   */
  maskPhone(phone) {
    // 最後の4桁以外をマスク
    const phonePattern = /(\d{3})[- ]?(\d{3})[- ]?(\d{4})/;
    return phone.replace(phonePattern, '***-***-$3');
  }

  /**
   * カスタムマスキングルールを追加
   * @param {RegExp} pattern
   * @param {string} replacement
   */
  addCustomPattern(pattern, replacement) {
    this.valuePatterns.push({ pattern, replacement });
  }

  /**
   * センシティブなキーパターンを追加
   * @param {RegExp} pattern
   */
  addSensitivePattern(pattern) {
    this.sensitivePatterns.push(pattern);
  }

  /**
   * すべてのマスキングを適用
   * @param {string} text
   * @returns {string}
   */
  maskAll(text) {
    let masked = text;

    masked = this.maskSensitiveValues(masked);
    masked = this.maskCreditCard(masked);
    masked = this.maskSSN(masked);

    return masked;
  }
}

// シングルトンインスタンス
export const dataMasking = new DataMasking();