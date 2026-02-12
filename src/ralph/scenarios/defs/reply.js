/**
 * @file reply.js
 * @description 回复类场景定义 (Priority: 50)
 */

module.exports = [
    {
        id: 'reply_context_limit',
        type: 'OP_RESET_CONTINUE',
        name: '上下文长度限制',
        description: '当对话上下文超过模型限制时自动执行: 新建任务->保留->继续',
        // 匹配逻辑：检查文本内容
        match: (el, text) => text.includes('上下文长度')
    },
    // reply_task_completed 已移至 TaskManager 全局阻断检测 (Priority 0+)
    {
        id: 'reply_thinking_limit',
        type: 'OP_REPLY',
        name: '思考次数上限',
        description: '当深度思考模型达到次数上限时自动回复继续',
        match: (el, text) => text.includes('模型思考次数已达上限')
    }
];
