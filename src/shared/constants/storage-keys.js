/**
 * IndexedDBとChrome Storageで使用するキー定義
 */

// IndexedDB
export const DB_NAME = 'SNDebuggerDB';
export const DB_VERSION = 1;

// Object Stores
export const STORE_LOGS = 'logs';
export const STORE_SNIPPETS = 'snippets';
export const STORE_PERFORMANCE = 'performance';
export const STORE_SETTINGS = 'settings';

// Chrome Storage Keys
export const STORAGE_KEYS = {
  // 設定
  SETTINGS: 'sn_debugger_settings',
  USER_PREFERENCES: 'sn_debugger_user_preferences',
  
  // フィルター設定
  LOG_FILTERS: 'sn_debugger_log_filters',
  
  // 最終同期時刻
  LAST_SYNC: 'sn_debugger_last_sync',
  
  // 拡張機能の状態
  IS_ENABLED: 'sn_debugger_is_enabled',
  
  // ServiceNowインスタンス情報
  INSTANCE_INFO: 'sn_debugger_instance_info',
};

// インデックス名
export const INDEX_NAMES = {
  LOGS: {
    TIMESTAMP: 'timestamp',
    LEVEL: 'level',
    TABLE: 'table',
  },
  SNIPPETS: {
    TAGS: 'tags',
    CATEGORY: 'category',
    CREATED: 'created',
  },
  PERFORMANCE: {
    TIMESTAMP: 'timestamp',
    TYPE: 'type',
    DURATION: 'duration',
  },
};