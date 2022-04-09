import { mergeOptions } from "../utils";

export function initGlobalAPI(Vue) {
  Vue.options = {}; // 全局属性，在每个组件初始化的时候， 将这些属性放到每个组件上
  Vue.mixin = function(options) {
    Vue.options = mergeOptions(this.options, options)
    console.log(Vue.options, '<---options');
  }
  Vue.component = function(options) {}
  Vue.filter = function(options) {}
  Vue.directive = function(options) {}
}