### vue2响应式理解
可以监控数据的修改和获取。针对对象会给每个对象的属性进行劫持=>Object.defineProperty 针对数组，重写数组的七个方法
=> 内部对所有属性进行了重写，存在性能问题=>使用的时候，如果层级过深，数据不是响应式不要放data中。
在data中的数据如果不是响应式可以用Object.freeze来冻结对象(尽量避免多次取值，取值要做get操作。尽量取一次值，操作后再进行赋值)

### 如何检测数组变化
没有采用defineProperty，主要考虑到性能的问题。是重写了7个会改变数组的方法(函数劫持)，这样导致修改数组索引和长度不会被监控
=>对数组通过原型链的方式对方法进行重写
=>会对数组中的对象再次进行代理，也会对数组中的数组进行函数劫持
// arr[1] = 100 监听不到 arr[1].name = 100 会被监听到

### 如何进行依赖收集=>观察者模式
采用了观察者模式，被观察者是数据(dep) 观察者是watcher
=>watcher和dep是多对多的关系(重新渲染的时候会让属性重新记录watcher)
=>默认渲染的时候会进行依赖收集=>触发get方法，数据更新就找到属性对应的watcher去触发更新
=>页面没用到就不会进行依赖收集，用到的触发get才进行依赖收集
=>取值的时候收集依赖，设值的时候更新视图

!!会把值转成boolean类型

### 模板编译原理
用户传递的是template，需要将template编译成render函数
template=>ast语法树，对语法树进行标记(标记静态节点)，根据ast语法树生成render函数
=> 每次渲染都可以调用render函数返回对应的虚拟节点(递归先子后父)

### 生命周期钩子怎么实现
内部使用了发布订阅的方式，将用户写的钩子函数维护成一个数组，然后依次进行调用(主要靠mergeOptions)

### $destroy怎么触发
路由切换，v-if切换组件，:is动态组件都可以触发

### 生命周期有哪些
beforeCreate 还没实现响应式数据
created 拿到的是响应式数据 服务端渲染可以用来发送请求，因为没有dom(nuxt可以通过attached发送api，服务端渲染没有dom，没有mounted)
beforeMount
mounted 获取到$el 一般在这里发送请求
beforeUpdate
updated 更新前后
activated keep-alive使用
deactivated
beforeDestroy 手动调用移除触发
destroy 销毁后触发
errorCaptured 捕获错误

生命周期是顺序调用的(同步的)，请求是异步的，所以最终获取到数据肯定是在mounted后

### data为什么必须是个函数
组件是通过同一个构造函数多次创建实例，如果是同一个对象数据会被互相影响。
而每个组件本身应该是独立的，所以如果每次都返回一个新对象，这样就不会被影响

### nextTick在哪里使用？原理是什么
主要在异步更新使用
内部采用异步任务进行处理，多个nextTick会被合并成一次，然后在异步任务中按顺序执行

### 组件间传值的方式及区别
- props 父传给子 原理：把props定义在当前的实例上 vm._props(这个对象上的属性都是通过defineReactive来定义)
组件在渲染过程中会去vm上取值，_props属性会被代理到vm上
- emit 儿子触发组件更新 原理：在创建虚拟节点时将所有的事件都绑定到listeners，通过$on绑定事件,$emit触发事件
- events Bus 原理：发布订阅
- $parent $children 在创建子组件的时候会将父组件的实例传入。在组件本身初始化的时候会构建组件间的父子关系
$parent 获取父组件实例 $children 获取子组件实例
- ref 可以获取dom元素和组件实例(虚拟dom没有处理ref，无法拿到根实例，也无法获取组件)
创建dom时会将用户所有的dom操作和属性都维护到一个cbs属性中。依次调用cbs中的方法，会操作ref并赋值
- provide 在父组件中将属性暴露出来 inject 在后代通过inject注入属性
- $attrs(所有组件上的属性，不包括props) $listeners(组件上所有事件)

### v-if和v-for哪个优先级高
v-for优先级更高，编译的时候v-for变成_l函数，而v-if变成三元表达式，_l函数先执行
(v-show会变成一个指令，满足条件继承原来的display属性，否则就是display:none)

axios封装总结


