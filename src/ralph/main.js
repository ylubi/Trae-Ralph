/**
 * @file main.js
 * @description 主循环逻辑模块
 * 
 * 该模块是 Ralph Loop 的心脏，负责调度整个自动化流程：
 * - 维护主循环 (setInterval)
 * - 管理全局状态 (工作/停止、冷却、稳定计数)
 * - 协调状态检测 (status.js) 和任务管理 (task-manager.js)
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
    getLastAssistantReplyElement,
    getLastTurnSignature,
    getAssistantTurnCount
} = require('./dom');
const { 
    sendMessage, 
    sendTerminalInput, 
    clickSkipButton,
    clickStopButton,
    shouldBlockSending,
    resetContextAndContinue
} = require('./actions');
const taskManager = require('./trae-agent-task-manager');
const __baseConsole = globalThis.console;
const console = {
    log: (...args) => __baseConsole.log('[trae-ralph]', ...args),
    warn: (...args) => __baseConsole.warn('[trae-ralph]', ...args),
    error: (...args) => __baseConsole.error('[trae-ralph]', ...args)
};
if (!taskManager) {
    console.error('❌ FATAL: TraeAgentTaskManager failed to load!');
} else {
    // 暴露给调试工具
    if (typeof window !== 'undefined') {
        window.taskManager = taskManager;
    }
}

// 全局状态变量
let checkCount = 0;
let stableCount = 0;
let wasWorking = false;
let hasEverWorked = false; // 记录是否进行过任务
let testInterval = null;
let firstStopTime = null;
let stopHandled = false;
let lastActionAt = 0;
let lastWorkingAt = 0;
let lastHandledTaskCount = -1; // 改用 task 数量来追踪进度，初始为 -1 以确保空对话(0)也能触发一次检测
let lastObservedTaskCount = 0;

// 新增监控变量
let lastTurnSignature = null;
let lastTurnCount = 0;
let lastReplyCountChangeTime = Date.now();
const STALLED_CHECK_INTERVAL = 6 * 60 * 1000; // 6分钟

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
    stopHandled = false;
    lastActionAt = 0;
    lastWorkingAt = 0;
    lastHandledTaskCount = -1;
    lastObservedTaskCount = 0;
    
    // 重置监控状态
    lastTurnSignature = null;
    lastTurnCount = 0;
    lastReplyCountChangeTime = Date.now();
    lastLogStatus = '';
}

/**
 * 监控回复状态变化，处理长时间卡死情况
 * 改用 Signature 判定，优先使用 TaskID+Status，比单纯的内容哈希更稳定
 */
function monitorStalledState() {
    // 传入 taskManager 以便 dom.js 获取任务状态
    const currentSignature = getLastTurnSignature(taskManager);
    const currentCount = getAssistantTurnCount();

    // 1. 检测状态变化
    if (currentSignature !== lastTurnSignature) {
        // 如果数量重置为低值（且之前有记录），视为新对话
        // 注意：这里不再依赖 < lastCount，而是只要是低值且签名变了，就可能是新对话
        // 但为了避免仅仅是第一条消息被修改导致重置，我们加一个 check:
        // 只有当 lastTurnCount > 1 且 currentCount <= 1 时，才明确是"重置"
        // 或者 currentCount == 0 (清空)
        
        const isReset = (lastTurnCount > 1 && currentCount <= 1) || (currentCount === 0);
        
        if (isReset) {
            resetRalphInfo();
        }

        lastTurnSignature = currentSignature;
        lastTurnCount = currentCount;
        lastReplyCountChangeTime = Date.now();
        return;
    }

    // 2. 检测超时（仅当有回复时，防止在空闲初始状态误触发）
    if (currentCount > 0) {
        const idleTime = Date.now() - lastReplyCountChangeTime;
        if (idleTime > STALLED_CHECK_INTERVAL) {
            console.log(`⚠️ 检测到最后一条回复 (${currentSignature}) 长时间 (${Math.floor(idleTime/60000)}分钟) 未变化，触发保底措施...`);
            
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
            return true;
        } else {
            console.log('⏳ 冷却绕过: 检测到确认弹窗或待确认删除，允许继续检测以衔接二次确认');
        }
    }
    return false;
}

let lastLogStatus = '';

/**
 * 更新并打印状态图标
 * @param {boolean} working AI是否正在工作
 */
function logStatus(working) {
    const statusIcon = working ? '🔄 工作中' : (testInterval ? '⏸️ 监控中(AI空闲)' : '⏹️ 脚本已停止');
    // 仅在状态变化时打印，减少日志刷屏
    if (statusIcon !== lastLogStatus) {
        console.log(`Ralph 状态: ${statusIcon}`);
        lastLogStatus = statusIcon;
    }
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
    
    // 5. 达到稳定状态，执行场景检测
    if (stableCount >= CONFIG.stableCount) {
        if (stopHandled) {
          return;
        }
        stopHandled = true;
        lastHandledTaskCount = currentTaskCount; // 更新已处理的任务计数
        console.log('');
        console.log('✅ AI 处于空闲状态，准备扫描任务');
        
        wasWorking = false;
    }
}

/**
 * 运行一次循环迭代
 */
function runLoopIteration() {
    checkCount++;
    
    // 0. 全局冷却检查 (保留，用于限制发送频率，但对于 OP 操作会绕过)
    // 注意：已移至 P0 任务检测之后，确保关键任务不受冷却限制。

    // ==========================================
    // Priority 0+: 全局阻断 (Global Blockers)
    // 检查是否存在模态弹窗、交互输入或任务完成状态
    // ==========================================
    const globalOp = taskManager.getGlobalOp();
    if (globalOp) {
        console.log(`⚡ [P0+] 全局阻断操作: ${globalOp.description}`);
        
        if (globalOp.type === taskManager.TYPES.OP_CLICK && globalOp.element) {
            globalOp.element.click();
        } else if (globalOp.type === taskManager.TYPES.OP_TERMINAL) {
            sendTerminalInput(globalOp.payload || 'y');
        } else if (globalOp.type === taskManager.TYPES.OP_REPLY) {
            sendMessage(CONFIG.messages.continue);
        }
        
        stableCount = 0; // 重置稳定计数
        lastActionAt = Date.now();
        return; // 立即结束本次循环
    }

    // ==========================================
    // Priority 0: 关键操作 (Critical Ops)
    // 检查是否有待处理的操作类任务
    // ==========================================
    
    // 1. 更新任务管理器 (扫描 DOM, 注入 ID, 更新状态)
    taskManager.update();
    
    // 2. 获取下一个挂起的操作 (Priority: TERMINAL > CLICK > RESTART > REPLY)
    const pendingOp = taskManager.getNextPendingOp();
    
    if (pendingOp) {
        console.log(`⚡ [P0] 发现挂起操作任务: ${pendingOp.id} (${pendingOp.type})`);
        handlePendingTask(pendingOp);
        
        // 操作后立即重置状态，以便快速响应下一个动作
        stableCount = 0;
        lastActionAt = Date.now();
        return;
    }

    // 如果没有 P0+ 或 P0 任务，才检查冷却，防止 P2 监控过于频繁
    // 注意：不再此处 return，允许执行监控逻辑，仅在 monitorBackups 中应用冷却


    const working = isAIWorking();
    logStatus(working);
    
    const currentTaskCount = document.getElementsByClassName('ai-agent-task').length;
    
    // 如果 AI 正在工作，更新状态并返回
    if (working) {
        handleWorkingState(currentTaskCount);
        return;
    }

    // ==========================================
    // Priority 2: 保底监控 (Backup Monitor)
    // 仅在 AI 停止时运行
    // ==========================================
    processStoppedState(currentTaskCount, false); // 不再传入 blocking 参数，由 monitorBackups 处理
    
    // 监控回复总数变化（独立于工作状态，作为全局保底）
    monitorStalledState();
    
    // 额外的保底检查 (发送按钮禁用继续等)
    monitorBackups();
}

/**
 * 处理挂起任务的分发逻辑
 * @param {Object} task 
 */
function handlePendingTask(task) {
    const el = task.element;
    
    switch (task.type) {
        case taskManager.TYPES.OP_TERMINAL:
        case taskManager.TYPES.OP_CLICK:
        case taskManager.TYPES.OP_RESTART:
            // 尝试点击最佳按钮
            const targetBtn = el.querySelector('.icd-btn-primary') || 
                            el.querySelector('.icd-run-command-card-v2-actions-btn-run') ||
                            el.querySelector('.icube-alert-action') ||
                            el.querySelector('.icube-alert-button-action') || // 新增: 适配服务端异常重试按钮
                            el.querySelector('.icd-btn-tertiary') || // 跳过按钮 (v2-cwd)
                            Array.from(el.querySelectorAll('button')).find(b => {
                                const txt = (b.textContent || '').trim();
                                return txt === '跳过' || txt === '重试';
                            }) ||
                            el.querySelector('button');
            
            if (targetBtn) {
                console.log(`👆 自动点击按钮: ${targetBtn.className} (Type: ${task.type})`);
                targetBtn.click();
                
                // 标记为验证中
                // OP_RESTART 使用 30s 验证 (等待 AI 运行)，其他使用 10s (等待按钮消失)
                const timeout = task.type === taskManager.TYPES.OP_RESTART ? 30000 : 10000;
                taskManager.markAsVerifying(task.id, timeout);
            } else {
                console.warn(`⚠️ 任务 ${task.id} 未找到可点击按钮，标记为 SKIPPED`);
                taskManager.markAsSkipped(task.id);
            }
            break;
            
        case taskManager.TYPES.OP_REPLY:
                    // 发送回复
                    const message = CONFIG.messages.continue;
                                   
                    console.log(`💬 自动回复: "${message}"`);
                    sendMessage(message);
                    
                    // 标记为验证中 (等待发送按钮变态，超时 30s)
                    taskManager.markAsVerifying(task.id, 30000);
                    break;

        case taskManager.TYPES.OP_RESET_CONTINUE:
            console.log(`🔄 执行重置并继续流程: ${task.id}`);
            // 使用 actions.js 中封装好的 resetContextAndContinue
            resetContextAndContinue().then(success => {
                if (success) {
                    // 标记为验证中 (等待 AI 进入运行状态, 超时 30s)
                    taskManager.markAsVerifying(task.id, 30000);
                } else {
                    console.error('❌ 重置流程启动失败');
                    taskManager.markAsIgnored(task.id);
                }
            });
            break;
            
        default:
            console.warn(`❓ 未知任务类型: ${task.type}`);
            taskManager.markAsIgnored(task.id);
    }
}

/**
 * 额外的保底监控
 */
function monitorBackups() {
    // 检查冷却，防止频繁触发保底操作
    if (isGlobalCooldownActive()) return;

    // 1. 发送按钮禁用继续 (sendButtonDisabledContinue)
    // 如果发送按钮被禁用，且不是因为 AI 正在生成，且 Ralph 正在运行
    // 尝试发送 "继续" 以激活状态 (利用 triggerSendAction 的回车降级策略)
    // 更新选择器以匹配 .chat-input-v2-send-button
    const sendButton = document.querySelector('.chat-input-v2__actions-btn-send') || 
                       document.querySelector('.chat-input-v2-send-button') ||
                       document.querySelector('.chat-input-v2-send-button.disabled'); // 显式匹配 disabled 类
    const isSendDisabled = sendButton && (sendButton.disabled || sendButton.classList.contains('disabled'));
    
    if (isSendDisabled && !isAIWorking() && testInterval) {
        console.log('⚠️ 检测到发送按钮禁用但 Ralph 已开启，尝试强制发送继续...');
        sendMessage(CONFIG.messages.continue);
    }

    // 2. 任务完成确认检查 (taskCompletedConfirmCheck)
    if (isTaskCompleteBanner()) {
        console.log('✅ 检测到任务完成标记，发送“继续”以确认');
        sendMessage(CONFIG.messages.continue);
    }
}

/**
 * 启动 Ralph 循环
 */
function startLoop() {
    if (!taskManager) {
        console.error('❌ 无法启动 Ralph: TraeAgentTaskManager 未初始化');
        return;
    }
    if (testInterval) {
      console.log('ℹ️ Ralph 循环已在运行');
      return;
    }
    console.log('🚀 开始监控 (TraeAgentTaskManager v2)...');
    console.log('');
    console.log('📋 任务管理系统已就绪');
    console.log('   - 优先级管道: P0+(Block) -> P0(Ops) -> P2(Monitor)');
    console.log('   - 任务分类: Click / Terminal / Reply / Restart / Interactive');
    console.log('');
    
    // 更新按钮状态
    if (window.$ralphToggleBtn) {
      try {
        window.$ralphToggleBtn.textContent = '停止 Ralph';
        window.$ralphToggleBtn.setAttribute('data-state', 'running');
      } catch(e) {}
    }
    
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
    stopHandled = false;
    lastActionAt = 0;
    lastWorkingAt = 0;
    lastHandledTaskCount = -1;
    lastObservedTaskCount = 0;
    lastLogStatus = '';
    
    console.log('🧹 全局状态已重置');
}

module.exports = {
    startLoop,
    stopLoop,
    toggleLoop
};
