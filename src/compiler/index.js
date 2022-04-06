import { parserHTML } from './parser';
import { generate } from './generate';

export function compileToFunction(template) {

  // 1. 将模板变成 ast 语法树
  let ast = parserHTML(template)
  console.log(ast);
  // 代码优化， 标记静态节点

  // 2. 代码生成
  const code = generate(ast)
  console.log(code, '-generate-code');
  let render = new Function(`with(this){return ${code}}`)
  console.log(render.toString());
  
  /**
   * 1. 编译原理
   * 2. 响应式原理 以来手机
   * 3. 组件化开发  （贯穿了 vue 的流程）
   * 4. diff 算法
   */
}