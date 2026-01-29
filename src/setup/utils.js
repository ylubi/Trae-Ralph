const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

function parseList(value) {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
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

module.exports = {
  parseList,
  normalizePath,
  collectAllFiles,
  collectMarkdownFiles,
  hashDirectory,
  askQuestion
};
