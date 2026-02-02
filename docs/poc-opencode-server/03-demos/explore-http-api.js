#!/usr/bin/env node
// PoC: Programmatic interaction with opencode serve
// Minimal exploration of HTTP API

import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

function httpGet(port, path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, { 
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, json, raw: data });
        } catch {
          resolve({ status: res.statusCode, json: null, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(port, path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, json, raw: responseData });
        } catch {
          resolve({ status: res.statusCode, json: null, raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function startServer(systemPrompt = null, model = null, preferredPort = 0) {
  return new Promise((resolve, reject) => {
    const args = ['serve', '--port', String(preferredPort), '--print-logs'];
    if (systemPrompt) args.push('--prompt', systemPrompt);
    if (model) args.push('--model', model);
    
    const proc = spawn('opencode', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let buffer = '';
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout'));
    }, 10000);
    
    const checkPort = (data) => {
      buffer += data.toString();
      const match = buffer.match(/listening on.*:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve({ proc, port: parseInt(match[1]) });
      }
    };
    
    proc.stdout.on('data', checkPort);
    proc.stderr.on('data', checkPort);
  });
}

async function main() {
  console.log('=== OpenCode Serve API Exploration ===\n');
  
  // Q1 & Q2: Multiple servers with different configs
  console.log('Starting Server 1 (default, auto-port)...');
  const server1 = await startServer(null, null, 0);
  console.log(`✓ Server 1 on port ${server1.port}\n`);
  
  console.log('Starting Server 2 (with system prompt, explicit port)...');
  const server2 = await startServer('You are a Python expert', null, 5000);
  console.log(`✓ Server 2 on port ${server2.port}\n`);
  
  if (server1.port !== server2.port) {
    console.log('✓ Ports auto-assigned correctly\n');
  }
  
  // Q3: Check for JSON API
  console.log('Testing API endpoints on Server 1...\n');
  
  const endpoints = [
    '/api/status',
    '/api/sessions',
    '/api/models',
    '/api/agents',
    '/api/config'
  ];
  
  const results = {};
  for (const endpoint of endpoints) {
    try {
      const res = await httpGet(server1.port, endpoint);
      console.log(`GET ${endpoint}: ${res.status}`);
      if (res.json) {
        console.log('  JSON:', JSON.stringify(res.json).substring(0, 150));
        results[endpoint] = res.json;
      } else {
        console.log('  Raw:', res.raw.substring(0, 100));
      }
    } catch (err) {
      console.log(`GET ${endpoint}: ERROR - ${err.message}`);
    }
  }
  
  // Q4: Try posting a message
  console.log('\nTesting message posting...');
  try {
    const res = await httpPost(server1.port, '/api/message', {
      message: 'Hello, write a hello world in Python',
      model: 'anthropic/claude-3-5-sonnet-20241022'
    });
    console.log('POST /api/message:', res.status);
    if (res.json) {
      console.log('  Response:', JSON.stringify(res.json).substring(0, 200));
    }
  } catch (err) {
    console.log('POST /api/message: ERROR -', err.message);
  }
  
  // Save results
  fs.writeFileSync('api-exploration.json', JSON.stringify(results, null, 2));
  console.log('\n✓ Results saved to api-exploration.json');
  
  // Cleanup
  console.log('\nCleaning up...');
  server1.proc.kill();
  server2.proc.kill();
}

main().catch(console.error);
