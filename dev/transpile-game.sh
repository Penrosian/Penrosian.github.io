#!/bin/sh
# Run to transpile to JS before committing
npx tsc game.ts --outFile ../school/JS/tsc/game.js --lib dom,es2024
