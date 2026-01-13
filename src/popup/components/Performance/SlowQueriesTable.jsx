import React from 'react';
import { formatTimestamp, formatDuration } from '../../../shared/utils/date-utils';

function SlowQueriesTable({ queries }) {
  if (!queries || queries.length === 0) {
    return (
      <div className="slow-queries-empty">
        <p>No slow queries detected</p>
      </div>
    );
  }

  return (
    <div className="slow-queries-table-container">
      <table className="slow-queries-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Table</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr key={index} className={query.duration > 1000 ? 'critical' : 'warning'}>
              <td>{formatTimestamp(query.timestamp, 'time')}</td>
              <td>
                <span className="badge badge-secondary">{query.type}</span>
              </td>
              <td>{query.context?.table || query.url || 'N/A'}</td>
              <td className="duration-cell">
                {formatDuration(query.duration)}
              </td>
              <td>
                {query.status ? (
                  <span className={`status-badge status-${query.status >= 400 ? 'error' : 'success'}`}>
                    {query.status}
                  </span>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SlowQueriesTable;