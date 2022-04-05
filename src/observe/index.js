import { isArray, isObject } from "../utils";
import { arrayMethods } from "./array";

class Observer {
  constructor(value) {
    // 添加一个自定义属性绑定this, 方便在 array.js 中使用观察数组方法且不让 __ob__ 被遍历到， 否则就走对象劫持的逻辑了， 就会出现死循环
    Object.defineProperty(value, '__ob__', {
      value: this,
      enumerable: false // 标识这个属性不能被列举出来， 不能被循环到
    })

    if(isArray(value)) {
      // 更改数组原型方法
      value.__proto__ = arrayMethods // 重写数组的方法
      // 如果数组里还有数组，要继续递归重写数组的原型链
      this.observeArray(value);
    }else {
      this.walk(value) // 核心就是循环对象

    }
  }

  observeArray(data) { // 递归遍历数组， 对数组内部的对象再次重写 [[], []]; [{}]
    // vm.arr[0].a = 100
    // vm.arrp[0] = 100
     data.forEach(item => observe(item)) // 数组里面如果式引用类型那么是响应式的

  }

  walk(data) {
    Object.keys(data).forEach(key => { // 要使用 defineProperty 重新定义
      defineReactive(data, key, data[key]);
    })
  }
}
// vue2 应用了 defineProperty 需要一加载的时候就进行递归操作，所以耗性能，如果层次过深也会浪费性能

// 1. 性能优化的原则
// a. 不要把所有数据都放在 data 中，因为所有的数据都会增加 get 和 set
// b. 不要写数据的时候层次过深，尽量扁平化数据
// c. 不要频繁获取数据
// d. 如果数据不需要响应式，可以使用 Object.freeze 冻结属性

// 数组也可以使用 defineProperty 但是我们很少去采用 arr[333] = 2
// 如果数组也使用了 defineProperty 还是可以实现修改索引触发更新的，但是这种操作概率低， 所以源码中没有采用这种方式， 所有 vue 中 数组修改索引不会导致视图更新，修改 length 也不会更新

// vue3中为了兼容 proxy 内部对数组用的就是 defineProperty
// 正常用户修改数组，无非采用数组的变异方法， push, pop, splice, shift. unshift. reverse, sort

function defineReactive(obj, key, value) { // vue2 慢的原因主要在这个方法中
  observe(value) // 递归进行观测数据，不管有多少层，我都进行 defineProperty
  Object.defineProperty(obj, key, {
    get() {
      return value; // 闭包，此 value 会向上层的 value 进行查找
    },
    set(newValue) { // 如果设置的是一个对象那么会再次进行劫持
      if(newValue === value) return;
      /**
       *  vm.message= {a: 100} // 会更新
       * vm.message.a = 200 // 要想这种情况也更新， 需要对新赋的值也要观察
       * vm.message.b = 12 // vue2 无法劫持到不存在的属性，新增不存在的属性 不会更新视图
       * vm.arr[0].name = 'ming'
       */

      console.log(`修改了${key}`);
      observe(newValue); // 
      value = newValue
    }
  })
}

export function observe(value) {

  // 1. 如果 value 不是对象，那么就不用观测了， 说明写的有问题
  if(!isObject(value)) {
    return
  }

  if(value.__ob__) { // 一个对象不需要重复被观测
    return;
  }

  // 需要对对象进行观测（最外层必须是一个{} 不能是数组）

  // 如果一个数据已经被观测过了，就不要再进行观测了，用类来实现，我观测过就增加一个标识说明观测过了，在观测的时候可以检测是否观测过，如果观测过了就跳过检测

  return new Observer(value)
}