// src/popup/components/QueryBuilder/TableSelector.jsx
import React from 'react';

function TableSelector({ tables, selectedTable, onChange }) {
  return (
    <div className="table-selector">
      <label className="selector-label">Table:</label>
      <select
        className="selector-input"
        value={selectedTable}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a table...</option>
        {tables.map(table => (
          <option key={table.name} value={table.name}>
            {table.label} ({table.name})
          </option>
        ))}
      </select>
    </div>
  );
}

export default TableSelector;