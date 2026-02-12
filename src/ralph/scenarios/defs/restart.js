/**
 * @file restart.js
 * @description 重启/重试类场景定义 (Priority: 80)
 */

module.exports = [
    {
        id: 'restart_regenerate',
        type: 'OP_RESTART',
        name: '重新生成/重试',
        description: '识别重新生成或重试按钮',
        match: (el, text) => {
            const hasButton = el.querySelector('button');
            // 匹配多种语言或变体
            return hasButton && (
                text.includes('重新生成') || 
                text.includes('Regenerate') || 
                text.includes('重试') || 
                text.includes('Retry')
            );
        }
    }
];
