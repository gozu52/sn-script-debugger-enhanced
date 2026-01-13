/**
 * Popup Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/global.css';

console.log('[Popup] Initializing...');

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[Popup] Initialized');