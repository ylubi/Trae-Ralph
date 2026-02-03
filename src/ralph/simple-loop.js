/**
 * @file simple-loop.js
 * @description 简易测试循环模块 (已废弃/仅供参考)
 * 
 * 这是一个独立的、简化版的循环实现，不依赖其他模块。
 * 主要用于开发初期的快速测试和验证 DOM 选择器。
 * 
 * 注意：生产环境使用的是 main.js 中的完整循环逻辑。
 * 此文件包含独立的 findElement, sendMessage 等实现。
 */

const CONFIG = {
  selectors: {
    chatInput: [
      '#chat-input',
      'textarea[placeholder*="消息"]',
      'textarea[placeholder*="Message"]',
      'textarea[class*="chat"]',
      'textarea[class*="input"]'
    ],
    sendButton: [
      'button[aria-label*="发送"]',
      'button[aria-label*="Send"]',
      'button[class*="send"]'
    ],
    loading: [
      '.loading',
      '.spinner',
      '[class*="loading"]',
      '[class*="thinking"]',
      '[class*="generating"]',
      '[aria-busy="true"]'
    ]
  },
  checkInterval: 5000,  // 5 秒检查一次
  stableCount: 3        // 连续 3 次稳定才认为停止
};

/**
 * 查找元素辅助函数
 * @param {string[]} selectors 选择器列表
 * @returns {HTMLElement|null} 找到的元素
 */
function findElement(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      // 忽略无效选择器
    }
  }
  return null;
}

/**
 * 查找聊天输入框
 * @returns {HTMLElement|null} 输入框元素
 */
function findChatInput() {
  const input = findElement(CONFIG.selectors.chatInput);
  if (input) {
    console.log('✓ 找到 Chat 输入框:', input);
  } else {
    console.error('❌ 未找到 Chat 输入框');
  }
  return input;
}

/**
 * 查找发送按钮
 * @returns {HTMLElement|null} 发送按钮元素
 */
function findSendButton() {
  const button = findElement(CONFIG.selectors.sendButton);
  if (button) {
    console.log('✓ 找到发送按钮:', button);
  } else {
    console.warn('⚠️ 未找到发送按钮（将使用回车键）');
  }
  return button;
}

/**
 * 检查 AI 是否正在工作
 * @returns {boolean} 是否正在工作
 */
function isAIWorking() {
  // 方法 1：检查加载指示器
  const loading = findElement(CONFIG.selectors.loading);
  if (loading) {
    return true;
  }
  
  // 方法 2：检查输入框是否禁用
  const input = findChatInput();
  if (input && (input.disabled || input.readOnly)) {
    return true;
  }
  
  // 方法 3：检查发送按钮是否禁用
  const button = findSendButton();
  if (button && button.disabled) {
    return true;
  }
  
  return false;
}

/**
 * 发送消息
 * @param {string} message 消息内容
 * @returns {boolean} 是否成功
 */
function sendMessage(message) {
  const input = findChatInput();
  if (!input) {
    console.error('❌ 无法发送消息：未找到输入框');
    return false;
  }
  
  try {
    // 设置值
    input.value = message;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 尝试点击发送按钮
    const button = findSendButton();
    if (button) {
      button.click();
      console.log('✓ 通过按钮发送消息:', message);
    } else {
      // 模拟回车
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
// 测试主循环
// ============================================

let checkCount = 0;
let stableCount = 0;
let wasWorking = false;
let testInterval = null;

/**
 * 开始测试循环
 */
function startTest() {
  console.log('🚀 开始测试...');
  console.log('');
  console.log('📋 测试步骤：');
  console.log('1. 在 Chat 中输入一个任务（例如："创建一个简单的 HTML 页面"）');
  console.log('2. 等待 AI 开始工作');
  console.log('3. 观察 Console 输出');
  console.log('4. 脚本会自动检测 AI 停止并发送"继续"');
  console.log('');
  console.log('💡 提示：');
  console.log('  - 要停止测试，输入: stopTest()');
  console.log('  - 要手动发送"继续"，输入: sendContinue()');
  console.log('  - 要检查 Ralph 状态，输入: checkAIStatus()');
  console.log('');
  
  testInterval = setInterval(() => {
    checkCount++;
    
    console.log(`\n[检查 ${checkCount}] ${new Date().toLocaleTimeString()}`);
    
    // 检查 Ralph 状态
    const working = isAIWorking();
    console.log(`Ralph 状态: ${working ? '🔄 工作中' : '⏸️ 已停止'}`);
    
    if (working) {
      stableCount = 0;
      wasWorking = true;
    } else {
      stableCount++;
      console.log(`稳定计数: ${stableCount}/${CONFIG.stableCount}`);
      
      if (stableCount >= CONFIG.stableCount && wasWorking) {
        console.log('');
        console.log('✅ 检测到 AI 已停止');
        console.log('💡 准备发送"继续"...');
        
        if (sendMessage('查看 Ralph 开发进程 \n\n 继续')) {
          console.log('✅ 已发送"继续"消息');
          console.log('⏳ 等待 AI 恢复工作...');
          
          // 重置计数器
          stableCount = 0;
          wasWorking = false;
        } else {
          console.error('❌ 发送"继续"失败');
        }
      }
    }
  }, CONFIG.checkInterval);
}

// ============================================
// 工具函数导出到 Window
// ============================================

/**
 * 暴露工具到 window 对象
 */
function exposeTools() {
    window.stopTest = function() {
        if (testInterval) {
          clearInterval(testInterval);
          testInterval = null;
          console.log('⏹️ 测试已停止');
        } else {
          console.log('⚠️ 测试未运行');
        }
      };
      
      window.sendContinue = function() {
        console.log('💡 手动发送"继续"...');
        return sendMessage('继续');
      };
      
      window.checkAIStatus = function() {
        const working = isAIWorking();
        console.log(`当前 Ralph 状态: ${working ? '🔄 工作中' : '⏸️ 已停止'}`);
        return working;
      };
      
      window.testSelectors = function() {
        console.log('🧪 测试选择器...');
        console.log('');
        
        console.log('1. Chat 输入框:');
        const input = findChatInput();
        console.log(input ? '✅ 找到' : '❌ 未找到', input);
        
        console.log('');
        console.log('2. 发送按钮:');
        const button = findSendButton();
        console.log(button ? '✅ 找到' : '⚠️ 未找到（将使用回车）', button);
        
        console.log('');
        console.log('3. 加载指示器:');
        const loading = findElement(CONFIG.selectors.loading);
        console.log(loading ? '✅ 找到' : '⚠️ 未找到（AI 可能未工作）', loading);
        
        console.log('');
        console.log('4. Ralph 状态:');
        checkAIStatus();
      };
      
      window.testSendMessage = function(message = '测试消息') {
        console.log(`🧪 测试发送消息: "${message}"`);
        return sendMessage(message);
      };
}

(function() {
    console.log('🧪 测试 1：中断检测和自动继续');
    console.log('');

    console.log('');
    console.log('📖 可用命令：');
    console.log('  stopTest()           - 停止测试');
    console.log('  sendContinue()       - 手动发送"继续"');
    console.log('  checkAIStatus()      - 检查 Ralph 状态');
    console.log('  testSelectors()      - 测试所有选择器');
    console.log('  testSendMessage()    - 测试发送消息');
    console.log('');

    exposeTools();

    // 先测试选择器
    window.testSelectors();

    console.log('');
    console.log('='.repeat(50));

    // 启动测试
    startTest();
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startTest,
        exposeTools
    };
}
