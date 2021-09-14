import { ethers } from 'ethers'
import { getWallet } from 'depay-web3-wallets'

const argsFromTransaction = ({ transaction, contract })=> {
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == transaction.method
  })

  if(transaction.params instanceof Array) {
    return transaction.params
  } else if (transaction.params instanceof Object) {
    return fragment.inputs.map((input) => {
      return transaction.params[input.name]
    })
  } else {
    throw 'Web3Transaction: params have wrong type!'
  }
}

const submitContractInteraction = ({ transaction, signer, provider })=>{
  let contract = new ethers.Contract(transaction.to, transaction.api, provider)
  return contract
    .connect(signer)
    [transaction.method](...argsFromTransaction({ transaction, contract }), { value: transaction.value })
}

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
    to: transaction.to,
    value: transaction.value
  })
}

const processSubmission = ({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject })=> {
  if (sentTransaction) {
    transaction.id = sentTransaction.hash
    if (transaction.sent) transaction.sent(transaction)
    if (sent) sent(transaction)
    sentTransaction.wait(1).then(() => {
      transaction._confirmed = true
      if (transaction.confirmed) transaction.confirmed(transaction)
      if (confirmed) confirmed(transaction)
    }).catch((error)=>{
      transaction._failed = true
      if(transaction.failed) transaction.failed(transaction)
      if(failed) failed(transaction)
    })
    sentTransaction.wait(12).then(() => {
      transaction._ensured = true
      if (transaction.ensured) transaction.ensured(transaction)
      if (ensured) ensured(transaction)
    })
    resolve(transaction)
  } else {
    reject('Web3Transaction: Submitting transaction failed!')
  }
}

const executeSubmit = ({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject }) => {
  if(transaction.method) {
    submitContractInteraction({ transaction, signer, provider })
      .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject }))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  } else {
    submitSimpleTransfer({ transaction, signer })
      .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, failed, resolve, reject }))
      .catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  }
}

export default function ({ transaction, provider, sent, confirmed, ensured, failed }) {
  return new Promise(async (resolve, reject) => {
    let signer = provider.getSigner(0)
    let wallet = await getWallet()
    transaction.from = await signer.getAddress()
    if(await wallet.connectedTo(transaction.blockchain)) {
      executeSubmit({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject })
    } else { // connected to wrong network
      wallet.switchTo(transaction.blockchain)
        .then(()=>executeSubmit({ transaction, provider, sent, confirmed, ensured, failed, signer, resolve, reject }))
        .catch(reject)
    }
  })
}
