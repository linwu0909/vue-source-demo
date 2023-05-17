import { mergeOptions } from "./utils";
export function initGlobalAPI(Vue) {
  Vue.options = {
    _base: Vue,
  };

  Vue.mixin = function (mixin) {
    // 合并options
    this.options = mergeOptions(this.options, mixin);
    return this;
  };

  Vue.extend = function (options) {
    // 根据用户参数返回一个构造函数
    function Sub(options = {}) {
      // 最终使用一个组件就是new一个实例
      this._init(options); // 默认对子类进行初始化操作
    }
    Sub.prototype = Object.create(Vue.prototype); // Sub.prototype.__proto__ === Vue.prototype
    Sub.prototype.constructor = Sub;
    // 将用户传递的参数和全局的Vue.options合并
    Sub.options = mergeOptions(Vue.options, options); // 保存用户传递的选项
    return Sub;
  };
  Vue.options.components = {};
  Vue.component = function (id, definition) {
    // 如果definition已经是个函数，说明用户自己调用了Vue.extend
    definition =
      typeof definition === "function" ? definition : Vue.extend(definition);
    Vue.options.components[id] = definition;
  };
}
