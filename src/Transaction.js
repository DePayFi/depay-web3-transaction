import submitEthereum from './blockchains/ethereum/submit'
import submitBsc from './blockchains/bsc/submit'
import { ethers } from 'ethers'
import { CONSTANTS } from 'depay-web3-constants'

class Transaction {
  constructor({ blockchain, from, to, api, method, params, value, sent, confirmed, ensured, failed }) {
    this.blockchain = blockchain
    this.from = from
    this.to = to
    this.api = api
    this.method = method
    this.params = params
    this.value = this.bigNumberify(value)
    this.sent = sent
    this.confirmed = confirmed
    this.ensured = ensured
    this.failed = ensured
    this._confirmed = false
    this._ensured = false
    this._failed = false
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

  ensurance() {
    if (this._ensured) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalEnsured = this.ensured
      this.ensured = () => {
        if (originalEnsured) originalEnsured(this)
        resolve(this)
      }
    })
  }

  failure() {
    if (this._failed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalFailed = this.failed
      this.failed = () => {
        if (originalFailed) originalFailed(this)
        resolve(this)
      }
    })
  }

  submit(options) {
    let { sent, confirmed, ensured, failed } = options ? options : {}

    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum({ transaction: this, sent, confirmed, ensured, failed })
        break
      case 'bsc':
        return submitBsc({ transaction: this, sent, confirmed, ensured, failed })
        break
      default:
        throw('Web3Transaction: Unknown blockchain')
    }
  }
}

export default Transaction
