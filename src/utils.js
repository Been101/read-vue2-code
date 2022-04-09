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

// 覆盖合并 {a: 1} {b:1, a: 2} => {a: 2, b: 1}
// 组合合并 {a: 1} {b:1， a:2} => {b: a, a: [1,2]}

let strats = {}; // 存放所有策略

const lifeCycle = ['beforeCreate', 'created', 'beforeMount', 'mounted'];

lifeCycle.forEach(hook => {
  strats[hook] = function(parentVal, childVal) {
    if(childVal) {
      if(parentVal) { // 父 子 都有值 用父和子拼接在一起， 父有值就一定是数组
        return parentVal.concat(childVal)
      } else {
        if(Array.isArray(childVal)) {
          return childVal
        }else {
          return [childVal] // 如果没有值， 就会变成数组
        }
      }
    } else {
      return parentVal
    }
  }
})

export function mergeOptions(parentVal, childVal) {
  const options = {}
  for (const key in parentVal) {
    mergeFiled(key)
  }
  for (const key in childVal) {
    if (childVal.hasOwnProperty(key)) {
      mergeFiled(key)
    }
  }

  function mergeFiled(key) {
    // 设计模式  策略模式
    let strat = strats[key];
    if(strat) {
      options[key] = strat(parentVal[key], childVal[key]); // 合并两个值
    } else {
      options[key] = childVal[key] || parentVal[key]

    }
  }

  return options;
}

// 看两个节点是不是相同节点，就看是不是 tag 和 key 都一样
// Vue2 递归比对
export function isSameVnode(newVnode, oldVnode) {
  return (newVnode.tag === oldVnode.tag) && (newVnode.key === oldVnode.key)
}