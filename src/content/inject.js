/**
 * Inject Script - ページコンテキストで実行
 * ServiceNowのネイティブAPIをフックしてログやパフォーマンスデータをキャプチャ
 */

(function() {
  'use strict';
  
  console.log('[Inject Script] Initializing in page context...');
  
  // ========== グローバル状態 ==========
  
  const state = {
    enabled: true,
    sessionId: generateSessionId(),
  };
  
  // ========== ユーティリティ関数 ==========
  
  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  function getCurrentContext() {
    return {
      table: getCurrentTable(),
      recordId: getCurrentRecordId(),
      user: window.g_user?.userName || null,
      sessionId: state.sessionId,
    };
  }
  
  function getCurrentTable() {
    const tableInput = document.querySelector('input[name="sys_target_table"]');
    return tableInput?.value || null;
  }
  
  function getCurrentRecordId() {
    const sysIdInput = document.querySelector('input[name="sys_id"]');
    return sysIdInput?.value || null;
  }
  
  function sendToContentScript(type, data) {
    window.postMessage({ type, data }, '*');
  }
  
  // ========== gs.log() のフック ==========
  
  if (window.gs) {
    const originalMethods = {
      log: window.gs.log,
      info: window.gs.info,
      error: window.gs.error,
      warn: window.gs.warn,
      debug: window.gs.debug,
    };
    
    function createLogInterceptor(level, originalMethod) {
      return function(...args) {
        if (state.enabled) {
          const logEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level: level,
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
            stackTrace: new Error().stack,
            url: window.location.href,
            context: getCurrentContext(),
          };
          
          sendToContentScript('SN_DEBUG_LOG', logEntry);
        }
        
        // オリジナルのメソッドも実行
        if (originalMethod) {
          return originalMethod.apply(this, args);
        }
      };
    }
    
    window.gs.log = createLogInterceptor('log', originalMethods.log);
    window.gs.info = createLogInterceptor('info', originalMethods.info);
    window.gs.error = createLogInterceptor('error', originalMethods.error);
    window.gs.warn = createLogInterceptor('warn', originalMethods.warn);
    window.gs.debug = createLogInterceptor('debug', originalMethods.debug);
    
    console.log('[Inject Script] gs.log() methods hooked');
  }
  
  // ========== console.log() のフック ==========
  
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };
  
  function createConsoleInterceptor(level, originalMethod) {
    return function(...args) {
      if (state.enabled) {
        const logEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          level: level,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          stackTrace: new Error().stack,
          url: window.location.href,
          context: getCurrentContext(),
        };
        
        sendToContentScript('SN_DEBUG_CONSOLE', logEntry);
      }
      
      return originalMethod.apply(console, args);
    };
  }
  
  console.log = createConsoleInterceptor('log', originalConsole.log);
  console.error = createConsoleInterceptor('error', originalConsole.error);
  console.warn = createConsoleInterceptor('warn', originalConsole.warn);
  console.info = createConsoleInterceptor('info', originalConsole.info);
  
  console.log('[Inject Script] console methods hooked');
  
  // ========== Content Scriptからのメッセージを受信 ==========
  
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const { type, action, data } = event.data;
    
    if (type === 'SN_DEBUG_FROM_CONTENT') {
      switch (action) {
        case 'DEBUGGER_ENABLED':
          state.enabled = true;
          console.log('[Inject Script] Debugger enabled');
          break;
        
        case 'DEBUGGER_DISABLED':
          state.enabled = false;
          console.log('[Inject Script] Debugger disabled');
          break;
      }
    }
  });
  
  console.log('[Inject Script] Initialized successfully');
  
})();