---
name: ralph-round-initializer
description: Ralph 流程专用：仅当 ralph-planner 决定进入下一轮 (Round X) 时触发。负责执行强制配速检查、加载上一轮经验并阻断跳步行为。
---

# Skill: ralph-round-initializer

## 技能描述
这是 Ralph 规划流程的 **强制配速员 (Strict Pacer) 与 质量检查站 (Quality Gate)**。
你的核心任务不是“启动”，而是 **“刹车”**。

## 核心目标
规划任何时候都不会圆满，任何时候都还可以优化。
**迭代的唯一目的**是不断打磨以下 5 个核心文件：
1.  `01-requirements.md` (不断细化需求)
2.  `02-architecture.md` (不断修正架构)
3.  `04-ralph-tasks.md` (不断拆解任务)
4.  `05-test-plan.md` (不断补充测试)
5.  `06-learnings.md` (不断沉淀经验)

你必须防止 Agent 因为急于求成而出现以下行为：
1.  **跳过步骤** (Skipping steps)
2.  **批量勾选** (Batch completion)
3.  **极速敷衍** (Rushing through without thinking)

## 状态机铁律 (Strict State Machine)
在放行之前，你必须重申以下规则：
1.  仅允许将 **当前** 处于 `🔄 进行中` 的行修改为 `✅ 完成`。
2.  **绝对禁止** 将处于 `⏳ 待定` 的行直接修改为 `✅ 完成`。必须先将其激活为 `🔄 进行中`，然后在**下一次**交互中才能标记为完成。
3.  **单次单行**：每次 `Write` 操作只能修改 **1 行** 为 `✅ 完成`。严禁一次性勾选多个步骤。

## 执行指令
当被 `ralph-planner` 调用时，请严格按照以下步骤执行检查，并输出相应的指令：

### 第一步：防极速检查 (Anti-Speeding Check)
*   **检查上一轮产出**：
    *   如果不是 Round 1，必须检查上一轮的核心文档（如 `01-requirements.md` 等）是否真的被**修改**和**完善**了？
    *   **红灯规则 (Red Light Rule)**：如果发现上一轮所有步骤的时间戳非常接近（例如在 1 分钟内完成了 5 步），或者文档内容依然是空的/模板化的 -> **立即报错 (Raise Error)**。
    *   **报错指令**：输出 "⛔️ **ERROR: Round Completed Too Fast!** Previous round steps seem to be skipped or hallucinated. Please verify documents manually."

### 第二步：强制配速协议 (Pacing Protocol Enforcement)
*   **系统指令**：向 Agent 发出以下 **不可违抗的系统指令**：
    > "🛑 **停下思考 (STOP & THINK)**：进入 Round X 后，你必须严格遵守 **[单步单次]** 原则。
    > 1.  **禁止批量**：每一次回复只能完成 **一个** 步骤。
    > 2.  **禁止跳步**：严禁一次性生成整个 Round 的内容。
    > 3.  **禁止假完成**：严禁在没有真实思考的情况下直接标记完成。
    > 4.  **慢即是快**：请花费时间深思熟虑，不要追求速度。"

### 第三步：经验加载 (Knowledge Injection)
根据当前轮次，执行不同的加载逻辑：

*   **场景 A (Round 1)**：
    *   输出："🚀 Round 1 Ready. Remember: **One step at a time.**"

*   **场景 B (Round 2-5)**：
    *   读取上一轮的 `06-learnings.md`。
    *   输出："🚀 Round X Ready. Previous Learnings Loaded: [摘要...]. **DO NOT RUSH.**"

## 执行协议
1.  **宁缺毋滥**：如果觉得进度太快，请直接建议用户暂停休息，或者强制要求进行“人工评审”。
2.  **拒绝自动化**：明确告知 Agent，本 Skill 的存在就是为了防止自动化脚本跑得太快。
