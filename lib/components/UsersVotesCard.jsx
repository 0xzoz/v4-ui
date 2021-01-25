import React, { useContext, useState } from 'react'

import { AuthControllerContext } from 'lib/components/contextProviders/AuthControllerContextProvider'
import { Banner } from 'lib/components/Banner'
import { CONTRACT_ADDRESSES } from 'lib/constants'
import DelegateableERC20ABI from 'abis/DelegateableERC20ABI'
import { EtherscanAddressLink } from 'lib/components/EtherscanAddressLink'
import FeatherIcon from 'feather-icons-react'
import classnames from 'classnames'
import { numberWithCommas } from 'lib/utils/numberWithCommas'
import { shorten } from 'lib/utils/shorten'
import { transactionsAtom } from 'lib/atoms/transactionsAtom'
import { useAtom } from 'jotai'
import { useSendTransaction } from 'lib/hooks/useSendTransaction'
import { useSocialIdentity } from 'lib/hooks/useTwitterProfile'
import { useTokenHolder } from 'lib/hooks/useTokenHolder'
import { useTranslation } from 'i18n/../i18n'

export const UsersVotesCard = () => {
  const { usersAddress } = useContext(AuthControllerContext)
  const { data: tokenHolder, loading: tokenHolderIsLoading } = useTokenHolder(usersAddress)

  if (
    !tokenHolder ||
    !usersAddress ||
    tokenHolderIsLoading ||
    (!tokenHolder.hasBalance && !tokenHolder.hasDelegated)
  ) {
    return null
  }

  // TODO: actually need the number at the block prior to the proposals creation
  // depending on the page the user is currently viewing
  const votes = numberWithCommas(tokenHolder.tokenBalance)

  return (
    <Banner className='mb-4'>
      <h4 className='font-normal mb-4'>Total votes</h4>
      <div className='flex flex-col sm:flex-row'>
        <h2
          className={classnames('leading-none mr-4', {
            'opacity-30': !tokenHolder.hasDelegated
          })}
        >
          {votes}
        </h2>
        <DelegateTrigger votes={votes} tokenHolder={tokenHolder} />
      </div>
    </Banner>
  )
}

const DelegateTrigger = (props) => {
  const { t } = useTranslation()
  const { tokenHolder, votes } = props
  const { hasDelegated, selfDelegated } = tokenHolder
  const { usersAddress, provider, chainId } = useContext(AuthControllerContext)
  const [txId, setTxId] = useState({})
  const [transactions, setTransactions] = useAtom(transactionsAtom)
  const [sendTx] = useSendTransaction(`Delegate`, transactions, setTransactions)
  const txInFlight = transactions?.find((tx) => tx.id === txId)

  const delegateAddress = tokenHolder?.delegate?.id
  const delegateIdentity = useSocialIdentity(delegateAddress)

  const handleDelegate = async (e) => {
    e.preventDefault()

    const params = [usersAddress]

    const id = await sendTx(
      t,
      provider,
      usersAddress,
      DelegateableERC20ABI,
      CONTRACT_ADDRESSES[chainId].GovernanceToken,
      'delegate',
      params
    )
    setTxId(id)
  }

  if (txInFlight?.completed && !txInFlight?.error) {
    return (
      <p className='p-2 rounded bg-light-purple-35 text-green my-auto'>
        🎉 Successfully activated your votes 🎉
      </p>
    )
  }

  if (txInFlight?.completed && txInFlight?.error) {
    return (
      <>
        <p className='text-red mt-auto mr-2'>Error</p>
        <button type='button' className='underline trans mt-auto' onClick={handleDelegate}>
          Activate my votes
        </button>
      </>
    )
  }

  if (txInFlight?.inWallet) {
    return (
      <p className='mt-auto text-green opacity-80'>Please confirm the transaction in your wallet</p>
    )
  }

  if (txInFlight?.sent) {
    return <p className='mt-auto text-green opacity-80'>Waiting for confirmations...</p>
  }

  if (!hasDelegated) {
    return (
      <button type='button' className='underline trans mt-auto' onClick={handleDelegate}>
        Activate my votes
      </button>
    )
  }

  if (!selfDelegated) {
    const twitterHandle = delegateIdentity?.twitter?.handle
    if (twitterHandle) {
      return (
        <p className='mt-auto'>
          You have delegated <b>{votes}</b> votes to{' '}
          <a
            className='font-bold text-inverse hover:text-accent-1'
            href={`https://twitter.com/${twitterHandle}`}
            target='_blank'
            rel='noopener'
          >
            {twitterHandle}
            <FeatherIcon icon='external-link' className='inline w-4 h-4 mb-1 ml-1' />
          </a>{' '}
          (
          <EtherscanAddressLink
            className='font-bold text-inverse hover:text-accent-1'
            address={delegateAddress}
          >
            {shorten(delegateAddress)}
          </EtherscanAddressLink>
          )
        </p>
      )
    }

    return (
      <p className='mt-auto'>
        You have delegated <b>{votes}</b> votes to{' '}
        <EtherscanAddressLink
          className='font-bold text-inverse hover:text-accent-1'
          address={delegateAddress}
        >
          <span className='hidden sm:inline'>{delegateAddress}</span>
          <span className='inline sm:hidden'>{shorten(delegateAddress)}</span>
        </EtherscanAddressLink>
      </p>
    )
  }

  return <p className='mt-auto'>You have {votes} for each proposal</p>
}
