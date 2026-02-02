#!/usr/bin/env node
// PoC: Complete OpenCode ACP Integration
// Demonstrates: initialize, create session, send prompt, receive responses

import { spawn } from 'child_process';
import fs from 'fs';

const results = {
  server_start: null,
  initialize: null,
  session_new: null,
  session_prompt: null,
  responses: []
};

// Start ACP server
console.log('Starting OpenCode ACP server...\n');
const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;
let sessionId = null;

// Parse JSON-RPC messages
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
        console.log('Parse error:', err.message);
      }
    }
  }
});

acp.stderr.on('data', (data) => {
  // Show all stderr for debugging
  const str = data.toString();
  if (!str.includes('INFO') && !str.includes('service=')) {
    console.error('ACP Stderr:', str.substring(0, 500));
  }
});

function handleMessage(msg) {
  console.log(`← Response (id=${msg.id || 'notify'}):`);
  
  if (msg.error) {
    console.log('  ERROR:', msg.error.message);
    results.responses.push({ error: msg.error });
    return;
  }
  
  if (msg.result) {
    console.log('  Success:', JSON.stringify(msg.result).substring(0, 200));
    results.responses.push({ id: msg.id, result: msg.result });
    
    // Handle specific responses
    if (msg.id === 1) {
      results.initialize = msg.result;
    } else if (msg.id === 2) {
      results.session_new = msg.result;
      sessionId = msg.result.sessionId;
    } else if (msg.id === 3) {
      results.session_prompt = msg.result;
    }
  }
  
  // Handle streaming notifications
  if (msg.method === 'session/update') {
    console.log('  Streaming update:', JSON.stringify(msg.params).substring(0, 150));
    results.responses.push({ notification: msg.method, params: msg.params });
  }
}

function send(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  };
  console.log(`\n→ Sending (id=${messageId}): ${method}`);
  acp.stdin.write(JSON.stringify(request) + '\n');
  return messageId;
}

// Test sequence
setTimeout(() => {
  console.log('=== STEP 1: Initialize ===\n');
  send('initialize', {
    protocolVersion: 1,
    clientInfo: {
      name: 'poc-test-client',
      version: '0.0.1'
    },
    capabilities: {
      fileSystem: { readTextFile: true },
      terminal: { create: true }
    }
  });
}, 1000);

setTimeout(() => {
  if (!results.initialize) {
    console.error('Initialize failed, stopping');
    acp.kill();
    process.exit(1);
  }
  
  console.log('\n=== STEP 2: Create Session ===\n');
  send('session/new', {
    cwd: process.cwd(),
    mcpServers: []
  });
}, 3000);

setTimeout(() => {
  if (!sessionId) {
    console.error('\n⏳ Session creation still pending... Results:');
    console.log(JSON.stringify(results, null, 2).substring(0, 1000));
    // Don't exit, wait more
  } else {
    console.log('\n=== STEP 3: Send Prompt ===\n');
    send('session/prompt', {
      sessionId: sessionId,
      content: [
        {
          role: 'user',
          content: 'Write a hello world program in Python. Keep it simple.'
        }
      ]
    });
  }
}, 8000);

setTimeout(() => {
  console.log('\n=== Test Complete ===\n');
  console.log('Summary:');
  console.log(`  Initialize: ${results.initialize ? '✓' : '✗'}`);
  console.log(`  Session: ${results.session_new ? '✓' : '✗'}`);
  console.log(`  Prompt: ${results.session_prompt ? '✓' : '✗'}`);
  console.log(`  Responses: ${results.responses.length} messages`);
  
  fs.writeFileSync('acp-results.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Full results saved to acp-results.json\n');
  
  acp.kill();
  process.exit(0);
}, 15000);

acp.on('exit', (code) => {
  console.log(`\nACP exited with code ${code}`);
  process.exit(code);
});
