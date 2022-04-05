import { parserHTML } from './parser';

function genProps(attrs) {
  // {key:val, key: val}
  let str = ''
  for(let i = 0; i< attrs.length; i++) {
    // str
  }
}


function generate(ast) {
  const code = `_c('${ast.tag}', ${
    ast.attrs.length ? '{}' : 'undefined'
  },${
    ast.children ? '[]' : ''
  })`

  return code
}

export function compileToFunction(template) {

  // 1. 将模板变成 ast 语法树
  let ast = parserHTML(template)
  console.log(ast);

  // 代码优化， 标记静态节点


  // 2. 代码生成
  const code = generate(ast)
  console.log(code, '-generate-code');
  
  /**
   * 1. 编译原理
   * 2. 响应式原理 以来手机
   * 3. 组件化开发  （贯穿了 vue 的流程）
   * 4. diff 算法
   */
}