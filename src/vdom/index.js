export function createElement(vm, tag, data = {}, ...children) { // 返回虚拟节点 _c('', {}, ...)
  return vnode(vm, tag, data, children, data.key, undefined)
}

export function createText(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text)
}

function vnode(vm, tag, data, children, key, text) {
  return {vm, tag, data, children, key, text}
}

// vonode 其实就是一个对象， 用来描述节点的， 这个和 ast 长得很像啊
// ast 描述语法的， 他并没有用户自己的逻辑， 只有雨打解析出来的内容
// vnode 他是描述 dom 结构的， 可以自己取扩展属性