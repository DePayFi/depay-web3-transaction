import submitEthereum from './blockchains/ethereum/submit'
import submitBsc from './blockchains/bsc/submit'
import { ethers } from 'ethers'
import { CONSTANTS } from 'depay-web3-constants'

class Transaction {
  constructor({ blockchain, address, api, method, params, value, sent, confirmed, safe }) {
    this.blockchain = blockchain
    this.address = address
    this.api = api
    this.method = method
    this.params = params
    this.value = this.bigNumberify(value)
    this.sent = sent
    this.confirmed = confirmed
    this.safe = safe
    this._confirmed = false
    this._safe = false
  }

  bigNumberify(value) {
    if (typeof value === 'number') {
      return ethers.utils.parseUnits(value.toString(), CONSTANTS[this.blockchain].DECIMALS)
    } else {
      return value
    }
  }

  confirmation() {
    if (this._confirmed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalConfirmed = this.confirmed
      this.confirmed = () => {
        if (originalConfirmed) originalConfirmed(this)
        resolve(this)
      }
    })
  }

  safeConfirmation() {
    if (this._safe) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalSafe = this.safe
      this.safe = () => {
        if (originalSafe) originalSafe(this)
        resolve(this)
      }
    })
  }

  submit(options) {
    let { sent, confirmed, safe } = options ? options : {}

    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum({ transaction: this, sent, confirmed, safe })
        break
      case 'bsc':
        return submitBsc({ transaction: this, sent, confirmed, safe })
        break
      default:
        throw('Web3Transaction: Unknown blockchain')
    }
  }
}

export default Transaction
