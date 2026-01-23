/**
 * Trae Ralph Loop CDP - 场景加载器
 * 
 * 自动加载内置场景和自定义场景，生成浏览器端配置
 * 
 * 功能：
 * - 自动加载 scenarios/builtin/ 中的内置场景
 * - 自动加载 scenarios/custom/ 中的自定义场景
 * - 生成浏览器端场景配置
 * - 场景查询和过滤
 * - 场景验证
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const fs = require('fs');
const path = require('path');

/**
 * 加载场景文件
 */
function loadScenarios() {
  const scenarios = {};
  
  // 加载内置场景
  const builtinDir = path.join(__dirname, 'builtin');
  if (fs.existsSync(builtinDir)) {
    const builtinFiles = fs.readdirSync(builtinDir)
      .filter(file => file.endsWith('.js'));
    
    for (const file of builtinFiles) {
      try {
        const scenario = require(path.join(builtinDir, file));
        if (scenario.id) {
          scenarios[scenario.id] = {
            ...scenario,
            source: 'builtin',
            file: file
          };
        }
      } catch (error) {
        console.error(`加载内置场景失败: ${file}`, error);
      }
    }
  }
  
  // 加载自定义场景
  const customDir = path.join(__dirname, 'custom');
  if (fs.existsSync(customDir)) {
    const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.js'));
    
    for (const file of customFiles) {
      try {
        const scenario = require(path.join(customDir, file));
        if (scenario.id) {
          scenarios[scenario.id] = {
            ...scenario,
            source: 'custom',
            file: file
          };
        }
      } catch (error) {
        console.error(`加载自定义场景失败: ${file}`, error);
      }
    }
  }
  
  return scenarios;
}

/**
 * 获取场景列表
 */
function getScenarioList() {
  const scenarios = loadScenarios();
  return Object.values(scenarios).sort((a, b) => a.priority - b.priority);
}

/**
 * 获取启用的场景
 */
function getEnabledScenarios() {
  const scenarios = loadScenarios();
  return Object.values(scenarios)
    .filter(s => s.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 获取单个场景
 */
function getScenario(id) {
  const scenarios = loadScenarios();
  return scenarios[id];
}

/**
 * 生成浏览器端场景配置
 */
function generateBrowserConfig() {
  const scenarios = loadScenarios();
  const config = {};
  
  for (const [id, scenario] of Object.entries(scenarios)) {
    config[id] = {
      name: scenario.name,
      enabled: scenario.enabled,
      priority: scenario.priority,
      keywords: scenario.detection?.keywords || [],
      patterns: scenario.detection?.patterns?.map(p => p.source) || [],
      selectors: scenario.detection?.selectors || [],
      checkDuration: scenario.detection?.checkDuration || false,
      thinkingTime: scenario.detection?.thinkingTime,
      checkIncomplete: scenario.detection?.checkIncomplete || false,
      incompleteIndicators: scenario.detection?.incompleteIndicators || [],
      action: scenario.response?.action || 'continue',
      message: scenario.response?.message || '继续',
      waitTime: scenario.response?.waitTime,
      responses: scenario.response?.responses
    };
  }
  
  return config;
}

module.exports = {
  loadScenarios,
  getScenarioList,
  getEnabledScenarios,
  getScenario,
  generateBrowserConfig
};
