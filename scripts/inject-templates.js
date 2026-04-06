const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
let targetProjectDir = null;
let skillType = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skill-type' && args[i + 1]) {
    skillType = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--')) {
    targetProjectDir = args[i];
  }
}

if (!targetProjectDir) {
  console.error('❌ 请提供目标项目路径');
  console.error('用法 1 (注入全部): npm run templates:inject -- <target-project-path>');
  console.error('用法 2 (按类型注入): npm run templates:inject -- --skill-type <type> <target-project-path>');
  console.error('示例: npm run templates:inject -- --skill-type web C:\\work\\tools\\test\\test-009');
  console.error('可用类型：web, common (或具体 skill 名称)');
  process.exit(1);
}

const absoluteTargetDir = path.resolve(targetProjectDir);

if (skillType) {
  console.log(`🚀 开始向项目注入 ${skillType} 类型模板 (Rules + Skills): ${absoluteTargetDir}`);
  console.log(`📋 Skill 类型：${skillType}`);
  if (skillType === 'web') {
    console.log('📦 包含 Skills: ralph-web-architecture, ralph-web-requirement, ralph-web-routine, ralph-web-task-planner, ralph-web-test-plan');
  } else if (skillType === 'common') {
    console.log('📦 包含 Skills: ralph-planner, ralph-round-initializer, ralph-func-analyst, ralph-task-executor, ralph-test-executor, ralph-state-manager');
  }
} else {
  console.log(`🚀 开始向项目注入所有模板 (Rules + Skills): ${absoluteTargetDir}`);
  console.log('📋 将注入所有可用的 Skills (web + common)');
}

try {
  // 1. Inject Rules
  console.log('\n📦 [1/2] Injecting Rules...');
  const rulesScript = path.join(__dirname, 'inject-rules.js');
  execSync(`node "${rulesScript}" "${absoluteTargetDir}"`, { stdio: 'inherit' });

  // 2. Inject Skills
  console.log('\n📦 [2/2] Injecting Skills...');
  const skillsScript = path.join(__dirname, 'inject-skills.js');
  const skillTypeArg = skillType ? `--skill-type ${skillType}` : '';
  execSync(`node "${skillsScript}" ${skillTypeArg} "${absoluteTargetDir}"`, { stdio: 'inherit' });

  console.log('\n✨ 所有模板注入完成！');
  console.log(`👉 请在目标项目中检查 .trae/rules 和 .trae/skills 目录`);

} catch (error) {
  console.error('\n❌ 注入过程中发生错误:', error.message);
  process.exit(1);
}
