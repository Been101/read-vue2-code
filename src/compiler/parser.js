const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;  // 匹配标签名的 aa-xxx
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // aa:aa-xxx

const startTagOpen = new RegExp(`^<${qnameCapture}`); // 此正则可以匹配到标签名  匹配到结果的第一个（索引第一个）[1]
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

console.log(`aaa=xxx`.match(attribute)); // [1] 属性的key  [3] ||  [4] || [5] 属性的值

const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />  >
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;  // {{ xxx }}

// vue3 的编译原理比 vue2 里好很多， 没有这么多正则了




export function parserHTML(html) {
  console.log(html)
  // 可以不停的截取模板，知道把模板全部解析完毕

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
    }
  }
  function start(tag, attrs) {  // [div, p]
    // 遇到开始标签， 就取栈中的最后一个作为父节点
    let parent = stack[stack.length - 1];
    const element = createASTElement(tag, attrs, parent)
    if(root === null) { // 说明当前节点就是根节点
      root = element
    }
  
    if(parent) {
      element.parent = parent; // 更新 p 的parent属性指向 parent
      parent.children.push(element)
    }
  
    stack.push(element)
    console.log(tag, attrs, '---start');
  }
  
  function end(tagName) {
    const endTag = stack.pop()
    if(endTag.tag !== tagName) {
      console.log('标签出错');
    }
  
    console.log(tagName, '---end');
  }
  function text(chars) {
    const parent = stack[stack.length - 1];
    chars = chars.replace(/\s/g, '')
    if(chars) {
      parent.children.push({
        type: 2,
        text: chars
      })
    }
    console.log(chars, '---chars');
  }

  function advance(len) { // 把匹配到的元素删除掉
    html = html.substring(len)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen);
    if(start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
  
      advance(start[0].length)
  
      let end, attr;
      
      while(!(end = html.match(startTagClose)) && (attr =  html.match(attribute))) { // 1. 要有属性 2.不能为开始的结束标签
        match.attrs.push({name: attr[1], value: attr[3] || attr[4] || attr[5]})
        advance(attr[0].length)
      }
      if(end) {
        advance(end[0].length)
      }
      console.log(match, '-----match');
      return match
    }
    return false
  }

  while (html) {
    // 解析标签和文本
    let index = html.indexOf('<');
    if(index === 0) {
      // 解析开始标签， 并且把属性也解析出来
      const startTagMatch = parseStartTag();
      if(startTagMatch) { // 开始标签
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }
      let endTagMatch;
      if(endTagMatch = html.match(endTag)) { // 结束标签
        end(endTagMatch[1]);
        advance(endTagMatch[0].length)
        continue;
      }
    }

    if(index > 0) { // 文本
      let chars = html.substring(0, index) // </div>
      text(chars);
      advance(chars.length)
      console.log('内容是文本');
    }
  }

  console.log(root, '---ast');
  return root
}
