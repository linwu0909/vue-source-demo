import arrayPrototype from "./array";
import Dep from "./dep";

class Observe {
  constructor(data) {
    // 给每个对象增加收集功能
    this.dep = new Dep();
    // __ob__标识已被观测过
    Object.defineProperty(data, "__ob__", {
      value: this,
      enumerable: false, // 不可枚举
    });
    if (Array.isArray(data)) {
      data.__proto__ = arrayPrototype;
      this.observeArray(data);
    } else {
      this.walk(data);
    }
  }
  observeArray(data) {
    data.forEach((item) => observe(item));
  }
  walk(data) {
    let keys = Object.keys(data);
    keys.forEach((key) => {
      // defineProperty实现响应式数据
      defineReactive(data, key, data[key]);
    });
  }
}

function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    let current = value[i];
    if (current.__ob__) {
      // =>等价于current.__ob__ && current.__ob__.dep.depend()
      current.__ob__.dep.depend();
    }
    if (Array.isArray(current)) {
      dependArray(current);
    }
  }
}

// 性能不好：由于value可能是个对象，所以会进行递归。所有属性会被重新定义
function defineReactive(data, key, value) {
  //闭包+属性劫持
  let childOb = observe(value);
  let dep = new Dep(); // 每个属性都有一个dep
  Object.defineProperty(data, key, {
    get() {
      if (Dep.target) {
        dep.depend(); // 让这个属性的收集器记住当前的watcher
        if (childOb) {
          childOb.dep.depend(); // 让数组和对象本身也实现依赖收集
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value;
    },
    set(newValue) {
      if (newValue === value) return;
      observe(value);
      value = newValue;
      dep.notify(); //通知更新
    },
  });
}

export function observe(data) {
  if (typeof data !== "object" || data == null) {
    return;
  }
  if (data.__ob__) {
    return data;
  }
  return new Observe(data);
}
