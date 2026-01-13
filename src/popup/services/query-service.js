// src/popup/services/query-service.js
/**
 * Query Service
 * ServiceNow API との通信を抽象化
 */

import { MESSAGE_TYPES } from '../../shared/constants/message-types';

class QueryService {
  /**
   * テーブル一覧を取得
   */
  async getTables() {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_TABLES,
    });

    if (response.type === 'SUCCESS') {
      return response.data || [];
    }

    throw new Error(response.error?.message || 'Failed to get tables');
  }

  /**
   * テーブルのフィールド一覧を取得
   */
  async getFields(table) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.GET_FIELDS,
      table,
    });

    if (response.type === 'SUCCESS') {
      return response.data || [];
    }

    throw new Error(response.error?.message || 'Failed to get fields');
  }

  /**
   * クエリを実行
   */
  async executeQuery(table, conditions) {
    const response = await chrome.runtime.sendMessage({
      action: MESSAGE_TYPES.EXECUTE_QUERY,
      table,
      conditions,
    });

    if (response.type === 'SUCCESS') {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to execute query');
  }

  /**
   * クエリコードを生成
   */
  generateCode(table, conditions, options = {}) {
    const { includeComments = true, useEncodedQuery = false } = options;

    let code = '';

    if (includeComments) {
      code += `// Query ${table}\n`;
    }

    code += `var gr = new GlideRecord('${table}');\n`;

    if (useEncodedQuery && conditions.length > 0) {
      // Encoded Query形式
      const encodedQuery = conditions
        .filter(c => c.field && c.value)
        .map(c => `${c.field}${c.operator || ''}${c.value}`)
        .join('^');
      
      code += `gr.addEncodedQuery('${encodedQuery}');\n`;
    } else {
      // 個別のaddQuery
      conditions.forEach(cond => {
        if (cond.field && cond.value) {
          const operator = cond.operator === '=' ? '' : cond.operator;
          code += `gr.addQuery('${cond.field}', '${operator}', '${cond.value}');\n`;
        }
      });
    }

    code += `gr.query();\n`;
    code += `while (gr.next()) {\n`;
    code += `  // Process record\n`;
    code += `  gs.info(gr.getValue('sys_id'));\n`;
    code += `}\n`;

    if (includeComments) {
      code += `\n// Total records: gr.getRowCount()`;
    }

    return code;
  }
}

export const queryService = new QueryService();