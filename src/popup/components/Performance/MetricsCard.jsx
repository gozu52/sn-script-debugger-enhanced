import React from 'react';

function MetricsCard({ title, value, unit, icon, trend, color = 'primary' }) {
  return (
    <div className={`metrics-card metrics-card-${color}`}>
      <div className="metrics-card-header">
        <span className="metrics-card-icon">{icon}</span>
        <h3 className="metrics-card-title">{title}</h3>
      </div>
      
      <div className="metrics-card-body">
        <div className="metrics-card-value">
          {value}
          {unit && <span className="metrics-card-unit">{unit}</span>}
        </div>
        
        {trend && (
          <div className={`metrics-card-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsCard;