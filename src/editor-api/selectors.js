/**
 * Trae Editor Selectors
 * 
 * Unified definition of DOM selectors for Trae IDE elements.
 * Used by both the Editor API (Node.js) and injected scripts (Browser).
 * 
 * Features:
 * - Robust selector lists (fallback support)
 * - Hierarchical organization
 * - Browser helper utilities (TraeElementFinder)
 * - Universal module support (CommonJS + Browser Global)
 */

const TRAE_SELECTORS = {
  // ============================================
  // Chat Interface
  // ============================================
  chat: {
    // Main containers
    root: ['.split-view-view'],
    container: [
      '[class*="chat"][class*="container"]',
      '[class*="messages"]',
      '[class*="conversation"]',
      '[role="log"]',
      '[class*="chat-panel"]',
      '#chat-virtua-inner-width-limiter' // from src
    ],
    contentContainer: ['#chat-virtua-inner-width-limiter'],

    // Input area
    input: [
      '.chat-input-v2-input-box-editable[contenteditable="true"][role="textbox"]', // precise
      '#chat-input',
      'textarea[placeholder*="消息"]',
      'textarea[placeholder*="Message"]',
      'textarea[class*="chat"]',
      'textarea[class*="input"]',
      '[contenteditable="true"][class*="input"]'
    ],
    sendButton: [
      'button.chat-input-v2-send-button', // precise
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[class*="send"]',
      'button[type="submit"]'
    ],
    sendButtonDisabled: ['button.chat-input-v2-send-button.disabled[disabled]'],

    // Messages / Turns
    turn: ['section.chat-turn'],
    messageList: ['.agent-plan-items.assistant-chat-turn-element'],
    messageItem: ['.ai-agent-task'],
    
    lastMessage: [
      '.message:last-child',
      '[class*="message"]:last-child',
      '[class*="chat-message"]:last-child',
      '[data-message]:last-child'
    ],
    messages: [
      '.message',
      '[class*="message"]',
      '[class*="chat-message"]',
      '[data-message]'
    ],
    
    // User messages
    userMessage: [
      'section.chat-turn.user', // precise
      '[class*="user"][class*="message"]',
      '[data-role="user"]',
      '.message.user'
    ],
    userTurn: ['section.chat-turn.user'],

    // AI messages
    aiMessage: [
      'section.chat-turn.assistant.task', // precise
      '[class*="assistant"][class*="message"]',
      '[class*="ai"][class*="message"]',
      '[data-role="assistant"]',
      '.message.assistant'
    ],
    assistantTurn: ['section.chat-turn.assistant.task'],

    // Confirmation UI
    confirmationCard: {
      container: ['.icd-delete-files-command-card-v2-content.need-confirm'],
      deleteButton: ['button.icd-delete-files-command-card-v2-actions-delete.icd-btn-primary']
    },
    confirmationPopover: {
      body: ['.confirm-popover-body'],
      confirmButton: ['.confirm-popover-footer button:first-child']
    }
  },

  // ============================================
  // Status Indicators
  // ============================================
  status: {
    loading: [
      '.icd-loading.agent-loading-dot', // precise
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="thinking"]',
      '[class*="generating"]',
      '[aria-busy="true"]',
      '[class*="progress"]'
    ],
    generatingText: ['.icd-loading-text'],
    
    error: [
      '.error',
      '[class*="error"]',
      '[role="alert"]',
      '[class*="alert"][class*="error"]'
    ],
    
    warning: [
      '.warning',
      '[class*="warning"]',
      '[role="alert"][data-type="warning"]',
      '[class*="alert"][class*="warning"]'
    ],
    
    success: [
      '.success',
      '[class*="success"]',
      '[class*="alert"][class*="success"]'
    ]
  },

  // ============================================
  // Editor / File View
  // ============================================
  editor: {
    container: [
      '.monaco-editor',
      '[class*="editor"]',
      '[class*="code-editor"]'
    ],
    codeBlock: [
      'pre code',
      '[class*="code-block"]',
      '.hljs'
    ],
    copyButton: [
      'button[aria-label*="复制"]',
      'button[aria-label*="Copy"]',
      'button[class*="copy"]'
    ],
    // Specific cards
    fileCard: ['.icd-file-card[data-file-operation]'],
    fileName: ['.icd-file-card__file-name'],
    fileStatusIcon: ['.icd-file-card__status-icon']
  },

  // ============================================
  // Explorer / Sidebar
  // ============================================
  explorer: {
    tree: [
      '.monaco-list[role="tree"][aria-label="文件资源管理器"]',
      '[class*="file-tree"]',
      '[class*="explorer"]',
      '[role="tree"]'
    ],
    row: ['.monaco-list-row[role="treeitem"]'],
    rowLabel: ['.monaco-icon-label .label-name']
  },
  
  sidebar: {
    container: [
      '[class*="sidebar"]',
      '[class*="side-panel"]',
      'aside'
    ],
    fileTree: [
      '[class*="file-tree"]',
      '[class*="explorer"]',
      '[role="tree"]'
    ],
    fileItem: [
      '[class*="file-item"]',
      '[role="treeitem"]'
    ]
  },

  // ============================================
  // Terminal
  // ============================================
  terminal: {
    pane: ['.pane-body.shell-integration.integrated-terminal'],
    wrapper: ['.terminal-wrapper'],
    xterm: ['.terminal.xterm'],
    input: ['.xterm-helper-textarea']
  },

  // ============================================
  // Web Preview
  // ============================================
  webPreview: {
    card: ['.index-module__preview-card-wrap___sW3IH'],
    urlText: ['.index-module__preview-card__content-doc-type___loiIu']
  },

  // ============================================
  // Run Command Card
  // ============================================
  runCommandCard: {
    card: ['.icd-run-command-card-v2'],
    commandText: ['.icd-run-command-card-v2-command-text'],
    output: ['.icd-run-command-card-v2-command-output']
  },

  // ============================================
  // Controls / Buttons
  // ============================================
  controls: {
    stopButton: [
      'button[aria-label*="停止"]',
      'button[aria-label*="Stop"]',
      'button[class*="stop"]'
    ],
    retryButton: [
      'button[aria-label*="重试"]',
      'button[aria-label*="Retry"]',
      'button[class*="retry"]'
    ],
    clearButton: [
      'button[aria-label*="清空"]',
      'button[aria-label*="Clear"]',
      'button[class*="clear"]'
    ],
    settingsButton: [
      'button[aria-label*="设置"]',
      'button[aria-label*="Settings"]',
      'button[class*="settings"]'
    ]
  },

  // ============================================
  // Modals / Dialogs
  // ============================================
  modal: {
    container: [
      '[role="dialog"]',
      '[class*="modal"]',
      '[class*="dialog"]'
    ],
    confirmButton: [
      'button[class*="confirm"]',
      'button[class*="ok"]',
      'button[class*="primary"]'
    ],
    cancelButton: [
      'button[class*="cancel"]',
      'button[class*="close"]'
    ],
    closeButton: [
      'button[aria-label*="关闭"]',
      'button[aria-label*="Close"]',
      '[class*="close-button"]'
    ]
  },

  // ============================================
  // Scenarios / Special States
  // ============================================
  scenarios: {
    contextLimit: [
      '[class*="context"][class*="limit"]',
      '[class*="context"][class*="warning"]',
      '[data-error="context-limit"]'
    ],
    rateLimit: [
      '[class*="rate"][class*="limit"]',
      '[class*="error"][class*="limit"]',
      '[data-error="rate-limit"]'
    ],
    confirmation: [
      '[role="alertdialog"]',
      '[class*="confirm"]',
      '[data-type="confirmation"]'
    ]
  }
};

// ============================================
// Browser Helper Classes
// ============================================

/**
 * Helper class to find elements using the defined selectors
 */
class TraeElementFinder {
  constructor(selectors) {
    this.selectors = selectors;
    this.cache = new Map();
    this.cacheTimeout = 1000; // Cache for 1 second
  }
  
  /**
   * Find a single element
   */
  find(category, name, subName = null) {
    const cacheKey = subName ? `${category}.${name}.${subName}` : `${category}.${name}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return cached.element;
    }
    
    let selectors = this.selectors[category]?.[name];
    if (subName && this.selectors[category]?.[name]) {
      selectors = this.selectors[category][name][subName];
    }

    if (!selectors) {
      // console.warn(`Selector not found: ${cacheKey}`);
      return null;
    }
    
    // Normalize to array
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          this.cache.set(cacheKey, { element, time: Date.now() });
          return element;
        }
      } catch (error) {
        // Ignore invalid selectors
      }
    }
    
    return null;
  }
  
  /**
   * Find all matching elements
   */
  findAll(category, name, subName = null) {
    let selectors = this.selectors[category]?.[name];
    if (subName && this.selectors[category]?.[name]) {
      selectors = this.selectors[category][name][subName];
    }

    if (!selectors) return [];
    
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const elements = [];

    for (const selector of selectorList) {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...found);
      } catch (error) {
        // Ignore
      }
    }
    
    return elements;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Create a proxy for easy access: $trae.chat.input
 */
function createTraeElements() {
  const finder = new TraeElementFinder(TRAE_SELECTORS);
  
  // Proxy to allow $trae.category.name access
  return new Proxy({}, {
    get(target, category) {
      if (category === 'finder') return finder;
      if (category === 'selectors') return TRAE_SELECTORS;
      if (category === 'clearCache') return () => finder.clearCache();
      
      return new Proxy({}, {
        get(_, name) {
          // Handle nested objects (like chat.confirmationCard.deleteButton)
          const value = TRAE_SELECTORS[category]?.[name];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
             return new Proxy({}, {
               get(__, subName) {
                 return finder.find(category, name, subName);
               }
             });
          }

          if (name === 'all') {
            return () => finder.findAll(category, name); // logic needs fix if we want $trae.chat.all('input') but simpler for now
          }
          
          return finder.find(category, String(name));
        }
      });
    }
  });
}

// ============================================
// Export Logic
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  // Node.js Environment
  module.exports = {
    DEFAULT_SELECTORS: TRAE_SELECTORS, // Alias for EditorAPI compatibility
    TRAE_SELECTORS,
    TraeElementFinder,
    createTraeElements
  };
} else {
  // Browser Environment
  window.TRAE_SELECTORS = TRAE_SELECTORS;
  window.$trae = createTraeElements();
  console.log('✅ Trae Selectors Injected');
}
