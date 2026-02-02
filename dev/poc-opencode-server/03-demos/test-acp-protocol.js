#!/usr/bin/env node
// PoC: OpenCode ACP (Agent Client Protocol) - JSON-RPC over stdin/stdout
// This is the REAL programmatic interface for opencode

import { spawn } from 'child_process';

console.log('=== OpenCode ACP Protocol Test ===\n');

// Start ACP server as subprocess
const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'inherit'] // stdin/stdout for protocol, stderr to console
});

let buffer = '';
let messageId = 0;

// Handle JSON-RPC responses
acp.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        console.log('← Received:', JSON.stringify(msg, null, 2).substring(0, 500));
      } catch (err) {
        console.log('← Raw:', line.substring(0, 200));
      }
    }
  }
});

// Send JSON-RPC request
function send(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  };
  console.log('\n→ Sending:', JSON.stringify(request).substring(0, 200));
  acp.stdin.write(JSON.stringify(request) + '\n');
}

// Run test sequence
setTimeout(() => {
  console.log('\n=== Testing ACP Protocol ===\n');
  
  // Initialize
  send('initialize', {
    protocolVersion: '1.0',
    clientInfo: { name: 'poc-test', version: '0.0.1' }
  });
  
  setTimeout(() => {
    // List models
    send('models/list', {});
    
    setTimeout(() => {
      // Send a message
      send('chat/send', {
        message: 'Write hello world in Python',
        model: 'anthropic/claude-3-5-sonnet-20241022',
        stream: false
      });
      
      setTimeout(() => {
        console.log('\n=== Test Complete ===');
        acp.kill();
        process.exit(0);
      }, 5000);
    }, 2000);
  }, 2000);
}, 2000);

acp.on('exit', (code) => {
  console.log(`\nACP process exited with code ${code}`);
});
