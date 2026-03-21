/**
 * @file trae-agent-task-manager.js
 * @description 任务状态管理器
 * 
 * 负责对 DOM 中的任务元素进行持久化追踪和状态管理。
 * 核心功能：
 * 1. ID 注入：为每个 .ai-agent-task 注入唯一 ID
 * 2. 状态追踪：记录任务的处理状态 (PENDING, HANDLED, IGNORED)
 * 3. 优先级队列：维护操作类任务的执行顺序
 * 4. 内存管理：基于 LRU 策略限制最大追踪数量，防止内存泄漏
 */

const SCENARIO_DEFINITIONS = require('./scenarios/index');
const { CONFIG } = require('./config');
const __baseConsole = globalThis.console;
const console = {
    log: (...args) => __baseConsole.log('[trae-ralph]', ...args),
    warn: (...args) => __baseConsole.warn('[trae-ralph]', ...args),
    error: (...args) => __baseConsole.error('[trae-ralph]', ...args)
};

class TraeAgentTaskManager {
    constructor() {
        // 使用 Map 保持插入顺序，实现类 LRU 机制
        // Key: taskId (string), Value: TaskState (object)
        this.tasks = new Map();
        this.MAX_TASKS = 50;
        
        // 任务类型枚举
        this.TYPES = {
            INFO: 'INFO',           // 0. 信息类 (纯文本/无交互)
            OP_BACKUP: 'OP_BACKUP', // 1. 保底操作 (发送按钮禁用, 回复卡死) - 注意：这类通常不是 ai-agent-task 触发
            OP_REPLY: 'OP_REPLY',   // 2. 回复类 (上下文, 任务完成)
            OP_CLICK: 'OP_CLICK',   // 3. 直接点击 (系统错误, 服务异常)
            OP_TERMINAL: 'OP_TERMINAL', // 4. 终端命令 (运行, 删除, 跳过)
            OP_RESTART: 'OP_RESTART',   // 5. 重启对话
            OP_RESET_CONTINUE: 'OP_RESET_CONTINUE', // 6. 新建任务->保留->继续
            GLOBAL: 'GLOBAL'        // 全局阻断 (弹窗)
        };

        // 任务状态枚举
        this.STATUS = {
            PENDING: 'PENDING', // 待处理
            VERIFYING: 'VERIFYING', // 等待验证结果
            HANDLED: 'HANDLED', // 已执行/验证成功
            FAILED: 'FAILED',   // 验证失败/执行失败
            IGNORED: 'IGNORED', // 无需处理
            SKIPPED: 'SKIPPED'  // 已跳过
        };
    }

    /**
     * 检查是否为操作类任务
     * @param {string} type 
     */
    isOpType(type) {
        return type.startsWith('OP_');
    }

    /**
     * 获取任务状态对象
     * @param {string} id 
     */
    getTask(id) {
        return this.tasks.get(id);
    }

    /**
     * 核心更新循环：扫描 DOM，注入 ID，更新状态
     * @returns {number} 当前追踪的任务数量
     */
    update() {
        // 1. 扫描所有任务元素
        const domTasks = document.querySelectorAll('.ai-agent-task, .agent-error-wrap');
        
        Array.from(domTasks).forEach(el => {
            let id = el.getAttribute('data-ralph-task-id');
            
            // Case A: 全新任务，注入 ID 并注册
            if (!id) {
                id = this.generateId();
                el.setAttribute('data-ralph-task-id', id);
                this.registerNewTask(id, el);
            } 
            // Case B: 已知任务，刷新位置 (LRU 策略：访问即更新到队尾)
            else if (this.tasks.has(id)) {
                const task = this.tasks.get(id);

                // 检查1：INFO/IGNORED 任务重新分类 (解决异步加载导致的分类错误)
                // 如果任务之前被归类为 INFO 或状态为 IGNORED，尝试重新分类
                if (task.type === this.TYPES.INFO || task.status === this.STATUS.IGNORED) {
                     const newType = this.classifyTask(el);
                     if (this.isOpType(newType)) {
                         console.log(`[TraeAgentTaskManager] 🆙 任务 ${id} 类型升级: ${task.type} -> ${newType}`);
                         task.type = newType;
                         task.status = this.STATUS.PENDING;
                         task.createdAt = Date.now();
                         // 更新缓存的选择器
                         task.selectors = {
                             primaryBtn: !!el.querySelector('.icd-btn-primary'),
                             runBtn: !!el.querySelector('.icd-run-command-card-v2-actions-btn-run'),
                             alertAction: !!el.querySelector('.icube-alert-action'),
                             retryBtn: !!el.querySelector('.icube-alert-button-action')
                         };
                     }
                }

                // 检查2：对于已处理的终端任务或点击任务，如果出现了操作按钮（运行、跳过、重试），重置为 PENDING
                // 这能解决初始渲染时无按钮被误判为 HANDLED，随后按钮加载出来的情况
                if (task.status === this.STATUS.HANDLED && (task.type === this.TYPES.OP_TERMINAL || task.type === this.TYPES.OP_CLICK)) {
                     const hasActionBtn = el.querySelector('.icd-btn-tertiary') || 
                                          el.querySelector('.icd-btn-primary') ||
                                          el.querySelector('.icd-run-command-card-v2-actions-btn-run') ||
                                          el.querySelector('.icube-alert-button-action') ||
                                          Array.from(el.querySelectorAll('button')).some(b => {
                                              const txt = (b.textContent || '').trim();
                                              return txt === '跳过' || txt === 'Skip' || txt === '重试';
                                          });
                                          
                     if (hasActionBtn) {
                         console.log(`[TraeAgentTaskManager] ♻️ 任务 ${id} 检测到操作按钮，重置为 PENDING`);
                         task.status = this.STATUS.PENDING;
                         task.createdAt = Date.now();
                     }
                }
            }
        });

        // 2. 验证检查 (Verification Check)
        for (const [id, task] of this.tasks) {
            if (task.status === this.STATUS.VERIFYING) {
                this.verifyTask(id, task);
            }
        }

        // 3. 容量控制 (LRU/FIFO)
        // 当超过最大容量时，移除最早加入的任务状态
        while (this.tasks.size > this.MAX_TASKS) {
            const oldestId = this.tasks.keys().next().value;
            this.tasks.delete(oldestId);
            // console.debug(`[TraeAgentTaskManager] GC: Evicted ${oldestId}`);
        }

        return this.tasks.size;
    }

    /**
     * 验证任务执行结果
     * @param {string} id 
     * @param {object} task 
     */
    verifyTask(id, task) {
        // 检查 DOM 中是否还存在该 ID 的元素
        const el = document.querySelector(`[data-ralph-task-id="${id}"]`);
        const now = Date.now();
        
        // 1. 超时检查
        if (now > task.verifyUntil) {
            console.warn(`❌ 任务 ${id} 验证超时`);
            
            // 特殊处理：终端任务如果出现跳过按钮，重置为 PENDING
            if (task.type === this.TYPES.OP_TERMINAL && el) {
                const hasSkip = el.querySelector('.icd-btn-tertiary') || 
                                Array.from(el.querySelectorAll('button')).some(b => (b.textContent || '').trim() === '跳过');
                
                if (hasSkip) {
                    console.log(`⚠️ 任务 ${id} 验证超时，但检测到“跳过”按钮，重置为 PENDING 以便点击跳过`);
                    task.status = this.STATUS.PENDING;
                    task.createdAt = Date.now();
                    return;
                }
            }
            
            task.status = this.STATUS.FAILED;
            return;
        }
        
        // 2. 正常验证逻辑
        
        // A. 回复类验证 (等待 AI 进入运行状态)
        if (task.type === this.TYPES.OP_REPLY || 
            task.type === this.TYPES.OP_RESTART || 
            task.type === this.TYPES.OP_RESET_CONTINUE) {
            const stopBtn = document.querySelector('.codicon-stop-circle');
            const input = document.querySelector('.chat-input-v2-container textarea');
            // 只要有停止按钮，或者输入框被禁用，都视为 AI 正在运行
            const isRunning = !!stopBtn || (input && input.disabled);

            if (isRunning) {
                console.log(`✅ 任务 ${id} 验证成功: AI 进入运行状态`);
                task.status = this.STATUS.HANDLED;
            }
            return;
        }

        // B. 操作类验证 (等待按钮消失)
        // 如果元素已经不存在了，说明被移除了，任务完成
        if (!el) {
            console.log(`✅ 任务 ${id} 验证成功: 元素已消失`);
            task.status = this.STATUS.HANDLED;
            return;
        }

        // 检查按钮是否存在
        const hasButton = !!(el.querySelector('.icd-btn-primary') || 
                           el.querySelector('.icd-run-command-card-v2-actions-btn-run') ||
                           el.querySelector('.icube-alert-action') ||
                           el.querySelector('.icube-alert-button-action'));

        if (!hasButton) {
            console.log(`✅ 任务 ${id} 验证成功: 按钮已消失`);
            task.status = this.STATUS.HANDLED;
        }
        // 如果按钮还在且没超时，保持 VERIFYING 状态，等待下一次循环
    }

    /**
     * 标记任务为正在验证
     * @param {string} id 
     * @param {number} timeoutMs 默认 10秒
     */
    markAsVerifying(id, timeoutMs = 10000) {
        if (this.tasks.has(id)) {
            const task = this.tasks.get(id);
            task.status = this.STATUS.VERIFYING;
            task.verifyUntil = Date.now() + timeoutMs;
            console.log(`⏳ 任务 ${id} 进入验证阶段 (超时: ${timeoutMs}ms)`);
        }
    }

    /**
     * 注册新任务
     * @param {string} id 任务ID
     * @param {HTMLElement} element DOM元素
     */
    registerNewTask(id, element) {
        const type = this.classifyTask(element);
        
        let initialStatus = this.isOpType(type) ? this.STATUS.PENDING : this.STATUS.IGNORED;

        // 预检：如果任务已经完成（例如按钮已不存在），直接标记为 HANDLED
        if (initialStatus === this.STATUS.PENDING) {
            const hasButton = !!(element.querySelector('.icd-btn-primary') || 
                               element.querySelector('.icd-run-command-card-v2-actions-btn-run') ||
                               element.querySelector('.icube-alert-action') ||
                               element.querySelector('.icube-alert-button-action') ||
                               element.querySelector('.icd-btn-tertiary') || // 跳过
                               Array.from(element.querySelectorAll('button')).some(b => (b.textContent || '').trim() === '跳过'));
            
            if (!hasButton && (type === this.TYPES.OP_TERMINAL || type === this.TYPES.OP_CLICK)) {
                console.log(`[TraeAgentTaskManager] ⏭️ 任务 ${id} 已处于完成状态（无按钮），标记为 HANDLED`);
                initialStatus = this.STATUS.HANDLED;
            }
        }

        const taskState = {
            id,
            type,
            status: initialStatus,
            createdAt: Date.now(),
            // 缓存关键选择器结果，减少后续查询开销
            selectors: {
                primaryBtn: !!element.querySelector('.icd-btn-primary'),
                runBtn: !!element.querySelector('.icd-run-command-card-v2-actions-btn-run'),
                alertAction: !!element.querySelector('.icube-alert-action'),
                retryBtn: !!element.querySelector('.icube-alert-button-action') // 新增: 服务端异常重试按钮
            }
        };

        this.tasks.set(id, taskState);
        
        if (this.isOpType(type) && initialStatus === this.STATUS.PENDING) {
            console.log(`[TraeAgentTaskManager] 🆕 发现操作任务: ${id} (${type})`);
        }
    }

    /**
     * 任务分类逻辑
     * @param {HTMLElement} element 
     * @returns {string} 任务类型
     */
    classifyTask(element) {
        const text = element.innerText || '';
        
        // 遍历所有定义的场景规则
        for (const def of SCENARIO_DEFINITIONS) {
            try {
                if (def.match(element, text)) {
                    // console.log(`[TraeAgentTaskManager] Match Scenario: ${def.id} (${def.name})`);
                    
                    // 验证类型是否有效
                    const type = this.TYPES[def.type];
                    if (type) {
                        return type;
                    } else {
                        console.warn(`[TraeAgentTaskManager] Unknown type '${def.type}' in scenario '${def.id}'`);
                    }
                }
            } catch (err) {
                console.error(`[TraeAgentTaskManager] Error matching scenario '${def.id}':`, err);
            }
        }
        
        return this.TYPES.INFO;
    }

    /**
     * 获取全局阻断性操作 (Priority 0+)
     * 统一处理：弹窗、交互式输入、任务完成状态
     * @returns {Object|null} { type, element, payload, description }
     */
    getGlobalOp() {
        // 1. 检查确认弹窗 (OP_CLICK)
        const popover = document.querySelector('.confirm-popover-body');
        if (popover && getComputedStyle(popover).display !== 'none') {
            const confirmBtn = popover.querySelector('.confirm-popover-footer button.sc-fhHczv.fibWLk') || // 确认按钮
                             popover.querySelector('.confirm-popover-footer button:first-child');
            
            if (confirmBtn) {
                return {
                    type: this.TYPES.OP_CLICK,
                    element: confirmBtn,
                    description: '全局确认弹窗'
                };
            }
        }

        // 2. 检查交互式输入 (OP_TERMINAL)
        if (this.checkInteractiveInput()) {
            return {
                type: this.TYPES.OP_TERMINAL,
                payload: 'y', // 默认输入 y
                description: '交互式命令等待输入'
            };
        }

        // 3. 检查任务完成状态 (OP_REPLY)
        const taskCompleteEls = document.querySelectorAll('.latest-assistant-bar .status .status-text');
        if (taskCompleteEls.length > 0) {
            const el = taskCompleteEls[taskCompleteEls.length - 1];
            const text = el ? (el.textContent || '').trim() : '';
            if (text === '任务完成') {
                return {
                    type: 'OP_REPLY',
                    payload: CONFIG.messages.continue, // 使用配置中的强化引导语
                    description: '任务完成确认'
                };
            }
        }

        return null;
    }

    /**
     * 检查是否存在全局阻断性弹窗 (Priority 0+)
     * @deprecated use getGlobalOp instead
     * @returns {HTMLElement|null} 确认按钮
     */
    checkGlobalOverlays() {
        // 保留旧方法以兼容，或者直接移除
        const op = this.getGlobalOp();
        if (op && op.type === this.TYPES.OP_CLICK) {
            console.log('[TraeAgentTaskManager] 🚨 检测到全局确认弹窗');
            return op.element;
        }
        return null;
    }

    /**
     * 检查是否有交互式输入请求
     * @returns {boolean} 是否发现
     */
    checkInteractiveInput() {
        // 简单检测：xterm-helper-textarea 是否存在且聚焦，或者通过文本特征
        // 更准确的方法是检查最近的终端卡片内容是否有 "waiting for input" 或类似提示
        const cards = document.querySelectorAll('.icd-run-command-card-v2');
        if (cards.length === 0) return false;
        
        const lastCard = cards[cards.length - 1];
        const text = (lastCard.innerText || '').toLowerCase();
        
        // 特征词匹配 (参考 interactive-command.js)
        const isInteractive = text.includes('waiting for input') || 
                              text.includes('(y/n)') || 
                              text.includes('[y/n]') ||
                              text.includes('请确认') ||
                              text.includes('是否继续');
                              
        if (isInteractive) {
             // 还需要判断是否已经完成（例如按钮已消失，或者没有光标）
             // 简单起见，如果匹配且没有其他操作按钮，认为是交互状态
             // 或者直接检查 input textarea
             const input = lastCard.querySelector('.xterm-helper-textarea');
             if (input) {
                 return true;
             }
        }
        return false;
    }

    /**
     * 获取下一个待执行的操作任务 (Priority 0)
     * 策略：按 DOM 顺序返回第一个 PENDING 状态的 OP 任务
     * @returns {Object|null} { id, element }
     */
    getNextPendingOp() {
        const domTasks = document.querySelectorAll('.ai-agent-task, .agent-error-wrap');
        
        for (const el of domTasks) {
            const id = el.dataset.ralphTaskId;
            if (!id) continue; // 刚生成还未注入ID的情况，跳过本次
            
            const task = this.tasks.get(id);
            if (task && this.isOpType(task.type) && task.status === this.STATUS.PENDING) {
                // Priority Logic:
                // 如果需要严格的优先级控制 (TERMINAL > CLICK > RESTART > REPLY)，
                // 可以在这里收集所有 pending 任务，排序后再返回。
                // 当前策略：按 DOM 顺序 (从上到下)
                // 改进：为了响应用户需求，我们优先处理 OP_TERMINAL
                
                // 简单实现：找到第一个 pending 任务后，如果它是低优先级的 (REPLY)，
                // 继续向后看有没有高优先级的 (TERMINAL)。
                // 鉴于任务数量不多 (50)，可以直接扫描一遍。
                
                // 暂不立即返回，收集所有 candidates
                // return { id, element: el, type: task.type };
            }
        }
        
        // 收集所有挂起任务
        const candidates = [];
        for (const el of domTasks) {
            const id = el.getAttribute('data-ralph-task-id');
            if (!id) continue;
            const task = this.tasks.get(id);
            if (task && this.isOpType(task.type) && task.status === this.STATUS.PENDING) {
                candidates.push({ id, element: el, type: task.type, priority: this.getPriority(task.type) });
            }
        }
        
        if (candidates.length === 0) return null;
        
        // 按优先级排序 (数值越大越优先)
        candidates.sort((a, b) => b.priority - a.priority);
        
        return candidates[0];
    }

    getPriority(type) {
        switch(type) {
            case this.TYPES.OP_TERMINAL: return 100;
            case this.TYPES.OP_CLICK: return 90;
            case this.TYPES.OP_RESTART: return 80;
            case this.TYPES.OP_RESET_CONTINUE: return 80; // 与重启同级
            case this.TYPES.OP_REPLY: return 50;
            default: return 0;
        }
    }

    /**
     * 标记任务已处理
     * @param {string} id 
     */
    markAsHandled(id) {
        if (this.tasks.has(id)) {
            this.tasks.get(id).status = this.STATUS.HANDLED;
        }
    }

    /**
     * 标记任务已忽略
     * @param {string} id 
     */
    markAsIgnored(id) {
        if (this.tasks.has(id)) {
            this.tasks.get(id).status = this.STATUS.IGNORED;
        }
    }
    
    /**
     * 重置管理器 (用于测试)
     */
    reset() {
        this.tasks.clear();
    }

    /**
     * 标记任务已跳过
     * @param {string} id 
     */
    markAsSkipped(id) {
        if (this.tasks.has(id)) {
            this.tasks.get(id).status = this.STATUS.SKIPPED;
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * 调试用：打印当前状态
     */
    debugDump() {
        console.table(Array.from(this.tasks.values()));
    }
}

module.exports = new TraeAgentTaskManager();
