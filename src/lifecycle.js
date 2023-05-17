import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

// 创造对应的虚拟节点进行渲染
export function LifeCycleMixin(Vue) {
  Vue.prototype._c = function () {
    return createElement(this, ...arguments);
  };
  Vue.prototype._v = function () {
    return createTextNode(this, ...arguments);
  };
  // 将数据转化成字符串 因为使用的变量对应的结果可能是一个对象
  Vue.prototype._s = function (value) {
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  };
  Vue.prototype._render = function () {
    const vm = this;
    const render = vm.$options.render;
    let vNode = render.call(vm);
    return vNode;
  };
  // 虚拟节点变成真实节点
  Vue.prototype._update = function (vNode) {
    // 将vNode渲染到el元素中
    const vm = this;
    const el = vm.$el;

    const preVNode = vm._vNode;
    vm._vNode = vNode; // 将第一次产生的虚拟节点保存到_vNode上
    if (preVNode) {
      // 之前渲染过了
      vm.$el = patch(preVNode, vNode);
    } else {
      vm.$el = patch(el, vNode);
    }
  };
}

export function mountComponent(vm, el) {
  vm.$el = el;
  const updateComponent = () => {
    // 需要调用生成的render函数，获取到虚拟节点
    // 生成真实dom
    vm._update(vm._render());
  };
  new Watcher(vm, updateComponent, true); // true用于标识是一个渲染watcher
  // 根据虚拟dom产生真实dom
  // 插入到el元素中
}

export function callHook(vm, hook) {
  // 调用钩子函数
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.forEach((handler) => handler.call(vm));
  }
}
