// src/popup/components/QueryBuilder/ConditionBuilder.jsx
import React from 'react';
import Button from '../Common/Button';

const OPERATORS = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'LIKE', label: 'LIKE' },
  { value: 'IN', label: 'IN' },
  { value: 'STARTSWITH', label: 'STARTSWITH' },
  { value: 'ENDSWITH', label: 'ENDSWITH' },
  { value: 'CONTAINS', label: 'CONTAINS' },
];

function ConditionBuilder({
  conditions,
  fields,
  onAdd,
  onUpdate,
  onRemove,
}) {
  return (
    <div className="condition-builder">
      <div className="condition-header">
        <label className="condition-label">Conditions:</label>
        <Button size="small" onClick={onAdd}>
          + Add Condition
        </Button>
      </div>

      <div className="condition-list">
        {conditions.map((condition, index) => (
          <div key={index} className="condition-row">
            <select
              className="condition-field"
              value={condition.field}
              onChange={(e) => onUpdate(index, { field: e.target.value })}
            >
              <option value="">Select field...</option>
              {fields.map(field => (
                <option key={field.name} value={field.name}>
                  {field.label} ({field.name})
                </option>
              ))}
            </select>

            <select
              className="condition-operator"
              value={condition.operator}
              onChange={(e) => onUpdate(index, { operator: e.target.value })}
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="condition-value"
              placeholder="Value"
              value={condition.value}
              onChange={(e) => onUpdate(index, { value: e.target.value })}
            />

            <button
              className="condition-remove"
              onClick={() => onRemove(index)}
              disabled={conditions.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConditionBuilder;