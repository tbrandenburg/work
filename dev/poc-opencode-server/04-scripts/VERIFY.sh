#!/bin/bash
# Quick verification script

echo "=== OpenCode PoC Verification ==="
echo

# Check OpenCode is installed
if ! command -v opencode &> /dev/null; then
    echo "✗ OpenCode not found. Install with: npm install -g opencode-ai"
    exit 1
fi
echo "✓ OpenCode found: $(opencode --version 2>&1 | head -1)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check files
echo
echo "Checking PoC files..."
for file in INDEX.md SUMMARY.md FINDINGS.md APPLICATION_GUIDE.md complete-acp-test.js; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file MISSING"
    fi
done

echo
echo "=== Ready to run! ==="
echo
echo "Quick start:"
echo "  node complete-acp-test.js"
echo
echo "Read documentation:"
echo "  cat INDEX.md"
