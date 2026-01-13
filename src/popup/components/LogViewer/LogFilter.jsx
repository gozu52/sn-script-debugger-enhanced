/**
 * Log Filter Component
 */

import React, { useState } from 'react';
import Button from '../Common/Button';
import { LOG_CONFIG } from '../../../shared/constants/config';

function LogFilter({ filters, onFilterChange, onReset }) {
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [selectedLevels, setSelectedLevels] = useState(filters.levels || []);
  const [table, setTable] = useState(filters.table || '');

  const levels = Object.values(LOG_CONFIG.LEVELS);

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleKeywordSubmit = () => {
    onFilterChange({ keyword });
  };

  const handleLevelToggle = (level) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter(l => l !== level)
      : [...selectedLevels, level];
    
    setSelectedLevels(newLevels);
    onFilterChange({ levels: newLevels.length > 0 ? newLevels : undefined });
  };

  const handleTableChange = (e) => {
    const value = e.target.value;
    setTable(value);
    onFilterChange({ table: value || undefined });
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedLevels([]);
    setTable('');
    onReset();
  };

  return (
    <div className="log-filter">
      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Keyword:</label>
          <div className="filter-input-group">
            <input
              type="text"
              className="filter-input"
              placeholder="Search in messages..."
              value={keyword}
              onChange={handleKeywordChange}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSubmit()}
            />
            <Button size="small" onClick={handleKeywordSubmit}>
              Search
            </Button>
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Table:</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by table..."
            value={table}
            onChange={handleTableChange}
          />
        </div>

        <Button variant="ghost" size="small" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Levels:</label>
          <div className="filter-chips">
            {levels.map(level => (
              <button
                key={level}
                className={`filter-chip ${selectedLevels.includes(level) ? 'active' : ''} level-${level}`}
                onClick={() => handleLevelToggle(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogFilter;