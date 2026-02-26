const fs = require('fs');
const path = require('path');

const targetProjectDir = process.argv[2];

if (!targetProjectDir) {
  console.error('❌ 请提供目标项目路径');
  console.error('用法: node scripts/inject-rules.js <target-project-path>');
  process.exit(1);
}

// 转换为绝对路径
const absoluteTargetDir = path.resolve(targetProjectDir);
const templatesRulesDir = path.resolve(__dirname, '../templates/rules');
const targetRulesDir = path.join(absoluteTargetDir, '.trae/rules');

console.log(`🚀 开始注入 Ralph Rules 到: ${absoluteTargetDir}`);

// 1. 确保 .trae/rules 目录存在
if (!fs.existsSync(targetRulesDir)) {
  fs.mkdirSync(targetRulesDir, { recursive: true });
  console.log('✅ 创建目录: .trae/rules');
}

// 2. 复制 Rules (如果存在模板)
let hasRules = false;
if (fs.existsSync(templatesRulesDir) && fs.statSync(templatesRulesDir).isDirectory()) {
  console.log('📦 从 templates/rules 复制规则文件...');
  const ruleFiles = fs.readdirSync(templatesRulesDir);
  let ruleCount = 0;
  
  ruleFiles.forEach(file => {
    const srcFile = path.join(templatesRulesDir, file);
    const destFile = path.join(targetRulesDir, file);
    
    if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`   📝 安装规则: ${file}`);
        ruleCount++;
    }
  });
  console.log(`✅ 已安装 ${ruleCount} 个规则文件`);
  hasRules = ruleCount > 0;
} else {
    console.log('ℹ️ templates/rules 目录不存在，跳过规则文件复制 (保留逻辑以备后用)');
}

// 3. 更新 project.md (已废弃)
// 之前版本会在 .trae/rules/project.md 中注入引导指令。
// 现已改为使用 Ralph.md 和 Skill 机制，不再侵入修改 project.md。
console.log('ℹ️ 跳过 project.md 修改 (Policy: Do Not Touch project.md)');

/*
if (hasRules) {
    const projectMdPath = path.join(targetRulesDir, 'project.md'); 

    let content = '';
    if (fs.existsSync(projectMdPath)) {
      content = fs.readFileSync(projectMdPath, 'utf8');
    } else {
      console.log('ℹ️ project.md 不存在，将创建新文件');
    }

    const injectionContent = `<!-- start Ralph Rules  --> 
# Ralph Mode Active
本项目已启用 Ralph 自主模式。
**核心指令**: 请始终优先调用 \`ralph-planner\` Skill 来初始化状态、管理任务和执行开发流程。
**Core Instruction**: Always invoke the \`ralph-planner\` Skill first to manage project lifecycle.
<!-- end Ralph Rules  -->`;

    const regex = /<!-- start Ralph Rules  -->[\s\S]*?<!-- end Ralph Rules  -->/g;

    if (regex.test(content)) {
      content = content.replace(regex, injectionContent);
      console.log('✅ 已更新 project.md 中的 Ralph 引导指令');
    } else {
      if (content && !content.endsWith('\n')) content += '\n';
      if (content && !content.endsWith('\n\n')) content += '\n';
      content += injectionContent;
      console.log('✅ 已追加 Ralph 引导指令到 project.md');
    }

    fs.writeFileSync(projectMdPath, content, 'utf8');
} else {
    console.log('ℹ️ templates/rules 为空，跳过 project.md 的修改');
}
*/

// 4. 检查/迁移 RALPH_STATE.md
const ralphStatePath = path.join(absoluteTargetDir, 'RALPH_STATE.md');
// 尝试从模板加载 RALPH_STATE_TEMPLATE.md
const ralphStateTemplatePath = path.resolve(__dirname, '../templates/skills/ralph-planner/assets/RALPH_STATE_TEMPLATE.md');

let ralphStateTemplate = '';
if (fs.existsSync(ralphStateTemplatePath)) {
    ralphStateTemplate = fs.readFileSync(ralphStateTemplatePath, 'utf8');
} else {
    // Fallback if template file is missing (should not happen in dev env)
    ralphStateTemplate = `# Ralph 项目状态 (Project State)\n\n> **当前上下文 (Current Context)**: 规划阶段 (Planning)\n> **迭代名称 (Iteration)**: [此处填写实际迭代名称]\n\n(模板加载失败，请手动检查)`;
    console.warn('⚠️ 未找到 RALPH_STATE_TEMPLATE.md，使用简易回退模板');
}

if (fs.existsSync(ralphStatePath)) {
  // 如果文件已存在，我们尽量不覆盖用户的数据。
  // 但如果是旧格式（包含 "Ralph 状态指针" 或 ".trae/rules"），建议升级。
  let currentContent = fs.readFileSync(ralphStatePath, 'utf8');
  
  // 检查是否是旧版格式
  const isOldFormat = currentContent.includes('Ralph 状态指针') || currentContent.includes('.trae/rules/');
  
  if (isOldFormat) {
    console.log('⚠️ 检测到旧版 RALPH_STATE.md 格式，正在升级到新版模板...');
    // 备份旧文件
    const backupPath = ralphStatePath + '.bak';
    fs.writeFileSync(backupPath, currentContent, 'utf8');
    console.log(`📦 旧文件已备份为: RALPH_STATE.md.bak`);
    
    // 覆盖为新模板
    fs.writeFileSync(ralphStatePath, ralphStateTemplate, 'utf8');
    console.log('✅ 已升级 RALPH_STATE.md 为最新标准模板');
  } else {
    console.log('✅ RALPH_STATE.md 已存在且格式兼容，跳过覆盖');
  }
} else {
  // 文件不存在，直接创建
  fs.writeFileSync(ralphStatePath, ralphStateTemplate, 'utf8');
  console.log('✅ 已初始化 RALPH_STATE.md (基于标准模板)');
}

console.log('✨ Rules 注入完成！');
