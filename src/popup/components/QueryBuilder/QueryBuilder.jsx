import React from 'react';
import { useQuery } from '../../hooks/useQuery';
import TableSelector from './TableSelector';
import ConditionBuilder from './ConditionBuilder';
import CodePreview from './CodePreview';
import ResultsTable from './ResultsTable';
import Button from '../Common/Button';
import './QueryBuilder.css';

function QueryBuilder({ onToast }) {
  const {
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
  } = useQuery();

  const handleCopyCode = () => {
    copyCode();
    onToast({
      type: 'success',
      message: 'Code copied to clipboard',
    });
  };

  const handleExecuteQuery = async () => {
    await executeQuery();
    
    if (results && !error) {
      onToast({
        type: 'success',
        message: `Query executed successfully. ${results.count} records found.`,
      });
    } else if (error) {
      onToast({
        type: 'error',
        message: error,
      });
    }
  };

  return (
    <div className="query-builder">
      <div className="query-builder-controls">
        <div className="controls-section">
          <TableSelector
            tables={tables}
            selectedTable={selectedTable}
            onChange={setSelectedTable}
          />
        </div>

        {selectedTable && (
          <>
            <div className="controls-section">
              <ConditionBuilder
                conditions={conditions}
                fields={fields}
                onAdd={addCondition}
                onUpdate={updateCondition}
                onRemove={removeCondition}
              />
            </div>

            <div className="controls-section">
              <CodePreview code={generatedCode} onCopy={handleCopyCode} />
            </div>

            <div className="controls-actions">
              <Button
                variant="primary"
                onClick={handleExecuteQuery}
                disabled={loading}
              >
                {loading ? '⟳ Executing...' : '▶ Execute Query'}
              </Button>
              <Button variant="ghost" onClick={resetConditions}>
                Reset Conditions
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="query-builder-results">
        {error && (
          <div className="query-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        {results && !error && (
          <ResultsTable results={results} />
        )}

        {!selectedTable && (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <h3 className="empty-state-title">Query Builder</h3>
            <p className="empty-state-description">
              Select a table to start building your GlideRecord query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueryBuilder;