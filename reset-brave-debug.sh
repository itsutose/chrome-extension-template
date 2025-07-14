#!/bin/bash

# デバッグポート設定
DEBUG_PORT=9222

echo "Resetting Brave Browser debug environment..."

# まずプロセスを停止
echo "Step 1: Stopping any running debug processes..."

# ポート9222を使用しているプロセスを検索
PORT_PID=$(lsof -ti :$DEBUG_PORT)

if [ -n "$PORT_PID" ]; then
    echo "Found process(es) using port $DEBUG_PORT: $PORT_PID"
    
    # プロセスがBraveブラウザかどうか確認
    for pid in $PORT_PID; do
        PROCESS_NAME=$(ps -p $pid -o comm= 2>/dev/null)
        if [[ "$PROCESS_NAME" == *"Brave Browser"* ]]; then
            echo "Stopping Brave Browser process (PID: $pid)..."
            kill -TERM $pid
            
            # プロセスが終了するまで待機（最大10秒）
            for i in {1..10}; do
                if ! kill -0 $pid 2>/dev/null; then
                    echo "Process $pid stopped successfully"
                    break
                fi
                sleep 1
            done
            
            # まだプロセスが残っている場合は強制終了
            if kill -0 $pid 2>/dev/null; then
                echo "Force killing process $pid..."
                kill -KILL $pid
            fi
        else
            echo "Warning: Process $pid ($PROCESS_NAME) is not Brave Browser, skipping..."
        fi
    done
else
    echo "No processes found using port $DEBUG_PORT"
fi

# 関連する子プロセスも確認して停止
echo "Checking for related Brave processes..."

# デバッグプロファイルディレクトリを使用しているプロセスを検索
PROFILE_DIR="$(pwd)/.vscode/brave-debug-profile"
RELATED_PIDS=$(ps aux | grep -i "brave.*$PROFILE_DIR" | grep -v grep | awk '{print $2}')

if [ -n "$RELATED_PIDS" ]; then
    echo "Found related Brave processes: $RELATED_PIDS"
    for pid in $RELATED_PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping related process $pid..."
            kill -TERM $pid
        fi
    done
    
    # 少し待ってから強制終了
    sleep 2
    for pid in $RELATED_PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing related process $pid..."
            kill -KILL $pid
        fi
    done
fi

echo "Step 2: Cleaning up debug profile directory..."

# プロファイルディレクトリの確認
if [ -d "$PROFILE_DIR" ]; then
    echo "Removing debug profile: $PROFILE_DIR"
    
    # 確認プロンプト
    echo ""
    echo "⚠️  WARNING: This will remove all debug session data including:"
    echo "   - Browser settings and preferences"
    echo "   - Extension data and cache"
    echo "   - Session history and cookies"
    echo "   - All cached files"
    echo ""
    read -p "Are you sure you want to reset the debug profile? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        # .gitkeepファイルを保持
        find "$PROFILE_DIR" -mindepth 1 -not -name ".gitkeep" -delete
        echo "✅ Debug profile reset successfully."
        echo "   Next debug session will start with a clean slate."
    else
        echo "❌ Profile reset cancelled."
        exit 0
    fi
else
    echo "Debug profile directory not found: $PROFILE_DIR"
fi

echo ""
echo "🎉 Brave Browser debug environment reset complete!"
echo "   You can now start a fresh debug session with: npm run start:brave:debug" 