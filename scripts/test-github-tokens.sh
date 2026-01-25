#!/bin/bash

# Test script to verify GitHub token permissions
echo "Testing GitHub token permissions..."

if [ -n "$CI_GITHUB_TOKEN" ]; then
    echo "CI_GITHUB_TOKEN is available"
    # Test access to work repository
    echo "Testing access to tbrandenburg/work..."
    curl -H "Authorization: token $CI_GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         https://api.github.com/repos/tbrandenburg/work/issues \
         -w "Status: %{http_code}\n" -s -o /dev/null
    
    # Test access to playground repository  
    echo "Testing access to tbrandenburg/playground..."
    curl -H "Authorization: token $CI_GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         https://api.github.com/repos/tbrandenburg/playground/issues \
         -w "Status: %{http_code}\n" -s -o /dev/null
else
    echo "CI_GITHUB_TOKEN is not available"
fi

if [ -n "$GITHUB_TOKEN" ]; then
    echo "GITHUB_TOKEN is available"
    # Test access to work repository
    echo "Testing GITHUB_TOKEN access to tbrandenburg/work..."
    curl -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         https://api.github.com/repos/tbrandenburg/work/issues \
         -w "Status: %{http_code}\n" -s -o /dev/null
else
    echo "GITHUB_TOKEN is not available"
fi
