/**
 * @file actions.js
 * @description 动作执行模块
 * 
 * 该模块负责执行具体的 UI 操作，包括：
 * - 发送聊天消息 (支持 contenteditable 和标准 input)
 * - 模拟终端输入
 * - 点击界面按钮 (如跳过按钮)
 * - 检查发送状态和阻止重复发送
 * 
 * 主要导出函数：
 * - sendMessage: 发送消息到聊天框
 * - sendTerminalInput: 发送内容到终端输入框
 * - clickSkipButton: 点击跳过按钮
 * - clickStopButton: 点击停止按钮
 * - shouldBlockSending: 检查是否应该阻止发送
 */
const { 
  findSendButton, 
  getLastChatTurnElement, 
  findChatInput, 
  getLastAssistantReplyElement 
} = require('./dom');
const { CONFIG } = require('./config');

/**
 * 点击停止按钮
 * @returns {boolean} 是否成功点击
 */
function clickStopButton() {
  const sendButton = findSendButton();
  if (sendButton) {
    // 检查按钮内部是否有停止图标
    const stopIcon = sendButton.querySelector('.codicon-stop-circle');
    // 或者检查按钮本身的 aria-label 或 title (如果 Trae 有设置)
    // 但通常我们依赖图标存在来判断是否是停止按钮
    if (stopIcon) {
      sendButton.click();
      console.log('🛑 已点击停止按钮');
      return true;
    }
  }
  return false;
}

/**
 * 检查是否应该阻止发送消息
 * @param {string} message 待发送的消息内容
 * @returns {boolean} 如果应该阻止发送则返回 true
 */
function shouldBlockSending(message) {
  // 0. 检查发送按钮是否处于停止状态 (表示 AI 正在工作)
  const sendButton = findSendButton();
  if (sendButton && sendButton.querySelector('.codicon-stop-circle')) {
      console.log('⚠️ 检测到停止按钮 (AI 工作中)，拦截发送操作:', message);
      return true;
  }

  // 再次检查最后一条消息，防止在短时间内重复调用
  const lastTurn = getLastChatTurnElement();
  if (lastTurn && lastTurn.classList.contains('user')) {
      const text = (lastTurn.textContent || '').trim();
      if (text === message) {
          console.log(`⏳ 最后一条消息已是"${message}"，跳过重复发送`);
          return true;
      }
  }
  return false;
}

/**
 * 填充 contenteditable 输入框
 * @param {HTMLElement} input 输入框元素
 * @param {string} message 消息内容
 */
function fillContentEditable(input, message) {
    input.focus();
    
    // 尝试使用 execCommand 模拟用户输入
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    
    if (input.textContent.trim() !== '') {
        input.textContent = '';
    }
    
    const success = document.execCommand('insertText', false, message);
    
    if (!success) {
        console.warn('execCommand insertText 失败，降级到 DOM 操作');
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

        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: message,
            view: window
        });
        input.dispatchEvent(inputEvent);
    }
}

/**
 * 填充标准 input/textarea 输入框
 * @param {HTMLElement} input 输入框元素
 * @param {string} message 消息内容
 */
function fillStandardInput(input, message) {
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

/**
 * 触发发送动作（点击按钮或回车）
 * @param {string} message 消息内容（用于日志和双重检查）
 */
function triggerSendAction(message) {
    // 二次检查：防止双重输入
    const inputNow = findChatInput();
    if (inputNow) {
        const currentText = inputNow.textContent || '';
        if (currentText.trim() === message + message) {
            console.warn('⚠️ 检测到双重输入，尝试自动修正...');
            if (inputNow.contentEditable === 'true') {
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, message);
            } else {
                inputNow.value = message;
            }
        }
    }

    const button = findSendButton();
    // 即使按钮被禁用 (disabled)，如果是因为内容为空导致的，
    // 我们在 fillContentEditable 后应该等待 UI 更新状态。
    // 如果 UI 更新慢，按钮可能还是 disabled。
    // 策略：优先尝试点击，如果不行（或者真的 disabled），尝试回车。
    // 注意：Trae 的发送按钮在输入内容后通常会启用。如果它还是 disabled，可能是 UI 没刷新。
    // 强制移除 disabled 属性尝试点击可能无效（事件未绑定）。
    // 所以回车是比较稳妥的 fallback。
    
    if (button && !button.disabled && !button.classList.contains('disabled')) {
        button.click();
        console.log('✓ 通过按钮发送消息:', message);
    } else {
        console.warn('⚠️ 发送按钮不可用 (disabled)，尝试通过回车发送...');
        const input = findChatInput();
        if (input) {
            input.focus();
            
            // 模拟完整的 Enter 键按下过程
            const eventProps = {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
                view: window
            };
            
            input.dispatchEvent(new KeyboardEvent('keydown', eventProps));
            input.dispatchEvent(new KeyboardEvent('keypress', eventProps));
            input.dispatchEvent(new KeyboardEvent('keyup', eventProps));
            
            console.log('✓ 已触发回车事件发送消息:', message);
        }
    }
    
    if (typeof lastActionAt !== 'undefined') lastActionAt = Date.now();
}

/**
 * 发送消息给 AI
 * @param {string} message 消息内容
 * @returns {boolean} 是否成功发起发送
 */
function sendMessage(message) {
  if (shouldBlockSending(message)) return false;

  const input = findChatInput();
  if (!input) {
    console.error('❌ 无法发送消息：未找到输入框');
    return false;
  }
  
  try {
    if (input.contentEditable === 'true' || input.getAttribute('contenteditable') === 'true') {
        fillContentEditable(input, message);
    } else {
        fillStandardInput(input, message);
    }
    
    // 延迟点击发送，等待 UI 响应输入变化
    setTimeout(() => triggerSendAction(message), 300);
    
    return true;
  } catch (error) {
    console.error('❌ 发送消息失败:', error);
    return false;
  }
}

/**
 * 发送终端输入
 * @param {string} text 终端输入内容
 * @returns {boolean} 是否成功
 */
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
    input.dispatchEvent(new InputEvent('change', { bubbles: true }));
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

/**
 * 点击跳过按钮
 * @returns {boolean} 是否成功点击
 */
function clickSkipButton() {
  // 优先在最后一个 ai-agent-task 中查找，以确保操作的是最新回复
  let container = null;
  const lastTask = getLastAssistantReplyElement();
  
  if (lastTask) {
      container = lastTask;
  } else {
      container = document;
  }
  
  // 查找所有可能的卡片容器 (兼容 v2 和 v2-cwd)
  const cards = Array.from(container.querySelectorAll('.icd-run-command-card-v2, .icd-run-command-card-v2-cwd'));
  const card = cards.length > 0 ? cards[cards.length - 1] : null;

  if (card) {
      const selectors = [
          '.icd-btn-tertiary', // 新版/当前 (v2-cwd)
          '.icd-run-command-card-v2-actions-btn-secondary', // 旧版
          'button' // 兜底
      ];
      
      for (const sel of selectors) {
          const btns = Array.from(card.querySelectorAll(sel));
          const target = btns.find(btn => {
              const text = (btn.textContent || '').trim();
              return text.includes('跳过') || text.includes('Skip');
          });
          if (target) {
              target.click();
              console.log(`✅ 已点击跳过按钮 (selector: ${sel})`);
              return true;
          }
      }
  }
  return false;
}

/**
 * 重置上下文并继续
 * 1. 点击“新建任务”
 * 2. 处理“全部保留”确认弹窗
 * 3. 等待并输入“继续”
 */
async function resetContextAndContinue() {
    // 1. 点击新建任务按钮
    const newChatBtn = document.querySelector('.action-label.codicon.codicon-icube-NewChat');
    if (newChatBtn) {
        console.log('🖱️ 点击新建任务按钮...');
        newChatBtn.click();
        
        // 2. 等待弹窗检查 (短时间等待，因为弹窗可能很快出现)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查是否有二次确认弹窗
        const keepAllBtn = Array.from(document.querySelectorAll('.popup-button.primary'))
            .find(btn => (btn.textContent || '').trim() === '全部保留');
            
        if (keepAllBtn) {
            console.log('🖱️ 检测到确认弹窗，点击“全部保留”...');
            keepAllBtn.click();
        } else {
            console.log('ℹ️ 未检测到确认弹窗，直接继续');
        }
        
        // 3. 等待新会话初始化 (10秒)
        console.log('⏳ 等待 10 秒以初始化新会话...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 4. 发送继续
        console.log('💡 发送“继续”...');
        const success = sendMessage(CONFIG.messages.continue);
        if (success) {
            console.log('✅ “继续”发送成功');
        } else {
            console.warn('⚠️ “继续”发送失败');
        }
        return true;
    } else {
        console.error('❌ 未找到新建任务按钮 (.codicon-icube-NewChat)');
        return false;
    }
}

module.exports = {
    sendMessage,
    sendTerminalInput,
    clickSkipButton,
    clickStopButton,
    shouldBlockSending,
    resetContextAndContinue
};
