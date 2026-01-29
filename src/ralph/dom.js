// ============================================
// Trae Ralph Loop - DOM 操作与查询
// ============================================

const { findElement } = require('./utils');

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

function getLastChatTurnElement() {
  const turns = document.querySelectorAll('section.chat-turn');
  if (turns.length > 0) {
    return turns[turns.length - 1];
  }
  return null;
}

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

function getLastAssistantTurnChildren() {
  const turn = getLastAssistantTurnElement();
  if (!turn) return [];
  return Array.from(turn.children);
}

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

function getLastMessage() {
  const lastReply = getLastAssistantReplyElement();
  if (lastReply) return (lastReply.textContent || '').trim();
  const lastTurn = getLastAssistantTurnElement();
  if (lastTurn) return (lastTurn.textContent || '').trim();
  return '';
}

function getChatContent() {
  const lastReply = getLastAssistantReplyElement();
  if (lastReply) return (lastReply.textContent || '').trim();
  const lastTurn = getLastAssistantTurnElement();
  if (lastTurn) return (lastTurn.textContent || '').trim();
  return '';
}

function getInputTextValue(input) {
  if (!input) return '';
  if (input.contentEditable === 'true' || input.getAttribute('contenteditable') === 'true') {
    return (input.textContent || '').trim();
  }
  return (input.value || '').trim();
}

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
    getInputTextValue,
    isSendButtonEnabled
};
