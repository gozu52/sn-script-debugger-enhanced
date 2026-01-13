/**
 * Log Viewer Component
 */

import React, { useState } from 'react';
import { useLogs } from '../../hooks/useLogs';
import LogFilter from './LogFilter';
import LogEntry from './LogEntry';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import './LogViewer.css';

function LogViewer({ onToast }) {
  const {
    logs,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    reload,
    clearAll,
    exportLogs,
  } = useLogs();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = async () => {
    const success = await clearAll();
    setShowClearConfirm(false);

    if (success) {
      onToast({
        type: 'success',
        message: 'All logs cleared',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to clear logs',
      });
    }
  };

  const handleExport = async (format) => {
    const success = await exportLogs(format);

    if (success) {
      onToast({
        type: 'success',
        message: `Logs exported as ${format.toUpperCase()}`,
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to export logs',
      });
    }
  };

  return (
    <div className="log-viewer">
      <div className="log-viewer-toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">
            Logs {stats && `(${stats.total})`}
          </h2>
        </div>

        <div className="toolbar-right">
          <Button size="small" onClick={reload} disabled={loading}>
            {loading ? '⟳' : '↻'} Refresh
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All
          </Button>
        </div>
      </div>

      <LogFilter
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      <div className="log-viewer-content">
        {loading && logs.length === 0 ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3 className="empty-state-title">Error</h3>
            <p className="empty-state-description">{error}</p>
            <Button onClick={reload}>Retry</Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No logs found</h3>
            <p className="empty-state-description">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters'
                : 'Logs will appear here as they are captured'}
            </p>
          </div>
        ) : (
          <div className="log-list">
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Logs"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearAll}>
              Clear All
            </Button>
          </>
        }
      >
        <p>Are you sure you want to clear all logs? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default LogViewer;