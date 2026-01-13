/**
 * 日付関連のユーティリティ関数
 */

/**
 * タイムスタンプをフォーマットされた文字列に変換
 * @param {number} timestamp - ミリ秒単位のタイムスタンプ
 * @param {string} format - フォーマット形式
 * @returns {string}
 */
export function formatTimestamp(timestamp, format = 'datetime') {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'time':
      return date.toLocaleTimeString('ja-JP');
    
    case 'date':
      return date.toLocaleDateString('ja-JP');
    
    case 'datetime':
      return date.toLocaleString('ja-JP');
    
    case 'iso':
      return date.toISOString();
    
    case 'relative':
      return getRelativeTime(timestamp);
    
    default:
      return date.toLocaleString('ja-JP');
  }
}

/**
 * 相対時間を取得（例: "3分前"）
 * @param {number} timestamp
 * @returns {string}
 */
export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return `${seconds}秒前`;
  } else if (minutes < 60) {
    return `${minutes}分前`;
  } else if (hours < 24) {
    return `${hours}時間前`;
  } else if (days < 7) {
    return `${days}日前`;
  } else {
    return formatTimestamp(timestamp, 'date');
  }
}

/**
 * 期間を人間が読みやすい形式に変換
 * @param {number} ms - ミリ秒
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 日付範囲が有効かチェック
 * @param {number} startTime
 * @param {number} endTime
 * @returns {boolean}
 */
export function isValidDateRange(startTime, endTime) {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
}

/**
 * 今日の開始時刻を取得
 * @returns {number}
 */
export function getStartOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * 今日の終了時刻を取得
 * @returns {number}
 */
export function getEndOfToday() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.getTime();
}

/**
 * N日前の開始時刻を取得
 * @param {number} days
 * @returns {number}
 */
export function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}