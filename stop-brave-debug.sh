#!/bin/bash

# デバッグポート設定
DEBUG_PORT=9222

echo "Stopping Brave Browser debug process on port $DEBUG_PORT..."

# ポート9222を使用しているプロセスを検索
PORT_PID=$(lsof -ti :$DEBUG_PORT)

if [ -z "$PORT_PID" ]; then
    echo "No process found using port $DEBUG_PORT"
    exit 0
fi

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

echo "Brave Browser debug process stopped."
echo "Port $DEBUG_PORT should now be available."
echo ""
echo "Note: Debug profile is preserved for next session."
echo "To reset profile, run: ./reset-brave-debug.sh" 