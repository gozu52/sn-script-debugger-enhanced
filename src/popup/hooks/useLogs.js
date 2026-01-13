/**
 * useLogs Hook
 * ログデータの管理
 */

import { useState, useEffect, useCallback } from 'react';
import { logService } from '../services/log-service';

export function useLogs(initialFilters = {}) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  /**
   * ログを読み込み
   */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await logService.getLogs(filters);
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
      console.error('[useLogs] Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * フィルターを更新
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * フィルターをリセット
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * すべてのログをクリア
   */
  const clearAll = useCallback(async () => {
    try {
      await logService.clearAllLogs();
      setLogs([]);
      setStats(null);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useLogs] Error clearing logs:', err);
      return false;
    }
  }, []);

  /**
   * ログをエクスポート
   */
  const exportLogs = useCallback(async (format = 'json') => {
    try {
      const data = await logService.exportLogs(format, filters);
      logService.downloadLogs(data, format);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useLogs] Error exporting logs:', err);
      return false;
    }
  }, [filters]);

  /**
   * 初回ロード
   */
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /**
   * リアルタイム更新を監視
   */
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'NOTIFICATION' && message.notificationType === 'LOG_CAPTURED') {
        // 新しいログを追加
        setLogs(prev => [message.data.logEntry, ...prev].slice(0, 100));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return {
    logs,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    reload: loadLogs,
    clearAll,
    exportLogs,
  };
}