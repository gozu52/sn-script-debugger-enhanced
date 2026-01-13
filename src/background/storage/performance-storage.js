/**
 * パフォーマンスデータのストレージ管理
 */

import { openDB } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_PERFORMANCE,
  INDEX_NAMES,
} from '../../shared/constants/storage-keys.js';
import { PERFORMANCE_CONFIG } from '../../shared/constants/config.js';
import { migrateDatabase } from '../../shared/db/db-migrations.js';

class PerformanceStorage {
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
    });
  }

  /**
   * パフォーマンスデータを保存
   * @param {object} measurement
   * @returns {Promise<string>} 計測ID
   */
  async saveMeasurement(measurement) {
    try {
      // サンプリングレートによるフィルタリング
      if (Math.random() > PERFORMANCE_CONFIG.SAMPLING_RATE) {
        return null; // サンプリング対象外
      }

      const db = await this.dbPromise;
      const id = await db.add(STORE_PERFORMANCE, measurement);
      
      // 自動クリーンアップ
      await this.cleanupOldMeasurements();
      
      return id;
    } catch (error) {
      console.error('[PerformanceStorage] Error saving measurement:', error);
      throw error;
    }
  }

  /**
   * 複数の計測データを一括保存
   * @param {object[]} measurements
   * @returns {Promise<string[]>}
   */
  async saveMeasurements(measurements) {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_PERFORMANCE, 'readwrite');
      const store = tx.objectStore(STORE_PERFORMANCE);
      
      const ids = [];
      for (const measurement of measurements) {
        // サンプリング
        if (Math.random() <= PERFORMANCE_CONFIG.SAMPLING_RATE) {
          const id = await store.add(measurement);
          ids.push(id);
        }
      }
      
      await tx.done;
      
      // 自動クリーンアップ
      await this.cleanupOldMeasurements();
      
      return ids;
    } catch (error) {
      console.error('[PerformanceStorage] Error saving measurements:', error);
      throw error;
    }
  }

  /**
   * パフォーマンスデータを検索
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async searchMeasurements(filters = {}) {
    try {
      const db = await this.dbPromise;
      let measurements;
      
      // タイプフィルターがある場合はインデックスを使用
      if (filters.type) {
        const index = (await db.transaction(STORE_PERFORMANCE).objectStore(STORE_PERFORMANCE))
          .index(INDEX_NAMES.PERFORMANCE.TYPE);
        measurements = await index.getAll(filters.type);
      } else {
        measurements = await db.getAll(STORE_PERFORMANCE);
      }
      
      // その他のフィルターを適用
      measurements = this.applyFilters(measurements, filters);
      
      // ソート
      measurements.sort((a, b) => b.timestamp - a.timestamp);
      
      // ページネーション
      if (filters.limit) {
        const start = filters.offset || 0;
        measurements = measurements.slice(start, start + filters.limit);
      }
      
      return measurements;
    } catch (error) {
      console.error('[PerformanceStorage] Error searching measurements:', error);
      throw error;
    }
  }

  /**
   * フィルターを適用
   * @param {object[]} measurements
   * @param {object} filters
   * @returns {object[]}
   */
  applyFilters(measurements, filters) {
    let filtered = measurements;
    
    // 時間範囲フィルター
    if (filters.startTime) {
      filtered = filtered.filter(m => m.timestamp >= filters.startTime);
    }
    if (filters.endTime) {
      filtered = filtered.filter(m => m.timestamp <= filters.endTime);
    }
    
    // 実行時間フィルター（遅いクエリのみ）
    if (filters.slowOnly) {
      filtered = filtered.filter(m => {
        if (m.type === PERFORMANCE_CONFIG.TYPES.GLIDERECORD_QUERY) {
          return m.duration >= PERFORMANCE_CONFIG.SLOW_QUERY_THRESHOLD;
        } else if (m.type === PERFORMANCE_CONFIG.TYPES.FETCH || m.type === PERFORMANCE_CONFIG.TYPES.XHR) {
          return m.duration >= PERFORMANCE_CONFIG.SLOW_API_THRESHOLD;
        }
        return false;
      });
    }
    
    // 最小実行時間
    if (filters.minDuration) {
      filtered = filtered.filter(m => m.duration >= filters.minDuration);
    }
    
    // テーブルフィルター
    if (filters.table) {
      filtered = filtered.filter(m => m.context?.table === filters.table);
    }
    
    // URLフィルター
    if (filters.url) {
      filtered = filtered.filter(m => m.url?.includes(filters.url));
    }
    
    return filtered;
  }

  /**
   * 計測データを取得
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async getMeasurement(id) {
    try {
      const db = await this.dbPromise;
      return await db.get(STORE_PERFORMANCE, id);
    } catch (error) {
      console.error('[PerformanceStorage] Error getting measurement:', error);
      return null;
    }
  }

  /**
   * 計測データを削除
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteMeasurement(id) {
    try {
      const db = await this.dbPromise;
      await db.delete(STORE_PERFORMANCE, id);
      return true;
    } catch (error) {
      console.error('[PerformanceStorage] Error deleting measurement:', error);
      return false;
    }
  }

  /**
   * すべての計測データをクリア
   * @returns {Promise<boolean>}
   */
  async clearAllMeasurements() {
    try {
      const db = await this.dbPromise;
      await db.clear(STORE_PERFORMANCE);
      console.log('[PerformanceStorage] All measurements cleared');
      return true;
    } catch (error) {
      console.error('[PerformanceStorage] Error clearing measurements:', error);
      return false;
    }
  }

  /**
   * 古い計測データを自動削除
   * @returns {Promise<number>} 削除件数
   */
  async cleanupOldMeasurements() {
    try {
      const db = await this.dbPromise;
      const retentionMs = PERFORMANCE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionMs;
      
      const tx = db.transaction(STORE_PERFORMANCE, 'readwrite');
      const store = tx.objectStore(STORE_PERFORMANCE);
      const index = store.index(INDEX_NAMES.PERFORMANCE.TIMESTAMP);
      
      let deleteCount = 0;
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      for await (const cursor of index.iterate(range)) {
        cursor.delete();
        deleteCount++;
      }
      
      await tx.done;
      
      if (deleteCount > 0) {
        console.log(`[PerformanceStorage] Cleaned up ${deleteCount} old measurements`);
      }
      
      return deleteCount;
    } catch (error) {
      console.error('[PerformanceStorage] Error cleaning up measurements:', error);
      return 0;
    }
  }

  /**
   * パフォーマンス統計を取得
   * @param {object} filters
   * @returns {Promise<object>}
   */
  async getStats(filters = {}) {
    try {
      const measurements = await this.searchMeasurements(filters);
      
      const stats = {
        total: measurements.length,
        byType: {},
        slowQueries: 0,
        slowAPICalls: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        totalDuration: 0,
      };
      
      measurements.forEach(m => {
        // タイプ別カウント
        stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
        
        // 遅いクエリ/APIカウント
        if (m.type === PERFORMANCE_CONFIG.TYPES.GLIDERECORD_QUERY && 
            m.duration >= PERFORMANCE_CONFIG.SLOW_QUERY_THRESHOLD) {
          stats.slowQueries++;
        }
        if ((m.type === PERFORMANCE_CONFIG.TYPES.FETCH || m.type === PERFORMANCE_CONFIG.TYPES.XHR) &&
            m.duration >= PERFORMANCE_CONFIG.SLOW_API_THRESHOLD) {
          stats.slowAPICalls++;
        }
        
        // 実行時間の統計
        stats.totalDuration += m.duration;
        stats.maxDuration = Math.max(stats.maxDuration, m.duration);
        stats.minDuration = Math.min(stats.minDuration, m.duration);
      });
      
      if (measurements.length > 0) {
        stats.avgDuration = stats.totalDuration / measurements.length;
      }
      
      if (stats.minDuration === Infinity) {
        stats.minDuration = 0;
      }
      
      return stats;
    } catch (error) {
      console.error('[PerformanceStorage] Error getting stats:', error);
      return null;
    }
  }

  /**
   * 遅いクエリのトップNを取得
   * @param {number} limit
   * @returns {Promise<object[]>}
   */
  async getTopSlowQueries(limit = 10) {
    try {
      const measurements = await this.searchMeasurements({
        type: PERFORMANCE_CONFIG.TYPES.GLIDERECORD_QUERY,
      });
      
      // 実行時間でソート
      measurements.sort((a, b) => b.duration - a.duration);
      
      return measurements.slice(0, limit);
    } catch (error) {
      console.error('[PerformanceStorage] Error getting slow queries:', error);
      return [];
    }
  }

  /**
   * テーブル別のパフォーマンス統計
   * @returns {Promise<object>}
   */
  async getTableStats() {
    try {
      const measurements = await this.searchMeasurements({
        type: PERFORMANCE_CONFIG.TYPES.GLIDERECORD_QUERY,
      });
      
      const tableStats = {};
      
      measurements.forEach(m => {
        const table = m.context?.table;
        if (!table) return;
        
        if (!tableStats[table]) {
          tableStats[table] = {
            count: 0,
            totalDuration: 0,
            avgDuration: 0,
            maxDuration: 0,
            slowCount: 0,
          };
        }
        
        tableStats[table].count++;
        tableStats[table].totalDuration += m.duration;
        tableStats[table].maxDuration = Math.max(tableStats[table].maxDuration, m.duration);
        
        if (m.duration >= PERFORMANCE_CONFIG.SLOW_QUERY_THRESHOLD) {
          tableStats[table].slowCount++;
        }
      });
      
      // 平均を計算
      Object.keys(tableStats).forEach(table => {
        tableStats[table].avgDuration = tableStats[table].totalDuration / tableStats[table].count;
      });
      
      return tableStats;
    } catch (error) {
      console.error('[PerformanceStorage] Error getting table stats:', error);
      return {};
    }
  }

  /**
   * 時系列データを取得（チャート用）
   * @param {object} filters
   * @param {number} bucketSize - バケットサイズ（ミリ秒）
   * @returns {Promise<object[]>}
   */
  async getTimeSeriesData(filters = {}, bucketSize = 60000) {
    try {
      const measurements = await this.searchMeasurements(filters);
      
      if (measurements.length === 0) return [];
      
      // タイムスタンプの範囲を取得
      const minTimestamp = Math.min(...measurements.map(m => m.timestamp));
      const maxTimestamp = Math.max(...measurements.map(m => m.timestamp));
      
      // バケットを作成
      const buckets = [];
      for (let time = minTimestamp; time <= maxTimestamp; time += bucketSize) {
        buckets.push({
          timestamp: time,
          count: 0,
          avgDuration: 0,
          maxDuration: 0,
          totalDuration: 0,
        });
      }
      
      // データをバケットに振り分け
      measurements.forEach(m => {
        const bucketIndex = Math.floor((m.timestamp - minTimestamp) / bucketSize);
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].count++;
          buckets[bucketIndex].totalDuration += m.duration;
          buckets[bucketIndex].maxDuration = Math.max(buckets[bucketIndex].maxDuration, m.duration);
        }
      });
      
      // 平均を計算
      buckets.forEach(bucket => {
        if (bucket.count > 0) {
          bucket.avgDuration = bucket.totalDuration / bucket.count;
        }
      });
      
      return buckets;
    } catch (error) {
      console.error('[PerformanceStorage] Error getting time series data:', error);
      return [];
    }
  }

  /**
   * パフォーマンスデータをエクスポート
   * @param {string} format - 'json' | 'csv'
   * @param {object} filters
   * @returns {Promise<string>}
   */
  async exportMeasurements(format = 'json', filters = {}) {
    try {
      const measurements = await this.searchMeasurements(filters);
      
      if (format === 'json') {
        return JSON.stringify(measurements, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(measurements);
      }
      
      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error('[PerformanceStorage] Error exporting measurements:', error);
      throw error;
    }
  }

  /**
   * CSVに変換
   * @param {object[]} measurements
   * @returns {string}
   */
  convertToCSV(measurements) {
    const headers = [
      'ID',
      'Timestamp',
      'Type',
      'Duration (ms)',
      'URL',
      'Method',
      'Status',
      'Table',
      'Record Count',
    ];
    
    const rows = measurements.map(m => [
      m.id,
      new Date(m.timestamp).toISOString(),
      m.type,
      m.duration.toFixed(2),
      m.url || '',
      m.method || '',
      m.status || '',
      m.context?.table || '',
      m.context?.recordCount || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return csvContent;
  }
}

// シングルトンインスタンス
export const performanceStorage = new PerformanceStorage();