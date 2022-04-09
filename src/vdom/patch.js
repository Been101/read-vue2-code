import { isSameVnode } from "../utils";

export function patch(oldVnode, vnode) {
  const isRealElement = oldVnode.nodeType // 如果是真实节点 nodeType 有值是 1
  if(isRealElement) {
    // 删除老节点， 根据 vnode 创建新节点， 替换掉老节点
    const elm = createElm(vnode) // 根据虚拟节点创造了真实节点
    const parentNode = oldVnode.parentNode;
    parentNode.insertBefore(elm, oldVnode.nextSibling); // el.nextSibling 不存在就是 null, 如果为 null, insertBefore 就相当于 appendChild 

    parentNode.removeChild(oldVnode)
    return elm; // 返回最新节点
  }else {
    console.log(oldVnode, 'patch-oldVnode');
    console.log(vnode, 'patch-vnode');
    // diff 算法如何实现?
    // 只比较同级，如果不一样，子元素就不用对比了，根据当前节点，创建子元素，全部替换掉
    if(!isSameVnode(oldVnode, vnode)) { // 如果新旧节点不是同一个， 删除老的换成新的
      return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
    }
    // 下面是 相同节点的情况
    const el = vnode.el = oldVnode.el; // 复用节点

     // 文本直接更新即可，因为文本没有儿子
    if (!oldVnode.tag) { // 没有标签，表明是文本
      if(oldVnode.text !== vnode.text) {
        return el.textContent = vnode.text
      }
    }

    // 元素，新的虚拟节点
    updateProperties(vnode, oldVnode.data)


  }
  
}


// 面试有问  虚拟节点的实现 -> 如何将虚拟节点渲染成真实节点

function createElm(vnode) {
  const { tag, data, children, text, vm} = vnode

  // 我们让虚拟节点和真实节点做一个映射关系， 后续某个虚拟节点更新了 我可以跟踪到真实节点， 并且更新真实节点

  if(typeof tag === 'string') {
    vnode.el = document.createElement(tag);
    // 如果有 data 属性， 我们需要把data 设置到元素上
    updateProperties(vnode) // 重构一下更新属性的逻辑
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  }else {
    vnode.el = document.createTextNode(text)
  }
  console.log(vnode, '---vnode');
  return vnode.el
}


function updateProperties(vnode, oldProps = {}) {
  // 初次渲染直接用 oldProps 给 vnode 的 el 赋值即可


  // 更新逻辑，拿到老的 props 和 vnode 里面的 data 进行比对
  const el = vnode.el; // dom真实的节点
  const newProps = vnode.data || {}

  const newStyle = newProps.style || {}
  const oldStyle = oldProps.style || {}

  for (const key in oldStyle) { // 老的样式有， 新的没有， 就把页面上的样式删除掉
    if(!newStyle[key]) {
      el.style[key] = ''
    }
  }

  // 新旧比对，两个对象如果比对差异?
  for (const key in newProps) {
    if( key === 'style') {
      for (const key in newStyle) {  // {style: {color: red}}
           el.style[key] = newStyle[key];
      }
    }else {
      el.setAttribute(key, newProps[key])

    }
  }
  for (const key in oldProps) {
    el.removeAttribute(key, oldProps[key])
}
  
}