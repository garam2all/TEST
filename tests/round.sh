#!/bin/bash
# 1ラウンド = 検索ロジック1000件 + 画面操作1000件。 使い方: tests/round.sh <N>
cd "$(dirname "$0")"; export NODE_PATH=$(npm root -g)
node battery.js "$1" 2>&1 | head -30
timeout 500 node uisweep.js "$1" 2>&1 | head -30
