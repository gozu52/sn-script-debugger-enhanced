/**
 * GlideRecord インターセプター
 * GlideRecordのクエリをキャプチャしてパフォーマンスを計測
 */

import { PERFORMANCE_CONFIG } from '../../shared/constants/config.js';

export class GlideRecordInterceptor {
  constructor() {
    this.enabled = true;
    this.measurements = new Map();
  }

  /**
   * インターセプターを初期化
   * inject.jsにコードを注入してGlideRecordをフック
   */
  initialize() {
    const code = `
      (function() {
        if (!window.GlideRecord) {
          console.warn('[GlideRecordInterceptor] GlideRecord not found');
          return;
        }
        
        const originalQuery = window.GlideRecord.prototype.query;
        const originalInsert = window.GlideRecord.prototype.insert;
        const originalUpdate = window.GlideRecord.prototype.update;
        const originalDeleteRecord = window.GlideRecord.prototype.deleteRecord;
        
        // query() をフック
        window.GlideRecord.prototype.query = function(...args) {
          const tableName = this.getTableName();
          const startTime = performance.now();
          const measureId = 'gr_query_' + Date.now() + '_' + Math.random();
          
          // クエリ条件を取得（可能な場合）
          let queryConditions = '';
          try {
            queryConditions = this.getEncodedQuery() || '';
          } catch (e) {
            queryConditions = 'unknown';
          }
          
          const result = originalQuery.apply(this, args);
          
          // 非同期でパフォーマンスデータを送信
          setTimeout(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            window.postMessage({
              type: 'SN_DEBUG_PERFORMANCE',
              data: {
                id: measureId,
                timestamp: Date.now(),
                type: '${PERFORMANCE_CONFIG.TYPES.GLIDERECORD_QUERY}',
                duration: duration,
                context: {
                  table: tableName,
                  query: queryConditions,
                  recordCount: this.getRowCount(),
                },
                stackTrace: new Error().stack,
              }
            }, '*');
          }, 0);
          
          return result;
        };
        
        // insert() をフック
        window.GlideRecord.prototype.insert = function(...args) {
          const tableName = this.getTableName();
          const startTime = performance.now();
          const measureId = 'gr_insert_' + Date.now() + '_' + Math.random();
          
          const result = originalInsert.apply(this, args);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          window.postMessage({
            type: 'SN_DEBUG_PERFORMANCE',
            data: {
              id: measureId,
              timestamp: Date.now(),
              type: '${PERFORMANCE_CONFIG.TYPES.GLIDERECORD_INSERT}',
              duration: duration,
              context: {
                table: tableName,
                recordId: result,
              },
              stackTrace: new Error().stack,
            }
          }, '*');
          
          return result;
        };
        
        // update() をフック
        window.GlideRecord.prototype.update = function(...args) {
          const tableName = this.getTableName();
          const startTime = performance.now();
          const measureId = 'gr_update_' + Date.now() + '_' + Math.random();
          
          const result = originalUpdate.apply(this, args);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          window.postMessage({
            type: 'SN_DEBUG_PERFORMANCE',
            data: {
              id: measureId,
              timestamp: Date.now(),
              type: '${PERFORMANCE_CONFIG.TYPES.GLIDERECORD_UPDATE}',
              duration: duration,
              context: {
                table: tableName,
                recordId: this.getUniqueValue(),
              },
              stackTrace: new Error().stack,
            }
          }, '*');
          
          return result;
        };
        
        // deleteRecord() をフック
        window.GlideRecord.prototype.deleteRecord = function(...args) {
          const tableName = this.getTableName();
          const recordId = this.getUniqueValue();
          const startTime = performance.now();
          const measureId = 'gr_delete_' + Date.now() + '_' + Math.random();
          
          const result = originalDeleteRecord.apply(this, args);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          window.postMessage({
            type: 'SN_DEBUG_PERFORMANCE',
            data: {
              id: measureId,
              timestamp: Date.now(),
              type: '${PERFORMANCE_CONFIG.TYPES.GLIDERECORD_DELETE}',
              duration: duration,
              context: {
                table: tableName,
                recordId: recordId,
              },
              stackTrace: new Error().stack,
            }
          }, '*');
          
          // 削除操作を警告ログに記録
          window.postMessage({
            type: 'SN_DEBUG_LOG',
            data: {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              level: 'warn',
              message: 'Record deleted: ' + tableName + ' [' + recordId + ']',
              context: {
                table: tableName,
                recordId: recordId,
                operation: 'delete',
              },
            }
          }, '*');
          
          return result;
        };
        
        console.log('[GlideRecordInterceptor] GlideRecord methods hooked');
      })();
    `;
    
    this.injectCode(code);
  }

  /**
   * コードをページに注入
   */
  injectCode(code) {
    const script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  /**
   * インターセプターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[GlideRecordInterceptor] Enabled');
  }

  /**
   * インターセプターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[GlideRecordInterceptor] Disabled');
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.measurements.clear();
    console.log('[GlideRecordInterceptor] Cleaned up');
  }
}

// シングルトンインスタンス
export const glideRecordInterceptor = new GlideRecordInterceptor();