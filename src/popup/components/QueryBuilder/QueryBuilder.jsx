import React from 'react';
import './QueryBuilder.css';

function QueryBuilder({ onToast }) {
  return (
    <div className="query-builder">
      <div className="empty-state">
        <div className="empty-state-icon">🔧</div>
        <h3 className="empty-state-title">Query Builder</h3>
        <p className="empty-state-description">
          Query builder component will be implemented here
        </p>
      </div>
    </div>
  );
}

export default QueryBuilder;