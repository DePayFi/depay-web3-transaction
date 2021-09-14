import { Transaction } from 'dist/cjs/index.js'
import { mock, resetMocks, confirm, increaseBlock } from 'depay-web3-mock'

describe('submit BSC Transaction', () => {

  const blockchain = 'bsc'
  const accounts = ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']
  beforeEach(resetMocks)
  beforeEach(()=>mock({ blockchain, accounts: { return: accounts } }))

  let toAddress = '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92';

  describe('simple value transfer transaction', ()=>{

    it('simply transfers value', async ()=> {
      let transactionMock = mock({ 
        blockchain: 'bsc',
        transaction: {
          to: '0xae60ac8e69414c2dc362d0e6a03af643d1d85b92',
          value: '123000000000000000'
        }
      })

      let transaction = new Transaction({
        blockchain: 'bsc',
        to: toAddress,
        value: 0.123
      })

      await transaction.submit()
      expect(transactionMock).toHaveBeenCalled()
    })
  })

  describe('contract transaction', ()=>{

    let api = [{"inputs":[{"internalType":"address","name":"_configuration","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"configuration","outputs":[{"internalType":"contract DePayRouterV1Configuration","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"pluginAddress","type":"address"}],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"address[]","name":"plugins","type":"address[]"},{"internalType":"string[]","name":"data","type":"string[]"}],"name":"route","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
    let method = 'route';
    let params = {
      path: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'],
      amounts: ['7640757987460190', '10000000000000000000', '1623407305'],
      addresses: ['0x65aBbdEd9B937E38480A50eca85A8E4D2c8350E4'],
      plugins: ['0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019', '0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9'],
      data: []
    };
    
    it('rejects submit promise if something goes wrong', async ()=> {
      let mockedTransaction = mock({
        blockchain: 'bsc',
        transaction: {
          to: toAddress,
          api: api,
          method: method,
          params: params,
          return: Error('Some error happened')
        }
      })
      
      let transaction = new Transaction({
        blockchain: 'bsc',
        to: toAddress,
        api: api,
        method: method,
        params: params
      })

      let catchedError
      await transaction.submit().catch((error)=>{
        catchedError = true
      })

      expect(catchedError).toEqual(true)
    })

    it('resolves submit promise if transaction submits', async ()=> {
      let mockedTransaction = mock({
        blockchain: 'bsc',
        transaction: {
          to: toAddress,
          api: api,
          method: method,
          params: params
        }
      })
      
      let transaction = new Transaction({
        blockchain: 'bsc',
        to: toAddress,
        api: api,
        method: method,
        params: params
      })

      let sentTransaction
      await transaction.submit().then((transaction)=>{
        sentTransaction = transaction
      })

      expect(sentTransaction == undefined).toEqual(false)
    })

    it('populates basic information for the transaction after sent', async () => {
      let mockedTransaction = mock({
        blockchain: 'bsc',
        transaction: {
          to: toAddress,
          api: api,
          method: method,
          params: params
        }
      })
      
      let transaction = new Transaction({
        blockchain: 'bsc',
        to: toAddress,
        api: api,
        method: method,
        params: params
      })

      let sentTransaction
      await transaction.submit().then((transaction)=>{
        sentTransaction = transaction
      })

      expect(sentTransaction.id == undefined).toEqual(false)
      expect(sentTransaction.url).toEqual(`https://bscscan.com/tx/${sentTransaction.id}`)
    })
  })
})
