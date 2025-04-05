#!/bin/sh

# Clear npm cache and modules
echo "Cleaning npm cache and modules..."
npm cache clean --force
rm -rf node_modules
rm -f package-lock.json

# Clear Bun cache and modules if Bun is installed
if command -v bun &> /dev/null; then
    echo "Cleaning Bun cache and modules..."
    bun pm cache rm
    rm -f bun.lock
fi

npx expo install --fix

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# If using Bun as package manager
if command -v bun &> /dev/null; then
    echo "Installing dependencies with Bun..."
    bun install
fi

echo "Cleanup and reinstall complete!"