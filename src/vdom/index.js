export function createElement(vm, tag, data = {}, ...children) {
  if (data == null) {
    data = {};
  }
  let key = data.key;
  if (key) {
    delete data.key;
  }
  if (isReservedTag(tag)) {
    return vNode(vm, tag, key, data, children);
  } else {
    // 创造一个组件的虚拟节点
    let cTor = vm.$options.components[tag];
    return createComponentVNode(vm, tag, key, data, children, cTor);
  }
}

function createComponentVNode(vm, tag, key, data, children, cTor) {
  if (typeof cTor === "object") {
    cTor = vm.$options._base.extend(cTor);
  }
  data.hook = {
    init(vNode) {
      // 稍后创建真实节点的时候，如果是组件则调用init
      // 保存组件的实例到虚拟节点上
      let instance = (vNode.componentInstance =
        new vNode.componentOptions.cTor());
      instance.$mount();
    },
  };
  return vNode(vm, tag, key, data, children, null, { cTor });
}

export function createTextNode(vm, text) {
  return vNode(vm, null, null, null, null, text);
}

const isReservedTag = (tag) => {
  return ["a", "div", "p", "button", "ul", "li", "span"].includes(tag);
};

function vNode(vm, tag, data, children, key, text, componentOptions) {
  return {
    vm,
    tag,
    data,
    children,
    key,
    text,
    // 组件的构造函数
    componentOptions,
  };
}

export function isSameVNode(vNode1, vNode2) {
  return vNode1.tag === vNode2.tag && vNode1.key === vNode2.key;
}
