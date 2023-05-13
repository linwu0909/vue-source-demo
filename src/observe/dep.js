let id = 0;
class Dep {
  constructor() {
    this.id = id++; // 属性的dep要收集watcher
    this.subs = []; // 存放着当前属性对应的watcher有哪些
  }
  depend() {
    // watcher记住dep，dep也记住watcher=》双向
    Dep.target.addDep(this);
  }
  addSub(watcher) {
    this.subs.push(watcher);
  }
  notify() {
    this.subs.forEach((watcher) => watcher.update());
  }
}

Dep.target = null;

let stack = [];
export function pushTarget(watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}
export function popTarget() {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}

export default Dep;
