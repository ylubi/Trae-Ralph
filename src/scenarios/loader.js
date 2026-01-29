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
        const loaded = require(path.join(builtinDir, file));
        
        const registerScenario = (scenario) => {
          if (scenario.id) {
            scenarios[scenario.id] = {
              ...scenario,
              source: 'builtin',
              file: file
            };
          }
        };

        if (Array.isArray(loaded)) {
          loaded.forEach(registerScenario);
        } else {
          registerScenario(loaded);
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
        const loaded = require(path.join(customDir, file));
        
        const registerScenario = (scenario) => {
          if (scenario.id) {
            scenarios[scenario.id] = {
              ...scenario,
              source: 'custom',
              file: file
            };
          }
        };

        if (Array.isArray(loaded)) {
          loaded.forEach(registerScenario);
        } else {
          registerScenario(loaded);
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
    // 构造 detection 对象
    const detection = scenario.detection ? { ...scenario.detection } : {
        keywords: scenario.keywords || [],
        patterns: scenario.patterns || [],
        selectors: scenario.selectors || [],
        checkDuration: scenario.checkDuration || false,
        thinkingTime: scenario.thinkingTime,
        checkIncomplete: scenario.checkIncomplete || false,
        incompleteIndicators: scenario.incompleteIndicators || []
    };

    // 处理正则对象序列化
    if (detection.patterns) {
        detection.patterns = detection.patterns.map(p => p instanceof RegExp ? p.source : p);
    }
    if (detection.textCheck && detection.textCheck.pattern instanceof RegExp) {
        detection.textCheck.pattern = detection.textCheck.pattern.source;
    }

    config[id] = {
      name: scenario.name,
      enabled: scenario.enabled,
      priority: scenario.priority,
      requiresActiveHistory: scenario.requiresActiveHistory || false,
      detection: detection,
      
      // 扁平化兼容 (将被废弃，但为了保险保留)
      keywords: detection.keywords,
      patterns: detection.patterns,
      selectors: detection.selectors,
      checkDuration: detection.checkDuration,
      thinkingTime: detection.thinkingTime,
      checkIncomplete: detection.checkIncomplete,
      incompleteIndicators: detection.incompleteIndicators,

      // Response 配置
      action: scenario.response?.action || scenario.action || 'continue',
      handler: scenario.response?.handler || scenario.handler,
      target: scenario.response?.target || scenario.target,
      message: scenario.response?.message || scenario.message || '继续',
      waitTime: scenario.response?.waitTime || scenario.waitTime,
      responses: scenario.response?.responses || scenario.responses
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
