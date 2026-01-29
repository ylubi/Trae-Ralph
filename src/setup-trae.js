/**
 * Trae Ralph Loop - Trae 配置设置工具
 * 
 * 功能：
 * - 将 .trae-templates/ 目录的内容复制到目标项目的 .trae/ 目录
 * - 支持完整复制或选择性复制（仅 rules 或仅 skills）
 * - 支持强制覆盖模式
 * - 提供友好的交互式界面
 * - 保持目录结构和文件名不变
 * 
 * 复制内容：
 * - rules/      - 开发规范（Trae IDE 自动读取）
 * - skills/     - Agent Skills（符合 Anthropic 开放标准）
 * - workflows/  - 工作流程文档（如果存在）
 * - reference/  - 参考实现文档（如果存在）
 * - README.md   - 总览文档
 * 
 * 使用方法：
 *   trae-ralph setup-trae
 *   trae-ralph setup-trae --path /path/to/project
 *   trae-ralph setup-trae --rules-only
 *   trae-ralph setup-trae --skills-only
 *   trae-ralph setup-trae --force
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { colors, CONFIG } = require('./setup/constants');
const { askQuestion } = require('./setup/utils');
const { parseArguments } = require('./setup/cli');
const { createReport, generateDeploymentReport } = require('./setup/reports');
const { validateTemplate } = require('./setup/validate');
const { 
  copyTraeConfig, 
  updateTraeConfig, 
  runSelfTest 
} = require('./setup/deploy');

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Trae Ralph Loop - Trae 配置设置工具              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // 解析命令行参数
  const options = parseArguments();

  // 验证模板目录
  if (!fs.existsSync(CONFIG.templateDir)) {
    console.error(`${colors.red}错误：模板目录不存在: ${CONFIG.templateDir}${colors.reset}`);
    console.error(`${colors.yellow}提示：请确保 trae-ralph 已正确安装${colors.reset}`);
    process.exit(1);
  }

  if (options.validateOnly) {
    const report = createReport();
    validateTemplate(CONFIG.templateDir, report);
    generateDeploymentReport(report);
    if (report.errors.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (options.selfTest) {
    const result = runSelfTest();
    generateDeploymentReport(result.report);
    if (result.exitCode !== 0) {
      process.exit(result.exitCode);
    }
    return;
  }

  const targetPath = options.path || process.cwd();

  if (!fs.existsSync(targetPath)) {
    console.error(`${colors.red}错误：目标路径不存在: ${targetPath}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}目标路径：${colors.reset}${targetPath}`);
  console.log('');

  // 检查目标目录是否已存在
  const targetTraeDir = path.join(targetPath, CONFIG.targetDirName);
  const exists = fs.existsSync(targetTraeDir);

  if (exists && !options.force && !options.update) {
    console.log(`${colors.yellow}警告：目标目录已存在 .trae/ 配置${colors.reset}`);
    const shouldContinue = await askQuestion('是否覆盖现有配置？(y/N): ');
    
    if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
      console.log(`${colors.yellow}操作已取消${colors.reset}`);
      process.exit(0);
    }
  }

  // 执行复制
  try {
    const report = options.update
      ? await updateTraeConfig(targetPath, options)
      : await copyTraeConfig(targetPath, options);
    
    console.log('');
    console.log(`${colors.green}${colors.bright}✓ Trae 配置设置成功！${colors.reset}`);
    console.log('');
    console.log(`${colors.cyan}下一步：${colors.reset}`);
    console.log(`  1. 使用 Trae IDE 打开项目：${targetPath}`);
    console.log(`  2. AI 将自动读取 .trae/rules/ 中的规则`);
    console.log(`  3. AI 可以发现并使用 .trae/skills/ 中的技能`);
    console.log('');
    
  } catch (error) {
    console.error(`${colors.red}错误：${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}未处理的错误：${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main };
