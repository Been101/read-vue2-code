const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;  // {{ xxx }}


function genProps(attrs) {
  // {key:val, key: val}
  let str = ''
  for(let i = 0; i< attrs.length; i++) {
    let attr = attrs[i];
    if(attr.name === 'style') { // {name: id, value: 'app'}
      const styles = {}
      attr.value.replace(/([^;:]+):([^;:]+)/g, function() {
        styles[arguments[1]] = arguments[2]
      })
      attr.value = styles
    }
    str += `${attr.name}: ${JSON.stringify(attr.value)},`
  }
  return `{${str.slice(0, -1)}}`
}

function gen(el) {
  if(el.type === 1) {
    return generate(el);
  }else {
    const text = el.text; // {{}}
    if(!defaultTagRE.test(text)) return `_v('${text}')`  // 说明就是普通文本

    // 说明有表达式，需要做一个表达式和普通值得拼接 ['message', _s(name), 'bbb'].join('+')
    // _v('aaa' + _s(name) + 'bb')
    let lastIndex = defaultTagRE.lastIndex = 0
    const tokens = []
    let match;
    while (match = defaultTagRE.exec(text)) { // 如果正则 + g, 配合 exec 就会有个问题 lastIndex 的问题
      let index = match.index;
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      tokens.push(`_s(${match[1].trim()})`)
      lastIndex = index + match[0].length
      
    }
    // <div> aaa</div>
    if(lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
    }

    return `_v(${tokens.join('+')})`
  }
}

function genChildren(el) {
  const children = el.children
  if(children) {
    return children.map(item => gen(item)).join(',')
  }
  return false
}


export function generate(ast) {
  const children = genChildren(ast);

  const code = `_c('${ast.tag}', ${
    ast.attrs.length ? genProps(ast.attrs) : 'undefined'
  },${
    children ? children : ''
  })`

  return code
}