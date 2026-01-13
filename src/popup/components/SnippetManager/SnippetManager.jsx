import React, { useState, useRef } from 'react';
import { useSnippets } from '../../hooks/useSnippets';
import SnippetList from './SnippetList';
import SnippetDetail from './SnippetDetail';
import SnippetEditor from './SnippetEditor';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import './SnippetManager.css';

function SnippetManager({ onToast }) {
  const {
    snippets,
    tags,
    selectedSnippet,
    setSelectedSnippet,
    filters,
    updateFilters,
    resetFilters,
    loading,
    error,
    reload,
    saveSnippet,
    deleteSnippet,
    exportSnippets,
    importSnippets,
    copyToClipboard,
    insertIntoEditor,
  } = useSnippets();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const fileInputRef = useRef(null);

  const handleNewSnippet = () => {
    setEditingSnippet(null);
    setIsEditorOpen(true);
  };

  const handleEditSnippet = (snippet) => {
    setEditingSnippet(snippet);
    setIsEditorOpen(true);
  };

  const handleSaveSnippet = async (snippetData) => {
    try {
      await saveSnippet(snippetData);
      onToast({
        type: 'success',
        message: editingSnippet ? 'Snippet updated' : 'Snippet created',
      });
      setIsEditorOpen(false);
    } catch (err) {
      onToast({
        type: 'error',
        message: err.message,
      });
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteSnippet(deleteTargetId);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (success) {
      onToast({
        type: 'success',
        message: 'Snippet deleted',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to delete snippet',
      });
    }
  };

  const handleCopy = async (code) => {
    const success = await copyToClipboard(code);
    if (success) {
      onToast({
        type: 'success',
        message: 'Code copied to clipboard',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to copy code',
      });
    }
  };

  const handleInsert = async (code) => {
    const success = await insertIntoEditor(code);
    if (success) {
      onToast({
        type: 'success',
        message: 'Code inserted into editor',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to insert code',
      });
    }
  };

  const handleExport = async () => {
    const success = await exportSnippets();
    if (success) {
      onToast({
        type: 'success',
        message: 'Snippets exported',
      });
    } else {
      onToast({
        type: 'error',
        message: 'Failed to export snippets',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importSnippets(file);
      onToast({
        type: 'success',
        message: `Imported ${result.count} snippets`,
      });
      event.target.value = '';
    } catch (err) {
      onToast({
        type: 'error',
        message: err.message,
      });
    }
  };

  return (
    <div className="snippet-manager">
      <div className="snippet-manager-toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">
            Snippets ({snippets.length})
          </h2>
        </div>

        <div className="toolbar-right">
          <Button size="small" variant="primary" onClick={handleNewSnippet}>
            ➕ New Snippet
          </Button>
          <Button size="small" variant="ghost" onClick={handleImportClick}>
            📥 Import
          </Button>
          <Button size="small" variant="ghost" onClick={handleExport}>
            📤 Export
          </Button>
          <Button size="small" onClick={reload} disabled={loading}>
            {loading ? '⟳' : '↻'} Refresh
          </Button>
        </div>
      </div>

      <div className="snippet-manager-content">
        <div className="snippet-manager-sidebar">
          <SnippetList
            snippets={snippets}
            selectedSnippet={selectedSnippet}
            onSelect={setSelectedSnippet}
            filters={filters}
            onFilterChange={updateFilters}
          />
        </div>

        <div className="snippet-manager-main">
          {error && (
            <div className="snippet-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
            </div>
          )}

          <SnippetDetail
            snippet={selectedSnippet}
            onEdit={handleEditSnippet}
            onDelete={handleDeleteClick}
            onCopy={handleCopy}
            onInsert={handleInsert}
          />
        </div>
      </div>

      <SnippetEditor
        isOpen={isEditorOpen}
        snippet={editingSnippet}
        onSave={handleSaveSnippet}
        onClose={() => setIsEditorOpen(false)}
      />

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Snippet"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this snippet? This action cannot be undone.</p>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </div>
  );
}

export default SnippetManager;