class KVue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;  // 保存data选项
    
    this.observe(this.$data);   // 执行响应式
    new Compile(options.el, this);
  }

  observe(data) {
    if (!data || typeof data !== 'object') {
      return;
    }
    Object.keys(data).forEach(key => {
      /* 为每个key设置响应式 */
      this.defineReactive(data, key, data[key]);
      this.proxyData(key);
    })
  }

  defineReactive(obj, key, value) {
    this.observe(value);  // 递归查找嵌套

    // 为每个key创建Dep
    const dep = new Dep();

    Object.defineProperty(obj, key, {
      enumerable: true,   // 可枚举
      configurable: true, // 可修改或删除
      get() {
        Dep.target && dep.addDep(Dep.target)
        return value;
      },
      set(newValue) {
        if (newValue === value) {
          return;
        }
        value = newValue;
        dep.notify();
      }
    });
  }

  /* 把data里的数据代理到vm */
  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key];
      },
      set(newValue) {
        this.$data[key] = newValue;
      }
    })
  }
}

// 依赖管理器：负责将视图中所有依赖收集管理
class Dep {
  constructor() {
    this.deps = [];  // deps里是Watcher的实例
  }
  addDep(dep) {
    this.deps.push(dep)
  }
  notify() {
    this.deps.forEach(dep => {
      dep.update();
    })
  }
}

class Watcher {
  constructor(vm, key, callBack) {
    this.vm = vm;
    this.key = key;
    this.callBack = callBack;
    // 将来new一个监听器时，将当前Watcher实例附加到Dep.target
    Dep.target = this;
    this.vm[this.key];  // 触发get
    Dep.target = null;
  }

  update() {
    this.callBack.call(this.vm, this.vm[this.key])
  }
}