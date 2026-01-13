/**
 * DOMモニター
 * DOM変更を監視してエラーや重要なイベントを検出
 */

export class DOMMonitor {
  constructor() {
    this.enabled = true;
    this.observer = null;
    this.errorMessageSelectors = [
      '.outputmsg_error',
      '.notification-error',
      '[role="alert"]',
      '.sn-alert-error',
    ];
  }

  /**
   * モニターを初期化
   */
  initialize() {
    this.setupMutationObserver();
    this.monitorErrorMessages();
    this.monitorFormValidation();
    this.monitorModalDialogs();
    
    console.log('[DOMMonitor] Initialized');
  }

  /**
   * Mutation Observerを設定
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;

      mutations.forEach((mutation) => {
        this.handleMutation(mutation);
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden'],
    });

    console.log('[DOMMonitor] Mutation observer started');
  }

  /**
   * Mutationを処理
   */
  handleMutation(mutation) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          this.checkForErrorMessages(node);
          this.checkForNotifications(node);
        }
      });
    }
  }

  /**
   * エラーメッセージを監視
   */
  monitorErrorMessages() {
    // 既存のエラーメッセージをチェック
    this.errorMessageSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.handleErrorMessage(element);
      });
    });
  }

  /**
   * エラーメッセージをチェック
   */
  checkForErrorMessages(node) {
    this.errorMessageSelectors.forEach(selector => {
      if (node.matches && node.matches(selector)) {
        this.handleErrorMessage(node);
      }

      const children = node.querySelectorAll?.(selector);
      children?.forEach(child => {
        this.handleErrorMessage(child);
      });
    });
  }

  /**
   * エラーメッセージを処理
   */
  handleErrorMessage(element) {
    const message = element.textContent.trim();
    if (!message) return;

    this.sendLog({
      level: 'error',
      message: `UI Error: ${message}`,
      context: {
        type: 'ui_error',
        selector: this.getElementSelector(element),
        html: element.outerHTML.substring(0, 500),
      },
    });
  }

  /**
   * 通知をチェック
   */
  checkForNotifications(node) {
    const notificationSelectors = [
      '.notification-success',
      '.notification-info',
      '.notification-warning',
    ];

    notificationSelectors.forEach(selector => {
      if (node.matches && node.matches(selector)) {
        this.handleNotification(node);
      }
    });
  }

  /**
   * 通知を処理
   */
  handleNotification(element) {
    const message = element.textContent.trim();
    const level = element.classList.contains('notification-error') ? 'error' :
                  element.classList.contains('notification-warning') ? 'warn' : 'info';

    this.sendLog({
      level: level,
      message: `Notification: ${message}`,
      context: {
        type: 'notification',
        selector: this.getElementSelector(element),
      },
    });
  }

  /**
   * フォームバリデーションを監視
   */
  monitorFormValidation() {
    document.addEventListener('invalid', (event) => {
      const element = event.target;
      const message = element.validationMessage;

      this.sendLog({
        level: 'warn',
        message: `Form validation error: ${message}`,
        context: {
          type: 'form_validation',
          field: element.name || element.id,
          value: element.value,
          selector: this.getElementSelector(element),
        },
      });
    }, true);
  }

  /**
   * モーダルダイアログを監視
   */
  monitorModalDialogs() {
    const modalSelectors = [
      '.modal',
      '[role="dialog"]',
      '.sn-modal',
    ];

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            modalSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                this.handleModalOpen(node);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * モーダルオープンを処理
   */
  handleModalOpen(element) {
    const title = element.querySelector('.modal-title, .sn-modal-title')?.textContent;

    this.sendLog({
      level: 'info',
      message: `Modal opened: ${title || 'Untitled'}`,
      context: {
        type: 'modal_open',
        title: title,
      },
    });
  }

  /**
   * 要素のセレクターを取得
   */
  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = Array.from(element.classList).slice(0, 3).join('.');
      return `.${classes}`;
    }

    return element.tagName.toLowerCase();
  }

  /**
   * ログを送信
   */
  sendLog(data) {
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
    console.log('[DOMMonitor] Enabled');
  }

  /**
   * モニターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[DOMMonitor] Disabled');
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    console.log('[DOMMonitor] Cleaned up');
  }
}

// シングルトンインスタンス
export const domMonitor = new DOMMonitor();