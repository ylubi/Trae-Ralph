/**
 * Trae 元素选择器定义
 * 
 * 定义 Trae IDE 中常用的 DOM 元素选择器
 * 可通过 window.$trae 全局访问
 */

const TRAE_SELECTORS = {
  // ============================================
  // 聊天相关
  // ============================================
  
  chat: {
    // 聊天输入框
    input: [
      '#chat-input',
      'textarea[placeholder*="消息"]',
      'textarea[placeholder*="Message"]',
      'textarea[class*="chat"]',
      'textarea[class*="input"]',
      '[contenteditable="true"][class*="input"]'
    ],
    
    // 发送按钮
    sendButton: [
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[class*="send"]',
      'button[type="submit"]'
    ],
    
    // 聊天容器
    container: [
      '[class*="chat"][class*="container"]',
      '[class*="messages"]',
      '[class*="conversation"]',
      '[role="log"]',
      '[class*="chat-panel"]'
    ],
    
    // 最后一条消息
    lastMessage: [
      '.message:last-child',
      '[class*="message"]:last-child',
      '[class*="chat-message"]:last-child',
      '[data-message]:last-child'
    ],
    
    // 所有消息
    messages: [
      '.message',
      '[class*="message"]',
      '[class*="chat-message"]',
      '[data-message]'
    ],
    
    // 用户消息
    userMessage: [
      '[class*="user"][class*="message"]',
      '[data-role="user"]',
      '.message.user'
    ],
    
    // AI 消息
    aiMessage: [
      '[class*="assistant"][class*="message"]',
      '[class*="ai"][class*="message"]',
      '[data-role="assistant"]',
      '.message.assistant'
    ]
  },
  
  // ============================================
  // 状态指示器
  // ============================================
  
  status: {
    // 加载中
    loading: [
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="thinking"]',
      '[class*="generating"]',
      '[aria-busy="true"]',
      '[class*="progress"]'
    ],
    
    // 错误提示
    error: [
      '.error',
      '[class*="error"]',
      '[role="alert"]',
      '[class*="alert"][class*="error"]'
    ],
    
    // 警告提示
    warning: [
      '.warning',
      '[class*="warning"]',
      '[class*="alert"][class*="warning"]'
    ],
    
    // 成功提示
    success: [
      '.success',
      '[class*="success"]',
      '[class*="alert"][class*="success"]'
    ]
  },
  
  // ============================================
  // 按钮和控制
  // ============================================
  
  controls: {
    // 停止按钮
    stopButton: [
      'button[aria-label*="停止"]',
      'button[aria-label*="Stop"]',
      'button[class*="stop"]'
    ],
    
    // 重试按钮
    retryButton: [
      'button[aria-label*="重试"]',
      'button[aria-label*="Retry"]',
      'button[class*="retry"]'
    ],
    
    // 清空按钮
    clearButton: [
      'button[aria-label*="清空"]',
      'button[aria-label*="Clear"]',
      'button[class*="clear"]'
    ],
    
    // 设置按钮
    settingsButton: [
      'button[aria-label*="设置"]',
      'button[aria-label*="Settings"]',
      'button[class*="settings"]'
    ]
  },
  
  // ============================================
  // 编辑器相关
  // ============================================
  
  editor: {
    // 编辑器容器
    container: [
      '.monaco-editor',
      '[class*="editor"]',
      '[class*="code-editor"]'
    ],
    
    // 代码块
    codeBlock: [
      'pre code',
      '[class*="code-block"]',
      '.hljs'
    ],
    
    // 复制按钮
    copyButton: [
      'button[aria-label*="复制"]',
      'button[aria-label*="Copy"]',
      'button[class*="copy"]'
    ]
  },
  
  // ============================================
  // 侧边栏
  // ============================================
  
  sidebar: {
    // 侧边栏容器
    container: [
      '[class*="sidebar"]',
      '[class*="side-panel"]',
      'aside'
    ],
    
    // 文件树
    fileTree: [
      '[class*="file-tree"]',
      '[class*="explorer"]',
      '[role="tree"]'
    ],
    
    // 文件项
    fileItem: [
      '[class*="file-item"]',
      '[role="treeitem"]'
    ]
  },
  
  // ============================================
  // 模态框和弹窗
  // ============================================
  
  modal: {
    // 模态框容器
    container: [
      '[role="dialog"]',
      '[class*="modal"]',
      '[class*="dialog"]'
    ],
    
    // 确认按钮
    confirmButton: [
      'button[class*="confirm"]',
      'button[class*="ok"]',
      'button[class*="primary"]'
    ],
    
    // 取消按钮
    cancelButton: [
      'button[class*="cancel"]',
      'button[class*="close"]'
    ],
    
    // 关闭按钮
    closeButton: [
      'button[aria-label*="关闭"]',
      'button[aria-label*="Close"]',
      '[class*="close-button"]'
    ]
  },
  
  // ============================================
  // 特殊场景
  // ============================================
  
  scenarios: {
    // 上下文限制提示
    contextLimit: [
      '[class*="context"][class*="limit"]',
      '[class*="context"][class*="warning"]',
      '[data-error="context-limit"]'
    ],
    
    // 请求限制提示
    rateLimit: [
      '[class*="rate"][class*="limit"]',
      '[class*="error"][class*="limit"]',
      '[data-error="rate-limit"]'
    ],
    
    // 确认对话框
    confirmation: [
      '[role="alertdialog"]',
      '[class*="confirm"]',
      '[data-type="confirmation"]'
    ]
  }
};

/**
 * 元素查找器类
 */
class TraeElementFinder {
  constructor(selectors) {
    this.selectors = selectors;
    this.cache = new Map();
    this.cacheTimeout = 1000; // 缓存 1 秒
  }
  
  /**
   * 查找单个元素
   */
  find(category, name) {
    const cacheKey = `${category}.${name}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return cached.element;
    }
    
    const selectors = this.selectors[category]?.[name];
    if (!selectors) {
      console.warn(`未找到选择器: ${category}.${name}`);
      return null;
    }
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          this.cache.set(cacheKey, { element, time: Date.now() });
          return element;
        }
      } catch (error) {
        console.warn(`选择器错误: ${selector}`, error);
      }
    }
    
    return null;
  }
  
  /**
   * 查找所有匹配的元素
   */
  findAll(category, name) {
    const selectors = this.selectors[category]?.[name];
    if (!selectors) {
      console.warn(`未找到选择器: ${category}.${name}`);
      return [];
    }
    
    const elements = [];
    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...found);
      } catch (error) {
        console.warn(`选择器错误: ${selector}`, error);
      }
    }
    
    return elements;
  }
  
  /**
   * 检查元素是否存在
   */
  exists(category, name) {
    return this.find(category, name) !== null;
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * 获取原始选择器
   */
  getSelectors(category, name) {
    return this.selectors[category]?.[name] || [];
  }
}

/**
 * 创建便捷访问对象
 */
function createTraeElements() {
  const finder = new TraeElementFinder(TRAE_SELECTORS);
  
  // 创建代理对象，支持链式访问
  const proxy = new Proxy({}, {
    get(target, category) {
      if (category === 'finder') return finder;
      if (category === 'selectors') return TRAE_SELECTORS;
      if (category === 'clearCache') return () => finder.clearCache();
      
      return new Proxy({}, {
        get(_, name) {
          if (name === 'all') {
            return () => finder.findAll(category, name);
          }
          if (name === 'exists') {
            return () => finder.exists(category, name);
          }
          if (name === 'selectors') {
            return () => finder.getSelectors(category, name);
          }
          
          // 默认返回单个元素
          return finder.find(category, String(category), String(name));
        }
      });
    }
  });
  
  return proxy;
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TRAE_SELECTORS,
    TraeElementFinder,
    createTraeElements
  };
}

// 浏览器环境：挂载到 window
if (typeof window !== 'undefined') {
  // 创建全局访问点
  window.$trae = createTraeElements();
  
  // 别名
  window.traeElements = window.$trae;
  
  console.log('✅ Trae 元素选择器已加载');
  console.log('使用方式：');
  console.log('  $trae.chat.input          - 获取聊天输入框');
  console.log('  $trae.chat.sendButton     - 获取发送按钮');
  console.log('  $trae.status.loading      - 获取加载指示器');
  console.log('  $trae.finder              - 访问查找器实例');
  console.log('  $trae.selectors           - 访问原始选择器配置');
}
