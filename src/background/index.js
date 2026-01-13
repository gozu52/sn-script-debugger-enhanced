/**
 * Background Service Worker - エントリーポイント
*/ 

import { handleMessage } from './message-handler.js';
import { logStorage } from './storage/log-storage.js';
import { performanceStorage } from './storage/performance-storage.js';
import { settingsStorage } from './storage/settings-storage.js';
import { STORAGE_KEYS } from '../shared/constants/storage-keys.js';

console.log('[Background] Service Worker started');

// ========== インストール・更新時の処理 ==========

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    await handleUpdate(details.previousVersion);
  }
});

async function handleFirstInstall() {
  console.log('[Background] First install - initializing...');
  
  const defaultSettings = settingsStorage.getDefaultSettings();
  await settingsStorage.saveSettings(defaultSettings);
  
  await chrome.storage.local.set({
    [STORAGE_KEYS.IS_ENABLED]: true,
    [STORAGE_KEYS.LAST_SYNC]: Date.now(),
  });
  
  console.log('[Background] Initialization complete');
}

async function handleUpdate(previousVersion) {
  console.log(`[Background] Updated from version ${previousVersion}`);
  
  const settings = await settingsStorage.getAllSettings();
  await settingsStorage.syncWithChromeStorage(settings);
}

// ========== メッセージリスナー ==========

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.action);
  
  handleMessage(message, sender)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error('[Background] Message handling error:', error);
      sendResponse({
        type: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
        },
      });
    });
  
  return true;
});

// ========== 定期クリーンアップ ==========

chrome.alarms.create('cleanup', {
  periodInMinutes: 60 * 24,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    console.log('[Background] Running scheduled cleanup...');
    
    try {
      const deletedLogs = await logStorage.cleanupOldLogs();
      console.log(`[Background] Cleaned up ${deletedLogs} old logs`);
      
      const deletedPerf = await performanceStorage.cleanupOldMeasurements();
      console.log(`[Background] Cleaned up ${deletedPerf} old performance measurements`);
    } catch (error) {
      console.error('[Background] Cleanup error:', error);
    }
  }
});

// ========== タブ更新の監視 ==========

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('.service-now.com') || tab.url.includes('.servicenow.com')) {
      console.log(`[Background] ServiceNow page loaded: ${tab.url}`);
      
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'INIT_DEBUGGER',
        });
      } catch (error) {
        console.debug('[Background] Content script not ready yet');
      }
    }
  }
});

// ========== ブラウザアクションのクリック ==========

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Background] Extension icon clicked');
});

// ========== コンテキストメニュー ==========

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sn-debugger-inspect',
    title: 'Inspect with SN Debugger',
    contexts: ['page', 'selection'],
    documentUrlPatterns: [
      'https://*.service-now.com/*',
      'https://*.servicenow.com/*',
    ],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sn-debugger-inspect') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'INSPECT_ELEMENT',
      selectionText: info.selectionText,
    });
  }
});

console.log('[Background] Service Worker initialized successfully');
