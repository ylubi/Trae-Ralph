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

const LOG_PREFIX = '[trae-ralph]';

function rlog(...args) {
  console.log(LOG_PREFIX, ...args);
}

function rwarn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

function rerror(...args) {
  console.error(LOG_PREFIX, ...args);
}

// 这里可能存在循环依赖，需要小心处理
// 在浏览器环境中，这些函数会挂载到 window 对象上

/**
 * 应用主题样式到按钮
 * @param {HTMLElement} btn 按钮元素
 */
function applyThemeStyles(btn) {
  try {
    const rgb = _detectThemeBaseColor();
    const bright = _brightness(rgb);
    const isDark = bright < 128;
    const styles = isDark
      ? { bg: '#2b2b2b', fg: '#ffffff', bd: '#666666' }
      : { bg: '#f5f5f5', fg: '#222222', bd: '#cccccc' };
    btn.style.background = styles.bg;
    btn.style.color = styles.fg;
    btn.style.border = `1px solid ${styles.bd}`;
  } catch (error) {
    btn.style.background = '#2b2b2b';
    btn.style.color = '#ffffff';
    btn.style.border = '1px solid #666666';
  }
}

/**
 * 向界面添加 Ralph 开关按钮 (带重试机制)
 */
function addToggleButton() {
  const mountState = {
    observer: null,
    retryInterval: null,
    themeInterval: null,
    mountMode: '',
    ensureInterval: null
  };

  const findMountContainer = () => {
    const selectors = [
      '.left-l',
      '[class*="chat"][class*="header"]',
      '[class*="top-bar"]',
      '[class*="toolbar"]',
      '[class*="header"]'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return { container: el, mode: 'header' };
      }
    }
    return { container: null, mode: 'none' };
  };

  const bindThemeWatcher = (btn) => {
    if (mountState.themeInterval) {
      clearInterval(mountState.themeInterval);
      mountState.themeInterval = null;
    }
    let lastThemeKey = '';
    mountState.themeInterval = setInterval(() => {
      if (!btn || !btn.isConnected) {
        return;
      }
      const rgb = _detectThemeBaseColor();
      const key = `${rgb.r},${rgb.g},${rgb.b}`;
      if (key !== lastThemeKey) {
        lastThemeKey = key;
        applyThemeStyles(btn);
      }
    }, 2000);
  };

  const ensureButtonMounted = () => {
    const mount = findMountContainer();
    const container = mount.container;
    if (!container) {
      return false;
    }

    let btn = document.querySelector('.trae-ralph-toggle-button');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'trae-ralph-toggle-button';
      btn.type = 'button';
      btn.style.marginLeft = '8px';
      btn.style.padding = '4px 8px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '500';
      btn.style.zIndex = '2147483647';
      btn.style.pointerEvents = 'auto';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.toggleRalphLoop) {
          window.toggleRalphLoop();
        } else {
          rerror('toggleRalphLoop not defined');
        }
      });
      rlog('✅ Ralph 按钮注入成功');
    }

    btn.style.setProperty('position', 'relative', 'important');
    btn.style.setProperty('right', 'auto', 'important');
    btn.style.setProperty('bottom', 'auto', 'important');
    btn.style.setProperty('left', 'auto', 'important');
    btn.style.setProperty('top', 'auto', 'important');
    btn.style.setProperty('display', 'inline-flex', 'important');
    btn.style.setProperty('align-items', 'center', 'important');
    btn.style.setProperty('justify-content', 'center', 'important');
    btn.style.setProperty('margin-left', '8px', 'important');
    btn.style.setProperty('margin', '0 0 0 8px', 'important');
    btn.style.setProperty('padding', '4px 10px', 'important');
    btn.style.setProperty('border-radius', '6px', 'important');
    btn.style.setProperty('box-shadow', 'none', 'important');
    btn.style.setProperty('opacity', '1', 'important');
    btn.style.setProperty('visibility', 'visible', 'important');
    btn.style.setProperty('z-index', '10', 'important');

    if (btn.parentElement !== container) {
      container.appendChild(btn);
    }

    btn.setAttribute('data-state', window._ralphLoopInterval ? 'running' : 'stopped');
    btn.textContent = window._ralphLoopInterval ? '停止 Ralph' : '开启 Ralph';
    applyThemeStyles(btn);
    window.$ralphToggleBtn = btn;
    if (mountState.mountMode !== 'header') {
      mountState.mountMode = 'header';
      rlog('📌 Ralph 挂载容器: header-container');
    }
    bindThemeWatcher(btn);
    return true;
  };

  const tryAdd = () => {
    try {
      return ensureButtonMounted();
    } catch(e) {
        rerror('注入按钮失败:', e);
        return false;
    }
  };

  window.ensureRalphToggleButton = () => {
    return tryAdd();
  };

  window.waitForRalphToggleButton = () => {
    if (mountState.ensureInterval) {
      clearInterval(mountState.ensureInterval);
      mountState.ensureInterval = null;
    }
    let ticks = 0;
    mountState.ensureInterval = setInterval(() => {
      ticks++;
      const ok = tryAdd();
      if (ok || ticks >= 180) {
        clearInterval(mountState.ensureInterval);
        mountState.ensureInterval = null;
      }
    }, 1000);
    return true;
  };

  // 初始尝试
  if (tryAdd()) return;

  // 轮询重试 (最多尝试 30 秒)
  let attempts = 0;
  const maxAttempts = 180;
  const interval = setInterval(() => {
      attempts++;
      if (tryAdd() || attempts >= maxAttempts) {
          clearInterval(interval);
          mountState.retryInterval = null;
          if (attempts >= maxAttempts) {
              rwarn('❌ Ralph 按钮注入超时：未找到 header 容器');
          }
      }
  }, 1000);
  mountState.retryInterval = interval;

  if (!window.__ralphToggleObserver__) {
    const observer = new MutationObserver(() => {
      if (!window.$ralphToggleBtn || !window.$ralphToggleBtn.isConnected) {
        tryAdd();
      }
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
    mountState.observer = observer;
    window.__ralphToggleObserver__ = observer;
  }
}

/**
 * 暴露调试工具到全局 window 对象
 */
function exposeDebugTools() {
    window.listTasks = function() {
        if (window.taskManager) {
            rlog('📋 当前任务列表:');
            window.taskManager.tasks.forEach((task, id) => {
                rlog(`[${id}] ${task.type} - ${task.status}`);
            });
        } else {
            rlog('❌ TraeAgentTaskManager 未初始化');
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
