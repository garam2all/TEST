#!/bin/bash
cd "$(dirname "$0")"; export NODE_PATH=$(npm root -g)
for i in $(seq $1 $2); do timeout 400 node uisweep.js $i 2>&1 | head -25; done > /tmp/claude-0/multi-ui.log
echo FINISHED >> /tmp/claude-0/multi-ui.log
