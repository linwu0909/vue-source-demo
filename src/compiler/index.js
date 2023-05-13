const ncname = `[a-zA-Z][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配到的分组是一个开始标签名，如 <div 或带命名空间的 <div:xxx，注意不带 > 符号
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配的是结束标签，如 </div>
// 匹配属性，第一个分组是属性的 key，第二个分组是 = 号，第三、四、五分组是属性的 value 值
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const startTagClose = /^\s*(\/?)>/; // 匹配开始标签的 > 符号或自闭和标签，如 <div> 中的 > 或 <br />
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配 {{}} 表达式，如 {{ name }}

function getProps() {
  let str = "";
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];
    if (attr.name === "style") {
      let obj = {};
      attr.value.split(";").reduce((memo, current) => {
        let [key, value] = current.split(":");
        memo[key] = value;
        return memo;
      }, obj);
      attr.value = obj;
    }
    str += `${attr.name}:${JSON.stringify(attr.name)}`;
  }
  return `{${str.slice(0, -1)}}`;
}

function gen(node) {
  if (node.type === 1) {
    return genCode(node);
  } else {
    let text = node.text;
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`; // 不带表达式的
    } else {
      let tokens = [];
      let match;
      // exec遇到全局匹配会有lastIndex问题 每次匹配前需要将lastIndex设为0
      let startIndex = (defaultTagRE.lastIndex = 0);
      while ((match = defaultTagRE.exec(text))) {
        let endIndex = match.index; // 匹配到索引
        if (endIndex > startIndex) {
          tokens.push(JSON.stringify(text.slice(startIndex, endIndex)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        startIndex = endIndex + match[0].length;
      }
      if (startIndex < text.length) {
        // 最后的尾巴放进去
        tokens.push(JSON.stringify(text.slice(startIndex)));
      }
      return `_v(${tokens.join("+")})`; // 将动态和非动态数据拼接在一起
    }
  }
}

function genChildren(ast) {
  const children = ast.children;
  return children.map((child) => gen(child)).join(",");
}

function genCode(ast) {
  let code;
  code = `_c('${ast.tag}', ${
    ast.attrs.length ? genProps(ast.attrs) : "undefined"
  }${ast.children ? "," + genChildren(ast) : ""})`;
  return code;
}

function parseHtml(html) {
  function advance(n) {
    html = html.substring(n);
  }
  let root;
  let stack = [];
  function createASTElement(tagName, attrs) {
    return {
      tag: tagName,
      attrs,
      children: [],
      parent: null,
      type: 1,
    };
  }
  function start(tagName, attrs) {
    let element = createASTElement(tagName, attrs);
    if (root == null) {
      root = element;
    }
    let parent = stack[stack.length - 1]; // 取到栈中的最后一个
    if (parent) {
      // 存储父子元素关系
      element.parent = parent;
      parent.children.push(element);
    }
    stack.push(element);
  }
  function end(tagName) {
    stack.pop();
  }
  while (html) {
    let textEnd = html.indexOf("<");
    if (textEnd === 0) {
      const startTagMatch = parseStarTag(); // 解析开始标签
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }
      let matches;
      if ((matches = html.match(endTag))) {
        end(matches[1]);
        advance(matches[0].length);
        continue;
      }
    }
    let text;
    if (textEnd >= 0) {
      text = html.substring(0, textEnd);
    }
    if (text) {
      advance(text.length);
      chars(text);
    }
  }
  function parseStarTag() {
    const matches = html.match(startTagOpen);
    if (matches) {
      const match = {
        tagName: matches[1],
        attrs: [],
      };
      advance(matches[0].length);
      // 继续解析开始标签的属性
      let end;
      let attr;
      // 没有匹配到结束标签就一直匹配
      // 没有值默认就是true <div disabled></div> =>disabled = true
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || true,
        });
        advance(attr[0].length); // 解析完就进行删除
      }
      if (end) {
        advance(end[0].length);
      }
      console.log(html, match);
    }
  }
}

export function compilerToFunction(template) {
  let ast = parseHtml(template); // 将 template 转化成 ast 语法树
  let code = genCode(ast);
  const render = new Function(`with(this){return ${code}}`);
  // console.log(ast);
  return render;
}
