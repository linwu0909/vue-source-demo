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
    let vnode = render.call(vm);
    return vnode;
  };
  // 虚拟节点变成真实节点
  Vue.prototype._update = function (vnode) {
    // 将vnode渲染到el元素中
    const vm = this;
    // 初始化渲染+后续更新
    vm.$el = patch(cm.$el, vnode);
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
