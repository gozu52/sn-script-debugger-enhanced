/**
 * XMLHttpRequest インターセプター
 * XHR呼び出しをキャプチャしてパフォーマンスを計測
 */

import { PERFORMANCE_CONFIG } from '../../shared/constants/config.js';

export class XHRInterceptor {
  constructor() {
    this.enabled = true;
    this.originalOpen = XMLHttpRequest.prototype.open;
    this.originalSend = XMLHttpRequest.prototype.send;
  }

  /**
   * インターセプターを初期化
   */
  initialize() {
    const self = this;
    
    // open()をフック
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._snDebug = {
        method: method,
        url: url,
        startTime: null,
        measureId: `xhr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      return self.originalOpen.apply(this, [method, url, ...args]);
    };
    
    // send()をフック
    XMLHttpRequest.prototype.send = function(...args) {
      if (!self.enabled || !this._snDebug) {
        return self.originalSend.apply(this, args);
      }
      
      this._snDebug.startTime = performance.now();
      
      // loadendイベントを監視
      this.addEventListener('loadend', function() {
        const endTime = performance.now();
        const duration = endTime - this._snDebug.startTime;
        
        // パフォーマンスデータを送信
        self.sendMeasurement({
          id: this._snDebug.measureId,
          timestamp: Date.now(),
          type: PERFORMANCE_CONFIG.TYPES.XHR,
          duration: duration,
          url: this._snDebug.url,
          method: this._snDebug.method,
          status: this.status,
          statusText: this.statusText,
          responseType: this.responseType,
          context: self.extractContext(this._snDebug.url),
        });
        
        // 遅いAPIを警告
        if (duration >= PERFORMANCE_CONFIG.SLOW_API_THRESHOLD) {
          self.sendWarningLog({
            message: `Slow XHR call: ${duration.toFixed(2)}ms`,
            url: this._snDebug.url,
            method: this._snDebug.method,
            duration: duration,
          });
        }
        
        // エラーステータスをログに記録
        if (this.status >= 400) {
          self.sendErrorLog({
            message: `XHR error: ${this.status} ${this.statusText}`,
            url: this._snDebug.url,
            method: this._snDebug.method,
            status: this.status,
          });
        }
      });
      
      // errorイベントを監視
      this.addEventListener('error', function() {
        const endTime = performance.now();
        const duration = endTime - this._snDebug.startTime;
        
        self.sendMeasurement({
          id: this._snDebug.measureId,
          timestamp: Date.now(),
          type: PERFORMANCE_CONFIG.TYPES.XHR,
          duration: duration,
          url: this._snDebug.url,
          method: this._snDebug.method,
          status: 0,
          error: 'Network error',
          context: self.extractContext(this._snDebug.url),
        });
        
        self.sendErrorLog({
          message: `XHR network error`,
          url: this._snDebug.url,
          method: this._snDebug.method,
        });
      });
      
      // timeoutイベントを監視
      this.addEventListener('timeout', function() {
        const endTime = performance.now();
        const duration = endTime - this._snDebug.startTime;
        
        self.sendMeasurement({
          id: this._snDebug.measureId,
          timestamp: Date.now(),
          type: PERFORMANCE_CONFIG.TYPES.XHR,
          duration: duration,
          url: this._snDebug.url,
          method: this._snDebug.method,
          status: 0,
          error: 'Timeout',
          context: self.extractContext(this._snDebug.url),
        });
        
        self.sendErrorLog({
          message: `XHR timeout`,
          url: this._snDebug.url,
          method: this._snDebug.method,
        });
      });
      
      return self.originalSend.apply(this, args);
    };
    
    console.log('[XHRInterceptor] XMLHttpRequest hooked');
  }

  /**
   * URLからコンテキストを抽出
   */
  extractContext(url) {
    const context = {};
    
    // ServiceNow APIのパターンを検出
    const tableApiMatch = url.match(/\/api\/now\/table\/([^/?]+)/);
    if (tableApiMatch) {
      context.table = tableApiMatch[1];
      context.apiType = 'table_api';
    }
    
    // GlideAjaxの検出
    if (url.includes('xmlhttp.do')) {
      context.apiType = 'glide_ajax';
      
      // sysparm_nameからScript Include名を抽出
      const nameMatch = url.match(/sysparm_name=([^&]+)/);
      if (nameMatch) {
        context.scriptInclude = decodeURIComponent(nameMatch[1]);
      }
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
          method: data.method,
          duration: data.duration,
          type: 'slow_xhr',
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
          method: data.method,
          status: data.status,
          type: 'xhr_error',
        },
      },
    }, '*');
  }

  /**
   * インターセプターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[XHRInterceptor] Enabled');
  }

  /**
   * インターセプターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[XHRInterceptor] Disabled');
  }

  /**
   * クリーンアップ（オリジナルのメソッドを復元）
   */
  cleanup() {
    XMLHttpRequest.prototype.open = this.originalOpen;
    XMLHttpRequest.prototype.send = this.originalSend;
    console.log('[XHRInterceptor] Cleaned up, XHR restored');
  }
}

// シングルトンインスタンス
export const xhrInterceptor = new XHRInterceptor();