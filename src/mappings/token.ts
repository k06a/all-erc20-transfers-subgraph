import { BigInt, Bytes, Address, EthereumEvent } from '@graphprotocol/graph-ts'

import { Transfer } from '../../generated/StandardToken/ERC20'
import { Account, TokenTransfer } from '../../generated/schema'

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000'

function getOrCreateAccount(wallet: Address, token: Address): Account {
  let id = wallet.toHex() + '-' + token.toHex()
  let account = Account.load(id)
  if (account == null) {
    account = new Account(id)
    account.account = wallet
    account.token = token
    account.balance = new BigInt(0)
  }
  return account as Account
}

export function handleTransfer(event: Transfer): void {
  let fromAccount = getOrCreateAccount(event.params.from, event.address)
  let toAccount = getOrCreateAccount(event.params.to, event.address)

  if (event.params.value.gt(new BigInt(0))) {
    // Create event
    let tokenTransfer = new TokenTransfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
    tokenTransfer.token = event.address
    tokenTransfer.sender = event.params.from
    tokenTransfer.receiver = event.params.to
    tokenTransfer.amount = event.params.value
    tokenTransfer.block = event.block.number
    tokenTransfer.timestamp = event.block.timestamp
    tokenTransfer.transaction = event.transaction.hash
    tokenTransfer.save()

    // Update from account
    if (fromAccount.balance.gt(event.params.value)) {
      fromAccount.balance = fromAccount.balance.minus(event.params.value)
    } else {
      fromAccount.balance = new BigInt(0)
    }
    fromAccount.block = event.block.number
    fromAccount.timestamp = event.block.timestamp
    fromAccount.save()

    // Update to account
    toAccount.balance = toAccount.balance.plus(event.params.value)
    toAccount.block = event.block.number
    toAccount.timestamp = event.block.timestamp
    toAccount.save()
  }
}
