const HDWalletProvider = require('@truffle/hdwallet-provider');

const alchemyKey = 'rnR74yLIZZxQ8wMEOj0nQUk4XrWz9m-k';
const mnemonic = 'blood equal total any soul audit night toddler tilt bulk laptop lazy';

module.exports = {
  networks: {
    sepolia: {
      provider: () => new HDWalletProvider(mnemonic, `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
      network_id: 11155111, // Sepolia 的 network id
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  compilers: {
    solc: {
      version: "0.8.0",
    }
  }
};
