/**
 * @file click.js
 * @description 点击类场景定义 (Priority: 90)
 */

module.exports = [
    {
        id: 'click_alert_action',
        type: 'OP_CLICK',
        name: '系统警告/错误操作',
        description: '识别带有 icube-alert-action 的系统提示 (如输出过长)',
        match: (el, text) => !!el.querySelector('.icube-alert-action')
    },
    {
        id: 'click_generic_continue',
        type: 'OP_CLICK',
        name: '通用继续按钮',
        description: '识别文本包含“继续”且有非复制类按钮的提示',
        match: (el, text) => {
            const hasContinueText = text.includes('继续');
            const hasButton = el.querySelector('button');
            // 简单策略: 有"继续"文字且有按钮
            // 注意：这里可以添加更复杂的逻辑，例如排除 aria-label="Copy" 的按钮
            // const isCopy = hasButton && (hasButton.getAttribute('aria-label') === 'Copy' || hasButton.className.includes('copy'));
            // return hasContinueText && hasButton && !isCopy;
            return hasContinueText && hasButton;
        }
    }
];
