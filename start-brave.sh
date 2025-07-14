#!/bin/bash

# 現在のディレクトリを取得
CURRENT_DIR=$(pwd)
DIST_DIR="$CURRENT_DIR/dist"

# Braveブラウザのパス
BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# 拡張機能がビルドされているか確認
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: dist directory not found. Please run 'pnpm run build' first."
    exit 1
fi

# Braveブラウザが存在するか確認
if [ ! -f "$BRAVE_PATH" ]; then
    echo "Error: Brave Browser not found at $BRAVE_PATH"
    exit 1
fi

echo "Starting Brave Browser with extension..."
echo "Extension path: $DIST_DIR"

# Braveブラウザを起動して拡張機能を読み込む
"$BRAVE_PATH" \
    --load-extension="$DIST_DIR" \
    --disable-extensions-except="$DIST_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --disable-default-apps \
    --disable-features=TranslateUI \
    --disable-component-extensions-with-background-pages \
    --disable-background-networking \
    --disable-client-side-phishing-detection \
    --disable-sync \
    --metrics-recording-only \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-background-timer-throttling \
    --disable-ipc-flooding-protection \
    --password-store=basic \
    --use-mock-keychain \
    chrome://extensions/

echo "Brave Browser started with extension loaded." 