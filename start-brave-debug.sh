#!/bin/bash

# デバッグポート設定
DEBUG_PORT=9222

# 現在のディレクトリを取得
CURRENT_DIR=$(pwd)
DIST_DIR="$CURRENT_DIR/dist"
DEBUG_PROFILE_DIR="$CURRENT_DIR/.vscode/brave-debug-profile"

# Braveブラウザのパス
BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# ポート9222が既に使用されているかチェック
if lsof -i :$DEBUG_PORT >/dev/null 2>&1; then
    echo "Warning: Port $DEBUG_PORT is already in use."
    echo "This might be another debug session. Do you want to:"
    echo "1. Stop the existing process and start a new one"
    echo "2. Exit"
    read -p "Choose option (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo "Stopping existing process on port $DEBUG_PORT..."
        ./stop-brave-debug.sh
        sleep 2
    else
        echo "Exiting..."
        exit 0
    fi
fi

# 拡張機能がビルドされているか確認
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: dist directory not found. Please run 'npm run build' first."
    exit 1
fi

# Braveブラウザが存在するか確認
if [ ! -f "$BRAVE_PATH" ]; then
    echo "Error: Brave Browser not found at $BRAVE_PATH"
    exit 1
fi

# デバッグプロファイルディレクトリを作成
mkdir -p "$DEBUG_PROFILE_DIR"

echo "Starting Brave Browser with extension for debugging..."
echo "Extension path: $DIST_DIR"
echo "Debug port: $DEBUG_PORT"
echo "Debug profile: $DEBUG_PROFILE_DIR"
echo ""
echo "After Brave Browser starts, you can:"
echo "1. Open Cursor/VSCode"
echo "2. Go to Run and Debug (Ctrl+Shift+D)"
echo "3. Select 'Attach to Brave Extension'"
echo "4. Click the play button to start debugging"
echo ""
echo "To stop debugging, run: ./stop-brave-debug.sh"
echo ""

# Braveブラウザをデバッグモードで起動して拡張機能を読み込む
"$BRAVE_PATH" \
    --remote-debugging-port=$DEBUG_PORT \
    --user-data-dir="$DEBUG_PROFILE_DIR" \
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

echo "Brave Browser started with debugging enabled." 