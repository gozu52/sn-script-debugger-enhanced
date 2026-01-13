/**
 * アプリケーション全体の設定値
 */

// ログ設定
export const LOG_CONFIG = {
  // 保持期間（ミリ秒）
  RETENTION_DAYS: 7,
  RETENTION_MS: 7 * 24 * 60 * 60 * 1000,
  
  // 最大保存件数
  MAX_LOGS: 10000,
  
  // バッチサイズ
  BATCH_SIZE: 100,
  
  // ログレベル
  LEVELS: {
    DEBUG: 'debug',
    LOG: 'log',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
  
  // デフォルトフィルター
  DEFAULT_FILTERS: {
    levels: ['log', 'info', 'warn', 'error'],
    keyword: '',
    table: '',
    startTime: null,
    endTime: null,
  },
};

// パフォーマンス設定
export const PERFORMANCE_CONFIG = {
  // 警告閾値（ミリ秒）
  SLOW_QUERY_THRESHOLD: 500,
  SLOW_API_THRESHOLD: 1000,
  
  // 保持期間
  RETENTION_DAYS: 7,
  
  // サンプリングレート（0.0 - 1.0）
  SAMPLING_RATE: 1.0, // 100%記録
  
  // 計測タイプ
  TYPES: {
    GLIDERECORD_QUERY: 'gliderecord_query',
    GLIDERECORD_INSERT: 'gliderecord_insert',
    GLIDERECORD_UPDATE: 'gliderecord_update',
    GLIDERECORD_DELETE: 'gliderecord_delete',
    FETCH: 'fetch',
    XHR: 'xhr',
    SCRIPT_EXECUTION: 'script_execution',
  },
};

// スニペット設定
export const SNIPPET_CONFIG = {
  // カテゴリ
  CATEGORIES: {
    GLIDERECORD: 'gliderecord',
    CLIENT_SCRIPT: 'client_script',
    UI_SCRIPT: 'ui_script',
    BUSINESS_RULE: 'business_rule',
    SCRIPT_INCLUDE: 'script_include',
    REST_API: 'rest_api',
    FLOW_DESIGNER: 'flow_designer',
    OTHER: 'other',
  },
  
  // デフォルトタグ
  DEFAULT_TAGS: [
    'common',
    'utility',
    'debugging',
    'performance',
    'security',
  ],
  
  // 最大サイズ
  MAX_CODE_SIZE: 50000, // 50KB
  MAX_SNIPPETS: 500,
};

// ServiceNow設定
export const SERVICENOW_CONFIG = {
  // 検出するドメインパターン
  DOMAIN_PATTERNS: [
    /https?:\/\/[^.]+\.service-now\.com/,
    /https?:\/\/[^.]+\.servicenow\.com/,
  ],
  
  // APIエンドポイント
  API_ENDPOINTS: {
    TABLE: '/api/now/table',
    ATTACHMENT: '/api/now/attachment',
    IMPORT: '/api/now/import',
  },
  
  // 既知のテーブル（クイックアクセス用）
  COMMON_TABLES: [
    'incident',
    'problem',
    'change_request',
    'task',
    'sys_user',
    'sys_user_group',
    'cmdb_ci',
    'cmdb_ci_server',
  ],
};

// UI設定
export const UI_CONFIG = {
  // テーマ
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
  
  // ポップアップサイズ
  POPUP: {
    WIDTH: 800,
    HEIGHT: 600,
  },
  
  // DevToolsパネルサイズ
  DEVTOOLS_PANEL: {
    MIN_WIDTH: 400,
    MIN_HEIGHT: 300,
  },
  
  // ページネーション
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    PAGE_SIZE_OPTIONS: [25, 50, 100, 200],
  },
  
  // タブ
  TABS: {
    LOGS: 'logs',
    QUERY_BUILDER: 'query_builder',
    SNIPPETS: 'snippets',
    PERFORMANCE: 'performance',
    SETTINGS: 'settings',
  },
};

// データマスキング設定
export const MASKING_CONFIG = {
  // センシティブフィールド（パターン）
  SENSITIVE_PATTERNS: [
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /auth/i,
    /ssn/i,
    /social[_-]?security/i,
    /credit[_-]?card/i,
    /cvv/i,
  ],
  
  // マスク文字
  MASK_CHAR: '*',
  MASK_LENGTH: 8,
  
  // 正規表現（値のマスキング）
  VALUE_PATTERNS: [
    // SSN: 123-45-6789
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' },
    // クレジットカード: 1234-5678-9012-3456
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '****-****-****-****' },
    // メールアドレス（部分的にマスク）
    { pattern: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '***@$2' },
  ],
};

// デバッグ設定（開発時のみ）
export const DEBUG_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'development',
  VERBOSE: false,
  LOG_PREFIX: '[SN Debugger]',
};

// バージョン情報
export const VERSION_INFO = {
  CURRENT: '1.0.0',
  MIN_SERVICENOW_VERSION: 'Tokyo',
  MIN_CHROME_VERSION: 88,
};