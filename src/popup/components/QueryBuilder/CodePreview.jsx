// src/popup/components/QueryBuilder/CodePreview.jsx
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Button from '../Common/Button';

function CodePreview({ code, onCopy }) {
  return (
    <div className="code-preview">
      <div className="code-preview-header">
        <h3 className="code-preview-title">Generated Code:</h3>
        <Button size="small" onClick={onCopy}>
          📋 Copy Code
        </Button>
      </div>

      <div className="code-preview-content">
        <SyntaxHighlighter
          language="javascript"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {code || '// Select a table to generate code'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodePreview;