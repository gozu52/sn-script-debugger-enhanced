import React from 'react';
import './LogViewer.css';

function LogViewer({ onToast }) {
  return (
    <div className="log-viewer">
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3 className="empty-state-title">Log Viewer</h3>
        <p className="empty-state-description">
          Log viewer component will be implemented here
        </p>
      </div>
    </div>
  );
}

export default LogViewer;