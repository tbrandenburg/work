#!/usr/bin/env node
// Demo: ACP Session Resume
// Shows how to list and resume existing sessions

import { spawn } from 'child_process';

console.log('=== ACP Session Resume Demo ===\n');

const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;
let sessionList = [];
let newSessionId = null;

// Parse responses
acp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        handleMessage(msg);
      } catch (err) {
        // Ignore parse errors
      }
    }
  }
});

acp.stderr.on('data', () => {}); // Suppress stderr

function handleMessage(msg) {
  if (msg.error) {
    console.log(`✗ Error (id=${msg.id}):`, msg.error.message);
    return;
  }
  
  if (msg.id === 1) {
    console.log('✓ Initialized\n');
  } else if (msg.id === 2) {
    console.log('✓ Session list retrieved:');
    sessionList = msg.result.sessions || [];
    console.log(`  Found ${sessionList.length} existing sessions`);
    sessionList.forEach((s, i) => {
      console.log(`  [${i}] ${s.id} - ${s.name || 'Unnamed'} (${new Date(s.updatedAt).toLocaleString()})`);
    });
    console.log();
  } else if (msg.id === 3) {
    newSessionId = msg.result.sessionId;
    console.log(`✓ Created new session: ${newSessionId}\n`);
  } else if (msg.id === 4) {
    console.log('✓ Sent prompt to new session\n');
  } else if (msg.id === 5) {
    console.log('✓ Resumed existing session:', msg.result.sessionId);
    console.log('  Session state restored\n');
  }
}

function send(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  };
  acp.stdin.write(JSON.stringify(request) + '\n');
  return messageId;
}

// Test flow
setTimeout(() => {
  console.log('Step 1: Initialize\n');
  send('initialize', {
    protocolVersion: 1,
    clientInfo: { name: 'resume-demo', version: '1.0' },
    capabilities: {}
  });
}, 1000);

setTimeout(() => {
  console.log('Step 2: List existing sessions\n');
  send('session/list', {});
}, 3000);

setTimeout(() => {
  console.log('Step 3: Create new session\n');
  send('session/new', {
    cwd: process.cwd(),
    mcpServers: []
  });
}, 5000);

setTimeout(() => {
  if (newSessionId) {
    console.log('Step 4: Send prompt to new session\n');
    send('session/prompt', {
      sessionId: newSessionId,
      content: [{ role: 'user', content: 'Remember: The answer is 42' }]
    });
  }
}, 10000);

setTimeout(() => {
  if (sessionList.length > 0) {
    console.log('Step 5: Resume first existing session\n');
    send('session/load', {
      sessionId: sessionList[0].id
    });
  } else if (newSessionId) {
    console.log('Step 5: Resume the session we just created\n');
    send('session/load', {
      sessionId: newSessionId
    });
  } else {
    console.log('Step 5: Skipped (no sessions to resume)\n');
  }
}, 12000);

setTimeout(() => {
  console.log('=== Demo Complete ===\n');
  console.log('Key Takeaways:');
  console.log('  • session/list - Lists all available sessions');
  console.log('  • session/new - Creates new session');
  console.log('  • session/load - Resumes existing session by ID');
  console.log('  • Sessions persist across ACP process restarts');
  console.log();
  
  acp.kill();
  process.exit(0);
}, 14000);

acp.on('exit', () => {
  process.exit(0);
});
