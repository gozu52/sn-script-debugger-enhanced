/**
 * コンテキストヘルパー
 * ServiceNowページから現在のコンテキスト情報を抽出
 * Classic UI と Modern UI (Polaris) の両方に対応
 */

export class ContextHelper {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000;
  }

  /**
   * 現在のユーザー情報を取得
   * @returns {object|null}
   */
  getCurrentUser() {
    return this.getCached('user', () => {
      // Modern UI (Polaris/Next Experience)
      if (window.NOW && window.NOW.user) {
        return {
          userName: window.NOW.user.userName || null,
          userID: window.NOW.user.userID || null,
          firstName: window.NOW.user.firstName || null,
          lastName: window.NOW.user.lastName || null,
          email: window.NOW.user.email || null,
          roles: window.NOW.user.roles || [],
        };
      }
      
      // Classic UI
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

      // 方法4: Modern UI
      if (window.NOW && window.NOW.context && window.NOW.context.table) {
        return window.NOW.context.table;
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
   * セッション情報を取得
   * @returns {object}
   */
  getSessionInfo() {
    // Classic UI
    if (window.g_ck) {
      return {
        sessionId: window.g_ck,
        hasSession: true,
        language: window.g_user?.language || navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    // Modern UI
    return {
      sessionId: window.NOW?.session?.token || null,
      hasSession: !!(window.NOW?.user),
      language: window.NOW?.user?.language || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * すべてのコンテキスト情報を取得
   * @returns {object}
   */
  getAllContext() {
    return {
      table: this.getCurrentTable(),
      recordId: this.getCurrentRecordId(),
      user: this.getCurrentUser(),
      session: this.getSessionInfo(),
      timestamp: Date.now(),
    };
  }

  /**
   * キャッシュから取得
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

  clearCache() {
    this.cache.clear();
  }
}

export const contextHelper = new ContextHelper();