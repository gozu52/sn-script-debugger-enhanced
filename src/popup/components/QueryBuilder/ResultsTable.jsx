// src/popup/components/QueryBuilder/ResultsTable.jsx
import React from 'react';

function ResultsTable({ results }) {
  if (!results || !results.data || results.data.length === 0) {
    return (
      <div className="results-empty">
        <p>No results yet. Click "Execute Query" to see results.</p>
      </div>
    );
  }

  const columns = Object.keys(results.data[0]);

  return (
    <div className="results-table-container">
      <div className="results-header">
        <h3 className="results-title">
          Results ({results.count} {results.count === 1 ? 'record' : 'records'})
        </h3>
      </div>

      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.data.map((row, index) => (
              <tr key={index}>
                {columns.map(col => (
                  <td key={col}>
                    {typeof row[col] === 'object'
                      ? JSON.stringify(row[col])
                      : String(row[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;