import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

export function mountComponent(vm) {

  // vue 初始化 dom 节点
  const updateComponent = () => {
    vm._update(vm._render())
  }

  callHook(vm, 'beforeCreate')
  // 每个组件都有一个 watcher, 我们把这个 watcher 称之为 渲染 watcher 
  new Watcher(vm, updateComponent, () => {
    console.log('后续增加更新钩子函数 update');
    callHook(vm, 'created')
  }, true)
  callHook(vm, 'mounted')
}

export function lifeCycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 采用的是先序深度遍历  创建节点 （遇到节点就创建节点， 递归创建）

    const vm = this;
    vm.$el = patch(vm.$el, vnode)
  }
}

export function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if(handlers) {
    handlers.forEach(hook => {
      hook.call(vm); // 声明周期的 this 永远指向实例
    });
  }
}