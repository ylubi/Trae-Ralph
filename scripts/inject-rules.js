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
const templatesDir = path.resolve(__dirname, '../templates/target-project-rules');
const rulesDir = path.join(absoluteTargetDir, '.trae/rules');

console.log(`🚀 开始注入 Ralph 规则到: ${absoluteTargetDir}`);

// 1. 确保 .trae/rules 目录存在
if (!fs.existsSync(rulesDir)) {
  fs.mkdirSync(rulesDir, { recursive: true });
  console.log('✅ 创建目录: .trae/rules');
}

// 2. 复制规则文件
const filesToCopy = ['ralph-agent-mode.md', 'ralph-task-management.md'];
filesToCopy.forEach(file => {
  const src = path.join(templatesDir, file);
  const dest = path.join(rulesDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ 已复制文件: ${file}`);
  } else {
    console.error(`❌ 模板文件不存在: ${src}`);
  }
});

// 3. 更新 project.md
const projectMdPath = path.join(rulesDir, 'project.md');
let content = '';

if (fs.existsSync(projectMdPath)) {
  content = fs.readFileSync(projectMdPath, 'utf8');
} else {
  console.log('ℹ️ project.md 不存在，将创建新文件');
}

const injectionContent = `<!-- start Ralph Rules  --> 
# 项目开发规则 

## 🤖 Ralph 自主模式 
本项目已启用 Ralph 自主模式，Agent 必须严格遵守以下规范： 
1. **核心行为**: 遵循 [ralph-agent-mode.md](./ralph-agent-mode.md) 中的角色定义和状态报告要求。 
2. **任务管理**: 维护 [ralph-task-management.md](./ralph-task-management.md) 定义的 \`RALPH_STATE.md\`。 

## 其他规则 
- 使用中文回复。 
<!-- end Ralph Rules  -->`;

const startTag = '<!-- start Ralph Rules  -->';
const endTag = '<!-- end Ralph Rules  -->';

// 构建正则，注意转义特殊字符
// 虽然 HTML 注释通常不需要转义，但为了安全起见
const regex = /<!-- start Ralph Rules  -->[\s\S]*?<!-- end Ralph Rules  -->/g;

if (regex.test(content)) {
  content = content.replace(regex, injectionContent);
  console.log('✅ 已更新 project.md 中的 Ralph 规则段落');
} else {
  // 确保有换行分隔
  if (content && !content.endsWith('\n')) {
    content += '\n';
  }
  if (content && !content.endsWith('\n\n')) {
    content += '\n';
  }
  content += injectionContent;
  console.log('✅ 已追加 Ralph 规则到 project.md');
}

fs.writeFileSync(projectMdPath, content, 'utf8');
console.log('✨ 注入完成！');
