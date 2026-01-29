// ============================================
// Trae Ralph Loop - 状态检测
// ============================================
const { 
  getLastAssistantReplyElement, 
  getLastAssistantTurnElement, 
  getLastAssistantAlertCandidates,
  findChatInput 
} = require('./dom');
const { findElement } = require('./utils');

function isBlockingError() {
  // 1. 检查系统级错误 (仅限最后一条消息)
  const lastTurn = getLastAssistantReplyElement() || getLastAssistantTurnElement();
  if (lastTurn) {
      const sysError = lastTurn.querySelector('.agent-error-wrap .icube-alert-msg');
      if (sysError && (sysError.textContent || '').includes('系统未知错误')) {
          return true;
      }
  }
  
  // 2. 检查回复中的阻断提示
  const candidates = getLastAssistantAlertCandidates();
  for (const alert of candidates) {
    const text = alert ? (alert.textContent || '') : '';
    if (text.includes('模型思考次数已达上限') || text.includes('输出过长')) {
      return true;
    }
  }
  return false;
}

function isAIWorking() {
  const isChatIdleState = () => {
    const container = document.querySelector('.chat-input-v2-container');
    if (container && container.classList.contains('chat-input-v2-container--empty')) return true;
    const placeholder = document.querySelector('.chat-input-v2-placeholder');
    if (placeholder) {
      const cs = getComputedStyle(placeholder);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0') return true;
    }
    return false;
  };
  // 1. 使用 $trae 检查 (优先于 DOM 阻断检查，以避免在 AI 响应后（loading=true）仍被旧 DOM 误导)
  if (window.$trae) {
    // 优先检查阻断性异常 (Force Stop Indicators)
    // 即使 $trae.status.loading 为 true，如果出现阻断提示，也应视为停止
    if (isBlockingError()) {
        console.log('⚠️ ($trae) 检测到阻断提示 -> 强制判定 AI 为停止状态');
        return false;
    }

    if (window.$trae.status.loading) {
        // 即使 $trae.status.loading 为 true，也要检查是否有特殊文本
        const loading = findElement([
          '.loading',
          '.spinner',
          '[class*="loading"]',
          '[class*="thinking"]',
          '[class*="generating"]',
          '[aria-busy="true"]'
        ]);
        if (loading) {
            const text = loading.textContent || '';
            if (text.includes('正在等待你的操作') || 
                text.includes('Waiting for your operation') ||
                text.includes('命令运行中') ||
                text.includes('终端长时间未返回输出')) {
                console.log('👀 ($trae) 检测到特殊状态文本，强制视为 AI 空闲:', text);
                return false;
            }
        }
        if (isChatIdleState()) {
          return false;
        }
        return true;
    }
    
    const input = window.$trae.chat.input;
    if (input && (input.disabled || input.readOnly)) return true;
  }
  
  // 2. 检查阻断性异常 (Force Stop Indicators)
  // 仅在非 loading 状态下检查
  if (isBlockingError()) {
      console.log('⚠️ 检测到阻断提示 -> 强制判定 AI 为停止状态');
      return false;
  }
  
  if (isChatIdleState()) return false;
  
  // 3. 降级到默认检查
  // 首先检查停止按钮，如果存在则说明正在工作
  if (document.querySelector('.codicon-stop-circle')) {
      // 如果有停止按钮，通常表示正在工作
      // 但如果同时出现 confirm-popover，说明是“伪工作状态”，实际上在等待用户确认
      if (document.querySelector('.confirm-popover-body')) {
          console.log('👀 检测到停止按钮但存在确认弹窗，强制视为 AI 空闲以处理弹窗');
          return false;
      }
      return true;
  }

  const loading = findElement([
    '.loading',
    '.spinner',
    '[class*="loading"]',
    '[class*="thinking"]',
    '[class*="generating"]',
    '[aria-busy="true"]'
  ]);
  
  // 特殊情况：如果显示"正在等待你的操作"，说明不是忙碌状态，而是等待交互
  if (loading) {
    const text = loading.textContent || '';
    // 如果是 "正在等待你的操作" 或 "命令运行中"，则不视为忙碌 (这是需要交互或监控的状态)
          if (text.includes('正在等待你的操作') || 
              text.includes('Waiting for your operation') ||
              text.includes('命令运行中') ||
              text.includes('终端长时间未返回输出')) {
              console.log('👀 检测到特殊状态文本，视为 AI 空闲以触发场景检测:', text);
              return false;
          }
    return true;
  }
  
  const input = findChatInput();
  if (input && (input.disabled || input.readOnly)) return true;
  
  return false;
}

module.exports = {
    isBlockingError,
    isAIWorking
};
