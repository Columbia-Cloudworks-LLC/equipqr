export interface JsonDiff {
  path: string;
  oldValue: any;
  newValue: any;
}

export function deepDiff(obj1: any, obj2: any, path = ''): JsonDiff[] {
  const differences: JsonDiff[] = [];

  // Handle null/undefined cases
  if (obj1 === null || obj1 === undefined) {
    if (obj2 !== null && obj2 !== undefined) {
      differences.push({
        path: path || 'root',
        oldValue: obj1,
        newValue: obj2
      });
    }
    return differences;
  }

  if (obj2 === null || obj2 === undefined) {
    differences.push({
      path: path || 'root',
      oldValue: obj1,
      newValue: obj2
    });
    return differences;
  }

  // Handle primitive types
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    if (obj1 !== obj2) {
      differences.push({
        path: path || 'root',
        oldValue: obj1,
        newValue: obj2
      });
    }
    return differences;
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLength = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLength; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`;
      const item1 = i < obj1.length ? obj1[i] : undefined;
      const item2 = i < obj2.length ? obj2[i] : undefined;
      differences.push(...deepDiff(item1, item2, currentPath));
    }
    return differences;
  }

  // Handle one being array, other being object
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    differences.push({
      path: path || 'root',
      oldValue: obj1,
      newValue: obj2
    });
    return differences;
  }

  // Handle objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const value1 = obj1[key];
    const value2 = obj2[key];

    if (!(key in obj1)) {
      differences.push({
        path: currentPath,
        oldValue: undefined,
        newValue: value2
      });
    } else if (!(key in obj2)) {
      differences.push({
        path: currentPath,
        oldValue: value1,
        newValue: undefined
      });
    } else {
      differences.push(...deepDiff(value1, value2, currentPath));
    }
  }

  return differences;
}

export function formatDiffValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function getDiffSummary(differences: JsonDiff[]): string {
  if (differences.length === 0) return 'No differences found';
  if (differences.length === 1) return '1 difference found';
  return `${differences.length} differences found`;
}