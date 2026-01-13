import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatTimestamp } from '../../../shared/utils/date-utils';

function TimelineChart({ measurements }) {
  if (!measurements || measurements.length === 0) {
    return (
      <div className="timeline-chart-empty">
        <p>No performance data available</p>
      </div>
    );
  }

  // 最新20件のデータをチャート用に変換
  const chartData = measurements
    .slice(0, 20)
    .reverse()
    .map(m => ({
      time: formatTimestamp(m.timestamp, 'time'),
      duration: m.duration,
    }));

  return (
    <div className="timeline-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="duration" 
            stroke="#0066cc" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimelineChart;