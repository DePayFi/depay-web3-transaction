import { ethers } from 'ethers'
import submit from '../../vms/evm/submit'

export default function (transaction) {
  return submit({ transaction, provider: new ethers.providers.Web3Provider(window.ethereum) })
}
