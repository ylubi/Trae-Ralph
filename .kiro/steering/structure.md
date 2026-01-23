# 项目结构

## 目录组织

```
trae-ralph/
├── src/                    # 源代码目录
│   ├── config.js          # 配置向导 - 自动搜索并配置 Trae 路径
│   ├── scenario-manager.js # 场景管理工具 - 管理内置和自定义场景
│   ├── injector.js        # CDP 注入器 - 向运行中的 Trae 注入脚本
│   ├── launcher.js        # 启动器 - 自动启动 Trae 并注入脚本
│   ├── ralph-loop.js      # Ralph Loop 脚本 - 基础版本
│   └── ralph-loop-enhanced.js  # Ralph Loop 增强版 - 多场景检测
├── scenarios/             # 场景文件夹
│   ├── builtin/          # 内置场景
│   │   ├── context-limit.js
│   │   ├── rate-limit.js
│   │   ├── interactive-command.js
│   │   ├── premature-completion.js
│   │   ├── needs-confirmation.js
│   │   └── long-thinking.js
│   ├── custom/           # 自定义场景（用户添加）
│   │   └── README.md     # 自定义场景说明
│   └── loader.js         # 场景加载器
├── scripts/               # 启动脚本
│   ├── start-trae-debug.bat    # Windows 批处理启动脚本
│   └── start-trae-debug.ps1    # PowerShell 启动脚本
├── config/                # 配置文件目录
│   ├── trae-config.json   # 用户配置文件（由 config.js 生成）
│   └── selectors.js       # 元素选择器定义
├── docs/                  # 文档目录
├── bin/                   # CLI 可执行文件目录
│   └── cli.js            # 命令行入口
├── package.json           # 项目配置和依赖
├── README.md              # 完整项目文档
├── QUICKSTART.md          # 快速开始指南
├── PROJECT-SUMMARY.md     # 项目总结
├── LICENSE                # MIT 许可证
└── .gitignore             # Git 忽略文件
```

## 核心模块说明

### src/config.js
- **职责**: 配置向导，帮助用户找到并配置 Trae 路径
- **功能**:
  - 自动搜索常见 Trae 安装路径
  - 从 PATH 环境变量查找
  - 交互式配置界面
  - 生成配置文件

### src/injector.js
- **职责**: CDP 注入器，向已运行的 Trae 注入脚本
- **功能**:
  - 连接到 Trae 的 CDP 端口
  - 读取并修改注入脚本配置
  - 使用 `Runtime.evaluate` API 注入脚本
  - 防止重复注入

### src/launcher.js
- **职责**: 启动器，自动启动 Trae 并注入脚本
- **功能**:
  - 启动 Trae 并开启远程调试端口
  - 等待 Trae 完全加载
  - 自动调用注入器
  - 重试机制

### src/ralph-loop.js
- **职责**: Ralph Loop 核心逻辑（基础版）
- **功能**:
  - 检测 AI 工作状态（加载指示器、输入框状态、按钮状态）
  - 稳定性检测（连续多次确认停止）
  - 自动发送"继续"命令
  - 提供调试工具函数

### src/ralph-loop-enhanced.js
- **职责**: Ralph Loop 增强版（多场景检测）
- **功能**:
  - 集成场景检测系统
  - 支持多种中断场景（上下文限制、请求限制、交互式命令等）
  - 智能响应策略
  - 丰富的调试工具

### src/scenario-manager.js
- **职责**: 场景管理工具
- **功能**:
  - 查看所有场景（内置和自定义）
  - 查看场景详情
  - 创建自定义场景
  - 编辑场景文件
  - 删除自定义场景
  - 测试场景检测

### scenarios/loader.js
- **职责**: 场景加载器
- **功能**:
  - 自动加载内置场景
  - 自动加载自定义场景
  - 生成浏览器端配置
  - 场景查询和过滤

### scenarios/builtin/
- **职责**: 内置场景定义
- **包含场景**:
  - context-limit.js - 上下文限制
  - rate-limit.js - 请求限制
  - interactive-command.js - 交互式命令
  - premature-completion.js - 提前完成
  - needs-confirmation.js - 需要确认
  - long-thinking.js - 长时间思考

### scenarios/custom/
- **职责**: 用户自定义场景
- **说明**: 用户可以在此文件夹添加自己的场景文件
- **文档**: README.md 提供详细的创建指南

## 配置文件结构

### ~/.trae-ralph/config.json

用户配置文件，位于用户主目录。

```json
{
  "version": "1.0.0",
  "trae": {
    "international": {
      "path": "Trae 国际版路径",
      "port": 9222,
      "checkInterval": 5000,
      "stableCount": 3,
      "startupDelay": 5000
    },
    "china": {
      "path": "Trae 国内版路径",
      "port": 9223,
      "checkInterval": 5000,
      "stableCount": 3,
      "startupDelay": 5000
    }
  },
  "defaultVersion": "international"
}
```

**配置说明：**
- `trae.international` - 国际版配置对象（可选）
  - `path` - Trae 路径
  - `port` - CDP 端口（默认 9222）
  - `checkInterval` - 检查间隔
  - `stableCount` - 稳定计数
  - `startupDelay` - 启动延迟
- `trae.china` - 国内版配置对象（可选）
  - `path` - Trae CN 路径
  - `port` - CDP 端口（默认 9223）
  - 其他配置同上
- `defaultVersion` - 默认启动版本：`international` 或 `china`
- 至少需要配置一个版本
- **重要**：两个版本使用不同的端口，可以同时运行

**使用方式：**
```bash
# 启动国际版（默认）
npm start

# 启动国内版
npm run start:cn
```

### config/selectors.js

元素选择器定义文件，定义 Trae IDE 中的 DOM 元素选择器。

**使用方式**（浏览器控制台）：
```javascript
// 获取聊天输入框
$trae.chat.input

// 获取发送按钮
$trae.chat.sendButton

// 获取加载指示器
$trae.status.loading
```

**可用类别**：
- `chat` - 聊天相关元素
- `status` - 状态指示器
- `controls` - 按钮和控制
- `editor` - 编辑器相关
- `sidebar` - 侧边栏
- `modal` - 模态框和弹窗
- `scenarios` - 特殊场景元素

## 场景文件结构

场景文件位于 `scenarios/` 文件夹：

### 内置场景 (scenarios/builtin/)
- `context-limit.js` - 上下文限制检测
- `rate-limit.js` - 请求限制检测
- `interactive-command.js` - 交互式命令检测
- `premature-completion.js` - 提前完成检测
- `needs-confirmation.js` - 需要确认检测
- `long-thinking.js` - 长时间思考检测

### 自定义场景 (scenarios/custom/)
用户可以在此文件夹添加自定义场景文件。

### 场景文件格式
```javascript
module.exports = {
  id: 'scenarioId',
  name: '场景名称',
  description: '场景描述',
  enabled: true,
  priority: 1,
  detection: {
    keywords: ['关键词1', '关键词2'],
    patterns: [/正则表达式/],
    selectors: ['.css-selector']
  },
  response: {
    action: 'continue',
    message: '响应消息'
  }
};
```

## 文件命名约定
- JavaScript 文件使用 kebab-case: `ralph-loop.js`
- 配置文件使用 kebab-case: `trae-config.json`
- 脚本文件使用 kebab-case: `start-trae-debug.bat`

## 模块依赖关系
```
launcher.js
    ↓ 启动 Trae
    ↓ 调用
injector.js
    ↓ 注入
ralph-loop.js
    ↓ 执行检测逻辑
```

## 入口点
- **CLI**: `bin/cli.js`
- **配置 Trae**: `npm run config` → `src/config.js`
- **管理场景**: `npm run scenarios` → `src/scenario-manager.js`
- **启动**: `npm start` → `src/launcher.js`
- **注入**: `npm run inject` → `src/injector.js`

## 添加自定义场景

### 方法 1：使用管理工具（推荐）
```bash
npm run scenarios
# 选择 "3. 创建自定义场景"
```

### 方法 2：手动创建文件
在 `scenarios/custom/` 文件夹创建新的 `.js` 文件，参考 `scenarios/custom/README.md`

## 场景检测系统

### 内置场景
1. **上下文限制** - 检测上下文窗口已满
2. **请求限制** - 检测 API 请求限制
3. **交互式命令** - 检测需要用户输入的命令
4. **提前完成** - 检测错误认定任务完成
5. **需要确认** - 检测需要用户确认
6. **长时间思考** - 检测 AI 长时间无响应

### 场景优先级
- 优先级 1: 最高（上下文限制、请求限制）
- 优先级 2: 高（交互式命令、需要确认）
- 优先级 3: 中（提前完成）
- 优先级 4: 低（长时间思考）
- 优先级 5: 最低（自定义场景）
