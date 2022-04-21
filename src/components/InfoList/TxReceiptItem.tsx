import React from 'react'
import { useTranslation } from 'react-i18next'
import { BlockExplorerLink } from '@pooltogether/react-components'
import { Transaction } from '@pooltogether/wallet-connection'
import { shorten } from '@pooltogether/utilities'

import { InfoListItem } from '.'

interface TxReceiptItemProps {
  depositTx: Transaction
  chainId: number
  labelClassName?: string
  valueClassName?: string
}

export const TxReceiptItem = (props: TxReceiptItemProps) => {
  const { depositTx, chainId, labelClassName, valueClassName } = props

  const { t } = useTranslation()

  return (
    <InfoListItem
      labelClassName={labelClassName}
      valueClassName={valueClassName}
      label={t('transactionReceipt', 'Transaction receipt')}
      value={
        <>
          {depositTx.response && (
            <BlockExplorerLink chainId={chainId} txHash={depositTx.response.hash}>
              <span className='underline'>{shorten({ hash: depositTx.response.hash })}</span>
            </BlockExplorerLink>
          )}
        </>
      }
    />
  )
}
