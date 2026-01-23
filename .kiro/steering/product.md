# 产品概述

## 项目名称
Trae Ralph Loop CDP - Chrome DevTools Protocol 注入方案

## 核心功能
通过 Chrome DevTools Protocol (CDP) 为 Trae IDE 实现自动化持续工作（Ralph Loop）。

## 主要特点
- **完全自动化**：启动即注入，无需手动操作
- **非侵入式**：不修改 Trae 核心文件，使用标准 CDP 协议
- **易于使用**：一键配置，一键启动
- **避开 DevTools**：不需要打开开发者工具或手动粘贴脚本

## 工作原理
1. 启动 Trae 并开启远程调试端口（`--remote-debugging-port=9222`）
2. 通过 CDP 客户端连接到 Trae
3. 使用 `Runtime.evaluate` API 注入 JavaScript 脚本
4. 脚本自动检测 AI 工作状态
5. 当 AI 停止时自动发送"继续"命令，实现持续工作循环

## 使用场景
- AI 因上下文限制或请求限制而停止工作时，自动恢复
- 长时间任务需要 AI 持续工作
- 减少手动干预，提高自动化程度

## 目标用户
使用 Trae IDE 进行开发的用户，希望实现 AI 助手的自动化持续工作。
