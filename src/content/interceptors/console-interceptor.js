/**
 * Console インターセプター
 * console.log/error/warn等をキャプチャ
 */

export class ConsoleInterceptor {
  constructor() {
    this.enabled = true;
    this.originalMethods = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  /**
   * インターセプターを初期化
   */
  initialize() {
    const self = this;
    
    // 各consoleメソッドをフック
    ['log', 'error', 'warn', 'info', 'debug'].forEach(level => {
      console[level] = function(...args) {
        if (self.enabled) {
          self.captureConsoleLog(level, args);
        }
        
        // オリジナルのメソッドも実行
        return self.originalMethods[level].apply(console, args);
      };
    });
    
    console.log('[ConsoleInterceptor] Console methods hooked');
  }

  /**
   * コンソールログをキャプチャ
   */
  captureConsoleLog(level, args) {
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: level,
      message: this.formatArgs(args),
      stackTrace: this.getStackTrace(),
      url: window.location.href,
      context: {
        source: 'console',
        user: window.g_user?.userName || null,
      },
    };
    
    window.postMessage({
      type: 'SN_DEBUG_CONSOLE',
      data: logEntry,
    }, '*');
  }

  /**
   * 引数をフォーマット
   */
  formatArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, this.getCircularReplacer(), 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * 循環参照を処理するreplacer
   */
  getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  /**
   * スタックトレースを取得
   */
  getStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      // 最初の3行（Error自身とこの関数）をスキップ
      return e.stack.split('\n').slice(3).join('\n');
    }
  }

  /**
   * インターセプターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[ConsoleInterceptor] Enabled');
  }

  /**
   * インターセプターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[ConsoleInterceptor] Disabled');
  }

  /**
   * クリーンアップ（オリジナルのメソッドを復元）
   */
  cleanup() {
    Object.keys(this.originalMethods).forEach(method => {
      console[method] = this.originalMethods[method];
    });
    console.log('[ConsoleInterceptor] Cleaned up, console restored');
  }
}

// シングルトンインスタンス
export const consoleInterceptor = new ConsoleInterceptor();