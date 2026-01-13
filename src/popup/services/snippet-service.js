/**
 * Snippet Service
 * スニペット管理のAPI通信
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types';

class SnippetService {
  /**
   * スニペット一覧を取得
   */
  async getSnippets(filters = {}) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_SNIPPETS,
      filters,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get snippets');
  }

  /**
   * スニペットを保存
   */
  async saveSnippet(snippet) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.SAVE_SNIPPET,
      snippet,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to save snippet');
  }

  /**
   * スニペットを削除
   */
  async deleteSnippet(id) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.DELETE_SNIPPET,
      id,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to delete snippet');
  }

  /**
   * スニペットをエクスポート
   */
  async exportSnippets(ids = null) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.EXPORT_SNIPPETS,
      ids,
    });

    if (response.type === 'SUCCESS') {
      return response.data.data;
    }

    throw new Error(response.error?.message || 'Failed to export snippets');
  }

  /**
   * スニペットをインポート
   */
  async importSnippets(jsonData, replaceExisting = false) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.IMPORT_SNIPPETS,
      jsonData,
      replaceExisting,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to import snippets');
  }

  /**
   * ファイルとしてダウンロード
   */
  downloadSnippets(data) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sn-snippets-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * クリップボードにコピー
   */
  async copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
  }

  /**
   * エディタに挿入
   */
  async insertIntoEditor(code) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.INSERT_CODE,
      code,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to insert code');
  }
}

export const snippetService = new SnippetService();