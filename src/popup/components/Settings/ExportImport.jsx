import React, { useRef } from 'react';
import Button from '../Common/Button';

function ExportImport({ onExport, onImport }) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = '';
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Import / Export</h3>

      <div className="settings-group">
        <label className="settings-label">Export Settings</label>
        <p className="settings-description">
          Download your current settings as a JSON file
        </p>
        <Button onClick={onExport}>
          📤 Export Settings
        </Button>
      </div>

      <div className="settings-group">
        <label className="settings-label">Import Settings</label>
        <p className="settings-description">
          Import settings from a previously exported JSON file
        </p>
        <Button onClick={handleImportClick}>
          📥 Import Settings
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="settings-group">
        <div className="settings-warning">
          <span className="warning-icon">⚠️</span>
          <div>
            <strong>Note:</strong> Importing settings will overwrite your current configuration.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportImport;