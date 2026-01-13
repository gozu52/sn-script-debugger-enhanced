import React from 'react';

function GeneralSettings({ settings, onUpdate }) {
  if (!settings) return null;

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">General Settings</h3>

      <div className="settings-group">
        <label className="settings-label">
          <input
            type="checkbox"
            checked={settings.logs?.enabled || false}
            onChange={(e) => onUpdate('logs.enabled', e.target.checked)}
          />
          <span>Enable Log Capture</span>
        </label>
        <p className="settings-description">
          Capture gs.log() and console.log() calls from ServiceNow
        </p>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <input
            type="checkbox"
            checked={settings.performance?.enabled || false}
            onChange={(e) => onUpdate('performance.enabled', e.target.checked)}
          />
          <span>Enable Performance Monitoring</span>
        </label>
        <p className="settings-description">
          Monitor GlideRecord queries and API calls
        </p>
      </div>

      <div className="settings-group">
        <label className="settings-label">Log Retention (days)</label>
        <input
          type="number"
          className="settings-input"
          min="1"
          max="30"
          value={settings.logs?.retentionDays || 7}
          onChange={(e) => onUpdate('logs.retentionDays', parseInt(e.target.value))}
        />
        <p className="settings-description">
          Automatically delete logs older than this many days
        </p>
      </div>

      <div className="settings-group">
        <label className="settings-label">Max Logs</label>
        <input
          type="number"
          className="settings-input"
          min="100"
          max="50000"
          step="100"
          value={settings.logs?.maxLogs || 10000}
          onChange={(e) => onUpdate('logs.maxLogs', parseInt(e.target.value))}
        />
        <p className="settings-description">
          Maximum number of logs to store
        </p>
      </div>

      <div className="settings-group">
        <label className="settings-label">Slow Query Threshold (ms)</label>
        <input
          type="number"
          className="settings-input"
          min="100"
          max="5000"
          step="100"
          value={settings.performance?.slowQueryThreshold || 500}
          onChange={(e) => onUpdate('performance.slowQueryThreshold', parseInt(e.target.value))}
        />
        <p className="settings-description">
          Queries slower than this will be highlighted as slow
        </p>
      </div>
    </div>
  );
}

export default GeneralSettings;