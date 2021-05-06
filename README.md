=======
# protocol

## How to run test

```
yarn install
yarn test
```

## How to run local node

1. Run your hardhat node
```
yarn hardhat node --hostname 0.0.0.0
```

2. Deploy contracts
```
yarn localhost:deploy
```

3. Run some initial setup scripts
```
yarn localhost:run scripts/demo/1-set-vision-token-emitter.ts
yarn localhost:run scripts/demo/2-new-crypto-job.ts
yarn localhost:run scripts/demo/3-approve-job.ts
yarn localhost:run scripts/demo/4-farmers-union.ts
```
4. Run frontend application
[WIP]
