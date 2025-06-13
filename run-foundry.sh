#!/bin/bash

PROJECT_DIR="$(pwd)/evm-bridge-contracts"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Directory not found: $PROJECT_DIR"
  exit 1
fi

docker run -it --rm \
  -p 8545:8545 \
  -v "$PROJECT_DIR":/app \
  -w /app \
  --name foundry \
  ghcr.io/foundry-rs/foundry bash
