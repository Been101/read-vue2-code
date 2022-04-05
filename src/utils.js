export function isFunction(fn) {
  return typeof fn === 'function'
}

export function isObject(val) {
  return typeof val === 'object' && val !== null
}

export const isArray = Array.isArray 