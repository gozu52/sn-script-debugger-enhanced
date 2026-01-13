// src/popup/hooks/useQuery.js
/**
 * useQuery Hook
 * クエリビルダーの状態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { queryService } from '../services/query-service';

const DEFAULT_CONDITION = { field: '', operator: '=', value: '' };

export function useQuery() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState([]);
  const [conditions, setConditions] = useState([DEFAULT_CONDITION]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * テーブル一覧を読み込み
   */
  useEffect(() => {
    const loadTables = async () => {
      try {
        const tableList = await queryService.getTables();
        setTables(tableList);
      } catch (err) {
        console.error('[useQuery] Error loading tables:', err);
      }
    };

    loadTables();
  }, []);

  /**
   * テーブル選択時にフィールドを読み込み
   */
  useEffect(() => {
    if (!selectedTable) {
      setFields([]);
      return;
    }

    const loadFields = async () => {
      try {
        const fieldList = await queryService.getFields(selectedTable);
        setFields(fieldList);
      } catch (err) {
        console.error('[useQuery] Error loading fields:', err);
      }
    };

    loadFields();
  }, [selectedTable]);

  /**
   * コード生成
   */
  useEffect(() => {
    if (!selectedTable) {
      setGeneratedCode('');
      return;
    }

    const code = queryService.generateCode(selectedTable, conditions);
    setGeneratedCode(code);
  }, [selectedTable, conditions]);

  /**
   * 条件を追加
   */
  const addCondition = useCallback(() => {
    setConditions(prev => [...prev, { ...DEFAULT_CONDITION }]);
  }, []);

  /**
   * 条件を更新
   */
  const updateCondition = useCallback((index, updates) => {
    setConditions(prev => {
      const newConditions = [...prev];
      newConditions[index] = { ...newConditions[index], ...updates };
      return newConditions;
    });
  }, []);

  /**
   * 条件を削除
   */
  const removeCondition = useCallback((index) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * 条件をリセット
   */
  const resetConditions = useCallback(() => {
    setConditions([DEFAULT_CONDITION]);
  }, []);

  /**
   * クエリを実行
   */
  const executeQuery = useCallback(async () => {
    if (!selectedTable) {
      setError('Please select a table');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await queryService.executeQuery(selectedTable, conditions);
      setResults(data);
    } catch (err) {
      setError(err.message);
      console.error('[useQuery] Error executing query:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, conditions]);

  /**
   * コードをコピー
   */
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
  }, [generatedCode]);

  return {
    tables,
    selectedTable,
    setSelectedTable,
    fields,
    conditions,
    addCondition,
    updateCondition,
    removeCondition,
    resetConditions,
    generatedCode,
    copyCode,
    results,
    loading,
    error,
    executeQuery,
  };
}