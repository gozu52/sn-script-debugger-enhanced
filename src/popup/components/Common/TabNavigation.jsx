/**
 * Tab Navigation Component
 */

import React from 'react';
import { UI_CONFIG } from '../../../shared/constants/config';
import './Common.css';

const TABS = [
  { id: UI_CONFIG.TABS.LOGS, label: 'Logs', icon: '📋' },
  { id: UI_CONFIG.TABS.QUERY_BUILDER, label: 'Query Builder', icon: '🔧' },
  { id: UI_CONFIG.TABS.SNIPPETS, label: 'Snippets', icon: '📝' },
  { id: UI_CONFIG.TABS.PERFORMANCE, label: 'Performance', icon: '⚡' },
  { id: UI_CONFIG.TABS.SETTINGS, label: 'Settings', icon: '⚙️' },
];

function TabNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="tab-navigation">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;