#!/bin/bash
# Render Build Script — Trust Layer Hub (trusthub.tlid.io)
set -e

echo "📦 [Render] Trust Layer Hub build starting..."

# Install ALL deps (devDependencies needed for tsx, esbuild, expo, etc.)
echo "📚 Installing dependencies..."
NODE_ENV=development npm install --legacy-peer-deps || npm install --force

# Build web export using Expo
echo "🌐 Building Expo web export..."
npx expo export:web --output-dir dist/web 2>/dev/null || npx expo export --platform web --output-dir dist/web 2>/dev/null || {
  echo "⚠️  Expo web export not available, using static landing page..."
  mkdir -p dist/web
  cp web/index.html dist/web/index.html
  cp -r public/* dist/web/ 2>/dev/null || true
  cp -r assets dist/web/assets 2>/dev/null || true
}

# Build server with esbuild
echo "🔧 Building server..."
npm run server:build

echo "✅ [Render] Trust Layer Hub build complete!"
