(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  var oldArrayPrototype = Array.prototype;
  var arrayPrototype = Object.create(oldArrayPrototype);
  // vue2重写了7个方法，不是代理，所以监听不到索引和数组长度
  var methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];
  methods.forEach(function (method) {
    // 用户调用方法会先经历重写的方法，之后再调用数组原来的方法
    arrayPrototype[method] = function () {
      var _oldArrayPrototype$me;
      var inserted;
      var ob = this.__ob__;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      switch (method) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          // arr.splice(1,1,xxx) => 只要最后的参数
          inserted = args.slice(2);
      }
      if (inserted) {
        // 对新增的数据再次进行观测
        ob.observeArray(inserted);
      }
      (_oldArrayPrototype$me = oldArrayPrototype[method]).call.apply(_oldArrayPrototype$me, [this].concat(args));
    };
  });

  var Observe = /*#__PURE__*/function () {
    function Observe(data) {
      _classCallCheck(this, Observe);
      // __ob__标识已被观测过
      Object.defineProperty(data, "__ob__", {
        value: this,
        enumerable: false // 不可枚举
      });

      if (Array.isArray(data)) {
        data.__proto__ = arrayPrototype;
        this.observeArray(data);
      } else {
        this.walk(data);
      }
    }
    _createClass(Observe, [{
      key: "observeArray",
      value: function observeArray(data) {
        data.forEach(function (item) {
          return observe(item);
        });
      }
    }, {
      key: "walk",
      value: function walk(data) {
        var keys = Object.keys(data);
        keys.forEach(function (key) {
          // defineProperty实现响应式数据
          defineReactive(data, key, data[key]);
        });
      }
    }]);
    return Observe;
  }(); // 性能不好：由于value可能是个对象，所以会进行递归。所有属性会被重新定义
  function defineReactive(data, key, value) {
    //闭包+属  性劫持
    observe(value);
    Object.defineProperty(data, key, {
      get: function get() {
        return value;
      },
      set: function set(newValue) {
        if (newValue === value) return;
        observe(value);
        value = newValue;
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== "object" || data == null) {
      return;
    }
    if (data.__ob__) {
      return data;
    }
    return new Observe(data);
  }

  function initState(vm) {
    var options = vm.$options;
    if (options.data) {
      initData(vm);
    }
  }
  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get: function get() {
        return vm[source][key];
      },
      set: function set(newValue) {
        vm[source][key] = newValue;
      }
    });
  }
  function initData(vm) {
    var data = vm.$options.data;
    // 是函数就拿函数的返回值 否则直接拿data
    data = vm._data = typeof data === "function" ? data.call(vm) : data;
    // 对vm._data进行代理，用户可以通过vm.xxx或者vm._data.xxx取值
    for (var key in data) {
      proxy(vm, "_data", key);
    }
    observe(data);
  }

  var ncname = "[a-zA-Z][\\-\\.0-9_a-zA-Z]*";
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配到的分组是一个开始标签名，如 <div 或带命名空间的 <div:xxx，注意不带 > 符号
  // 匹配属性，第一个分组是属性的 key，第二个分组是 = 号，第三、四、五分组是属性的 value 值
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var startTagClose = /^\s*(\/?)>/; // 匹配开始标签的 > 符号或自闭和标签，如 <div> 中的 > 或 <br />

  function parseHtml(html) {
    function advance(n) {
      html = html.substring(n);
    }
    while (html) {
      var textEnd = html.indexOf("<");
      if (textEnd === 0) {
        parseStarTag(); // 解析开始标签
        break;
      }
    }
    function parseStarTag() {
      var matches = html.match(startTagOpen);
      if (matches) {
        var match = {
          tagName: matches[1],
          attrs: []
        };
        advance(matches[0].length);
        // 继续解析开始标签的属性
        var end;
        var attr;
        // 没有匹配到结束标签就一直匹配
        // 没有值默认就是true <div disabled></div> =>disabled = true
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || true
          });
          advance(attr[0].length); // 解析完就进行删除
        }

        if (end) {
          advance(end[0].length);
        }
        console.log(html, match);
      }
    }
  }
  function compilerToFunction(template) {
    var ast = parseHtml(template); // 将 template 转化成 ast 语法树
    console.log(ast);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      // 将options绑定到实例中
      vm.$options = options;
      initState(vm);

      // 初始化完毕进行页面挂载
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    Vue.prototype.$mount = function (el) {
      var vm = this;
      el = document.querySelector(el);
      var options = vm.$options;
      // 先判断是否有render函数，没有判断是否有template，没有最后用outerHtml作为template
      // 然后把template转成render
      if (!options.render) {
        var template = options.template;
        if (!template) {
          template = el.outerHTML;
        }
        var render = compilerToFunction(template);
        options.render = render;
      }
    };
  }

  // 构造函数
  function Vue(options) {
    this._init(options);
  }
  initMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
