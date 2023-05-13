import Dep from "./observe/dep";
import { observe } from "./observe/index";
import Watcher, { nextTick } from "./observe/watcher";
export default function initState(vm) {
  const options = vm.$options;
  if (options.data) {
    initData(vm);
  }
  if (options.computed) {
    initComputed(vm);
  }
  if (options.watch) {
    initWatch(vm);
  }
}

function initWatch(vm) {
  let watch = vm.$options.watch;
  for (let key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler[i]);
    }
  }
}

function createWatcher() {
  vm.$watch;
}

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newValue) {
      vm[source][key] = newValue;
    },
  });
}

function initData(vm) {
  let data = vm.$options.data;
  // 是函数就拿函数的返回值 否则直接拿data
  data = vm._data = typeof data === "function" ? data.call(vm) : data;
  // 对vm._data进行代理，用户可以通过vm.xxx或者vm._data.xxx取值
  for (let key in data) {
    proxy(vm, "_data", key);
  }
  observe(data);
}
function initComputed(vm) {
  const computed = vm.$options.computed;
  const watchers = (vm._computedWatchers = {});
  for (let key in computed) {
    let userDef = computed[key];
    // 监控计算属性中get的变化
    let fn = typeof userDef === "function" ? userDef : userDef.get;
    // 直接new Watcher默认会执行fn，将属性和watcher对应起来
    watchers[key] = new Watcher(vm, fn, { lazy: true });
    defineComputed(vm, key, userDef);
  }
}
function defineComputed(target, key, userDef) {
  const getter = typeof userDef === "function" ? userDef : userDef.get;
  const setter = userDef.set || (() => {});
  Object.defineProperties(target, key, {
    get: createComputedGetter(getter),
    set: setter,
  });
}
// 计算属性不会收集依赖，只会让自己的依赖属性去收集依赖
function createComputedGetter() {
  return function () {
    const watcher = this._computedWatchers[key]; // 获取到对应属性的watcher
    if (watcher.dirty) {
      // 脏的去执行用户传入的函数
      // 求值后dirty会变成false
      watcher.evaluate();
    }
    if (Dep.target) {
      // 计算属性出栈后，还要渲染watcher
      watcher.depend();
    }
    return watcher.value;
  };
}

export function initStateMixin(Vue) {
  Vue.prototype.$nextTick = nextTick;
  Vue.prototype.$watch = function (exprOrFn, cb) {
    // 监听的值改变 直接执行cb函数即可
    new Watcher(this, exprOrFn, { user: true }, cb);
  };
}
