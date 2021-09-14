import { ethers } from 'ethers';
import { getWallet } from 'depay-web3-wallets';
import { CONSTANTS } from 'depay-web3-constants';

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
  let contract = new ethers.Contract(transaction.to, transaction.api, provider);
  return contract
    .connect(signer)
    [transaction.method](...argsFromTransaction({ transaction, contract }), { value: transaction.value })
};

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
    to: transaction.to,
    value: transaction.value
  })
};

const processSubmission = ({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject })=> {
  if (sentTransaction) {
    transaction.id = sentTransaction.hash;
    if (transaction.sent) transaction.sent(transaction);
    if (sent) sent(transaction);
    sentTransaction.wait(1).then(() => {
      transaction._confirmed = true;
      if (transaction.confirmed) transaction.confirmed(transaction);
      if (confirmed) confirmed(transaction);
    }).catch((error)=>{
      transaction._failed = true;
      if(transaction.failed) transaction.failed(transaction);
      if(failed) failed(transaction);
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

const executeSubmit = ({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject }) => {
  if(transaction.method) {
    submitContractInteraction({ transaction, signer, provider })
      .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject }))
      .catch((error)=>{
        console.log(error);
        reject('Web3Transaction: Submitting transaction failed!');
      });
  } else {
    submitSimpleTransfer({ transaction, signer })
      .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject }))
      .catch((error)=>{
        console.log(error);
        reject('Web3Transaction: Submitting transaction failed!');
      });
  }
};

function submit ({ transaction, provider, sent, confirmed, ensured, failed }) {
  return new Promise(async (resolve, reject) => {
    let signer = provider.getSigner(0);
    let wallet = await getWallet();
    transaction.from = await signer.getAddress();
    if(await wallet.connectedTo(transaction.blockchain)) {
      executeSubmit({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject });
    } else { // connected to wrong network
      wallet.switchTo(transaction.blockchain)
        .then(()=>executeSubmit({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject }))
        .catch(reject);
    }
  })
}

function submitEthereum ({ transaction, sent, confirmed, ensured, failed }) {
  return submit({
    transaction,
    provider: new ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    ensured,
    failed
  }).then((transaction)=>{
    transaction.url = `https://etherscan.com/tx/${transaction.id}`;
    return transaction
  })
}

function submitBsc ({ transaction, sent, confirmed, ensured, failed }) {
  return submit({
    transaction,
    provider: new ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    ensured,
    failed
  }).then((transaction)=>{
    transaction.url = `https://bscscan.com/tx/${transaction.id}`;
    return transaction
  })
}

class Transaction {
  constructor({ blockchain, from, to, api, method, params, value, sent, confirmed, ensured, failed }) {
    this.blockchain = blockchain;
    this.from = from;
    this.to = to;
    this.api = api;
    this.method = method;
    this.params = params;
    this.value = this.bigNumberify(value);
    this.sent = sent;
    this.confirmed = confirmed;
    this.ensured = ensured;
    this.failed = ensured;
    this._confirmed = false;
    this._ensured = false;
    this._failed = false;
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

  failure() {
    if (this._failed) {
      return Promise.resolve(this)
    }
    return new Promise((resolve, reject) => {
      let originalFailed = this.failed;
      this.failed = () => {
        if (originalFailed) originalFailed(this);
        resolve(this);
      };
    })
  }

  submit(options) {
    let { sent, confirmed, ensured, failed } = options ? options : {};

    switch (this.blockchain) {
      case 'ethereum':
        return submitEthereum({ transaction: this, sent, confirmed, ensured, failed })
      case 'bsc':
        return submitBsc({ transaction: this, sent, confirmed, ensured, failed })
      default:
        throw('Web3Transaction: Unknown blockchain')
    }
  }
}

export { Transaction };
