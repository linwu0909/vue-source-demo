let oldArrayPrototype = Array.prototype;

let arrayPrototype = Object.create(oldArrayPrototype);
// vue2重写了7个方法，不是代理，所以监听不到索引和数组长度
let methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];
methods.forEach((method) => {
  // 用户调用方法会先经历重写的方法，之后再调用数组原来的方法
  arrayPrototype[method] = function (...args) {
    let inserted;
    let ob = this.__ob__;
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice": // arr.splice(1,1,xxx) => 只要最后的参数
        inserted = args.slice(2);
      default:
        break;
    }
    if (inserted) {
      // 对新增的数据再次进行观测
      ob.observeArray(inserted);
    }
    oldArrayPrototype[method].call(this, ...args);
    ob.dep.notify(); // 数组变化了通知对应的watcher去更新
  };
});

export default arrayPrototype;
