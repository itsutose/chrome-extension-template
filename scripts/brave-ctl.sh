#!/bin/bash
set -e # エラーが発生したらスクリプトを停止

# --- 設定 (ここを編集するだけでOK) ---
BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
DEBUG_PORT=9222
# ---

# --- 共通変数 ---
CURRENT_DIR=$(pwd)
DIST_DIR="$CURRENT_DIR/dist"
PROFILE_DIR="$CURRENT_DIR/.vscode/brave-debug-profile"

# --- 共通関数 ---

# ブラウザのプロセスを停止する関数
kill_brave_processes() {
    echo "🔎 Checking for running Brave debug processes..."
    # ポートとプロファイルディレクトリでプロセスを検索し、重複を除外
    PIDS_TO_KILL=$( (lsof -ti :$DEBUG_PORT; ps aux | grep "$PROFILE_DIR" | grep -v grep | awk '{print $2}') | sort -u )

    if [ -z "$PIDS_TO_KILL" ]; then
        echo "✅ No relevant processes found."
        return
    fi

    echo "🔥 Found processes to stop: $PIDS_TO_KILL"
    kill -TERM $PIDS_TO_KILL 2>/dev/null || true
    sleep 2 # 猶予期間
    # TERMで終了しなかったプロセスを強制終了
    kill -KILL $PIDS_TO_KILL 2>/dev/null || true
    echo "🛑 Processes stopped."
}

# ブラウザを起動する共通関数
launch_brave() {
    local extra_args=("$@") # 引数を配列として受け取る

    if [ ! -d "$DIST_DIR" ]; then
        echo "❌ Error: 'dist' directory not found. Please run 'make build' first." >&2
        exit 1
    fi
    if [ ! -f "$BRAVE_PATH" ]; then
        echo "❌ Error: Brave Browser not found at '$BRAVE_PATH'" >&2
        exit 1
    fi

    echo "🚀 Launching Brave Browser..."
    "$BRAVE_PATH" \
        --load-extension="$DIST_DIR" \
        --disable-extensions-except="$DIST_DIR" \
        --no-first-run \
        --no-default-browser-check \
        --disable-default-apps \
        "${extra_args[@]}" # デバッグ用の追加引数を展開
}

# --- メイン処理 (コマンドに応じて分岐) ---
case "$1" in
    start)
        launch_brave
        ;;
    start-debug)
        kill_brave_processes # 起動前に既存のプロセスを停止
        mkdir -p "$PROFILE_DIR"
        launch_brave \
            --remote-debugging-port=$DEBUG_PORT \
            --user-data-dir="$PROFILE_DIR"
        ;;
    stop)
        kill_brave_processes
        ;;
    reset)
        kill_brave_processes
        echo "🧹 Cleaning up debug profile..."
        if [ -d "$PROFILE_DIR" ]; then
            read -p "⚠️  Are you sure you want to reset the debug profile? (y/N): " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                find "$PROFILE_DIR" -mindepth 1 -not -name ".gitkeep" -delete
                echo "✅ Debug profile reset successfully."
            else
                echo "❌ Profile reset cancelled."
            fi
        else
            echo "🤷 Debug profile directory not found."
        fi
        ;;
    *)
        echo "Usage: $0 {start|start-debug|stop|reset}" >&2
        exit 1
        ;;
esac