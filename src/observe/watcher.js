import Dep, { popTarget, pushTarget } from "./dep";

let id = 0;

class Watcher {
  // 不同组件有不同的watcher
  constructor(vm, exprOrFn, options) {
    this.id = id++;
    this.renderWatcher = options; // 是一个渲染watcher

    if (typeof exprOrFn === "string") {
      this.getter = function () {
        return vm[exprOrFn];
      };
    } else {
      this.getter = exprOrFn; // getter意味着调用这个函数可以发生取值操作
    }

    this.deps = [];
    this.depsId = new Set();
    this.lazy = options.lazy;
    this.cb = cb;
    this.dirty = this.lazy; // 缓存值
    this.vm = vm;

    this.value = this.lazy ? undefined : this.get();
  }

  addDep(dep) {
    // 一个组件对应多个属性 属性去重，不重复记录
    let id = dep.id;
    if (!this.depsId.has(id)) {
      this.deps.push(dep);
      this.depsId.add(id);
      dep.addSub(this); // watcher记住dep并进行去重，让dep也记住watcher
    }
  }

  evaluate() {
    // 获取到返回值 并进行标识
    this.value = this.get();
    this.dirty = false;
  }

  get() {
    // Dep.target = this; // 静态属性只有一份
    pushTarget(this);
    let value = this.getter.call(this.vm); // 会去vm上取值
    // Dep.target = null; // 渲染完毕后清空
    popTarget();
    return value;
  }

  depend() {
    // watcher的depend就是让watcher中的dep去depend
    let i = this.deps.length;
    while (i--) {
      // 让计算属性的watcher也收集渲染watcher
      this.deps[i].depend();
    }
  }

  update() {
    if (this.lazy) {
      // 如果是计算属性 依赖值变化了就标识计算属性是脏值
      this.dirty = true;
    } else {
      queueWatcher(this); // 把watcher暂存起来
    }
  }

  run() {
    // this.get();
    let oldValue = this.value;
    let newValue = this.get();
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue);
    }
  }
}

let queue = [];
let has = {};
let pending = false;

function flushSchedulerQueue() {
  let flushQueue = queue.slice(0);
  queue = [];
  has = {};
  pending = false;
  flushQueue.forEach((q) => q.run()); // 刷新过程中可能有新的watcher，重新放入queue中
}

function queueWatcher(watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    // 不管update执行多少次，最终只执行一次刷新=》异步，以最后一次为准
    if (!pending) {
      setTimeout(flushSchedulerQueue, 0);
      pending = true;
    }
  }
}

// 需要给每个属性增加一个dep 目的是收集watcher
// 一个组件中有多少个属性(n个属性会对应一个视图) n个dep对应一个watcher
// 多对多的关系

let callbacks = [];
let waiting = false;
function flushCallbacks() {
  let cbs = callbacks.slice(0);
  waiting = false;
  callbacks = [];
  cbs.forEach((cb) => cb()); // 按照顺序依次执行
}

let timerFunc;
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  let observer = new MutationObserver(flushCallbacks); // 这里的回调是异步执行
  let textNode = document.createTextNode(1);
  observer.observe(textNode, {
    characterData: true,
  });
  timerFunc = () => {
    textNode.textContent = 2;
  };
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks);
  };
}

export function nextTick(cb) {
  callbacks.push(cb); // 维护nextTick中的cb方法
  if (!waiting) {
    timerFunc(); // 最后一起刷新
    waiting = true;
  }
}

export default Watcher;
