// ============================================
// Trae Ralph Loop - 辅助工具函数
// ============================================

function findElement(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch (error) {
      // 忽略无效选择器
    }
  }
  return null;
}

function parseTime(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr) return 0;
    
    const unit = timeStr.slice(-1).toLowerCase();
    const val = parseInt(timeStr, 10);
    
    if (unit === 's') return val * 1000;
    if (unit === 'm') return val * 60000;
    if (unit === 'h') return val * 3600000;
    return val;
}

function _detectThemeBaseColor() {
    // 尝试从 body 背景色判断
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 30, g: 30, b: 30 }; // 默认深色
}

function _brightness(rgb) {
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

module.exports = {
    findElement,
    parseTime,
    _detectThemeBaseColor,
    _brightness
};
