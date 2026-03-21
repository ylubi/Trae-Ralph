/**
 * @file status.js
 * @description 状态检测模块
 * 
 * 该模块负责判断 AI 当前的宏观工作状态，是主循环决策的基础。
 * 
 * 主要功能：
 * - 判断 AI 是否正在工作 (isAIWorking):
 *   - 检查 Loading 指示器
 *   - 检查输入框禁用状态
 *   - 检查停止按钮状态
 * - 判断是否存在阻断性错误 (isBlockingError):
 *   - 检查模型限制提示
 *   - 检查系统错误横幅
 * 
 * 主要导出函数：
 * - isAIWorking
 * - isBlockingError
 */
const { 
  getLastAssistantReplyElement, 
  getLastAssistantTurnElement, 
  getLastAssistantAlertCandidates,
  findChatInput 
} = require('./dom');
const { findElement } = require('./utils');
const __baseConsole = globalThis.console;
const console = {
  log: (...args) => __baseConsole.log('[trae-ralph]', ...args),
  warn: (...args) => __baseConsole.warn('[trae-ralph]', ...args),
  error: (...args) => __baseConsole.error('[trae-ralph]', ...args)
};

/**
 * 检查是否存在阻断性错误（如模型限制、系统错误等）
 * @returns {boolean} 是否存在阻断性错误
 */
function isBlockingError() {
  // 1. 检查系统级错误 (仅限最后一条消息)
  const lastTurn = getLastAssistantTurnElement();
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

/**
 * 检查 AI 是否正在工作
 * @returns {boolean} 是否正在工作
 */
function isAIWorking() {
  const isChatIdleState = () => {
    const container = document.querySelector('.chat-input-v2-container');
    if (container && container.classList.contains('chat-input-v2-container--empty')) return true;
    
    const placeholder = document.querySelector('.chat-input-v2-placeholder');
    if (placeholder) {
      const cs = getComputedStyle(placeholder);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0') return true;
    }
    
    // 增加对 disabled 发送按钮的检查，如果按钮是 disabled 且内容为空，则认为是 Idle
    const sendBtn = document.querySelector('.chat-input-v2-send-button.disabled');
    if (sendBtn) {
        // 进一步确认输入框是否真的为空
        const input = findChatInput();
        if (input && !input.textContent.trim()) return true;
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
  
  // 2.1 检查排队状态 (Queue Up Check) - 全局扫描
  // 这种信息可能出现在 .latest-assistant-bar 或 .agent-error-wrap 中，也可能在 alert 中
  const queueAlerts = findElement([
      '.icube-alert-title', 
      '.icube-alert-msg',
      '.latest-assistant-bar',
      '.agent-error-wrap',
      '.icube-component-alert' // 新增: 适配最新的排队提醒结构
  ], true) || []; // 确保返回数组，避免 null 导致 TypeError

  for (const el of queueAlerts) {
      const text = (el.textContent || '').trim();
      // 只要包含"排队"或者"请求量较高"，就视为 AI 忙碌中
      // 移除对 loading 动画的依赖，因为排队时可能没有动画
      if ((text.includes('排队') || text.includes('queue')) && 
          (text.includes('请求量较高') || text.includes('第') || text.includes('位'))) {
           console.log('⏳ [Global] 检测到排队提醒，视为 AI 忙碌中 (Blocking backups)...');
           return true;
      }
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
    
    // 移除这里冗余的排队检查，因为已经在上方全局检查过了
    // ...

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
