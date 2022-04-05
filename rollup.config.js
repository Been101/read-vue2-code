
import babel from 'rollup-plugin-babel' 
export default {
  input: 'src/index.js',
  output: {
    file: 'dist/vue.js',
    format: 'umd', // 常见的格式 IIFE ESM CJS UMD
    name: 'Vue', // umd 模块需要配置 name, 会将导出的模块放到 window 上。 如果在 node 中使用 cjs, 如果只是打包 webpack 里面导入 esm 模块， 前端 web script 中 iife。
    sourcemap: true
  },
  plugins: [
    babel({ 
      exclude: 'node_modules/**' // glob 写法去掉 node_modules 下的所有文件。
    })
  ]
}