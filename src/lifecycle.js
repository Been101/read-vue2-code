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
    let preVnode = vm._prevVnode;

    // 第一次渲染是根据虚拟节点生成真实节点， 替换掉原来的节点
    vm._prevVnode = vnode
    // 如果是第二次 生成一个新的虚拟节点和老的虚拟节点进行对比
    if(!preVnode) { // 没有节点就是初次渲染
      vm.$el = patch(vm.$el, vnode)
    }else {
      vm.$el = patch(preVnode, vnode)
    }
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