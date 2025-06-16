## setup

`npm ci`

`npm run build`

`npm link`

## run container with foundry

`./run-foundry.sh`

## run local node from inside the foundry container

`anvil --host 0.0.0.0`

Check anvil is running from outside the container

`curl -X POST http://localhost:8545   -H "Content-Type: application/json"   -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

## usage

`bridge select-token` # Select a token by address or auto-detect from wallet

`bridge select-target-chain` # Choose the target chain (exclude current)

`bridge lock` # Lock tokens via `permit` + bridge interaction

`bridge claim` # Claim tokens on current chain or wrapped tokens on target chain

`bridge return` # Bridge wrapped tokens back to origin

`bridge history` # Show transaction history

`bridge switch-network` # Change network used by the CLI tool
