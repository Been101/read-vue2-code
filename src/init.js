import { initState } from "./state";

export function initMixin(Vue) {
  // 后续组件开发的时候 Vue.extend 可以创造一个子组件，子组件可以继承 Vue, 子组件也可以调用 _init 方法
  Vue.prototype._init = function(options) {
    const vm = this;

    // 把用户的选项放到 vm 上， 这样在其他方法中都可以获取到 options 了
    vm.$options = options; // 为了后续扩展的方法都可以获取 $options 选项

    // $options 中是用户传入的数据 el, data, watch ...
    initState(vm)

    if(vm.$options.el) {
      // 将数据挂载到页面
      console.log('页面要挂载');
    }

  }
}