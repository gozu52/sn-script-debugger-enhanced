/**
 * パフォーマンスモニター
 * ページ全体のパフォーマンスを監視
 */

import { PERFORMANCE_CONFIG } from '../../shared/constants/config.js';

export class PerformanceMonitor {
  constructor() {
    this.enabled = true;
    this.observer = null;
    this.measurements = new Map();
  }

  /**
   * モニターを初期化
   */
  initialize() {
    // Performance Observer を設定
    this.setupPerformanceObserver();
    
    // ページロード時のメトリクスを収集
    this.collectPageLoadMetrics();
    
    // Navigation Timing API を監視
    this.monitorNavigationTiming();
    
    // Resource Timing API を監視
    this.monitorResourceTiming();
    
    console.log('[PerformanceMonitor] Initialized');
  }

  /**
   * Performance Observer を設定
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) {
      console.warn('[PerformanceMonitor] PerformanceObserver not supported');
      return;
    }

    try {
      // Long Tasks を監視
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLongTask(entry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Layout Shifts を監視
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLayoutShift(entry);
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

      // Largest Contentful Paint を監視
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.handleLCP(lastEntry);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay を監視
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleFID(entry);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      this.observer = {
        longTask: longTaskObserver,
        layoutShift: layoutShiftObserver,
        lcp: lcpObserver,
        fid: fidObserver,
      };

      console.log('[PerformanceMonitor] Performance observers set up');
    } catch (error) {
      console.error('[PerformanceMonitor] Error setting up observers:', error);
    }
  }

  /**
   * Long Task を処理
   */
  handleLongTask(entry) {
    if (entry.duration > 50) { // 50ms以上のタスク
      this.sendMeasurement({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'long_task',
        duration: entry.duration,
        startTime: entry.startTime,
        context: {
          name: entry.name,
          attribution: entry.attribution,
        },
      });

      // 非常に長いタスクを警告
      if (entry.duration > 200) {
        this.sendWarningLog({
          message: `Very long task detected: ${entry.duration.toFixed(2)}ms`,
          duration: entry.duration,
        });
      }
    }
  }

  /**
   * Layout Shift を処理
   */
  handleLayoutShift(entry) {
    if (entry.hadRecentInput) return; // ユーザー入力によるシフトは除外

    this.sendMeasurement({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'layout_shift',
      value: entry.value,
      startTime: entry.startTime,
      context: {
        hadRecentInput: entry.hadRecentInput,
      },
    });
  }

  /**
   * Largest Contentful Paint を処理
   */
  handleLCP(entry) {
    this.sendMeasurement({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'lcp',
      startTime: entry.startTime,
      renderTime: entry.renderTime,
      size: entry.size,
      context: {
        element: entry.element?.tagName,
        url: entry.url,
      },
    });

    // LCPが遅い場合は警告
    if (entry.startTime > 2500) {
      this.sendWarningLog({
        message: `Slow LCP: ${entry.startTime.toFixed(2)}ms`,
        lcp: entry.startTime,
      });
    }
  }

  /**
   * First Input Delay を処理
   */
  handleFID(entry) {
    const fid = entry.processingStart - entry.startTime;

    this.sendMeasurement({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'fid',
      duration: fid,
      startTime: entry.startTime,
      context: {
        name: entry.name,
      },
    });

    // FIDが長い場合は警告
    if (fid > 100) {
      this.sendWarningLog({
        message: `High First Input Delay: ${fid.toFixed(2)}ms`,
        fid: fid,
      });
    }
  }

  /**
   * ページロードメトリクスを収集
   */
  collectPageLoadMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        this.sendMeasurement({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'page_load',
          duration: navigation.loadEventEnd - navigation.fetchStart,
          context: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            responseTime: navigation.responseEnd - navigation.requestStart,
            transferSize: navigation.transferSize,
            encodedBodySize: navigation.encodedBodySize,
            decodedBodySize: navigation.decodedBodySize,
          },
        });
      }, 0);
    });
  }

  /**
   * Navigation Timing を監視
   */
  monitorNavigationTiming() {
    window.addEventListener('load', () => {
      const timing = performance.timing;
      
      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        processing: timing.domComplete - timing.domLoading,
        onload: timing.loadEventEnd - timing.loadEventStart,
      };

      this.sendMeasurement({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'navigation_timing',
        context: metrics,
      });
    });
  }

  /**
   * Resource Timing を監視
   */
  monitorResourceTiming() {
    // 定期的にリソースタイミングをチェック
    setInterval(() => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach(resource => {
        // 遅いリソースのみ記録
        if (resource.duration > 1000) {
          this.sendMeasurement({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'slow_resource',
            duration: resource.duration,
            url: resource.name,
            context: {
              initiatorType: resource.initiatorType,
              transferSize: resource.transferSize,
              encodedBodySize: resource.encodedBodySize,
            },
          });
        }
      });
      
      // メモリクリア
      performance.clearResourceTimings();
    }, 30000); // 30秒ごと
  }

  /**
   * メモリ使用量を監視
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;

    setInterval(() => {
      const memory = performance.memory;
      
      this.sendMeasurement({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'memory_usage',
        context: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        },
      });
    }, 60000); // 1分ごと
  }

  /**
   * 計測データを送信
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
          type: 'performance_warning',
          ...data,
        },
      },
    }, '*');
  }

  /**
   * モニターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[PerformanceMonitor] Enabled');
  }

  /**
   * モニターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[PerformanceMonitor] Disabled');
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.observer) {
      Object.values(this.observer).forEach(obs => obs.disconnect());
    }
    console.log('[PerformanceMonitor] Cleaned up');
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();