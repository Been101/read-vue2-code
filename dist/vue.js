(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的 aa-xxx

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // aa:aa-xxx

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 此正则可以匹配到标签名  匹配到结果的第一个（索引第一个）[1]

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  console.log(`aaa=xxx`.match(attribute)); // [1] 属性的key  [3] ||  [4] || [5] 属性的值

  const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />  >
  // vue3 的编译原理比 vue2 里好很多， 没有这么多正则了

  function parserHTML(html) {
    console.log(html); // 可以不停的截取模板，知道把模板全部解析完毕
    // 我要构建父子关系

    const stack = [];
    let root = null;

    function createASTElement(tag, attrs, parent) {
      return {
        tag,
        parent,
        attrs,
        type: 1,
        children: []
      };
    }

    function start(tag, attrs) {
      // [div, p]
      // 遇到开始标签， 就取栈中的最后一个作为父节点
      let parent = stack[stack.length - 1];
      const element = createASTElement(tag, attrs, parent);

      if (root === null) {
        // 说明当前节点就是根节点
        root = element;
      }

      if (parent) {
        element.parent = parent; // 更新 p 的parent属性指向 parent

        parent.children.push(element);
      }

      stack.push(element);
      console.log(tag, attrs, '---start');
    }

    function end(tagName) {
      const endTag = stack.pop();

      if (endTag.tag !== tagName) {
        console.log('标签出错');
      }

      console.log(tagName, '---end');
    }

    function text(chars) {
      const parent = stack[stack.length - 1];
      chars = chars.replace(/\s/g, '');

      if (chars) {
        parent.children.push({
          type: 2,
          text: chars
        });
      }

      console.log(chars, '---chars');
    }

    function advance(len) {
      // 把匹配到的元素删除掉
      html = html.substring(len);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen);

      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let end, attr;

        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          // 1. 要有属性 2.不能为开始的结束标签
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
          advance(attr[0].length);
        }

        if (end) {
          advance(end[0].length);
        }

        console.log(match, '-----match');
        return match;
      }

      return false;
    }

    while (html) {
      // 解析标签和文本
      let index = html.indexOf('<');

      if (index === 0) {
        // 解析开始标签， 并且把属性也解析出来
        const startTagMatch = parseStartTag();

        if (startTagMatch) {
          // 开始标签
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        let endTagMatch;

        if (endTagMatch = html.match(endTag)) {
          // 结束标签
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      }

      if (index > 0) {
        // 文本
        let chars = html.substring(0, index); // </div>

        text(chars);
        advance(chars.length);
        console.log('内容是文本');
      }
    }

    console.log(root, '---ast');
    return root;
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{ xxx }}

  function genProps(attrs) {
    // {key:val, key: val}
    let str = '';

    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];

      if (attr.name === 'style') {
        // {name: id, value: 'app'}
        const styles = {};
        attr.value.replace(/([^;:]+):([^;:]+)/g, function () {
          styles[arguments[1]] = arguments[2];
        });
        attr.value = styles;
      }

      str += `${attr.name}: ${JSON.stringify(attr.value)},`;
    }

    return `{${str.slice(0, -1)}}`;
  }

  function gen(el) {
    if (el.type === 1) {
      return generate(el);
    } else {
      const text = el.text; // {{}}

      if (!defaultTagRE.test(text)) return `_v('${text}')`; // 说明就是普通文本
      // 说明有表达式，需要做一个表达式和普通值得拼接 ['message', _s(name), 'bbb'].join('+')
      // _v('aaa' + _s(name) + 'bb')

      let lastIndex = defaultTagRE.lastIndex = 0;
      const tokens = [];
      let match;

      while (match = defaultTagRE.exec(text)) {
        // 如果正则 + g, 配合 exec 就会有个问题 lastIndex 的问题
        let index = match.index;

        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }

        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index + match[0].length;
      } // <div> aaa</div>


      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }

      return `_v(${tokens.join('+')})`;
    }
  }

  function genChildren(el) {
    const children = el.children;

    if (children) {
      return children.map(item => gen(item)).join(',');
    }

    return false;
  }

  function generate(ast) {
    const children = genChildren(ast);
    const code = `_c('${ast.tag}', ${ast.attrs.length ? genProps(ast.attrs) : 'undefined'},${children ? children : ''})`;
    return code;
  }

  function compileToFunction(template) {
    // 1. 将模板变成 ast 语法树
    let ast = parserHTML(template);
    console.log(ast); // 代码优化， 标记静态节点
    // 2. 代码生成

    const code = generate(ast);
    console.log(code, '-generate-code');
    const render = new Function(`with(this){return ${code}}`);
    console.log(render.toString());
    return render;
    /**
     * 1. 编译原理
     * 2. 响应式原理 以来手机
     * 3. 组件化开发  （贯穿了 vue 的流程）
     * 4. diff 算法
     */
  }

  function isFunction(fn) {
    return typeof fn === 'function';
  }
  function isObject(val) {
    return typeof val === 'object' && val !== null;
  }
  const isArray = Array.isArray;
  let callbacks = [];
  let waiting = false;

  function flushCallbacks() {
    callbacks.forEach(fn => fn());
    callbacks = [];
    waiting = false;
  }

  function nextTick(fn) {
    callbacks.push(fn);

    if (!waiting) {
      Promise.resolve().then(flushCallbacks);
      waiting = true;
    }
  } // 每使用依次 this.$nextTick 就会new 一个 promise
  // export function nextTick(fn) { // vue3 里面的 nextTick 就是 promise， vue3 里面做了一些兼容性处理
  //   return Promise.resolve().then(fn)
  // }

  let oldArrayPrototype = Array.prototype; // 获取数组的老的原型方法

  const arrayMethods = Object.create(oldArrayPrototype); // 让 arrayMethods 通过 __proto__ 能获取到数组的方法

  const methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse', 'sort']; // 只有这七个方法可以导致数组发生变化

  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      console.log('数组方法进行重写操作'); // 数组新增的属性 要看一下是不是对象， 如果是对象， 继续进行劫持
      // 需要调用数组原生逻辑
      // arr.push(1) // this 就是 arr

      oldArrayPrototype[method].call(this, ...args); // TODO 可以添加自己逻辑。 这种方式叫函数劫持 或 切片

      let inserted = null;
      const ob = this.__ob__;

      switch (method) {
        case 'splice':
          // 修改 删除 添加  arr.splice(0, 0, 100, 200, 300)
          inserted = args.slice(2); // splice 方法从第三个参数起是增添的新数据

          break;

        case 'push':
        case 'unshift':
          inserted = args; // 调用 push 和 unshift 传递的参数就是新增的逻辑

          break;
      } // inserted 看一下它是否需要进行劫持


      if (inserted) {
        ob.observeArray(inserted);
      }

      ob.dep.notify();
    };
  });

  let id$1 = 0;

  class Dep {
    constructor() {
      // 要把 watcher 放到 dep 中
      this.subs = [];
      this.id = id$1++;
    }

    depend() {
      // 要给 watcher 也加一个标识， 防止重复
      // this.subs.push(Dep.target) // 让 dep 记住这个 watcher, watcher 还要记住 dep  相互关系
      Dep.target.addDep(this); // 在 watcher 中调用 dep 的 addSub 方法
    }

    addSub(watcher) {
      this.subs.push(watcher); // 让 dep 记住这个 watcher
    }

    notify() {
      this.subs.forEach(watcher => watcher.update());
    }

  }

  Dep.target = null; // 这里我用一个全局的变量， 静态属性

  class Observer {
    constructor(value) {
      // 数组 如何依赖收集， 而且数组更新的时候如何触发更新?
      // 如果给一个对象增添一个不存在的属性，我希望也能更新视图 [].__ob__.dep {}.__ob__.dep  => watcher  // vm.$set
      this.dep = new Dep(); //  value 是对象和数组   value.__ob__.dep
      // 添加一个自定义属性绑定this, 方便在 array.js 中使用观察数组方法且不让 __ob__ 被遍历到， 否则就走对象劫持的逻辑了， 就会出现死循环

      Object.defineProperty(value, '__ob__', {
        value: this,
        enumerable: false // 标识这个属性不能被列举出来， 不能被循环到

      });

      if (isArray(value)) {
        // 更改数组原型方法
        value.__proto__ = arrayMethods; // 重写数组的方法
        // 如果数组里还有数组，要继续递归重写数组的原型链

        this.observeArray(value);
      } else {
        this.walk(value); // 核心就是循环对象
      }
    }

    observeArray(data) {
      // 递归遍历数组， 对数组内部的对象再次重写 [[], []]; [{}]
      // vm.arr[0].a = 100
      // vm.arrp[0] = 100
      data.forEach(item => observe(item)); // 数组里面如果式引用类型那么是响应式的
    }

    walk(data) {
      Object.keys(data).forEach(key => {
        // 要使用 defineProperty 重新定义
        defineReactive(data, key, data[key]);
      });
    }

  } // vue2 应用了 defineProperty 需要一加载的时候就进行递归操作，所以耗性能，如果层次过深也会浪费性能
  // 1. 性能优化的原则
  // a. 不要把所有数据都放在 data 中，因为所有的数据都会增加 get 和 set
  // b. 不要写数据的时候层次过深，尽量扁平化数据
  // c. 不要频繁获取数据
  // d. 如果数据不需要响应式，可以使用 Object.freeze 冻结属性
  // 数组也可以使用 defineProperty 但是我们很少去采用 arr[333] = 2
  // 如果数组也使用了 defineProperty 还是可以实现修改索引触发更新的，但是这种操作概率低， 所以源码中没有采用这种方式， 所有 vue 中 数组修改索引不会导致视图更新，修改 length 也不会更新
  // vue3中为了兼容 proxy 内部对数组用的就是 defineProperty
  // 正常用户修改数组，无非采用数组的变异方法， push, pop, splice, shift. unshift. reverse, sort


  function dependArray(value) {
    // [[[]], {}]  // 让数组里的引用类型都收集依赖
    for (let i = 0; i < value.length; i++) {
      const current = value[i];
      current.__ob__ && current.__ob__.dep.depend();

      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  }

  function defineReactive(obj, key, value) {
    // vue2 慢的原因主要在这个方法中
    const childOb = observe(value); // 递归进行观测数据，不管有多少层，我都进行 defineProperty

    let dep = new Dep();
    Object.defineProperty(obj, key, {
      get() {
        if (Dep.target) {
          dep.depend();

          if (childOb) {
            // 取属性的时候会对对应的值（对象和数组）惊醒依赖收集
            childOb.dep.depend();

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }

        return value; // 闭包，此 value 会向上层的 value 进行查找
      },

      set(newValue) {
        // 如果设置的是一个对象那么会再次进行劫持
        if (newValue === value) return;
        /**
         *  vm.message= {a: 100} // 会更新
         * vm.message.a = 200 // 要想这种情况也更新， 需要对新赋的值也要观察
         * vm.message.b = 12 // vue2 无法劫持到不存在的属性，新增不存在的属性 不会更新视图
         * vm.arr[0].name = 'ming'
         */

        console.log(`修改了${key}`);
        observe(newValue); // 

        value = newValue;
        dep.notify();
      }

    });
  }

  function observe(value) {
    // 1. 如果 value 不是对象，那么就不用观测了， 说明写的有问题
    if (!isObject(value)) {
      return;
    }

    if (value.__ob__) {
      // 一个对象不需要重复被观测
      return;
    } // 需要对对象进行观测（最外层必须是一个{} 不能是数组）
    // 如果一个数据已经被观测过了，就不要再进行观测了，用类来实现，我观测过就增加一个标识说明观测过了，在观测的时候可以检测是否观测过，如果观测过了就跳过检测


    return new Observer(value);
  }
  /**
   * 1. 默认 vue 在初始化的时候会对对象每一个属性都进行劫持，增加 dep 属性， 当取值的时候会做依赖收集
   * 2. 默认还会对属性值是对象和数组的本身进行增加 dep 属性 进行依赖收集
   * 3. 如果是属性变化触发属性对应的 dep 去更新
   * 4. 如果是数组更新，触发数组的本身的 dep 进行更新
   * 5. 如果取值的时候是数组还要让数组中的对象类型也进行依赖收集（递归依赖收集）
   * 6. 如果数组里面方对象，默认对象里的属性是会进行依赖收集的，因为在取值时会进行 JSON.stringify 操作
   */

  function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }
  }

  function proxy(vm, key, source) {
    // 取值的时候做代理，不是暴力的把 _data 属性赋给 vm, 而且直接赋值会有命名冲突的问题
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newValue) {
        vm[source][key] = newValue;
      }

    });
  }

  function initData(vm) {
    let data = vm.$options.data; //
    // 如果用户传递的是一个函数，则取函数的返回值作为对象，如果激素hi对象那就直接使用这个对象
    // 只有根实例 data 可以是一个对象
    // 希望 用户能够 直接 vm.message 进行取值，所以使用了一个 proxy 进行代理 vm._data
    // data 和 vm._data 引用的是同一个  data 被劫持了  vm._data 也被劫持

    data = vm._data = isFunction(data) ? data.call(vm) : data; // 需要将 data 变成响应式的 Object.defineProperty

    console.log('初始化数据');
    observe(data);

    for (const key in data) {
      // vm.message => vm._data.message
      proxy(vm, key, '_data'); // 引用类型
    }
  }

  let queue = []; // 存放要更新的 watcher

  let has = {}; // 存放已有的 watcher 的 id

  let pending = false;

  function flushSchedulerQueue() {
    queue.forEach(watcher => watcher.run());
    queue = [];
    has = {};
    pending = false;
  }

  function queueWatcher(watcher) {
    let id = watcher.id;

    if (!has[id]) {
      has[id] = true;
      queue.push(watcher);

      if (!pending) {
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  }

  let id = 0;

  class Watcher {
    constructor(vm, fn, cb, options) {
      // 要把 dep 放到  watcher 中
      this.vm = vm;
      this.fn = fn;
      this.cb = cb;
      this.options = options;
      this.id = id++; // 要给 watcher 也加一个标识， 防止重复

      this.depsId = new Set();
      this.deps = [];
      this.getter = fn; // fn 就是页面渲染的逻辑

      this.get(); // 表示上来后就做一此初始化
    }

    get() {
      Dep.target = this; // Dep.target = watcher

      this.getter(); // 页面渲染的逻辑

      Dep.target = null; // 渲染完毕后， 就将标识清空了， 只有在渲染的时候才会进行依赖收集
    }

    addDep(dep) {
      let did = dep.id;

      if (!this.depsId.has(did)) {
        // 去重， 只有第一次的 watcher 才被收集到 deps 中
        this.depsId.add(did);
        this.deps.push(dep); // 做了保存 id 的功能， 并且让 watcher 记住 dep

        dep.addSub(this);
      }
    } // 不论是对象还是数组的更新都会走这个 update 函数


    update() {
      //  每次更新数据都会同步调用这个 update 方法， 我可以将更新的逻辑缓存起来， 等会同步更新数据的逻辑执行完毕后，依次调用（有去重的逻辑）
      console.log('update'); // 可以做异步更新 // vue.nextTick [fn1, fn2, fn3] 相同的更新的话，只调用最后一个更新
      // this.get();  

      console.log('缓存更新的地方');
      queueWatcher(this);
    }

    run() {
      console.log('真正更新的地方');
      this.get(); // 延后执行更新逻辑
    }

  }

  function patch(el, vnode) {
    // 删除老节点， 根据 vnode 创建新节点， 替换掉老节点
    const elm = createElm(vnode); // 根据虚拟节点创造了真实节点

    const parentNode = el.parentNode;
    parentNode.insertBefore(elm, el.nextSibling); // el.nextSibling 不存在就是 null, 如果为 null i女色人Before 就是 appendChild 

    parentNode.removeChild(el);
    return elm;
  } // 面试有问  虚拟节点的实现 -> 如何将虚拟节点渲染成真实节点

  function createElm(vnode) {
    const {
      tag,
      data,
      children,
      text,
      vm
    } = vnode; // 我们让虚拟节点和真实节点做一个映射关系， 后续某个虚拟节点更新了 我可以跟踪到真实节点， 并且更新真实节点

    if (typeof tag === 'string') {
      vnode.el = document.createElement(tag); // 如果有 data 属性， 我们需要把data 设置到元素上

      updateProperties(vnode.el, data);
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    console.log(vnode, '---vnode');
    return vnode.el;
  }

  function updateProperties(el, props = {}) {
    for (const key in props) {
      const value = props[key];
      el.setAttribute(key, value);
    }
  }

  function mountComponent(vm) {
    // vue 初始化 dom 节点
    const updateComponent = () => {
      vm._update(vm._render());
    }; // 每个组件都有一个 watcher, 我们把这个 watcher 称之为 渲染 watcher 


    new Watcher(vm, updateComponent, () => {
      console.log('后续增加更新钩子函数 update');
    }, true);
  }
  function lifeCycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      // 采用的是先序深度遍历  创建节点 （遇到节点就创建节点， 递归创建）
      const vm = this;
      vm.$el = patch(vm.$el, vnode);
    };
  }

  function initMixin(Vue) {
    // 后续组件开发的时候 Vue.extend 可以创造一个子组件，子组件可以继承 Vue, 子组件也可以调用 _init 方法
    Vue.prototype._init = function (options) {
      const vm = this; // 把用户的选项放到 vm 上， 这样在其他方法中都可以获取到 options 了

      vm.$options = options; // 为了后续扩展的方法都可以获取 $options 选项
      // $options 中是用户传入的数据 el, data, watch ...

      initState(vm);

      if (vm.$options.el) {
        // 将数据挂载到页面
        console.log('页面要挂载'); // 现在数据已经被劫持了，数据 变化需要更新视图 diff 算法更新需要更新的部分
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

        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      const opts = vm.$options;
      el = document.querySelector(el); // 获取真实的元素

      vm.$el = el; // 页面真实元素

      if (!opts.render) {
        // 模板编译
        let template = opts.template;

        if (!template) {
          template = el.outerHTML;
        }

        const render = compileToFunction(template);
        opts.render = render;
      } // 这里已经获取到了， 一个 render 函数的了，这个函数的返回值 _c('div', {id: 'app'}, _c('span', undefined, 'hello'))


      mountComponent(vm);
    };

    Vue.prototype.$nextTick = nextTick;
  }

  function createElement(vm, tag, data = {}, ...children) {
    // 返回虚拟节点 _c('', {}, ...)
    return vnode(vm, tag, data, children, data.key, undefined);
  }
  function createText(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, data, children, key, text) {
    return {
      vm,
      tag,
      data,
      children,
      key,
      text
    };
  } // vonode 其实就是一个对象， 用来描述节点的， 这个和 ast 长得很像啊
  // ast 描述语法的， 他并没有用户自己的逻辑， 只有雨打解析出来的内容
  // vnode 他是描述 dom 结构的， 可以自己取扩展属性

  function renderMixin(Vue) {
    Vue.prototype._c = function () {
      // createElement 创建元素型的节点
      console.log(arguments);
      const vm = this;
      return createElement(vm, ...arguments);
    };

    Vue.prototype._v = function (text) {
      console.log(arguments);
      const vm = this;
      return createText(vm, text); // 描述虚拟节点是属于那个实例的
    };

    Vue.prototype._s = function (val) {
      // JSON.stringify()
      console.log(arguments);

      if (isObject(val)) {
        return JSON.stringify(val);
      }

      return val;
    };

    Vue.prototype._render = function () {
      const vm = this;
      const {
        render
      } = vm.$options;
      const vnode = render.call(vm);
      console.log(vnode, '--vnode');
      return vnode;
    };
  }

  function Vue(options) {
    this._init(options); // 实现 vue 的初始化功能

  }

  initMixin(Vue);
  renderMixin(Vue);
  lifeCycleMixin(Vue); // 导出 Vue 给别人用
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

  return Vue;

}));
//# sourceMappingURL=vue.js.map
