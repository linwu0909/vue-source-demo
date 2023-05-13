// 策略模式
const plot = {};
const LIFECYCLE = ["beforeCreate", "created"];
LIFECYCLE.forEach((hook) => {
  plot[hook] = function (p, c) {
    if (c) {
      if (p) {
        return p.concat(c); // 父子拼接
      } else {
        return [c]; // 把儿子包装成数组
      }
    } else {
      return p; // 只有父亲
    }
  };
});

function mergeOptions(parent, child) {
  const options = {};
  for (let key in parent) {
    // 循环老的
    mergeField(key);
  }
  for (let key in child) {
    // 循环新的
    if (!parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    // 策略模式 =》 减少if/else
    if (plot(key)) {
      options[key] = plot[key](parent[key], child[key]);
    } else {
      // 不在策略中以新的为主
      options[key] = child[key] || parent[key]; // 优先采用新的
    }
  }
}
