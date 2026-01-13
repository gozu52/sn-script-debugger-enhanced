console.log('[Background] Service Worker started');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Installed:', details.reason);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message:', message);
  sendResponse({ success: true });
  return true;
});

console.log('[Background] Initialized');
