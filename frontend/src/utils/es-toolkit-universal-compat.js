// Universal compatibility shim for es-toolkit to work with Recharts
// This provides all the exports that Recharts might need

// Fallback implementations for es-toolkit functions
const get = (obj, path, defaultValue) => {
  if (!obj || !path) return defaultValue;
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return defaultValue;
  }
  return result;
};

const uniqBy = (array, iteratee) => {
  if (!Array.isArray(array)) return [];
  const seen = new Set();
  return array.filter(item => {
    const key = typeof iteratee === 'function' ? iteratee(item) : item[iteratee];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortBy = (array, iteratee) => {
  if (!Array.isArray(array)) return [];
  return [...array].sort((a, b) => {
    const aVal = typeof iteratee === 'function' ? iteratee(a) : a[iteratee];
    const bVal = typeof iteratee === 'function' ? iteratee(b) : b[iteratee];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
};

const isEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  return true;
};

const last = (array) => {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[array.length - 1];
};

const isPlainObject = (value) => {
  if (!isObject(value)) return false;
  if (Object.getPrototypeOf(value) === null) return true;
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
};

const maxBy = (array, iteratee) => {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  let maxItem = array[0];
  let maxValue = typeof iteratee === 'function' ? iteratee(maxItem) : maxItem[iteratee];

  for (let i = 1; i < array.length; i++) {
    const currentValue = typeof iteratee === 'function' ? iteratee(array[i]) : array[i][iteratee];
    if (currentValue > maxValue) {
      maxValue = currentValue;
      maxItem = array[i];
    }
  }
  return maxItem;
};

const minBy = (array, iteratee) => {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  let minItem = array[0];
  let minValue = typeof iteratee === 'function' ? iteratee(minItem) : minItem[iteratee];

  for (let i = 1; i < array.length; i++) {
    const currentValue = typeof iteratee === 'function' ? iteratee(array[i]) : array[i][iteratee];
    if (currentValue < minValue) {
      minValue = currentValue;
      minItem = array[i];
    }
  }
  return minItem;
};

const range = (start, end, step = 1) => {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }
  return result;
};

const throttle = (func, wait) => {
  let timeout;
  let previous = 0;
  return function(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      return func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};

const omit = (obj, keys) => {
  if (!obj) return {};
  const keysToOmit = Array.isArray(keys) ? keys : [keys];
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keysToOmit.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
};

const sumBy = (array, iteratee) => {
  if (!Array.isArray(array)) return 0;
  return array.reduce((sum, item) => {
    const value = typeof iteratee === 'function' ? iteratee(item) : item[iteratee];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
};

const isNil = (value) => value == null;
const isFunction = (value) => typeof value === 'function';
const isObject = (value) => value !== null && typeof value === 'object';
const isArray = (value) => Array.isArray(value);
const isString = (value) => typeof value === 'string';
const isNumber = (value) => typeof value === 'number';
const isBoolean = (value) => typeof value === 'boolean';

// Export as default (what Recharts expects for individual modules)
export default get;

// Export all named functions
export {
  get,
  uniqBy,
  sortBy,
  isEqual,
  last,
  isPlainObject,
  maxBy,
  minBy,
  range,
  throttle,
  omit,
  sumBy,
  isNil,
  isFunction,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean
};
