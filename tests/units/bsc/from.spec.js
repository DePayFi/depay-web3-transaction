import { Transaction } from 'dist/cjs/index.js'
import { mock, resetMocks, confirm, increaseBlock } from 'depay-web3-mock'

describe('from (address) for BSC Transaction', () => {

  const blockchain = 'bsc'
  const accounts = ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']
  beforeEach(resetMocks)
  beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))
  
  let toAddress = '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92';

  describe('sets the from address latest if transaction was sent', ()=>{

    it('simply transfers value', async ()=> {
      let transactionMock = mock({ 
        blockchain,
        transaction: {
          to: '0xae60ac8e69414c2dc362d0e6a03af643d1d85b92',
          value: '123000000000000000'
        }
      })

      let transaction = new Transaction({
        blockchain,
        to: toAddress,
        value: 0.123
      })

      await transaction.submit()

      expect(transaction.from).toEqual(accounts[0])
      expect(transactionMock).toHaveBeenCalled()
    })
  })

  it('sets the from address latest if transaction was sent also for contract interactions', async ()=> {
    let api = [{"inputs":[{"internalType":"address","name":"_configuration","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"configuration","outputs":[{"internalType":"contract DePayRouterV1Configuration","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"pluginAddress","type":"address"}],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"address[]","name":"plugins","type":"address[]"},{"internalType":"string[]","name":"data","type":"string[]"}],"name":"route","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
    let method = 'route';
    let params = {
      path: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'],
      amounts: ['7640757987460190', '10000000000000000000', '1623407305'],
      addresses: ['0x65aBbdEd9B937E38480A50eca85A8E4D2c8350E4'],
      plugins: ['0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019', '0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9'],
      data: []
    };

    let transactionMock = mock({
      blockchain,
      transaction: {
        from: accounts[0],
        to: toAddress,
        api: api,
        method: method,
        params: params,
        return: true
      }
    })

    let transaction = new Transaction({
      blockchain,
      to: toAddress,
      api: api,
      method: method,
      params: params
    })

    await transaction.submit()

    expect(transaction.from).toEqual(accounts[0])
    expect(transactionMock).toHaveBeenCalled()
  })

  it('also allows to set from address upon transaction initialization', async ()=> {
    let transaction = new Transaction({
      blockchain,
      from: accounts[0],
      to: toAddress
    })
    expect(transaction.from).toEqual(accounts[0])
  })
})
