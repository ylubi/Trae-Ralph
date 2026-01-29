const fs = require('fs');
const path = require('path');
const { colors, CONFIG } = require('./constants');
const { normalizePath, collectMarkdownFiles, collectAllFiles } = require('./utils');

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

    if (!fs.existsSync(skillMdPath)) {
      validation.valid = false;
      validation.issues.push('缺少 SKILL.md 文件（必须全大写）');
      report.errors.push(`${skillFolder}: 缺少 SKILL.md 文件`);
    } else {
      const files = fs.readdirSync(skillPath);
      const hasCorrectName = files.includes('SKILL.md');

      if (!hasCorrectName) {
        validation.valid = false;
        validation.issues.push('SKILL.md 文件名必须全大写');
        report.errors.push(`${skillFolder}: SKILL.md 文件名不正确`);
      } else {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (!frontmatterMatch) {
          validation.valid = false;
          validation.issues.push('缺少 YAML frontmatter');
          report.errors.push(`${skillFolder}: 缺少 YAML frontmatter`);
        } else {
          const frontmatter = frontmatterMatch[1];

          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          if (!nameMatch) {
            validation.valid = false;
            validation.issues.push('缺少 name 字段');
            report.errors.push(`${skillFolder}: 缺少 name 字段`);
          } else {
            const name = nameMatch[1].trim();
            if (!/^[a-z]+(-[a-z]+)*$/.test(name)) {
              validation.valid = false;
              validation.issues.push(`name 字段必须使用 kebab-case 格式，当前值: ${name}`);
              report.warnings.push(`${skillFolder}: name 应使用 kebab-case 格式`);
            }

            if (name !== skillFolder) {
              validation.valid = false;
              validation.issues.push(`name 字段 (${name}) 与文件夹名 (${skillFolder}) 不一致`);
              report.warnings.push(`${skillFolder}: name 与文件夹名不一致`);
            }
          }

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

function checkHardcodedPaths(templateDir, report) {
  const rootDir = path.resolve(__dirname, '..', '..');
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
  const repoRoot = path.resolve(__dirname, '..', '..');
  const markdownFiles = collectMarkdownFiles(templateDir);

  const pathMappings = {
    'scenarios/': 'src/scenarios/',
    'config/selectors.js': 'src/editor-api/selectors.js'
  };

  markdownFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const backtickRegex = /`([^`\n]+)`/g;
    for (const match of content.matchAll(backtickRegex)) {
      const value = match[1].trim();
      if (value.startsWith('src/') || value.startsWith('scenarios/') || value.startsWith('config/')) {
        let checkPath = value;
        for (const [prefix, replacement] of Object.entries(pathMappings)) {
          if (checkPath.startsWith(prefix)) {
            checkPath = checkPath.replace(prefix, replacement);
            break;
          }
        }

        const targetPath = path.join(repoRoot, checkPath);
        if (!fs.existsSync(targetPath)) {
          report.errors.push(`参考路径不存在: ${value} (检查路径: ${checkPath}) (来源: ${normalizePath(path.relative(templateDir, filePath))})`);
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

module.exports = {
  validateSkills,
  validateTemplate,
  validateTags,
  validateReferences,
  extractTemplateReferences,
  checkHardcodedPaths,
  checkLayerConsistency,
  checkReferencePaths,
  checkRepoReferences,
  checkCrossPlatformCompatibility
};
