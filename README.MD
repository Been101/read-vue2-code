rollup
@babel/core 转义的，但是没有转义功能，需要转义插件
rollup-plugin-babel rollup 和 babel 关联
@babel/preset-env 转义插件，高级语法转低级语法

rollup-plugin-node-res // 会找文件下的 index 文件

- Vue 响应式数据的理解
- Vue 中如何检测数组变化的
- 如何理解 Vue 中模板编译原理
- Vue 生命周期钩子是如何实现的
- Vue.set 方法的实现
- Vue.mixin 的使用场景和原理
- nextTick 在哪里使用? 原理是什么?
- Vue 中 diff 算法原理
- Vue 中 key 的作用和原理

源码思路

- package.json 找到 scripts.build
- 找到打包时采用的入口方便分析 esm/ cjs/ umd runtime compiler = full
  vue 是由两部分组成的 compiler (将 template -> render 函数) runtime (不支持将 template 转化成 render 函数)。 这里的 template 是指 new Vue({template: ''}) 中的 template 参数
- 找到打包入口， 文件在 platform/web 目录 entry-runtime-with-compiler
- 因为 weex 基于 vue 实现跨平台(vue2 扩展并不好) vue3 采用了 monorepo 的方式实现一个苍鹭下管理多个模块
- runtime-with-compiler 是通过重写 $mount 方法来处理用户参数中包含 template 属性， 会将 template 转化成 render 函数， 最终调用 runtime/index.js

Vue 的构造函数

- core/instance/index.js 提供 Vue 的构造函数
- core/index.js 对 Vue 构造函数扩展全局 api 方法 Vue.mixin
- platform/runtime/index.js 扩展 transition / v-model / v-show 等功能 `__patch__= patch`
- platform/entry-runtime-with-compiler 实现 $mount 重写， 实现模板编译功能

// 如果是数组想更新不存在的属性， Vue.set ==> splice
// 如果是对象更新不存在的属性 Vue.set => defineReactive + notify
