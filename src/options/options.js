/**
 * Options Page Script
 */

console.log('[Options] Initializing...');

let currentSettings = null;

// ページ読み込み時
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// ========== 設定の読み込み ==========

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_SETTINGS',
    });

    if (response.type === 'SUCCESS') {
      currentSettings = response.data.settings;
      populateForm(currentSettings);
      console.log('[Options] Settings loaded:', currentSettings);
    }
  } catch (error) {
    console.error('[Options] Error loading settings:', error);
    showToast('Failed to load settings', 'error');
  }
}

// ========== フォームへの反映 ==========

function populateForm(settings) {
  // General Settings
  document.getElementById('enable-logs').checked = settings.logs?.enabled || false;
  document.getElementById('enable-performance').checked = settings.performance?.enabled || false;
  document.getElementById('log-retention').value = settings.logs?.retentionDays || 7;
  document.getElementById('max-logs').value = settings.logs?.maxLogs || 10000;

  // Performance Settings
  document.getElementById('slow-query-threshold').value = settings.performance?.slowQueryThreshold || 500;
  document.getElementById('sampling-rate').value = settings.performance?.samplingRate || 1;
  updateSamplingRateDisplay(settings.performance?.samplingRate || 1);

  // Data Protection
  document.getElementById('enable-masking').checked = settings.masking?.enabled || false;
  document.getElementById('auto-cleanup').checked = settings.logs?.autoCleanup || false;

  // UI Preferences
  document.getElementById('theme').value = settings.ui?.theme || 'auto';
  document.getElementById('default-tab').value = settings.ui?.defaultTab || 'logs';
}

// ========== イベントリスナー ==========

function setupEventListeners() {
  // 保存ボタン
  document.getElementById('save-settings')?.addEventListener('click', saveSettings);

  // サンプリングレート表示更新
  document.getElementById('sampling-rate')?.addEventListener('input', (e) => {
    updateSamplingRateDisplay(parseFloat(e.target.value));
  });

  // エクスポート
  document.getElementById('export-settings')?.addEventListener('click', exportSettings);

  // インポート
  document.getElementById('import-settings')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', importSettings);

  // リセット
  document.getElementById('reset-settings')?.addEventListener('click', resetSettings);
}

// ========== 設定の保存 ==========

async function saveSettings() {
  try {
    const newSettings = {
      logs: {
        enabled: document.getElementById('enable-logs').checked,
        retentionDays: parseInt(document.getElementById('log-retention').value),
        maxLogs: parseInt(document.getElementById('max-logs').value),
        autoCleanup: document.getElementById('auto-cleanup').checked,
        defaultLevels: currentSettings?.logs?.defaultLevels || ['log', 'info', 'warn', 'error'],
      },
      performance: {
        enabled: document.getElementById('enable-performance').checked,
        slowQueryThreshold: parseInt(document.getElementById('slow-query-threshold').value),
        samplingRate: parseFloat(document.getElementById('sampling-rate').value),
        retentionDays: currentSettings?.performance?.retentionDays || 7,
      },
      masking: {
        enabled: document.getElementById('enable-masking').checked,
        sensitivePatterns: currentSettings?.masking?.sensitivePatterns || [],
        maskChar: currentSettings?.masking?.maskChar || '*',
        maskLength: currentSettings?.masking?.maskLength || 8,
      },
      ui: {
        theme: document.getElementById('theme').value,
        defaultTab: document.getElementById('default-tab').value,
        pageSize: currentSettings?.ui?.pageSize || 50,
        showTimestamps: currentSettings?.ui?.showTimestamps !== false,
        compactMode: currentSettings?.ui?.compactMode || false,
      },
      snippets: currentSettings?.snippets || {},
      notifications: currentSettings?.notifications || {},
      export: currentSettings?.export || {},
      advanced: currentSettings?.advanced || {},
    };

    const response = await chrome.runtime.sendMessage({
      action: 'UPDATE_SETTINGS',
      settings: newSettings,
    });

    if (response.type === 'SUCCESS') {
      currentSettings = newSettings;
      showToast('Settings saved successfully', 'success');
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('[Options] Error saving settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

// ========== エクスポート/インポート ==========

function exportSettings() {
  if (!currentSettings) {
    showToast('No settings to export', 'error');
    return;
  }

  const blob = new Blob([JSON.stringify(currentSettings, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sn-debugger-settings-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Settings exported', 'success');
}

async function importSettings(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const settings = JSON.parse(text);

    const response = await chrome.runtime.sendMessage({
      action: 'UPDATE_SETTINGS',
      settings,
    });

    if (response.type === 'SUCCESS') {
      currentSettings = settings;
      populateForm(settings);
      showToast('Settings imported successfully', 'success');
    } else {
      throw new Error('Failed to import settings');
    }

    event.target.value = '';
  } catch (error) {
    console.error('[Options] Error importing settings:', error);
    showToast('Failed to import settings', 'error');
  }
}

// ========== リセット ==========

async function resetSettings() {
  if (!confirm('Reset all settings to defaults? This action cannot be undone.')) {
    return;
  }

  try {
    // デフォルト設定を取得してリロード
    await chrome.runtime.sendMessage({
      action: 'RESET_SETTINGS',
    });

    await loadSettings();
    showToast('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('[Options] Error resetting settings:', error);
    showToast('Failed to reset settings', 'error');
  }
}

// ========== ヘルパー関数 ==========

function updateSamplingRateDisplay(value) {
  const display = document.getElementById('sampling-rate-value');
  if (display) {
    display.textContent = `${Math.round(value * 100)}%`;
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}