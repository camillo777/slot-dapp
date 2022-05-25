const dotenv = require('dotenv');
dotenv.config();

const { ethers } = require("ethers");
const contractArtifact = require("./artifacts/Greeter.json");

//const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // LOCALHOST
//const CONTRACT_ADDRESS = '0xFdEdee0c79B672Cee6B0eab2CD575Fbc6FCb09fC'; // CRONOS
//const CONTRACT_ADDRESS = '0xacf3f9d7114668bEDa909Cdc1C66375c2d5c926C'; // CRONOS new not working
const CONTRACT_ADDRESS = '0x1A662b5B2F74A27Af91E7863ac0079b899435159'; // CRONOS new 2 

async function test() {

  try {

    console.log('CONTRACT_ADDRESS', CONTRACT_ADDRESS );

    const provider = new ethers.providers.JsonRpcProvider( process.env.NETWORK_URL );
    console.log('connection', provider.connection );
    const contract = new ethers.Contract( CONTRACT_ADDRESS, contractArtifact.abi, provider );
    console.log( await contract.greet() );

    //console.log('connection', provider.connection );
    const signer = new ethers.Wallet( process.env.OWNER_PRIVATE_KEY, provider );
    //const signer = new ethers.Wallet( KEY, provider );
    const signedContract = new ethers.Contract( CONTRACT_ADDRESS, contractArtifact.abi, signer );

    var newText = 'Camillo' + Date.now();
    console.log( 'Settings greting to: ' + newText );
    const tx = await signedContract.setGreeting( newText );
    await tx.wait();

    console.log( await contract.greet() );

  }
  catch(e) {
    console.log( e );
  }
}

async function main() {
  try {
    await test();
  }
  catch(e) {
    console.log( e );
  }
}

main();