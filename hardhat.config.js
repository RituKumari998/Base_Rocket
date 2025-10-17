require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    base: {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://base1.base.io/rpc",
      accounts: process.env.SERVER_PRIVATE_KEY ? [process.env.SERVER_PRIVATE_KEY] : [],
      chainId: 42161
    },
    baseGoerli: {
      url: "https://goerli-rollup.base.io/rpc",
      accounts: process.env.SERVER_PRIVATE_KEY ? [process.env.SERVER_PRIVATE_KEY] : [],
      chainId: 421613
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

