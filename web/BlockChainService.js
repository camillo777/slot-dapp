const { ethers } = require("ethers");

const U = require('./Utils.js')

//const { performance } = require('perf_hooks');

class BlockChainService {
    constructor( contractAddress, abi, provider, privateKey, callbacksMap ) {
      this.contractAddress = contractAddress;
      this.abi = abi;
      this.provider = provider;
      this.signer = new ethers.Wallet( privateKey, provider );
      this.contract = new ethers.Contract( contractAddress, abi, provider );
      this.signedContract = new ethers.Contract( contractAddress, abi, this.signer );

      for ( const [key, value] of Object.entries(callbacksMap) ) {
        console.log(key, value);
        this.contract.on(key, value);
      }
/*
      this.signedContract.on('UserCreditAdded', 
        (userAddress, amount) => { console.log(`---EVT---> UserCreditAdded ${userAddress} ${ U.toEth( amount ) }`) });
      this.signedContract.on('UserCreditRemoved', 
        (userAddress, amount) => { console.log(`---EVT---> UserCreditRemoved ${userAddress} ${ U.toEth( amount ) }`) });
*/
    }

    printPerf( functionName, startTime, endTime ) {
        console.log(`Call to ${functionName} took ${endTime - startTime} msecs`);
    }

    // Getter
    async getTotalAmount() {
        console.log( 'getTotalAmount' );

        //var startTime = performance.now();
        var totalAmount = await this.contract.getTotalAmount();
        //var endTime = performance.now();
        //printPerf( 'getTotalAmount', startTime, endTime );

        return totalAmount;
    }

    async getJackpotAmount() {
        console.log( 'getJackpotAmount' );

        //const contract = new ethers.Contract( this.contractAddress, this.abi, this.provider );
        //var startTime = performance.now();
        var jackpotAmount = await this.contract.getJackpotAmount();
        //var endTime = performance.now();
        //printPerf( 'getJackpotAmount', startTime, endTime );

        return jackpotAmount;
    }

    async getUserAmount( userAddress ) {
      //const provider = new ethers.providers.JsonRpcProvider( process.env.NETWORK_URL );
      //console.log('connection', provider.connection );
      //console.log('CONTRACT_ADDRESS', process.env.CONTRACT_ADDRESS );
      //const contract = new ethers.Contract( process.env.CONTRACT_ADDRESS, contractArtifact.abi, provider );
      let amount = await this.contract.getUserAmount( publicAddress );
      return amount;
    }

    async getContractOwner() {
        console.log( 'getContractOwner' );

        //const contract = new ethers.Contract( this.contractAddress, this.abi, this.provider );
        //var startTime = performance.now();
        var contractOwner = await this.contract.getOwner();
        //var endTime = performance.now();
        //printPerf( 'getContractOwner', startTime, endTime );

        return contractOwner;
    }

    async transferMoney( toAddress, amount = 1.0 ) {
        console.log( 'transferMoney', toAddress, amount );

        //console.log('connection', this.provider.connection );
        console.log( 'Gas est', U.toEth( await this.signedContract.estimateGas.userAddCredit( toAddress, U.ether( amount ) ) ) );

        //var startTime = performance.now();
        console.time('transferMoney');
        await this.signedContract.userAddCredit( toAddress, U.ether( amount ) );
        console.timeEnd('transferMoney');
        //var endTime = performance.now();
        //printPerf( 'transferMoney', startTime, endTime );
    }

    async decreaseAccountFunds( toAddress, amount = 1.0 ) {
        console.log( 'decreaseAccountFunds', toAddress, amount );

        //console.log('connection', this.provider.connection );
        console.log( 'Gas est', U.toEth( await this.signedContract.estimateGas.userRemoveCredit( toAddress, U.ether( amount ) ) ) );
        
        //var startTime = performance.now();
        console.time('decreaseAccountFunds');
        await this.signedContract.userRemoveCredit( toAddress, U.ether( amount ) );
        console.timeEnd('decreaseAccountFunds');
        //var endTime = performance.now();
        //printPerf( 'decreaseAccountFunds', startTime, endTime );
      }

      async addJackpot( amount = 1.0 ) {
        console.log( 'addJackpot', amount );

        //console.log('connection', this.provider.connection );
        console.log( 'Gas est', U.toEth( await this.signedContract.estimateGas.jackpotAdd( U.ether( amount ) ) ) );
        
        //var startTime = performance.now();
        await this.signedContract.jackpotAdd( U.ether( amount ) );
        //var endTime = performance.now();
        //printPerf( 'addJackpot', startTime, endTime );
      }

      async winJackpot( toAddress ) {
        console.log( 'winJackpot', toAddress );

        //console.log('connection', this.provider.connection );
        console.log( 'Gas est', U.toEth( await this.signedContract.estimateGas.jackpotToUser( toAddress ) ) );
        
        //var startTime = performance.now();
        await this.signedContract.jackpotToUser( toAddress );
        //var endTime = performance.now();
        //printPerf( 'winJackpot', startTime, endTime );
      }

      async getAllUsers() {
        var users = [];
        let count = await this.contract.getUserCount();
        console.log( 'count', count );
        for(let i=0; i<count; i++) {
          let user = await this.contract.getUserAt( i );
          users.push( user );
        }
        return users;
      }
  }

  module.exports = BlockChainService;