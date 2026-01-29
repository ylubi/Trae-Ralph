const fs = require('fs');
const path = require('path');
const os = require('os');
const { colors, CONFIG } = require('./constants');
const { normalizePath, collectAllFiles, hashDirectory } = require('./utils');
const { createReport, createUpdateReport, generateDeploymentReport, generateUpdateReport } = require('./reports');
const { 
  validateSkills,
  validateTemplate, 
  checkHardcodedPaths, 
  checkLayerConsistency, 
  checkReferencePaths, 
  checkRepoReferences, 
  checkCrossPlatformCompatibility 
} = require('./validate');

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

function copyDirectoryWithReport(source, target, report, prefix = '', filter = null) {
  let fileCount = 0;

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

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
      fileCount += copyDirectoryWithReport(sourcePath, targetPath, report, relativePath + '/', filter);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      report.copiedFiles.push(relativePath);
      fileCount++;
    }
  });

  return fileCount;
}

async function copyTraeConfig(targetPath, options) {
  const targetTraeDir = path.join(targetPath, CONFIG.targetDirName);
  const report = createReport();
  const copyFilter = createCopyFilter(options);

  if (!fs.existsSync(targetTraeDir)) {
    fs.mkdirSync(targetTraeDir, { recursive: true });
  }

  const readmeSource = path.join(CONFIG.templateDir, 'README.md');
  const readmeTarget = path.join(targetTraeDir, 'README.md');
  if (fs.existsSync(readmeSource) && copyFilter('README.md', false)) {
    console.log(`${colors.blue}正在复制 README.md...${colors.reset}`);
    fs.copyFileSync(readmeSource, readmeTarget);
    report.copiedFiles.push('README.md');
    console.log(`${colors.green}  ✓ README.md 复制完成${colors.reset}`);
  }

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

  if (!options.rulesOnly) {
    console.log(`${colors.blue}正在复制 Skills...${colors.reset}`);
    const skillsSource = path.join(CONFIG.templateDir, 'skills');
    const skillsTarget = path.join(targetTraeDir, 'skills');

    if (fs.existsSync(skillsSource)) {
      const fileCount = copyDirectoryWithReport(skillsSource, skillsTarget, report, 'skills/', copyFilter);

      console.log(`${colors.blue}  正在验证 Skills 格式...${colors.reset}`);
      validateSkills(skillsTarget, report);

      console.log(`${colors.green}  ✓ Skills 复制完成 (${fileCount} 个文件)${colors.reset}`);
    } else {
      const warning = 'Skills 模板不存在，跳过';
      report.warnings.push(warning);
      console.log(`${colors.yellow}  ⚠ ${warning}${colors.reset}`);
    }
  }

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
  generateDeploymentReport(report);

  return report;
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

module.exports = {
  copyTraeConfig,
  updateTraeConfig,
  testDeploymentIdempotency,
  testDeploymentToTemp,
  runSelfTest
};
