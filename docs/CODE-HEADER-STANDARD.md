# 代码文件头部文档标准

## 标准格式

所有 JavaScript 代码文件应包含以下格式的头部文档：

```javascript
/**
 * Trae Ralph Loop CDP - [文件名称]
 * 
 * [文件描述 - 一句话说明文件用途]
 * 
 * 功能：
 * - [功能点 1]
 * - [功能点 2]
 * - [功能点 3]
 * 
 * 使用方法：（可选，如果是可执行文件）
 *   [命令示例]
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */
```

## 示例

### 主程序文件

```javascript
#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 配置向导
 * 
 * 帮助用户找到并配置 Trae 路径，支持国际版和国内版
 * 
 * 功能：
 * - 自动搜索常见 Trae 安装路径
 * - 交互式配置界面
 * - 快速配置命令行参数支持
 * - 生成配置文件到 ~/.trae-ralph/config.json
 * 
 * 使用方法：
 *   npm run config                                    # 交互式配置
 *   npm run config -- --trae-path "Trae.exe"         # 快速配置国际版
 *   npm run config -- --cn --trae-path "Trae CN.exe" # 快速配置国内版
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */
```

### 模块文件

```javascript
/**
 * Trae Ralph Loop CDP - 场景加载器
 * 
 * 自动加载内置场景和自定义场景，生成浏览器端配置
 * 
 * 功能：
 * - 自动加载 scenarios/builtin/ 中的内置场景
 * - 自动加载 scenarios/custom/ 中的自定义场景
 * - 生成浏览器端场景配置
 * - 场景查询和过滤
 * - 场景验证
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */
```

### 场景文件

```javascript
/**
 * Trae Ralph Loop CDP - 内置场景：上下文限制
 * 
 * 检测 AI 因上下文窗口已满而停止工作
 * 
 * 检测方式：
 * - 关键词匹配：上下文窗口、context window 等
 * - 正则表达式匹配
 * 
 * 响应策略：
 * - 自动发送"继续"命令
 * 
 * 优先级：1（最高）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */
```

## 已添加头部的文件

### src/
- ✅ config.js
- ✅ launcher.js
- ✅ injector.js
- ✅ scenario-manager.js
- ⏳ ralph-loop.js
- ⏳ ralph-loop-enhanced.js
- ⏳ scenarios.js
- ⏳ scenario-config.js

### scenarios/
- ✅ loader.js

### scenarios/builtin/
- ✅ context-limit.js
- ⏳ rate-limit.js
- ⏳ interactive-command.js
- ⏳ premature-completion.js
- ⏳ needs-confirmation.js
- ⏳ long-thinking.js

### config/
- ⏳ selectors.js

### bin/
- ✅ cli.js

## 待添加头部的文件

以下文件需要添加头部文档：

1. `src/ralph-loop.js` - Ralph Loop 基础版本
2. `src/ralph-loop-enhanced.js` - Ralph Loop 增强版
3. `src/scenarios.js` - 场景系统（已废弃？）
4. `src/scenario-config.js` - 场景配置（已废弃？）
5. `scenarios/builtin/rate-limit.js` - 请求限制场景
6. `scenarios/builtin/interactive-command.js` - 交互式命令场景
7. `scenarios/builtin/premature-completion.js` - 提前完成场景
8. `scenarios/builtin/needs-confirmation.js` - 需要确认场景
9. `scenarios/builtin/long-thinking.js` - 长时间思考场景
10. `config/selectors.js` - 元素选择器定义

## 注意事项

1. **一致性** - 所有文件使用相同的格式
2. **简洁性** - 描述要简洁明了，避免冗长
3. **实用性** - 包含实际有用的信息
4. **可维护性** - 便于后续更新和维护

## 快速添加模板

### 对于主程序文件（带 shebang）

```javascript
#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - [文件名]
 * 
 * [描述]
 * 
 * 功能：
 * - [功能1]
 * - [功能2]
 * 
 * 使用方法：
 *   [命令]
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */
```

### 对于模块文件

```javascript
/**
 * Trae Ralph Loop CDP - [文件名]
 * 
 * [描述]
 * 
 * 功能：
 * - [功能1]
 * - [功能2]
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */
```

### 对于场景文件

```javascript
/**
 * Trae Ralph Loop CDP - 内置场景：[场景名]
 * 
 * [场景描述]
 * 
 * 检测方式：
 * - [检测方式1]
 * - [检测方式2]
 * 
 * 响应策略：
 * - [响应策略]
 * 
 * 优先级：[数字]（[级别]）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */
```

---

**提示：** 使用统一的头部文档格式有助于代码的可读性和可维护性。
