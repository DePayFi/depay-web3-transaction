import { ethers } from 'ethers'
import submit from '../../vms/evm/submit'

export default function ({ transaction, sent, confirmed, ensured }) {
  return submit({
    transaction,
    provider: new ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    ensured
  }).then((transaction)=>{
    transaction.url = `https://bscscan.com/tx/${transaction.id}`
    return transaction
  })
}
