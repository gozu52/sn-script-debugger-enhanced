/**
 * Fetch API インターセプター
 * REST API呼び出しをキャプチャしてパフォーマンスを計測
 */

import { PERFORMANCE_CONFIG } from '../../shared/constants/config.js';

export class FetchInterceptor {
  constructor() {
    this.enabled = true;
    this.originalFetch = window.fetch;
  }

  /**
   * インターセプターを初期化
   */
  initialize() {
    const self = this;
    
    window.fetch = async function(...args) {
      if (!self.enabled) {
        return self.originalFetch.apply(this, args);
      }
      
      const [url, options = {}] = args;
      const startTime = performance.now();
      const measureId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const response = await self.originalFetch.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // パフォーマンスデータを送信
        self.sendMeasurement({
          id: measureId,
          timestamp: Date.now(),
          type: PERFORMANCE_CONFIG.TYPES.FETCH,
          duration: duration,
          url: typeof url === 'string' ? url : url.url,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          context: self.extractContext(url),
        });
        
        // 遅いAPIを警告
        if (duration >= PERFORMANCE_CONFIG.SLOW_API_THRESHOLD) {
          self.sendWarningLog({
            message: `Slow Fetch API call: ${duration.toFixed(2)}ms`,
            url: typeof url === 'string' ? url : url.url,
            duration: duration,
          });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // エラーを記録
        self.sendMeasurement({
          id: measureId,
          timestamp: Date.now(),
          type: PERFORMANCE_CONFIG.TYPES.FETCH,
          duration: duration,
          url: typeof url === 'string' ? url : url.url,
          method: options.method || 'GET',
          status: 0,
          error: error.message,
          context: self.extractContext(url),
        });
        
        self.sendErrorLog({
          message: `Fetch API error: ${error.message}`,
          url: typeof url === 'string' ? url : url.url,
          error: error.message,
        });
        
        throw error;
      }
    };
    
    console.log('[FetchInterceptor] Fetch API hooked');
  }

  /**
   * URLからコンテキストを抽出
   */
  extractContext(url) {
    const urlString = typeof url === 'string' ? url : url.url;
    const context = {};
    
    // ServiceNow APIのパターンを検出
    const tableApiMatch = urlString.match(/\/api\/now\/table\/([^/?]+)/);
    if (tableApiMatch) {
      context.table = tableApiMatch[1];
      context.apiType = 'table_api';
    }
    
    const attachmentApiMatch = urlString.match(/\/api\/now\/attachment/);
    if (attachmentApiMatch) {
      context.apiType = 'attachment_api';
    }
    
    return context;
  }

  /**
   * パフォーマンス計測データを送信
   */
  sendMeasurement(data) {
    window.postMessage({
      type: 'SN_DEBUG_PERFORMANCE',
      data: data,
    }, '*');
  }

  /**
   * 警告ログを送信
   */
  sendWarningLog(data) {
    window.postMessage({
      type: 'SN_DEBUG_LOG',
      data: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'warn',
        message: data.message,
        context: {
          url: data.url,
          duration: data.duration,
          type: 'slow_fetch',
        },
      },
    }, '*');
  }

  /**
   * エラーログを送信
   */
  sendErrorLog(data) {
    window.postMessage({
      type: 'SN_DEBUG_LOG',
      data: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'error',
        message: data.message,
        context: {
          url: data.url,
          error: data.error,
          type: 'fetch_error',
        },
      },
    }, '*');
  }

  /**
   * インターセプターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[FetchInterceptor] Enabled');
  }

  /**
   * インターセプターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[FetchInterceptor] Disabled');
  }

  /**
   * クリーンアップ（オリジナルのfetchを復元）
   */
  cleanup() {
    window.fetch = this.originalFetch;
    console.log('[FetchInterceptor] Cleaned up, fetch restored');
  }
}

// シングルトンインスタンス
export const fetchInterceptor = new FetchInterceptor();