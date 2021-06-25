import submitEthereum from './ethereum/submit'

class Transaction {
  constructor({ blockchain, address, api, method, params, sent, confirmed, safe }) {
    this.blockchain = blockchain
    this.address = address
    this.api = api
    this.method = method
    this.params = params
    this.sent = sent
    this.confirmed = confirmed
    this.safe = safe
    this._confirmed = false
    this._safe = false
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

  submit() {
    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum(this)
        break
      default:
        throw 'BlockchainTransaction: Unknown blockchain'
    }
  }
}

export default Transaction
