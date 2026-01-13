import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import GeneralSettings from './GeneralSettings';
import FilterSettings from './FilterSettings';
import ExportImport from './ExportImport';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import './Settings.css';

function Settings({ onToast }) {
  const {
    settings,
    loading,
    error,
    reload,
    updateSettings,
    updateSetting,
    exportSettings,
    importSettings,
  } = useSettings();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdateSetting = async (path, value) => {
    const success = await updateSetting(path, value);
    
    if (success) {
      onToast({
        type: 'success',
        message: 'Setting updated',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to update setting',
      });
    }
  };

  const handleExport = () => {
    const success = exportSettings();
    
    if (success) {
      onToast({
        type: 'success',
        message: 'Settings exported',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to export settings',
      });
    }
  };

  const handleImport = async (file) => {
    try {
      await importSettings(file);
      onToast({
        type: 'success',
        message: 'Settings imported successfully',
      });
    } catch (err) {
      onToast({
        type: 'error',
        message: 'Failed to import settings',
      });
    }
  };

  const handleReset = async () => {
    // デフォルト設定にリセット（実装は後で）
    setShowResetConfirm(false);
    onToast({
      type: 'info',
      message: 'Settings reset to defaults',
    });
  };

  if (loading) {
    return (
      <div className="settings">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3 className="empty-state-title">Error</h3>
          <p className="empty-state-description">{error}</p>
          <Button onClick={reload}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <div className="settings-actions">
          <Button size="small" variant="ghost" onClick={reload}>
            ↻ Refresh
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="settings-content">
        <GeneralSettings
          settings={settings}
          onUpdate={handleUpdateSetting}
        />

        <div className="settings-divider" />

        <FilterSettings
          settings={settings}
          onUpdate={handleUpdateSetting}
        />

        <div className="settings-divider" />

        <ExportImport
          onExport={handleExport}
          onImport={handleImport}
        />

        <div className="settings-divider" />

        <div className="settings-section">
          <h3 className="settings-section-title">About</h3>
          <div className="settings-group">
            <p className="settings-description">
              <strong>Script Debugger Enhanced for ServiceNow</strong>
              <br />
              Version 1.0.0
              <br />
              Advanced debugging and development tools for ServiceNow
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Settings"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset
            </Button>
          </>
        }
      >
        <p>Are you sure you want to reset all settings to defaults? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default Settings;