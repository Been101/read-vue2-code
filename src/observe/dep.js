let id = 0;

class Dep {
  constructor() { // 要把 watcher 放到 dep 中
    this.subs = [];
    this.id = id++;
  }

  depend() {
    // 要给 watcher 也加一个标识， 防止重复
    // this.subs.push(Dep.target) // 让 dep 记住这个 watcher, watcher 还要记住 dep  相互关系

    Dep.target.addDep(this); // 在 watcher 中调用 dep 的 addSub 方法
  }

  addSub(watcher) {
    this.subs.push(watcher) // 让 dep 记住这个 watcher
  }

  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}

Dep.target = null; // 这里我用一个全局的变量， 静态属性

export default Dep;