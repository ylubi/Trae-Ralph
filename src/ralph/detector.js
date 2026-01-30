/**
 * @file detector.js
 * @description 场景检测核心模块
 * 
 * 该模块实现了 ScenarioDetector 类，负责：
 * - 维护聊天上下文历史
 * - 根据配置的规则 (Scenarios) 匹配当前场景
 * - 处理场景优先级和触发频率限制
 * - 生成场景响应内容 (支持模板变量替换)
 * 
 * 主要导出类：
 * - ScenarioDetector: 场景检测器类
 *   - detect: 执行检测
 *   - recordMessage: 记录历史消息
 *   - getResponse: 获取响应内容
 */

const { CONFIG } = require('./config');
const { 
    getLastAssistantReplyElement, 
    getLastAssistantTurnElement, 
    getChatContent, 
    getLastMessage 
} = require('./dom');

/**
 * 场景检测器类
 * 负责根据聊天内容、DOM 状态和时间等上下文，匹配并触发相应的场景
 */
class ScenarioDetector {
    constructor() {
      this.lastMessages = [];
      this.maxHistory = 10;
      this.lastTriggeredAt = {};
      this.lastGroupTriggeredAt = {};
    }

    /**
     * 重置检测器状态
     */
    reset() {
      this.lastMessages = [];
      this.lastTriggeredAt = {};
      this.lastGroupTriggeredAt = {};
      console.log('🧹 场景检测器状态已重置');
    }
    
    /**
     * 记录历史消息
     * @param {string} message 消息内容
     */
    recordMessage(message) {
      this.lastMessages.push({
        text: message,
        timestamp: Date.now()
      });
      if (this.lastMessages.length > this.maxHistory) {
        this.lastMessages.shift();
      }
    }

    /**
     * 标记场景为已触发
     * @param {string} scenarioId 场景ID
     */
    markTriggered(scenarioId) {
        this.lastTriggeredAt[scenarioId] = Date.now();
        const scenario = CONFIG.scenarios[scenarioId];
        if (scenario && scenario.group) {
            this.lastGroupTriggeredAt[scenario.group] = Date.now();
        }
    }
    
    /**
     * 检测文本是否包含关键词
     * @param {string} text 待检测文本
     * @param {string[]} keywords 关键词数组
     * @returns {boolean} 是否包含任一关键词
     */
    detectKeywords(text, keywords) {
      if (!keywords || keywords.length === 0) return false;
      const lowerText = text.toLowerCase();
      return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }
    
    /**
     * 检测文本是否匹配正则模式
     * @param {string} text 待检测文本
     * @param {(string|RegExp)[]} patterns 正则模式数组
     * @returns {boolean} 是否匹配任一模式
     */
    detectPatterns(text, patterns) {
      if (!patterns || patterns.length === 0) return false;
      return patterns.some(pattern => {
        try {
          if (typeof pattern === 'string') {
            return new RegExp(pattern, 'i').test(text);
          }
          return pattern.test(text);
        } catch (e) {
          console.error('正则匹配错误:', e);
          return false;
        }
      });
    }

    /**
     * 检查场景冷却状态
     * @param {Object} scenario 场景配置
     * @param {string} id 场景ID
     * @returns {boolean} 是否处于冷却中
     */
    isCooldownActive(scenario, id) {
        // 1. 组冷却
        if (scenario.group) {
            const lastGroupTime = this.lastGroupTriggeredAt[scenario.group] || 0;
            const groupCooldown = scenario.groupCooldown || 30000;
            if (Date.now() - lastGroupTime < groupCooldown) {
                return true;
            }
        }
        // 2. 单场景冷却
        if (scenario.cooldown) {
            const lastTime = this.lastTriggeredAt[id] || 0;
            if (Date.now() - lastTime < scenario.cooldown) {
                return true;
            }
        }
        return false;
    }

    /**
     * 执行文本检查 (TextCheck)
     * @param {Object} d 检测配置
     * @returns {Object|null} 匹配结果
     */
    checkText(d) {
        if (!d.textCheck) return null;
        
        const { selector, text, pattern, lastTurnOnly } = d.textCheck;
        const useScope = lastTurnOnly !== false;
        let elements = [];
        
        if (useScope) {
            const scope = getLastAssistantReplyElement() || getLastAssistantTurnElement();
            if (scope) {
                elements = Array.from(scope.querySelectorAll(selector));
            }
            if (elements.length === 0) {
                const turn = getLastAssistantTurnElement();
                if (turn) elements = Array.from(turn.querySelectorAll(selector));
            }
        } else {
            elements = Array.from(document.querySelectorAll(selector));
        }

        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            const content = el.textContent || '';
            let isMatch = false;
            
            if (text && content.includes(text)) {
                isMatch = true;
            } else if (pattern) {
                try {
                    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                    if (regex.test(content)) {
                        isMatch = true;
                    }
                } catch(e) { console.error('正则匹配错误:', e); }
            }
            
            if (isMatch) {
                return { type: 'textCheck', element: el };
            }
        }
        return null;
    }

    /**
     * 执行选择器检查
     * @param {Object} d 检测配置
     * @param {string} id 场景ID
     * @returns {Object|null} 匹配结果
     */
    checkSelectors(d, id) {
        if (!d.selectors || d.selectors.length === 0) return null;

        const scope = getLastAssistantReplyElement() || getLastAssistantTurnElement();
        if (scope) {
            for (const sel of d.selectors) {
                const foundEl = scope.querySelector(sel);
                if (foundEl) {
                    return { type: 'selector', element: foundEl };
                }
            }
        }
        return null;
    }

    /**
     * 执行时长检查
     * @param {Object} scenario 场景配置
     * @param {string} id 场景ID
     * @param {number} stoppedDuration 停止时长
     * @returns {Object|null} 匹配结果
     */
    checkDuration(scenario, id, stoppedDuration) {
        if (!scenario.checkDuration) return null;
        if (stoppedDuration < (scenario.thinkingTime || 30000)) return null;

        // 如果配置了 textCheck，需同时满足
        if (scenario.detection && scenario.detection.textCheck) {
            const textMatch = this.checkText(scenario.detection);
            if (textMatch) {
                return { type: 'duration' };
            }
        } else {
            return { type: 'duration' };
        }
        return null;
    }

    /**
     * 评估单个场景是否匹配
     * @param {Object} scenario 场景配置
     * @param {string} id 场景ID
     * @param {Object} context 上下文
     * @returns {Object|null} 匹配结果
     */
    evaluateScenario(scenario, id, context) {
        const d = scenario.detection || scenario;
        const { lastMessage, chatContent, stoppedDuration } = context;

        // 1. TextCheck
        const textMatch = this.checkText(d);
        if (textMatch) return { type: 'textCheck', scenario: id, element: textMatch.element };

        // 2. Selectors
        const selectorMatch = this.checkSelectors(d, id);
        if (selectorMatch) return { type: 'selector', scenario: id, element: selectorMatch.element };

        // 3. Keywords
        if (d.keywords) {
             const text = lastMessage || chatContent;
             if (this.detectKeywords(text, d.keywords)) {
                 return { type: 'keyword', scenario: id };
             }
        }

        // 4. Patterns
        if (d.patterns) {
             const text = lastMessage || chatContent;
             if (this.detectPatterns(text, d.patterns)) {
                 return { type: 'pattern', scenario: id };
             }
        }

        // 5. Duration
        const durationMatch = this.checkDuration(scenario, id, stoppedDuration);
        if (durationMatch) return { type: 'duration', scenario: id };

        return null;
    }
    
    /**
     * 执行场景检测
     * @param {Object} context 上下文 (lastMessage, chatContent, stoppedDuration, hasEverWorked)
     * @returns {Object} 检测结果 { detected, scenario, scenarioConfig, matchInfo, priority }
     */
    detect(context) {
      const { lastMessage, chatContent, stoppedDuration, hasEverWorked } = context;
      
      if (lastMessage) {
        this.recordMessage(lastMessage);
      }
      
      const enabledScenarios = Object.entries(CONFIG.scenarios)
        .filter(([_, s]) => s.enabled);
      
      const matches = [];

      for (const [id, scenario] of enabledScenarios) {
        if (this.isCooldownActive(scenario, id)) continue;

        if (scenario.requiresActiveHistory && !hasEverWorked) continue;
        
        const matchInfo = this.evaluateScenario(scenario, id, context);
        
        if (matchInfo) {
             // 未完成检测
            if (scenario.checkIncomplete) {
                const hasIncomplete = scenario.incompleteIndicators.some(ind =>
                    chatContent.includes(ind)
                );
                if (!hasIncomplete) continue;
            }

            matches.push({
                detected: true,
                scenario: id,
                scenarioConfig: scenario,
                matchInfo,
                priority: scenario.priority
            });
        }
      }

      if (matches.length > 0) {
          matches.sort((a, b) => b.priority - a.priority);
          
          if (matches.length > 1) {
              console.log(`🔎 检测到 ${matches.length} 个候选场景:`);
              matches.forEach(m => console.log(`   - ${m.scenarioConfig.name} (P:${m.priority})`));
              console.log(`👉 选择优先级最高的: ${matches[0].scenarioConfig.name}`);
          }
          
          return matches[0];
      }
      
      return { detected: false };
    }
    
    /**
     * 获取场景的响应消息
     * @param {string} scenarioId 场景ID
     * @param {Object} context 上下文
     * @returns {string} 响应消息
     */
    getResponse(scenarioId, context) {
      const scenario = CONFIG.scenarios[scenarioId];
      if (!scenario) return '继续';
      
      if (scenario.action === 'custom' && scenario.responses) {
        return scenario.responses.default || '继续';
      }
      
      return scenario.message || '继续';
    }
  }

module.exports = {
    ScenarioDetector
};
