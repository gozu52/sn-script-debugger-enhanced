/**
 * イベントモニター
 * 重要なイベントを監視してログに記録
 */

export class EventMonitor {
  constructor() {
    this.enabled = true;
    this.listeners = [];
  }

  /**
   * モニターを初期化
   */
  initialize() {
    this.monitorPageNavigation();
    this.monitorFormSubmissions();
    this.monitorAjaxCalls();
    this.monitorUserInteractions();
    
    console.log('[EventMonitor] Initialized');
  }

  /**
   * ページナビゲーションを監視
   */
  monitorPageNavigation() {
    // ページ離脱
    window.addEventListener('beforeunload', (event) => {
      this.sendLog({
        level: 'info',
        message: 'Page unload',
        context: {
          type: 'navigation',
          action: 'beforeunload',
        },
      });
    });

    // History API の監視
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('replacestate'));
      return result;
    };

    ['pushstate', 'replacestate', 'popstate'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.sendLog({
          level: 'info',
          message: `Navigation: ${eventType}`,
          context: {
            type: 'navigation',
            action: eventType,
            url: window.location.href,
          },
        });
      });
    });
  }

  /**
   * フォーム送信を監視
   */
  monitorFormSubmissions() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formData = new FormData(form);
      const data = {};

      for (const [key, value] of formData.entries()) {
        // パスワードなどのセンシティブデータをマスク
        if (this.isSensitiveField(key)) {
          data[key] = '***';
        } else {
          data[key] = value;
        }
      }

      this.sendLog({
        level: 'info',
        message: 'Form submitted',
        context: {
          type: 'form_submit',
          formId: form.id,
          formName: form.name,
          action: form.action,
          method: form.method,
          fieldCount: formData.size,
        },
      });
    }, true);
  }

  /**
   * センシティブフィールドかチェック
   */
  isSensitiveField(fieldName) {
    const sensitivePatterns = [
      /password/i,
      /passwd/i,
      /pwd/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i,
      /credit[_-]?card/i,
      /ssn/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * AJAX呼び出しを監視（GlideAjax専用）
   */
  monitorAjaxCalls() {
    // GlideAjaxの監視は既にXHR Interceptorで行われているため、
    // ここでは追加のロジックのみ
    
    // ServiceNowのカスタムイベントを監視
    window.addEventListener('glideajax.complete', (event) => {
      this.sendLog({
        level: 'info',
        message: 'GlideAjax completed',
        context: {
          type: 'glideajax',
          detail: event.detail,
        },
      });
    });
  }

  /**
   * ユーザーインタラクションを監視
   */
  monitorUserInteractions() {
    // ボタンクリック
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // 重要なボタンのみログに記録
      if (target.matches('button, input[type="button"], input[type="submit"], .btn')) {
        const buttonText = target.textContent || target.value || target.title;
        
        this.sendLog({
          level: 'debug',
          message: `Button clicked: ${buttonText}`,
          context: {
            type: 'user_interaction',
            action: 'click',
            element: target.tagName,
            text: buttonText,
            id: target.id,
          },
        });
      }
    }, true);

    // 重要なキーイベント（保存のショートカットなど）
    document.addEventListener('keydown', (event) => {
      // Ctrl+S / Cmd+S （保存）
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        
        this.sendLog({
          level: 'info',
          message: 'Save shortcut triggered',
          context: {
            type: 'user_interaction',
            action: 'keyboard_shortcut',
            key: 'Ctrl/Cmd+S',
          },
        });
      }
    });
  }

  /**
   * ログを送信
   */
  sendLog(data) {
    if (!this.enabled) return;

    window.postMessage({
      type: 'SN_DEBUG_LOG',
      data: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: data.level,
        message: data.message,
        url: window.location.href,
        context: data.context,
      },
    }, '*');
  }

  /**
   * モニターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[EventMonitor] Enabled');
  }

  /**
   * モニターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[EventMonitor] Disabled');
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
    console.log('[EventMonitor] Cleaned up');
  }
}

// シングルトンインスタンス
export const eventMonitor = new EventMonitor();