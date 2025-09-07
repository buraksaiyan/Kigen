#!/bin/bash

# Configuration management script for Kigen app

# Function to show current environment configuration
show_config() {
    echo "🔧 Current Configuration:"
    echo "----------------------------------------"
    echo "Environment files:"
    ls -la .env* 2>/dev/null || echo "No environment files found"
    echo ""
    echo "Build configuration (app.json):"
    grep -A 5 -B 2 "version\|buildNumber\|versionCode" app.json 2>/dev/null || echo "Could not read app.json"
    echo ""
    echo "TypeScript config:"
    grep -A 3 -B 1 "target\|module" tsconfig.json 2>/dev/null || echo "Could not read tsconfig.json"
}

# Function to check for development/debug code
check_debug_code() {
    echo "🐛 Checking for debug code in source..."
    echo "Console statements:"
    find src/ -name "*.ts*" -exec grep -l "console\." {} \; | head -10
    echo ""
    echo "Development flags:"
    grep -r "__DEV__" src/ --include="*.ts*" | head -5
    echo ""
    echo "TODO/FIXME comments:"
    grep -r -i "todo\|fixme" src/ --include="*.ts*" | head -5
}

# Function to validate app configuration
validate_config() {
    echo "✅ Validating app configuration..."
    
    # Check if required env files exist
    if [[ ! -f ".env" ]]; then
        echo "❌ Missing .env file"
    else
        echo "✅ .env file exists"
    fi
    
    # Check app.json structure
    if ! jq empty app.json 2>/dev/null; then
        echo "❌ Invalid JSON in app.json"
    else
        echo "✅ app.json is valid JSON"
    fi
    
    # Check TypeScript config
    if ! npx tsc --noEmit --dry > /dev/null 2>&1; then
        echo "❌ TypeScript configuration issues"
    else
        echo "✅ TypeScript configuration is valid"
    fi
}

# Function to clean debug outputs
clean_debug() {
    echo "🧹 This would remove debug code (not implemented for safety)"
    echo "Files with console statements:"
    find src/ -name "*.ts*" -exec grep -l "console\." {} \;
    echo ""
    echo "Run manually: sed -i '/console\./d' <filename> to remove console statements"
}

# Check if function exists and run it
if declare -f "$1" > /dev/null; then
    "$@"
else
    echo "Available commands:"
    echo "  show_config     - Show current configuration"
    echo "  check_debug_code - Find debug code in source"
    echo "  validate_config - Validate app configuration"
    echo "  clean_debug     - Show debug code to clean (safe mode)"
    echo ""
    echo "Usage: ./scripts/config-manager.sh <command>"
fi
