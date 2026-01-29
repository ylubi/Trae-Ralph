// ============================================
// Trae Ralph Loop - 增强版
// ============================================
// 
// 功能：
// 1. 多场景检测（上下文限制、请求限制、交互式命令等）
// 2. 可配置的检测规则
// 3. 智能响应策略
// 4. 测试和调试工具
// ============================================

(function() {
  // 停止旧循环
  if (window.stopLoop) {
    try { window.stopLoop(); } catch (e) { console.error(e); }
  }

  console.log('🚀 Trae Ralph Loop - 增强版');
  console.log('');
  
  // ============================================
  // 场景定义
  // ============================================
  
  const SCENARIOS_PLACEHOLDER = null;
  const SCENARIOS = SCENARIOS_PLACEHOLDER || {};
  
  // ============================================
  // 配置
  // ============================================
  
  const CONFIG = {
    checkInterval: 5000,
    stableCount: 3,
    scenarios: SCENARIOS,
    chatHistoryTurns: 6,
    chatHistoryCharLimit: 4000
  };
  
  // ============================================
  // 加载元素选择器
  // ============================================
  
  // 注入选择器定义（会被 launcher/injector 替换）
  const SELECTORS_PLACEHOLDER = null;
  
  // 如果有选择器定义，则加载
  if (SELECTORS_PLACEHOLDER) {
    eval(SELECTORS_PLACEHOLDER);
  }
  
  // ============================================
  // 工具函数
  // ============================================
  
  function findElement(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (error) {
        // 忽略无效选择器
      }
    }
    return null;
  }
  
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
  
  function getTraeWorkflowStatus() {
      try {
      // 0. 优先检查最后一条消息是否为用户发送
      // 如果是用户发送的，说明对话已更新，之前的"任务完成"状态已失效（即使 AI 还没开始回复）
      const lastTurn = getLastChatTurnElement();
      if (lastTurn && lastTurn.classList.contains('user')) {
          // 如果用户刚发送消息，状态应该是等待响应，而不是保留上一轮的任务完成
          return '等待响应'; 
      }

      const completeBar = getLatestAssistantBarElement();
      const completeEl = completeBar ? completeBar.querySelector('.status .status-text') : null;
      const completeText = completeEl ? (completeEl.textContent || '').trim() : '';
      if (completeText === '任务完成') return '任务完成';
      
      // 检查系统级错误 (仅限最后一条消息)
      const lastReplyOrTurn = getLastAssistantReplyElement() || getLastAssistantTurnElement();
      if (lastReplyOrTurn) {
          const errorEl = lastReplyOrTurn.querySelector('.agent-error-wrap .icube-alert-msg');
          if (errorEl && (errorEl.textContent || '').includes('系统未知错误')) {
              return '系统错误';
          }
      }
      
      const alertTextEl = document.querySelector('.inline-alert-bar-content');
      const alertText = alertTextEl ? (alertTextEl.textContent || '').trim() : '';
      if (alertText.includes('终端长时间未返回输出')) return '终端等待/超时';
      
      const runCard = document.querySelector('.icd-run-command-card-v2');
      if (runCard) {
        const runBtn = runCard.querySelector('.icd-run-command-card-v2-actions-btn-run');
        if (runBtn) return '等待点击运行';
      }
      
      const stopIcon = document.querySelector('.codicon-stop-circle');
      if (stopIcon) return '工作中';
      
      const sendBtn = findSendButton();
      if (sendBtn) {
        const disabled = !!sendBtn.disabled || sendBtn.classList.contains('disabled') || sendBtn.getAttribute('disabled') !== null;
        return disabled ? '空闲(发送禁用)' : '空闲(可发送)';
      }
      
      return '空闲/未知';
    } catch (e) {
      return '空闲/未知';
    }
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
  
  function isBlockingError() {
    // 0. "任务完成" 状态不再视为阻断错误，而是视为普通空闲状态，交由场景检测处理
    // const completeStatus = getTraeWorkflowStatus();
    // if (completeStatus === '任务完成') {
    //    return true;
    // }

    // 1. 检查系统级错误 (仅限最后一条消息)
    // 强制检测最后一条信息，而不是全局信息，避免旧的全局错误误导状态
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
          lastActionAt = Date.now();
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
          lastActionAt = Date.now();
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
    lastActionAt = Date.now();
    return true;
  }

  function clickSkipButton() {
    // 优先在最后一个 ai-agent-task 中查找，以确保操作的是最新回复
    // document.getElementsByClassName('ai-agent-task') 最后一个元素的
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
        const cards = Array.from(document.querySelectorAll('.icd-run-command-card-v2'));
        if (cards.length > 0) {
            card = cards[cards.length - 1];
        }
    }

    if (!card) return false;

    // 根据用户提供的结构，跳过按钮位于 icd-run-command-card-v2-cwd 容器内
    // <div class="icd-run-command-card-v2-cwd"> ... <button ...>跳过</button> ... </div>
    
    // 尝试在 card 内部查找所有可能的按钮
    const buttons = Array.from(card.querySelectorAll('button'));
    // 优先匹配内容为"跳过"的按钮
    let btn = buttons.find(b => (b.textContent || '').trim() === '跳过');
    
    // 如果找不到，尝试匹配特定的类名结构 (icd-btn-tertiary)
    if (!btn) {
        btn = buttons.find(b => b.classList.contains('icd-btn-tertiary') && b.querySelector('.icd-btn-content')?.textContent.trim() === '跳过');
    }

    if (!btn) {
        console.warn('❌ 未找到跳过按钮');
        return false;
    }

    btn.click();
    lastActionAt = Date.now();
    return true;
  }

  function isTaskCompleteBanner() {
    const el = document.querySelector('.latest-assistant-bar .status .status-text');
    const text = el ? (el.textContent || '').trim() : '';
    return text === '任务完成';
  }

  function scheduleSkipFallback(timeoutMs = 180000) {
    const startFirstStop = firstStopTime;
    const startActionAt = lastActionAt;
    const startWorkingAt = lastWorkingAt;
    const initialLastTask = getLastAssistantReplyElement(); // 记录初始的最后一条回复元素
    const initialTaskContent = initialLastTask ? (initialLastTask.innerText || initialLastTask.textContent || '') : ''; // 记录初始内容
    
    console.log(`⏳ 已启动超时保底计时 (${timeoutMs/1000}秒)...`);

    setTimeout(() => {
      // 检查 Ralph 循环状态
      const stillSameStop = firstStopTime === startFirstStop;
      const noNewAction = lastActionAt === startActionAt;
      const noWorkResume = lastWorkingAt === startWorkingAt;
      const isWorkingNow = isAIWorking();

      if (isTaskCompleteBanner() && !isWorkingNow) {
        const sent = sendContinueOrClickExisting();
        if (sent) {
          console.log('✅ 检测到任务完成标记，优先发送“继续”以恢复流程');
        }
        return;
      }
      
      // 如果 3 分钟内没有被中断（用户操作、AI恢复工作等）
      if (!isWorkingNow && stillSameStop && noNewAction && noWorkResume) {
        console.log('⏳ 保底计时结束，开始重新检测状态...');

        // 1. 检测是否有新的回复产生
        const currentLastTask = getLastAssistantReplyElement();
        if (currentLastTask !== initialLastTask) {
             console.log('⚠️ 检测到已有新的回复产生，取消跳过操作');
             return;
        }

        // 2. 检测内容是否仍包含跳过按钮（不再检查文本）
        const hasSkipButton = currentLastTask && (
            currentLastTask.querySelector('.icd-run-command-card-v2 .icd-btn-tertiary') || 
            Array.from(currentLastTask.querySelectorAll('button')).some(b => (b.textContent || '').trim() === '跳过')
        );
        
        if (!hasSkipButton) {
             console.log('⚠️ 最后一条回复不再包含跳过按钮，取消跳过操作');
             return;
        }

        console.log('⏳ 状态确认：仍然卡在同一条回复且包含跳过按钮，尝试点击...');
        const clicked = clickSkipButton();
        if (clicked) {
          console.log('✅ 保底跳过点击成功');
        } else {
          console.log('⚠️ 保底跳过点击失败');
        }
      } else {
        console.log('ℹ️ 3分钟内已恢复/有新操作，跳过保底不会执行。状态详情:', {
            isWorkingNow,
            stillSameStop,
            noNewAction,
            noWorkResume,
            diffs: {
                firstStopTime: [startFirstStop, firstStopTime],
                lastActionAt: [startActionAt, lastActionAt],
                lastWorkingAt: [startWorkingAt, lastWorkingAt]
            }
        });
      }
    }, timeoutMs);
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
  
  function sendContinueOrClickExisting() {
    // 0. 检查发送按钮是否处于停止状态 (表示 AI 正在工作)
    const sendButton = findSendButton();
    if (sendButton && sendButton.querySelector('.codicon-stop-circle')) {
        console.log('⚠️ 检测到停止按钮 (AI 工作中)，拦截"继续"发送');
        return false;
    }

    // 防止重复发送"继续"
    const lastTurn = getLastChatTurnElement();
    if (lastTurn && lastTurn.classList.contains('user')) {
        const text = (lastTurn.textContent || '').trim();
        if (text === '继续') {
            console.log('⏳ 最后一条消息已是“继续”，跳过重复发送');
            return false;
        }
    }

    const input = findChatInput();
    const button = findSendButton();
    const hasText = getInputTextValue(input).length > 0;
    
    if (button && isSendButtonEnabled(button) && hasText) {
      button.click();
      console.log('✓ 检测到已有输入，直接点击发送');
      lastActionAt = Date.now();
      return true;
    }
    
    return sendMessage('继续');
  }
  
  // ============================================
  // 场景检测
  // ============================================
  
  class ScenarioDetector {
    constructor() {
      this.lastMessages = [];
      this.maxHistory = 10;
      this.lastTriggeredAt = {};
      this.lastGroupTriggeredAt = {};
    }
    
    recordMessage(message) {
      this.lastMessages.push({
        text: message,
        timestamp: Date.now()
      });
      if (this.lastMessages.length > this.maxHistory) {
        this.lastMessages.shift();
      }
    }

    markTriggered(scenarioId) {
        this.lastTriggeredAt[scenarioId] = Date.now();
        const scenario = CONFIG.scenarios[scenarioId];
        if (scenario && scenario.group) {
            this.lastGroupTriggeredAt[scenario.group] = Date.now();
        }
    }
    
    detectKeywords(text, keywords) {
      if (!keywords || keywords.length === 0) return false;
      const lowerText = text.toLowerCase();
      return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }
    
    detectPatterns(text, patterns) {
      if (!patterns || patterns.length === 0) return false;
      return patterns.some(pattern => {
        try {
          if (typeof pattern === 'string') {
            return new RegExp(pattern, 'i').test(text);
          }
          return pattern.test(text);
        } catch (e) {
          console.error('正则匹配错误:', e);
          return false;
        }
      });
    }
    
    detect(context) {
      const { lastMessage, chatContent, stoppedDuration } = context;
      
      if (lastMessage) {
        this.recordMessage(lastMessage);
      }
      
      const enabledScenarios = Object.entries(CONFIG.scenarios)
        .filter(([_, s]) => s.enabled);
      
      const matches = [];

      for (const [id, scenario] of enabledScenarios) {
        // 检查组冷却时间
        if (scenario.group) {
            const lastGroupTime = this.lastGroupTriggeredAt[scenario.group] || 0;
            const groupCooldown = scenario.groupCooldown || 30000; // 默认组冷却 30秒
            if (Date.now() - lastGroupTime < groupCooldown) {
                continue;
            }
        }

        // 检查单场景冷却时间
        if (scenario.cooldown) {
            const lastTime = this.lastTriggeredAt[id] || 0;
            const now = Date.now();
            if (now - lastTime < scenario.cooldown) {
                continue;
            }
        }

        let detected = false;
        let matchInfo = null;
        
        // 兼容 detection 对象配置
        const d = scenario.detection || scenario;

        // 历史状态检测 (新增)
        if (scenario.requiresActiveHistory && !hasEverWorked) {
          continue;
        }
        
            // 1. 文本检查 (TextCheck) - 高精度
        if (d.textCheck) {
            const { selector, text, pattern, lastTurnOnly } = d.textCheck;
            const useScope = lastTurnOnly !== false;
            let elements = [];
            if (useScope) {
                const scope = getLastAssistantReplyElement() || getLastAssistantTurnElement();
                if (scope) {
                    elements = Array.from(scope.querySelectorAll(selector));
                }
                if (elements.length === 0) {
                    const turn = getLastAssistantTurnElement();
                    if (turn) {
                        elements = Array.from(turn.querySelectorAll(selector));
                    }
                }
            } else {
                elements = Array.from(document.querySelectorAll(selector));
            }

            for (let i = elements.length - 1; i >= 0; i--) {
                const el = elements[i];
                const content = el.textContent || '';
                let isMatch = false;
                
                if (text && content.includes(text)) {
                    isMatch = true;
                } else if (pattern) {
                    try {
                        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                        if (regex.test(content)) {
                            isMatch = true;
                        }
                    } catch(e) { console.error('正则匹配错误:', e); }
                }
                
                if (isMatch) {
                    detected = true;
                    matchInfo = { type: 'textCheck', scenario: id, element: el };
                    break;
                }
            }
        }

        // 2. 选择器检测
        if (!detected && d.selectors && d.selectors.length > 0) {
            // 强制限制在最新的回复中查找
            const scope = getLastAssistantReplyElement() || getLastAssistantTurnElement();

            if (scope) {
                // 对于数组中的任意一个选择器，只要在 scope 内找到匹配即可
                for (const sel of d.selectors) {
                    const foundEl = scope.querySelector(sel);
                    if (foundEl) {
                        detected = true;
                        matchInfo = { type: 'selector', scenario: id, element: foundEl };
                        break;
                    }
                }
            }
        }
        
        // 3. 关键词检测
        if (!detected && d.keywords) {
          const text = lastMessage || chatContent;
          if (this.detectKeywords(text, d.keywords)) {
            detected = true;
            matchInfo = { type: 'keyword', scenario: id };
          }
        }
        
        // 4. 正则检测
        if (!detected && d.patterns) {
          const text = lastMessage || chatContent;
          if (this.detectPatterns(text, d.patterns)) {
            detected = true;
            matchInfo = { type: 'pattern', scenario: id };
          }
        }
        
        // 时长检测
        if (!detected && scenario.checkDuration) {
          if (stoppedDuration >= (scenario.thinkingTime || 30000)) {
            // 对于 checkDuration 类型的场景，如果配置了 textCheck，需要同时满足文本条件
            if (scenario.detection && scenario.detection.textCheck) {
                const { selector, text, pattern, lastTurnOnly } = scenario.detection.textCheck;
                const useScope = lastTurnOnly !== false;
                let scope = null;
                if (useScope) {
                    scope = getLastAssistantReplyElement();
                    if (!scope) scope = getLastAssistantTurnElement();
                }
                const elements = scope ? Array.from(scope.querySelectorAll(selector)) : Array.from(document.querySelectorAll(selector));
                
                let textMatch = false;
                for (const el of elements) {
                    const content = el.textContent || '';
                    if (text && content.includes(text)) {
                        textMatch = true;
                        break;
                    } else if (pattern) {
                        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                        if (regex.test(content)) {
                            textMatch = true;
                            break;
                        }
                    }
                }
                
                if (textMatch) {
                    detected = true;
                    matchInfo = { type: 'duration', scenario: id };
                }
            } else {
                // 没有额外的文本检查条件，直接基于时间触发
                detected = true;
                matchInfo = { type: 'duration', scenario: id };
            }
          }
        }
        
        // 未完成检测
        if (detected && scenario.checkIncomplete) {
          const hasIncomplete = scenario.incompleteIndicators.some(ind =>
            chatContent.includes(ind)
          );
          if (!hasIncomplete) {
            detected = false;
          }
        }
        
        if (detected) {
          matches.push({
            detected: true,
            scenario: id,
            scenarioConfig: scenario,
            matchInfo,
            priority: scenario.priority
          });
        }
      } // end for

      if (matches.length > 0) {
          // 按优先级降序排序
          matches.sort((a, b) => b.priority - a.priority);
          
          if (matches.length > 1) {
              console.log(`🔎 检测到 ${matches.length} 个候选场景:`);
              matches.forEach(m => console.log(`   - ${m.scenarioConfig.name} (P:${m.priority})`));
              console.log(`👉 选择优先级最高的: ${matches[0].scenarioConfig.name}`);
          }
          
          return matches[0];
      }
      
      return { detected: false };
    }
    
    getResponse(scenarioId, context) {
      const scenario = CONFIG.scenarios[scenarioId];
      if (!scenario) return '继续';
      
      if (scenario.action === 'custom' && scenario.responses) {
        return scenario.responses.default || '继续';
      }
      
      return scenario.message || '继续';
    }
  }
  
  // ============================================
  // 主循环
  // ============================================
  
  let checkCount = 0;
  let stableCount = 0;
  let wasWorking = false;
  let hasEverWorked = false; // 新增：记录是否进行过任务
  let testInterval = null;
  let firstStopTime = null;
  let sentDuringStop = false; // 新增：停止期间仅发送一次
  let processedScenarioDuringStop = false;
  let stopHandled = false;
  let lastActionAt = 0;
  let lastWorkingAt = 0;
  let lastHandledTaskCount = 0; // 改用 task 数量来追踪进度
  let lastObservedTaskCount = 0;
  
  const detector = new ScenarioDetector();
  
  function startLoop() {
    if (testInterval) {
      console.log('ℹ️ Ralph 循环已在运行');
      return;
    }
    console.log('🚀 开始监控...');
    console.log('');
    console.log('📋 已启用场景：');
    if (window.$ralphToggleBtn) {
      try {
        window.$ralphToggleBtn.textContent = '停止 Ralph 工作流';
        window.$ralphToggleBtn.setAttribute('data-state', 'running');
      } catch(e) {}
    }
    Object.entries(CONFIG.scenarios)
      .filter(([_, s]) => s.enabled)
      .forEach(([id, s]) => {
        console.log(`  - ${s.name} (优先级: ${s.priority})`);
      });
    console.log('');
    
    testInterval = setInterval(() => {
      checkCount++;
      
      console.log(`\n[检查 ${checkCount}] ${new Date().toLocaleTimeString()}`);
      
      // 0. 全局冷却检查
      const now = Date.now();
      const globalCooldown = 60000; // 1分钟
      const confirmPopover = document.querySelector('.confirm-popover-body');
      const lastReplyForDelete = getLastAssistantReplyElement();
      const deleteCardPending = lastReplyForDelete && lastReplyForDelete.querySelector('.icd-delete-files-command-card-v2-content.need-confirm');
      const bypassCooldown = !!confirmPopover || !!deleteCardPending;
      if (lastActionAt > 0 && now - lastActionAt < globalCooldown) {
          if (!bypassCooldown) {
              console.log(`⏳ 全局冷却中 (${Math.ceil((globalCooldown - (now - lastActionAt))/1000)}s)...`);
              console.log(`Ralph 状态: 🔄 工作中 (冷却中)`);
              console.log(`Trae 状态: ${getTraeWorkflowStatus()}`);
              return;
          } else {
              console.log('⏳ 冷却绕过: 检测到确认弹窗或待确认删除，允许继续检测以衔接二次确认');
          }
      }

      const working = isAIWorking();
      // 重要：如果 working 为 false，但 lastHandledReplyElement 已经是当前回复，
      // 且没有特殊情况（如删除确认），则不应该再打印 "Ralph 状态: 🔄 工作中"
      // 这里的 log 是误导性的，因为它只反映 testInterval 是否存在，而不是 AI 的实际状态
      // 修正 log 输出：
      const statusIcon = working ? '🔄 工作中' : (testInterval ? '⏸️ 监控中(已停止)' : '⏹️ 已停止');
      console.log(`Ralph 状态: ${statusIcon}`);
      console.log(`Trae 状态: ${getTraeWorkflowStatus()}`);
      
      const currentTaskCount = document.getElementsByClassName('ai-agent-task').length;
      const blocking = isBlockingError(); // Move blocking check here to be available for logic

      if (working) {
        stableCount = 0;
        firstStopTime = null;
        wasWorking = true;
        hasEverWorked = true; // 标记已开始工作
        sentDuringStop = false; // 恢复工作后重置发送标记
        processedScenarioDuringStop = false;
        stopHandled = false;
        lastWorkingAt = Date.now();
        lastObservedTaskCount = currentTaskCount;
      } else {
        // 如果任务数量发生变化，说明有新消息，重置计数
        if (currentTaskCount !== lastObservedTaskCount) {
          lastObservedTaskCount = currentTaskCount;
          stableCount = 0;
          firstStopTime = null;
          sentDuringStop = false;
          processedScenarioDuringStop = false;
          stopHandled = false;
        }
        
        // 检查是否已经处理过当前数量的任务
        if (lastHandledTaskCount === currentTaskCount) {
          // 特殊情况：如果最后一条回复包含未处理的删除卡片或确认弹窗，则强制重新处理
          const lastReplyEl = getLastAssistantReplyElement();
          const hasDeleteCard = lastReplyEl && lastReplyEl.querySelector('.icd-delete-files-command-card-v2-content.need-confirm');
          const hasConfirmPopover = document.querySelector('.confirm-popover-body'); // 弹窗是全局的
          const isTaskCompleted = getTraeWorkflowStatus() === '任务完成'; // 任务完成状态也视为特殊情况，需要重新检测
          
          if (hasDeleteCard || hasConfirmPopover || isTaskCompleted) {
            // 如果已经处理过场景，且不需要重复处理
            // 注意：isTaskCompleted 场景（任务完成检查）已经标记为 isConfirm: true，
            // 所以即使 processedScenarioDuringStop 为 true，只要冷却时间到了，它依然可以触发。
            // 因此，这里不需要为 isTaskCompleted 阻止重置。
            // 只有当有删除卡片或确认弹窗，且已经处理过时，才可能需要避免重复重置（视具体情况而定）
            // 但目前的逻辑是：如果有这些未处理的 UI 元素，我们希望保持检测。
            
            // 原逻辑保留：避免在删除卡片/弹窗未消失前反复重置
            if (processedScenarioDuringStop && !isTaskCompleted && (hasDeleteCard || hasConfirmPopover)) {
                // Do nothing? No, we probably want to return to avoid reset if we just acted on it
                // But if we acted, the card usually changes state.
            }
            
            // 简化逻辑：对于 isTaskCompleted，我们总是允许重置，
            // 这样 stopHandled 会变为 false，进而进入 detector.detect()
            // detector 会根据 cooldown 决定是否再次触发。
            
            // 重置 handled 标记，允许后续逻辑执行
            lastHandledTaskCount = 0; // 强制重置
            stopHandled = false;
          } else {
            return;
          }
        }
        
        if (!firstStopTime) {
          firstStopTime = Date.now();
        }
        
        if (stopHandled) {
          return;
        }
        
        // 如果是阻断性错误，直接视为已稳定停止，跳过等待
        if (blocking) {
            console.log('⚡ 检测到阻断错误，立即拉满稳定计数...');
            stableCount = CONFIG.stableCount + 1;
        } else {
            stableCount++;
        }

        const stoppedDuration = Date.now() - firstStopTime;
        console.log(`稳定计数: ${stableCount}/${CONFIG.stableCount}`);
        console.log(`停止时长: ${Math.floor(stoppedDuration / 1000)}秒`);
        
        if (stableCount >= CONFIG.stableCount) {
          if (stopHandled) {
            return;
          }
          stopHandled = true;
          lastHandledTaskCount = currentTaskCount; // 更新已处理的任务计数
          console.log('');
          console.log('✅ 检测到 AI 已停止');
          
          // 允许处理场景的条件：
          // 1. 还没处理过场景 (!processedScenarioDuringStop)
          // 2. 或者已经处理过，但现在可能需要处理二次确认 (processedScenarioDuringStop is true)
          // 注意：具体的过滤逻辑在检测到场景后进行判断
          if (true) {
            // 如果最后一条消息是用户的，说明 AI 还没回复，不应触发基于历史回复的场景
            const lastTurn = getLastChatTurnElement();
            if (lastTurn && lastTurn.classList.contains('user')) {
                console.log('⏳ 最后一条消息是用户发送的，等待 AI 响应...');
                return;
            }

            const lastMessage = getLastMessage();
            const chatContent = getChatContent();
            
            const result = detector.detect({
              lastMessage,
              chatContent,
              stoppedDuration
            });
            
            if (result.detected) {
              const scenario = result.scenarioConfig;
              
              // 如果已经处理过场景，且当前检测到的场景不是“确认”类场景，则跳过
              const isConfirmScenario = scenario.isConfirm || 
                                      (scenario.id || '').includes('Confirm') || 
                                      (scenario.name || '').includes('Confirm') ||
                                      (scenario.name || '').includes('确认');

              if (processedScenarioDuringStop && !isConfirmScenario) {
                  console.log(`⏳ 本次停止期间已处理过场景，且当前场景 ${scenario.name} 不是确认类操作，跳过`);
                  return;
              }

              // 兼容 response 对象配置
              const responseConfig = scenario.response || {};
              const action = scenario.action || responseConfig.action;
              const targetSelector = scenario.target || responseConfig.target;
              const matchText = scenario.matchText || responseConfig.matchText; // 新增：支持文本匹配
              const waitTime = scenario.waitTime || responseConfig.waitTime;

              // 标记场景触发时间，用于冷却计算
              detector.markTriggered(result.scenario);

              console.log(`🎯 检测到场景: ${scenario.name}`);
              console.log(`   匹配类型: ${result.matchInfo.type}`);
              
              if (action === 'wait') {
                const waitSec = Math.floor(waitTime / 1000);
                console.log(`⏳ 等待 ${waitSec} 秒后继续...`);
                setTimeout(() => {
                  const message = detector.getResponse(result.scenario, { lastMessage });
                  if (!sentDuringStop) {
                    sendMessage(message);
                    lastActionAt = Date.now(); // 更新全局操作时间
                    sentDuringStop = true;
                    console.log(`✅ 已发送: "${message}" (停止期间仅发送一次)`);
                  } else {
                    console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
                  }
                }, waitTime);
              } else if (action === 'log') {
                const message = detector.getResponse(result.scenario, { lastMessage });
                console.log(message);
              } else if (action === 'click') {
                if (targetSelector) {
                  console.log(`🖱️ 尝试点击元素: ${targetSelector}${matchText ? ` (文本匹配: "${matchText}")` : ''}`);
                  
                  let targetEl = null;
                  
                  // 辅助函数：检查元素文本是否匹配
                  const checkTextMatch = (el) => {
                      if (!matchText) return true;
                      const content = (el.textContent || '').trim();
                      return content === matchText || content.includes(matchText);
                  };

                  if (result.matchInfo && result.matchInfo.element) {
                      try {
                          let current = result.matchInfo.element;
                          let depth = 0;
                          const maxDepth = 8;
                          
                          while (current && depth < maxDepth) {
                              // 如果当前元素直接匹配且文本符合
                              if (current.matches && current.matches(targetSelector) && checkTextMatch(current)) {
                                  targetEl = current;
                                  break;
                              }
                              
                              // 在子元素中查找
                              const candidates = Array.from(current.querySelectorAll(targetSelector));
                              const found = candidates.find(el => checkTextMatch(el));
                              
                              if (found) {
                                  targetEl = found;
                                  break;
                              }
                              
                              current = current.parentElement;
                              depth++;
                          }
                      } catch(e) { console.error('相对查找失败:', e); }
                  }
  
                  if (!targetEl) {
                      const candidates = Array.from(document.querySelectorAll(targetSelector));
                      targetEl = candidates.find(el => checkTextMatch(el));
                  }
  
                  if (targetEl) {
                    targetEl.click();
                    lastActionAt = Date.now(); // 更新全局操作时间
                    console.log('✅ 点击成功');
                  } else {
                    console.error(`❌ 无法点击: 未找到目标元素 ${targetSelector}`);
                  }
                } else {
                  console.error('❌ 点击操作未配置 target');
                }
              } else if (action === 'custom') {
                if (scenario.handler === 'skipAfterTimeout') {
                  console.log('⏳ 检测到可跳过的终端命令，启动3分钟保底跳过');
                  scheduleSkipFallback(180000);
                  processedScenarioDuringStop = true;
                } else {
                  const message = detector.getResponse(result.scenario, { lastMessage });
                  console.log(`💡 准备发送: "${message}"`);
                  if (!sentDuringStop) {
                    const sent = sendTerminalInput(message) || sendMessage(message);
                    if (sent) {
                      lastActionAt = Date.now(); // 更新全局操作时间
                      sentDuringStop = true;
                      console.log('✅ 消息已发送 (停止期间仅发送一次)');
                    }
                  } else {
                    console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
                  }
                }
              } else {
                const message = detector.getResponse(result.scenario, { lastMessage });
                console.log(`💡 准备发送: "${message}"`);
                if (!sentDuringStop) {
                  const sent = message === '继续' ? sendContinueOrClickExisting() : sendMessage(message);
                  if (sent) {
                    lastActionAt = Date.now(); // 更新全局操作时间
                    sentDuringStop = true;
                    console.log('✅ 消息已发送 (停止期间仅发送一次)');
                  }
                } else {
                  console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
                }
              }
            } else {
              console.log('💡 未匹配特定场景，发送默认"继续"');
              if (!sentDuringStop) {
                const sent = sendContinueOrClickExisting();
                if (sent) {
                  lastActionAt = Date.now(); // 更新全局操作时间
                  sentDuringStop = true;
                  console.log('✅ 已发送默认继续 (停止期间仅发送一次)');
                }
              } else {
                console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
              }
            }
            processedScenarioDuringStop = true;
          } else {
            console.log('⏳ 本次停止期间已处理过场景，跳过检测');
            if (!sentDuringStop) {
              const sent = sendContinueOrClickExisting();
              if (sent) {
                lastActionAt = Date.now(); // 更新全局操作时间
                sentDuringStop = true;
                console.log('✅ 已发送默认继续 (停止期间仅发送一次)');
              }
            } else {
              console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
            }
          }
          
          wasWorking = false;
        }
      }
    }, CONFIG.checkInterval);
  }
  
  // ============================================
  // 调试工具
  // ============================================
  
  window.stopLoop = function() {
    if (testInterval) {
      clearInterval(testInterval);
      testInterval = null;
      console.log('⏹️ 循环已停止');
      if (window.$ralphToggleBtn) {
        try {
          window.$ralphToggleBtn.textContent = '开启 Ralph';
          window.$ralphToggleBtn.setAttribute('data-state', 'stopped');
        } catch(e) {}
      }
    }
  };
  
  window.startRalphLoop = function() {
    if (!testInterval) {
      startLoop();
      if (window.$ralphToggleBtn) {
        try {
          window.$ralphToggleBtn.textContent = '停止 Ralph';
          window.$ralphToggleBtn.setAttribute('data-state', 'running');
        } catch(e) {}
      }
    } else {
      console.log('ℹ️ Ralph 循环已在运行');
    }
  };
  
  window.toggleRalphLoop = function() {
    if (testInterval) {
      window.stopLoop();
    } else {
      window.startRalphLoop();
    }
  };
  
  function _parseRGB(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3] };
  }
  function _brightness(rgb) {
    if (!rgb) return 255;
    return Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
  }
  function _detectThemeBaseColor() {
    const candidates = [
      document.querySelector('.left-l'),
      document.querySelector('.chat-input-v2-container'),
      document.body,
      document.documentElement
    ].filter(Boolean);
    for (const el of candidates) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return _parseRGB(bg) || { r: 255, g: 255, b: 255 };
      }
    }
    return { r: 255, g: 255, b: 255 };
  }
  function applyThemeStyles(btn) {
    const rgb = _detectThemeBaseColor();
    const bright = _brightness(rgb);
    const isDark = bright < 128;
    const styles = isDark
      ? { bg: '#2b2b2b', fg: '#ffffff', bd: '#666666' }
      : { bg: '#f5f5f5', fg: '#222222', bd: '#cccccc' };
    btn.style.background = styles.bg;
    btn.style.color = styles.fg;
    btn.style.border = `1px solid ${styles.bd}`;
  }
  
  function addToggleButton() {
    try {
      const container = document.querySelector('.left-l');
      if (!container) return;
      if (container.querySelector('.trae-ralph-toggle-button')) {
        window.$ralphToggleBtn = container.querySelector('.trae-ralph-toggle-button');
        return;
      }
      const btn = document.createElement('button');
      btn.className = 'trae-ralph-toggle-button';
      btn.type = 'button';
      btn.style.marginLeft = '8px';
      btn.style.padding = '4px 8px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.setAttribute('data-state', testInterval ? 'running' : 'stopped');
      btn.textContent = testInterval ? '停止 Ralph' : '开启 Ralph';
      applyThemeStyles(btn);
      btn.addEventListener('click', () => window.toggleRalphLoop());
      container.appendChild(btn);
      window.$ralphToggleBtn = btn;
      
      // 主题变化监听（简单轮询）
      let lastThemeKey = '';
      setInterval(() => {
        const rgb = _detectThemeBaseColor();
        const key = `${rgb.r},${rgb.g},${rgb.b}`;
        if (key !== lastThemeKey) {
          lastThemeKey = key;
          applyThemeStyles(btn);
        }
      }, 2000);
    } catch(e) {}
  }
  
  window.testScenario = function(scenarioId) {
    const scenario = CONFIG.scenarios[scenarioId];
    if (!scenario) {
      console.error('❌ 场景不存在:', scenarioId);
      console.log('可用场景:', Object.keys(CONFIG.scenarios));
      return;
    }
    
    console.log('🧪 测试场景:', scenario.name);
    console.log('关键词:', scenario.keywords);
    console.log('动作:', scenario.action);
    console.log('消息:', scenario.message);
    
    const message = detector.getResponse(scenarioId, {});
    console.log('将发送:', message);
    
    return sendMessage(message);
  };
  
  window.listScenarios = function() {
    console.log('📋 所有场景：');
    Object.entries(CONFIG.scenarios).forEach(([id, s]) => {
      console.log(`\n${s.name} (${id})`);
      console.log(`  启用: ${s.enabled ? '✅' : '❌'}`);
      console.log(`  优先级: ${s.priority}`);
      console.log(`  关键词: ${s.keywords?.join(', ') || '无'}`);
      console.log(`  动作: ${s.action}`);
    });
  };
  
  window.toggleScenario = function(scenarioId, enabled) {
    if (CONFIG.scenarios[scenarioId]) {
      CONFIG.scenarios[scenarioId].enabled = enabled;
      console.log(`✅ 场景 ${scenarioId} 已${enabled ? '启用' : '禁用'}`);
    }
  };
  
  window.checkAIStatus = function() {
    const working = isAIWorking();
    console.log(`Ralph 状态: ${testInterval ? '🔄 工作中' : '⏸️ 已停止'}`);
    console.log(`Trae 状态: ${getTraeWorkflowStatus()}`);
    console.log('最后消息:', getLastMessage());
    return working;
  };
  
  window.testDetection = function() {
    console.log('🧪 测试检测系统...');
    const lastMessage = getLastMessage();
    const chatContent = getChatContent();
    
    console.log('最后消息:', lastMessage);
    
    const result = detector.detect({
      lastMessage,
      chatContent,
      stoppedDuration: 0
    });
    
    if (result.detected) {
      console.log('✅ 检测到场景:', result.scenarioConfig.name);
      console.log('匹配信息:', result.matchInfo);
    } else {
      console.log('❌ 未检测到场景');
    }
    
    return result;
  };
  
  // ============================================
  // 启动
  // ============================================
  
  console.log('📖 可用命令：');
  console.log('  stopLoop()              - 停止循环');
  console.log('  listScenarios()         - 列出所有场景');
  console.log('  testScenario(id)        - 测试特定场景');
  console.log('  toggleScenario(id, on)  - 启用/禁用场景');
  console.log('  checkAIStatus()         - 检查 Ralph 状态');
  console.log('  testDetection()         - 测试检测系统');
  console.log('');
  
  addToggleButton();
  const _toggleMountTimer = setInterval(() => {
    if (document.querySelector('.left-l')) {
      addToggleButton();
      clearInterval(_toggleMountTimer);
    }
  }, 1000);
  
  console.log('⏸️ Ralph 工作流默认停止，点击按钮后开启');
})();
