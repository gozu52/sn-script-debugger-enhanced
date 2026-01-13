/**
 * Log Entry Component
 */

import React, { useState } from 'react';
import { formatTimestamp } from '../../../shared/utils/date-utils';

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      case 'log':
      default: return '📝';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`log-entry level-${log.level}`}>
      <div className="log-entry-header" onClick={() => setExpanded(!expanded)}>
        <span className="log-icon">{getLevelIcon(log.level)}</span>
        
        <div className="log-main">
          <div className="log-message">{log.message}</div>
          <div className="log-meta">
            <span className="log-timestamp">
              {formatTimestamp(log.timestamp, 'time')}
            </span>
            {log.context?.table && (
              <span className="log-table badge badge-secondary">
                {log.context.table}
              </span>
            )}
            {log.context?.user && (
              <span className="log-user">👤 {log.context.user}</span>
            )}
          </div>
        </div>

        <button className="log-expand-btn">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="log-entry-details">
          {log.context && (
            <div className="log-detail-section">
              <h4 className="log-detail-title">Context:</h4>
              <pre className="log-detail-content">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}

          {log.stackTrace && (
            <div className="log-detail-section">
              <h4 className="log-detail-title">Stack Trace:</h4>
              <pre className="log-detail-content stack-trace">
                {log.stackTrace}
              </pre>
            </div>
          )}

          <div className="log-detail-actions">
            <button
              className="btn btn-ghost btn-small"
              onClick={() => copyToClipboard(log.message)}
            >
              Copy Message
            </button>
            <button
              className="btn btn-ghost btn-small"
              onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
            >
              Copy Full Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogEntry;