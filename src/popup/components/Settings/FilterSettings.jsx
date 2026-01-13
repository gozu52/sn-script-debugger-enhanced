import React from 'react';

function FilterSettings({ settings, onUpdate }) {
  if (!settings) return null;

  const handleLevelToggle = (level) => {
    const currentLevels = settings.logs?.defaultLevels || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level];
    
    onUpdate('logs.defaultLevels', newLevels);
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Filter Settings</h3>

      <div className="settings-group">
        <label className="settings-label">Default Log Levels</label>
        <p className="settings-description">
          Select which log levels to capture by default
        </p>
        <div className="settings-chips">
          {['log', 'info', 'warn', 'error', 'debug'].map(level => (
            <button
              key={level}
              className={`settings-chip ${
                settings.logs?.defaultLevels?.includes(level) ? 'active' : ''
              }`}
              onClick={() => handleLevelToggle(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <input
            type="checkbox"
            checked={settings.masking?.enabled || false}
            onChange={(e) => onUpdate('masking.enabled', e.target.checked)}
          />
          <span>Enable Data Masking</span>
        </label>
        <p className="settings-description">
          Automatically mask sensitive data like passwords and tokens
        </p>
      </div>

      <div className="settings-group">
        <label className="settings-label">Performance Sampling Rate</label>
        <input
          type="range"
          className="settings-range"
          min="0"
          max="1"
          step="0.1"
          value={settings.performance?.samplingRate || 1}
          onChange={(e) => onUpdate('performance.samplingRate', parseFloat(e.target.value))}
        />
        <div className="settings-range-value">
          {Math.round((settings.performance?.samplingRate || 1) * 100)}%
        </div>
        <p className="settings-description">
          Percentage of operations to monitor (lower = less overhead)
        </p>
      </div>
    </div>
  );
}

export default FilterSettings;