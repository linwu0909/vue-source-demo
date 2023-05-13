import { mergeOptions } from "./utils";
export function initGlobalAPI(Vue) {
  Vue.options = {};

  Vue.mixin = function (mixin) {
    // 合并options
    this.options = mergeOptions(this.options, mixin);
    return this;
  };
}
