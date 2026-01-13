/**
 * ServiceNowインスタンス情報の管理
 */

import { STORAGE_KEYS } from '../../shared/constants/storage-keys.js';
import { detectServiceNowVersion } from './version-detector.js';

class InstanceManager {
  constructor() {
    this.instances = new Map();
  }

  /**
   * インスタンス情報を取得または作成
   * @param {string} instanceUrl
   * @returns {Promise<object>}
   */
  async getOrCreateInstance(instanceUrl) {
    const instanceId = this.getInstanceId(instanceUrl);
    
    if (this.instances.has(instanceId)) {
      return this.instances.get(instanceId);
    }
    
    // ストレージから取得
    const stored = await this.loadFromStorage(instanceId);
    if (stored) {
      this.instances.set(instanceId, stored);
      return stored;
    }
    
    // 新規作成
    const instance = await this.createInstance(instanceUrl);
    this.instances.set(instanceId, instance);
    await this.saveToStorage(instanceId, instance);
    
    return instance;
  }

  /**
   * インスタンス情報を作成
   * @param {string} instanceUrl
   * @returns {Promise<object>}
   */
  async createInstance(instanceUrl) {
    const instanceId = this.getInstanceId(instanceUrl);
    const versionInfo = await detectServiceNowVersion(instanceUrl);
    
    return {
      id: instanceId,
      url: instanceUrl,
      name: this.extractInstanceName(instanceUrl),
      version: versionInfo,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      totalSessions: 1,
    };
  }

  /**
   * インスタンスIDを生成
   * @param {string} instanceUrl
   * @returns {string}
   */
  getInstanceId(instanceUrl) {
    const url = new URL(instanceUrl);
    return url.hostname;
  }

  /**
   * インスタンス名を抽出
   * @param {string} instanceUrl
   * @returns {string}
   */
  extractInstanceName(instanceUrl) {
    const url = new URL(instanceUrl);
    const parts = url.hostname.split('.');
    return parts[0]; // 例: dev12345.service-now.com → dev12345
  }

  /**
   * インスタンス情報を更新
   * @param {string} instanceId
   * @param {object} updates
   */
  async updateInstance(instanceId, updates) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    Object.assign(instance, updates, {
      lastSeen: Date.now(),
    });
    
    this.instances.set(instanceId, instance);
    await this.saveToStorage(instanceId, instance);
  }

  /**
   * ストレージから読み込み
   * @param {string} instanceId
   * @returns {Promise<object|null>}
   */
  async loadFromStorage(instanceId) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INSTANCE_INFO], (result) => {
        const instances = result[STORAGE_KEYS.INSTANCE_INFO] || {};
        resolve(instances[instanceId] || null);
      });
    });
  }

  /**
   * ストレージに保存
   * @param {string} instanceId
   * @param {object} instance
   */
  async saveToStorage(instanceId, instance) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INSTANCE_INFO], (result) => {
        const instances = result[STORAGE_KEYS.INSTANCE_INFO] || {};
        instances[instanceId] = instance;
        
        chrome.storage.local.set(
          { [STORAGE_KEYS.INSTANCE_INFO]: instances },
          resolve
        );
      });
    });
  }

  /**
   * すべてのインスタンス情報を取得
   * @returns {Promise<object[]>}
   */
  async getAllInstances() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INSTANCE_INFO], (result) => {
        const instances = result[STORAGE_KEYS.INSTANCE_INFO] || {};
        resolve(Object.values(instances));
      });
    });
  }

  /**
   * インスタンス情報をクリア
   * @param {string} instanceId
   */
  async clearInstance(instanceId) {
    this.instances.delete(instanceId);
    
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INSTANCE_INFO], (result) => {
        const instances = result[STORAGE_KEYS.INSTANCE_INFO] || {};
        delete instances[instanceId];
        
        chrome.storage.local.set(
          { [STORAGE_KEYS.INSTANCE_INFO]: instances },
          resolve
        );
      });
    });
  }
}

// シングルトンインスタンス
export const instanceManager = new InstanceManager();