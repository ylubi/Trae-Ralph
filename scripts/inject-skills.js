const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('❌ 参数错误');
    console.error('用法 1 (注入单个): npm run skills:inject -- <skill-name> <target-project-path>');
    console.error('用法 2 (注入全部): npm run skills:inject -- <target-project-path>');
    console.error('示例: npm run skills:inject -- C:\\work\\tools\\test\\test-009');
    process.exit(1);
}

let skillName = null;
let targetProjectPath = null;
let injectAll = false;

// 参数解析逻辑
if (args.length === 1) {
    // 只有一个参数，默认为目标路径，执行全部注入
    targetProjectPath = args[0];
    injectAll = true;
} else {
    // 两个及以上参数，第一个是 skill 名，第二个是路径
    skillName = args[0];
    targetProjectPath = args[1];
}

const templatesDir = path.resolve(__dirname, '../templates/skills');

// 主执行流程
if (injectAll) {
    console.log(`🚀 开始批量注入所有 Skills 到: ${targetProjectPath}`);
    
    if (!fs.existsSync(templatesDir)) {
        console.error(`❌ 找不到 Skills 模板目录: ${templatesDir}`);
        process.exit(1);
    }

    const skills = fs.readdirSync(templatesDir).filter(file => {
        return fs.statSync(path.join(templatesDir, file)).isDirectory();
    });

    if (skills.length === 0) {
        console.warn('⚠️ 模板目录中没有找到任何 Skill 文件夹');
        process.exit(0);
    }

    let successCount = 0;
    skills.forEach(skill => {
        try {
            injectSingleSkill(skill, targetProjectPath);
            successCount++;
        } catch (err) {
            console.error(`❌ 注入 Skill [${skill}] 失败:`, err.message);
        }
    });

    console.log(`\n✨ 批量注入完成! 成功: ${successCount}/${skills.length}`);

} else {
    // 单个注入
    injectSingleSkill(skillName, targetProjectPath);
}


/**
 * 注入单个 Skill 的核心函数 (文件夹复制模式)
 * 1. 完整复制 Skill 文件夹下的所有文件
 * 2. 确保存在 SKILL.md 入口文件 (如果原名是 00-skill-manifest.md 则重命名)
 * 3. 确保 SKILL.md 包含 YAML Frontmatter (Trae 规范要求)
 * @param {string} name - Skill 名称 (文件夹名)
 * @param {string} targetRoot - 目标项目根目录
 */
function injectSingleSkill(name, targetRoot) {
    const sourceDir = path.join(templatesDir, name);
    const targetDir = path.resolve(targetRoot, '.trae/skills', name);
    
    console.log(`\n👉 处理 Skill: [${name}]`);

    // 1. 验证源是否存在
    if (!fs.existsSync(sourceDir)) {
        throw new Error(`找不到 Skill 模板目录: ${sourceDir}`);
    }

    // 2. 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. 复制所有文件
    const files = fs.readdirSync(sourceDir).sort();
    let copiedCount = 0;
    
    // 识别 manifest 文件
    let manifestFile = files.find(f => f === 'SKILL.md');
    if (!manifestFile) {
        manifestFile = files.find(f => f.includes('manifest') || f.startsWith('00'));
    }

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        
        // 跳过非文件 (如子目录，暂不处理递归)
        if (!fs.statSync(sourcePath).isFile()) continue;

        let destFileName = file;
        let isManifest = (file === manifestFile);

        // 如果是 manifest 文件，目标文件名强制为 SKILL.md
        if (isManifest && file !== 'SKILL.md') {
            destFileName = 'SKILL.md';
        }

        const destPath = path.join(targetDir, destFileName);

        if (isManifest && path.extname(file) === '.md') {
            // 对入口文件进行特殊处理：检查 Frontmatter
            let content = fs.readFileSync(sourcePath, 'utf8');
            if (!content.trim().startsWith('---')) {
                const frontmatter = `---\nname: "${name}"\ndescription: "Auto-injected skill: ${name}"\n---\n\n`;
                content = frontmatter + content;
                console.log(`   ✨ 为入口文件补充 YAML Frontmatter`);
            }
            fs.writeFileSync(destPath, content, 'utf8');
            console.log(`   📝 生成入口文件: SKILL.md (源名: ${file})`);
        } else {
            // 其他文件直接复制
            fs.copyFileSync(sourcePath, destPath);
            console.log(`   📂 复制文件: ${file}`);
        }
        copiedCount++;
    }

    console.log(`   ✅ 成功注入到: ${targetDir} (共处理 ${copiedCount} 个文件)`);
}
