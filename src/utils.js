export function isFunction(fn) {
  return typeof fn === 'function'
}

export function isObject(val) {
  return typeof val === 'object' && val !== null
}

export const isArray = Array.isArray 


let callbacks = []
let waiting = false;
function flushCallbacks() {
  callbacks.forEach(fn => fn());
  callbacks = [];
  waiting = false
}

export function nextTick(fn) {
  callbacks.push(fn)
  if(!waiting) {
    Promise.resolve().then(flushCallbacks)
    waiting = true
  }
}
// 每使用依次 this.$nextTick 就会new 一个 promise
// export function nextTick(fn) { // vue3 里面的 nextTick 就是 promise， vue3 里面做了一些兼容性处理
//   return Promise.resolve().then(fn)
// }