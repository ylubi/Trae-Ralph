---
name: ralph-state-manager
description: Ralph 流程专用：任务生命周期管理与状态一致性工具。用于处理任务/测试的“开始”与“完成”动作，并强制保持 04-tasks / 05-tests 与 RALPH_STATE.md 的三方一致性。
---

# Skill: ralph-state-manager

## 📋 技能描述 (Description)
你是 Ralph 的 **状态管理员 (State Manager)**。
你的核心职责是管理 Task/Test 的生命周期（Start/Finish），并确保每一次变动都自动同步到 `RALPH_STATE.md`。

## 使用场景 (Usage)
- 用户指令: "开始任务", "完成测试", "同步状态", "Sync State".
- 系统指令: 在 `ralph-web-routine` 的 **Step 5 (Handover)** 阶段被自动推荐调用。
- **任务执行**: 每次需要更新任务或测试状态时，**必须**调用此 Skill，而非手动编辑文件。

## 指令 (Instructions)

### 1. 任务操作 (Task Operations)
针对 `04-ralph-tasks.md` 中的开发任务：

- **Start Task (`start-task <id/keyword>`)**:
    1.  **Locate**: 在 `04-ralph-tasks.md` 中找到对应任务。
    2.  **Mark**: 确保该任务处于 `[ ]` 状态（如果已完成则报错）。
    3.  **Context**: (可选) 将该任务标记为 `IN_PROGRESS` (如果支持)。
    4.  **Sync**: 重新计算进度并更新 `RALPH_STATE.md`。

- **Finish Task (`finish-task <id/keyword>`)**:
    1.  **Locate**: 在 `04-ralph-tasks.md` 中找到对应任务。
    2.  **Mark**: 将 `[ ]` 改为 `[x]`。
    3.  **Sync**: 重新计算进度并更新 `RALPH_STATE.md`。
    4.  **Check Test**: 提示用户是否需要执行关联的测试用例。

### 2. 测试操作 (Test Operations)
针对 `05-test-plan.md` 中的测试用例：

- **Start Test (`start-test <id/keyword>`)**:
    1.  **Locate**: 在 `05-test-plan.md` 中找到对应 Case。
    2.  **Setup**: 准备测试环境或上下文。

- **Finish Test (`finish-test <id/keyword>`)**:
    1.  **Locate**: 在 `05-test-plan.md` 中找到对应 Case。
    2.  **Mark**: 将 `[ ]` 改为 `[x]`。
    3.  **Sync**: 重新计算进度并更新 `RALPH_STATE.md`。

### 3. 审计与修复 (Audit & Sync)
当被要求检查状态或发现不一致时：
1.  **Audit**: 读取 `04` 和 `05` 文件，统计实际进度。
2.  **Report**: 对比 `RALPH_STATE.md`，输出差异报告。
3.  **Sync**: 强制以 `04`/`05` 为准，更新 `RALPH_STATE.md`。

## 示例 (Examples)

### 示例 1：开始任务
**Input**:
> 用户：Start Task 1.1

**Output**:
> ✅ **Task 1.1 Started**
> - Status: `[~]` In Progress
> - Context: Updated `RALPH_STATE.md` (Progress: 0/112)

### 示例 2：完成测试
**Input**:
> 用户：Finish Test TC-AUTH-HP-001

**Output**:
> ✅ **Test Case Completed: [TC-AUTH-HP-001]**
> - Result: Pass
> - Updated `05-test-plan.md`
> - Synced `RALPH_STATE.md` (Test Coverage: 1/78)

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **单一事实来源**: `04` 和 `05` 文件是绝对真理。`RALPH_STATE.md` 只是基于真理计算出的投影。
2.  **禁止手动同步**: 严禁 Agent 试图手动分别编辑三个文件来同步状态。必须调用此 Skill (或遵循本 Skill 的逻辑) 进行原子更新。
3.  **严禁伪造**: 只有当任务真正完成（代码已写完/测试已通过）时，才允许调用 `finish-*` 指令。
4.  **顺序执行 (Sequential Execution)**:
    -   **严禁跳跃**: 必须按 `04-ralph-tasks.md` 中的顺序逐个完成任务。
    -   **前序依赖**: 如果 Task N 未完成 (`[ ]`)，严禁标记 Task N+1 为完成。如果用户强制要求，必须先询问用户是否跳过或标记前序任务为已完成。
5.  **事实优先**: `04` 和 `05` 是事实，`RALPH_STATE` 是影子。影子必须跟随事实。
6.  **数据隔离 (Data Isolation)**:
    -   `RALPH_STATE.md` 仅存储 **聚合状态 (Aggregate State)**（即：进度条、阶段状态）。
    -   **严禁** 在 `RALPH_STATE.md` 中复制具体的 Task 列表或 Test Case 列表。
    -   具体条目详情必须且只能保存在 `04-ralph-tasks.md` 和 `05-test-plan.md` 中。
7.  **量化进度铁律 (Strict Quantification)**:
    -   `RALPH_STATE.md` 中的“进度”列必须严格符合 `X/Y Tasks` 或 `X/Y Cases` 格式。
    -   **严禁** 使用“基础测试通过”、“部分完成”、“大概完成了”等模糊定性描述。
    -   任何非数字格式的进度描述都将被视为 **INVALID**，必须立即重新计算并修正。

## 📂 关联资产 (Related Assets)
- `RALPH_STATE.md` (Target for sync)
- `04-ralph-tasks.md` (Source of truth)
- `05-test-plan.md` (Source of truth)
