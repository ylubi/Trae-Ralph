# 场景系统指南

## 概述

Trae Ralph Loop 通过场景系统检测 AI 中断情况并自动响应。系统包含 6 个内置场景，并支持用户添加自定义场景。

## 内置场景

| 场景 | 优先级 | 说明 |
|------|--------|------|
| 上下文限制 | 1 | 检测上下文窗口已满 |
| 请求限制 | 1 | 检测 API 请求限制 |
| 交互式命令 | 2 | 检测需要用户输入的命令 |
| 需要确认 | 2 | 检测需要用户确认 |
| 提前完成 | 3 | 检测错误认定任务完成 |
| 长时间思考 | 4 | 检测 AI 长时间无响应 |

## 场景管理

### 查看场景

```bash
npm run scenarios
```

选择 "1. 查看所有场景" 查看内置和自定义场景列表。

### 创建自定义场景

```bash
npm run scenarios
```

选择 "3. 创建自定义场景"，按提示输入：

1. **场景 ID**：英文标识符（如 `gitConflict`）
2. **场景名称**：显示名称（如 `Git 冲突`）
3. **场景描述**：简短描述
4. **优先级**：1-5（数字越小优先级越高）
5. **响应消息**：触发时发送的消息
6. **关键词**：触发场景的关键词列表

### 编辑场景

```bash
npm run scenarios
```

选择 "4. 编辑场景文件"，选择要编辑的场景。

### 删除场景

```bash
npm run scenarios
```

选择 "5. 删除自定义场景"，选择要删除的场景。

### 测试场景

```bash
npm run scenarios
```

选择 "6. 测试场景检测"，输入测试文本验证场景是否正确触发。

## 场景文件格式

### 基本结构

```javascript
module.exports = {
  id: 'myScenario',
  name: '我的场景',
  description: '场景描述',
  enabled: true,
  priority: 5,
  
  detection: {
    keywords: ['关键词1', '关键词2'],
    patterns: [/正则表达式/],
    selectors: ['.css-selector']
  },
  
  response: {
    action: 'continue',
    message: '继续'
  }
};
```

### 配置项说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符（英文） |
| `name` | string | 显示名称 |
| `description` | string | 场景说明 |
| `enabled` | boolean | 是否启用 |
| `priority` | number | 优先级（1-5，越小越高） |
| `detection.keywords` | array | 关键词列表 |
| `detection.patterns` | array | 正则表达式列表 |
| `detection.selectors` | array | CSS 选择器列表 |
| `response.action` | string | 响应动作（continue/wait/custom） |
| `response.message` | string | 响应消息 |

### 检测规则

#### 1. 关键词检测

匹配文本中的关键词：

```javascript
detection: {
  keywords: [
    '上下文窗口已满',
    'context window',
    '请求过多'
  ]
}
```

#### 2. 正则表达式检测

使用正则表达式匹配：

```javascript
detection: {
  patterns: [
    /上下文.*已满/,
    /context.*full/i,
    /请求.*限制/
  ]
}
```

#### 3. 元素检测

检测页面元素是否存在：

```javascript
detection: {
  selectors: [
    '.error-message',
    '[data-error="context-limit"]',
    '#rate-limit-warning'
  ]
}
```

#### 4. 组合检测

可以组合多种检测方式：

```javascript
detection: {
  keywords: ['错误', 'error'],
  patterns: [/错误代码:\s*\d+/],
  selectors: ['.error-dialog']
}
```

### 响应策略

#### continue（继续）

自动发送消息让 AI 继续：

```javascript
response: {
  action: 'continue',
  message: '继续'
}
```

#### wait（等待）

等待一段时间后再检测：

```javascript
response: {
  action: 'wait',
  delay: 5000  // 等待 5 秒
}
```

#### custom（自定义）

执行自定义逻辑：

```javascript
response: {
  action: 'custom',
  handler: function() {
    // 自定义处理逻辑
    console.log('执行自定义操作');
  }
}
```

## 场景示例

### 示例 1：Git 冲突检测

```javascript
module.exports = {
  id: 'gitConflict',
  name: 'Git 冲突',
  description: '检测 Git 合并冲突',
  enabled: true,
  priority: 2,
  
  detection: {
    keywords: [
      'CONFLICT',
      'merge conflict',
      '合并冲突',
      '<<<<<<< HEAD'
    ],
    patterns: [
      /CONFLICT.*Merge conflict/i,
      /<<<<<<< HEAD[\s\S]*?=======[\s\S]*?>>>>>>>/
    ]
  },
  
  response: {
    action: 'continue',
    message: '请解决 Git 冲突后继续'
  }
};
```

### 示例 2：编译错误检测

```javascript
module.exports = {
  id: 'compileError',
  name: '编译错误',
  description: '检测代码编译错误',
  enabled: true,
  priority: 3,
  
  detection: {
    keywords: [
      'compilation error',
      'syntax error',
      '编译错误',
      '语法错误'
    ],
    patterns: [
      /error TS\d+:/i,
      /SyntaxError:/i
    ]
  },
  
  response: {
    action: 'continue',
    message: '请修复编译错误后继续'
  }
};
```

### 示例 3：测试失败检测

```javascript
module.exports = {
  id: 'testFailure',
  name: '测试失败',
  description: '检测单元测试失败',
  enabled: true,
  priority: 3,
  
  detection: {
    keywords: [
      'test failed',
      'tests failed',
      '测试失败',
      'FAIL'
    ],
    patterns: [
      /\d+ failing/i,
      /Tests:\s+\d+ failed/i
    ]
  },
  
  response: {
    action: 'continue',
    message: '请修复失败的测试后继续'
  }
};
```

## 场景优先级

优先级决定场景的检测顺序：

- **优先级 1**：最高（上下文限制、请求限制）
- **优先级 2**：高（交互式命令、需要确认）
- **优先级 3**：中（提前完成、编译错误）
- **优先级 4**：低（长时间思考）
- **优先级 5**：最低（自定义场景）

系统按优先级从高到低检测，一旦匹配就停止检测。

## 文件位置

### 内置场景

```
scenarios/builtin/
├── context-limit.js
├── rate-limit.js
├── interactive-command.js
├── premature-completion.js
├── needs-confirmation.js
└── long-thinking.js
```

**不要修改内置场景文件！**

### 自定义场景

```
scenarios/custom/
├── README.md
├── example-git-conflict.js.example
└── your-custom-scenario.js  ← 在这里添加
```

## 调试场景

### 浏览器控制台

注入脚本后，在 Trae 的浏览器控制台中：

```javascript
// 列出所有场景
listScenarios()

// 测试场景
testScenario('contextLimit')

// 测试检测系统
testDetection()
```

### 场景管理工具

```bash
npm run scenarios
```

选择 "6. 测试场景检测"，输入测试文本验证场景。

## 最佳实践

1. **优先级设置**
   - 关键场景（上下文、请求限制）：1-2
   - 一般场景（错误、警告）：3-4
   - 低优先级场景：5

2. **关键词选择**
   - 使用明确、特定的关键词
   - 包含中英文关键词
   - 避免过于通用的词

3. **正则表达式**
   - 保持简单，避免复杂模式
   - 使用 `i` 标志忽略大小写
   - 测试正则表达式的准确性

4. **响应消息**
   - 简洁明了
   - 提供有用的指导
   - 避免过长的消息

5. **测试验证**
   - 创建后立即测试
   - 使用真实的错误消息测试
   - 确保不会误触发

## 故障排除

### 场景不触发

1. 检查场景是否启用（`enabled: true`）
2. 检查关键词是否正确
3. 使用测试工具验证
4. 检查优先级是否被其他场景覆盖

### 场景误触发

1. 使用更具体的关键词
2. 添加正则表达式限制
3. 提高优先级（降低数字）
4. 添加元素检测

### 场景文件错误

```bash
# 检查语法错误
node scenarios/custom/your-scenario.js

# 重新加载场景
npm run scenarios
```

## 下一步

- 查看 [元素选择器文档](SELECTORS.md) 了解如何使用 CSS 选择器
- 查看 [命令速查](../COMMANDS.md) 了解所有可用命令
- 在 `scenarios/custom/` 文件夹查看示例场景

---

**需要帮助？** 运行 `npm run scenarios` 使用场景管理工具！
