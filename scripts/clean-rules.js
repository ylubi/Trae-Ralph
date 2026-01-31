const fs = require('fs');
const path = require('path');

const targetProjectDir = process.argv[2];

if (!targetProjectDir) {
  console.error('❌ 请提供目标项目路径');
  console.error('用法: node scripts/clean-rules.js <target-project-path>');
  process.exit(1);
}

// 转换为绝对路径
const absoluteTargetDir = path.resolve(targetProjectDir);
const rulesDir = path.join(absoluteTargetDir, '.trae/rules');

console.log(`🧹 开始清理 Ralph 规则: ${absoluteTargetDir}`);

if (!fs.existsSync(rulesDir)) {
  console.log('ℹ️ 规则目录不存在，无需清理');
  process.exit(0);
}

// 1. 删除规则文件
const filesToRemove = ['ralph-agent-mode.md', 'ralph-task-management.md'];
filesToRemove.forEach(file => {
  const filePath = path.join(rulesDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ 已删除文件: ${file}`);
  }
});

// 2. 清理 project.md 内容
const projectMdPath = path.join(rulesDir, 'project.md');
if (fs.existsSync(projectMdPath)) {
  let content = fs.readFileSync(projectMdPath, 'utf8');
  
  const regex = /<!-- start Ralph Rules  -->[\s\S]*?<!-- end Ralph Rules  -->\s*/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, '');
    
    // 清理可能留下的多余空行 (超过2个换行替换为2个)
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // 如果文件变空了，可能也想删除它？这里保留空文件或者仅含其他规则的文件
    fs.writeFileSync(projectMdPath, content.trim() + '\n', 'utf8');
    console.log('✅ 已从 project.md 移除 Ralph 规则段落');
  } else {
    console.log('ℹ️ project.md 中未发现 Ralph 规则段落');
  }
}

console.log('✨ 清理完成！');
