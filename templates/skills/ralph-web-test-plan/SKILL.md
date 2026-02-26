---
name: ralph-web-test-plan
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成包含唯一 ID 的结构化测试计划。
---

# Skill: ralph-web-test-plan

## 📋 技能描述 (Description)
此 Skill 负责在规划阶段 (Planning Phase) 生成 `05-test-plan.md`。
为了支持 **Entry-by-Entry (逐条)** 测试执行与状态追踪，它强制要求为每一个测试用例分配 **唯一 ID (Unique Test Case ID)**。

## 使用场景 (Usage)
- **Phase**: Planning Phase (Round 1/Step 1)
- **Caller**: `ralph-web-routine`
- **Context**: 当需要创建或更新测试计划时。

## 指令 (Instructions)

### 1. ID 分配规则 (ID Allocation Rule)
所有测试用例必须遵循以下格式：
`- [ ] [ID] 测试描述 (优先级)`

**ID 格式**: `[TC-<MODULE>-<TYPE>-<NUMBER>]`
-   **MODULE**: 模块简写 (e.g., `AUTH`, `USER`, `ART`).
-   **TYPE**: 类型简写 (e.g., `HP`=HappyPath, `SP`=SadPath, `EC`=EdgeCase, `UI`=UI).
-   **NUMBER**: 3位数字 (e.g., `001`).

### 2. 生成策略 (Generation Strategy)
-   **Step 1: 模块分解**: 按路由或功能模块划分章节。
-   **Step 2: 路径穷举**: 对每个模块生成 Happy/Sad/Edge Cases。
-   **Step 3: ID 注入**: 为每个 Case 分配 ID。

## 示例 (Examples)

### 示例 1：创建基线测试计划
**Input**:
> 用户：Initialize Test Plan

**Output**:
> 🧪 **Creating `05-test-plan.md`...**
> - **Template**: Applied `05-test-plan-template.md`
> - **Modules**: Detected `AUTH`, `HOME`, `ART` from Requirements.
> - **IDs**: Allocated `TC-AUTH-001` to `TC-ART-010`.
> **Status**: Test Plan Initialized.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **无 ID 即无效**: 任何没有 ID 的测试项都视为无效，`ralph-test-executor` 将无法执行。
2.  **原子性**: 每个测试用例必须是原子性的，只测试一个功能点。
3.  **可执行性**: 描述必须清晰，包含前置条件和预期结果。

## 📂 关联资产 (Related Assets)
- `./assets/05-test-plan.md` (Template)
