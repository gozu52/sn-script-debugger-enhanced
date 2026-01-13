/**
 * IndexedDBのスキーマ定義
 */

import {
  DB_NAME,
  DB_VERSION,
  STORE_LOGS,
  STORE_SNIPPETS,
  STORE_PERFORMANCE,
  STORE_SETTINGS,
  INDEX_NAMES,
} from '../constants/storage-keys.js';

/**
 * データベーススキーマ定義
 */
export const DB_SCHEMA = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: {
    // ログストア
    [STORE_LOGS]: {
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        {
          name: INDEX_NAMES.LOGS.TIMESTAMP,
          keyPath: 'timestamp',
          unique: false,
        },
        {
          name: INDEX_NAMES.LOGS.LEVEL,
          keyPath: 'level',
          unique: false,
        },
        {
          name: INDEX_NAMES.LOGS.TABLE,
          keyPath: 'context.table',
          unique: false,
        },
      ],
    },
    
    // スニペットストア
    [STORE_SNIPPETS]: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        {
          name: INDEX_NAMES.SNIPPETS.TAGS,
          keyPath: 'tags',
          unique: false,
          multiEntry: true, // 配列の各要素をインデックス化
        },
        {
          name: INDEX_NAMES.SNIPPETS.CATEGORY,
          keyPath: 'category',
          unique: false,
        },
        {
          name: INDEX_NAMES.SNIPPETS.CREATED,
          keyPath: 'created',
          unique: false,
        },
      ],
    },
    
    // パフォーマンスストア
    [STORE_PERFORMANCE]: {
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        {
          name: INDEX_NAMES.PERFORMANCE.TIMESTAMP,
          keyPath: 'timestamp',
          unique: false,
        },
        {
          name: INDEX_NAMES.PERFORMANCE.TYPE,
          keyPath: 'type',
          unique: false,
        },
        {
          name: INDEX_NAMES.PERFORMANCE.DURATION,
          keyPath: 'duration',
          unique: false,
        },
      ],
    },
    
    // 設定ストア
    [STORE_SETTINGS]: {
      keyPath: 'key',
      autoIncrement: false,
      indexes: [],
    },
  },
};

/**
 * ログエントリのスキーマ
 */
export const LOG_ENTRY_SCHEMA = {
  id: 'string', // UUID
  timestamp: 'number',
  level: 'string', // 'log' | 'info' | 'warn' | 'error' | 'debug'
  message: 'string',
  stackTrace: 'string',
  url: 'string',
  context: {
    table: 'string',
    recordId: 'string',
    user: 'string',
    sessionId: 'string',
  },
};

/**
 * スニペットエントリのスキーマ
 */
export const SNIPPET_ENTRY_SCHEMA = {
  id: 'number', // autoIncrement
  title: 'string',
  description: 'string',
  code: 'string',
  category: 'string',
  tags: 'array', // string[]
  created: 'number',
  updated: 'number',
  language: 'string', // 'javascript' | 'html' | 'css'
  isFavorite: 'boolean',
};

/**
 * パフォーマンスエントリのスキーマ
 */
export const PERFORMANCE_ENTRY_SCHEMA = {
  id: 'string', // UUID
  timestamp: 'number',
  type: 'string', // 'gliderecord_query' | 'fetch' | 'xhr' etc.
  duration: 'number',
  url: 'string',
  method: 'string',
  status: 'number',
  context: {
    table: 'string',
    query: 'string',
    recordCount: 'number',
  },
  stackTrace: 'string',
};

/**
 * 設定エントリのスキーマ
 */
export const SETTINGS_ENTRY_SCHEMA = {
  key: 'string',
  value: 'any',
  updated: 'number',
};