/**
 * Trae Ralph Loop - 自定义场景：文件删除流程
 * 
 * 包含处理文件删除的完整流程：
 * 1. deleteFileCard: 点击卡片上的删除按钮
 * 2. deleteFileConfirm: 点击弹窗上的确认按钮
 */

module.exports = [
  {
    id: 'deleteFileCard',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '删除文件卡片',
    description: '自动点击删除文件卡片中的删除按钮',
    enabled: true,
    priority: 30, // 提高优先级，确保高于系统警告
    
    // 检测规则
    detection: {
      // 检测到未确认的删除文件卡片
      selectors: [
        '.icd-delete-files-command-card-v2-content.need-confirm',
        '.icd-delete-files-command-card-v2-actions-delete' // 增加对按钮直接检测
      ],
      lastTurnOnly: true
    },
    
    // 响应策略
    response: {
      action: 'click',
      target: '.icd-delete-files-command-card-v2-actions-delete',
      message: '点击删除按钮'
    }
  },
  {
    id: 'deleteFileConfirm',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '删除确认弹窗',
    description: '自动点击删除文件确认弹窗中的确认按钮',
    enabled: true,
    priority: 32, // 最高优先级，确保优先于通用高风险确认
    isConfirm: true, // 标记为确认类场景，允许在同一回复中二次触发
    
    // 检测规则
    detection: {
      // 检测到确认弹窗，且内容包含"删除"
      textCheck: {
        selector: '.confirm-popover-body',
        text: '删除',
        lastTurnOnly: false // 弹窗是全局 UI
      }
    },
    
    // 响应策略
    response: {
      action: 'click',
      // 使用通用选择器，配合 matchText 精确点击
      target: '.confirm-popover-body button',
      matchText: '确认', // 新增：仅点击文本包含"确认"的按钮
      message: '点击确认按钮'
    }
  }
];
