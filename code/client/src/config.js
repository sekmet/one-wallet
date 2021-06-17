export default {
  appId: 'ONEWallet',
  appName: 'ONE Wallet',
  version: 'v0.0.1',
  defaults: {
    relayer: process.env.REACT_APP_RELAYER || 'dev',
    network: process.env.REACT_APP_NETWORK || 'eth-ganache',
  },
  networks: {
    'eth-ganache': {
      name: 'Ethereum Ganache',
      url: 'http://127.0.0.1:7545'
    },
    'harmony-mainnet': {
      name: 'Harmony Mainnet',
      url: 'https://api.s0.t.hmny.io'
    },
    'harmony-testnet': {
      name: 'Harmony Testnet',
      url: 'https://api.s0.b.hmny.io'
    }
  },
  relayers: {
    dev: {
      name: 'Development',
      // url: 'https://127.0.0.1:8443'
      url: 'https://dev.hiddenstate.xyz'
    },
    hiddenstate: {
      name: 'Test Relayer ONE',
      url: 'https://relayer.onewallet.hiddenstate.xyz'
    }
  }
}