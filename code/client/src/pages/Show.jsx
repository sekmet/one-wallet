import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useRouteMatch, Redirect, useLocation, matchPath } from 'react-router'
import Paths from '../constants/paths'
import WalletConstants from '../constants/wallet'
import walletActions from '../state/modules/wallet/actions'
import util, { useWindowDimensions } from '../util'
import ONEUtil from '../../../lib/util'
import ONEConstants from '../../../lib/constants'

import About from './Show/About'
import Recovery from './Show/Recovery'
import DoRecover from './Show/DoRecover'
import { Space, Typography } from 'antd'
import AnimatedSection from '../components/AnimatedSection'

import { Warning } from '../components/Text'
import { ERC20Grid } from '../components/ERC20Grid'

import { HarmonyONE } from '../components/TokenAssets'
import { NFTGrid } from '../components/NFTGrid'
import WalletAddress from '../components/WalletAddress'
import Send from './Show/Send'
import SetRecovery from './Show/SetRecovery'
import Balance from './Show/Balance'

const { Title, Link } = Typography
const tabList = [{ key: 'coins', tab: 'Coins' }, { key: 'nft', tab: 'Collectibles' }, { key: 'about', tab: 'About' }, { key: 'help', tab: 'Recover' }]
const Show = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()
  const wallets = useSelector(state => state.wallet.wallets)
  const match = useRouteMatch(Paths.show)
  const { address: routeAddress, action } = match ? match.params : {}
  const oneAddress = util.safeOneAddress(routeAddress)
  const address = util.safeNormalizedAddress(routeAddress)
  const selectedAddress = useSelector(state => state.wallet.selected)

  const wallet = wallets[address] || {}
  const [section, setSection] = useState(action)
  const network = useSelector(state => state.wallet.network)
  const [activeTab, setActiveTab] = useState('coins')
  const walletOutdated = util.isWalletOutdated(wallet)

  useEffect(() => {
    if (!wallet) {
      return history.push(Paths.wallets)
    }
    if (address && (address !== selectedAddress)) {
      dispatch(walletActions.selectWallet(address))
    }
    const fetch = () => dispatch(walletActions.fetchBalance({ address }))
    fetch()
    const handler = setInterval(() => fetch(), WalletConstants.fetchBalanceFrequency)
    dispatch(walletActions.fetchWallet({ address }))
    return () => { clearInterval(handler) }
  }, [])

  const selectedToken = wallet?.selectedToken || HarmonyONE

  useEffect(() => {
    const m = matchPath(location.pathname, { path: Paths.show })
    const { action } = m ? m.params : {}
    if (action !== 'nft' && action !== 'transfer' && selectedToken.key !== 'one' && selectedToken.tokenType !== ONEConstants.TokenType.ERC20) {
      dispatch(walletActions.setSelectedToken({ token: null, address }))
    }
    if (tabList.find(t => t.key === action)) {
      setSection(undefined)
      setActiveTab(action)
      return
    }
    setSection(action)
  }, [location])

  const showTab = (tab) => { history.push(Paths.showAddress(oneAddress, tab)) }
  const showStartScreen = () => { history.push(Paths.showAddress(oneAddress)) }

  const { isMobile } = useWindowDimensions()
  // UI Rendering below
  if (!wallet || wallet.network !== network) {
    return <Redirect to={Paths.wallets} />
  }

  const title = (
    <Space size='large' align='baseline'>
      <Title level={2}>{wallet.name}</Title>
      <WalletAddress
        address={wallet.address}
        shorten={util.shouldShortenAddress({
          walletName: wallet.name,
          isMobile
        })}
      />
    </Space>
  )

  return (
    <>
      {/* <Space size='large' wrap align='start'> */}
      <AnimatedSection
        show={!section}
        title={title}
        style={{ minHeight: 320, maxWidth: 720 }}
        tabList={tabList}
        activeTabKey={activeTab}
        onTabChange={key => showTab(key)}
      >
        {walletOutdated && <Warning>Your wallet is too outdated. Please create a new wallet and move your friends.</Warning>}
        {util.isEmptyAddress(wallet.lastResortAddress) && <Warning>You haven't set your recovery address. Please do it as soon as possible.</Warning>}
        {ONEUtil.getVersion(wallet) === '8.0' && !wallet.doubleOtp &&
          <Warning>
            DO NOT use this version of the wallet. Funds may be unspendable and unrecoverable. Please create a new wallet. Learn more at <Link href='https://github.com/polymorpher/one-wallet/issues/72' target='_blank' rel='noreferrer'>https://github.com/polymorpher/one-wallet/issues/72</Link>
          </Warning>}

        {activeTab === 'about' && <About address={address} />}
        {activeTab === 'coins' && <Balance address={address} />}
        {activeTab === 'coins' && <ERC20Grid address={address} />}
        {activeTab === 'nft' && <NFTGrid address={address} />}
        {activeTab === 'help' && <Recovery address={address} />}

      </AnimatedSection>
      <Send address={address} show={section === 'transfer'} onClose={showStartScreen} />
      <DoRecover address={address} show={section === 'recover'} onClose={showStartScreen} />
      <SetRecovery show={section === 'setRecoveryAddress'} address={address} onClose={showStartScreen} />
    </>
  )
}

export default Show
