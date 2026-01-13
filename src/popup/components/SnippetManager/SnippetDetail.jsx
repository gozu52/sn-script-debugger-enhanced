import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Button from '../Common/Button';
import { formatTimestamp } from '../../../shared/utils/date-utils';

function SnippetDetail({ snippet, onEdit, onDelete, onCopy, onInsert }) {
  if (!snippet) {
    return (
      <div className="snippet-detail-empty">
        <div className="empty-state-icon">📝</div>
        <h3 className="empty-state-title">No Snippet Selected</h3>
        <p className="empty-state-description">
          Select a snippet from the list to view details
        </p>
      </div>
    );
  }

  return (
    <div className="snippet-detail">
      <div className="snippet-detail-header">
        <div className="snippet-detail-title-section">
          <h2 className="snippet-detail-title">{snippet.title}</h2>
          {snippet.description && (
            <p className="snippet-detail-description">{snippet.description}</p>
          )}
        </div>
        
        <div className="snippet-detail-actions">
          <Button size="small" onClick={() => onCopy(snippet.code)}>
            📋 Copy
          </Button>
          <Button size="small" onClick={() => onInsert(snippet.code)}>
            ➕ Insert
          </Button>
          <Button size="small" variant="ghost" onClick={() => onEdit(snippet)}>
            ✏️ Edit
          </Button>
          <Button size="small" variant="danger" onClick={() => onDelete(snippet.id)}>
            🗑️ Delete
          </Button>
        </div>
      </div>

      <div className="snippet-detail-code">
        <SyntaxHighlighter
          language="javascript"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>

      <div className="snippet-detail-meta">
        <div className="snippet-meta-row">
          <span className="snippet-meta-label">Category:</span>
          <span className="badge badge-secondary">{snippet.category}</span>
        </div>
        
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="snippet-meta-row">
            <span className="snippet-meta-label">Tags:</span>
            <div className="snippet-meta-tags">
              {snippet.tags.map(tag => (
                <span key={tag} className="badge badge-primary">{tag}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="snippet-meta-row">
          <span className="snippet-meta-label">Created:</span>
          <span className="snippet-meta-value">
            {formatTimestamp(snippet.created, 'datetime')}
          </span>
        </div>
        
        <div className="snippet-meta-row">
          <span className="snippet-meta-label">Updated:</span>
          <span className="snippet-meta-value">
            {formatTimestamp(snippet.updated, 'datetime')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SnippetDetail;