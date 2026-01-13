import React from 'react';
import './SnippetManager.css';

function SnippetManager({ onToast }) {
  return (
    <div className="snippet-manager">
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <h3 className="empty-state-title">Snippet Manager</h3>
        <p className="empty-state-description">
          Snippet manager component will be implemented here
        </p>
      </div>
    </div>
  );
}

export default SnippetManager;