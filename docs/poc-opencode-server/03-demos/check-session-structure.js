#!/usr/bin/env node
// Quick check of session list structure

import { spawn } from 'child_process';

const acp = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let messageId = 0;

acp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        if (msg.id === 2 && msg.result) {
          console.log('Session list response:');
          console.log(JSON.stringify(msg.result, null, 2));
          acp.kill();
          process.exit(0);
        }
      } catch {}
    }
  }
});

acp.stderr.on('data', () => {});

function send(method, params = {}) {
  acp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  }) + '\n');
}

setTimeout(() => {
  send('initialize', {
    protocolVersion: 1,
    clientInfo: { name: 'test', version: '1.0' },
    capabilities: {}
  });
}, 1000);

setTimeout(() => {
  send('session/list', {});
}, 3000);

setTimeout(() => {
  acp.kill();
  process.exit(1);
}, 10000);
