/**
 * コンテキストヘルパー
 * ServiceNowページから現在のコンテキスト情報を抽出
 */

export class ContextHelper {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5秒
  }

  /**
   * 現在のテーブル名を取得
   * @returns {string|null}
   */
  getCurrentTable() {
    return this.getCached('table', () => {
      // 方法1: フォームのhidden input
      const tableInput = document.querySelector('input[name="sys_target_table"]');
      if (tableInput?.value) {
        return tableInput.value;
      }

      // 方法2: URLから抽出
      const urlMatch = window.location.pathname.match(/\/([^/]+)\.do/);
      if (urlMatch) {
        return urlMatch[1];
      }

      // 方法3: List view
      const listTable = document.querySelector('[data-list-table]');
      if (listTable) {
        return listTable.getAttribute('data-list-table');
      }

      return null;
    });
  }

  /**
   * 現在のレコードIDを取得
   * @returns {string|null}
   */
  getCurrentRecordId() {
    return this.getCached('recordId', () => {
      // 方法1: フォームのhidden input
      const sysIdInput = document.querySelector('input[name="sys_id"]');
      if (sysIdInput?.value && sysIdInput.value !== '-1') {
        return sysIdInput.value;
      }

      // 方法2: URLパラメータ
      const urlParams = new URLSearchParams(window.location.search);
      const sysId = urlParams.get('sys_id');
      if (sysId && sysId !== '-1') {
        return sysId;
      }

      return null;
    });
  }

  /**
   * 現在のユーザー情報を取得
   * @returns {object|null}
   */
  getCurrentUser() {
    return this.getCached('user', () => {
      if (window.g_user) {
        return {
          userName: window.g_user.userName,
          userID: window.g_user.userID,
          firstName: window.g_user.firstName,
          lastName: window.g_user.lastName,
          email: window.g_user.email,
          roles: window.g_user.roles,
        };
      }
      return null;
    });
  }

  /**
   * 現在のビュー名を取得
   * @returns {string|null}
   */
  getCurrentView() {
    return this.getCached('view', () => {
      const viewInput = document.querySelector('input[name="sysparm_view"]');
      if (viewInput?.value) {
        return viewInput.value;
      }

      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('sysparm_view') || 'default';
    });
  }

  /**
   * 現在のアプリケーションスコープを取得
   * @returns {string|null}
   */
  getCurrentScope() {
    return this.getCached('scope', () => {
      // Application Picker から取得
      const scopeElement = document.querySelector('[data-current-scope]');
      if (scopeElement) {
        return scopeElement.getAttribute('data-current-scope');
      }

      // グローバル変数から取得
      if (window.NOW?.context?.appScope) {
        return window.NOW.context.appScope;
      }

      return 'global';
    });
  }

  /**
   * ページタイプを取得
   * @returns {string}
   */
  getPageType() {
    return this.getCached('pageType', () => {
      const path = window.location.pathname;

      if (path.includes('_list.do')) {
        return 'list';
      } else if (path.includes('.do') && this.getCurrentRecordId()) {
        return 'form';
      } else if (path.includes('sp?')) {
        return 'service_portal';
      } else if (path.includes('nav_to.do')) {
        return 'navigation';
      } else if (path.includes('sys_ui_page.do')) {
        return 'ui_page';
      } else if (path.includes('$pa_dashboard.do')) {
        return 'dashboard';
      }

      return 'unknown';
    });
  }

  /**
   * Service Portalのページ情報を取得
   * @returns {object|null}
   */
  getServicePortalInfo() {
    return this.getCached('spInfo', () => {
      if (!window.location.pathname.includes('sp')) {
        return null;
      }

      const urlParams = new URLSearchParams(window.location.search);

      return {
        portal: urlParams.get('id') || 'sp',
        page: urlParams.get('page'),
        table: urlParams.get('table'),
        sysId: urlParams.get('sys_id'),
      };
    });
  }

  /**
   * レコードの表示値を取得
   * @returns {string|null}
   */
  getRecordDisplayValue() {
    return this.getCached('displayValue', () => {
      // フォームのタイトル
      const titleElement = document.querySelector('.form-title, [data-title]');
      if (titleElement) {
        return titleElement.textContent.trim();
      }

      // Number フィールド
      const numberInput = document.querySelector('input[name="number"]');
      if (numberInput?.value) {
        return numberInput.value;
      }

      return null;
    });
  }

  /**
   * セッション情報を取得
   * @returns {object}
   */
  getSessionInfo() {
    return {
      sessionId: window.g_ck || null,
      hasSession: typeof window.g_ck !== 'undefined',
      language: window.g_user?.language || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * インスタンス情報を取得
   * @returns {object}
   */
  getInstanceInfo() {
    return {
      url: window.location.origin,
      hostname: window.location.hostname,
      instanceName: window.location.hostname.split('.')[0],
      environment: this.getEnvironmentType(),
    };
  }

  /**
   * 環境タイプを判定
   * @returns {string}
   */
  getEnvironmentType() {
    const hostname = window.location.hostname;

    if (hostname.includes('dev')) return 'development';
    if (hostname.includes('test')) return 'test';
    if (hostname.includes('uat')) return 'uat';
    if (hostname.includes('stage')) return 'staging';
    if (hostname.includes('prod')) return 'production';

    return 'unknown';
  }

  /**
   * すべてのコンテキスト情報を取得
   * @returns {object}
   */
  getAllContext() {
    return {
      table: this.getCurrentTable(),
      recordId: this.getCurrentRecordId(),
      displayValue: this.getRecordDisplayValue(),
      view: this.getCurrentView(),
      scope: this.getCurrentScope(),
      pageType: this.getPageType(),
      user: this.getCurrentUser(),
      session: this.getSessionInfo(),
      instance: this.getInstanceInfo(),
      servicePortal: this.getServicePortalInfo(),
      timestamp: Date.now(),
    };
  }

  /**
   * キャッシュから取得（キャッシュがなければ計算）
   * @param {string} key
   * @param {Function} calculator
   * @returns {any}
   */
  getCached(key, calculator) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    const value = calculator();
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    return value;
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 特定のキャッシュを削除
   * @param {string} key
   */
  invalidateCache(key) {
    this.cache.delete(key);
  }
}

// シングルトンインスタンス
export const contextHelper = new ContextHelper();