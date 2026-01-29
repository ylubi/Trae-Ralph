// ============================================
// Trae Ralph Loop - 场景检测器
// ============================================

const { CONFIG } = require('./config');
const { 
    getLastAssistantReplyElement, 
    getLastAssistantTurnElement, 
    getChatContent, 
    getLastMessage 
} = require('./dom');

class ScenarioDetector {
    constructor() {
      this.lastMessages = [];
      this.maxHistory = 10;
      this.lastTriggeredAt = {};
      this.lastGroupTriggeredAt = {};
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

    markTriggered(scenarioId) {
        this.lastTriggeredAt[scenarioId] = Date.now();
        const scenario = CONFIG.scenarios[scenarioId];
        if (scenario && scenario.group) {
            this.lastGroupTriggeredAt[scenario.group] = Date.now();
        }
    }
    
    detectKeywords(text, keywords) {
      if (!keywords || keywords.length === 0) return false;
      const lowerText = text.toLowerCase();
      return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }
    
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
    
    detect(context) {
      const { lastMessage, chatContent, stoppedDuration, hasEverWorked } = context;
      
      if (lastMessage) {
        this.recordMessage(lastMessage);
      }
      
      const enabledScenarios = Object.entries(CONFIG.scenarios)
        .filter(([_, s]) => s.enabled);
      
      const matches = [];

      for (const [id, scenario] of enabledScenarios) {
        // 检查组冷却时间
        if (scenario.group) {
            const lastGroupTime = this.lastGroupTriggeredAt[scenario.group] || 0;
            const groupCooldown = scenario.groupCooldown || 30000; // 默认组冷却 30秒
            if (Date.now() - lastGroupTime < groupCooldown) {
                continue;
            }
        }

        // 检查单场景冷却时间
        if (scenario.cooldown) {
            const lastTime = this.lastTriggeredAt[id] || 0;
            const now = Date.now();
            if (now - lastTime < scenario.cooldown) {
                continue;
            }
        }

        let detected = false;
        let matchInfo = null;
        
        // 兼容 detection 对象配置
        const d = scenario.detection || scenario;

        // 历史状态检测 (新增)
        if (scenario.requiresActiveHistory && !hasEverWorked) {
          continue;
        }
        
            // 1. 文本检查 (TextCheck) - 高精度
        if (d.textCheck) {
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
                    if (turn) {
                        elements = Array.from(turn.querySelectorAll(selector));
                    }
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
                    detected = true;
                    matchInfo = { type: 'textCheck', scenario: id, element: el };
                    break;
                }
            }
        }

        // 2. 选择器检测
        if (!detected && d.selectors && d.selectors.length > 0) {
            // 强制限制在最新的回复中查找
            const scope = getLastAssistantReplyElement() || getLastAssistantTurnElement();

            if (scope) {
                // 对于数组中的任意一个选择器，只要在 scope 内找到匹配即可
                for (const sel of d.selectors) {
                    const foundEl = scope.querySelector(sel);
                    if (foundEl) {
                        detected = true;
                        matchInfo = { type: 'selector', scenario: id, element: foundEl };
                        break;
                    }
                }
            }
        }
        
        // 3. 关键词检测
        if (!detected && d.keywords) {
          const text = lastMessage || chatContent;
          if (this.detectKeywords(text, d.keywords)) {
            detected = true;
            matchInfo = { type: 'keyword', scenario: id };
          }
        }
        
        // 4. 正则检测
        if (!detected && d.patterns) {
          const text = lastMessage || chatContent;
          if (this.detectPatterns(text, d.patterns)) {
            detected = true;
            matchInfo = { type: 'pattern', scenario: id };
          }
        }
        
        // 时长检测
        if (!detected && scenario.checkDuration) {
          if (stoppedDuration >= (scenario.thinkingTime || 30000)) {
            // 对于 checkDuration 类型的场景，如果配置了 textCheck，需要同时满足文本条件
            if (scenario.detection && scenario.detection.textCheck) {
                const { selector, text, pattern, lastTurnOnly } = scenario.detection.textCheck;
                const useScope = lastTurnOnly !== false;
                let scope = null;
                if (useScope) {
                    scope = getLastAssistantReplyElement();
                    if (!scope) scope = getLastAssistantTurnElement();
                }
                const elements = scope ? Array.from(scope.querySelectorAll(selector)) : Array.from(document.querySelectorAll(selector));
                
                let textMatch = false;
                for (const el of elements) {
                    const content = el.textContent || '';
                    if (text && content.includes(text)) {
                        textMatch = true;
                        break;
                    } else if (pattern) {
                        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                        if (regex.test(content)) {
                            textMatch = true;
                            break;
                        }
                    }
                }
                
                if (textMatch) {
                    detected = true;
                    matchInfo = { type: 'duration', scenario: id };
                }
            } else {
                // 没有额外的文本检查条件，直接基于时间触发
                detected = true;
                matchInfo = { type: 'duration', scenario: id };
            }
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
          matches.push({
            detected: true,
            scenario: id,
            scenarioConfig: scenario,
            matchInfo,
            priority: scenario.priority
          });
        }
      } // end for

      if (matches.length > 0) {
          // 按优先级降序排序
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
