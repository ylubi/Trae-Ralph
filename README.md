# Trae Ralph Loop CDP

> 通过 Chrome DevTools Protocol 为 Trae IDE 实现自动化持续工作

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/trae-ralph.svg)](https://www.npmjs.com/package/trae-ralph)

## 特点

- ✅ 完全自动化 - 启动即注入，无需手动操作
- ✅ 非侵入式 - 不修改 Trae 核心文件
- ✅ 多版本支持 - 支持国际版和国内版
- ✅ 场景检测 - 智能识别多种中断场景
- ✅ 易于扩展 - 支持自定义场景
- ✅ 全局命令 - 安装后可在任何位置使用

## 快速开始

### 安装

**全局安装（推荐）：**

```bash
npm install -g trae-ralph
```

安装后可以直接使用命令：

```bash
trae-ralph config
trae-ralph start
```

**本地开发安装：**

```bash
git clone https://github.com/your-username/trae-ralph.git
cd trae-ralph
npm install
```

### 配置

**首次使用需要配置 Trae 路径：**

```bash
# 全局安装后
trae-ralph config

# 本地开发
npm run config
```

**快速配置（推荐）：**

```bash
# 配置国际版
trae-ralph config --trae-path "D:\Program Files\Trae\Trae.exe"

# 配置国内版
trae-ralph config --cn --trae-path "D:\Program Files\Trae CN\Trae CN.exe"
```

### 启动

**全局安装后：**

```bash
# 启动国际版（默认）
trae-ralph start

# 启动国内版
trae-ralph start --cn
```

**本地开发：**

```bash
# 启动国际版（默认）
npm start

# 启动国内版
npm run start:cn
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run config` | 配置 Trae 路径 |
| `npm run config -- --trae-path "路径"` | 快速配置国际版 |
| `npm run config -- --cn --trae-path "路径"` | 快速配置国内版 |
| `npm start` | 启动国际版 |
| `npm run start:cn` | 启动国内版 |
| `npm run inject` | 注入到已运行的国际版 |
| `npm run inject:cn` | 注入到已运行的国内版 |
| `npm run scenarios` | 管理场景 |
| `trae-ralph setup-trae` | 部署 Ralph 模板到当前项目 |

## Ralph 模板系统

模板位于 `.trae-templates/`，可部署到任意项目的 `.trae/` 目录：

```bash
# 部署到当前项目
trae-ralph setup-trae

# 部署到指定目录
trae-ralph setup-trae --path /path/to/project

# 选择性部署
trae-ralph setup-trae --rules 01-ralph-core-concepts,02-architecture-patterns
trae-ralph setup-trae --skills scenario-detection,error-recovery

# 增量更新（保留用户自定义文件）
trae-ralph setup-trae --update

# 仅验证模板一致性
trae-ralph setup-trae --validate-only
```

## 工作原理

1. 启动 Trae 并开启远程调试端口
2. 通过 CDP 连接到 Trae
3. 注入 JavaScript 脚本
4. 自动检测 AI 工作状态
5. 当 AI 停止时自动发送"继续"命令

## 场景系统

内置 6 个场景，自动检测和响应：

- 上下文限制
- 请求限制
- 交互式命令
- 需要确认
- 提前完成
- 长时间思考

**管理场景：**

```bash
npm run scenarios
```

可以查看、创建、编辑、删除和测试场景。

## 配置文件

配置文件位于 `~/.trae-ralph/config.json`：

```json
{
  "version": "1.0.0",
  "trae": {
    "international": {
      "path": "Trae 路径",
      "port": 9222
    },
    "china": {
      "path": "Trae CN 路径",
      "port": 9223
    }
  },
  "defaultVersion": "international"
}
```

## 文档

- [配置指南](docs/CONFIGURATION.md) - 详细配置说明
- [场景系统](docs/SCENARIOS-GUIDE.md) - 场景检测和管理
- [元素选择器](docs/SELECTORS.md) - DOM 元素定位
- [更新日志](CHANGELOG.md) - 版本更新记录
- [模板系统](.trae-templates/README.md) - Ralph 模板总览与导航

## 故障排除

### 未找到配置文件

```bash
npm run config
```

### 路径不存在

```bash
npm run config -- --trae-path "正确的路径"
```

### 端口冲突

确保国际版和国内版使用不同端口（9222 和 9223）。

### 场景不触发

```bash
npm run scenarios
# 选择 "6. 测试场景检测"
```

## 技术栈

- **Node.js** >= 14.0.0
- **chrome-remote-interface** - CDP 客户端
- **Chrome DevTools Protocol** - 远程调试协议

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 支持

- [问题反馈](https://github.com/your-username/trae-ralph/issues)
- [讨论区](https://github.com/your-username/trae-ralph/discussions)

---

**提示：** 查看 [docs/](docs/) 文件夹获取详细文档。
