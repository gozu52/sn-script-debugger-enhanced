/**
 * 設定データのストレージ管理
 */

import { openDB } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_SETTINGS,
  STORAGE_KEYS,
} from '../../shared/constants/storage-keys.js';
import {
  LOG_CONFIG,
  PERFORMANCE_CONFIG,
  UI_CONFIG,
  MASKING_CONFIG,
} from '../../shared/constants/config.js';
import { migrateDatabase } from '../../shared/db/db-migrations.js';
import { deepMerge } from '../../shared/utils/object-utils.js';

class SettingsStorage {
  constructor() {
    this.dbPromise = this.initDB();
    this.defaultSettings = this.getDefaultSettings();
  }

  /**
   * データベースを初期化
   */
  async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        migrateDatabase(db, oldVersion, newVersion, transaction);
      },
    });
  }

  /**
   * デフォルト設定を取得
   */
  getDefaultSettings() {
    return {
      // ログ設定
      logs: {
        enabled: true,
        retentionDays: LOG_CONFIG.RETENTION_DAYS,
        maxLogs: LOG_CONFIG.MAX_LOGS,
        defaultLevels: LOG_CONFIG.DEFAULT_FILTERS.levels,
        autoCleanup: true,
      },
      
      // パフォーマンス設定
      performance: {
        enabled: true,
        samplingRate: PERFORMANCE_CONFIG.SAMPLING_RATE,
        slowQueryThreshold: PERFORMANCE_CONFIG.SLOW_QUERY_THRESHOLD,
        slowAPIThreshold: PERFORMANCE_CONFIG.SLOW_API_THRESHOLD,
        retentionDays: PERFORMANCE_CONFIG.RETENTION_DAYS,
      },
      
      // UI設定
      ui: {
        theme: UI_CONFIG.THEMES.AUTO,
        defaultTab: UI_CONFIG.TABS.LOGS,
        pageSize: UI_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
        showTimestamps: true,
        compactMode: false,
      },
      
      // データマスキング設定
      masking: {
        enabled: true,
        sensitivePatterns: MASKING_CONFIG.SENSITIVE_PATTERNS.map(p => p.source),
        maskChar: MASKING_CONFIG.MASK_CHAR,
        maskLength: MASKING_CONFIG.MASK_LENGTH,
      },
      
      // スニペット設定
      snippets: {
        defaultCategory: 'gliderecord',
        autoSave: true,
        syntaxHighlighting: true,
      },
      
      // 通知設定
      notifications: {
        enabled: true,
        showSlowQueries: true,
        showErrors: true,
        sound: false,
      },
      
      // エクスポート設定
      export: {
        defaultFormat: 'json',
        includeTimestamp: true,
        compressData: false,
      },
      
      // 高度な設定
      advanced: {
        debugMode: false,
        verboseLogging: false,
        disableCache: false,
      },
    };
  }

  /**
   * すべての設定を取得
   * @returns {Promise<object>}
   */
  async getAllSettings() {
    try {
      const db = await this.dbPromise;
      const storedSettings = await db.get(STORE_SETTINGS, 'main');
      
      if (!storedSettings) {
        // デフォルト設定を返す
        return this.defaultSettings;
      }
      
      // デフォルト設定とマージ（新しい設定項目に対応）
      return deepMerge(this.defaultSettings, storedSettings.value);
    } catch (error) {
      console.error('[SettingsStorage] Error getting settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * 設定を保存
   * @param {object} settings
   * @returns {Promise<boolean>}
   */
  async saveSettings(settings) {
    try {
      const db = await this.dbPromise;
      
      await db.put(STORE_SETTINGS, {
        key: 'main',
        value: settings,
        updated: Date.now(),
      });
      
      console.log('[SettingsStorage] Settings saved');
      return true;
    } catch (error) {
      console.error('[SettingsStorage] Error saving settings:', error);
      return false;
    }
  }

  /**
   * 特定の設定を取得
   * @param {string} path - 'logs.enabled' などのドットパス
   * @returns {Promise<any>}
   */
  async getSetting(path) {
    try {
      const settings = await this.getAllSettings();
      const keys = path.split('.');
      let value = settings;
      
      for (const key of keys) {
        if (value === undefined || value === null) {
          return undefined;
        }
        value = value[key];
      }
      
      return value;
    } catch (error) {
      console.error('[SettingsStorage] Error getting setting:', error);
      return undefined;
    }
  }

  /**
   * 特定の設定を更新
   * @param {string} path - 'logs.enabled' などのドットパス
   * @param {any} value
   * @returns {Promise<boolean>}
   */
  async updateSetting(path, value) {
    try {
      const settings = await this.getAllSettings();
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = settings;
      
      for (const key of keys) {
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[lastKey] = value;
      
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('[SettingsStorage] Error updating setting:', error);
      return false;
    }
  }

  /**
   * 設定をリセット
   * @returns {Promise<boolean>}
   */
  async resetSettings() {
    try {
      return await this.saveSettings(this.defaultSettings);
    } catch (error) {
      console.error('[SettingsStorage] Error resetting settings:', error);
      return false;
    }
  }

  /**
   * 設定をエクスポート
   * @returns {Promise<string>}
   */
  async exportSettings() {
    try {
      const settings = await this.getAllSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('[SettingsStorage] Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * 設定をインポート
   * @param {string} jsonData
   * @returns {Promise<boolean>}
   */
  async importSettings(jsonData) {
    try {
      const settings = JSON.parse(jsonData);
      
      // バリデーション
      if (!this.validateSettings(settings)) {
        throw new Error('Invalid settings format');
      }
      
      // デフォルト設定とマージ
      const mergedSettings = deepMerge(this.defaultSettings, settings);
      
      return await this.saveSettings(mergedSettings);
    } catch (error) {
      console.error('[SettingsStorage] Error importing settings:', error);
      return false;
    }
  }

  /**
   * 設定のバリデーション
   * @param {object} settings
   * @returns {boolean}
   */
  validateSettings(settings) {
    try {
      // 基本的な構造チェック
      if (typeof settings !== 'object' || settings === null) {
        return false;
      }
      
      // 必須セクションのチェック
      const requiredSections = ['logs', 'performance', 'ui'];
      for (const section of requiredSections) {
        if (!(section in settings)) {
          console.warn(`[SettingsStorage] Missing required section: ${section}`);
          return false;
        }
      }
      
      // 型チェック（サンプル）
      if (typeof settings.logs.enabled !== 'boolean') {
        console.warn('[SettingsStorage] logs.enabled must be boolean');
        return false;
      }
      
      if (typeof settings.performance.samplingRate !== 'number' ||
          settings.performance.samplingRate < 0 ||
          settings.performance.samplingRate > 1) {
        console.warn('[SettingsStorage] performance.samplingRate must be between 0 and 1');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[SettingsStorage] Validation error:', error);
      return false;
    }
  }

  /**
   * Chrome Storageとの同期
   * IndexedDBとChrome Storageの両方に保存する
   * @param {object} settings
   * @returns {Promise<boolean>}
   */
  async syncWithChromeStorage(settings) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set(
          { [STORAGE_KEYS.SETTINGS]: settings },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      });
      
      console.log('[SettingsStorage] Synced with Chrome Storage');
      return true;
    } catch (error) {
      console.error('[SettingsStorage] Error syncing with Chrome Storage:', error);
      return false;
    }
  }

  /**
   * Chrome Storageから設定を取得
   * @returns {Promise<object|null>}
   */
  async getFromChromeStorage() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
          resolve(result);
        });
      });
      
      return result[STORAGE_KEYS.SETTINGS] || null;
    } catch (error) {
      console.error('[SettingsStorage] Error getting from Chrome Storage:', error);
      return null;
    }
  }
}

// シングルトンインスタンス
export const settingsStorage = new SettingsStorage();