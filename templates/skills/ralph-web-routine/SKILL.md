---
name: ralph-web-routine
description: Ralph Web 项目规划专用：执行 Web 项目规划与分析阶段的标准步骤 (Draft -> Lock)。
---

# Skill: ralph-web-routine

## 📋 技能描述 (Description)
这是 Ralph Web 项目 **规划与分析阶段** 的专用执行器。
本 Skill 定义了 Web 项目在 **规划阶段 (Planning Phase)** 必须遵循的标准流程，并提供每一步的具体执行指令，确保生成高质量的需求与架构文档。

## 使用场景 (Usage)
- **Phase**: Planning Phase
- **Caller**: `ralph-planner`
- **Context**: Round X / Step Y

## 指令 (Instructions)

### 1. 工作流定义 (Workflow Definition)
本 Routine 定义了标准的 **Web 规划迭代流程**，包含以下 5 个顺序步骤：
1.  **Draft (草稿/修订)**：Round 1 为“草稿设计”，Round 2+ 为“增量修订”。
2.  **Critique (深度自查)**：模拟“挑刺者”视角，审查文档逻辑漏洞。
3.  **Research (竞品调研)**：搜索外部方案，验证设计合理性。
4.  **Simulation (运营推演)**：模拟真实业务流程，检查闭环。
5.  **Lock (一致性锁定)**：确保所有文档版本同步，准备进入下一轮。

### 2. 执行任务逻辑 (Task Execution)

#### 步骤一：Draft (草稿/修订)
*   **目标**：根据本轮迭代目标，创建或更新 `docs/planning/<迭代名>/` 下的核心文档。
    *   **注意**: 严禁使用 `Round-1` 等无意义名称作为文件夹名。必须使用具体的迭代名称 (e.g., `v0.1-alpha`, `sprint-2-auth`).
*   **执行策略 (混合模式)**：
    *   **Round 1 (草稿设计 - 基线创建)**：
        > **Template-First Policy**: 对于以下所有文件的创建，**必须**先读取对应的模板文件 (位于 `./assets/` 或相关 Skill 的 `assets` 目录中)，并严格基于模板结构填充内容。
        
        *   必须创建 `01-requirements.md`: 使用 `ralph-web-requirement` 的模板。
        *   必须创建 `02-architecture.md`: 使用 `ralph-web-architecture` 的模板。
        *   必须创建 `04-ralph-tasks.md`: 调用 `ralph-web-task-planner`。
        *   必须创建 `05-test-plan.md`: 调用 `ralph-web-test-plan`。
        *   必须创建 `06-learnings.md`: 初始化空文件。
    *   **Round 2-3 (增量修订 - 优化完善)**：
        *   根据上一轮 Critique/Simulation 的反馈，修改上述文档。
        *   **三方同步 (3-Way Sync)**: 如果新增或删除了任务/测试，**必须**重新统计总数并更新 `RALPH_STATE.md`。

#### 步骤二：Critique (深度自查)
*   **动作**：调用 Skill `ralph-web-requirement`。
*   **目标**：模拟“挑刺者”视角，寻找文档中的逻辑漏洞、遗漏的边界情况或不一致的定义。
*   **强制执行**：每一轮都必须执行。如果没有发现新问题，请输出 "本轮未发现严重逻辑问题"，但绝对不能跳过此步骤。

#### 步骤三：Research (竞品调研)
*   **动作**：调用 Skill `WebSearch`。
*   **目标**：搜索类似产品的实现方案，寻找新灵感或验证当前设计的合理性。
*   **策略**：
    *   **Round 2+**：重点调研上一轮发现的痛点或新增功能的最佳实践。
    *   **兜底**：如果无新增功能，请验证现有设计的边缘情况（如弱网、高并发）。

#### 步骤四：Simulation (运营推演)
*   **动作**：调用 Skill `ralph-web-requirement` (配合 Ops Mode)。
*   **目标**：模拟用户真实操作流程，检查 UI 交互和数据流是否闭环。
*   **强制输出**：必须在 `05-test-plan.md` 或回复中明确列出本次推演的 "通过/失败 (Pass/Fail)" 结论。

#### 步骤五：Lock (一致性锁定)
*   **动作**：调用 Skill `ralph-web-architecture` 和 **`ralph-state-manager`**。
*   **目标**：检查需求变更是否已同步到所有相关文档（如 API 定义、测试计划），并确保项目状态计数准确。
*   **准出标准 (Exit Criteria)**：
    *   **State Audit**: 必须调用 `ralph-state-manager` 执行一次全量审计。
    *   **Doc Consistency**: 只有当所有文档 (`01`~`06`) 的内容逻辑一致且无冲突时，才允许输出 "🔒 Locked for Round X"。

## 示例 (Examples)

### 示例 1：Round 1 Draft
**Input**:
> 用户：Start Round 1 Draft

**Output**:
> 📝 **Drafting Baseline Documents...**
> - Created `01-requirements.md` (Template applied)
> - Created `02-architecture.md` (Template applied)
> - Initialized `04-ralph-tasks.md` & `05-test-plan.md`
> **Status**: Ready for Critique.

### 示例 2：Step 5 Lock
**Input**:
> 用户：Lock Round 1

**Output**:
> 🔒 **Locking Round 1**
> - All documents consistent.
> - State Audit passed.
> **Next**: Proceed to Round 2 (Critique).

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **模板优先**: 严禁凭空创建文档，必须使用标准模板。
2.  **三方一致**: `04`/`05` 与 `RALPH_STATE` 必须时刻保持一致。
3.  **禁止跳步**: 必须严格按照 Draft -> Critique -> Research -> Simulation -> Lock 的顺序执行。

## 📂 关联资产 (Related Assets)
- `./assets/` (Templates)
