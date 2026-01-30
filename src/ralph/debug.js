/**
 * @file debug.js
 * @description 调试与 UI 控制模块
 * 
 * 该模块负责向页面注入调试工具和 UI 控制元素：
 * - 注入“开启/停止 Ralph”悬浮按钮
 * - 处理按钮拖拽和主题自适应样式
 * - 向 window 对象暴露调试 API (window.traeRalph)
 * 
 * 主要导出函数：
 * - addToggleButton: 添加悬浮控制按钮
 * - exposeDebugTools: 暴露调试工具到全局
 * - applyThemeStyles: 应用主题样式
 */

const { CONFIG } = require('./config');
const { startLoop, stopLoop, toggleLoop } = require('./main'); // 需要确保循环引用被正确处理
const { sendMessage } = require('./actions');
const { _detectThemeBaseColor, _brightness } = require('./utils');

// 这里可能存在循环依赖，需要小心处理
// 在浏览器环境中，这些函数会挂载到 window 对象上

/**
 * 应用主题样式到按钮
 * @param {HTMLElement} btn 按钮元素
 */
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

/**
 * 向界面添加 Ralph 开关按钮
 */
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
    btn.setAttribute('data-state', window._ralphLoopInterval ? 'running' : 'stopped');
    btn.textContent = window._ralphLoopInterval ? '停止 Ralph' : '开启 Ralph';
    applyThemeStyles(btn);
    btn.addEventListener('click', () => {
        if (window.toggleRalphLoop) {
            window.toggleRalphLoop();
        } else {
            console.error('toggleRalphLoop not defined');
        }
    });
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

/**
 * 暴露调试工具到全局 window 对象
 * @param {ScenarioDetector} detector 场景检测器实例
 */
function exposeDebugTools(detector) {
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
            console.log(`场景 ${scenarioId} 已${enabled ? '启用' : '禁用'}`);
        }
      };

      // 暴露控制函数到 window
      window.stopLoop = stopLoop;
      window.startRalphLoop = startLoop;
      window.toggleRalphLoop = toggleLoop;
}

module.exports = {
    addToggleButton,
    exposeDebugTools
};
