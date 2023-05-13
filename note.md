mac=>control+c终止命令行

### 数据响应式
1) vue2采用属性劫持，通过defineProperty给每个属性增加get和set，是递归操作
2) 数组采用函数劫持，重写了7个改变数组的方法，但是没有监听数组的索引和长度。数组中的对象类型会进行响应式处理


1) 将数据处理成响应式 initState(对象defineProperty, 数组重写方法)
2) 模版编译：将模版先转成ast语法树，将ast语法树生成render方法
3) 调用render函数 会进行取值操作 产生对于的虚拟dom render(){ _c('div', null, _v(name)) } 触发get方法
4) 将虚拟dom渲染成真实dom

#### 依赖收集
给模版的属性增加一个收集器dep
页面渲染的时候，将渲染逻辑封装到watcher中 vm._update(vm._render())
让dep记住这个watcher即可，稍后属性变化了可以找到对应的dep中存放的watcher进行重新渲染

### vue核心流程：
1) 创建响应式数据
2) 模版转换成ast语法树
3) 将ast语法树转换成render函数
4) 每次数据更新可以只执行render函数
render函数会去产生虚拟节点，根据生成的虚拟节点创造真实dom

// dep和watcher是多对多关系
// 一个属性可以在多个组件中使用，一个dep对应多个watcher
// 一个组件由多个属性组成，一个watcher对应多个dep
// 每个属性有一个dep(属性是被观察者，watcher是观察者)，属性变化了会通知观察者去更新

### nextTick
既有同步也有异步。
优雅降级=》promise(ie不兼容)=>mutationObserver(仅浏览器可用的h5api)=>setImmediate(仅ie10和node支持)=>setTimeout

### 计算属性
计算属性也是一个watcher，默认渲染会创造一个渲染watcher
底层是一个带有dirty属性的watcher

### watch实现逻辑

### diff算法

### 数组为什么尽量不用index做为key
可能会出现错误复用=>