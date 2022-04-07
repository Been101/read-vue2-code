import Dep from "./dep";
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

  update() {

    console.log('update')
    // 可以做异步更新
    this.get();
  }

}

export default Watcher;