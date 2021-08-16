import { ethers } from 'ethers'
import submit from '../../vms/evm/submit'

export default function ({ transaction, sent, confirmed, safe }) {
  return submit({
    transaction,
    provider: new ethers.providers.Web3Provider(window.ethereum),
    sent,
    confirmed,
    safe
  })
}