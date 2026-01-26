#!/bin/bash

# Initialize work CLI with tasks for a given topic
# Usage: ./init.sh "project description"

PROJECT_TOPIC="${1:-opentui snake game with state-of-the-art project setup}"
WORK_CLI="work"

echo "🚀 Initializing tasks for: $PROJECT_TOPIC"

# Create initial tasks based on the project topic
echo "📝 Creating initial tasks..."

$WORK_CLI create "Setup project structure" --kind task --priority high  
$WORK_CLI create "Implement core functionality" --kind task --priority high
$WORK_CLI create "Add tests and documentation" --kind task --priority medium

echo "✅ Initial tasks created!"
echo ""
echo "📋 Current task list:"
$WORK_CLI list

echo ""
echo "🔄 Ready for scrum cycle! Run: ./scrum-cycle.sh"
