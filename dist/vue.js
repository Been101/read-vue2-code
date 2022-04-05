(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function isFunction(fn) {
    return typeof fn === 'function';
  }
  function isObject(val) {
    return typeof val === 'object' && val !== null;
  }
  const isArray = Array.isArray;

  let oldArrayPrototype = Array.prototype; // 获取数组的老的原型方法

  const arrayMethods = Object.create(oldArrayPrototype); // 让 arrayMethods 通过 __proto__ 能获取到数组的方法

  const methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse', 'sort']; // 只有这七个方法可以导致数组发生变化

  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      console.log('数组方法进行重写操作'); // 数组新增的属性 要看一下是不是对象， 如果是对象， 继续进行劫持
      // 需要调用数组原生逻辑
      // arr.push(1) // this 就是 arr

      oldArrayPrototype[method].call(this, ...args); // TODO 可以添加自己逻辑。 这种方式叫函数劫持 或 切片

      let inserted = null;
      const ob = this.__ob__;

      switch (method) {
        case 'splice':
          // 修改 删除 添加  arr.splice(0, 0, 100, 200, 300)
          inserted = args.slice(2); // splice 方法从第三个参数起是增添的新数据

          break;

        case 'push':
        case 'unshift':
          inserted = args; // 调用 push 和 unshift 传递的参数就是新增的逻辑

          break;
      } // inserted 看一下它是否需要进行劫持


      if (inserted) {
        ob.observeArray(inserted);
      }
    };
  });

  class Observer {
    constructor(value) {
      // 添加一个自定义属性绑定this, 方便在 array.js 中使用观察数组方法且不让 __ob__ 被遍历到， 否则就走对象劫持的逻辑了， 就会出现死循环
      Object.defineProperty(value, '__ob__', {
        value: this,
        enumerable: false // 标识这个属性不能被列举出来， 不能被循环到

      });

      if (isArray(value)) {
        // 更改数组原型方法
        value.__proto__ = arrayMethods; // 重写数组的方法
        // 如果数组里还有数组，要继续递归重写数组的原型链

        this.observeArray(value);
      } else {
        this.walk(value); // 核心就是循环对象
      }
    }

    observeArray(data) {
      // 递归遍历数组， 对数组内部的对象再次重写 [[], []]; [{}]
      // vm.arr[0].a = 100
      // vm.arrp[0] = 100
      data.forEach(item => observe(item)); // 数组里面如果式引用类型那么是响应式的
    }

    walk(data) {
      Object.keys(data).forEach(key => {
        // 要使用 defineProperty 重新定义
        defineReactive(data, key, data[key]);
      });
    }

  } // vue2 应用了 defineProperty 需要一加载的时候就进行递归操作，所以耗性能，如果层次过深也会浪费性能
  // 1. 性能优化的原则
  // a. 不要把所有数据都放在 data 中，因为所有的数据都会增加 get 和 set
  // b. 不要写数据的时候层次过深，尽量扁平化数据
  // c. 不要频繁获取数据
  // d. 如果数据不需要响应式，可以使用 Object.freeze 冻结属性
  // 数组也可以使用 defineProperty 但是我们很少去采用 arr[333] = 2
  // 如果数组也使用了 defineProperty 还是可以实现修改索引触发更新的，但是这种操作概率低， 所以源码中没有采用这种方式， 所有 vue 中 数组修改索引不会导致视图更新，修改 length 也不会更新
  // vue3中为了兼容 proxy 内部对数组用的就是 defineProperty
  // 正常用户修改数组，无非采用数组的变异方法， push, pop, splice, shift. unshift. reverse, sort


  function defineReactive(obj, key, value) {
    // vue2 慢的原因主要在这个方法中
    observe(value); // 递归进行观测数据，不管有多少层，我都进行 defineProperty

    Object.defineProperty(obj, key, {
      get() {
        return value; // 闭包，此 value 会向上层的 value 进行查找
      },

      set(newValue) {
        // 如果设置的是一个对象那么会再次进行劫持
        if (newValue === value) return;
        /**
         *  vm.message= {a: 100} // 会更新
         * vm.message.a = 200 // 要想这种情况也更新， 需要对新赋的值也要观察
         * vm.message.b = 12 // vue2 无法劫持到不存在的属性，新增不存在的属性 不会更新视图
         * vm.arr[0].name = 'ming'
         */

        console.log(`修改了${key}`);
        observe(newValue); // 

        value = newValue;
      }

    });
  }

  function observe(value) {
    // 1. 如果 value 不是对象，那么就不用观测了， 说明写的有问题
    if (!isObject(value)) {
      return;
    }

    if (value.__ob__) {
      // 一个对象不需要重复被观测
      return;
    } // 需要对对象进行观测（最外层必须是一个{} 不能是数组）
    // 如果一个数据已经被观测过了，就不要再进行观测了，用类来实现，我观测过就增加一个标识说明观测过了，在观测的时候可以检测是否观测过，如果观测过了就跳过检测


    return new Observer(value);
  }

  function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }
  }

  function proxy(vm, key, source) {
    // 取值的时候做代理，不是暴力的把 _data 属性赋给 vm, 而且直接赋值会有命名冲突的问题
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newValue) {
        vm[source][key] = newValue;
      }

    });
  }

  function initData(vm) {
    let data = vm.$options.data; //
    // 如果用户传递的是一个函数，则取函数的返回值作为对象，如果激素hi对象那就直接使用这个对象
    // 只有根实例 data 可以是一个对象
    // 希望 用户能够 直接 vm.message 进行取值，所以使用了一个 proxy 进行代理 vm._data
    // data 和 vm._data 引用的是同一个  data 被劫持了  vm._data 也被劫持

    data = vm._data = isFunction(data) ? data.call(vm) : data; // 需要将 data 变成响应式的 Object.defineProperty

    console.log('初始化数据');
    observe(data);
    data.arr.push(1);

    for (const key in data) {
      // vm.message => vm._data.message
      proxy(vm, key, '_data'); // 引用类型
    }
  }

  function initMixin(Vue) {
    // 后续组件开发的时候 Vue.extend 可以创造一个子组件，子组件可以继承 Vue, 子组件也可以调用 _init 方法
    Vue.prototype._init = function (options) {
      const vm = this; // 把用户的选项放到 vm 上， 这样在其他方法中都可以获取到 options 了

      vm.$options = options; // 为了后续扩展的方法都可以获取 $options 选项
      // $options 中是用户传入的数据 el, data, watch ...

      initState(vm);

      if (vm.$options.el) {
        // 将数据挂载到页面
        console.log('页面要挂载');
      }
    };
  }

  function Vue(options) {
    this._init(options); // 实现 vue 的初始化功能

  }

  initMixin(Vue); // 导出 Vue 给别人用
  /**
   * 1. new Vue 会调用 _init 方法进行初始化操作
   * 2. 会将用户的选项放到 vm.$options 上
   * 3. 会对当前属性上搜索有没有 data 数据  initState
   * 4. 有 data 判断 data 是不是一个函数， 如果是函数取返回值 initData
   * 5. observe 去观测 data 中的数据 和 vm 没关系， 说明 data 已经变成了响应式
   * 6. vm 上想取值也能取到 data 中的数据  vm._data = data 这样用户能取到 data 了， vm._data
   * 7. 用户觉得有点麻烦 vm.xxx => vm._data
   * 8.如果更新对象不存在的属性， 会导致视图不更新，如果是数组更新索引和长度不会触发更新
   * 9.如果是替换成一个新对象，新对象会被劫持， 如果是数组存放新内容 push unshift splice 新增的内容也会被劫持， 通过 __ob__ 进行标识这个对象被监控过 (在 vue中被监控的对象身上都有一个 __ob__ 这个属性)
   */

  return Vue;

}));
//# sourceMappingURL=vue.js.map
