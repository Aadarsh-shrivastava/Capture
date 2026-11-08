#!/usr/bin/env bash
# Score the on-device capture model on this Mac: serves the same GGUF with llama.cpp and runs src/__eval__.
#   scripts/model-eval.sh [path/to/model.gguf]
# Needs llama.cpp (brew install llama.cpp). Default model: the one the iOS simulator downloaded.
set -euo pipefail
cd "$(dirname "$0")/.."

MODEL="${1:-$(find ~/Library/Developer/CoreSimulator/Devices -name 'qwen-q4_k_m.gguf' -path '*/models/*' 2>/dev/null | head -1)}"
[ -f "$MODEL" ] || { echo "No model file. Pass a .gguf path, or download it in the app on a simulator first."; exit 1; }
PORT="${PORT:-8089}"

# --jinja: the model's own chat template, as llama.rn uses in the app (jinja: true).
llama-server -m "$MODEL" --port "$PORT" --jinja -c 2048 --log-disable >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
until curl -sf "http://127.0.0.1:$PORT/health" >/dev/null; do sleep 1; done

MODEL_EVAL_URL="http://127.0.0.1:$PORT" npx jest src/__eval__ --testTimeout=600000 "${@:2}"
