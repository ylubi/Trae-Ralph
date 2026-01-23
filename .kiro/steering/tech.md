# 技术栈

## 运行环境
- **Node.js**: >= 14.0.0
- **平台**: Windows, macOS, Linux

## 核心依赖
- **chrome-remote-interface** (^0.32.2): CDP 的 Node.js 客户端，用于与 Chromium/Electron 应用通信
- **pkg** (^5.8.1): 打包工具，用于生成独立可执行文件

## 技术架构
- **Chrome DevTools Protocol (CDP)**: Chromium 的远程调试协议
- **Electron**: Trae IDE 基于 Electron，原生支持 CDP
- **Node.js 原生模块**: fs, path, readline, child_process

## 常用命令

### 开发命令
```bash
# 配置 Trae 路径（首次使用）
npm run config

# 管理场景（查看、创建、编辑、删除、测试）
npm run scenarios

# 启动国际版（默认）
npm start

# 启动国内版
npm run start:cn

# 注入器模式 - 向已运行的 Trae 注入脚本
npm run inject
```

### 构建命令
```bash
# 打包成可执行文件（Windows, macOS, Linux）
npm run build
```

### 手动启动脚本
```bash
# Windows 批处理
scripts\start-trae-debug.bat

# PowerShell
.\scripts\start-trae-debug.ps1
```

## 代码风格约定
- 使用 Node.js CommonJS 模块系统（`require`/`module.exports`）
- 使用 async/await 处理异步操作
- 使用 ANSI 颜色代码实现彩色终端输出
- 配置文件使用 JSON 格式
- 脚本使用 IIFE（立即执行函数表达式）包装，防止全局污染

## 配置文件
- **~/.trae-ralph/config.json**: 用户配置（Trae 路径、端口、检查间隔等）
- **config/selectors.js**: 元素选择器定义（DOM 元素定位）

## 多版本支持
- **国际版 (Trae)**: 支持国际版 Trae
- **国内版 (Trae CN)**: 支持国内版 Trae CN
- **灵活切换**: 可以配置两个版本并灵活切换

## 调试端口
- 默认 CDP 端口: `9222`
- 可通过配置文件修改
