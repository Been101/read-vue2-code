import { observe } from "./observe/index";
import { isFunction } from "./utils";

export function initState (vm) {
  const opts = vm.$options;

  if(opts.data) {
    initData(vm)
  }
}

function proxy(vm, key, source) { // 取值的时候做代理，不是暴力的把 _data 属性赋给 vm, 而且直接赋值会有命名冲突的问题
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key]
    },
    set(newValue) {
      vm[source][key] = newValue
    }
  })
}


function initData(vm) {
  let data = vm.$options.data //

  // 如果用户传递的是一个函数，则取函数的返回值作为对象，如果激素hi对象那就直接使用这个对象
  // 只有根实例 data 可以是一个对象

  // 希望 用户能够 直接 vm.message 进行取值，所以使用了一个 proxy 进行代理 vm._data
  // data 和 vm._data 引用的是同一个  data 被劫持了  vm._data 也被劫持
  data = vm._data =  isFunction(data) ? data.call(vm) : data

  // 需要将 data 变成响应式的 Object.defineProperty
  console.log('初始化数据')
  observe(data)


  data.arr.push(1)
  for (const key in data) { // vm.message => vm._data.message
    proxy(vm, key, '_data')  // 引用类型
  }
}