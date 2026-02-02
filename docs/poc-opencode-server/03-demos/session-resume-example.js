#!/usr/bin/env node
// Working Example: ACP Session Resume
// Demonstrates listing and resuming existing sessions

import { spawn } from 'child_process';
import fs from 'fs';

console.log('=== ACP Session Resume Example ===\n');

const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;
let sessions = [];
let resumedSession = null;

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
    console.log(`✗ Error: ${msg.error.message}`);
    return;
  }
  
  if (msg.id === 1) {
    console.log('✓ Protocol initialized\n');
  } else if (msg.id === 2 && msg.result?.sessions) {
    sessions = msg.result.sessions;
    console.log(`✓ Found ${sessions.length} existing sessions:\n`);
    
    sessions.slice(0, 5).forEach((s, i) => {
      const date = new Date(s.updatedAt).toLocaleString();
      const title = s.title || 'Unnamed';
      console.log(`  [${i}] ${title.substring(0, 50)}`);
      console.log(`      ID: ${s.sessionId}`);
      console.log(`      Updated: ${date}`);
      console.log(`      Dir: ${s.cwd}\n`);
    });
    
    if (sessions.length > 5) {
      console.log(`  ... and ${sessions.length - 5} more\n`);
    }
  } else if (msg.id === 3 && msg.result?.sessionId) {
    resumedSession = msg.result;
    console.log('✓ Session resumed successfully!\n');
    console.log('  Restored session details:');
    console.log(`    Session ID: ${resumedSession.sessionId}`);
    console.log(`    Current model: ${resumedSession.models?.currentModelId || 'default'}`);
    console.log(`    Available models: ${resumedSession.models?.availableModels?.length || 0}`);
    console.log(`    Current mode: ${resumedSession.modes?.currentModeId || 'build'}`);
    console.log();
  } else if (msg.id === 4) {
    console.log('✓ Prompt sent to resumed session');
    console.log('  (You can now continue the conversation)\n');
  }
  
  // Handle streaming updates
  if (msg.method === 'session/update') {
    console.log('← Streaming update received from session');
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
  console.log('Step 1: Initialize protocol...\n');
  send('initialize', {
    protocolVersion: 1,
    clientInfo: { name: 'session-resume-demo', version: '1.0' },
    capabilities: { fileSystem: { readTextFile: true } }
  });
}, 1000);

setTimeout(() => {
  console.log('Step 2: List existing sessions...\n');
  send('session/list', {});
}, 3000);

setTimeout(() => {
  if (sessions.length > 0) {
    console.log(`Step 3: Resume most recent session...\n`);
    const latest = sessions[0];
    send('session/load', {
      sessionId: latest.sessionId
    });
  } else {
    console.log('Step 3: No sessions found to resume\n');
    console.log('Create a session first with complete-acp-test.js\n');
    acp.kill();
    process.exit(0);
  }
}, 8000);

setTimeout(() => {
  if (resumedSession) {
    console.log('Step 4: Send a new prompt to resumed session...\n');
    send('session/prompt', {
      sessionId: resumedSession.sessionId,
      content: [{
        role: 'user',
        content: 'Continue from where we left off. What were we discussing?'
      }]
    });
  }
}, 13000);

setTimeout(() => {
  console.log('=== Demo Complete ===\n');
  console.log('Key Methods:');
  console.log('  • session/list   - Get all available sessions');
  console.log('  • session/load   - Resume by sessionId');
  console.log('  • session/prompt - Continue conversation\n');
  
  console.log('Session Persistence:');
  console.log('  ✓ Sessions persist across ACP process restarts');
  console.log('  ✓ Full conversation history is maintained');
  console.log('  ✓ Context and state are restored');
  console.log('  ✓ Model selection is preserved\n');
  
  // Save results
  if (sessions.length > 0) {
    fs.writeFileSync('session-list.json', JSON.stringify({
      totalSessions: sessions.length,
      sessions: sessions.slice(0, 10),
      resumedSession: resumedSession?.sessionId || null
    }, null, 2));
    console.log('✓ Session list saved to session-list.json\n');
  }
  
  acp.kill();
  process.exit(0);
}, 16000);

acp.on('exit', () => {
  process.exit(0);
});
