#!/bin/sh
# Run to transpile to JS before committing
tsc infernum.ts --outFile ../school/JS/tsc/infernum.js --lib dom,es2024
