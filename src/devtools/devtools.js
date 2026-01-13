/**
 * DevTools Entry Point
 * Chrome DevToolsにパネルを追加
 */

console.log('[DevTools] Initializing...');

// ServiceNowページの場合のみパネルを作成
chrome.devtools.inspectedWindow.eval(
  "window.location.href.includes('.service-now.com') || window.location.href.includes('.servicenow.com')",
  (result, isException) => {
    if (isException) {
      console.error('[DevTools] Error checking page:', isException);
      return;
    }

    if (result) {
      // SN Debuggerパネルを作成
      chrome.devtools.panels.create(
        'SN Debugger',
        'icons/icon16.png',
        'panel.html',
        (panel) => {
          console.log('[DevTools] Panel created');

          panel.onShown.addListener((panelWindow) => {
            console.log('[DevTools] Panel shown');
            panelWindow.onPanelShown && panelWindow.onPanelShown();
          });

          panel.onHidden.addListener(() => {
            console.log('[DevTools] Panel hidden');
          });
        }
      );
    } else {
      console.log('[DevTools] Not a ServiceNow page, skipping panel creation');
    }
  }
);