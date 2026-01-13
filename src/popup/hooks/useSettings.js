/**
 * useSettings Hook
 * 設定の状態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settings-service';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 設定を読み込み
   */
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
      console.error('[useSettings] Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 設定を更新
   */
  const updateSettings = useCallback(async (newSettings) => {
    try {
      await settingsService.updateSettings(newSettings);
      setSettings(newSettings);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useSettings] Error updating settings:', err);
      return false;
    }
  }, []);

  /**
   * 特定の設定を更新
   */
  const updateSetting = useCallback(async (path, value) => {
    try {
      await settingsService.updateSetting(path, value);
      
      // ローカル状態を更新
      setSettings(prev => {
        const keys = path.split('.');
        const newSettings = { ...prev };
        let current = newSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newSettings;
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useSettings] Error updating setting:', err);
      return false;
    }
  }, []);

  /**
   * 設定をエクスポート
   */
  const exportSettings = useCallback(() => {
    if (settings) {
      settingsService.exportSettings(settings);
      return true;
    }
    return false;
  }, [settings]);

  /**
   * 設定をインポート
   */
  const importSettings = useCallback(async (file) => {
    try {
      const result = await settingsService.importSettings(file);
      await loadSettings();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('[useSettings] Error importing settings:', err);
      throw err;
    }
  }, [loadSettings]);

  /**
   * 初回ロード
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    reload: loadSettings,
    updateSettings,
    updateSetting,
    exportSettings,
    importSettings,
  };
}