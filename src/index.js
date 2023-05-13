import { initGlobalAPI } from "./globalAPI";
import initMixin from "./init";
import { initStateMixin } from "./state";
// 构造函数
function Vue(options) {
  this._init(options);
}

initMixin(Vue); // 扩展init方法

LifeCycleMixin(Vue); // vm._update, vm._render

initGlobalAPI(Vue); // 全局api的实现

initStateMixin(); // 实现nextTick和$watch

export default Vue;
