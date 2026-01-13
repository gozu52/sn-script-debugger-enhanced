/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Common/Header';
import TabNavigation from './components/Common/TabNavigation';
import LogViewer from './components/LogViewer/LogViewer';
import QueryBuilder from './components/QueryBuilder/QueryBuilder';
import SnippetManager from './components/SnippetManager/SnippetManager';
import PerformanceDashboard from './components/Performance/PerformanceDashboard';
import Settings from './components/Settings/Settings';
import Toast from './components/Common/Toast';
import { UI_CONFIG } from '../shared/constants/config';

function App() {
  const [activeTab, setActiveTab] = useState(UI_CONFIG.TABS.LOGS);
  const [status, setStatus] = useState({
    enabled: true,
    logCount: 0,
    snippetCount: 0,
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // ステータスを取得
    loadStatus();

    // Background Scriptからの通知を受信
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
    };
  }, []);

  /**
   * ステータスを読み込み
   */
  const loadStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GET_STATUS',
      });

      if (response.type === 'SUCCESS') {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('[App] Error loading status:', error);
    }
  };

  /**
   * Background Scriptからのメッセージを処理
   */
  const handleBackgroundMessage = (message, sender, sendResponse) => {
    if (message.type === 'NOTIFICATION') {
      handleNotification(message);
    }
  };

  /**
   * 通知を処理
   */
  const handleNotification = (message) => {
    const { notificationType, data } = message;

    switch (notificationType) {
      case 'LOG_CAPTURED':
        // ログ数を更新
        setStatus(prev => ({
          ...prev,
          logCount: prev.logCount + 1,
        }));
        break;

      case 'PERFORMANCE_CAPTURED':
        // 遅いクエリを通知
        if (data.measurement?.duration > 1000) {
          showToast({
            type: 'warning',
            message: `Slow operation detected: ${data.measurement.duration.toFixed(0)}ms`,
          });
        }
        break;
    }
  };

  /**
   * トーストを表示
   */
  const showToast = (toastData) => {
    setToast(toastData);
  };

  /**
   * トーストを閉じる
   */
  const closeToast = () => {
    setToast(null);
  };

  /**
   * タブを切り替え
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  /**
   * アクティブなタブコンポーネントをレンダリング
   */
  const renderActiveTab = () => {
    switch (activeTab) {
      case UI_CONFIG.TABS.LOGS:
        return <LogViewer onToast={showToast} />;
      
      case UI_CONFIG.TABS.QUERY_BUILDER:
        return <QueryBuilder onToast={showToast} />;
      
      case UI_CONFIG.TABS.SNIPPETS:
        return <SnippetManager onToast={showToast} />;
      
      case UI_CONFIG.TABS.PERFORMANCE:
        return <PerformanceDashboard onToast={showToast} />;
      
      case UI_CONFIG.TABS.SETTINGS:
        return <Settings onToast={showToast} />;
      
      default:
        return <LogViewer onToast={showToast} />;
    }
  };

  return (
    <div className="app">
      <Header status={status} />
      
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <main className="app-content">
        {renderActiveTab()}
      </main>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
        />
      )}

      <style jsx>{`
        .app {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .app-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

export default App;