# 项目经验与教训 (Learnings & Patterns)

> **Agent 必读**: 每次开始工作前，必须阅读此文件。如果在执行中发现了新的"坑"或"最佳实践"，必须追加记录于此。这是你的长期记忆，防止在不同 Session 中重复犯错。

## 1. 代码风格与规范 (Conventions)
- [示例] 所有的 React 组件必须使用 Functional Component。
- [示例] 接口返回的日期格式统一为 ISO 8601。

## 2. 避坑指南 (Gotchas)
- [示例] ⚠️ 不要直接修改 `node_modules`，使用 `patch-package`。
- [示例] ⚠️ 数据库连接池在测试环境下最大连接数不能超过 5。

## 3. 常用命令速查 (Shortcuts)
- 重置数据库: `npm run db:reset`
- 启动特定服务: `docker-compose up -d redis`
