import Dep from "./dep";
import { queueWatcher } from "./scheduler";
let id = 0;
class Watcher {
  constructor(vm, fn, cb, options) {  // 要把 dep 放到  watcher 中
    this.vm = vm;
    this.fn = fn;
    this.cb = cb;
    this.options = options
    this.id = id++  // 要给 watcher 也加一个标识， 防止重复
    this.depsId = new Set();this.deps = []


    this.getter = fn // fn 就是页面渲染的逻辑
    this.get(); // 表示上来后就做一此初始化
  }

  get() {
    Dep.target = this; // Dep.target = watcher
    this.getter(); // 页面渲染的逻辑
    Dep.target = null // 渲染完毕后， 就将标识清空了， 只有在渲染的时候才会进行依赖收集
  }

  addDep(dep) {
    let did = dep.id;
    if(!this.depsId.has(did)) { // 去重， 只有第一次的 watcher 才被收集到 deps 中
      this.depsId.add(did);
      this.deps.push(dep); // 做了保存 id 的功能， 并且让 watcher 记住 dep

      dep.addSub(this)
    }
  }
// 不论是对象还是数组的更新都会走这个 update 函数
  update() { //  每次更新数据都会同步调用这个 update 方法， 我可以将更新的逻辑缓存起来， 等会同步更新数据的逻辑执行完毕后，依次调用（有去重的逻辑）

    console.log('update')
    // 可以做异步更新 // vue.nextTick [fn1, fn2, fn3] 相同的更新的话，只调用最后一个更新
    // this.get();  
    console.log('缓存更新的地方');
    queueWatcher(this)
  }

  run() {
    console.log('真正更新的地方');
    this.get() // 延后执行更新逻辑
  }

}

export default Watcher;