/**
 * ServiceNowのバージョン検出ユーティリティ
 */

/**
 * ServiceNowのバージョンを検出
 * @param {string} instanceUrl
 * @returns {Promise<object>}
 */
export async function detectServiceNowVersion(instanceUrl) {
  try {
    // sys_properties テーブルからバージョン情報を取得
    const response = await fetch(
      `${instanceUrl}/api/now/table/sys_properties?sysparm_query=name=glide.war&sysparm_fields=value`,
      {
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      const versionString = data.result[0].value;
      return parseVersion(versionString);
    }
    
    return { version: 'unknown', release: 'unknown' };
    
  } catch (error) {
    console.error('[VersionDetector] Error detecting version:', error);
    return { version: 'unknown', release: 'unknown' };
  }
}

/**
 * バージョン文字列をパース
 * @param {string} versionString - 例: "glide-vancouver-12-20-2023__patch3-01-10-2024_01-09-2024_2350"
 * @returns {object}
 */
function parseVersion(versionString) {
  const releaseName = extractReleaseName(versionString);
  
  return {
    version: versionString,
    release: releaseName,
    fullString: versionString,
  };
}

/**
 * リリース名を抽出
 * @param {string} versionString
 * @returns {string}
 */
function extractReleaseName(versionString) {
  const releases = [
    'Xanadu',
    'Washington',
    'Vancouver',
    'Utah',
    'Tokyo',
    'San Diego',
    'Rome',
    'Quebec',
    'Paris',
    'Orlando',
    'New York',
    'Madrid',
    'London',
    'Kingston',
    'Jakarta',
    'Istanbul',
    'Helsinki',
    'Geneva',
    'Fuji',
    'Eureka',
  ];
  
  const lowerVersion = versionString.toLowerCase();
  
  for (const release of releases) {
    if (lowerVersion.includes(release.toLowerCase())) {
      return release;
    }
  }
  
  return 'Unknown';
}

/**
 * バージョン比較
 * @param {string} version1
 * @param {string} version2
 * @returns {number} -1: version1 < version2, 0: equal, 1: version1 > version2
 */
export function compareVersions(version1, version2) {
  const releases = [
    'Eureka', 'Fuji', 'Geneva', 'Helsinki', 'Istanbul', 'Jakarta',
    'Kingston', 'London', 'Madrid', 'New York', 'Orlando', 'Paris',
    'Quebec', 'Rome', 'San Diego', 'Tokyo', 'Utah', 'Vancouver',
    'Washington', 'Xanadu',
  ];
  
  const index1 = releases.findIndex(r => r === version1);
  const index2 = releases.findIndex(r => r === version2);
  
  if (index1 === -1 || index2 === -1) {
    return 0; // 不明な場合は等しいとみなす
  }
  
  if (index1 < index2) return -1;
  if (index1 > index2) return 1;
  return 0;
}