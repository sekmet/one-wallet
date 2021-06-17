const config = require('./config')
const contract = require('@truffle/contract')
const { TruffleProvider } = require('@harmony-js/core')
const { Account } = require('@harmony-js/account')
const ONEWallet = require('../build/contracts/ONEWallet.json')
const HDWalletProvider = require('@truffle/hdwallet-provider')

let providers = {}; let contracts = {}; let networks = []

const HarmonyProvider = ({ key, url, chainId, gasLimit, gasPrice }) => {
  const truffleProvider = new TruffleProvider(
    url,
    {},
    { shardID: 0, chainId },
    gasLimit && gasPrice && { gasLimit, gasPrice },
  )
  truffleProvider.addByPrivateKey(key)
  const account = new Account(key)
  truffleProvider.setSigner(account.checksumAddress)
  return truffleProvider
}

const init = () => {
  Object.keys(config.networks).forEach(k => {
    const n = config.networks[k]
    console.log(n)
    if (n.key) {
      try {
        if (k.startsWith('eth')) {
          providers[k] = new HDWalletProvider({ privateKeys: [n.key], providerOrUrl: n.url })
        } else {
          providers[k] = HarmonyProvider({ key: n.key, url: n.url, chainId: n.chainId })
          // providers[k] = new HDWalletProvider({ privateKeys: [n.key], providerOrUrl: n.url })
        }
        networks.push(k)
      } catch (ex) {
        console.error(ex)
        console.trace(ex)
      }
    }
  })
  Object.keys(providers).forEach(k => {
    const c = contract(ONEWallet)
    c.setProvider(providers[k])
    const key = config.networks[k].key
    const account = new Account(key)
    // console.log(k, account.address, account.bech32Address)
    c.defaults({
      from: account.address
    })
    contracts[k] = c
  })
  console.log('init complete:', {
    networks,
    providers: Object.keys(providers).map(k => providers[k].toString()),
    contracts: Object.keys(contracts).map(k => contracts[k].toString()),
  })
}

module.exports = {
  init,
  getNetworks: () => networks,
  getProvider: (network) => providers[network],
  getContract: (network) => contracts[network],
}