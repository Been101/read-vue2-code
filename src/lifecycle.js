import { patch } from "./vdom/patch";

export function mountComponent(vm) {
  


  // vue 初始化 dom 节点
  vm._update(vm._render())
}

export function lifeCycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 采用的是先序深度遍历  创建节点 （遇到节点就创建节点， 递归创建）

    const vm = this;
    vm.$el = patch(vm.$el, vnode)
  }
}