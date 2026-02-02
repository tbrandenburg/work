#!/usr/bin/env node
// ✅ WORKING: ACP Session Resume
// Shows both session/load (with history) and session/resume (without history)

import { spawn } from 'child_process';

console.log('=== ACP Session Resume (WORKING) ===\n');

const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;
let sessions = [];
let targetSession = null;

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
    if (msg.error.data) {
      console.log('   Details:', JSON.stringify(msg.error.data));
    }
    return;
  }
  
  if (msg.id === 1) {
    console.log('✓ Initialized');
    console.log(`  Agent: ${msg.result.agentInfo.name} v${msg.result.agentInfo.version}`);
    console.log(`  Capabilities: load=${msg.result.agentCapabilities.loadSession}, ` +
                `resume=${msg.result.agentCapabilities.sessionCapabilities?.resume ? 'yes' : 'no'}\n`);
  } else if (msg.id === 2) {
    sessions = msg.result.sessions || [];
    console.log(`✓ Listed ${sessions.length} sessions\n`);
    
    if (sessions.length > 0) {
      const recent = sessions[0];
      console.log('  Most recent session:');
      console.log(`    Title: ${recent.title}`);
      console.log(`    ID: ${recent.sessionId}`);
      console.log(`    Dir: ${recent.cwd}`);
      console.log(`    Updated: ${new Date(recent.updatedAt).toLocaleString()}\n`);
      targetSession = recent;
    }
  } else if (msg.id === 3) {
    console.log('✓ Session loaded (with history replay)');
    console.log(`  Session: ${msg.result.sessionId}`);
    console.log(`  Model: ${msg.result.models?.currentModelId}`);
    console.log(`  Mode: ${msg.result.modes?.currentModeId}\n`);
  } else if (msg.id === 4) {
    console.log('✓ Session resumed (without history replay)');
    console.log(`  Session: ${msg.result.sessionId}`);
    console.log(`  Ready to continue conversation\n`);
  }
  
  // Handle history replay
  if (msg.method === 'session/update') {
    console.log('  ← History replay update received');
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

// Test flow
setTimeout(() => {
  console.log('STEP 1: Initialize\n');
  send('initialize', {
    protocolVersion: 1,
    clientInfo: { name: 'resume-test', version: '1.0' },
    capabilities: {}
  });
}, 1000);

setTimeout(() => {
  console.log('STEP 2: List sessions\n');
  send('session/list', {});
}, 3000);

setTimeout(() => {
  if (targetSession) {
    console.log('STEP 3: Load session (with history)\n');
    send('session/load', {
      sessionId: targetSession.sessionId,
      cwd: targetSession.cwd,
      mcpServers: []
    });
  } else {
    console.log('STEP 3: No sessions to load\n');
  }
}, 8000);

setTimeout(() => {
  if (targetSession) {
    console.log('STEP 4: Resume session (without history)\n');
    send('session/resume', {
      sessionId: targetSession.sessionId,
      cwd: targetSession.cwd,
      mcpServers: []
    });
  }
}, 13000);

setTimeout(() => {
  console.log('=== COMPLETE ===\n');
  console.log('Summary:');
  console.log('  session/list   - Lists all sessions');
  console.log('  session/load   - Resume WITH history replay (slow)');
  console.log('  session/resume - Resume WITHOUT history (fast)');
  console.log();
  console.log('When to use:');
  console.log('  • load   - Client needs full conversation history');
  console.log('  • resume - Just continue, assume context is retained\n');
  
  acp.kill();
  process.exit(0);
}, 16000);
