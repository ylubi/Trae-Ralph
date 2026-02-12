/**
 * @file utils.js
 * @description 辅助工具函数模块
 * 
 * 提供通用的、无业务逻辑耦合的工具函数。
 * 
 * 主要功能：
 * - 基础 DOM 查找 (findElement)
 * - 时间格式解析 (parseTime)
 * - 颜色计算与处理 (主题自适应相关)
 * 
 * 主要导出函数：
 * - findElement
 * - parseTime
 * - _detectThemeBaseColor
 * - _brightness
 */

/**
 * 根据选择器列表查找第一个匹配的元素
 * @param {string[]} selectors CSS选择器数组
 * @param {boolean} [findAll=false] 是否查找所有匹配的元素 (默认 false，仅返回第一个)
 * @returns {HTMLElement|HTMLElement[]|null} 找到的元素(或元素数组)或null
 */
function findElement(selectors, findAll = false) {
  if (findAll) {
    let allElements = [];
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          allElements = allElements.concat(Array.from(elements));
        }
      } catch (error) {
        // 忽略无效选择器
      }
    }
    return allElements.length > 0 ? allElements : null;
  }

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

/**
 * 解析时间字符串为毫秒数
 * @param {string|number} timeStr 时间字符串(如 "5s", "1m")或毫秒数
 * @returns {number} 毫秒数
 */
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

/**
 * 检测主题基准颜色
 * @private
 * @returns {{r: number, g: number, b: number}} RGB颜色对象
 */
function _detectThemeBaseColor() {
    // 尝试从 body 背景色判断
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 30, g: 30, b: 30 }; // 默认深色
}

/**
 * 计算颜色的亮度值
 * @param {{r: number, g: number, b: number}} rgb RGB颜色对象
 * @returns {number} 亮度值
 */
function _brightness(rgb) {
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

module.exports = {
    findElement,
    parseTime,
    _detectThemeBaseColor,
    _brightness
};
