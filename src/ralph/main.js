/**
 * @file main.js
 * @description 主循环逻辑模块
 * 
 * 该模块是 Ralph Loop 的心脏，负责调度整个自动化流程：
 * - 维护主循环 (setInterval)
 * - 管理全局状态 (工作/停止、冷却、稳定计数)
 * - 协调状态检测 (status.js) 和场景响应 (detector.js)
 * - 执行决策逻辑 (是否介入、何时介入、如何介入)
 * - 处理异常保底逻辑 (超时跳过)
 * 
 * 主要导出函数：
 * - startLoop: 启动循环
 * - stopLoop: 停止循环
 * - toggleLoop: 切换状态
 * - runLoopIteration: 执行单次迭代
 */

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
    clickSkipButton,
    clickStopButton,
    resetContextAndContinue
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
let lastHandledTaskCount = -1; // 改用 task 数量来追踪进度，初始为 -1 以确保空对话(0)也能触发一次检测
let lastObservedTaskCount = 0;

// 新增监控变量
let lastTotalReplyCount = 0;
let lastReplyCountChangeTime = Date.now();
const STALLED_CHECK_INTERVAL = 6 * 60 * 1000; // 6分钟

let skipFallbackTimeout = null;

const detector = new ScenarioDetector();

/**
 * 重置 Ralph 信息（用于新开对话时）
 */
function resetRalphInfo() {
    console.log('🔄 检测到新对话或上下文重置，重置 Ralph 状态信息...');
    
    // 重置核心循环状态
    checkCount = 0;
    stableCount = 0;
    wasWorking = false;
    hasEverWorked = false;
    firstStopTime = null;
    sentDuringStop = false;
    processedScenarioDuringStop = false;
    stopHandled = false;
    lastActionAt = 0;
    lastWorkingAt = 0;
    lastHandledTaskCount = -1;
    lastObservedTaskCount = 0;
    
    // 重置监控状态
    lastTotalReplyCount = 0;
    lastReplyCountChangeTime = Date.now();
    
    // 清除可能存在的定时器
    if (skipFallbackTimeout) {
        clearTimeout(skipFallbackTimeout);
        skipFallbackTimeout = null;
    }
}

/**
 * 监控回复总数变化，处理长时间卡死情况
 * @param {number} currentTotalReplyCount 当前回复总数
 */
function monitorStalledState(currentTotalReplyCount) {
    // 1. 检测新对话：如果回复数大幅减少（且接近0），视为新对话
    if (currentTotalReplyCount < lastTotalReplyCount && currentTotalReplyCount <= 1) {
        resetRalphInfo();
        lastTotalReplyCount = currentTotalReplyCount;
        return;
    }

    // 2. 检测变化
    if (currentTotalReplyCount !== lastTotalReplyCount) {
        lastTotalReplyCount = currentTotalReplyCount;
        lastReplyCountChangeTime = Date.now();
        return;
    }

    // 3. 检测超时（仅当有回复且不为0时，防止在空闲初始状态误触发）
    if (currentTotalReplyCount > 0) {
        const idleTime = Date.now() - lastReplyCountChangeTime;
        if (idleTime > STALLED_CHECK_INTERVAL) {
            console.log(`⚠️ 检测到回复总数 (${currentTotalReplyCount}) 长时间 (${Math.floor(idleTime/60000)}分钟) 未变化，触发保底措施...`);
            
            // 尝试点击停止按钮
            const stopped = clickStopButton();
            if (stopped) {
                console.log('✅ 已触发停止按钮');
            } else {
                console.log('ℹ️ 未找到停止按钮或已停止');
            }

            // 发送继续指令
            // 稍作延迟以确保停止操作生效（如果是异步的）
            setTimeout(() => {
                console.log('🔄 发送保底继续指令...');
                sendMessage(CONFIG.messages.stalled);
                // 重置时间戳，防止立即重复触发
                lastReplyCountChangeTime = Date.now();
            }, 1000);
        }
    }
}

/**
 * 辅助函数：调度保底跳过
 * @param {number} timeoutMs 超时时间(毫秒)，默认 180000 (3分钟)
 */
function scheduleSkipFallback(timeoutMs = 180000) {
    const startFirstStop = firstStopTime;
    const startActionAt = lastActionAt;
    const startWorkingAt = lastWorkingAt;
    const initialLastTask = getLastAssistantReplyElement(); // 记录初始的最后一条回复元素
    
    // 清除已存在的定时器
    if (skipFallbackTimeout) {
        clearTimeout(skipFallbackTimeout);
    }

    console.log(`⏳ 已启动超时保底计时 (${timeoutMs/1000}秒)...`);

    skipFallbackTimeout = setTimeout(() => {
      skipFallbackTimeout = null; // 执行后清空引用
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
        } else if (scenario.handler === 'resetContext') {
        resetContextAndContinue();
        // 如果是上下文重置，应该也重置 Ralph 信息
        resetRalphInfo();
        processedScenarioDuringStop = true;
    } else {
          console.log('⚠️ 保底跳过点击失败');
        }
      } else {
        console.log('ℹ️ 3分钟内已恢复/有新操作，跳过保底不会执行。');
      }
    }, timeoutMs);
}

/**
 * 检查是否存在"任务完成"横幅
 * @returns {boolean} 是否存在
 */
function isTaskCompleteBanner() {
    const els = document.querySelectorAll('.latest-assistant-bar .status .status-text');
    if (els.length === 0) return false;
    const el = els[els.length - 1];
    const text = el ? (el.textContent || '').trim() : '';
    return text === '任务完成';
}

/**
 * 发送"继续"或点击现有继续按钮
 * @returns {boolean} 是否成功
 */
function sendContinueOrClickExisting() {
    // 0. 检查发送按钮是否处于停止状态 (表示 AI 正在工作)
    // 注意：这里需要通过 DOM 查找，因为 dom.js 中的 isSendButtonEnabled 和 findSendButton 是局部的
    // 但我们可以直接调用 actions.js 中的 sendMessage，它内部有检查
    return sendMessage(CONFIG.messages.continue);
}

// ============================================
// 循环逻辑拆分 - 辅助函数
// ============================================

/**
 * 检查全局冷却状态
 * @returns {boolean} 如果处于冷却中返回 true
 */
function isGlobalCooldownActive() {
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
            return true;
        } else {
            console.log('⏳ 冷却绕过: 检测到确认弹窗或待确认删除，允许继续检测以衔接二次确认');
        }
    }
    return false;
}

/**
 * 更新并打印状态图标
 * @param {boolean} working AI是否正在工作
 */
function logStatus(working) {
    const statusIcon = working ? '🔄 工作中' : (testInterval ? '⏸️ 监控中(已停止)' : '⏹️ 已停止');
    console.log(`Ralph 状态: ${statusIcon}`);
}

/**
 * 处理 AI 正在工作时的状态重置
 * @param {number} currentTaskCount 当前任务数量
 */
function handleWorkingState(currentTaskCount) {
    stableCount = 0;
    firstStopTime = null;
    wasWorking = true;
    hasEverWorked = true; // 标记已开始工作
    sentDuringStop = false; // 恢复工作后重置发送标记
    processedScenarioDuringStop = false;
    stopHandled = false;
    lastWorkingAt = Date.now();
    lastObservedTaskCount = currentTaskCount;
}

/**
 * 检查是否需要强制重新处理任务（例如删除确认、弹窗、任务完成）
 * @returns {boolean} 是否需要强制重置
 */
function shouldForceRecheck() {
    const lastReplyEl = getLastAssistantReplyElement();
    const hasDeleteCard = lastReplyEl && lastReplyEl.querySelector('.icd-delete-files-command-card-v2-content.need-confirm');
    const hasConfirmPopover = document.querySelector('.confirm-popover-body'); // 弹窗是全局的
    const isTaskCompleted = isTaskCompleteBanner(); // 任务完成状态也视为特殊情况，需要重新检测
    
    return hasDeleteCard || hasConfirmPopover || isTaskCompleted;
}

/**
 * 处理 AI 停止时的逻辑
 * @param {number} currentTaskCount 当前任务数量
 * @param {boolean} blocking 是否有阻断性错误
 */
function processStoppedState(currentTaskCount, blocking) {
    // 1. 如果任务数量发生变化，重置计数
    if (currentTaskCount !== lastObservedTaskCount) {
        lastObservedTaskCount = currentTaskCount;
        stableCount = 0;
        firstStopTime = null;
        sentDuringStop = false;
        processedScenarioDuringStop = false;
        stopHandled = false;
    }
    
    // 2. 检查是否已经处理过当前数量的任务
    if (lastHandledTaskCount === currentTaskCount) {
        // 如果存在阻断性错误，必须强制重新检测
        if (shouldForceRecheck() || blocking) {
          lastHandledTaskCount = 0; // 强制重置
          stopHandled = false;
        } else {
          return;
        }
    }
    
    // 3. 记录停止时间
    if (!firstStopTime) {
        firstStopTime = Date.now();
    }
    
    if (stopHandled) {
        return;
    }
    
    // 4. 更新稳定计数
    if (blocking) {
        console.log('⚡ 检测到阻断错误，立即拉满稳定计数...');
        stableCount = CONFIG.stableCount + 1;
    } else {
        stableCount++;
    }

    const stoppedDuration = Date.now() - firstStopTime;
    console.log(`稳定计数: ${stableCount}/${CONFIG.stableCount}`);
    console.log(`停止时长: ${Math.floor(stoppedDuration / 1000)}秒`);
    
    // 5. 达到稳定状态，执行场景检测
    if (stableCount >= CONFIG.stableCount) {
        if (stopHandled) {
          return;
        }
        stopHandled = true;
        lastHandledTaskCount = currentTaskCount; // 更新已处理的任务计数
        console.log('');
        console.log('✅ 检测到 AI 已停止');
        
        runScenarioDetection(stoppedDuration);
        
        wasWorking = false;
    }
}

/**
 * 执行场景检测与响应
 * @param {number} stoppedDuration 停止时长
 */
function runScenarioDetection(stoppedDuration) {
    // 1. 检查最后一条消息是否是用户的
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
        handleDetectedScenario(result, lastMessage);
    } else {
        handleNoScenarioMatch();
    }
    
    processedScenarioDuringStop = true;
}

/**
 * 处理已检测到的场景
 * @param {Object} result 检测结果
 * @param {string} lastMessage 最后一条消息
 */
function handleDetectedScenario(result, lastMessage) {
    const scenario = result.scenarioConfig;
    
    // 检查是否在停止期间已处理过非确认类场景
    const isConfirmScenario = scenario.isConfirm || 
                            (scenario.id || '').includes('Confirm') || 
                            (scenario.name || '').includes('Confirm') ||
                            (scenario.name || '').includes('确认');

    if (processedScenarioDuringStop && !isConfirmScenario) {
        console.log(`⏳ 本次停止期间已处理过场景，且当前场景 ${scenario.name} 不是确认类操作，跳过`);
        return;
    }

    const responseConfig = scenario.response || {};
    const action = scenario.action || responseConfig.action;
    const targetSelector = scenario.target || responseConfig.target;
    const matchText = scenario.matchText || responseConfig.matchText;
    const waitTime = scenario.waitTime || responseConfig.waitTime;

    detector.markTriggered(result.scenario);

    console.log(`🎯 检测到场景: ${scenario.name}`);
    console.log(`   匹配类型: ${result.matchInfo.type}`);
    
    if (action === 'wait') {
        executeWaitAction(waitTime, result.scenario, lastMessage);
    } else if (action === 'stop') {
        if (CONFIG.noStopMode) {
            console.log(`🔄 [NoStop模式] 检测到停止信号 (${scenario.name})，但继续运行...`);
            // 为了避免立即再次触发（如果文案没变），可以稍微等待一下，或者依赖 detector 的去重机制
            // 但如果 XML 状态一直存在，去重机制可能已经标记为 triggered。
            // 只要我们不清除 triggered 状态，它应该不会立即重复触发同一个 scenario（取决于 detector 实现）。
            // 不过 detector.markTriggered(result.scenario) 已经在上面调用了。
        } else {
            console.log(`🛑 检测到停止信号 (${scenario.name})，停止 Ralph Loop。`);
            console.log('🎉 Mission Complete!');
            stopLoop();
        }
    } else if (action === 'log') {
        const message = detector.getResponse(result.scenario, { lastMessage });
        console.log(message);
    } else if (action === 'click') {
        executeClickAction(targetSelector, matchText, result.matchInfo);
    } else if (action === 'custom') {
        executeCustomAction(scenario, result.scenario, lastMessage);
    } else {
        // default send
        executeSendAction(detector.getResponse(result.scenario, { lastMessage }));
    }
}

/**
 * 执行等待动作
 * @param {number} waitTime 等待时间(毫秒)
 * @param {string} scenarioId 场景ID
 * @param {string} lastMessage 最后一条消息
 */
function executeWaitAction(waitTime, scenarioId, lastMessage) {
    const waitSec = Math.floor(waitTime / 1000);
    console.log(`⏳ 等待 ${waitSec} 秒后继续...`);
    setTimeout(() => {
        const message = detector.getResponse(scenarioId, { lastMessage });
        if (!sentDuringStop) {
            sendMessage(message);
            lastActionAt = Date.now();
            sentDuringStop = true;
            console.log(`✅ 已发送: "${message}" (停止期间仅发送一次)`);
        } else {
            console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
        }
    }, waitTime);
}

/**
 * 执行点击动作
 * @param {string} targetSelector 目标选择器
 * @param {string} matchText 匹配文本
 * @param {Object} matchInfo 匹配信息
 */
function executeClickAction(targetSelector, matchText, matchInfo) {
    if (targetSelector) {
        console.log(`🖱️ 尝试点击元素: ${targetSelector}${matchText ? ` (文本匹配: "${matchText}")` : ''}`);
        
        let targetEl = null;
        
        const checkTextMatch = (el) => {
            if (!matchText) return true;
            const content = (el.textContent || '').trim();
            return content === matchText || content.includes(matchText);
        };

        if (matchInfo && matchInfo.element) {
            try {
                let current = matchInfo.element;
                let depth = 0;
                const maxDepth = 8;
                
                while (current && depth < maxDepth) {
                    if (current.matches && current.matches(targetSelector) && checkTextMatch(current)) {
                        targetEl = current;
                        break;
                    }
                    
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
            lastActionAt = Date.now();
            console.log('✅ 点击成功');
        } else {
            console.error(`❌ 无法点击: 未找到目标元素 ${targetSelector}`);
        }
    } else {
        console.error('❌ 点击操作未配置 target');
    }
}

/**
 * 执行自定义动作
 * @param {Object} scenario 场景配置
 * @param {string} scenarioId 场景ID
 * @param {string} lastMessage 最后一条消息
 */
function executeCustomAction(scenario, scenarioId, lastMessage) {
    if (scenario.handler === 'skipAfterTimeout') {
        console.log('⏳ 检测到可跳过的终端命令，启动3分钟保底跳过');
        scheduleSkipFallback(180000);
        processedScenarioDuringStop = true;
    } else if (scenario.handler === 'rapidInteractiveInput') {
        executeRapidInteractiveInput(scenario);
        processedScenarioDuringStop = true;
    } else if (scenario.handler === 'resetContext') {
        resetContextAndContinue();
        processedScenarioDuringStop = true;
    } else {
        const message = detector.getResponse(scenarioId, { lastMessage });
        console.log(`💡 准备发送: "${message}"`);
        
        // 允许重复发送的条件：场景配置了 repeatable: true
        const allowRepeat = scenario.repeatable === true;
        
        if (!sentDuringStop || allowRepeat) {
            const sent = sendTerminalInput(message) || sendMessage(message);
            if (sent) {
                lastActionAt = Date.now();
                sentDuringStop = true; // 仍然标记为 true，但 allowRepeat 会绕过检查
                console.log(`✅ 消息已发送 ${allowRepeat ? '(重复模式)' : '(停止期间仅发送一次)'}`);
            }
        } else {
            console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
        }
    }
}

/**
 * 执行发送动作
 * @param {string} message 消息内容
 */
function executeSendAction(message) {
    console.log(`💡 准备发送: "${message}"`);
    if (!sentDuringStop) {
        const sent = message === '继续' ? sendContinueOrClickExisting() : sendMessage(message);
        if (sent) {
            lastActionAt = Date.now();
            sentDuringStop = true;
            console.log('✅ 消息已发送 (停止期间仅发送一次)');
        }
    } else {
        console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
    }
}

/**
 * 处理无场景匹配的情况
 */
function handleNoScenarioMatch() {
    console.log('💡 未匹配特定场景，发送默认"继续"');
    if (!sentDuringStop) {
        const sent = sendContinueOrClickExisting();
        if (sent) {
            lastActionAt = Date.now();
            sentDuringStop = true;
            console.log('✅ 已发送默认继续 (停止期间仅发送一次)');
        }
    } else {
        console.log('⏳ 已在本次停止期间发送过消息，跳过重复发送');
    }
}

/**
 * 运行一次循环迭代
 */
function runLoopIteration() {
    checkCount++;
      
    console.log(`\n[检查 ${checkCount}] ${new Date().toLocaleTimeString()}`);
    
    // 0. 全局冷却检查
    if (isGlobalCooldownActive()) return;

    const working = isAIWorking();
    logStatus(working);
    
    const currentTaskCount = document.getElementsByClassName('ai-agent-task').length;
    const blocking = isBlockingError();

    if (working) {
        handleWorkingState(currentTaskCount);
    } else {
        processStoppedState(currentTaskCount, blocking);
    }

    // 2. 监控回复总数变化（独立于工作状态，作为全局保底）
    const totalReplyCount = document.querySelectorAll('section.chat-turn.assistant').length;
    monitorStalledState(totalReplyCount);
}

/**
 * 启动 Ralph 循环
 */
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

/**
 * 停止 Ralph 循环
 */
function stopLoop() {
    if (testInterval) {
      clearInterval(testInterval);
      testInterval = null;
      window._ralphLoopInterval = null;
      stopRapidInput(); // 同时停止可能存在的快速输入循环
      resetState(); // 重置所有状态
      console.log('⏹️ 循环已停止');
      if (window.$ralphToggleBtn) {
        try {
          window.$ralphToggleBtn.textContent = '开启 Ralph';
          window.$ralphToggleBtn.setAttribute('data-state', 'stopped');
        } catch(e) {}
      }
    }
}

/**
 * 停止快速输入循环
 */
function stopRapidInput() {
    if (window._ralphRapidInputInterval) {
        clearInterval(window._ralphRapidInputInterval);
        window._ralphRapidInputInterval = null;
        console.log('⏹️ 快速交互输入循环已终止');
    }
}

/**
 * 执行快速交互输入（连续回车）
 * @param {Object} scenario 场景配置
 */
function executeRapidInteractiveInput(scenario) {
    console.log('🚀 启动快速交互输入模式 (检测 xterm-helper-textarea)...');
    
    // 防止重复启动
    if (window._ralphRapidInputInterval) {
        clearInterval(window._ralphRapidInputInterval);
    }

    // 标记为已发送，避免主循环重复触发
    sentDuringStop = true;
    lastActionAt = Date.now();

    // 启动保底跳过计时 (复用 terminalLongWaitSkip 的逻辑)
    console.log('⏳ 检测到交互式命令，同时启动3分钟保底跳过');
    scheduleSkipFallback(180000);

    // 使用 TurnElement 而不是 ReplyElement，因为后者可能无法覆盖整个轮次的变化
    const initialTurn = getLastChatTurnElement(); 
    let count = 0;
    let missingInputCount = 0; // 输入框丢失计数
    const maxCount = 60; // 最多尝试 60 次 (约 30 秒)
    
    const checkAndSend = () => {
        // 1. 检查回复是否变化（产生了新回复）
        // 注意：这里检查的是"最后一个轮次"是否发生了变化（即有了新的轮次）
        const currentTurn = getLastChatTurnElement();
        if (currentTurn !== initialTurn) {
             console.log('✅ 检测到新回复产生，停止快速输入');
             stopRapidInput();
             return;
        }

        // 2. 检查输入框是否存在
        const input = document.querySelector('.xterm-helper-textarea');
        if (!input) {
            missingInputCount++;
            if (missingInputCount > 3) { // 允许短暂消失 (3次检查 = 1.5秒)
                console.log('✅ 交互输入框已消失超过1.5秒，停止快速输入');
                stopRapidInput();
                return;
            }
            console.log(`⏳ 输入框暂时消失 (${missingInputCount}/3)，等待...`);
            return; // 本次跳过发送，但继续循环
        }
        
        // 重置丢失计数
        missingInputCount = 0;

        // 3. 检查最大次数
        if (count >= maxCount) {
             console.log('⚠️ 达到最大交互次数限制，停止快速输入');
             stopRapidInput();
             return;
        }

        // 4. 发送回车
        console.log(`👉 快速输入回车 (${count + 1}/${maxCount})`);
        sendTerminalInput(''); // 仅发送回车键，不需要字符内容
        count++;
    };

    // 立即执行一次
    checkAndSend();
    
    // 启动循环 (500ms 间隔)
    window._ralphRapidInputInterval = setInterval(checkAndSend, 500);
}

/**
 * 切换 Ralph 循环状态
 */
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

/**
 * 重置所有全局状态变量
 */
function resetState() {
    checkCount = 0;
    stableCount = 0;
    wasWorking = false;
    hasEverWorked = false;
    firstStopTime = null;
    sentDuringStop = false;
    processedScenarioDuringStop = false;
    stopHandled = false;
    lastActionAt = 0;
    lastWorkingAt = 0;
    lastHandledTaskCount = 0;
    lastObservedTaskCount = 0;
    
    // 重置检测器状态
    detector.reset();
    
    // 清除保底跳过定时器
    if (skipFallbackTimeout) {
        clearTimeout(skipFallbackTimeout);
        skipFallbackTimeout = null;
    }
    
    console.log('🧹 全局状态已重置');
}

module.exports = {
    startLoop,
    stopLoop,
    toggleLoop,
    detector
};
