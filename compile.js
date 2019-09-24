// 扫描模板中所有依赖创建更新函数和wathcer
class Compile {
  // el是id
  // vm是当前Vue实例
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);
    if (this.$el) {
      // 将dom节点转换成Fragment提高执行效率
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译,将{{}}替换成值
      this.compile(this.$fragment);
      // 将生产的结果追加至id元素里
      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el) {
    // 创建一个新的Fragment
    const fragment = document.createDocumentFragment();
    let child;
    // 将原生节点拷贝至fragment
    while(child = el.firstChild) {
      // appendChild是移动操作，el最后为空
      fragment.appendChild(child)
    }
    return fragment;
  }

  compile(el) {
    let childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 判断node类型
      if (this.isElementNode(node)) {
        // 元素节点要识别k-xx或@xx
        this.compileElement(node);
      } else if (this.isTextNode(node) && /\{\{(.*)\}\}/.test(node.textContent))  {
        this.compileText(node, RegExp.$1);
      }

      // 遍历node子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    })
  }

  // 编译元素节点
  compileElement(node) {
    console.log('element')
    // 比如 <div k-text="test" @click="onClick"></div>
    const attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      // 规定指令 k-text="test" @click="OnClick"
      const attrName = attr.name;   // 属性名k-text
      const attrValue = attr.value; // 属性值test
      if (this.isDirective(attrName)) {   // 指令k-xxx
        const dir = attrName.substr(2);  // 截取到test
        this[dir] && this[dir](node, this.$vm, attrValue);
      } else if (this.isEventDirective(attrName)) {  // 事件
        const dir = attrName.substr(1);  // click
        this.eventHandler(node, this.$vm, attrValue, dir)
      }
    })
  }

  // 编译文本节点
  compileText(node, attrName) {
    this.text(node, this.$vm, attrName); //指令text
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }

  isTextNode(node) {
    return node.nodeType === 3;
  }

  isDirective(attrName) {
    return attrName.indexOf('k-') == 0
  }

  isEventDirective(attrName) {
    return attrName.indexOf('@') === 0;
  }

  // 文本更新
  text(node, vm, attrValue) {
    // console.log()
    this.update(node, vm, attrValue, 'text');
  }

  // html更新
  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }

  // model更新
  model(node, vm, exp) {
    this.update(node, vm, exp, 'model');
    node.addEventListener('input', e => {
      vm[exp] = e.target.value;
    })
  }

  // 更新
  update(node, vm, exp, type) {
    let updaterFn = this[type + 'Updater'];
    updaterFn && updaterFn(node, vm[exp]); // 执行更新，get
    new Watcher(vm, exp, function(value) {
      updaterFn && updaterFn(node, value);
    })
  }

  textUpdater(node,  value) {
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    node.innerHtml = value;
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  eventHandler(node, vm, exp, dir) { // exp:onclick,  dir：click
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm), false);
    }
  }
}