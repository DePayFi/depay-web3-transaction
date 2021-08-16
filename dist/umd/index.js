(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ethers'), require('depay-web3-constants')) :
  typeof define === 'function' && define.amd ? define(['exports', 'ethers', 'depay-web3-constants'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Web3Transaction = {}, global.ethers, global.Web3Constants));
}(this, (function (exports, ethers, depayWeb3Constants) { 'use strict';

  function submit ({ transaction, provider, sent, confirmed, safe }) {
    return new Promise((resolve, reject) => {
      let contract = new ethers.ethers.Contract(transaction.address, transaction.api, provider);
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
            if (sent) sent(transaction);
            sentTransaction.wait(1).then(() => {
              transaction._confirmed = true;
              if (transaction.confirmed) transaction.confirmed(transaction);
              if (confirmed) confirmed(transaction);
            });
            sentTransaction.wait(12).then(() => {
              transaction._safe = true;
              if (transaction.safe) transaction.safe(transaction);
              if (safe) safe(transaction);
            });
            resolve(transaction);
          } else {
            reject('Web3Transaction: Submitting transaction failed!');
          }
        });
    })
  }

  function submitEthereum ({ transaction, sent, confirmed, safe }) {
    return submit({
      transaction,
      provider: new ethers.ethers.providers.Web3Provider(window.ethereum),
      sent,
      confirmed,
      safe
    })
  }

  function submitBsc ({ transaction, sent, confirmed, safe }) {
    return submit({
      transaction,
      provider: new ethers.ethers.providers.Web3Provider(window.ethereum),
      sent,
      confirmed,
      safe
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
          ethers.ethers.BigNumber.from(10).pow(ethers.ethers.BigNumber.from(depayWeb3Constants.CONSTANTS[this.blockchain].DECIMALS)),
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

    submit(options) {
      let { sent, confirmed, safe } = options ? options : {};

      switch (this.blockchain) {
        case 'ethereum':
          return submitEthereum({ transaction: this, sent, confirmed, safe })
        case 'bsc':
          return submitBsc({ transaction: this, sent, confirmed, safe })
        default:
          throw 'Web3Transaction: Unknown blockchain'
      }
    }
  }

  exports.Transaction = Transaction;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
