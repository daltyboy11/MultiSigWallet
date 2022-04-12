# MultiSigWallet
A repository of tinkering around with the [MultiSigWallet](https://solidity-by-example.org/app/multi-sig-wallet)
contract from Solidity By Example.

Each branch has different modifications and experiments.

## Getting started
Clone the repo, checkout the relevant branch, and install dependencies, compile, and test
```
git clone git@github.com:daltyboy11/MultiSigWallet.git
git checkout multi-call
npm install
npx hardhat clean
npx hardhat compile
npx hardhat test
```

## `main` branch
This is just the original contract with unit tests added

## `multi-call` branch
A demonstration of how to use [MultiCall](https://solidity-by-example.org/app/multi-call), another Solidity By Example contract, to submit and
confirm a MultiSigWallet transaction in a single Ethereum transaction. There is an accompanying [blog post](https://daltyboy11.github.io/batch-ethereum-queries-with-multicall/) on my personal website.

## `challenge-1-timelocked-withdrawals` branch
Allows for MultiSigWallet transactions with timelocked withdrawals, e.g. must wait 1 week after
reaching the minimum number of confirmations before
executing the transaction.