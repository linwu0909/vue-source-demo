import { isSameVNode } from "./index";

export function patch(oldVNode, vNode) {
  if (!oldVNode) {
    return createElm(vNode); // vm.$el对应的就是组件渲染的结果了
  }

  // oldVNode可能是后续做虚拟节点的时候 两个虚拟节点的比较
  const isRealElement = oldVNode.nodeType;
  if (isRealElement) {
    // 有值说明是一个真实dom元素
    const oldElm = oldVNode;
    // 需要获取父节点 将当前节点的下一个元素作为参照物 将他插入，之后删除老节点
    const parentNode = oldElm.parentNode; // 父节点
    let el = createElm(vNode); //
    parentNode.insertBefore(el, oldElm.nextSibling);
    parentNode.removeChild(oldElm);
    return el;
  } else {
    return patchVNode(oldVNode, vNode);
  }
}

function patchVNode(oldVNode, vNode) {
  if (!isSameVNode(oldVNode, vNode)) {
    // 不是同一个节点 直接用新的换老的
    let el = createElm(vNode);
    oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
    return el;
  }

  // 比较文本内容
  let el = (vNode.el = oldVNode.el); // 复用老节点的元素
  if (!oldVNode.tag) {
    // 是文本
    if (oldVNode.text !== vNode.text) {
      el.textContent = vNode.text; // 用新的文本覆盖老的
    }
  }
  // 是标签我们需要比对标签的属性
  patchProps(el, oldVNode.data, vNode.data);

  let oldChildren = oldVNode.children || [];
  let newChildren = vNode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 完整的diff算法，需要比较两个人的儿子
    updateChildren(el, oldChildren, newChildren);
  } else if (newChildren.length > 0) {
    // 老的没有，新的有
    mountChildren(el, newChildren);
  } else if (oldChildren.length > 0) {
    // 新的没有老的有，要删除
    el.innerHTML = ""; // 可以循环删除
  }

  return el;
}

function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    el.appendChild(createElm(child));
  }
}

function updateChildren(el, oldChildren, newChildren) {
  // 双指针
  let oldStartIndex = 0;
  let newStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newEndIndex = newChildren.length - 1;

  let oldStartVNode = oldChildren[0];
  let newStartVNode = newChildren[0];

  let oldEndVNode = oldChildren[oldEndIndex];
  let newEndVNode = newChildren[newEndIndex];

  function makeIndexByKey(children) {
    let map = {};
    children.forEach((child, index) => {
      map[child.key] = index;
    });
    return map;
  }
  let map = makeIndexByKey(oldChildren);

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVNode) {
      oldStartVNode = oldChildren[++oldStartIndex];
    } else if (!oldEndVNode) {
      oldEndVNode = oldChildren[--oldEndIndex];
    } else if (isSameVNode(oldStartVNode, newStartVNode)) {
      // 双方有一方头指针大于尾指针就停止
      // 头头比对
      patchVNode(oldStartVNode, newStartVNode); // 相同节点 递归比较子节点
      oldStartVNode = oldChildren[++oldStartIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else if (isSameVNode(oldEndVNode, newEndVNode)) {
      // 尾尾比对
      patchVNode(oldEndVNode, newEndVNode);
      oldEndVNode = oldChildren[--oldEndIndex];
      newEndVNode = newChildren[--newEndIndex];
    } else if (isSameVNode(oldEndVNode, newStartVNode)) {
      // 尾头比对
      patchVNode(oldEndVNode, newStartVNode);
      // insertBefore会将元素移动
      el.insertBefore(oldEndVNode.el, oldStartVNode.el); // 将老的从尾巴移动到前面去
      oldEndVNode = oldChildren[--oldEndIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else if (isSameVNode(oldStartVNode, newEndVNode)) {
      // 头尾比对
      patchVNode(oldStartVNode, newEndVNode);
      el.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling); // 将老的从头部移动到尾巴去
      oldStartVNode = oldChildren[++oldStartIndex];
      newEndVNode = newChildren[--newEndIndex];
    } else {
      // 乱序比对
      // 根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后多余的就删除
      let moveIndex = map[newStartVNode.key]; // 能从映射中拿到说明是要移动的索引
      if (moveIndex !== undefined) {
        let moveVNode = oldChildren[moveIndex]; // 找到对应的虚拟节点复用
        el.insertBefore(moveVNode.el, oldStartVNode.el);
        oldChildren[moveIndex] = undefined; // 表示这个节点移动走了
        patchVNode(moveVNode, newStartVNode);
      } else {
        el.insertBefore(createElm(newStartVNode), oldStartVNode.el);
      }
      newStartVNode = newChildren[++newStartIndex];
    }
  }

  if (newStartIndex <= newEndIndex) {
    // 新的多了，多的就插入进去
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let childEl = createElm(newChildren[i]);
      // 可能是向后追加，也可能是向前追加
      let anchor = newChildren[newEndIndex + 1]
        ? newChildren[newEndIndex + 1].el
        : null;
      el.insertBefore(childEl, anchor); // anchor为null会认为是appendChild=>移动或追加
    }
  }
  if (oldStartIndex <= oldEndIndex) {
    // 老的多了，需要删除多的
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {
        let childEl = oldChildren[i].el;
        el.removeChild(childEl);
      }
    }
  }
}

function createComponent(vNode) {
  let i = vNode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vNode); // 初始化组件 找到init方法
  }
  if (vNode.componentInstance) {
    return true; // 说明是组件
  }
}

export function createElm(vNode) {
  let { tag, data, children, text } = vNode;
  if (typeof tag === "string") {
    // 创建真实元素 也要区分组件还是元素
    if (createComponent(vNode)) {
      return vNode.componentInstance.$el;
    }

    // 元素
    vNode.el = document.createElement(tag); // diff算法 拿虚拟节点比对后更新dom
    patchProps(vNode.el, data);
    children.forEach((child) => {
      vNode.el.appendChild(createElm(child)); // 递归渲染
    });
  } else {
    // 文本
    vNode.el = document.createTextNode(text);
  }
  return vNode.el; // 从根虚拟节点创建真实节点
}
// 每次更新页面dom结果不会变，调用render方法时，数据变化了会根据数据渲染成新的虚拟节点，再用新的虚拟节点渲染dom

export function patchProps(el, oldProps = {}, props = {}) {
  let oldStyles = oldProps.style || {};
  let newStyles = props.style || {};
  for (let key in oldStyles) {
    // 老的样式中有新的没有，没有则删除
    if (!newStyles[key]) {
      el.style[key] = "";
    }
  }
  for (let key in oldProps) {
    if (!props[key]) {
      // 老的属性中有新的没有，删除属性
      el.removeAttribute(key);
    }
  }
  for (let key in props) {
    // 用新的覆盖老的
    if (key === "style") {
      for (let styleName in props.style) {
        el.style[styleName] = props.style[styleName];
      }
    } else {
      el.setAttribute(key, props[key]);
    }
  }
}
