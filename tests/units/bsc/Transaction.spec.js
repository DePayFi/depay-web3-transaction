import { Transaction } from 'dist/cjs/index.js'
import { mock, resetMocks, confirm, increaseBlock } from 'depay-web3-mock'

describe('BSC Transaction', () => {

  let address = '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92';
  let api = [{"inputs":[{"internalType":"address","name":"_configuration","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"configuration","outputs":[{"internalType":"contract DePayRouterV1Configuration","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"pluginAddress","type":"address"}],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"address[]","name":"plugins","type":"address[]"},{"internalType":"string[]","name":"data","type":"string[]"}],"name":"route","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
  let method = 'route';
  let params = {
    path: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'],
    amounts: ['7640757987460190', '10000000000000000000', '1623407305'],
    addresses: ['0x65aBbdEd9B937E38480A50eca85A8E4D2c8350E4'],
    plugins: ['0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019', '0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9'],
    data: []
  };
  
  let transaction;
  let mockedTransaction;

  beforeEach(()=>{
    resetMocks()

    mockedTransaction = mock({
      blockchain: 'bsc',
      transaction: {
        to: '0xae60ac8e69414c2dc362d0e6a03af643d1d85b92',
        api: api,
        method: method,
        params: params
      }
    })
    
    transaction = new Transaction({
      blockchain: 'bsc',
      address: address,
      api: api,
      method: method,
      params: params
    });
  })

  afterEach(resetMocks);
  
  it('initalizes a transaction that can be submitted later', async ()=> {
    expect(typeof(transaction)).toBe('object');
    expect(transaction.blockchain).toEqual('bsc');
    expect(transaction.address).toEqual(address);
    expect(transaction.api).toEqual(api);
    expect(transaction.method).toEqual('route');
    expect(transaction.params).toEqual(params);
    expect(typeof(transaction.submit)).toEqual('function');
  });

  it('allows to submit the transaction', async ()=> {
    let submittedTransaction = await transaction.submit()
    expect(submittedTransaction).toEqual(transaction);
  });

  it("calls the transaction's sent callback", async ()=> {
    let sentCalled = false;

    transaction.sent = function(){
      sentCalled = true
    }

    expect(sentCalled).toEqual(false);

    let submittedTransaction = await transaction.submit()

    expect(sentCalled).toEqual(true);
  });

  it("calls the transaction's sent callback also when passed to submit", async ()=> {
    let sentCalled = false;

    expect(sentCalled).toEqual(false);

    let submittedTransaction = await transaction.submit({
      sent: function(){ sentCalled = true }
    })

    expect(sentCalled).toEqual(true);
  });

  it("calls the transaction's confirmed callback", async ()=> {
    let confirmedCalled = false;

    transaction.confirmed = function(){
      confirmedCalled = true
    }

    let submittedTransaction = await transaction.submit()

    expect(confirmedCalled).toEqual(false);

    confirm(mockedTransaction)

    await transaction.confirmation()

    expect(confirmedCalled).toEqual(true);
  });

  it("calls the transaction's confirmed callback also when passed to submit", async ()=> {
    let confirmedCalled = false;

    let submittedTransaction = await transaction.submit({
      confirmed: function(){ confirmedCalled = true }
    })

    expect(confirmedCalled).toEqual(false);

    confirm(mockedTransaction)

    await transaction.confirmation()

    expect(confirmedCalled).toEqual(true);
  });

  it("calls the transaction's safe callback", async ()=> {
    let safeCalled = false;

    transaction.safe = function(){
      safeCalled = true
    }

    let submittedTransaction = await transaction.submit()

    expect(safeCalled).toEqual(false);

    confirm(mockedTransaction)

    await transaction.confirmation()

    expect(safeCalled).toEqual(false);

    increaseBlock(12)
    
    await transaction.safeConfirmation()
    
    expect(safeCalled).toEqual(true);
  });

  it("calls the transaction's safe callback also when passed as option to submit", async ()=> {
    let safeCalled = false;

    let submittedTransaction = await transaction.submit({
      safe: function(){ safeCalled = true }
    })

    expect(safeCalled).toEqual(false);

    confirm(mockedTransaction)

    await transaction.confirmation()

    expect(safeCalled).toEqual(false);

    increaseBlock(12)
    
    await transaction.safeConfirmation()
    
    expect(safeCalled).toEqual(true);
  });
});
