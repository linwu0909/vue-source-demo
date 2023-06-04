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
template=>ast语法树，对语法树进行标记(标记静态节点，静态节点生成dom不需要改变，提高性能)，根据ast语法树生成render函数
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

### v-model实现原理
v-model在组件和原生标签上不同
原生标签：
在不同元素上会有不同编译结果，比如文本，会被编译成value+input+指令。
(value和input会阻止中文触发，此时v-model的值不会在中文输入过程中更新，指令的作用就是处理中文输入完毕后，手动触发更新)
组件：
在父组件的v-model等价于:value="msg" @input="func()" 用value传递props，用input派发事件
(会看一下是否有自定义的prop和event，没有会被解析成:value="value" @input="input()")

### .sync修饰符作用
为了实现状态同步的(vue3移除了)=>可以用在父子组件props双向绑定(不然就是子组件通过$emit触发事件进行修改)

### vue指向
对象.xxx this指向的就是对象
xxx() this指向的就是全局
new XXX() this指向的就是实例或者构造函数的返回结果(是对象)

### vue.use作用
将vue的构造函数传递给插件，让所有插件依赖的vue都是同个版本
(可以看到vue-router和vueX插件的package.json都没有引入vue，都是通过vue.use传入)
默认调用插件的install方法

### 组件中name的作用
除了标识的作用，有name属性的组件还可以递归调用自己

### slot如何实现的
普通插槽：(普通插槽渲染作用域在父组件中)
- 在解析组件的时候会将组件的children放到componentOptions上作为虚拟节点的属性
- 将children取出来放到组件的vm.$options._renderChildren中
- 做一个映射表放到vm.$slots上=>将结果放到vm.$scopeSlots上 
- 渲染组件的时候调用_t方法 此时会去vm.$scopeSlots找到对应的函数来渲染内容
具名插槽：和普通插槽相同，多了名字
作用域插槽：(普通插槽渲染作用域在子组件中)
- 渲染的时候不会作为children，将作用域插槽做成了一个属性scopeSlots
- 做一个映射关系
- 稍后渲染组件的模版的时候 会通过name找到对应的函数 将数据传入到函数中此时才渲染虚拟节点 
- 用这个虚拟节点替换_t('default')

### keep-alive平时在哪里使用？原理？
1.在路由中使用 2.在components:is中使用(缓存)
默认缓存加载过的组件对应的实例，内部使用了LRU算法
下次组件切换加载的时候，会找到对应缓存的节点来进行初始化，采用上次缓存的$el来触发(不用再将虚拟节点转成真实节点)
更新和销毁会触发actived和deactived

### 怎么理解自定义指令
自定义指令就是用户自定义的钩子，当元素在不同的状态会调用对应的钩子，所有的钩子会被合并到cbs对应的方法上，然后依次调用

### vue事件修饰符有哪些？实现原理是什么
v-lazy
v-has

主要靠的是模板编译原理

编译时候直接编译到事件内部：
- @click.prevent
- @click.stop

编译的时候增加标识:
- @click.passive => &click
- @click.capture => !click
- @click.once => ~click

键盘事件:
keyup

### runtime only 和runtime + compiler区别
runtime only 需要借助如webpack的vue-loader将.vue文件编译成js=》是在编译阶段做的，只包含运行时的js代码，体积更轻量
runtime + compiler 会在客户端进行编译，在运行时做的，会对性能有影响
=> 一般用runtime only
#### rollup参数
web-runtime: 运行时(无法解析传入的template，通常使用这个，通过vue-loader可以将模板转成render函数)
web-full: 运行时+模版编译=>本地dev调试

### 为什么可以new Vue
因为实际上vue就是一个用function实现的类
#### 为什么不直接用class来实现呢
因为很多功能都是基于vue的prototype进行扩展，vue按功能把这些扩展分散到了多个模块中，而不是放在一个模块里实现，这种用class不好实现

### 怎么理解数据驱动
是vue的核心思想，我们对视图的修改不会直接操作dom，而是通过修改数据。(jQuery是直接修改dom)
#### 为什么直接操作dom性能损耗大
dom元素本身挂了很多属性，打印出来就可以看到

### 怎么理解组件化
就是把一个页面拆分成多个组件，这样提高了复用性
=> 组件在createElement的时候会通过createComponent创建一个组件VNode => 组件的VNode没有children 

### _render方法=>初始化渲染initRender=>src/core/instance/render.js
用来把实例渲染成一个虚拟node，最终返回的是VNode
initRender在定义的时候，除了vm.$createElement还有个vm._c。
vm.$createElement是用户手写的render使用，而vm._c是被模板编译成的render函数使用==>内部都调用了createElement方法
=>creteElement是对_createElement的封装，而_createElement用来创建虚拟node

### 虚拟dom
虚拟dom借鉴了开源库snabbdom的实现，作用是映射到真实dom的渲染，不需要包含操作dom的方法。
虚拟dom是树状结构，每个VNode都有children，children也是VNode

### _update方法 =>src/core/instance/lifecycle.js
首次渲染和数据更新的时候会调用，用来把VNode渲染成真实dom
=>核心是vm.__patch__ => 对于服务端，由于没有dom所以是个空函数

### 初始化Vue到最终渲染过程
new Vue => init => $mount => compiler => render => VNode => patch => dom

### options合并
不同场景options合并不同，子组件初始化通过initInternalComponent，而外部初始化Vue用的mergeOptions
=>initInternalComponent过程会比mergeOptions快=>只是简单的赋值，不涉及递归，合并策略等复杂逻辑

### forceUpdate作用=>src/core/instance/lifecycle.js
调用watcher的update方法，让渲染watcher对应的回调函数执行=>触发组件的重新渲染
=>vue是通过数据驱动视图重新渲染，但是异步组件加载过程中没有数据发生变化，所以需要forceUpdate强制组件重新渲染一次

### 异步组件=>异步组件实现的本质是二次渲染
有三种创建方式
=>普通函数异步组件
=>promise异步组件
=>高级异步组件=>实现了loading,resolve,reject,timeout四种状态
=>一般都是第一次渲染生成一个注释节点，当异步获取组件成功，再通过forceRender强制渲染(高级组件有0delay的情况，这种第一次直接渲染成loading组件)

### 规范化prop => normalizeProps
props有两种定义方式:对象和字符串数组=>通过normalizeProps函数统一成对象形式
=>还有规范化inject(normalizeInject)，规范化directives(normalizeInject)
