#!/bin/bash
# Exit on error
set -e

echo "Build started..."

echo "Installing server dependencies..."
cd server && npm install
cd ..

echo "Building Client..."
cd client
npm install
npm run build
cd ..

echo "Building Admin..."
cd admin
npm install
npm run build
cd ..

echo "Build complete."
