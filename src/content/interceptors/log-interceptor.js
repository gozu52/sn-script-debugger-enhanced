/**
 * ServiceNow gs.log() インターセプター
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types.js';

export class LogInterceptor {
  constructor() {
    this.enabled = true;
    this.originalMethods = {};
    this.sessionId = this.generateSessionId();
  }

  /**
   * セッションIDを生成
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * インターセプターを初期化
   */
  initialize() {
    // inject.jsで既にフックされているため、ここでは追加の処理のみ
    console.log('[LogInterceptor] Initialized');
  }

  /**
   * ログエントリを作成
   */
  createLogEntry(level, args, context = {}) {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      stackTrace: new Error().stack,
      url: window.location.href,
      context: {
        ...this.getCurrentContext(),
        ...context,
      },
    };
  }

  /**
   * 現在のコンテキストを取得
   */
  getCurrentContext() {
    return {
      table: this.getCurrentTable(),
      recordId: this.getCurrentRecordId(),
      user: this.getCurrentUser(),
      sessionId: this.sessionId,
    };
  }

  /**
   * 現在のテーブル名を取得
   */
  getCurrentTable() {
    const tableInput = document.querySelector('input[name="sys_target_table"]');
    return tableInput?.value || null;
  }

  /**
   * 現在のレコードIDを取得
   */
  getCurrentRecordId() {
    const sysIdInput = document.querySelector('input[name="sys_id"]');
    return sysIdInput?.value || null;
  }

  /**
   * 現在のユーザー名を取得
   */
  getCurrentUser() {
    return window.g_user?.userName || null;
  }

  /**
   * インターセプターを有効化
   */
  enable() {
    this.enabled = true;
    console.log('[LogInterceptor] Enabled');
  }

  /**
   * インターセプターを無効化
   */
  disable() {
    this.enabled = false;
    console.log('[LogInterceptor] Disabled');
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    // 必要に応じてクリーンアップ処理
    console.log('[LogInterceptor] Cleaned up');
  }
}

// シングルトンインスタンス
export const logInterceptor = new LogInterceptor();