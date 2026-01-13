/**
 * メッセージハンドラー
 * Popup/Content Script/DevToolsからのメッセージを処理
 */

import { logStorage } from './storage/log-storage.js';
import { snippetStorage } from './storage/snippet-storage.js';
import { performanceStorage } from './storage/performance-storage.js';
import { settingsStorage } from './storage/settings-storage.js';
import { MESSAGE_TYPES, RESPONSE_TYPES, ERROR_CODES } from '../shared/constants/message-types.js';

/**
 * メッセージルーター
 * @param {object} message
 * @param {object} sender
 * @returns {Promise<object>}
 */
export async function handleMessage(message, sender) {
  const { action, ...params } = message;
  
  console.log(`[MessageHandler] Received: ${action}`, params);
  
  try {
    let result;
    
    switch (action) {
      // ========== ログ関連 ==========
      case MESSAGE_TYPES.LOG_CAPTURED:
        result = await handleLogCaptured(params);
        break;
      
      case MESSAGE_TYPES.GET_LOGS:
        result = await handleGetLogs(params);
        break;
      
      case MESSAGE_TYPES.SEARCH_LOGS:
        result = await handleSearchLogs(params);
        break;
      
      case MESSAGE_TYPES.CLEAR_LOGS:
        result = await handleClearLogs();
        break;
      
      case MESSAGE_TYPES.EXPORT_LOGS:
        result = await handleExportLogs(params);
        break;
      
      // ========== パフォーマンス関連 ==========
      case MESSAGE_TYPES.PERFORMANCE_CAPTURED:
        result = await handlePerformanceCaptured(params);
        break;
      
      case MESSAGE_TYPES.GET_PERFORMANCE_DATA:
        result = await handleGetPerformanceData(params);
        break;
      
      case MESSAGE_TYPES.CLEAR_PERFORMANCE_DATA:
        result = await handleClearPerformanceData();
        break;
      
      // ========== スニペット関連 ==========
      case MESSAGE_TYPES.GET_SNIPPETS:
        result = await handleGetSnippets(params);
        break;
      
      case MESSAGE_TYPES.SAVE_SNIPPET:
        result = await handleSaveSnippet(params);
        break;
      
      case MESSAGE_TYPES.DELETE_SNIPPET:
        result = await handleDeleteSnippet(params);
        break;
      
      case MESSAGE_TYPES.UPDATE_SNIPPET:
        result = await handleUpdateSnippet(params);
        break;
      
      case MESSAGE_TYPES.IMPORT_SNIPPETS:
        result = await handleImportSnippets(params);
        break;
      
      case MESSAGE_TYPES.EXPORT_SNIPPETS:
        result = await handleExportSnippets(params);
        break;
      
      // ========== クエリビルダー関連 ==========
      case MESSAGE_TYPES.GET_TABLES:
        result = await handleGetTables(sender);
        break;
      
      case MESSAGE_TYPES.GET_FIELDS:
        result = await handleGetFields(params, sender);
        break;
      
      case MESSAGE_TYPES.EXECUTE_QUERY:
        result = await handleExecuteQuery(params, sender);
        break;
      
      // ========== 設定関連 ==========
      case MESSAGE_TYPES.GET_SETTINGS:
        result = await handleGetSettings();
        break;
      
      case MESSAGE_TYPES.UPDATE_SETTINGS:
        result = await handleUpdateSettings(params);
        break;
      
      // ========== インスタンス情報 ==========
      case MESSAGE_TYPES.GET_INSTANCE_INFO:
        result = await handleGetInstanceInfo(sender);
        break;
      
      // ========== 拡張機能制御 ==========
      case MESSAGE_TYPES.ENABLE_DEBUGGER:
        result = await handleEnableDebugger();
        break;
      
      case MESSAGE_TYPES.DISABLE_DEBUGGER:
        result = await handleDisableDebugger();
        break;
      
      case MESSAGE_TYPES.GET_STATUS:
        result = await handleGetStatus();
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return {
      type: RESPONSE_TYPES.SUCCESS,
      data: result,
    };
    
  } catch (error) {
    console.error(`[MessageHandler] Error handling ${action}:`, error);
    
    return {
      type: RESPONSE_TYPES.ERROR,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error.message,
      },
    };
  }
}

// ========== ログハンドラー ==========

async function handleLogCaptured({ logEntry }) {
  const id = await logStorage.saveLog(logEntry);
  
  // Popupに通知（開いている場合）
  notifyPopup(MESSAGE_TYPES.LOG_CAPTURED, { id, logEntry });
  
  return { id };
}

async function handleGetLogs({ filters, limit, offset }) {
  const logs = await logStorage.searchLogs({ ...filters, limit, offset });
  const stats = await logStorage.getLogStats();
  
  return { logs, stats };
}

async function handleSearchLogs({ filters }) {
  const logs = await logStorage.searchLogs(filters);
  return { logs };
}

async function handleClearLogs() {
  const success = await logStorage.clearAllLogs();
  return { success };
}

async function handleExportLogs({ format, filters }) {
  const data = await logStorage.exportLogs(format, filters);
  return { data };
}

// ========== パフォーマンスハンドラー ==========

async function handlePerformanceCaptured({ measurement }) {
  const id = await performanceStorage.saveMeasurement(measurement);
  
  // Popupに通知
  notifyPopup(MESSAGE_TYPES.PERFORMANCE_CAPTURED, { id, measurement });
  
  return { id };
}

async function handleGetPerformanceData({ filters }) {
  const measurements = await performanceStorage.searchMeasurements(filters);
  const stats = await performanceStorage.getStats(filters);
  const slowQueries = await performanceStorage.getTopSlowQueries(10);
  
  return { measurements, stats, slowQueries };
}

async function handleClearPerformanceData() {
  const success = await performanceStorage.clearAllMeasurements();
  return { success };
}

// ========== スニペットハンドラー ==========

async function handleGetSnippets({ filters }) {
  const snippets = await snippetStorage.searchSnippets(filters);
  const tags = await snippetStorage.getAllTags();
  
  return { snippets, tags };
}

async function handleSaveSnippet({ snippet }) {
  const id = await snippetStorage.saveSnippet(snippet);
  return { id };
}

async function handleDeleteSnippet({ id }) {
  const success = await snippetStorage.deleteSnippet(id);
  return { success };
}

async function handleUpdateSnippet({ snippet }) {
  const id = await snippetStorage.saveSnippet(snippet);
  return { id };
}

async function handleImportSnippets({ jsonData, replaceExisting }) {
  const count = await snippetStorage.importSnippets(jsonData, replaceExisting);
  return { count };
}

async function handleExportSnippets({ ids }) {
  const data = await snippetStorage.exportSnippets(ids);
  return { data };
}

// ========== クエリビルダーハンドラー ==========

async function handleGetTables(sender) {
  // Content Scriptにテーブル一覧の取得を依頼
  const response = await sendMessageToTab(sender.tab.id, {
    action: 'GET_SERVICENOW_TABLES',
  });
  
  return response.tables || [];
}

async function handleGetFields({ table }, sender) {
  // Content Scriptにフィールド一覧の取得を依頼
  const response = await sendMessageToTab(sender.tab.id, {
    action: 'GET_SERVICENOW_FIELDS',
    table,
  });
  
  return response.fields || [];
}

async function handleExecuteQuery({ table, conditions }, sender) {
  // Content Scriptにクエリ実行を依頼
  const response = await sendMessageToTab(sender.tab.id, {
    action: MESSAGE_TYPES.EXECUTE_GLIDERECORD_QUERY,
    table,
    conditions,
  });
  
  return response;
}

// ========== 設定ハンドラー ==========

async function handleGetSettings() {
  const settings = await settingsStorage.getAllSettings();
  return { settings };
}

async function handleUpdateSettings({ settings, path, value }) {
  let success;
  
  if (path && value !== undefined) {
    // 特定の設定を更新
    success = await settingsStorage.updateSetting(path, value);
  } else if (settings) {
    // すべての設定を更新
    success = await settingsStorage.saveSettings(settings);
  } else {
    throw new Error('Invalid parameters for UPDATE_SETTINGS');
  }
  
  // Chrome Storageにも同期
  if (success && settings) {
    await settingsStorage.syncWithChromeStorage(settings);
  }
  
  return { success };
}

// ========== インスタンス情報ハンドラー ==========

async function handleGetInstanceInfo(sender) {
  // Content Scriptからインスタンス情報を取得
  const response = await sendMessageToTab(sender.tab.id, {
    action: 'GET_INSTANCE_INFO',
  });
  
  return response;
}

// ========== 拡張機能制御ハンドラー ==========

async function handleEnableDebugger() {
  await settingsStorage.updateSetting('logs.enabled', true);
  await settingsStorage.updateSetting('performance.enabled', true);
  
  // すべてのServiceNowタブにメッセージを送信
  await broadcastToServiceNowTabs({
    action: 'DEBUGGER_ENABLED',
  });
  
  return { enabled: true };
}

async function handleDisableDebugger() {
  await settingsStorage.updateSetting('logs.enabled', false);
  await settingsStorage.updateSetting('performance.enabled', false);
  
  await broadcastToServiceNowTabs({
    action: 'DEBUGGER_DISABLED',
  });
  
  return { enabled: false };
}

async function handleGetStatus() {
  const logsEnabled = await settingsStorage.getSetting('logs.enabled');
  const performanceEnabled = await settingsStorage.getSetting('performance.enabled');
  const logCount = (await logStorage.getLogStats()).total;
  const snippetCount = (await snippetStorage.searchSnippets({})).length;
  
  return {
    enabled: logsEnabled && performanceEnabled,
    logsEnabled,
    performanceEnabled,
    logCount,
    snippetCount,
  };
}

// ========== ヘルパー関数 ==========

/**
 * 特定のタブにメッセージを送信
 * @param {number} tabId
 * @param {object} message
 * @returns {Promise<object>}
 */
async function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response || {});
      }
    });
  });
}

/**
 * すべてのServiceNowタブにメッセージをブロードキャスト
 * @param {object} message
 */
async function broadcastToServiceNowTabs(message) {
  const tabs = await chrome.tabs.query({
    url: [
      'https://*.service-now.com/*',
      'https://*.servicenow.com/*',
    ],
  });
  
  for (const tab of tabs) {
    try {
      await sendMessageToTab(tab.id, message);
    } catch (error) {
      console.warn(`[MessageHandler] Failed to send message to tab ${tab.id}:`, error);
    }
  }
}

/**
 * Popupにメッセージを送信（開いている場合のみ）
 * @param {string} type
 * @param {object} data
 */
function notifyPopup(type, data) {
  chrome.runtime.sendMessage({
    type: 'NOTIFICATION',
    notificationType: type,
    data,
  }).catch(() => {
    // Popupが開いていない場合はエラーを無視
  });
}