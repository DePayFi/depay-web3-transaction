import { ethers } from 'ethers'

export default function ({ transaction, provider, sent, confirmed, safe }) {
  return new Promise((resolve, reject) => {
    let contract = new ethers.Contract(transaction.address, transaction.api, provider)
    let signer = provider.getSigner(0)
    let fragment = contract.interface.fragments.find((fragment) => {
      return fragment.name == transaction.method
    })

    let args = fragment.inputs.map((input) => {
      return transaction.params[input.name]
    })

    contract
      .connect(signer)
      [transaction.method](...args, { value: transaction.value })
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
          reject('Web3Transaction: Submitting transaction failed!')
        }
      }).catch((error)=>{ 
        reject('Web3Transaction: Submitting transaction failed!', error)
      })
  })
}
