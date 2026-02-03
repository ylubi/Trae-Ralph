# 项目开发规则 

## 🤖 Ralph 自主模式 
本项目已启用 Ralph 自主模式，Agent 必须严格遵守以下规范： 

### 核心流程 (Core Workflow)
1. **需求分析 (Planning)**: 
   - **优先级**: 最高 (P0)
   - **规则**: 遵循 [ralph-planning-mode.md](./ralph-planning-mode.md)
   - **说明**: 任何新的意图必须先通过“规划模式”生成文档，**严禁跳过规划直接写代码**。

2. **任务管理 (Execution)**: 
   - **优先级**: 次高 (P1)
   - **规则**: 遵循 [ralph-task-management.md](./ralph-task-management.md)
   - **说明**: 规划完成后，必须更新 `RALPH_STATE.md` 指针，并严格按照 checklist 执行。

3. **行为规范 (Behavior)**: 
   - **规则**: 遵循 [ralph-agent-mode.md](./ralph-agent-mode.md)
   - **说明**: 保持角色定义和状态报告。 

## 其他规则 
- 使用中文回复。 
