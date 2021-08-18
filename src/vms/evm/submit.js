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

export default function ({ transaction, provider, sent, confirmed, safe }) {
  return new Promise((resolve, reject) => {
    let contract = new ethers.Contract(transaction.address, transaction.api, provider)
    let signer = provider.getSigner(0)

    contract
      .connect(signer)
      [transaction.method](...argsFromTransaction({ transaction, contract }), { value: transaction.value })
      .then((sentTransaction) => {
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
            transaction._safe = true
            if (transaction.safe) transaction.safe(transaction)
            if (safe) safe(transaction)
          })
          resolve(transaction)
        } else {
          console.log('sentTransaction undefined')
          reject('Web3Transaction: Submitting transaction failed!')
        }
      }).catch((error)=>{
        console.log(error)
        reject('Web3Transaction: Submitting transaction failed!')
      })
  })
}
