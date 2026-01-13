import React from 'react';

function SnippetList({ snippets, selectedSnippet, onSelect, filters, onFilterChange }) {
  return (
    <div className="snippet-list-container">
      <div className="snippet-list-header">
        <input
          type="text"
          className="snippet-search"
          placeholder="Search snippets..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        
        <select
          className="snippet-category-filter"
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="gliderecord">GlideRecord</option>
          <option value="client_script">Client Script</option>
          <option value="ui_script">UI Script</option>
          <option value="business_rule">Business Rule</option>
          <option value="script_include">Script Include</option>
          <option value="rest_api">REST API</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="snippet-list">
        {snippets.length === 0 ? (
          <div className="snippet-list-empty">
            <p>No snippets found</p>
          </div>
        ) : (
          snippets.map(snippet => (
            <div
              key={snippet.id}
              className={`snippet-list-item ${selectedSnippet?.id === snippet.id ? 'selected' : ''}`}
              onClick={() => onSelect(snippet)}
            >
              <h4 className="snippet-item-title">{snippet.title}</h4>
              {snippet.description && (
                <p className="snippet-item-description">{snippet.description}</p>
              )}
              <div className="snippet-item-meta">
                <span className="badge badge-secondary">{snippet.category}</span>
                {snippet.tags?.map(tag => (
                  <span key={tag} className="badge badge-primary">{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SnippetList;