import React, { useState } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import MetricsCard from './MetricsCard';
import TimelineChart from './TimelineChart';
import SlowQueriesTable from './SlowQueriesTable';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { formatDuration } from '../../../shared/utils/date-utils';
import './Performance.css';

function PerformanceDashboard({ onToast }) {
  const {
    measurements,
    stats,
    slowQueries,
    loading,
    error,
    reload,
    clearAll,
  } = usePerformance();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = async () => {
    const success = await clearAll();
    setShowClearConfirm(false);

    if (success) {
      onToast({
        type: 'success',
        message: 'All performance data cleared',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to clear performance data',
      });
    }
  };

  return (
    <div className="performance-dashboard">
      <div className="performance-toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">Performance Dashboard</h2>
        </div>

        <div className="toolbar-right">
          <Button size="small" onClick={reload} disabled={loading}>
            {loading ? '⟳' : '↻'} Refresh
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

      <div className="performance-content">
        {error && (
          <div className="performance-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        {stats ? (
          <>
            <div className="performance-metrics">
              <MetricsCard
                title="Total Requests"
                value={stats.total || 0}
                icon="📊"
                color="primary"
              />
              <MetricsCard
                title="Avg Duration"
                value={stats.avgDuration ? formatDuration(stats.avgDuration) : '0ms'}
                icon="⏱️"
                color="info"
              />
              <MetricsCard
                title="Slow Queries"
                value={stats.slowQueries || 0}
                icon="🐌"
                color="warning"
              />
              <MetricsCard
                title="Slow API Calls"
                value={stats.slowAPICalls || 0}
                icon="🌐"
                color="error"
              />
            </div>

            <div className="performance-section">
              <h3 className="section-title">Request Duration Timeline</h3>
              <TimelineChart measurements={measurements} />
            </div>

            <div className="performance-section">
              <h3 className="section-title">Slowest Operations</h3>
              <SlowQueriesTable queries={slowQueries} />
            </div>

            {stats.byType && Object.keys(stats.byType).length > 0 && (
              <div className="performance-section">
                <h3 className="section-title">Operations by Type</h3>
                <div className="type-breakdown">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="type-breakdown-item">
                      <span className="type-name">{type}</span>
                      <span className="type-count badge badge-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <h3 className="empty-state-title">No Performance Data</h3>
            <p className="empty-state-description">
              Performance metrics will appear here as operations are executed
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Performance Data"
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
        <p>Are you sure you want to clear all performance data? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default PerformanceDashboard;