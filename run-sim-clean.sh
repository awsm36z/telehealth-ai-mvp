#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/Users/elyasseelyacoubi/Repos/Claude-Code/telehealth-app/mobile"

echo "==> Moving to project"
cd "$PROJECT_DIR"

echo "==> Stopping Expo/Metro (if running)"
pkill -f "expo|metro" || true

echo "==> Cleaning local deps/cache"
rm -rf node_modules .expo
rm -rf /tmp/metro-* /tmp/haste-map-* || true

echo "==> Installing deps"
npm ci

echo "==> Building/running iOS simulator dev client on EAS"
eas build:dev -p ios -e dev-sim

echo "==> Starting Metro for dev client"
npx expo start --dev-client -c
