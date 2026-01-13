/**
 * usePerformance Hook
 * パフォーマンスデータの状態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { performanceService } from '../services/performance-service';

export function usePerformance() {
  const [measurements, setMeasurements] = useState([]);
  const [stats, setStats] = useState(null);
  const [slowQueries, setSlowQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * パフォーマンスデータを読み込み
   */
  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await performanceService.getPerformanceData();
      setMeasurements(data.measurements || []);
      setStats(data.stats || null);
      setSlowQueries(data.slowQueries || []);
    } catch (err) {
      setError(err.message);
      console.error('[usePerformance] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * すべてのデータをクリア
   */
  const clearAll = useCallback(async () => {
    try {
      await performanceService.clearPerformanceData();
      setMeasurements([]);
      setStats(null);
      setSlowQueries([]);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[usePerformance] Error clearing data:', err);
      return false;
    }
  }, []);

  /**
   * 初回ロード
   */
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  /**
   * リアルタイム更新を監視
   */
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'NOTIFICATION' && 
          message.notificationType === 'PERFORMANCE_CAPTURED') {
        // 新しい計測データを追加
        setMeasurements(prev => [message.data.measurement, ...prev].slice(0, 100));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return {
    measurements,
    stats,
    slowQueries,
    loading,
    error,
    reload: loadPerformanceData,
    clearAll,
  };
}