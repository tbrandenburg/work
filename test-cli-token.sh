#!/bin/bash
echo "Testing CLI token selection..."
export GITHUB_TOKEN="ghp_1234567890123456789012345678901234567890"  
export CI_GITHUB_TOKEN="ghp_0987654321098765432109876543210987654321"
export PATH="/usr/bin:/bin"  # Minimal PATH without gh
/usr/bin/node ./bin/run.js auth status --format json 2>&1

