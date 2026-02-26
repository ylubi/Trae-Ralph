---
name: ralph-round-initializer
description: Ralph 流程专用：仅当 ralph-planner 决定进入下一轮 (Round X) 时触发。负责执行强制配速检查、加载上一轮经验并阻断跳步行为。
---

# Skill: ralph-round-initializer

## 📋 技能描述 (Description)
这是 Ralph 规划流程的 **强制配速员 (Strict Pacer) 与 质量检查站 (Quality Gate)**。
你的核心任务不是“启动”，而是 **“刹车”**。你必须防止 Agent 因为急于求成而跳过步骤或批量勾选。

## 使用场景 (Usage)
- 当 `ralph-planner` 准备从 Round X 切换到 Round X+1 时。
- 系统检测到可能的“抢跑”行为时。

## 指令 (Instructions)

### 第一步：防极速检查 (Anti-Speeding Check)
1.  **检查上一轮产出**：
    *   如果不是 Round 1，检查上一轮核心文档是否真的被 **修改** 和 **完善**。
    *   **红灯规则 (Red Light Rule)**：如果时间戳过近（如1分钟完成5步）或内容为空 -> **立即报错 (Raise Error)**。
    *   **报错指令**：输出 "⛔️ **ERROR: Round Completed Too Fast!** Previous round steps seem to be skipped or hallucinated. Please verify documents manually."

### 第二步：强制配速协议 (Pacing Protocol Enforcement)
向 Agent 发出以下 **不可违抗的系统指令**：
> "🛑 **停下思考 (STOP & THINK)**：进入 Round X 后，你必须严格遵守 **[单步单次]** 原则。
> 1.  **禁止批量**：每一次回复只能完成 **一个** 步骤。
> 2.  **禁止跳步**：严禁一次性生成整个 Round 的内容。
> 3.  **禁止假完成**：严禁在没有真实思考的情况下直接标记完成。
> 4.  **慢即是快**：请花费时间深思熟虑，不要追求速度。"

### 第三步：经验加载 (Knowledge Injection)
*   **场景 A (Round 1)**：
    *   输出："🚀 Round 1 Ready. Remember: **One step at a time.**"
*   **场景 B (Round 2-3)**：
    *   读取上一轮的 `06-learnings.md`。
    *   输出："🚀 Round X Ready. Previous Learnings Loaded: [摘要...]. **DO NOT RUSH.**"

## 示例 (Examples)

### 示例 1：正常流转
**Input**:
> Planner: Round 1 Completed. Initializing Round 2...

**Output**:
> 🛑 **STOP & THINK**
> [检查通过]
> 🚀 Round 2 Ready. Previous Learnings Loaded: "API 设计需遵循 RESTful 规范". **DO NOT RUSH.**

### 示例 2：拦截抢跑
**Input**:
> Planner: Round 1 Completed. (但实际上只过了 10 秒)

**Output**:
> ⛔️ **ERROR: Round Completed Too Fast!**
> Previous round steps seem to be skipped. Please verify `01-requirements.md` manually.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **状态机铁律**:
    -   仅允许修改 `🔄 进行中` -> `✅ 完成`。
    -   **绝对禁止** `⏳ 待定` -> `✅ 完成`。
    -   **单次单行**：每次只能修改 1 行。
2.  **宁缺毋滥**：如果觉得进度太快，直接建议用户暂停休息或人工评审。
3.  **拒绝自动化**：明确告知 Agent，本 Skill 的存在就是为了防止自动化脚本跑得太快。

## 📂 关联资产 (Related Assets)
- `06-learnings.md` (读取经验)
