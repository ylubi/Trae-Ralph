# 元素选择器系统

## 概述

Trae Ralph Loop 提供了一个统一的元素选择器系统，用于定位 Trae IDE 中的各种 DOM 元素。通过 `window.$trae` 全局对象可以方便地访问所有预定义的元素。

## 快速开始

### 基本使用

注入脚本后，在浏览器控制台中：

```javascript
// 获取聊天输入框
const input = $trae.chat.input;

// 获取发送按钮
const button = $trae.chat.sendButton;

// 获取加载指示器
const loading = $trae.status.loading;

// 获取最后一条消息
const lastMsg = $trae.chat.lastMessage;
```

### 检查元素是否存在

```javascript
// 检查是否正在加载
if ($trae.status.loading) {
  console.log('AI 正在工作');
}

// 检查输入框是否可用
if ($trae.chat.input && !$trae.chat.input.disabled) {
  console.log('可以发送消息');
}
```

## 可用的元素类别

### 1. 聊天相关 (chat)

```javascript
// 输入框
$trae.chat.input

// 发送按钮
$trae.chat.sendButton

// 聊天容器
$trae.chat.container

// 最后一条消息
$trae.chat.lastMessage

// 所有消息
$trae.chat.messages

// 用户消息
$trae.chat.userMessage

// AI 消息
$trae.chat.aiMessage
```

### 2. 状态指示器 (status)

```javascript
// 加载中
$trae.status.loading

// 错误提示
$trae.status.error

// 警告提示
$trae.status.warning

// 成功提示
$trae.status.success
```

### 3. 按钮和控制 (controls)

```javascript
// 停止按钮
$trae.controls.stopButton

// 重试按钮
$trae.controls.retryButton

// 清空按钮
$trae.controls.clearButton

// 设置按钮
$trae.controls.settingsButton
```

### 4. 编辑器相关 (editor)

```javascript
// 编辑器容器
$trae.editor.container

// 代码块
$trae.editor.codeBlock

// 复制按钮
$trae.editor.copyButton
```

### 5. 侧边栏 (sidebar)

```javascript
// 侧边栏容器
$trae.sidebar.container

// 文件树
$trae.sidebar.fileTree

// 文件项
$trae.sidebar.fileItem
```

### 6. 模态框和弹窗 (modal)

```javascript
// 模态框容器
$trae.modal.container

// 确认按钮
$trae.modal.confirmButton

// 取消按钮
$trae.modal.cancelButton

// 关闭按钮
$trae.modal.closeButton
```

### 7. 特殊场景 (scenarios)

```javascript
// 上下文限制提示
$trae.scenarios.contextLimit

// 请求限制提示
$trae.scenarios.rateLimit

// 确认对话框
$trae.scenarios.confirmation
```

## 高级用法

### 访问查找器实例

```javascript
// 获取查找器
const finder = $trae.finder;

// 查找单个元素
const input = finder.find('chat', 'input');

// 查找所有匹配的元素
const messages = finder.findAll('chat', 'messages');

// 检查元素是否存在
const exists = finder.exists('status', 'loading');

// 清除缓存
finder.clearCache();
```

### 访问原始选择器配置

```javascript
// 获取所有选择器配置
const selectors = $trae.selectors;

// 获取特定类别的选择器
const chatSelectors = selectors.chat;

// 获取输入框的所有选择器
const inputSelectors = chatSelectors.input;
console.log(inputSelectors);
// ['#chat-input', 'textarea[placeholder*="消息"]', ...]
```

### 获取特定元素的选择器列表

```javascript
// 获取输入框的选择器列表
const inputSelectors = $trae.finder.getSelectors('chat', 'input');
console.log(inputSelectors);
```

## 自定义选择器

### 修改选择器配置

编辑 `config/selectors.js` 文件：

```javascript
const TRAE_SELECTORS = {
  chat: {
    input: [
      '#chat-input',
      'textarea[placeholder*="消息"]',
      // 添加你的自定义选择器
      '#my-custom-input'
    ]
  }
};
```

### 添加新的元素类别

```javascript
const TRAE_SELECTORS = {
  // 现有类别...
  
  // 添加新类别
  myCategory: {
    myElement: [
      '.my-selector',
      '[data-my="element"]'
    ]
  }
};
```

使用：

```javascript
const element = $trae.myCategory.myElement;
```

## 在场景中使用

### 场景检测中使用选择器

在自定义场景中使用 `$trae`：

```javascript
module.exports = {
  id: 'myScenario',
  name: '我的场景',
  
  detection: {
    // 使用选择器配置
    selectors: [
      '.my-selector',
      '[data-status="error"]'
    ]
  },
  
  response: {
    action: 'continue',
    message: '继续'
  }
};
```

### 在脚本中动态检测

```javascript
// 检测特定元素
function checkCustomElement() {
  const element = $trae.scenarios.contextLimit;
  if (element) {
    console.log('检测到上下文限制');
    return true;
  }
  return false;
}
```

## 缓存机制

选择器系统内置了缓存机制，提高查找性能：

```javascript
// 缓存有效期：1 秒
// 在 1 秒内重复查找同一元素会使用缓存

// 手动清除缓存
$trae.clearCache();

// 或
$trae.finder.clearCache();
```

## 调试技巧

### 查看所有可用元素

```javascript
// 列出所有类别
console.log(Object.keys($trae.selectors));

// 列出特定类别的所有元素
console.log(Object.keys($trae.selectors.chat));

// 查看元素的选择器
console.log($trae.finder.getSelectors('chat', 'input'));
```

### 测试选择器

```javascript
// 测试选择器是否能找到元素
function testSelector(category, name) {
  const element = $trae.finder.find(category, name);
  if (element) {
    console.log(`✅ 找到: ${category}.${name}`, element);
  } else {
    console.log(`❌ 未找到: ${category}.${name}`);
  }
}

// 测试所有聊天相关元素
['input', 'sendButton', 'container', 'lastMessage'].forEach(name => {
  testSelector('chat', name);
});
```

### 查找失败时的降级

```javascript
// 如果 $trae 不可用，使用原生方法
function findChatInput() {
  if (window.$trae) {
    return $trae.chat.input;
  }
  // 降级到原生查找
  return document.querySelector('#chat-input');
}
```

## 最佳实践

### 1. 优先使用 $trae

```javascript
// 好 ✅
const input = $trae.chat.input;

// 不推荐 ❌
const input = document.querySelector('#chat-input');
```

### 2. 检查元素存在性

```javascript
// 好 ✅
const input = $trae.chat.input;
if (input) {
  input.value = 'Hello';
}

// 不好 ❌
$trae.chat.input.value = 'Hello'; // 可能报错
```

### 3. 使用语义化的元素名称

```javascript
// 好 ✅
const loading = $trae.status.loading;

// 不好 ❌
const loading = document.querySelector('.spinner');
```

### 4. 定期清除缓存

```javascript
// 在长时间运行的脚本中
setInterval(() => {
  $trae.clearCache();
}, 60000); // 每分钟清除一次
```

## 常见问题

### Q: $trae 未定义？

A: 确保脚本已正确注入。检查浏览器控制台是否有 "✅ Trae 元素选择器已加载" 消息。

### Q: 找不到元素？

A: 
1. 检查选择器配置是否正确
2. 使用 `$trae.finder.getSelectors()` 查看选择器列表
3. 在浏览器中手动测试选择器
4. 清除缓存后重试

### Q: 如何添加新的选择器？

A: 编辑 `config/selectors.js`，在相应类别下添加选择器数组。

### Q: 选择器优先级？

A: 选择器数组中的顺序就是优先级，第一个匹配的选择器会被使用。

## 示例场景

### 示例 1：检测 Ralph 状态

```javascript
function checkAIStatus() {
  if ($trae.status.loading) {
    console.log('🔄 Ralph 正在工作');
    return 'working';
  }
  
  const input = $trae.chat.input;
  if (input && input.disabled) {
    console.log('⏸️ Ralph 已暂停');
    return 'paused';
  }
  
  console.log('✅ Ralph 空闲');
  return 'idle';
}
```

### 示例 2：发送消息

```javascript
function sendMessage(text) {
  const input = $trae.chat.input;
  const button = $trae.chat.sendButton;
  
  if (!input || !button) {
    console.error('❌ 未找到输入框或发送按钮');
    return false;
  }
  
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  button.click();
  
  console.log('✅ 消息已发送:', text);
  return true;
}
```

### 示例 3：获取聊天历史

```javascript
function getChatHistory() {
  const messages = $trae.finder.findAll('chat', 'messages');
  
  return Array.from(messages).map(msg => ({
    text: msg.textContent.trim(),
    isUser: msg.classList.contains('user'),
    timestamp: Date.now()
  }));
}
```

## 参考

- [场景系统文档](SCENARIOS.md)
- [自定义场景指南](CUSTOM-SCENARIOS.md)
- [文件夹结构](FOLDER-STRUCTURE.md)

---

**提示**：选择器配置会在脚本注入时自动加载，修改后需要重新注入脚本！
