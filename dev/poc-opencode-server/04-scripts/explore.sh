#!/bin/bash
# PoC: Explore opencode serve, connect, and acp
# Goal: Answer key integration questions with minimal code

set -e

echo "=== OpenCode Server PoC ==="
echo

# Clean up any existing servers
cleanup() {
    echo "Cleaning up..."
    if [ -n "$SERVER1_PID" ]; then kill $SERVER1_PID 2>/dev/null || true; fi
    if [ -n "$SERVER2_PID" ]; then kill $SERVER2_PID 2>/dev/null || true; fi
    if [ -n "$ACP_PID" ]; then kill $ACP_PID 2>/dev/null || true; fi
    sleep 1
}

trap cleanup EXIT

# Question 1: Start multiple servers with different system prompts
echo "Q1: Starting multiple opencode servers..."
echo

# Start server 1 on auto-assigned port
echo "Starting Server 1 (default)..."
opencode serve --port 0 --print-logs > server1.log 2>&1 &
SERVER1_PID=$!
sleep 3

# Extract port from logs
SERVER1_PORT=$(grep -oP 'listening on.*:(\d+)' server1.log | tail -1 | grep -oP '\d+$' || echo "")

if [ -z "$SERVER1_PORT" ]; then
    echo "Failed to extract Server 1 port, checking logs..."
    cat server1.log
    exit 1
fi

echo "Server 1 running on port: $SERVER1_PORT (PID: $SERVER1_PID)"
echo

# Start server 2 on different port
echo "Starting Server 2..."
opencode serve --port 0 --print-logs > server2.log 2>&1 &
SERVER2_PID=$!
sleep 3

SERVER2_PORT=$(grep -oP 'listening on.*:(\d+)' server2.log | tail -1 | grep -oP '\d+$' || echo "")

if [ -z "$SERVER2_PORT" ]; then
    echo "Failed to extract Server 2 port, checking logs..."
    cat server2.log
    exit 1
fi

echo "Server 2 running on port: $SERVER2_PORT (PID: $SERVER2_PID)"
echo

# Question 2: Check if ports are automatically chosen
echo "Q2: Port auto-assignment verification"
echo "Server 1 Port: $SERVER1_PORT"
echo "Server 2 Port: $SERVER2_PORT"
if [ "$SERVER1_PORT" != "$SERVER2_PORT" ]; then
    echo "✓ Ports are automatically chosen and different"
else
    echo "✗ Ports are the same - potential issue"
fi
echo

# Question 3: Check for JSON API endpoints
echo "Q3: Exploring server API endpoints..."
echo

echo "Testing Server 1 at http://localhost:$SERVER1_PORT..."
curl -s "http://localhost:$SERVER1_PORT/" | head -20 || echo "No response on /"

echo
echo "Trying /api/status..."
curl -s "http://localhost:$SERVER1_PORT/api/status" || echo "No /api/status endpoint"

echo
echo "Trying /health..."
curl -s "http://localhost:$SERVER1_PORT/health" || echo "No /health endpoint"

echo
echo "Trying /info..."
curl -s "http://localhost:$SERVER1_PORT/info" || echo "No /info endpoint"

echo
echo

# Question 4: Start ACP server
echo "Q4: Starting ACP server..."
opencode acp --port 0 --print-logs > acp.log 2>&1 &
ACP_PID=$!
sleep 3

ACP_PORT=$(grep -oP 'listening on.*:(\d+)' acp.log | tail -1 | grep -oP '\d+$' || echo "")

if [ -z "$ACP_PORT" ]; then
    echo "Failed to extract ACP port, checking logs..."
    cat acp.log
else
    echo "ACP server running on port: $ACP_PORT (PID: $ACP_PID)"
    echo
    
    echo "Testing ACP endpoints..."
    curl -s "http://localhost:$ACP_PORT/" | head -20 || echo "No response"
fi

echo
echo "=== Exploration Complete ==="
echo "Check server1.log, server2.log, and acp.log for details"
