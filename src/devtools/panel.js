/**
 * DevTools Panel Script
 */

console.log('[Panel] Initializing...');

let logs = [];
let performanceData = [];

// パネル表示時に呼ばれる
window.onPanelShown = function() {
  console.log('[Panel] Panel shown, loading data...');
  loadLogs();
  loadPerformanceData();
};

// ========== ログ管理 ==========

async function loadLogs() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_LOGS',
      filters: {},
      limit: 100,
    });

    if (response.type === 'SUCCESS') {
      logs = response.data.logs || [];
      renderLogs();
    }
  } catch (error) {
    console.error('[Panel] Error loading logs:', error);
  }
}

function renderLogs() {
  const container = document.getElementById('logs-list');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = '<div class="empty-message">No logs found</div>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <div class="log-entry log-level-${log.level}">
      <div class="log-header">
        <span class="log-level-badge">${log.level}</span>
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="log-message">${escapeHtml(log.message)}</div>
      ${log.context?.table ? `<div class="log-context">Table: ${log.context.table}</div>` : ''}
    </div>
  `).join('');
}

// ========== パフォーマンスデータ管理 ==========

async function loadPerformanceData() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_PERFORMANCE_DATA',
      filters: {},
    });

    if (response.type === 'SUCCESS') {
      performanceData = response.data.measurements || [];
      renderPerformanceStats(response.data.stats);
    }
  } catch (error) {
    console.error('[Panel] Error loading performance data:', error);
  }
}

function renderPerformanceStats(stats) {
  const container = document.getElementById('performance-stats');
  if (!container || !stats) return;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Requests</div>
      <div class="stat-value">${stats.total || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Duration</div>
      <div class="stat-value">${stats.avgDuration ? stats.avgDuration.toFixed(2) + 'ms' : '0ms'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Slow Queries</div>
      <div class="stat-value">${stats.slowQueries || 0}</div>
    </div>
  `;
}

// ========== イベントハンドラー ==========

document.addEventListener('DOMContentLoaded', () => {
  // タブ切り替え
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // タブをアクティブ化
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // コンテンツを切り替え
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}-content`)?.classList.add('active');
    });
  });

  // リフレッシュボタン
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadLogs();
    loadPerformanceData();
  });

  // クリアボタン
  document.getElementById('clear-btn')?.addEventListener('click', async () => {
    if (confirm('Clear all logs and performance data?')) {
      await chrome.runtime.sendMessage({ action: 'CLEAR_LOGS' });
      await chrome.runtime.sendMessage({ action: 'CLEAR_PERFORMANCE_DATA' });
      logs = [];
      performanceData = [];
      renderLogs();
      renderPerformanceStats({});
    }
  });

  // ログ検索
  document.getElementById('log-search')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterLogs(searchTerm);
  });

  // ログレベルフィルター
  document.getElementById('log-level-filter')?.addEventListener('change', (e) => {
    const level = e.target.value;
    filterLogsByLevel(level);
  });
});

function filterLogs(searchTerm) {
  const filtered = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm)
  );
  renderFilteredLogs(filtered);
}

function filterLogsByLevel(level) {
  const filtered = level ? logs.filter(log => log.level === level) : logs;
  renderFilteredLogs(filtered);
}

function renderFilteredLogs(filteredLogs) {
  const container = document.getElementById('logs-list');
  if (!container) return;

  if (filteredLogs.length === 0) {
    container.innerHTML = '<div class="empty-message">No matching logs</div>';
    return;
  }

  container.innerHTML = filteredLogs.map(log => `
    <div class="log-entry log-level-${log.level}">
      <div class="log-header">
        <span class="log-level-badge">${log.level}</span>
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="log-message">${escapeHtml(log.message)}</div>
    </div>
  `).join('');
}

// ========== ユーティリティ ==========

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Background Scriptからの通知を受信
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NOTIFICATION') {
    if (message.notificationType === 'LOG_CAPTURED') {
      logs.unshift(message.data.logEntry);
      renderLogs();
    } else if (message.notificationType === 'PERFORMANCE_CAPTURED') {
      performanceData.unshift(message.data.measurement);
    }
  }
});