# Trae IDE Editor API

> Trae IDE 界面元素的常用操作 API 定义

## 概述

`editor-api` 模块为 Trae IDE 提供了一套统一的界面元素操作接口，通过 Chrome DevTools Protocol (CDP) 实现对 Trae IDE 界面元素的读取、写入、点击等操作。

## 设计理念

### 1. 统一接口
- 提供标准化的 API 接口，屏蔽底层实现细节
- 支持多种选择器策略，提高兼容性
- 统一的错误处理和状态管理

### 2. 非侵入式
- 不修改 Trae IDE 的核心代码
- 通过 CDP 协议进行远程操作
- 支持热插拔和动态注入

### 3. 可扩展性
- 模块化设计，易于添加新功能
- 支持自定义选择器和操作
- 插件化架构，便于集成第三方功能

## 核心功能模块

### 1. 元素选择器 (Selectors)
```javascript
chat: {
  root: ['.split-view-view'],
  contentContainer: ['#chat-virtua-inner-width-limiter'],
  turn: ['section.chat-turn'],
  userTurn: ['section.chat-turn.user'],
  assistantTurn: ['section.chat-turn.assistant.task'],
  messageList: ['.agent-plan-items.assistant-chat-turn-element'],
  messageItem: ['.ai-agent-task'],
  inputBox: ['.chat-input-v2-input-box-editable[contenteditable="true"][role="textbox"]'],
  sendButton: ['button.chat-input-v2-send-button'],
  sendButtonDisabled: ['button.chat-input-v2-send-button.disabled[disabled]']
}

status: {
  loading: ['.icd-loading.agent-loading-dot'],
  generatingText: ['.icd-loading-text']
}

editor: {
  fileCard: ['.icd-file-card[data-file-operation]'],
  fileName: ['.icd-file-card__file-name'],
  fileStatusIcon: ['.icd-file-card__status-icon']
}

explorer: {
  tree: ['.monaco-list[role="tree"][aria-label="文件资源管理器"]'],
  row: ['.monaco-list-row[role="treeitem"]'],
  rowLabel: ['.monaco-icon-label .label-name']
}

terminal: {
  pane: ['.pane-body.shell-integration.integrated-terminal'],
  wrapper: ['.terminal-wrapper'],
  xterm: ['.terminal.xterm'],
  input: ['.xterm-helper-textarea']
}

webPreview: {
  card: ['.index-module__preview-card-wrap___sW3IH'],
  urlText: ['.index-module__preview-card__content-doc-type___loiIu']
}

runCommandCard: {
  card: ['.icd-run-command-card-v2'],
  commandText: ['.icd-run-command-card-v2-command-text'],
  output: ['.icd-run-command-card-v2-command-output']
}
```

### 2. 基础操作 API

#### 读取操作
- `getElement(selector)` - 获取元素
- `getText(element)` - 获取元素文本
- `getValue(element)` - 获取输入框值
- `getAttribute(element, attr)` - 获取元素属性
- `isVisible(element)` - 检查元素是否可见
- `isEnabled(element)` - 检查元素是否可用

#### 写入操作
- `setValue(element, value)` - 设置输入框值
- `setText(element, text)` - 设置元素文本
- `setAttribute(element, attr, value)` - 设置元素属性

#### 交互操作
- `click(element)` - 点击元素
- `focus(element)` - 聚焦元素
- `blur(element)` - 失焦元素
- `scrollTo(element)` - 滚动到元素
- `hover(element)` - 鼠标悬停

### 3. 高级操作 API

#### 聊天操作
- `sendMessage(text)` - 发送聊天消息（支持 Lexical 编辑器，自动处理焦点和状态同步）
- `handleConfirmations()` - 处理交互确认（自动点击删除文件卡片和二次确认弹窗）
- `getLastMessage()` - 获取最后一条消息
- `waitForResponse()` - 等待 AI 响应
- `checkConversationStatus()` - 检查对话状态

#### 编辑器操作
- `openFile(path)` - 打开文件
- `saveFile()` - 保存文件
- `getCurrentFile()` - 获取当前文件
- `getCursorPosition()` - 获取光标位置
- `setCursorPosition(line, column)` - 设置光标位置

#### 状态监控
- `monitorLoading()` - 监控加载状态
- `detectErrors()` - 检测错误信息
- `checkConnection()` - 检查连接状态

## 使用示例

### 基础用法
```javascript
const editorAPI = require('./src/editor-api');

// 发送消息
await editorAPI.chat.sendMessage('Hello, Trae!');

// 等待响应
await editorAPI.chat.waitForResponse();

// 获取最后一条消息
const lastMessage = await editorAPI.chat.getLastMessage();
console.log('AI 回复:', lastMessage);
```

### 高级用法
```javascript
// 监控对话状态
const monitor = editorAPI.status.monitorConversation();
monitor.on('response', (message) => {
  console.log('收到新消息:', message);
});

monitor.on('error', (error) => {
  console.error('对话出错:', error);
});

// 文件操作
await editorAPI.editor.openFile('/path/to/file.js');
await editorAPI.editor.setCursorPosition(10, 5);
await editorAPI.editor.saveFile();
```

## 错误处理

### 异常类型
- `ElementNotFoundError` - 元素未找到
- `ElementNotVisibleError` - 元素不可见
- `ElementNotEnabledError` - 元素不可用
- `TimeoutError` - 操作超时
- `ConnectionError` - 连接错误

### 错误处理示例
```javascript
try {
  await editorAPI.chat.sendMessage('Hello');
} catch (error) {
  if (error instanceof ElementNotFoundError) {
    console.error('聊天输入框未找到');
  } else if (error instanceof TimeoutError) {
    console.error('操作超时');
  }
}
```

## 配置选项

### 基础配置
```javascript
const config = {
  // 选择器配置
  selectors: {
    chat: {
      input: ['#custom-chat-input'],
      sendButton: ['#custom-send-button']
    }
  },
  
  // 超时配置
  timeout: {
    elementWait: 5000,    // 元素等待超时
    responseWait: 30000,  // 响应等待超时
    operationWait: 10000  // 操作等待超时
  },
  
  // 重试配置
  retry: {
    maxAttempts: 3,       // 最大重试次数
    delay: 1000          // 重试延迟
  }
};
```

### 环境配置
```javascript
// 开发环境
const devConfig = {
  debug: true,
  logLevel: 'verbose',
  timeout: {
    elementWait: 10000
  }
};

// 生产环境
const prodConfig = {
  debug: false,
  logLevel: 'error',
  timeout: {
    elementWait: 5000
  }
};
```

## 集成指南

### 与现有系统集成
```javascript
const { RalphLoop } = require('./src/ralph-loop');
const { EditorAPI } = require('./src/editor-api');

class EnhancedRalph extends RalphLoop {
  constructor() {
    super();
    this.editorAPI = new EditorAPI();
  }
  
  async handleScenario(scenario) {
    // 使用 editor API 处理场景
    switch (scenario.type) {
      case 'contextLimit':
        await this.editorAPI.chat.sendMessage('继续');
        break;
      case 'interactiveCommand':
        await this.editorAPI.chat.sendMessage('y');
        break;
    }
  }
}
```

### 自定义扩展
```javascript
// 自定义聊天操作
class CustomChatAPI extends ChatAPI {
  async sendMessageWithRetry(text, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.sendMessage(text);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.wait(1000);
      }
    }
  }
}

// 自定义状态监控
class CustomStatusMonitor extends StatusMonitor {
  monitorTypingIndicator() {
    return this.monitorElement('.typing-indicator', {
      onAppear: () => console.log('AI 正在输入...'),
      onDisappear: () => console.log('AI 输入完成')
    });
  }
}
```

## 开发指南

### 添加新操作
1. 在相应的模块文件中定义新方法
2. 添加对应的选择器配置
3. 实现错误处理逻辑
4. 编写单元测试
5. 更新文档

### 测试新功能
```javascript
// 测试新操作
const testAPI = async () => {
  const api = new EditorAPI();
  
  try {
    await api.chat.sendMessage('测试消息');
    const response = await api.chat.waitForResponse();
    console.log('测试通过:', response);
  } catch (error) {
    console.error('测试失败:', error);
  }
};
```

## 版本兼容性

### Trae IDE 版本支持
- ✅ Trae IDE 国际版
- ✅ Trae IDE 国内版
- ✅ 未来版本（通过选择器适配）

### Node.js 版本要求
- Node.js >= 14.0.0
- 支持 ES6+ 语法特性

## 贡献指南

### 代码规范
- 使用 JavaScript Standard Style
- 添加 JSDoc 注释
- 编写单元测试
- 更新相关文档

### 提交规范
- 遵循 Conventional Commits 规范
- 提交前运行测试
- 更新 CHANGELOG.md

## 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 支持与反馈

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [项目 Issues 页面](https://github.com/your-username/trae-ralph/issues)
- 邮箱: yhuiche@gmail.com

---

## 代码结构

为了方便维护和扩展，本模块采用了模块化的代码结构：

- `index.js`: 主入口文件，定义 `EditorAPI` 类并聚合各子模块。
- `errors.js`: 定义所有自定义错误类。
- `selectors.js`: 定义默认的 DOM 选择器配置 (`DEFAULT_SELECTORS`)。
- `config.js`: 定义默认的超时和重试配置。
- `utils.js`: 通用工具函数（如 `sleep`, `withRetry` 等）。
- `chat.js`: `ChatAPI` 类，封装聊天相关操作。
- `status.js`: `StatusAPI` 类，封装状态监控操作。
- `editor-ops.js`: `EditorOps` 类，封装编辑器文件操作。

如需修改选择器，请直接修改 `selectors.js` 或在初始化时传入覆盖配置。

