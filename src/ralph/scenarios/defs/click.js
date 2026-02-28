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
    },
    {
        id: 'click_service_exception_retry',
        type: 'OP_CLICK',
        name: '服务端异常重试',
        description: '识别“服务端异常”并点击“重试”按钮',
        match: (el, text) => {
            // 匹配条件：
            // 1. 文本包含 "服务端异常" 或 "请稍后重试"
            // 2. 存在按钮，且按钮文本为 "重试" 或包含 icube-alert-button-action 类
            const isException = text.includes('服务端异常') || text.includes('请稍后重试');
            if (!isException) return false;
            
            const buttons = Array.from(el.querySelectorAll('button'));
            const hasRetryBtn = buttons.some(btn => {
                const btnText = (btn.textContent || '').trim();
                return btnText === '重试' || btn.classList.contains('icube-alert-button-action');
            });
            
            return hasRetryBtn;
        }
    }
];
