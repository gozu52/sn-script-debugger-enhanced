import React from 'react';
import './Settings.css';

function Settings({ onToast }) {
  return (
    <div className="settings">
      <div className="empty-state">
        <div className="empty-state-icon">⚙️</div>
        <h3 className="empty-state-title">Settings</h3>
        <p className="empty-state-description">
          Settings component will be implemented here
        </p>
      </div>
    </div>
  );
}

export default Settings;