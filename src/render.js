import { isObject } from "./utils";
import { createElement, createText } from "./vdom";

export function renderMixin(Vue) {
  Vue.prototype._c = function () { // createElement 创建元素型的节点
    console.log(arguments);
    const vm = this;
    return createElement(vm, ...arguments)
  }
  Vue.prototype._v = function (text) {
    console.log(arguments);
    const vm = this;
    return createText(vm, text); // 描述虚拟节点式属于那个实例的
  }
  Vue.prototype._s = function (val) { // JSON.stringify()
    console.log(arguments);

    if (isObject(val)) {
      return JSON.stringify(val)
    }
    return val
  }
  Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    const vnode = render.call(vm)
    console.log(vnode, '--vnode');
    return vnode
  }
}