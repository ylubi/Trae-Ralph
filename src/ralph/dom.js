/**
 * @file dom.js
 * @description DOM 操作与查询模块
 * 
 * 该模块封装了所有针对 Trae 界面元素的 DOM 查询操作，
 * 屏蔽了具体的 CSS 类名和 DOM 结构细节。
 * 
 * 主要功能包括：
 * - 查找聊天输入框、发送按钮
 * - 获取最新的对话轮次 (Turn) 和回复内容
 * - 提取错误提示和状态栏信息
 * - 兼容 $trae 全局对象和原生 DOM 查询
 * 
 * 主要导出函数：
 * - findChatInput, findSendButton
 * - getLastAssistantReplyElement
 * - getLastMessage, getChatContent
 * - isSendButtonEnabled
 */

const { findElement } = require('./utils');

/**
 * 查找聊天输入框元素
 * @returns {HTMLElement|null} 输入框元素
 */
function findChatInput() {
  // 优先使用 $trae
  if (window.$trae) {
    return window.$trae.chat.input;
  }
  // 降级到默认选择器
  return findElement([
    '.chat-input-v2-input-box-editable[contenteditable="true"]',
    '.chat-input-v2-input-box-editable',
    '#chat-input',
    'textarea[placeholder*="消息"]',
    'textarea[placeholder*="Message"]',
    'textarea[class*="chat"]',
    'textarea[class*="input"]',
    '[contenteditable="true"]'
  ]);
}

/**
 * 查找发送按钮元素
 * @returns {HTMLElement|null} 发送按钮元素
 */
function findSendButton() {
  if (window.$trae) {
    return window.$trae.chat.sendButton;
  }
  return findElement([
    '.chat-input-v2-send-button',
    'button[aria-label*="发送"]',
    'button[aria-label*="Send"]',
    'button[class*="send"]'
  ]);
}

/**
 * 获取最后一个对话轮次元素
 * @returns {HTMLElement|null} 最后一个对话轮次元素
 */
function getLastChatTurnElement() {
  const turns = document.querySelectorAll('section.chat-turn');
  if (turns.length > 0) {
    return turns[turns.length - 1];
  }
  return null;
}

/**
 * 获取最后一个助手回复轮次元素
 * @returns {HTMLElement|null} 最后一个助手回复轮次元素
 */
function getLastAssistantTurnElement() {
  const turns = document.querySelectorAll('section.chat-turn.assistant.task');
  if (turns.length > 0) {
    return turns[turns.length - 1];
  }
  const fallback = document.querySelectorAll('section.chat-turn.assistant');
  if (fallback.length > 0) {
    return fallback[fallback.length - 1];
  }
  return null;
}

/**
 * 获取最后一个助手回复的具体内容元素
 * @returns {HTMLElement|null} 最后一个助手回复的内容元素
 */
function getLastAssistantReplyElement() {
  const turn = getLastAssistantTurnElement();
  if (!turn) return null;
  
  // 优先返回 ai-agent-task，因为它是主要的回复容器
  const tasks = turn.querySelectorAll('.ai-agent-task');
  if (tasks.length > 0) {
    return tasks[tasks.length - 1];
  }
  
  // 如果没有 task，尝试返回最后一个 element
  const children = turn.children;
  if (children.length > 0) {
    return children[children.length - 1];
  }
  
  return null;
}

/**
 * 获取最后一个助手回复轮次的所有子元素
 * @returns {HTMLElement[]} 子元素数组
 */
function getLastAssistantTurnChildren() {
  const turn = getLastAssistantTurnElement();
  if (!turn) return [];
  return Array.from(turn.children);
}

/**
 * 获取最新的助手状态栏元素
 * @returns {HTMLElement|null} 状态栏元素
 */
function getLatestAssistantBarElement() {
  const turn = getLastAssistantTurnElement();
  if (!turn) return null;
  const children = turn.children;
  if (children.length > 0) {
    const lastChild = children[children.length - 1];
    if (lastChild.classList.contains('latest-assistant-bar') && lastChild.classList.contains('latest-assistant-bar-stage-0')) {
      return lastChild;
    }
  }
  return turn.querySelector('.latest-assistant-bar.latest-assistant-bar-stage-0');
}

/**
 * 获取最后一个助手回复中的潜在警告/错误元素候选列表
 * @returns {HTMLElement[]} 候选元素数组
 */
function getLastAssistantAlertCandidates() {
  const children = getLastAssistantTurnChildren();
  const candidates = [];
  if (children.length >= 2) {
    candidates.push(children[children.length - 2]);
  }
  if (children.length >= 3) {
    candidates.push(children[children.length - 3]);
  }
  return candidates;
}

/**
 * 获取最后一条消息的文本内容
 * @returns {string} 消息文本
 */
function getLastMessage() {
  const lastReply = getLastAssistantReplyElement();
  if (lastReply) return (lastReply.textContent || '').trim();
  const lastTurn = getLastAssistantTurnElement();
  if (lastTurn) return (lastTurn.textContent || '').trim();
  return '';
}

/**
 * 获取当前聊天内容的文本（同 getLastMessage）
 * @returns {string} 聊天内容文本
 */
function getChatContent() {
  const lastReply = getLastAssistantReplyElement();
  if (lastReply) return (lastReply.textContent || '').trim();
  const lastTurn = getLastAssistantTurnElement();
  if (lastTurn) return (lastTurn.textContent || '').trim();
  return '';
}

/**
 * 获取助手回复总数
 * @returns {number} 回复数量
 */
function getAssistantTurnCount() {
  return document.querySelectorAll('section.chat-turn.assistant').length;
}

/**
 * 获取最后一个回复的唯一签名 (用于状态追踪)
 * 格式: "Index:TaskID:TaskStatus"
 * 如果没有 TaskID，则降级为 content hash
 * @param {Object} taskManager 任务管理器实例，用于获取任务状态
 * @returns {string|null} 签名字符串，如果无回复返回 null
 */
function getLastTurnSignature(taskManager) {
  const turn = getLastAssistantTurnElement();
  if (!turn) return null;
  
  const count = getAssistantTurnCount();
  
  // 1. 尝试获取 data-ralph-task-id
  // 注意：ID 可能挂在 .ai-agent-task 上，也可能挂在 turn 上（取决于实现）
  // 目前实现是挂在 .ai-agent-task 上
  const taskEl = turn.querySelector('.ai-agent-task');
  const taskId = taskEl ? taskEl.getAttribute('data-ralph-task-id') : null;
  
  if (taskId && taskManager) {
      const task = taskManager.getTask(taskId);
      const status = task ? task.status : 'UNKNOWN';
      // 格式: Index:TaskID:Status
      return `${count}:${taskId}:${status}`;
  }
  
  // 2. 降级方案 (如果还没生成 ID 或不是 Task)
  const text = (turn.textContent || '').trim();
  const signature = `${count}:${text.length}:${text.substring(0, 20).replace(/[\r\n]/g, '')}`;
  return signature;
}

/**
 * 获取输入框的文本值
 * @param {HTMLElement} input 输入框元素
 * @returns {string} 输入框文本值
 */
function getInputTextValue(input) {
  if (!input) return '';
  if (input.contentEditable === 'true' || input.getAttribute('contenteditable') === 'true') {
    return (input.textContent || '').trim();
  }
  return (input.value || '').trim();
}

/**
 * 检查发送按钮是否可用
 * @param {HTMLElement} button 发送按钮元素
 * @returns {boolean} 是否可用
 */
function isSendButtonEnabled(button) {
  if (!button) return false;
  if (button.disabled) return false;
  if (button.getAttribute('disabled') !== null) return false;
  if (button.classList && button.classList.contains('disabled')) return false;
  return true;
}

module.exports = {
    findChatInput,
    findSendButton,
    getLastChatTurnElement,
    getLastAssistantTurnElement,
    getLastAssistantReplyElement,
    getLastAssistantTurnChildren,
    getLatestAssistantBarElement,
    getLastAssistantAlertCandidates,
    getLastMessage,
    getChatContent,
    getAssistantTurnCount,
    getLastTurnSignature,
    getInputTextValue,
    isSendButtonEnabled
};
