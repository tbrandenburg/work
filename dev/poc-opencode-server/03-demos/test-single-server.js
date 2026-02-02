#!/usr/bin/env node
// SINGLE SERVER EXPLORATION - De-risking OpenCode HTTP API

import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

// Start opencode serve and capture port
const proc = spawn('opencode', ['serve', '--port', '0', '--print-logs'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let port = null;
let buffer = '';

proc.stdout.on('data', checkForPort);
proc.stderr.on('data', checkForPort);

function checkForPort(data) {
  buffer += data.toString();
  const match = buffer.match(/listening on.*:(\d+)/);
  if (match && !port) {
    port = parseInt(match[1]);
    console.log(`✓ Server started on port ${port}\n`);
    setTimeout(runTests, 2000); // Give server time to fully initialize
  }
}

function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Accept': 'application/json' }
    };
    
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = data.length;
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== API EXPLORATION ===\n');
  
  const findings = {
    port_assignment: 'Auto-assigned: ' + port,
    endpoints: {}
  };
  
  // Test common API patterns
  const paths = [
    '/api/status',
    '/api/sessions',
    '/api/models',
    '/api/config',
    '/api/agents',
    '/health',
    '/info'
  ];
  
  console.log('Testing GET endpoints...\n');
  for (const path of paths) {
    try {
      const res = await httpRequest('GET', path);
      console.log(`GET ${path}: ${res.status}`);
      
      if (res.json) {
        console.log(`  Has JSON: ${Object.keys(res.json).join(', ')}`);
        findings.endpoints[path] = {
          status: res.status,
          hasJson: true,
          keys: Object.keys(res.json)
        };
      } else {
        console.log(`  Returns HTML/text (${res.raw.length} bytes)`);
        findings.endpoints[path] = {
          status: res.status,
          hasJson: false
        };
      }
    } catch (err) {
      console.log(`GET ${path}: ERROR - ${err.code || err.message}`);
      findings.endpoints[path] = { error: err.message };
    }
  }
  
  // Test POST message
  console.log('\nTesting POST /api/chat...');
  try {
    const res = await httpRequest('POST', '/api/chat', {
      message: 'Hello',
      stream: false
    });
    console.log(`POST /api/chat: ${res.status}`);
    if (res.json) {
      console.log(`  Response keys: ${Object.keys(res.json).join(', ')}`);
      findings.chat_api = { status: res.status, works: true };
    }
  } catch (err) {
    console.log(`POST /api/chat: ERROR - ${err.message}`);
    findings.chat_api = { error: err.message };
  }
  
  // Save findings
  fs.writeFileSync('findings.json', JSON.stringify(findings, null, 2));
  console.log('\n✓ Saved findings to findings.json');
  
  console.log('\n=== CLEANUP ===');
  proc.kill();
  process.exit(0);
}

setTimeout(() => {
  if (!port) {
    console.error('Timeout: Server did not start');
    proc.kill();
    process.exit(1);
  }
}, 15000);
