import { config } from 'dotenv';
config();

import fs from 'fs';

import { ethers } from "ethers";
//import { abi } from "./contracts/MyUsers.json";

var artifact = JSON.parse( fs.readFileSync('./contract/MyUsers.json') );

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; //'0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // LOCALHOST
//const CONTRACT_ADDRESS = '0xFdEdee0c79B672Cee6B0eab2CD575Fbc6FCb09fC'; // CRONOS
//const CONTRACT_ADDRESS = '0xacf3f9d7114668bEDa909Cdc1C66375c2d5c926C'; // CRONOS new not working
//const CONTRACT_ADDRESS = '0x1A662b5B2F74A27Af91E7863ac0079b899435159'; // CRONOS new 2 

async function withdraw() {

  try {

    console.log('CONTRACT_ADDRESS', CONTRACT_ADDRESS );

    const provider = new ethers.providers.JsonRpcProvider( process.env.NETWORK_URL );
    console.log('connection', provider.connection );
    const balance = await provider.getBalance( CONTRACT_ADDRESS );

    //const contract = new ethers.Contract( CONTRACT_ADDRESS, artifact.abi, provider );
    //const balance = await contract.balance;
    console.log( 'balance', balance );

    const withdrawAmount = balance.div( 2 );

    //console.log('connection', provider.connection );
    const signer = new ethers.Wallet( process.env.OWNER_PRIVATE_KEY, provider );
    //const signer = new ethers.Wallet( KEY, provider );
    const signedContract = new ethers.Contract( CONTRACT_ADDRESS, artifact.abi, signer );

    console.log( 'withdraw' );
    const tx = await signedContract.withdraw( withdrawAmount );
    await tx.wait();

    //const newbalance = await contract.balance;
    const newbalance = await provider.getBalance( CONTRACT_ADDRESS );
    console.log( newbalance );

  }
  catch(e) {
    console.log( e );
  }
}

async function main() {
  try {
    await withdraw();
  }
  catch(e) {
    console.log( e );
  }
}

main();