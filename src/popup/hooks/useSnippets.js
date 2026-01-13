/**
 * useSnippets Hook
 * スニペット管理の状態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { snippetService } from '../services/snippet-service';

export function useSnippets() {
  const [snippets, setSnippets] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * スニペットを読み込み
   */
  const loadSnippets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await snippetService.getSnippets(filters);
      setSnippets(data.snippets || []);
      setTags(data.tags || []);
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error loading snippets:', err);
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
    setFilters({ search: '', category: '', tag: '' });
  }, []);

  /**
   * スニペットを保存
   */
  const saveSnippet = useCallback(async (snippet) => {
    try {
      const result = await snippetService.saveSnippet(snippet);
      await loadSnippets();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error saving snippet:', err);
      throw err;
    }
  }, [loadSnippets]);

  /**
   * スニペットを削除
   */
  const deleteSnippet = useCallback(async (id) => {
    try {
      await snippetService.deleteSnippet(id);
      await loadSnippets();
      if (selectedSnippet?.id === id) {
        setSelectedSnippet(null);
      }
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error deleting snippet:', err);
      return false;
    }
  }, [loadSnippets, selectedSnippet]);

  /**
   * スニペットをエクスポート
   */
  const exportSnippets = useCallback(async (ids = null) => {
    try {
      const data = await snippetService.exportSnippets(ids);
      snippetService.downloadSnippets(data);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error exporting snippets:', err);
      return false;
    }
  }, []);

  /**
   * スニペットをインポート
   */
  const importSnippets = useCallback(async (file, replaceExisting = false) => {
    try {
      const text = await file.text();
      const result = await snippetService.importSnippets(text, replaceExisting);
      await loadSnippets();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error importing snippets:', err);
      throw err;
    }
  }, [loadSnippets]);

  /**
   * クリップボードにコピー
   */
  const copyToClipboard = useCallback(async (text) => {
    try {
      await snippetService.copyToClipboard(text);
      return true;
    } catch (err) {
      console.error('[useSnippets] Error copying to clipboard:', err);
      return false;
    }
  }, []);

  /**
   * エディタに挿入
   */
  const insertIntoEditor = useCallback(async (code) => {
    try {
      await snippetService.insertIntoEditor(code);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('[useSnippets] Error inserting into editor:', err);
      return false;
    }
  }, []);

  /**
   * 初回ロード
   */
  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  return {
    snippets,
    tags,
    selectedSnippet,
    setSelectedSnippet,
    filters,
    updateFilters,
    resetFilters,
    loading,
    error,
    reload: loadSnippets,
    saveSnippet,
    deleteSnippet,
    exportSnippets,
    importSnippets,
    copyToClipboard,
    insertIntoEditor,
  };
}