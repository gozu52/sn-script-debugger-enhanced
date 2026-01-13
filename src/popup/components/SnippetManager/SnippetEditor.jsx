import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';

function SnippetEditor({ isOpen, snippet, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    category: 'gliderecord',
    tags: [],
    language: 'javascript',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (snippet) {
      setFormData({
        ...snippet,
        tags: snippet.tags || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        code: '',
        category: 'gliderecord',
        tags: [],
        language: 'javascript',
      });
    }
  }, [snippet, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.code.trim()) {
      alert('Title and Code are required');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={snippet ? 'Edit Snippet' : 'New Snippet'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save
          </Button>
        </>
      }
    >
      <div className="snippet-editor">
        <div className="editor-field">
          <label className="editor-label">Title *</label>
          <input
            type="text"
            className="editor-input"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter snippet title"
          />
        </div>

        <div className="editor-field">
          <label className="editor-label">Description</label>
          <textarea
            className="editor-textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter description (optional)"
          />
        </div>

        <div className="editor-field">
          <label className="editor-label">Category *</label>
          <select
            className="editor-select"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="gliderecord">GlideRecord</option>
            <option value="client_script">Client Script</option>
            <option value="ui_script">UI Script</option>
            <option value="business_rule">Business Rule</option>
            <option value="script_include">Script Include</option>
            <option value="rest_api">REST API</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="editor-field">
          <label className="editor-label">Code *</label>
          <textarea
            className="editor-textarea editor-code"
            rows={10}
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="Enter your code here"
            style={{ fontFamily: 'var(--font-family-mono)' }}
          />
        </div>

        <div className="editor-field">
          <label className="editor-label">Tags</label>
          <div className="editor-tags">
            {formData.tags.map(tag => (
              <span key={tag} className="editor-tag">
                {tag}
                <button
                  className="editor-tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="editor-tag-input-group">
            <input
              type="text"
              className="editor-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag and press Enter"
            />
            <Button size="small" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SnippetEditor;