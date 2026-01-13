/**
 * Log Service
 * Background Scriptとの通信を抽象化
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types';

class LogService {
  /**
   * ログを取得
   */
  async getLogs(filters = {}, limit = 100, offset = 0) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_LOGS,
      filters,
      limit,
      offset,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get logs');
  }

  /**
   * ログを検索
   */
  async searchLogs(filters) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.SEARCH_LOGS,
      filters,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to search logs');
  }

  /**
   * すべてのログをクリア
   */
  async clearAllLogs() {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.CLEAR_LOGS,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to clear logs');
  }

  /**
   * ログをエクスポート
   */
  async exportLogs(format = 'json', filters = {}) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.EXPORT_LOGS,
      format,
      filters,
    });

    if (response.type === 'SUCCESS') {
      return response.data.data;
    }

    throw new Error(response.error?.message || 'Failed to export logs');
  }

  /**
   * ファイルとしてダウンロード
   */
  downloadLogs(data, format = 'json') {
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sn-debugger-logs-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const logService = new LogService();