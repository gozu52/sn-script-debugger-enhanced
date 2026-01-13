/**
 * テーブル検出ヘルパー
 * ServiceNowのテーブル情報を検出・管理
 */

export class TableDetector {
  constructor() {
    this.knownTables = new Set();
    this.tableMetadata = new Map();
  }

  /**
   * テーブル名を検出
   * @param {string} context - 'form' | 'list' | 'script' | 'api'
   * @returns {string|null}
   */
  detectTable(context = 'auto') {
    switch (context) {
      case 'form':
        return this.detectFromForm();
      case 'list':
        return this.detectFromList();
      case 'script':
        return this.detectFromScript();
      case 'api':
        return this.detectFromAPI();
      case 'auto':
      default:
        return this.detectFromForm() ||
               this.detectFromList() ||
               this.detectFromScript() ||
               null;
    }
  }

  /**
   * フォームからテーブルを検出
   * @returns {string|null}
   */
  detectFromForm() {
    // sys_target_table hidden input
    const tableInput = document.querySelector('input[name="sys_target_table"]');
    if (tableInput?.value) {
      this.registerTable(tableInput.value);
      return tableInput.value;
    }

    return null;
  }

  /**
   * リストビューからテーブルを検出
   * @returns {string|null}
   */
  detectFromList() {
    // data-list-table attribute
    const listElement = document.querySelector('[data-list-table]');
    if (listElement) {
      const table = listElement.getAttribute('data-list-table');
      this.registerTable(table);
      return table;
    }

    // List header
    const listHeader = document.querySelector('.list_header_title');
    if (listHeader) {
      const table = this.extractTableFromText(listHeader.textContent);
      if (table) {
        this.registerTable(table);
        return table;
      }
    }

    return null;
  }

  /**
   * スクリプトからテーブルを検出（GlideRecord呼び出し）
   * @returns {string|null}
   */
  detectFromScript() {
    // この関数は主にinject.jsから呼ばれることを想定
    return null;
  }

  /**
   * API URLからテーブルを検出
   * @returns {string|null}
   */
  detectFromAPI() {
    const urlMatch = window.location.pathname.match(/\/api\/now\/table\/([^/?]+)/);
    if (urlMatch) {
      const table = urlMatch[1];
      this.registerTable(table);
      return table;
    }

    return null;
  }

  /**
   * テキストからテーブル名を抽出
   * @param {string} text
   * @returns {string|null}
   */
  extractTableFromText(text) {
    // "Incident [incident]" のような形式
    const match = text.match(/\[([a-z_0-9]+)\]/i);
    return match ? match[1] : null;
  }

  /**
   * テーブルを登録
   * @param {string} tableName
   */
  registerTable(tableName) {
    if (!tableName) return;

    this.knownTables.add(tableName);

    // メタデータがなければ取得を試みる
    if (!this.tableMetadata.has(tableName)) {
      this.fetchTableMetadata(tableName);
    }
  }

  /**
   * テーブルのメタデータを取得
   * @param {string} tableName
   */
  async fetchTableMetadata(tableName) {
    try {
      const response = await fetch(
        `${window.location.origin}/api/now/table/sys_db_object?sysparm_query=name=${tableName}&sysparm_fields=name,label,super_class,number_ref`,
        {
          headers: {
            'X-UserToken': window.g_ck,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.result && data.result.length > 0) {
        const metadata = data.result[0];
        this.tableMetadata.set(tableName, {
          name: metadata.name,
          label: metadata.label,
          superClass: metadata.super_class?.value,
          numberRef: metadata.number_ref?.value,
          fetchedAt: Date.now(),
        });
      }
    } catch (error) {
      console.warn(`[TableDetector] Failed to fetch metadata for ${tableName}:`, error);
    }
  }

  /**
   * テーブルのラベルを取得
   * @param {string} tableName
   * @returns {string}
   */
  getTableLabel(tableName) {
    const metadata = this.tableMetadata.get(tableName);
    return metadata?.label || this.formatTableName(tableName);
  }

  /**
   * テーブル名をフォーマット
   * @param {string} tableName
   * @returns {string}
   */
  formatTableName(tableName) {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * テーブルの親クラスを取得
   * @param {string} tableName
   * @returns {string|null}
   */
  getSuperClass(tableName) {
    const metadata = this.tableMetadata.get(tableName);
    return metadata?.superClass || null;
  }

  /**
   * テーブルが特定の親クラスを継承しているかチェック
   * @param {string} tableName
   * @param {string} superClassName
   * @returns {boolean}
   */
  extendsTable(tableName, superClassName) {
    const superClass = this.getSuperClass(tableName);
    if (!superClass) return false;
    if (superClass === superClassName) return true;

    // 再帰的にチェック
    return this.extendsTable(superClass, superClassName);
  }

  /**
   * すべての既知テーブルを取得
   * @returns {Set<string>}
   */
  getKnownTables() {
    return new Set(this.knownTables);
  }

  /**
   * テーブルメタデータを取得
   * @param {string} tableName
   * @returns {object|null}
   */
  getMetadata(tableName) {
    return this.tableMetadata.get(tableName) || null;
  }

  /**
   * Taskテーブルかどうかをチェック
   * @param {string} tableName
   * @returns {boolean}
   */
  isTaskTable(tableName) {
    if (tableName === 'task') return true;
    return this.extendsTable(tableName, 'task');
  }

  /**
   * CMDBテーブルかどうかをチェック
   * @param {string} tableName
   * @returns {boolean}
   */
  isCMDBTable(tableName) {
    return tableName.startsWith('cmdb_') || this.extendsTable(tableName, 'cmdb_ci');
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.knownTables.clear();
    this.tableMetadata.clear();
  }
}

// シングルトンインスタンス
export const tableDetector = new TableDetector();