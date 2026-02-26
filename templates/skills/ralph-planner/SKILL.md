---
name: ralph-planner
description: Ralph 核心状态机。负责管理全生命周期：3 轮规划 (Planning) -> 开发 (Implementation) -> 测试 (Testing)。
---

# Skill: ralph-planner

## 📋 技能描述 (Description)
这是 Ralph 的 **最高指挥官与全生命周期状态管理员**。
你的职责是管理 `RALPH_STATE.md`，并调度 Planning (3 Rounds), Implementation, Testing 三大阶段的流转。

## 使用场景 (Usage)
- 用户启动项目时。
- 每一轮迭代 (Round/Phase) 结束时。
- 需要检查 "下一步做什么" 时。
- 用户指令: "查看 Ralph 开发进程", "继续 Ralph 开发", "继续".

## 指令 (Instructions)

### Phase 0: 初始加载协议 (Bootstrap Protocol)
**在开始任何工作之前，必须优先执行以下协议：**
1.  **资源定位 (Resource Location)**:
    -   **重要**: 本 Skill 的标准规划模板位于 `./assets/` 目录中。
    -   在创建任何文档之前，**必须**优先读取该目录下的对应模板文件 (例如 `./assets/RALPH_STATE_TEMPLATE.md`)。
2.  **上下文对齐 (Context Alignment)**: 
    -   加载规则后的第一步，**立即**读取 `RALPH_STATE.md`。
    -   如果内部状态与 `RALPH_STATE.md` 不一致，**必须**废弃内部状态，并根据 `RALPH_STATE.md` 重建。

### Phase 1: 状态检查与初始化
1.  **读取状态文件**：调用 `Read` 读取 `RALPH_STATE.md`。
2.  **状态判断**：
    *   **如果文件不存在**：
        1.  执行 **[初始化协议]** 创建文件。
        2.  初始化为 **Planning / Round 1 / Step 1**。
    *   **如果文件存在**：
        1.  检查 **Current Iteration Status** 表格。
        2.  找到当前标记为 `🔄 进行中` 的行。
        3.  如果所有 Planning Rounds 都完成，检查 **Task Statistics**。
        4.  如果 Tasks 全部完成，检查 **Test Statistics** (需确保存在)。

### Phase 2: 状态流转控制 (State Flow Control)

#### 1. 规划阶段 (Planning Phase)
*   **流转逻辑**: Round 1 -> Round 2 -> Round 3 (每轮 5 Steps)。
*   **Hook**: 每轮开始前调用 `ralph-round-initializer`。
*   **End of Planning**: 当 Round 3 / Step 5 (Lock) 完成时：
    *   **Action**: 在 `RALPH_STATE.md` 中追加/更新 "Implementation Phase" 区域，**必须**包含 "Execution Iron Rule" 警告（参考模板）。
    *   **Trigger**: 输出 "🎉 Planning Completed. Initiating Implementation Phase..." 并调用 `ralph-task-executor`。

#### 2. 开发阶段 (Implementation Phase)
*   **监控**: 检查 `04-ralph-tasks.md` 的完成度。
*   **流转**:
    *   **In Progress**: 如果任务未全完成，保持在 Implementation Phase。
    *   **Done**: 当所有任务标记为 `[x]` 时：
        *   **Action**: 在 `RALPH_STATE.md` 中追加/更新 "Testing Phase" 区域，**必须**包含 "Execution Iron Rule" 警告（参考模板）。
        *   **Trigger**: 输出 "🎉 Implementation Completed. Initiating Testing Phase..." 并调用 `ralph-test-executor`。

#### 3. 测试阶段 (Testing Phase)
*   **监控**: 检查 `05-test-plan.md` 的完成度。
*   **流转**:
    *   **Pending/In Progress**:
        *   如果 `RALPH_STATE.md` 中尚未显示 "Testing Phase" 或状态为 "待开始"，且任务已全完成：
        *   **Action**: 立即将当前上下文切换为 "测试阶段 (Testing Phase)"。
        *   **Trigger**: 自动调用 `ralph-test-executor` 开始测试。
    *   **Done**: 当所有测试标记为 `[x]` 时：
        *   **Action**: 标记项目为 "Project Delivered"。
        *   **Trigger**: 输出 "🎉🎉🎉 PROJECT COMPLETED SUCCESSFULLY! 🎉🎉🎉"。

### 初始化协议 (Initialization Protocol)
如果需要初始化 `RALPH_STATE.md`：
1.  **加载模板**：读取 `./assets/RALPH_STATE_TEMPLATE.md`。
2.  **生成文件**：基于模板内容生成 `RALPH_STATE.md`，替换 `[Iteration]` 为实际迭代名称。
3.  **状态设定**：确保仅 Round 1 / Step 1 (Draft) 标记为 `🔄 进行中`，其余均为 `⏳ 待定`。

## 示例 (Examples)

### 示例 1：启动规划
**Input**:
> 用户：Start Planning

**Output**:
> 🚀 **Ralph Planner Initialized**
> - **State**: Planning Phase / Round 1 / Step 1
> - **Action**: Invoking `ralph-web-routine` to start drafting baseline documents.

### 示例 2：检查状态
**Input**:
> 用户：What's next?

**Output**:
> 📊 **Current Status**:
> - **Phase**: Implementation
> - **Tasks**: 45/112 Completed
> - **Next Action**: Continue with Task #46 (See `04-ralph-tasks.md`)

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **单步流转**：仅允许将 **当前** `🔄 进行中` 的行改为 `✅ 完成`。
2.  **禁止跳变**：**绝对禁止** `⏳ 待定` -> `✅ 完成`。
3.  **阶段闭环**：Planning 未完成严禁进入 Implementation；Implementation 未完成严禁进入 Testing。

## 📂 关联资产 (Related Assets)
- `ralph-web-routine/SKILL.md` (Planning Steps)
- `ralph-task-executor/SKILL.md` (Implementation)
- `ralph-test-executor/SKILL.md` (Testing)
- `./assets/RALPH_STATE_TEMPLATE.md` (State Template)
