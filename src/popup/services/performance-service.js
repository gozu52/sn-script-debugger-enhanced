/**
 * Performance Service
 * パフォーマンスデータ管理のAPI通信
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types';

class PerformanceService {
  /**
   * パフォーマンスデータを取得
   */
  async getPerformanceData(filters = {}) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_PERFORMANCE_DATA,
      filters,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get performance data');
  }

  /**
   * すべてのパフォーマンスデータをクリア
   */
  async clearPerformanceData() {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.CLEAR_PERFORMANCE_DATA,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to clear performance data');
  }
}

export const performanceService = new PerformanceService();