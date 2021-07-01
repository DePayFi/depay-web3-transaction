'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ethers = require('ethers');
var CONSTANTS = require('depay-blockchain-constants');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ethers__default = /*#__PURE__*/_interopDefaultLegacy(ethers);
var CONSTANTS__default = /*#__PURE__*/_interopDefaultLegacy(CONSTANTS);

function submitEthereum (transaction) {
  return new Promise((resolve, reject) => {
    let provider = new ethers__default['default'].providers.Web3Provider(window.ethereum);
    let contract = new ethers__default['default'].Contract(transaction.address, transaction.api, provider);
    let signer = provider.getSigner(0);
    let fragment = contract.interface.fragments.find((fragment) => {
      return fragment.name == transaction.method
    });

    let args = fragment.inputs.map((input) => {
      return transaction.params[input.name]
    });

    contract
      .connect(signer)
      [transaction.method](...args, { value: transaction.value })
      .then((sentTransaction) => {
        if (sentTransaction) {
          transaction.id = sentTransaction.hash;
          if (transaction.sent) transaction.sent(transaction);
          sentTransaction.wait(1).then(() => {
            transaction._confirmed = true;
            if (transaction.confirmed) transaction.confirmed(transaction);
          });
          sentTransaction.wait(12).then(() => {
            transaction._safe = true;
            if (transaction.safe) transaction.safe(transaction);
          });
          resolve(transaction);
        } else {
          reject('BlockchainTransaction: No transaction has been submitted!');
        }
      });
  })
}

class Transaction {
  constructor({ blockchain, address, api, method, params, value, sent, confirmed, safe }) {
    this.blockchain = blockchain;
    this.address = address;
    this.api = api;
    this.method = method;
    this.params = params;
    this.value = this.bigNumberify(value);
    this.sent = sent;
    this.confirmed = confirmed;
    this.safe = safe;
    this._confirmed = false;
    this._safe = false;
  }

  bigNumberify(value) {
    if (typeof value === 'number') {
      return ethers.ethers.BigNumber.from(value).mul(
        ethers.ethers.BigNumber.from(10).pow(ethers.ethers.BigNumber.from(CONSTANTS__default['default'][this.blockchain].DECIMALS)),
      )
    } else {
      return value
    }
  }

  confirmation() {
    if (this._confirmed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalConfirmed = this.confirmed;
      this.confirmed = () => {
        if (originalConfirmed) originalConfirmed(this);
        resolve(this);
      };
    })
  }

  safeConfirmation() {
    if (this._safe) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalSafe = this.safe;
      this.safe = () => {
        if (originalSafe) originalSafe(this);
        resolve(this);
      };
    })
  }

  submit() {
    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum(this)
      default:
        throw 'BlockchainTransaction: Unknown blockchain'
    }
  }
}

exports.Transaction = Transaction;
