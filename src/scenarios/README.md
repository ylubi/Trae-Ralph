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
- **响应**: 自动发送"查看 Ralph 开发进程 \n\n 继续"命令

### 2. 请求限制 (rate-limit.js)
- **优先级**: 1（最高）
- **检测**: API 请求频率限制
- **响应**: 等待 60 秒后发送"查看 Ralph 开发进程 \n\n 继续"

### 3. 交互式命令 (interactive-command.js)
- **优先级**: 2（高）
- **检测**: 需要用户输入 (y/n)
- **响应**: 自动回复 'y' 确认

### 4. 需要确认 (needs-confirmation.js)
- **优先级**: 2（高）
- **检测**: AI 等待用户确认
- **响应**: 发送"查看 Ralph 开发进程 \n\n 继续"

### 5. 提前完成 (premature-completion.js)
- **优先级**: 3（中）
- **检测**: AI 错误认为任务完成
- **响应**: 发送"请继续完成剩余部分"

### 6. 长时间思考 (long-thinking.js)
- **优先级**: 4（低）
- **检测**: 超过 30 秒无响应
- **响应**: 发送"查看 Ralph 开发进程 \n\n 继续"

## 测试清单（按文件）

### 内置场景
- context-limit.js：contextLimit｜上下文限制
- rate-limit.js：rateLimit｜请求限制
- interactive-command.js：interactiveCommand｜交互式命令
- needs-confirmation.js：needsConfirmation｜需要确认
- premature-completion.js：prematureCompletion｜提前完成
- long-thinking.js：longThinking｜长时间思考

### 自定义场景
- chat-controls.js：agentWorking｜Agent正在工作
- chat-controls.js：agentReady｜Agent准备就绪
- chat-controls.js：sendButtonDisabledContinue｜发送按钮禁用继续
- command-flow.js：runCommandCard｜运行命令卡片
- command-flow.js：highRiskConfirm｜高风险命令确认
- command-flow.js：sudoPasswordSkip｜Sudo密码等待跳过
- command-flow.js：terminalLongWaitSkip｜终端超时跳过
- delete-file-flow.js：deleteFileCard｜删除文件卡片
- delete-file-flow.js：deleteFileConfirm｜删除确认弹窗
- output-limit.js：outputLimitClick｜输出过长自动点击
- system-alerts.js：queueUpAlert｜排队提醒
- system-alerts.js：systemError｜系统错误
- system-alerts.js：modelLimitReached｜模型思考上限
- task-completion-flow.js：taskCompletedConfirmCheck｜任务完成确认检查
- main.js：stalledReplyMonitor｜回复卡死监控 (系统内置)

## 测试记录模板（可直接填写）

结果建议填写：未测 / 通过 / 失败

| 场景ID                     | 名称             | 重要性 | 来源    | 触发条件                      | 预期动作                   | 结果 | 备注 | 测试人 | 日期 |
| :------------------------- | :--------------- | :----- | :------ | :---------------------------- | :------------------------- | :--- | :--- | :----- | :--- |
| contextLimit               | 上下文限制       | 中     | builtin | 上下文限制提示/相关关键词     | 发送“查看 Ralph 开发进程 \n\n 继续”                 | 未测 |      |        |      |
| rateLimit                  | 请求限制         | 中     | builtin | 请求限制提示/相关关键词       | 等待后发送“查看 Ralph 开发进程 \n\n 继续”           | 未测 |      |        |      |
| interactiveCommand         | 交互式命令       | 高     | builtin | y/n、确认提示或终端等待输入   | 自动回复确认/回车          | ✅ |      |        |      |
| needsConfirmation          | 需要确认         | 高     | builtin | 需要确认提示                  | 发送“查看 Ralph 开发进程 \n\n 继续”           | 未测 |      |        |      |
| prematureCompletion        | 提前完成         | 中     | builtin | “已完成”且存在未完成提示      | 发送“请继续完成剩余部分”   | 未测 |      |        |      |
| longThinking               | 长时间思考       | 低     | builtin | 超过阈值无响应                | 发送“查看 Ralph 开发进程 \n\n 继续”                 | 未测 |      |        |      |
| agentWorking               | Agent正在工作    | 低     | custom  | 停止按钮可见                  | 记录日志                   | 未测 |      |        |      |
| agentReady                 | Agent准备就绪    | 中     | custom  | 发送按钮可用且有历史          | 发送“查看 Ralph 开发进程 \n\n 继续”                 | 未测 |      |        |      |
| sendButtonDisabledContinue | 发送按钮禁用继续 | 高     | custom  | 发送按钮禁用                  | 发送“查看 Ralph 开发进程 \n\n 继续”                 | ✅ |      |        |      |
| runCommandCard             | 运行命令卡片     | 高     | custom  | 运行命令卡片出现              | 点击运行                   | ✅ |      |        |      |
| highRiskConfirm            | 高风险命令确认   | 高     | custom  | 高风险确认弹窗                | 点击确认                   | ✅ |      |        |      |
| sudoPasswordSkip           | Sudo密码等待跳过 | 中     | custom  | sudo + 终端长时间无输出提示   | 点击跳过                   | 未测 |      |        |      |
| terminalLongWaitSkip       | 终端超时跳过     | 高     | custom  | 终端卡片可跳过按钮            | 超时后点击跳过             | ✅ |      |        |      |
| deleteFileCard             | 删除文件卡片     | 高     | custom  | 删除文件卡片待确认            | 点击删除                   | ✅ |      |        |      |
| deleteFileConfirm          | 删除确认弹窗     | 高     | custom  | 删除确认弹窗                  | 点击确认                   | ✅ |      |        |      |
| outputLimitClick           | 输出过长自动点击 | 低     | custom  | “输出过长”提示                | 点击继续                   | 未测 |      |        |      |
| queueUpAlert               | 排队提醒         | 低     | custom  | 排队提醒提示                  | 记录日志                   | 未测 |      |        |      |
| systemError                | 系统错误         | 高     | custom  | 系统未知错误提示              | 发送“继续”                 | ✅ |      |        |      |
| serviceException           | 服务异常         | 高     | custom  | 服务异常 (-1) 提示            | 点击“重试”                 | ✅ |      |        |      |
| modelLimitReached          | 模型思考上限     | 高     | custom  | 模型思考次数已达上限          | 点击“继续”                 | 未测 |      |        |      |
| taskCompletedConfirmCheck  | 任务完成确认检查 | 中     | custom  | Trae状态显示“任务完成”        | 发送“继续”                  | ✅ |      |        |      |
| contextLimitExceeded       | 上下文长度过大   | 高     | custom  | 上下文长度过大提示            | 新建任务->保留->继续       | ✅ |      |        |      |
| stalledReplyMonitor        | 回复卡死监控     | 高     | system  | 回复总数6分钟无变化           | 点击停止->发送说明->继续   | ✅ |      |        |      |
| newChatReset               | 新对话重置       | 高     | system  | 开启新对话(回复数归零)        | 重置 Ralph 内部状态        | ✅ |      |        |      |

## 测试方法

+ ✅ 系统错误，如果出现 "模型思考次数已达上限，请输入“继续”后获得更多结果。"，能够自动继续，则表示功能正常。
+ ✅ 上下文长度过大：如果出现 "上下文长度已超过最大限制"，能够自动输入“继续”，则表示功能正常。
+ ✅ 发送按钮禁用继续：点击”开启 Ralph“时，如果发送了信息 ”继续“，则表示功能正常。
+ ✅ 删除文件卡片：新建一个文件，使用提示词”删除 example.txt“，然后开启 Ralph，如果文件被成功删除，则表示功能正常。
+ ✅ 删除确认弹窗：上面如果删除了文件，则该功能也正常。
+ ✅ 运行命令卡片：使用提示词 "运行命令 运行命令 New-Item -Path ttt -ItemType Directory，之后运行命令 Remove-Item ttt", 然后开启 Ralph, 会出现二次确认，自动确认后，文件夹会被创建后删除，则该功能成功。
+ ✅ 高风险命令确认，如果上面的测试有弹框，且完成，则该功能正常
+ ✅ 终端超时跳过：使用提示词 "运行命令 npm run dev"，开启 Ralph, 会出现终端卡片，超时后点击跳过，终端会关闭继续任务，则该功能成功。
+ ✅ 任务完成确认检查：trae 出现"任务完成"， ralph 依旧会发送“继续”，则该功能成功。
+ ✅ 回复卡死监控：当 Ralph 运行过程中，若连续 6 分钟回复数量未增加，Ralph 应自动点击停止按钮（如有）并发送继续指令。
+ ✅ 新对话重置：在 Ralph 运行时开启新的 Trae 对话（或清空对话），Ralph 应检测到回复数归零并重置内部计数器，确保新任务能正常触发。


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
