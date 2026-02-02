// Testing @agentclientprotocol/sdk with OpenCode
// Comparing SDK approach vs raw JSON-RPC

const { ClientSideConnection } = require('@agentclientprotocol/sdk');
const { spawn } = require('child_process');

console.log('=== Testing @agentclientprotocol/sdk ===\n');

// Spawn OpenCode ACP process
const acpProcess = spawn('opencode', ['acp', '--cwd', process.cwd()], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('✓ OpenCode ACP process spawned\n');

// Create SDK client connection
const client = new ClientSideConnection({
  // Provide the stdio streams from our spawned process
  stdin: acpProcess.stdin,
  stdout: acpProcess.stdout,
  stderr: acpProcess.stderr,
  
  // Client info
  clientInfo: {
    name: 'sdk-test-client',
    version: '1.0.0'
  },
  
  // Capabilities (permissions)
  capabilities: {
    fileSystem: {
      readTextFile: true,
      writeTextFile: true,
      listDirectory: true
    },
    terminal: {
      create: true,
      sendText: true
    },
    editor: {
      applyDiff: true,
      openFile: true,
      showDiff: true
    }
  }
});

console.log('✓ ClientSideConnection created\n');

async function runTests() {
  try {
    // Step 1: Initialize
    console.log('STEP 1: Initialize connection...');
    const initResult = await client.initialize();
    console.log('✓ Initialized');
    console.log(`  Agent: ${initResult.agentInfo.name} v${initResult.agentInfo.version}`);
    console.log(`  Capabilities: ${Object.keys(initResult.agentCapabilities).join(', ')}`);
    console.log();
    
    // Step 2: Create session
    console.log('STEP 2: Create new session...');
    const sessionResult = await client.newSession({
      cwd: process.cwd(),
      mcpServers: []
    });
    console.log('✓ Session created');
    console.log(`  Session ID: ${sessionResult.sessionId}`);
    console.log(`  Default model: ${sessionResult.models.currentModelId}`);
    console.log(`  Available models: ${sessionResult.models.availableModels.length}`);
    console.log();
    
    // Step 3: List sessions (unstable API)
    console.log('STEP 3: List existing sessions...');
    try {
      const sessionsResult = await client.unstable_listSessions({});
      console.log('✓ Sessions listed');
      console.log(`  Total sessions: ${sessionsResult.sessions.length}`);
      if (sessionsResult.sessions.length > 0) {
        const recent = sessionsResult.sessions[0];
        console.log(`  Most recent: ${recent.title || 'Unnamed'}`);
      }
    } catch (err) {
      console.log('✗ List sessions failed:', err.message);
    }
    console.log();
    
    // Step 4: Send prompt
    console.log('STEP 4: Send prompt...');
    const promptResult = await client.prompt({
      sessionId: sessionResult.sessionId,
      content: [{
        role: 'user',
        content: 'Say hello and confirm you received this message'
      }],
      model: 'github-copilot/claude-sonnet-4.5'
    });
    console.log('✓ Prompt sent');
    console.log();
    
    // Step 5: Change model
    console.log('STEP 5: Change session model...');
    try {
      await client.unstable_setSessionModel({
        sessionId: sessionResult.sessionId,
        modelId: 'github-copilot/gpt-5.2-codex'
      });
      console.log('✓ Model changed to GPT-5.2-Codex');
    } catch (err) {
      console.log('✗ Model change failed:', err.message);
    }
    console.log();
    
    // Step 6: Change mode
    console.log('STEP 6: Change session mode...');
    try {
      await client.setSessionMode({
        sessionId: sessionResult.sessionId,
        mode: 'plan'
      });
      console.log('✓ Mode changed to plan');
    } catch (err) {
      console.log('✗ Mode change failed:', err.message);
    }
    console.log();
    
    console.log('=== SDK TEST COMPLETE ===\n');
    console.log('COMPARISON: SDK vs Raw JSON-RPC\n');
    console.log('SDK Advantages:');
    console.log('  ✓ Type-safe TypeScript API');
    console.log('  ✓ Promise-based, no manual JSON-RPC');
    console.log('  ✓ Built-in error handling');
    console.log('  ✓ Methods like initialize(), newSession(), prompt()');
    console.log('  ✓ No manual message ID tracking');
    console.log('  ✓ No manual stdin/stdout parsing');
    console.log();
    console.log('Raw JSON-RPC Advantages:');
    console.log('  ✓ No dependencies');
    console.log('  ✓ Full control over protocol');
    console.log('  ✓ Works in any language');
    console.log('  ✓ Lighter weight');
    console.log();
    console.log('VERDICT: SDK is better for TypeScript/JavaScript clients!');
    console.log();
    
    acpProcess.kill();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    acpProcess.kill();
    process.exit(1);
  }
}

// Wait a bit for initialization then run tests
setTimeout(runTests, 2000);

// Handle process exit
acpProcess.on('exit', (code) => {
  console.log(`ACP process exited with code ${code}`);
});
