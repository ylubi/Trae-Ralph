# 自定义场景

在这个文件夹中添加你的自定义场景。

## 创建自定义场景

### 方法 1：使用配置工具（推荐）

```bash
npm run scenarios
# 选择 "4. 添加自定义场景"
```

### 方法 2：手动创建文件

在此文件夹中创建一个新的 `.js` 文件，例如 `my-scenario.js`：

```javascript
/**
 * 场景：我的自定义场景
 * 
 * 场景描述
 */

module.exports = {
  id: 'myScenario',
  name: '我的场景',
  description: '场景描述',
  enabled: true,
  priority: 5,
  
  // 检测规则
  detection: {
    keywords: [
      '关键词1',
      '关键词2'
    ],
    // 可选：正则表达式模式
    patterns: [
      /pattern1/i,
      /pattern2/
    ],
    // 可选：CSS 选择器
    selectors: [
      '.my-selector',
      '[data-status="error"]'
    ]
  },
  
  // 响应策略
  response: {
    action: 'continue',  // 'continue', 'wait', 'custom'
    message: '查看 Ralph 开发进程 \n\n 继续'
  }
};
```

## 场景配置说明

### 基本信息

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 场景唯一标识符（英文） |
| `name` | string | ✅ | 场景显示名称 |
| `description` | string | ✅ | 场景描述 |
| `enabled` | boolean | ✅ | 是否启用 |
| `priority` | number | ✅ | 优先级 (1-5，1 最高) |

### 检测规则 (detection)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `keywords` | string[] | ❌ | 关键词列表 |
| `patterns` | RegExp[] | ❌ | 正则表达式模式 |
| `selectors` | string[] | ❌ | CSS 选择器 |
| `checkDuration` | boolean | ❌ | 是否检查停止时长 |
| `thinkingTime` | number | ❌ | 停止时长阈值（毫秒） |
| `checkIncomplete` | boolean | ❌ | 是否检查未完成标记 |
| `incompleteIndicators` | string[] | ❌ | 未完成标记列表 |

### 响应策略 (response)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `action` | string | ✅ | 动作类型：`continue`、`wait`、`custom` |
| `message` | string | ✅ | 响应消息 |
| `waitTime` | number | ❌ | 等待时间（毫秒，仅 `action: wait`） |
| `responses` | object | ❌ | 自定义响应（仅 `action: custom`） |

## 示例场景

### 示例 1：Git 冲突

```javascript
module.exports = {
  id: 'gitConflict',
  name: 'Git 冲突',
  description: '检测 Git 合并冲突',
  enabled: true,
  priority: 2,
  
  detection: {
    keywords: [
      'merge conflict',
      '合并冲突',
      'conflict markers',
      'CONFLICT'
    ]
  },
  
  response: {
    action: 'continue',
    message: '请解决冲突并继续'
  }
};
```

### 示例 2：测试失败

```javascript
module.exports = {
  id: 'testFailure',
  name: '测试失败',
  description: '检测测试失败',
  enabled: true,
  priority: 2,
  
  detection: {
    keywords: [
      'test failed',
      '测试失败',
      'tests failing',
      'FAIL'
    ],
    patterns: [
      /\d+ failing/i,
      /\d+ failed/i
    ]
  },
  
  response: {
    action: 'continue',
    message: '请修复失败的测试并继续'
  }
};
```

### 示例 3：需要 API 密钥

```javascript
module.exports = {
  id: 'apiKeyNeeded',
  name: '需要 API 密钥',
  description: '检测缺少 API 密钥',
  enabled: true,
  priority: 2,
  
  detection: {
    keywords: [
      'API key required',
      '需要 API 密钥',
      'missing API key',
      'invalid API key'
    ]
  },
  
  response: {
    action: 'continue',
    message: 'API 密钥已配置，继续'
  }
};
```

### 示例 4：等待后重试

```javascript
module.exports = {
  id: 'networkError',
  name: '网络错误',
  description: '检测网络错误，等待后重试',
  enabled: true,
  priority: 2,
  
  detection: {
    keywords: [
      'network error',
      '网络错误',
      'connection failed',
      'ECONNREFUSED'
    ]
  },
  
  response: {
    action: 'wait',
    waitTime: 30000,  // 等待 30 秒
    message: '继续'
  }
};
```

### 示例 5：自定义响应

```javascript
module.exports = {
  id: 'customResponse',
  name: '自定义响应',
  description: '根据不同情况返回不同响应',
  enabled: true,
  priority: 3,
  
  detection: {
    keywords: [
      '选择',
      'choose',
      'select'
    ],
    patterns: [
      /\(1\/2\/3\)/,
      /选项 [ABC]/
    ]
  },
  
  response: {
    action: 'custom',
    responses: {
      default: '1',
      patterns: [
        { match: /\(1\/2\/3\)/, response: '1' },
        { match: /选项 [ABC]/, response: 'A' }
      ]
    }
  }
};
```

## 优先级建议

- **优先级 1**：紧急情况（上下文限制、请求限制）
- **优先级 2**：需要快速响应（交互式命令、确认）
- **优先级 3**：重要但不紧急（提前完成检测）
- **优先级 4**：低优先级（长时间思考）
- **优先级 5**：自定义场景（默认）

## 测试场景

创建场景后，使用以下方式测试：

### 1. 使用配置工具

```bash
npm run scenarios
# 选择 "6. 测试场景检测"
```

### 2. 在浏览器控制台

```javascript
// 测试特定场景
testScenario('myScenario')

// 测试检测系统
testDetection()

// 列出所有场景
listScenarios()
```

## 注意事项

1. **文件命名**：使用 kebab-case，如 `my-scenario.js`
2. **ID 唯一性**：确保 `id` 在所有场景中唯一
3. **关键词精确性**：使用具体的关键词避免误触发
4. **优先级设置**：合理设置优先级，高优先级场景先匹配
5. **测试验证**：添加场景后务必测试

## 分享场景

如果你创建了有用的场景，欢迎分享！

1. 在项目 Issue 中分享
2. 提交 Pull Request
3. 在讨论区交流

---

**提示**：场景文件会在启动时自动加载，无需重启即可生效（重新注入即可）。
