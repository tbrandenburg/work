#!/usr/bin/env node
// PoC: Interact with opencode ACP server programmatically
// Tests JSON API interactions

import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

// Helper to make HTTP requests
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null 
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json: null });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Start ACP server and get its port
function startAcpServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('opencode', ['acp', '--port', '0', '--print-logs'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let logBuffer = '';
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout waiting for ACP server to start'));
    }, 10000);
    
    proc.stderr.on('data', (data) => {
      logBuffer += data.toString();
      const match = logBuffer.match(/listening on.*:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        const port = parseInt(match[1]);
        resolve({ proc, port });
      }
    });
    
    proc.stdout.on('data', (data) => {
      logBuffer += data.toString();
      const match = logBuffer.match(/listening on.*:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        const port = parseInt(match[1]);
        resolve({ proc, port });
      }
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function exploreAcpApi(port) {
  console.log(`\n=== Exploring ACP API on port ${port} ===\n`);
  
  const endpoints = [
    { path: '/', method: 'GET' },
    { path: '/health', method: 'GET' },
    { path: '/status', method: 'GET' },
    { path: '/api', method: 'GET' },
    { path: '/sessions', method: 'GET' },
    { path: '/models', method: 'GET' },
    { path: '/agents', method: 'GET' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: port,
        path: endpoint.path,
        method: endpoint.method,
        headers: { 'Accept': 'application/json' }
      });
      
      results.push({
        endpoint: endpoint.path,
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        hasJson: response.json !== null,
        preview: response.body.substring(0, 200)
      });
      
      console.log(`${endpoint.method} ${endpoint.path}: ${response.statusCode}`);
      if (response.json) {
        console.log('  JSON response:', JSON.stringify(response.json, null, 2).substring(0, 500));
      }
    } catch (err) {
      console.log(`${endpoint.method} ${endpoint.path}: ERROR - ${err.message}`);
      results.push({
        endpoint: endpoint.path,
        error: err.message
      });
    }
  }
  
  return results;
}

async function main() {
  console.log('Starting ACP server...');
  
  let acpServer;
  try {
    acpServer = await startAcpServer();
    console.log(`✓ ACP server started on port ${acpServer.port}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await exploreAcpApi(acpServer.port);
    
    fs.writeFileSync('acp-api-results.json', JSON.stringify(results, null, 2));
    console.log('\n✓ Results saved to acp-api-results.json');
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (acpServer) {
      console.log('\nCleaning up...');
      acpServer.proc.kill();
    }
  }
}

main();
