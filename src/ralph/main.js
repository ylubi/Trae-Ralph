// ============================================
// Trae Ralph Loop - 主逻辑
// ============================================

const { CONFIG } = require('./config');
const { 
    isAIWorking, 
    isBlockingError 
} = require('./status');
const { 
    getLastChatTurnElement, 
    getLastMessage, 
    getChatContent, 
    getLastAssistantReplyElement, 
    getTraeWorkflowStatus 
} = require('./dom');
const { 
    sendMessage, 
    sendTerminalInput, 
    clickSkipButton 
} = require('./actions');
const { ScenarioDetector } = require('./detector');

// 全局状态变量
let checkCount = 0;
let stableCount = 0;
let wasWorking = false;
let hasEverWorked = false; // 记录是否进行过任务
let testInterval = null;
let firstStopTime = null;
let sentDuringStop = false; // 停止期间仅发送一次
let processedScenarioDuringStop = false;
let stopHandled = false;
let lastActionAt = 0;
let lastWorkingAt = 0;
let lastHandledTaskCount = 0; // 改用 task 数量来追踪进度
let lastObservedTaskCount = 0;

const detector = new ScenarioDetector();

// 辅助函数：调度保底跳过
function scheduleSkipFallback(timeoutMs = 180000) {
    const startFirstStop = firstStopTime;
    const startActionAt = lastActionAt;
    const startWorkingAt = lastWorkingAt;
    const initialLastTask = getLastAssistantReplyElement(); // 记录初始的最后一条回复元素
    
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
        console.log('ℹ️ 3分钟内已恢复/有新操作，跳过保底不会执行。');
      }
    }, timeoutMs);
}

function isTaskCompleteBanner() {
    const el = document.querySelector('.latest-assistant-bar .status .status-text');
    const text = el ? (el.textContent || '').trim() : '';
    return text === '任务完成';
}

function sendContinueOrClickExisting() {
    // 0. 检查发送按钮是否处于停止状态 (表示 AI 正在工作)
    // 注意：这里需要通过 DOM 查找，因为 dom.js 中的 isSendButtonEnabled 和 findSendButton 是局部的
    // 但我们可以直接调用 actions.js 中的 sendMessage，它内部有检查
    return sendMessage('继续');
}

// 主循环逻辑
function runLoopIteration() {
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
            return;
        } else {
            console.log('⏳ 冷却绕过: 检测到确认弹窗或待确认删除，允许继续检测以衔接二次确认');
        }
    }

    const working = isAIWorking();
    const statusIcon = working ? '🔄 工作中' : (testInterval ? '⏸️ 监控中(已停止)' : '⏹️ 已停止');
    console.log(`Ralph 状态: ${statusIcon}`);
    
    const currentTaskCount = document.getElementsByClassName('ai-agent-task').length;
    const blocking = isBlockingError();

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
        const isTaskCompleted = isTaskCompleteBanner(); // 任务完成状态也视为特殊情况，需要重新检测
        
        if (hasDeleteCard || hasConfirmPopover || isTaskCompleted) {
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
            stoppedDuration,
            hasEverWorked
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
}

function startLoop() {
    if (testInterval) {
      console.log('ℹ️ Ralph 循环已在运行');
      return;
    }
    console.log('🚀 开始监控...');
    console.log('');
    console.log('📋 已启用场景：');
    
    // 更新按钮状态
    if (window.$ralphToggleBtn) {
      try {
        window.$ralphToggleBtn.textContent = '停止 Ralph';
        window.$ralphToggleBtn.setAttribute('data-state', 'running');
      } catch(e) {}
    }
    
    Object.entries(CONFIG.scenarios)
      .filter(([_, s]) => s.enabled)
      .forEach(([id, s]) => {
        console.log(`  - ${s.name} (优先级: ${s.priority})`);
      });
    console.log('');
    
    testInterval = setInterval(runLoopIteration, CONFIG.checkInterval);
    // 保存到 window 以便外部访问
    window._ralphLoopInterval = testInterval;
}

function stopLoop() {
    if (testInterval) {
      clearInterval(testInterval);
      testInterval = null;
      window._ralphLoopInterval = null;
      console.log('⏹️ 循环已停止');
      if (window.$ralphToggleBtn) {
        try {
          window.$ralphToggleBtn.textContent = '开启 Ralph';
          window.$ralphToggleBtn.setAttribute('data-state', 'stopped');
        } catch(e) {}
      }
    }
}

function toggleLoop() {
    if (testInterval) {
      stopLoop();
    } else {
      startLoop();
    }
}

// 暴露给 debug 模块
window.startRalphLoop = startLoop;
window.stopLoop = stopLoop;
window.toggleRalphLoop = toggleLoop;

module.exports = {
    startLoop,
    stopLoop,
    toggleLoop,
    detector
};
