const { colors } = require('./constants');

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

function generateDeploymentReport(report) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                    部署报告                               ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log('');

  console.log(`${colors.blue}${colors.bright}复制的文件：${colors.reset}`);
  console.log(`  总计: ${colors.green}${report.copiedFiles.length}${colors.reset} 个文件`);

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

module.exports = {
  createReport,
  createUpdateReport,
  generateDeploymentReport,
  generateUpdateReport
};
