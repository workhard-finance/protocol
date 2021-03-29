# Workhard protocol

## Installation

```shell
$ git clone https://github.com/workhard-finance/protocol
$ cd protocol
$ yarn
```

## Run a full-node for testing

```
# Install geth first.
$ geth --port 30304 --http -http.port 1234 --http.addr 127.0.0.1
```

## Set up the .env file

1. Copy the env file
   ```
   $ cp .env.local .env
   ```
2. And edit `FORK`.
   ```
   FORK=http:127.0.0.1:1234
   ```

## Run test

```
$ yarn test
```

## Run manual test

1. In your terminal 1

   ```shell
   $ cd workhard-finance/protocol
   $ yarn hardhat node # this runs a localhost node with hardhat env
   ```

1. In your terminal 2

   ```shell
   $ cd workhard-finance/protocol
   $ yarn hardhat conosle --network localhost
   ```

1. In the connected console
   ```javascript
   > const { deployAndGetFixtures } = require('./scripts/fixture')
   > const fixtures = await deployAndGetFixtures()
   ```
