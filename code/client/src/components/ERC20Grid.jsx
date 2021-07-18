import { Card, Image, Row, Space, Typography, Col, Divider, Button, message } from 'antd'
import { unionWith, isNull, isUndefined } from 'lodash'
import walletActions from '../state/modules/wallet/actions'

import { PlusCircleOutlined } from '@ant-design/icons'
import React, { useState, useEffect } from 'react'
import { TallRow } from './Grid'
import { api } from '../../../lib/api'
import ONE from '../../../lib/onewallet'
import ONEUtil from '../../../lib/util'
import util from '../util'
import { Warning, Hint, InputBox, Heading } from './Text'
import { withKeys, DefaultTrackedERC20, HarmonyONE } from './TokenAssets'
import { useDispatch, useSelector } from 'react-redux'
import abbr from '../abbr'
import { handleAddressError } from '../handler'
import ONEConstants from '../../../lib/constants'
const { Text, Link } = Typography

const GridItem = ({ style, children, icon, name, symbol, contractAddress, balance, addNew, selected, onSelected }) => {
  const bech32ContractAddress = util.safeOneAddress(contractAddress)
  const abbrBech32ContractAddress = util.ellipsisAddress(bech32ContractAddress)
  return (
    <Card.Grid style={{ ...style, ...(selected && { backgroundColor: '#fafafa' }) }} onClick={onSelected}>
      {addNew && <Text style={{ textAlign: 'center' }}><PlusCircleOutlined style={{ fontSize: 24 }} /><br /><br />Add Token</Text>}
      {children}
      {!children && !addNew &&
        <Space direction='vertical'>
          <Row justify='center' style={{ alignItems: 'center' }} gutter={8}>
            {icon && <Col><Image preview={false} src={icon} wrapperStyle={{ height: 32, width: 32 }} /></Col>}
            {symbol && <Col><Text style={{ fontSize: 24 }}>{symbol}</Text></Col>}
            {!symbol && <Col><Text style={{ fontSize: 24 }}>{abbrBech32ContractAddress}</Text></Col>}
          </Row>
          <Row justify='center' style={{ alignItems: 'center' }}>
            <Space><Hint style={{ textAlign: 'center' }}>Balance</Hint><Text>{abbr(balance, 1)}</Text></Space>
          </Row>
        </Space>}
    </Card.Grid>
  )
}

export const ERC20Grid = ({ wallet }) => {
  const dispatch = useDispatch()
  const { address, trackedTokens, selectedToken } = wallet
  const balances = useSelector(state => state.wallet.balances)
  const balance = balances[address] || 0
  const { formatted } = util.computeBalance(balance)
  const walletOutdated = util.isWalletOutdated(wallet)
  const defaultTrackedTokens = withKeys(DefaultTrackedERC20)
  const [currentTrackedTokens, setCurrentTrackedTokens] = useState([...defaultTrackedTokens, ...(trackedTokens || [])])
  const [disabled, setDisabled] = useState(true)
  const [tokenBalance, setTokenBalance] = useState({})
  const selected = selectedToken || HarmonyONE
  const [section, setSection] = useState()
  const [newContractAddress, setNewContractAddress] = useState('')

  const gridItemStyle = { width: '200px', height: '200px', display: 'flex', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer', color: disabled && 'grey', opacity: disabled && 0.5 }
  useEffect(() => {
    if (walletOutdated) {
      return
    }
    setDisabled(false)
    const f = async () => {
      let tts = await api.blockchain.getTrackedTokens({ address })
      tts.forEach(tt => { tt.key = ONEUtil.hexView(ONE.computeTokenKey(tt).hash) })
      tts = unionWith(tts, defaultTrackedTokens, trackedTokens, (a, b) => a.key === b.key)
      console.log(tts)
      await Promise.all(tts.map(async tt => {
        // if (tt.name && tt.symbol) {
        //   return
        // }
        try {
          const { name, symbol } = await api.blockchain.getTokenMetadata(tt)
          tt.name = name
          tt.symbol = symbol
        } catch (ex) {
          console.error(ex)
        }
      }))
      setCurrentTrackedTokens(tts)
    }
    f()
  }, [])

  useEffect(() => {
    (currentTrackedTokens || []).forEach(async tt => {
      const { tokenType, tokenId, contractAddress, key } = tt
      const balance = await api.blockchain.tokenBalance({ address, contractAddress, tokenType, tokenId })
      setTokenBalance(tb => ({ ...tb, [key]: balance.toString() }))
    })
    const tokens = currentTrackedTokens.filter(e =>
      defaultTrackedTokens.find(dt => dt.key === e.key) === undefined &&
      trackedTokens.find(ut => ut.key === e.key) === undefined
    )
    console.log({ tokens, trackedTokens, currentTrackedTokens })
    // dispatch(walletActions.untrackTokens({ address, keys: trackedTokens.map(e => e.key) }))
    dispatch(walletActions.trackTokens({ address, tokens }))
  }, [currentTrackedTokens])

  useEffect(() => {
    const f = async function () {
      if (!newContractAddress || newContractAddress.length < 42) {
        return
      }
      const contractAddress = util.safeExec(util.normalizedAddress, [newContractAddress], handleAddressError)
      if (!contractAddress) {
        return
      }
      const existing = currentTrackedTokens.find(t => t.contractAddress === contractAddress)
      if (existing) {
        message.error(`You already added ${existing.name} (${existing.symbol}) (${existing.contractAddress})`)
        return
      }
      try {
        const tokenBalance = await api.blockchain.tokenBalance({ address, contractAddress, tokenType: ONEConstants.TokenType.ERC20 })
        const tt = { tokenType: ONEConstants.TokenType.ERC20, tokenId: 0, contractAddress }
        const key = ONEUtil.hexView(ONE.computeTokenKey(tt).hash)
        tt.key = key
        try {
          const { name, symbol } = await api.blockchain.getTokenMetadata(tt)
          tt.name = name
          tt.symbol = symbol
        } catch (ex) {
          console.error(ex)
        }
        setTokenBalance(tb => ({ ...tb, [key]: tokenBalance.toString() }))
        setCurrentTrackedTokens(tts => [...tts, tt])
        message.success(`New token added: ${tt.name} (${tt.symbol}) (${tt.contractAddress}`)
        setSection(null)
      } catch (ex) {
        message.error(`Unable to retrieve balance from ${newContractAddress}. It might not be a valid HRC20 contract address`)
      }
    }
    f()
  }, [newContractAddress])

  const onSelect = (key) => () => {
    if (key === 'one') {
      dispatch(walletActions.setSelectedToken({ token: null, address }))
      return
    }
    const balance = tokenBalance[key]
    const token = currentTrackedTokens.find(t => t.key === key)
    dispatch(walletActions.setSelectedToken({ token: { ...token, balance }, address }))
  }

  return (
    <>
      {disabled && <Warning>Your wallet is based on an outdated version. It cannot hold or send tokens. Please create a new wallet and migrate assets.</Warning>}
      {!section &&
        <TallRow>
          <GridItem
            style={gridItemStyle}
            icon={HarmonyONE.icon} name={HarmonyONE.name} symbol={HarmonyONE.symbol} balance={formatted}
            selected={selected.key === 'one'} onSelected={onSelect('one')}
          />
          {currentTrackedTokens.map(tt => {
            const { icon, name, symbol, key } = tt
            const balance = !isUndefined(tokenBalance[key]) && !isNull(tokenBalance[key]) && tokenBalance[key]
            const { formatted } = balance && util.computeBalance(balance)
            const displayBalance = balance ? formatted : 'fetching...'

            return (
              <GridItem
                disabled={disabled}
                selected={selected.key === key}
                key={key}
                style={gridItemStyle}
                icon={icon} name={name} symbol={symbol} balance={displayBalance}
                onSelected={onSelect(key)}
              />
            )
          })}
          <GridItem style={gridItemStyle} addNew onSelected={() => { setSection('new') }} disabled={disabled} />
        </TallRow>}
      {section === 'new' &&
        <TallRow>
          <Divider />
          <Space direction='vertical' size='large'>
            <Heading>Track New Token</Heading>
            <Hint>Token Contract Address</Hint>
            <InputBox margin='auto' width={440} value={newContractAddress} onChange={({ target: { value } }) => setNewContractAddress(value)} placeholder='one1...' />
            <TallRow justify='space-between'>
              <Button size='large' shape='round' onClick={() => setSection(null)}>Cancel</Button>
            </TallRow>
            <Hint>You can copy contract addresses from <Link target='_blank' href='https://explorer.harmony.one/hrc20' rel='noreferrer'>Harmony HRC20 Explorer</Link></Hint>
          </Space>
        </TallRow>}
    </>
  )
}
