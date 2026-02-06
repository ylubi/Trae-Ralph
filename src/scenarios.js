/**
 * 中断场景检测器
 * 
 * 定义各种可能导致 AI 中断的场景及其检测逻辑
 */

const SCENARIOS = {
  // 场景 1: 上下文限制
  contextLimit: {
    name: '上下文限制',
    enabled: true,
    priority: 1,
    keywords: [
      '上下文窗口已满',
      'context window',
      '达到上下文限制',
      '上下文过长'
    ],
    selectors: [
      '[class*="context"][class*="limit"]',
      '[class*="context"][class*="warning"]'
    ],
    action: 'continue',
    message: '查看 Ralph 开发进程 \n\n 继续'
  },

  // 场景 2: 请求限制
  rateLimit: {
    name: '请求限制',
    enabled: true,
    priority: 1,
    keywords: [
      'rate limit',
      '请求过多',
      '请求限制',
      '稍后再试',
      'too many requests'
    ],
    selectors: [
      '[class*="rate"][class*="limit"]',
      '[class*="error"][class*="limit"]'
    ],
    action: 'wait',
    waitTime: 60000, // 等待 60 秒
    message: '查看 Ralph 开发进程 \n\n 继续'
  },

  // 场景 3: 交互式命令等待
  interactiveCommand: {
    name: '交互式命令',
    enabled: true,
    priority: 2,
    keywords: [
      '等待用户输入',
      'waiting for input',
      '请确认',
      '是否继续',
      'y/n',
      'yes/no'
    ],
    patterns: [
      /\(y\/n\)/i,
      /\[y\/n\]/i,
      /yes\/no/i,
      /请确认/,
      /是否继续/
    ],
    action: 'custom',
    responses: {
      default: 'y',
      patterns: [
        { match: /\(y\/n\)/i, response: 'y' },
        { match: /是否继续/, response: '是' }
      ]
    }
  },

  // 场景 4: 错误认定完成
  prematureCompletion: {
    name: '提前完成',
    enabled: true,
    priority: 3,
    keywords: [
      '已完成',
      'completed',
      'done',
      '任务完成'
    ],
    // 检测是否真的完成（通过检查是否还有待办事项）
    checkIncomplete: true,
    incompleteIndicators: [
      'TODO',
      'FIXME',
      '待完成',
      '未实现',
      '// ...',
      '...'
    ],
    action: 'continue',
    message: '请继续完成剩余部分'
  },

  // 场景 5: 需要用户确认
  needsConfirmation: {
    name: '需要确认',
    enabled: true,
    priority: 2,
    keywords: [
      '需要确认',
      '请确认',
      'confirm',
      '是否',
      '要不要'
    ],
    action: 'continue',
    message: '确认，继续'
  },

  // 场景 6: 等待文件操作
  fileOperation: {
    name: '文件操作',
    enabled: true,
    priority: 2,
    keywords: [
      '等待文件',
      'waiting for file',
      '文件未找到',
      'file not found'
    ],
    action: 'continue',
    message: '文件已准备好，继续'
  },

  // 场景 7: 长时间思考
  longThinking: {
    name: '长时间思考',
    enabled: true,
    priority: 4,
    // 检测 AI 停止但没有明确消息
    checkDuration: true,
    thinkingTime: 300000, // 300 秒 (5分钟)
    action: 'continue',
    message: '继续'
  },

  // 场景 8: 自定义场景（用户可配置）
  custom: {
    name: '自定义',
    enabled: false,
    priority: 5,
    keywords: [],
    patterns: [],
    action: 'continue',
    message: '继续'
  }
};

/**
 * 场景检测器类
 */
class ScenarioDetector {
  constructor(config = {}) {
    this.scenarios = { ...SCENARIOS };
    this.config = config;
    this.lastMessages = [];
    this.maxMessageHistory = 10;
  }

  /**
   * 更新场景配置
   */
  updateScenario(scenarioId, updates) {
    if (this.scenarios[scenarioId]) {
      this.scenarios[scenarioId] = {
        ...this.scenarios[scenarioId],
        ...updates
      };
    }
  }

  /**
   * 添加自定义场景
   */
  addCustomScenario(id, scenario) {
    this.scenarios[id] = {
      priority: 5,
      enabled: true,
      action: 'continue',
      ...scenario
    };
  }

  /**
   * 记录消息历史
   */
  recordMessage(message) {
    this.lastMessages.push({
      text: message,
      timestamp: Date.now()
    });
    
    if (this.lastMessages.length > this.maxMessageHistory) {
      this.lastMessages.shift();
    }
  }

  /**
   * 检测关键词
   */
  detectKeywords(text, keywords) {
    if (!keywords || keywords.length === 0) return false;
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * 检测正则模式
   */
  detectPatterns(text, patterns) {
    if (!patterns || patterns.length === 0) return false;
    
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * 检测场景
   */
  detectScenario(context) {
    const {
      lastMessage = '',
      chatContent = '',
      isWorking = false,
      stoppedDuration = 0
    } = context;

    // 记录消息
    if (lastMessage) {
      this.recordMessage(lastMessage);
    }

    // 获取启用的场景并按优先级排序
    const enabledScenarios = Object.entries(this.scenarios)
      .filter(([_, scenario]) => scenario.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    // 检测每个场景
    for (const [id, scenario] of enabledScenarios) {
      let detected = false;
      let matchInfo = null;

      // 关键词检测
      if (scenario.keywords && scenario.keywords.length > 0) {
        const textToCheck = lastMessage || chatContent;
        if (this.detectKeywords(textToCheck, scenario.keywords)) {
          detected = true;
          matchInfo = { type: 'keyword', scenario: id };
        }
      }

      // 正则模式检测
      if (!detected && scenario.patterns && scenario.patterns.length > 0) {
        const textToCheck = lastMessage || chatContent;
        if (this.detectPatterns(textToCheck, scenario.patterns)) {
          detected = true;
          matchInfo = { type: 'pattern', scenario: id };
        }
      }

      // 选择器检测
      if (!detected && scenario.selectors && scenario.selectors.length > 0) {
        for (const selector of scenario.selectors) {
          if (document.querySelector(selector)) {
            detected = true;
            matchInfo = { type: 'selector', scenario: id, selector };
            break;
          }
        }
      }

      // 时长检测
      if (!detected && scenario.checkDuration && !isWorking) {
        if (stoppedDuration >= (scenario.thinkingTime || 30000)) {
          detected = true;
          matchInfo = { type: 'duration', scenario: id };
        }
      }

      // 未完成检测
      if (detected && scenario.checkIncomplete) {
        const hasIncomplete = scenario.incompleteIndicators.some(indicator =>
          chatContent.includes(indicator)
        );
        if (!hasIncomplete) {
          detected = false; // 没有未完成标记，不触发
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

  /**
   * 获取响应消息
   */
  getResponse(scenarioId, context = {}) {
    const scenario = this.scenarios[scenarioId];
    if (!scenario) return '继续';

    if (scenario.action === 'custom' && scenario.responses) {
      // 检查模式匹配
      if (scenario.responses.patterns) {
        for (const pattern of scenario.responses.patterns) {
          if (pattern.match.test(context.lastMessage || '')) {
            return pattern.response;
          }
        }
      }
      return scenario.responses.default || '继续';
    }

    return scenario.message || '继续';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS, ScenarioDetector };
}
