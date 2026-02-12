# 场景处理与测试记录 (Scenario Handling & Testing Status)

本文档记录了 Ralph 系统支持的所有场景定义、处理逻辑以及当前的测试验证状态。
作为 `src/ralph/scenarios/defs/*.js` 的配套文档，请在此维护场景的详细说明。

## 场景概览 (Scenario Overview)

| ID | 类型 | 名称 | 优先级 | 描述 | 测试状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `reply_context_limit` | OP_REPLY | 上下文长度限制 | 50 | 自动回复以延续对话 | ✅ 已验证 |
| `reply_thinking_limit` | OP_REPLY | 思考次数上限 | 50 | 深度思考达到上限时自动继续 | ⏳ 待验证 |
| `terminal_run_command` | OP_TERMINAL | 运行命令 | 100 | 处理 `npm run` 等命令执行 | ✅ 已验证 |
| `terminal_delete_file` | OP_TERMINAL | 删除文件 | 100 | 处理文件删除确认 | ✅ 已验证 |
| `click_alert_action` | OP_CLICK | 系统警告操作 | 90 | 点击 Alert 中的操作按钮 (如输出过长) | ✅ 已验证 |
| `click_generic_continue` | OP_CLICK | 通用继续按钮 | 90 | 兜底处理包含"继续"的按钮 | ✅ 已验证 |
| `restart_regenerate` | OP_RESTART | 重新生成/重试 | 80 | 点击重新生成或重试按钮 | ⏳ 待验证 |

## 添加新场景 (How to Add)

为了避免 `definitions.js` 单文件膨胀，我们采用了分类管理的方式。

1.  **选择或创建分类文件**:
    *   在 `src/ralph/scenarios/defs/` 目录下找到对应的分类文件 (如 `reply.js`, `terminal.js`)。
    *   如果是全新的分类，创建一个新的 `.js` 文件 (例如 `network.js`)。

2.  **编写场景定义**:
    在文件中导出包含场景对象的数组。
    ```javascript
    /**
     * @file network.js
     * @description 网络相关场景定义
     */
    module.exports = [
        {
            id: 'network_retry',
            type: 'OP_CLICK', // 或其他类型
            name: '网络错误重试',
            description: '当出现网络错误时自动点击重试',
            // match 函数接收 (element, text)
            // 支持复杂的 DOM 操作或正则匹配
            match: (el, text) => {
                return text.includes('Network Error') && !!el.querySelector('.retry-btn');
            }
        }
    ];
    ```

3.  **注册场景**:
    如果创建了新文件，需要在 `src/ralph/scenarios/index.js` 中引入并聚合。
    ```javascript
    // src/ralph/scenarios/index.js
    const networkScenarios = require('./defs/network'); // 使用相对路径
    
    const ALL_DEFINITIONS = [
        // ...
        ...networkScenarios
    ];
    ```

4.  **文档更新**: 在本文档的表格中添加对应行，初始状态标记为 "⏳ 待验证"。

5.  **测试**: 运行 `src/ralph/test-refactor.js` 或手动验证，确认无误后更新状态为 "✅ 已验证"。

## 场景类型说明

*   **OP_TERMINAL (P0 - 100)**: 终端操作，优先级最高，通常涉及代码执行或文件修改。
*   **OP_CLICK (P0 - 90)**: 直接点击操作，通常用于处理系统提示或简单的继续流程。
*   **OP_RESTART (P0 - 80)**: 对话重启/重试，用于处理生成失败的情况。
*   **OP_REPLY (P0 - 50)**: 文本回复，用于维持对话上下文或确认信息。

## 全局阻断场景 (Global Blocking)

此类场景不通过 `definitions.js` 配置，而是由 `TraeAgentTaskManager.getGlobalOp` 直接硬编码处理，因为它们通常不依赖于 `.ai-agent-task` 元素，而是全局模态弹窗。

*   **交互式确认弹窗**: `.confirm-popover-body`
*   **交互式终端输入**: 识别 `waiting for input` 等特征
*   **任务完成确认**: 识别 `.latest-assistant-bar .status .status-text` 为 "任务完成"

