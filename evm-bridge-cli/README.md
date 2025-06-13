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
