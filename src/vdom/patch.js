
export function patch(el, vnode) {
  // 删除老节点， 根据 vnode 创建新节点， 替换掉老节点

  const elm = createElm(vnode) // 根据虚拟节点创造了真实节点
  const parentNode = el.parentNode;
  parentNode.insertBefore(elm, el.nextSibling); // el.nextSibling 不存在就是 null, 如果为 null i女色人Before 就是 appendChild 

  parentNode.removeChild(el)
  return elm;
}


// 面试有问  虚拟节点的实现 -> 如何将虚拟节点渲染成真实节点

function createElm(vnode) {
  const { tag, data, children, text, vm} = vnode

  // 我们让虚拟节点和真实节点做一个映射关系， 后续某个虚拟节点更新了 我可以跟踪到真实节点， 并且更新真实节点

  if(typeof tag === 'string') {
    vnode.el = document.createElement(tag);
    // 如果有 data 属性， 我们需要把data 设置到元素上
    updateProperties(vnode.el, data)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  }else {
    vnode.el = document.createTextNode(text)
  }
console.log(vnode, '---vnode');
  return vnode.el
}


function updateProperties(el, props = {}) {
  for (const key in props) {
      const value = props[key];
      el.setAttribute(key, value)
  }
}