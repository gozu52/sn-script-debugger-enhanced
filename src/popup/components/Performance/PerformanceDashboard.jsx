import React from 'react';
import './Performance.css';

function PerformanceDashboard({ onToast }) {
  return (
    <div className="performance-dashboard">
      <div className="empty-state">
        <div className="empty-state-icon">⚡</div>
        <h3 className="empty-state-title">Performance Dashboard</h3>
        <p className="empty-state-description">
          Performance dashboard component will be implemented here
        </p>
      </div>
    </div>
  );
}

export default PerformanceDashboard;