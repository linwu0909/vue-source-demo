export function createElement(vm, tag, data = {}, ...children) {
  return vNode(vm, tag, data, children, data.key, null);
}

export function createTextNode(vm, text) {
  return vNode(vm, null, null, null, null, text);
}

function vNode(vm, tag, data, children, key, text) {
  return {
    vm,
    tag,
    data,
    children,
    key,
    text,
  };
}

export function isSameVNode(vNode1, vNode2) {
  return vNode1.tag === vNode2.tag && vNode1.key === vNode2.key;
}
