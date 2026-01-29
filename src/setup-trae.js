/**
 * Trae Ralph Loop CDP - Trae 配置设置工具
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
const readline = require('readline');
const os = require('os');
const crypto = require('crypto');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * 配置选项
 */
const CONFIG = {
  templateDir: path.join(__dirname, '..', '.trae-templates'),
  targetDirName: '.trae'
};

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
    process.exit(1);
  }
}

/**
 * 解析命令行参数
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    path: null,
    rulesOnly: false,
    skillsOnly: false,
    force: false,
    rules: [],
    skills: [],
    exclude: [],
    validateOnly: false,
    update: false,
    selfTest: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--path' && i + 1 < args.length) {
      options.path = path.resolve(args[i + 1]);
      i++;
    } else if (arg === '--rules-only') {
      options.rulesOnly = true;
    } else if (arg === '--skills-only') {
      options.skillsOnly = true;
    } else if (arg === '--rules' && i + 1 < args.length) {
      options.rules = parseList(args[i + 1]);
      i++;
    } else if (arg === '--skills' && i + 1 < args.length) {
      options.skills = parseList(args[i + 1]);
      i++;
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = parseList(args[i + 1]);
      i++;
    } else if (arg === '--validate' || arg === '--validate-only') {
      options.validateOnly = true;
    } else if (arg === '--update') {
      options.update = true;
    } else if (arg === '--self-test' || arg === '--test') {
      options.selfTest = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

function parseList(value) {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * 复制 Trae 配置
 */
async function copyTraeConfig(targetPath, options) {
  const targetTraeDir = path.join(targetPath, CONFIG.targetDirName);
  const report = createReport();
  const copyFilter = createCopyFilter(options);

  // 创建 .trae 目录
  if (!fs.existsSync(targetTraeDir)) {
    fs.mkdirSync(targetTraeDir, { recursive: true });
  }

  // 复制 README.md
  const readmeSource = path.join(CONFIG.templateDir, 'README.md');
  const readmeTarget = path.join(targetTraeDir, 'README.md');
  if (fs.existsSync(readmeSource) && copyFilter('README.md', false)) {
    console.log(`${colors.blue}正在复制 README.md...${colors.reset}`);
    fs.copyFileSync(readmeSource, readmeTarget);
    report.copiedFiles.push('README.md');
    console.log(`${colors.green}  ✓ README.md 复制完成${colors.reset}`);
  }

  // 复制 Rules
  if (!options.skillsOnly) {
    console.log(`${colors.blue}正在复制 Rules...${colors.reset}`);
    const rulesSource = path.join(CONFIG.templateDir, 'rules');
    const rulesTarget = path.join(targetTraeDir, 'rules');
    
    if (fs.existsSync(rulesSource)) {
      const fileCount = copyDirectoryWithReport(rulesSource, rulesTarget, report, 'rules/', copyFilter);
      console.log(`${colors.green}  ✓ Rules 复制完成 (${fileCount} 个文件)${colors.reset}`);
    } else {
      const warning = 'Rules 模板不存在，跳过';
      report.warnings.push(warning);
      console.log(`${colors.yellow}  ⚠ ${warning}${colors.reset}`);
    }
  }

  // 复制 Skills
  if (!options.rulesOnly) {
    console.log(`${colors.blue}正在复制 Skills...${colors.reset}`);
    const skillsSource = path.join(CONFIG.templateDir, 'skills');
    const skillsTarget = path.join(targetTraeDir, 'skills');
    
    if (fs.existsSync(skillsSource)) {
      const fileCount = copyDirectoryWithReport(skillsSource, skillsTarget, report, 'skills/', copyFilter);
      
      // 验证 SKILL.md 文件
      console.log(`${colors.blue}  正在验证 Skills 格式...${colors.reset}`);
      validateSkills(skillsTarget, report);
      
      console.log(`${colors.green}  ✓ Skills 复制完成 (${fileCount} 个文件)${colors.reset}`);
    } else {
      const warning = 'Skills 模板不存在，跳过';
      report.warnings.push(warning);
      console.log(`${colors.yellow}  ⚠ ${warning}${colors.reset}`);
    }
  }

  // 复制 Workflows
  if (!options.rulesOnly && !options.skillsOnly) {
    console.log(`${colors.blue}正在复制 Workflows...${colors.reset}`);
    const workflowsSource = path.join(CONFIG.templateDir, 'workflows');
    const workflowsTarget = path.join(targetTraeDir, 'workflows');
    
    if (fs.existsSync(workflowsSource)) {
      const fileCount = copyDirectoryWithReport(workflowsSource, workflowsTarget, report, 'workflows/', copyFilter);
      console.log(`${colors.green}  ✓ Workflows 复制完成 (${fileCount} 个文件)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}  ⚠ Workflows 模板不存在，跳过${colors.reset}`);
    }
  }

  // 复制 Reference
  if (!options.rulesOnly && !options.skillsOnly) {
    console.log(`${colors.blue}正在复制 Reference...${colors.reset}`);
    const referenceSource = path.join(CONFIG.templateDir, 'reference');
    const referenceTarget = path.join(targetTraeDir, 'reference');
    
    if (fs.existsSync(referenceSource)) {
      const fileCount = copyDirectoryWithReport(referenceSource, referenceTarget, report, 'reference/', copyFilter);
      console.log(`${colors.green}  ✓ Reference 复制完成 (${fileCount} 个文件)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}  ⚠ Reference 模板不存在，跳过${colors.reset}`);
    }
  }

  warnMissingSelections(report, options);

  // 生成部署报告
  generateDeploymentReport(report);
  
  return report;
}

/**
 * 递归复制目录（带报告）
 */
function copyDirectoryWithReport(source, target, report, prefix = '', filter = null) {
  let fileCount = 0;
  
  // 创建目标目录
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // 读取源目录
  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const relativePath = prefix + file;
    const normalizedPath = normalizePath(relativePath);

    const stat = fs.statSync(sourcePath);

    if (filter && !filter(normalizedPath, stat.isDirectory())) {
      return;
    }

    if (stat.isDirectory()) {
      // 递归复制子目录
      fileCount += copyDirectoryWithReport(sourcePath, targetPath, report, relativePath + '/', filter);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
      report.copiedFiles.push(relativePath);
      fileCount++;
    }
  });
  
  return fileCount;
}

function createReport() {
  return {
    copiedFiles: [],
    warnings: [],
    errors: [],
    skillValidation: [],
    referenceValidation: [],
    testResults: []
  };
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function createCopyFilter(options) {
  const rulesSet = new Set(options.rules.map(item => item.replace(/\.md$/i, '')));
  const skillsSet = new Set(options.skills);
  const excludes = options.exclude.map(entry => normalizePath(entry).replace(/\/+$/, ''));

  return (relativePath, isDirectory) => {
    const normalized = normalizePath(relativePath).replace(/\/+$/, '');

    if (excludes.some(prefix => normalized === prefix || normalized.startsWith(prefix + '/'))) {
      return false;
    }

    if (normalized.startsWith('rules/')) {
      if (rulesSet.size === 0) return true;
      if (isDirectory) return true;
      const file = normalized.slice('rules/'.length).replace(/\.md$/i, '');
      return rulesSet.has(file);
    }

    if (normalized.startsWith('skills/')) {
      if (skillsSet.size === 0) return true;
      const rest = normalized.slice('skills/'.length);
      const skillName = rest.split('/')[0];
      return skillsSet.has(skillName);
    }

    return true;
  };
}

function warnMissingSelections(report, options) {
  const rulesDir = path.join(CONFIG.templateDir, 'rules');
  const skillsDir = path.join(CONFIG.templateDir, 'skills');

  if (options.rules.length > 0 && fs.existsSync(rulesDir)) {
    const available = new Set(fs.readdirSync(rulesDir).filter(item => item.endsWith('.md')).map(item => item.replace(/\.md$/i, '')));
    const missing = options.rules.filter(item => !available.has(item.replace(/\.md$/i, '')));
    missing.forEach(item => {
      report.warnings.push(`Rules 未找到: ${item}`);
    });
  }

  if (options.skills.length > 0 && fs.existsSync(skillsDir)) {
    const available = new Set(fs.readdirSync(skillsDir).filter(item => fs.statSync(path.join(skillsDir, item)).isDirectory()));
    const missing = options.skills.filter(item => !available.has(item));
    missing.forEach(item => {
      report.warnings.push(`Skills 未找到: ${item}`);
    });
  }
}

async function updateTraeConfig(targetPath, options) {
  const targetTraeDir = path.join(targetPath, CONFIG.targetDirName);
  const report = createUpdateReport();
  const copyFilter = createCopyFilter(options);

  if (!fs.existsSync(targetTraeDir)) {
    return await copyTraeConfig(targetPath, options);
  }

  const templateFiles = collectAllFiles(CONFIG.templateDir).map(filePath => normalizePath(path.relative(CONFIG.templateDir, filePath)));
  const targetFiles = collectAllFiles(targetTraeDir).map(filePath => normalizePath(path.relative(targetTraeDir, filePath)));

  templateFiles.forEach(relativePath => {
    const normalized = normalizePath(relativePath);
    const templatePath = path.join(CONFIG.templateDir, normalized);
    const targetFilePath = path.join(targetTraeDir, normalized);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory()) {
      return;
    }

    if (!copyFilter(normalized, false)) {
      return;
    }

    const targetDir = path.dirname(targetFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (!fs.existsSync(targetFilePath)) {
      fs.copyFileSync(templatePath, targetFilePath);
      report.addedFiles.push(normalized);
      return;
    }

    const templateContent = fs.readFileSync(templatePath);
    const targetContent = fs.readFileSync(targetFilePath);
    if (templateContent.equals(targetContent)) {
      report.unchangedFiles.push(normalized);
      return;
    }

    if (options.force) {
      fs.copyFileSync(templatePath, targetFilePath);
      report.updatedFiles.push(normalized);
      return;
    }

    report.skippedFiles.push(normalized);
  });

  targetFiles.forEach(relativePath => {
    if (!templateFiles.includes(relativePath)) {
      report.customFiles.push(relativePath);
    }
  });

  if (fs.existsSync(path.join(targetTraeDir, 'skills'))) {
    validateSkills(path.join(targetTraeDir, 'skills'), report);
  }

  warnMissingSelections(report, options);
  generateUpdateReport(report);
  return report;
}

function createUpdateReport() {
  return {
    addedFiles: [],
    updatedFiles: [],
    skippedFiles: [],
    unchangedFiles: [],
    customFiles: [],
    warnings: [],
    errors: [],
    skillValidation: [],
    referenceValidation: [],
    testResults: []
  };
}

function generateUpdateReport(report) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                    更新报告                               ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log('');

  console.log(`${colors.blue}${colors.bright}更新统计：${colors.reset}`);
  console.log(`  新增: ${colors.green}${report.addedFiles.length}${colors.reset} 个文件`);
  console.log(`  更新: ${colors.green}${report.updatedFiles.length}${colors.reset} 个文件`);
  console.log(`  跳过: ${colors.yellow}${report.skippedFiles.length}${colors.reset} 个文件`);
  console.log(`  未变更: ${colors.green}${report.unchangedFiles.length}${colors.reset} 个文件`);
  console.log(`  自定义保留: ${colors.green}${report.customFiles.length}${colors.reset} 个文件`);
  console.log('');

  if (report.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}警告 (${report.warnings.length})：${colors.reset}`);
    report.warnings.forEach(warning => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
    });
    console.log('');
  }

  if (report.errors.length > 0) {
    console.log(`${colors.red}${colors.bright}错误 (${report.errors.length})：${colors.reset}`);
    report.errors.forEach(error => {
      console.log(`  ${colors.red}✗${colors.reset} ${error}`);
    });
    console.log('');
  }

  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
}

function collectAllFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir);
  entries.forEach(entry => {
    const entryPath = path.join(rootDir, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      results.push(entryPath);
      results.push(...collectAllFiles(entryPath));
    } else {
      results.push(entryPath);
    }
  });
  return results;
}

function runSelfTest() {
  const report = createReport();
  validateTemplate(CONFIG.templateDir, report);
  checkHardcodedPaths(CONFIG.templateDir, report);
  checkLayerConsistency(CONFIG.templateDir, report);
  checkReferencePaths(CONFIG.templateDir, report);
  checkRepoReferences(report);
  checkCrossPlatformCompatibility(CONFIG.templateDir, report);
  const idempotent = testDeploymentIdempotency(report);
  const deployment = testDeploymentToTemp(report);
  const exitCode = report.errors.length > 0 || !idempotent || !deployment ? 1 : 0;
  return { exitCode, report };
}

function checkHardcodedPaths(templateDir, report) {
  const rootDir = path.resolve(__dirname, '..');
  const normalizedRoot = normalizePath(rootDir);
  const normalizedTemplate = normalizePath(templateDir);
  const files = collectAllFiles(templateDir).filter(filePath => filePath.endsWith('.md'));
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(normalizedRoot) || content.includes(normalizedTemplate)) {
      report.errors.push(`硬编码路径: ${normalizePath(path.relative(templateDir, filePath))}`);
    }
  });
}

function checkLayerConsistency(templateDir, report) {
  const markdownFiles = collectMarkdownFiles(templateDir);
  const stackKeywords = ['node', 'npm', 'yarn', 'pnpm', 'python', 'pip', 'selenium', 'playwright', 'puppeteer', 'cdp'];
  markdownFiles.forEach(filePath => {
    const normalized = normalizePath(filePath);
    if (!normalized.includes('/rules/') && !normalized.includes('/workflows/')) {
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const header = content.split(/\r?\n/).slice(0, 20).join('\n');
    const hasGeneralTag = header.includes('[通用]') && !header.includes('[示例]') && !header.includes('[参考]');
    if (!hasGeneralTag) {
      return;
    }
    const lower = content.toLowerCase();
    if (stackKeywords.some(keyword => lower.includes(keyword))) {
      report.warnings.push(`通用内容包含特定技术栈: ${normalizePath(path.relative(templateDir, filePath))}`);
    }
  });
}

function checkReferencePaths(templateDir, report) {
  const markdownFiles = collectMarkdownFiles(templateDir);
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const references = extractTemplateReferences(content);
    references.forEach(ref => {
      if (ref.includes('\\')) {
        report.warnings.push(`引用路径包含反斜杠: ${ref} (来源: ${normalizePath(path.relative(templateDir, filePath))})`);
      }
    });
  });
}

function checkRepoReferences(report) {
  const templateDir = CONFIG.templateDir;
  const repoRoot = path.resolve(__dirname, '..');
  const markdownFiles = collectMarkdownFiles(templateDir);
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const backtickRegex = /`([^`\n]+)`/g;
    for (const match of content.matchAll(backtickRegex)) {
      const value = match[1].trim();
      if (value.startsWith('src/') || value.startsWith('scenarios/') || value.startsWith('config/')) {
        const targetPath = path.join(repoRoot, value);
        if (!fs.existsSync(targetPath)) {
          report.errors.push(`参考路径不存在: ${value} (来源: ${normalizePath(path.relative(templateDir, filePath))})`);
        }
      }
    }
  });
}

function checkCrossPlatformCompatibility(templateDir, report) {
  const markdownFiles = collectMarkdownFiles(templateDir);
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const header = content.split(/\r?\n/).slice(0, 20).join('\n');
    const isGeneral = header.includes('[通用]') && !header.includes('[示例]') && !header.includes('[参考]');
    if (!isGeneral) {
      return;
    }
    const hasWindowsPath = /[A-Za-z]:\\/.test(content);
    const hasMacPath = /\/Applications\/[^\s`"]+/.test(content);
    const hasLinuxPath = /\/usr\/(local\/)?bin\/[^\s`"]+/.test(content);
    if (hasWindowsPath || hasMacPath || hasLinuxPath) {
      report.warnings.push(`通用内容包含平台路径: ${normalizePath(path.relative(templateDir, filePath))}`);
    }
  });
}

function testDeploymentIdempotency(report) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trae-ralph-idem-'));
  const options = {
    path: tempDir,
    rulesOnly: false,
    skillsOnly: false,
    force: true,
    rules: [],
    skills: [],
    exclude: []
  };
  copyTraeConfig(tempDir, options);
  const first = hashDirectory(path.join(tempDir, CONFIG.targetDirName));
  copyTraeConfig(tempDir, options);
  const second = hashDirectory(path.join(tempDir, CONFIG.targetDirName));
  const ok = first === second;
  if (!ok) {
    report.errors.push('部署幂等性检查失败');
  }
  return ok;
}

function testDeploymentToTemp(report) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trae-ralph-test-'));
  const options = {
    path: tempDir,
    rulesOnly: false,
    skillsOnly: false,
    force: true,
    rules: [],
    skills: [],
    exclude: []
  };
  copyTraeConfig(tempDir, options);
  const targetTraeDir = path.join(tempDir, CONFIG.targetDirName);
  const rulesDir = path.join(targetTraeDir, 'rules');
  const skillsDir = path.join(targetTraeDir, 'skills');
  const ok = fs.existsSync(rulesDir) && fs.existsSync(skillsDir);
  if (!ok) {
    report.errors.push('集成测试失败: 部署后目录缺失');
  }
  return ok;
}

function hashDirectory(dirPath) {
  const files = collectAllFiles(dirPath).filter(filePath => fs.statSync(filePath).isFile());
  const entries = files.map(filePath => {
    const relative = normalizePath(path.relative(dirPath, filePath));
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${relative}:${hash}`;
  });
  return crypto.createHash('sha256').update(entries.sort().join('|')).digest('hex');
}

function validateTemplate(templateDir, report) {
  const skillsDir = path.join(templateDir, 'skills');
  validateSkills(skillsDir, report);
  validateTags(templateDir, report);
  validateReferences(templateDir, report);
}

function validateTags(templateDir, report) {
  const markdownFiles = collectMarkdownFiles(templateDir);
  markdownFiles.forEach(filePath => {
    const normalized = normalizePath(filePath);
    if (!normalized.includes('/rules/') && !normalized.includes('/workflows/')) {
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).slice(0, 20).join('\n');
    if (!lines.includes('**标签**')) {
      report.warnings.push(`标签缺失: ${normalizePath(path.relative(templateDir, filePath))}`);
    }
  });
}

function validateReferences(templateDir, report) {
  const markdownFiles = collectMarkdownFiles(templateDir);
  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const references = extractTemplateReferences(content);
    const missing = [];
    references.forEach(ref => {
      const targetPath = path.join(templateDir, ref);
      if (!fs.existsSync(targetPath)) {
        missing.push(ref);
        report.errors.push(`引用不存在: ${ref} (来源: ${normalizePath(path.relative(templateDir, filePath))})`);
      }
    });
    if (missing.length > 0) {
      report.referenceValidation.push({
        file: normalizePath(path.relative(templateDir, filePath)),
        missing
      });
    }
  });
}

function extractTemplateReferences(content) {
  const references = new Set();
  const backtickRegex = /`([^`\n]+)`/g;
  const linkRegex = /\(([^)]+)\)/g;
  const prefixes = ['rules/', 'skills/', 'workflows/', 'reference/'];

  for (const match of content.matchAll(backtickRegex)) {
    const value = match[1].trim();
    if (prefixes.some(prefix => value.startsWith(prefix))) {
      references.add(value);
    }
  }

  for (const match of content.matchAll(linkRegex)) {
    const value = match[1].trim();
    if (value.startsWith('http') || value.startsWith('#') || value.startsWith('mailto:')) {
      continue;
    }
    if (prefixes.some(prefix => value.startsWith(prefix))) {
      references.add(value);
    }
  }

  return Array.from(references);
}

function collectMarkdownFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir);
  entries.forEach(entry => {
    const entryPath = path.join(rootDir, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(entryPath));
    } else if (entryPath.endsWith('.md')) {
      results.push(entryPath);
    }
  });
  return results;
}

/**
 * 递归复制目录
 */
function copyDirectory(source, target) {
  // 创建目标目录
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // 读取源目录
  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // 递归复制子目录
      copyDirectory(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * 验证 Skills 目录中的 SKILL.md 文件
 */
function validateSkills(skillsDir, report) {
  if (!fs.existsSync(skillsDir)) {
    return;
  }

  const skillFolders = fs.readdirSync(skillsDir).filter(item => {
    const itemPath = path.join(skillsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  skillFolders.forEach(skillFolder => {
    const skillPath = path.join(skillsDir, skillFolder);
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    
    const validation = {
      skill: skillFolder,
      valid: true,
      issues: []
    };

    // 检查 SKILL.md 文件是否存在
    if (!fs.existsSync(skillMdPath)) {
      validation.valid = false;
      validation.issues.push('缺少 SKILL.md 文件（必须全大写）');
      report.errors.push(`${skillFolder}: 缺少 SKILL.md 文件`);
    } else {
      // 检查文件名是否全大写
      const files = fs.readdirSync(skillPath);
      const hasCorrectName = files.includes('SKILL.md');
      
      if (!hasCorrectName) {
        validation.valid = false;
        validation.issues.push('SKILL.md 文件名必须全大写');
        report.errors.push(`${skillFolder}: SKILL.md 文件名不正确`);
      } else {
        // 验证 YAML frontmatter
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        
        if (!frontmatterMatch) {
          validation.valid = false;
          validation.issues.push('缺少 YAML frontmatter');
          report.errors.push(`${skillFolder}: 缺少 YAML frontmatter`);
        } else {
          const frontmatter = frontmatterMatch[1];
          
          // 检查 name 字段
          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          if (!nameMatch) {
            validation.valid = false;
            validation.issues.push('缺少 name 字段');
            report.errors.push(`${skillFolder}: 缺少 name 字段`);
          } else {
            const name = nameMatch[1].trim();
            // 验证 kebab-case 格式
            if (!/^[a-z]+(-[a-z]+)*$/.test(name)) {
              validation.valid = false;
              validation.issues.push(`name 字段必须使用 kebab-case 格式，当前值: ${name}`);
              report.warnings.push(`${skillFolder}: name 应使用 kebab-case 格式`);
            }
            
            // 验证 name 与文件夹名一致
            if (name !== skillFolder) {
              validation.valid = false;
              validation.issues.push(`name 字段 (${name}) 与文件夹名 (${skillFolder}) 不一致`);
              report.warnings.push(`${skillFolder}: name 与文件夹名不一致`);
            }
          }
          
          // 检查 description 字段
          const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
          if (!descMatch) {
            validation.valid = false;
            validation.issues.push('缺少 description 字段');
            report.errors.push(`${skillFolder}: 缺少 description 字段`);
          }
        }
      }
    }
    
    report.skillValidation.push(validation);
    
    if (validation.valid) {
      console.log(`${colors.green}    ✓ ${skillFolder}${colors.reset}`);
    } else {
      console.log(`${colors.red}    ✗ ${skillFolder}${colors.reset}`);
      validation.issues.forEach(issue => {
        console.log(`${colors.red}      - ${issue}${colors.reset}`);
      });
    }
  });
}

/**
 * 生成部署报告
 */
function generateDeploymentReport(report) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                    部署报告                               ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log('');
  
  // 复制的文件统计
  console.log(`${colors.blue}${colors.bright}复制的文件：${colors.reset}`);
  console.log(`  总计: ${colors.green}${report.copiedFiles.length}${colors.reset} 个文件`);
  
  // 按类型分组
  const filesByType = {
    rules: report.copiedFiles.filter(f => f.startsWith('rules/')),
    skills: report.copiedFiles.filter(f => f.startsWith('skills/')),
    workflows: report.copiedFiles.filter(f => f.startsWith('workflows/')),
    reference: report.copiedFiles.filter(f => f.startsWith('reference/')),
    other: report.copiedFiles.filter(f => !f.includes('/'))
  };
  
  if (filesByType.rules.length > 0) {
    console.log(`  Rules: ${colors.green}${filesByType.rules.length}${colors.reset} 个文件`);
  }
  if (filesByType.skills.length > 0) {
    console.log(`  Skills: ${colors.green}${filesByType.skills.length}${colors.reset} 个文件`);
  }
  if (filesByType.workflows.length > 0) {
    console.log(`  Workflows: ${colors.green}${filesByType.workflows.length}${colors.reset} 个文件`);
  }
  if (filesByType.reference.length > 0) {
    console.log(`  Reference: ${colors.green}${filesByType.reference.length}${colors.reset} 个文件`);
  }
  if (filesByType.other.length > 0) {
    console.log(`  其他: ${colors.green}${filesByType.other.length}${colors.reset} 个文件`);
  }
  
  console.log('');
  
  // Skills 验证结果
  if (report.skillValidation.length > 0) {
    console.log(`${colors.blue}${colors.bright}Skills 验证结果：${colors.reset}`);
    const validSkills = report.skillValidation.filter(v => v.valid);
    const invalidSkills = report.skillValidation.filter(v => !v.valid);
    
    console.log(`  有效: ${colors.green}${validSkills.length}${colors.reset} 个`);
    if (invalidSkills.length > 0) {
      console.log(`  无效: ${colors.red}${invalidSkills.length}${colors.reset} 个`);
    }
    console.log('');
  }
  
  // 警告信息
  if (report.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bright}警告 (${report.warnings.length})：${colors.reset}`);
    report.warnings.forEach(warning => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
    });
    console.log('');
  }
  
  // 错误信息
  if (report.errors.length > 0) {
    console.log(`${colors.red}${colors.bright}错误 (${report.errors.length})：${colors.reset}`);
    report.errors.forEach(error => {
      console.log(`  ${colors.red}✗${colors.reset} ${error}`);
    });
    console.log('');
  }
  
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
}

/**
 * 递归复制目录
 */
function copyDirectory(source, target) {
  // 创建目标目录
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // 读取源目录
  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // 递归复制子目录
      copyDirectory(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * 询问用户输入
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
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
