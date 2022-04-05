let oldArrayPrototype = Array.prototype // 获取数组的老的原型方法

export const arrayMethods = Object.create(oldArrayPrototype) // 让 arrayMethods 通过 __proto__ 能获取到数组的方法

const methods = ['push', 'pop', 'splice', 'shift','unshift', 'reverse', 'sort'] // 只有这七个方法可以导致数组发生变化

methods.forEach(method => {
  arrayMethods[method] = function(...args) {
    console.log('数组方法进行重写操作')

    // 数组新增的属性 要看一下是不是对象， 如果是对象， 继续进行劫持
    // 需要调用数组原生逻辑
    // arr.push(1) // this 就是 arr
    oldArrayPrototype[method].call(this, ...args)

    // TODO 可以添加自己逻辑。 这种方式叫函数劫持 或 切片

    let inserted = null
    const ob = this.__ob__
    switch (method) {
      case 'splice':   // 修改 删除 添加  arr.splice(0, 0, 100, 200, 300)
        inserted = args.slice(2); // splice 方法从第三个参数起是增添的新数据
        break;
      case 'push':
      case 'unshift':
        inserted = args; // 调用 push 和 unshift 传递的参数就是新增的逻辑
        break;
    }

    // inserted 看一下它是否需要进行劫持
    if(inserted) {
      ob.observeArray(inserted)
    }
  }
})