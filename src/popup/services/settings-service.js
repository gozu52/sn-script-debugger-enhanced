/**
 * Settings Service
 * 設定管理のAPI通信
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types';

class SettingsService {
  /**
   * 設定を取得
   */
  async getSettings() {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_SETTINGS,
    });

    if (response.type === 'SUCCESS') {
      return response.data.settings;
    }

    throw new Error(response.error?.message || 'Failed to get settings');
  }

  /**
   * 設定を更新
   */
  async updateSettings(settings) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.UPDATE_SETTINGS,
      settings,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update settings');
  }

  /**
   * 特定の設定を更新
   */
  async updateSetting(path, value) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.UPDATE_SETTINGS,
      path,
      value,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update setting');
  }

  /**
   * 設定をエクスポート
   */
  exportSettings(settings) {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sn-debugger-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 設定をインポート
   */
  async importSettings(file) {
    const text = await file.text();
    const settings = JSON.parse(text);
    return await this.updateSettings(settings);
  }
}

export const settingsService = new SettingsService();