'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ethers = require('ethers');
var depayWeb3Constants = require('depay-web3-constants');

const argsFromTransaction = ({ transaction, contract })=> {
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == transaction.method
  });

  if(transaction.params instanceof Array) {
    return transaction.params
  } else if (transaction.params instanceof Object) {
    return fragment.inputs.map((input) => {
      return transaction.params[input.name]
    })
  } else {
    throw 'Web3Transaction: params have wrong type!'
  }
};

const submitContractInteraction = ({ transaction, signer, provider })=>{
  let contract = new ethers.ethers.Contract(transaction.address, transaction.api, provider);

  return contract
    .connect(signer)
    [transaction.method](...argsFromTransaction({ transaction, contract }), { value: transaction.value })
};

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
    to: transaction.address,
    value: transaction.value
  })
};

const processSubmission = ({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject })=> {
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
      transaction._ensured = true;
      if (transaction.ensured) transaction.ensured(transaction);
      if (ensured) ensured(transaction);
    });
    resolve(transaction);
  } else {
    reject('Web3Transaction: Submitting transaction failed!');
  }
};

function submit ({ transaction, provider, sent, confirmed, ensured }) {
  return new Promise((resolve, reject) => {
    let signer = provider.getSigner(0);

    if(transaction.method) {
      submitContractInteraction({ transaction, signer, provider })
        .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject }))
        .catch((error)=>{
          console.log(error);
          reject('Web3Transaction: Submitting transaction failed!');
        });
    } else {
      submitSimpleTransfer({ transaction, signer })
        .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject }))
        .catch((error)=>{
          console.log(error);
          reject('Web3Transaction: Submitting transaction failed!');
        });
    }
  })
}

function submitEthereum ({ transaction, sent, confirmed, ensured }) {
  return submit({
    transaction,
    provider: new ethers.ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    ensured
  }).then((transaction)=>{
    transaction.url = `https://etherscan.com/tx/${transaction.id}`;
    return transaction
  })
}

function submitBsc ({ transaction, sent, confirmed, ensured }) {
  return submit({
    transaction,
    provider: new ethers.ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    ensured
  }).then((transaction)=>{
    transaction.url = `https://bscscan.com/tx/${transaction.id}`;
    return transaction
  })
}

class Transaction {
  constructor({ blockchain, address, api, method, params, value, sent, confirmed, ensured }) {
    this.blockchain = blockchain;
    this.address = address;
    this.api = api;
    this.method = method;
    this.params = params;
    this.value = this.bigNumberify(value);
    this.sent = sent;
    this.confirmed = confirmed;
    this.ensured = ensured;
    this._confirmed = false;
    this._ensured = false;
  }

  bigNumberify(value) {
    if (typeof value === 'number') {
      return ethers.ethers.utils.parseUnits(value.toString(), depayWeb3Constants.CONSTANTS[this.blockchain].DECIMALS)
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

  ensurance() {
    if (this._ensured) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalEnsured = this.ensured;
      this.ensured = () => {
        if (originalEnsured) originalEnsured(this);
        resolve(this);
      };
    })
  }

  submit(options) {
    let { sent, confirmed, ensured } = options ? options : {};

    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum({ transaction: this, sent, confirmed, ensured })
      case 'bsc':
        return submitBsc({ transaction: this, sent, confirmed, ensured })
      default:
        throw('Web3Transaction: Unknown blockchain')
    }
  }
}

exports.Transaction = Transaction;
