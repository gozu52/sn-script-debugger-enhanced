/**
 * ログデータのストレージ管理
 */

import { openDB } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_LOGS,
  INDEX_NAMES,
} from '../../shared/constants/storage-keys.js';
import { LOG_CONFIG } from '../../shared/constants/config.js';
import { migrateDatabase } from '../../shared/db/db-migrations.js';

class LogStorage {
  constructor() {
    this.dbPromise = this.initDB();
  }

  /**
   * データベースを初期化
   */
  async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        migrateDatabase(db, oldVersion, newVersion, transaction);
      },
      blocked() {
        console.warn('[LogStorage] Database upgrade blocked');
      },
      blocking() {
        console.warn('[LogStorage] Database blocking other connections');
      },
    });
  }

  /**
   * ログを保存
   * @param {object} logEntry
   * @returns {Promise<string>} ログID
   */
  async saveLog(logEntry) {
    try {
      const db = await this.dbPromise;
      const id = await db.add(STORE_LOGS, logEntry);
      
      // 自動クリーンアップ
      await this.cleanupOldLogs();
      
      return id;
    } catch (error) {
      console.error('[LogStorage] Error saving log:', error);
      throw error;
    }
  }

  /**
   * 複数のログを一括保存
   * @param {object[]} logEntries
   * @returns {Promise<string[]>}
   */
  async saveLogs(logEntries) {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_LOGS, 'readwrite');
      const store = tx.objectStore(STORE_LOGS);
      
      const ids = [];
      for (const entry of logEntries) {
        const id = await store.add(entry);
        ids.push(id);
      }
      
      await tx.done;
      
      // 自動クリーンアップ
      await this.cleanupOldLogs();
      
      return ids;
    } catch (error) {
      console.error('[LogStorage] Error saving logs:', error);
      throw error;
    }
  }

  /**
   * ログを検索
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async searchLogs(filters = {}) {
    try {
      const db = await this.dbPromise;
      let logs = await db.getAll(STORE_LOGS);
      
      // フィルタリング
      logs = this.applyFilters(logs, filters);
      
      // ソート（新しい順）
      logs.sort((a, b) => b.timestamp - a.timestamp);
      
      // ページネーション
      if (filters.limit) {
        const start = filters.offset || 0;
        logs = logs.slice(start, start + filters.limit);
      }
      
      return logs;
    } catch (error) {
      console.error('[LogStorage] Error searching logs:', error);
      throw error;
    }
  }

  /**
   * フィルターを適用
   * @param {object[]} logs
   * @param {object} filters
   * @returns {object[]}
   */
  applyFilters(logs, filters) {
    let filtered = logs;
    
    // レベルフィルター
    if (filters.levels && filters.levels.length > 0) {
      filtered = filtered.filter(log => filters.levels.includes(log.level));
    }
    
    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(keyword) ||
        (log.stackTrace && log.stackTrace.toLowerCase().includes(keyword))
      );
    }
    
    // テーブルフィルター
    if (filters.table) {
      filtered = filtered.filter(log => log.context?.table === filters.table);
    }
    
    // 時間範囲フィルター
    if (filters.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filters.startTime);
    }
    if (filters.endTime) {
      filtered = filtered.filter(log => log.timestamp <= filters.endTime);
    }
    
    return filtered;
  }

  /**
   * ログIDでログを取得
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async getLog(id) {
    try {
      const db = await this.dbPromise;
      return await db.get(STORE_LOGS, id);
    } catch (error) {
      console.error('[LogStorage] Error getting log:', error);
      return null;
    }
  }

  /**
   * ログを削除
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteLog(id) {
    try {
      const db = await this.dbPromise;
      await db.delete(STORE_LOGS, id);
      return true;
    } catch (error) {
      console.error('[LogStorage] Error deleting log:', error);
      return false;
    }
  }

  /**
   * すべてのログをクリア
   * @returns {Promise<boolean>}
   */
  async clearAllLogs() {
    try {
      const db = await this.dbPromise;
      await db.clear(STORE_LOGS);
      console.log('[LogStorage] All logs cleared');
      return true;
    } catch (error) {
      console.error('[LogStorage] Error clearing logs:', error);
      return false;
    }
  }

  /**
   * 古いログを自動削除
   * @returns {Promise<number>} 削除件数
   */
  async cleanupOldLogs() {
    try {
      const db = await this.dbPromise;
      const cutoffTime = Date.now() - LOG_CONFIG.RETENTION_MS;
      
      const tx = db.transaction(STORE_LOGS, 'readwrite');
      const store = tx.objectStore(STORE_LOGS);
      const index = store.index(INDEX_NAMES.LOGS.TIMESTAMP);
      
      let deleteCount = 0;
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      for await (const cursor of index.iterate(range)) {
        cursor.delete();
        deleteCount++;
      }
      
      await tx.done;
      
      if (deleteCount > 0) {
        console.log(`[LogStorage] Cleaned up ${deleteCount} old logs`);
      }
      
      // 最大件数チェック
      await this.enforceMaxLogs();
      
      return deleteCount;
    } catch (error) {
      console.error('[LogStorage] Error cleaning up logs:', error);
      return 0;
    }
  }

  /**
   * 最大ログ件数を強制
   * @returns {Promise<number>} 削除件数
   */
  async enforceMaxLogs() {
    try {
      const db = await this.dbPromise;
      const allLogs = await db.getAllKeys(STORE_LOGS);
      
      if (allLogs.length <= LOG_CONFIG.MAX_LOGS) {
        return 0;
      }
      
      const excessCount = allLogs.length - LOG_CONFIG.MAX_LOGS;
      
      // 古いログから削除
      const tx = db.transaction(STORE_LOGS, 'readwrite');
      const store = tx.objectStore(STORE_LOGS);
      const index = store.index(INDEX_NAMES.LOGS.TIMESTAMP);
      
      let deleteCount = 0;
      for await (const cursor of index.iterate()) {
        if (deleteCount >= excessCount) break;
        cursor.delete();
        deleteCount++;
      }
      
      await tx.done;
      
      console.log(`[LogStorage] Enforced max logs, deleted ${deleteCount} entries`);
      return deleteCount;
    } catch (error) {
      console.error('[LogStorage] Error enforcing max logs:', error);
      return 0;
    }
  }

  /**
   * ログ統計を取得
   * @returns {Promise<object>}
   */
  async getLogStats() {
    try {
      const db = await this.dbPromise;
      const logs = await db.getAll(STORE_LOGS);
      
      const stats = {
        total: logs.length,
        byLevel: {},
        byTable: {},
        oldestTimestamp: null,
        newestTimestamp: null,
      };
      
      logs.forEach(log => {
        // レベル別カウント
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        
        // テーブル別カウント
        if (log.context?.table) {
          stats.byTable[log.context.table] = (stats.byTable[log.context.table] || 0) + 1;
        }
        
        // タイムスタンプ
        if (!stats.oldestTimestamp || log.timestamp < stats.oldestTimestamp) {
          stats.oldestTimestamp = log.timestamp;
        }
        if (!stats.newestTimestamp || log.timestamp > stats.newestTimestamp) {
          stats.newestTimestamp = log.timestamp;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('[LogStorage] Error getting stats:', error);
      return null;
    }
  }

  /**
   * ログをエクスポート
   * @param {string} format - 'json' | 'csv'
   * @param {object} filters
   * @returns {Promise<string>}
   */
  async exportLogs(format = 'json', filters = {}) {
    try {
      const logs = await this.searchLogs(filters);
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(logs);
      }
      
      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error('[LogStorage] Error exporting logs:', error);
      throw error;
    }
  }

  /**
   * ログをCSV形式に変換
   * @param {object[]} logs
   * @returns {string}
   */
  convertToCSV(logs) {
    const headers = [
      'ID',
      'Timestamp',
      'Level',
      'Message',
      'Table',
      'Record ID',
      'User',
      'URL',
    ];
    
    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.level,
      `"${log.message.replace(/"/g, '""')}"`,
      log.context?.table || '',
      log.context?.recordId || '',
      log.context?.user || '',
      log.url,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return csvContent;
  }
}

// シングルトンインスタンス
export const logStorage = new LogStorage();