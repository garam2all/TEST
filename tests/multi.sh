#!/bin/bash
cd "$(dirname "$0")"; export NODE_PATH=$(npm root -g)
for i in $(seq $1 $2); do node battery.js $i 2>&1 | head -40; done > /tmp/claude-0/multi-battery.log
echo FINISHED >> /tmp/claude-0/multi-battery.log
