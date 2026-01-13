/**
 * オブジェクト操作関連のユーティリティ関数
 */

/**
 * ディープクローン
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * ディープマージ
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
export function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * オブジェクトかどうかをチェック
 * @param {any} item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 空のオブジェクトかどうかをチェック
 * @param {object} obj
 * @returns {boolean}
 */
export function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * ネストされたプロパティを安全に取得
 * @param {object} obj
 * @param {string} path - 'a.b.c' 形式
 * @param {any} defaultValue
 * @returns {any}
 */
export function getNestedProperty(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * ネストされたプロパティを設定
 * @param {object} obj
 * @param {string} path - 'a.b.c' 形式
 * @param {any} value
 */
export function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * オブジェクトから特定のキーを除外
 * @param {object} obj
 * @param {string[]} keys
 * @returns {object}
 */
export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * オブジェクトから特定のキーのみを取得
 * @param {object} obj
 * @param {string[]} keys
 * @returns {object}
 */
export function pick(obj, keys) {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * オブジェクトの配列を特定のキーでグループ化
 * @param {Array} array
 * @param {string} key
 * @returns {object}
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * オブジェクトの配列をユニークにする
 * @param {Array} array
 * @param {string} key - ユニーク判定に使うキー
 * @returns {Array}
 */
export function uniqueBy(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * オブジェクトをフラットにする
 * @param {object} obj
 * @param {string} prefix
 * @returns {object}
 */
export function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (isObject(value) && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
}

/**
 * JSONを安全にパース
 * @param {string} json
 * @param {any} defaultValue
 * @returns {any}
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * JSONを安全に文字列化
 * @param {any} obj
 * @param {number} space
 * @returns {string}
 */
export function safeJsonStringify(obj, space = 0) {
  try {
    return JSON.stringify(obj, null, space);
  } catch (e) {
    return String(obj);
  }
}

/**
 * 2つのオブジェクトが等しいかチェック（ディープ比較）
 * @param {any} obj1
 * @param {any} obj2
 * @returns {boolean}
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) return false;
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => deepEqual(obj1[key], obj2[key]));
}

/**
 * 配列をチャンクに分割
 * @param {Array} array
 * @param {number} size
 * @returns {Array}
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * デバウンス関数
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * スロットル関数
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}