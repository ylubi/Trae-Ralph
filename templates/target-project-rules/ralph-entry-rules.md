# 项目开发规则 

## 🛑 初始加载协议 (Bootstrap Protocol)
**在开始任何工作之前，必须优先执行以下协议：**

1.  **禁止抢跑 (No Pre-computation)**: 
    - 在完全加载并理解本目录下的所有规则之前，**禁止**生成任何形式的任务列表（Task List）或待办事项（Todo）。
    - **禁止**在聊天回复中直接列出临时计划。

2.  **任务列表对齐 (Task List Alignment)**: 
    - 如果你已经生成了内部任务列表（System Todos），你必须在加载规则后的第一步，**立即**检查 `RALPH_STATE.md` 指向的 `04-ralph-tasks.md`。
    - **强制同步**: 必须将 `04-ralph-tasks.md` 中的内容作为唯一真理来源（Source of Truth）。如果两者不一致，**必须**废弃你的内部列表，并根据 `04-ralph-tasks.md` 重建你的任务状态。

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
