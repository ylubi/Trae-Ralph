// ============================================
// Trae Ralph Loop - 动作执行（发送消息、模拟输入）
// ============================================
const { 
  findSendButton, 
  getLastChatTurnElement, 
  findChatInput, 
  getLastAssistantReplyElement 
} = require('./dom');

function sendMessage(message) {
  // 0. 检查发送按钮是否处于停止状态 (表示 AI 正在工作)
  const sendButton = findSendButton();
  if (sendButton && sendButton.querySelector('.codicon-stop-circle')) {
      // 特例：如果是终端超时跳过场景，允许执行 (需在调用处保证，此处做兜底检查)
      // 但通常 sendMessage 是通用方法，更安全的做法是直接拦截
      console.log('⚠️ 检测到停止按钮 (AI 工作中)，拦截发送操作:', message);
      return false;
  }

  // 再次检查最后一条消息，防止在短时间内（如React更新延迟期间）重复调用导致重复发送
  const lastTurn = getLastChatTurnElement();
  if (lastTurn && lastTurn.classList.contains('user')) {
      const text = (lastTurn.textContent || '').trim();
      if (text === message) {
          console.log(`⏳ 最后一条消息已是"${message}"，跳过重复发送`);
          return false;
      }
  }

  const input = findChatInput();
  if (!input) {
    console.error('❌ 无法发送消息：未找到输入框');
    return false;
  }
  
  try {
    if (input.contentEditable === 'true' || input.getAttribute('contenteditable') === 'true') {
        input.focus();
        
        // 尝试使用 execCommand 模拟用户输入
        // 这是最可靠的方法，因为它会被编辑器的事件监听器捕获并更新内部状态(如 Lexical/ProseMirror)
        
        // 先清空内容，防止追加
        // 使用 selectAll + deleteCommand 模拟用户清空，这样对 Lexical/ProseMirror 更友好
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        // 兜底清空
        if (input.textContent.trim() !== '') {
            input.textContent = '';
        }
        
        const success = document.execCommand('insertText', false, message);
        
        if (!success) {
            console.warn('execCommand insertText 失败，降级到 DOM 操作');
            // 降级方案：直接操作 DOM，但尝试保持 Lexical 结构
            if (!input.querySelector('p')) {
                input.innerHTML = '<p class="chat-input-v2__paragraph"><br></p>';
            }
            const p = input.querySelector('p');
            if (p) {
                let span = p.querySelector('span[data-lexical-text="true"]');
                if (!span) {
                    span = document.createElement('span');
                    span.setAttribute('data-lexical-text', 'true');
                    p.innerHTML = '';
                    p.appendChild(span);
                }
                span.textContent = message;
            } else {
                input.textContent = message;
            }

            // 仅在手动 DOM 操作后派发事件
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: message,
                view: window
            });
            input.dispatchEvent(inputEvent);
        }
        // 注意：如果 execCommand 成功，浏览器会自动派发 input 事件，
        // 这里不再手动派发，以避免某些编辑器（如 Lexical/ProseMirror）处理两次导致内容重复
    } else {
        // 对于 textarea/input，尝试绕过 React 的 value 追踪
        const proto = Object.getPrototypeOf(input);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        
        if (setter) {
            setter.call(input, message);
        } else {
            input.value = message;
        }
        
        input.dispatchEvent(new InputEvent('input', { 
            bubbles: true,
            inputType: 'insertText',
            data: message
        }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // 延迟点击发送，等待 UI 响应输入变化 (解决"点击失效"问题)
    setTimeout(() => {
      // 二次检查：防止双重输入 (针对某些极端情况)
      const inputNow = findChatInput();
      if (inputNow) {
          const currentText = inputNow.textContent || '';
          // 如果内容正好是 message 重复两次
          if (currentText.trim() === message + message) {
              console.warn('⚠️ 检测到双重输入，尝试自动修正...');
              // 尝试恢复
              if (inputNow.contentEditable === 'true') {
                  document.execCommand('selectAll', false, null);
                  document.execCommand('insertText', false, message);
              } else {
                  inputNow.value = message;
              }
          }
      }

      const button = findSendButton();
      if (button && !button.disabled && !button.classList.contains('disabled')) {
        button.click();
        console.log('✓ 通过按钮发送消息:', message);
        if (typeof lastActionAt !== 'undefined') lastActionAt = Date.now();
      } else {
        // 按钮不可用或未找到，尝试回车发送
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(enterEvent);
        console.log('✓ 按钮不可用，尝试通过回车发送:', message);
        if (typeof lastActionAt !== 'undefined') lastActionAt = Date.now();
      }
    }, 300); // 300ms 延迟，确保 React 状态更新
    
    return true;
  } catch (error) {
    console.error('❌ 发送消息失败:', error);
    return false;
  }
}

function sendTerminalInput(text) {
  const cards = Array.from(document.querySelectorAll('.icd-run-command-card-v2'));
  const card = cards[cards.length - 1];
  if (!card) return false;
  const input = card.querySelector('textarea.xterm-helper-textarea');
  if (!input) return false;
  input.focus();

  const fire = (type, key, code) => {
    const evt = new KeyboardEvent(type, {
      key,
      code,
      keyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 13,
      which: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 13,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(evt);
  };

  for (const ch of text) {
    fire('keydown', ch, `Key${ch.toUpperCase()}`);
    fire('keypress', ch, `Key${ch.toUpperCase()}`);
    input.value = ch;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: ch,
      inputType: 'insertText'
    }));
    fire('keyup', ch, `Key${ch.toUpperCase()}`);
  }

  fire('keydown', 'Enter', 'Enter');
  fire('keypress', 'Enter', 'Enter');
  input.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    data: '\n',
    inputType: 'insertLineBreak'
  }));
  fire('keyup', 'Enter', 'Enter');
  if (typeof lastActionAt !== 'undefined') lastActionAt = Date.now();
  return true;
}

function clickSkipButton() {
  // 优先在最后一个 ai-agent-task 中查找，以确保操作的是最新回复
  let card = null;
  const lastTask = getLastAssistantReplyElement();
  
  if (lastTask) {
      const cards = lastTask.querySelectorAll('.icd-run-command-card-v2');
      if (cards.length > 0) {
          card = cards[cards.length - 1];
      }
  }
  
  // 降级：如果找不到 task 或 task 中没 card，尝试全局查找（保持兼容）
  if (!card) {
      const cards = document.querySelectorAll('.icd-run-command-card-v2');
      if (cards.length > 0) {
          card = cards[cards.length - 1];
      }
  }

  if (card) {
      const skipBtn = card.querySelector('.icd-run-command-card-v2-actions-btn-secondary');
      if (skipBtn && (skipBtn.textContent || '').includes('跳过')) {
          skipBtn.click();
          console.log('✅ 已点击跳过按钮');
          return true;
      }
  }
  return false;
}

module.exports = {
    sendMessage,
    sendTerminalInput,
    clickSkipButton
};
