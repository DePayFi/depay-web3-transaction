import { ethers } from 'ethers'

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
  let contract = new ethers.Contract(transaction.address, transaction.api, provider)

  return contract
    .connect(signer)
    [transaction.method](...argsFromTransaction({ transaction, contract }), { value: transaction.value })
}

const submitSimpleTransfer = ({ transaction, signer })=>{
  return signer.sendTransaction({
    to: transaction.address,
    value: transaction.value
  })
}

const processSubmission = ({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject })=> {
  if (sentTransaction) {
    transaction.id = sentTransaction.hash
    if (transaction.sent) transaction.sent(transaction)
    if (sent) sent(transaction)
    sentTransaction.wait(1).then(() => {
      transaction._confirmed = true
      if (transaction.confirmed) transaction.confirmed(transaction)
      if (confirmed) confirmed(transaction)
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

export default function ({ transaction, provider, sent, confirmed, ensured }) {
  return new Promise((resolve, reject) => {
    let signer = provider.getSigner(0)

    if(transaction.method) {
      submitContractInteraction({ transaction, signer, provider })
        .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject }))
        .catch((error)=>{
          console.log(error)
          reject('Web3Transaction: Submitting transaction failed!')
        })
    } else {
      submitSimpleTransfer({ transaction, signer })
        .then((sentTransaction)=>processSubmission({ sentTransaction, transaction, sent, confirmed, ensured, resolve, reject }))
        .catch((error)=>{
          console.log(error)
          reject('Web3Transaction: Submitting transaction failed!')
        })
    }
  })
}
