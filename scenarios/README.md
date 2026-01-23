# 场景系统

场景系统用于检测 AI 工作中断的各种情况，并自动采取相应的响应策略。

## 目录结构

```
scenarios/
├── README.md              # 本文件 - 场景系统说明
├── loader.js              # 场景加载器 - 自动加载所有场景
├── builtin/               # 内置场景
│   ├── context-limit.js           # 上下文限制
│   ├── rate-limit.js              # 请求限制
│   ├── interactive-command.js     # 交互式命令
│   ├── premature-completion.js    # 提前完成
│   ├── needs-confirmation.js      # 需要确认
│   └── long-thinking.js           # 长时间思考
└── custom/                # 自定义场景
    ├── README.md          # 自定义场景创建指南
    └── *.js               # 用户自定义场景文件
```

## 内置场景

### 1. 上下文限制 (context-limit.js)
- **优先级**: 1（最高）
- **检测**: 上下文窗口已满的提示
- **响应**: 自动发送"继续"命令

### 2. 请求限制 (rate-limit.js)
- **优先级**: 1（最高）
- **检测**: API 请求频率限制
- **响应**: 等待 60 秒后发送"继续"

### 3. 交互式命令 (interactive-command.js)
- **优先级**: 2（高）
- **检测**: 需要用户输入 (y/n)
- **响应**: 自动回复 'y' 确认

### 4. 需要确认 (needs-confirmation.js)
- **优先级**: 2（高）
- **检测**: AI 等待用户确认
- **响应**: 发送"确认，继续"

### 5. 提前完成 (premature-completion.js)
- **优先级**: 3（中）
- **检测**: AI 错误认为任务完成
- **响应**: 发送"请继续完成剩余部分"

### 6. 长时间思考 (long-thinking.js)
- **优先级**: 4（低）
- **检测**: 超过 30 秒无响应
- **响应**: 发送"继续"

## 场景管理

### 使用管理工具（推荐）

```bash
npm run scenarios
```

管理工具提供以下功能：
- 查看所有场景
- 查看场景详情
- 创建自定义场景
- 编辑场景文件
- 删除自定义场景
- 测试场景检测

### 手动创建自定义场景

在 `scenarios/custom/` 目录创建 `.js` 文件：

```javascript
/**
 * Trae Ralph Loop CDP - 自定义场景：场景名称
 * 
 * 场景描述
 * 
 * 检测方式：
 * - 检测方式说明
 * 
 * 响应策略：
 * - 响应策略说明
 * 
 * 优先级：5（自定义）
 * 
 * @author Your Name
 * @license MIT
 */

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

## 场景文件格式

### 必需字段

- **id**: 场景唯一标识符（字符串）
- **name**: 场景名称（字符串）
- **description**: 场景描述（字符串）
- **enabled**: 是否启用（布尔值）
- **priority**: 优先级 1-5（数字，1 最高）

### 检测配置 (detection)

- **keywords**: 关键词数组，用于文本匹配
- **patterns**: 正则表达式数组，用于模式匹配
- **selectors**: CSS 选择器数组，用于 DOM 元素检测
- **checkDuration**: 是否检查时长（布尔值）
- **thinkingTime**: 思考时长阈值（毫秒）

### 响应配置 (response)

- **action**: 响应动作
  - `continue`: 发送消息继续
  - `wait`: 等待后继续
  - `custom`: 自定义响应
- **message**: 发送的消息内容
- **waitTime**: 等待时长（毫秒，action 为 wait 时使用）

## 优先级说明

场景按优先级从高到低检测：

1. **优先级 1（最高）**: 上下文限制、请求限制
2. **优先级 2（高）**: 交互式命令、需要确认
3. **优先级 3（中）**: 提前完成
4. **优先级 4（低）**: 长时间思考
5. **优先级 5（最低）**: 自定义场景

当多个场景同时匹配时，优先级高的场景会被优先处理。

## 场景加载器

`loader.js` 自动加载所有场景：

```javascript
const scenarioLoader = require('./scenarios/loader');

// 获取所有场景
const allScenarios = scenarioLoader.getAllScenarios();

// 获取已启用的场景
const enabledScenarios = scenarioLoader.getEnabledScenarios();

// 生成浏览器端配置
const browserConfig = scenarioLoader.generateBrowserConfig();
```

## 调试和测试

### 测试场景检测

```bash
npm run scenarios
# 选择 "6. 测试场景检测"
```

输入测试文本，系统会显示匹配的场景和响应策略。

### 查看场景日志

在浏览器控制台查看场景检测日志：

```javascript
// 启用调试模式
window.ralphLoopDebug = true;

// 查看场景配置
console.log(window.scenariosConfig);
```

## 最佳实践

1. **优先级设置**: 紧急场景使用高优先级，兜底场景使用低优先级
2. **关键词选择**: 使用具体、明确的关键词，避免误匹配
3. **测试验证**: 创建场景后使用测试功能验证检测效果
4. **文档完善**: 为自定义场景添加清晰的头部文档
5. **避免冲突**: 确保场景之间的检测条件不会相互冲突

## 相关文档

- [场景指南](../docs/SCENARIOS-GUIDE.md) - 详细的场景使用指南
- [自定义场景](custom/README.md) - 创建自定义场景的详细说明
- [配置文档](../docs/CONFIGURATION.md) - 系统配置说明

## 技术支持

如有问题或建议，请访问项目仓库提交 Issue。
