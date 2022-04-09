import { compileToFunction } from "./compiler/index";
import { initState } from "./state";
import { mountComponent } from './lifecycle'
import { mergeOptions, nextTick } from "./utils";
export function initMixin(Vue) {
  // 后续组件开发的时候 Vue.extend 可以创造一个子组件，子组件可以继承 Vue, 子组件也可以调用 _init 方法
  Vue.prototype._init = function(options) {
    const vm = this;

    // 把用户的选项放到 vm 上， 这样在其他方法中都可以获取到 options 了
    // vm.$options = options; // 为了后续扩展的方法都可以获取 $options 选项
    vm.$options = mergeOptions(vm.constructor.options, options) // vm.constructor 是 Vue 或 继承自Vue 的子类

    // $options 中是用户传入的数据 el, data, watch ...
    initState(vm)

    if(vm.$options.el) {
      // 将数据挂载到页面
      console.log('页面要挂载');
      // 现在数据已经被劫持了，数据 变化需要更新视图 diff 算法更新需要更新的部分
      // vue -> template （写起来更符合直觉） -> jsx （灵活）
      // vue3 template 写起来性能会更高一些， 内部做了很多优化

      /**
       * template -> ast 语法树（用来描述语法的， 描述语法本身的） -> 描述成一个树结构 -> 将代码重组成 js 语法
       * 
       * 模板编译原理（把 template 模板编译成 render 函数 -> 虚拟DOM -> diff 算法比对虚拟DOM）
       * 
       * ast -> render 返回 -> vnode -> 生成真实 dom
       *       更新的时候再次调用 render -> 新的 vnode -> 新旧比对 -> 更新真实 dom
       */
      vm.$mount(vm.$options.el)
    }

  }

  Vue.prototype.$mount= function(el) {
    const vm = this;
    const opts = vm.$options
    el = document.querySelector(el) // 获取真实的元素
    vm.$el= el // 页面真实元素

    if(!opts.render) {
      // 模板编译
      let template = opts.template
      if(!template) {
        template = el.outerHTML
      }
      const render = compileToFunction(template)
      opts.render = render;
    }

    // 这里已经获取到了， 一个 render 函数的了，这个函数的返回值 _c('div', {id: 'app'}, _c('span', undefined, 'hello'))
    mountComponent(vm)

  }

  Vue.prototype.$nextTick = nextTick
}