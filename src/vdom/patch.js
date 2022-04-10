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

    // 元素，新的虚拟节点, 是相同节点了，复用节点，再更新不一样的地方（属性）
    updateProperties(vnode, oldVnode.data)

    // 比较儿子节点

    const oldChildren = oldVnode.children || [];
    const newChildren = newChildren.children || [];

    // 情况1， 老的有儿子， 新的没有儿子
    if(oldChildren.length > 0 && newChildren.length === 0) {
      el.innerHTML = '' // 暴力清空，
    }else if(newChildren.length > 0 && oldChildren.length === 0) {
      // 新的有儿子， 老的没有儿子， 直接将新的插入即可
      newChildren.forEach(child => el.appendChild(createElm(child))) // 尽量不要一个一个的插入， 可以同片段，一次插入
    }else {
      // 新老都有儿子
      updateChildren(el, oldChildren, newChildren)
    }

  }
  
}


function updateChildren(el, oldChildren, newChildren) {
  // vue2 如何做 diff 算法

  // vue 内部做了优化（能尽量提升性能，如果实在不行， 再暴力比对）
  // 1. 在列表中新增和删除的情况
  let oldStartIndex = 0;
  let oldStartVnode = oldChildren[0]
  let oldEndIndex = oldChildren.length - 1
  let oldEndVnode = oldChildren[oldEndIndex]

  let newStartIndex = 0;
  let newStartVnode = newChildren[0]
  let newEndIndex = newChildren.length - 1
  let newEndVnode = newChildren[newEndIndex]

  // diff 算法的复杂度是 O(n), 比对的时候 指针交叉的时候就是比对完成

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if(isSameVnode(oldStartVnode, newStartVnode)) {
      patch(oldStartVnode, newStartVnode); // 会递归比较自杰斯按， 同时比对这两个的差异
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }else if(isSameVnode(oldEndVnode, newEndVnode)) {
      patch(oldEndVnode, newEndVnode); // 会递归比较自杰斯按， 同时比对这两个的差异
      oldEndVnode = oldChildren[++oldEndIndex]
      newEndVnode = newChildren[++newEndIndex]
    }else if(isSameVnode(oldStartVnode, newEndVnode)) { // 老的第一个和新和最后一个一样
      patch(oldStartVnode, newEndVnode)
        // 把老的第一个节点插到， 老的最后一个节点的下一个节点之前
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling) // 先移动dom 节点， 再移动指针
      oldStartVnode = oldChildren[++oldStartIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if(isSameVnode(oldEndVnode, newStartVnode)) { // 老的第一个和新和最后一个一样
      patch(oldEndVnode, newStartVnode)
        // 把老的最后一个节点插到老的第一个节点之前
      el.insertBefore(oldEndVnode.el, oldStartVnode.el) // 先移动dom 节点， 再移动指针
      oldEndVnode = oldChildren[--oldEndIndex];
      oldStartVnode = newChildren[++newEndIndex];
    } else {
      // 之前的逻辑都是考虑用户一些特殊情况， 但是有非特殊的， 乱排序
    }
  }

  if(newStartIndex <= newEndIndex) {
     // 看一下，当前节点的下一个元素是否存在， 如果存在则是插入到下一个元素的前面。
      // 如果下一个是 null, 就是 appendChild
      let anchor = newChildren[newEndIndex + 1] === null ? null : newChildren[newEndIndex + 1].el;  // 参照物是不变的
      // newChildren[newEndIndex + 1].el  要插在这个节点的前面
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 这里可能是向前追加， 可能是向后追加
      el.insertBefore(createElm(newChildren[i]), anchor) // 尽量不要一个一个的插入， 可以同片段，一次插入
    }
  }

  if(oldStartIndex <= oldEndIndex) {
    // 老的多，新的少
    // 把多余的删掉
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      const child =  oldChildren[i];
      el.removeChild(child.el)
    }
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