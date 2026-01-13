/**
 * Content Script - エントリーポイント
 * ServiceNowページに注入され、ページとBackground間の橋渡しを行う
 */

import { MESSAGE_TYPES } from '../shared/constants/message-types.js';
import { SERVICENOW_CONFIG } from '../shared/constants/config.js';

console.log('[Content Script] Initializing...');

// ========== 初期化 ==========

let isDebuggerEnabled = true;
let instanceInfo = null;

/**
 * 初期化処理
 */
async function initialize() {
  // ServiceNowページかどうかをチェック
  if (!isServiceNowPage()) {
    console.log('[Content Script] Not a ServiceNow page, exiting');
    return;
  }
  
  console.log('[Content Script] ServiceNow page detected:', window.location.href);
  
  // インスタンス情報を取得
  instanceInfo = await getInstanceInfo();
  console.log('[Content Script] Instance info:', instanceInfo);
  
  // Inject scriptを注入
  injectScript();
  
  // メッセージリスナーをセットアップ
  setupMessageListeners();
  
  // ページからのメッセージを受信
  setupPageMessageListener();
  
  console.log('[Content Script] Initialized successfully');
}

/**
 * ServiceNowページかどうかをチェック
 * @returns {boolean}
 */
function isServiceNowPage() {
  const url = window.location.href;
  return SERVICENOW_CONFIG.DOMAIN_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * インスタンス情報を取得
 * @returns {Promise<object>}
 */
async function getInstanceInfo() {
  try {
    // g_ck（session token）が存在するかチェック
    const hasSession = typeof window.g_ck !== 'undefined';
    
    // ユーザー情報を取得
    let userName = null;
    let userId = null;
    
    if (typeof window.g_user !== 'undefined') {
      userName = window.g_user.userName;
      userId = window.g_user.userID;
    }
    
    return {
      url: window.location.origin,
      instanceName: window.location.hostname.split('.')[0],
      hasSession,
      user: {
        name: userName,
        id: userId,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[Content Script] Error getting instance info:', error);
    return {
      url: window.location.origin,
      instanceName: 'unknown',
      hasSession: false,
      user: null,
      timestamp: Date.now(),
    };
  }
}

/**
 * Inject scriptをページに注入
 */
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    console.log('[Content Script] Inject script loaded');
    this.remove();
  };
  
  (document.head || document.documentElement).appendChild(script);
}

// ========== メッセージハンドリング ==========

/**
 * Background Scriptからのメッセージリスナー
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content Script] Message from background:', message.action);
    
    handleBackgroundMessage(message)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('[Content Script] Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // 非同期レスポンスを許可
  });
}

/**
 * Background Scriptからのメッセージを処理
 * @param {object} message
 * @returns {Promise<object>}
 */
async function handleBackgroundMessage(message) {
  const { action } = message;
  
  switch (action) {
    case 'INIT_DEBUGGER':
      return { success: true, instanceInfo };
    
    case 'DEBUGGER_ENABLED':
      isDebuggerEnabled = true;
      notifyPage('DEBUGGER_ENABLED');
      return { success: true };
    
    case 'DEBUGGER_DISABLED':
      isDebuggerEnabled = false;
      notifyPage('DEBUGGER_DISABLED');
      return { success: true };
    
    case 'GET_INSTANCE_INFO':
      return instanceInfo;
    
    case 'GET_SERVICENOW_TABLES':
      return await getServiceNowTables();
    
    case 'GET_SERVICENOW_FIELDS':
      return await getServiceNowFields(message.table);
    
    case MESSAGE_TYPES.EXECUTE_GLIDERECORD_QUERY:
      return await executeGlideRecordQuery(message.table, message.conditions);
    
    case MESSAGE_TYPES.INSERT_CODE:
      return insertCodeIntoEditor(message.code);
    
    case 'INSPECT_ELEMENT':
      return inspectElement(message.selectionText);
    
    default:
      console.warn('[Content Script] Unknown action:', action);
      return { success: false, error: 'Unknown action' };
  }
}

/**
 * ページからのメッセージを受信（window.postMessage経由）
 */
function setupPageMessageListener() {
  window.addEventListener('message', (event) => {
    // 同一オリジンからのメッセージのみ受け付ける
    if (event.source !== window) return;
    
    const { type, data } = event.data;
    
    if (!type || !type.startsWith('SN_DEBUG_')) return;
    
    // Background Scriptに転送
    handlePageMessage(type, data);
  });
}

/**
 * ページからのメッセージを処理
 * @param {string} type
 * @param {object} data
 */
async function handlePageMessage(type, data) {
  try {
    switch (type) {
      case 'SN_DEBUG_LOG':
        // ログをBackground Scriptに送信
        await chrome.runtime.sendMessage({
          action: MESSAGE_TYPES.LOG_CAPTURED,
          logEntry: data,
        });
        break;
      
      case 'SN_DEBUG_CONSOLE':
        // コンソールログをBackground Scriptに送信
        await chrome.runtime.sendMessage({
          action: MESSAGE_TYPES.LOG_CAPTURED,
          logEntry: {
            ...data,
            context: {
              ...data.context,
              url: window.location.href,
              user: instanceInfo?.user?.name,
            },
          },
        });
        break;
      
      case 'SN_DEBUG_PERFORMANCE':
        // パフォーマンスデータをBackground Scriptに送信
        await chrome.runtime.sendMessage({
          action: MESSAGE_TYPES.PERFORMANCE_CAPTURED,
          measurement: data,
        });
        break;
      
      default:
        console.warn('[Content Script] Unknown page message type:', type);
    }
  } catch (error) {
    console.error('[Content Script] Error handling page message:', error);
  }
}

/**
 * ページにメッセージを送信
 * @param {string} action
 * @param {object} data
 */
function notifyPage(action, data = {}) {
  window.postMessage({
    type: 'SN_DEBUG_FROM_CONTENT',
    action,
    data,
  }, '*');
}

// ========== ServiceNow API操作 ==========

/**
 * ServiceNowのテーブル一覧を取得
 * @returns {Promise<object>}
 */
async function getServiceNowTables() {
  try {
    const response = await fetch(
      `${window.location.origin}/api/now/table/sys_db_object?sysparm_query=sys_class_name=sys_db_object^ORDERBYlabel&sysparm_fields=name,label,super_class&sysparm_limit=1000`,
      {
        headers: {
          'X-UserToken': window.g_ck,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      tables: data.result.map(table => ({
        name: table.name,
        label: table.label,
        superClass: table.super_class?.value,
      })),
    };
  } catch (error) {
    console.error('[Content Script] Error getting tables:', error);
    return {
      success: false,
      error: error.message,
      tables: [],
    };
  }
}

/**
 * 指定テーブルのフィールド一覧を取得
 * @param {string} tableName
 * @returns {Promise<object>}
 */
async function getServiceNowFields(tableName) {
  try {
    const response = await fetch(
      `${window.location.origin}/api/now/table/sys_dictionary?sysparm_query=name=${tableName}^ORDERBYcolumn_label&sysparm_fields=element,column_label,internal_type,max_length,mandatory`,
      {
        headers: {
          'X-UserToken': window.g_ck,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      fields: data.result.map(field => ({
        name: field.element,
        label: field.column_label,
        type: field.internal_type,
        maxLength: field.max_length,
        mandatory: field.mandatory === 'true',
      })),
    };
  } catch (error) {
    console.error('[Content Script] Error getting fields:', error);
    return {
      success: false,
      error: error.message,
      fields: [],
    };
  }
}

/**
 * GlideRecordクエリを実行
 * @param {string} table
 * @param {object[]} conditions
 * @returns {Promise<object>}
 */
async function executeGlideRecordQuery(table, conditions) {
  try {
    // クエリ文字列を構築
    let queryString = '';
    conditions.forEach((cond, index) => {
      if (cond.field && cond.value) {
        if (index > 0) queryString += '^';
        queryString += `${cond.field}${cond.operator || ''}${cond.value}`;
      }
    });
    
    const url = `${window.location.origin}/api/now/table/${table}?sysparm_limit=100${queryString ? `&sysparm_query=${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'X-UserToken': window.g_ck,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: data.result,
      count: data.result.length,
    };
  } catch (error) {
    console.error('[Content Script] Error executing query:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
}

/**
 * コードをエディタに挿入
 * @param {string} code
 * @returns {Promise<object>}
 */
async function insertCodeIntoEditor(code) {
  try {
    // ACE Editorを探す
    const aceEditors = document.querySelectorAll('.ace_editor');
    
    if (aceEditors.length === 0) {
      throw new Error('No ACE editor found on page');
    }
    
    // 最初のエディタにコードを挿入
    const editor = aceEditors[0];
    const aceInstance = window.ace.edit(editor);
    
    aceInstance.insert(code);
    aceInstance.focus();
    
    return { success: true };
  } catch (error) {
    console.error('[Content Script] Error inserting code:', error);
    
    // フォールバック: クリップボードにコピー
    try {
      await navigator.clipboard.writeText(code);
      return {
        success: true,
        message: 'Code copied to clipboard (no editor found)',
      };
    } catch (clipboardError) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * 要素を検査
 * @param {string} selectionText
 * @returns {object}
 */
function inspectElement(selectionText) {
  console.log('[Content Script] Inspecting:', selectionText);
  
  // 選択されたテキストに関連する情報を収集
  const selection = window.getSelection();
  const element = selection.anchorNode?.parentElement;
  
  if (element) {
    const info = {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      text: selectionText,
      attributes: {},
    };
    
    // 属性を収集
    Array.from(element.attributes).forEach(attr => {
      info.attributes[attr.name] = attr.value;
    });
    
    console.log('[Content Script] Element info:', info);
    
    // DevToolsに通知（オプション）
    chrome.runtime.sendMessage({
      action: 'ELEMENT_INSPECTED',
      data: info,
    });
    
    return { success: true, info };
  }
  
  return { success: false, error: 'No element selected' };
}

// ========== DOM監視 ==========

/**
 * DOM変更を監視
 */
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 特定の変更に反応（例: エラーメッセージの表示）
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('outputmsg_error')) {
            // エラーメッセージを検出
            console.log('[Content Script] Error message detected:', node.textContent);
            
            chrome.runtime.sendMessage({
              action: MESSAGE_TYPES.LOG_CAPTURED,
              logEntry: {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                level: 'error',
                message: node.textContent,
                context: {
                  type: 'ui_error',
                  url: window.location.href,
                },
              },
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ========== 初期化実行 ==========

// DOMが読み込まれたら初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// DOM監視を開始
if (document.body) {
  observeDOMChanges();
} else {
  document.addEventListener('DOMContentLoaded', observeDOMChanges);
}