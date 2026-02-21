---
name: ralph-web-routine
description: Ralph Web 项目规划专用：执行 Web 项目规划与分析阶段的标准步骤 (Draft -> Lock)。
---

# Skill: ralph-web-routine

## 技能描述
这是 Ralph Web 项目 **规划与分析阶段** 的专用执行器。
本 Skill 定义了 Web 项目在 **规划阶段 (Planning Phase)** 必须遵循的标准流程，并提供每一步的具体执行指令，确保生成高质量的需求与架构文档。

## 工作流定义 (Workflow Definition)
本 Routine 定义了标准的 **Web 规划迭代流程**，包含以下 5 个顺序步骤：
1.  **Draft (草稿/修订)**：Round 1 为“草稿设计”，Round 2+ 为“增量修订”。
2.  **Critique (深度自查)**：模拟“挑刺者”视角，审查文档逻辑漏洞。
3.  **Research (竞品调研)**：搜索外部方案，验证设计合理性。
4.  **Simulation (运营推演)**：模拟真实业务流程，检查闭环。
5.  **Lock (一致性锁定)**：确保所有文档版本同步，准备进入下一轮。

## 执行指令
你现在是 Ralph 的 **Web 规划专家**。请根据用户提供的当前步骤（Round X / Step Y），执行以下对应的任务。

### 1. 识别当前步骤
请从上下文或用户输入中识别当前处于 **Round X / Step Y**。

### 2. 执行任务逻辑 (Task Execution)

#### 步骤一：Draft (草稿/修订)
*   **目标**：根据本轮迭代目标，创建或更新 `docs/planning/<迭代名>/` 下的核心文档。
*   **执行策略 (混合模式)**：
    *   **Round 1 (草稿设计 - 基线创建)**：
        *   必须创建 `01-requirements.md`：定义用户故事、页面元素级 UI、字段级 API。
        *   必须创建 `02-architecture.md`：定义组件结构、State 树、数据库 ERD。
        *   必须创建 `04-ralph-tasks.md`：拆解开发任务 (Frontend/Backend/QA)。
        *   必须创建 `05-test-plan.md`：定义关键测试场景与用例。
        *   必须创建 `06-learnings.md`：用于记录迭代中的反思与经验。
    *   **Round 2-5 (增量修订 - 优化完善)**：
        *   根据上一轮 Critique/Simulation 的反馈，修改上述文档。
        *   **注意**：即使变动很小，也必须更新文档的版本号或修改记录。
        *   **严禁**：推翻已锁定的核心架构，除非有明确的冲突。

#### 步骤二：Critique (深度自查)
*   **动作**：调用 Skill `ralph-web-requirement`。
*   **目标**：模拟“挑刺者”视角，寻找文档中的逻辑漏洞、遗漏的边界情况或不一致的定义。
*   **强制执行**：每一轮都必须执行。如果没有发现新问题，请输出 "本轮未发现严重逻辑问题 (No critical issues found)"，但绝对不能跳过此步骤。

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
*   **动作**：调用 Skill `ralph-web-architecture`。
*   **目标**：检查需求变更是否已同步到所有相关文档（如 API 定义、测试计划）。
*   **准出标准 (Exit Criteria)**：
    *   只有当所有文档 (`01`~`06`) 的内容逻辑一致且无冲突时，才允许输出 "🔒 Locked for Round X"。
    *   如果发现不一致，必须先修复文档，然后再标记完成。
