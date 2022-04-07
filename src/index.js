import { initMixin } from "./init";
import { lifeCycleMixin } from "./lifecycle";
import { renderMixin } from "./render";

// vue 要如何实现， 原型模式， 所有的功能都通过原型扩展的方式来添加
function Vue(options) {
  this._init(options) // 实现 vue 的初始化功能
}

initMixin(Vue)
renderMixin(Vue)
lifeCycleMixin(Vue)
// 导出 Vue 给别人用
export default Vue;


/**
 * 1. new Vue 会调用 _init 方法进行初始化操作
 * 2. 会将用户的选项放到 vm.$options 上
 * 3. 会对当前属性上搜索有没有 data 数据  initState
 * 4. 有 data 判断 data 是不是一个函数， 如果是函数取返回值 initData
 * 5. observe 去观测 data 中的数据 和 vm 没关系， 说明 data 已经变成了响应式
 * 6. vm 上想取值也能取到 data 中的数据  vm._data = data 这样用户能取到 data 了， vm._data
 * 7. 用户觉得有点麻烦 vm.xxx => vm._data
 * 8.如果更新对象不存在的属性， 会导致视图不更新，如果是数组更新索引和长度不会触发更新
 * 9.如果是替换成一个新对象，新对象会被劫持， 如果是数组存放新内容 push unshift splice 新增的内容也会被劫持， 通过 __ob__ 进行标识这个对象被监控过 (在 vue中被监控的对象身上都有一个 __ob__ 这个属性)
 */