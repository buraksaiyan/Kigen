#!/bin/bash

# Development helper scripts for Kigen app

# Function to check TypeScript errors
check_types() {
    echo "🔍 Checking TypeScript errors..."
    npx tsc --noEmit --pretty
}

# Function to start the development server with tunnel
start_tunnel() {
    echo "🚀 Starting Expo development server with tunnel..."
    npm run start -- --tunnel
}

# Function to clean node modules and reinstall
clean_install() {
    echo "🧹 Cleaning node modules and reinstalling..."
    rm -rf node_modules package-lock.json
    npm install
}

# Function to check for console.log statements
check_console_logs() {
    echo "📝 Checking for console.log statements..."
    grep -r "console.log" src/ --exclude-dir=node_modules
}

# Function to run all checks
check_all() {
    echo "🔄 Running all development checks..."
    check_types
    check_console_logs
}

# Check if function exists and run it
if declare -f "$1" > /dev/null; then
    "$@"
else
    echo "Available commands:"
    echo "  check_types     - Check TypeScript errors"
    echo "  start_tunnel    - Start development server with tunnel"
    echo "  clean_install   - Clean and reinstall dependencies"
    echo "  check_console_logs - Find console.log statements"
    echo "  check_all       - Run all checks"
    echo ""
    echo "Usage: ./scripts/dev-helpers.sh <command>"
fi
