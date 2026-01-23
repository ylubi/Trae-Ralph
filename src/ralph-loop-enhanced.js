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
  console.log('🚀 Trae Ralph Loop - 增强版');
  console.log('');
  
  // ============================================
  // 场景定义
  // ============================================
  
  const SCENARIOS = {
    contextLimit: {
      name: '上下文限制',
      enabled: true,
      priority: 1,
      keywords: ['上下文窗口已满', 'context window', '达到上下文限制', '上下文过长'],
      action: 'continue',
      message: '继续'
    },
    rateLimit: {
      name: '请求限制',
      enabled: true,
      priority: 1,
      keywords: ['rate limit', '请求过多', '请求限制', '稍后再试', 'too many requests'],
      action: 'wait',
      waitTime: 60000,
      message: '继续'
    },
    interactiveCommand: {
      name: '交互式命令',
      enabled: true,
      priority: 2,
      keywords: ['等待用户输入', 'waiting for input', '请确认', '是否继续'],
      patterns: [/\(y\/n\)/i, /\[y\/n\]/i, /yes\/no/i, /请确认/, /是否继续/],
      action: 'custom',
      responses: { default: 'y' }
    },
    prematureCompletion: {
      name: '提前完成',
      enabled: true,
      priority: 3,
      keywords: ['已完成', 'completed', 'done', '任务完成'],
      checkIncomplete: true,
      incompleteIndicators: ['TODO', 'FIXME', '待完成', '未实现', '// ...'],
      action: 'continue',
      message: '请继续完成剩余部分'
    },
    needsConfirmation: {
      name: '需要确认',
      enabled: true,
      priority: 2,
      keywords: ['需要确认', '请确认', 'confirm', '是否', '要不要'],
      action: 'continue',
      message: '确认，继续'
    },
    longThinking: {
      name: '长时间思考',
      enabled: true,
      priority: 4,
      checkDuration: true,
      thinkingTime: 30000,
      action: 'continue',
      message: '继续'
    }
  };
  
  // ============================================
  // 配置
  // ============================================
  
  const CONFIG = {
    checkInterval: 5000,
    stableCount: 3,
    scenarios: SCENARIOS
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
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[class*="send"]'
    ]);
  }
  
  function getLastMessage() {
    if (window.$trae) {
      const element = window.$trae.chat.lastMessage;
      return element ? element.textContent.trim() : '';
    }
    const element = findElement([
      '.message:last-child',
      '[class*="message"]:last-child',
      '[class*="chat-message"]:last-child'
    ]);
    return element ? element.textContent.trim() : '';
  }
  
  function getChatContent() {
    if (window.$trae) {
      const container = window.$trae.chat.container;
      return container ? container.textContent : '';
    }
    const container = findElement([
      '[class*="chat"][class*="container"]',
      '[class*="messages"]',
      '[class*="conversation"]'
    ]);
    return container ? container.textContent : '';
  }
  
  function isAIWorking() {
    // 使用 $trae 检查
    if (window.$trae) {
      if (window.$trae.status.loading) return true;
      
      const input = window.$trae.chat.input;
      if (input && (input.disabled || input.readOnly)) return true;
      
      const button = window.$trae.chat.sendButton;
      if (button && button.disabled) return true;
      
      return false;
    }
    
    // 降级到默认检查
    const loading = findElement([
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="thinking"]',
      '[class*="generating"]',
      '[aria-busy="true"]'
    ]);
    if (loading) return true;
    
    const input = findChatInput();
    if (input && (input.disabled || input.readOnly)) return true;
    
    const button = findSendButton();
    if (button && button.disabled) return true;
    
    return false;
  }
  
  function sendMessage(message) {
    const input = findChatInput();
    if (!input) {
      console.error('❌ 无法发送消息：未找到输入框');
      return false;
    }
    
    try {
      input.value = message;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      const button = findSendButton();
      if (button) {
        button.click();
        console.log('✓ 通过按钮发送消息:', message);
      } else {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true
        });
        input.dispatchEvent(enterEvent);
        console.log('✓ 通过回车发送消息:', message);
      }
      
      return true;
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      return false;
    }
  }
  
  // ============================================
  // 场景检测
  // ============================================
  
  class ScenarioDetector {
    constructor() {
      this.lastMessages = [];
      this.maxHistory = 10;
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
    
    detectKeywords(text, keywords) {
      if (!keywords || keywords.length === 0) return false;
      const lowerText = text.toLowerCase();
      return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }
    
    detectPatterns(text, patterns) {
      if (!patterns || patterns.length === 0) return false;
      return patterns.some(pattern => pattern.test(text));
    }
    
    detect(context) {
      const { lastMessage, chatContent, stoppedDuration } = context;
      
      if (lastMessage) {
        this.recordMessage(lastMessage);
      }
      
      const enabledScenarios = Object.entries(CONFIG.scenarios)
        .filter(([_, s]) => s.enabled)
        .sort(([_, a], [__, b]) => a.priority - b.priority);
      
      for (const [id, scenario] of enabledScenarios) {
        let detected = false;
        let matchInfo = null;
        
        // 关键词检测
        if (scenario.keywords) {
          const text = lastMessage || chatContent;
          if (this.detectKeywords(text, scenario.keywords)) {
            detected = true;
            matchInfo = { type: 'keyword', scenario: id };
          }
        }
        
        // 正则检测
        if (!detected && scenario.patterns) {
          const text = lastMessage || chatContent;
          if (this.detectPatterns(text, scenario.patterns)) {
            detected = true;
            matchInfo = { type: 'pattern', scenario: id };
          }
        }
        
        // 时长检测
        if (!detected && scenario.checkDuration) {
          if (stoppedDuration >= (scenario.thinkingTime || 30000)) {
            detected = true;
            matchInfo = { type: 'duration', scenario: id };
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
          return {
            detected: true,
            scenario: id,
            scenarioConfig: scenario,
            matchInfo
          };
        }
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
  let testInterval = null;
  let firstStopTime = null;
  
  const detector = new ScenarioDetector();
  
  function startLoop() {
    console.log('🚀 开始监控...');
    console.log('');
    console.log('📋 已启用场景：');
    Object.entries(CONFIG.scenarios)
      .filter(([_, s]) => s.enabled)
      .forEach(([id, s]) => {
        console.log(`  - ${s.name} (优先级: ${s.priority})`);
      });
    console.log('');
    
    testInterval = setInterval(() => {
      checkCount++;
      
      console.log(`\n[检查 ${checkCount}] ${new Date().toLocaleTimeString()}`);
      
      const working = isAIWorking();
      console.log(`AI 状态: ${working ? '🔄 工作中' : '⏸️ 已停止'}`);
      
      if (working) {
        stableCount = 0;
        firstStopTime = null;
        wasWorking = true;
      } else {
        if (!firstStopTime) {
          firstStopTime = Date.now();
        }
        
        stableCount++;
        const stoppedDuration = Date.now() - firstStopTime;
        console.log(`稳定计数: ${stableCount}/${CONFIG.stableCount}`);
        console.log(`停止时长: ${Math.floor(stoppedDuration / 1000)}秒`);
        
        if (stableCount >= CONFIG.stableCount && wasWorking) {
          console.log('');
          console.log('✅ 检测到 AI 已停止');
          
          // 场景检测
          const lastMessage = getLastMessage();
          const chatContent = getChatContent();
          
          const result = detector.detect({
            lastMessage,
            chatContent,
            stoppedDuration
          });
          
          if (result.detected) {
            const scenario = result.scenarioConfig;
            console.log(`🎯 检测到场景: ${scenario.name}`);
            console.log(`   匹配类型: ${result.matchInfo.type}`);
            
            // 处理等待
            if (scenario.action === 'wait') {
              const waitSec = Math.floor(scenario.waitTime / 1000);
              console.log(`⏳ 等待 ${waitSec} 秒后继续...`);
              setTimeout(() => {
                const message = detector.getResponse(result.scenario, { lastMessage });
                sendMessage(message);
                console.log(`✅ 已发送: "${message}"`);
              }, scenario.waitTime);
            } else {
              const message = detector.getResponse(result.scenario, { lastMessage });
              console.log(`💡 准备发送: "${message}"`);
              
              if (sendMessage(message)) {
                console.log('✅ 消息已发送');
              }
            }
          } else {
            console.log('💡 未匹配特定场景，发送默认"继续"');
            sendMessage('继续');
          }
          
          stableCount = 0;
          wasWorking = false;
          firstStopTime = null;
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
    }
  };
  
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
    console.log(`AI 状态: ${working ? '🔄 工作中' : '⏸️ 已停止'}`);
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
  console.log('  checkAIStatus()         - 检查 AI 状态');
  console.log('  testDetection()         - 测试检测系统');
  console.log('');
  
  startLoop();
})();
