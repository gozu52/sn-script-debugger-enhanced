/**
 * データベースマイグレーション
 */

import { DB_SCHEMA } from './db-schema.js';

/**
 * データベースをアップグレード
 * @param {IDBDatabase} db
 * @param {number} oldVersion
 * @param {number} newVersion
 * @param {IDBTransaction} transaction
 */
export function migrateDatabase(db, oldVersion, newVersion, transaction) {
  console.log(`[DB Migration] Upgrading from version ${oldVersion} to ${newVersion}`);
  
  // バージョン0（初回作成）→1
  if (oldVersion < 1) {
    createInitialSchema(db);
  }
  
  // 将来のマイグレーション用
  // if (oldVersion < 2) {
  //   migrateV1ToV2(db, transaction);
  // }
}

/**
 * 初期スキーマを作成
 * @param {IDBDatabase} db
 */
function createInitialSchema(db) {
  console.log('[DB Migration] Creating initial schema');
  
  Object.entries(DB_SCHEMA.stores).forEach(([storeName, storeConfig]) => {
    // ストアが既に存在する場合はスキップ
    if (db.objectStoreNames.contains(storeName)) {
      console.log(`[DB Migration] Store '${storeName}' already exists`);
      return;
    }
    
    // オブジェクトストアを作成
    const store = db.createObjectStore(storeName, {
      keyPath: storeConfig.keyPath,
      autoIncrement: storeConfig.autoIncrement,
    });
    
    console.log(`[DB Migration] Created store '${storeName}'`);
    
    // インデックスを作成
    storeConfig.indexes.forEach(index => {
      store.createIndex(index.name, index.keyPath, {
        unique: index.unique,
        multiEntry: index.multiEntry || false,
      });
      console.log(`[DB Migration] Created index '${index.name}' on '${storeName}'`);
    });
  });
}

/**
 * V1からV2へのマイグレーション例（将来用）
 * @param {IDBDatabase} db
 * @param {IDBTransaction} transaction
 */
function migrateV1ToV2(db, transaction) {
  console.log('[DB Migration] Migrating from V1 to V2');
  
  // 例: 新しいインデックスを追加
  // const store = transaction.objectStore('logs');
  // if (!store.indexNames.contains('newIndex')) {
  //   store.createIndex('newIndex', 'newField', { unique: false });
  // }
}

/**
 * データベースを完全にリセット
 * @param {IDBDatabase} db
 */
export function resetDatabase(db) {
  console.warn('[DB Migration] Resetting database - all data will be lost!');
  
  // すべてのオブジェクトストアを削除
  const storeNames = Array.from(db.objectStoreNames);
  storeNames.forEach(storeName => {
    db.deleteObjectStore(storeName);
    console.log(`[DB Migration] Deleted store '${storeName}'`);
  });
  
  // 初期スキーマを再作成
  createInitialSchema(db);
}

/**
 * バージョン互換性をチェック
 * @param {number} currentVersion
 * @param {number} requiredVersion
 * @returns {boolean}
 */
export function isVersionCompatible(currentVersion, requiredVersion) {
  return currentVersion >= requiredVersion;
}

/**
 * マイグレーション履歴を記録
 * @param {number} fromVersion
 * @param {number} toVersion
 * @param {boolean} success
 * @param {string} error
 */
export function logMigration(fromVersion, toVersion, success, error = null) {
  const migrationLog = {
    timestamp: Date.now(),
    from: fromVersion,
    to: toVersion,
    success,
    error,
  };
  
  console.log('[DB Migration] Migration log:', migrationLog);
  
  // Chrome Storageに保存（オプション）
  chrome.storage.local.get(['migrationHistory'], (result) => {
    const history = result.migrationHistory || [];
    history.push(migrationLog);
    
    // 最新10件のみ保持
    const recentHistory = history.slice(-10);
    
    chrome.storage.local.set({ migrationHistory: recentHistory });
  });
}