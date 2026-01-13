/**
 * Header Component
 */

import React from 'react';
import './Common.css';

function Header({ status }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="header-icon">🔍</span>
          SN Debugger
        </h1>
      </div>

      <div className="header-right">
        <div className="status-indicators">
          <div className="status-indicator">
            <span className="status-label">Logs:</span>
            <span className="status-value">{status.logCount}</span>
          </div>
          <div className="status-indicator">
            <span className="status-label">Snippets:</span>
            <span className="status-value">{status.snippetCount}</span>
          </div>
        </div>

        <div className={`status-badge ${status.enabled ? 'active' : 'inactive'}`}>
          {status.enabled ? '● Active' : '○ Inactive'}
        </div>
      </div>
    </header>
  );
}

export default Header;