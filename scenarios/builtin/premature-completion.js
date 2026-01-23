/**
 * Trae Ralph Loop CDP - 内置场景：提前完成
 * 
 * 检测 AI 错误地认为任务已完成，但实际还有未完成部分
 * 
 * 检测方式：
 * - 关键词匹配：已完成、completed、done、任务完成 等
 * - 未完成指示器检测：TODO、FIXME、待完成、未实现、WIP 等
 * 
 * 响应策略：
 * - 自动发送"请继续完成剩余部分"命令
 * 
 * 优先级：3（中）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'prematureCompletion',
  name: '提前完成',
  description: '检测 AI 错误认为任务完成但还有未完成部分',
  enabled: true,
  priority: 3,
  
  // 检测规则
  detection: {
    keywords: [
      '已完成',
      'completed',
      'done',
      '任务完成',
      'finished'
    ],
    // 检查是否真的完成
    checkIncomplete: true,
    incompleteIndicators: [
      'TODO',
      'FIXME',
      'HACK',
      'XXX',
      '待完成',
      '未实现',
      '// ...',
      '...',
      'WIP',
      'work in progress'
    ]
  },
  
  // 响应策略
  response: {
    action: 'continue',
    message: '请继续完成剩余部分'
  }
};
