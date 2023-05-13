import initState from "./state";
import { compilerToFunction } from "./compiler/index";
import { callHook, mountComponent } from "./lifecycle";
export default function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    // 将options绑定到实例中
    vm.$options = mergeOptions(this.constructor.options, options); // 将用户的选项挂载到实例上

    callHook(vm, "beforeCreate");
    initState(vm);
    callHook(vm, "created");

    // 初始化完毕进行页面挂载
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };

  Vue.prototype.$mount = function (el) {
    const vm = this;
    el = document.querySelector(el);
    const options = vm.$options;
    // 先判断是否有render函数，没有判断是否有template，没有最后用outerHtml作为template
    // 然后把template转成render
    if (!options.render) {
      let template = options.template;
      if (!template) {
        template = el.outerHTML;
      }

      const render = compilerToFunction(template);
      options.render = render;
    }
    mountComponent(vm, el);
  };
}

// diff算法：主要是两个虚拟节点比对，根据模版编译出一个render函数，render函数可以返回一个虚拟节点
// 数据更新重新调用render函数，可以再返回一个虚拟节点
