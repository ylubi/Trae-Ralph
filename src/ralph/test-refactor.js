
const assert = require('assert');

// Mock DOM Environment
class MockClassList {
    constructor(list = []) {
        this.list = new Set(list);
    }
    contains(cls) { return this.list.has(cls); }
    add(cls) { this.list.add(cls); }
    remove(cls) { this.list.delete(cls); }
    toString() { return Array.from(this.list).join(' '); }
}

class MockElement {
    constructor(tagName, classes = []) {
        this.tagName = tagName.toUpperCase();
        this.classList = new MockClassList(classes);
        this.attributes = new Map();
        this.children = [];
        this.textContent = '';
        this.parentElement = null;
    }

    getAttribute(name) { return this.attributes.get(name); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    hasAttribute(name) { return this.attributes.has(name); }
    
    querySelector(selector) {
        // Simple selector support
        if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            // DFS traversal
            for (const child of this.children) {
                if (child.classList.contains(cls)) return child;
                const found = child.querySelector(selector);
                if (found) return found;
            }
            return null;
        }
        if (selector === 'button') {
            // DFS traversal for tag name
            for (const child of this.children) {
                if (child.tagName === 'BUTTON') return child;
                const found = child.querySelector(selector);
                if (found) return found;
            }
            return null;
        }
        return null;
    }

    querySelectorAll(selector) {
        // Simple selector support
        if (selector === 'button') {
            return this.children.filter(c => c.tagName === 'BUTTON');
        }
        return [];
    }

    appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
    }
    
    get className() { return this.classList.toString(); }

    get innerText() { 
        if (this.textContent) return this.textContent;
        return this.children.map(c => c.innerText).join('');
    }

    get dataset() {
        const data = {};
        for (const [key, value] of this.attributes) {
            if (key.startsWith('data-')) {
                // Convert data-kebab-case to camelCase
                const prop = key.slice(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
                data[prop] = value;
            }
        }
        return data;
    }
}

// Global Document Mock
const mockElements = [];
global.document = {
    getElementsByClassName: (cls) => {
        if (cls === 'ai-agent-task') return mockElements;
        return [];
    },
    querySelector: (selector) => {
        if (selector === '.confirm-popover-body') return null; // Default no popup
        return null;
    },
    querySelectorAll: (selector) => []
};
global.window = {};

// Load TraeAgentTaskManager
const taskManager = require('./trae-agent-task-manager');

// ==========================================
// Test Cases
// ==========================================

console.log('🚀 Starting TraeAgentTaskManager Verification...');

// 1. Test Task Classification
console.log('\nTesting Task Classification...');

// Case 1.1: Info (Plain Text)
const taskInfo = new MockElement('div', ['ai-agent-task']);
taskInfo.textContent = 'This is just info.';
mockElements.push(taskInfo);

// Case 1.2: Terminal Command (Card)
const taskTerminal = new MockElement('div', ['ai-agent-task']);
const card = new MockElement('div', ['icd-run-command-card-v2']);
const cardContent = new MockElement('div', ['icd-run-command-card-v2-content']);
const runBtn = new MockElement('div', ['icd-run-command-card-v2-actions-btn-run']);
card.appendChild(cardContent);
card.appendChild(runBtn);
taskTerminal.appendChild(card);
mockElements.push(taskTerminal);

// Case 1.3: Click (Continue Button)
const taskClick = new MockElement('div', ['ai-agent-task']);
const alertMsg = new MockElement('div', ['icube-alert-msg']);
alertMsg.textContent = '输出过长';
const continueBtn = new MockElement('div', ['icube-alert-action']);
taskClick.appendChild(alertMsg);
taskClick.appendChild(continueBtn);
mockElements.push(taskClick);

// Case 1.4: Reply (Continue Text)
const taskReply = new MockElement('div', ['ai-agent-task']);
taskReply.textContent = '上下文长度已超过最大限制';
mockElements.push(taskReply);

// Case 1.5: Restart (Regenerate Button)
const taskRestart = new MockElement('div', ['ai-agent-task']);
const regenBtn = new MockElement('button', []);
regenBtn.textContent = '重新生成';
taskRestart.appendChild(regenBtn);
mockElements.push(taskRestart);

// Run Update
taskManager.update();

// Verify Classification
const infoTask = taskManager.getTask(taskInfo.getAttribute('data-ralph-task-id'));
assert.strictEqual(infoTask.type, taskManager.TYPES.INFO, 'Task 1 should be INFO');

const termTask = taskManager.getTask(taskTerminal.getAttribute('data-ralph-task-id'));
assert.strictEqual(termTask.type, taskManager.TYPES.OP_TERMINAL, 'Task 2 should be OP_TERMINAL');

const clickTask = taskManager.getTask(taskClick.getAttribute('data-ralph-task-id'));
assert.strictEqual(clickTask.type, taskManager.TYPES.OP_CLICK, 'Task 3 should be OP_CLICK');

const replyTask = taskManager.getTask(taskReply.getAttribute('data-ralph-task-id'));
assert.strictEqual(replyTask.type, taskManager.TYPES.OP_REPLY, 'Task 4 should be OP_REPLY');

const restartTask = taskManager.getTask(taskRestart.getAttribute('data-ralph-task-id'));
assert.strictEqual(restartTask.type, taskManager.TYPES.OP_RESTART, 'Task 5 should be OP_RESTART');

console.log('✅ Classification Tests Passed');

// 2. Test Priority Queue
console.log('\nTesting Priority Queue...');
const pendingOp = taskManager.getNextPendingOp();
// Expected Order: TERMINAL > CLICK > RESTART > REPLY
// So we expect the TERMINAL task first
assert.strictEqual(pendingOp.id, termTask.id, 'Should prioritize TERMINAL task');

// Mark as handled to get next
taskManager.markAsHandled(termTask.id);
const nextOp1 = taskManager.getNextPendingOp();
assert.strictEqual(nextOp1.id, clickTask.id, 'Should prioritize CLICK task next');

// Next should be RESTART (80) > REPLY (50)
taskManager.markAsHandled(clickTask.id);
const nextOp2 = taskManager.getNextPendingOp();
assert.strictEqual(nextOp2.id, restartTask.id, 'Should prioritize RESTART task next');

// Finally REPLY
taskManager.markAsHandled(restartTask.id);
const nextOp3 = taskManager.getNextPendingOp();
assert.strictEqual(nextOp3.id, replyTask.id, 'Should prioritize REPLY task last');

console.log('✅ Priority Tests Passed');

// 2.1 Test Interactive Input Detection
console.log('\nTesting Interactive Input Detection...');

// Mock document.querySelectorAll for this test
const originalQuerySelectorAll = global.document.querySelectorAll;
global.document.querySelectorAll = (selector) => {
    if (selector === '.icd-run-command-card-v2') {
        const card = new MockElement('div', ['icd-run-command-card-v2']);
        card.textContent = 'Do you want to continue? (y/n) waiting for input';
        const input = new MockElement('textarea', ['xterm-helper-textarea']);
        card.appendChild(input);
        return [card];
    }
    return [];
};

const hasInteractive = taskManager.checkInteractiveInput();
assert.strictEqual(hasInteractive, true, 'Should detect interactive input');

// Restore
global.document.querySelectorAll = originalQuerySelectorAll;
console.log('✅ Interactive Input Tests Passed');

// 2.2 Test Task Completed Detection (Global Op)
console.log('\nTesting Task Completed Detection...');

// Mock document.querySelectorAll for this test
global.document.querySelectorAll = (selector) => {
    if (selector === '.latest-assistant-bar .status .status-text') {
        const statusText = new MockElement('div', ['status-text']);
        statusText.textContent = '任务完成';
        return [statusText];
    }
    return [];
};

const globalOp = taskManager.getGlobalOp();
assert.ok(globalOp, 'Should detect global op');
assert.strictEqual(globalOp.type, taskManager.TYPES.OP_REPLY, 'Should be OP_REPLY');
assert.strictEqual(globalOp.payload, '继续', 'Should send continue');
assert.strictEqual(globalOp.description, '任务完成确认', 'Should describe correctly');

// Restore
global.document.querySelectorAll = originalQuerySelectorAll;
console.log('✅ Task Completed Tests Passed');

// 3. Test LRU Eviction
console.log('\nTesting LRU Eviction (Max 50)...');
taskManager.reset(); // Clear existing
mockElements.length = 0; // Clear mock DOM

// Add 55 tasks
for (let i = 0; i < 55; i++) {
    const t = new MockElement('div', ['ai-agent-task']);
    t.textContent = `Task ${i}`;
    mockElements.push(t);
}

taskManager.update();

// Verify size
const tasks = Array.from(taskManager.tasks.values());
assert.strictEqual(tasks.length, 50, 'Should cap at 50 tasks');

// Verify eviction (Task 0-4 should be gone, 5-54 should remain)
// Note: DOM order is 0..54. TaskManager iterates DOM.
// If it adds in order, 0 is oldest.
// Wait, map iteration order is insertion order.
// When we process DOM, we encounter Task 0 first, add it. Then Task 1...
// So Task 0 is at the beginning of Map.
// When we exceed 50, we delete the first key (Task 0).
// So checking if Task 0 exists.
const firstTaskEl = mockElements[0];
const firstTaskId = firstTaskEl.getAttribute('data-ralph-task-id');
// Actually, since we just ran update(), the IDs are newly generated.
// We can check which elements have IDs that are still in the map.

// Let's verify by counting known IDs
let knownCount = 0;
mockElements.forEach(el => {
    const id = el.getAttribute('data-ralph-task-id');
    if (id && taskManager.getTask(id)) knownCount++;
});
assert.strictEqual(knownCount, 50, 'Only 50 elements should be tracked');

console.log('✅ LRU Tests Passed');

console.log('\n🎉 All Verification Tests Passed!');
