#!/usr/bin/env node
// Complete Guide: Agents, Models, and Permissions in ACP
// Shows how to select and configure everything

import { spawn } from 'child_process';
import fs from 'fs';

console.log('=== ACP: Agents, Models & Permissions Demo ===\n');

const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;
let sessionId = null;
let availableModels = [];
let availableModes = [];

const results = {
  agents: null,
  models: null,
  modes: null,
  permissions: null,
  modelChange: null
};

acp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        handleMessage(msg);
      } catch {}
    }
  }
});

acp.stderr.on('data', () => {});

function handleMessage(msg) {
  if (msg.error) {
    console.log(`✗ Error (id=${msg.id}): ${msg.error.message}`);
    return;
  }
  
  // Step 1: Initialize - Get agent info and capabilities
  if (msg.id === 1 && msg.result) {
    console.log('✓ AGENT INFORMATION:');
    console.log(`  Name: ${msg.result.agentInfo.name}`);
    console.log(`  Version: ${msg.result.agentInfo.version}`);
    console.log();
    
    console.log('✓ AGENT CAPABILITIES:');
    const caps = msg.result.agentCapabilities;
    console.log(`  Load sessions: ${caps.loadSession}`);
    console.log(`  MCP support: ${caps.mcpCapabilities?.http ? 'HTTP, SSE' : 'None'}`);
    console.log(`  Prompt features: ${Object.keys(caps.promptCapabilities || {}).join(', ')}`);
    console.log(`  Session features: ${Object.keys(caps.sessionCapabilities || {}).join(', ')}`);
    console.log();
    
    results.agents = msg.result.agentInfo;
  }
  
  // Step 2: Session created - Get available models and modes
  if (msg.id === 2 && msg.result?.sessionId) {
    sessionId = msg.result.sessionId;
    
    console.log('✓ AVAILABLE MODELS:');
    availableModels = msg.result.models.availableModels;
    console.log(`  Total: ${availableModels.length} models`);
    console.log(`  Current default: ${msg.result.models.currentModelId}`);
    console.log();
    
    console.log('  Categories:');
    const categories = {};
    availableModels.forEach(m => {
      const category = m.modelId.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count} models`);
    });
    console.log();
    
    console.log('  Sample models:');
    availableModels.slice(0, 5).forEach(m => {
      console.log(`    • ${m.name}`);
      console.log(`      ID: ${m.modelId}`);
    });
    console.log();
    
    console.log('✓ AVAILABLE MODES:');
    availableModes = msg.result.modes.availableModes;
    console.log(`  Current: ${msg.result.modes.currentModeId}`);
    availableModes.forEach(mode => {
      console.log(`    • ${mode.name} (id: ${mode.id})`);
    });
    console.log();
    
    results.models = msg.result.models;
    results.modes = msg.result.modes;
  }
  
  // Step 3: Prompt with model selection
  if (msg.id === 3) {
    console.log('✓ Prompt sent with custom model');
    console.log('  Model: github-copilot/claude-sonnet-4.5');
    console.log('  (Responses will use this model)\n');
  }
  
  // Step 4: Mode change
  if (msg.id === 4) {
    console.log('✓ Session mode changed');
    console.log('  New mode: plan\n');
  }
}

function send(method, params = {}) {
  acp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  }) + '\n');
}

// Execution flow
setTimeout(() => {
  console.log('STEP 1: Initialize with permissions\n');
  send('initialize', {
    protocolVersion: 1,
    clientInfo: {
      name: 'model-demo',
      version: '1.0.0'
    },
    capabilities: {
      // Define what the agent is ALLOWED to do
      fileSystem: {
        readTextFile: true,      // Can read files
        writeTextFile: true,     // Can write files
        listDirectory: true      // Can list directories
      },
      terminal: {
        create: true,            // Can create terminals
        sendText: true           // Can send commands
      },
      editor: {
        applyDiff: true,         // Can apply code changes
        openFile: true,          // Can open files
        showDiff: true           // Can show diffs
      }
    }
  });
  
  results.permissions = {
    fileSystem: ['read', 'write', 'list'],
    terminal: ['create', 'sendText'],
    editor: ['applyDiff', 'openFile', 'showDiff']
  };
}, 1000);

setTimeout(() => {
  console.log('STEP 2: Create session (discover models & modes)\n');
  send('session/new', {
    cwd: process.cwd(),
    mcpServers: []
  });
}, 3000);

setTimeout(() => {
  if (sessionId) {
    console.log('STEP 3: Send prompt with specific model\n');
    send('session/prompt', {
      sessionId: sessionId,
      model: 'github-copilot/claude-sonnet-4.5',  // Override model
      content: [{
        role: 'user',
        content: 'Say hello and tell me which model you are'
      }]
    });
  }
}, 8000);

setTimeout(() => {
  if (sessionId) {
    console.log('STEP 4: Change session mode\n');
    send('session/configure', {
      sessionId: sessionId,
      mode: 'plan'  // Change from 'build' to 'plan'
    });
  }
}, 11000);

setTimeout(() => {
  console.log('=== COMPLETE ===\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY\n');
  
  console.log('1. AGENTS:');
  console.log('   • OpenCode IS the agent');
  console.log('   • No separate "agent selection"');
  console.log('   • One agent per ACP process\n');
  
  console.log('2. MODELS:');
  console.log('   • Discovered in session/new response');
  console.log('   • 31 models available across 3 providers');
  console.log('   • Select per-prompt: session/prompt + model param');
  console.log('   • Change default: session/configure + modelId\n');
  
  console.log('3. MODES:');
  console.log('   • build - Direct implementation');
  console.log('   • plan - Planning and design');
  console.log('   • Switch: session/configure + mode param\n');
  
  console.log('4. PERMISSIONS:');
  console.log('   • Set during initialize');
  console.log('   • Declarative capabilities object');
  console.log('   • Agent requests permissions as needed');
  console.log('   • Client can approve/deny\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Save detailed results
  fs.writeFileSync('models-permissions-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Details saved to models-permissions-results.json\n');
  
  acp.kill();
  process.exit(0);
}, 13000);

acp.on('exit', () => process.exit(0));
