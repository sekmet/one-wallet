import React, { useState } from 'react'
import styled from 'styled-components'
import { PageHeader, Select, Divider } from 'antd'
import { useRouteMatch, useHistory } from 'react-router'
import { titleCase } from 'title-case'
import { useSelector, useDispatch } from 'react-redux'
import walletActions from '../state/modules/wallet/actions'
import { SearchOutlined } from '@ant-design/icons'
import config from '../config'

const SelectorLabel = styled.span`
  margin: 16px;
`
const NetworkSelector = () => {
  const networkId = useSelector(state => state.wallet.network)
  const dispatch = useDispatch()
  const networks = config.networks
  const onChange = (v) => {
    dispatch(walletActions.setNetwork(v))
  }
  return (
    <>
      <SelectorLabel>Network</SelectorLabel>
      <Select style={{ width: 160 }} bordered={false} value={networkId} onChange={onChange}>
        {Object.keys(networks).map(k => {
          return <Select.Option key={k} value={k}>{networks[k].name} </Select.Option>
        })}

      </Select>
    </>
  )
}

const RelayerSelector = () => {
  const relayer = useSelector(state => state.wallet.relayer)
  const [input, setInput] = useState('')
  const dispatch = useDispatch()
  const relayers = config.relayers
  const onChange = (v) => {
    dispatch(walletActions.setRelayer(v))
  }
  return (
    <>
      <SelectorLabel>Relayer</SelectorLabel>
      <Select
        suffixIcon={<SearchOutlined />}
        style={{ width: 160 }} dropdownMatchSelectWidth bordered={false} showSearch onChange={onChange}
        value={relayer}
        onSearch={(v) => setInput(v)}
      >
        {Object.keys(relayers).map(k => {
          return <Select.Option key={k} value={k}>{relayers[k].name} </Select.Option>
        })}
        {input && <Select.Option key={input} value={input}>{input}</Select.Option>}
      </Select>
    </>
  )
}

const WalletHeader = () => {
  const history = useHistory()
  const match = useRouteMatch('/:action')
  const { action } = match.params
  const address = useSelector(state => state.wallet.selected)

  return (
    <PageHeader
      style={{ background: '#ffffff' }}
      onBack={() => history.goBack()}
      title={titleCase(action || '')}
      subTitle={address || ''}
      extra={[
        <RelayerSelector key='relayer' />,
        <Divider key='divider' type='vertical' />,
        <NetworkSelector key='network' />
      ]}
    />
  )
}

export default WalletHeader