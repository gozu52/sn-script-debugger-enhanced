/**
 * Script Injector
 * inject.jsをページのコンテキストに注入するヘルパー
 */

/**
 * スクリプトをページに注入
 * @param {string} scriptPath - Chrome Extension内のスクリプトパス
 */
export function injectScript(scriptPath) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(scriptPath);
  script.type = 'text/javascript';
  
  script.onload = function() {
    console.log(`[Injector] Script loaded: ${scriptPath}`);
    this.remove(); // 注入後は削除
  };
  
  script.onerror = function() {
    console.error(`[Injector] Failed to load script: ${scriptPath}`);
    this.remove();
  };
  
  // できるだけ早く注入
  const target = document.head || document.documentElement;
  target.insertBefore(script, target.firstChild);
}

/**
 * インラインスクリプトを注入
 * @param {string} code - 実行するコード
 */
export function injectInlineScript(code) {
  const script = document.createElement('script');
  script.textContent = code;
  
  const target = document.head || document.documentElement;
  target.appendChild(script);
  script.remove();
}

/**
 * 複数のスクリプトを順番に注入
 * @param {string[]} scriptPaths
 */
export async function injectScriptsSequentially(scriptPaths) {
  for (const path of scriptPaths) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(path);
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        console.error(`[Injector] Failed to load: ${path}`);
        script.remove();
        resolve(); // 失敗しても続行
      };
      
      (document.head || document.documentElement).appendChild(script);
    });
  }
}