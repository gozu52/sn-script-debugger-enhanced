/**
 * スニペットデータのストレージ管理
 */

import { openDB } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_SNIPPETS,
  INDEX_NAMES,
} from '../../shared/constants/storage-keys.js';
import { SNIPPET_CONFIG } from '../../shared/constants/config.js';
import { migrateDatabase } from '../../shared/db/db-migrations.js';

class SnippetStorage {
  constructor() {
    this.dbPromise = this.initDB();
  }

  /**
   * データベースを初期化
   */
  async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        migrateDatabase(db, oldVersion, newVersion, transaction);
      },
    });
  }

  /**
   * スニペットを保存
   * @param {object} snippet
   * @returns {Promise<number>} スニペットID
   */
  async saveSnippet(snippet) {
    try {
      const db = await this.dbPromise;
      
      // バリデーション
      this.validateSnippet(snippet);
      
      const data = {
        ...snippet,
        created: snippet.created || Date.now(),
        updated: Date.now(),
      };
      
      if (snippet.id) {
        // 更新
        await db.put(STORE_SNIPPETS, data);
        return snippet.id;
      } else {
        // 新規作成
        const id = await db.add(STORE_SNIPPETS, data);
        return id;
      }
    } catch (error) {
      console.error('[SnippetStorage] Error saving snippet:', error);
      throw error;
    }
  }

  /**
   * スニペットのバリデーション
   * @param {object} snippet
   */
  validateSnippet(snippet) {
    if (!snippet.title || snippet.title.trim() === '') {
      throw new Error('Title is required');
    }
    
    if (!snippet.code || snippet.code.trim() === '') {
      throw new Error('Code is required');
    }
    
    if (snippet.code.length > SNIPPET_CONFIG.MAX_CODE_SIZE) {
      throw new Error(`Code size exceeds maximum (${SNIPPET_CONFIG.MAX_CODE_SIZE} bytes)`);
    }
    
    if (!snippet.category) {
      throw new Error('Category is required');
    }
  }

  /**
   * スニペットを検索
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async searchSnippets(filters = {}) {
    try {
      const db = await this.dbPromise;
      let snippets;
      
      // タグフィルターがある場合はインデックスを使用
      if (filters.tag) {
        const index = (await db.transaction(STORE_SNIPPETS).objectStore(STORE_SNIPPETS)).index(INDEX_NAMES.SNIPPETS.TAGS);
        snippets = await index.getAll(filters.tag);
      } else {
        snippets = await db.getAll(STORE_SNIPPETS);
      }
      
      // その他のフィルターを適用
      snippets = this.applyFilters(snippets, filters);
      
      // ソート
      snippets = this.sortSnippets(snippets, filters.sortBy, filters.sortOrder);
      
      return snippets;
    } catch (error) {
      console.error('[SnippetStorage] Error searching snippets:', error);
      throw error;
    }
  }

  /**
   * フィルターを適用
   * @param {object[]} snippets
   * @param {object} filters
   * @returns {object[]}
   */
  applyFilters(snippets, filters) {
    let filtered = snippets;
    
    // カテゴリフィルター
    if (filters.category) {
      filtered = filtered.filter(s => s.category === filters.category);
    }
    
    // キーワード検索
    if (filters.search) {
      const keyword = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(keyword) ||
        s.description?.toLowerCase().includes(keyword) ||
        s.code.toLowerCase().includes(keyword) ||
        s.tags?.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    
    // お気に入りフィルター
    if (filters.favoriteOnly) {
      filtered = filtered.filter(s => s.isFavorite);
    }
    
    return filtered;
  }

  /**
   * スニペットをソート
   * @param {object[]} snippets
   * @param {string} sortBy
   * @param {string} sortOrder
   * @returns {object[]}
   */
  sortSnippets(snippets, sortBy = 'updated', sortOrder = 'desc') {
    const sorted = [...snippets];
    
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created':
          aValue = a.created;
          bValue = b.created;
          break;
        case 'updated':
        default:
          aValue = a.updated;
          bValue = b.updated;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }

  /**
   * スニペットIDで取得
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async getSnippet(id) {
    try {
      const db = await this.dbPromise;
      return await db.get(STORE_SNIPPETS, id);
    } catch (error) {
      console.error('[SnippetStorage] Error getting snippet:', error);
      return null;
    }
  }

  /**
   * スニペットを削除
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteSnippet(id) {
    try {
      const db = await this.dbPromise;
      await db.delete(STORE_SNIPPETS, id);
      return true;
    } catch (error) {
      console.error('[SnippetStorage] Error deleting snippet:', error);
      return false;
    }
  }

  /**
   * すべてのスニペットをクリア
   * @returns {Promise<boolean>}
   */
  async clearAllSnippets() {
    try {
      const db = await this.dbPromise;
      await db.clear(STORE_SNIPPETS);
      console.log('[SnippetStorage] All snippets cleared');
      return true;
    } catch (error) {
      console.error('[SnippetStorage] Error clearing snippets:', error);
      return false;
    }
  }

  /**
   * スニペットをエクスポート
   * @param {number[]} ids - 指定しない場合は全件
   * @returns {Promise<string>}
   */
  async exportSnippets(ids = null) {
    try {
      const db = await this.dbPromise;
      let snippets;
      
      if (ids && ids.length > 0) {
        snippets = await Promise.all(ids.map(id => db.get(STORE_SNIPPETS, id)));
        snippets = snippets.filter(s => s !== undefined);
      } else {
        snippets = await db.getAll(STORE_SNIPPETS);
      }
      
      return JSON.stringify(snippets, null, 2);
    } catch (error) {
      console.error('[SnippetStorage] Error exporting snippets:', error);
      throw error;
    }
  }

  /**
   * スニペットをインポート
   * @param {string} jsonData
   * @param {boolean} replaceExisting
   * @returns {Promise<number>} インポート件数
   */
  async importSnippets(jsonData, replaceExisting = false) {
    try {
      const snippets = JSON.parse(jsonData);
      
      if (!Array.isArray(snippets)) {
        throw new Error('Invalid data format');
      }
      
      const db = await this.dbPromise;
      
      if (replaceExisting) {
        await db.clear(STORE_SNIPPETS);
      }
      
      const tx = db.transaction(STORE_SNIPPETS, 'readwrite');
      const store = tx.objectStore(STORE_SNIPPETS);
      
      let importCount = 0;
      for (const snippet of snippets) {
        // IDを削除して新規作成
        const data = { ...snippet };
        delete data.id;
        data.created = Date.now();
        data.updated = Date.now();
        
        try {
          this.validateSnippet(data);
          await store.add(data);
          importCount++;
        } catch (error) {
          console.warn('[SnippetStorage] Skipping invalid snippet:', error);
        }
      }
      
      await tx.done;
      
      console.log(`[SnippetStorage] Imported ${importCount} snippets`);
      return importCount;
    } catch (error) {
      console.error('[SnippetStorage] Error importing snippets:', error);
      throw error;
    }
  }

  /**
   * すべてのタグを取得
   * @returns {Promise<string[]>}
   */
  async getAllTags() {
    try {
      const db = await this.dbPromise;
      const snippets = await db.getAll(STORE_SNIPPETS);
      
      const tagsSet = new Set();
      snippets.forEach(snippet => {
        snippet.tags?.forEach(tag => tagsSet.add(tag));
      });
      
      return Array.from(tagsSet).sort();
    } catch (error) {
      console.error('[SnippetStorage] Error getting tags:', error);
      return [];
    }
  }
}

// シングルトンインスタンス
export const snippetStorage = new SnippetStorage();